import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IssuesMap } from '@/components/IssuesMap';
import { StatusBadge, UrgencyBadge, PriorityBadge, EscalationBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { getEscalationInfo } from '@/lib/automation';
import { Report, Status, Team, Category, categoryIcons, InternalNote, TeamEntity } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  List,
  Map,
  BarChart3,
  Settings,
  Filter,
  Download,
  Users,
  MapPin,
  Calendar,
  ChevronDown,
  X,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ViewMode = 'list' | 'map' | 'analytics';

export default function AdminPage() {
  const { t, language } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [teams, setTeams] = useState<TeamEntity[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    urgency: 'all',
    category: 'all',
    search: '',
    panchayat: '',
  });
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, loading, navigate]);

  const loadData = async () => {
    try {
      const [reportsData, teamsData] = await Promise.all([
        api.getAllIssues(),
        api.getTeams()
      ]);
      setReports(reportsData);
      setTeams(teamsData);

      // Feature 2: Run escalation check on dashboard load (client-side fallback)
      try {
        await api.runEscalationCheck();
      } catch {
        console.warn('[Automation] Escalation check failed — non-critical');
      }
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const filteredReports = reports.filter(report => {
    if (filters.status !== 'all' && report.status !== filters.status) return false;
    if (filters.urgency !== 'all' && report.urgency !== filters.urgency) return false;
    if (filters.category !== 'all' && report.category !== filters.category) return false;
    if (filters.panchayat && !report.panchayat.toLowerCase().includes(filters.panchayat.toLowerCase())) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        report.title.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower) ||
        report.trackingId.toLowerCase().includes(searchLower) ||
        report.panchayat.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'submitted' || r.status === 'received' || r.status === 'notTaken').length,
    inProgress: reports.filter(r => r.status === 'assigned' || r.status === 'inProgress' || r.status === 'underReview').length,
    resolved: reports.filter(r => r.status === 'resolved' || r.status === 'closed' || r.status === 'completed').length,
    urgent: reports.filter(r => r.urgency === 'urgent' && r.status !== 'resolved' && r.status !== 'closed' && r.status !== 'completed').length,
    escalated: reports.filter(r => r.isDelayed || r.isCritical).length,
  };

  const handleStatusUpdate = async (id: string, status: Status) => {
    const report = reports.find(r => r.id === id);
    if (!report) return;

    const newHistory = [...report.history, {
      status,
      timestamp: new Date().toISOString(),
      note: 'Status updated by Admin',
      actor: 'Admin'
    }];

    try {
      await api.updateIssue(id, { status, history: newHistory });

      // Feature 5: Calculate resolution time when marking as resolved/completed
      if (status === 'resolved' || status === 'completed') {
        try {
          await api.calculateResolutionTime(id);
        } catch {
          console.warn('[Automation] Resolution time calculation failed');
        }
      }

      await loadData();
      setSelectedReport({ ...report, status, history: newHistory });
      toast.success(language === 'en' ? 'Status updated' : 'സ്റ്റാറ്റസ് അപ്ഡേറ്റ് ചെയ്തു');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Feature 1: Auto transition notTaken → underReview when admin opens a complaint
  const handleSelectReport = async (report: Report) => {
    setSelectedReport(report);
    if (report.status === 'notTaken') {
      try {
        await api.markUnderReview(report.id);
        const updatedReport = { ...report, status: 'underReview' as Status };
        setSelectedReport(updatedReport);
        setReports(prev => prev.map(r => r.id === report.id ? updatedReport : r));
      } catch {
        console.warn('[Automation] Auto underReview transition failed');
      }
    }
  };

  const handleAssignTeam = async (teamId: string) => {
    if (!selectedReport) return;

    // Find team name for history note
    const teamName = teams.find(t => t.id === teamId)?.name || 'Unknown Team';

    // Optimistic update
    const newHistory = [...selectedReport.history, {
      status: 'assigned' as Status,
      timestamp: new Date().toISOString(),
      note: `Assigned to ${teamName}`,
      actor: 'Admin'
    }];

    try {
      await api.assignTeam(selectedReport.id, teamId);
      // We should also update history here if assignTeam doesn't handle it, 
      // but api.assignTeam only updates assigned_team_id/status. 
      // Let's manually add history via updateIssue or assume assignTeam handles basic status.
      // Better to use updateIssue for history consistency.
      await api.updateIssue(selectedReport.id, { history: newHistory });

      const updatedReport = {
        ...selectedReport,
        assignedTeamId: teamId,
        status: 'assigned' as Status,
        history: newHistory
      };

      setSelectedReport(updatedReport);
      setReports(reports.map(r => r.id === selectedReport.id ? updatedReport : r));

      toast.success('Team assigned successfully');
    } catch (error) {
      toast.error('Failed to assign team');
    }
  };

  const handleAddNote = async () => {
    if (!selectedReport || !newNote.trim()) return;

    try {
      const note: InternalNote = {
        id: uuidv4(),
        text: newNote,
        sender: user?.email || 'Admin',
        timestamp: new Date().toISOString(),
      };

      const updatedNotes = [...(selectedReport.internalNotes || []), note];

      await api.updateIssue(selectedReport.id, {
        internalNotes: updatedNotes,
      });

      setSelectedReport({ ...selectedReport, internalNotes: updatedNotes });

      // Update local list as well
      setReports(reports.map(r =>
        r.id === selectedReport.id
          ? { ...r, internalNotes: updatedNotes }
          : r
      ));

      setNewNote('');
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const exportCSV = () => {
    const headers = ['Tracking ID', 'Title', 'Category', 'Status', 'Urgency', 'Panchayat', 'Created At'];
    const rows = filteredReports.map(r => [
      r.trackingId,
      r.title,
      r.category,
      r.status,
      r.urgency,
      r.panchayat,
      new Date(r.createdAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(language === 'en' ? 'CSV exported' : 'CSV എക്സ്പോർട്ട് ചെയ്തു');
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(language === 'ml' ? 'ml-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className={cn(
                "text-2xl font-bold text-foreground",
                language === 'ml' && "font-malayalam"
              )}>
                {t.dashboard}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {language === 'en' ? 'Manage and track all reported issues' : 'റിപ്പോർട്ട് ചെയ്ത എല്ലാ പ്രശ്നങ്ങളും നിയന്ത്രിക്കുകയും ട്രാക്ക് ചെയ്യുകയും ചെയ്യുക'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-secondary rounded-lg p-1">
                {[
                  { mode: 'list' as ViewMode, icon: List, label: 'List' },
                  { mode: 'map' as ViewMode, icon: Map, label: 'Map' },
                  { mode: 'analytics' as ViewMode, icon: BarChart3, label: 'Analytics' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === mode
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: t.totalComplaints, value: stats.total, icon: LayoutDashboard, color: 'text-info' },
              { label: t.pending, value: stats.pending, icon: Clock, color: 'text-warning' },
              { label: t.inProgressCount, value: stats.inProgress, icon: TrendingUp, color: 'text-accent' },
              { label: t.resolvedCount, value: stats.resolved, icon: CheckCircle, color: 'text-success' },
              { label: language === 'en' ? 'Urgent' : 'അടിയന്തരം', value: stats.urgent, icon: AlertTriangle, color: 'text-urgent' },
            ].map((stat) => (
              <div key={stat.label} className="card-elevated p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg bg-secondary flex items-center justify-center", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className={cn(
                      "text-xs text-muted-foreground",
                      language === 'ml' && "font-malayalam"
                    )}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="card-elevated p-4">
                <div className="flex items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    <span className={language === 'ml' ? 'font-malayalam' : ''}>{t.filterBy}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className={language === 'ml' ? 'font-malayalam' : ''}>{t.exportCsv}</span>
                  </Button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border animate-slide-up">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value as Status | '' })}
                      className="input-field text-sm"
                    >
                      <option value="">{language === 'en' ? 'All Status' : 'എല്ലാ സ്റ്റാറ്റസും'}</option>
                      {(['submitted', 'received', 'assigned', 'inProgress', 'resolved', 'closed'] as Status[]).map((s) => (
                        <option key={s} value={s}>{t.status[s]}</option>
                      ))}
                    </select>

                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value as Category | '' })}
                      className="input-field text-sm"
                    >
                      <option value="">{language === 'en' ? 'All Categories' : 'എല്ലാ വിഭാഗങ്ങളും'}</option>
                      {Object.keys(t.categories).map((c) => (
                        <option key={c} value={c}>{t.categories[c as keyof typeof t.categories]}</option>
                      ))}
                    </select>

                    <select
                      value={filters.urgency}
                      onChange={(e) => setFilters({ ...filters, urgency: e.target.value as 'normal' | 'high' | 'urgent' | '' })}
                      className="input-field text-sm"
                    >
                      <option value="">{language === 'en' ? 'All Urgency' : 'എല്ലാ അടിയന്തരാവസ്ഥയും'}</option>
                      <option value="normal">{t.normal}</option>
                      <option value="high">{t.high}</option>
                      <option value="urgent">{t.urgent}</option>
                    </select>

                    <input
                      type="text"
                      value={filters.panchayat}
                      onChange={(e) => setFilters({ ...filters, panchayat: e.target.value })}
                      placeholder={language === 'en' ? 'Search Panchayat...' : 'പഞ്ചായത്ത് തിരയുക...'}
                      className="input-field text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Reports Table */}
              <div className="card-elevated overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Issue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t.priorityLevel || 'Priority'}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => {
                        const escalation = getEscalationInfo(report);
                        return (
                          <tr
                            key={report.id}
                            onClick={() => handleSelectReport(report)}
                            className={cn(
                              "border-b border-border hover:bg-muted/30 cursor-pointer transition-colors",
                              escalation.isCritical && "bg-red-50/50 dark:bg-red-900/10",
                              escalation.isDelayed && !escalation.isCritical && "bg-amber-50/50 dark:bg-amber-900/10"
                            )}
                          >
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono text-muted-foreground">{report.trackingId}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{categoryIcons[report.category]}</span>
                                <span className="font-medium text-foreground line-clamp-1 max-w-48">{report.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={report.status} size="sm" />
                              {(report.isDelayed || report.isCritical) && (
                                <EscalationBadge
                                  isDelayed={report.isDelayed}
                                  isCritical={report.isCritical}
                                  size="sm"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <PriorityBadge level={report.priorityLevel} score={report.priorityScore} size="sm" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="line-clamp-1 max-w-32">{report.panchayat}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(report.createdAt)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredReports.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    {language === 'en' ? 'No complaints found' : 'പരാതികളൊന്നും കണ്ടെത്തിയില്ല'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="card-elevated p-4">
              <IssuesMap reports={filteredReports} className="h-[600px] rounded-lg" />
            </div>
          )}

          {/* Analytics View */}
          {viewMode === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <div className="card-elevated p-6">
                <h3 className={cn(
                  "font-semibold text-foreground mb-4",
                  language === 'ml' && "font-malayalam"
                )}>
                  {language === 'en' ? 'Complaints by Category' : 'വിഭാഗം അനുസരിച്ച് പരാതികൾ'}
                </h3>
              </div>

              {/* Status Distribution */}
              <div className="card-elevated p-6">
                <h3 className={cn(
                  "font-semibold text-foreground mb-4",
                  language === 'ml' && "font-malayalam"
                )}>
                  {language === 'en' ? 'Resolution Overview' : 'പരിഹാര അവലോകനം'}
                </h3>
                <div className="flex items-center justify-center py-8">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Pending */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--warning))"
                        strokeWidth="20"
                        strokeDasharray={`${(stats.pending / stats.total) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                      {/* In Progress */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--accent))"
                        strokeWidth="20"
                        strokeDasharray={`${(stats.inProgress / stats.total) * 251.2} 251.2`}
                        strokeDashoffset={`-${(stats.pending / stats.total) * 251.2}`}
                        strokeLinecap="round"
                      />
                      {/* Resolved */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--success))"
                        strokeWidth="20"
                        strokeDasharray={`${(stats.resolved / stats.total) * 251.2} 251.2`}
                        strokeDashoffset={`-${((stats.pending + stats.inProgress) / stats.total) * 251.2}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">{stats.total}</span>
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-sm text-muted-foreground">Pending ({stats.pending})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-sm text-muted-foreground">In Progress ({stats.inProgress})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm text-muted-foreground">Resolved ({stats.resolved})</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Report Detail Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border shadow-elevated overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{selectedReport.trackingId}</span>
                <h2 className="font-semibold text-foreground">{selectedReport.title}</h2>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Status & Info */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedReport.status} />
                  <UrgencyBadge urgency={selectedReport.urgency} />
                  <PriorityBadge level={selectedReport.priorityLevel} score={selectedReport.priorityScore} />
                  <EscalationBadge
                    isDelayed={selectedReport.isDelayed}
                    isCritical={selectedReport.isCritical}
                  />
                  <span className="status-badge bg-secondary text-secondary-foreground">
                    {categoryIcons[selectedReport.category]} {t.categories[selectedReport.category as keyof typeof t.categories]}
                  </span>
                  {selectedReport.supportCount != null && selectedReport.supportCount > 0 && (
                    <span className="status-badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      👥 {selectedReport.supportCount} {t.supportCount || 'supporters'}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>

                <div className="text-sm text-muted-foreground">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  {selectedReport.address}
                </div>
              </div>

              {/* Status & Team Assignment Card */}
              <div className="card-elevated p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Status</h3>
                  {/* Disable status update if no team assigned */}
                  {!selectedReport.assignedTeamId ? (
                    <div className="p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground border border-dashed text-center">
                      Assign a team to update status
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {['underReview', 'assigned', 'inProgress', 'resolved', 'completed', 'closed'].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusUpdate(selectedReport.id, s as Status)}
                          className={cn(
                            "flex-1 py-2 text-xs font-medium rounded-md border transition-all min-w-[80px]",
                            selectedReport.status === s
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-secondary"
                          )}
                        >
                          {t.status[s as keyof typeof t.status]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team Assignment */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Assigned Team</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <select
                      className="w-full p-2 rounded-md border text-sm bg-background"
                      value={selectedReport.assignedTeamId || ''}
                      onChange={(e) => handleAssignTeam(e.target.value)}
                    >
                      <option value="">Select Team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{t.urgencyLevel}</h3>
                  <div className="flex gap-2">
                    {/* ... keeping urgency buttons ... */}
                    {(['normal', 'high', 'urgent'] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() => api.updateIssue(selectedReport.id, { urgency: u }).then(() => {
                          setReports(reports.map(r => r.id === selectedReport.id ? { ...r, urgency: u } : r));
                          setSelectedReport({ ...selectedReport, urgency: u });
                        })}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-md border transition-all",
                          selectedReport.urgency === u
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-secondary"
                        )}
                      >
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <label className={cn("label-text", language === 'ml' && "font-malayalam")}>
                  {t.internalNotes}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={language === 'en' ? 'Add a note...' : 'കുറിപ്പ് ചേർക്കുക...'}
                    className="input-field flex-1 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddNote()}
                    disabled={!newNote.trim()}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
                {selectedReport.internalNotes && selectedReport.internalNotes.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectedReport.internalNotes.map((note) => (
                      <div key={note.id || Math.random()} className="p-3 bg-secondary/50 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center text-muted-foreground/80">
                          <span className="font-medium">{note.sender}</span>
                          <span>{new Date(note.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-foreground">{note.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              {!selectedReport.anonymous && selectedReport.contact && (
                <div className="space-y-2">
                  <label className="label-text">Contact</label>
                  <div className="text-sm text-muted-foreground">
                    {selectedReport.contact.phone && <p>📱 {selectedReport.contact.phone}</p>}
                    {selectedReport.contact.email && <p>✉️ {selectedReport.contact.email}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

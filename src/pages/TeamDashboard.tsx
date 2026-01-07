import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Report, Status, categoryIcons, TeamEntity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge';

export default function TeamDashboard() {
    const { user, userRole, loading } = useAuth();
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/team/login');
            } else if (userRole !== 'team') {
                toast.error('Unauthorized access');
                navigate('/');
            } else {
                loadData();
            }
        }
    }, [user, userRole, loading, navigate]);

    const loadData = async () => {
        try {
            const data = await api.getTeamIssues();
            setReports(data);
        } catch (error) {
            toast.error('Failed to load assigned issues');
        }
    };

    const handleStatusUpdate = async (id: string, status: Status) => {
        try {
            await api.updateIssue(id, {
                status,
                history: selectedReport ? [
                    ...selectedReport.history,
                    { status, timestamp: new Date().toISOString(), note: 'Status updated by Team', actor: 'Team' }
                ] : []
            });

            const updatedReports = reports.map(r => r.id === id ? { ...r, status } : r);
            setReports(updatedReports);
            if (selectedReport?.id === id) {
                setSelectedReport({ ...selectedReport, status });
            }
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container py-8">
                <h1 className="text-2xl font-bold mb-6">Team Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List */}
                    <div className="space-y-4">
                        <h2 className="font-semibold text-lg">Assigned Issues ({reports.length})</h2>
                        {reports.length === 0 ? (
                            <p className="text-muted-foreground">No tasks assigned yet.</p>
                        ) : (
                            reports.map(report => (
                                <div
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className={cn(
                                        "card-elevated p-4 cursor-pointer hover:bg-secondary/50 transition-colors",
                                        selectedReport?.id === report.id && "border-primary"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-muted-foreground">{report.trackingId}</span>
                                        <StatusBadge status={report.status} size="sm" />
                                    </div>
                                    <h3 className="font-medium flex items-center gap-2 mb-2">
                                        <span>{categoryIcons[report.category]}</span>
                                        {report.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {report.panchayat}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> {new Date(report.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Detail */}
                    <div>
                        {selectedReport ? (
                            <div className="card-elevated p-6 sticky top-24 space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-2">{selectedReport.title}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                                </div>

                                <div className="flex gap-2">
                                    <UrgencyBadge urgency={selectedReport.urgency} />
                                    <span className="text-xs border px-2 py-1 rounded-full bg-secondary">
                                        {selectedReport.category}
                                    </span>
                                </div>

                                {selectedReport.photos.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedReport.photos.map((url, i) => (
                                            <img key={i} src={url} alt="Issue" className="w-full h-24 object-cover rounded-lg" />
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-medium mb-2">Update Status</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {(['inProgress', 'resolved'] as const).map(s => (
                                            <Button
                                                key={s}
                                                size="sm"
                                                variant={selectedReport.status === s ? 'default' : 'outline'}
                                                onClick={() => handleStatusUpdate(selectedReport.id, s)}
                                            >
                                                {s === 'inProgress' ? 'In Progress' : 'Resolved'}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Select an issue to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

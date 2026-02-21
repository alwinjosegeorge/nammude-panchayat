import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Report } from '@/lib/types';
import { SECTORS } from '@/lib/sectors';
import { cn } from '@/lib/utils';
import { exportReportsCSV, exportSectorAnalyticsCSV, printAnalyticsPDF } from '@/lib/sectorExport';

interface Props {
    reports: Report[];
}

interface SectorStat {
    key: string;
    icon: string;
    label: string;
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    delayed: number;
    avgResolutionHours: number | null;
}

function formatHours(h: number): string {
    if (h < 24) return `${Math.round(h)}h`;
    return `${Math.round(h / 24)}d`;
}

export function SectorAnalytics({ reports }: Props) {
    const { t, language } = useLanguage();

    // Only include reports that have a sector assigned (Option B)
    const sectorReports = reports.filter(r => !!r.sector);

    const stats = useMemo<SectorStat[]>(() => {
        return SECTORS.filter(s => s.key !== 'other').map(sector => {
            const sr = sectorReports.filter(r => r.sector === sector.key);
            const pending = sr.filter(r =>
                ['notTaken', 'submitted', 'received', 'underReview'].includes(r.status)
            ).length;
            const inProgress = sr.filter(r =>
                ['assigned', 'inProgress'].includes(r.status)
            ).length;
            const resolved = sr.filter(r =>
                ['resolved', 'completed', 'closed'].includes(r.status)
            ).length;
            const delayed = sr.filter(r => r.isDelayed || r.isCritical).length;

            const resolvedWithTime = sr.filter(
                r => r.resolutionTimeHours != null && ['resolved', 'completed', 'closed'].includes(r.status)
            );
            const avgResolutionHours =
                resolvedWithTime.length >= 2
                    ? resolvedWithTime.reduce((sum, r) => sum + (r.resolutionTimeHours ?? 0), 0) /
                    resolvedWithTime.length
                    : null;

            const sectorLabel =
                (t as any).sectors?.[sector.key as string] ?? sector.key;

            return {
                key: sector.key,
                icon: sector.icon,
                label: sectorLabel,
                total: sr.length,
                pending,
                inProgress,
                resolved,
                delayed,
                avgResolutionHours,
            };
        });
    }, [sectorReports, t]);

    // Sort worst-first: most pending, then most total
    const sorted = useMemo(
        () => [...stats].sort((a, b) => b.pending - a.pending || b.total - a.total),
        [stats]
    );

    const maxTotal = Math.max(...sorted.map(s => s.total), 1);

    // Performance card derivations
    const withReports = stats.filter(s => s.total > 0);
    const mostDelayed = withReports.reduce<SectorStat | null>(
        (best, s) => (!best || s.delayed > best.delayed ? s : best),
        null
    );
    const mostReported = withReports.reduce<SectorStat | null>(
        (best, s) => (!best || s.total > best.total ? s : best),
        null
    );
    const fastestResolving = stats
        .filter(s => s.avgResolutionHours !== null && s.total >= 3)
        .reduce<SectorStat | null>(
            (best, s) =>
                !best || (s.avgResolutionHours ?? Infinity) < (best.avgResolutionHours ?? Infinity)
                    ? s
                    : best,
            null
        );

    const ml = language === 'ml';

    if (sectorReports.length === 0) {
        return (
            <div className="card-elevated p-8 text-center text-muted-foreground">
                <p className={cn('text-4xl mb-2')}>📊</p>
                <p className={cn(ml && 'font-malayalam')}>
                    {language === 'en'
                        ? 'No sector-tagged reports yet. Submit a complaint to see analytics.'
                        : 'ഇനിയും സെക്ടർ ടാഗ് ചെയ്ത റിപ്പോർട്ടുകൾ ഇല്ല.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Performance Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Most Delayed */}
                <div className="card-elevated p-5 border-l-4 border-red-500 flex items-start gap-4">
                    <span className="text-3xl">{mostDelayed?.icon ?? '—'}</span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-0.5">
                            {language === 'en' ? '🔴 Most Delayed' : '🔴 ഏറ്റവും കൂടുതൽ കാലതാമസം'}
                        </p>
                        <p className={cn('font-semibold text-foreground truncate', ml && 'font-malayalam')}>
                            {mostDelayed?.label ?? '—'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {mostDelayed?.delayed ?? 0}{' '}
                            {language === 'en' ? 'delayed issues' : 'കാലതാമസ പ്രശ്നങ്ങൾ'}
                        </p>
                    </div>
                </div>

                {/* Most Reported */}
                <div className="card-elevated p-5 border-l-4 border-blue-500 flex items-start gap-4">
                    <span className="text-3xl">{mostReported?.icon ?? '—'}</span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-0.5">
                            {language === 'en' ? '📊 Most Reported' : '📊 ഏറ്റവും കൂടുതൽ റിപ്പോർട്ട്'}
                        </p>
                        <p className={cn('font-semibold text-foreground truncate', ml && 'font-malayalam')}>
                            {mostReported?.label ?? '—'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {mostReported?.total ?? 0}{' '}
                            {language === 'en' ? 'total complaints' : 'മൊത്തം പരാതികൾ'}
                        </p>
                    </div>
                </div>

                {/* Fastest Resolving */}
                <div className="card-elevated p-5 border-l-4 border-green-500 flex items-start gap-4">
                    <span className="text-3xl">{fastestResolving?.icon ?? '—'}</span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-0.5">
                            {language === 'en' ? '🏆 Fastest Resolving' : '🏆 ഏറ്റവും വേഗം പരിഹരിക്കുന്നത്'}
                        </p>
                        <p className={cn('font-semibold text-foreground truncate', ml && 'font-malayalam')}>
                            {fastestResolving?.label ?? (language === 'en' ? 'Not enough data' : 'ഡാറ്റ ഇല്ല')}
                        </p>
                        {fastestResolving && (
                            <p className="text-sm text-muted-foreground">
                                avg {formatHours(fastestResolving.avgResolutionHours!)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Bar Chart — Complaints by Sector ── */}
            <div className="card-elevated p-6" id="analytics-print-region">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <h3 className={cn('font-semibold text-foreground', ml && 'font-malayalam')}>
                        {language === 'en' ? 'Complaints by Sector' : 'സെക്ടർ അനുസരിച്ച് പരാതികൾ'}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                            ({language === 'en' ? 'worst first' : 'ഏറ്റവും ദോഷകരം ആദ്യം'})
                        </span>
                    </h3>
                    {/* Export buttons */}
                    <div className="flex items-center gap-2 no-print">
                        <button
                            onClick={() => exportReportsCSV(reports, 'nammude-panchayat-reports.csv')}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                            title={language === 'en' ? 'Export all reports as CSV' : 'CSV ആയി ഡൗൺലോഡ്'}
                        >
                            ⬇ {language === 'en' ? 'Reports CSV' : 'CSV'}
                        </button>
                        <button
                            onClick={() => exportSectorAnalyticsCSV(reports, (t as any).sectors ?? {}, 'sector-analytics.csv')}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                            title={language === 'en' ? 'Export sector summary as CSV' : 'അനലിറ്റിക്സ് CSV'}
                        >
                            ⬇ {language === 'en' ? 'Analytics CSV' : 'അനലിറ്റിക്സ്'}
                        </button>
                        <button
                            onClick={printAnalyticsPDF}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                            title={language === 'en' ? 'Print / Save as PDF' : 'PDF ആയി പ്രിൻ്റ്'}
                        >
                            🖨 {language === 'en' ? 'PDF' : 'PDF'}
                        </button>
                    </div>
                </div>
                <div className="space-y-3">
                    {sorted.map(stat => {
                        const pendingPct = (stat.pending / maxTotal) * 100;
                        const inProgressPct = (stat.inProgress / maxTotal) * 100;
                        const resolvedPct = (stat.resolved / maxTotal) * 100;

                        return (
                            <div key={stat.key} className="group">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base w-5 text-center flex-shrink-0">{stat.icon}</span>
                                    <span className={cn('text-sm font-medium text-foreground flex-1 truncate', ml && 'font-malayalam')}>
                                        {stat.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {stat.total} {language === 'en' ? 'total' : 'ആകെ'}
                                    </span>
                                    {stat.avgResolutionHours !== null && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex-shrink-0">
                                            ⏱ {formatHours(stat.avgResolutionHours)}
                                        </span>
                                    )}
                                    {stat.delayed > 0 && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex-shrink-0">
                                            ⚠ {stat.delayed}
                                        </span>
                                    )}
                                </div>

                                {/* Stacked progress bar */}
                                <div className="h-5 flex rounded-full overflow-hidden bg-secondary/50 w-full">
                                    {/* Pending — amber */}
                                    {stat.pending > 0 && (
                                        <div
                                            className="h-full bg-amber-400 dark:bg-amber-500 transition-all duration-500 flex items-center justify-center"
                                            style={{ width: `${pendingPct}%` }}
                                            title={`Pending: ${stat.pending}`}
                                        >
                                            {pendingPct > 8 && (
                                                <span className="text-[10px] font-bold text-amber-900 dark:text-amber-100">{stat.pending}</span>
                                            )}
                                        </div>
                                    )}
                                    {/* In Progress — blue */}
                                    {stat.inProgress > 0 && (
                                        <div
                                            className="h-full bg-blue-400 dark:bg-blue-500 transition-all duration-500 flex items-center justify-center"
                                            style={{ width: `${inProgressPct}%` }}
                                            title={`In Progress: ${stat.inProgress}`}
                                        >
                                            {inProgressPct > 8 && (
                                                <span className="text-[10px] font-bold text-blue-900 dark:text-blue-100">{stat.inProgress}</span>
                                            )}
                                        </div>
                                    )}
                                    {/* Resolved — green */}
                                    {stat.resolved > 0 && (
                                        <div
                                            className="h-full bg-emerald-400 dark:bg-emerald-500 transition-all duration-500 flex items-center justify-center"
                                            style={{ width: `${resolvedPct}%` }}
                                            title={`Resolved: ${stat.resolved}`}
                                        >
                                            {resolvedPct > 8 && (
                                                <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-100">{stat.resolved}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex gap-5 mt-5 pt-4 border-t border-border">
                    {[
                        { color: 'bg-amber-400', label: language === 'en' ? 'Pending' : 'കാത്തിരിക്കുന്നു' },
                        { color: 'bg-blue-400', label: language === 'en' ? 'In Progress' : 'പ്രക്രിയയിൽ' },
                        { color: 'bg-emerald-400', label: language === 'en' ? 'Resolved' : 'പരിഹരിച്ചു' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={cn('w-3 h-3 rounded-full', color)} />
                            <span className={cn('text-xs text-muted-foreground', ml && 'font-malayalam')}>{label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">⚠ N</span>
                        <span className={cn('text-xs text-muted-foreground', ml && 'font-malayalam')}>
                            {language === 'en' ? 'Delayed/Critical' : 'കാലതാമസം/ഗുരുതരം'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

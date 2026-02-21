import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Report } from '@/lib/types';
import { SECTORS } from '@/lib/sectors';
import { cn } from '@/lib/utils';

interface Props {
    reports: Report[];
}

type Window = 7 | 30;

function getDateDaysAgo(n: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (n - 1));
    return d;
}

function isoToDay(iso: string): string {
    return iso.slice(0, 10); // YYYY-MM-DD
}

function generateDays(n: number): string[] {
    const days: string[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push(isoToDay(d.toISOString()));
    }
    return days;
}

function shortDayLabel(iso: string, lang: 'en' | 'ml'): string {
    const d = new Date(iso);
    if (lang === 'ml') {
        // dd/mm
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export function SectorTrend({ reports }: Props) {
    const { t, language } = useLanguage();
    const ml = language === 'ml';

    const [window, setWindow] = useState<Window>(7);
    const [selectedSector, setSelectedSector] = useState<string>('all');

    const sectorReports = useMemo(() => reports.filter(r => !!r.sector), [reports]);

    const cutoff = useMemo(() => getDateDaysAgo(window), [window]);
    const days = useMemo(() => generateDays(window), [window]);

    // Reports in the selected time window
    const windowReports = useMemo(
        () => sectorReports.filter(r => new Date(r.createdAt) >= cutoff),
        [sectorReports, cutoff]
    );

    // ── Trend chart data ──────────────────────────────────────────────────────

    const trendData = useMemo(() => {
        const relevantReports =
            selectedSector === 'all'
                ? windowReports
                : windowReports.filter(r => r.sector === selectedSector);

        return days.map(day => ({
            day,
            count: relevantReports.filter(r => isoToDay(r.createdAt) === day).length,
        }));
    }, [windowReports, selectedSector, days]);

    const maxCount = Math.max(...trendData.map(d => d.count), 1);

    // ── Ward (panchayat) breakdown for selected sector ────────────────────────

    const wardBreakdown = useMemo(() => {
        const relevant =
            selectedSector === 'all'
                ? windowReports
                : windowReports.filter(r => r.sector === selectedSector);

        const map = new Map<string, { total: number; pending: number; resolved: number }>();
        for (const r of relevant) {
            const key = r.panchayat || 'Unknown';
            const existing = map.get(key) ?? { total: 0, pending: 0, resolved: 0 };
            existing.total++;
            if (['notTaken', 'submitted', 'received', 'underReview', 'assigned', 'inProgress'].includes(r.status)) {
                existing.pending++;
            } else {
                existing.resolved++;
            }
            map.set(key, existing);
        }

        return [...map.entries()]
            .map(([ward, stats]) => ({ ward, ...stats }))
            .sort((a, b) => b.total - a.total);
    }, [windowReports, selectedSector]);

    const maxWardTotal = Math.max(...wardBreakdown.map(w => w.total), 1);

    // ── Sector selector options ───────────────────────────────────────────────

    const sectorOptions = SECTORS.filter(s => s.key !== 'other').map(s => ({
        key: s.key,
        icon: s.icon,
        label: (t as any).sectors?.[s.key] ?? s.key,
        hasData: windowReports.some(r => r.sector === s.key),
    }));

    if (sectorReports.length === 0) {
        return (
            <div className="card-elevated p-8 text-center text-muted-foreground">
                <p className="text-4xl mb-2">📈</p>
                <p className={cn(ml && 'font-malayalam')}>
                    {language === 'en'
                        ? 'No sector-tagged reports yet to show trends.'
                        : 'ട്രെൻഡ് കാണിക്കാൻ ഡാറ്റ ഇല്ല.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Controls ── */}
            <div className="card-elevated p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h3 className={cn('font-semibold text-foreground', ml && 'font-malayalam')}>
                        {language === 'en' ? 'Sector Trend & Ward Breakdown' : 'സെക്ടർ ട്രെൻഡ് & വാർഡ് വിശദാംശം'}
                    </h3>

                    {/* Time window toggle */}
                    <div className="flex items-center bg-secondary rounded-lg p-1 gap-1">
                        {([7, 30] as Window[]).map(w => (
                            <button
                                key={w}
                                onClick={() => setWindow(w)}
                                className={cn(
                                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                                    window === w
                                        ? 'bg-card shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {language === 'en' ? `Last ${w} days` : `കഴിഞ്ഞ ${w} ദിവസം`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sector filter pills */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedSector('all')}
                        className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                            selectedSector === 'all'
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-secondary text-muted-foreground hover:text-foreground border-border'
                        )}
                    >
                        {language === 'en' ? 'All Sectors' : 'എല്ലാം'}
                    </button>
                    {sectorOptions.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSelectedSector(s.key)}
                            className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                                selectedSector === s.key
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : s.hasData
                                        ? 'bg-secondary text-muted-foreground hover:text-foreground border-border'
                                        : 'bg-secondary/50 text-muted-foreground/50 border-border cursor-default'
                            )}
                            disabled={!s.hasData}
                        >
                            {s.icon} <span className={cn(ml && 'font-malayalam')}>{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Trend Chart ── */}
            <div className="card-elevated p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className={cn('text-sm font-medium text-muted-foreground', ml && 'font-malayalam')}>
                        {language === 'en'
                            ? `Complaints reported — last ${window} days`
                            : `കഴിഞ്ഞ ${window} ദിവസം — റിപ്പോർട്ടുകൾ`}
                    </p>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                        {windowReports.filter(r => selectedSector === 'all' || r.sector === selectedSector).length}{' '}
                        {language === 'en' ? 'total' : 'ആകെ'}
                    </span>
                </div>

                {/* Chart area */}
                <div className="flex items-end gap-1 h-36 w-full">
                    {trendData.map(({ day, count }) => {
                        const pct = Math.max((count / maxCount) * 100, count > 0 ? 4 : 0);
                        return (
                            <div key={day} className="flex flex-col items-center flex-1 gap-1 h-full justify-end group relative">
                                {/* Tooltip */}
                                {count > 0 && (
                                    <div className="absolute bottom-full mb-1 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {shortDayLabel(day, language as 'en' | 'ml')}: {count}
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'w-full rounded-t transition-all duration-500',
                                        count > 0
                                            ? 'bg-primary/80 hover:bg-primary'
                                            : 'bg-secondary/50'
                                    )}
                                    style={{ height: `${pct}%` }}
                                    title={`${shortDayLabel(day, language as 'en' | 'ml')}: ${count}`}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* X-axis labels — show only every Nth to avoid clutter */}
                <div className="flex items-start gap-1 mt-1 w-full">
                    {trendData.map(({ day }, i) => {
                        const skip = window === 30 ? i % 5 !== 0 : false;
                        return (
                            <div key={day} className="flex-1 text-center">
                                {!skip && (
                                    <span className="text-[9px] text-muted-foreground leading-none">
                                        {shortDayLabel(day, language as 'en' | 'ml')}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Ward Breakdown ── */}
            {wardBreakdown.length > 0 ? (
                <div className="card-elevated p-5">
                    <h4 className={cn('text-sm font-semibold text-foreground mb-4', ml && 'font-malayalam')}>
                        {language === 'en'
                            ? `Ward / Panchayat Breakdown${selectedSector !== 'all' ? ` · ${(t as any).sectors?.[selectedSector] ?? selectedSector}` : ''}`
                            : `വാർഡ് / പഞ്ചായത്ത് വിശദാംശം${selectedSector !== 'all' ? ` · ${(t as any).sectors?.[selectedSector] ?? selectedSector}` : ''}`}
                    </h4>

                    <div className="space-y-2.5">
                        {wardBreakdown.slice(0, 12).map(({ ward, total, pending, resolved }) => {
                            const pendingPct = (pending / maxWardTotal) * 100;
                            const resolvedPct = (resolved / maxWardTotal) * 100;
                            return (
                                <div key={ward}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn('text-xs font-medium text-foreground truncate flex-1', ml && 'font-malayalam')}>
                                            📍 {ward}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">{total}</span>
                                        {pending > 0 && (
                                            <span className="text-xs text-amber-600 dark:text-amber-400 flex-shrink-0 font-medium">
                                                {pending} {language === 'en' ? 'open' : 'ബാക്കി'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-3 flex rounded-full overflow-hidden bg-secondary/50">
                                        {pending > 0 && (
                                            <div
                                                className="h-full bg-amber-400 dark:bg-amber-500 transition-all duration-500"
                                                style={{ width: `${pendingPct}%` }}
                                            />
                                        )}
                                        {resolved > 0 && (
                                            <div
                                                className="h-full bg-emerald-400 dark:bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${resolvedPct}%` }}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {wardBreakdown.length > 12 && (
                            <p className="text-xs text-muted-foreground pt-1">
                                +{wardBreakdown.length - 12} more {language === 'en' ? 'wards' : 'വാർഡ്'}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-5 mt-4 pt-3 border-t border-border">
                        {[
                            { color: 'bg-amber-400', label: language === 'en' ? 'Open' : 'ബാക്കി' },
                            { color: 'bg-emerald-400', label: language === 'en' ? 'Resolved' : 'പരിഹരിച്ചു' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <div className={cn('w-2.5 h-2.5 rounded-full', color)} />
                                <span className={cn('text-xs text-muted-foreground', ml && 'font-malayalam')}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="card-elevated p-6 text-center text-sm text-muted-foreground">
                    {language === 'en'
                        ? `No reports in the last ${window} days for this selection.`
                        : `ഈ തിരഞ്ഞെടുപ്പിൽ ${window} ദിവസം റിപ്പോർട്ടുകൾ ഇല്ല.`}
                </div>
            )}
        </div>
    );
}

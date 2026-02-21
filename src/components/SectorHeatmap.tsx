import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Report } from '@/lib/types';
import { SECTORS } from '@/lib/sectors';
import { cn } from '@/lib/utils';

interface Props {
    reports: Report[];
    /** Called with sector key when user clicks a tile — enables drill-down */
    onSectorClick?: (sectorKey: string) => void;
}

export function SectorHeatmap({ reports, onSectorClick }: Props) {
    const { t, language } = useLanguage();
    const ml = language === 'ml';

    const sectorStats = useMemo(() => {
        const sectorReports = reports.filter(r => !!r.sector);

        return SECTORS.map(sector => {
            const sr = sectorReports.filter(r => r.sector === sector.key);
            const total = sr.length;
            const pending = sr.filter(r =>
                ['notTaken', 'submitted', 'received', 'underReview', 'assigned', 'inProgress'].includes(r.status)
            ).length;
            const critical = sr.filter(r => r.isCritical).length;
            const delayed = sr.filter(r => r.isDelayed).length;
            const pendingRatio = total === 0 ? 0 : pending / total;

            // Severity: 0 = none, 1 = healthy, 2 = attention, 3 = critical
            let severity: 0 | 1 | 2 | 3 = 0;
            if (total === 0) severity = 0;
            else if (critical > 0 || pendingRatio > 0.7) severity = 3;
            else if (pendingRatio > 0.4 || delayed > 0) severity = 2;
            else severity = 1;

            const label = (t as any).sectors?.[sector.key] ?? sector.key;

            return { key: sector.key, icon: sector.icon, label, total, pending, critical, delayed, severity };
        });
    }, [reports, t]);

    const totalWithData = sectorStats.filter(s => s.total > 0).length;

    return (
        <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className={cn('font-semibold text-foreground', ml && 'font-malayalam')}>
                    {language === 'en' ? 'Sector Health Heatmap' : 'സെക്ടർ ആരോഗ്യ ഹീറ്റ്മാപ്പ്'}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm bg-secondary border" /> No data
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> Healthy
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> Attention
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Critical
                    </span>
                </div>
            </div>

            {/* Heatmap grid — 4 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sectorStats.map(stat => {
                    const isClickable = !!onSectorClick && stat.total > 0;
                    const tileBase =
                        `relative rounded-xl p-4 border transition-all duration-300 select-none ${isClickable ? 'cursor-pointer' : 'cursor-default'}`;

                    const tileColor =
                        stat.severity === 3
                            ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800'
                            : stat.severity === 2
                                ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700'
                                : stat.severity === 1
                                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                                    : 'bg-secondary/30 border-border';

                    const countColor =
                        stat.severity === 3
                            ? 'text-red-600 dark:text-red-400'
                            : stat.severity === 2
                                ? 'text-amber-600 dark:text-amber-400'
                                : stat.severity === 1
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground';

                    return isClickable ? (
                        <button
                            key={stat.key}
                            onClick={() => onSectorClick!(stat.key)}
                            title={`${stat.label} — click to filter reports`}
                            className={cn(tileBase, tileColor, stat.severity === 3 && 'animate-pulse-slow',
                                'hover:ring-2 hover:ring-primary/50 hover:shadow-md w-full text-left')}
                        >
                            {/* Severity dot */}
                            {stat.severity > 0 && (
                                <span
                                    className={cn(
                                        'absolute top-2 right-2 w-2 h-2 rounded-full',
                                        stat.severity === 3 && 'bg-red-500',
                                        stat.severity === 2 && 'bg-amber-400',
                                        stat.severity === 1 && 'bg-emerald-400'
                                    )}
                                />
                            )}

                            <div className="flex flex-col gap-1">
                                <span className="text-2xl">{stat.icon}</span>
                                <p className={cn('text-xs font-medium text-foreground leading-tight', ml && 'font-malayalam')}>
                                    {stat.label}
                                </p>
                                <p className={cn('text-xl font-bold mt-0.5', countColor)}>
                                    {stat.total}
                                </p>
                                {stat.total > 0 && (
                                    <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                        {stat.pending > 0 && (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                {stat.pending} {language === 'en' ? 'open' : 'ബാക്കി'}
                                            </span>
                                        )}
                                        {stat.critical > 0 && (
                                            <span className="text-red-600 dark:text-red-400 font-medium">
                                                🚨 {stat.critical}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {stat.total === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {language === 'en' ? 'No reports' : 'ഡാറ്റ ഇല്ല'}
                                    </p>
                                )}
                            </div>
                            {isClickable && (
                                <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/60">→</span>
                            )}
                        </button>
                    ) : (
                        <div
                            key={stat.key}
                            className={cn(tileBase, tileColor, stat.severity === 3 && 'animate-pulse-slow')}
                        >
                            {/* Severity dot */}
                            {stat.severity > 0 && (
                                <span
                                    className={cn(
                                        'absolute top-2 right-2 w-2 h-2 rounded-full',
                                        stat.severity === 3 && 'bg-red-500',
                                        stat.severity === 2 && 'bg-amber-400',
                                        stat.severity === 1 && 'bg-emerald-400'
                                    )}
                                />
                            )}

                            <div className="flex flex-col gap-1">
                                <span className="text-2xl">{stat.icon}</span>
                                <p className={cn('text-xs font-medium text-foreground leading-tight', ml && 'font-malayalam')}>
                                    {stat.label}
                                </p>
                                <p className={cn('text-xl font-bold mt-0.5', countColor)}>
                                    {stat.total}
                                </p>
                                {stat.total > 0 && (
                                    <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                        {stat.pending > 0 && (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                {stat.pending} {language === 'en' ? 'open' : 'ബാക്കി'}
                                            </span>
                                        )}
                                        {stat.critical > 0 && (
                                            <span className="text-red-600 dark:text-red-400 font-medium">
                                                🚨 {stat.critical}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {stat.total === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {language === 'en' ? 'No reports' : 'ഡാറ്റ ഇല്ല'}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary bar */}
            {totalWithData > 0 && (
                <div className={cn('mt-4 pt-4 border-t border-border text-xs text-muted-foreground', ml && 'font-malayalam')}>
                    {language === 'en'
                        ? `${totalWithData} of ${sectorStats.length} sectors have active reports`
                        : `${sectorStats.length} സെക്ടറുകളിൽ ${totalWithData} സജീവ റിപ്പോർട്ടുകൾ`}
                    {' · '}
                    {sectorStats.filter(s => s.severity === 3).length > 0 && (
                        <span className="text-red-500 font-semibold">
                            {sectorStats.filter(s => s.severity === 3).length}{' '}
                            {language === 'en' ? 'critical sector(s)' : 'ഗുരുതര സെക്ടർ'}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

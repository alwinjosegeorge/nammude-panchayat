import { SECTORS } from '@/lib/sectors';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SectorSelectorProps {
    onSelect: (sectorKey: string) => void;
    selectedSector?: string | null;
}

export function SectorSelector({ onSelect, selectedSector }: SectorSelectorProps) {
    const { t, language } = useLanguage();

    return (
        <div className="space-y-4">
            <label className={cn('label-text', language === 'ml' && 'font-malayalam')}>
                {t.selectSector} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SECTORS.map((sector) => {
                    const isSelected = selectedSector === sector.key;
                    const sectorLabel = t.sectors[sector.key as keyof typeof t.sectors] ?? sector.key;

                    return (
                        <button
                            key={sector.key}
                            type="button"
                            onClick={() => onSelect(sector.key)}
                            className={cn(
                                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 min-h-[90px] justify-center',
                                isSelected
                                    ? 'border-primary bg-primary/5 shadow-soft'
                                    : 'border-border bg-card hover:border-primary/50 hover:bg-secondary'
                            )}
                        >
                            <span className="text-3xl leading-none">{sector.icon}</span>
                            <span
                                className={cn(
                                    'text-xs font-medium text-center leading-tight',
                                    isSelected ? 'text-primary' : 'text-muted-foreground',
                                    language === 'ml' && 'font-malayalam'
                                )}
                            >
                                {sectorLabel}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

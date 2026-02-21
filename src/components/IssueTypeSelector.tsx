import { getIssueTypesForSector } from '@/lib/sectors';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

interface IssueTypeSelectorProps {
    sectorKey: string;
    sectorLabel: string;
    selectedIssueType: string | null;
    onSelect: (issueTypeKey: string) => void;
    onBack: () => void;
    /** For the "Other" sector: custom text value */
    customText?: string;
    onCustomTextChange?: (text: string) => void;
}

export function IssueTypeSelector({
    sectorKey,
    sectorLabel,
    selectedIssueType,
    onSelect,
    onBack,
    customText,
    onCustomTextChange,
}: IssueTypeSelectorProps) {
    const { t, language } = useLanguage();
    const issueTypes = getIssueTypesForSector(sectorKey);

    return (
        <div className="space-y-4">
            {/* Back button + sector breadcrumb */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className={cn(language === 'ml' && 'font-malayalam')}>{t.changeSector}</span>
                </button>
                <span className="text-muted-foreground">/</span>
                <span className={cn('text-sm font-medium text-foreground', language === 'ml' && 'font-malayalam')}>
                    {sectorLabel}
                </span>
            </div>

            <label className={cn('label-text', language === 'ml' && 'font-malayalam')}>
                {t.selectIssueType} *
            </label>

            {/* Issue type grid — same style as old CategorySelector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {issueTypes.map((issueType) => {
                    const isSelected = selectedIssueType === issueType.key;
                    const label =
                        t.issueTypes?.[issueType.key as keyof typeof t.issueTypes] ?? issueType.key;

                    return (
                        <button
                            key={issueType.key}
                            type="button"
                            onClick={() => onSelect(issueType.key)}
                            className={cn(
                                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 min-h-[84px] justify-center',
                                isSelected
                                    ? 'border-primary bg-primary/5 shadow-soft'
                                    : 'border-border bg-card hover:border-primary/50 hover:bg-secondary'
                            )}
                        >
                            <span className="text-2xl leading-none">{issueType.icon}</span>
                            <span
                                className={cn(
                                    'text-xs font-medium text-center leading-tight',
                                    isSelected ? 'text-primary' : 'text-muted-foreground',
                                    language === 'ml' && 'font-malayalam'
                                )}
                            >
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Custom text input for "Other" sector */}
            {sectorKey === 'other' && selectedIssueType === 'customIssue' && (
                <div className="mt-3">
                    <input
                        type="text"
                        value={customText ?? ''}
                        onChange={(e) => onCustomTextChange?.(e.target.value)}
                        placeholder={
                            language === 'en'
                                ? 'Describe your issue briefly...'
                                : 'നിങ്ങളുടെ പ്രശ്നം ഹ്രസ്വമായി വിവരിക്കുക...'
                        }
                        className={cn('input-field', language === 'ml' && 'font-malayalam')}
                        maxLength={100}
                    />
                </div>
            )}
        </div>
    );
}

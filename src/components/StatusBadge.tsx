import { Status } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t, language } = useLanguage();

  const statusClasses: Record<Status, string> = {
    submitted: 'status-submitted',
    received: 'status-received',
    assigned: 'status-assigned',
    inProgress: 'status-in-progress',
    resolved: 'status-resolved',
    closed: 'status-closed',
    // New automated statuses
    notTaken: 'status-not-taken',
    underReview: 'status-under-review',
    completed: 'status-completed',
  };

  return (
    <span className={cn(
      'status-badge',
      statusClasses[status] || 'status-submitted',
      size === 'sm' && 'text-xs px-2 py-0.5',
      language === 'ml' && 'font-malayalam'
    )}>
      {t.status[status] || status}
    </span>
  );
}

interface UrgencyBadgeProps {
  urgency: 'normal' | 'high' | 'urgent';
  size?: 'sm' | 'md';
}

export function UrgencyBadge({ urgency, size = 'md' }: UrgencyBadgeProps) {
  const { t, language } = useLanguage();

  const urgencyClasses: Record<string, string> = {
    normal: 'urgency-normal',
    high: 'urgency-high',
    urgent: 'urgency-urgent',
  };

  const labels: Record<string, string> = {
    normal: t.normal,
    high: t.high,
    urgent: t.urgent,
  };

  return (
    <span className={cn(
      'status-badge',
      urgencyClasses[urgency],
      size === 'sm' && 'text-xs px-2 py-0.5',
      language === 'ml' && 'font-malayalam'
    )}>
      {labels[urgency]}
    </span>
  );
}

// ============================================================
// NEW: Priority Badge
// ============================================================
interface PriorityBadgeProps {
  level?: 'Low' | 'Medium' | 'High' | string;
  score?: number;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ level, score, size = 'md' }: PriorityBadgeProps) {
  const { language } = useLanguage();

  if (!level) return null;

  const priorityClasses: Record<string, string> = {
    Low: 'priority-low',
    Medium: 'priority-medium',
    High: 'priority-high',
  };

  const labels: Record<string, Record<string, string>> = {
    en: { Low: 'Low', Medium: 'Medium', High: 'High' },
    ml: { Low: 'താഴ്ന്ന', Medium: 'ഇടത്തരം', High: 'ഉയർന്ന' },
  };

  const displayLabel = labels[language]?.[level] || level;

  return (
    <span className={cn(
      'status-badge',
      priorityClasses[level] || 'priority-low',
      size === 'sm' && 'text-xs px-2 py-0.5',
      language === 'ml' && 'font-malayalam'
    )}>
      {displayLabel}
      {score != null && <span className="ml-1 opacity-70">({score})</span>}
    </span>
  );
}

// ============================================================
// NEW: Escalation Badge
// ============================================================
interface EscalationBadgeProps {
  isDelayed?: boolean;
  isCritical?: boolean;
  size?: 'sm' | 'md';
}

export function EscalationBadge({ isDelayed, isCritical, size = 'md' }: EscalationBadgeProps) {
  const { language } = useLanguage();

  if (!isDelayed && !isCritical) return null;

  const labels = {
    en: { delayed: '⏳ Delayed', critical: '🚨 Critical' },
    ml: { delayed: '⏳ വൈകി', critical: '🚨 അടിയന്തിരം' },
  };

  if (isCritical) {
    return (
      <span className={cn(
        'status-badge escalation-critical',
        size === 'sm' && 'text-xs px-2 py-0.5',
        language === 'ml' && 'font-malayalam'
      )}>
        {labels[language]?.critical || labels.en.critical}
      </span>
    );
  }

  return (
    <span className={cn(
      'status-badge escalation-delayed',
      size === 'sm' && 'text-xs px-2 py-0.5',
      language === 'ml' && 'font-malayalam'
    )}>
      {labels[language]?.delayed || labels.en.delayed}
    </span>
  );
}

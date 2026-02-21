/**
 * Nammude Panchayat — Automation Helpers
 * Client-side constants and utility functions for the automation features.
 * These are used for UI display and as fallback when DB functions are unavailable.
 */

import type { Report, Category } from './types';

// ============================================================
// CATEGORY WEIGHTS (mirrors DB function logic)
// ============================================================
export const CATEGORY_WEIGHTS: Record<Category, number> = {
    waterLeak: 5,
    electricity: 5,
    drainage: 4,
    brokenRoad: 4,
    streetlight: 3,
    garbage: 3,
    publicProperty: 2,
    other: 1,
};

// ============================================================
// SEVERITY / URGENCY WEIGHTS
// ============================================================
export const SEVERITY_WEIGHTS: Record<string, number> = {
    urgent: 5,
    high: 3,
    normal: 1,
};

// ============================================================
// CLIENT-SIDE PRIORITY CALCULATION (fallback)
// Score = category_weight + severity_weight + (support_count * 2) + (days_pending * 1.5)
// ============================================================
export function calculatePriorityClient(report: Report): {
    score: number;
    level: 'Low' | 'Medium' | 'High';
} {
    const catWeight = CATEGORY_WEIGHTS[report.category] || 1;
    const sevWeight = SEVERITY_WEIGHTS[report.urgency] || 1;
    const supportCount = report.supportCount || 0;
    const daysPending = (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    const score = catWeight + sevWeight + (supportCount * 2) + (daysPending * 1.5);
    const rounded = Math.round(score);

    let level: 'Low' | 'Medium' | 'High';
    if (rounded >= 13) level = 'High';
    else if (rounded >= 6) level = 'Medium';
    else level = 'Low';

    return { score: rounded, level };
}

// ============================================================
// HAVERSINE DISTANCE (meters)
// Used for client-side duplicate preview
// ============================================================
export function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// ESCALATION STATUS HELPER
// Returns UI display info based on escalation flags & timing
// ============================================================
export interface EscalationInfo {
    isDelayed: boolean;
    isCritical: boolean;
    label: string;
    color: string; // Tailwind-compatible class suffix
    hoursElapsed: number;
}

export function getEscalationInfo(report: Report): EscalationInfo {
    const lastUpdate = report.lastStatusUpdateAt || report.updatedAt || report.createdAt;
    const hoursElapsed = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60);

    // Use DB flags if available, otherwise compute client-side
    const isDelayed = report.isDelayed || hoursElapsed >= 48;
    const isCritical = report.isCritical || hoursElapsed >= 168; // 7 days

    let label = '';
    let color = '';

    if (isCritical) {
        label = '🚨 Critical';
        color = 'destructive';
    } else if (isDelayed) {
        label = '⏳ Delayed';
        color = 'warning';
    }

    return { isDelayed, isCritical, label, color, hoursElapsed };
}

// ============================================================
// STATUS FLOW HELPERS
// ============================================================

/** Statuses that are considered "open" (not finished) */
export const OPEN_STATUSES = ['submitted', 'received', 'assigned', 'inProgress', 'notTaken', 'underReview'] as const;

/** Statuses that are considered "closed" (finished) */
export const CLOSED_STATUSES = ['resolved', 'closed', 'completed'] as const;

/** Check if a report is still open */
export function isOpen(report: Report): boolean {
    return !CLOSED_STATUSES.includes(report.status as typeof CLOSED_STATUSES[number]);
}

/** The new automated status flow */
export const AUTOMATED_FLOW = ['notTaken', 'underReview', 'inProgress', 'completed', 'closed'] as const;

// ============================================================
// RESOLUTION TIME FORMATTING
// ============================================================
export function formatResolutionTime(hours: number | undefined): string {
    if (hours == null) return '—';
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${Math.round(hours)} hrs`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
}

// ============================================================
// PRIORITY LEVEL COLORS
// ============================================================
export const PRIORITY_COLORS: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

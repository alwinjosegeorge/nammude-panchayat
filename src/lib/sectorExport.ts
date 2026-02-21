/**
 * sectorExport.ts
 * Pure browser-side export helpers — no external libraries needed.
 * CSV uses Blob + URL.createObjectURL.
 * PDF uses window.print() with an injected print-only <style>.
 */

import { Report } from './types';
import { SECTORS } from './sectors';

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeCsv(v: unknown): string {
    const s = v == null ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function row(cells: unknown[]): string {
    return cells.map(escapeCsv).join(',');
}

// ── Type Definitions ──────────────────────────────────────────────────────────

export interface SectorSummaryRow {
    sector: string;
    icon: string;
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    delayed: number;
    avgResolutionHours: number | null;
}

// ── Build sector summary rows from raw reports ────────────────────────────────

export function buildSectorSummary(reports: Report[]): SectorSummaryRow[] {
    const sectorReports = reports.filter(r => !!r.sector);
    return SECTORS.filter(s => s.key !== 'other').map(sector => {
        const sr = sectorReports.filter(r => r.sector === sector.key);
        const pending = sr.filter(r =>
            ['notTaken', 'submitted', 'received', 'underReview'].includes(r.status)
        ).length;
        const inProgress = sr.filter(r => ['assigned', 'inProgress'].includes(r.status)).length;
        const resolved = sr.filter(r => ['resolved', 'completed', 'closed'].includes(r.status)).length;
        const delayed = sr.filter(r => r.isDelayed || r.isCritical).length;
        const resolvedWithTime = sr.filter(r => r.resolutionTimeHours != null && ['resolved', 'completed', 'closed'].includes(r.status));
        const avgResolutionHours =
            resolvedWithTime.length >= 2
                ? resolvedWithTime.reduce((s, r) => s + (r.resolutionTimeHours ?? 0), 0) / resolvedWithTime.length
                : null;
        return { sector: sector.key, icon: sector.icon, total: sr.length, pending, inProgress, resolved, delayed, avgResolutionHours };
    });
}

// ── CSV Export ────────────────────────────────────────────────────────────────

/**
 * Export full report list as CSV.
 */
export function exportReportsCSV(reports: Report[], filename = 'reports.csv'): void {
    const headers = [
        'Tracking ID', 'Title', 'Sector', 'Issue Type', 'Category',
        'Status', 'Urgency', 'Priority', 'Panchayat', 'Address',
        'Created At', 'Assigned Team', 'Is Delayed', 'Is Critical',
        'Priority Score', 'Resolution Hours',
    ];
    const lines = [
        row(headers),
        ...reports.map(r => row([
            r.trackingId, r.title, r.sector ?? '', r.issueType ?? '', r.category,
            r.status, r.urgency, r.priorityLevel ?? '', r.panchayat, r.address,
            r.createdAt, r.assignedTeam ?? '', r.isDelayed ? 'Yes' : 'No',
            r.isCritical ? 'Yes' : 'No', r.priorityScore ?? '', r.resolutionTimeHours ?? '',
        ])),
    ];
    downloadText(lines.join('\n'), filename, 'text/csv');
}

/**
 * Export sector analytics summary as CSV.
 */
export function exportSectorAnalyticsCSV(reports: Report[], sectorLabels: Record<string, string>, filename = 'sector-analytics.csv'): void {
    const summary = buildSectorSummary(reports);
    const headers = ['Sector', 'Total', 'Pending', 'In Progress', 'Resolved', 'Delayed/Critical', 'Avg Resolution Hours'];
    const lines = [
        row(headers),
        ...summary.map(s => row([
            sectorLabels[s.sector] ?? s.sector,
            s.total, s.pending, s.inProgress, s.resolved, s.delayed,
            s.avgResolutionHours != null ? s.avgResolutionHours.toFixed(1) : 'N/A',
        ])),
    ];
    downloadText(lines.join('\n'), filename, 'text/csv');
}

// ── PDF Export (print dialog) ─────────────────────────────────────────────────

/**
 * Opens a browser print dialog for the analytics area.
 * We inject a temporary print-only stylesheet to hide nav/header/sidebar
 * so only the analytics content is printed/saved as PDF.
 */
export function printAnalyticsPDF(): void {
    const style = document.createElement('style');
    style.id = '__print_analytics__';
    style.textContent = `
    @media print {
      body > * { display: none !important; }
      #analytics-print-region,
      #analytics-print-region * { display: block !important; }
      #analytics-print-region { position: static; padding: 1rem; }
      .no-print { display: none !important; }
    }
  `;
    document.head.appendChild(style);
    window.print();
    // Clean up after dialog closes (setTimeout because print is sync-blocking)
    setTimeout(() => {
        const el = document.getElementById('__print_analytics__');
        if (el) el.remove();
    }, 2000);
}

// ── Internal ─────────────────────────────────────────────────────────────────

function downloadText(content: string, filename: string, mime: string): void {
    const blob = new Blob(['\uFEFF' + content], { type: mime }); // BOM for Excel UTF-8
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

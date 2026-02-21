import { supabase } from './supabase';
import { Report, Status, InternalNote, TeamEntity, DBReport, Category, Urgency, Team, Worker, DBWorker } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper to convert DB (snake_case) to Frontend (camelCase)
// Helper to convert DB (snake_case) to Frontend (camelCase)
const mapToReport = (data: DBReport): Report => ({
    id: data.id,
    trackingId: data.tracking_id,
    title: data.title,
    description: data.description,
    category: data.category as Category,
    sector: data.sector,
    issueType: data.issue_type,
    panchayat: data.panchayat,
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    urgency: data.urgency as Urgency,
    photos: data.photos || [],
    status: data.status as Status,
    contact: (data.contact_phone || data.contact_email) ? {
        phone: data.contact_phone,
        email: data.contact_email,
    } : undefined,
    anonymous: data.anonymous,
    assignedTeam: data.assigned_team as Team,
    assignedTeamId: data.assigned_team_id,
    history: data.history || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    internalNotes: data.internal_notes || [],
    // Automation fields
    assignedAt: data.assigned_at,
    completedAt: data.completed_at,
    lastStatusUpdateAt: data.last_status_update_at,
    isDelayed: data.is_delayed ?? false,
    isCritical: data.is_critical ?? false,
    priorityScore: data.priority_score ?? 0,
    priorityLevel: (data.priority_level as 'Low' | 'Medium' | 'High') ?? 'Low',
    supportCount: data.support_count ?? 0,
    resolutionTimeHours: data.resolution_time_hours,
    assignedWorkerId: data.assigned_worker_id,
});

const mapToWorker = (data: DBWorker): Worker => ({
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    ward: data.ward,
    categorySpecialization: data.category_specialization,
    workloadCount: data.workload_count,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
});

// Helper to upload a single photo
async function uploadPhoto(base64: string, trackingId: string): Promise<string> {
    try {
        const res = await fetch(base64);
        const blob = await res.blob();
        const fileName = `${trackingId}/${uuidv4()}.jpg`;

        const { error } = await supabase.storage
            .from('issue-photos')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('issue-photos')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Photo upload failed:', error);
        throw error;
    }
}

export const api = {
    // Public: Submit Issue
    createIssue: async (report: Report) => {
        // 1. Upload Photos
        const photoUrls = await Promise.all(
            report.photos.map(p => {
                if (p.startsWith('http')) return p; // Already a URL
                return uploadPhoto(p, report.trackingId);
            })
        );

        // 2. Insert Record
        const { error } = await supabase.from('report_issue').insert({
            id: report.id,
            tracking_id: report.trackingId,
            title: report.title,
            description: report.description,
            category: report.category,
            sector: report.sector,
            issue_type: report.issueType,
            panchayat: report.panchayat,
            address: report.address,
            lat: report.lat,
            lng: report.lng,
            urgency: report.urgency,
            photos: photoUrls,
            status: report.status,
            contact_phone: report.contact?.phone,
            contact_email: report.contact?.email,
            anonymous: report.anonymous,
            assigned_team: report.assignedTeam,
            history: report.history,
            created_at: report.createdAt,
            updated_at: report.updatedAt,
            last_status_update_at: new Date().toISOString(),
        });

        if (error) throw error;
        return { ...report, photos: photoUrls };
    },

    // Public: Track Issue (RPC for security)
    getIssueByTrackingId: async (trackingId: string): Promise<Report | null> => {
        const { data, error } = await supabase
            .rpc('get_issue_by_tracking_id', { search_id: trackingId });

        if (error) {
            console.error('Error fetching issue:', error);
            return null;
        }

        if (!data || data.length === 0) return null;
        return mapToReport(data[0]);
    },

    // Admin: Get All Issues
    getAllIssues: async (): Promise<Report[]> => {
        const { data, error } = await supabase
            .from('report_issue')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(mapToReport);
    },

    // Public: Get Recent Issues (Secure RPC)
    getPublicIssues: async (): Promise<Report[]> => {
        const { data, error } = await supabase
            .rpc('get_public_reports');

        if (error) {
            console.error('Error fetching public issues:', error);
            return [];
        }
        return (data || []).map(mapToReport);
    },

    // Admin: Generic Update
    updateIssue: async (id: string, updates: Partial<Report>) => {
        const dbUpdates: Partial<DBReport> = {
            updated_at: new Date().toISOString(),
        };

        if (updates.status) {
            dbUpdates.status = updates.status;
            dbUpdates.last_status_update_at = new Date().toISOString();
            // Track completion timestamp
            if (updates.status === 'completed' || updates.status === 'resolved') {
                dbUpdates.completed_at = new Date().toISOString();
            }
        }
        if (updates.history) dbUpdates.history = updates.history;
        if (updates.assignedTeam) dbUpdates.assigned_team = updates.assignedTeam;
        if (updates.internalNotes) dbUpdates.internal_notes = updates.internalNotes;

        const { error } = await supabase
            .from('report_issue')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    },

    // Team Features
    getTeams: async (): Promise<TeamEntity[]> => {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    assignTeam: async (issueId: string, teamId: string) => {
        const { error } = await supabase
            .from('report_issue')
            .update({
                assigned_team_id: teamId,
                assigned_at: new Date().toISOString(),
                last_status_update_at: new Date().toISOString(),
                status: 'assigned'
            })
            .eq('id', issueId);

        if (error) throw error;
    },

    getTeamIssues: async (): Promise<Report[]> => {
        const { data, error } = await supabase
            .from('report_issue')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapToReport);
    },

    // ============================================================
    // AUTOMATION API FUNCTIONS (all fail-safe)
    // ============================================================

    /**
     * Feature 1: Mark a report as "underReview" when admin first opens it.
     * Fail-safe — silently ignores errors.
     */
    markUnderReview: async (id: string): Promise<void> => {
        try {
            await supabase
                .from('report_issue')
                .update({
                    status: 'underReview',
                    last_status_update_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .in('status', ['notTaken', 'submitted']); // Only transition from initial statuses
        } catch (err) {
            console.warn('[Automation] markUnderReview failed:', err);
        }
    },

    /**
     * Feature 2: Run escalation check via DB function.
     * Returns number of affected records, or 0 on failure.
     */
    runEscalationCheck: async (): Promise<number> => {
        try {
            const { data, error } = await supabase.rpc('check_escalation');
            if (error) throw error;
            return data ?? 0;
        } catch (err) {
            console.warn('[Automation] runEscalationCheck failed:', err);
            return 0;
        }
    },

    /**
     * Feature 3: Recalculate priority for a single report via DB function.
     * Returns priority info or null on failure.
     */
    recalculatePriority: async (reportId: string): Promise<{ score: number; level: string } | null> => {
        try {
            const { data, error } = await supabase.rpc('calculate_priority', { report_id: reportId });
            if (error) throw error;
            return data;
        } catch (err) {
            console.warn('[Automation] recalculatePriority failed:', err);
            return null;
        }
    },

    /**
     * Feature 3: Recalculate all open priorities via DB function.
     */
    recalculateAllPriorities: async (): Promise<number> => {
        try {
            const { data, error } = await supabase.rpc('recalculate_all_priorities');
            if (error) throw error;
            return data ?? 0;
        } catch (err) {
            console.warn('[Automation] recalculateAllPriorities failed:', err);
            return 0;
        }
    },

    /**
     * Feature 4: Check for duplicate complaints near a location.
     * Returns the duplicate report info if found, null otherwise.
     */
    checkDuplicate: async (lat: number, lng: number, category: string): Promise<{
        duplicateId: string;
        duplicateTrackingId: string;
        duplicateTitle: string;
        distanceMeters: number;
        currentSupportCount: number;
    } | null> => {
        try {
            const { data, error } = await supabase.rpc('find_duplicate', {
                p_lat: lat,
                p_lng: lng,
                p_category: category,
            });
            if (error) throw error;
            if (!data || data.length === 0) return null;

            const d = data[0];
            return {
                duplicateId: d.duplicate_id,
                duplicateTrackingId: d.duplicate_tracking_id,
                duplicateTitle: d.duplicate_title,
                distanceMeters: d.distance_meters,
                currentSupportCount: d.current_support_count,
            };
        } catch (err) {
            console.warn('[Automation] checkDuplicate failed:', err);
            return null;
        }
    },

    /**
     * Feature 4: Increment support count for an existing complaint.
     */
    incrementSupport: async (reportId: string): Promise<void> => {
        try {
            const { error } = await supabase.rpc('increment_support', { p_report_id: reportId });
            if (error) throw error;
        } catch (err) {
            console.warn('[Automation] incrementSupport failed:', err);
        }
    },

    /**
     * Feature 5: Calculate resolution time via DB function.
     */
    calculateResolutionTime: async (reportId: string): Promise<number | null> => {
        try {
            const { data, error } = await supabase.rpc('calculate_resolution_time', { p_report_id: reportId });
            if (error) throw error;
            return data;
        } catch (err) {
            console.warn('[Automation] calculateResolutionTime failed:', err);
            return null;
        }
    },

    // ============================================================
    // WORKER MANAGEMENT (Feature 6)
    // ============================================================

    /** Get all workers */
    getWorkers: async (): Promise<Worker[]> => {
        try {
            const { data, error } = await supabase
                .from('workers')
                .select('*')
                .order('name');
            if (error) throw error;
            return (data || []).map(mapToWorker);
        } catch (err) {
            console.warn('[Automation] getWorkers failed:', err);
            return [];
        }
    },

    /** Auto-assign the best available worker via DB function */
    autoAssignWorker: async (reportId: string): Promise<{
        workerId: string;
        workerName: string;
        workerEmail: string;
    } | null> => {
        try {
            const { data, error } = await supabase.rpc('auto_assign_worker', { p_report_id: reportId });
            if (error) throw error;
            if (data?.error) {
                console.warn('[Automation] autoAssignWorker:', data.error);
                return null;
            }
            return {
                workerId: data.worker_id,
                workerName: data.worker_name,
                workerEmail: data.worker_email,
            };
        } catch (err) {
            console.warn('[Automation] autoAssignWorker failed:', err);
            return null;
        }
    },

    /** Manually assign a specific worker to a report */
    assignWorker: async (reportId: string, workerId: string): Promise<void> => {
        try {
            // Update the report
            const { error: reportError } = await supabase
                .from('report_issue')
                .update({
                    assigned_worker_id: workerId,
                    assigned_at: new Date().toISOString(),
                    last_status_update_at: new Date().toISOString(),
                    status: 'inProgress',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', reportId);
            if (reportError) throw reportError;

            // Increment worker workload
            const { error: workerError } = await supabase.rpc('increment_workload', { worker_id: workerId });
            if (workerError) {
                // Non-critical — log and continue
                console.warn('[Automation] increment_workload failed:', workerError);
            }
        } catch (err) {
            console.warn('[Automation] assignWorker failed:', err);
            throw err; // Rethrow — assignment is a user-initiated action
        }
    },
};

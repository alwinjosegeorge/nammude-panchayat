import { supabase } from './supabase';
import { Report, Status, InternalNote, TeamEntity, DBReport, Category, Urgency, Team } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper to convert DB (snake_case) to Frontend (camelCase)
// Helper to convert DB (snake_case) to Frontend (camelCase)
const mapToReport = (data: DBReport): Report => ({
    id: data.id,
    trackingId: data.tracking_id,
    title: data.title,
    description: data.description,
    category: data.category as Category, // Cast to Category
    panchayat: data.panchayat,
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    urgency: data.urgency as Urgency, // Cast to Urgency
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

        if (updates.status) dbUpdates.status = updates.status;
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
};

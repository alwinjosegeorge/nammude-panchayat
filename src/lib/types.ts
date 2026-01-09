export type Category =
  | 'brokenRoad'
  | 'streetlight'
  | 'waterLeak'
  | 'drainage'
  | 'garbage'
  | 'electricity'
  | 'publicProperty'
  | 'other';

export type Urgency = 'normal' | 'high' | 'urgent';

export type Status =
  | 'submitted'
  | 'received'
  | 'assigned'
  | 'inProgress'
  | 'resolved'
  | 'closed';

export type Team =
  | 'roads'
  | 'water'
  | 'electricity'
  | 'sanitation'
  | 'general';

export interface TimelineEntry {
  status: Status;
  timestamp: string;
  note?: string;
  actor?: string;
}

export interface Report {
  id: string;
  trackingId: string;
  category: Category;
  title: string;
  description: string;
  panchayat: string;
  address: string;
  lat?: number;
  lng?: number;
  urgency: Urgency;
  photos: string[];
  contact?: {
    phone?: string;
    email?: string;
  };
  anonymous: boolean;
  status: Status;
  assignedTeam?: Team; // Legacy or Display name
  assignedTeamId?: string; // Foreign Key
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  history: TimelineEntry[];
  internalNotes?: InternalNote[];
}

export interface TeamEntity {
  id: string;
  name: string;
  email: string;
  userId?: string;
}

export interface InternalNote {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

export interface LocationData {
  lat?: number;
  lng?: number;
  address: string;
  panchayat: string;
  possiblePanchayats?: string[];
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'staff';
}

export const categoryToTeam: Record<Category, Team> = {
  brokenRoad: 'roads',
  streetlight: 'electricity',
  waterLeak: 'water',
  drainage: 'sanitation',
  garbage: 'sanitation',
  electricity: 'electricity',
  publicProperty: 'general',
  other: 'general',
};

export const categoryIcons: Record<Category, string> = {
  brokenRoad: '🛣️',
  streetlight: '💡',
  waterLeak: '💧',
  drainage: '🌊',
  garbage: '🗑️',
  electricity: '⚡',
  publicProperty: '🏛️',
  other: '📋',
};

export interface DBReport {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: string; // Database type might be text, casting to Category in map function
  panchayat: string;
  address: string;
  lat?: number;
  lng?: number;
  urgency: string; // Database text
  photos: string[];
  status: string;
  contact_phone?: string;
  contact_email?: string;
  anonymous: boolean;
  assigned_team?: string;
  assigned_team_id?: string;
  history: TimelineEntry[]; // JSONB in DB
  internal_notes?: InternalNote[]; // JSONB
  created_at: string;
  updated_at: string;
}

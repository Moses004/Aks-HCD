import { getSupabaseClient, isSupabaseReady } from '../lib/supabase';
import { HCDActivity, AuditLog } from '../types';

export interface SupabaseConnectionStatus {
  connected: boolean;
  message: string;
  hasTables?: boolean;
}

// Convert application HCDActivity to Supabase row format
const activityToRow = (a: HCDActivity) => ({
  id: a.id,
  lga_id: a.lgaId,
  lga_name: a.lgaName,
  title: a.title,
  pillar: a.pillar,
  sub_category: a.subCategory,
  community: a.community,
  lat: a.coordinates?.lat || 5.0377,
  lng: a.coordinates?.lng || 7.9128,
  beneficiaries_total: a.beneficiariesTotal || 0,
  beneficiaries_male: a.beneficiariesMale || 0,
  beneficiaries_female: a.beneficiariesFemale || 0,
  youth_beneficiaries: a.youthBeneficiaries || 0,
  budget_ngn: a.budgetNgn || 0,
  start_date: a.startDate || null,
  completion_date: a.completionDate || null,
  lead_officer: a.leadOfficer || '',
  officer_contact: a.officerContact || '',
  status: a.status || 'DRAFT',
  overall_progress: a.overallProgress || 0,
  milestones: a.milestones || [],
  media_assets: a.mediaAssets || [],
  submission_notes: a.submissionNotes || null,
  rejection_reason: a.rejectionReason || null,
  reviewed_by: a.reviewedBy || null,
  reviewed_at: a.reviewedAt || null,
  created_at: a.createdAt || new Date().toISOString(),
  updated_at: a.updatedAt || new Date().toISOString(),
});

// Convert Supabase row format to application HCDActivity
const rowToActivity = (r: any): HCDActivity => ({
  id: r.id,
  lgaId: r.lga_id,
  lgaName: r.lga_name,
  title: r.title,
  pillar: r.pillar,
  subCategory: r.sub_category || '',
  community: r.community || '',
  coordinates: {
    lat: Number(r.lat) || 5.0377,
    lng: Number(r.lng) || 7.9128,
  },
  beneficiariesTotal: Number(r.beneficiaries_total) || 0,
  beneficiariesMale: Number(r.beneficiaries_male) || 0,
  beneficiariesFemale: Number(r.beneficiaries_female) || 0,
  youthBeneficiaries: Number(r.youth_beneficiaries) || 0,
  budgetNgn: Number(r.budget_ngn) || 0,
  startDate: r.start_date || '',
  completionDate: r.completion_date || '',
  leadOfficer: r.lead_officer || '',
  officerContact: r.officer_contact || '',
  status: r.status || 'DRAFT',
  overallProgress: Number(r.overall_progress) || 0,
  milestones: r.milestones || [],
  mediaAssets: r.media_assets || [],
  submissionNotes: r.submission_notes || '',
  rejectionReason: r.rejection_reason || '',
  reviewedBy: r.reviewed_by || '',
  reviewedAt: r.reviewed_at || '',
  createdAt: r.created_at || new Date().toISOString(),
  updatedAt: r.updated_at || new Date().toISOString(),
  syncStatus: 'synced',
});

export const supabaseService = {
  async testConnection(): Promise<SupabaseConnectionStatus> {
    if (!isSupabaseReady()) {
      return {
        connected: false,
        message: 'Supabase Anon Key is not configured yet.',
      };
    }
    const client = getSupabaseClient();
    if (!client) {
      return { connected: false, message: 'Could not initialize Supabase client.' };
    }

    try {
      const { data, error } = await client.from('activities').select('id').limit(1);
      if (error) {
        if (
          error.code === '42P01' || 
          error.code === 'PGRST204' || 
          error.code === 'PGRST200' ||
          error.message?.toLowerCase().includes('schema cache') ||
          error.message?.toLowerCase().includes('relation') ||
          error.message?.toLowerCase().includes('table')
        ) {
          return {
            connected: true,
            hasTables: false,
            message: 'Connected to Supabase! The "activities" table has not been created yet. Copy and run the SQL migration below in your Supabase SQL Editor.',
          };
        }
        return {
          connected: false,
          message: `Supabase Error: ${error.message} (${error.code || 'API error'})`,
        };
      }
      return {
        connected: true,
        hasTables: true,
        message: 'Successfully connected to Supabase cloud database!',
      };
    } catch (err: any) {
      return {
        connected: false,
        message: err.message || 'Unknown network error connecting to Supabase.',
      };
    }
  },

  async fetchActivities(): Promise<HCDActivity[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('activities')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchActivities error:', error.message);
        return null;
      }
      if (!data || data.length === 0) return null;
      return data.map(rowToActivity);
    } catch (err) {
      console.warn('Supabase fetchActivities network exception:', err);
      return null;
    }
  },

  async upsertActivity(activity: HCDActivity): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const row = activityToRow(activity);
      const { error } = await client.from('activities').upsert(row);
      if (error) {
        console.warn('Supabase upsertActivity error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase upsertActivity network exception:', err);
      return false;
    }
  },

  async deleteActivity(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('activities').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteActivity error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteActivity network exception:', err);
      return false;
    }
  },

  async insertAuditLog(log: AuditLog): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('audit_logs').insert({
        id: log.id,
        timestamp: log.timestamp,
        activity_id: log.activityId || null,
        activity_title: log.activityTitle || null,
        lga_id: log.lgaId || null,
        performed_by: log.performedBy,
        role: log.role,
        action: log.action,
        notes: log.notes || null,
      });
      if (error) {
        console.warn('Supabase insertAuditLog error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase insertAuditLog network exception:', err);
      return false;
    }
  },

  async recordPtrTestLog(
    vector: string,
    passed: boolean,
    summary: string,
    payload: unknown,
    executedBy: string
  ): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('ptr_test_logs').insert({
        id: `ptr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        test_vector: vector,
        passed,
        summary,
        payload,
        executed_by: executedBy,
      });
      if (error) {
        console.warn('Supabase recordPtrTestLog error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase recordPtrTestLog network exception:', err);
      return false;
    }
  },

  /**
   * Supabase Storage upload for field media, biometric sheets, and photo evidence
   */
  async uploadEvidenceFile(
    file: File | Blob,
    fileName: string,
    lgaId: string,
    activityId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${lgaId}/${activityId}/${Date.now()}_${cleanFileName}`;

      const { data, error } = await client.storage
        .from('hcd-evidence-vault')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase Storage upload error:', error.message);
        return { success: false, error: error.message };
      }

      // Retrieve public URL
      const { data: urlData } = client.storage
        .from('hcd-evidence-vault')
        .getPublicUrl(data.path);

      return { success: true, url: urlData.publicUrl };
    } catch (err: any) {
      console.warn('Supabase Storage upload exception:', err);
      return { success: false, error: err.message || 'File upload failed' };
    }
  },

  /**
   * Supabase Realtime Subscription for Activities Table
   */
  subscribeToActivities(callbacks: {
    onInsert: (activity: HCDActivity) => void;
    onUpdate: (activity: HCDActivity) => void;
    onDelete: (id: string) => void;
  }): () => void {
    const client = getSupabaseClient();
    if (!client) {
      return () => {};
    }

    try {
      const channel = client
        .channel('public:activities')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activities' },
          (payload) => {
            if (payload.new) {
              callbacks.onInsert(rowToActivity(payload.new));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'activities' },
          (payload) => {
            if (payload.new) {
              callbacks.onUpdate(rowToActivity(payload.new));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'activities' },
          (payload) => {
            if (payload.old && payload.old.id) {
              callbacks.onDelete(payload.old.id);
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Failed to subscribe to Supabase Realtime activities:', err);
      return () => {};
    }
  },

  /**
   * Supabase Realtime Subscription for Audit Logs
   */
  subscribeToAuditLogs(onInsert: (log: AuditLog) => void): () => void {
    const client = getSupabaseClient();
    if (!client) {
      return () => {};
    }

    try {
      const channel = client
        .channel('public:audit_logs')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'audit_logs' },
          (payload) => {
            if (payload.new) {
              const r = payload.new;
              onInsert({
                id: r.id,
                timestamp: r.timestamp,
                activityId: r.activity_id || undefined,
                activityTitle: r.activity_title || undefined,
                lgaId: r.lga_id || undefined,
                performedBy: r.performed_by,
                role: r.role,
                action: r.action,
                notes: r.notes || undefined,
              });
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Failed to subscribe to Supabase Realtime audit logs:', err);
      return () => {};
    }
  },
};

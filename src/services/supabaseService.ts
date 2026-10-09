import { getSupabaseClient, isSupabaseReady } from '../lib/supabase';
import { HCDActivity, AuditLog, UserSession } from '../types';

export interface SupabaseConnectionStatus {
  connected: boolean;
  message: string;
  hasTables?: boolean;
  hasFunctionGrants?: boolean;
}

export type FetchActivitiesResult =
  | { status: 'SUCCESS'; data: HCDActivity[]; count: number }
  | { status: 'EMPTY'; data: []; count: 0 }
  | { status: 'AUTH_REQUIRED'; error: string; code?: string }
  | { status: 'SCHEMA_MISMATCH'; error: string; code?: string; diagnostic?: string }
  | { status: 'NETWORK_ERROR'; error: string }
  | { status: 'SERVER_ERROR'; error: string; code?: string };

export interface DatabaseOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: string;
}

// Convert application HCDActivity to Supabase row format
export const activityToRow = (a: HCDActivity, createdByUserId?: string) => ({
  id: a.id,
  lga_id: a.lgaId,
  lga_name: a.lgaName,
  title: a.title,
  pillar: a.pillar,
  sub_category: a.subCategory || '',
  community: a.community || '',
  lat: a.coordinates?.lat ?? 5.0377,
  lng: a.coordinates?.lng ?? 7.9128,
  beneficiaries_total: Math.max(0, Number(a.beneficiariesTotal) || 0),
  beneficiaries_male: Math.max(0, Number(a.beneficiariesMale) || 0),
  beneficiaries_female: Math.max(0, Number(a.beneficiariesFemale) || 0),
  youth_beneficiaries: Math.max(0, Number(a.youthBeneficiaries) || 0),
  budget_ngn: Math.max(0, Number(a.budgetNgn) || 0),
  start_date: a.startDate || null,
  completion_date: a.completionDate || null,
  lead_officer: a.leadOfficer || '',
  officer_contact: a.officerContact || '',
  status: a.status || 'DRAFT',
  overall_progress: Math.min(100, Math.max(0, Number(a.overallProgress) || 0)),
  milestones: a.milestones || [],
  media_assets: a.mediaAssets || [],
  submission_notes: a.submissionNotes || null,
  rejection_reason: a.rejectionReason || null,
  reviewed_by: a.reviewedBy || null,
  reviewed_at: a.reviewedAt || null,
  created_by: createdByUserId || undefined,
  created_at: a.createdAt || new Date().toISOString(),
  updated_at: a.updatedAt || new Date().toISOString(),
});

// Convert Supabase row format to application HCDActivity
export const rowToActivity = (r: any): HCDActivity => ({
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
  milestones: Array.isArray(r.milestones) ? r.milestones : [],
  mediaAssets: Array.isArray(r.media_assets) ? r.media_assets : [],
  submissionNotes: r.submission_notes || '',
  rejectionReason: r.rejection_reason || '',
  reviewedBy: r.reviewed_by || '',
  reviewedAt: r.reviewed_at || '',
  createdAt: r.created_at || new Date().toISOString(),
  updatedAt: r.updated_at || new Date().toISOString(),
  syncStatus: 'synced',
});

export const supabaseService = {
  /**
   * Diagnostic test verifying connection, tables, and function execution grants
   */
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
          error.message?.toLowerCase().includes('schema cache')
        ) {
          return {
            connected: true,
            hasTables: false,
            message: 'Connected to Supabase! The "activities" table has not been created yet. Copy and run the SQL migration script in your Supabase SQL Editor.',
          };
        }
        if (error.code === '42501' && error.message?.includes('aks_hcd_current_lga')) {
          return {
            connected: true,
            hasTables: true,
            hasFunctionGrants: false,
            message: 'Connected to Supabase! The tables exist, but EXECUTE permission on helper function aks_hcd_current_lga() must be granted. Run migration 20261008_fix_security_and_grants.sql in Supabase SQL Editor.',
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
        hasFunctionGrants: true,
        message: 'Successfully connected to Supabase cloud database with all permissions active!',
      };
    } catch (err: any) {
      return {
        connected: false,
        message: err.message || 'Unknown network error connecting to Supabase.',
      };
    }
  },

  /**
   * Distinguishes SUCCESS (populated), EMPTY (0 records), AUTH_REQUIRED, SCHEMA_MISMATCH, NETWORK_ERROR
   */
  async fetchActivities(userSession?: UserSession): Promise<FetchActivitiesResult> {
    const client = getSupabaseClient();
    if (!client) {
      return { status: 'NETWORK_ERROR', error: 'Supabase client not initialized' };
    }

    try {
      let query = client.from('activities').select('*');

      // If user is public guest, only query published activities
      if (!userSession || userSession.role === 'public') {
        query = query.eq('status', 'PUBLISHED');
      } else if (userSession.role === 'lga_admin' && userSession.assignedLgaId) {
        // LGA desk officer queries their LGA activities or published activities
        query = query.or(`lga_id.eq.${userSession.assignedLgaId},status.eq.PUBLISHED`);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchActivities error:', error);
        
        // Check for permission denied on helper function (42501)
        if (error.code === '42501' && error.message?.includes('aks_hcd_current_lga')) {
          return {
            status: 'SCHEMA_MISMATCH',
            error: error.message,
            code: error.code,
            diagnostic: 'PostgreSQL error 42501: aks_hcd_current_lga requires GRANT EXECUTE ON FUNCTION public.aks_hcd_current_lga() TO anon, authenticated;',
          };
        }

        if (error.code === 'PGRST301' || error.code === '401' || error.message?.includes('JWT')) {
          return { status: 'AUTH_REQUIRED', error: error.message, code: error.code };
        }

        if (error.code === '42P01' || error.message?.includes('schema cache')) {
          return { status: 'SCHEMA_MISMATCH', error: error.message, code: error.code };
        }

        return { status: 'SERVER_ERROR', error: error.message, code: error.code };
      }

      if (!data || data.length === 0) {
        return { status: 'EMPTY', data: [], count: 0 };
      }

      return {
        status: 'SUCCESS',
        data: data.map(rowToActivity),
        count: data.length,
      };
    } catch (err: any) {
      console.warn('Supabase fetchActivities network exception:', err);
      return {
        status: 'NETWORK_ERROR',
        error: err.message || 'Network connectivity error while contacting Supabase.',
      };
    }
  },

  /**
   * Insert new activity with explicit verification of returned committed row
   */
  async insertActivity(
    activity: HCDActivity,
    userSession?: UserSession
  ): Promise<DatabaseOperationResult<HCDActivity>> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const row = activityToRow(activity, userSession?.id);
      const { data, error } = await client
        .from('activities')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.warn('Supabase insertActivity error:', error);
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        };
      }

      const committed = rowToActivity(data);
      return { success: true, data: committed };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to insert activity into Supabase',
      };
    }
  },

  /**
   * Update existing activity with explicit verification
   */
  async updateActivity(
    id: string,
    updates: Partial<HCDActivity>
  ): Promise<DatabaseOperationResult<HCDActivity>> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const updateRow: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateRow.title = updates.title;
      if (updates.pillar !== undefined) updateRow.pillar = updates.pillar;
      if (updates.subCategory !== undefined) updateRow.sub_category = updates.subCategory;
      if (updates.community !== undefined) updateRow.community = updates.community;
      if (updates.coordinates !== undefined) {
        updateRow.lat = updates.coordinates.lat;
        updateRow.lng = updates.coordinates.lng;
      }
      if (updates.beneficiariesTotal !== undefined) updateRow.beneficiaries_total = updates.beneficiariesTotal;
      if (updates.beneficiariesMale !== undefined) updateRow.beneficiaries_male = updates.beneficiariesMale;
      if (updates.beneficiariesFemale !== undefined) updateRow.beneficiaries_female = updates.beneficiariesFemale;
      if (updates.youthBeneficiaries !== undefined) updateRow.youth_beneficiaries = updates.youthBeneficiaries;
      if (updates.budgetNgn !== undefined) updateRow.budget_ngn = updates.budgetNgn;
      if (updates.startDate !== undefined) updateRow.start_date = updates.startDate || null;
      if (updates.completionDate !== undefined) updateRow.completion_date = updates.completionDate || null;
      if (updates.leadOfficer !== undefined) updateRow.lead_officer = updates.leadOfficer;
      if (updates.officerContact !== undefined) updateRow.officer_contact = updates.officerContact;
      if (updates.status !== undefined) updateRow.status = updates.status;
      if (updates.overallProgress !== undefined) updateRow.overall_progress = updates.overallProgress;
      if (updates.milestones !== undefined) updateRow.milestones = updates.milestones;
      if (updates.mediaAssets !== undefined) updateRow.media_assets = updates.mediaAssets;
      if (updates.submissionNotes !== undefined) updateRow.submission_notes = updates.submissionNotes;
      if (updates.rejectionReason !== undefined) updateRow.rejection_reason = updates.rejectionReason;
      if (updates.reviewedBy !== undefined) updateRow.reviewed_by = updates.reviewedBy;
      if (updates.reviewedAt !== undefined) updateRow.reviewed_at = updates.reviewedAt;

      const { data, error } = await client
        .from('activities')
        .update(updateRow)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase updateActivity error:', error);
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        };
      }

      return { success: true, data: rowToActivity(data) };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to update activity in Supabase',
      };
    }
  },

  /**
   * Delete activity from Supabase
   */
  async deleteActivity(id: string): Promise<DatabaseOperationResult> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { error } = await client.from('activities').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteActivity error:', error);
        return {
          success: false,
          error: error.message,
          code: error.code,
        };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to delete activity from Supabase',
      };
    }
  },

  /**
   * Upsert activity (used during initial migration / sync reconciliation)
   */
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

  /**
   * Insert audit log entry directly into public.audit_logs
   */
  async insertAuditLog(log: AuditLog): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('audit_logs').insert({
        id: log.id,
        timestamp: log.timestamp || new Date().toISOString(),
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

  /**
   * Fetch audit logs for current user scope
   */
  async fetchAuditLogs(lgaId?: string): Promise<AuditLog[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    try {
      let query = client.from('audit_logs').select('*');
      if (lgaId) {
        query = query.eq('lga_id', lgaId);
      }
      const { data, error } = await query.order('timestamp', { ascending: false }).limit(200);
      if (error || !data) return [];

      return data.map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        activityId: r.activity_id || undefined,
        activityTitle: r.activity_title || undefined,
        lgaId: r.lga_id || undefined,
        performedBy: r.performed_by,
        role: r.role,
        action: r.action,
        notes: r.notes || undefined,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Record PTR verification ledger log
   */
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
   * Secure upload to private storage bucket 'hcd-evidence-vault' with signed URL generation
   */
  async uploadEvidenceFile(
    file: File | Blob,
    fileName: string,
    lgaId: string,
    activityId: string
  ): Promise<{ success: boolean; storagePath?: string; signedUrl?: string; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not available' };
    }

    try {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${lgaId}/${activityId}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await client.storage
        .from('hcd-evidence-vault')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase Storage upload error:', error.message);
        return { success: false, error: error.message };
      }

      // Generate temporary signed URL (valid for 1 hour) for private file inspection
      const { data: signedData, error: signErr } = await client.storage
        .from('hcd-evidence-vault')
        .createSignedUrl(data.path, 3600);

      return {
        success: true,
        storagePath: data.path,
        signedUrl: signedData?.signedUrl,
      };
    } catch (err: any) {
      console.warn('Supabase Storage upload exception:', err);
      return { success: false, error: err.message || 'File upload failed' };
    }
  },

  /**
   * Get a temporary signed URL for viewing private evidence files
   */
  async getSignedUrl(storagePath: string, expiresInSeconds: number = 3600): Promise<string | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client.storage
        .from('hcd-evidence-vault')
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
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
    if (!client) return () => {};

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
    if (!client) return () => {};

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

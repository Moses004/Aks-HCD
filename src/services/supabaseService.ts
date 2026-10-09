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

export interface AuditLogResult {
  success: boolean;
  persistedToCloud: boolean;
  error?: string;
}

export interface FetchAuditLogsResult {
  success: boolean;
  data: AuditLog[];
  error?: string;
}

// Convert application HCDActivity to Supabase row format
export const activityToRow = (
  a: HCDActivity,
  createdByUserId?: string,
  updatedByUserId?: string
) => ({
  id: a.id,
  lga_id: a.lgaId,
  lga_name: a.lgaName,
  title: a.title,
  pillar: a.pillar,
  sub_category: a.subCategory || '',
  community: a.community || '',
  // Preserve null coordinates if unknown - do not invent default values
  lat: a.coordinates?.lat !== undefined ? a.coordinates.lat : null,
  lng: a.coordinates?.lng !== undefined ? a.coordinates.lng : null,
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
  created_by: createdByUserId || a.createdBy || null,
  updated_by: updatedByUserId || a.updatedBy || null,
  attendance_registry_url: a.attendanceRegistryUrl || null,
  attendance_sheet_file_name: a.attendanceSheetFileName || null,
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
  coordinates:
    r.lat !== null && r.lng !== null && !isNaN(Number(r.lat)) && !isNaN(Number(r.lng))
      ? { lat: Number(r.lat), lng: Number(r.lng) }
      : undefined,
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
  createdBy: r.created_by || undefined,
  updatedBy: r.updated_by || undefined,
  attendanceRegistryUrl: r.attendance_registry_url || undefined,
  attendanceSheetFileName: r.attendance_sheet_file_name || undefined,
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
            message: 'Connected to Supabase! The "activities" table has not been created yet.',
          };
        }
        if (error.code === '42501' && error.message?.includes('aks_hcd_current_lga')) {
          return {
            connected: true,
            hasTables: true,
            hasFunctionGrants: false,
            message: 'Connected to Supabase! Function grants needed for aks_hcd_current_lga().',
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
        
        if (error.code === '42501' && error.message?.includes('aks_hcd_current_lga')) {
          return {
            status: 'SCHEMA_MISMATCH',
            error: error.message,
            code: error.code,
            diagnostic: 'PostgreSQL error 42501: aks_hcd_current_lga requires execute grant',
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
      const row = activityToRow(activity, userSession?.id, userSession?.id);
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
    updates: Partial<HCDActivity>,
    userSession?: UserSession
  ): Promise<DatabaseOperationResult<HCDActivity>> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const updateRow: Record<string, any> = {
        updated_at: new Date().toISOString(),
        updated_by: userSession?.id || null,
      };

      if (updates.title !== undefined) updateRow.title = updates.title;
      if (updates.pillar !== undefined) updateRow.pillar = updates.pillar;
      if (updates.subCategory !== undefined) updateRow.sub_category = updates.subCategory;
      if (updates.community !== undefined) updateRow.community = updates.community;
      if (updates.coordinates !== undefined) {
        updateRow.lat = updates.coordinates ? updates.coordinates.lat : null;
        updateRow.lng = updates.coordinates ? updates.coordinates.lng : null;
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
      if (updates.attendanceRegistryUrl !== undefined) updateRow.attendance_registry_url = updates.attendanceRegistryUrl;
      if (updates.attendanceSheetFileName !== undefined) updateRow.attendance_sheet_file_name = updates.attendanceSheetFileName;

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
   * Delete activity from Supabase with verification
   */
  async deleteActivity(id: string): Promise<DatabaseOperationResult> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { error, count } = await client
        .from('activities')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteActivity error:', error);
        return {
          success: false,
          error: error.message,
          code: error.code,
        };
      }

      if (count === 0) {
        return {
          success: false,
          error: 'No matching record was deleted. The record may have already been removed or deletion was unauthorized.',
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
   * Upsert activity (insert or update on conflict) with verified session
   */
  async upsertActivity(
    activity: HCDActivity,
    userSession?: UserSession
  ): Promise<DatabaseOperationResult<HCDActivity>> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const row = activityToRow(activity, userSession?.id, userSession?.id);
      const { data, error } = await client
        .from('activities')
        .upsert(row)
        .select()
        .single();

      if (error) {
        console.warn('Supabase upsertActivity error:', error);
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
        error: err.message || 'Failed to upsert activity in Supabase',
      };
    }
  },

  /**
   * Insert audit log entry directly into public.audit_logs with authenticated actor ID
   */
  async insertAuditLog(log: AuditLog, userSession?: UserSession): Promise<AuditLogResult> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, persistedToCloud: false, error: 'Supabase client not initialized' };
    }

    try {
      const { error } = await client.from('audit_logs').insert({
        id: log.id,
        timestamp: log.timestamp || new Date().toISOString(),
        activity_id: log.activityId || null,
        activity_title: log.activityTitle || null,
        lga_id: log.lgaId || null,
        performed_by: userSession?.name || log.performedBy,
        actor_user_id: userSession?.isAuthenticated ? userSession.id : log.actorUserId || null,
        role: userSession?.role || log.role,
        action: log.action,
        notes: log.notes || null,
      });

      if (error) {
        console.warn('Supabase insertAuditLog error:', error.message);
        return { success: false, persistedToCloud: false, error: error.message };
      }
      return { success: true, persistedToCloud: true };
    } catch (err: any) {
      console.warn('Supabase insertAuditLog exception:', err);
      return { success: false, persistedToCloud: false, error: err.message || 'Network error' };
    }
  },

  /**
   * Fetch audit logs for current user scope with explicit error handling
   */
  async fetchAuditLogs(lgaId?: string): Promise<FetchAuditLogsResult> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, data: [], error: 'Supabase client not initialized' };
    }

    try {
      let query = client.from('audit_logs').select('*');
      if (lgaId) {
        query = query.eq('lga_id', lgaId);
      }
      const { data, error } = await query.order('timestamp', { ascending: false }).limit(200);

      if (error) {
        return { success: false, data: [], error: error.message };
      }

      if (!data) {
        return { success: true, data: [] };
      }

      const mapped: AuditLog[] = data.map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        activityId: r.activity_id || undefined,
        activityTitle: r.activity_title || undefined,
        lgaId: r.lga_id || undefined,
        performedBy: r.performed_by,
        actorUserId: r.actor_user_id || undefined,
        role: r.role,
        action: r.action,
        notes: r.notes || undefined,
        persistedToCloud: true,
      }));

      return { success: true, data: mapped };
    } catch (err: any) {
      return { success: false, data: [], error: err.message || 'Failed to fetch audit logs' };
    }
  },

  /**
   * Record PTR verification ledger log with authenticated actor identity
   */
  async recordPtrTestLog(
    vector: string,
    passed: boolean,
    summary: string,
    payload: unknown,
    userSession: UserSession
  ): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Database client unavailable' };
    }

    if (!userSession.isAuthenticated) {
      return { success: false, error: 'Authentication required for PTR ledger recording.' };
    }

    try {
      const { error } = await client.from('ptr_test_logs').insert({
        id: `ptr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        test_vector: vector,
        passed,
        summary,
        payload,
        executed_by: userSession.name,
        executed_by_user_id: userSession.id,
      });

      if (error) {
        console.warn('Supabase recordPtrTestLog error:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'PTR ledger write exception' };
    }
  },

  /**
   * Secure upload to private storage bucket 'hcd-evidence-vault' with signed URL generation
   */
  async uploadEvidenceFile(
    file: File | Blob,
    fileName: string,
    lgaId: string,
    activityId: string,
    userSession?: UserSession
  ): Promise<{ success: boolean; storagePath?: string; signedUrl?: string; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client not available' };
    }

    // Size validation: max 25MB
    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return { success: false, error: 'File exceeds maximum permitted size of 25MB.' };
    }

    // Allowed mime types
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (file.type && !validMimes.includes(file.type)) {
      return { success: false, error: 'Invalid file format. Only JPEG, PNG, WEBP, and PDF documents are accepted.' };
    }

    try {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${lgaId}/${activityId}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await client.storage
        .from('hcd-evidence-vault')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.warn('Supabase Storage upload error:', error.message);
        return { success: false, error: error.message };
      }

      // Generate temporary signed URL (valid for 1 hour) for private file inspection
      const { data: signedData, error: signErr } = await client.storage
        .from('hcd-evidence-vault')
        .createSignedUrl(data.path, 3600);

      if (signErr || !signedData?.signedUrl) {
        return {
          success: false,
          error: signErr?.message || 'File uploaded but failed to generate secure access token.',
        };
      }

      return {
        success: true,
        storagePath: data.path,
        signedUrl: signedData.signedUrl,
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
                actorUserId: r.actor_user_id || undefined,
                role: r.role,
                action: r.action,
                notes: r.notes || undefined,
                persistedToCloud: true,
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

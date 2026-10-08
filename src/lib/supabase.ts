import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default to the provided Supabase project URL and anon public key
export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://refjawgovrmsyigtcfdl.supabase.co';

export const DEFAULT_SUPABASE_ANON_KEY = 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZmphd2dvdnJtc3lpZ3RjZmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODk4ODMsImV4cCI6MjEwNjk2NTg4M30.NJvqlQZVvfn8xfW_FimNWoKy-51Weu-35YqwB6EVBNs';

// Local storage key for runtime anon key input if not supplied in build env
const RUNTIME_ANON_KEY_STORAGE = 'aks_hcd_supabase_anon_key';

export const getSupabaseAnonKey = (): string => {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem(RUNTIME_ANON_KEY_STORAGE) ||
    DEFAULT_SUPABASE_ANON_KEY
  );
};

export const setRuntimeAnonKey = (key: string): void => {
  if (key) {
    localStorage.setItem(RUNTIME_ANON_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(RUNTIME_ANON_KEY_STORAGE);
  }
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const anonKey = getSupabaseAnonKey();
  if (!SUPABASE_URL || !anonKey) {
    return null;
  }
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
};

export const isSupabaseReady = (): boolean => {
  return Boolean(SUPABASE_URL && getSupabaseAnonKey());
};

// Recommended SQL schema for user to execute in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- 1. AKS-HCD Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  lga_id TEXT NOT NULL,
  lga_name TEXT NOT NULL,
  title TEXT NOT NULL,
  pillar TEXT NOT NULL,
  sub_category TEXT,
  community TEXT,
  lat DOUBLE PRECISION DEFAULT 5.0377,
  lng DOUBLE PRECISION DEFAULT 7.9128,
  beneficiaries_total INTEGER DEFAULT 0,
  beneficiaries_male INTEGER DEFAULT 0,
  beneficiaries_female INTEGER DEFAULT 0,
  youth_beneficiaries INTEGER DEFAULT 0,
  budget_ngn NUMERIC DEFAULT 0,
  start_date DATE,
  completion_date DATE,
  lead_officer TEXT,
  officer_contact TEXT,
  status TEXT DEFAULT 'DRAFT',
  overall_progress INTEGER DEFAULT 0,
  milestones JSONB DEFAULT '[]'::jsonb,
  media_assets JSONB DEFAULT '[]'::jsonb,
  submission_notes TEXT,
  rejection_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Audit Trail Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  activity_id TEXT,
  activity_title TEXT,
  lga_id TEXT,
  performed_by TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  notes TEXT
);

-- 3. PTR Security & Math Test Runs
CREATE TABLE IF NOT EXISTS public.ptr_test_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  test_vector TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  executed_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ptr_test_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous / Authenticated policies for read & insert
DROP POLICY IF EXISTS "Allow public read activities" ON public.activities;
CREATE POLICY "Allow public read activities" ON public.activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert activities" ON public.activities FOR INSERT;
CREATE POLICY "Allow public insert activities" ON public.activities FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update activities" ON public.activities FOR UPDATE;
CREATE POLICY "Allow public update activities" ON public.activities FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete activities" ON public.activities;
CREATE POLICY "Allow public delete activities" ON public.activities FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read audit_logs" ON public.audit_logs;
CREATE POLICY "Allow public read audit_logs" ON public.audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert audit_logs" ON public.audit_logs;
CREATE POLICY "Allow public insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read ptr_test_logs" ON public.ptr_test_logs;
CREATE POLICY "Allow public read ptr_test_logs" ON public.ptr_test_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert ptr_test_logs" ON public.ptr_test_logs;
CREATE POLICY "Allow public insert ptr_test_logs" ON public.ptr_test_logs FOR INSERT WITH CHECK (true);

-- 4. Enable Supabase Realtime for instant multi-user synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- 5. Supabase Storage Bucket for Field Evidence & Media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hcd-evidence-vault', 'hcd-evidence-vault', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read evidence vault" ON storage.objects;
CREATE POLICY "Allow public read evidence vault" ON storage.objects 
FOR SELECT USING (bucket_id = 'hcd-evidence-vault');

DROP POLICY IF EXISTS "Allow public upload evidence vault" ON storage.objects;
CREATE POLICY "Allow public upload evidence vault" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'hcd-evidence-vault');
`;

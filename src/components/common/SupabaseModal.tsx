import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Key, 
  ExternalLink, 
  RefreshCw, 
  X, 
  UploadCloud, 
  DownloadCloud, 
  Check, 
  Layers, 
  ShieldCheck,
  Server
} from 'lucide-react';
import { 
  SUPABASE_URL, 
  getSupabaseAnonKey, 
  setRuntimeAnonKey, 
  SUPABASE_SQL_SCHEMA,
  isSupabaseReady
} from '../../lib/supabase';
import { supabaseService, SupabaseConnectionStatus } from '../../services/supabaseService';
import { useData } from '../../context/DataContext';
import { INITIAL_ACTIVITIES } from '../../data/initialActivities';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { activities, auditLogs, syncOfflineQueue } = useData();
  const [anonKey, setAnonKey] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [status, setStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAnonKey(getSupabaseAnonKey());
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setTesting(true);
    try {
      const res = await supabaseService.testConnection();
      setStatus(res);
    } catch (err: any) {
      setStatus({
        connected: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuntimeAnonKey(anonKey.trim());
    setFeedback('Supabase API key saved! Testing connection...');
    await checkStatus();
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handlePushAllToSupabase = async () => {
    setPushing(true);
    setFeedback(null);
    try {
      let count = 0;
      const itemsToPush = activities && activities.length > 0 ? activities : INITIAL_ACTIVITIES;
      for (const act of itemsToPush) {
        const ok = await supabaseService.upsertActivity(act);
        if (ok) count++;
      }
      for (const log of auditLogs) {
        await supabaseService.insertAuditLog(log);
      }
      setFeedback(`Successfully migrated & pushed ${count} activities and ${auditLogs.length} audit logs to Supabase!`);
    } catch (err: any) {
      setFeedback(`Migration error: ${err.message || 'Failed to upload'}`);
    } finally {
      setPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supabase-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="supabase-modal-title" className="text-lg font-bold flex items-center gap-2">
                Supabase Cloud Database Integration
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Live Postgres
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                Direct integration with your Supabase cloud backend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {feedback && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Project Details & Status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Supabase Project URL
                </span>
                <p className="text-sm font-mono font-semibold text-slate-800 break-all">
                  {SUPABASE_URL}
                </p>
              </div>

              <a
                href={SUPABASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
              >
                Open Supabase Dashboard
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Connection Status Box */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    testing
                      ? 'bg-blue-500 animate-ping'
                      : status?.connected
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">
                    {testing ? 'Testing connection...' : status?.connected ? 'Connected to Cloud DB' : 'Action Required'}
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    {testing ? 'Pinging Supabase REST API...' : status?.message}
                  </p>
                </div>
              </div>

              <button
                onClick={checkStatus}
                disabled={testing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                Test Connection
              </button>
            </div>
          </div>

          {/* Step 1: Provide Anon Key */}
          <form onSubmit={handleSaveKey} className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="anon-key-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                Step 1: Supabase Public Anon Key
              </label>
              <span className="text-[11px] text-slate-500">
                Found in: Project Settings &rarr; API &rarr; Project API keys
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="anon-key-input"
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Save & Connect
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              The public <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">anon</code> key is safe for client applications and enables row-level security for human capital activities and audit logs.
            </p>
          </form>

          {/* Step 2: Database Schema & Migration */}
          <div className="space-y-3 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  Step 2: Initialize Database Tables
                </span>
                <p className="text-[11px] text-slate-500">
                  Run this SQL in your Supabase SQL Editor to create the <code className="text-emerald-800">activities</code>, <code className="text-emerald-800">audit_logs</code>, and <code className="text-emerald-800">ptr_test_logs</code> tables with Row Level Security.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-3 text-[11px] font-mono text-slate-200 max-h-36 overflow-y-auto border border-slate-800">
              <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCHEMA}</pre>
            </div>
          </div>

          {/* Step 3: Seed / Sync All Data */}
          <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/60">
            <div>
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-emerald-700" />
                Step 3: Push Local Records to Supabase
              </span>
              <p className="text-[11px] text-emerald-800">
                Upload your {activities.length} current LGA activities and {auditLogs.length} audit logs into the Supabase cloud tables.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePushAllToSupabase}
              disabled={pushing || !status?.connected}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className={`w-4 h-4 ${pushing ? 'animate-bounce' : ''}`} />
              {pushing ? 'Uploading to Supabase...' : 'Push All Data Now'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Row Level Security (RLS) & Multi-Tenant LGA Isolation Enforced
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

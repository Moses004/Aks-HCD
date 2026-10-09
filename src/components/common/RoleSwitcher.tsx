import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ALL_31_LGAS } from '../../data/lgas';
import { Role } from '../../types';
import {
  ShieldCheck,
  Building2,
  User,
  Check,
  X,
  Globe,
  Lock,
  Mail,
  Key,
  LogOut,
  AlertCircle,
  HelpCircle,
  Code,
  Copy,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface RoleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    signIn,
    signOut,
    requestPasswordReset,
    switchLga,
    loginAsDemo,
    isSimulatedOffline,
    toggleOfflineSimulation,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'profile' | 'sandbox' | 'provisioning'>(
    currentUser.isAuthenticated ? 'profile' : 'signin'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await signIn(email, password);
      if (res.success) {
        setAuthSuccess('Authenticated successfully into Government Portal.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setAuthError(res.error || 'Authentication rejected. Verify official credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await requestPasswordReset(resetEmail);
      if (res.success) {
        setAuthSuccess(res.message);
        setResetEmail('');
      } else {
        setAuthError(res.error || 'Failed to request password reset.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const PROVISIONING_SQL = `-- Run in Supabase SQL Editor to provision an LGA or State Admin profile
-- 1. Create User in Supabase Auth Dashboard (Users > Add User)
-- 2. Link their profile row with permitted LGA or State authority:

INSERT INTO public.user_profiles (user_id, role, lga_id, department)
VALUES (
  'PASTE_AUTH_USER_UUID_HERE',
  'lga_admin', -- or 'state_admin'
  'uyo',       -- lga slug, e.g. 'uyo', 'eket', 'ikot-ekpene' (NULL for state_admin)
  'Uyo LGA Department of Community & Human Development'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  lga_id = EXCLUDED.lga_id,
  department = EXCLUDED.department,
  updated_at = NOW();`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(PROVISIONING_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-[#0B4619] to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Official Authentication & Access Control
                {currentUser.isAuthenticated ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Active Session
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Public Guest
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-200">
                Akwa Ibom State Human Capital Development · ARISE Agenda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 px-4 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-950 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Active Profile
          </button>
          <button
            onClick={() => setActiveTab('signin')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'signin'
                ? 'border-emerald-700 text-emerald-950 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Official Sign In
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sandbox'
                ? 'border-emerald-700 text-emerald-950 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Role Sandbox
          </button>
          <button
            onClick={() => setActiveTab('provisioning')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'provisioning'
                ? 'border-emerald-700 text-emerald-950 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Admin Provisioning
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* TAB 1: ACTIVE PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{currentUser.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">{currentUser.email || 'No email associated'}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      currentUser.role === 'state_admin'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : currentUser.role === 'lga_admin'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Jurisdiction</span>
                    <span className="font-semibold text-slate-800">
                      {currentUser.role === 'state_admin'
                        ? 'All 31 LGAs (State-Wide)'
                        : currentUser.assignedLgaName
                        ? `${currentUser.assignedLgaName} LGA`
                        : 'Public Viewing Only'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Official Department</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {currentUser.department || 'General Public'}
                    </span>
                  </div>
                </div>
              </div>

              {currentUser.isAuthenticated ? (
                <button
                  onClick={async () => {
                    await signOut();
                    setAuthSuccess('Signed out of Government Desk session.');
                    setActiveTab('signin');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Government Session
                </button>
              ) : (
                <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-900 font-medium">
                    You are viewing the platform as a public citizen. Sign in to access LGA reporting or State Cabinet approvals.
                  </p>
                  <button
                    onClick={() => setActiveTab('signin')}
                    className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    Go to Official Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OFFICIAL SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Government Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. officer@uyo.ak.gov.ng"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Official Desk'}
                </button>
              </form>

              {/* Password Recovery Accordion */}
              <div className="pt-3 border-t border-slate-200">
                <details className="text-xs text-slate-600">
                  <summary className="font-semibold text-emerald-800 cursor-pointer hover:underline">
                    Forgot your official password? Request recovery dispatch
                  </summary>
                  <form onSubmit={handlePasswordReset} className="mt-3 space-y-2">
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter registered government email"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Dispatch Password Reset
                    </button>
                  </form>
                </details>
              </div>
            </div>
          )}

          {/* TAB 3: ROLE SANDBOX (FOR PREVIEWS) */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Sandbox Mode:</strong> Quick test switch for evaluating role permissions, tenant boundaries, and executive workflows during application evaluation.
                </p>
              </div>

              {/* State Super-Admin */}
              <div
                onClick={() => {
                  loginAsDemo('state_admin');
                  onClose();
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  currentUser.role === 'state_admin'
                    ? 'border-emerald-600 bg-emerald-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 text-[#D4AF37] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Dr. Bassey Okon (State Super-Admin)</h5>
                    <p className="text-[11px] text-slate-500">
                      Full Cabinet authority: state-wide review, approval, publishing, and audit inspection.
                    </p>
                  </div>
                </div>
                {currentUser.role === 'state_admin' && <Check className="w-4 h-4 text-emerald-700" />}
              </div>

              {/* LGA Desk Officer */}
              <div
                onClick={() => {
                  loginAsDemo('lga_admin', 'uyo');
                  onClose();
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  currentUser.role === 'lga_admin' && currentUser.assignedLgaId === 'uyo'
                    ? 'border-emerald-600 bg-emerald-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Engr. Emem Akpan (Uyo LGA Desk Officer)</h5>
                    <p className="text-[11px] text-slate-500">
                      Sandboxed to Uyo LGA. Submits project drafts, field media, and attendance rolls.
                    </p>
                  </div>
                </div>
                {currentUser.role === 'lga_admin' && currentUser.assignedLgaId === 'uyo' && (
                  <Check className="w-4 h-4 text-emerald-700" />
                )}
              </div>

              {/* Public Citizen */}
              <div
                onClick={() => {
                  loginAsDemo('public');
                  onClose();
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  currentUser.role === 'public'
                    ? 'border-emerald-600 bg-emerald-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Civil Society & Citizen Viewer</h5>
                    <p className="text-[11px] text-slate-500">Read-only public transparency portal.</p>
                  </div>
                </div>
                {currentUser.role === 'public' && <Check className="w-4 h-4 text-emerald-700" />}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN PROVISIONING GUIDE */}
          {activeTab === 'provisioning' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs">
                <p className="font-semibold mb-1">Administrative Profile Assignment</p>
                <p className="text-blue-900/80 leading-relaxed">
                  To provision an official officer, create the account in Supabase Auth, then run the SQL statement below to bind their verified role and LGA partition.
                </p>
              </div>

              <div className="relative">
                <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-[10px] rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                  {PROVISIONING_SQL}
                </pre>
                <button
                  onClick={handleCopySql}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedSql ? 'Copied' : 'Copy SQL'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

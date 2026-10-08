import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ALL_31_LGAS } from '../../data/lgas';
import { Role } from '../../types';
import { ShieldCheck, Building2, User, Check, X, Globe, Wifi, WifiOff } from 'lucide-react';

interface RoleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ isOpen, onClose }) => {
  const { currentUser, loginAs, switchLga, isSimulatedOffline, toggleOfflineSimulation } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-[#0B4619] to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Multi-Tenant Role Switcher</h3>
              <p className="text-xs text-emerald-200">
                Test role-based access control, tenant sandboxing & state review pipelines
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Primary Roles */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              1. System Authority Roles
            </label>

            {/* State Super-Admin */}
            <div
              onClick={() => {
                loginAs('state_admin');
                onClose();
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                currentUser.role === 'state_admin'
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950 text-[#D4AF37] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">State Super-Admin</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                      Executive Oversight
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    State-wide jurisdiction. Cross-examine LGA submissions, approve/publish projects, return drafts with feedback, inspect audit trails.
                  </p>
                </div>
              </div>
              {currentUser.role === 'state_admin' && (
                <Check className="w-5 h-5 text-emerald-700 shrink-0" />
              )}
            </div>

            {/* Public Citizen */}
            <div
              onClick={() => {
                loginAs('public');
                onClose();
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                currentUser.role === 'public'
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Public Citizen / Civil Society Analyst</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Open Transparency
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Global view of verified projects, interactive LGA vector map, analytical graphs, and public CSV/PDF export.
                  </p>
                </div>
              </div>
              {currentUser.role === 'public' && (
                <Check className="w-5 h-5 text-emerald-700 shrink-0" />
              )}
            </div>
          </div>

          {/* LGA Tenant Contributor Role */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                2. LGA Contributor Sandboxes (Select any of the 31 LGAs)
              </label>
              {currentUser.role === 'lga_admin' && (
                <span className="text-xs font-semibold text-emerald-700">
                  Current: {currentUser.assignedLgaName} LGA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              Each LGA admin is structurally restricted to their own autonomous local council records. Writing to other LGAs is blocked at UI & API boundaries.
            </p>

            {/* Popular LGA Quick Picks */}
            <div className="grid grid-cols-3 gap-2">
              {['uyo', 'eket', 'ikot-ekpene'].map((lgaSlug) => {
                const lga = ALL_31_LGAS.find((l) => l.id === lgaSlug);
                if (!lga) return null;
                const isCurrent = currentUser.role === 'lga_admin' && currentUser.assignedLgaId === lga.id;
                return (
                  <button
                    key={lga.id}
                    onClick={() => {
                      loginAs('lga_admin', lga.id);
                      onClose();
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                      isCurrent
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{lga.name} LGA</div>
                      <div className="text-[10px] text-slate-500">{lga.headquarters}</div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-emerald-700" />}
                  </button>
                );
              })}
            </div>

            {/* All 31 LGAs Dropdown */}
            <div className="pt-2">
              <label className="text-xs text-slate-600 block mb-1 font-medium">
                Or select another LGA from all 31 Local Government Areas:
              </label>
              <select
                value={currentUser.assignedLgaId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    loginAs('lga_admin', e.target.value);
                    onClose();
                  }
                }}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="" disabled>
                  -- Select one of the 31 LGAs --
                </option>
                {ALL_31_LGAS.map((lga) => (
                  <option key={lga.id} value={lga.id}>
                    {lga.name} LGA ({lga.senatorialDistrict}) - HQ: {lga.headquarters}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Offline Mode Simulator Toggle */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                {isSimulatedOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              </div>
              <div>
                <h5 className="text-xs font-bold text-amber-950">Remote Field Offline Simulation</h5>
                <p className="text-[11px] text-amber-800">
                  Simulate field data entry in remote riverine/mangrove wards without network
                </p>
              </div>
            </div>
            <button
              onClick={toggleOfflineSimulation}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isSimulatedOffline
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
            >
              {isSimulatedOffline ? 'Offline Active' : 'Enable Offline'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>Active Identity: <strong>{currentUser.name}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { HcdLogo } from './Logos';
import {
  ShieldCheck,
  Building2,
  Users,
  WifiOff,
  Wifi,
  ChevronDown,
  Menu,
  X,
  FileCheck2,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'public' | 'lga' | 'executive' | 'ptr';
  setCurrentTab: (tab: 'public' | 'lga' | 'executive' | 'ptr') => void;
  onOpenRoleSwitcher: () => void;
  onOpenCreateWizard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenRoleSwitcher,
  onOpenCreateWizard,
}) => {
  const { currentUser, isSimulatedOffline } = useAuth();
  const { isOnline, pendingSyncCount } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      {/* Official State Government Top Utility Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0B4619] to-emerald-950 text-white text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between border-b border-[#D4AF37]/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] inline-block" />
            <span className="font-semibold text-[#D4AF37]">AKWA IBOM STATE GOVERNMENT</span>
            <span className="hidden sm:inline text-emerald-200">· Directorate of Human Capital Development (ARISE Agenda)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-emerald-100">
          {/* Offline/Online Status Pill */}
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-300">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline text-[10px]">Cloud Repository Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300 font-semibold animate-pulse">
                <WifiOff className="w-3 h-3" />
                <span className="text-[10px]">
                  Field Offline Mode {pendingSyncCount > 0 ? `(${pendingSyncCount} queued)` : ''}
                </span>
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-emerald-200">
            <span>31 Local Governments</span>
            <span>·</span>
            <span>Uyo · Ikot Ekpene · Eket</span>
          </div>
        </div>
      </div>

      {/* Main Top Bar (Follows strict 3-zone contract) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark with official HCD emblem */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('public')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="flex items-center justify-center p-1.5 rounded-xl bg-white border border-[#D4AF37]/60 shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <HcdLogo className="w-7 h-7 object-contain" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-900 transition-colors block leading-tight">
                AKS-HCD Portal
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800 hidden sm:block">
                ARISE Agenda · 31 LGAs
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 font-medium text-xs">
          <button
            onClick={() => setCurrentTab('public')}
            className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'public'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Public Transparency
          </button>

          <button
            onClick={() => setCurrentTab('lga')}
            className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'lga'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            LGA Desk Workspace
            {currentUser.role === 'lga_admin' && (
              <span className="bg-emerald-200/70 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                {currentUser.assignedLgaName}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('executive')}
            className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentTab === 'executive'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>State Executive Panel</span>
            <span className="hidden xl:inline-flex text-[10px] font-semibold bg-emerald-100/90 text-emerald-800 px-1.5 py-0.5 rounded ml-0.5">
              + PTR Tests
            </span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions & Role Badge */}
        <div className="flex items-center gap-2.5">
          {/* New Entry Wizard Button (Shown if LGA admin) */}
          {currentUser.role === 'lga_admin' && onOpenCreateWizard && (
            <button
              onClick={onOpenCreateWizard}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New LGA Activity
            </button>
          )}

          {/* Current Role Switcher Button */}
          <button
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            title="Click to switch role / LGA tenant"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-900 text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.role === 'state_admin' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : currentUser.role === 'lga_admin' ? (
                <Building2 className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>

            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {currentUser.role === 'state_admin'
                  ? 'State Super-Admin'
                  : currentUser.role === 'lga_admin'
                  ? `${currentUser.assignedLgaName} LGA`
                  : 'Public Citizen'}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-2">
          <button
            onClick={() => {
              setCurrentTab('public');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold ${
              currentTab === 'public' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700'
            }`}
          >
            Public Transparency Portal
          </button>
          <button
            onClick={() => {
              setCurrentTab('lga');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
              currentTab === 'lga' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700'
            }`}
          >
            <span>LGA Desk Workspace</span>
            {currentUser.assignedLgaName && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {currentUser.assignedLgaName}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setCurrentTab('executive');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
              currentTab === 'executive' || currentTab === 'ptr' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700'
            }`}
          >
            <span>State Executive Panel</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-normal">
              Includes PTR Tests
            </span>
          </button>

          {currentUser.role === 'lga_admin' && onOpenCreateWizard && (
            <button
              onClick={() => {
                onOpenCreateWizard();
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2 py-2.5 text-center text-sm font-bold text-white bg-emerald-800 rounded-lg"
            >
              + Create New LGA Activity
            </button>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenRoleSwitcher();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-center text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
            >
              Switch Role / LGA Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

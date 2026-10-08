import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { OfflineSyncBanner } from './components/common/OfflineSyncBanner';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { RoleSwitcher } from './components/common/RoleSwitcher';
import { PtrTestModal } from './components/common/PtrTestModal';
import { PublicPortal } from './components/public/PublicPortal';
import { LgaDashboard } from './components/lga/LgaDashboard';
import { ExecutivePanel } from './components/executive/ExecutivePanel';
import { ReportingWizardModal } from './components/lga/ReportingWizardModal';
import { ReportExportModal } from './components/executive/ReportExportModal';
import { ProjectDetailModal } from './components/public/ProjectDetailModal';
import { HCDActivity } from './types';

function AppContent() {
  const { currentUser, switchLga } = useAuth();
  const { activities } = useData();

  const [currentTab, setCurrentTab] = useState<'public' | 'lga' | 'executive' | 'ptr'>('public');
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isReportExportOpen, setIsReportExportOpen] = useState(false);
  const [inspectedActivity, setInspectedActivity] = useState<HCDActivity | null>(null);

  const handleNavigateToLga = (lgaId: string) => {
    switchLga(lgaId);
    setCurrentTab('lga');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-800">
      {/* PWA Home screen installation prompt */}
      <PwaInstallBanner />

      {/* Offline sync detection bar */}
      <OfflineSyncBanner />

      {/* Top Bar Header adhering to 3-zone contract */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onOpenCreateWizard={() => setIsWizardOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {currentTab === 'public' && (
          <PublicPortal
            activities={activities}
            onViewActivity={(act) => setInspectedActivity(act)}
            onOpenReportExport={() => setIsReportExportOpen(true)}
            onNavigateToLga={handleNavigateToLga}
          />
        )}

        {currentTab === 'lga' && (
          <LgaDashboard
            onOpenCreateWizard={() => setIsWizardOpen(true)}
            onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
            onViewActivity={(act) => setInspectedActivity(act)}
          />
        )}

        {currentTab === 'executive' && (
          <ExecutivePanel
            onOpenReportExport={() => setIsReportExportOpen(true)}
            onViewActivity={(act) => setInspectedActivity(act)}
            onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          />
        )}

        {currentTab === 'ptr' && (
          <ExecutivePanel
            initialTab="ptr"
            onOpenReportExport={() => setIsReportExportOpen(true)}
            onViewActivity={(act) => setInspectedActivity(act)}
            onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          />
        )}
      </main>

      {/* Official Government Footer */}
      <Footer onSelectLga={handleNavigateToLga} />

      {/* Floating Modals */}
      <RoleSwitcher
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
      />

      <ReportingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          if (currentTab !== 'lga') setCurrentTab('lga');
        }}
      />

      <ReportExportModal
        isOpen={isReportExportOpen}
        onClose={() => setIsReportExportOpen(false)}
      />

      <ProjectDetailModal
        activity={inspectedActivity}
        onClose={() => setInspectedActivity(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

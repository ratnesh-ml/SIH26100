import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MOCK_TENDERS } from './mockData/tenders';
import { procurementService } from './services/procurementService';

// Views for the 20 screens
import { HeroView } from './components/views/HeroView';
import { LoginOptionsView } from './components/views/LoginOptionsView';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { TenderListView } from './components/views/TenderListView';
import { TenderDetailView } from './components/views/TenderDetailView';
import { TenderUploadModal } from './components/views/TenderUploadModal';
import { BidderListView } from './components/views/BidderListView';
import { BidderUploadModal } from './components/views/BidderUploadModal';
import { PipelineStepperView } from './components/views/PipelineStepperView';
import { ExtractionView } from './components/views/ExtractionView';
import { RegistryVerifyView } from './components/views/RegistryVerifyView';
import { ComplianceMatrixView } from './components/views/ComplianceMatrixView';
import { BidderScrutinyView } from './components/views/BidderScrutinyView';
import { EvidenceInspectorView } from './components/views/EvidenceInspectorView';
import { RiskAnalysisView } from './components/views/RiskAnalysisView';
import { VendorGraphView } from './components/views/VendorGraphView';
import { AuditLedgerView } from './components/views/AuditLedgerView';
import { CVCDossierView } from './components/views/CVCDossierView';
import { CopilotDrawer } from './components/views/CopilotDrawer';

export default function App() {
  // Navigation & Route State
  const [currentRoute, setCurrentRoute] = useState<string>('hero');
  const [routeParams, setRouteParams] = useState<any>({});
  const [selectedTenderId, setSelectedTenderId] = useState<string>('CPCL-PUMP-217');
  const [selectedBidderId, setSelectedBidderId] = useState<string>('BID-HYD-0419');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [isBidderModalOpen, setIsBidderModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Authenticated User
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string; title: string }>({
    id: 'usr_officer_1',
    name: 'Rajesh Verma',
    role: 'officer',
    title: 'Sr. Procurement Officer (CPCL)',
  });

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize with URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '') || 'hero';
      const [route, paramString] = hash.split('?');
      setCurrentRoute(route || 'hero');

      if (paramString) {
        const searchParams = new URLSearchParams(paramString);
        const params: Record<string, string> = {};
        searchParams.forEach((val, key) => {
          params[key] = val;
        });
        setRouteParams(params);
        if (params.tenderId) setSelectedTenderId(params.tenderId);
        if (params.bidderId) setSelectedBidderId(params.bidderId);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string, params?: any) => {
    setCurrentRoute(route);
    setRouteParams(params || {});
    if (params?.tenderId) setSelectedTenderId(params.tenderId);
    if (params?.bidderId) setSelectedBidderId(params.bidderId);

    const queryStr = params
      ? '?' +
        Object.entries(params)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    window.location.hash = `#/${route}${queryStr}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Global Handlers
  const handleDownloadDossier = () => {
    procurementService.downloadDossierFile(selectedTenderId, selectedBidderId);
    showToast('Official CVC Compliance Dossier generated & downloaded.');
    navigateTo('dossier');
  };

  // Active tender object
  const activeTender = MOCK_TENDERS.find((t) => t.id === selectedTenderId) || MOCK_TENDERS[0];

  const isPublicPage = currentRoute === 'hero' || currentRoute === 'login-options' || currentRoute === 'login';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-blue-500 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Public Screens (01, 02, 03) */}
      {currentRoute === 'hero' && (
        <HeroView
          onEnterWorkspace={() => navigateTo('login-options')}
          onExploreDemo={() => navigateTo('dashboard')}
          onLoginOptions={() => navigateTo('login-options')}
        />
      )}

      {currentRoute === 'login-options' && (
        <LoginOptionsView
          onSelectRole={(role, name, title) => {
            setCurrentUser({ id: `usr_${role}`, role, name, title });
            navigateTo('login', { role });
          }}
          onBackToHero={() => navigateTo('hero')}
        />
      )}

      {currentRoute === 'login' && (
        <LoginView
          initialRole={routeParams.role || 'officer'}
          onLoginSuccess={(user) => {
            setCurrentUser({
              id: user.id,
              name: user.full_name,
              role: user.role,
              title: user.department,
            });
            showToast(`Welcome, ${user.full_name}! Authenticated with Class 3 DSC token.`);
            navigateTo('dashboard');
          }}
          onBackToOptions={() => navigateTo('login-options')}
        />
      )}

      {/* Internal Screens (04 to 19) with Sidebar & Header Layout */}
      {!isPublicPage && (
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar
            currentRoute={currentRoute}
            onNavigate={(route) => navigateTo(route)}
            anomalyCount={3}
          />

          {/* Main App Container */}
          <div className="pl-64 flex flex-col flex-1 min-h-screen">
            {/* Top Fixed Header */}
            <Header
              tenders={MOCK_TENDERS}
              selectedTenderId={selectedTenderId}
              onSelectTender={(id) => {
                setSelectedTenderId(id);
                showToast(`Switched active context to ${id}`);
              }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenNotifications={() => showToast('3 pending technical committee clarifications.')}
              currentUser={currentUser}
              onSignOut={() => {
                navigateTo('login-options');
                showToast('Signed out of procurement session.');
              }}
            />

            {/* Page Body Viewport */}
            <main className="w-full pt-16 bg-[#F8FAFC] flex-1 px-6 py-6 max-w-[1720px] mx-auto">
              {currentRoute === 'dashboard' && (
                <DashboardView
                  onNavigate={navigateTo}
                  onDownloadDossier={handleDownloadDossier}
                />
              )}

              {currentRoute === 'tenders' && !routeParams.tenderId && (
                <TenderListView
                  onSelectTender={(t) => navigateTo('tender-detail', { tenderId: t.id })}
                  onOpenCreateModal={() => setIsTenderModalOpen(true)}
                  onNavigate={navigateTo}
                />
              )}

              {(currentRoute === 'tender-detail' || (currentRoute === 'tenders' && routeParams.tenderId)) && (
                <TenderDetailView
                  tender={activeTender}
                  onNavigate={navigateTo}
                  onDownloadDossier={handleDownloadDossier}
                />
              )}

              {currentRoute === 'bidders' && (
                <BidderListView
                  onSelectBidder={(b) => navigateTo('scrutiny', { bidderId: b.id })}
                  onOpenUploadModal={() => setIsBidderModalOpen(true)}
                  onNavigate={navigateTo}
                />
              )}

              {currentRoute === 'pipeline' && (
                <PipelineStepperView
                  bidderId={selectedBidderId}
                  onNavigate={navigateTo}
                />
              )}

              {currentRoute === 'extraction' && (
                <ExtractionView
                  bidderId={selectedBidderId}
                  onNavigate={navigateTo}
                />
              )}

              {currentRoute === 'registry' && (
                <RegistryVerifyView
                  bidderId={selectedBidderId}
                  onNavigate={navigateTo}
                />
              )}

              {(currentRoute === 'matrix' || currentRoute === 'compliance-matrix') && (
                <ComplianceMatrixView
                  onNavigate={navigateTo}
                  onDownloadDossier={handleDownloadDossier}
                />
              )}

              {currentRoute === 'scrutiny' && (
                <BidderScrutinyView
                  bidderId={selectedBidderId}
                  onNavigate={navigateTo}
                  onDownloadDossier={handleDownloadDossier}
                />
              )}

              {currentRoute === 'evidence' && (
                <EvidenceInspectorView
                  findingId={routeParams.findingId || 'FND-2026-0042'}
                  onNavigate={navigateTo}
                />
              )}

              {(currentRoute === 'risk' || currentRoute === 'risk-anomalies') && (
                <RiskAnalysisView
                  bidderId={selectedBidderId}
                  onNavigate={navigateTo}
                />
              )}

              {(currentRoute === 'graph' || currentRoute === 'vendor-graph') && (
                <VendorGraphView onNavigate={navigateTo} />
              )}

              {(currentRoute === 'audit' || currentRoute === 'audit-ledger') && (
                <AuditLedgerView
                  initialBlockNumber={routeParams.blockNumber ? parseInt(routeParams.blockNumber, 10) : undefined}
                  onNavigate={navigateTo}
                  onDownloadDossier={handleDownloadDossier}
                />
              )}

              {(currentRoute === 'dossier' || currentRoute === 'cvc-final') && (
                <CVCDossierView onNavigate={navigateTo} />
              )}
            </main>

            {/* Persistent Enterprise Footer */}
            <footer className="border-t border-slate-200 px-6 py-3 bg-white text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">VigilBid</span>
                <span>•</span>
                <span>Chennai Petroleum Corporation Limited (CPCL / IndianOil & MoPNG)</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200">
                  SIH26100
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-500 font-mono text-[10.5px]">
                <span>GFR 2017 Rule 144(xi)</span>
                <span>•</span>
                <span>PPP-MII Order 2017</span>
                <span>•</span>
                <span>CVC Manual 2021</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">NIC-CERT L3 Verified</span>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Floating AI Copilot Trigger (Screen 20) */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer font-semibold text-xs"
        title="Open Regulatory AI Copilot"
      >
        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
        <span>AI Copilot</span>
      </button>

      {/* Screen 07: Tender Induction Modal */}
      <TenderUploadModal
        isOpen={isTenderModalOpen}
        onClose={() => setIsTenderModalOpen(false)}
        onSuccess={(newTender) => {
          showToast(`Tender ${newTender.refNo} inducted & signed into Merkle ledger.`);
          navigateTo('tender-detail', { tenderId: newTender.id });
        }}
      />

      {/* Screen 09: Bidder Packet Ingestion Modal */}
      <BidderUploadModal
        isOpen={isBidderModalOpen}
        onClose={() => setIsBidderModalOpen(false)}
        onUploadComplete={(jobData) => {
          showToast(`Bidder package ${jobData.bidderId} ingested. Initializing forensic pipeline.`);
          navigateTo('pipeline', { bidderId: jobData.bidderId });
        }}
      />

      {/* Screen 20: AI Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigate={navigateTo}
      />
    </div>
  );
}

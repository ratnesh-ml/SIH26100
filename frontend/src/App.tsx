import { useEffect, useState } from 'react';
import { fetchCurrentUser, fetchHealth, getStoredToken, logout } from './api/client';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { TenderListView } from './components/TenderListView';
import { TenderCreateModal } from './components/TenderCreateModal';
import { BidderListView } from './components/BidderListView';
import { BidderDetailView } from './components/BidderDetailView';
import { UploadModal } from './components/UploadModal';
import { PipelineStepperView } from './components/PipelineStepperView';
import { ComplianceMatrixView } from './components/ComplianceMatrixView';
import { RiskAnomalyView } from './components/RiskAnomalyView';
import { CrossBidderGraphView } from './components/CrossBidderGraphView';
import { AuditTrailView } from './components/AuditTrailView';
import { DashboardView } from './components/DashboardView';
import { DemoView } from './components/DemoView';
import { Sparkles } from 'lucide-react';
import { CopilotDrawer } from './components/CopilotDrawer';
import { BidderSummary, TenderDetail, TenderSummary, UploadPackageResponse, User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('connecting');
  const [initialLoading, setInitialLoading] = useState(true);

  // Navigation & View State
  const [activeView, setActiveView] = useState<
    | 'dashboard'
    | 'tenders'
    | 'matrix'
    | 'bidders'
    | 'bidder-detail'
    | 'pipeline'
    | 'risk-anomalies'
    | 'graph'
    | 'audit'
    | 'demo'
  >('dashboard');
  const [selectedTender, setSelectedTender] = useState<TenderSummary | null>(null);
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobBidderId, setActiveJobBidderId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTenderId, setUploadTenderId] = useState<string | undefined>(undefined);
  const [uploadBidderId, setUploadBidderId] = useState<string | undefined>(undefined);
  const [tenderListKey, setTenderListKey] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  useEffect(() => {
    // 1. Health Probe
    fetchHealth()
      .then((h) => setHealthStatus(h.status || 'healthy'))
      .catch(() => setHealthStatus('offline'));

    // 2. Initial Auth Check
    const token = getStoredToken();
    if (token) {
      fetchCurrentUser()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          // Token expired or invalid
          setCurrentUser(null);
        })
        .finally(() => {
          setInitialLoading(false);
        });
    } else {
      setInitialLoading(false);
    }

    // 3. Hash-based route listener (e.g. #/demo)
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#/demo' || hash === '#demo' || window.location.pathname === '/demo') {
        setActiveView('demo');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveView('tenders');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setSelectedTender(null);
    setSelectedBidderId(null);
    setActiveJobId(null);
    setActiveJobBidderId(null);
    setActiveView('tenders');
  };

  const handleSelectTender = (tender: TenderSummary) => {
    setSelectedTender(tender);
    setActiveView('bidders');
  };

  const handleSelectBidder = (bidder: BidderSummary) => {
    setSelectedBidderId(bidder.id);
    setActiveView('bidder-detail');
  };

  const handleOpenUploadForTender = (tenderId: string) => {
    setUploadTenderId(tenderId);
    setUploadBidderId(undefined);
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = (res: UploadPackageResponse) => {
    if (res.job_id) {
      setActiveJobId(res.job_id);
      setActiveJobBidderId(res.bidder_id);
      setActiveView('pipeline');
    }
  };

  const handleTenderCreated = (_newTender: TenderDetail) => {
    // Increment key to trigger refresh in TenderListView
    setTenderListKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col font-sans selection:bg-[#0066cc]/20 selection:text-[#0066cc]">
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'bidders') {
            setSelectedTender(null);
          }
          setActiveView(view);
        }}
        onLogout={handleLogout}
        healthStatus={healthStatus}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {initialLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Initializing VigilBid Portal...</span>
          </div>
        ) : !currentUser ? (
          activeView === 'demo' ? (
            <DemoView
              onEnterApp={() => setActiveView('dashboard')}
              onOpenAudit={() => setActiveView('demo')}
            />
          ) : (
            <LoginView
              onLoginSuccess={handleLoginSuccess}
              onExploreDemo={() => setActiveView('demo')}
            />
          )
        ) : (
          <>
            {activeView === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                onNavigate={(view) => {
                  if (view === 'bidders') setSelectedTender(null);
                  setActiveView(view);
                }}
              />
            )}

            {activeView === 'tenders' && (
              <TenderListView
                key={tenderListKey}
                currentUser={currentUser}
                onSelectTender={handleSelectTender}
                onViewMatrix={(t) => {
                  setSelectedTender(t);
                  setActiveView('matrix');
                }}
                onViewGraph={(t) => {
                  setSelectedTender(t);
                  setActiveView('graph');
                }}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
            )}

            {activeView === 'matrix' && selectedTender && (
              <ComplianceMatrixView
                tender={selectedTender}
                onBack={() => setActiveView('tenders')}
                onSelectBidder={(bId) => {
                  setSelectedBidderId(bId);
                  setActiveView('bidder-detail');
                }}
                onViewGraph={() => setActiveView('graph')}
                onOpenUploadModal={() => handleOpenUploadForTender(selectedTender.id)}
                canUpload={currentUser.role === 'officer' || currentUser.role === 'admin'}
              />
            )}

            {activeView === 'bidders' && (
              <BidderListView
                selectedTender={selectedTender}
                onBackToTenders={() => {
                  setSelectedTender(null);
                  setActiveView('tenders');
                }}
                onSelectBidder={handleSelectBidder}
                onViewMatrix={selectedTender ? () => setActiveView('matrix') : undefined}
                onOpenUploadModal={selectedTender ? () => handleOpenUploadForTender(selectedTender.id) : undefined}
                canUpload={currentUser.role === 'officer' || currentUser.role === 'admin'}
              />
            )}

            {activeView === 'bidder-detail' && selectedBidderId && (
              <BidderDetailView
                bidderId={selectedBidderId}
                currentUser={currentUser}
                onBack={() => setActiveView('bidders')}
                onOpenRiskAnomalies={() => setActiveView('risk-anomalies')}
                onOpenPipeline={(jId, bId) => {
                  setActiveJobId(jId);
                  setActiveJobBidderId(bId);
                  setActiveView('pipeline');
                }}
                onOpenUploadModal={() => {
                  setUploadTenderId(undefined);
                  setUploadBidderId(selectedBidderId);
                  setIsUploadModalOpen(true);
                }}
                canUpload={currentUser.role === 'officer' || currentUser.role === 'admin'}
              />
            )}

            {activeView === 'risk-anomalies' && selectedBidderId && (
              <RiskAnomalyView
                bidderId={selectedBidderId}
                onBack={() => setActiveView('bidder-detail')}
                onNavigateToCockpit={() => setActiveView('bidder-detail')}
              />
            )}

            {activeView === 'graph' && selectedTender && (
              <CrossBidderGraphView
                tender={selectedTender}
                onBack={() => setActiveView('matrix')}
                onSelectBidder={(bId) => {
                  setSelectedBidderId(bId);
                  setActiveView('bidder-detail');
                }}
              />
            )}

            {activeView === 'audit' && (
              <AuditTrailView
                tenderId={selectedTender?.id}
                onBack={() => setActiveView('dashboard')}
              />
            )}

            {activeView === 'pipeline' && activeJobId && activeJobBidderId && (
              <PipelineStepperView
                jobId={activeJobId}
                bidderId={activeJobBidderId}
                onBackToBidders={() => setActiveView('bidders')}
                onViewBidderCockpit={(bId) => {
                  setSelectedBidderId(bId);
                  setActiveView('bidder-detail');
                }}
              />
            )}

            {activeView === 'demo' && (
              <DemoView
                onEnterApp={() => setActiveView('dashboard')}
                onOpenAudit={() => setActiveView('audit')}
              />
            )}
          </>
        )}
      </main>

      <TenderCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTenderCreated={handleTenderCreated}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        tenderId={uploadTenderId}
        bidderId={uploadBidderId}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Floating AI Copilot Trigger (Stitch Screen 09) */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#0066cc] hover:bg-[#0071e3] text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Open Procurement AI Copilot & Regulatory Assistant"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-xs font-semibold">AI Copilot</span>
      </button>

      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentUser={currentUser}
        tenderId={selectedTender?.id}
        bidderId={selectedBidderId || undefined}
      />

      <footer className="border-t border-[#e0e0e0] px-8 py-5 text-xs text-[#7a7a7a] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f5f5f7]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1d1d1f]">VigilBid</span>
          <span>•</span>
          <span>Chennai Petroleum Corporation Limited (CPCL / IndianOil & MoPNG)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-[10px] font-mono text-[#1d1d1f]">
            SIH26100
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#7a7a7a]">
          <span>GFR 2017 Rule 144(xi)</span>
          <span>•</span>
          <span>PPP-MII Order 2017</span>
          <span>•</span>
          <span>CVC-aligned workflow</span>
          <span>•</span>
          <span className="font-mono">v2.34.0</span>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { fetchCurrentUser, fetchHealth, getStoredToken, logout } from './api/client';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { TenderListView } from './components/TenderListView';
import { TenderCreateModal } from './components/TenderCreateModal';
import { BidderListView } from './components/BidderListView';
import { BidderDetailView } from './components/BidderDetailView';
import { BidderSummary, TenderDetail, TenderSummary, User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('connecting');
  const [initialLoading, setInitialLoading] = useState(true);

  // Navigation & View State
  const [activeView, setActiveView] = useState<'tenders' | 'bidders' | 'bidder-detail'>('tenders');
  const [selectedTender, setSelectedTender] = useState<TenderSummary | null>(null);
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tenderListKey, setTenderListKey] = useState(0);

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

  const handleTenderCreated = (_newTender: TenderDetail) => {
    // Increment key to trigger refresh in TenderListView
    setTenderListKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300">
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {initialLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Initializing VigilBid Portal...</span>
          </div>
        ) : !currentUser ? (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {activeView === 'tenders' && (
              <TenderListView
                key={tenderListKey}
                currentUser={currentUser}
                onSelectTender={handleSelectTender}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
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
              />
            )}

            {activeView === 'bidder-detail' && selectedBidderId && (
              <BidderDetailView
                bidderId={selectedBidderId}
                onBack={() => setActiveView('bidders')}
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

      <footer className="border-t border-slate-800/80 px-6 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-950">
        <div>
          <span className="font-semibold text-slate-400">VigilBid</span> • Public Procurement Decision Support System (Problem SIH26100)
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>GFR 2017 & CVC 2021 Compliant</span>
          <span>•</span>
          <span>CPCL / MoPNG</span>
          <span>•</span>
          <span>v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string, params?: any) => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'risk' | 'rules'>('chat');
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      sender: 'user' | 'assistant';
      text: string;
      time: string;
      rule?: string;
      linkView?: string;
    }>
  >([
    {
      sender: 'assistant',
      text: 'Good day Officer Verma. I am your VigilBid Compliance Copilot. I have indexed GFR 2017, CVC Manual 2021, and the CPCL API-610 tender stipulations against all 5 decrypted bidder packages. How may I assist your scrutiny today?',
      time: '11:20 AM',
    },
    {
      sender: 'user',
      text: 'What are the statutory grounds for disqualifying Bharat Hydrotech Corp?',
      time: '11:22 AM',
    },
    {
      sender: 'assistant',
      text: 'Under GFR 2017 Rule 144(xi) and PPP-MII Order 2017, Bharat Hydrotech Corp triggers two primary disqualification grounds:\n1. Land Border Rule Non-Compliance: Beneficial ownership is traced to a Hong Kong entity without mandatory DPIIT registration clearance.\n2. Subnet Clustered Bidding: Encrypted envelope was uploaded from IP 103.21.58.114/29 within 14 minutes of Zenith Infra Tech Pvt Ltd, violating CCI Section 3(3) cartel restrictions.',
      time: '11:23 AM',
      rule: 'GFR Rule 144(xi) & Competition Act Sec 3(3)',
      linkView: 'evidence',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const newMsgs = [
      ...messages,
      {
        sender: 'user' as const,
        text: q,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(newMsgs);
    setInput('');

    setTimeout(() => {
      let reply =
        'Under Public Procurement Policy (Make in India Order 2017), Class-I local suppliers must have minimum 50% local value addition. Bharat Hydrotech has declared 45.0% (Class-II), which disqualifies them from purchase preference.';
      let rule = 'PPP-MII Order 2017 Clause 3(a)';
      let linkView = 'matrix';

      if (q.toLowerCase().includes('turnover')) {
        reply =
          'Bharat Hydrotech Corp reported 3-year average turnover of ₹6.10 Cr vs mandatory minimum ₹12.00 Cr (-49.1% deficit). Under MSE Order 2012 Clause 10, turnover waiver can only be granted if valid Udyam certificate is accepted by the technical committee.';
        rule = 'NIT Clause 4.1.2 & MSE Order 2012';
        linkView = 'scrutiny';
      } else if (q.toLowerCase().includes('gstin') || q.toLowerCase().includes('state')) {
        reply =
          'Form GST REG-06 shows State Code 33 (Tamil Nadu), conflicting with MCA21 registered state 27 (Maharashtra). This triggers Rule 144(i) verification bar unless validated as an active project site registration.';
        rule = 'GFR 2017 Rule 144(i)';
        linkView = 'evidence';
      } else if (q.toLowerCase().includes('memo') || q.toLowerCase().includes('dossier') || q.toLowerCase().includes('adjudicat')) {
        reply =
          'Official Adjudication Minute Draft:\n"Pursuant to GFR 2017 Rule 144(xi) and CVC Manual 2021, the Tender Evaluation Committee has recorded adverse determinations regarding subnet clustering and foreign shareholding. Provisional status requires compliance within 5 calendar days."';
        rule = 'CVC Manual 2021 Clause 4.2';
        linkView = 'dossier';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rule,
          linkView,
        },
      ]);
    }, 600);
  };

  const quickPrompts = [
    'Does Bidder C meet turnover criteria?',
    'Explain GFR 144(xi) land border violation',
    'Compare GSTIN state codes for Bidder C',
    'Generate statutory disqualification memo',
  ];

  return (
    <>
      {/* Background Soft Overlay with Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity duration-300"
      />

      {/* Right Drawer Container */}
      <aside
        aria-label="Compliance Copilot"
        className={`fixed right-0 top-0 h-screen bg-white border-l border-slate-200 shadow-2xl flex flex-col z-50 transition-all duration-300 ease-out ${
          isExpanded ? 'w-full sm:w-[680px]' : 'w-full sm:w-[460px]'
        }`}
      >
        {/* DRAWER TOP HEADER */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* AI Shield Icon Capsule */}
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0 ring-2 ring-blue-100">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h2 className="text-xs font-bold text-slate-900 tracking-tight">Compliance Copilot</h2>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-semibold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  NIC Grounded
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                <span>Evidence-grounded assistant</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1"></span>
                  Context aware
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Expand & Close */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse panel' : 'Expand panel'}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isExpanded ? 'close_fullscreen' : 'open_in_full'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close panel"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-1.5 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-md'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-3 py-1.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'risk'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-md'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Risk Engine
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-md'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Statutory Rules
          </button>
        </div>

        {/* DRAWER CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeTab === 'chat' && (
            <>
              {/* Context Chip */}
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <span className="font-semibold">Active Scrutiny Context:</span>{' '}
                  <span className="font-mono font-bold">Bharat Hydrotech (BID-HYD-0419)</span>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('scrutiny')}
                    className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Cockpit →
                  </button>
                )}
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl max-w-[92%] text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      {m.rule && (
                        <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] font-mono font-semibold text-sky-800 flex items-center justify-between gap-2">
                          <span>Rule: {m.rule}</span>
                          {m.linkView && onNavigate && (
                            <button
                              onClick={() => {
                                if (m.linkView && onNavigate) onNavigate(m.linkView);
                              }}
                              className="text-blue-700 underline font-sans font-bold cursor-pointer"
                            >
                              Inspect →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono px-1">
                      {m.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* Suggested Quick Prompts */}
              <div className="pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Suggested Scrutiny Queries
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((p, pi) => (
                    <button
                      key={pi}
                      onClick={() => handleSend(p)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-left cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-900 text-sm">NIC-CERT Heuristic Attribution</div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                <div className="font-bold text-rose-900">Composite Risk Score: 65 / 100</div>
                <p className="text-slate-700 text-xs">
                  High probability of cartelization based on subnet clustering and state discordance.
                </p>
                <div className="space-y-1.5 pt-1 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span>Identity Vector:</span>
                    <span className="font-bold text-rose-700">42% (35 pts)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subnet Cluster Vector:</span>
                    <span className="font-bold text-rose-700">31% (26 pts)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turnover Deficit Vector:</span>
                    <span className="font-bold text-amber-700">18% (15 pts)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-900 text-sm">Indexed Procurement Statutes</div>
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-900">GFR 2017 Rule 144(xi)</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Restrictions on procurement from countries sharing a land border with India. Mandatory DPIIT registration required.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-900">PPP-MII Order 2017</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Class-I Local Supplier status requires minimum 50% domestic local content.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-900">Competition Act 2002 Sec 3(3)</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Prohibition of anti-competitive agreements, bid-rigging, and collusive tendering.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DRAWER FOOTER: Input Box */}
        <div className="p-3 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about GFR rules, tender clauses, or findings..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Send query"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
};

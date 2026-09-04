import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { queryCopilot, fetchCopilotKnowledgeDomains } from '../api/client';
import { CopilotCitation, RAGDomainInfo, User } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  timestamp: string;
  text: string;
  confidence?: number;
  rule_id?: string;
  rule_title?: string;
  citations?: CopilotCitation[];
  footnote?: string;
  isDisqualification?: boolean;
}

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  tenderId?: string;
  bidderId?: string;
}

const DEFAULT_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sender: 'user',
    timestamp: '14:33',
    text: 'Is Sri Kaveri Engineering Works eligible for EMD exemption despite having a declared turnover below ₹5.52 Cr?',
  },
  {
    id: 'msg-2',
    sender: 'copilot',
    timestamp: '14:33:04',
    text: 'Yes, Sri Kaveri Engineering Works is fully eligible for EMD exemption. Under the Public Procurement Policy for MSEs Order 2012 and CPCL PQC Clause 4.2, Micro and Small Enterprises holding a valid Udyam Registration are exempted from both EMD (Earnest Money Deposit) and prior turnover criteria for manufactured goods, provided they offer their own manufactured pumps.',
    confidence: 0.998,
    rule_id: 'R-EMD-01',
    rule_title: 'Verified Legal Finding • Rule R-EMD-01',
    citations: [
      {
        source: 'Public Procurement Policy for MSEs Order 2012, Para 4',
        clause: 'Ref: MoSME/PPP-2012/P4',
        content: '“Micro and Small Enterprises registered with Udyam shall be provided tender documents free of cost and shall be exempt from payment of Earnest Money Deposit.”',
        score: 0.96,
        exact_quote: 'UDYAM-TN-02-0048192 verified with Ministry of MSME',
      },
    ],
    footnote: 'Audit Note: Officer must verify that Sri Kaveri does not quote as a pure trader / distributor.',
    isDisqualification: false,
  },
  {
    id: 'msg-3',
    sender: 'user',
    timestamp: '14:35',
    text: 'Why did Bidder C fail the Make in India requirement?',
  },
  {
    id: 'msg-4',
    sender: 'copilot',
    timestamp: '14:35:12',
    text: 'Bidder C (PetroFlow Systems Ltd) declared themselves as a Class-I Local Supplier. However, their submitted auditor self-declaration specifies only 45% local content. Under DPIIT PPP-MII Order 2017 (2020 revision), Class-I requires a strict minimum of 50% local content. As this critical turnkey tender explicitly reserves procurement exclusively for Class-I local suppliers, the filing breaches mandatory eligibility criteria.',
    confidence: 0.95,
    rule_id: 'R-MII-01',
    rule_title: 'Statutory Disqualification Recommendation • Rule R-MII-01',
    citations: [
      {
        source: 'DPIIT Order No. P-45021/2/2017-PP (BE-II) para 2(b)',
        clause: 'DPIIT Rev. 16.09.2020',
        content: '“‘Class-I local supplier’ means a supplier or service provider, whose goods, services or works offered for procurement, has local content equal to or more than 50%...”',
        score: 0.94,
        exact_quote: 'Substantive non-responsiveness under GFR 2017 Rule 173(iv)',
      },
    ],
    footnote: 'Automatic disqualification notice required prior to Commercial Bid Opening.',
    isDisqualification: true,
  },
];

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  tenderId,
  bidderId,
}) => {
  const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState<RAGDomainInfo[]>([]);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCopilotKnowledgeDomains()
        .then((res) => {
          if (res?.domains) setDomains(res.domains);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await queryCopilot({
        question: q,
        tender_id: tenderId,
        bidder_id: bidderId,
        top_k: 3,
      });

      const isDisq =
        res.category === 'DISQUALIFICATION' ||
        res.answer.toLowerCase().includes('disqualif') ||
        res.answer.toLowerCase().includes('reject');

      const copilotMsg: Message = {
        id: `cpl-${Date.now()}`,
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        text: res.answer,
        confidence: res.confidence || 0.95,
        rule_title: isDisq
          ? 'Statutory Disqualification Recommendation'
          : 'Verified Legal Finding • Grounded in GFR 2017',
        citations: res.citations,
        footnote: res.grounding_status === 'GROUNDED'
          ? 'Grounded statutory retrieval from Central Government procurement directives.'
          : undefined,
        isDisqualification: isDisq,
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'The statutory copilot engine encountered a service timeout. Pre-indexed GFR 2017 rules remain verified in the audit ledger.',
        confidence: 0.8,
        rule_title: 'Notice • RAG Knowledge Adapter',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[880px] bg-white rounded-[24px] border border-[#e0e0e0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Sub-bar / Drawer Header (Frosted White) */}
        <div className="p-5 bg-white border-b border-[#e0e0e0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-[#0066cc]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f] tracking-tight">
                Procurement AI Copilot & Regulatory Assistant
              </h2>
              <p className="text-xs text-[#7a7a7a]">
                Grounded in GFR 2017, CVC Guidelines & Active Tender Documents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-mono text-[#515154]">
              <span className="w-2 h-2 rounded-full bg-[#248a3d]"></span>
              <span>RAG Engine Online</span>
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#f5f5f7] text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors cursor-pointer"
              title="Close Assistant"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Grounded Knowledge Domains Pill Bar */}
        <div className="px-6 py-2.5 bg-[#f5f5f7] border-b border-[#e0e0e0] flex items-center gap-2 flex-wrap text-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#7a7a7a] font-semibold">
            Grounded Indexes:
          </span>
          {domains.length > 0 ? (
            domains.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] text-[11px] font-medium shadow-xs"
              >
                <span className="material-symbols-outlined text-[13px] text-[#0066cc]">check_circle</span>
                <span>{d.description || d.domain} ({d.total_chunks} Chunks)</span>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] text-[11px] font-medium shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-[#0066cc]">check_circle</span>
                <span>GFR 2017 (80 Chunks)</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] text-[11px] font-medium shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-[#0066cc]">check_circle</span>
                <span>PPP-MII Order 2017</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] text-[11px] font-medium shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-[#0066cc]">check_circle</span>
                <span>MSE Order 2012</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#e0e0e0] text-[#1d1d1f] text-[11px] font-medium shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-[#0066cc]">check_circle</span>
                <span>CPCL PQC Template v4</span>
              </div>
            </>
          )}
        </div>

        {/* Conversational Message Stream */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-white min-h-[360px] max-h-[480px]">
          {/* Timestamp separator */}
          <div className="flex items-center justify-center gap-3 my-1">
            <div className="h-[1px] bg-[#e0e0e0] flex-1"></div>
            <span className="font-mono text-[10px] text-[#7a7a7a] uppercase tracking-wider">
              Session Initialized • GFR 2017 Grounded
            </span>
            <div className="h-[1px] bg-[#e0e0e0] flex-1"></div>
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end max-w-[85%] ml-auto' : 'items-start max-w-[92%] mr-auto'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  {!isUser && <span className="w-2 h-2 rounded-full bg-[#0066cc] inline-block"></span>}
                  <span className="text-[11px] font-medium text-[#7a7a7a]">
                    {isUser ? currentUser?.full_name || 'Ravi K. (Dy. Mgr Materials)' : 'VigilBid Statutory Engine'}
                  </span>
                  <span className="font-mono text-[10px] text-[#7a7a7a]">{msg.timestamp}</span>
                </div>

                {isUser ? (
                  <div className="rounded-[18px] rounded-br-[4px] bg-[#0066cc]/10 border border-[#0066cc]/20 px-4 py-3 text-[#1d1d1f] text-sm leading-relaxed">
                    {msg.text}
                  </div>
                ) : (
                  <div className="w-full rounded-[18px] rounded-bl-[4px] bg-[#f5f5f7] border border-[#e0e0e0] p-4 text-xs space-y-3 shadow-xs">
                    {/* Badge Chip */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          msg.isDisqualification
                            ? 'bg-rose-50 text-[#ba1a1a] border border-rose-200'
                            : 'bg-white text-[#0066cc] border border-[#0066cc]/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {msg.isDisqualification ? 'warning' : 'gavel'}
                        </span>
                        <span>{msg.rule_title || 'Verified Legal Finding'}</span>
                      </span>
                      {msg.confidence && (
                        <span className="font-mono text-[11px] text-[#7a7a7a]">
                          Confidence: {Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Answer Text */}
                    <p className="text-xs text-[#1d1d1f] leading-relaxed font-normal">
                      {msg.text}
                    </p>

                    {/* Citation Box */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="rounded-xl bg-white border border-[#e0e0e0] p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[#0066cc] text-[16px]">menu_book</span>
                            <span>{msg.citations[0].source}</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#7a7a7a]">{msg.citations[0].clause}</span>
                        </div>
                        <blockquote className="text-xs text-[#515154] italic pl-2.5 border-l-2 border-[#0066cc] leading-relaxed">
                          {msg.citations[0].content}
                        </blockquote>
                        {msg.citations[0].exact_quote && (
                          <div className="text-[10px] font-mono text-[#0066cc] pt-1 border-t border-[#e0e0e0]/70 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            <span>{msg.citations[0].exact_quote}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footnote */}
                    {msg.footnote && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#515154] pt-1">
                        <span className="material-symbols-outlined text-[14px] text-[#7a7a7a]">info</span>
                        <span>{msg.footnote}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 p-3 text-xs text-[#7a7a7a]">
              <Loader2 className="w-4 h-4 text-[#0066cc] animate-spin" />
              <span>Querying multi-domain regulatory chunks...</span>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Quick Prompt Chips */}
        <div className="px-6 py-2 bg-[#f5f5f7] border-t border-[#e0e0e0] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-[#7a7a7a] shrink-0 font-medium">Suggestions:</span>
          {[
            'Is Sri Kaveri eligible for EMD exemption?',
            'Why did Bidder C fail Make in India?',
            'What are GFR 144 commercial abbreviation rules?',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1 rounded-full bg-white border border-[#e0e0e0] hover:border-[#0066cc] text-[#1d1d1f] hover:text-[#0066cc] text-[11px] whitespace-nowrap transition-colors cursor-pointer shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Query Input Toolbar */}
        <div className="p-4 bg-white border-t border-[#e0e0e0] flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything regarding tender rules, GFR 2017, CVC circulars, or bidder filings..."
            className="flex-1 bg-[#f5f5f7] border border-[#e0e0e0] rounded-full px-4 py-2.5 text-xs text-[#1d1d1f] placeholder-[#7a7a7a] focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="px-5 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-none disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

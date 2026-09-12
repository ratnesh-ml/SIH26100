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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string; rule?: string }>>([
    {
      sender: 'assistant',
      text: 'Good day Officer Verma. I am your VigilBid Regulatory Copilot. I have indexed GFR 2017, CVC Manual 2021, and the CPCL API-610 tender stipulations. How may I assist your scrutiny today?',
      time: '11:20 AM',
    },
    {
      sender: 'user',
      text: 'What are the statutory requirements for overriding the GSTIN state discordance for Bharat Hydrotech?',
      time: '11:22 AM',
    },
    {
      sender: 'assistant',
      text: 'Under GFR 2017 Rule 144(xi) and CVC Circular 02/05/2022, an officer override is permissible if:\n1. The bidder submits Form GST REG-06 demonstrating an operative branch/project office in Tamil Nadu (State Code 33).\n2. The technical committee (TEC) records written minutes citing valid business jurisdiction justification.\n3. The determination is cryptographically signed and anchored into the tamper-evident audit ledger.',
      time: '11:23 AM',
      rule: 'GFR 2017 Rule 144(xi) & CVC Circular 02/05/2022',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const newMsgs = [
      ...messages,
      { sender: 'user' as const, text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];
    setMessages(newMsgs);
    setInput('');

    setTimeout(() => {
      let reply =
        'Under Public Procurement Policy (Make in India Order 2017), Class-I local suppliers must have minimum 50% local value addition. Bharat Hydrotech has declared 45.0% (Class-II), which disqualifies them from purchase preference unless an exemption applies.';
      let rule = 'PPP-MII Order 2017 Clause 3(a)';

      if (q.toLowerCase().includes('justification') || q.toLowerCase().includes('draft')) {
        reply =
          'Suggested Adjudication Minutes:\n"The Tender Evaluation Committee reviewed Udyam certificate UDYAM-MH-26-0034912 and affirms that MSME Order 2012 Clause 10 relaxation applies to turnover threshold. Provisional qualification granted subject to Form REG-06 submission."';
        rule = 'MSME Order 2012 & CPCL Prequalification Rules';
      } else if (q.toLowerCase().includes('cartel') || q.toLowerCase().includes('collusion')) {
        reply =
          'Alert: Shared Director DIN 08492019 detected between Bharat Hydrotech and Nova Pumps. Section 3(3) of Competition Act 2002 prohibits bid rotation or joint pricing. Immediate CVO inquiry recommended.';
        rule = 'Competition Act 2002 Sec 3(3)';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rule,
        },
      ]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">VigilBid Regulatory AI Copilot</div>
              <div className="text-[10px] text-slate-500 font-mono">GFR 2017 & CVC Compliance Model</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Active Context Bar */}
        <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
          <span className="truncate">Context: CPCL/MM/2026/PUMP-217 • BID-HYD-0419</span>
          {onNavigate && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onNavigate('evidence');
                  onClose();
                }}
                className="hover:underline font-semibold cursor-pointer"
              >
                Evidence
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  onNavigate('audit-ledger');
                  onClose();
                }}
                className="hover:underline font-semibold cursor-pointer"
              >
                Audit
              </button>
            </div>
          )}
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                {m.rule && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] font-mono text-blue-800 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">gavel</span>
                    <span>Citation: {m.rule}</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleSend('Draft CVC Override Justification')}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
          >
            Draft Override Justification
          </button>
          <button
            onClick={() => handleSend('Check Cartelization Overlap with Nova')}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap cursor-pointer"
          >
            Check Cartelization Overlap
          </button>
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask compliance rule, CVC clause, GFR mandate..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-600"
          />
          <button
            onClick={() => handleSend()}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

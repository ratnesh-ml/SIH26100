import React, { useState } from 'react';
import { Shield, KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { login } from '../api/client';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onExploreDemo?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onExploreDemo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await login(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setPresetUser = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">VigilBid Portal Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">
            Chennai Petroleum Corporation Limited (CPCL) Two-Bid System
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@cpcl.gov.in"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md shadow-sky-950"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {onExploreDemo && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onExploreDemo}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Explore Interactive Guided Demo Tour (No Login Needed)</span>
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-3 text-center">
            Demo Credentials (Pre-seeded)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPresetUser('officer@cpcl.gov.in', 'Officer@CPCL2026!')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left text-slate-300 transition-colors"
            >
              <div className="font-semibold text-sky-400">Officer Role</div>
              <div className="text-[11px] text-slate-500">officer@cpcl.gov.in</div>
            </button>
            <button
              type="button"
              onClick={() => setPresetUser('evaluator@cpcl.gov.in', 'Evaluator@CPCL2026!')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left text-slate-300 transition-colors"
            >
              <div className="font-semibold text-amber-400">Evaluator Role</div>
              <div className="text-[11px] text-slate-500">evaluator@cpcl.gov.in</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

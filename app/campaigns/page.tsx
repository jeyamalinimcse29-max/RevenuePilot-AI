'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Sparkles, Bot, CheckCircle2, Plus, Clock, RefreshCw } from 'lucide-react';
import { Campaign } from '@/lib/db/types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-brand-400" />
            <span>AI Re-engagement Campaigns</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Bounded campaign drafts formulated by RevenuePilot AI for at-risk and high-value customer cohorts.
          </p>
        </div>

        <button
          onClick={fetchCampaigns}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
            <Bot className="h-10 w-10 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-400">No active campaign drafts. The agent generates drafts during signal analysis cycles.</p>
          </div>
        ) : (
          campaigns.map(c => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800">
                    TARGET: {c.target_segment}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    STATUS: {c.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{c.name}</h3>
                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {c.agent_rationale}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                <div>
                  Offer: <span className="font-bold text-emerald-400 font-mono">{c.offer_type} ({c.discount_pct}% OFF)</span>
                </div>
                <div>
                  Est. Reach: <span className="text-white font-mono font-bold">{c.estimated_reach} shoppers</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { ScoreFactor } from '@/lib/db/types';
import { Target, TrendingUp, HelpCircle } from 'lucide-react';

interface OpportunityScoreBadgeProps {
  score: number;
  factors?: ScoreFactor[];
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

export function OpportunityScoreBadge({
  score,
  factors = [],
  size = 'md',
  showBreakdown = false,
}: OpportunityScoreBadgeProps) {
  let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';
  let badgeGlow = '';

  if (score >= 80) {
    colorClass = 'bg-rose-950/80 text-rose-300 border-rose-700/60';
    badgeGlow = 'shadow-rose-900/20';
  } else if (score >= 65) {
    colorClass = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
    badgeGlow = 'shadow-amber-900/20';
  } else if (score >= 40) {
    colorClass = 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60';
    badgeGlow = 'shadow-indigo-900/20';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border font-mono font-semibold shadow-sm ${colorClass} ${sizeClasses[size]} ${badgeGlow}`}
          title="Deterministic Opportunity Score (0-100)"
        >
          <Target className="h-3.5 w-3.5" />
          <span>Score: {score}/100</span>
        </span>
      </div>

      {showBreakdown && factors.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-brand-400" />
              Transparent Scoring Factors
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Deterministic Logic</span>
          </div>

          <div className="space-y-1.5">
            {factors.map((f, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                <div className="space-y-0.5">
                  <div className="text-slate-200 font-medium">{f.factor}</div>
                  <div className="text-slate-400 text-[10px]">{f.description}</div>
                </div>
                <div className="font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded flex-shrink-0">
                  +{f.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

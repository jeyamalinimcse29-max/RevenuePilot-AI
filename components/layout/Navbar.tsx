'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  PlayCircle,
  ShoppingBag,
  Bot,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  onOpenCopilot: () => void;
  onRunAgentCycle?: () => void;
  isRunningCycle?: boolean;
}

export function Navbar({ onOpenCopilot, onRunAgentCycle, isRunningCycle }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-razor-cyan p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Sparkles className="h-4 w-4 text-brand-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-brand-300 transition-colors">
                REVENUE<span className="text-brand-400">PILOT</span> <span className="text-xs px-1.5 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800 font-mono">AI</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Find revenue opportunities. Take action. Grow smarter.
            </p>
          </div>
        </Link>

        {/* Live Autonomous Agent Status Badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium tracking-wide">Razorpay Test Mode • Autonomous Agent Active</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Run Agent Cycle Trigger */}
        {onRunAgentCycle && (
          <button
            onClick={onRunAgentCycle}
            disabled={isRunningCycle}
            className="flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-950/50 hover:bg-brand-900/60 px-3 py-1.5 text-xs font-semibold text-brand-300 transition-colors disabled:opacity-50"
            title="Scan database & run autonomous AI reasoning cycle"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunningCycle ? 'animate-spin text-brand-400' : ''}`} />
            <span className="hidden md:inline">{isRunningCycle ? 'Analyzing Signals...' : 'Scan & Reason'}</span>
          </button>
        )}

        {/* Demo Center Quick Link */}
        <Link
          href="/demo-center"
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/50 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors"
        >
          <PlayCircle className="h-3.5 w-3.5 text-amber-400" />
          <span>Demo Center</span>
        </Link>

        {/* Customer Storefront Link */}
        <Link
          href="/store"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
        >
          <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Customer Store</span>
        </Link>

        {/* AI Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>
      </div>
    </header>
  );
}

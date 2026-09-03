'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Target,
  CreditCard,
  Users,
  Package,
  Megaphone,
  History,
  FlaskConical,
  Store,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview Dashboard', icon: LayoutDashboard, badge: null },
  { href: '/agent', label: 'AI Agent Hub', icon: Bot, badge: 'Live AI', highlight: true },
  { href: '/opportunities', label: 'Opportunities', icon: Target, badge: null },
  { href: '/payments', label: 'Payment Intelligence', icon: CreditCard, badge: null },
  { href: '/customers', label: 'Customer Segments', icon: Users, badge: null },
  { href: '/products', label: 'Products & Affinity', icon: Package, badge: null },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone, badge: null },
  { href: '/audit', label: 'Full Audit Trail', icon: History, badge: 'Immutable' },
];

const SECONDARY_ITEMS = [
  { href: '/demo-center', label: 'Simulation & Demo Hub', icon: FlaskConical, badge: 'Test Mode' },
  { href: '/store', label: 'Public Customer Store', icon: Store, badge: null },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Merchant Profile Pill */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-700/50 text-indigo-300 font-bold text-sm">
            AE
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate">Apex Electronics</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>Razorpay Test Mode</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Links */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Growth & Agent
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    item.highlight
                      ? 'bg-brand-950 text-brand-300 border-brand-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Demo & Evaluation Links */}
        <div className="space-y-1 pt-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Evaluation & Testing
          </p>
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Bounded Security Badge */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] space-y-1 text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Bounded Agent Policy</span>
        </div>
        <p className="text-[10px] leading-tight text-slate-400">
          Human-in-the-loop gate active. Zero autonomous funds movement.
        </p>
      </div>
    </aside>
  );
}

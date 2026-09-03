'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Bot,
  User,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Search,
  Code,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { AuditEvent } from '@/lib/db/types';

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterActor, setFilterActor] = useState('ALL');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit?limit=100');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filtered = events.filter(e => filterActor === 'ALL' || e.actor_type === filterActor);

  const getActorBadge = (actor: string) => {
    switch (actor) {
      case 'AI_AGENT':
        return 'bg-brand-950 text-brand-300 border-brand-700';
      case 'MERCHANT':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'CUSTOMER':
        return 'bg-indigo-950 text-indigo-300 border-indigo-700';
      case 'RAZORPAY_WEBHOOK':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <History className="h-6 w-6 text-brand-400" />
              <span>Immutable Audit Trail</span>
            </h1>
            <span className="rounded bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-bold uppercase flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>End-to-End Verifiable</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Chronological cryptographic ledger tracking all AI observations, reasoning runs, merchant approvals, tool calls, and Razorpay transactions.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Actor Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {['ALL', 'AI_AGENT', 'MERCHANT', 'CUSTOMER', 'RAZORPAY_WEBHOOK', 'SYSTEM'].map((actor) => (
          <button
            key={actor}
            onClick={() => setFilterActor(actor)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterActor === actor
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {actor.replace(/_/g, ' ')} ({actor === 'ALL' ? events.length : events.filter(e => e.actor_type === actor).length})
          </button>
        ))}
      </div>

      {/* Audit Timeline */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-500">
            No audit events found for the selected filter.
          </div>
        ) : (
          filtered.map((event) => {
            const isExpanded = expandedId === event.id;

            return (
              <div
                key={event.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition-colors shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActorBadge(event.actor_type)}`}>
                      {event.actor_type}
                    </span>

                    <span className="font-mono text-xs font-bold text-white">
                      {event.event_type}
                    </span>

                    {event.opportunity_id && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        Opp: {event.opportunity_id}
                      </span>
                    )}

                    {event.payment_id && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Pay: {event.payment_id}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span>{new Date(event.created_at).toLocaleDateString()} {new Date(event.created_at).toLocaleTimeString()}</span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Inspect Metadata Payload"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Message / Summary */}
                <div className="text-xs text-slate-300 font-sans">
                  {event.metadata.message || event.metadata.notes || event.metadata.signal_type || event.metadata.action_title || `Audit event ${event.event_type} executed by ${event.actor_type}.`}
                </div>

                {/* Expanded JSON Inspector */}
                {isExpanded && (
                  <div className="mt-3 rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Code className="h-3 w-3 text-brand-400" />
                        <span>Audit Record Schema</span>
                      </span>
                      <span>Run ID: {event.agent_run_id}</span>
                    </div>
                    <pre className="text-[11px] font-mono text-emerald-300/90 overflow-x-auto p-2 bg-slate-900/80 rounded-lg">
                      {JSON.stringify(event, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

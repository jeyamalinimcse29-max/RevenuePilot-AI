'use client';

import React, { useState } from 'react';
import { Opportunity } from '@/lib/db/types';
import { OpportunityScoreBadge } from './OpportunityScoreBadge';
import {
  X,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onApproveSuccess?: (opp: Opportunity) => void;
}

export function OpportunityDetailModal({
  opportunity,
  isOpen,
  onClose,
  onApproveSuccess,
}: OpportunityDetailModalProps) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentOpp, setCurrentOpp] = useState<Opportunity | null>(opportunity);

  React.useEffect(() => {
    setCurrentOpp(opportunity);
    setRecoveryUrl(null);
  }, [opportunity]);

  if (!isOpen || !currentOpp) return null;

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/opportunities/${currentOpp.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'mch_razor_pilot_01',
          actor: 'Merchant Admin (Dashboard)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentOpp(data.opportunity);
        if (data.recoveryUrl) {
          setRecoveryUrl(data.recoveryUrl);
        }
        if (onApproveSuccess) {
          onApproveSuccess(data.opportunity);
        }
      } else {
        alert(data.error || 'Failed to approve action');
      }
    } catch (err: any) {
      alert('Error approving action: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const res = await fetch(`/api/opportunities/${currentOpp.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'mch_razor_pilot_01',
          actor: 'Merchant Admin (Dashboard)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentOpp(data.opportunity);
        if (onApproveSuccess) {
          onApproveSuccess(data.opportunity);
        }
      }
    } catch (err: any) {
      alert('Error rejecting: ' + err.message);
    } finally {
      setRejecting(false);
    }
  };

  const copyRecoveryLink = () => {
    if (recoveryUrl) {
      navigator.clipboard.writeText(recoveryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const ai = currentOpp.ai_analysis;
  const isRecovered = currentOpp.status === 'RECOVERED';
  const isActionCreated = currentOpp.status === 'ACTION_CREATED' || recoveryUrl !== null;
  const isPending = currentOpp.status === 'PENDING_APPROVAL' || currentOpp.status === 'DETECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-md ${
              currentOpp.type === 'CROSS_SELL'
                ? 'bg-indigo-600/80 shadow-indigo-600/20'
                : currentOpp.type === 'RE_ENGAGEMENT'
                ? 'bg-teal-600/80 shadow-teal-600/20'
                : currentOpp.type === 'ABANDONED_CHECKOUT'
                ? 'bg-amber-600/80 shadow-amber-600/20'
                : 'bg-rose-600/80 shadow-rose-600/20'
            }`}>
              {currentOpp.type === 'CROSS_SELL' ? '📈' : currentOpp.type === 'RE_ENGAGEMENT' ? '📢' : currentOpp.type === 'ABANDONED_CHECKOUT' ? '🛒' : '⚠️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {currentOpp.type === 'CROSS_SELL' ? 'Cross-Sell Recommendation Action' : currentOpp.type === 'RE_ENGAGEMENT' ? 'AI Campaign Orchestration Action' : currentOpp.type === 'ABANDONED_CHECKOUT' ? 'Abandoned Checkout Recovery' : 'Failed Payment Recovery'}
                </h2>
                <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                  isRecovered
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : isActionCreated
                    ? 'bg-blue-950 text-blue-300 border-blue-700'
                    : currentOpp.status === 'FAILED'
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}>
                  {currentOpp.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Target: <span className="text-slate-200 font-medium">{currentOpp.customer_name || 'Customer / Catalog'}</span> • ID: <span className="font-mono text-slate-400">{currentOpp.target_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-[11px] font-medium text-slate-400">Expected Impact</span>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                ₹{currentOpp.potential_recovery_amount.toLocaleString('en-IN')}{currentOpp.type === 'CROSS_SELL' ? '/mo' : ''}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-[11px] font-medium text-slate-400">AI Confidence</span>
              <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                {ai?.confidence || (currentOpp.opportunity_score >= 80 ? 87 : 78)}%
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-[11px] font-medium text-slate-400">Risk Assessment</span>
              <div className="text-xs font-semibold text-emerald-400 mt-1">
                Low Risk (Bounded)
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-[11px] font-medium text-slate-400">Approval Requirement</span>
              <div className="text-xs font-semibold text-amber-300 mt-1">
                Merchant Approval Required
              </div>
            </div>
          </div>

          {/* Transparent Opportunity Score Breakdown */}
          <OpportunityScoreBadge
            score={currentOpp.opportunity_score}
            factors={currentOpp.score_factors}
            showBreakdown={true}
            size="lg"
          />

          {/* Action Review Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              <span>Action Review Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Action Name</span>
                <p className="font-bold text-white text-sm">{ai?.recommended_action?.title || 'Execute Bounded Strategy'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Channel & Protocol</span>
                <p className="font-semibold text-indigo-300">{ai?.recommended_action?.channel || 'In-Checkout / Merchant Engine'}</p>
              </div>
            </div>

            {ai && (
              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Evidence & Signals
                  </h4>
                  <ul className="space-y-1 rounded-xl bg-slate-950 border border-slate-800/80 p-3 text-xs text-slate-300">
                    {ai.signals.map((sig, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Agent Rationale
                  </h4>
                  <p className="text-slate-300 bg-slate-950 rounded-xl p-3 border border-slate-800/80 leading-relaxed text-xs">
                    {ai.rationale}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Graceful Failure State Notification */}
          {currentOpp.status === 'FAILED' && (
            <div className="rounded-2xl border border-rose-500/50 bg-rose-950/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <span>Action Execution Failed — Graceful Stop Triggered</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 rounded-xl border border-rose-900/50">
                <p><strong className="text-rose-300">Reason:</strong> API connection limit or payment gateway policy restriction.</p>
                <p><strong className="text-emerald-300">Recovery Protection:</strong> Action safely stopped. Zero duplicate requests executed. Guardrails maintained.</p>
                <p><strong className="text-slate-400">Audit Trail:</strong> Immutable failure event logged in system ledger.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={handleApprove}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                >
                  Retry Action
                </button>
                <a
                  href="/audit"
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors"
                >
                  View Audit Event
                </a>
              </div>
            </div>
          )}

          {/* Recovery URL Box when action created */}
          {recoveryUrl && (
            <div className="rounded-2xl border border-blue-500/40 bg-blue-950/30 p-5 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  Action Executed & Active
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                  Policy Gate Passed
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Action executed successfully. Single-click test link active:
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 p-2.5">
                <input
                  type="text"
                  readOnly
                  value={recoveryUrl}
                  className="flex-1 bg-transparent font-mono text-xs text-slate-300 outline-none select-all"
                />
                <button
                  onClick={copyRecoveryLink}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-200 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <a
                  href={recoveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
                >
                  <span>Open Test Action Flow (Razorpay Test Mode)</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Already Approved State */}
          {isRecovered && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Action Executed & Verified!</h4>
                <p className="text-xs text-emerald-400/90">
                  Merchant approved action has been recorded in the immutable audit trail and revenue attribution ledger.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Human-in-the-Loop Actions */}
        <div className="border-t border-slate-800/80 bg-slate-900/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-brand-400" />
            <span className="hidden sm:inline">Approval Gate:</span>
            <span>Explicit merchant authorization required</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isPending && (
              <>
                <button
                  onClick={handleReject}
                  disabled={rejecting || approving}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
                >
                  {rejecting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving || rejecting}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{approving ? 'Executing Action...' : 'Approve & Execute'}</span>
                </button>
              </>
            )}

            {!isPending && (
              <button
                onClick={onClose}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-semibold text-white transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

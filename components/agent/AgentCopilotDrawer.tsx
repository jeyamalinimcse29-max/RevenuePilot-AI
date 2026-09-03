'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Wrench, Shield, CheckCircle2, ChevronRight } from 'lucide-react';
import { ChatMessage } from '@/lib/agent/copilot';

interface AgentCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'What is our highest-value opportunity right now?',
  'Why is revenue at risk?',
  'Show failed payments in Razorpay',
  'How much revenue have we recovered?',
  'Show my abandoned checkouts',
];

export function AgentCopilotDrawer({ isOpen, onClose }: AgentCopilotDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hello! I am **RevenuePilot AI Copilot**. I analyze merchant signals across checkouts, failed payments, and customer retention.\n\nAsk me anything about your store's opportunities, recovered revenue, or at-risk transactions. Every response is grounded in real database tools with zero hallucination.`,
      toolsUsed: ['get_revenue_metrics'],
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (queryText?: string) => {
    const query = queryText || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: messages,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: 'msg_err_' + Date.now(),
            role: 'assistant',
            content: `I encountered an issue querying the database: ${data.error || 'Please try again.'}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_err_' + Date.now(),
          role: 'assistant',
          content: 'Unable to communicate with the AI reasoning service. Please check connection.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-slate-950 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Merchant AI Assistant</h3>
                <span className="rounded bg-emerald-950/80 border border-emerald-700/50 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300">
                  Grounded in DB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Grounded revenue reasoning via bounded tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Tool Invocation Tag */}
                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                    <Wrench className="h-3 w-3 text-brand-400" />
                    <span>Tools executed:</span>
                    {msg.toolsUsed.map((t) => (
                      <span key={t} className="rounded bg-slate-800 px-1.5 py-0.5 text-brand-300 border border-slate-700">
                        {t}()
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-slate-400 w-fit">
              <Sparkles className="h-4 w-4 text-brand-400 animate-spin" />
              <span>Querying database tools & reasoning...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-slate-800/80 bg-slate-900/30 px-4 py-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Quick Inquiries
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="rounded-full bg-slate-900 border border-slate-700/60 hover:border-brand-500/50 hover:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition-all text-left truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="border-t border-slate-800/80 bg-slate-900/80 p-4 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about revenue, lost carts, decline reasons..."
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-500 px-4 py-2.5 text-white disabled:opacity-50 transition-colors shadow-md shadow-brand-600/20"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

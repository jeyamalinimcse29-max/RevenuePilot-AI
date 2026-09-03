'use client';

import React, { useState } from 'react';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { AgentCopilotDrawer } from '@/components/agent/AgentCopilotDrawer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [runningCycle, setRunningCycle] = useState(false);

  const handleRunCycle = async () => {
    setRunningCycle(true);
    try {
      const res = await fetch('/api/agent/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningCycle(false);
    }
  };

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <title>RevenuePilot AI — Bounded Revenue Growth Agent for Razorpay</title>
        <meta name="description" content="AI Revenue Growth Agent for merchants on Razorpay test-mode APIs." />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-brand-500/30 selection:text-brand-200">
        <Navbar
          onOpenCopilot={() => setCopilotOpen(true)}
          onRunAgentCycle={handleRunCycle}
          isRunningCycle={runningCycle}
        />
        <div className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>

        <AgentCopilotDrawer
          isOpen={copilotOpen}
          onClose={() => setCopilotOpen(false)}
        />
      </body>
    </html>
  );
}

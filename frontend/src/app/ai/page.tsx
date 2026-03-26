'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// ── Stub "analysis" result types — wire to real AI later ──
interface AiInsight {
  icon:    string;
  title:   string;
  body:    string;
  tag:     string;
  tagColor: string;
}

const STUB_INSIGHTS: AiInsight[] = [
  {
    icon: '📈',
    title: 'Herd Growth Forecast',
    body: 'Based on current pregnancy dates and historical birth rates, the AI model will forecast expected herd size over the next 6 months with confidence intervals.',
    tag: 'Predictive',
    tagColor: 'text-[#5bbfb0] bg-[#5bbfb0]/10 border-[#5bbfb0]/30',
  },
  {
    icon: '🩺',
    title: 'Health Risk Alerts',
    body: 'The AI engine will analyse species, age distribution and seasonal patterns to flag animals at elevated health risk and recommend preventive actions.',
    tag: 'Health',
    tagColor: 'text-[#d4a84b] bg-[#d4a84b]/10 border-[#d4a84b]/30',
  },
  {
    icon: '🍃',
    title: 'Feed Optimisation',
    body: 'Feed requirements will be calculated per group using weight estimates, growth stage, and pregnancy status — with cost-efficiency suggestions.',
    tag: 'Efficiency',
    tagColor: 'text-[#6dba7d] bg-[#6dba7d]/10 border-[#6dba7d]/30',
  },
  {
    icon: '🐣',
    title: 'Offspring Survival Score',
    body: 'Each pregnant animal will receive a predicted offspring survival score derived from maternal history, breed, and environmental factors.',
    tag: 'Breeding',
    tagColor: 'text-violet-400 bg-violet-900/20 border-violet-800/40',
  },
];

// ── Animated typing dots ─────────────────────────────────
function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center ml-2">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#6dba7d] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

export default function AiPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [running,  setRunning]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // Stub: fake progress animation
  const runAnalysis = () => {
    if (running) return;
    setRunning(true); setDone(false); setProgress(0);

    const steps = [
      [300,  10, 'Loading livestock data…'],
      [700,  28, 'Computing gestation timelines…'],
      [1200, 45, 'Running herd health model…'],
      [1800, 62, 'Analysing breeding patterns…'],
      [2400, 78, 'Generating feed estimates…'],
      [3000, 91, 'Compiling insights…'],
      [3600, 100,'Analysis complete ✓'],
    ] as [number, number, string][];

    steps.forEach(([delay, pct, msg]) => {
      setTimeout(() => {
        setProgress(pct);
        setStatusMsg(msg);
        if (pct === 100) { setRunning(false); setDone(true); }
      }, delay);
    });
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#0f1210]">
      {/* Nav */}
      <header className="border-b border-[#2a3029] px-8 py-4 flex items-center justify-between sticky top-0 bg-[#0f1210]/90 backdrop-blur-sm z-40">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 text-[#7a8c79] hover:text-[#e8ead6] transition-colors">
            <span className="text-xl">🌿</span>
            <span className="font-display text-lg">SmartLivestock</span>
          </a>
          <nav className="flex items-center gap-1">
            <a href="/" className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors">Dashboard</a>
            <a href="/groups" className="px-3 py-1.5 rounded-lg text-sm text-[#7a8c79] hover:text-[#e8ead6] hover:bg-[#1e2520] transition-colors">Groups</a>
            <a href="/ai" className="px-3 py-1.5 rounded-lg text-sm text-[#e8ead6] bg-[#1e2520] border border-[#2a3029] flex items-center gap-1.5">
              <span className="text-xs">✨</span> AI Analysis
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#7a8c79] font-mono">{user.fullName}</span>
          <button onClick={logout} className="text-xs text-[#7a8c79] hover:text-rose-400 transition-colors border border-[#2a3029] px-3 py-1.5 rounded-lg">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl text-[#e8ead6]">AI Analysis</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#1e2520] border border-[#2a3029] text-[#7a8c79]">
              Coming Soon
            </span>
          </div>
          <p className="text-sm text-[#7a8c79] max-w-lg">
            Intelligent herd analysis powered by machine learning. Connect your AI provider to activate these features.
          </p>
        </div>

        {/* CTA card */}
        <div className="bg-[#161a17] border border-[#2a3029] rounded-2xl p-8 flex flex-col items-center gap-5 text-center relative overflow-hidden">
          {/* Decorative glow blob */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full bg-[#6dba7d]/5 blur-3xl" />
          </div>

          <div className="text-5xl">🤖</div>
          <div>
            <h2 className="font-display text-2xl text-[#e8ead6]">Run Herd Intelligence</h2>
            <p className="text-sm text-[#7a8c79] mt-1 max-w-sm">
              This will analyse all your livestock data and generate actionable insights. AI provider integration required.
            </p>
          </div>

          {/* Progress bar */}
          {(running || done) && (
            <div className="w-full max-w-md flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#7a8c79]">
                <span className="flex items-center">
                  {statusMsg}
                  {running && <TypingDots />}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-[#1e2520] rounded-full overflow-hidden border border-[#2a3029]">
                <div
                  className="h-full bg-[#6dba7d] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={running}
            className="px-8 py-3 rounded-xl bg-[#6dba7d] text-[#0f1210] font-semibold text-sm hover:bg-[#7dca8d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
          >
            {running ? 'Analysing…' : done ? 'Run Again' : '✨ Run AI Analysis'}
          </button>

          {done && (
            <p className="text-xs text-[#6dba7d] font-mono">
              ✓ Analysis complete — results shown below (stub data)
            </p>
          )}
        </div>

        {/* Insight cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {STUB_INSIGHTS.map((insight, i) => (
            <div key={i}
              className={`bg-[#161a17] border border-[#2a3029] rounded-xl p-5 flex flex-col gap-3 transition-all duration-300 ${done ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{insight.icon}</span>
                  <h3 className="font-display text-lg text-[#e8ead6]">{insight.title}</h3>
                </div>
                <span className={`shrink-0 text-xs font-mono border px-2 py-0.5 rounded ${insight.tagColor}`}>
                  {insight.tag}
                </span>
              </div>
              <p className="text-sm text-[#7a8c79] leading-relaxed">{insight.body}</p>

              {/* Placeholder chart bar */}
              <div className="mt-auto pt-3 border-t border-[#2a3029] flex gap-1 items-end h-10">
                {[40,65,50,80,70,90,60,75,85,55].map((h, j) => (
                  <div key={j}
                    className="flex-1 rounded-sm bg-[#6dba7d]/20 border-t border-[#6dba7d]/40 transition-all duration-700"
                    style={{ height: done ? `${h}%` : '10%', transitionDelay: `${j * 60}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs font-mono text-[#3a4239] text-center">
                {done ? '— stub data — wire AI model to populate —' : 'Run analysis to see results'}
              </p>
            </div>
          ))}
        </div>

        {/* Integration note */}
        <div className="bg-[#161a17] border border-dashed border-[#2a3029] rounded-xl p-6 flex flex-col gap-3">
          <h3 className="font-display text-lg text-[#e8ead6]">🔌 How to wire up a real AI</h3>
          <p className="text-sm text-[#7a8c79] leading-relaxed">
            This page is a <span className="font-mono text-[#6dba7d]">stub / placeholder</span>. To activate real intelligence:
          </p>
          <ol className="flex flex-col gap-1.5 text-sm text-[#7a8c79] list-decimal list-inside leading-relaxed">
            <li>Add a <span className="font-mono text-[#e8ead6]">POST /api/ai/analyse</span> endpoint to the Spring Boot backend.</li>
            <li>Call your preferred model (OpenAI, Claude API, Gemini, local Ollama, etc.) with the livestock data as context.</li>
            <li>Replace the <span className="font-mono text-[#e8ead6]">STUB_INSIGHTS</span> constant in this file with the live API response.</li>
            <li>Update <span className="font-mono text-[#e8ead6]">runAnalysis()</span> to call <span className="font-mono text-[#e8ead6]">fetch('/api/ai/analyse')</span> instead of the fake timeout.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

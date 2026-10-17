/**
 * Multi-Device Stage Studio & Mobile Gateway (GramPay BharatVoice Shield)
 * =========================================================================
 * Specifically built for:
 * - Physical Phone 1 (Farmer Genuine)
 * - Physical Phone 2 (Scammer Impostor)
 * - Laptop Screen (Judge Telemetry Console)
 * - Tri-Device Stage Studio Mode
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Layers, 
  ShieldAlert, 
  ShieldCheck, 
  Terminal
} from 'lucide-react';
import { Phone1Farmer } from './Phone1Farmer';
import { Phone2Scammer } from './Phone2Scammer';
import { LaptopConsole } from './LaptopConsole';
import { ErrorBoundary } from './ErrorBoundary';
import { TriDeviceStateSynchronizer } from '../services/stateSync';

export type ActiveView = 'PHONE_1' | 'PHONE_2' | 'LAPTOP_CONSOLE' | 'TRIPLE_STAGE';

export const StudioView: React.FC = () => {
  // Synchronous initialization based on URL query or mobile viewport
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const device = params.get('device');

      if (mode === 'console') return 'LAPTOP_CONSOLE';
      if (mode === 'caller' && device === 'phone1') return 'PHONE_1';
      if (mode === 'caller' && device === 'phone2') return 'PHONE_2';

      // Mobile devices (width <= 768px) default directly to Phone 1 Farmer!
      if (window.innerWidth <= 768) {
        return 'PHONE_1';
      }
    }
    return 'TRIPLE_STAGE';
  });

  const [synchronizer] = useState(() => new TriDeviceStateSynchronizer('LAPTOP_CONSOLE_SOC'));
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update activeView when URL changes
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const device = params.get('device');

      if (mode === 'console') setActiveView('LAPTOP_CONSOLE');
      else if (mode === 'caller' && device === 'phone1') setActiveView('PHONE_1');
      else if (mode === 'caller' && device === 'phone2') setActiveView('PHONE_2');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchView = (view: ActiveView) => {
    setActiveView(view);
    const url = new URL(window.location.href);
    if (view === 'PHONE_1') {
      url.searchParams.set('mode', 'caller');
      url.searchParams.set('device', 'phone1');
    } else if (view === 'PHONE_2') {
      url.searchParams.set('mode', 'caller');
      url.searchParams.set('device', 'phone2');
    } else if (view === 'LAPTOP_CONSOLE') {
      url.searchParams.set('mode', 'console');
      url.searchParams.delete('device');
    } else {
      url.searchParams.delete('mode');
      url.searchParams.delete('device');
    }
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none">
      {/* Top Header / Switcher Bar (Hidden if on standalone mobile view to maximize screen estate, or shown compact) */}
      {!isMobileScreen && (
        <nav className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md text-white">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-emerald-400 font-mono tracking-tight flex items-center gap-1.5">
              🌾 GramPay (BharatVoice Shield)
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">
              | Zero-Trust Voice Gateway
            </span>
          </div>

          {/* Desktop View Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => switchView('TRIPLE_STAGE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'TRIPLE_STAGE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={14} /> Stage Studio (All 3)
            </button>

            <button
              onClick={() => switchView('PHONE_1')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'PHONE_1'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone size={14} className="text-emerald-400" /> Phone 1 (Farmer)
            </button>

            <button
              onClick={() => switchView('PHONE_2')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'PHONE_2'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone size={14} className="text-red-400" /> Phone 2 (Scammer)
            </button>

            <button
              onClick={() => switchView('LAPTOP_CONSOLE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'LAPTOP_CONSOLE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop size={14} className="text-blue-400" /> Laptop Console
            </button>
          </div>
        </nav>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        {activeView === 'PHONE_1' && (
          <div className="w-full max-w-md mx-auto min-h-screen bg-white shadow-2xl">
            <ErrorBoundary>
              <Phone1Farmer synchronizer={synchronizer} />
            </ErrorBoundary>
          </div>
        )}

        {activeView === 'PHONE_2' && (
          <div className="w-full max-w-md mx-auto min-h-screen bg-slate-900 shadow-2xl">
            <ErrorBoundary>
              <Phone2Scammer synchronizer={synchronizer} />
            </ErrorBoundary>
          </div>
        )}

        {activeView === 'LAPTOP_CONSOLE' && (
          <div className="min-h-screen bg-slate-950">
            <ErrorBoundary>
              <LaptopConsole synchronizer={synchronizer} />
            </ErrorBoundary>
          </div>
        )}

        {/* TRIPLE STAGE: Side-by-Side Presentation Mode */}
        {activeView === 'TRIPLE_STAGE' && !isMobileScreen && (
          <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-5 max-w-[1800px] mx-auto w-full">
            {/* Phone 1 Frame */}
            <div className="xl:col-span-3 flex flex-col">
              <div className="bg-slate-900 px-3 py-2 rounded-t-2xl border-t border-x border-slate-800 flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Smartphone size={14} /> Physical Device 1 (Farmer)
                </span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                  Genuine Caller
                </span>
              </div>
              <div className="border border-slate-800 rounded-b-2xl overflow-hidden shadow-2xl bg-white flex-1 min-h-[700px]">
                <ErrorBoundary>
                  <Phone1Farmer synchronizer={synchronizer} />
                </ErrorBoundary>
              </div>
            </div>

            {/* Phone 2 Frame */}
            <div className="xl:col-span-3 flex flex-col">
              <div className="bg-slate-900 px-3 py-2 rounded-t-2xl border-t border-x border-slate-800 flex items-center justify-between text-xs font-mono font-bold text-red-400">
                <span className="flex items-center gap-1.5">
                  <Smartphone size={14} /> Physical Device 2 (Scammer)
                </span>
                <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded text-red-300">
                  Impostor / Clone
                </span>
              </div>
              <div className="border border-slate-800 rounded-b-2xl overflow-hidden shadow-2xl bg-slate-900 flex-1 min-h-[700px]">
                <ErrorBoundary>
                  <Phone2Scammer synchronizer={synchronizer} />
                </ErrorBoundary>
              </div>
            </div>

            {/* Laptop Console Frame */}
            <div className="xl:col-span-6 flex flex-col">
              <div className="bg-slate-900 px-3 py-2 rounded-t-2xl border-t border-x border-slate-800 flex items-center justify-between text-xs font-mono font-bold text-blue-400">
                <span className="flex items-center gap-1.5">
                  <Laptop size={14} /> Laptop Screen (Projector Output)
                </span>
                <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">
                  Bank SOC Telemetry
                </span>
              </div>
              <div className="border border-slate-800 rounded-b-2xl overflow-hidden shadow-2xl bg-slate-950 flex-1">
                <ErrorBoundary>
                  <LaptopConsole synchronizer={synchronizer} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar for Mobile Phones */}
      {isMobileScreen && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 z-50 flex items-center justify-around gap-1 text-white">
          <button
            onClick={() => switchView('PHONE_1')}
            className={`flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all ${
              activeView === 'PHONE_1'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={18} className={activeView === 'PHONE_1' ? 'text-white' : 'text-emerald-400'} />
            <span>Phone 1 (Farmer)</span>
          </button>

          <button
            onClick={() => switchView('PHONE_2')}
            className={`flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all ${
              activeView === 'PHONE_2'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert size={18} className={activeView === 'PHONE_2' ? 'text-white' : 'text-red-400'} />
            <span>Phone 2 (Scammer)</span>
          </button>

          <button
            onClick={() => switchView('LAPTOP_CONSOLE')}
            className={`flex-1 py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all ${
              activeView === 'LAPTOP_CONSOLE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal size={18} className={activeView === 'LAPTOP_CONSOLE' ? 'text-white' : 'text-blue-400'} />
            <span>Console</span>
          </button>
        </nav>
      )}
    </div>
  );
};

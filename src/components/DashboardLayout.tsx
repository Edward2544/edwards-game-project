import React, { useState } from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Sliders,
  ArrowRightLeft,
  BarChart3,
  Download,
  RotateCcw,
  Menu,
  X,
  ClipboardList,
  Gamepad2,
  CreditCard,
} from 'lucide-react';
import { UniverseState } from '../types/universe';
import { OfflineIndicator, PWAInstallButton } from './PWAInstallButton';

interface DashboardLayoutProps {
  state: UniverseState;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMatchScreen: () => void;
  onOpenMasterDashboard: () => void;
  onExportSave: () => void;
  onResetCareer: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'hub', label: 'Career Hub', shortLabel: 'Hub', icon: LayoutDashboard },
  { id: 'cards', label: 'Player Cards & Packs', shortLabel: 'Cards', icon: CreditCard },
  { id: 'competitions', label: 'Competitions & Table', shortLabel: 'Table', icon: Trophy },
  { id: 'squad', label: 'Squad & Development', shortLabel: 'Squad', icon: Users },
  { id: 'tactics', label: 'Tactics Board', shortLabel: 'Tactics', icon: Sliders },
  { id: 'transfers', label: 'Transfers & Finances', shortLabel: 'Market', icon: ArrowRightLeft },
  { id: 'awards', label: 'Stats, Review & Career', shortLabel: 'Stats', icon: BarChart3 },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  state,
  activeTab,
  onSelectTab,
  onOpenMatchScreen,
  onOpenMasterDashboard,
  onExportSave,
  onResetCareer,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0E131E] border-r border-white/10">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="text-xl font-bold font-display uppercase tracking-tight text-white whitespace-nowrap">
            Football <span className="text-[#2E86FF]">Mtaani</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">
            {state.userClub?.name} · {state.seasonLabel}
          </div>
        </div>

        <div className="px-3 pt-4">
          <button
            onClick={onOpenMatchScreen}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] transition-colors shadow-sm"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Match Screen (Play 3D)</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#2E86FF] text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <PWAInstallButton />
          <button
            onClick={onExportSave}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Career Save</span>
          </button>
          <button
            onClick={onResetCareer}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Career Universe</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/75 flex">
          <div className="w-64 bg-[#0E131E] border-r border-white/10 flex flex-col h-full">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-lg font-bold font-display uppercase text-white">
                Football <span className="text-[#2E86FF]">Mtaani</span>
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 pt-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMatchScreen();
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-[#2E86FF] rounded-lg"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Match Screen (Play 3D)</span>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs font-medium rounded-lg ${
                      active ? 'bg-[#2E86FF] text-white font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 space-y-2">
              <PWAInstallButton />
              <button
                onClick={onExportSave}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-200 bg-white/5 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Career Save</span>
              </button>
              <button
                onClick={onResetCareer}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-rose-300 bg-rose-500/10 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Career Universe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0B0F17]/95 border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-white/5 text-slate-200"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-400 truncate">
              <span className="text-white font-semibold">{state.userClub?.shortName || state.userClub?.name}</span>
              <span className="mx-1.5">/</span>
              <span className="hidden sm:inline">Season {state.seasonLabel} / </span>
              <span className="text-[#2E86FF] font-medium">
                {state.phase === 'pre-season'
                  ? 'Pre-Season'
                  : state.phase === 'season-end'
                  ? 'Review'
                  : state.phase === 'off-season'
                  ? 'Off-Season'
                  : `MD ${state.currentMatchday}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="sm:hidden">
              <PWAInstallButton compact />
            </div>
            <button
              onClick={onOpenMasterDashboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] transition-colors whitespace-nowrap shrink-0"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Native Bottom Tab Bar */}
      <nav
        aria-label="Mobile career navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#0E131E] border-t border-white/10 grid grid-cols-5 px-1 pb-safe"
      >
        <button
          onClick={() => onSelectTab('hub')}
          className={`min-h-[54px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'hub' ? 'text-[#2E86FF]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Hub</span>
        </button>

        <button
          onClick={() => onSelectTab('cards')}
          className={`min-h-[54px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'cards' ? 'text-[#2E86FF]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>Cards</span>
        </button>

        <button
          onClick={onOpenMatchScreen}
          className="min-h-[54px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-[#2E86FF]"
        >
          <Gamepad2 className="w-5 h-5 shrink-0" />
          <span>Match 3D</span>
        </button>

        <button
          onClick={() => onSelectTab('competitions')}
          className={`min-h-[54px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'competitions' ? 'text-[#2E86FF]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 shrink-0" />
          <span>Table</span>
        </button>

        <button
          onClick={() => onSelectTab('squad')}
          className={`min-h-[54px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'squad' ? 'text-[#2E86FF]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Squad</span>
        </button>
      </nav>

      <OfflineIndicator />
    </div>
  );
};

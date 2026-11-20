import React, { useState } from 'react';
import { ArrowRight, Gamepad2, Mic, Play, Sparkles, Upload, Trophy, ShieldAlert, TrendingUp } from 'lucide-react';
import { ShengCommentatorId, UniverseState } from '../types/universe';
import { LEAGUE_PRESETS } from '../data/presets';
import { SHENG_COMMENTATORS } from '../engine/simulator';
import { aiService } from '../services/aiService';
import { OfflineIndicator, PWAInstallButton } from './PWAInstallButton';

interface OpeningStageProps {
  state: UniverseState;
  onUpdateNarrative: (narrative: UniverseState['openingDocNarrative']) => void;
  onChangeCommentator: (id: ShengCommentatorId) => void;
  onProceed: () => void;
  onPlayQuick3D: () => void;
  onImportState: (imported: UniverseState) => void;
}

export const OpeningStage: React.FC<OpeningStageProps> = ({
  state,
  onUpdateNarrative,
  onChangeCommentator,
  onProceed,
  onPlayQuick3D,
  onImportState,
}) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateNarration = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const leaguesPayload = LEAGUE_PRESETS.map((l) => ({
        name: l.name,
        clubs: l.clubs.slice(0, 5).map((c) => c.name),
      }));
      const res = await aiService.generateOpening(state.seasonLabel, leaguesPayload);
      onUpdateNarrative(res);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate AI narration.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && parsed.seasonLabel && parsed.clubs) {
          onImportState(parsed as UniverseState);
        } else {
          setAiError('Invalid career save file format.');
        }
      } catch {
        setAiError('Could not parse the selected JSON save file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-12">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="text-2xl font-bold tracking-tight font-display uppercase text-white whitespace-nowrap shrink-0">
            Football <span className="text-[#2E86FF]">Mtaani</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <PWAInstallButton compact />
            <label className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Career</span>
              <input type="file" accept="application/json" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={onProceed}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Select Club</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Cinematic Documentary Hero */}
        <section className="mt-8 relative overflow-hidden rounded-xl border border-white/10 bg-[#121824]">
          <div className="relative h-72 md:h-96 w-full">
            <img
              src="/src/assets/images/stadium_tunnel_opening_1795179830009.jpg"
              alt="Floodlit stadium pitch viewed from the players tunnel"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/65 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-medium mb-2">
                <span>Football Mtaani</span>
                <span aria-hidden="true">·</span>
                <span>Season {state.seasonLabel}</span>
                <span aria-hidden="true">·</span>
                <span>3D Mobile & Career Universe</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white max-w-3xl text-balance leading-[1.05]">
                Every Ninety Minutes You Play Shapes an Entire Football World
              </h1>
            </div>
          </div>

          <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/10">
            <div className="lg:col-span-8 space-y-5">
              <p className="text-base text-slate-200 leading-relaxed">
                {state.openingDocNarrative.documentaryLead}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                {state.openingDocNarrative.seasonAtmosphere}
              </p>

              {/* Kenyan Sheng / Swahili Booth Call */}
              <div className="p-4 rounded-lg bg-[#0B0F17] border border-emerald-500/25 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Mtaani Broadcast Booth · Sheng & Swahili Commentary</span>
                  </div>
                  <select
                    value={state.activeCommentator}
                    onChange={(e) => onChangeCommentator(e.target.value as ShengCommentatorId)}
                    className="text-xs bg-[#121824] border border-white/15 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-400"
                  >
                    {SHENG_COMMENTATORS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-slate-200 italic leading-relaxed">
                  {state.openingDocNarrative.shengIntro}
                </p>
              </div>

              <p className="text-sm font-medium text-emerald-300">
                {state.openingDocNarrative.openingQuestion}
              </p>

              {aiError && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
                  {aiError}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onProceed}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Choose Your Club</span>
                </button>
                <button
                  onClick={onPlayQuick3D}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#2E86FF]/20 border border-[#2E86FF]/60 rounded-lg hover:bg-[#2E86FF]/30 transition-colors whitespace-nowrap shrink-0"
                >
                  <Gamepad2 className="w-4 h-4 text-[#2E86FF]" />
                  <span>Open Match Screen (3D)</span>
                </button>
                <button
                  onClick={handleGenerateNarration}
                  disabled={loadingAi}
                  className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-[#2E86FF]" />
                  <span>{loadingAi ? 'Writing Broadcast Intro...' : 'Generate Fresh Documentary & Sheng Intro'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
              <div className="text-xs font-semibold text-slate-400 tracking-wide">
                Pre-Season Broadcast Wire · Simulated
              </div>
              <div className="space-y-4 divide-y divide-white/10">
                {state.openingDocNarrative.headlines.map((headline, idx) => (
                  <p key={idx} className="pt-3 first:pt-0 text-sm text-slate-300 leading-snug">
                    {headline}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#121824] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Major Competitions</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pre-season friendlies, double round-robin league tables, domestic cups, and continental brackets tailored to your eFootball schedule.
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              {LEAGUE_PRESETS.map((l) => (
                <div key={l.id} className="flex justify-between">
                  <span className="text-slate-300">{l.name}</span>
                  <span className="tabular-nums">{l.clubs.length} Clubs</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#121824] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Transfer Market & Off-Season</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Transfer windows, wage limits, negotiations, and dedicated Off-Season rebuild stages carrying your career across Season 1, 2, 3 and beyond.
            </p>
            <div className="text-xs text-slate-400">
              Summer Window (MD 1–3) · Mid-Season Window (MD 9–11)
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#121824] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Sheng Booth & Realism</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              You play every match in eFootball. We never invent match results or stats—and our Kenyan Sheng & Swahili commentators bring every match report alive.
            </p>
            <div className="text-xs text-slate-400">
              3 Selectable Mtaani Sheng Commentators
            </div>
          </div>
        </section>
      </div>
      <OfflineIndicator />
    </div>
  );
};

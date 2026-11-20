import React, { useMemo, useState } from 'react';
import { Award, BarChart3, Flame, History, Mic, Sparkles, ArrowRight } from 'lucide-react';
import { UniverseState } from '../types/universe';
import { buildFullSeasonReview, calculateSeasonAwards } from '../engine/simulator';
import { aiService, AiSeasonReviewResponse } from '../services/aiService';

interface RivalriesStatsAwardsViewProps {
  state: UniverseState;
  defaultSubTab?: 'stats' | 'rivalries' | 'awards' | 'history';
  onEnterOffSeason: () => void;
  onStartNextSeason: () => void;
  onNavigateTab: (tab: string) => void;
}

export const RivalriesStatsAwardsView: React.FC<RivalriesStatsAwardsViewProps> = ({
  state,
  defaultSubTab = 'stats',
  onEnterOffSeason,
  onStartNextSeason,
  onNavigateTab,
}) => {
  const [subTab, setSubTab] = useState<'stats' | 'rivalries' | 'awards' | 'history'>(defaultSubTab);
  const [aiReview, setAiReview] = useState<AiSeasonReviewResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const squad = state.squad;

  const leaders = useMemo(() => {
    const avg = (r: number[]) => (r.length ? Math.round((r.reduce((a, b) => a + b, 0) / r.length) * 10) / 10 : 0);
    return {
      scorers: [...squad].sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, 5),
      assists: [...squad].sort((a, b) => b.assists - a.assists || b.goals - a.goals).slice(0, 5),
      apps: [...squad].sort((a, b) => b.appearances - a.appearances || b.minutes - a.minutes).slice(0, 5),
      cleanSheets: [...squad].filter((p) => p.group === 'GK' || p.group === 'DEF').sort((a, b) => b.cleanSheets - a.cleanSheets).slice(0, 5),
      motm: [...squad].sort((a, b) => b.motmAwards - a.motmAwards).slice(0, 5),
      ratings: [...squad].filter((p) => p.ratingsHistory.length > 0).sort((a, b) => avg(b.ratingsHistory) - avg(a.ratingsHistory)).slice(0, 5),
    };
  }, [squad]);

  const previewAwards = useMemo(() => {
    if (state.currentSeasonAwards.length > 0) return state.currentSeasonAwards;
    return calculateSeasonAwards(
      state.squad,
      state.manager,
      state.fixtures,
      state.clubs,
      state.goalOfSeasonCandidates
    );
  }, [state]);

  const activeReview = useMemo(() => {
    if (state.currentSeasonReview) return state.currentSeasonReview;
    if (!state.userClub) return null;
    return buildFullSeasonReview(state, previewAwards);
  }, [state, previewAwards]);

  const handleGenerateAiReview = async () => {
    if (!activeReview) return;
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await aiService.generateSeasonReview({
        seasonLabel: activeReview.seasonLabel,
        clubName: activeReview.clubName,
        leaguePosition: activeReview.leaguePosition,
        leagueChampion: activeReview.leagueChampion,
        trophiesWon: activeReview.trophiesWon,
        finalGrade: activeReview.finalGrade,
        topScorers: activeReview.topScorersList,
        topAssists: activeReview.topAssistsList,
        bestMatches: activeReview.bestMatches,
        worstMatches: activeReview.worstMatches,
        managerName: state.manager.name,
        managerReputation: state.manager.reputation,
      });
      setAiReview(res);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate AI Season Review.');
    } finally {
      setLoadingAi(false);
    }
  };

  const gradeColor = (g: string) => {
    if (g === 'A') return 'text-emerald-400';
    if (g === 'B') return 'text-sky-400';
    if (g === 'C') return 'text-amber-300';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">
            Stats, Rivalries, Season Review & Career History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every goal, assist, derby record, trophy, and season grade tracked permanently across your Football Mtaani career.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#121824] border border-white/10 rounded-lg">
          {[
            { id: 'stats', label: 'Player Stats' },
            { id: 'rivalries', label: 'Rivalries' },
            { id: 'awards', label: 'Review & Off-Season' },
            { id: 'history', label: `Career (${state.manager.careerTotals.seasonsCompleted})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as 'stats' | 'rivalries' | 'awards' | 'history')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === t.id ? 'bg-emerald-400 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Top Scorers (Golden Boot)', rows: leaders.scorers, val: (p: typeof squad[0]) => `${p.goals} G` },
              { title: 'Top Assist Providers', rows: leaders.assists, val: (p: typeof squad[0]) => `${p.assists} A` },
              { title: 'Most Appearances', rows: leaders.apps, val: (p: typeof squad[0]) => `${p.appearances} Apps` },
              { title: 'Clean Sheets (GK & DEF)', rows: leaders.cleanSheets, val: (p: typeof squad[0]) => `${p.cleanSheets} CS` },
              { title: 'Man of the Match Awards', rows: leaders.motm, val: (p: typeof squad[0]) => `${p.motmAwards} MOTM` },
              {
                title: 'Highest Average Rating (User-Entered)',
                rows: leaders.ratings,
                val: (p: typeof squad[0]) =>
                  `${(p.ratingsHistory.reduce((a, b) => a + b, 0) / p.ratingsHistory.length).toFixed(1)}`,
              },
            ].map((board) => (
              <div key={board.title} className="p-5 rounded-xl bg-[#121824] border border-white/10 space-y-3">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>{board.title}</span>
                </div>
                {board.rows.length === 0 ? (
                  <p className="text-xs text-slate-500">No tracked entries recorded yet.</p>
                ) : (
                  <div className="divide-y divide-white/5 text-xs">
                    {board.rows.map((p, idx) => (
                      <div key={p.id} className="py-2 flex items-center justify-between">
                        <span className="text-slate-200">
                          <span className="font-mono text-slate-500 mr-2">{idx + 1}.</span>
                          {p.name} <span className="text-slate-500">({p.position})</span>
                        </span>
                        <span className="font-mono tabular-nums text-emerald-400 font-semibold">{board.val(p)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-[#121824] border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-400">Biggest Win</div>
              <div className="text-sm font-semibold text-white mt-1">{state.records.biggestWin}</div>
            </div>
            <div>
              <div className="text-slate-400">Heaviest Defeat</div>
              <div className="text-sm font-semibold text-rose-300 mt-1">{state.records.heaviestDefeat}</div>
            </div>
            <div>
              <div className="text-slate-400">Longest Unbeaten Run</div>
              <div className="text-sm font-mono tabular-nums font-semibold text-emerald-400 mt-1">
                {state.records.longestUnbeatenRun} matches
              </div>
            </div>
            <div>
              <div className="text-slate-400">All-Time Top Scorer</div>
              <div className="text-sm font-semibold text-white mt-1">
                {state.records.allTimeGoalsLeader.name} ({state.records.allTimeGoalsLeader.goals})
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'rivalries' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.rivalries.map((r) => (
            <div key={r.rivalClubId} className="p-6 rounded-xl bg-[#121824] border border-white/10 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-rose-400 font-semibold">
                    {r.tier} · Simulated Rivalry Narrative
                  </div>
                  <h3 className="text-xl font-bold font-display text-white mt-0.5">{r.rivalryTitle}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    vs {r.rivalClubName} · {r.rivalManager}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Intensity</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-rose-400 flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    <span>{r.intensity}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{r.historySummary}</p>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[#0B0F17] border border-white/10 text-center text-xs font-mono tabular-nums">
                <div>
                  <div className="text-slate-400">Wins</div>
                  <div className="text-base font-bold text-emerald-400">{r.wins}</div>
                </div>
                <div>
                  <div className="text-slate-400">Draws</div>
                  <div className="text-base font-bold text-amber-300">{r.draws}</div>
                </div>
                <div>
                  <div className="text-slate-400">Losses</div>
                  <div className="text-base font-bold text-rose-400">{r.losses}</div>
                </div>
              </div>

              <div className="text-xs">
                <div className="text-slate-400 mb-1">Rival Key Players:</div>
                <div className="text-slate-200">{r.rivalKeyPlayers.join(' · ')}</div>
              </div>

              {r.memorableMatches.length > 0 && (
                <div className="text-xs space-y-1 pt-2 border-t border-white/10">
                  <div className="text-slate-400">Memorable Matches:</div>
                  {r.memorableMatches.map((m, idx) => (
                    <div key={idx} className="text-slate-200 font-mono text-[11px]">{m}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {subTab === 'awards' && (
        <div className="space-y-6">
          {/* Section 20: OFF-SEASON VIEW when phase === 'off-season' */}
          {state.phase === 'off-season' && state.offSeasonPlan && (
            <div className="p-6 md:p-8 rounded-xl bg-[#121824] border border-emerald-500/35 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    STAGE 20 · OFF-SEASON REBUILD & PLANNING
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold font-display text-white mt-0.5">
                    {state.seasonLabel} Off-Season Operations
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Review departures, adjust your squad in the open Transfer Window, and approve new season targets before launching Pre-Season.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigateTab('transfers')}
                    className="px-4 py-2.5 text-xs font-medium text-white bg-white/10 border border-white/15 rounded-lg hover:bg-white/15"
                  >
                    Open Off-Season Transfer Window
                  </button>
                  <button
                    onClick={onStartNextSeason}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300"
                  >
                    <span>Start Season {state.seasonNumber + 1} Pre-Season</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                <div className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2">
                  <div className="font-semibold text-white">Budget Adjustment & Window</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    €{state.offSeasonPlan.adjustedBudgetMillions}M Available
                  </div>
                  <p className="text-slate-400">Transfer Window is OPEN for squad rebuild.</p>
                </div>

                <div className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2">
                  <div className="font-semibold text-white">Manager Evaluation</div>
                  <p className="text-slate-300 leading-relaxed">{state.offSeasonPlan.managerEvaluation}</p>
                  <p className="text-emerald-300">{state.offSeasonPlan.newSeasonExpectations}</p>
                </div>

                <div className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2">
                  <div className="font-semibold text-white">Pre-Season Schedule & Rivalry</div>
                  <p className="text-slate-300">
                    Scheduled Friendlies vs: {state.offSeasonPlan.preSeasonOpponentNames.join(' & ')}
                  </p>
                  {state.offSeasonPlan.newRivalryNote && (
                    <p className="text-amber-300">{state.offSeasonPlan.newRivalryNote}</p>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2">
                  <div className="font-semibold text-white">Player Departures & Expiries</div>
                  <ul className="space-y-1 text-slate-300">
                    {state.offSeasonPlan.departures.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2">
                  <div className="font-semibold text-white">Squad Rebuild Priorities</div>
                  <ul className="space-y-1 text-amber-300">
                    {state.offSeasonPlan.rebuildFocus.map((r, i) => (
                      <li key={i}>· {r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2">
                  <div className="font-semibold text-white">New Season Objectives</div>
                  <ul className="space-y-1 text-slate-200">
                    {state.offSeasonPlan.newObjectives.map((o, i) => (
                      <li key={i}>0{i + 1}. {o}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Section 19: Full Season Review + A-F Grade */}
          {activeReview && (
            <div className="p-6 md:p-8 rounded-xl bg-[#121824] border border-white/10 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    {state.phase === 'season-end'
                      ? 'SEASON COMPLETE · FULL REVIEW'
                      : 'LIVE SEASON PROJECTION & AWARDS PREVIEW'}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold font-display text-white mt-0.5">
                    {activeReview.clubName} · {activeReview.seasonLabel} Season Review
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{activeReview.gradeJustification}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Final Season Grade</div>
                    <div className={`text-4xl font-bold font-display ${gradeColor(activeReview.finalGrade)}`}>
                      {activeReview.finalGrade}
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateAiReview}
                    disabled={loadingAi}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{loadingAi ? 'Writing Review...' : 'AI Documentary Review'}</span>
                  </button>
                  {state.phase === 'season-end' && (
                    <button
                      onClick={onEnterOffSeason}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300"
                    >
                      <span>Enter Off-Season</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {aiError && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
                  {aiError}
                </div>
              )}

              {/* Sheng Season Verdict */}
              <div className="p-4 rounded-lg bg-[#0B0F17] border border-emerald-500/25">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Mtaani Sheng & Swahili End-of-Season Verdict</span>
                </div>
                <p className="text-sm text-slate-200 italic">
                  {aiReview?.shengSeasonVerdict || activeReview.shengSeasonVerdict}
                </p>
              </div>

              {aiReview && (
                <div className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2 text-xs">
                  <div className="text-sm font-bold text-white">{aiReview.seasonHeadline}</div>
                  <p className="text-slate-300 leading-relaxed">{aiReview.narrativeSummary}</p>
                  <p className="text-slate-400">{aiReview.tacticalEvolution}</p>
                  <p className="text-emerald-300">{aiReview.boardVerdict}</p>
                </div>
              )}

              {/* Detailed Review Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                <div className="space-y-2">
                  <div className="font-semibold text-slate-400">Campaign Standings & Cups</div>
                  <div className="text-slate-200">League Position: #{activeReview.leaguePosition} (Champion: {activeReview.leagueChampion})</div>
                  <div className="text-slate-300">Cup: {activeReview.cupResult}</div>
                  <div className="text-slate-300">Continental: {activeReview.continentalResult}</div>
                  <div className="text-amber-300 font-semibold">
                    Trophies: {activeReview.trophiesWon.length > 0 ? activeReview.trophiesWon.join(', ') : 'None'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-slate-400">Top Scorers & Assists</div>
                  <div className="text-slate-200">Scorers: {activeReview.topScorersList.join(' · ')}</div>
                  <div className="text-slate-300">Assists: {activeReview.topAssistsList.join(' · ')}</div>
                  <div className="text-emerald-300">Best Players: {activeReview.bestPlayersList.join(' · ')}</div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-slate-400">Disappointments & Key Matches</div>
                  <div className="text-rose-300">Disappointments: {activeReview.biggestDisappointments.join(' · ')}</div>
                  <div className="text-emerald-300">Best Matches: {activeReview.bestMatches.join(' | ')}</div>
                  <div className="text-slate-400">Worst Matches: {activeReview.worstMatches.join(' | ')}</div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-slate-400">Transfers & Finances</div>
                  <div className="text-slate-200">{activeReview.transferSummary}</div>
                  <div className="text-slate-300">{activeReview.financialSummary}</div>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-slate-400">Objectives Completed & Failed</div>
                  <ul className="space-y-1 text-emerald-300">
                    {activeReview.objectivesCompleted.map((o, i) => <li key={i}>+ {o}</li>)}
                  </ul>
                  <ul className="space-y-1 text-rose-300">
                    {activeReview.objectivesFailed.map((o, i) => <li key={i}>- {o}</li>)}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-slate-400">Reactions & Reputation</div>
                  <div className="text-slate-200">{activeReview.supporterReaction}</div>
                  <div className="text-slate-400">{activeReview.mediaReaction}</div>
                  <div className="text-slate-300 font-mono">
                    Manager REP: {activeReview.managerReputationEnd} · Club REP: {activeReview.clubReputationEnd}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 18: Season Awards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewAwards.map((aw) => (
              <div key={aw.title} className="p-5 rounded-xl bg-[#121824] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>{aw.title}</span>
                  </span>
                  <span className="text-slate-500">{aw.basis}</span>
                </div>
                <div className="text-lg font-bold text-white">{aw.winner}</div>
                <div className="text-xs text-slate-400">{aw.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'history' && (
        <div className="space-y-6">
          {/* Cumulative Career Totals */}
          <div className="p-6 rounded-xl bg-[#121824] border border-white/10 space-y-4">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>All-Time Career Totals · {state.manager.name || 'Manager'}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
              <div>
                <div className="text-slate-400">Seasons</div>
                <div className="text-xl font-bold font-mono tabular-nums text-white">{state.manager.careerTotals.seasonsCompleted}</div>
              </div>
              <div>
                <div className="text-slate-400">Matches</div>
                <div className="text-xl font-bold font-mono tabular-nums text-white">{state.manager.careerTotals.matches}</div>
              </div>
              <div>
                <div className="text-slate-400">Wins</div>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">{state.manager.careerTotals.wins}</div>
              </div>
              <div>
                <div className="text-slate-400">Draws</div>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-300">{state.manager.careerTotals.draws}</div>
              </div>
              <div>
                <div className="text-slate-400">Losses</div>
                <div className="text-xl font-bold font-mono tabular-nums text-rose-400">{state.manager.careerTotals.losses}</div>
              </div>
              <div>
                <div className="text-slate-400">Career Goals</div>
                <div className="text-xl font-bold font-mono tabular-nums text-white">{state.manager.careerTotals.careerGoals}</div>
              </div>
              <div>
                <div className="text-slate-400">Trophies</div>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-400">{state.manager.careerTotals.trophies.length}</div>
              </div>
            </div>
            <div className="text-xs text-slate-400">
              Clubs Managed: <span className="text-slate-200">{state.manager.careerTotals.clubsManaged.join(', ') || state.userClub?.name}</span>
            </div>
          </div>

          {/* Season-by-Season Archive */}
          <div className="rounded-xl bg-[#121824] border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">Season-by-Season Career Archive</h3>
            </div>
            {state.manager.history.length === 0 ? (
              <div className="p-6 text-xs text-slate-400">
                Complete Season {state.seasonLabel} and proceed through the Off-Season to archive Season 1 permanently.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {state.manager.history.map((h) => (
                  <div key={h.seasonLabel} className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {h.seasonLabel} · {h.clubName}
                      </div>
                      <div className="text-slate-400 mt-0.5 font-mono">
                        Finish: #{h.leaguePosition} · Record: {h.record} ({h.matches} MP) · Goals: {h.goalsScored} · Grade: {h.grade}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-300 font-medium">
                        {h.trophies.length > 0 ? h.trophies.join(', ') : 'No Trophies'}
                      </div>
                      <div className="text-slate-400 font-mono">End REP: {h.reputationEnd}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

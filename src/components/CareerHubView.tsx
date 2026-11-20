import React, { useState } from 'react';
import { ArrowRight, Calendar, CreditCard, Gamepad2, Mic, Newspaper, Play, Sparkles, Trophy, Users } from 'lucide-react';
import { Fixture, MatchReport, ShengCommentatorId, UniverseState } from '../types/universe';
import { computeLeagueTable, getNextUserFixture, SHENG_COMMENTATORS } from '../engine/simulator';
import { aiService, AiPressConferenceResponse } from '../services/aiService';
import { MatchReportView } from './MatchReportView';

interface CareerHubViewProps {
  state: UniverseState;
  onOpenBriefing: (fixture: Fixture) => void;
  onOpenReportMatch: (fixture: Fixture) => void;
  onPlay3DMatch: (fixture: Fixture) => void;
  onSkipPreSeason: () => void;
  onChangeCommentator: (id: ShengCommentatorId) => void;
  onUpdateReport: (fixtureId: string, updated: MatchReport) => void;
  onAddPressHeadline: (headline: string, summary: string, confDelta: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const CareerHubView: React.FC<CareerHubViewProps> = ({
  state,
  onOpenBriefing,
  onOpenReportMatch,
  onPlay3DMatch,
  onSkipPreSeason,
  onChangeCommentator,
  onUpdateReport,
  onAddPressHeadline,
  onNavigateTab,
}) => {
  const userClub = state.userClub!;
  const nextFixture = getNextUserFixture(state);
  const leagueComp = state.competitions.find((c) => c.type === 'league');
  const table = leagueComp ? computeLeagueTable(state.fixtures, state.clubs, leagueComp.id) : [];
  const userPosIdx = table.findIndex((r) => r.clubId === userClub.id);
  const userPos = userPosIdx >= 0 ? userPosIdx + 1 : 1;
  const userRow = table[userPosIdx];

  const lastFixture = state.lastCompletedFixtureId
    ? state.fixtures.find((f) => f.id === state.lastCompletedFixtureId)
    : undefined;

  const [pressConf, setPressConf] = useState<AiPressConferenceResponse | null>(null);
  const [answeredQs, setAnsweredQs] = useState<Record<number, { statement: string; impact: string }>>({});
  const [loadingPress, setLoadingPress] = useState(false);
  const [pressError, setPressError] = useState<string | null>(null);

  const handleStartPressConference = async () => {
    setLoadingPress(true);
    setPressError(null);
    setAnsweredQs({});
    try {
      const res = await aiService.generatePressConference({
        clubName: userClub.name,
        managerName: state.manager.name || 'Manager',
        leaguePosition: userPos,
        recentForm: userRow?.form.join('-') || 'Opening phase',
        nextOpponent: nextFixture
          ? nextFixture.homeClubId === userClub.id
            ? nextFixture.awayClubName
            : nextFixture.homeClubName
          : 'Season Finale',
        lastHeadline: state.news[0]?.headline || 'New season underway',
      });
      setPressConf(res);
    } catch (err: unknown) {
      setPressError(err instanceof Error ? err.message : 'Unable to start press conference.');
    } finally {
      setLoadingPress(false);
    }
  };

  const handleAnswerPress = (qIdx: number, opt: { tone: string; statement: string; headlineImpact: string }) => {
    setAnsweredQs((prev) => ({ ...prev, [qIdx]: { statement: opt.statement, impact: opt.headlineImpact } }));
    const delta = opt.tone.toLowerCase().includes('bold') ? 2 : 1;
    onAddPressHeadline(
      `${state.manager.name || 'Manager'} (${opt.tone}): "${opt.statement.slice(0, 72)}..."`,
      `Simulated Press Conference: ${opt.headlineImpact}`,
      delta
    );
  };

  const preSeasonFixtures = state.fixtures.filter((f) => f.competitionType === 'preseason');

  return (
    <div className="space-y-8">
      {/* Pre-Season Camp Stage Banner */}
      {state.phase === 'pre-season' && (
        <section className="p-6 rounded-xl bg-[#121824] border border-emerald-500/30 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-emerald-400">
                STAGE 4 · PRE-SEASON CAMP · {state.seasonLabel}
              </div>
              <h2 className="text-2xl font-bold font-display text-white mt-0.5">
                Prepare Your Squad Before Matchday 1
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Test your formation and new signings in eFootball Pre-Season friendlies, or proceed straight to the official League Matchday 1 kickoff.
              </p>
            </div>
            <button
              onClick={onSkipPreSeason}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Kick Off League Matchday 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {preSeasonFixtures.map((pf) => (
              <div
                key={pf.id}
                className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs text-slate-400">{pf.roundLabel} · {pf.stadium}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {pf.homeClubName} vs {pf.awayClubName}
                  </div>
                  {pf.status === 'played' && (
                    <div className="text-xs font-mono text-[#2E86FF] mt-1">
                      FT: {pf.homeScore} – {pf.awayScore}
                    </div>
                  )}
                </div>
                {pf.status === 'scheduled' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onPlay3DMatch(pf)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] whitespace-nowrap shrink-0"
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>Play 3D</span>
                    </button>
                    <button
                      onClick={() => onOpenReportMatch(pf)}
                      className="px-3 py-2 min-h-[38px] text-xs font-semibold text-white bg-white/10 rounded-lg hover:bg-white/20 whitespace-nowrap shrink-0"
                    >
                      Log Result
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next Matchday Focal Anchor */}
      <section className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121824]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 relative min-h-[220px]">
            <img
              src="/src/assets/images/matchday_floodlights_1795179830584.jpg"
              alt="Stadium floodlights on matchday"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-[#121824]" />
          </div>

          <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-5">
            {nextFixture ? (
              <>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-medium">
                    <span>{nextFixture.competitionName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{nextFixture.roundLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{nextFixture.stadium}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold font-display text-white mt-1.5">
                    {nextFixture.homeClubName} vs {nextFixture.awayClubName}
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Play this fixture live inside the 3D Stadium Pitch Engine or play externally in eFootball and report the match outcome here.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onPlay3DMatch(nextFixture)}
                    className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>Open Match Screen (Play 3D)</span>
                  </button>
                  <button
                    onClick={() => onOpenBriefing(nextFixture)}
                    className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-white bg-white/10 border border-white/15 rounded-lg hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Calendar className="w-4 h-4 text-[#2E86FF]" />
                    <span>Briefing</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('cards')}
                    className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-white bg-white/10 border border-[#2E86FF]/35 rounded-lg hover:bg-[#2E86FF]/20 transition-colors whitespace-nowrap shrink-0"
                  >
                    <CreditCard className="w-4 h-4 text-[#2E86FF]" />
                    <span>Player Cards & Packs</span>
                  </button>
                  <button
                    onClick={() => onOpenReportMatch(nextFixture)}
                    className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-4 h-4 text-amber-400" />
                    <span>Report Result</span>
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="text-xs text-amber-400 font-semibold">Campaign Complete</div>
                <h2 className="text-3xl font-bold font-display text-white mt-1">
                  All Season {state.seasonLabel} Matches Completed
                </h2>
                <p className="text-sm text-slate-300 mt-2">
                  Inspect your final Season Grade (A–F), awards, and enter the Off-Season rebuild window.
                </p>
                <button
                  onClick={() => onNavigateTab('awards')}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Open Season Review & Off-Season</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4-Column Season Snapshot Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">League Standing</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            #{userPos} <span className="text-sm font-normal text-slate-400">/ {state.clubs.length}</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
            {userRow?.pts ?? 0} pts · Form: {userRow?.form.join(' ') || '–'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Transfer Window & Budget</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            €{state.finances.transferBudgetMillions}M
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Window: <span className={state.transferWindowOpen ? 'text-emerald-300' : 'text-amber-300'}>
              {state.transferWindowOpen ? 'OPEN' : 'CLOSED'}
            </span> · {state.transferWindowSigningsCount}/{state.maxWindowSignings} signings
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Manager Standing</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {state.manager.reputation} <span className="text-sm font-normal text-slate-400">/ 100 REP</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
            Board Confidence: {state.manager.boardConfidence}%
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Sheng Broadcast Booth</div>
          <select
            value={state.activeCommentator}
            onChange={(e) => onChangeCommentator(e.target.value as ShengCommentatorId)}
            className="mt-1.5 w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
          >
            {SHENG_COMMENTATORS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-400 mt-1.5 truncate">
            Active Swahili & Sheng commentator
          </div>
        </div>
      </section>

      {/* Latest Match Report (if available) */}
      {lastFixture && lastFixture.report && (
        <MatchReportView
          fixture={lastFixture}
          clubName={userClub.name}
          activeCommentator={state.activeCommentator}
          onChangeCommentator={onChangeCommentator}
          onUpdateReport={onUpdateReport}
        />
      )}

      {/* Split: Football Mtaani News Wire + Objectives & Press Conference */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#121824] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-emerald-400" />
              <span>Football Mtaani News Wire · Simulated</span>
            </h3>
            <span className="text-xs text-slate-400">Matchday {state.currentMatchday}</span>
          </div>

          <div className="divide-y divide-white/10">
            {state.news.slice(0, 6).map((item) => (
              <article key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="text-xs text-slate-400">
                  {item.category} · MD {item.matchday} · Simulated Universe
                </div>
                <h4 className="text-sm font-semibold text-white">{item.headline}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
                {item.shengTake && (
                  <p className="text-xs text-emerald-300 italic flex items-center gap-1.5 pt-0.5">
                    <Mic className="w-3 h-3 shrink-0" />
                    <span>{item.shengTake}</span>
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Season Objectives */}
          <div className="p-6 rounded-xl bg-[#121824] border border-white/10 space-y-3">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Board Objectives & Expectations</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-200">
              {userClub.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-emerald-400">0{idx + 1}.</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-white/10 text-xs text-slate-400">
              Board: {userClub.boardExpectations}
            </div>
          </div>

          {/* Interactive Press Conference */}
          <div className="p-6 rounded-xl bg-[#121824] border border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold font-display text-white">Press Conference Room</h3>
              <button
                onClick={handleStartPressConference}
                disabled={loadingPress}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingPress ? 'Calling Press...' : 'Hold Press Conference'}</span>
              </button>
            </div>

            {pressError && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
                {pressError}
              </div>
            )}

            {pressConf ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">{pressConf.journalistIntro}</p>
                {pressConf.questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-3.5 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2">
                    <div className="text-[11px] text-emerald-400 font-medium">{q.reporter}</div>
                    <p className="text-xs font-medium text-white">{q.question}</p>
                    {answeredQs[qIdx] ? (
                      <div className="text-xs text-slate-300 pt-1">
                        <span className="text-emerald-400 font-semibold">You answered:</span> "{answeredQs[qIdx].statement}"
                        <div className="text-[11px] text-slate-400 mt-1">{answeredQs[qIdx].impact}</div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleAnswerPress(qIdx, opt)}
                            className="w-full text-left px-3 py-2 text-xs rounded bg-white/5 hover:bg-white/10 text-slate-200 transition-colors"
                          >
                            <span className="font-semibold text-emerald-300">[{opt.tone}]</span> {opt.statement}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Face simulated media questions between fixtures to shape dressing-room morale and board headlines.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

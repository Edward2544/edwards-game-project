import React, { useMemo, useState } from 'react';
import { Trophy, Calendar, FileText, Gamepad2 } from 'lucide-react';
import { Fixture, MatchReport, ShengCommentatorId, UniverseState } from '../types/universe';
import { computeLeagueTable } from '../engine/simulator';
import { MatchReportView } from './MatchReportView';

interface CompetitionsViewProps {
  state: UniverseState;
  onOpenBriefing: (fixture: Fixture) => void;
  onOpenReportMatch: (fixture: Fixture) => void;
  onPlay3DMatch: (fixture: Fixture) => void;
  onChangeCommentator: (id: ShengCommentatorId) => void;
  onUpdateReport: (fixtureId: string, updated: MatchReport) => void;
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({
  state,
  onOpenBriefing,
  onOpenReportMatch,
  onPlay3DMatch,
  onChangeCommentator,
  onUpdateReport,
}) => {
  const [subTab, setSubTab] = useState<'table' | 'fixtures' | 'cups'>('table');
  const [fixtureFilter, setFixtureFilter] = useState<'user' | 'all'>('user');
  const [selectedReportFixture, setSelectedReportFixture] = useState<Fixture | null>(null);

  const userClub = state.userClub!;
  const leagueComp = state.competitions.find((c) => c.type === 'league');
  const table = useMemo(
    () => (leagueComp ? computeLeagueTable(state.fixtures, state.clubs, leagueComp.id) : []),
    [state.fixtures, state.clubs, leagueComp]
  );

  const filteredFixtures = useMemo(() => {
    return state.fixtures
      .filter((f) => (fixtureFilter === 'user' ? f.isUserMatch : true))
      .sort((a, b) => a.matchday - b.matchday);
  }, [state.fixtures, fixtureFilter]);

  const cupCompetitions = state.competitions.filter((c) => c.type === 'cup' || c.type === 'continental');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">Competitions & Fixtures</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {leagueComp?.name} · Season {state.seasonLabel}
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#121824] border border-white/10 rounded-lg">
          {[
            { id: 'table', label: 'League Table' },
            { id: 'fixtures', label: 'Fixture Schedule' },
            { id: 'cups', label: 'Knockout Cups' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as 'table' | 'fixtures' | 'cups')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === t.id ? 'bg-[#2E86FF] text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {selectedReportFixture && (
        <MatchReportView
          fixture={selectedReportFixture}
          clubName={userClub.name}
          activeCommentator={state.activeCommentator}
          onChangeCommentator={onChangeCommentator}
          onUpdateReport={(id, updated) => {
            onUpdateReport(id, updated);
            setSelectedReportFixture({ ...selectedReportFixture, report: updated });
          }}
          onClose={() => setSelectedReportFixture(null)}
        />
      )}

      {subTab === 'table' && leagueComp && (
        <div className="rounded-xl bg-[#121824] border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">{leagueComp.name}</h3>
              <p className="text-xs text-slate-400">{leagueComp.rules}</p>
            </div>
            <span className="text-xs text-slate-400">{leagueComp.qualificationCriteria}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F17] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-medium w-10">Pos</th>
                  <th className="py-3 px-4 font-medium">Club</th>
                  <th className="py-3 px-3 font-medium text-right">MP</th>
                  <th className="py-3 px-3 font-medium text-right">W</th>
                  <th className="py-3 px-3 font-medium text-right">D</th>
                  <th className="py-3 px-3 font-medium text-right">L</th>
                  <th className="py-3 px-3 font-medium text-right">GF</th>
                  <th className="py-3 px-3 font-medium text-right">GA</th>
                  <th className="py-3 px-3 font-medium text-right">GD</th>
                  <th className="py-3 px-3 font-medium text-right">Pts</th>
                  <th className="py-3 px-4 font-medium text-right">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {table.map((row, idx) => {
                  const isUser = row.clubId === userClub.id;
                  return (
                    <tr
                      key={row.clubId}
                      className={`h-10 ${isUser ? 'bg-emerald-500/10 text-white font-semibold' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                      <td className="py-2.5 px-4 font-mono tabular-nums">
                        <span className={idx === 0 ? 'text-amber-400 font-bold' : idx < 4 ? 'text-emerald-400' : ''}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {row.clubName} {isUser && <span className="text-emerald-400 text-[11px]">(You)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.played}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.won}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.drawn}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.lost}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.gf}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{row.ga}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-white">
                        {row.pts}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[11px] space-x-1">
                        {row.form.length === 0 ? (
                          <span className="text-slate-500">–</span>
                        ) : (
                          row.form.map((res, rIdx) => (
                            <span
                              key={rIdx}
                              className={
                                res === 'W' ? 'text-emerald-400' : res === 'D' ? 'text-amber-300' : 'text-rose-400'
                              }
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'fixtures' && (
        <div className="rounded-xl bg-[#121824] border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Season Fixture Schedule</span>
            </h3>
            <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-white/10 rounded-lg">
              <button
                onClick={() => setFixtureFilter('user')}
                className={`px-3 py-1 text-xs rounded ${fixtureFilter === 'user' ? 'bg-white/15 text-white' : 'text-slate-400'}`}
              >
                Your Matches
              </button>
              <button
                onClick={() => setFixtureFilter('all')}
                className={`px-3 py-1 text-xs rounded ${fixtureFilter === 'all' ? 'bg-white/15 text-white' : 'text-slate-400'}`}
              >
                All Universe Matches
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredFixtures.map((f) => (
              <div key={f.id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-white/5">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">
                    {f.competitionName} · {f.roundLabel} · {f.stadium} ·{' '}
                    {f.isSimulatedResult ? 'Simulated' : f.isUserMatch ? 'Your eFootball Match' : 'Scheduled'}
                  </div>
                  <div className="text-sm font-medium text-white mt-0.5">
                    <span className={f.homeClubId === userClub.id ? 'text-emerald-400 font-semibold' : ''}>
                      {f.homeClubName}
                    </span>
                    <span className="mx-2 font-mono text-slate-400">
                      {f.status === 'played' ? `${f.homeScore} – ${f.awayScore}` : 'vs'}
                    </span>
                    <span className={f.awayClubId === userClub.id ? 'text-emerald-400 font-semibold' : ''}>
                      {f.awayClubName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {f.status === 'played' && f.report && (
                    <button
                      onClick={() => setSelectedReportFixture(f)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Match Report</span>
                    </button>
                  )}
                  {f.isUserMatch && f.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => onPlay3DMatch(f)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF]"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Play 3D</span>
                      </button>
                      <button
                        onClick={() => onOpenBriefing(f)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                      >
                        Briefing
                      </button>
                      <button
                        onClick={() => onOpenReportMatch(f)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/10 rounded-lg hover:bg-white/15"
                      >
                        Report
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'cups' && (
        <div className="space-y-6">
          {cupCompetitions.map((comp) => {
            const compFixtures = state.fixtures.filter((f) => f.competitionId === comp.id);
            const rounds = ['Quarter-Final', 'Semi-Final', 'Final'];
            return (
              <div key={comp.id} className="p-6 rounded-xl bg-[#121824] border border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>{comp.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{comp.format} · {comp.rules}</p>
                  </div>
                  <div className="text-xs font-mono text-emerald-400">
                    Winner Prize: €{comp.prizeMoneyChampionMillions}M (Sim)
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rounds.map((round) => {
                    const matches = compFixtures.filter((f) => f.roundLabel === round);
                    return (
                      <div key={round} className="space-y-2.5">
                        <div className="text-xs font-semibold text-slate-400">{round}</div>
                        {matches.length === 0 ? (
                          <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/10 text-xs text-slate-500">
                            Awaiting previous round winners
                          </div>
                        ) : (
                          matches.map((m) => (
                            <div key={m.id} className="p-3 rounded-lg bg-[#0B0F17] border border-white/10 space-y-1.5 text-xs">
                              <div className="flex justify-between text-slate-400">
                                <span>MD {m.matchday}</span>
                                <span>{m.isUserMatch ? 'Your Match' : m.isSimulatedResult ? 'Simulated' : 'Pending'}</span>
                              </div>
                              <div className="flex justify-between text-white font-medium">
                                <span className={m.homeClubId === userClub.id ? 'text-emerald-400' : ''}>{m.homeClubName}</span>
                                <span className="font-mono tabular-nums">{m.status === 'played' ? m.homeScore : '–'}</span>
                              </div>
                              <div className="flex justify-between text-white font-medium">
                                <span className={m.awayClubId === userClub.id ? 'text-emerald-400' : ''}>{m.awayClubName}</span>
                                <span className="font-mono tabular-nums">{m.status === 'played' ? m.awayScore : '–'}</span>
                              </div>
                              {m.penaltiesScore && (
                                <div className="text-[11px] text-amber-300 font-mono">
                                  Pens: {m.penaltiesScore}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

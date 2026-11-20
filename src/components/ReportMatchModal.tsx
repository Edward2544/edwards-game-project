import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Fixture, MatchEventCard, MatchEventGoal, UniverseState } from '../types/universe';
import { UserMatchResultInput } from '../engine/simulator';

interface ReportMatchModalProps {
  state: UniverseState;
  fixture: Fixture;
  onClose: () => void;
  onSubmitResult: (fixtureId: string, input: UserMatchResultInput) => void;
}

export const ReportMatchModal: React.FC<ReportMatchModalProps> = ({
  state,
  fixture,
  onClose,
  onSubmitResult,
}) => {
  const userClub = state.userClub!;
  const isUserHome = fixture.homeClubId === userClub.id;
  const isCup = fixture.competitionType === 'cup' || fixture.competitionType === 'continental';

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [extraTime, setExtraTime] = useState(false);
  const [penaltiesWinner, setPenaltiesWinner] = useState<'home' | 'away' | ''>('');
  const [penaltiesScore, setPenaltiesScore] = useState('');

  const [goals, setGoals] = useState<MatchEventGoal[]>([]);
  const [cards, setCards] = useState<MatchEventCard[]>([]);
  const [motmPlayerName, setMotmPlayerName] = useState('');
  const [possession, setPossession] = useState('');
  const [shots, setShots] = useState('');
  const [shotsOnTarget, setShotsOnTarget] = useState('');
  const [oppShots, setOppShots] = useState('');
  const [xg, setXg] = useState('');
  const [oppXg, setOppXg] = useState('');
  const [injuryPlayer, setInjuryPlayer] = useState('');
  const [injuryWeeks, setInjuryWeeks] = useState('2');
  const [memorableMoment, setMemorableMoment] = useState('');

  // Quick player rating entries (only recorded if user fills them in)
  const [ratingInputs, setRatingInputs] = useState<Record<string, string>>({});

  const availablePlayers = state.squad.filter((p) => p.status === 'Fit');

  const addGoalRow = () => {
    const first = availablePlayers[0]?.name || '';
    setGoals((prev) => [
      ...prev,
      { playerName: first, minute: undefined, assistPlayerName: '', isGoalOfSeasonCandidate: false },
    ]);
  };

  const addCardRow = () => {
    const first = availablePlayers[0]?.name || '';
    setCards((prev) => [...prev, { playerName: first, type: 'yellow', minute: undefined }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRatings: Record<string, number> = {};
    Object.entries(ratingInputs).forEach(([name, val]) => {
      const n = Number(val);
      if (val.trim() && !Number.isNaN(n) && n >= 1 && n <= 10) {
        parsedRatings[name] = n;
      }
    });

    const cleanGoals = goals
      .filter((g) => g.playerName.trim())
      .map((g) => ({
        ...g,
        assistPlayerName: g.assistPlayerName?.trim() || undefined,
      }));

    const injuries =
      injuryPlayer.trim()
        ? [{ playerName: injuryPlayer.trim(), returnMatchdays: Math.max(1, Number(injuryWeeks) || 2) }]
        : undefined;

    onSubmitResult(fixture.id, {
      homeScore,
      awayScore,
      extraTime: isCup && extraTime ? true : undefined,
      penaltiesWinner: isCup && penaltiesWinner ? penaltiesWinner : undefined,
      penaltiesScore: isCup && penaltiesWinner && penaltiesScore ? penaltiesScore : undefined,
      goals: cleanGoals,
      cards: cards.filter((c) => c.playerName.trim()),
      motmPlayerName: motmPlayerName.trim() || undefined,
      playerRatings: Object.keys(parsedRatings).length > 0 ? parsedRatings : undefined,
      injuriesReported: injuries,
      stats: {
        possessionPercent: possession ? Number(possession) : undefined,
        shots: shots ? Number(shots) : undefined,
        shotsOnTarget: shotsOnTarget ? Number(shotsOnTarget) : undefined,
        opponentShots: oppShots ? Number(oppShots) : undefined,
        expectedGoals: xg ? Number(xg) : undefined,
        opponentExpectedGoals: oppXg ? Number(oppXg) : undefined,
      },
      memorableMoment: memorableMoment.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl rounded-xl bg-[#121824] border border-white/15 overflow-hidden my-8"
      >
        <div className="px-6 py-4 bg-[#0B0F17] border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-medium">
              {fixture.competitionName} · {fixture.roundLabel}
            </div>
            <h2 className="text-xl font-bold font-display text-white">
              Report Your Played eFootball Match Result
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Final Scoreline */}
          <div className="p-5 rounded-xl bg-[#0B0F17] border border-white/10">
            <div className="text-xs text-slate-400 mb-3 text-center">
              Final Score ({fixture.stadium}) — Only details you report are recorded
            </div>
            <div className="grid grid-cols-11 items-center gap-3">
              <div className="col-span-4 text-right">
                <div className={`text-sm font-semibold ${isUserHome ? 'text-emerald-400' : 'text-white'}`}>
                  {fixture.homeClubName}
                </div>
                <div className="text-xs text-slate-500">Home</div>
              </div>
              <div className="col-span-3 flex items-center justify-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={homeScore}
                  onChange={(e) => setHomeScore(Math.max(0, Number(e.target.value)))}
                  className="w-14 h-12 text-center text-2xl font-bold font-mono tabular-nums bg-[#121824] border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                />
                <span className="text-slate-500 font-mono text-lg">–</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={awayScore}
                  onChange={(e) => setAwayScore(Math.max(0, Number(e.target.value)))}
                  className="w-14 h-12 text-center text-2xl font-bold font-mono tabular-nums bg-[#121824] border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="col-span-4 text-left">
                <div className={`text-sm font-semibold ${!isUserHome ? 'text-emerald-400' : 'text-white'}`}>
                  {fixture.awayClubName}
                </div>
                <div className="text-xs text-slate-500">Away</div>
              </div>
            </div>

            {isCup && homeScore === awayScore && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs">
                <label className="inline-flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={extraTime}
                    onChange={(e) => setExtraTime(e.target.checked)}
                    className="accent-emerald-400"
                  />
                  <span>Went to Extra Time</span>
                </label>
                <select
                  value={penaltiesWinner}
                  onChange={(e) => setPenaltiesWinner(e.target.value as 'home' | 'away' | '')}
                  className="px-3 py-1.5 bg-[#121824] border border-white/15 rounded text-slate-200"
                >
                  <option value="">Penalties Winner (if tied)</option>
                  <option value="home">{fixture.homeClubName} won on penalties</option>
                  <option value="away">{fixture.awayClubName} won on penalties</option>
                </select>
                {penaltiesWinner && (
                  <input
                    type="text"
                    placeholder="Pens score e.g. 5-4"
                    value={penaltiesScore}
                    onChange={(e) => setPenaltiesScore(e.target.value)}
                    className="px-3 py-1.5 w-32 bg-[#121824] border border-white/15 rounded text-slate-200 font-mono"
                  />
                )}
              </div>
            )}
          </div>

          {/* Goalscorers & Assists */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Your Club Goalscorers & Assists</h3>
              <button
                type="button"
                onClick={addGoalRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg hover:bg-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            </div>
            {goals.length === 0 ? (
              <p className="text-xs text-slate-400">
                Optional: Add your goalscorers, assists, and minutes to update Golden Boot & Assist leaderboards.
              </p>
            ) : (
              <div className="space-y-2">
                {goals.map((g, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-lg bg-[#0B0F17] border border-white/10">
                    <select
                      value={g.playerName}
                      onChange={(e) =>
                        setGoals((prev) => prev.map((item, i) => (i === idx ? { ...item, playerName: e.target.value } : item)))
                      }
                      className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-[#121824] border border-white/10 rounded text-white"
                    >
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.position})
                        </option>
                      ))}
                    </select>
                    <select
                      value={g.assistPlayerName || ''}
                      onChange={(e) =>
                        setGoals((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, assistPlayerName: e.target.value } : item))
                        )
                      }
                      className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-[#121824] border border-white/10 rounded text-slate-300"
                    >
                      <option value="">No Assist / Unassisted</option>
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.name}>
                          Assist: {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      placeholder="Min"
                      value={g.minute ?? ''}
                      onChange={(e) =>
                        setGoals((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, minute: e.target.value ? Number(e.target.value) : undefined } : item
                          )
                        )
                      }
                      className="sm:col-span-2 px-2.5 py-1.5 text-xs bg-[#121824] border border-white/10 rounded text-white font-mono"
                    />
                    <div className="sm:col-span-2 flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-1 text-[11px] text-amber-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(g.isGoalOfSeasonCandidate)}
                          onChange={(e) =>
                            setGoals((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, isGoalOfSeasonCandidate: e.target.checked } : item
                              )
                            )
                          }
                          className="accent-amber-400"
                        />
                        <span>GOTY?</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setGoals((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cards & MOTM & Injuries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Discipline (Cards)</h3>
                <button
                  type="button"
                  onClick={addCardRow}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded hover:bg-white/10"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Card</span>
                </button>
              </div>
              {cards.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={c.playerName}
                    onChange={(e) =>
                      setCards((prev) => prev.map((item, i) => (i === idx ? { ...item, playerName: e.target.value } : item)))
                    }
                    className="flex-1 px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white"
                  >
                    {availablePlayers.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={c.type}
                    onChange={(e) =>
                      setCards((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, type: e.target.value as 'yellow' | 'red' } : item))
                      )
                    }
                    className="px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white"
                  >
                    <option value="yellow">Yellow</option>
                    <option value="red">Red</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setCards((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Man of the Match</label>
                <select
                  value={motmPlayerName}
                  onChange={(e) => setMotmPlayerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                >
                  <option value="">None / Opponent Player</option>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Match Statistics */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Match Statistics (Optional)</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Your Poss %</label>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    placeholder="54"
                    value={possession}
                    onChange={(e) => setPossession(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Your Shots</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="12"
                    value={shots}
                    onChange={(e) => setShots(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">On Target</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="6"
                    value={shotsOnTarget}
                    onChange={(e) => setShotsOnTarget(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Opp Shots</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="8"
                    value={oppShots}
                    onChange={(e) => setOppShots(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Your xG</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    placeholder="1.8"
                    value={xg}
                    onChange={(e) => setXg(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Opp xG</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    placeholder="0.9"
                    value={oppXg}
                    onChange={(e) => setOppXg(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Injury Reported (Optional)</label>
                  <select
                    value={injuryPlayer}
                    onChange={(e) => setInjuryPlayer(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white"
                  >
                    <option value="">No Injuries</option>
                    {availablePlayers.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Out (MDs)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={injuryWeeks}
                    onChange={(e) => setInjuryWeeks(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Optional Player Ratings */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">
              Optional eFootball Player Ratings (1.0 – 10.0)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {state.tactics.startingXiIds.map((id) => {
                const p = state.squad.find((sq) => sq.id === id);
                if (!p) return null;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#0B0F17] border border-white/10">
                    <span className="text-xs text-slate-300 truncate">{p.name}</span>
                    <input
                      type="number"
                      step="0.5"
                      min={1}
                      max={10}
                      placeholder="–"
                      value={ratingInputs[p.name] || ''}
                      onChange={(e) => setRatingInputs((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      className="w-12 text-right text-xs font-mono bg-[#121824] border border-white/10 rounded px-1 py-0.5 text-white"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Key Moments / Tactical Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 88th-minute counter-attack winner after switching to high press"
              value={memorableMoment}
              onChange={(e) => setMemorableMoment(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-[#0B0F17] border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors"
          >
            Submit Result & Generate Match Report
          </button>
        </div>
      </form>
    </div>
  );
};

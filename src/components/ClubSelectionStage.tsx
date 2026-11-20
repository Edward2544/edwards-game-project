import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Shield } from 'lucide-react';
import { Club, Player, PlayerPosition } from '../types/universe';
import { buildStarterSquadForClub, LEAGUE_PRESETS } from '../data/presets';
import { getGroupForPosition } from '../engine/simulator';

interface ClubSelectionStageProps {
  onBack: () => void;
  onSelectClub: (club: Club, customLeagueClubs?: Club[], customSquad?: Player[]) => void;
}

export const ClubSelectionStage: React.FC<ClubSelectionStageProps> = ({
  onBack,
  onSelectClub,
}) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(LEAGUE_PRESETS[0].id);
  const [selectedClubId, setSelectedClubId] = useState<string>(LEAGUE_PRESETS[0].clubs[0].id);
  const [customMode, setCustomMode] = useState(false);

  const [customName, setCustomName] = useState('Mtaani United FC');
  const [customShort, setCustomShort] = useState('MTU');
  const [customCountry, setCustomCountry] = useState('England');
  const [customHostLeagueId, setCustomHostLeagueId] = useState('epl');
  const [customStadium, setCustomStadium] = useState('Mtaani Arena');
  const [customReputation, setCustomReputation] = useState(82);
  const [customIdentity, setCustomIdentity] = useState('4-3-3 High Press & Quick Transitions');
  const [customRivalId, setCustomRivalId] = useState('arsenal');

  const activeLeague = useMemo(
    () => LEAGUE_PRESETS.find((l) => l.id === selectedLeagueId) || LEAGUE_PRESETS[0],
    [selectedLeagueId]
  );

  const selectedClub = useMemo(
    () => activeLeague.clubs.find((c) => c.id === selectedClubId) || activeLeague.clubs[0],
    [activeLeague, selectedClubId]
  );

  const previewSquad = useMemo(() => buildStarterSquadForClub(selectedClub), [selectedClub]);
  const [customSquadEdits, setCustomSquadEdits] = useState<Record<string, { name: string; rating: number | null; position: PlayerPosition }>>({});

  const finalPreviewSquad = useMemo(() => {
    return previewSquad.map((p) => {
      const edit = customSquadEdits[p.id];
      if (!edit) return p;
      return {
        ...p,
        name: edit.name,
        rating: edit.rating,
        ratingSource: edit.rating !== null ? ('efootball-verified' as const) : ('unrated' as const),
        position: edit.position,
        group: getGroupForPosition(edit.position),
      };
    });
  }, [previewSquad, customSquadEdits]);

  const handleLeagueSwitch = (leagueId: string) => {
    setCustomMode(false);
    setSelectedLeagueId(leagueId);
    const league = LEAGUE_PRESETS.find((l) => l.id === leagueId);
    if (league && league.clubs[0]) {
      setSelectedClubId(league.clubs[0].id);
    }
  };

  const handleConfirmPreset = () => {
    onSelectClub(selectedClub, activeLeague.clubs, finalPreviewSquad);
  };

  const handleConfirmCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const hostLeague = LEAGUE_PRESETS.find((l) => l.id === customHostLeagueId) || LEAGUE_PRESETS[0];
    const cleanShort = (customShort || customName.slice(0, 3)).toUpperCase().slice(0, 4);
    const customClub: Club = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || 'Mtaani Dream FC',
      shortName: cleanShort,
      country: customCountry.trim() || hostLeague.country,
      leagueId: hostLeague.id,
      leagueName: hostLeague.name,
      stadium: customStadium.trim() || 'Mtaani Arena',
      reputation: customReputation,
      history: 'Custom eFootball Dream Team entering the top-flight ecosystem to forge a legacy from matchday one.',
      tacticalIdentity: customIdentity.trim() || '4-3-3 Balanced Control',
      managerialPhilosophy: 'Adaptable tactical identity shaped directly on the eFootball pitch.',
      objectives: [
        'Establish top-flight competitiveness',
        'Build squad chemistry and reach cup knockout rounds',
        'Develop core matchday leaders',
      ],
      boardExpectations: customReputation >= 85 ? 'Top 4 finish and trophy challenge.' : 'Top-half finish and cup progression.',
      supportersExpectations: 'Committed performances and pride against league rivals.',
      keyPlayerNames: ['Captain #10', 'Anchor #6', 'Striker #9'],
      weakPositions: ['Squad depth across bench spots'],
      mainRivalId: customRivalId,
      secondaryRivalIds: hostLeague.clubs.filter((c) => c.id !== customRivalId).slice(0, 2).map((c) => c.id),
      isSimulatedContext: true,
      primaryColor: '#10B981',
    };
    const leagueRoster = [customClub, ...hostLeague.clubs.slice(0, 9)];
    onSelectClub(customClub, leagueRoster);
  };

  const getClubNameById = (id: string) =>
    LEAGUE_PRESETS.flatMap((l) => l.clubs).find((c) => c.id === id)?.name || id;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between gap-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Opening</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-tight text-white">
              Stage 2 · Club Selection & Dossier
            </h1>
          </div>
          <button
            onClick={() => setCustomMode(!customMode)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{customMode ? 'Browse League Presets' : 'Create Custom Dream Team'}</span>
          </button>
        </header>

        {customMode ? (
          <form onSubmit={handleConfirmCustom} className="mt-8 max-w-3xl mx-auto p-6 md:p-8 rounded-xl bg-[#121824] border border-white/10 space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">Custom eFootball Club Registration</h2>
              <p className="text-sm text-slate-400 mt-1">
                Playing with your own Dream Team in eFootball? Register your club and place it into a competitive top-flight league. You can edit every player name and verified rating right after setup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Club Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">3-Letter Broadcast Code</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={customShort}
                  onChange={(e) => setCustomShort(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Host League</label>
                <select
                  value={customHostLeagueId}
                  onChange={(e) => {
                    setCustomHostLeagueId(e.target.value);
                    const found = LEAGUE_PRESETS.find((l) => l.id === e.target.value);
                    if (found) {
                      setCustomCountry(found.country);
                      setCustomRivalId(found.clubs[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                >
                  {LEAGUE_PRESETS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.country})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Home Stadium</label>
                <input
                  type="text"
                  required
                  value={customStadium}
                  onChange={(e) => setCustomStadium(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Club Reputation (Simulated: {customReputation}/100)
                </label>
                <input
                  type="range"
                  min={70}
                  max={95}
                  value={customReputation}
                  onChange={(e) => setCustomReputation(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Main League Rival</label>
                <select
                  value={customRivalId}
                  onChange={(e) => setCustomRivalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                >
                  {(LEAGUE_PRESETS.find((l) => l.id === customHostLeagueId)?.clubs || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Tactical Identity</label>
              <input
                type="text"
                value={customIdentity}
                onChange={(e) => setCustomIdentity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#0B0F17] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Register Club & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#121824] border border-white/10 rounded-lg">
                {LEAGUE_PRESETS.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => handleLeagueSwitch(league.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors text-left truncate ${
                      selectedLeagueId === league.id
                        ? 'bg-emerald-400 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {league.country} · {league.name.split(' ')[1] || league.name}
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-[#121824] border border-white/10 divide-y divide-white/10 overflow-hidden">
                {activeLeague.clubs.map((club) => {
                  const isActive = club.id === selectedClub.id;
                  return (
                    <button
                      key={club.id}
                      onClick={() => setSelectedClubId(club.id)}
                      className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors ${
                        isActive ? 'bg-emerald-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: club.primaryColor }}
                          />
                          <span className="text-sm font-semibold text-white truncate">{club.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate">
                          {club.stadium} · {club.tacticalIdentity}
                        </div>
                      </div>
                      <div className="text-right pl-3 shrink-0">
                        <div className="text-xs font-mono tabular-nums text-emerald-400">
                          REP {club.reputation}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 md:p-8 rounded-xl bg-[#121824] border border-white/10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
                      <span>{selectedClub.country}</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedClub.leagueName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedClub.stadium}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300">Simulated Starting Context</span>
                    </div>
                    <h2 className="text-3xl font-bold font-display text-white">
                      {selectedClub.name}
                    </h2>
                    <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                      {selectedClub.history}
                    </p>
                  </div>
                  <button
                    onClick={handleConfirmPreset}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>Take Charge of {selectedClub.shortName}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-white/10">
                  <div>
                    <div className="text-xs text-slate-400">Reputation (Sim)</div>
                    <div className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                      {selectedClub.reputation} / 100
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Starting Budget (Sim)</div>
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                      €{Math.round(Math.max(25, (selectedClub.reputation - 60) * 3.5))}M
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Main Rival</div>
                    <div className="text-sm font-semibold text-rose-300 mt-1">
                      {getClubNameById(selectedClub.mainRivalId)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Secondary Rivals</div>
                    <div className="text-xs text-slate-300 mt-1">
                      {selectedClub.secondaryRivalIds.map(getClubNameById).join(' · ') || 'League Contenders'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-1">Season Objectives</div>
                      <ul className="space-y-1 text-slate-200">
                        {selectedClub.objectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-mono text-xs mt-0.5">0{idx + 1}.</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-1">Board Expectations</div>
                      <p className="text-slate-300">{selectedClub.boardExpectations}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-1">Supporters’ Expectations</div>
                      <p className="text-slate-300">{selectedClub.supportersExpectations}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-1">Tactical Identity & Philosophy</div>
                      <p className="text-slate-200 font-medium">{selectedClub.tacticalIdentity}</p>
                      <p className="text-slate-400 mt-0.5">{selectedClub.managerialPhilosophy}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-1">Key Players</div>
                      <p className="text-slate-200">{selectedClub.keyPlayerNames.join(' · ')}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-1">Weak Positions Flagged</div>
                      <p className="text-amber-300">{selectedClub.weakPositions.join(' · ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#121824] border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Starting Squad ({finalPreviewSquad.length} Players)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Starter ratings are labeled Estimated unless you verify or edit them to match your eFootball squad.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-72 overflow-y-auto border border-white/10 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0B0F17] text-slate-400 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 font-medium">Pos</th>
                        <th className="py-2.5 px-3 font-medium">Player Name (Editable)</th>
                        <th className="py-2.5 px-3 font-medium">Role</th>
                        <th className="py-2.5 px-3 font-medium text-right">OVR</th>
                        <th className="py-2.5 px-3 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {finalPreviewSquad.map((p) => (
                        <tr key={p.id} className="hover:bg-white/5">
                          <td className="py-2 px-3 font-mono text-emerald-400">{p.position}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) =>
                                setCustomSquadEdits((prev) => ({
                                  ...prev,
                                  [p.id]: {
                                    name: e.target.value,
                                    rating: p.rating,
                                    position: p.position,
                                  },
                                }))
                              }
                              className="bg-transparent border-b border-transparent focus:border-emerald-400 text-slate-100 focus:outline-none w-40"
                            />
                          </td>
                          <td className="py-2 px-3 text-slate-400">{p.role}</td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min={50}
                              max={99}
                              value={p.rating ?? ''}
                              placeholder="–"
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                setCustomSquadEdits((prev) => ({
                                  ...prev,
                                  [p.id]: {
                                    name: p.name,
                                    rating: val,
                                    position: p.position,
                                  },
                                }));
                              }}
                              className="w-14 text-right font-mono tabular-nums bg-[#0B0F17] border border-white/10 rounded px-1.5 py-0.5 text-slate-100 focus:outline-none focus:border-emerald-400"
                            />
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {p.ratingSource === 'efootball-verified'
                              ? 'eFootball Verified'
                              : p.ratingSource === 'unrated'
                              ? 'Unrated'
                              : 'Estimated'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

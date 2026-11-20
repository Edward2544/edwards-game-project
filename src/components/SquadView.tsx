import React, { useMemo, useState } from 'react';
import { CreditCard, Plus, Shield, TrendingUp, UserCheck } from 'lucide-react';
import { Player, PlayerPosition, RatingSource, SquadRole, UniverseState } from '../types/universe';
import { getGroupForPosition } from '../engine/simulator';

interface SquadViewProps {
  state: UniverseState;
  onUpdateSquad: (squad: Player[]) => void;
  onOpenPlayerCards?: () => void;
}

const POSITIONS: PlayerPosition[] = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'SS', 'CF'];
const ROLES: SquadRole[] = ['Key Player', 'Starter', 'Rotation', 'Prospect', 'Backup', 'Transfer-Listed'];

export const SquadView: React.FC<SquadViewProps> = ({ state, onUpdateSquad, onOpenPlayerCards }) => {
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newNat, setNewNat] = useState('Kenya');
  const [newPos, setNewPos] = useState<PlayerPosition>('CF');
  const [newAge, setNewAge] = useState('21');
  const [newRating, setNewRating] = useState('');
  const [newRole, setNewRole] = useState<SquadRole>('Rotation');
  const [isProspect, setIsProspect] = useState(false);

  const depth = useMemo(() => {
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    state.squad.forEach((p) => {
      counts[p.group] += 1;
    });
    return counts;
  }, [state.squad]);

  const filteredSquad = useMemo(() => {
    const list = groupFilter === 'ALL' ? state.squad : state.squad.filter((p) => p.group === groupFilter);
    const groupOrder = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
    return [...list].sort((a, b) => groupOrder[a.group] - groupOrder[b.group]);
  }, [state.squad, groupFilter]);

  const youthProspects = useMemo(() => state.squad.filter((p) => p.isYouthProspect || p.age <= 21), [state.squad]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const ageNum = Math.max(16, Math.min(44, Number(newAge) || 21));
    const ratingNum = newRating.trim() ? Math.max(50, Math.min(99, Number(newRating))) : null;
    const group = getGroupForPosition(newPos);
    const added: Player = {
      id: `pl-${Date.now()}`,
      name: newName.trim(),
      nationality: newNat.trim() || 'Unknown',
      position: newPos,
      group,
      age: ageNum,
      rating: ratingNum,
      ratingSource: ratingNum !== null ? 'efootball-verified' : 'unrated',
      form: 'Steady',
      goals: 0,
      assists: 0,
      appearances: 0,
      starts: 0,
      minutes: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      motmAwards: 0,
      ratingsHistory: [],
      valueMillions: ratingNum ? Math.max(4, Math.round((ratingNum - 68) * 2.5)) : 12,
      wageThousands: ratingNum ? Math.max(20, (ratingNum - 68) * 5) : 45,
      contractYears: 3,
      status: 'Fit',
      role: newRole,
      isYouthProspect: isProspect || ageNum <= 21,
      development:
        isProspect || ageNum <= 21
          ? {
              minutesTarget: 500,
              goalsTarget: group === 'FWD' ? 4 : 2,
              assistsTarget: 3,
              startsTarget: 6,
              milestones: ['First senior start', 'Reach 500 senior minutes'],
              narrativeProgress: 'Added to squad development pathway.',
            }
          : undefined,
    };
    onUpdateSquad([...state.squad, added]);
    setNewName('');
    setNewRating('');
    setShowAddForm(false);
  };

  const updatePlayerField = (id: string, patch: Partial<Player>) => {
    onUpdateSquad(state.squad.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">Squad Management & Development</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify eFootball ratings, manage squad roles, and track youth development milestones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenPlayerCards && (
            <button
              onClick={onOpenPlayerCards}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-white/10 border border-[#2E86FF]/45 rounded-lg hover:bg-[#2E86FF]/20 transition-colors whitespace-nowrap shrink-0"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#2E86FF]" />
              <span>Player Cards & Packs</span>
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Form' : 'Add eFootball Player'}</span>
          </button>
        </div>
      </div>

      {/* Squad Depth Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Total Squad</div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">{state.squad.length}</div>
        </div>
        {(['GK', 'DEF', 'MID', 'FWD'] as const).map((g) => (
          <div key={g} className="p-4 rounded-xl bg-[#121824] border border-white/10">
            <div className="text-xs text-slate-400">{g} Depth</div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">{depth[g]}</div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddPlayer} className="p-5 rounded-xl bg-[#121824] border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-300 mb-1">Player Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. M. Olunga"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-white/15 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Position</label>
            <select
              value={newPos}
              onChange={(e) => setNewPos(e.target.value as PlayerPosition)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-white/15 rounded-lg text-white"
            >
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Age</label>
            <input
              type="number"
              min={16}
              max={44}
              value={newAge}
              onChange={(e) => setNewAge(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-white/15 rounded-lg text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">eFootball OVR (Opt.)</label>
            <input
              type="number"
              min={50}
              max={99}
              placeholder="Unrated"
              value={newRating}
              onChange={(e) => setNewRating(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-white/15 rounded-lg text-white font-mono"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300"
            >
              Save Player
            </button>
          </div>
          <div className="sm:col-span-6 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <input
              type="text"
              placeholder="Nationality"
              value={newNat}
              onChange={(e) => setNewNat(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as SquadRole)}
              className="px-3 py-1.5 text-xs bg-[#0B0F17] border border-white/15 rounded text-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  Role: {r}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isProspect}
                onChange={(e) => setIsProspect(e.target.checked)}
                className="accent-emerald-400"
              />
              <span>Track as Youth Development Prospect</span>
            </label>
          </div>
        </form>
      )}

      {/* Filter & Roster Table */}
      <div className="rounded-xl bg-[#121824] border border-white/10 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-white/10 rounded-lg">
            {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  groupFilter === g ? 'bg-[#2E86FF] text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit OVR to mark as eFootball Verified</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-3 font-medium">Pos</th>
                <th className="py-3 px-3 font-medium">Player</th>
                <th className="py-3 px-2 font-medium text-right">Age</th>
                <th className="py-3 px-2 font-medium text-right">OVR</th>
                <th className="py-3 px-3 font-medium">Source</th>
                <th className="py-3 px-3 font-medium">Role</th>
                <th className="py-3 px-3 font-medium">Status / Form</th>
                <th className="py-3 px-2 font-medium text-right">Apps</th>
                <th className="py-3 px-2 font-medium text-right">G</th>
                <th className="py-3 px-2 font-medium text-right">A</th>
                <th className="py-3 px-2 font-medium text-right">CS</th>
                <th className="py-3 px-3 font-medium text-right">Val (€M)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSquad.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 h-10">
                  <td className="py-2 px-3 font-mono text-emerald-400">{p.position}</td>
                  <td className="py-2 px-3 font-medium text-white whitespace-nowrap">
                    {p.name}
                    {state.tactics.captainId === p.id && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-400">(C)</span>
                    )}
                    {state.tactics.viceCaptainId === p.id && (
                      <span className="ml-1.5 text-[10px] font-mono text-slate-400">(VC)</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-300">{p.age}</td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      min={50}
                      max={99}
                      value={p.rating ?? ''}
                      placeholder="–"
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        const src: RatingSource = val !== null ? 'efootball-verified' : 'unrated';
                        updatePlayerField(p.id, { rating: val, ratingSource: src });
                      }}
                      className="w-12 text-right font-mono tabular-nums bg-[#0B0F17] border border-white/10 rounded px-1 py-0.5 text-white"
                    />
                  </td>
                  <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                    <span
                      className={
                        p.ratingSource === 'efootball-verified'
                          ? 'text-emerald-400'
                          : p.ratingSource === 'unrated'
                          ? 'text-slate-500'
                          : 'text-amber-300'
                      }
                    >
                      {p.ratingSource === 'efootball-verified'
                        ? 'Verified'
                        : p.ratingSource === 'unrated'
                        ? 'Unrated'
                        : 'Estimated'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={p.role}
                      onChange={(e) => updatePlayerField(p.id, { role: e.target.value as SquadRole })}
                      className="bg-[#0B0F17] border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-slate-200"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                    <span
                      className={
                        p.status === 'Fit'
                          ? 'text-slate-300'
                          : p.status === 'Injured'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }
                    >
                      {p.status}
                    </span>
                    <span className="text-slate-500"> · {p.form}</span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-300">{p.appearances}</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-white font-semibold">{p.goals}</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-200">{p.assists}</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-300">{p.cleanSheets}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-300">€{p.valueMillions}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 17: Youth & Player Development */}
      <div className="p-6 rounded-xl bg-[#121824] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Player Development & Youth Pathway</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Narrative and milestone tracking for young prospects (no invented rating spikes).
            </p>
          </div>
          <Shield className="w-4 h-4 text-slate-500" />
        </div>

        {youthProspects.length === 0 ? (
          <p className="text-xs text-slate-400">No U21 prospects currently flagged in squad.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {youthProspects.map((yp) => {
              const targetMin = yp.development?.minutesTarget ?? 600;
              const pct = Math.min(100, Math.round((yp.minutes / targetMin) * 100));
              return (
                <div key={yp.id} className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-white">
                      {yp.name} <span className="text-xs font-mono text-emerald-400">{yp.position}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Age {yp.age}</span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono tabular-nums">
                    {yp.minutes}/{targetMin} mins · {yp.starts} starts · {yp.goals}G / {yp.assists}A
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {yp.development?.narrativeProgress || 'Tracking senior squad minutes and match contributions.'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

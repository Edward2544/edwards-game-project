import React from 'react';
import { Sliders, Check } from 'lucide-react';
import { TacticsConfig, UniverseState } from '../types/universe';
import { getTacticalAdvice } from '../engine/simulator';

interface TacticsViewProps {
  state: UniverseState;
  onUpdateTactics: (tactics: TacticsConfig) => void;
}

const FORMATION_COORDS: Record<string, { label: string; x: number; y: number }[]> = {
  '4-3-3': [
    { label: 'GK', x: 50, y: 90 },
    { label: 'LB', x: 16, y: 72 },
    { label: 'CB', x: 38, y: 75 },
    { label: 'CB', x: 62, y: 75 },
    { label: 'RB', x: 84, y: 72 },
    { label: 'DMF', x: 50, y: 56 },
    { label: 'CMF', x: 30, y: 46 },
    { label: 'AMF', x: 70, y: 46 },
    { label: 'LWF', x: 20, y: 24 },
    { label: 'CF', x: 50, y: 18 },
    { label: 'RWF', x: 80, y: 24 },
  ],
  '4-2-3-1': [
    { label: 'GK', x: 50, y: 90 },
    { label: 'LB', x: 16, y: 72 },
    { label: 'CB', x: 38, y: 75 },
    { label: 'CB', x: 62, y: 75 },
    { label: 'RB', x: 84, y: 72 },
    { label: 'DMF', x: 37, y: 56 },
    { label: 'DMF', x: 63, y: 56 },
    { label: 'LMF', x: 20, y: 36 },
    { label: 'AMF', x: 50, y: 38 },
    { label: 'RMF', x: 80, y: 36 },
    { label: 'CF', x: 50, y: 16 },
  ],
  '3-5-2': [
    { label: 'GK', x: 50, y: 90 },
    { label: 'CB', x: 26, y: 74 },
    { label: 'CB', x: 50, y: 76 },
    { label: 'CB', x: 74, y: 74 },
    { label: 'LMF', x: 14, y: 48 },
    { label: 'DMF', x: 36, y: 54 },
    { label: 'CMF', x: 50, y: 44 },
    { label: 'CMF', x: 64, y: 54 },
    { label: 'RMF', x: 86, y: 48 },
    { label: 'CF', x: 38, y: 20 },
    { label: 'CF', x: 62, y: 20 },
  ],
  '4-4-2': [
    { label: 'GK', x: 50, y: 90 },
    { label: 'LB', x: 16, y: 72 },
    { label: 'CB', x: 38, y: 75 },
    { label: 'CB', x: 62, y: 75 },
    { label: 'RB', x: 84, y: 72 },
    { label: 'LMF', x: 18, y: 46 },
    { label: 'CMF', x: 40, y: 50 },
    { label: 'CMF', x: 60, y: 50 },
    { label: 'RMF', x: 82, y: 46 },
    { label: 'CF', x: 38, y: 20 },
    { label: 'CF', x: 62, y: 20 },
  ],
  '3-4-2-1': [
    { label: 'GK', x: 50, y: 90 },
    { label: 'CB', x: 26, y: 74 },
    { label: 'CB', x: 50, y: 76 },
    { label: 'CB', x: 74, y: 74 },
    { label: 'LMF', x: 14, y: 50 },
    { label: 'CMF', x: 38, y: 53 },
    { label: 'CMF', x: 62, y: 53 },
    { label: 'RMF', x: 86, y: 50 },
    { label: 'AMF', x: 34, y: 32 },
    { label: 'AMF', x: 66, y: 32 },
    { label: 'CF', x: 50, y: 16 },
  ],
  '4-1-2-1-2': [
    { label: 'GK', x: 50, y: 90 },
    { label: 'LB', x: 16, y: 72 },
    { label: 'CB', x: 38, y: 75 },
    { label: 'CB', x: 62, y: 75 },
    { label: 'RB', x: 84, y: 72 },
    { label: 'DMF', x: 50, y: 58 },
    { label: 'CMF', x: 30, y: 45 },
    { label: 'CMF', x: 70, y: 45 },
    { label: 'AMF', x: 50, y: 33 },
    { label: 'CF', x: 37, y: 18 },
    { label: 'CF', x: 63, y: 18 },
  ],
};

export const TacticsView: React.FC<TacticsViewProps> = ({ state, onUpdateTactics }) => {
  const { tactics, squad } = state;
  const coords = FORMATION_COORDS[tactics.formation] || FORMATION_COORDS['4-3-3'];
  const advice = getTacticalAdvice(state);

  const toggleXiMember = (playerId: string) => {
    const isStarter = tactics.startingXiIds.includes(playerId);
    if (isStarter) {
      const nextXi = tactics.startingXiIds.filter((id) => id !== playerId);
      const nextBench = [...tactics.benchIds, playerId].slice(0, 7);
      onUpdateTactics({ ...tactics, startingXiIds: nextXi, benchIds: nextBench });
    } else if (tactics.startingXiIds.length < 11) {
      const nextXi = [...tactics.startingXiIds, playerId];
      const nextBench = tactics.benchIds.filter((id) => id !== playerId);
      onUpdateTactics({ ...tactics, startingXiIds: nextXi, benchIds: nextBench });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tactical War Room Header */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121824]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-4 relative min-h-[160px]">
            <img
              src="/src/assets/images/tactical_war_room_1795179830625.jpg"
              alt="Manager tactical desk and notebook"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-[#121824]" />
          </div>
          <div className="lg:col-span-8 p-6 flex flex-col justify-center space-y-2">
            <div className="text-xs font-semibold text-emerald-400">TACTICAL WAR ROOM · {state.userClub?.shortName}</div>
            <h2 className="text-2xl font-bold font-display text-white">
              Formation Blueprint & Matchday Instructions
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">{advice}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pitch Visualizer + XI */}
        <div className="lg:col-span-6 p-6 rounded-xl bg-[#121824] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">
              Starting XI ({tactics.startingXiIds.length}/11)
            </h3>
            <select
              value={tactics.formation}
              onChange={(e) => onUpdateTactics({ ...tactics, formation: e.target.value })}
              className="px-3 py-1.5 text-xs font-mono bg-[#0B0F17] border border-white/15 rounded-lg text-emerald-400 font-semibold"
            >
              {Object.keys(FORMATION_COORDS).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Clean SVG Tactical Pitch */}
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-emerald-500/20 bg-[#0F2419]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="4" y="4" width="92" height="92" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
              <line x1="4" y1="50" x2="96" y2="50" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="11" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
              <rect x="28" y="4" width="44" height="14" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
              <rect x="28" y="82" width="44" height="14" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />

              {coords.map((slot, idx) => {
                const playerId = tactics.startingXiIds[idx];
                const player = squad.find((p) => p.id === playerId);
                return (
                  <g key={idx} transform={`translate(${slot.x}, ${slot.y})`}>
                    <circle r="3.6" fill={player ? '#34D399' : '#334155'} stroke="#0B0F17" strokeWidth="0.8" />
                    <text
                      y="6.8"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="3"
                      fontWeight="600"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {player ? player.name.split(' ').slice(-1)[0] : slot.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="text-xs text-slate-400">
            Click players in the roster list on the right to swap them in or out of your Starting XI.
          </div>
        </div>

        {/* Right: Tactical Instructions & Lineup Selector */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-xl bg-[#121824] border border-white/10 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Tactical Identity & Instructions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Attacking Strategy</label>
                <input
                  type="text"
                  value={tactics.attackingStrategy}
                  onChange={(e) => onUpdateTactics({ ...tactics, attackingStrategy: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Defensive Strategy</label>
                <input
                  type="text"
                  value={tactics.defensiveStrategy}
                  onChange={(e) => onUpdateTactics({ ...tactics, defensiveStrategy: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pressing Style</label>
                <input
                  type="text"
                  value={tactics.pressingStyle}
                  onChange={(e) => onUpdateTactics({ ...tactics, pressingStyle: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Build-Up Approach</label>
                <input
                  type="text"
                  value={tactics.buildUpApproach}
                  onChange={(e) => onUpdateTactics({ ...tactics, buildUpApproach: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Defensive Line</label>
                <select
                  value={tactics.defensiveLine}
                  onChange={(e) => onUpdateTactics({ ...tactics, defensiveLine: e.target.value as TacticsConfig['defensiveLine'] })}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                >
                  <option value="High">High Line</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Deep">Deep Block</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Attacking Width</label>
                <select
                  value={tactics.width}
                  onChange={(e) => onUpdateTactics({ ...tactics, width: e.target.value as TacticsConfig['width'] })}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                >
                  <option value="Wide">Wide</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Narrow">Narrow</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Club Captain</label>
                <select
                  value={tactics.captainId}
                  onChange={(e) => onUpdateTactics({ ...tactics, captainId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                >
                  {squad.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Vice-Captain</label>
                <select
                  value={tactics.viceCaptainId}
                  onChange={(e) => onUpdateTactics({ ...tactics, viceCaptainId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-white/15 rounded-lg text-white"
                >
                  {squad.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Squad Lineup Toggle List */}
          <div className="p-6 rounded-xl bg-[#121824] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Select Starting XI (Max 11)</h3>
              <span className="text-xs font-mono text-emerald-400">{tactics.startingXiIds.length} / 11 Selected</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-white/5 border border-white/10 rounded-lg">
              {squad.map((p) => {
                const isStarter = tactics.startingXiIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleXiMember(p.id)}
                    className={`w-full px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                      isStarter ? 'bg-emerald-500/10 text-white' : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono w-8 text-left text-emerald-400">{p.position}</span>
                      <span className="font-medium">{p.name}</span>
                      {p.status !== 'Fit' && <span className="text-rose-400">({p.status})</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums">{p.rating ?? '–'}</span>
                      {isStarter && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { UniverseState } from '../types/universe';
import { computeLeagueTable, getNextUserFixture } from '../engine/simulator';

interface CareerDashboardModalProps {
  state: UniverseState;
  onClose: () => void;
}

export const CareerDashboardModal: React.FC<CareerDashboardModalProps> = ({ state, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const userClub = state.userClub;
  if (!userClub) return null;

  const leagueComp = state.competitions.find((c) => c.type === 'league');
  const table = leagueComp ? computeLeagueTable(state.fixtures, state.clubs, leagueComp.id) : [];
  const posIdx = table.findIndex((r) => r.clubId === userClub.id);
  const pos = posIdx >= 0 ? posIdx + 1 : 1;
  const row = table[posIdx];

  const byGoals = [...state.squad].sort((a, b) => b.goals - a.goals);
  const byAssists = [...state.squad].sort((a, b) => b.assists - a.assists);
  const byBest = [...state.squad].sort(
    (a, b) => b.motmAwards * 3 + b.goals * 2 + b.assists * 1.5 - (a.motmAwards * 3 + a.goals * 2 + a.assists * 1.5)
  );

  const topScorer = byGoals[0] && byGoals[0].goals > 0 ? `${byGoals[0].name} (${byGoals[0].goals})` : 'None recorded yet';
  const topAssist = byAssists[0] && byAssists[0].assists > 0 ? `${byAssists[0].name} (${byAssists[0].assists})` : 'None recorded yet';
  const bestPlayer =
    byBest[0] && (byBest[0].goals > 0 || byBest[0].assists > 0 || byBest[0].motmAwards > 0)
      ? `${byBest[0].name} (${byBest[0].goals}G/${byBest[0].assists}A, ${byBest[0].motmAwards} MOTM)`
      : 'Awaiting matchday performances';

  const nextFixture = getNextUserFixture(state);
  const nextFixtureText = nextFixture
    ? `${nextFixture.competitionName} · ${nextFixture.roundLabel}: ${nextFixture.homeClubName} vs ${nextFixture.awayClubName}`
    : 'All scheduled fixtures complete';

  const fields: [string, string][] = [
    ['Manager', `${state.manager.name || 'Unassigned'} (${state.manager.nationality || '–'})`],
    ['Club', userClub.name],
    ['Season', state.seasonLabel],
    ['Competition', leagueComp?.name || userClub.leagueName],
    ['Current position', `#${pos} of ${state.clubs.length}`],
    ['Matches played', String(row?.played ?? 0)],
    ['Wins', String(row?.won ?? 0)],
    ['Draws', String(row?.drawn ?? 0)],
    ['Losses', String(row?.lost ?? 0)],
    ['Goals scored', String(row?.gf ?? 0)],
    ['Goals conceded', String(row?.ga ?? 0)],
    ['Points', String(row?.pts ?? 0)],
    ['Current budget', `€${state.finances.transferBudgetMillions}M (Simulated)`],
    ['Transfer spending', `€${state.finances.transferSpendingMillions}M`],
    ['Transfer income', `€${state.finances.transferIncomeMillions}M`],
    ['Top scorer', topScorer],
    ['Top assist provider', topAssist],
    ['Best player', bestPlayer],
    ['Next fixture', nextFixtureText],
    ['Season objectives', userClub.objectives.join(' | ')],
    ['Trophies', state.manager.careerTotals.trophies.length > 0 ? state.manager.careerTotals.trophies.join(', ') : 'None yet'],
    ['Manager reputation', `${state.manager.reputation} / 100`],
    ['Club reputation', `${userClub.reputation} / 100`],
  ];

  const handleCopyText = () => {
    const text = [
      'MY eFOOTBALL CAREER DASHBOARD — FOOTBALL MTAANI',
      ...fields.map(([k, v]) => `${k}: ${v}`),
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl bg-[#121824] border border-white/15 overflow-hidden my-8">
        <div className="px-6 py-4 bg-[#0B0F17] border-b border-white/10 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-400">FOOTBALL MTAANI · MASTER RECORD</div>
            <h2 className="text-xl font-bold font-display text-white">MY eFOOTBALL CAREER DASHBOARD</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close dashboard"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden bg-[#0B0F17]">
            {fields.map(([label, value]) => (
              <div key={label} className="px-4 py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-4 text-slate-400 font-medium">{label}</div>
                <div className="sm:col-span-8 text-slate-100 font-mono tabular-nums">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

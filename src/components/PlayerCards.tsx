import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Crown,
  Gift,
  PackageOpen,
  Shield,
  Sparkles,
  TrendingUp,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { Player, PlayerPosition, RatingSource, UniverseState } from '../types/universe';
import { getCommentatorName, getGroupForPosition } from '../engine/simulator';

interface PlayerCardsProps {
  state: UniverseState;
  onUpdateState: React.Dispatch<React.SetStateAction<UniverseState>>;
}

type CardTier = 'Epic Legend' | 'Blue Featured' | 'Standard Pro' | 'Academy Prospect';

interface PackDefinition {
  id: string;
  name: string;
  subtitle: string;
  costMillions: number;
  minOvr: number;
  maxOvr: number;
  tierLabel: string;
  accentClass: string;
}

const PACK_DEFINITIONS: PackDefinition[] = [
  {
    id: 'mtaani-free-scout',
    name: 'Mtaani Academy Scout',
    subtitle: '1 free prospect draw every Matchday (Sim)',
    costMillions: 0,
    minOvr: 69,
    maxOvr: 78,
    tierLabel: 'FREE DAILY DRAW',
    accentClass: 'border-emerald-400/40 bg-emerald-500/5',
  },
  {
    id: 'standard-club-pack',
    name: 'Standard Club Pack',
    subtitle: 'Reliable squad depth & first-team rotators',
    costMillions: 8,
    minOvr: 76,
    maxOvr: 83,
    tierLabel: 'STANDARD BOX',
    accentClass: 'border-white/20 bg-white/5',
  },
  {
    id: 'blue-star-featured',
    name: 'Blue Star Featured Pack',
    subtitle: 'Guaranteed 82–88 OVR eFootball Highlight Card',
    costMillions: 18,
    minOvr: 82,
    maxOvr: 88,
    tierLabel: 'FEATURED #2E86FF',
    accentClass: 'border-[#2E86FF]/60 bg-[#2E86FF]/10',
  },
  {
    id: 'legends-box-draw',
    name: 'Mtaani Legends Box Draw',
    subtitle: 'Elite 86–94 OVR Icon & World-Class Superstar',
    costMillions: 32,
    minOvr: 86,
    maxOvr: 94,
    tierLabel: 'EPIC / LEGEND',
    accentClass: 'border-amber-400/55 bg-amber-500/10',
  },
];

const PACK_PLAYER_POOL: {
  name: string;
  nationality: string;
  position: PlayerPosition;
  age: number;
  baseOvr: number;
}[] = [
  { name: 'Michael Olunga', nationality: 'Kenya', position: 'CF', age: 29, baseOvr: 84 },
  { name: 'Mohammed Bajaber', nationality: 'Kenya', position: 'AMF', age: 21, baseOvr: 78 },
  { name: 'Austin Odhiambo', nationality: 'Kenya', position: 'AMF', age: 24, baseOvr: 79 },
  { name: 'Ryan Ogam', nationality: 'Kenya', position: 'CF', age: 20, baseOvr: 76 },
  { name: 'Rooney Onyango', nationality: 'Kenya', position: 'RWF', age: 23, baseOvr: 77 },
  { name: 'Victor Osimhen', nationality: 'Nigeria', position: 'CF', age: 26, baseOvr: 89 },
  { name: 'Mohammed Kudus', nationality: 'Ghana', position: 'RWF', age: 24, baseOvr: 86 },
  { name: 'Brahim Díaz', nationality: 'Morocco', position: 'AMF', age: 25, baseOvr: 85 },
  { name: 'Tariq Lamptey', nationality: 'Ghana', position: 'RB', age: 24, baseOvr: 80 },
  { name: 'Kylian Mbappé (Legend)', nationality: 'France', position: 'CF', age: 26, baseOvr: 93 },
  { name: 'Ronaldinho (Epic)', nationality: 'Brazil', position: 'LWF', age: 25, baseOvr: 94 },
  { name: 'Didier Drogba (Epic)', nationality: 'Ivory Coast', position: 'CF', age: 27, baseOvr: 92 },
  { name: 'Jay-Jay Okocha (Epic)', nationality: 'Nigeria', position: 'AMF', age: 26, baseOvr: 90 },
  { name: 'Kobbie Mainoo', nationality: 'England', position: 'CMF', age: 20, baseOvr: 82 },
  { name: 'Pau Cubarsí', nationality: 'Spain', position: 'CB', age: 19, baseOvr: 83 },
  { name: 'Lamine Yamal', nationality: 'Spain', position: 'RWF', age: 18, baseOvr: 88 },
  { name: 'Diogo Costa', nationality: 'Portugal', position: 'GK', age: 25, baseOvr: 86 },
  { name: 'Byrne Omondi', nationality: 'Kenya', position: 'GK', age: 26, baseOvr: 76 },
  { name: 'Amos Nondi', nationality: 'Kenya', position: 'DMF', age: 25, baseOvr: 77 },
  { name: 'Erick Ouma', nationality: 'Kenya', position: 'LB', age: 27, baseOvr: 78 },
];

function getCardTier(player: Player): CardTier {
  const ovr = player.rating ?? 74;
  if (ovr >= 88) return 'Epic Legend';
  if (ovr >= 82) return 'Blue Featured';
  if (player.isYouthProspect || player.age <= 20) return 'Academy Prospect';
  return 'Standard Pro';
}

function getTierStyles(tier: CardTier) {
  switch (tier) {
    case 'Epic Legend':
      return {
        frame: 'border-amber-400/70 bg-gradient-to-b from-[#2a2110] via-[#131926] to-[#0B0F17]',
        badge: 'text-amber-300',
        ovr: 'text-amber-300',
      };
    case 'Blue Featured':
      return {
        frame: 'border-[#2E86FF]/80 bg-gradient-to-b from-[#0E2852] via-[#121C2E] to-[#0B0F17]',
        badge: 'text-[#529BFF]',
        ovr: 'text-[#2E86FF]',
      };
    case 'Academy Prospect':
      return {
        frame: 'border-emerald-400/50 bg-gradient-to-b from-[#0D2B24] via-[#121824] to-[#0B0F17]',
        badge: 'text-emerald-300',
        ovr: 'text-emerald-300',
      };
    default:
      return {
        frame: 'border-white/20 bg-gradient-to-b from-[#1a2234] via-[#121824] to-[#0B0F17]',
        badge: 'text-slate-300',
        ovr: 'text-white',
      };
  }
}

function computeCardAttributes(player: Player) {
  const base = player.rating ?? 74;
  const g = player.group;
  const clamp = (n: number) => Math.max(45, Math.min(99, Math.round(n)));
  return [
    {
      label: 'PAC',
      value: clamp(base + (g === 'FWD' ? 4 : g === 'MID' ? 1 : g === 'DEF' ? -1 : -14)),
    },
    {
      label: 'SHO',
      value: clamp(base + (g === 'FWD' ? 5 : g === 'MID' ? -2 : g === 'DEF' ? -14 : -26)),
    },
    {
      label: 'PAS',
      value: clamp(base + (g === 'MID' ? 5 : g === 'FWD' ? -2 : g === 'DEF' ? -4 : -8)),
    },
    {
      label: 'DRI',
      value: clamp(base + (g === 'FWD' || g === 'MID' ? 3 : -8)),
    },
    {
      label: 'DEF',
      value: clamp(base + (g === 'DEF' ? 6 : g === 'GK' ? 4 : g === 'MID' ? -6 : -22)),
    },
    {
      label: 'PHY',
      value: clamp(base + (g === 'DEF' || g === 'GK' ? 4 : 0)),
    },
  ];
}

export const PlayerCards: React.FC<PlayerCardsProps> = ({ state, onUpdateState }) => {
  const [subTab, setSubTab] = useState<'cards' | 'packs'>('cards');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [sortBy, setSortBy] = useState<'ovr' | 'position'>('ovr');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Pack Opening State
  const [packStage, setPackStage] = useState<'idle' | 'tunnel' | 'clue' | 'revealed'>('idle');
  const [activePack, setActivePack] = useState<PackDefinition | null>(null);
  const [drawnPlayer, setDrawnPlayer] = useState<Player | null>(null);
  const [lastFreeDrawMatchday, setLastFreeDrawMatchday] = useState<number>(-1);
  const [lastTrainedMatchday, setLastTrainedMatchday] = useState<number>(-1);
  const [packNotice, setPackNotice] = useState<string | null>(null);

  const userClub = state.userClub!;
  const commentator = getCommentatorName(state.activeCommentator);

  const sortedCards = useMemo(() => {
    const filtered =
      groupFilter === 'ALL'
        ? state.squad
        : state.squad.filter((p) => p.group === groupFilter);
    const groupOrder = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
    return [...filtered].sort((a, b) => {
      if (sortBy === 'ovr') {
        return (b.rating ?? 70) - (a.rating ?? 70);
      }
      return groupOrder[a.group] - groupOrder[b.group];
    });
  }, [state.squad, groupFilter, sortBy]);

  const selectedCard = useMemo(
    () => state.squad.find((p) => p.id === selectedCardId) || null,
    [state.squad, selectedCardId]
  );

  const avgOvr = useMemo(() => {
    const rated = state.squad.filter((p) => p.rating !== null);
    if (rated.length === 0) return 75;
    return Math.round(rated.reduce((sum, p) => sum + (p.rating || 75), 0) / rated.length);
  }, [state.squad]);

  const handleOpenPack = (pack: PackDefinition) => {
    setPackNotice(null);
    if (pack.costMillions === 0 && lastFreeDrawMatchday === state.currentMatchday) {
      setPackNotice(
        `Free Academy Scout already used on Matchday ${state.currentMatchday}. Play a match to unlock the next free draw!`
      );
      return;
    }
    if (pack.costMillions > state.finances.transferBudgetMillions) {
      setPackNotice(
        `Insufficient transfer budget (€${state.finances.transferBudgetMillions}M available, €${pack.costMillions}M needed).`
      );
      return;
    }

    // Pick a candidate from pool or procedurally create one within pack OVR band
    const existingNames = new Set(state.squad.map((p) => p.name.toLowerCase()));
    const poolMatches = PACK_PLAYER_POOL.filter(
      (c) =>
        c.baseOvr >= pack.minOvr &&
        c.baseOvr <= pack.maxOvr &&
        !existingNames.has(c.name.toLowerCase())
    );
    const pick =
      poolMatches.length > 0
        ? poolMatches[Math.floor(Math.random() * poolMatches.length)]
        : PACK_PLAYER_POOL[Math.floor(Math.random() * PACK_PLAYER_POOL.length)];

    const rolledOvr = Math.max(
      pack.minOvr,
      Math.min(pack.maxOvr, pick.baseOvr + Math.floor(Math.random() * 3) - 1)
    );
    const group = getGroupForPosition(pick.position);
    const newPlayer: Player = {
      id: `pack-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: pick.name,
      nationality: pick.nationality,
      position: pick.position,
      group,
      age: pick.age,
      rating: rolledOvr,
      ratingSource: 'estimated',
      form: 'Good',
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
      valueMillions: Math.max(4, Math.round((rolledOvr - 68) * 2.8)),
      wageThousands: Math.max(20, (rolledOvr - 66) * 5),
      contractYears: 3,
      status: 'Fit',
      role: rolledOvr >= 84 ? 'Key Player' : rolledOvr >= 78 ? 'Starter' : 'Prospect',
      isYouthProspect: pick.age <= 21,
      development:
        pick.age <= 21
          ? {
              minutesTarget: 500,
              goalsTarget: group === 'FWD' ? 4 : 2,
              assistsTarget: 3,
              startsTarget: 6,
              milestones: ['Pack Debut', 'Reach 500 minutes'],
              narrativeProgress: 'Scouted via Mtaani Pack Draw.',
            }
          : undefined,
    };

    if (pack.costMillions === 0) {
      setLastFreeDrawMatchday(state.currentMatchday);
    }

    setActivePack(pack);
    setDrawnPlayer(newPlayer);
    setPackStage('tunnel');

    window.setTimeout(() => setPackStage('clue'), 750);
    window.setTimeout(() => setPackStage('revealed'), 1600);
  };

  const handleSignPackPlayer = () => {
    if (!drawnPlayer || !activePack) return;
    const cost = activePack.costMillions;

    onUpdateState((prev) => ({
      ...prev,
      squad: [drawnPlayer, ...prev.squad],
      finances: {
        ...prev.finances,
        transferBudgetMillions: Math.max(0, prev.finances.transferBudgetMillions - cost),
        transferSpendingMillions: prev.finances.transferSpendingMillions + cost,
      },
      transferHistory:
        cost > 0 || prev.transferHistory.length >= 0
          ? [
              {
                id: `th-pack-${Date.now()}`,
                seasonLabel: prev.seasonLabel,
                matchday: prev.currentMatchday,
                direction: cost === 0 ? 'FREE' : 'IN',
                playerName: drawnPlayer.name,
                position: drawnPlayer.position,
                counterpartyClub: activePack.name,
                feeMillions: cost,
                wageThousands: drawnPlayer.wageThousands,
                contractYears: drawnPlayer.contractYears,
                executionScope: 'simulated-universe',
              },
              ...prev.transferHistory,
            ]
          : prev.transferHistory,
      ledger:
        cost > 0
          ? [
              {
                id: `led-pack-${Date.now()}`,
                matchday: prev.currentMatchday,
                label: `Pack Signing: ${drawnPlayer.name} (${activePack.name})`,
                category: 'Transfer',
                amountMillions: -cost,
                isSimulated: true,
              },
              ...prev.ledger,
            ]
          : prev.ledger,
      news: [
        {
          id: `news-pack-${Date.now()}`,
          matchday: prev.currentMatchday,
          category: 'Mtaani Wire' as const,
          headline: `${userClub.shortName} Unveil ${drawnPlayer.name} (${drawnPlayer.rating} OVR) From ${activePack.name}`,
          summary: `Simulated Pack Scout Draw added ${drawnPlayer.name} (${drawnPlayer.position}) to the first-team squad.`,
          shengTake: `${commentator}: "Mambo ni moto! ${drawnPlayer.name} ameshuka mtaani akiwa na rating ya ${drawnPlayer.rating}!"`,
          isSimulated: true as const,
        },
        ...prev.news,
      ].slice(0, 24),
    }));

    setPackNotice(`Signed ${drawnPlayer.name} (${drawnPlayer.rating} OVR) to ${userClub.shortName} squad!`);
    setPackStage('idle');
    setDrawnPlayer(null);
    setActivePack(null);
    setSubTab('cards');
    setSelectedCardId(drawnPlayer.id);
  };

  const handleUpdateCardOvr = (playerId: string, newOvr: number | null) => {
    onUpdateState((prev) => ({
      ...prev,
      squad: prev.squad.map((p) => {
        if (p.id !== playerId) return p;
        const src: RatingSource = newOvr !== null ? 'efootball-verified' : 'unrated';
        return { ...p, rating: newOvr, ratingSource: src };
      }),
    }));
  };

  const handleTrainingBoost = (playerId: string) => {
    if (lastTrainedMatchday === state.currentMatchday) return;
    setLastTrainedMatchday(state.currentMatchday);
    onUpdateState((prev) => ({
      ...prev,
      squad: prev.squad.map((p) => {
        if (p.id !== playerId) return p;
        const nextOvr = Math.min(99, (p.rating ?? 74) + 1);
        return {
          ...p,
          rating: nextOvr,
          ratingSource: p.ratingSource === 'unrated' ? 'estimated' : p.ratingSource,
          form: 'Excellent',
        };
      }),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">
            eFootball Player Cards & Pack Opening
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect player OVR ratings, card tiers, attribute breakdowns, and open Mtaani scout packs.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#121824] border border-white/10 rounded-lg">
          <button
            onClick={() => setSubTab('cards')}
            className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors ${
              subTab === 'cards' ? 'bg-[#2E86FF] text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Squad Cards ({state.squad.length})
          </button>
          <button
            onClick={() => setSubTab('packs')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors ${
              subTab === 'packs' ? 'bg-[#2E86FF] text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <PackageOpen className="w-3.5 h-3.5" />
            <span>Open Packs</span>
          </button>
        </div>
      </div>

      {/* Club Card Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Team Avg OVR</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#2E86FF] mt-0.5">{avgOvr}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Club Cards</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">{state.squad.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Featured / Epic</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-300 mt-0.5">
            {state.squad.filter((p) => (p.rating ?? 0) >= 82).length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Pack Budget</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
            €{state.finances.transferBudgetMillions}M
          </div>
        </div>
      </div>

      {packNotice && (
        <div className="p-3.5 rounded-lg bg-[#2E86FF]/15 border border-[#2E86FF]/40 text-xs text-white flex items-center justify-between gap-2">
          <span>{packNotice}</span>
          <button onClick={() => setPackNotice(null)} className="text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: PLAYER CARDS & RATINGS */}
      {subTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#121824] border border-white/10 rounded-lg">
              {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={`px-3 py-1.5 text-xs font-medium rounded ${
                    groupFilter === g ? 'bg-[#2E86FF] text-white font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Sort:</span>
              <button
                onClick={() => setSortBy('ovr')}
                className={`px-3 py-1.5 rounded-lg border ${
                  sortBy === 'ovr'
                    ? 'border-[#2E86FF] bg-[#2E86FF]/15 text-white'
                    : 'border-white/10 bg-[#121824] text-slate-300'
                }`}
              >
                Highest OVR
              </button>
              <button
                onClick={() => setSortBy('position')}
                className={`px-3 py-1.5 rounded-lg border ${
                  sortBy === 'position'
                    ? 'border-[#2E86FF] bg-[#2E86FF]/15 text-white'
                    : 'border-white/10 bg-[#121824] text-slate-300'
                }`}
              >
                Position
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedCards.map((player) => {
              const tier = getCardTier(player);
              const styles = getTierStyles(tier);
              const isCap = state.tactics.captainId === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedCardId(player.id)}
                  className={`group text-left rounded-xl border p-3.5 transition-transform hover:-translate-y-1 flex flex-col justify-between min-h-[215px] ${styles.frame}`}
                >
                  {/* Top OVR + Position */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`text-3xl font-bold font-display leading-none tabular-nums ${styles.ovr}`}>
                        {player.rating ?? '–'}
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-white mt-0.5">
                        {player.position}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${styles.badge}`}>
                        {tier === 'Epic Legend'
                          ? 'EPIC'
                          : tier === 'Blue Featured'
                          ? 'FEATURED'
                          : tier === 'Academy Prospect'
                          ? 'YOUTH'
                          : 'STD'}
                      </span>
                      {isCap && (
                        <div className="text-[10px] font-mono text-amber-300 flex items-center justify-end gap-0.5 mt-0.5">
                          <Crown className="w-3 h-3" />
                          <span>CPT</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Crest Silhouette */}
                  <div className="my-3 flex items-center justify-center">
                    <div
                      className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-display text-lg font-bold text-white shadow-inner"
                      style={{
                        borderColor: userClub.primaryColor,
                        backgroundColor: 'rgba(11, 15, 23, 0.78)',
                      }}
                    >
                      {player.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  </div>

                  {/* Name & Quick Stats */}
                  <div className="border-t border-white/10 pt-2 space-y-1">
                    <div className="text-sm font-bold text-white truncate">{player.name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">{player.nationality}</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {player.goals}G · {player.assists}A
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: OPEN PACKS */}
      {subTab === 'packs' && (
        <div className="space-y-6">
          {/* Pack Opening Stage (when active) */}
          {packStage !== 'idle' && activePack && drawnPlayer && (
            <div className="rounded-2xl border-2 border-[#2E86FF] bg-[#0B0F17] p-6 sm:p-8 text-center space-y-6 relative overflow-hidden">
              {packStage === 'tunnel' && (
                <div className="py-12 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-[#2E86FF]/20 border-2 border-[#2E86FF] flex items-center justify-center">
                    <Zap className="w-10 h-10 text-[#2E86FF]" />
                  </div>
                  <div className="text-xs font-semibold text-[#2E86FF] uppercase tracking-widest">
                    {activePack.name}
                  </div>
                  <h3 className="text-2xl font-bold font-display text-white">
                    Scanning Global & Mtaani Scouting Network...
                  </h3>
                </div>
              )}

              {packStage === 'clue' && (
                <div className="py-10 space-y-4">
                  <div className="text-xs font-semibold text-[#2E86FF] uppercase tracking-widest">
                    Walkout Detected
                  </div>
                  <div className="flex items-center justify-center gap-6 text-white">
                    <div className="px-5 py-3 rounded-xl bg-[#121824] border border-white/15">
                      <div className="text-[11px] text-slate-400">Nation</div>
                      <div className="text-lg font-bold">{drawnPlayer.nationality}</div>
                    </div>
                    <div className="px-5 py-3 rounded-xl bg-[#121824] border border-[#2E86FF]/50">
                      <div className="text-[11px] text-slate-400">Position</div>
                      <div className="text-lg font-bold font-mono text-[#2E86FF]">{drawnPlayer.position}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Revealing eFootball Player Card...</p>
                </div>
              )}

              {packStage === 'revealed' && (
                <div className="space-y-6">
                  <div className="text-xs font-semibold text-[#2E86FF] uppercase tracking-widest">
                    {activePack.name} · Simulated Pack Draw
                  </div>

                  <div className="max-w-xs mx-auto animate-card-reveal">
                    <div
                      className={`rounded-2xl border-2 p-5 text-left space-y-4 shadow-2xl ${
                        getTierStyles(getCardTier(drawnPlayer)).frame
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-5xl font-bold font-display text-[#2E86FF] leading-none tabular-nums">
                            {drawnPlayer.rating}
                          </div>
                          <div className="text-sm font-mono font-bold text-white mt-1">
                            {drawnPlayer.position}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-semibold text-amber-300 uppercase">
                            {getCardTier(drawnPlayer)}
                          </div>
                          <div className="text-slate-400 mt-0.5">{drawnPlayer.nationality}</div>
                        </div>
                      </div>

                      <div className="text-center py-2">
                        <div className="text-2xl font-bold font-display text-white">
                          {drawnPlayer.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Age {drawnPlayer.age} · Est. Value €{drawnPlayer.valueMillions}M
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                        {computeCardAttributes(drawnPlayer).map((attr) => (
                          <div key={attr.label} className="bg-[#0B0F17]/80 rounded-md px-2 py-1.5 flex items-center justify-between text-xs">
                            <span className="text-slate-400">{attr.label}</span>
                            <span className="font-mono font-bold text-white tabular-nums">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#529BFF] italic">
                    {commentator}: &quot;Karibu mtaani {drawnPlayer.name}! Huyu atatikisa uwanja wa {userClub.stadium}!&quot;
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleSignPackPlayer}
                      className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-[#2E86FF] text-white font-semibold text-sm hover:bg-[#529BFF]"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>
                        Sign to Club Squad {activePack.costMillions > 0 ? `(€${activePack.costMillions}M)` : '(Free)'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setPackStage('idle');
                        setDrawnPlayer(null);
                      }}
                      className="px-4 py-3 min-h-[44px] rounded-lg bg-white/10 text-slate-200 text-xs font-medium hover:bg-white/15"
                    >
                      Release Scout Target
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Available Pack Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PACK_DEFINITIONS.map((pack) => {
              const freeUsed =
                pack.costMillions === 0 && lastFreeDrawMatchday === state.currentMatchday;
              const cannotAfford = pack.costMillions > state.finances.transferBudgetMillions;
              return (
                <div
                  key={pack.id}
                  className={`p-6 rounded-xl border flex flex-col justify-between gap-4 ${pack.accentClass}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold text-[#529BFF] uppercase tracking-wider">
                        {pack.tierLabel}
                      </span>
                      <span className="text-xs font-mono text-slate-300">
                        OVR {pack.minOvr}–{pack.maxOvr}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                      {pack.costMillions === 0 ? (
                        <Gift className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-[#2E86FF]" />
                      )}
                      <span>{pack.name}</span>
                    </h3>
                    <p className="text-xs text-slate-300">{pack.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="text-sm font-mono font-bold text-white">
                      {pack.costMillions === 0 ? 'FREE / MD' : `€${pack.costMillions}M`}
                    </div>
                    <button
                      onClick={() => handleOpenPack(pack)}
                      disabled={packStage !== 'idle' || freeUsed || cannotAfford}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg bg-[#2E86FF] text-white text-xs font-semibold hover:bg-[#529BFF] disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
                    >
                      <PackageOpen className="w-4 h-4" />
                      <span>
                        {freeUsed ? 'Used This MD' : cannotAfford ? 'Budget Low' : 'Open Pack'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Player Card Detail Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedCardId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#121824] border border-[#2E86FF]/45 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-[#2E86FF] uppercase tracking-wider">
                  {getCardTier(selectedCard)} · {selectedCard.role}
                </div>
                <h3 className="text-2xl font-bold font-display text-white mt-0.5">
                  {selectedCard.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedCard.nationality} · Age {selectedCard.age} · {selectedCard.position}
                </p>
              </div>
              <button
                onClick={() => setSelectedCardId(null)}
                aria-label="Close card inspector"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* OVR Rating Editor */}
            <div className="p-4 rounded-xl bg-[#0B0F17] border border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400">eFootball Card OVR</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Status:{' '}
                  <span className={selectedCard.ratingSource === 'efootball-verified' ? 'text-[#2E86FF]' : 'text-amber-300'}>
                    {selectedCard.ratingSource === 'efootball-verified' ? 'Verified' : 'Estimated'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={50}
                  max={99}
                  value={selectedCard.rating ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Math.max(50, Math.min(99, Number(e.target.value))) : null;
                    handleUpdateCardOvr(selectedCard.id, val);
                  }}
                  className="w-16 text-center text-2xl font-bold font-display bg-[#121824] border border-[#2E86FF]/50 rounded-lg py-1 text-[#2E86FF]"
                />
              </div>
            </div>

            {/* 6 Attribute Ratings */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#2E86FF]" />
                <span>Card Attribute Ratings</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {computeCardAttributes(selectedCard).map((attr) => (
                  <div key={attr.label} className="p-2.5 rounded-lg bg-[#0B0F17] border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">{attr.label}</span>
                      <span className="font-mono font-bold text-white tabular-nums">{attr.value}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#2E86FF]"
                        style={{ width: `${attr.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Season Stats */}
            <div className="grid grid-cols-4 gap-2 text-center bg-[#0B0F17] border border-white/10 rounded-lg p-3 text-xs">
              <div>
                <div className="text-slate-400">Apps</div>
                <div className="font-mono font-bold text-white mt-0.5">{selectedCard.appearances}</div>
              </div>
              <div>
                <div className="text-slate-400">Goals</div>
                <div className="font-mono font-bold text-[#2E86FF] mt-0.5">{selectedCard.goals}</div>
              </div>
              <div>
                <div className="text-slate-400">Assists</div>
                <div className="font-mono font-bold text-white mt-0.5">{selectedCard.assists}</div>
              </div>
              <div>
                <div className="text-slate-400">Value</div>
                <div className="font-mono font-bold text-emerald-400 mt-0.5">€{selectedCard.valueMillions}M</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleTrainingBoost(selectedCard.id)}
                disabled={lastTrainedMatchday === state.currentMatchday}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#2E86FF] text-white text-xs font-semibold hover:bg-[#529BFF] disabled:opacity-45"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {lastTrainedMatchday === state.currentMatchday ? 'Trained This MD' : 'Training Camp (+1 OVR Sim)'}
                </span>
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    tactics: { ...prev.tactics, captainId: selectedCard.id },
                  }))
                }
                className="inline-flex items-center gap-1.5 py-2.5 px-3 rounded-lg bg-white/10 text-slate-200 text-xs font-medium hover:bg-white/15"
              >
                {state.tactics.captainId === selectedCard.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Captain</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Make Captain</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

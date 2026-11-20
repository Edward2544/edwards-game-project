import React, { useState } from 'react';
import { ArrowRightLeft, DollarSign, Sparkles, Lock } from 'lucide-react';
import {
  Player,
  TransferHistoryEntry,
  TransferNegotiation,
  TransferTarget,
  UniverseState,
} from '../types/universe';
import { aiService } from '../services/aiService';

interface TransfersFinancesViewProps {
  state: UniverseState;
  onUpdateState: (updater: (prev: UniverseState) => UniverseState) => void;
}

export const TransfersFinancesView: React.FC<TransfersFinancesViewProps> = ({
  state,
  onUpdateState,
}) => {
  const [subTab, setSubTab] = useState<'market' | 'negotiations' | 'finances'>('market');
  const [filterPos, setFilterPos] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD' | 'FREE'>('ALL');
  const [bidScope, setBidScope] = useState<'simulated-universe' | 'efootball-ingame'>('simulated-universe');
  const [loadingNegId, setLoadingNegId] = useState<string | null>(null);
  const [negError, setNegError] = useState<string | null>(null);

  const userClub = state.userClub!;
  const netSpend = Math.round((state.finances.transferSpendingMillions - state.finances.transferIncomeMillions) * 10) / 10;

  const filteredTargets = state.transferTargets.filter((t) => {
    if (filterPos === 'ALL') return true;
    if (filterPos === 'FREE') return t.availability === 'Free Agent';
    return t.group === filterPos;
  });

  const startNegotiation = (target: TransferTarget) => {
    if (!state.transferWindowOpen) return;
    if (state.transferWindowSigningsCount >= state.maxWindowSignings) return;
    if (state.negotiations.some((n) => n.playerName === target.name && n.status === 'active')) {
      setSubTab('negotiations');
      return;
    }

    const neg: TransferNegotiation = {
      id: `neg-${Date.now()}`,
      direction: target.availability === 'Loan Listed' ? 'loan' : 'incoming-signing',
      playerName: target.name,
      position: target.position,
      otherClubName: target.currentClub,
      askingOrOfferMillions: target.valueMillions,
      currentBidMillions: target.availability === 'Free Agent' ? 0 : Math.round(target.valueMillions * 0.92),
      proposedWageThousands: target.wageThousands,
      contractYears: 4,
      round: 1,
      status: 'active',
      executionScope: bidScope,
      lastMessage:
        target.availability === 'Free Agent'
          ? `Free agent contract talks opened with ${target.name}'s representatives.`
          : `Opening approach prepared for ${target.name} (${target.currentClub}). Adjust fee and submit offer.`,
    };

    onUpdateState((prev) => ({
      ...prev,
      negotiations: [neg, ...prev.negotiations],
    }));
    setSubTab('negotiations');
  };

  const submitOfferToClub = async (neg: TransferNegotiation, useAi: boolean) => {
    setNegError(null);
    setLoadingNegId(neg.id);
    try {
      let decision: 'accepted' | 'counter' | 'rejected' = 'counter';
      let counterFee = neg.askingOrOfferMillions;
      let counterWage = neg.proposedWageThousands;
      let msg = '';

      if (useAi) {
        const res = await aiService.evaluateNegotiation({
          clubName: userClub.name,
          playerName: neg.playerName,
          position: neg.position,
          askingValue: neg.askingOrOfferMillions,
          offeredFee: neg.currentBidMillions,
          offeredWage: neg.proposedWageThousands,
          negotiationType: neg.direction,
          round: neg.round,
        });
        decision = res.decision;
        counterFee = res.counterFee;
        counterWage = res.counterWage;
        msg = res.directorMessage;
      } else {
        // Deterministic realistic evaluation
        const ratio = neg.askingOrOfferMillions === 0 ? 1 : neg.currentBidMillions / neg.askingOrOfferMillions;
        if (ratio >= 0.95) {
          decision = 'accepted';
          msg = `${neg.otherClubName} Sporting Director: "Terms agreed at €${neg.currentBidMillions}M. Awaiting your final signature."`;
        } else if (ratio >= 0.78) {
          decision = 'counter';
          counterFee = Math.round((neg.askingOrOfferMillions + neg.currentBidMillions) / 2);
          msg = `${neg.otherClubName} Sporting Director: "We value ${neg.playerName} higher. Meet us at €${counterFee}M."`;
        } else {
          decision = 'rejected';
          msg = `${neg.otherClubName} Sporting Director: "€${neg.currentBidMillions}M is well below our valuation. Talks ended."`;
        }
      }

      onUpdateState((prev) => ({
        ...prev,
        negotiations: prev.negotiations.map((n) =>
          n.id !== neg.id
            ? n
            : {
                ...n,
                round: n.round + 1,
                status:
                  decision === 'accepted'
                    ? 'agreed-pending-user'
                    : decision === 'rejected'
                    ? 'rejected'
                    : 'active',
                askingOrOfferMillions: decision === 'counter' ? counterFee : n.askingOrOfferMillions,
                proposedWageThousands: decision === 'counter' && counterWage ? counterWage : n.proposedWageThousands,
                lastMessage: msg,
              }
        ),
      }));
    } catch (err: unknown) {
      setNegError(err instanceof Error ? err.message : 'Negotiation request failed.');
    } finally {
      setLoadingNegId(null);
    }
  };

  const finalizeAgreedTransfer = (neg: TransferNegotiation) => {
    onUpdateState((prev) => {
      if (neg.direction === 'incoming-signing' || neg.direction === 'loan') {
        if (neg.currentBidMillions > prev.finances.transferBudgetMillions) {
          return prev;
        }
        const targetInfo = prev.transferTargets.find((t) => t.name === neg.playerName);
        const newPlayer: Player = {
          id: `signed-${Date.now()}`,
          name: neg.playerName,
          nationality: targetInfo?.nationality || 'International',
          position: neg.position,
          group: targetInfo?.group || 'MID',
          age: targetInfo?.age || 24,
          rating: targetInfo?.estimatedRating || null,
          ratingSource: neg.executionScope === 'efootball-ingame' ? 'efootball-verified' : 'estimated',
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
          valueMillions: targetInfo?.valueMillions || neg.currentBidMillions,
          wageThousands: neg.proposedWageThousands,
          contractYears: neg.contractYears,
          status: 'Fit',
          role: 'Starter',
          isYouthProspect: (targetInfo?.age ?? 25) <= 21,
        };

        const hist: TransferHistoryEntry = {
          id: `th-${Date.now()}`,
          seasonLabel: prev.seasonLabel,
          matchday: prev.currentMatchday,
          direction: neg.currentBidMillions === 0 ? 'FREE' : neg.direction === 'loan' ? 'LOAN IN' : 'IN',
          playerName: neg.playerName,
          position: neg.position,
          counterpartyClub: neg.otherClubName,
          feeMillions: neg.currentBidMillions,
          wageThousands: neg.proposedWageThousands,
          contractYears: neg.contractYears,
          executionScope: neg.executionScope,
        };

        return {
          ...prev,
          transferWindowSigningsCount: prev.transferWindowSigningsCount + 1,
          squad: [...prev.squad, newPlayer],
          transferTargets: prev.transferTargets.filter((t) => t.name !== neg.playerName),
          negotiations: prev.negotiations.map((n) => (n.id === neg.id ? { ...n, status: 'completed' } : n)),
          transferHistory: [hist, ...prev.transferHistory],
          finances: {
            ...prev.finances,
            transferBudgetMillions: Math.round((prev.finances.transferBudgetMillions - neg.currentBidMillions) * 10) / 10,
            transferSpendingMillions: Math.round((prev.finances.transferSpendingMillions + neg.currentBidMillions) * 10) / 10,
            currentWageBillWeeklyThousands: prev.finances.currentWageBillWeeklyThousands + neg.proposedWageThousands,
          },
          ledger: [
            {
              id: `led-tr-${Date.now()}`,
              matchday: prev.currentMatchday,
              label: `Signed ${neg.playerName} from ${neg.otherClubName}`,
              category: 'Transfer',
              amountMillions: -neg.currentBidMillions,
              isSimulated: true,
            },
            ...prev.ledger,
          ],
          news: [
            {
              id: `news-tr-${Date.now()}`,
              matchday: prev.currentMatchday,
              category: 'Transfer Rumor',
              headline: `OFFICIAL: ${prev.userClub?.name} complete signing of ${neg.playerName} (€${neg.currentBidMillions}M)`,
              summary: `Simulated Universe Media: Registered as ${
                neg.executionScope === 'efootball-ingame' ? 'In-Game eFootball Transfer' : 'Simulated Universe Transfer'
              }.`,
              shengTake: `Buda Kamau: "Wasee! Usajili mpya umetua—${neg.playerName} ameingia kikosini!"`,
              isSimulated: true,
            },
            ...prev.news,
          ],
        };
      } else {
        // Outgoing sale
        const soldPlayer = prev.squad.find((p) => p.name === neg.playerName);
        const hist: TransferHistoryEntry = {
          id: `th-${Date.now()}`,
          seasonLabel: prev.seasonLabel,
          matchday: prev.currentMatchday,
          direction: 'OUT',
          playerName: neg.playerName,
          position: neg.position,
          counterpartyClub: neg.otherClubName,
          feeMillions: neg.currentBidMillions,
          wageThousands: neg.proposedWageThousands,
          contractYears: neg.contractYears,
          executionScope: neg.executionScope,
        };

        return {
          ...prev,
          squad: prev.squad.filter((p) => p.name !== neg.playerName),
          negotiations: prev.negotiations.map((n) => (n.id === neg.id ? { ...n, status: 'completed' } : n)),
          transferHistory: [hist, ...prev.transferHistory],
          finances: {
            ...prev.finances,
            transferBudgetMillions: Math.round((prev.finances.transferBudgetMillions + neg.currentBidMillions) * 10) / 10,
            transferIncomeMillions: Math.round((prev.finances.transferIncomeMillions + neg.currentBidMillions) * 10) / 10,
            currentWageBillWeeklyThousands: Math.max(
              0,
              prev.finances.currentWageBillWeeklyThousands - (soldPlayer?.wageThousands ?? 0)
            ),
          },
          ledger: [
            {
              id: `led-sale-${Date.now()}`,
              matchday: prev.currentMatchday,
              label: `Sold ${neg.playerName} to ${neg.otherClubName}`,
              category: 'Transfer',
              amountMillions: neg.currentBidMillions,
              isSimulated: true,
            },
            ...prev.ledger,
          ],
        };
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Budget Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">Transfer Market & Club Finances</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulated financial ecosystem · Clearly separated from real eFootball GP/Coins.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#121824] border border-white/10 rounded-lg">
          {[
            { id: 'market', label: 'Scouting & Targets' },
            { id: 'negotiations', label: `Negotiations (${state.negotiations.filter((n) => n.status === 'active' || n.status === 'agreed-pending-user').length})` },
            { id: 'finances', label: 'Financial Ledger' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as 'market' | 'negotiations' | 'finances')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === t.id ? 'bg-emerald-400 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4-column financial strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Transfer Budget (Sim)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
            €{state.finances.transferBudgetMillions}M
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Net Transfer Spend</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">
            €{netSpend}M
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            In: €{state.finances.transferIncomeMillions}M · Out: €{state.finances.transferSpendingMillions}M
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Weekly Wage Bill (Sim)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">
            €{state.finances.currentWageBillWeeklyThousands}K
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Cap: €{state.finances.wageBudgetWeeklyThousands}K/wk
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#121824] border border-white/10">
          <div className="text-xs text-slate-400">Window Rule</div>
          <div className={`text-lg font-bold mt-1 ${state.transferWindowOpen ? 'text-emerald-400' : 'text-amber-300'}`}>
            {state.transferWindowOpen ? 'WINDOW OPEN' : 'WINDOW CLOSED'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Signings: {state.transferWindowSigningsCount}/{state.maxWindowSignings} max
          </div>
        </div>
      </div>

      {!state.transferWindowOpen && subTab === 'market' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 text-xs text-amber-200">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            The transfer window is currently CLOSED (Open during Pre-Season, MD 1–3, and Mid-Season MD 9–11). You can scout targets and prepare for the next window.
          </span>
        </div>
      )}

      {subTab === 'market' && (
        <div className="rounded-xl bg-[#121824] border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-white/10 rounded-lg">
              {(['ALL', 'GK', 'DEF', 'MID', 'FWD', 'FREE'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterPos(f)}
                  className={`px-3 py-1 text-xs rounded ${
                    filterPos === f ? 'bg-emerald-400 text-slate-950 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Track deals as:</span>
              <select
                value={bidScope}
                onChange={(e) => setBidScope(e.target.value as 'simulated-universe' | 'efootball-ingame')}
                className="px-2.5 py-1.5 bg-[#0B0F17] border border-white/15 rounded text-slate-200"
              >
                <option value="simulated-universe">Simulated Career-Universe Transfer</option>
                <option value="efootball-ingame">Actual In-Game eFootball Transfer</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredTargets.map((t) => (
              <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono text-emerald-400">{t.position}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t.currentClub}</span>
                    <span aria-hidden="true">·</span>
                    <span>Age {t.age}</span>
                    <span aria-hidden="true">·</span>
                    <span>Est. OVR {t.estimatedRating}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300">{t.availability}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <p className="text-xs text-slate-400">{t.scoutingNote}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-sm font-bold text-white">
                      {t.valueMillions === 0 ? 'Free' : `€${t.valueMillions}M`}
                    </div>
                    <div className="text-[11px] text-slate-400">€{t.wageThousands}K/wk</div>
                  </div>
                  <button
                    onClick={() => startNegotiation(t)}
                    disabled={!state.transferWindowOpen || state.transferWindowSigningsCount >= state.maxWindowSignings}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    Open Talks
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'negotiations' && (
        <div className="space-y-4">
          {negError && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
              {negError}
            </div>
          )}

          {state.negotiations.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#121824] border border-white/10 text-center text-xs text-slate-400">
              No active transfer negotiations. Open talks on a target or transfer-list a squad player to attract offers.
            </div>
          ) : (
            state.negotiations.map((neg) => (
              <div key={neg.id} className="p-5 rounded-xl bg-[#121824] border border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-400">
                      {neg.direction === 'outgoing-sale' ? 'Incoming Offer for Your Player' : 'Club Signing Talks'} ·{' '}
                      {neg.executionScope === 'efootball-ingame' ? 'In-Game eFootball' : 'Simulated Universe'} · Round {neg.round}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {neg.playerName} ({neg.position}) — {neg.otherClubName}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      neg.status === 'agreed-pending-user' || neg.status === 'completed'
                        ? 'text-emerald-400'
                        : neg.status === 'rejected'
                        ? 'text-rose-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {neg.status.toUpperCase().replace(/-/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-300 italic">{neg.lastMessage}</p>

                {neg.status === 'active' && (
                  <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-white/10">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Proposed Fee (€M)</label>
                      <input
                        type="number"
                        min={0}
                        value={neg.currentBidMillions}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            negotiations: prev.negotiations.map((n) =>
                              n.id === neg.id ? { ...n, currentBidMillions: Math.max(0, Number(e.target.value)) } : n
                            ),
                          }))
                        }
                        className="w-24 px-2.5 py-1.5 text-xs font-mono bg-[#0B0F17] border border-white/15 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Weekly Wage (€K)</label>
                      <input
                        type="number"
                        min={10}
                        value={neg.proposedWageThousands}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            negotiations: prev.negotiations.map((n) =>
                              n.id === neg.id ? { ...n, proposedWageThousands: Math.max(10, Number(e.target.value)) } : n
                            ),
                          }))
                        }
                        className="w-24 px-2.5 py-1.5 text-xs font-mono bg-[#0B0F17] border border-white/15 rounded text-white"
                      />
                    </div>
                    {neg.direction === 'outgoing-sale' ? (
                      <>
                        <button
                          onClick={() => finalizeAgreedTransfer(neg)}
                          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300"
                        >
                          Accept €{neg.currentBidMillions}M Offer
                        </button>
                        <button
                          onClick={() =>
                            onUpdateState((prev) => ({
                              ...prev,
                              negotiations: prev.negotiations.map((n) =>
                                n.id === neg.id ? { ...n, status: 'rejected', lastMessage: 'You rejected the offer.' } : n
                              ),
                            }))
                          }
                          className="px-4 py-2 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg"
                        >
                          Reject Offer
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => submitOfferToClub(neg, false)}
                          disabled={loadingNegId === neg.id}
                          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300"
                        >
                          Submit Offer
                        </button>
                        <button
                          onClick={() => submitOfferToClub(neg, true)}
                          disabled={loadingNegId === neg.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{loadingNegId === neg.id ? 'Negotiating...' : 'AI Sporting Director Counter'}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {neg.status === 'agreed-pending-user' && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-300">
                      Agreed Fee: €{neg.currentBidMillions}M · Wage: €{neg.proposedWageThousands}K/wk
                    </span>
                    <button
                      onClick={() => finalizeAgreedTransfer(neg)}
                      disabled={neg.currentBidMillions > state.finances.transferBudgetMillions}
                      className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 disabled:opacity-40"
                    >
                      {neg.currentBidMillions > state.finances.transferBudgetMillions
                        ? 'Insufficient Budget'
                        : 'Confirm & Sign Player'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {subTab === 'finances' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-xl bg-[#121824] border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Simulated Club Financial Ledger</span>
              </h3>
            </div>
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {state.ledger.map((l) => (
                <div key={l.id} className="px-5 py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-white font-medium">{l.label}</div>
                    <div className="text-slate-400">MD {l.matchday} · {l.category}</div>
                  </div>
                  <div className={`font-mono tabular-nums font-semibold ${l.amountMillions >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {l.amountMillions >= 0 ? `+€${l.amountMillions}M` : `-€${Math.abs(l.amountMillions)}M`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-xl bg-[#121824] border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <span>Transfer History</span>
              </h3>
            </div>
            {state.transferHistory.length === 0 ? (
              <div className="p-6 text-xs text-slate-400">No transfers completed yet this career.</div>
            ) : (
              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                {state.transferHistory.map((th) => (
                  <div key={th.id} className="px-5 py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-white font-medium">
                        <span className="font-mono text-emerald-400 mr-1.5">[{th.direction}]</span>
                        {th.playerName} ({th.position})
                      </div>
                      <div className="text-slate-400">
                        {th.seasonLabel} MD {th.matchday} · {th.counterpartyClub} ·{' '}
                        {th.executionScope === 'efootball-ingame' ? 'eFootball In-Game' : 'Simulated Universe'}
                      </div>
                    </div>
                    <div className="font-mono tabular-nums text-white">€{th.feeMillions}M</div>
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

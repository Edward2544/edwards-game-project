import React, { useState } from 'react';
import { Gamepad2, X, Sparkles, Mic, Shield, Target } from 'lucide-react';
import { Fixture, UniverseState } from '../types/universe';
import { computeLeagueTable, getCommentatorName } from '../engine/simulator';
import { aiService, AiBriefingResponse } from '../services/aiService';

interface MatchdayBriefingModalProps {
  state: UniverseState;
  fixture: Fixture;
  onClose: () => void;
  onOpenReportMatch: () => void;
  onPlay3DMatch: () => void;
}

export const MatchdayBriefingModal: React.FC<MatchdayBriefingModalProps> = ({
  state,
  fixture,
  onClose,
  onOpenReportMatch,
  onPlay3DMatch,
}) => {
  const userClub = state.userClub!;
  const isUserHome = fixture.homeClubId === userClub.id;
  const opponentId = isUserHome ? fixture.awayClubId : fixture.homeClubId;
  const opponentName = isUserHome ? fixture.awayClubName : fixture.homeClubName;
  const opponentClub = state.clubs.find((c) => c.id === opponentId);

  const leagueComp = state.competitions.find((c) => c.type === 'league');
  const table = leagueComp ? computeLeagueTable(state.fixtures, state.clubs, leagueComp.id) : [];
  const oppRow = table.find((r) => r.clubId === opponentId);
  const userRow = table.find((r) => r.clubId === userClub.id);

  const rivalry = state.rivalries.find((r) => r.rivalClubId === opponentId);
  const previousMeetings = state.fixtures.filter(
    (f) =>
      f.status === 'played' &&
      ((f.homeClubId === userClub.id && f.awayClubId === opponentId) ||
        (f.homeClubId === opponentId && f.awayClubId === userClub.id))
  );

  const [aiBriefing, setAiBriefing] = useState<AiBriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commentatorName = getCommentatorName(state.activeCommentator);
  const startingXiNames = state.tactics.startingXiIds
    .map((id) => state.squad.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const defaultShengHype = rivalry
    ? `${commentatorName}: "Wasee wa mtaani, leo ni DERBY dhidi ya ${opponentName}! Hakuna kulala—tunataka ushindi na heshima mtaani!"`
    : `${commentatorName}: "Mpira ni dakika tisini! ${userClub.shortName} vs ${opponentName}—panga kikosi safi halafu tulete pointi nyumbani!"`;

  const handleGenerateAi = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiService.generateBriefing({
        clubName: userClub.name,
        opponentName,
        competition: fixture.competitionName,
        matchday: fixture.roundLabel,
        venue: isUserHome ? `Home (${fixture.stadium})` : `Away (${fixture.stadium})`,
        opponentForm: oppRow?.form.join('-') || 'Opening phase',
        tacticalIdentity: userClub.tacticalIdentity,
        formation: state.tactics.formation,
        isRivalry: Boolean(rivalry),
        rivalryName: rivalry?.rivalryTitle,
        userForm: userRow?.form.join('-') || 'Opening phase',
        commentatorName,
      });
      setAiBriefing(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to fetch AI briefing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl bg-[#121824] border border-white/15 overflow-hidden my-8">
        {/* Broadcast Hero Header */}
        <div className="relative h-48">
          <img
            src="/src/assets/images/matchday_floodlights_1795179830584.jpg"
            alt="Evening stadium floodlights before kickoff"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121824] via-[#0B0F17]/70 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Close briefing"
            className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 text-slate-200 hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-medium mb-1">
              <span>{fixture.competitionName}</span>
              <span aria-hidden="true">·</span>
              <span>{fixture.roundLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{isUserHome ? 'Home' : 'Away'} at {fixture.stadium}</span>
              {rivalry && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-400 font-semibold">{rivalry.rivalryTitle}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-white">
              {fixture.homeClubName} vs {fixture.awayClubName}
            </h2>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Sheng Pre-Match Hype */}
          <div className="p-4 rounded-lg bg-[#0B0F17] border border-emerald-500/25">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <Mic className="w-3.5 h-3.5" />
              <span>Mtaani Sheng & Swahili Broadcast Booth</span>
            </div>
            <p className="text-sm text-slate-200 italic">
              {aiBriefing?.shengPreMatchHype || defaultShengHype}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
              {error}
            </div>
          )}

          {/* Core Scouting Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Broadcast Preview</div>
                <p className="text-slate-200 leading-relaxed">
                  {aiBriefing?.broadcastIntro ||
                    `${userClub.name} prepare to face ${opponentName} in ${fixture.competitionName}. ${
                      rivalry
                        ? 'With fierce local pride at stake, intensity from the opening whistle is guaranteed.'
                        : 'Both sides enter looking to impose their tactical blueprint early.'
                    }`}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Opponent Form & Profile</div>
                <p className="text-slate-300">
                  Recent Form: <span className="font-mono text-white">{oppRow?.form.join(' ') || 'Early season'}</span>
                  {' · '}
                  Identity: {opponentClub?.tacticalIdentity || 'Balanced Top-Flight System'}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Opponent Strengths</div>
                <p className="text-slate-300">
                  {aiBriefing?.opponentStrengths ||
                    `Key threats: ${(opponentClub?.keyPlayerNames || ['Core Starters']).join(', ')}. Reputation ${opponentClub?.reputation ?? 80}/100.`}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Opponent Weaknesses</div>
                <p className="text-slate-300">
                  {aiBriefing?.opponentWeaknesses ||
                    (opponentClub?.weakPositions.join(', ') || 'Transition spaces behind pushed-up fullbacks.')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Tactical Recommendations</div>
                <p className="text-slate-200 leading-relaxed">
                  {aiBriefing?.tacticalRecommendation ||
                    `Stick with your ${state.tactics.formation} (${state.tactics.attackingStrategy}) and keep "${state.tactics.defensiveLine}" defensive line discipline during early opponent surges.`}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Match Objective</span>
                </div>
                <p className="text-emerald-300 font-medium">
                  {aiBriefing?.matchObjective ||
                    (fixture.competitionType === 'league'
                      ? isUserHome
                        ? 'Secure all 3 points in front of home supporters.'
                        : 'Stay compact away from home and target at least 1–3 points.'
                      : 'Advance to the next knockout round.')}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expected Starting XI ({state.tactics.formation})</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {startingXiNames.join(' · ') || 'Configure lineup in Tactics'}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Previous Meetings</div>
                <p className="text-xs text-slate-400">
                  {previousMeetings.length > 0
                    ? previousMeetings
                        .map((m) => `${m.roundLabel}: ${m.homeClubName} ${m.homeScore}-${m.awayScore} ${m.awayClubName}`)
                        .join(' · ')
                    : 'First recorded meeting in this career universe.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#0B0F17] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleGenerateAi}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{loading ? 'Scouting Opponent...' : 'Generate AI Scouting & Sheng Preview'}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onPlay3DMatch}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#2E86FF] rounded-lg hover:bg-[#529BFF] transition-colors whitespace-nowrap shrink-0"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Open Match Screen (3D)</span>
            </button>
            <button
              onClick={onOpenReportMatch}
              className="px-4 py-2.5 text-xs font-medium text-slate-200 bg-white/10 border border-white/10 rounded-lg hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
            >
              Report Played Match Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

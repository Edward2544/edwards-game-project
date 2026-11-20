import React, { useState } from 'react';
import { Mic, Sparkles, X } from 'lucide-react';
import { Fixture, MatchReport, ShengCommentatorId } from '../types/universe';
import { SHENG_COMMENTATORS } from '../engine/simulator';
import { aiService } from '../services/aiService';

interface MatchReportViewProps {
  fixture: Fixture;
  clubName: string;
  activeCommentator: ShengCommentatorId;
  onChangeCommentator: (id: ShengCommentatorId) => void;
  onUpdateReport: (fixtureId: string, updated: MatchReport) => void;
  onClose?: () => void;
}

export const MatchReportView: React.FC<MatchReportViewProps> = ({
  fixture,
  clubName,
  activeCommentator,
  onChangeCommentator,
  onUpdateReport,
  onClose,
}) => {
  const report = fixture.report;
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!report) return null;

  const handleAiEnhance = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const commentator = SHENG_COMMENTATORS.find((c) => c.id === activeCommentator)?.name || 'Buda Kamau';
      const ai = await aiService.generateMatchReport({
        clubName,
        commentatorName: commentator,
        competition: report.competition,
        matchday: report.matchday,
        opponent: report.opponent,
        venue: report.venue,
        finalScore: report.finalScore,
        goals: report.goals,
        assists: report.assists,
        matchStatistics: report.matchStatistics,
        motm: fixture.motmPlayerName,
        memorableMoment: fixture.memorableMoment,
      });

      onUpdateReport(fixture.id, {
        ...report,
        playerPerformance: ai.playerPerformance,
        tacticalAnalysis: ai.tacticalAnalysis,
        mediaReaction: ai.mediaReaction,
        fanReaction: ai.fanReaction,
        managersVerdict: ai.managersVerdict,
        shengCommentary: ai.shengCommentary,
        shengCommentatorName: commentator,
        isAiEnhanced: true,
      });
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to enhance match report.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="rounded-xl bg-[#121824] border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-[#0B0F17] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-400 tracking-wide">
            MATCH REPORT · {report.competition} · {report.matchday}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-white mt-0.5">
            {report.finalScore}
          </h2>
          <div className="text-xs text-slate-400 mt-1">
            Opponent: {report.opponent} · Venue: {report.venue}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeCommentator}
            onChange={(e) => onChangeCommentator(e.target.value as ShengCommentatorId)}
            className="px-3 py-2 text-xs bg-[#121824] border border-white/15 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-400"
          >
            {SHENG_COMMENTATORS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAiEnhance}
            disabled={loadingAi}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loadingAi ? 'Writing Report...' : 'AI Press & Sheng Commentary'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close match report"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {aiError && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
            {aiError}
          </div>
        )}

        {/* Kenyan Sheng / Swahili Broadcast Commentary Booth */}
        <div className="p-5 rounded-xl bg-[#0B0F17] border border-emerald-500/25 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Mic className="w-4 h-4" />
            <span>SHENG & SWAHILI COMMENTARY · {report.shengCommentatorName}</span>
          </div>
          <div className="space-y-2">
            {report.shengCommentary.map((line, idx) => (
              <p key={idx} className="text-sm text-slate-200 leading-relaxed italic">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Goals, Assists, Match Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-white/10 text-sm">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">GOALS</div>
            <ul className="space-y-1 text-slate-200">
              {report.goals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">ASSISTS</div>
            <ul className="space-y-1 text-slate-200">
              {report.assists.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">MATCH STATISTICS</div>
            <ul className="space-y-1 text-slate-300 font-mono text-xs tabular-nums">
              {report.matchStatistics.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Performance, Tactical Analysis, Media & Fan Reaction, Manager's Verdict */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">PLAYER PERFORMANCE</div>
              <p className="text-slate-200 leading-relaxed">{report.playerPerformance}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">TACTICAL ANALYSIS</div>
              <p className="text-slate-300 leading-relaxed">{report.tacticalAnalysis}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">MANAGER’S VERDICT</div>
              <p className="text-emerald-300 leading-relaxed">{report.managersVerdict}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">MEDIA REACTION</div>
              <ul className="space-y-1.5 text-slate-300">
                {report.mediaReaction.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">FAN REACTION</div>
              <p className="text-slate-300 leading-relaxed">{report.fanReaction}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">UPDATED RECORDS</div>
              <ul className="space-y-1 text-xs font-mono text-slate-200 tabular-nums">
                {report.updatedRecords.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-slate-400 font-semibold">NEXT MATCH:</strong> {report.nextMatch}
          </span>
        </div>
      </div>
    </div>
  );
};

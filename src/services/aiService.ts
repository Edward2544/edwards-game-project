export interface AiOpeningResponse {
  documentaryLead: string;
  seasonAtmosphere: string;
  headlines: string[];
  shengIntro: string;
  openingQuestion: string;
}

export interface AiBriefingResponse {
  broadcastIntro: string;
  opponentStrengths: string;
  opponentWeaknesses: string;
  tacticalRecommendation: string;
  matchObjective: string;
  shengPreMatchHype: string;
}

export interface AiMatchReportResponse {
  playerPerformance: string;
  tacticalAnalysis: string;
  mediaReaction: string[];
  fanReaction: string;
  managersVerdict: string;
  shengCommentary: string[];
}

export interface AiNegotiationResponse {
  decision: 'accepted' | 'counter' | 'rejected';
  counterFee: number;
  counterWage: number;
  directorMessage: string;
}

export interface AiPressConferenceResponse {
  journalistIntro: string;
  questions: {
    reporter: string;
    question: string;
    options: {
      tone: string;
      statement: string;
      headlineImpact: string;
    }[];
  }[];
}

export interface AiSeasonReviewResponse {
  seasonHeadline: string;
  narrativeSummary: string;
  tacticalEvolution: string;
  boardVerdict: string;
  nextSeasonOutlook: string;
  shengSeasonVerdict: string;
}

async function postAi<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'AI generation request failed.');
  }
  return data as T;
}

export const aiService = {
  generateOpening: (seasonLabel: string, leagues: { name: string; clubs: string[] }[]) =>
    postAi<AiOpeningResponse>('/api/ai/opening', { seasonLabel, leagues }),

  generateBriefing: (payload: {
    clubName: string;
    opponentName: string;
    competition: string;
    matchday: string;
    venue: string;
    opponentForm: string;
    tacticalIdentity: string;
    formation: string;
    isRivalry: boolean;
    rivalryName?: string;
    userForm: string;
    commentatorName?: string;
  }) => postAi<AiBriefingResponse>('/api/ai/briefing', payload),

  generateMatchReport: (payload: unknown) =>
    postAi<AiMatchReportResponse>('/api/ai/match-report', payload),

  evaluateNegotiation: (payload: {
    clubName: string;
    playerName: string;
    position: string;
    askingValue: number;
    offeredFee: number;
    offeredWage: number;
    negotiationType: string;
    round: number;
  }) => postAi<AiNegotiationResponse>('/api/ai/negotiation', payload),

  generatePressConference: (payload: {
    clubName: string;
    managerName: string;
    leaguePosition: number;
    recentForm: string;
    nextOpponent: string;
    lastHeadline: string;
  }) => postAi<AiPressConferenceResponse>('/api/ai/press-conference', payload),

  generateSeasonReview: (payload: unknown) =>
    postAi<AiSeasonReviewResponse>('/api/ai/season-review', payload),
};

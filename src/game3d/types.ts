import { ShengCommentatorId } from '../types/universe';
import { UserMatchResultInput } from '../engine/simulator';

export type Match3DCameraMode = 'broadcast' | 'follow' | 'vertical';

export interface Match3DRosterMember {
  id?: string;
  name: string;
  position: string;
  rating: number;
}

export interface Match3DConfig {
  fixtureId: string;
  competitionName: string;
  roundLabel: string;
  stadium: string;
  homeClubName: string;
  homeShortName: string;
  homePrimaryColor: string;
  awayClubName: string;
  awayShortName: string;
  awayPrimaryColor: string;
  isUserHome: boolean;
  isKnockout: boolean;
  commentatorId: ShengCommentatorId;
  halfDurationSeconds: number; // e.g., 90s per half = 3-min quick match
  userRoster: Match3DRosterMember[]; // 6 players (1 GK + 5 outfield)
  opponentRoster: Match3DRosterMember[];
}

export interface Match3DCommentaryEvent {
  id: string;
  minute: number;
  speaker: string;
  text: string;
  tone: 'goal' | 'save' | 'woodwork' | 'card' | 'whistle' | 'normal';
}

export interface Match3DHudSnapshot {
  homeScore: number;
  awayScore: number;
  matchMinute: number;
  phase: 'kickoff' | 'first-half' | 'halftime' | 'second-half' | 'goal-celebration' | 'fulltime';
  possessionUserPercent: number;
  userShots: number;
  userShotsOnTarget: number;
  opponentShots: number;
  opponentShotsOnTarget: number;
  corners: number;
  activePlayerName: string;
  activePlayerStamina: number; // 0-100
  userHasBall: boolean;
  shotCharge: number; // 0-1
  isPaused: boolean;
  cameraMode: Match3DCameraMode;
  goalBanner?: {
    scorerName: string;
    assistName?: string;
    teamName: string;
    minute: number;
    isUserGoal: boolean;
  };
}

export interface Match3DCompletionPayload {
  fixtureId: string;
  resultInput: UserMatchResultInput;
  summaryHighlights: string[];
}

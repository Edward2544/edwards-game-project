export type UniversePhase =
  | 'opening'
  | 'club-selection'
  | 'manager-setup'
  | 'pre-season'
  | 'active'
  | 'season-end'
  | 'off-season';

export type ShengCommentatorId = 'buda-kamau' | 'shiro-tactical' | 'dj-mzito';

export interface ShengCommentatorPersona {
  id: ShengCommentatorId;
  name: string;
  role: string;
  styleNote: string;
}

export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD';

export type PlayerPosition =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'DMF'
  | 'CMF'
  | 'AMF'
  | 'LMF'
  | 'RMF'
  | 'LWF'
  | 'RWF'
  | 'SS'
  | 'CF';

export type SquadRole =
  | 'Key Player'
  | 'Starter'
  | 'Rotation'
  | 'Prospect'
  | 'Backup'
  | 'Transfer-Listed';

export type PlayerStatus = 'Fit' | 'Injured' | 'Suspended';

export type RatingSource = 'efootball-verified' | 'estimated' | 'unrated';

export type FormLevel = 'Excellent' | 'Good' | 'Steady' | 'Dipping' | 'Poor';

export interface DevelopmentTarget {
  minutesTarget: number;
  goalsTarget: number;
  assistsTarget: number;
  startsTarget: number;
  milestones: string[];
  narrativeProgress: string;
}

export interface Player {
  id: string;
  name: string;
  nationality: string;
  position: PlayerPosition;
  group: PositionGroup;
  age: number;
  rating: number | null;
  ratingSource: RatingSource;
  form: FormLevel;
  goals: number;
  assists: number;
  appearances: number;
  starts: number;
  minutes: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  motmAwards: number;
  ratingsHistory: number[];
  valueMillions: number;
  wageThousands: number;
  contractYears: number;
  status: PlayerStatus;
  injuryReturnMatchday?: number;
  role: SquadRole;
  isYouthProspect: boolean;
  development?: DevelopmentTarget;
}

export interface ClubFinances {
  startingBudgetMillions: number;
  transferBudgetMillions: number;
  wageBudgetWeeklyThousands: number;
  currentWageBillWeeklyThousands: number;
  transferSpendingMillions: number;
  transferIncomeMillions: number;
  prizeMoneyMillions: number;
  sponsorshipIncomeMillions: number;
  matchdayBonusesMillions: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  country: string;
  leagueId: string;
  leagueName: string;
  stadium: string;
  reputation: number; // 1-100 simulated
  history: string;
  tacticalIdentity: string;
  managerialPhilosophy: string;
  objectives: string[];
  boardExpectations: string;
  supportersExpectations: string;
  keyPlayerNames: string[];
  weakPositions: string[];
  mainRivalId: string;
  secondaryRivalIds: string[];
  isSimulatedContext: boolean;
  primaryColor: string;
}

export interface ManagerHistoryEntry {
  seasonLabel: string;
  clubName: string;
  leaguePosition: number;
  trophies: string[];
  record: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  assistsLogged: number;
  grade: SeasonGrade;
  reputationEnd: number;
}

export interface CareerTotals {
  clubsManaged: string[];
  seasonsCompleted: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  trophies: string[];
  careerGoals: number;
  careerAssists: number;
  achievements: string[];
}

export interface ManagerProfile {
  name: string;
  nationality: string;
  age?: number;
  preferredFormation: string;
  playingPhilosophy: string;
  coachingStyle: string;
  careerObjectives: string;
  reputation: number; // 1-100
  boardConfidence: number; // 1-100
  history: ManagerHistoryEntry[];
  careerTotals: CareerTotals;
}

export interface TacticsConfig {
  formation: string;
  startingXiIds: string[];
  benchIds: string[];
  attackingStrategy: string;
  defensiveStrategy: string;
  pressingStyle: string;
  defensiveLine: 'High' | 'Balanced' | 'Deep';
  width: 'Wide' | 'Balanced' | 'Narrow';
  buildUpApproach: string;
  setPieceFocus: string;
  captainId: string;
  viceCaptainId: string;
  opponentNotes: string;
}

export type CompetitionType = 'league' | 'cup' | 'continental' | 'supercup' | 'preseason';

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  format: string;
  rules: string;
  qualificationCriteria: string;
  prizeMoneyChampionMillions: number;
  participatingClubIds: string[];
  currentRoundLabel?: string;
}

export interface MatchEventGoal {
  playerId?: string;
  playerName: string;
  minute?: number;
  assistPlayerId?: string;
  assistPlayerName?: string;
  isGoalOfSeasonCandidate?: boolean;
}

export interface MatchEventCard {
  playerId?: string;
  playerName: string;
  type: 'yellow' | 'red';
  minute?: number;
}

export interface MatchStatsInput {
  possessionPercent?: number;
  shots?: number;
  shotsOnTarget?: number;
  opponentShots?: number;
  opponentShotsOnTarget?: number;
  expectedGoals?: number;
  opponentExpectedGoals?: number;
  corners?: number;
  notes?: string;
}

export interface MatchReport {
  competition: string;
  matchday: string;
  opponent: string;
  venue: string;
  finalScore: string;
  goals: string[];
  assists: string[];
  matchStatistics: string[];
  playerPerformance: string;
  tacticalAnalysis: string;
  mediaReaction: string[];
  fanReaction: string;
  managersVerdict: string;
  shengCommentary: string[];
  shengCommentatorName: string;
  updatedRecords: string[];
  nextMatch: string;
  isAiEnhanced: boolean;
}

export interface Fixture {
  id: string;
  competitionId: string;
  competitionName: string;
  competitionType: CompetitionType;
  matchday: number;
  roundLabel: string;
  homeClubId: string;
  awayClubId: string;
  homeClubName: string;
  awayClubName: string;
  stadium: string;
  isUserMatch: boolean;
  status: 'scheduled' | 'played';
  isSimulatedResult: boolean;
  homeScore?: number;
  awayScore?: number;
  extraTime?: boolean;
  penaltiesWinner?: 'home' | 'away';
  penaltiesScore?: string;
  goals: MatchEventGoal[];
  cards: MatchEventCard[];
  motmPlayerName?: string;
  playerRatings?: Record<string, number>;
  injuriesReported?: { playerName: string; returnMatchdays: number }[];
  stats?: MatchStatsInput;
  memorableMoment?: string;
  report?: MatchReport;
}

export interface LeagueRow {
  clubId: string;
  clubName: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ('W' | 'D' | 'L')[];
}

export interface TransferTarget {
  id: string;
  name: string;
  nationality: string;
  position: PlayerPosition;
  group: PositionGroup;
  age: number;
  estimatedRating: number;
  currentClub: string;
  valueMillions: number;
  wageThousands: number;
  availability: 'Transfer Listed' | 'Available' | 'Free Agent' | 'Loan Listed' | 'Key Target';
  scoutingNote: string;
}

export interface TransferNegotiation {
  id: string;
  direction: 'incoming-signing' | 'outgoing-sale' | 'loan';
  playerName: string;
  position: PlayerPosition;
  otherClubName: string;
  askingOrOfferMillions: number;
  currentBidMillions: number;
  proposedWageThousands: number;
  contractYears: number;
  round: number;
  status: 'active' | 'agreed-pending-user' | 'rejected' | 'completed';
  executionScope: 'efootball-ingame' | 'simulated-universe';
  lastMessage: string;
}

export interface TransferHistoryEntry {
  id: string;
  seasonLabel: string;
  matchday: number;
  direction: 'IN' | 'OUT' | 'LOAN IN' | 'LOAN OUT' | 'FREE';
  playerName: string;
  position: PlayerPosition;
  counterpartyClub: string;
  feeMillions: number;
  wageThousands: number;
  contractYears: number;
  executionScope: 'efootball-ingame' | 'simulated-universe';
}

export interface FinanceLedgerEntry {
  id: string;
  matchday: number;
  label: string;
  category: 'Gate & Bonus' | 'Transfer' | 'Prize Money' | 'Sponsorship' | 'Wages';
  amountMillions: number;
  isSimulated: true;
}

export interface NewsItem {
  id: string;
  matchday: number;
  category: 'Matchday' | 'Transfer Rumor' | 'Rivalry' | 'Board & Press' | 'League Pulse' | 'Mtaani Wire';
  headline: string;
  summary: string;
  shengTake?: string;
  isSimulated: true;
}

export interface RivalryRecord {
  rivalClubId: string;
  rivalClubName: string;
  rivalryTitle: string;
  tier: 'Main Rival' | 'Secondary Rival';
  intensity: number; // 1-100
  rivalManager: string;
  rivalKeyPlayers: string[];
  historySummary: string;
  isSimulatedNarrative: true;
  wins: number;
  draws: number;
  losses: number;
  memorableMatches: string[];
}

export interface SeasonAward {
  title: string;
  winner: string;
  detail: string;
  basis: 'Tracked Stats' | 'Simulated Voting';
}

export type SeasonGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface SeasonRecordSummary {
  seasonLabel: string;
  clubName: string;
  leaguePosition: number;
  leagueChampion: string;
  trophiesWon: string[];
  cupResult: string;
  continentalResult: string;
  topScorer: string;
  topScorersList: string[];
  topAssist: string;
  topAssistsList: string[];
  playerOfSeason: string;
  bestPlayersList: string[];
  biggestDisappointments: string[];
  bestMatches: string[];
  worstMatches: string[];
  transferSummary: string;
  financialSummary: string;
  managerReputationEnd: number;
  clubReputationEnd: number;
  objectivesCompleted: string[];
  objectivesFailed: string[];
  supporterReaction: string;
  mediaReaction: string;
  shengSeasonVerdict: string;
  finalGrade: SeasonGrade;
  gradeJustification: string;
  awards: SeasonAward[];
  finalTable: LeagueRow[];
}

export interface OffSeasonPlan {
  departures: string[];
  rebuildFocus: string[];
  adjustedBudgetMillions: number;
  newObjectives: string[];
  managerEvaluation: string;
  newSeasonExpectations: string;
  newRivalryNote?: string;
  preSeasonOpponentNames: string[];
  windowOpened: boolean;
}

export interface ClubRecords {
  biggestWin: string;
  heaviestDefeat: string;
  longestUnbeatenRun: number;
  currentUnbeatenRun: number;
  seasonTopScorer: string;
  allTimeGoalsLeader: { name: string; goals: number };
}

export interface UniverseState {
  phase: UniversePhase;
  seasonNumber: number;
  seasonLabel: string;
  currentMatchday: number;
  maxLeagueMatchdays: number;
  transferWindowOpen: boolean;
  transferWindowSigningsCount: number;
  maxWindowSignings: number;
  activeCommentator: ShengCommentatorId;
  openingDocNarrative: {
    documentaryLead: string;
    seasonAtmosphere: string;
    headlines: string[];
    shengIntro: string;
    openingQuestion: string;
  };
  manager: ManagerProfile;
  userClub: Club | null;
  clubs: Club[];
  competitions: Competition[];
  fixtures: Fixture[];
  squad: Player[];
  tactics: TacticsConfig;
  finances: ClubFinances;
  ledger: FinanceLedgerEntry[];
  transferTargets: TransferTarget[];
  negotiations: TransferNegotiation[];
  transferHistory: TransferHistoryEntry[];
  news: NewsItem[];
  rivalries: RivalryRecord[];
  records: ClubRecords;
  seasonHistory: SeasonRecordSummary[];
  currentSeasonReview: SeasonRecordSummary | null;
  offSeasonPlan: OffSeasonPlan | null;
  currentSeasonAwards: SeasonAward[];
  goalOfSeasonCandidates: { playerName: string; matchLabel: string; description: string }[];
  lastCompletedFixtureId: string | null;
}

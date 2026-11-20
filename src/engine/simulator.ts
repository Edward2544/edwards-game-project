import {
  Club,
  ClubFinances,
  ClubRecords,
  Competition,
  FinanceLedgerEntry,
  Fixture,
  LeagueRow,
  ManagerProfile,
  MatchEventCard,
  MatchEventGoal,
  MatchReport,
  MatchStatsInput,
  NewsItem,
  OffSeasonPlan,
  Player,
  PlayerPosition,
  PositionGroup,
  RivalryRecord,
  SeasonAward,
  SeasonGrade,
  SeasonRecordSummary,
  ShengCommentatorId,
  ShengCommentatorPersona,
  TacticsConfig,
  UniverseState,
} from '../types/universe';
import {
  buildStarterSquadForClub,
  LEAGUE_PRESETS,
  TRANSFER_MARKET_POOL,
} from '../data/presets';

export const SHENG_COMMENTATORS: ShengCommentatorPersona[] = [
  {
    id: 'buda-kamau',
    name: 'Buda Kamau (Mtaani Pitch-Side)',
    role: 'Play-by-Play Sheng & Swahili',
    styleNote: 'High-energy Nairobi touchline banter, street metaphors, and passionate goal calls.',
  },
  {
    id: 'shiro-tactical',
    name: 'Shiro wa Studio (Tactical Sheng)',
    role: 'Tactical Analysis & Swahili Pundit',
    styleNote: 'Sharp midfield shape breakdowns mixed with clean Nairobi Sheng.',
  },
  {
    id: 'dj-mzito',
    name: 'DJ Mzito (Derby & Vibes)',
    role: 'Hype & Rivalry Commentator',
    styleNote: 'Electric derby atmosphere, crowd chants, and pure East African football energy.',
  },
];

export function getCommentatorName(id: ShengCommentatorId): string {
  return SHENG_COMMENTATORS.find((c) => c.id === id)?.name || SHENG_COMMENTATORS[0].name;
}

export function generateShengMatchLines(params: {
  commentatorId: ShengCommentatorId;
  clubName: string;
  opponentName: string;
  userGoals: number;
  oppGoals: number;
  goals: MatchEventGoal[];
  motm?: string;
  isRivalry?: boolean;
}): string[] {
  const { commentatorId, clubName, opponentName, userGoals, oppGoals, goals, motm, isRivalry } = params;
  const firstScorer = goals[0]?.playerName;
  const won = userGoals > oppGoals;
  const drew = userGoals === oppGoals;

  if (commentatorId === 'shiro-tactical') {
    const line1 = won
      ? `"Wasee, ${clubName} wamecheza ball safi sana leo! Formation ilishikana na ${opponentName} hawakupata pumzi."`
      : drew
      ? `"Game ilikuwa tight mbaya, buda. Midfield ilibaki katikati—pointi moja ni sawa lakini finishing tunahitaji kunoa."`
      : `"Leo mambo ilikuwa ngumu pale nyuma, wasee. ${opponentName} walipata nafasi kati ya mistari, kocha arudi drawing board."`;
    const line2 = firstScorer
      ? `"Kijana ${firstScorer} amefungua nyavu kama mtaalamu—pass ya mwisho ilikuwa na macho!"`
      : `"Dakika tisini za jasho na bidii; vijana walijaribu kufungua defence ya ${opponentName}."`;
    const line3 = motm
      ? `"Man of the Match ni ${motm}—amebeba timu mgongoni leo, heshima kubwa!"`
      : `"Tunaelekea game ijayo tukirekebisha mistakes za leo. Mpira wa mtaani hauishi!"`;
    return [line1, line2, line3];
  }

  if (commentatorId === 'dj-mzito') {
    const line1 = isRivalry
      ? `"Aiiiyaya! Hii derby dhidi ya ${opponentName} imewaka moto kama pasi ya stima! Mashabiki wanapiga shangwe!"`
      : `"Wasee wa mtaani! Karibuni ndani ya uwanja—leo ${clubName} vs ${opponentName} ilikuwa sinema kamili!"`;
    const line2 = won
      ? `"${userGoals}-${oppGoals}! Hii ni noma sana, buda! ${firstScorer ? `${firstScorer} amepiga msumari wa moto!` : 'Vijana wameleta pointi tatu nyumbani!'}"`
      : drew
      ? `"Ngoma imeisha ${userGoals}-${oppGoals}! Hakuna aliyelala, kila mtu alipigania jezi mpaka filimbi ya mwisho!"`
      : `"${userGoals}-${oppGoals}... Aisee, leo bahati haikuwa upande wetu, lakini mtaani hatukati tamaa!"`;
    const line3 = motm
      ? `"Big up kwa ${motm}, kijana amecheza kama staa wa dunia leo!"`
      : `"Washa spika, funga viatu—next matchday tunarudi na hasira zaidi!"`;
    return [line1, line2, line3];
  }

  // Default: Buda Kamau
  const line1 = won
    ? `"Wasee! ${clubName} wamewaka leo—ushindi wa ${userGoals}-${oppGoals} dhidi ya ${opponentName}! Cheza chini, mpira umelala nyavuni!"`
    : drew
    ? `"Buda, mechi imekuwa moto mpaka dakika ya tisini! Sare ya ${userGoals}-${oppGoals} na ${opponentName}—hakuna kupumua!"`
    : `"Ngori kidogo leo mtaani—${opponentName} wametubana ${userGoals}-${oppGoals}, lakini ligi bado ni ndefu sana!"`;
  const line2 = firstScorer
    ? `"Cheki huyo ${firstScorer}! Bao safi kabisa—kipa wa ${opponentName} alibaki tu akiangalia hewa!"`
    : `"Kasi ilikuwa juu sana leo, mashambulizi yalikuwa yanatiririka kama maji."`;
  const line3 = motm
    ? `"Kwa maoni yangu hapa kando ya uwanja, ${motm} ndiye mfalme wa mechi leo. Form ni gani? Form ni moto!"`
    : `"Sasa macho kwa mechi ijayo—wasee wa ${clubName} wameahidi kupambana tena!"`;
  return [line1, line2, line3];
}

export interface UserMatchResultInput {
  homeScore: number;
  awayScore: number;
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
}

export function createInitialUniverseState(): UniverseState {
  const defaultManager: ManagerProfile = {
    name: '',
    nationality: '',
    preferredFormation: '4-3-3',
    playingPhilosophy: 'Front-foot possession with structured counter-pressing',
    coachingStyle: 'Tactical Innovator & Youth Developer',
    careerObjectives: 'Build a sustainable dynasty and capture domestic and continental silverware.',
    reputation: 68,
    boardConfidence: 75,
    history: [],
    careerTotals: {
      clubsManaged: [],
      seasonsCompleted: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      trophies: [],
      careerGoals: 0,
      careerAssists: 0,
      achievements: [],
    },
  };

  const defaultTactics: TacticsConfig = {
    formation: '4-3-3',
    startingXiIds: [],
    benchIds: [],
    attackingStrategy: 'Possession & Half-Space Overloads',
    defensiveStrategy: 'Mid-Block Compactness with Trigger Press',
    pressingStyle: 'Counter-Press on Ball Loss',
    defensiveLine: 'Balanced',
    width: 'Balanced',
    buildUpApproach: 'Short Build-Up Through #6 Pivot',
    setPieceFocus: 'In-Swinging Corners to Near Post',
    captainId: '',
    viceCaptainId: '',
    opponentNotes: '',
  };

  return {
    phase: 'opening',
    seasonNumber: 1,
    seasonLabel: '2026/27',
    currentMatchday: 1,
    maxLeagueMatchdays: 18,
    transferWindowOpen: true,
    transferWindowSigningsCount: 0,
    maxWindowSignings: 4,
    activeCommentator: 'buda-kamau',
    openingDocNarrative: {
      documentaryLead:
        'A new football calendar dawns across Europe’s floodlit cathedrals. Across the continent, heavyweight dynasties brace for fresh tactical revolutions, ambitious challengers sharpen their squads in a volatile transfer market, and historic rivalries simmer beneath the surface of Opening Day.',
      seasonAtmosphere:
        'From the Premier Division’s relentless weekly intensity to the tactical chessboards of Serie A, La Liga, and the Bundesliga—every touchline decision, squad rotation, and ninety-minute battle you contest in eFootball will echo through league tables, dressing rooms, and Football Mtaani morning headlines.',
      headlines: [
        'Simulated Universe Media: Title odds narrow as Europe’s elite enter the summer market with aggressive mandates.',
        'Simulated Universe Media: Sporting directors warn that squad depth will define the decisive winter stretch.',
        'Simulated Universe Media: Boards across the top flight demand clear tactical identity from day one.',
      ],
      shengIntro:
        'Buda Kamau (Mtaani Pitch-Side): "Wasee wa mtaani, karibuni Football Mtaani! Msimu mpya umeanza na moto—chagua klabu yako, panga kikosi, halafu tuone kama utaleta kombe nyumbani!"',
      openingQuestion: 'Every dynasty begins with a signature on the touchline. Which club will you lead?',
    },
    manager: defaultManager,
    userClub: null,
    clubs: [],
    competitions: [],
    fixtures: [],
    squad: [],
    tactics: defaultTactics,
    finances: {
      startingBudgetMillions: 0,
      transferBudgetMillions: 0,
      wageBudgetWeeklyThousands: 0,
      currentWageBillWeeklyThousands: 0,
      transferSpendingMillions: 0,
      transferIncomeMillions: 0,
      prizeMoneyMillions: 0,
      sponsorshipIncomeMillions: 0,
      matchdayBonusesMillions: 0,
    },
    ledger: [],
    transferTargets: TRANSFER_MARKET_POOL,
    negotiations: [],
    transferHistory: [],
    news: [],
    rivalries: [],
    records: {
      biggestWin: 'None recorded yet',
      heaviestDefeat: 'None recorded yet',
      longestUnbeatenRun: 0,
      currentUnbeatenRun: 0,
      seasonTopScorer: 'None recorded yet',
      allTimeGoalsLeader: { name: 'None recorded yet', goals: 0 },
    },
    seasonHistory: [],
    currentSeasonReview: null,
    offSeasonPlan: null,
    currentSeasonAwards: [],
    goalOfSeasonCandidates: [],
    lastCompletedFixtureId: null,
  };
}

function generateRoundRobinLeagueFixtures(
  clubs: Club[],
  competition: Competition,
  userClubId: string
): Fixture[] {
  const n = clubs.length;
  const ids = clubs.map((c) => c.id);
  const clubMap = new Map(clubs.map((c) => [c.id, c]));
  const totalHalfRounds = n - 1;
  const matchesPerRound = n / 2;
  const firstHalf: Fixture[] = [];

  const rotating = ids.slice(1);
  const fixed = ids[0];

  for (let round = 0; round < totalHalfRounds; round++) {
    const matchday = round + 1;
    const roundList = [fixed, ...rotating];

    for (let i = 0; i < matchesPerRound; i++) {
      const t1 = roundList[i];
      const t2 = roundList[n - 1 - i];
      const swap = (round + i) % 2 === 1;
      const homeId = swap ? t2 : t1;
      const awayId = swap ? t1 : t2;
      const homeClub = clubMap.get(homeId)!;
      const awayClub = clubMap.get(awayId)!;

      firstHalf.push({
        id: `lg-${competition.id}-md${matchday}-${homeId}-${awayId}`,
        competitionId: competition.id,
        competitionName: competition.name,
        competitionType: 'league',
        matchday,
        roundLabel: `Matchday ${matchday}`,
        homeClubId: homeId,
        awayClubId: awayId,
        homeClubName: homeClub.name,
        awayClubName: awayClub.name,
        stadium: homeClub.stadium,
        isUserMatch: homeId === userClubId || awayId === userClubId,
        status: 'scheduled',
        isSimulatedResult: false,
        goals: [],
        cards: [],
      });
    }

    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  const secondHalf: Fixture[] = firstHalf.map((f) => {
    const md = f.matchday + totalHalfRounds;
    const newHome = clubMap.get(f.awayClubId)!;
    const newAway = clubMap.get(f.homeClubId)!;
    return {
      id: `lg-${competition.id}-md${md}-${newHome.id}-${newAway.id}`,
      competitionId: competition.id,
      competitionName: competition.name,
      competitionType: 'league',
      matchday: md,
      roundLabel: `Matchday ${md}`,
      homeClubId: newHome.id,
      awayClubId: newAway.id,
      homeClubName: newHome.name,
      awayClubName: newAway.name,
      stadium: newHome.stadium,
      isUserMatch: f.isUserMatch,
      status: 'scheduled',
      isSimulatedResult: false,
      goals: [],
      cards: [],
    };
  });

  return [...firstHalf, ...secondHalf];
}

function buildKnockoutQuarterFinals(
  clubs: Club[],
  competition: Competition,
  userClubId: string,
  matchday: number,
  prefix: string
): Fixture[] {
  const userClub = clubs.find((c) => c.id === userClubId)!;
  const others = clubs
    .filter((c) => c.id !== userClubId)
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 7);
  const participants = [userClub, ...others];

  const pairs: [Club, Club][] = [
    [participants[0], participants[7]],
    [participants[1], participants[6]],
    [participants[2], participants[5]],
    [participants[3], participants[4]],
  ];

  return pairs.map(([home, away], idx) => ({
    id: `${prefix}-qf-${idx + 1}`,
    competitionId: competition.id,
    competitionName: competition.name,
    competitionType: competition.type,
    matchday,
    roundLabel: 'Quarter-Final',
    homeClubId: home.id,
    awayClubId: away.id,
    homeClubName: home.name,
    awayClubName: away.name,
    stadium: home.stadium,
    isUserMatch: home.id === userClubId || away.id === userClubId,
    status: 'scheduled',
    isSimulatedResult: false,
    goals: [],
    cards: [],
  }));
}

function buildPreSeasonFriendlies(userClub: Club, clubs: Club[], seasonNum: number): Fixture[] {
  const candidates = LEAGUE_PRESETS.flatMap((l) => l.clubs)
    .filter((c) => c.id !== userClub.id && c.leagueId !== userClub.leagueId)
    .sort((a, b) => b.reputation - a.reputation);
  const opp1 = candidates[0] || clubs.find((c) => c.id !== userClub.id)!;
  const opp2 = candidates[3] || clubs.filter((c) => c.id !== userClub.id)[1] || opp1;

  return [
    {
      id: `s${seasonNum}-pre-1`,
      competitionId: 'preseason-tour',
      competitionName: 'Mtaani Pre-Season Tour',
      competitionType: 'preseason',
      matchday: 0,
      roundLabel: 'Pre-Season Friendly 1',
      homeClubId: userClub.id,
      awayClubId: opp1.id,
      homeClubName: userClub.name,
      awayClubName: opp1.name,
      stadium: userClub.stadium,
      isUserMatch: true,
      status: 'scheduled',
      isSimulatedResult: false,
      goals: [],
      cards: [],
    },
    {
      id: `s${seasonNum}-pre-2`,
      competitionId: 'preseason-tour',
      competitionName: 'Mtaani Pre-Season Tour',
      competitionType: 'preseason',
      matchday: 0,
      roundLabel: 'Pre-Season Friendly 2',
      homeClubId: opp2.id,
      awayClubId: userClub.id,
      homeClubName: opp2.name,
      awayClubName: userClub.name,
      stadium: opp2.stadium,
      isUserMatch: true,
      status: 'scheduled',
      isSimulatedResult: false,
      goals: [],
      cards: [],
    },
  ];
}

export function selectClubAndBuildUniverse(
  prevState: UniverseState,
  club: Club,
  customLeagueClubs?: Club[],
  customSquad?: Player[]
): UniverseState {
  const preset = LEAGUE_PRESETS.find((l) => l.id === club.leagueId);
  const leagueClubs = customLeagueClubs ?? preset?.clubs ?? LEAGUE_PRESETS[0].clubs;
  const clubsInUniverse = leagueClubs.some((c) => c.id === club.id)
    ? leagueClubs
    : [club, ...leagueClubs.slice(0, 9)];

  const squad = customSquad ?? buildStarterSquadForClub(club);
  const startingXi = squad.slice(0, 11).map((p) => p.id);
  const bench = squad.slice(11, 18).map((p) => p.id);

  const wageBill = squad.reduce((acc, p) => acc + p.wageThousands, 0);
  const startingBudget = Math.round(Math.max(25, (club.reputation - 60) * 3.5));
  const wageBudget = Math.round(wageBill * 1.18);

  const finances: ClubFinances = {
    startingBudgetMillions: startingBudget,
    transferBudgetMillions: startingBudget,
    wageBudgetWeeklyThousands: wageBudget,
    currentWageBillWeeklyThousands: wageBill,
    transferSpendingMillions: 0,
    transferIncomeMillions: 0,
    prizeMoneyMillions: 0,
    sponsorshipIncomeMillions: Math.round(startingBudget * 0.25),
    matchdayBonusesMillions: 0,
  };

  const preSeasonComp: Competition = {
    id: 'preseason-tour',
    name: 'Mtaani Pre-Season Tour',
    type: 'preseason',
    format: '2 Friendly Warm-Up Fixtures',
    rules: 'No league points at stake. Used to test formations, fitness, and eFootball squad chemistry.',
    qualificationCriteria: 'Club invitation',
    prizeMoneyChampionMillions: 2,
    participatingClubIds: [club.id],
    currentRoundLabel: 'Pre-Season',
  };

  const leagueComp: Competition = {
    id: club.leagueId || 'custom-league',
    name: club.leagueName,
    type: 'league',
    format: `${clubsInUniverse.length}-Club Double Round-Robin (${(clubsInUniverse.length - 1) * 2} Matchdays)`,
    rules: 'Win = 3 pts, Draw = 1 pt, Loss = 0 pts. Tie-breakers: Points, Goal Difference, Goals Scored.',
    qualificationCriteria: '1st: League Champion · Top 4: Continental Cup Qualification',
    prizeMoneyChampionMillions: 45,
    participatingClubIds: clubsInUniverse.map((c) => c.id),
    currentRoundLabel: 'Matchday 1',
  };

  const cupName = preset?.cupName || `${club.country} National Cup`;
  const cupComp: Competition = {
    id: `${club.leagueId}-cup`,
    name: cupName,
    type: 'cup',
    format: 'Single-Leg Knockout (Quarter-Finals, Semi-Finals, Final)',
    rules: 'Winner advances on the day; Extra Time & Penalties if tied after 90 minutes.',
    qualificationCriteria: 'All top-flight clubs enter Quarter-Final stage',
    prizeMoneyChampionMillions: 18,
    participatingClubIds: clubsInUniverse.slice(0, 8).map((c) => c.id),
    currentRoundLabel: 'Quarter-Final',
  };

  const continentalQualified = club.reputation >= 80;
  const competitions: Competition[] = [preSeasonComp, leagueComp, cupComp];

  let fixtures: Fixture[] = [
    ...buildPreSeasonFriendlies(club, clubsInUniverse, prevState.seasonNumber),
    ...generateRoundRobinLeagueFixtures(clubsInUniverse, leagueComp, club.id),
    ...buildKnockoutQuarterFinals(clubsInUniverse, cupComp, club.id, 6, 'cup'),
  ];

  if (continentalQualified) {
    const contName = preset?.continentalName || 'European Champions Cup';
    const contClubs: Club[] = [
      club,
      ...LEAGUE_PRESETS.flatMap((l) => l.clubs)
        .filter((c) => c.id !== club.id && c.reputation >= 84)
        .sort((a, b) => b.reputation - a.reputation)
        .slice(0, 7),
    ];
    const contComp: Competition = {
      id: 'continental-cup',
      name: contName,
      type: 'continental',
      format: 'Elite 8 Knockout Championship',
      rules: 'Single-leg knockout format tailored for eFootball matchdays. Extra time & penalties if level.',
      qualificationCriteria: 'Top-reputation / Top-4 league clubs',
      prizeMoneyChampionMillions: 65,
      participatingClubIds: contClubs.map((c) => c.id),
      currentRoundLabel: 'Quarter-Final',
    };
    competitions.push(contComp);
    fixtures = [
      ...fixtures,
      ...buildKnockoutQuarterFinals(contClubs, contComp, club.id, 8, 'cont'),
    ];
  }

  const allKnownClubs = [...clubsInUniverse, ...LEAGUE_PRESETS.flatMap((l) => l.clubs)];
  const findClubById = (id: string) => allKnownClubs.find((c) => c.id === id);
  const rivalries: RivalryRecord[] = [];
  const mainRival = findClubById(club.mainRivalId) || clubsInUniverse.find((c) => c.id !== club.id);
  if (mainRival) {
    rivalries.push({
      rivalClubId: mainRival.id,
      rivalClubName: mainRival.name,
      rivalryTitle: `${club.shortName} vs ${mainRival.shortName} Derby`,
      tier: 'Main Rival',
      intensity: 92,
      rivalManager: `${mainRival.shortName} Head Coach (Simulated)`,
      rivalKeyPlayers: mainRival.keyPlayerNames,
      historySummary: `Simulated Universe Lore: Fierce territorial and trophy rivalry between ${club.name} and ${mainRival.name}. Every meeting carries elevated board and supporter stakes.`,
      isSimulatedNarrative: true,
      wins: 0,
      draws: 0,
      losses: 0,
      memorableMatches: [],
    });
  }
  club.secondaryRivalIds.forEach((rId) => {
    const rc = findClubById(rId);
    if (rc && rc.id !== mainRival?.id && rc.id !== club.id) {
      rivalries.push({
        rivalClubId: rc.id,
        rivalClubName: rc.name,
        rivalryTitle: `${club.shortName} – ${rc.shortName} Clash`,
        tier: 'Secondary Rival',
        intensity: 76,
        rivalManager: `${rc.shortName} Head Coach (Simulated)`,
        rivalKeyPlayers: rc.keyPlayerNames,
        historySummary: `Simulated Universe Lore: Competitive rivalry forged through title races and decisive knockout battles.`,
        isSimulatedNarrative: true,
        wins: 0,
        draws: 0,
        losses: 0,
        memorableMatches: [],
      });
    }
  });

  const captain = squad.find((p) => p.role === 'Key Player') || squad[1] || squad[0];
  const vice = squad.find((p) => p.id !== captain?.id && p.role === 'Key Player') || squad[2] || squad[0];

  const initialLedger: FinanceLedgerEntry[] = [
    {
      id: 'led-init',
      matchday: 1,
      label: `Opening Season Allocation (${club.name})`,
      category: 'Sponsorship',
      amountMillions: startingBudget,
      isSimulated: true,
    },
  ];

  const initialNews: NewsItem[] = [
    {
      id: 'news-open-1',
      matchday: 1,
      category: 'Mtaani Wire',
      headline: `${club.name} begin Pre-Season preparations ahead of ${prevState.seasonLabel}`,
      summary: `Simulated Universe Media: Supporters at ${club.stadium} expect ${club.supportersExpectations}`,
      shengTake: `Buda Kamau: "Wasee wa ${club.shortName}, msimu huu tunataka ball tamu na ushindi nyumbani!"`,
      isSimulated: true,
    },
    {
      id: 'news-open-2',
      matchday: 1,
      category: 'Transfer Rumor',
      headline: `Summer Transfer Window OPEN — ${club.weakPositions[0] || 'Squad depth'} flagged as early priority`,
      summary: `Simulated Universe Media: Scouting department has shortlisted targets within the €${startingBudget}M allocation.`,
      isSimulated: true,
    },
  ];

  const clubsManaged = prevState.manager.careerTotals.clubsManaged.includes(club.name)
    ? prevState.manager.careerTotals.clubsManaged
    : [...prevState.manager.careerTotals.clubsManaged, club.name];

  return {
    ...prevState,
    phase: 'manager-setup',
    userClub: club,
    clubs: clubsInUniverse,
    competitions,
    fixtures,
    squad,
    maxLeagueMatchdays: (clubsInUniverse.length - 1) * 2,
    manager: {
      ...prevState.manager,
      careerTotals: {
        ...prevState.manager.careerTotals,
        clubsManaged,
      },
    },
    tactics: {
      ...prevState.tactics,
      startingXiIds: startingXi,
      benchIds: bench,
      captainId: captain?.id || '',
      viceCaptainId: vice?.id || '',
      attackingStrategy: club.tacticalIdentity,
    },
    finances,
    ledger: initialLedger,
    rivalries,
    news: initialNews,
  };
}

export function completeManagerSetup(
  state: UniverseState,
  managerUpdates: Partial<ManagerProfile>
): UniverseState {
  const updatedManager: ManagerProfile = {
    ...state.manager,
    ...managerUpdates,
  };

  const formation = updatedManager.preferredFormation || state.tactics.formation;
  const news: NewsItem[] = [
    {
      id: `news-mgr-${Date.now()}`,
      matchday: 1,
      category: 'Board & Press',
      headline: `${updatedManager.name || 'New Manager'} unveiled at ${state.userClub?.name} ahead of Pre-Season`,
      summary: `Simulated Universe Media: Operating a ${formation} blueprint with "${updatedManager.playingPhilosophy}" philosophy, pre-season training begins before League Matchday 1.`,
      shengTake: `Shiro wa Studio: "Kocha ${updatedManager.name || 'mpya'} amekuja na ${formation}. Wacha tuone jinsi vijana watacheza Pre-Season!"`,
      isSimulated: true,
    },
    ...state.news,
  ];

  return {
    ...state,
    phase: 'pre-season',
    manager: updatedManager,
    tactics: {
      ...state.tactics,
      formation,
    },
    news,
  };
}

export function beginRegularSeasonFromPreSeason(state: UniverseState): UniverseState {
  return {
    ...state,
    phase: 'active',
    currentMatchday: 1,
    news: [
      {
        id: `news-kickoff-${Date.now()}`,
        matchday: 1,
        category: 'League Pulse',
        headline: `Pre-Season complete — ${state.userClub?.leagueName} Matchday 1 kicks off!`,
        summary: `Simulated Universe Media: Points are now on the line. ${state.userClub?.name} open their official campaign.`,
        shengTake: `DJ Mzito: "Mazoezi yameisha wasee! Sasa ni kazi kamili—Matchday 1 imewadia!"`,
        isSimulated: true,
      },
      ...state.news,
    ],
  };
}

export function computeLeagueTable(fixtures: Fixture[], clubs: Club[], leagueId: string): LeagueRow[] {
  const rowsMap = new Map<string, LeagueRow>();
  clubs.forEach((c) => {
    rowsMap.set(c.id, {
      clubId: c.id,
      clubName: c.name,
      shortName: c.shortName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      form: [],
    });
  });

  const playedLeague = fixtures
    .filter((f) => f.competitionId === leagueId && f.status === 'played')
    .sort((a, b) => a.matchday - b.matchday);

  playedLeague.forEach((f) => {
    const h = rowsMap.get(f.homeClubId);
    const a = rowsMap.get(f.awayClubId);
    if (!h || !a || f.homeScore === undefined || f.awayScore === undefined) return;

    h.played += 1;
    a.played += 1;
    h.gf += f.homeScore;
    h.ga += f.awayScore;
    a.gf += f.awayScore;
    a.ga += f.homeScore;
    h.gd = h.gf - h.ga;
    a.gd = a.gf - a.ga;

    if (f.homeScore > f.awayScore) {
      h.won += 1;
      h.pts += 3;
      h.form.push('W');
      a.lost += 1;
      a.form.push('L');
    } else if (f.homeScore < f.awayScore) {
      a.won += 1;
      a.pts += 3;
      a.form.push('W');
      h.lost += 1;
      h.form.push('L');
    } else {
      h.drawn += 1;
      h.pts += 1;
      h.form.push('D');
      a.drawn += 1;
      a.pts += 1;
      a.form.push('D');
    }
  });

  return Array.from(rowsMap.values())
    .map((r) => ({ ...r, form: r.form.slice(-5) }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.clubName.localeCompare(b.clubName);
    });
}

export function getNextUserFixture(state: UniverseState): Fixture | null {
  const scheduled = state.fixtures
    .filter((f) => f.isUserMatch && f.status === 'scheduled')
    .filter((f) => (state.phase === 'pre-season' ? f.competitionType === 'preseason' : f.competitionType !== 'preseason'))
    .sort((a, b) => {
      if (a.matchday !== b.matchday) return a.matchday - b.matchday;
      const order: Record<string, number> = { preseason: -1, league: 0, cup: 1, continental: 2, supercup: 3 };
      return (order[a.competitionType] ?? 0) - (order[b.competitionType] ?? 0);
    });
  return scheduled[0] || null;
}

function simulateExternalFixture(fixture: Fixture, clubs: Club[]): Fixture {
  const home = clubs.find((c) => c.id === fixture.homeClubId);
  const away = clubs.find((c) => c.id === fixture.awayClubId);
  const hRep = (home?.reputation ?? 80) + 3;
  const aRep = away?.reputation ?? 80;
  const diff = (hRep - aRep) / 14;

  const randPoisson = (lambda: number) => {
    const l = Math.max(0.35, Math.min(3.4, lambda));
    let p = Math.exp(-l);
    let k = 0;
    let sum = p;
    const u = Math.random();
    while (u > sum && k < 6) {
      k++;
      p = (p * l) / k;
      sum += p;
    }
    return k;
  };

  const homeScore = randPoisson(1.35 + diff * 0.45);
  const awayScore = randPoisson(1.15 - diff * 0.35);

  let extraTime = false;
  let penaltiesWinner: 'home' | 'away' | undefined;
  let penaltiesScore: string | undefined;

  if (fixture.competitionType !== 'league' && fixture.competitionType !== 'preseason' && homeScore === awayScore) {
    extraTime = true;
    penaltiesWinner = Math.random() + diff * 0.05 >= 0.5 ? 'home' : 'away';
    penaltiesScore = penaltiesWinner === 'home' ? '4-3' : '3-4';
  }

  return {
    ...fixture,
    status: 'played',
    isSimulatedResult: true,
    homeScore,
    awayScore,
    extraTime,
    penaltiesWinner,
    penaltiesScore,
  };
}

function advanceKnockoutRoundIfComplete(
  fixtures: Fixture[],
  competition: Competition,
  userClubId: string,
  clubs: Club[]
): Fixture[] {
  if (competition.type === 'league' || competition.type === 'preseason') return fixtures;
  const compFixtures = fixtures.filter((f) => f.competitionId === competition.id);
  const rounds = ['Quarter-Final', 'Semi-Final', 'Final'];

  for (let r = 0; r < rounds.length - 1; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];
    const currentMatches = compFixtures.filter((f) => f.roundLabel === currentRound);
    const nextMatches = compFixtures.filter((f) => f.roundLabel === nextRound);

    if (
      currentMatches.length > 0 &&
      currentMatches.every((f) => f.status === 'played') &&
      nextMatches.length === 0
    ) {
      const winners = currentMatches.map((f) => {
        const homeWon =
          (f.homeScore ?? 0) > (f.awayScore ?? 0) ||
          ((f.homeScore ?? 0) === (f.awayScore ?? 0) && f.penaltiesWinner === 'home');
        const winnerId = homeWon ? f.homeClubId : f.awayClubId;
        const winnerName = homeWon ? f.homeClubName : f.awayClubName;
        const found = clubs.find((c) => c.id === winnerId);
        return { id: winnerId, name: winnerName, stadium: found?.stadium || f.stadium };
      });

      const nextMd = currentMatches[0].matchday + (nextRound === 'Semi-Final' ? 5 : 6);
      const created: Fixture[] = [];
      for (let i = 0; i < winners.length; i += 2) {
        const w1 = winners[i];
        const w2 = winners[i + 1];
        if (!w1 || !w2) break;
        created.push({
          id: `${competition.id}-${nextRound.toLowerCase().replace(/\s+/g, '-')}-${i / 2 + 1}-${Date.now()}`,
          competitionId: competition.id,
          competitionName: competition.name,
          competitionType: competition.type,
          matchday: Math.min(18, nextMd),
          roundLabel: nextRound,
          homeClubId: w1.id,
          awayClubId: w2.id,
          homeClubName: w1.name,
          awayClubName: w2.name,
          stadium: nextRound === 'Final' ? 'National Stadium (Neutral Venue)' : w1.stadium,
          isUserMatch: w1.id === userClubId || w2.id === userClubId,
          status: 'scheduled',
          isSimulatedResult: false,
          goals: [],
          cards: [],
        });
      }
      return [...fixtures, ...created];
    }
  }

  return fixtures;
}

export function submitUserMatchResult(
  state: UniverseState,
  fixtureId: string,
  input: UserMatchResultInput
): UniverseState {
  const userClub = state.userClub;
  if (!userClub) return state;

  const target = state.fixtures.find((f) => f.id === fixtureId);
  if (!target) return state;

  const isPreSeason = target.competitionType === 'preseason';
  const isUserHome = target.homeClubId === userClub.id;
  const userGoals = isUserHome ? input.homeScore : input.awayScore;
  const oppGoals = isUserHome ? input.awayScore : input.homeScore;
  const opponentName = isUserHome ? target.awayClubName : target.homeClubName;
  const opponentId = isUserHome ? target.awayClubId : target.homeClubId;
  const venueLabel = isUserHome ? `Home (${target.stadium})` : `Away (${target.stadium})`;

  const won =
    userGoals > oppGoals ||
    (userGoals === oppGoals &&
      ((isUserHome && input.penaltiesWinner === 'home') ||
        (!isUserHome && input.penaltiesWinner === 'away')));
  const drew = userGoals === oppGoals && !input.penaltiesWinner;

  let updatedFixtures: Fixture[] = state.fixtures.map((f) => {
    if (f.id === fixtureId) {
      return {
        ...f,
        status: 'played',
        isSimulatedResult: false,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        extraTime: input.extraTime,
        penaltiesWinner: input.penaltiesWinner,
        penaltiesScore: input.penaltiesScore,
        goals: input.goals,
        cards: input.cards,
        motmPlayerName: input.motmPlayerName,
        playerRatings: input.playerRatings,
        injuriesReported: input.injuriesReported,
        stats: input.stats,
        memorableMoment: input.memorableMoment,
      };
    }
    if (
      !isPreSeason &&
      !f.isUserMatch &&
      f.status === 'scheduled' &&
      f.competitionType !== 'preseason' &&
      f.matchday <= target.matchday
    ) {
      return simulateExternalFixture(f, state.clubs);
    }
    return f;
  });

  if (!isPreSeason) {
    state.competitions.forEach((comp) => {
      updatedFixtures = advanceKnockoutRoundIfComplete(updatedFixtures, comp, userClub.id, state.clubs);
    });
  }

  // Update squad stats ONLY for competitive matches (pre-season logs appearances/form lightly or doesn't inflate competitive Golden Boot!)
  const xiSet = new Set(state.tactics.startingXiIds);
  const benchSet = new Set(state.tactics.benchIds);
  const injuryMap = new Map(
    (input.injuriesReported || []).map((i) => [i.playerName.toLowerCase(), i.returnMatchdays])
  );

  const totalAssistsInMatch = input.goals.filter((g) => Boolean(g.assistPlayerName)).length;

  const updatedSquad: Player[] = state.squad.map((p) => {
    let next = { ...p };
    if (next.status === 'Suspended') next.status = 'Fit';
    if (next.status === 'Injured' && next.injuryReturnMatchday && target.matchday >= next.injuryReturnMatchday) {
      next.status = 'Fit';
      next.injuryReturnMatchday = undefined;
    }

    if (!isPreSeason) {
      const playedStart = xiSet.has(p.id) && p.status === 'Fit';
      const playedSub =
        !playedStart &&
        (input.goals.some((g) => g.playerName === p.name || g.assistPlayerName === p.name) ||
          input.cards.some((c) => c.playerName === p.name) ||
          input.motmPlayerName === p.name ||
          (input.playerRatings && input.playerRatings[p.name] !== undefined));

      if (playedStart || playedSub) {
        next.appearances += 1;
        if (playedStart) {
          next.starts += 1;
          next.minutes += 90;
        } else if (benchSet.has(p.id) || playedSub) {
          next.minutes += 25;
        }
        if ((p.group === 'GK' || p.group === 'DEF') && oppGoals === 0) {
          next.cleanSheets += 1;
        }
      }

      const goalsScored = input.goals.filter((g) => g.playerName === p.name).length;
      const assistsMade = input.goals.filter((g) => g.assistPlayerName === p.name).length;
      const yellows = input.cards.filter((c) => c.playerName === p.name && c.type === 'yellow').length;
      const reds = input.cards.filter((c) => c.playerName === p.name && c.type === 'red').length;

      next.goals += goalsScored;
      next.assists += assistsMade;
      next.yellowCards += yellows;
      next.redCards += reds;
      if (reds > 0) next.status = 'Suspended';
      if (input.motmPlayerName === p.name) next.motmAwards += 1;

      if (input.playerRatings && input.playerRatings[p.name] !== undefined) {
        const r = input.playerRatings[p.name];
        next.ratingsHistory = [...next.ratingsHistory, r];
        next.form = r >= 8.0 ? 'Excellent' : r >= 7.0 ? 'Good' : r >= 6.2 ? 'Steady' : 'Dipping';
      } else if (goalsScored > 0 || assistsMade > 0 || input.motmPlayerName === p.name) {
        next.form = 'Good';
      }

      const injDuration = injuryMap.get(p.name.toLowerCase());
      if (injDuration) {
        next.status = 'Injured';
        next.injuryReturnMatchday = target.matchday + injDuration;
      }

      if (next.isYouthProspect && next.development) {
        const dev = { ...next.development };
        if (next.starts >= 1) {
          dev.narrativeProgress = `Earned senior exposure (${next.appearances} apps, ${next.minutes} mins, ${next.goals}G/${next.assists}A).`;
        }
        if (next.minutes >= dev.minutesTarget) {
          dev.narrativeProgress = `Milestone achieved: Surpassed ${dev.minutesTarget} senior minutes with ${next.goals} goals and ${next.assists} assists.`;
        }
        next.development = dev;
      }
    }

    return next;
  });

  const leagueComp = state.competitions.find((c) => c.type === 'league');
  const updatedTable = leagueComp ? computeLeagueTable(updatedFixtures, state.clubs, leagueComp.id) : [];
  const userRowIndex = updatedTable.findIndex((r) => r.clubId === userClub.id);
  const userPosition = userRowIndex >= 0 ? userRowIndex + 1 : 1;
  const userRow = updatedTable[userRowIndex];

  // Finances
  const gateReceipt = isPreSeason ? 0.5 : isUserHome ? Math.round((userClub.reputation / 28) * 10) / 10 : 0;
  const resultBonus = isPreSeason ? 0 : won ? 1.2 : drew ? 0.4 : 0;
  const prizeAdvance =
    !isPreSeason && target.competitionType !== 'league' && won
      ? target.roundLabel === 'Final'
        ? target.competitionType === 'continental'
          ? 65
          : 18
        : 4.5
      : 0;

  const financesDelta = gateReceipt + resultBonus + prizeAdvance;
  const nextFinances: ClubFinances = {
    ...state.finances,
    transferBudgetMillions: Math.round((state.finances.transferBudgetMillions + financesDelta * 0.45) * 10) / 10,
    matchdayBonusesMillions: Math.round((state.finances.matchdayBonusesMillions + gateReceipt + resultBonus) * 10) / 10,
    prizeMoneyMillions: Math.round((state.finances.prizeMoneyMillions + prizeAdvance) * 10) / 10,
  };

  const newLedgerEntries: FinanceLedgerEntry[] = [];
  if (gateReceipt + resultBonus > 0) {
    newLedgerEntries.push({
      id: `led-md-${target.id}`,
      matchday: target.matchday,
      label: `${target.roundLabel} vs ${opponentName} (Gate & Result Bonus)`,
      category: 'Gate & Bonus',
      amountMillions: Math.round((gateReceipt + resultBonus) * 10) / 10,
      isSimulated: true,
    });
  }
  if (prizeAdvance > 0) {
    newLedgerEntries.push({
      id: `led-prize-${target.id}`,
      matchday: target.matchday,
      label: `${target.competitionName} ${target.roundLabel} Prize`,
      category: 'Prize Money',
      amountMillions: prizeAdvance,
      isSimulated: true,
    });
  }

  // Records
  const nextRecords: ClubRecords = { ...state.records };
  if (!isPreSeason) {
    const margin = userGoals - oppGoals;
    const scoreStr = `${userGoals}-${oppGoals}`;
    if (margin > 0) {
      nextRecords.currentUnbeatenRun += 1;
      if (nextRecords.currentUnbeatenRun > nextRecords.longestUnbeatenRun) {
        nextRecords.longestUnbeatenRun = nextRecords.currentUnbeatenRun;
      }
      if (nextRecords.biggestWin === 'None recorded yet') {
        nextRecords.biggestWin = `${scoreStr} vs ${opponentName} (${target.roundLabel})`;
      } else {
        const prevParts = nextRecords.biggestWin.split(' ')[0].split('-').map(Number);
        const prevMargin = (prevParts[0] || 0) - (prevParts[1] || 0);
        if (margin > prevMargin) {
          nextRecords.biggestWin = `${scoreStr} vs ${opponentName} (${target.roundLabel})`;
        }
      }
    } else if (drew) {
      nextRecords.currentUnbeatenRun += 1;
      if (nextRecords.currentUnbeatenRun > nextRecords.longestUnbeatenRun) {
        nextRecords.longestUnbeatenRun = nextRecords.currentUnbeatenRun;
      }
    } else {
      nextRecords.currentUnbeatenRun = 0;
      if (nextRecords.heaviestDefeat === 'None recorded yet') {
        nextRecords.heaviestDefeat = `${scoreStr} vs ${opponentName} (${target.roundLabel})`;
      } else {
        const prevParts = nextRecords.heaviestDefeat.split(' ')[0].split('-').map(Number);
        const prevLossMargin = (prevParts[1] || 0) - (prevParts[0] || 0);
        if (oppGoals - userGoals > prevLossMargin) {
          nextRecords.heaviestDefeat = `${scoreStr} vs ${opponentName} (${target.roundLabel})`;
        }
      }
    }

    const topScorerPlayer = [...updatedSquad].sort((a, b) => b.goals - a.goals)[0];
    if (topScorerPlayer && topScorerPlayer.goals > 0) {
      nextRecords.seasonTopScorer = `${topScorerPlayer.name} (${topScorerPlayer.goals})`;
      if (topScorerPlayer.goals > nextRecords.allTimeGoalsLeader.goals) {
        nextRecords.allTimeGoalsLeader = { name: topScorerPlayer.name, goals: topScorerPlayer.goals };
      }
    }
  }

  // Rivalries & Manager Reputation / Career Totals
  const isRivalry = state.rivalries.some((r) => r.rivalClubId === opponentId);
  const nextRivalries = isPreSeason
    ? state.rivalries
    : state.rivalries.map((r) => {
        if (r.rivalClubId !== opponentId) return r;
        const matchDesc = `${target.competitionName} ${target.roundLabel}: ${target.homeClubName} ${input.homeScore}-${input.awayScore} ${target.awayClubName}`;
        return {
          ...r,
          wins: r.wins + (won ? 1 : 0),
          draws: r.draws + (drew ? 1 : 0),
          losses: r.losses + (!won && !drew ? 1 : 0),
          intensity: Math.min(100, r.intensity + 2),
          memorableMatches: [matchDesc, ...r.memorableMatches].slice(0, 5),
        };
      });

  const repDelta = isPreSeason ? 0.2 : won ? 1.5 : drew ? 0.2 : -1.2;
  const confDelta = isPreSeason ? 1 : won ? 3 : drew ? 0 : -4;
  const nextTotals = isPreSeason
    ? state.manager.careerTotals
    : {
        ...state.manager.careerTotals,
        matches: state.manager.careerTotals.matches + 1,
        wins: state.manager.careerTotals.wins + (won ? 1 : 0),
        draws: state.manager.careerTotals.draws + (drew ? 1 : 0),
        losses: state.manager.careerTotals.losses + (!won && !drew ? 1 : 0),
        careerGoals: state.manager.careerTotals.careerGoals + userGoals,
        careerAssists: state.manager.careerTotals.careerAssists + totalAssistsInMatch,
      };

  const nextManager: ManagerProfile = {
    ...state.manager,
    reputation: Math.max(40, Math.min(99, Math.round((state.manager.reputation + repDelta) * 10) / 10)),
    boardConfidence: Math.max(25, Math.min(99, Math.round(state.manager.boardConfidence + confDelta))),
    careerTotals: nextTotals,
  };

  // Determine next phase if pre-season friendlies finished
  const remainingPreSeason = updatedFixtures.some(
    (f) => f.competitionType === 'preseason' && f.isUserMatch && f.status === 'scheduled'
  );
  let nextPhase = state.phase;
  if (state.phase === 'pre-season' && !remainingPreSeason) {
    nextPhase = 'active';
  }

  const tempStateForNext: UniverseState = {
    ...state,
    phase: nextPhase,
    fixtures: updatedFixtures,
  };
  const nextFixture = getNextUserFixture(tempStateForNext);

  const goalsText =
    input.goals.length > 0
      ? input.goals.map((g) => `${g.playerName}${g.minute ? ` (${g.minute}')` : ''}`)
      : ['No individual goalscorers entered.'];

  const assistsText =
    input.goals.filter((g) => g.assistPlayerName).length > 0
      ? input.goals
          .filter((g) => g.assistPlayerName)
          .map((g) => `${g.assistPlayerName} → ${g.playerName}${g.minute ? ` (${g.minute}')` : ''}`)
      : ['No individual assists logged.'];

  const statsList: string[] = [];
  if (input.stats?.possessionPercent !== undefined) {
    statsList.push(`Possession: ${input.stats.possessionPercent}% – ${100 - input.stats.possessionPercent}%`);
  }
  if (input.stats?.shots !== undefined) {
    statsList.push(
      `Shots (On Target): ${input.stats.shots} (${input.stats.shotsOnTarget ?? '–'}) vs ${input.stats.opponentShots ?? '–'} (${input.stats.opponentShotsOnTarget ?? '–'})`
    );
  }
  if (input.stats?.expectedGoals !== undefined) {
    statsList.push(`xG: ${input.stats.expectedGoals.toFixed(2)} vs ${(input.stats.opponentExpectedGoals ?? 0).toFixed(2)}`);
  }
  if (input.stats?.corners !== undefined) {
    statsList.push(`Corners won: ${input.stats.corners}`);
  }
  if (statsList.length === 0) {
    statsList.push('No detailed match telemetry entered; result logged from final scoreline.');
  }

  const outcomeWord = won ? 'Victory' : drew ? 'Draw' : 'Defeat';
  const shengLines = generateShengMatchLines({
    commentatorId: state.activeCommentator,
    clubName: userClub.name,
    opponentName,
    userGoals,
    oppGoals,
    goals: input.goals,
    motm: input.motmPlayerName,
    isRivalry,
  });

  const report: MatchReport = {
    competition: target.competitionName,
    matchday: target.roundLabel,
    opponent: opponentName,
    venue: venueLabel,
    finalScore: `${target.homeClubName} ${input.homeScore} – ${input.awayScore} ${target.awayClubName}${
      input.extraTime ? ` (AET${input.penaltiesScore ? `, Pens ${input.penaltiesScore}` : ''})` : ''
    }`,
    goals: goalsText,
    assists: assistsText,
    matchStatistics: statsList,
    playerPerformance: input.motmPlayerName
      ? `${input.motmPlayerName} earned Man of the Match honors in a pivotal ${outcomeWord.toLowerCase()} against ${opponentName}.`
      : `Collective effort across the ${state.tactics.formation} setup yielded a ${userGoals}-${oppGoals} ${outcomeWord.toLowerCase()}.`,
    tacticalAnalysis: won
      ? `The ${state.tactics.formation} structure and "${state.tactics.attackingStrategy}" plan created decisive control against ${opponentName}.`
      : drew
      ? `Honors shared after a tight tactical battle; maintaining structure in key transition zones will be crucial next time out.`
      : `A difficult test against ${opponentName} exposed gaps between lines; review defensive line height and midfield protection before adjusting.`,
    mediaReaction: [
      `Simulated Universe Media: "${userClub.name} ${won ? 'make statement' : drew ? 'share spoils' : 'stumble'} in ${userGoals}-${oppGoals} clash with ${opponentName}."`,
      isPreSeason
        ? `Simulated Universe Media: "Pre-season fitness builds ahead of ${userClub.leagueName} Matchday 1."`
        : `Simulated Universe Media: "League standings place ${userClub.name} at #${userPosition} with ${userRow?.pts ?? 0} points."`,
    ],
    fanReaction: won
      ? `Supporters inside ${target.stadium} saluted the intensity and clinical edge on the touchline.`
      : drew
      ? `Travelling and home supporters acknowledged the grit while demanding sharper execution in front of goal.`
      : `Frustration echoed from the terraces, with fans calling for a swift tactical response next matchday.`,
    managersVerdict: `${outcomeWord} logged. Focus shifts immediately to recovery and preparation for ${
      nextFixture ? nextFixture.roundLabel : 'the end-of-season review'
    }.`,
    shengCommentary: shengLines,
    shengCommentatorName: getCommentatorName(state.activeCommentator),
    updatedRecords: isPreSeason
      ? ['Pre-Season Friendly logged — official competitive records begin Matchday 1.']
      : [
          `League Position: #${userPosition} (${userRow?.pts ?? 0} pts, GD ${userRow && userRow.gd >= 0 ? `+${userRow.gd}` : userRow?.gd ?? 0})`,
          `Unbeaten Run: ${nextRecords.currentUnbeatenRun} matches (Season best: ${nextRecords.longestUnbeatenRun})`,
          `Top Scorer: ${nextRecords.seasonTopScorer}`,
        ],
    nextMatch: nextFixture
      ? `${nextFixture.competitionName} · ${nextFixture.roundLabel}: ${nextFixture.homeClubName} vs ${nextFixture.awayClubName} (${nextFixture.stadium})`
      : 'All scheduled fixtures complete — Ready for End-of-Season Review.',
    isAiEnhanced: false,
  };

  updatedFixtures = updatedFixtures.map((f) => (f.id === fixtureId ? { ...f, report } : f));

  const goalCandidates = [...state.goalOfSeasonCandidates];
  if (!isPreSeason) {
    input.goals
      .filter((g) => g.isGoalOfSeasonCandidate)
      .forEach((g) => {
        goalCandidates.push({
          playerName: g.playerName,
          matchLabel: `${target.competitionName} ${target.roundLabel} vs ${opponentName}`,
          description: input.memorableMoment || `Strike vs ${opponentName}`,
        });
      });
  }

  const nextMd = nextFixture ? Math.max(1, nextFixture.matchday) : state.maxLeagueMatchdays;
  const windowOpen = nextPhase === 'pre-season' || (nextMd >= 1 && nextMd <= 3) || (nextMd >= 9 && nextMd <= 11);
  const resetSigningsCount = windowOpen && !state.transferWindowOpen ? 0 : state.transferWindowSigningsCount;

  const mdNews: NewsItem = {
    id: `news-md-${target.id}`,
    matchday: Math.max(1, target.matchday),
    category: isRivalry ? 'Rivalry' : 'Matchday',
    headline: `${userClub.name} ${input.homeScore}-${input.awayScore} ${opponentName} (${target.roundLabel})`,
    summary: isPreSeason
      ? `Simulated Universe Media: Pre-season tune-up complete. ${
          nextPhase === 'active' ? 'Official League Matchday 1 now opens!' : 'One friendly remaining before league kickoff.'
        }`
      : `Simulated Universe Media: ${userClub.name} sit #${userPosition} in ${userClub.leagueName}.`,
    shengTake: shengLines[0],
    isSimulated: true,
  };

  let nextNegotiations = [...state.negotiations];
  if (!isPreSeason && windowOpen && nextNegotiations.filter((n) => n.status === 'active').length < 2) {
    const candidate =
      updatedSquad.find((p) => p.role === 'Transfer-Listed') ||
      (Math.random() > 0.65 ? updatedSquad.find((p) => p.goals >= 2 || p.role === 'Rotation') : undefined);
    if (candidate && !nextNegotiations.some((n) => n.playerName === candidate.name && n.status === 'active')) {
      const buyer = state.clubs.find((c) => c.id !== userClub.id) || { name: 'Continental Rival FC' };
      const offerAmt = Math.max(5, Math.round(candidate.valueMillions * (0.9 + Math.random() * 0.25)));
      nextNegotiations.unshift({
        id: `neg-in-${Date.now()}`,
        direction: 'outgoing-sale',
        playerName: candidate.name,
        position: candidate.position,
        otherClubName: buyer.name,
        askingOrOfferMillions: offerAmt,
        currentBidMillions: offerAmt,
        proposedWageThousands: candidate.wageThousands,
        contractYears: candidate.contractYears,
        round: 1,
        status: 'active',
        executionScope: 'simulated-universe',
        lastMessage: `${buyer.name} have submitted an opening €${offerAmt}M inquiry for ${candidate.name}.`,
      });
    }
  }

  const hasMoreCompetitiveUserMatches = updatedFixtures.some(
    (f) => f.isUserMatch && f.competitionType !== 'preseason' && f.status === 'scheduled'
  );
  let finalFixtures = updatedFixtures;
  let seasonAwards = state.currentSeasonAwards;
  let seasonReview = state.currentSeasonReview;

  if (!hasMoreCompetitiveUserMatches && nextPhase === 'active') {
    finalFixtures = updatedFixtures.map((f) =>
      !f.isUserMatch && f.status === 'scheduled' ? simulateExternalFixture(f, state.clubs) : f
    );
    state.competitions.forEach((comp) => {
      finalFixtures = advanceKnockoutRoundIfComplete(finalFixtures, comp, userClub.id, state.clubs);
      finalFixtures = finalFixtures.map((f) =>
        !f.isUserMatch && f.status === 'scheduled' ? simulateExternalFixture(f, state.clubs) : f
      );
    });
    seasonAwards = calculateSeasonAwards(updatedSquad, nextManager, finalFixtures, state.clubs, goalCandidates);
    seasonReview = buildFullSeasonReview(
      {
        ...state,
        manager: nextManager,
        fixtures: finalFixtures,
        squad: updatedSquad,
        finances: nextFinances,
        goalOfSeasonCandidates: goalCandidates,
        currentSeasonAwards: seasonAwards,
      },
      seasonAwards
    );
    nextPhase = 'season-end';
  }

  return {
    ...state,
    phase: nextPhase,
    currentMatchday: nextMd,
    transferWindowOpen: windowOpen,
    transferWindowSigningsCount: resetSigningsCount,
    manager: nextManager,
    fixtures: finalFixtures,
    squad: updatedSquad,
    finances: nextFinances,
    ledger: [...newLedgerEntries, ...state.ledger],
    records: nextRecords,
    rivalries: nextRivalries,
    news: [mdNews, ...state.news].slice(0, 24),
    negotiations: nextNegotiations,
    goalOfSeasonCandidates: goalCandidates,
    currentSeasonAwards: seasonAwards,
    currentSeasonReview: seasonReview,
    lastCompletedFixtureId: fixtureId,
  };
}

export function calculateSeasonAwards(
  squad: Player[],
  manager: ManagerProfile,
  fixtures: Fixture[],
  clubs: Club[],
  goalCandidates: { playerName: string; matchLabel: string; description: string }[]
): SeasonAward[] {
  const byGoals = [...squad].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  const byAssists = [...squad].sort((a, b) => b.assists - a.assists || b.goals - a.goals);
  const byGk = [...squad]
    .filter((p) => p.group === 'GK')
    .sort((a, b) => b.cleanSheets - a.cleanSheets || b.appearances - a.appearances);
  const byDef = [...squad]
    .filter((p) => p.group === 'DEF')
    .sort((a, b) => b.cleanSheets - a.cleanSheets || b.motmAwards - a.motmAwards);
  const byMid = [...squad]
    .filter((p) => p.group === 'MID')
    .sort((a, b) => b.assists + b.goals - (a.assists + a.goals));
  const byYouth = [...squad]
    .filter((p) => p.age <= 22)
    .sort((a, b) => b.goals + b.assists + b.motmAwards - (a.goals + a.assists + a.motmAwards));

  const avgRating = (p: Player) =>
    p.ratingsHistory.length > 0
      ? p.ratingsHistory.reduce((s, v) => s + v, 0) / p.ratingsHistory.length
      : 0;

  const byBest = [...squad].sort(
    (a, b) =>
      b.motmAwards * 3 + b.goals * 2 + b.assists * 1.5 + avgRating(b) -
      (a.motmAwards * 3 + a.goals * 2 + a.assists * 1.5 + avgRating(a))
  );

  const leagueComp = fixtures.find((f) => f.competitionType === 'league');
  const table = leagueComp ? computeLeagueTable(fixtures, clubs, leagueComp.competitionId) : [];
  const champion = table[0]?.clubName || 'League Leader';

  return [
    {
      title: 'Player of the Season',
      winner: byBest[0]?.name || 'Unassigned',
      detail: `${byBest[0]?.goals ?? 0}G · ${byBest[0]?.assists ?? 0}A · ${byBest[0]?.motmAwards ?? 0} MOTM`,
      basis: 'Tracked Stats',
    },
    {
      title: 'Golden Boot',
      winner: byGoals[0]?.name || 'Unassigned',
      detail: `${byGoals[0]?.goals ?? 0} goals in ${byGoals[0]?.appearances ?? 0} apps`,
      basis: 'Tracked Stats',
    },
    {
      title: 'Golden Assist',
      winner: byAssists[0]?.name || 'Unassigned',
      detail: `${byAssists[0]?.assists ?? 0} assists`,
      basis: 'Tracked Stats',
    },
    {
      title: 'Best Goalkeeper',
      winner: byGk[0]?.name || 'Unassigned',
      detail: `${byGk[0]?.cleanSheets ?? 0} clean sheets`,
      basis: 'Tracked Stats',
    },
    {
      title: 'Best Defender',
      winner: byDef[0]?.name || 'Unassigned',
      detail: `${byDef[0]?.cleanSheets ?? 0} clean sheets · ${byDef[0]?.appearances ?? 0} apps`,
      basis: 'Tracked Stats',
    },
    {
      title: 'Best Midfielder',
      winner: byMid[0]?.name || 'Unassigned',
      detail: `${byMid[0]?.goals ?? 0}G / ${byMid[0]?.assists ?? 0}A`,
      basis: 'Tracked Stats',
    },
    {
      title: 'Young Player of the Season',
      winner: byYouth[0]?.name || 'No U22 regular',
      detail: `${byYouth[0]?.minutes ?? 0} mins · ${byYouth[0]?.goals ?? 0}G/${byYouth[0]?.assists ?? 0}A`,
      basis: 'Tracked Stats',
    },
    {
      title: 'Best Manager',
      winner: manager.name || 'Manager',
      detail: `League Champions: ${champion} · Reputation ${manager.reputation}/100`,
      basis: 'Simulated Voting',
    },
    {
      title: 'Goal of the Season',
      winner: goalCandidates[0]?.playerName || byGoals[0]?.name || 'None nominated',
      detail: goalCandidates[0]?.matchLabel || 'Based on memorable matchday strike',
      basis: goalCandidates.length > 0 ? 'Tracked Stats' : 'Simulated Voting',
    },
  ];
}

export function buildFullSeasonReview(state: UniverseState, awards: SeasonAward[]): SeasonRecordSummary {
  const userClub = state.userClub!;
  const leagueComp = state.competitions.find((c) => c.type === 'league');
  const finalTable = leagueComp ? computeLeagueTable(state.fixtures, state.clubs, leagueComp.id) : [];
  const userPos = Math.max(1, finalTable.findIndex((r) => r.clubId === userClub.id) + 1);
  const userRow = finalTable.find((r) => r.clubId === userClub.id);
  const champion = finalTable[0]?.clubName || userClub.name;

  const trophiesWon: string[] = [];
  if (userPos === 1 && leagueComp) trophiesWon.push(leagueComp.name);
  state.competitions
    .filter((c) => c.type !== 'league' && c.type !== 'preseason')
    .forEach((comp) => {
      const finalMatch = state.fixtures.find(
        (f) => f.competitionId === comp.id && f.roundLabel === 'Final' && f.status === 'played'
      );
      if (finalMatch) {
        const userWon =
          (finalMatch.homeClubId === userClub.id &&
            ((finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0) || finalMatch.penaltiesWinner === 'home')) ||
          (finalMatch.awayClubId === userClub.id &&
            ((finalMatch.awayScore ?? 0) > (finalMatch.homeScore ?? 0) || finalMatch.penaltiesWinner === 'away'));
        if (userWon) trophiesWon.push(comp.name);
      }
    });

  const cupComp = state.competitions.find((c) => c.type === 'cup');
  const contComp = state.competitions.find((c) => c.type === 'continental');
  const getCompResult = (comp?: Competition) => {
    if (!comp) return 'Not entered';
    const userMatches = state.fixtures
      .filter((f) => f.competitionId === comp.id && f.isUserMatch && f.status === 'played')
      .sort((a, b) => b.matchday - a.matchday);
    if (userMatches.length === 0) return 'Eliminated early';
    if (trophiesWon.includes(comp.name)) return 'Champions';
    return `Reached ${userMatches[0].roundLabel}`;
  };

  const byGoals = [...state.squad].sort((a, b) => b.goals - a.goals);
  const byAssists = [...state.squad].sort((a, b) => b.assists - a.assists);
  const byBest = [...state.squad].sort(
    (a, b) => b.motmAwards * 3 + b.goals * 2 + b.assists * 1.5 - (a.motmAwards * 3 + a.goals * 2 + a.assists * 1.5)
  );
  const underperformers = [...state.squad]
    .filter((p) => (p.role === 'Key Player' || p.role === 'Starter') && p.appearances >= 3)
    .sort((a, b) => a.goals + a.assists + a.motmAwards - (b.goals + b.assists + b.motmAwards))
    .slice(0, 2);

  const userPlayed = state.fixtures.filter(
    (f) => f.isUserMatch && f.competitionType !== 'preseason' && f.status === 'played'
  );
  const scoredMargins = userPlayed.map((f) => {
    const isH = f.homeClubId === userClub.id;
    const ug = (isH ? f.homeScore : f.awayScore) ?? 0;
    const og = (isH ? f.awayScore : f.homeScore) ?? 0;
    const opp = isH ? f.awayClubName : f.homeClubName;
    return {
      margin: ug - og,
      label: `${f.competitionName} ${f.roundLabel}: ${f.homeClubName} ${f.homeScore}-${f.awayScore} ${f.awayClubName} vs ${opp}`,
    };
  });
  const bestMatches = [...scoredMargins].sort((a, b) => b.margin - a.margin).slice(0, 2).map((m) => m.label);
  const worstMatches = [...scoredMargins]
    .filter((m) => m.margin < 0)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 2)
    .map((m) => m.label);

  // Evaluate objectives & calculate A-F Grade
  const expectedTop = userClub.reputation >= 88 ? 2 : userClub.reputation >= 82 ? 4 : 6;
  const objectivesCompleted: string[] = [];
  const objectivesFailed: string[] = [];

  if (userPos <= expectedTop) {
    objectivesCompleted.push(`League target met: Finished #${userPos} (Target: Top ${expectedTop})`);
  } else {
    objectivesFailed.push(`League target missed: Finished #${userPos} (Target: Top ${expectedTop})`);
  }
  if (trophiesWon.length > 0) {
    objectivesCompleted.push(`Silverware secured: ${trophiesWon.join(', ')}`);
  } else if (userClub.reputation >= 88) {
    objectivesFailed.push('Finished campaign without major silverware');
  }

  const totalMatches = userRow?.played || userPlayed.length || 1;
  const winRate = (userRow?.won ?? 0) / totalMatches;
  let score = 0;
  if (userPos === 1) score += 45;
  else if (userPos <= expectedTop) score += 32;
  else if (userPos <= expectedTop + 2) score += 20;
  else score += 8;
  score += trophiesWon.length * 20;
  score += Math.round(winRate * 30);

  let finalGrade: SeasonGrade = 'C';
  if (score >= 82) finalGrade = 'A';
  else if (score >= 65) finalGrade = 'B';
  else if (score >= 48) finalGrade = 'C';
  else if (score >= 32) finalGrade = 'D';
  else finalGrade = 'F';

  const netSpend = Math.round((state.finances.transferSpendingMillions - state.finances.transferIncomeMillions) * 10) / 10;
  const clubRepDelta = finalGrade === 'A' ? 2 : finalGrade === 'B' ? 1 : finalGrade === 'D' ? -1 : finalGrade === 'F' ? -2 : 0;

  return {
    seasonLabel: state.seasonLabel,
    clubName: userClub.name,
    leaguePosition: userPos,
    leagueChampion: champion,
    trophiesWon,
    cupResult: getCompResult(cupComp),
    continentalResult: getCompResult(contComp),
    topScorer: awards.find((a) => a.title === 'Golden Boot')?.winner || '–',
    topScorersList: byGoals.slice(0, 3).map((p) => `${p.name} (${p.goals}G, ${p.appearances} apps)`),
    topAssist: awards.find((a) => a.title === 'Golden Assist')?.winner || '–',
    topAssistsList: byAssists.slice(0, 3).map((p) => `${p.name} (${p.assists}A, ${p.appearances} apps)`),
    playerOfSeason: awards.find((a) => a.title === 'Player of the Season')?.winner || '–',
    bestPlayersList: byBest.slice(0, 3).map((p) => `${p.name} (${p.goals}G/${p.assists}A · ${p.motmAwards} MOTM)`),
    biggestDisappointments:
      underperformers.length > 0
        ? underperformers.map((p) => `${p.name} (${p.goals}G/${p.assists}A in ${p.appearances} apps)`)
        : ['No major underperformers recorded across the starting core.'],
    bestMatches: bestMatches.length > 0 ? bestMatches : ['No competitive wins recorded.'],
    worstMatches: worstMatches.length > 0 ? worstMatches : ['No competitive defeats suffered.'],
    transferSummary: `${state.transferHistory.length} completed moves (${state.transferHistory.filter((t) => t.direction === 'IN' || t.direction === 'FREE').length} arrivals, ${state.transferHistory.filter((t) => t.direction === 'OUT').length} exits). Net spend: €${netSpend}M.`,
    financialSummary: `Remaining Budget: €${state.finances.transferBudgetMillions}M · Prize Money: €${state.finances.prizeMoneyMillions}M · Matchday Income: €${state.finances.matchdayBonusesMillions}M.`,
    managerReputationEnd: state.manager.reputation,
    clubReputationEnd: Math.max(50, Math.min(99, userClub.reputation + clubRepDelta)),
    objectivesCompleted,
    objectivesFailed,
    supporterReaction:
      finalGrade === 'A' || finalGrade === 'B'
        ? `Supporters inside ${userClub.stadium} celebrated a proud campaign and backed ${state.manager.name || 'the boss'} for the next chapter.`
        : `Supporters demanded sharper recruitment and stronger consistency in big matches next season.`,
    mediaReaction: `Simulated Universe Media: ${userClub.name} conclude ${state.seasonLabel} in #${userPos} (${userRow?.pts ?? 0} pts) with a Season Grade of ${finalGrade}.`,
    shengSeasonVerdict:
      finalGrade === 'A'
        ? `Buda Kamau: "Grade A kamili! ${userClub.name} wametawala mtaa na wamefanya mashabiki watembee kifua mbele!"`
        : finalGrade === 'B'
        ? `Shiro wa Studio: "Msimu mzuri wa Grade B—msingi upo imara, sasa tuongeze nguvu sokoni kwa ubingwa!"`
        : `DJ Mzito: "Msimu ulikuwa na milima na mabonde (Grade ${finalGrade}). Off-season imefika—tusafishe kikosi turudi na moto!"`,
    finalGrade,
    gradeJustification: `Grade ${finalGrade} awarded based on #${userPos} finish in ${userClub.leagueName} (${userRow?.won ?? 0}W-${userRow?.drawn ?? 0}D-${userRow?.lost ?? 0}L, ${userRow?.pts ?? 0} pts) and ${trophiesWon.length} major trophies.`,
    awards,
    finalTable,
  };
}

export function enterOffSeasonStage(state: UniverseState): UniverseState {
  if (!state.userClub) return state;
  const review =
    state.currentSeasonReview ||
    buildFullSeasonReview(
      state,
      state.currentSeasonAwards.length
        ? state.currentSeasonAwards
        : calculateSeasonAwards(state.squad, state.manager, state.fixtures, state.clubs, state.goalOfSeasonCandidates)
    );

  const expiringPlayers = state.squad
    .filter((p) => p.contractYears <= 1 || p.age >= 35)
    .map((p) => `${p.name} (${p.position}, age ${p.age} — contract expiring / veteran review)`);

  const prizeBoost = Math.max(18, 52 - review.leaguePosition * 3) + review.trophiesWon.length * 16;
  const adjustedBudget = Math.round(state.finances.transferBudgetMillions + prizeBoost * 0.65);

  const nextOpp = state.clubs.filter((c) => c.id !== state.userClub?.id).slice(0, 2).map((c) => c.name);
  const offSeasonPlan: OffSeasonPlan = {
    departures: expiringPlayers.length > 0 ? expiringPlayers : ['No forced contract expiries; full squad retained for rebuild decisions.'],
    rebuildFocus: state.userClub.weakPositions.length > 0
      ? state.userClub.weakPositions
      : ['Strengthen squad rotation depth', 'Integrate youth academy prospects'],
    adjustedBudgetMillions: adjustedBudget,
    newObjectives: [
      review.leaguePosition <= 2
        ? `Defend top-2 status and challenge for the ${state.userClub.leagueName} title`
        : `Improve on #${review.leaguePosition} and push for Top 4 / silverware`,
      'Advance past the Domestic Cup Semi-Finals',
      'Give meaningful minutes to at least two U22 prospects',
    ],
    managerEvaluation: `Board Evaluation: Grade ${review.finalGrade}. Manager reputation stands at ${state.manager.reputation}/100 with ${state.manager.boardConfidence}% board confidence.`,
    newSeasonExpectations:
      review.finalGrade === 'A' || review.finalGrade === 'B'
        ? 'Maintain momentum and build a multi-season dynasty.'
        : 'Deliver immediate improvement in league consistency and decisive away fixtures.',
    newRivalryNote:
      review.leagueChampion !== state.userClub.name
        ? `Title Rivalry Spotlight: ${review.leagueChampion} enter next season as the benchmark to dethrone.`
        : 'Defending Champions Target: Every rival club is targeting your crown.',
    preSeasonOpponentNames: nextOpp,
    windowOpened: true,
  };

  return {
    ...state,
    phase: 'off-season',
    transferWindowOpen: true,
    transferWindowSigningsCount: 0,
    currentSeasonReview: review,
    offSeasonPlan,
    finances: {
      ...state.finances,
      transferBudgetMillions: adjustedBudget,
    },
    news: [
      {
        id: `news-offseason-${Date.now()}`,
        matchday: state.maxLeagueMatchdays,
        category: 'Transfer Rumor',
        headline: `OFF-SEASON WINDOW OPEN — ${state.userClub.name} confirm €${adjustedBudget}M rebuild budget`,
        summary: `Simulated Universe Media: Squad rebuild and pre-season planning underway ahead of the new campaign.`,
        shengTake: `Buda Kamau: "Soko limefunguliwa rasmi! Kocha na bodi wamekaa chini kupanga usajili mpya!"`,
        isSimulated: true,
      },
      ...state.news,
    ],
  };
}

export function startNextSeasonFromOffSeason(state: UniverseState): UniverseState {
  if (!state.userClub) return state;

  const review =
    state.currentSeasonReview ||
    buildFullSeasonReview(state, state.currentSeasonAwards);
  const offPlan = state.offSeasonPlan;

  const userRow = review.finalTable.find((r) => r.clubId === state.userClub?.id);
  const seasonGoalsScored = state.squad.reduce((s, p) => s + p.goals, 0);
  const seasonAssistsLogged = state.squad.reduce((s, p) => s + p.assists, 0);

  const mgrHistoryEntry = {
    seasonLabel: state.seasonLabel,
    clubName: state.userClub.name,
    leaguePosition: review.leaguePosition,
    trophies: review.trophiesWon,
    record: `${userRow?.won ?? 0}W-${userRow?.drawn ?? 0}D-${userRow?.lost ?? 0}L`,
    matches: userRow?.played ?? 0,
    wins: userRow?.won ?? 0,
    draws: userRow?.drawn ?? 0,
    losses: userRow?.lost ?? 0,
    goalsScored: seasonGoalsScored,
    assistsLogged: seasonAssistsLogged,
    grade: review.finalGrade,
    reputationEnd: state.manager.reputation,
  };

  const nextSeasonNum = state.seasonNumber + 1;
  const startYr = 2025 + nextSeasonNum;
  const nextSeasonLabel = `${startYr}/${String(startYr + 1).slice(-2)}`;

  const nextSquad = state.squad.map((p) => ({
    ...p,
    age: p.age + 1,
    contractYears: Math.max(1, p.contractYears - 1),
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
    status: 'Fit' as const,
    injuryReturnMatchday: undefined,
  }));

  let nextFixtures: Fixture[] = [
    ...buildPreSeasonFriendlies(state.userClub, state.clubs, nextSeasonNum),
  ];
  state.competitions.forEach((comp) => {
    if (comp.type === 'league') {
      nextFixtures.push(...generateRoundRobinLeagueFixtures(state.clubs, comp, state.userClub!.id));
    } else if (comp.type === 'cup') {
      nextFixtures.push(
        ...buildKnockoutQuarterFinals(state.clubs, comp, state.userClub!.id, 6, `s${nextSeasonNum}-cup`)
      );
    } else if (comp.type === 'continental') {
      const contClubs = state.clubs.slice(0, 8);
      nextFixtures.push(
        ...buildKnockoutQuarterFinals(contClubs, comp, state.userClub!.id, 8, `s${nextSeasonNum}-cont`)
      );
    }
  });

  const nextBudget = offPlan?.adjustedBudgetMillions ?? state.finances.transferBudgetMillions;
  const updatedClub: Club = {
    ...state.userClub,
    reputation: review.clubReputationEnd,
    objectives: offPlan?.newObjectives ?? state.userClub.objectives,
  };

  const newAchievements = [...state.manager.careerTotals.achievements];
  if (review.trophiesWon.length > 0) {
    review.trophiesWon.forEach((t) => {
      newAchievements.push(`${state.seasonLabel}: Won ${t} with ${state.userClub!.name}`);
    });
  }

  return {
    ...state,
    phase: 'pre-season',
    seasonNumber: nextSeasonNum,
    seasonLabel: nextSeasonLabel,
    currentMatchday: 1,
    transferWindowOpen: true,
    transferWindowSigningsCount: 0,
    userClub: updatedClub,
    clubs: state.clubs.map((c) => (c.id === updatedClub.id ? updatedClub : c)),
    manager: {
      ...state.manager,
      history: [mgrHistoryEntry, ...state.manager.history],
      careerTotals: {
        ...state.manager.careerTotals,
        seasonsCompleted: state.manager.careerTotals.seasonsCompleted + 1,
        trophies: [...state.manager.careerTotals.trophies, ...review.trophiesWon],
        achievements: newAchievements,
      },
    },
    fixtures: nextFixtures,
    squad: nextSquad,
    finances: {
      ...state.finances,
      startingBudgetMillions: nextBudget,
      transferBudgetMillions: nextBudget,
      transferSpendingMillions: 0,
      transferIncomeMillions: 0,
      prizeMoneyMillions: 0,
      matchdayBonusesMillions: 0,
    },
    ledger: [
      {
        id: `led-s${nextSeasonNum}-open`,
        matchday: 1,
        label: `${nextSeasonLabel} Off-Season Adjusted Budget`,
        category: 'Sponsorship',
        amountMillions: nextBudget,
        isSimulated: true,
      },
    ],
    news: [
      {
        id: `news-s${nextSeasonNum}`,
        matchday: 1,
        category: 'Mtaani Wire',
        headline: `${nextSeasonLabel} Pre-Season Underway — ${updatedClub.name} target new objectives`,
        summary: `Simulated Universe Media: Following a Grade ${review.finalGrade} (#${review.leaguePosition}) finish in ${state.seasonLabel}, pre-season friendlies begin.`,
        shengTake: `Buda Kamau: "Msimu mpya wa ${nextSeasonLabel} umeanza! Wasee wa ${updatedClub.shortName}, tufunge viatu twende kazi!"`,
        isSimulated: true,
      },
    ],
    seasonHistory: [review, ...state.seasonHistory],
    currentSeasonReview: null,
    offSeasonPlan: null,
    currentSeasonAwards: [],
    goalOfSeasonCandidates: [],
    lastCompletedFixtureId: null,
  };
}

export function getGroupForPosition(pos: PlayerPosition): PositionGroup {
  if (pos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(pos)) return 'DEF';
  if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(pos)) return 'MID';
  return 'FWD';
}

export function getTacticalAdvice(state: UniverseState): string {
  const next = getNextUserFixture(state);
  const recent = state.fixtures
    .filter((f) => f.isUserMatch && f.competitionType !== 'preseason' && f.status === 'played')
    .slice(-3);

  const userClub = state.userClub;
  if (!userClub) return 'Select a club to unlock tactical analysis.';

  if (recent.length === 0) {
    return `Maintain your ${state.tactics.formation} blueprint through the opening fixtures to build passing chemistry before making reactive changes.`;
  }

  let conceded = 0;
  let scored = 0;
  recent.forEach((f) => {
    const isH = f.homeClubId === userClub.id;
    scored += (isH ? f.homeScore : f.awayScore) ?? 0;
    conceded += (isH ? f.awayScore : f.homeScore) ?? 0;
  });

  if (conceded >= 5) {
    return `You have conceded ${conceded} goals across your last ${recent.length} matches. Consider dropping the Defensive Line to Balanced or Deep and anchoring a true DMF in front of the center-backs.`;
  }
  if (scored <= 2) {
    return `Goal output is tight (${scored} goals in last ${recent.length}). Consider widening wingers or pushing your AMF closer to the striker${next ? ` ahead of ${next.homeClubId === userClub.id ? next.awayClubName : next.homeClubName}` : ''}.`;
  }
  return `Tactical balance is strong (${scored} scored, ${conceded} conceded in last ${recent.length}). Keep continuity in your ${state.tactics.formation} system rather than over-tweaking.`;
}

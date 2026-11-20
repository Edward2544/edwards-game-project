import { Fixture, ShengCommentatorId, UniverseState } from '../types/universe';
import { Match3DConfig, Match3DRosterMember } from './types';

function pickSixFromSquad(state: UniverseState): Match3DRosterMember[] {
  const starters = state.tactics.startingXiIds
    .map((id) => state.squad.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const pool = starters.length >= 6 ? starters : state.squad;
  const gk = pool.find((p) => p.group === 'GK') || pool[0];
  const defs = pool.filter((p) => p.group === 'DEF' && p.id !== gk?.id).slice(0, 2);
  const mids = pool.filter((p) => p.group === 'MID' && p.id !== gk?.id).slice(0, 2);
  const fwds = pool.filter((p) => p.group === 'FWD' && p.id !== gk?.id).slice(0, 1);

  const selected = [gk, ...defs, ...mids, ...fwds].filter(Boolean);
  for (const p of pool) {
    if (selected.length >= 6) break;
    if (!selected.some((s) => s.id === p.id)) selected.push(p);
  }

  return selected.slice(0, 6).map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    rating: p.rating ?? 78,
  }));
}

function buildOpponentRoster(clubName: string, keyNames: string[], baseRep: number): Match3DRosterMember[] {
  const rating = Math.max(70, Math.min(90, baseRep - 2));
  const fallbackNames = [
    `${clubName.split(' ')[0]} Keeper`,
    'Ochieng',
    'Mensah',
    keyNames[0] || 'Karanja',
    keyNames[1] || 'Otieno',
    keyNames[2] || 'Wanyama',
  ];
  const roles = ['GK', 'CB', 'CB', 'CMF', 'AMF', 'CF'];
  return roles.map((pos, idx) => ({
    name: fallbackNames[idx] || `Player ${idx + 1}`,
    position: pos,
    rating,
  }));
}

export function buildMatch3DConfigFromFixture(
  state: UniverseState,
  fixture: Fixture,
  halfDurationSeconds = 75
): Match3DConfig {
  const homeClub = state.clubs.find((c) => c.id === fixture.homeClubId);
  const awayClub = state.clubs.find((c) => c.id === fixture.awayClubId);
  const isUserHome = fixture.homeClubId === state.userClub?.id;
  const oppClub = isUserHome ? awayClub : homeClub;

  const userRoster = pickSixFromSquad(state);
  const opponentRoster = buildOpponentRoster(
    oppClub?.shortName || (isUserHome ? fixture.awayClubName : fixture.homeClubName),
    oppClub?.keyPlayerNames || [],
    oppClub?.reputation || 78
  );

  return {
    fixtureId: fixture.id,
    competitionName: fixture.competitionName,
    roundLabel: fixture.roundLabel,
    stadium: fixture.stadium,
    homeClubName: fixture.homeClubName,
    homeShortName: homeClub?.shortName || fixture.homeClubName.slice(0, 3).toUpperCase(),
    homePrimaryColor: homeClub?.primaryColor || '#34d399',
    awayClubName: fixture.awayClubName,
    awayShortName: awayClub?.shortName || fixture.awayClubName.slice(0, 3).toUpperCase(),
    awayPrimaryColor: awayClub?.primaryColor || '#ef4444',
    isUserHome,
    isKnockout: fixture.competitionType === 'cup' || fixture.competitionType === 'continental',
    commentatorId: state.activeCommentator,
    halfDurationSeconds,
    userRoster,
    opponentRoster,
  };
}

export function buildQuickExhibition3DConfig(commentatorId: ShengCommentatorId): Match3DConfig {
  return {
    fixtureId: 'quick-exhibition-3d',
    competitionName: 'Mtaani 3D Street Cup',
    roundLabel: 'Exhibition Match',
    stadium: 'Nyayo Mtaani Arena',
    homeClubName: 'Mtaani All-Stars',
    homeShortName: 'MTA',
    homePrimaryColor: '#34d399',
    awayClubName: 'Nairobi United',
    awayShortName: 'NRB',
    awayPrimaryColor: '#ef4444',
    isUserHome: true,
    isKnockout: false,
    commentatorId,
    halfDurationSeconds: 60,
    userRoster: [
      { name: 'Matasi', position: 'GK', rating: 78 },
      { name: 'Omurwa', position: 'CB', rating: 79 },
      { name: 'Ouma', position: 'CB', rating: 79 },
      { name: 'Muguna', position: 'CMF', rating: 81 },
      { name: 'Bajaber', position: 'AMF', rating: 82 },
      { name: 'Olunga', position: 'CF', rating: 85 },
    ],
    opponentRoster: [
      { name: 'Odhiambo', position: 'GK', rating: 77 },
      { name: 'Njoroge', position: 'CB', rating: 78 },
      { name: 'Kiprop', position: 'CB', rating: 78 },
      { name: 'Wanjala', position: 'CMF', rating: 79 },
      { name: 'Kamau', position: 'AMF', rating: 80 },
      { name: 'Omondi', position: 'CF', rating: 81 },
    ],
  };
}

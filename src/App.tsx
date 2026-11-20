import { useEffect, useState } from 'react';
import { Fixture, MatchReport, ShengCommentatorId, UniverseState } from './types/universe';
import {
  beginRegularSeasonFromPreSeason,
  completeManagerSetup,
  createInitialUniverseState,
  enterOffSeasonStage,
  selectClubAndBuildUniverse,
  startNextSeasonFromOffSeason,
  submitUserMatchResult,
  UserMatchResultInput,
} from './engine/simulator';
import { OpeningStage } from './components/OpeningStage';
import { ClubSelectionStage } from './components/ClubSelectionStage';
import { ManagerSetupStage } from './components/ManagerSetupStage';
import { DashboardLayout } from './components/DashboardLayout';
import { CareerHubView } from './components/CareerHubView';
import { CompetitionsView } from './components/CompetitionsView';
import { SquadView } from './components/SquadView';
import { TacticsView } from './components/TacticsView';
import { TransfersFinancesView } from './components/TransfersFinancesView';
import { RivalriesStatsAwardsView } from './components/RivalriesStatsAwardsView';
import { MatchdayBriefingModal } from './components/MatchdayBriefingModal';
import { ReportMatchModal } from './components/ReportMatchModal';
import { CareerDashboardModal } from './components/CareerDashboardModal';
import { MatchScreen } from './components/MatchScreen';
import { PlayerCards } from './components/PlayerCards';
import {
  buildMatch3DConfigFromFixture,
  buildQuickExhibition3DConfig,
} from './game3d/buildMatchConfig';
import { Match3DCompletionPayload, Match3DConfig } from './game3d/types';
import { getNextUserFixture } from './engine/simulator';

const STORAGE_KEY = 'football_mtaani_universe_v1';

export default function App() {
  const [state, setState] = useState<UniverseState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UniverseState;
        if (parsed && parsed.phase) return parsed;
      }
    } catch {
      // Fallback to fresh universe
    }
    return createInitialUniverseState();
  });

  const [activeTab, setActiveTab] = useState<string>('hub');
  const [briefingFixture, setBriefingFixture] = useState<Fixture | null>(null);
  const [reportingFixture, setReportingFixture] = useState<Fixture | null>(null);
  const [active3DMatch, setActive3DMatch] = useState<{
    config: Match3DConfig;
    isQuickMatch: boolean;
  } | null>(null);
  const [showMasterDashboard, setShowMasterDashboard] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota issues
    }
  }, [state]);

  const handleExportSave = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `football-mtaani-${state.userClub?.shortName || 'career'}-${state.seasonLabel.replace('/', '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetCareer = () => {
    const fresh = createInitialUniverseState();
    setState(fresh);
    setActiveTab('hub');
    setBriefingFixture(null);
    setReportingFixture(null);
    setShowMasterDashboard(false);
  };

  const handleChangeCommentator = (id: ShengCommentatorId) => {
    setState((prev) => ({ ...prev, activeCommentator: id }));
  };

  const handleUpdateReport = (fixtureId: string, updated: MatchReport) => {
    setState((prev) => ({
      ...prev,
      fixtures: prev.fixtures.map((f) => (f.id === fixtureId ? { ...f, report: updated } : f)),
    }));
  };

  const handleSubmitMatch = (fixtureId: string, input: UserMatchResultInput) => {
    setState((prev) => {
      const next = submitUserMatchResult(prev, fixtureId, input);
      if (next.phase === 'season-end') {
        setActiveTab('awards');
      }
      return next;
    });
    setReportingFixture(null);
    setBriefingFixture(null);
  };

  const handleStartFixture3D = (fixture: Fixture) => {
    setBriefingFixture(null);
    setReportingFixture(null);
    setActive3DMatch({
      config: buildMatch3DConfigFromFixture(state, fixture),
      isQuickMatch: false,
    });
  };

  const handleSave3DResultToCareer = (payload: Match3DCompletionPayload) => {
    handleSubmitMatch(payload.fixtureId, payload.resultInput);
    setActive3DMatch(null);
  };

  const handleOpenMatchScreenNow = () => {
    const nextFix = getNextUserFixture(state);
    if (nextFix) {
      handleStartFixture3D(nextFix);
    } else {
      setActive3DMatch({
        config: buildQuickExhibition3DConfig(state.activeCommentator),
        isQuickMatch: true,
      });
    }
  };

  if (active3DMatch) {
    return (
      <MatchScreen
        config={active3DMatch.config}
        isQuickMatch={active3DMatch.isQuickMatch}
        onSaveToCareer={handleSave3DResultToCareer}
        onExit={() => setActive3DMatch(null)}
      />
    );
  }

  if (state.phase === 'opening') {
    return (
      <OpeningStage
        state={state}
        onUpdateNarrative={(narrative) => setState((prev) => ({ ...prev, openingDocNarrative: narrative }))}
        onChangeCommentator={handleChangeCommentator}
        onProceed={() => setState((prev) => ({ ...prev, phase: 'club-selection' }))}
        onPlayQuick3D={() =>
          setActive3DMatch({
            config: buildQuickExhibition3DConfig(state.activeCommentator),
            isQuickMatch: true,
          })
        }
        onImportState={(imported) => {
          setState(imported);
          setActiveTab('hub');
        }}
      />
    );
  }

  if (state.phase === 'club-selection') {
    return (
      <ClubSelectionStage
        onBack={() => setState((prev) => ({ ...prev, phase: 'opening' }))}
        onSelectClub={(club, customLeagueClubs, customSquad) =>
          setState((prev) => selectClubAndBuildUniverse(prev, club, customLeagueClubs, customSquad))
        }
      />
    );
  }

  if (state.phase === 'manager-setup' && state.userClub) {
    return (
      <ManagerSetupStage
        club={state.userClub}
        initialManager={state.manager}
        onBack={() => setState((prev) => ({ ...prev, phase: 'club-selection' }))}
        onComplete={(mgr) => {
          setState((prev) => completeManagerSetup(prev, mgr));
          setActiveTab('hub');
        }}
      />
    );
  }

  return (
    <DashboardLayout
      state={state}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenMatchScreen={handleOpenMatchScreenNow}
      onOpenMasterDashboard={() => setShowMasterDashboard(true)}
      onExportSave={handleExportSave}
      onResetCareer={handleResetCareer}
    >
      {activeTab === 'hub' && (
        <CareerHubView
          state={state}
          onOpenBriefing={(f) => setBriefingFixture(f)}
          onOpenReportMatch={(f) => setReportingFixture(f)}
          onPlay3DMatch={handleStartFixture3D}
          onSkipPreSeason={() => setState((prev) => beginRegularSeasonFromPreSeason(prev))}
          onChangeCommentator={handleChangeCommentator}
          onUpdateReport={handleUpdateReport}
          onAddPressHeadline={(headline, summary, confDelta) =>
            setState((prev) => ({
              ...prev,
              manager: {
                ...prev.manager,
                boardConfidence: Math.max(25, Math.min(99, prev.manager.boardConfidence + confDelta)),
              },
              news: [
                {
                  id: `news-pc-${Date.now()}`,
                  matchday: prev.currentMatchday,
                  category: 'Board & Press' as const,
                  headline,
                  summary,
                  isSimulated: true as const,
                },
                ...prev.news,
              ].slice(0, 24),
            }))
          }
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'competitions' && (
        <CompetitionsView
          state={state}
          onOpenBriefing={(f) => setBriefingFixture(f)}
          onOpenReportMatch={(f) => setReportingFixture(f)}
          onPlay3DMatch={handleStartFixture3D}
          onChangeCommentator={handleChangeCommentator}
          onUpdateReport={handleUpdateReport}
        />
      )}

      {activeTab === 'cards' && (
        <PlayerCards state={state} onUpdateState={setState} />
      )}

      {activeTab === 'squad' && (
        <SquadView
          state={state}
          onUpdateSquad={(squad) => setState((prev) => ({ ...prev, squad }))}
          onOpenPlayerCards={() => setActiveTab('cards')}
        />
      )}

      {activeTab === 'tactics' && (
        <TacticsView
          state={state}
          onUpdateTactics={(tactics) => setState((prev) => ({ ...prev, tactics }))}
        />
      )}

      {activeTab === 'transfers' && (
        <TransfersFinancesView state={state} onUpdateState={setState} />
      )}

      {activeTab === 'awards' && (
        <RivalriesStatsAwardsView
          state={state}
          defaultSubTab={state.phase === 'season-end' || state.phase === 'off-season' ? 'awards' : 'stats'}
          onEnterOffSeason={() => setState((prev) => enterOffSeasonStage(prev))}
          onStartNextSeason={() => {
            setState((prev) => startNextSeasonFromOffSeason(prev));
            setActiveTab('hub');
          }}
          onNavigateTab={setActiveTab}
        />
      )}

      {briefingFixture && (
        <MatchdayBriefingModal
          state={state}
          fixture={briefingFixture}
          onClose={() => setBriefingFixture(null)}
          onPlay3DMatch={() => handleStartFixture3D(briefingFixture)}
          onOpenReportMatch={() => {
            const target = briefingFixture;
            setBriefingFixture(null);
            setReportingFixture(target);
          }}
        />
      )}

      {reportingFixture && (
        <ReportMatchModal
          state={state}
          fixture={reportingFixture}
          onClose={() => setReportingFixture(null)}
          onSubmitResult={handleSubmitMatch}
        />
      )}

      {showMasterDashboard && (
        <CareerDashboardModal state={state} onClose={() => setShowMasterDashboard(false)} />
      )}
    </DashboardLayout>
  );
}

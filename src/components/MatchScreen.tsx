import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Swords,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { FootballMatch3DEngine } from '../game3d/FootballMatch3DEngine';
import {
  Match3DCommentaryEvent,
  Match3DCompletionPayload,
  Match3DConfig,
  Match3DHudSnapshot,
} from '../game3d/types';

interface MatchScreenProps {
  config: Match3DConfig;
  isQuickMatch?: boolean;
  onSaveToCareer?: (payload: Match3DCompletionPayload) => void;
  onExit: () => void;
}

const INITIAL_HUD: Match3DHudSnapshot = {
  homeScore: 0,
  awayScore: 0,
  matchMinute: 1,
  phase: 'kickoff',
  possessionUserPercent: 50,
  userShots: 0,
  userShotsOnTarget: 0,
  opponentShots: 0,
  opponentShotsOnTarget: 0,
  corners: 0,
  activePlayerName: 'Striker',
  activePlayerStamina: 100,
  userHasBall: false,
  shotCharge: 0,
  isPaused: false,
  cameraMode: 'broadcast',
};

export const MatchScreen: React.FC<MatchScreenProps> = ({
  config,
  isQuickMatch = false,
  onSaveToCareer,
  onExit,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FootballMatch3DEngine | null>(null);

  const [hud, setHud] = useState<Match3DHudSnapshot>(INITIAL_HUD);
  const [mentality, setMentality] = useState<'defensive' | 'balanced' | 'attacking'>('balanced');
  const [latestCommentary, setLatestCommentary] = useState<Match3DCommentaryEvent | null>(null);
  const [completionPayload, setCompletionPayload] = useState<Match3DCompletionPayload | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [matchKey, setMatchKey] = useState(0);

  // Virtual thumbstick UI state
  const stickZoneRef = useRef<HTMLDivElement | null>(null);
  const stickPointerId = useRef<number | null>(null);
  const [stickOffset, setStickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sprintHeld, setSprintHeld] = useState(false);

  const onMatchCompleteRef = useRef((payload: Match3DCompletionPayload) => {
    setCompletionPayload(payload);
  });

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    setCompletionPayload(null);
    setContextError(null);
    setHud(INITIAL_HUD);
    setMentality('balanced');
    setLatestCommentary(null);

    const engine = new FootballMatch3DEngine(mount, config, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onCommentary: (ev) => setLatestCommentary(ev),
      onMatchComplete: (payload) => onMatchCompleteRef.current(payload),
      onContextError: (msg) => setContextError(msg),
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [config, matchKey]);

  // Keyboard bindings for desktop & hybrid testing
  useEffect(() => {
    const pressed = new Set<string>();
    const syncDir = () => {
      let x = 0;
      let y = 0;
      if (pressed.has('KeyA') || pressed.has('ArrowLeft')) x -= 1;
      if (pressed.has('KeyD') || pressed.has('ArrowRight')) x += 1;
      if (pressed.has('KeyW') || pressed.has('ArrowUp')) y -= 1;
      if (pressed.has('KeyS') || pressed.has('ArrowDown')) y += 1;
      engineRef.current?.setJoystickInput(x, y);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      engineRef.current?.unlockAudio();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      pressed.add(e.code);
      if (e.code.startsWith('Arrow') || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        syncDir();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setSprintHeld(true);
        engineRef.current?.setSprint(true);
      } else if (e.code === 'KeyJ' || e.code === 'KeyZ') {
        engineRef.current?.triggerPass(false);
      } else if (e.code === 'KeyK' || e.code === 'KeyX') {
        engineRef.current?.triggerPass(true);
      } else if (e.code === 'Space') {
        engineRef.current?.startShootCharge();
      } else if (e.code === 'KeyE' || e.code === 'KeyQ') {
        engineRef.current?.triggerTackleOrSwitch();
      } else if (e.code === 'KeyC') {
        engineRef.current?.cycleCameraMode();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressed.delete(e.code);
      if (e.code.startsWith('Arrow') || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        syncDir();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setSprintHeld(false);
        engineRef.current?.setSprint(false);
      } else if (e.code === 'Space') {
        engineRef.current?.releaseShootCharge();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const updateStickFromPointer = (clientX: number, clientY: number) => {
    const zone = stickZoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.42;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setStickOffset({ x: dx, y: dy });
    engineRef.current?.setJoystickInput(dx / maxR, dy / maxR);
  };

  const handleStickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    engineRef.current?.unlockAudio();
    stickPointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateStickFromPointer(e.clientX, e.clientY);
  };

  const handleStickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointerId.current !== e.pointerId) return;
    updateStickFromPointer(e.clientX, e.clientY);
  };

  const handleStickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickPointerId.current !== e.pointerId) return;
    stickPointerId.current = null;
    setStickOffset({ x: 0, y: 0 });
    engineRef.current?.setJoystickInput(0, 0);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    engineRef.current?.setMuted(next);
  };

  const handleCycleMentality = () => {
    const order: ('defensive' | 'balanced' | 'attacking')[] = ['defensive', 'balanced', 'attacking'];
    const next = order[(order.indexOf(mentality) + 1) % order.length];
    setMentality(next);
    engineRef.current?.setTacticalMentality(next);
  };

  const cameraLabel =
    hud.cameraMode === 'broadcast'
      ? 'Broadcast'
      : hud.cameraMode === 'follow'
      ? 'Action'
      : 'Vertical';

  return (
    <div className="fixed inset-0 z-50 bg-[#09111d] select-none overflow-hidden">
      {/* Isolated Empty WebGL Canvas Mount — Live 3D Match View */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Broadcast HUD (Solid semi-opaque — zero backdrop-blur over WebGL) */}
      <div className="absolute top-0 inset-x-0 z-20 p-2 sm:p-3 flex items-start justify-between gap-2 pointer-events-none">
        {/* eFootball Blue Scorebug */}
        <div className="pointer-events-auto flex items-center bg-[#0B0F17]/94 border border-[#2E86FF]/35 rounded-lg overflow-hidden shadow-lg">
          <div className="px-2.5 sm:px-3.5 py-1.5 flex items-center gap-2 border-r border-white/10">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: config.homePrimaryColor }}
            />
            <span className="text-xs sm:text-sm font-bold font-display text-white tracking-wide">
              {config.homeShortName}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-[#121824] text-sm sm:text-base font-bold font-mono tabular-nums text-[#2E86FF]">
            {hud.homeScore} – {hud.awayScore}
          </div>
          <div className="px-2.5 sm:px-3.5 py-1.5 flex items-center gap-2 border-l border-white/10">
            <span className="text-xs sm:text-sm font-bold font-display text-white tracking-wide">
              {config.awayShortName}
            </span>
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: config.awayPrimaryColor }}
            />
          </div>
          <div className="px-2.5 sm:px-3 py-1.5 bg-[#2E86FF] text-white text-xs sm:text-sm font-bold font-mono tabular-nums">
            {hud.matchMinute}&apos;
          </div>
        </div>

        {/* Live Tactics / Camera / Mute / Pause / Exit */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={handleCycleMentality}
            className={`min-h-[40px] px-2.5 sm:px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              mentality === 'attacking'
                ? 'bg-rose-600/90 border-rose-400 text-white'
                : mentality === 'defensive'
                ? 'bg-[#2E86FF]/90 border-[#60A5FA] text-white'
                : 'bg-[#0B0F17]/92 border-white/15 text-slate-100'
            }`}
            title="Live Team Mentality"
          >
            {mentality === 'attacking' ? (
              <Swords className="w-3.5 h-3.5" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-[#2E86FF]" />
            )}
            <span className="uppercase">{mentality === 'attacking' ? 'ATK' : mentality === 'defensive' ? 'DEF' : 'BAL'}</span>
          </button>
          <button
            onClick={() => engineRef.current?.cycleCameraMode()}
            className="min-h-[40px] px-2.5 sm:px-3 rounded-lg bg-[#0B0F17]/92 border border-white/15 text-xs font-medium text-slate-100 flex items-center gap-1.5 hover:bg-[#161f30]"
            title="Switch Camera (C)"
          >
            <Camera className="w-3.5 h-3.5 text-[#2E86FF]" />
            <span className="hidden sm:inline">{cameraLabel}</span>
          </button>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#0B0F17]/92 border border-white/15 text-slate-100 hover:bg-[#161f30]"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#2E86FF]" />}
          </button>
          <button
            onClick={() => engineRef.current?.setPaused(!hud.isPaused)}
            aria-label={hud.isPaused ? 'Resume match' : 'Pause match'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#0B0F17]/92 border border-white/15 text-slate-100 hover:bg-[#161f30]"
          >
            {hud.isPaused ? <Play className="w-4 h-4 text-[#2E86FF]" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={onExit}
            aria-label="Exit Match Screen"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#0B0F17]/92 border border-white/15 text-rose-300 hover:bg-rose-500/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Sheng / Swahili Commentary Ticker */}
      {latestCommentary && hud.phase !== 'fulltime' && (
        <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-lg pointer-events-none">
          <div
            className={`px-3.5 py-2 rounded-lg border text-xs flex items-center gap-2 shadow-md ${
              latestCommentary.tone === 'goal'
                ? 'bg-[#0C1D3A]/95 border-[#2E86FF] text-white'
                : latestCommentary.tone === 'save' || latestCommentary.tone === 'woodwork'
                ? 'bg-amber-950/95 border-amber-400 text-amber-100'
                : 'bg-[#0B0F17]/92 border-white/15 text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#2E86FF] shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-[#529BFF]">{latestCommentary.speaker}:</span>{' '}
              <span>{latestCommentary.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Goal Celebration Overlay */}
      {hud.phase === 'goal-celebration' && hud.goalBanner && (
        <div className="absolute inset-x-0 top-1/3 -translate-y-1/2 z-20 flex justify-center px-4 pointer-events-none">
          <div
            className={`px-6 py-4 rounded-xl border-2 text-center shadow-2xl ${
              hud.goalBanner.isUserGoal
                ? 'bg-[#0B0F17]/95 border-[#2E86FF]'
                : 'bg-[#0B0F17]/95 border-rose-400'
            }`}
          >
            <div
              className={`text-xs font-bold uppercase tracking-widest ${
                hud.goalBanner.isUserGoal ? 'text-[#2E86FF]' : 'text-rose-400'
              }`}
            >
              GOOOAAAL · {hud.goalBanner.minute}&apos; · {hud.goalBanner.teamName}
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-display text-white mt-1">
              {hud.goalBanner.scorerName}
            </div>
            {hud.goalBanner.assistName && (
              <div className="text-xs text-slate-300 mt-1">
                Assist: {hud.goalBanner.assistName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Player Nameplate + Stamina + Shot Meter above controls */}
      {hud.phase !== 'fulltime' && !hud.isPaused && (
        <div className="absolute bottom-36 sm:bottom-40 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5">
          {hud.shotCharge > 0.02 && (
            <div className="w-36 h-2.5 rounded-full bg-[#0B0F17]/95 border border-white/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2E86FF] via-amber-400 to-rose-500"
                style={{ width: `${Math.round(hud.shotCharge * 100)}%` }}
              />
            </div>
          )}
          <div className="px-3 py-1 rounded-md bg-[#0B0F17]/92 border border-white/15 flex items-center gap-2.5 text-[11px]">
            <span className="font-semibold text-white">{hud.activePlayerName}</span>
            <div className="w-14 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-[#2E86FF]"
                style={{ width: `${hud.activePlayerStamina}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Touch Gamepad Controls (Bottom Thumb Zones, touch-action: none) */}
      {hud.phase !== 'fulltime' && hud.phase !== 'halftime' && !hud.isPaused && (
        <div className="absolute bottom-0 inset-x-0 z-20 px-4 pb-5 sm:px-8 sm:pb-6 flex items-end justify-between pointer-events-none">
          {/* Left Thumb: Virtual Analog Joystick */}
          <div
            ref={stickZoneRef}
            onPointerDown={handleStickDown}
            onPointerMove={handleStickMove}
            onPointerUp={handleStickUp}
            onPointerCancel={handleStickUp}
            style={{ touchAction: 'none' }}
            className="pointer-events-auto relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#0B0F17]/75 border-2 border-[#2E86FF]/45 flex items-center justify-center"
            aria-label="Virtual movement joystick"
          >
            <div className="w-16 h-16 rounded-full border border-white/15" />
            <div
              className="absolute w-14 h-14 rounded-full bg-[#2E86FF]/95 border-2 border-white shadow-lg"
              style={{
                transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`,
              }}
            />
          </div>

          {/* Desktop hint in center bottom */}
          <div className="hidden lg:block pb-2 text-[11px] text-slate-300/85 bg-[#0B0F17]/85 px-3 py-1.5 rounded-lg border border-white/10">
            WASD/Arrows: Move · Shift: Sprint · J: Pass · K: Lob · Space: Shoot · E: Tackle/Switch · C: Cam
          </div>

          {/* Right Thumb: Ergonomic Action Cluster */}
          <div
            style={{ touchAction: 'none' }}
            className="pointer-events-auto grid grid-cols-2 gap-2.5 items-end"
          >
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                engineRef.current?.triggerPass(true);
              }}
              className="w-14 h-14 rounded-full bg-[#121824]/95 border-2 border-amber-400/75 text-amber-300 text-[11px] font-bold active:scale-95 flex items-center justify-center shadow-lg"
            >
              LOB
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                engineRef.current?.unlockAudio();
                setSprintHeld(true);
                engineRef.current?.setSprint(true);
              }}
              onPointerUp={() => {
                setSprintHeld(false);
                engineRef.current?.setSprint(false);
              }}
              onPointerCancel={() => {
                setSprintHeld(false);
                engineRef.current?.setSprint(false);
              }}
              className={`w-14 h-14 rounded-full border-2 text-[11px] font-bold active:scale-95 flex items-center justify-center shadow-lg ${
                sprintHeld
                  ? 'bg-[#2E86FF] border-white text-white'
                  : 'bg-[#121824]/95 border-slate-400/60 text-slate-200'
              }`}
            >
              SPRINT
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                if (hud.userHasBall) {
                  engineRef.current?.triggerPass(false);
                } else {
                  engineRef.current?.triggerSwitchPlayer();
                }
              }}
              className="w-16 h-16 rounded-full bg-[#0f172a]/95 border-2 border-sky-400 text-sky-300 text-xs font-bold active:scale-95 flex items-center justify-center shadow-lg"
            >
              {hud.userHasBall ? 'PASS' : 'SWITCH'}
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                engineRef.current?.startShootCharge();
              }}
              onPointerUp={() => engineRef.current?.releaseShootCharge()}
              onPointerCancel={() => engineRef.current?.releaseShootCharge()}
              className="w-[72px] h-[72px] rounded-full bg-[#2E86FF] border-2 border-white text-white text-xs font-extrabold active:scale-95 flex items-center justify-center shadow-xl"
            >
              {hud.userHasBall ? 'SHOOT' : 'TACKLE'}
            </button>
          </div>
        </div>
      )}

      {/* Half-Time Modal */}
      {hud.phase === 'halftime' && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-[#121824] border border-[#2E86FF]/35 p-6 space-y-4 text-center">
            <div className="text-xs font-semibold text-[#2E86FF] uppercase tracking-wider">
              Half-Time · {config.competitionName}
            </div>
            <h3 className="text-3xl font-bold font-display text-white">
              {config.homeShortName} {hud.homeScore} – {hud.awayScore} {config.awayShortName}
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs bg-[#0B0F17] p-3 rounded-lg border border-white/10">
              <div>
                <div className="text-slate-400">Possession</div>
                <div className="font-mono font-bold text-white mt-0.5">{hud.possessionUserPercent}%</div>
              </div>
              <div>
                <div className="text-slate-400">Your Shots</div>
                <div className="font-mono font-bold text-[#2E86FF] mt-0.5">
                  {hud.userShots} ({hud.userShotsOnTarget})
                </div>
              </div>
              <div>
                <div className="text-slate-400">Opp Shots</div>
                <div className="font-mono font-bold text-slate-200 mt-0.5">
                  {hud.opponentShots} ({hud.opponentShotsOnTarget})
                </div>
              </div>
            </div>
            <button
              onClick={() => engineRef.current?.resumeFromHalftime()}
              className="w-full py-3 rounded-lg bg-[#2E86FF] text-white font-semibold text-sm hover:bg-[#529BFF]"
            >
              Kick Off Second Half
            </button>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {hud.isPaused && hud.phase !== 'fulltime' && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#121824] border border-[#2E86FF]/35 p-6 space-y-3 text-center">
            <h3 className="text-2xl font-bold font-display text-white">Match Paused</h3>
            <p className="text-xs text-slate-400">
              {config.homeClubName} {hud.homeScore} – {hud.awayScore} {config.awayClubName} ({hud.matchMinute}&apos;)
            </p>
            <button
              onClick={() => engineRef.current?.setPaused(false)}
              className="w-full py-3 rounded-lg bg-[#2E86FF] text-white font-semibold text-sm hover:bg-[#529BFF]"
            >
              Resume Match
            </button>
            <button
              onClick={() => setMatchKey((k) => k + 1)}
              className="w-full py-2.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/15"
            >
              Restart 3D Match
            </button>
            <button
              onClick={onExit}
              className="w-full py-2.5 rounded-lg bg-rose-500/15 text-rose-300 text-xs font-medium hover:bg-rose-500/25"
            >
              Quit to Career Hub
            </button>
          </div>
        </div>
      )}

      {/* Full-Time Completion Modal */}
      {hud.phase === 'fulltime' && completionPayload && (
        <div className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl bg-[#121824] border border-[#2E86FF]/40 p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="text-xs font-semibold text-[#2E86FF] uppercase tracking-wider">
                Full-Time · {config.competitionName}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
                {config.homeShortName} {completionPayload.resultInput.homeScore} –{' '}
                {completionPayload.resultInput.awayScore} {config.awayShortName}
              </h2>
              {completionPayload.resultInput.penaltiesScore && (
                <div className="text-xs font-mono text-amber-300">
                  Penalties: {completionPayload.resultInput.penaltiesScore}
                </div>
              )}
              <div className="text-xs text-slate-400">
                MOTM: <span className="text-amber-300 font-semibold">{completionPayload.resultInput.motmPlayerName}</span>
              </div>
            </div>

            <div className="space-y-1.5 bg-[#0B0F17] border border-white/10 rounded-lg p-4 text-xs text-slate-300">
              {completionPayload.summaryHighlights.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {!isQuickMatch && onSaveToCareer ? (
                <button
                  onClick={() => onSaveToCareer(completionPayload)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#2E86FF] text-white font-semibold text-sm hover:bg-[#529BFF]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Result to Career Universe</span>
                </button>
              ) : (
                <button
                  onClick={onExit}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#2E86FF] text-white font-semibold text-sm hover:bg-[#529BFF]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Continue Career Setup</span>
                </button>
              )}
              <button
                onClick={() => setMatchKey((k) => k + 1)}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/15"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Rematch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WebGL Error Fallback */}
      {contextError && (
        <div className="absolute inset-0 z-40 bg-[#0B0F17] flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl bg-[#121824] border border-white/15 p-6 text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Match Screen 3D Unavailable</h3>
            <p className="text-xs text-slate-300">{contextError}</p>
            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-lg bg-[#2E86FF] text-white text-xs font-semibold"
            >
              Return to Career Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

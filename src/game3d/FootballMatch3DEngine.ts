import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createFootballerModel,
  createGoalModel,
  createSoccerBall,
  createStadiumEnvironment,
  PITCH_DIMS,
  PlayerVisualRig,
} from './models';
import {
  createAdBoardTexture,
  createCrowdTexture,
  createPitchTexture,
  createSoccerBallTexture,
} from './textures';
import { MatchAudioEngine } from './audio';
import {
  Match3DCameraMode,
  Match3DCommentaryEvent,
  Match3DCompletionPayload,
  Match3DConfig,
  Match3DHudSnapshot,
  Match3DRosterMember,
} from './types';
import { MatchEventCard, MatchEventGoal } from '../types/universe';
import { getCommentatorName } from '../engine/simulator';

interface SimPlayer {
  id: string;
  rosterId?: string;
  name: string;
  team: 'user' | 'opponent';
  role: 'GK' | 'DEF' | 'MID' | 'FWD';
  rating: number;
  homePos: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  facingAngle: number;
  stamina: number;
  stridePhase: number;
  kickAnimTimer: number;
  tackleTimer: number;
  stealCooldown: number;
  rig: PlayerVisualRig;
}

export interface MatchEngineCallbacks {
  onHudUpdate: (snapshot: Match3DHudSnapshot) => void;
  onCommentary: (event: Match3DCommentaryEvent) => void;
  onMatchComplete: (payload: Match3DCompletionPayload) => void;
  onContextError: (message: string) => void;
}

// Pre-allocated scratch vectors to eliminate per-frame GC allocations
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _ballSpinAxis = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);

const SKIN_TONES = ['#8d5524', '#c68642', '#5c3818', '#e0ac69', '#4a2b12', '#f1c27d'];

export class FootballMatch3DEngine {
  private container: HTMLElement;
  private config: Match3DConfig;
  private callbacks: MatchEngineCallbacks;
  private audio = new MatchAudioEngine();

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private envRenderTarget: THREE.WebGLRenderTarget | null = null;
  private isSoftwareGl = false;

  private players: SimPlayer[] = [];
  private ballMesh!: THREE.Mesh;
  private ballShadow!: THREE.Mesh;
  private ballPos = new THREE.Vector3(0, 0.24, 0);
  private ballVel = new THREE.Vector3(0, 0, 0);
  private ballCarrier: SimPlayer | null = null;
  private lastTouchPlayer: SimPlayer | null = null;
  private previousUserTouch: { id?: string; name: string } | null = null;
  private activeUserPlayer!: SimPlayer;
  private passPreviewTarget: SimPlayer | null = null;

  // Input state
  private inputX = 0;
  private inputY = 0;
  private sprintActive = false;
  private chargingShot = false;
  private shotCharge = 0;
  private cameraMode: Match3DCameraMode = 'broadcast';
  private tacticalMentality: 'defensive' | 'balanced' | 'attacking' = 'balanced';

  // Match clock & scoring state
  private phase: Match3DHudSnapshot['phase'] = 'kickoff';
  private halfElapsed = 0;
  private currentHalf: 1 | 2 = 1;
  private homeScore = 0;
  private awayScore = 0;
  private goals: MatchEventGoal[] = [];
  private cards: MatchEventCard[] = [];
  private userShots = 0;
  private userShotsOnTarget = 0;
  private opponentShots = 0;
  private opponentShotsOnTarget = 0;
  private corners = 0;
  private userPossessionTicks = 1;
  private totalPossessionTicks = 2;
  private playerMatchContributions = new Map<string, number>();

  private statePauseTimer = 0.8;
  private isPaused = false;
  private hudEmitAccum = 0;
  private lastFrameTime = 0;
  private rafId: number | null = null;
  private softwareTimerId: number | null = null;
  private disposed = false;
  private contextLost = false;
  private completionSent = false;
  private goalBanner: Match3DHudSnapshot['goalBanner'] | undefined;
  private commentatorName: string;
  private disposables: { dispose: () => void }[] = [];

  constructor(container: HTMLElement, config: Match3DConfig, callbacks: MatchEngineCallbacks) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
    this.commentatorName = getCommentatorName(config.commentatorId);
    this.initScene();
    this.startLoop();
  }

  private initScene() {
    const width = Math.max(320, this.container.clientWidth || window.innerWidth);
    const height = Math.max(240, this.container.clientHeight || window.innerHeight);

    let renderer: THREE.WebGLRenderer;
    try {
      // Probe software WebGL renderer before locking final antialias/pixelRatio settings
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      this.callbacks.onContextError('WebGL is unavailable on this device.');
      return;
    }

    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuName = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : '';
    this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);

    if (this.isSoftwareGl) {
      renderer.dispose();
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'default',
      });
    }

    this.renderer = renderer;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x09111d);
    this.scene.fog = new THREE.FogExp2(0x09111d, 0.0082);

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.5, 260);
    this.camera.position.set(0, 23, 32);
    this.camera.lookAt(0, 0, 0);

    // RoomEnvironment IBL on all devices
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Stadium Lighting: Warm floodlight key + cool sky/turf hemisphere + opposing fill
    const hemi = new THREE.HemisphereLight(0x9bc4ff, 0x193622, 0.72);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1db, 2.15);
    keyLight.position.set(-22, 36, 24);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 5;
      keyLight.shadow.camera.far = 110;
      keyLight.shadow.camera.left = -42;
      keyLight.shadow.camera.right = 42;
      keyLight.shadow.camera.top = 34;
      keyLight.shadow.camera.bottom = -34;
      keyLight.shadow.bias = -0.0005;
    }
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.65);
    fillLight.position.set(28, 22, -26);
    this.scene.add(fillLight);

    // Textures & Stadium Environment
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const pitchTex = createPitchTexture(maxAniso);
    const ballTex = createSoccerBallTexture();
    const adBoardTex = createAdBoardTexture(this.config.homeShortName, this.config.awayShortName);
    const crowdTex = createCrowdTexture();
    this.disposables.push(pitchTex, ballTex, adBoardTex, crowdTex);

    const stadium = createStadiumEnvironment({ pitchTex, adBoardTex, crowdTex });
    this.scene.add(stadium);

    // Left (-X) Goal and Right (+X) Goal
    const leftGoal = createGoalModel();
    leftGoal.position.set(-PITCH_DIMS.length / 2, 0, 0);
    leftGoal.rotation.y = Math.PI;
    this.scene.add(leftGoal);

    const rightGoal = createGoalModel();
    rightGoal.position.set(PITCH_DIMS.length / 2, 0, 0);
    this.scene.add(rightGoal);

    // Soccer Ball
    const ball = createSoccerBall(ballTex);
    this.ballMesh = ball.mesh;
    this.ballShadow = ball.shadow;
    this.scene.add(ball.group);

    // Build 6v6 Teams (User always defends -X and attacks +X for intuitive mobile controls)
    this.spawnTeams();
    this.resetKickoffPositions('user');

    window.addEventListener('resize', this.handleResize);
    this.emitCommentary(
      0,
      `Karibu uwanjani ${this.config.stadium}! ${this.config.homeClubName} vs ${this.config.awayClubName}—filimbi ya kwanza inakaribia!`,
      'whistle'
    );
    this.emitHud();
  }

  private spawnTeams() {
    const userPrimary = this.config.isUserHome
      ? this.config.homePrimaryColor
      : this.config.awayPrimaryColor;
    let oppPrimary = this.config.isUserHome
      ? this.config.awayPrimaryColor
      : this.config.homePrimaryColor;

    // Ensure clear kit color separation if both clubs share similar hues
    if (userPrimary.toLowerCase() === oppPrimary.toLowerCase()) {
      oppPrimary = userPrimary.toLowerCase() === '#ef4444' ? '#38bdf8' : '#ef4444';
    }

    const userSlots: { role: SimPlayer['role']; x: number; z: number }[] = [
      { role: 'GK', x: -31.5, z: 0 },
      { role: 'DEF', x: -20, z: -8 },
      { role: 'DEF', x: -20, z: 8 },
      { role: 'MID', x: -9, z: -9.5 },
      { role: 'MID', x: -9, z: 9.5 },
      { role: 'FWD', x: -2.2, z: 0 },
    ];

    const oppSlots: { role: SimPlayer['role']; x: number; z: number }[] = [
      { role: 'GK', x: 31.5, z: 0 },
      { role: 'DEF', x: 20, z: -8 },
      { role: 'DEF', x: 20, z: 8 },
      { role: 'MID', x: 10, z: -9.5 },
      { role: 'MID', x: 10, z: 9.5 },
      { role: 'FWD', x: 3.5, z: 0 },
    ];

    const createRosterPlayer = (
      team: 'user' | 'opponent',
      idx: number,
      slot: { role: SimPlayer['role']; x: number; z: number },
      member: Match3DRosterMember | undefined
    ): SimPlayer => {
      const isGoalie = slot.role === 'GK';
      const jersey = isGoalie
        ? team === 'user'
          ? '#eab308'
          : '#a855f7'
        : team === 'user'
        ? userPrimary
        : oppPrimary;

      const rig = createFootballerModel({
        jerseyColor: jersey,
        shortsColor: team === 'user' ? '#0f172a' : '#f8fafc',
        skinTone: SKIN_TONES[(idx + (team === 'user' ? 0 : 3)) % SKIN_TONES.length],
        isGoalie,
      });

      this.scene.add(rig.root);
      const name = member?.name || (team === 'user' ? `Mtaani #${idx + 1}` : `Rival #${idx + 1}`);
      return {
        id: `${team}-${idx}`,
        rosterId: member?.id,
        name,
        team,
        role: slot.role,
        rating: member?.rating || 76,
        homePos: new THREE.Vector3(slot.x, 0, slot.z),
        pos: new THREE.Vector3(slot.x, 0, slot.z),
        vel: new THREE.Vector3(),
        facingAngle: team === 'user' ? Math.PI / 2 : -Math.PI / 2,
        stamina: 100,
        stridePhase: idx * 0.9,
        kickAnimTimer: 0,
        tackleTimer: 0,
        stealCooldown: 0,
        rig,
      };
    };

    userSlots.forEach((slot, idx) => {
      const p = createRosterPlayer('user', idx, slot, this.config.userRoster[idx]);
      this.players.push(p);
    });
    oppSlots.forEach((slot, idx) => {
      const p = createRosterPlayer('opponent', idx, slot, this.config.opponentRoster[idx]);
      this.players.push(p);
    });

    // Default active player is the user striker
    this.activeUserPlayer =
      this.players.find((p) => p.team === 'user' && p.role === 'FWD') || this.players[5];
    this.activeUserPlayer.rig.controlRing.visible = true;
  }

  private resetKickoffPositions(kickoffTeam: 'user' | 'opponent') {
    this.ballPos.set(0, 0.24, 0);
    this.ballVel.set(0, 0, 0);
    this.ballCarrier = null;
    this.goalBanner = undefined;

    for (const p of this.players) {
      p.pos.copy(p.homePos);
      if (p.role === 'FWD') {
        p.pos.x = p.team === kickoffTeam ? (p.team === 'user' ? -0.9 : 0.9) : p.team === 'user' ? -5.5 : 5.5;
      }
      p.vel.set(0, 0, 0);
      p.facingAngle = p.team === 'user' ? Math.PI / 2 : -Math.PI / 2;
      p.rig.root.position.copy(p.pos);
      p.rig.root.rotation.y = p.facingAngle;
    }

    const fwd = this.players.find((p) => p.team === 'user' && p.role === 'FWD');
    if (fwd) this.setActiveUserPlayer(fwd);
  }

  private setActiveUserPlayer(player: SimPlayer) {
    if (this.activeUserPlayer) {
      this.activeUserPlayer.rig.controlRing.visible = false;
    }
    this.activeUserPlayer = player;
    this.activeUserPlayer.rig.controlRing.visible = true;
  }

  // Public Input API called by React Touch Controls & Keyboard
  public setJoystickInput(x: number, y: number) {
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      this.inputX = x / mag;
      this.inputY = y / mag;
    } else {
      this.inputX = x;
      this.inputY = y;
    }
  }

  public setSprint(active: boolean) {
    this.sprintActive = active;
  }

  public unlockAudio() {
    this.audio.unlock();
  }

  public setMuted(muted: boolean) {
    this.audio.setMuted(muted);
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.emitHud();
  }

  public setTacticalMentality(mentality: 'defensive' | 'balanced' | 'attacking') {
    this.tacticalMentality = mentality;
    this.emitCommentary(
      this.getCurrentMinute(),
      mentality === 'attacking'
        ? 'Kocha ametoa amri: SHAMBULIA! Kila mtu mbele!'
        : mentality === 'defensive'
        ? 'Kocha anafunga milango—ulinzi kwanza!'
        : 'Mfumo umerejea kuwa sawa uwanjani.',
      'normal'
    );
  }

  public cycleCameraMode(): Match3DCameraMode {
    const order: Match3DCameraMode[] = ['broadcast', 'follow', 'vertical'];
    const next = order[(order.indexOf(this.cameraMode) + 1) % order.length];
    this.cameraMode = next;
    this.emitHud();
    return next;
  }

  public triggerPass(lofted = false) {
    this.audio.unlock();
    if (this.isPaused || this.phase === 'fulltime' || this.phase === 'halftime') return;

    const carrier = this.ballCarrier;
    if (!carrier || carrier.team !== 'user') {
      // Pressing pass without ball switches to nearest defender
      this.triggerSwitchPlayer();
      return;
    }

    const target = this.findBestPassTarget(carrier);
    if (!target) return;

    this.previousUserTouch = { id: carrier.rosterId, name: carrier.name };
    this.lastTouchPlayer = carrier;
    this.ballCarrier = null;
    carrier.stealCooldown = 0.35;
    carrier.kickAnimTimer = 0.25;

    // Lead target slightly by velocity
    const leadX = target.pos.x + target.vel.x * 0.25 + (lofted ? 3.5 : 0);
    const leadZ = target.pos.z + target.vel.z * 0.25;
    const dx = leadX - this.ballPos.x;
    const dz = leadZ - this.ballPos.z;
    const dist = Math.max(1, Math.hypot(dx, dz));
    const speed = THREE.MathUtils.clamp(16 + dist * 0.55, 16, 29);

    this.ballVel.set((dx / dist) * speed, lofted ? 5.8 : 1.1, (dz / dist) * speed);
    this.audio.playKick(lofted ? 0.72 : 0.48);
    this.setActiveUserPlayer(target);
  }

  public startShootCharge() {
    this.audio.unlock();
    if (this.isPaused || this.phase === 'fulltime' || this.phase === 'halftime') return;
    if (this.ballCarrier?.team === 'user') {
      this.chargingShot = true;
      this.shotCharge = 0.28;
    } else {
      this.triggerTackleOrSwitch();
    }
  }

  public releaseShootCharge() {
    if (!this.chargingShot) return;
    this.chargingShot = false;
    const power = Math.max(0.42, this.shotCharge);
    this.shotCharge = 0;

    const carrier = this.ballCarrier;
    if (!carrier || carrier.team !== 'user') return;

    this.previousUserTouch = { id: carrier.rosterId, name: carrier.name };
    this.lastTouchPlayer = carrier;
    this.ballCarrier = null;
    carrier.stealCooldown = 0.4;
    carrier.kickAnimTimer = 0.32;

    const goalX = PITCH_DIMS.length / 2 + 0.5;
    // Allow user to steer shot left/right corner with vertical/horizontal input
    const aimOffsetZ = THREE.MathUtils.clamp(
      this.cameraMode === 'broadcast' ? this.inputY * 3.1 : this.inputX * 3.1,
      -3.15,
      3.15
    );
    const dx = goalX - this.ballPos.x;
    const dz = aimOffsetZ - this.ballPos.z;
    const dist = Math.max(1, Math.hypot(dx, dz));

    const shotSpeed = 24 + power * 15;
    this.ballVel.set((dx / dist) * shotSpeed, 1.8 + power * 4.4, (dz / dist) * shotSpeed);
    this.userShots += 1;
    if (Math.abs(aimOffsetZ) <= PITCH_DIMS.goalWidth / 2) {
      this.userShotsOnTarget += 1;
    }
    this.audio.playKick(0.95);
    this.addContribution(carrier.name, 0.3);

    if (dist < 26) {
      this.emitCommentary(
        this.getCurrentMinute(),
        `${carrier.name} anapiga kombora kali! Angalia langoni!`,
        'normal'
      );
    }
  }

  public triggerTackleOrSwitch() {
    this.audio.unlock();
    if (this.isPaused || this.phase === 'fulltime' || this.phase === 'halftime') return;

    if (this.ballCarrier?.team === 'user') {
      // Quick through-ball if already on the ball
      this.triggerPass(true);
      return;
    }

    const active = this.activeUserPlayer;
    const distToBall = active.pos.distanceTo(this.ballPos);
    if (distToBall < 3.4 && active.tackleTimer <= 0) {
      active.tackleTimer = 0.28;
      active.kickAnimTimer = 0.28;
      // Lunge toward ball
      _v1.subVectors(this.ballPos, active.pos).setY(0).normalize();
      active.vel.copy(_v1).multiplyScalar(14.5);
      active.facingAngle = Math.atan2(_v1.x, _v1.z);

      // Small chance of tactical yellow card if tackling hard from behind
      if (this.ballCarrier && Math.random() < 0.08 && this.cards.length < 4) {
        const min = this.getCurrentMinute();
        this.cards.push({
          playerId: active.rosterId,
          playerName: active.name,
          type: 'yellow',
          minute: min,
        });
        this.audio.playWhistle(1);
        this.emitCommentary(
          min,
          `Refa ametoa kadi ya njano kwa ${active.name}! Tackling kali sana mtaani!`,
          'card'
        );
      }
      return;
    }

    this.triggerSwitchPlayer();
  }

  public triggerSwitchPlayer() {
    const candidates = this.players.filter(
      (p) => p.team === 'user' && p.role !== 'GK' && p !== this.activeUserPlayer
    );
    if (candidates.length === 0) return;

    candidates.sort((a, b) => a.pos.distanceToSquared(this.ballPos) - b.pos.distanceToSquared(this.ballPos));
    this.setActiveUserPlayer(candidates[0]);
  }

  public resumeFromHalftime() {
    if (this.phase !== 'halftime') return;
    this.currentHalf = 2;
    this.halfElapsed = 0;
    this.phase = 'second-half';
    this.resetKickoffPositions('opponent');
    this.audio.playWhistle(1);
    this.emitCommentary(46, 'Kipindi cha pili kimeanza! Tupige boli safi dakika arobaini na tano za mwisho!', 'whistle');
    this.emitHud();
  }

  // Main Animation Loop (GPU rAF vs SoftwareGL afterDraw fenceSync + 80ms pause)
  private startLoop() {
    this.lastFrameTime = performance.now();
    const tick = () => {
      if (this.disposed || this.contextLost) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000));
      this.lastFrameTime = now;

      if (!this.isPaused) {
        this.stepSimulation(dt);
      }
      this.updateCamera(dt);
      this.renderer.render(this.scene, this.camera);

      this.hudEmitAccum += dt;
      if (this.hudEmitAccum >= 0.08) {
        this.hudEmitAccum = 0;
        this.emitHud();
      }

      this.scheduleNextTick(tick);
    };
    this.scheduleNextTick(tick);
  }

  private scheduleNextTick(tick: () => void) {
    if (this.disposed || this.contextLost) return;
    if (this.isSoftwareGl) {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const canFence = typeof gl.fenceSync === 'function';
      if (canFence) {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const pollSync = () => {
          if (this.disposed || this.contextLost) return;
          if (!sync) {
            this.softwareTimerId = window.setTimeout(tick, 80);
            return;
          }
          const status = gl.clientWaitSync(sync, 0, 0);
          if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
            gl.deleteSync(sync);
            this.softwareTimerId = window.setTimeout(tick, 80);
          } else {
            this.softwareTimerId = window.setTimeout(pollSync, 16);
          }
        };
        this.softwareTimerId = window.setTimeout(pollSync, 16);
      } else {
        this.softwareTimerId = window.setTimeout(tick, 80);
      }
    } else {
      this.rafId = window.requestAnimationFrame(tick);
    }
  }

  private stepSimulation(dt: number) {
    if (this.phase === 'fulltime' || this.phase === 'halftime') return;

    if (this.phase === 'kickoff') {
      this.statePauseTimer -= dt;
      if (this.statePauseTimer <= 0) {
        this.phase = this.currentHalf === 1 ? 'first-half' : 'second-half';
        this.audio.playWhistle(1);
      }
      return;
    }

    if (this.phase === 'goal-celebration') {
      this.statePauseTimer -= dt;
      this.stepBallPhysics(dt);
      if (this.statePauseTimer <= 0) {
        const kickoffSide = this.goalBanner?.isUserGoal ? 'opponent' : 'user';
        this.phase = this.currentHalf === 1 ? 'first-half' : 'second-half';
        this.resetKickoffPositions(kickoffSide);
        this.audio.playWhistle(1);
      }
      return;
    }

    // Active play clock
    this.halfElapsed += dt;
    if (this.halfElapsed >= this.config.halfDurationSeconds) {
      if (this.currentHalf === 1) {
        this.phase = 'halftime';
        this.audio.playWhistle(2);
        this.emitCommentary(45, 'Mapumziko! Half-time sasa—kocha apeane mawaidha kwa vyumba vya kubadilishia nguo!', 'whistle');
        this.emitHud();
        return;
      } else {
        this.finishMatch();
        return;
      }
    }

    if (this.chargingShot) {
      this.shotCharge = Math.min(1, this.shotCharge + dt * 1.45);
    }

    // Track possession ratio
    this.totalPossessionTicks += 1;
    if (this.ballCarrier?.team === 'user' || (!this.ballCarrier && this.lastTouchPlayer?.team === 'user')) {
      this.userPossessionTicks += 1;
    }

    // Update players
    this.stepActiveUserPlayer(dt);
    for (const p of this.players) {
      if (p !== this.activeUserPlayer) {
        this.stepAiPlayer(p, dt);
      }
      this.animatePlayerRig(p, dt);
    }

    // Highlight pass preview target
    const nextPassTarget =
      this.ballCarrier?.team === 'user' ? this.findBestPassTarget(this.ballCarrier) : null;
    if (this.passPreviewTarget && this.passPreviewTarget !== nextPassTarget) {
      this.passPreviewTarget.rig.targetRing.visible = false;
    }
    this.passPreviewTarget = nextPassTarget;
    if (this.passPreviewTarget) {
      this.passPreviewTarget.rig.targetRing.visible = true;
    }

    // Auto-switch defender if loose ball is far from active player and user doesn't have ball
    if (this.ballCarrier?.team !== 'user' && this.activeUserPlayer.tackleTimer <= 0) {
      const activeDist = this.activeUserPlayer.pos.distanceTo(this.ballPos);
      if (activeDist > 8.5) {
        let best = this.activeUserPlayer;
        let bestD = activeDist;
        for (const p of this.players) {
          if (p.team === 'user' && p.role !== 'GK') {
            const d = p.pos.distanceTo(this.ballPos);
            if (d + 2.2 < bestD) {
              bestD = d;
              best = p;
            }
          }
        }
        if (best !== this.activeUserPlayer) {
          this.setActiveUserPlayer(best);
        }
      }
    }

    this.stepBallPhysics(dt);
  }

  private stepActiveUserPlayer(dt: number) {
    const p = this.activeUserPlayer;
    if (p.stealCooldown > 0) p.stealCooldown -= dt;
    if (p.kickAnimTimer > 0) p.kickAnimTimer -= dt;

    if (p.tackleTimer > 0) {
      p.tackleTimer -= dt;
      p.pos.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(0.92);
      this.clampToField(p.pos);
      this.tryClaimBall(p);
      return;
    }

    // Map joystick input relative to camera forward & right on XZ plane
    this.camera.getWorldDirection(_camForward);
    _camForward.y = 0;
    if (_camForward.lengthSq() < 0.001) _camForward.set(0, 0, -1);
    _camForward.normalize();
    _camRight.crossVectors(_camForward, _upAxis).normalize();

    _v1.set(0, 0, 0);
    _v1.addScaledVector(_camRight, this.inputX);
    _v1.addScaledVector(_camForward, -this.inputY);

    const mag = _v1.length();
    const sprinting = this.sprintActive && p.stamina > 8 && mag > 0.15;
    if (sprinting) {
      p.stamina = Math.max(0, p.stamina - dt * 20);
    } else {
      p.stamina = Math.min(100, p.stamina + dt * 11);
    }

    const baseSpeed = 7.4 + (p.rating - 70) * 0.06;
    const maxSpeed = sprinting ? baseSpeed * 1.32 : baseSpeed;
    const hasBallPenalty = this.ballCarrier === p ? 0.92 : 1;

    if (mag > 0.05) {
      _v1.normalize();
      p.vel.lerp(_v1.multiplyScalar(maxSpeed * hasBallPenalty * Math.min(1, mag)), 1 - Math.exp(-12 * dt));
      const targetAngle = Math.atan2(p.vel.x, p.vel.z);
      p.facingAngle = this.lerpAngle(p.facingAngle, targetAngle, 1 - Math.exp(-14 * dt));
    } else {
      p.vel.multiplyScalar(Math.exp(-10 * dt));
    }

    p.pos.addScaledVector(p.vel, dt);
    this.clampToField(p.pos);
    this.tryClaimBall(p);
  }

  private stepAiPlayer(p: SimPlayer, dt: number) {
    if (p.stealCooldown > 0) p.stealCooldown -= dt;
    if (p.kickAnimTimer > 0) p.kickAnimTimer -= dt;
    if (p.tackleTimer > 0) p.tackleTimer -= dt;

    const dirSign = p.team === 'user' ? 1 : -1;
    const speed = p.role === 'GK' ? 6.6 : 6.5 + (p.rating - 70) * 0.05;

    // Goalkeeper logic
    if (p.role === 'GK') {
      const goalLineX = p.team === 'user' ? -PITCH_DIMS.length / 2 + 1.3 : PITCH_DIMS.length / 2 - 1.3;
      const targetZ = THREE.MathUtils.clamp(this.ballPos.z * 0.48, -3.2, 3.2);
      _v2.set(goalLineX, 0, targetZ);

      // Come out to claim slow loose ball inside penalty area
      const distBall = p.pos.distanceTo(this.ballPos);
      if (!this.ballCarrier && distBall < 5.5 && Math.abs(this.ballPos.x - goalLineX) < 7.5) {
        _v2.set(this.ballPos.x, 0, this.ballPos.z);
      }

      if (this.ballCarrier === p) {
        // Distribute immediately to open outfield teammate
        const mate = this.players.find((m) => m.team === p.team && m.role !== 'GK');
        if (mate) {
          this.ballCarrier = null;
          p.stealCooldown = 0.5;
          p.kickAnimTimer = 0.25;
          _v1.subVectors(mate.pos, this.ballPos).setY(0).normalize();
          this.ballVel.set(_v1.x * 20, 2.2, _v1.z * 20);
          this.audio.playKick(0.55);
          if (p.team === 'user') this.setActiveUserPlayer(mate);
        }
        return;
      }

      _v1.subVectors(_v2, p.pos).setY(0);
      const d = _v1.length();
      if (d > 0.15) {
        _v1.normalize();
        p.vel.lerp(_v1.multiplyScalar(speed), 1 - Math.exp(-8 * dt));
      } else {
        p.vel.multiplyScalar(0.8);
      }
      p.pos.addScaledVector(p.vel, dt);
      p.facingAngle = Math.atan2(this.ballPos.x - p.pos.x, this.ballPos.z - p.pos.z);

      // GK shot save check
      if (!this.ballCarrier && distBall < 1.25 && this.ballPos.y < PITCH_DIMS.goalHeight + 0.3) {
        const movingTowardGoal =
          (p.team === 'user' && this.ballVel.x < -6) ||
          (p.team === 'opponent' && this.ballVel.x > 6);
        if (movingTowardGoal) {
          // Parry/catch based on shot speed
          this.lastTouchPlayer = p;
          this.ballVel.x = -this.ballVel.x * 0.45 + dirSign * 7;
          this.ballVel.z += (Math.random() - 0.5) * 8;
          this.ballVel.y = 2.6;
          this.audio.playKick(0.65);
          this.addContribution(p.name, 0.5);
          this.emitCommentary(
            this.getCurrentMinute(),
            `Kipa ${p.name} ameruka kama chui na kuokoa hatari kubwa!`,
            'save'
          );
        }
      }
      return;
    }

    // Outfield AI behavior
    const isTeamInPossession =
      this.ballCarrier?.team === p.team || (!this.ballCarrier && this.lastTouchPlayer?.team === p.team);

    if (this.ballCarrier === p && p.team === 'opponent') {
      // Opponent AI attacks -X goal
      const targetGoalX = -PITCH_DIMS.length / 2;
      const distToGoal = Math.hypot(targetGoalX - p.pos.x, 0 - p.pos.z);

      if (distToGoal < 20 && p.pos.x < -10) {
        // Shoot!
        this.lastTouchPlayer = p;
        this.ballCarrier = null;
        p.stealCooldown = 0.45;
        p.kickAnimTimer = 0.3;
        const aimZ = (Math.random() - 0.5) * 5.8;
        _v1.set(targetGoalX - this.ballPos.x, 0, aimZ - this.ballPos.z).normalize();
        const power = 23 + Math.random() * 7;
        this.ballVel.set(_v1.x * power, 1.6 + Math.random() * 2.5, _v1.z * power);
        this.opponentShots += 1;
        if (Math.abs(aimZ) <= PITCH_DIMS.goalWidth / 2) {
          this.opponentShotsOnTarget += 1;
        }
        this.audio.playKick(0.85);
        return;
      }

      // Check if pressed closely by a user defender -> pass to open teammate
      const nearestThreat = this.players.find(
        (u) => u.team === 'user' && u.pos.distanceTo(p.pos) < 3.6
      );
      if (nearestThreat && Math.random() < 0.08) {
        const mate = this.findBestPassTarget(p);
        if (mate) {
          this.lastTouchPlayer = p;
          this.ballCarrier = null;
          p.stealCooldown = 0.4;
          p.kickAnimTimer = 0.24;
          _v1.subVectors(mate.pos, this.ballPos).setY(0).normalize();
          this.ballVel.set(_v1.x * 18, 1.0, _v1.z * 18);
          this.audio.playKick(0.5);
          return;
        }
      }

      // Dribble toward user goal (-X)
      _v1.set(targetGoalX - p.pos.x, 0, -p.pos.z * 0.4).normalize();
      p.vel.lerp(_v1.multiplyScalar(speed * 0.9), 1 - Math.exp(-8 * dt));
      p.pos.addScaledVector(p.vel, dt);
      p.facingAngle = Math.atan2(p.vel.x, p.vel.z);
      this.clampToField(p.pos);
      return;
    }

    // Positioning without ball
    const shiftX = THREE.MathUtils.clamp(this.ballPos.x * 0.45, -18, 18);
    const mentalityBias =
      p.team === 'user'
        ? this.tacticalMentality === 'attacking'
          ? 5.5
          : this.tacticalMentality === 'defensive'
          ? -5.5
          : 0
        : 0;
    const attackPush = (isTeamInPossession ? dirSign * 7.5 : -dirSign * 4.5) + mentalityBias;
    _v2.set(
      THREE.MathUtils.clamp(p.homePos.x * 0.55 + shiftX + attackPush, -28, 28),
      0,
      THREE.MathUtils.clamp(p.homePos.z + (this.ballPos.z - p.homePos.z) * 0.28, -20, 20)
    );

    // Nearest AI opponent presses the ball carrier / loose ball
    if (p.team === 'opponent' && this.ballCarrier?.team !== 'opponent') {
      const closestOpp = this.getClosestFieldPlayer('opponent');
      if (closestOpp === p) {
        _v2.copy(this.ballPos).setY(0);
      }
    } else if (p.team === 'user' && !this.ballCarrier) {
      const closestUser = this.getClosestFieldPlayer('user');
      if (closestUser === p) {
        _v2.copy(this.ballPos).setY(0);
      }
    }

    _v1.subVectors(_v2, p.pos).setY(0);
    const dist = _v1.length();
    if (dist > 0.35) {
      _v1.normalize();
      p.vel.lerp(_v1.multiplyScalar(speed), 1 - Math.exp(-7 * dt));
      p.facingAngle = this.lerpAngle(p.facingAngle, Math.atan2(p.vel.x, p.vel.z), 1 - Math.exp(-10 * dt));
    } else {
      p.vel.multiplyScalar(0.85);
    }

    p.pos.addScaledVector(p.vel, dt);
    this.clampToField(p.pos);
    this.tryClaimBall(p);
  }

  private tryClaimBall(p: SimPlayer) {
    if (p.stealCooldown > 0) return;
    if (this.ballPos.y > 1.45) return;

    const d = Math.hypot(p.pos.x - this.ballPos.x, p.pos.z - this.ballPos.z);
    const claimRadius = p.tackleTimer > 0 ? 1.35 : 0.92;
    if (d > claimRadius) return;

    if (!this.ballCarrier) {
      this.ballCarrier = p;
      this.lastTouchPlayer = p;
      if (p.team === 'user' && p.role !== 'GK') {
        this.setActiveUserPlayer(p);
      }
    } else if (this.ballCarrier.team !== p.team) {
      // Tackle steal chance
      const tackleBonus = p.tackleTimer > 0 ? 0.65 : 0.14;
      if (Math.random() < tackleBonus) {
        this.ballCarrier.stealCooldown = 0.6;
        this.ballCarrier = p;
        this.lastTouchPlayer = p;
        this.audio.playKick(0.35);
        this.addContribution(p.name, 0.25);
        if (p.team === 'user' && p.role !== 'GK') {
          this.setActiveUserPlayer(p);
        }
      }
    }
  }

  private stepBallPhysics(dt: number) {
    if (this.ballCarrier) {
      const c = this.ballCarrier;
      const forwardX = Math.sin(c.facingAngle);
      const forwardZ = Math.cos(c.facingAngle);
      const dribbleOffset = 0.72 + Math.sin(c.stridePhase * 2) * 0.08;
      this.ballPos.set(c.pos.x + forwardX * dribbleOffset, 0.24, c.pos.z + forwardZ * dribbleOffset);
      this.ballVel.copy(c.vel);
      this.ballMesh.position.y = 0.24;
      this.ballMesh.parent!.position.set(this.ballPos.x, 0, this.ballPos.z);
      this.ballShadow.scale.setScalar(1);
      // Spin ball forward while dribbling
      const speed = c.vel.length();
      if (speed > 0.2) {
        _ballSpinAxis.set(forwardZ, 0, -forwardX).normalize();
        this.ballMesh.rotateOnWorldAxis(_ballSpinAxis, speed * dt * 2.5);
      }
      return;
    }

    // Free-flight ball physics
    this.ballVel.y -= 18.5 * dt; // Gravity
    this.ballPos.addScaledVector(this.ballVel, dt);

    if (this.ballPos.y <= 0.24) {
      this.ballPos.y = 0.24;
      if (this.ballVel.y < -1.8) {
        this.ballVel.y = -this.ballVel.y * 0.56;
      } else {
        this.ballVel.y = 0;
      }
      // Turf rolling friction
      const drag = Math.exp(-1.55 * dt);
      this.ballVel.x *= drag;
      this.ballVel.z *= drag;
    } else {
      const airDrag = Math.exp(-0.22 * dt);
      this.ballVel.x *= airDrag;
      this.ballVel.z *= airDrag;
    }

    // Spin ball in flight
    const horizSpeed = Math.hypot(this.ballVel.x, this.ballVel.z);
    if (horizSpeed > 0.2) {
      _ballSpinAxis.set(this.ballVel.z, 0, -this.ballVel.x).normalize();
      this.ballMesh.rotateOnWorldAxis(_ballSpinAxis, horizSpeed * dt * 2.6);
    }

    this.ballMesh.position.y = this.ballPos.y;
    this.ballMesh.parent!.position.set(this.ballPos.x, 0, this.ballPos.z);
    const shadowScale = Math.max(0.4, 1 - (this.ballPos.y - 0.24) * 0.14);
    this.ballShadow.scale.setScalar(shadowScale);

    if (this.phase === 'goal-celebration') return;

    // Goalpost & Goal Line checks
    const halfL = PITCH_DIMS.length / 2;
    const halfW = PITCH_DIMS.width / 2;
    const goalHalfW = PITCH_DIMS.goalWidth / 2;

    if (Math.abs(this.ballPos.x) >= halfL) {
      const inGoalMouthZ = Math.abs(this.ballPos.z) < goalHalfW - 0.15;
      const hitPostZ = Math.abs(Math.abs(this.ballPos.z) - goalHalfW) < 0.28;

      if (hitPostZ && this.ballPos.y < PITCH_DIMS.goalHeight + 0.15) {
        this.ballPos.x = Math.sign(this.ballPos.x) * (halfL - 0.3);
        this.ballVel.x = -this.ballVel.x * 0.72;
        this.audio.playPostHit();
        this.emitCommentary(
          this.getCurrentMinute(),
          'CHUMA! Mpira umegonga mwamba wa goli! Karibu sana!',
          'woodwork'
        );
        return;
      }

      if (inGoalMouthZ && this.ballPos.y <= PITCH_DIMS.goalHeight) {
        // GOAL!
        const scoredInRightGoal = this.ballPos.x > 0; // Right goal (+X) = User scored!
        this.handleGoalScored(scoredInRightGoal ? 'user' : 'opponent');
        return;
      }

      // Goal-kick / corner quick restart
      const isCorner =
        (this.ballPos.x > 0 && this.lastTouchPlayer?.team === 'opponent') ||
        (this.ballPos.x < 0 && this.lastTouchPlayer?.team === 'user');
      if (isCorner) {
        this.corners += 1;
        this.ballPos.set(Math.sign(this.ballPos.x) * (halfL - 1.2), 0.24, Math.sign(this.ballPos.z || 1) * (halfW - 1.2));
      } else {
        this.ballPos.set(Math.sign(this.ballPos.x) * (halfL - 4.5), 0.24, 0);
      }
      this.ballVel.set(-Math.sign(this.ballPos.x) * 8, 2.2, 0);
      this.audio.playWhistle(1);
    }

    // Touchline bounce-in throw-in
    if (Math.abs(this.ballPos.z) > halfW + 0.4) {
      this.ballPos.z = Math.sign(this.ballPos.z) * (halfW - 0.6);
      this.ballVel.z = -Math.sign(this.ballPos.z) * 7.5;
      this.ballVel.x *= 0.4;
      this.ballVel.y = 2.4;
      this.audio.playWhistle(1);
    }
  }

  private handleGoalScored(scoringTeam: 'user' | 'opponent') {
    const minute = this.getCurrentMinute();
    const userScored = scoringTeam === 'user';
    const userIsHome = this.config.isUserHome;

    if ((userScored && userIsHome) || (!userScored && !userIsHome)) {
      this.homeScore += 1;
    } else {
      this.awayScore += 1;
    }

    const scorer =
      this.lastTouchPlayer && this.lastTouchPlayer.team === scoringTeam
        ? this.lastTouchPlayer
        : this.players.find((p) => p.team === scoringTeam && p.role === 'FWD') || this.players[0];

    const assistCandidate =
      userScored &&
      this.previousUserTouch &&
      this.previousUserTouch.name !== scorer.name
        ? this.previousUserTouch
        : undefined;

    if (userScored) {
      this.goals.push({
        playerId: scorer.rosterId,
        playerName: scorer.name,
        minute,
        assistPlayerId: assistCandidate?.id,
        assistPlayerName: assistCandidate?.name,
      });
      this.addContribution(scorer.name, 2.0);
      if (assistCandidate) this.addContribution(assistCandidate.name, 1.1);
    }

    const teamName = userScored
      ? this.config.isUserHome
        ? this.config.homeClubName
        : this.config.awayClubName
      : this.config.isUserHome
      ? this.config.awayClubName
      : this.config.homeClubName;

    this.goalBanner = {
      scorerName: scorer.name,
      assistName: assistCandidate?.name,
      teamName,
      minute,
      isUserGoal: userScored,
    };

    this.phase = 'goal-celebration';
    this.statePauseTimer = 2.4;
    this.ballVel.multiplyScalar(0.25);

    this.audio.playWhistle(1);
    this.audio.playCrowdRoar(1.7);

    this.emitCommentary(
      minute,
      userScored
        ? `GOOOAAAL! ${scorer.name} anatingisha nyavu! ${assistCandidate ? `Pasi tamu kutoka kwa ${assistCandidate.name}! ` : ''}Mtaani kunawaka moto!`
        : `Loo! ${scorer.name} amefungia ${teamName}! Mashabiki wameshtuka, tuimarishe ulinzi sasa!`,
      'goal'
    );
    this.emitHud();
  }

  private finishMatch() {
    this.phase = 'fulltime';
    this.audio.playWhistle(3);
    this.audio.playCrowdRoar(1.3);
    this.emitCommentary(
      90,
      `FILIMBI YA MWISHO! ${this.config.homeClubName} ${this.homeScore} – ${this.awayScore} ${this.config.awayClubName}. Dakika tisini zimekamilika!`,
      'whistle'
    );
    this.emitHud();

    if (this.completionSent) return;
    this.completionSent = true;

    const possPct = Math.round((this.userPossessionTicks / Math.max(1, this.totalPossessionTicks)) * 100);
    const xgUser = Number((this.userShots * 0.14 + this.userShotsOnTarget * 0.19).toFixed(2));
    const xgOpp = Number((this.opponentShots * 0.14 + this.opponentShotsOnTarget * 0.19).toFixed(2));

    // Pick MOTM from top contributor in user squad
    let motmName = this.activeUserPlayer.name;
    let bestScore = -1;
    this.playerMatchContributions.forEach((val, key) => {
      if (val > bestScore) {
        bestScore = val;
        motmName = key;
      }
    });

    const userGoalsCount = this.config.isUserHome ? this.homeScore : this.awayScore;
    const oppGoalsCount = this.config.isUserHome ? this.awayScore : this.homeScore;
    const isDraw = this.homeScore === this.awayScore;
    let penaltiesWinner: 'home' | 'away' | undefined;
    let penaltiesScore: string | undefined;
    if (this.config.isKnockout && isDraw) {
      penaltiesWinner = Math.random() < 0.55 ? (this.config.isUserHome ? 'home' : 'away') : this.config.isUserHome ? 'away' : 'home';
      penaltiesScore = penaltiesWinner === 'home' ? '5–4' : '4–5';
    }

    const highlights = [
      `3D Match Played Live: ${this.config.homeClubName} ${this.homeScore}–${this.awayScore} ${this.config.awayClubName}`,
      `Possession: ${possPct}% · Shots (On Target): ${this.userShots} (${this.userShotsOnTarget}) vs ${this.opponentShots} (${this.opponentShotsOnTarget})`,
      `xG: ${xgUser} vs ${xgOpp} · Corners: ${this.corners}`,
      this.goals.length > 0
        ? `User Scorers: ${this.goals.map((g) => `${g.playerName} (${g.minute}')`).join(', ')}`
        : userGoalsCount === 0
        ? 'No user goals scored in open play.'
        : 'Goals recorded.',
    ];

    this.callbacks.onMatchComplete({
      fixtureId: this.config.fixtureId,
      summaryHighlights: highlights,
      resultInput: {
        homeScore: this.homeScore,
        awayScore: this.awayScore,
        extraTime: false,
        penaltiesWinner,
        penaltiesScore,
        goals: this.goals,
        cards: this.cards,
        motmPlayerName: motmName,
        injuriesReported: [],
        stats: {
          possessionPercent: possPct,
          shots: this.userShots,
          shotsOnTarget: this.userShotsOnTarget,
          opponentShots: this.opponentShots,
          opponentShotsOnTarget: this.opponentShotsOnTarget,
          expectedGoals: xgUser,
          opponentExpectedGoals: xgOpp,
          corners: this.corners,
          notes: `Played live in Football Mtaani 3D Match Engine (${this.commentatorName} on comms).`,
        },
        memorableMoment:
          this.goals.length > 0
            ? `${this.goals[this.goals.length - 1].playerName} struck in the ${this.goals[this.goals.length - 1].minute}' minute during live 3D action (${userGoalsCount}-${oppGoalsCount}).`
            : `Hard-fought 3D matchday battle at ${this.config.stadium}.`,
      },
    });
  }

  private findBestPassTarget(passer: SimPlayer): SimPlayer | null {
    const teammates = this.players.filter(
      (p) => p.team === passer.team && p !== passer && p.role !== 'GK'
    );
    if (teammates.length === 0) return null;

    // Direction preference from joystick if user, else forward toward goal
    let prefX = passer.team === 'user' ? 1 : -1;
    let prefZ = 0;
    if (passer.team === 'user' && (Math.abs(this.inputX) > 0.12 || Math.abs(this.inputY) > 0.12)) {
      this.camera.getWorldDirection(_camForward);
      _camForward.y = 0;
      _camForward.normalize();
      _camRight.crossVectors(_camForward, _upAxis).normalize();
      _v1.set(0, 0, 0).addScaledVector(_camRight, this.inputX).addScaledVector(_camForward, -this.inputY).normalize();
      prefX = _v1.x;
      prefZ = _v1.z;
    }

    let best: SimPlayer | null = null;
    let bestScore = -Infinity;
    for (const mate of teammates) {
      const dx = mate.pos.x - passer.pos.x;
      const dz = mate.pos.z - passer.pos.z;
      const dist = Math.max(1, Math.hypot(dx, dz));
      const align = (dx / dist) * prefX + (dz / dist) * prefZ;
      const score = align * 2.5 - dist * 0.04;
      if (score > bestScore) {
        bestScore = score;
        best = mate;
      }
    }
    return best;
  }

  private getClosestFieldPlayer(team: 'user' | 'opponent'): SimPlayer {
    let best = this.players.find((p) => p.team === team && p.role !== 'GK')!;
    let bestD = Infinity;
    for (const p of this.players) {
      if (p.team === team && p.role !== 'GK') {
        const d = p.pos.distanceToSquared(this.ballPos);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
    }
    return best;
  }

  private animatePlayerRig(p: SimPlayer, dt: number) {
    p.rig.root.position.copy(p.pos);
    p.rig.root.rotation.y = p.facingAngle;

    const speed = p.vel.length();
    if (speed > 0.35) {
      p.stridePhase += dt * (4.2 + speed * 0.9);
      const swing = Math.sin(p.stridePhase) * Math.min(0.85, speed * 0.09);
      p.rig.leftLegPivot.rotation.x = swing;
      p.rig.rightLegPivot.rotation.x = -swing;
      p.rig.leftArmPivot.rotation.x = -swing * 0.75;
      p.rig.rightArmPivot.rotation.x = swing * 0.75;
      p.rig.torsoPivot.rotation.x = Math.min(0.18, speed * 0.016);
    } else {
      p.rig.leftLegPivot.rotation.x *= 0.82;
      p.rig.rightLegPivot.rotation.x *= 0.82;
      p.rig.leftArmPivot.rotation.x *= 0.82;
      p.rig.rightArmPivot.rotation.x *= 0.82;
      p.rig.torsoPivot.rotation.x *= 0.82;
    }

    if (p.kickAnimTimer > 0) {
      p.rig.rightLegPivot.rotation.x = -0.95 * (p.kickAnimTimer / 0.3);
    }
  }

  private updateCamera(dt: number) {
    const smooth = 1 - Math.exp(-6.5 * dt);
    if (this.cameraMode === 'broadcast') {
      _camTargetPos.set(
        THREE.MathUtils.clamp(this.ballPos.x * 0.52, -16, 16),
        22.5,
        THREE.MathUtils.clamp(this.ballPos.z * 0.38, -9, 9) + 31
      );
      _camLookAt.set(
        THREE.MathUtils.clamp(this.ballPos.x * 0.78, -24, 24),
        0.5,
        THREE.MathUtils.clamp(this.ballPos.z * 0.48, -12, 12)
      );
    } else if (this.cameraMode === 'follow') {
      const fx = this.activeUserPlayer.pos.x * 0.45 + this.ballPos.x * 0.55;
      const fz = this.activeUserPlayer.pos.z * 0.45 + this.ballPos.z * 0.55;
      _camTargetPos.set(fx - 18.5, 11.5, fz * 0.75);
      _camLookAt.set(fx + 10, 0.8, fz * 0.45);
    } else {
      // Vertical Mobile Cam (end-to-end attacking up-screen — ideal for portrait phones)
      const fx = this.ballPos.x * 0.65 + this.activeUserPlayer.pos.x * 0.35;
      const fz = this.ballPos.z * 0.55;
      _camTargetPos.set(fx - 21, 18.5, fz * 0.65);
      _camLookAt.set(fx + 11, 0.4, fz * 0.4);
    }

    this.camera.position.lerp(_camTargetPos, smooth);
    this.camera.lookAt(_camLookAt);
  }

  private clampToField(pos: THREE.Vector3) {
    const halfL = PITCH_DIMS.length / 2 + 1.2;
    const halfW = PITCH_DIMS.width / 2 + 1.2;
    pos.x = THREE.MathUtils.clamp(pos.x, -halfL, halfL);
    pos.z = THREE.MathUtils.clamp(pos.z, -halfW, halfW);
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }

  private getCurrentMinute(): number {
    const halfRatio = Math.min(1, this.halfElapsed / Math.max(10, this.config.halfDurationSeconds));
    return this.currentHalf === 1
      ? Math.max(1, Math.round(halfRatio * 45))
      : Math.max(46, Math.min(90, 45 + Math.round(halfRatio * 45)));
  }

  private addContribution(name: string, delta: number) {
    this.playerMatchContributions.set(name, (this.playerMatchContributions.get(name) || 0) + delta);
  }

  private emitCommentary(minute: number, text: string, tone: Match3DCommentaryEvent['tone']) {
    this.callbacks.onCommentary({
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      minute,
      speaker: this.commentatorName,
      text,
      tone,
    });
  }

  private emitHud() {
    this.callbacks.onHudUpdate({
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      matchMinute: this.getCurrentMinute(),
      phase: this.phase,
      possessionUserPercent: Math.round(
        (this.userPossessionTicks / Math.max(1, this.totalPossessionTicks)) * 100
      ),
      userShots: this.userShots,
      userShotsOnTarget: this.userShotsOnTarget,
      opponentShots: this.opponentShots,
      opponentShotsOnTarget: this.opponentShotsOnTarget,
      corners: this.corners,
      activePlayerName: this.activeUserPlayer?.name || 'Player',
      activePlayerStamina: Math.round(this.activeUserPlayer?.stamina ?? 100),
      userHasBall: this.ballCarrier?.team === 'user',
      shotCharge: this.shotCharge,
      isPaused: this.isPaused,
      cameraMode: this.cameraMode,
      goalBanner: this.goalBanner,
    });
  }

  private handleResize = () => {
    if (!this.renderer || !this.camera || this.disposed) return;
    const width = Math.max(320, this.container.clientWidth || window.innerWidth);
    const height = Math.max(240, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    this.callbacks.onContextError('3D graphics context paused by device.');
  };

  private handleContextRestored = () => {
    this.contextLost = false;
    this.startLoop();
  };

  public dispose() {
    this.disposed = true;
    if (this.rafId !== null) window.cancelAnimationFrame(this.rafId);
    if (this.softwareTimerId !== null) window.clearTimeout(this.softwareTimerId);
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    }
    this.audio.dispose();
    this.scene?.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
    this.disposables.forEach((d) => d.dispose());
    this.envRenderTarget?.dispose();
    this.renderer?.dispose();
  }
}

export class MatchAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public unlock() {
    if (this.muted) return;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playKick(power = 0.6) {
    if (this.muted) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 115 + power * 65;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.11);

    gain.gain.setValueAtTime(0.28 * Math.min(1, 0.5 + power * 0.6), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playPostHit() {
    if (this.muted) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.25);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playWhistle(bursts: 1 | 2 | 3 = 1) {
    if (this.muted) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < bursts; i++) {
      const start = now + i * 0.22;
      const dur = i === bursts - 1 && bursts > 1 ? 0.34 : 0.16;
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2850, start);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(38, start);
      lfoGain.gain.setValueAtTime(95, start);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.02);
      gain.gain.setValueAtTime(0.14, start + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      lfo.start(start);
      osc.start(start);
      lfo.stop(start + dur + 0.02);
      osc.stop(start + dur + 0.02);
    }
  }

  public playCrowdRoar(duration = 1.6) {
    if (this.muted) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.linearRampToValueAtTime(950, now + 0.35);
    filter.frequency.linearRampToValueAtTime(420, now + duration);
    filter.Q.value = 0.85;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.18);
    gain.gain.setValueAtTime(0.2, now + duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  }

  public dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

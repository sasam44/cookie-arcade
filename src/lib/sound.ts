/**
 * Web Audio API sound effects — no external assets, pure oscillator.
 * Sounds: flip, win, lose, click, badge.
 */

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      audioCtx = null;
    }
  }
  return audioCtx;
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted(): boolean { return muted; }

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15, attack = 0.005, release = 0.1) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Resume context if suspended (autoplay policy)
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  osc.connect(gain).connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(volume * 0.6, now + duration - release);
  gain.gain.linearRampToValueAtTime(0, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

function playSequence(notes: Array<{ freq: number; duration: number; type?: OscillatorType; delay?: number }>) {
  let acc = 0;
  for (const n of notes) {
    setTimeout(() => playTone(n.freq, n.duration, n.type ?? "sine"), acc + (n.delay ?? 0));
    acc += n.delay ?? 0;
  }
}

export const sfx = {
  /** Coin spinning tick — quick blip */
  flipTick() { playTone(880, 0.04, "square", 0.06); },
  /** Coin landing — short bright ding */
  flipLand(win: boolean) {
    if (win) {
      playSequence([
        { freq: 523, duration: 0.08, type: "sine" },
        { freq: 784, duration: 0.12, type: "sine", delay: 60 },
        { freq: 1046, duration: 0.18, type: "sine", delay: 140 },
      ]);
    } else {
      playSequence([
        { freq: 220, duration: 0.18, type: "sawtooth", delay: 0 },
        { freq: 165, duration: 0.22, type: "sawtooth", delay: 60 },
      ]);
    }
  },
  /** Generic button click */
  click() { playTone(660, 0.03, "square", 0.04); },
  /** Trivia correct answer — fanfare */
  triviaCorrect() {
    playSequence([
      { freq: 523, duration: 0.10, type: "triangle" },
      { freq: 659, duration: 0.10, type: "triangle", delay: 100 },
      { freq: 784, duration: 0.10, type: "triangle", delay: 200 },
      { freq: 1046, duration: 0.20, type: "triangle", delay: 300 },
    ]);
  },
  /** Trivia wrong — sad trombone */
  triviaWrong() {
    playSequence([
      { freq: 392, duration: 0.18, type: "sawtooth", delay: 0 },
      { freq: 330, duration: 0.18, type: "sawtooth", delay: 150 },
      { freq: 262, duration: 0.28, type: "sawtooth", delay: 300 },
    ]);
  },
  /** Streak badge unlock — sparkle ascending */
  badgeUnlock() {
    playSequence([
      { freq: 660, duration: 0.06, type: "sine" },
      { freq: 880, duration: 0.06, type: "sine", delay: 60 },
      { freq: 1320, duration: 0.10, type: "sine", delay: 120 },
      { freq: 1760, duration: 0.18, type: "sine", delay: 180 },
    ]);
  },
  /** Lottery ticket — drum roll */
  lotteryTicket() {
    playSequence([
      { freq: 100, duration: 0.05, type: "square", delay: 0 },
      { freq: 110, duration: 0.05, type: "square", delay: 60 },
      { freq: 120, duration: 0.05, type: "square", delay: 120 },
      { freq: 130, duration: 0.05, type: "square", delay: 180 },
      { freq: 150, duration: 0.20, type: "square", delay: 240 },
    ]);
  },
};

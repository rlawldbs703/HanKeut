// 연출용 사운드: 외부 음원 없이 Web Audio로 합성해요. (실제 피아노·첼로 녹음 아님)
"use client";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseGain: GainNode | null = null;
let ambientTimer: ReturnType<typeof setInterval> | null = null;
let muted = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  const c = ensure();
  if (!c || !master || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(master);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

/** 별 조각을 얻을 때 반짝 소리 */
export function playChime() {
  [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, i * 0.08, 1.2, "sine", 0.12));
}

/** 퍼즐 성공·장면 전환 */
export function playResolve() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.15, 2, "triangle", 0.1));
}

/** 그림자에 닿았을 때 */
export function playShadow() {
  tone(110, 0, 0.8, "sawtooth", 0.05);
  tone(98, 0.05, 0.9, "sine", 0.08);
}

/** 피아노·첼로 느낌의 잔잔한 배경음 (합성) */
export function startAmbient() {
  if (ambientTimer || !ensure()) return;
  const chords = [
    [220, 277, 330],
    [196, 247, 294],
    [175, 220, 262],
    [196, 247, 330],
  ];
  let i = 0;
  const play = () => {
    const ch = chords[i++ % chords.length];
    tone(ch[0] / 2, 0, 3.6, "sine", 0.07); // 첼로 느낌 저음
    ch.forEach((f, k) => tone(f * 2, k * 0.35, 1.6, "triangle", 0.035)); // 피아노 느낌 아르페지오
  };
  play();
  ambientTimer = setInterval(play, 3600);
}

export function stopAmbient() {
  if (ambientTimer) clearInterval(ambientTimer);
  ambientTimer = null;
}

/** 라디오 잡음: level 0(없음)~1(최대) */
export function setRadioNoise(level: number) {
  const c = ensure();
  if (!c || !master) return;
  if (!noiseGain) {
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    noiseGain = c.createGain();
    noiseGain.gain.value = 0;
    src.connect(filter).connect(noiseGain).connect(master);
    src.start();
  }
  noiseGain.gain.setTargetAtTime(muted ? 0 : level * 0.12, c.currentTime, 0.05);
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.05);
}

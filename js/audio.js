'use strict';
// Sons e música sintetizados em tempo real (Web Audio), sem arquivos de áudio.

const Sound = {
  ctx: null, ready: false, mode: null, nextBeat: 0, beat: 0, timer: null, lastStep: 0,
  vol: { music: 0.5, sfx: 0.7, mute: false },

  // o navegador só libera áudio depois de um clique ou tecla
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
    this.musBus = c.createGain(); this.musBus.connect(this.master);
    this.ambBus = c.createGain(); this.ambBus.connect(this.master);
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.plucks = new Map();
    this.ready = true;
    this.applyVol();
    // chuva: ruído contínuo filtrado, volume controlado pelo clima
    this.rain = c.createBufferSource(); this.rain.buffer = this.noiseBuf; this.rain.loop = true;
    const rf = c.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 1400;
    this.rainGain = c.createGain(); this.rainGain.gain.value = 0;
    this.rain.connect(rf); rf.connect(this.rainGain); this.rainGain.connect(this.ambBus); this.rain.start();
    this.timer = setInterval(() => this.schedule(), 90);
    if (this.wantMode) this.music(this.wantMode);
  },
  applyVol() {
    if (!this.ready) return;
    const m = this.vol.mute ? 0 : 1;
    this.master.gain.value = m;
    this.sfxBus.gain.value = this.vol.sfx;
    this.musBus.gain.value = this.vol.music * 0.55;
    this.ambBus.gain.value = this.vol.sfx * 0.6;
  },
  setVol(v) { Object.assign(this.vol, v); this.applyVol(); },

  // ------------------------------------------------------------ blocos de síntese
  noise(t, dur, o = {}) {
    const c = this.ctx, src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1000, t); f.Q.value = o.q || 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain || 0.2, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || this.sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  },
  tone(t, freq, dur, o = {}) {
    const c = this.ctx, osc = c.createOscillator();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain || 0.2, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); out = f; }
    osc.connect(g); out.connect(o.bus || this.sfxBus);
    osc.start(t); osc.stop(t + dur + 0.02);
  },
  // corda dedilhada (alaúde) pelo algoritmo de Karplus-Strong
  pluckBuf(freq, dur) {
    const key = Math.round(freq) + ':' + dur;
    if (this.plucks.has(key)) return this.plucks.get(key);
    const sr = this.ctx.sampleRate, n = Math.floor(sr * dur), p = Math.max(2, Math.round(sr / freq));
    const buf = this.ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), ring = new Float32Array(p);
    for (let i = 0; i < p; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      const nx = (idx + 1) % p;
      const v = (ring[idx] + ring[nx]) * 0.4975;
      d[i] = ring[idx]; ring[idx] = v; idx = nx;
    }
    this.plucks.set(key, buf);
    return buf;
  },
  pluck(t, freq, dur, gain, bus) {
    const c = this.ctx, src = c.createBufferSource();
    src.buffer = this.pluckBuf(freq, dur);
    const g = c.createGain(); g.gain.value = gain;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3200;
    src.connect(f); f.connect(g); g.connect(bus || this.sfxBus);
    src.start(t);
  },

  // ------------------------------------------------------------ efeitos
  play(name, o = {}) {
    if (!this.ready || this.vol.mute) return;
    const t = this.ctx.currentTime + 0.005, v = o.vol || 1;
    switch (name) {
      case 'step': {
        const s = o.surface;
        if (s === 'water') this.noise(t, 0.12, { type: 'lowpass', freq: 700, gain: 0.07 * v });
        else if (s === 'snow') this.noise(t, 0.09, { type: 'lowpass', freq: 1800, gain: 0.05 * v });
        else if (s === 'road') this.noise(t, 0.05, { type: 'bandpass', freq: 1500, q: 2, gain: 0.06 * v });
        else this.noise(t, 0.06, { type: 'bandpass', freq: 700, q: 1.5, gain: 0.05 * v });
        break;
      }
      case 'gallop': this.tone(t, 110, 0.07, { to: 60, gain: 0.16 }); this.noise(t, 0.04, { freq: 900, gain: 0.05 }); this.tone(t + 0.09, 100, 0.07, { to: 55, gain: 0.13 }); break;
      case 'swing': this.noise(t, 0.16, { freq: 2200, to: 500, q: 1.2, gain: 0.09 }); break;
      case 'hit': this.tone(t, 150, 0.14, { to: 55, gain: 0.28 }); this.noise(t, 0.06, { type: 'lowpass', freq: 900, gain: 0.16 }); break;
      case 'hurt': this.tone(t, 260, 0.22, { to: 110, type: 'sawtooth', gain: 0.1, lp: 900 }); this.noise(t, 0.08, { type: 'lowpass', freq: 700, gain: 0.12 }); break;
      case 'chop': this.noise(t, 0.07, { freq: 1300, q: 5, gain: 0.32 }); this.tone(t, 240, 0.06, { type: 'square', gain: 0.03, lp: 800 }); break;
      case 'mine': this.tone(t, 1900, 0.14, { type: 'triangle', gain: 0.12 }); this.tone(t, 2850, 0.09, { type: 'sine', gain: 0.06 }); this.noise(t, 0.04, { type: 'highpass', freq: 3000, gain: 0.08 }); break;
      case 'pickup': this.tone(t, 880, 0.07, { gain: 0.08 }); this.tone(t + 0.06, 1320, 0.09, { gain: 0.07 }); break;
      case 'coin': this.tone(t, 1568, 0.08, { type: 'triangle', gain: 0.09 }); this.tone(t + 0.07, 2093, 0.14, { type: 'triangle', gain: 0.08 }); break;
      case 'bow': this.pluck(t, 150, 0.35, 0.5); this.noise(t + 0.02, 0.12, { type: 'highpass', freq: 2500, to: 6000, gain: 0.06 }); break;
      case 'arrowhit': this.noise(t, 0.05, { freq: 1000, q: 3, gain: 0.18 }); this.tone(t, 320, 0.08, { to: 120, gain: 0.1 }); break;
      case 'cast': this.noise(t, 0.2, { type: 'highpass', freq: 1800, to: 900, gain: 0.05 }); this.noise(t + 0.25, 0.18, { type: 'lowpass', freq: 900, gain: 0.08 }); break;
      case 'splash': this.noise(t, 0.3, { type: 'lowpass', freq: 1400, to: 300, gain: 0.2 }); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => this.pluck(t + i * 0.09, f, 1.2, 0.35)); break;
      case 'craft': this.tone(t, 900, 0.25, { type: 'triangle', gain: 0.1 }); this.tone(t, 1350, 0.18, { gain: 0.05 }); this.noise(t, 0.04, { type: 'highpass', freq: 2500, gain: 0.08 }); break;
      case 'build': for (let k = 0; k < 3; k++) { this.tone(t + k * 0.14, 180, 0.07, { to: 90, gain: 0.2 }); this.noise(t + k * 0.14, 0.04, { freq: 1200, gain: 0.1 }); } break;
      case 'chest': this.noise(t, 0.2, { type: 'lowpass', freq: 500, gain: 0.15 }); this.tone(t + 0.05, 110, 0.25, { to: 80, gain: 0.12 }); this.tone(t + 0.2, 1046, 0.4, { type: 'triangle', gain: 0.05 }); break;
      case 'ui': this.tone(t, 1100, 0.035, { type: 'triangle', gain: 0.03 }); break;
      case 'die': this.tone(t, 220, 1.2, { to: 50, type: 'sawtooth', gain: 0.12, lp: 600 }); [392, 349, 311, 262].forEach((f, i) => this.pluck(t + 0.2 + i * 0.3, f, 1.5, 0.3)); break;
      case 'roar': this.noise(t, 1.1, { type: 'lowpass', freq: 500, to: 150, gain: 0.35, att: 0.08 }); this.tone(t, 90, 1.0, { to: 45, type: 'sawtooth', gain: 0.18, lp: 400, att: 0.08 }); break;
      case 'crackle': this.noise(t, 0.025, { type: 'highpass', freq: 2500 + Math.random() * 2000, gain: 0.05 * v, bus: this.ambBus }); break;
      case 'block': this.tone(t, 620, 0.18, { type: 'square', gain: 0.07, lp: 2600 }); this.tone(t, 930, 0.14, { type: 'triangle', gain: 0.08 }); this.noise(t, 0.06, { type: 'highpass', freq: 2200, gain: 0.12 }); break;
      case 'neigh': this.tone(t, 700, 0.5, { to: 420, type: 'sawtooth', gain: 0.05, lp: 1800 }); break;
    }
  },
  setRain(level) { if (this.ready) this.rainGain.gain.setTargetAtTime(level * 0.35, this.ctx.currentTime, 0.8); },

  // ------------------------------------------------------------ música: melodias medievais compostas
  // Cada tema: compasso (passos por compasso), andamento, melodia [nota MIDI ou 0 = pausa, duração em passos],
  // acordes por compasso (raiz MIDI + tipo) e padrão de percussão.
  TUNES: {
    // giga dançante em ré dório (6/8)
    day: { bpm: 138, bar: 6, lead: 'flute', drum: [3, 0, 1, 2, 0, 1], jingle: [0, 0, 0, 1, 0, 0],
      mel: [[69, 2], [74, 1], [74, 2], [76, 1], [77, 1], [76, 1], [74, 1], [72, 2], [69, 1], [67, 2], [72, 1], [72, 2], [74, 1], [76, 1], [74, 1], [72, 1], [69, 3],
        [69, 2], [74, 1], [74, 2], [76, 1], [77, 1], [79, 1], [81, 1], [79, 2], [76, 1], [77, 1], [76, 1], [74, 1], [72, 1], [69, 1], [67, 1], [69, 3], [74, 3],
        [74, 1], [77, 1], [81, 1], [81, 2], [79, 1], [77, 1], [81, 1], [77, 1], [76, 2], [72, 1], [72, 1], [76, 1], [79, 1], [79, 2], [77, 1], [76, 1], [79, 1], [76, 1], [74, 2], [72, 1],
        [74, 1], [77, 1], [81, 1], [81, 2], [79, 1], [77, 1], [76, 1], [74, 1], [72, 2], [76, 1], [74, 1], [72, 1], [69, 1], [67, 1], [69, 1], [72, 1], [74, 3], [74, 3]],
      chords: [[50, 'm'], [50, 'm'], [48, 'M'], [48, 'M'], [50, 'm'], [50, 'm'], [48, 'M'], [50, 'm'], [50, 'm'], [50, 'm'], [48, 'M'], [48, 'M'], [50, 'm'], [50, 'm'], [48, 'M'], [50, 'm']] },
    // valsa tranquila em lá menor (3/4) para a noite
    night: { bpm: 96, bar: 6, lead: 'lute', drum: [0, 0, 0, 0, 0, 0], jingle: [0, 0, 0, 0, 0, 0],
      mel: [[76, 2], [74, 2], [72, 2], [71, 4], [69, 2], [72, 3], [71, 1], [69, 2], [67, 6], [69, 2], [71, 2], [72, 2], [74, 4], [72, 2], [71, 2], [69, 2], [68, 2], [69, 6],
        [72, 2], [74, 2], [76, 2], [77, 4], [76, 2], [74, 3], [72, 1], [71, 2], [72, 6], [69, 2], [72, 2], [71, 2], [69, 4], [67, 2], [68, 2], [71, 2], [68, 2], [69, 6]],
      chords: [[45, 'm'], [43, 'M'], [41, 'M'], [40, 'M'], [45, 'm'], [50, 'm'], [40, 'M'], [45, 'm'], [45, 'm'], [50, 'm'], [48, 'M'], [48, 'M'], [45, 'm'], [40, 'M'], [40, 'M'], [45, 'm']] },
    // marcha solene em ré mixolídio para o menu
    menu: { bpm: 104, bar: 8, lead: 'flute', drum: [3, 0, 1, 0, 2, 0, 1, 1], jingle: [0, 0, 0, 0, 1, 0, 0, 0],
      mel: [[62, 2], [66, 2], [69, 3], [69, 1], [72, 2], [71, 2], [69, 4], [67, 2], [69, 2], [71, 2], [67, 2], [66, 4], [64, 4], [62, 2], [66, 2], [69, 3], [71, 1],
        [72, 3], [74, 1], [72, 2], [71, 2], [69, 2], [67, 2], [66, 2], [64, 2], [62, 8]],
      chords: [[50, 'M'], [48, 'M'], [43, 'M'], [45, 'M'], [50, 'M'], [48, 'M'], [43, 'M'], [50, 'M']] },
    // batalha: ritmo rápido em mi menor
    battle: { bpm: 152, bar: 8, lead: 'lute', drum: [3, 1, 2, 1, 3, 1, 2, 2], jingle: [0, 1, 0, 1, 0, 1, 0, 1],
      mel: [[64, 1], [64, 1], [67, 1], [64, 1], [71, 2], [69, 2], [67, 1], [66, 1], [64, 2], [62, 2], [64, 2], [64, 1], [64, 1], [67, 1], [69, 1], [71, 2], [74, 2],
        [72, 2], [71, 2], [69, 2], [71, 2], [67, 2], [66, 2], [64, 4]],
      chords: [[40, 'm'], [38, 'M'], [40, 'm'], [43, 'M'], [45, 'm'], [47, 'M']] },
    // caverna: bordão sombrio e notas soltas
    cave: { bpm: 60, bar: 8, lead: 'lute', drum: [0, 0, 0, 0, 0, 0, 0, 0], jingle: [0, 0, 0, 0, 0, 0, 0, 0], sparse: true,
      mel: [[52, 3], [0, 3], [55, 2], [53, 4], [0, 4], [52, 2], [50, 6], [0, 2], [57, 3], [55, 1], [53, 4], [0, 4], [52, 8]],
      chords: [[40, 'm'], [40, 'm'], [41, 'M'], [40, 'm']] },
  },
  music(mode) {
    this.wantMode = mode;
    if (!this.ready || mode === this.mode) return;
    this.mode = mode;
    const tune = this.TUNES[mode] || this.TUNES.day, c = this.ctx, t = c.currentTime;
    this.tune = tune; this.step = 0; this.mi = 0; this.mrem = 0; this.nextBeat = t + 0.4; this.round = 0;
    if (this.droneNodes) for (const n of this.droneNodes) { try { n.stop(c.currentTime + 1.2); } catch (e) { /* já parado */ } }
    this.droneNodes = [];
    // sanfona (bordão em quinta) que muda de tom com os acordes
    const root = tune.chords[0][0];
    for (const semi of [0, 7]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = this.midi(root - 12 + semi);
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = mode === 'cave' ? 260 : 520;
      const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(mode === 'battle' ? 0.03 : 0.04, t + 1.5);
      o.connect(f); f.connect(g); g.connect(this.musBus); o.start(t);
      this.droneNodes.push(o);
    }
  },
  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  // flauta doce: seno com vibrato, um pouco de triângulo e sopro
  flute(t, freq, dur, gain) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq; o2.type = 'triangle'; o2.frequency.value = freq * 2;
    lfo.frequency.value = 5.2; lg.gain.value = freq * 0.006; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const g2 = c.createGain(); g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.035);
    g.gain.setValueAtTime(gain, t + Math.max(0.05, dur - 0.07)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.musBus);
    for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + dur + 0.1); }
    this.noise(t, 0.05, { type: 'bandpass', freq: freq * 2, q: 3, gain: gain * 0.25, bus: this.musBus });
  },
  schedule() {
    if (!this.ready || !this.mode || this.vol.mute || !this.tune) return;
    const T_ = this.tune, c = this.ctx, sp = 60 / T_.bpm / 2; // um passo = colcheia
    while (this.nextBeat < c.currentTime + 0.25) {
      const t = this.nextBeat, s = this.step, inBar = s % T_.bar, bar = Math.floor(s / T_.bar);
      // melodia
      if (this.mrem <= 0) {
        const [note, dur] = T_.mel[this.mi];
        this.mi = (this.mi + 1) % T_.mel.length;
        if (this.mi === 0) this.round++;
        this.mrem = dur;
        if (note && !(T_.sparse && Math.random() < 0.3)) {
          const lute = T_.lead === 'lute' || this.round % 2 === 1;
          if (lute) this.pluck(t, this.midi(note), sp * dur + 0.3, 0.24, this.musBus);
          else this.flute(t, this.midi(note + 12), sp * dur * 0.95, 0.085);
          if (this.round % 2 === 1 && T_.lead === 'flute' && dur >= 2) this.flute(t, this.midi(note), sp * dur * 0.9, 0.04);
        }
      }
      this.mrem--;
      // acordes no alaúde e baixo
      const [root, kind] = T_.chords[bar % T_.chords.length];
      const third = kind === 'm' ? 3 : 4;
      if (inBar === 0) { this.pluck(t, this.midi(root - 12), sp * T_.bar, 0.26, this.musBus); }
      if (!T_.sparse && (inBar === Math.floor(T_.bar / 2) || inBar === 0)) {
        [0, third, 7].forEach((iv, k) => this.pluck(t + k * 0.018, this.midi(root + 12 + iv), sp * 3, 0.07, this.musBus));
      }
      if (inBar === 0 && this.droneNodes && this.droneNodes[0]) {
        this.droneNodes[0].frequency.setTargetAtTime(this.midi(root - 12), t, 0.08);
        this.droneNodes[1].frequency.setTargetAtTime(this.midi(root - 5), t, 0.08);
      }
      // bodhrán (tambor) e pandeiro
      const d = T_.drum[inBar];
      if (d) {
        this.noise(t, d === 3 ? 0.22 : 0.12, { type: 'lowpass', freq: d === 3 ? 180 : 320, gain: d === 3 ? 0.3 : d === 2 ? 0.18 : 0.1, bus: this.musBus });
        this.tone(t, d === 3 ? 85 : 120, 0.14, { to: 50, gain: d === 3 ? 0.18 : 0.08, bus: this.musBus });
      }
      if (T_.jingle[inBar]) this.noise(t, 0.09, { type: 'highpass', freq: 7000, gain: 0.05, bus: this.musBus });
      this.nextBeat += sp;
      this.step++;
    }
  },
};
window.addEventListener('pointerdown', () => Sound.init());
window.addEventListener('keydown', () => Sound.init());

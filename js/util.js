'use strict';
// Utilitários gerais: aleatoriedade com semente, ruído, matemática e fila de prioridade.

const TILE = 32;
const WORLD_W = 320, WORLD_H = 320;
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Calendário sem dias: cada ciclo é um mês. Primeiro 1 minuto de noite (o mês acabou de virar) e depois
// 5 minutos de dia, com a "pizza" do relógio se enchendo. Quando ela completa, escurece e vira o mês.
// G.day conta os meses desde o começo; 12 meses = 1 ano = 72 minutos reais. O jogo começa em dezembro.
const NIGHT_LEN = 60, DAYLIGHT_LEN = 300;
const DAY_LEN = NIGHT_LEN + DAYLIGHT_LEN; // segundos reais por mês
// a economia (impostos, soldos, salários, guerras, revoltas, colheitas) anda uma vez por mês
const ECON_DAYS = 1;
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => [m, 1]);
const YEAR_DAYS = 12;
const CAL_START = 11; // o primeiro mês do jogo é dezembro
// '1 mês' / '3 meses'
const daysText = n => n + (n === 1 ? ' mês' : ' meses');
const Calendar = {
  // mês de jogo (1, 2, 3...) -> { year, month (0 = janeiro) }
  of(day) {
    const d = day - 1 + CAL_START;
    return { year: Math.floor(d / YEAR_DAYS) + 1, month: ((d % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS, day: 1 };
  },
  text(day) { return MONTHS[this.of(day).month][0]; },
  full(day) { const c = this.of(day); return `${MONTHS[c.month][0]} do ano ${c.year}`; },
  short(day) { const c = this.of(day); return `${MONTHS[c.month][0].slice(0, 3)} · ano ${c.year}`; },
  isNewYear(day) { return (day - 1 + CAL_START) % YEAR_DAYS === 0; },
  // estações do hemisfério norte: primavera (mar–mai), verão (jun–ago), outono (set–nov), inverno (dez–fev)
  season(day) { return Math.floor(((this.of(day).month + 10) % 12) / 3); },
};

const U = {
  mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },
  hash2(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  },
  makeNoise(seed) {
    const sm = t => t * t * (3 - 2 * t);
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y);
      const u = sm(x - xi), v = sm(y - yi);
      const a = U.hash2(xi, yi, seed), b = U.hash2(xi + 1, yi, seed);
      const c = U.hash2(xi, yi + 1, seed), d = U.hash2(xi + 1, yi + 1, seed);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  },
  fbm(noise, x, y, oct) {
    let v = 0, amp = 1, f = 1, tot = 0;
    for (let i = 0; i < oct; i++) { v += noise(x * f, y * f) * amp; tot += amp; amp *= 0.5; f *= 2; }
    return v / tot;
  },
  clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  dist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); },
  rnd(a, b) { return a + Math.random() * (b - a); },
  rint(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  angDiff(a, b) { let d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; },
  hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; },
  shade(hex, amt) {
    const [r, g, b] = U.hexRgb(hex);
    const f = c => U.clamp(Math.round(c + amt * 255), 0, 255);
    return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  },
  rgba(hex, a) { const [r, g, b] = U.hexRgb(hex); return `rgba(${r},${g},${b},${a})`; },
  u8ToB64(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
    return btoa(s);
  },
  b64ToU8(b) {
    const s = atob(b); const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  },
};

// Compressão LZW para guardar jogos salvos no navegador (texto UTF-8 -> caracteres UTF-16 seguros).
const LZ = {
  MAX: 55000, RESET: 256, FIRST: 257,
  compress(str) {
    const bytes = new TextEncoder().encode(str);
    if (!bytes.length) return '';
    // dicionário numérico: (código do prefixo * 256 + próximo byte) -> código
    let dict = new Map(), next = this.FIRST, w = bytes[0];
    const out = [], chunk = [];
    const emit = code => { chunk.push(code + 32); if (chunk.length >= 8192) { out.push(String.fromCharCode.apply(null, chunk)); chunk.length = 0; } };
    for (let i = 1; i < bytes.length; i++) {
      const b = bytes[i], key = w * 256 + b, hit = dict.get(key);
      if (hit !== undefined) { w = hit; continue; }
      emit(w);
      if (next < this.MAX) dict.set(key, next++);
      else { emit(this.RESET); dict = new Map(); next = this.FIRST; }
      w = b;
    }
    emit(w);
    if (chunk.length) out.push(String.fromCharCode.apply(null, chunk));
    return out.join('');
  },
  decompress(s) {
    let dict = [], next = this.FIRST, w = null;
    let n = 0, buf = new Uint8Array(s.length * 3 + 64);
    const grow = () => { const b = new Uint8Array(buf.length * 2); b.set(buf.subarray(0, n)); buf = b; };
    const write = str => { while (n + str.length > buf.length) grow(); for (let i = 0; i < str.length; i++) buf[n++] = str.charCodeAt(i); };
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i) - 32;
      if (code === this.RESET) { dict = []; next = this.FIRST; w = null; continue; }
      let entry;
      if (code < 256) entry = String.fromCharCode(code);
      else if (dict[code] !== undefined) entry = dict[code];
      else if (code === next && w !== null) entry = w + w[0];
      else throw new Error('Jogo salvo corrompido');
      write(entry);
      if (w !== null && next < this.MAX) dict[next++] = w + entry[0];
      w = entry;
    }
    return new TextDecoder().decode(buf.subarray(0, n));
  },
};

class MinHeap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(key, pri) {
    const k = this.k, p = this.p;
    let i = k.length; k.push(key); p.push(pri);
    while (i > 0) {
      const pa = (i - 1) >> 1;
      if (p[pa] <= pri) break;
      k[i] = k[pa]; p[i] = p[pa]; i = pa;
    }
    k[i] = key; p[i] = pri;
  }
  pop() {
    const k = this.k, p = this.p;
    const top = k[0];
    const lk = k.pop(), lp = p.pop();
    const n = k.length;
    if (n > 0) {
      let i = 0;
      while (true) {
        const l = 2 * i + 1, r = l + 1;
        let m = i, mp = lp;
        if (l < n && p[l] < mp) { m = l; mp = p[l]; }
        if (r < n && p[r] < mp) { m = r; mp = p[r]; }
        if (m === i) break;
        k[i] = k[m]; p[i] = p[m]; i = m;
      }
      k[i] = lk; p[i] = lp;
    }
    return top;
  }
}

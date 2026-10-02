'use strict';
// Bandeiras e brasões dos reinos. Cada reino tem uma bandeira (padrão em duas cores) e um brasão
// (escudo com divisão e um símbolo). O rei pode mudar o nome do reino, a cor, a bandeira e o brasão.

const TINCTURES = [['#2f6fd6', 'Azul'], ['#c8322f', 'Vermelho'], ['#3fae4a', 'Verde'], ['#8e44c4', 'Púrpura'], ['#e08a2a', 'Laranja'], ['#d14f9a', 'Rosa'],
  ['#3fb7c9', 'Turquesa'], ['#7a1f2a', 'Vinho'], ['#2a4a8a', 'Azul-marinho'], ['#5a6a2a', 'Oliva'], ['#2a2a30', 'Negro'], ['#a8791a', 'Ouro velho']];
const METALS = [['#f2c45a', 'Ouro'], ['#e8eef4', 'Prata'], ['#1e1e24', 'Negro']];
const FLAG_PATTERNS = [['plain', 'Lisa'], ['stripe', 'Faixa'], ['vertical', 'Dividida'], ['cross', 'Cruz'], ['saltire', 'Aspa'], ['chevron', 'Divisa'], ['quarters', 'Quartéis'], ['border', 'Bordadura']];
const ARMS_DIVISIONS = [['plain', 'Liso'], ['pale', 'Partido'], ['fess', 'Cortado'], ['quarterly', 'Esquartelado'], ['bend', 'Banda'], ['chief', 'Chefe']];
const CHARGES = ['⚜', '♛', '⚔', '✠', '☀', '✦', '☾', '♞', '♜', '⚓', '✿', '♣', '❄', '✚'];
// a bandeira e o brasão de cada reino no começo do jogo (mesma ordem de CIV_DEFS)
const HERALDRY_DEFAULT = [
  { flag: 'cross',    metal: '#f2c45a', division: 'chief',     charge: '♛' }, // Valdória
  { flag: 'stripe',   metal: '#f2c45a', division: 'pale',      charge: '⚔' }, // Karthum
  { flag: 'saltire',  metal: '#e8eef4', division: 'fess',      charge: '❄' }, // Nordheim
  { flag: 'border',   metal: '#f2c45a', division: 'plain',     charge: '♣' }, // Elvaren
  { flag: 'chevron',  metal: '#e8eef4', division: 'bend',      charge: '☾' }, // Mordrak
  { flag: 'quarters', metal: '#e8eef4', division: 'quarterly', charge: '⚓' }, // Brennor
  { flag: 'vertical', metal: '#e8eef4', division: 'plain',     charge: '✿' }, // Valtaris
];
// nomes e cores originais (o jogo muda CIV_DEFS quando o rei renomeia ou troca a cor)
const CIV_BASE = CIV_DEFS.map((d, i) => Object.assign({ name: d.name, short: d.short, color: d.color, roof: d.roof }, HERALDRY_DEFAULT[i]));
const HERALD_FONT = '"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","DejaVu Sans",serif';

const Heraldry = {
  H() { return G.heraldry || (G.heraldry = {}); },
  // o que vale para o reino agora (o = mudanças só para a prévia)
  get(ci, o) {
    const b = CIV_BASE[ci], h = this.H()[ci] || {};
    return Object.assign({ name: CIV_DEFS[ci].name, short: CIV_DEFS[ci].short, color: Game.civColor(ci),
      metal: h.metal || b.metal, flag: h.flag || b.flag, division: h.division || b.division, charge: h.charge || b.charge }, o || {});
  },
  customColor(ci) { const h = this.H()[ci]; return !!(h && h.color); },
  // volta os nomes e cores originais e aplica as mudanças guardadas no jogo salvo
  apply() {
    CIV_BASE.forEach((b, i) => {
      const h = this.H()[i] || {}, d = CIV_DEFS[i];
      d.name = h.name || b.name; d.short = h.short || b.short; d.color = h.color || b.color;
      d.roof = h.color ? U.shade(h.color, -0.28) : b.roof;
    });
    this.cache = new Map();
    if (World.tiles) { World.chunks = new Map(); if (World.mini) World.buildMinimap(); }
  },
  set(ci, patch) {
    const H = this.H();
    H[ci] = Object.assign({}, H[ci] || {}, patch);
    this.apply();
  },
  reset(ci) {
    delete this.H()[ci];
    this.apply();
    UI.msg(`🛡️ ${CIV_DEFS[ci].name} voltou ao nome, à cor, à bandeira e ao brasão originais.`, 'gold');
  },
  rename(ci, name, short) {
    name = String(name || '').trim().replace(/\s+/g, ' '); short = String(short || '').trim().replace(/\s+/g, ' ');
    if (name.length < 3 || name.length > 32) { UI.msg('O nome do reino precisa ter de 3 a 32 letras.', 'bad'); return false; }
    if (short.length < 3 || short.length > 14) { UI.msg('O nome curto precisa ter de 3 a 14 letras.', 'bad'); return false; }
    if (CIV_DEFS.some((d, i) => i !== ci && (d.short.toLowerCase() === short.toLowerCase() || d.name.toLowerCase() === name.toLowerCase()))) { UI.msg('Já existe um reino com esse nome.', 'bad'); return false; }
    const old = CIV_DEFS[ci].name;
    if (old === name && CIV_DEFS[ci].short === short) return false;
    this.set(ci, { name, short });
    Diplo.chronicle(`🛡️ O ${old} agora se chama ${name}, por ordem de ${G.name}.`, true);
    UI.banner(`🛡️ ${name}`);
    return true;
  },

  // ------------------------------------------------------------ desenho (SVG, usado na interface e no mapa)
  flagSvg(ci, w, h, o) {
    const x = this.get(ci, o), f = x.color, m = x.metal;
    let p = '';
    switch (x.flag) {
      case 'stripe': p = `<rect y="7.5" width="30" height="5" fill="${m}"/>`; break;
      case 'vertical': p = `<rect x="15" width="15" height="20" fill="${m}"/>`; break;
      case 'cross': p = `<rect x="9" width="4" height="20" fill="${m}"/><rect y="8" width="30" height="4" fill="${m}"/>`; break;
      case 'saltire': p = `<path d="M0 0 L30 20 M30 0 L0 20" stroke="${m}" stroke-width="3.6"/>`; break;
      case 'chevron': p = `<path d="M0 20 L15 9 L30 20 L30 14.5 L15 3.5 L0 14.5 Z" fill="${m}"/>`; break;
      case 'quarters': p = `<rect width="15" height="10" fill="${m}"/><rect x="15" y="10" width="15" height="10" fill="${m}"/>`; break;
      case 'border': p = `<rect x="1.6" y="1.6" width="26.8" height="16.8" fill="none" stroke="${m}" stroke-width="2.6"/>`; break;
    }
    const charge = x.flag === 'plain' || x.flag === 'border' || x.flag === 'stripe'
      ? `<text x="15" y="14.2" text-anchor="middle" font-size="10" font-family='${HERALD_FONT}' fill="${x.flag === 'stripe' ? f : m}" stroke="#1a1208" stroke-width="0.5" paint-order="stroke">${x.charge}&#xFE0E;</text>` : '';
    return `<svg class="hflag" width="${w}" height="${h}" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="20" fill="${f}"/>${p}${charge}<rect width="30" height="20" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="0.8"/></svg>`;
  },
  armsSvg(ci, size, o) {
    const x = this.get(ci, o), f = x.color, m = x.metal, id = ['sh', ci, x.division, x.charge.codePointAt(0), f.slice(1), m.slice(1)].join('_'); // fixo: a imagem fica guardada
    let d = '';
    switch (x.division) {
      case 'pale': d = `<rect x="20" width="20" height="48" fill="${m}"/>`; break;
      case 'fess': d = `<rect y="22" width="40" height="26" fill="${m}"/>`; break;
      case 'quarterly': d = `<rect x="20" width="20" height="22" fill="${m}"/><rect y="22" width="20" height="26" fill="${m}"/>`; break;
      case 'bend': d = `<path d="M-2 4 L6 -2 L42 40 L34 48 Z" fill="${m}"/>`; break;
      case 'chief': d = `<rect width="40" height="14" fill="${m}"/>`; break;
    }
    const sh = 'M3 3 H37 V22 C37 35 28 42 20 45.5 C12 42 3 35 3 22 Z';
    const h = Math.round(size * 1.2);
    return `<svg class="harms" width="${size}" height="${h}" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${id}"><path d="${sh}"/></clipPath></defs>
      <g clip-path="url(#${id})"><rect width="40" height="48" fill="${f}"/>${d}</g>
      <text x="20" y="${x.division === 'chief' ? 33 : 30}" text-anchor="middle" font-size="17" font-family='${HERALD_FONT}' fill="${m === '#1e1e24' ? '#f2c45a' : m}" stroke="#1a1208" stroke-width="1.1" paint-order="stroke">${x.charge}&#xFE0E;</text>
      <path d="${sh}" fill="none" stroke="#1a1208" stroke-width="2.2"/><path d="${sh}" fill="none" stroke="#d6ae60" stroke-width="0.9" transform="translate(20 24) scale(0.9) translate(-20 -24)"/></svg>`;
  },
  // imagem (do SVG) para desenhar no mapa, guardada para não refazer a cada quadro
  img(ci, kind) {
    const svg = kind === 'flag' ? this.flagSvg(ci, 60, 40) : this.armsSvg(ci, 40);
    this.cache = this.cache || new Map();
    let im = this.cache.get(svg);
    if (!im) { im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); this.cache.set(svg, im); }
    return im.complete && im.naturalWidth ? im : null;
  },
  // bandeira tremulando: fatias verticais deslocadas por uma onda
  drawFlag(ctx, x, y, w, h, ci, t) {
    const im = this.img(ci, 'flag');
    if (!im) { ctx.fillStyle = Game.civColor(ci); ctx.fillRect(x, y, w, h); return; }
    const n = 8, sw = w / n, iw = im.naturalWidth / n;
    for (let k = 0; k < n; k++) {
      const off = Math.sin(t * 4 + k * 0.7 + ci) * (k / n) * 2;
      ctx.drawImage(im, k * iw, 0, iw, im.naturalHeight, x + k * sw, y + off, sw + 0.6, h);
    }
  },
  drawArms(ctx, cx, cy, s, ci) {
    const im = this.img(ci, 'arms');
    if (im) ctx.drawImage(im, cx - s / 2, cy - s * 0.6, s, s * 1.2);
  },
};

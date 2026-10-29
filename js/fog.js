'use strict';
// Mapa com neblina: o mapa do mundo e o minimapa só mostram o que você já viu (um raio em volta de onde andou). O que
// ninguém viu fica escuro — vilas, castelos, cavernas e acampamentos de lá também não aparecem.
//  • 🗺️ Mapa do Tesouro: ao usar, o mapa marca um X num lugar longe dali e clareia a região em volta. Vá até lá e cave
//    com a pá em cima do X: ouro, gemas e, às vezes, um item raro.
//  • 📜 Carta do Reino (correio, observatório e prefeitura): clareia todo o território do reino onde foi comprada.
// Jogos salvos de antes da neblina continuam com o mapa todo à vista.
const FOG_CELL = 4;      // blocos por casa da neblina
const FOG_R = 26;        // raio (em blocos) do que se vê em volta do herói (no barco e a cavalo, mais)

const Fog = {
  cv: null, g: null, n: 0, W: 0, H: 0, t: 0,
  on() { return !!G.fogOn && !G.dungeon; },
  // casas exploradas (uma por FOG_CELL × FOG_CELL blocos), guardadas como texto no jogo salvo
  init() {
    this.W = Math.ceil(WORLD_W / FOG_CELL); this.H = Math.ceil(WORLD_H / FOG_CELL);
    if (!G.fog || G.fog.length !== this.W * this.H) G.fog = new Uint8Array(this.W * this.H);
    this.cv = document.createElement('canvas'); this.cv.width = this.W; this.cv.height = this.H;
    this.g = this.cv.getContext('2d');
    this.g.fillStyle = '#0b0906'; this.g.fillRect(0, 0, this.W, this.H);
    for (let i = 0; i < G.fog.length; i++) if (G.fog[i]) this.g.clearRect(i % this.W, (i / this.W) | 0, 1, 1);
  },
  seen(tx, ty) { if (!this.on()) return true; const cx = Math.floor(tx / FOG_CELL), cy = Math.floor(ty / FOG_CELL); return cx >= 0 && cy >= 0 && cx < this.W && cy < this.H && !!G.fog[cy * this.W + cx]; },
  reveal(tx, ty, r) {
    if (!G.fog || !this.g) return 0;
    const c0 = Math.floor((tx - r) / FOG_CELL), c1 = Math.floor((tx + r) / FOG_CELL), d0 = Math.floor((ty - r) / FOG_CELL), d1 = Math.floor((ty + r) / FOG_CELL);
    let n = 0;
    for (let cy = Math.max(0, d0); cy <= Math.min(this.H - 1, d1); cy++) for (let cx = Math.max(0, c0); cx <= Math.min(this.W - 1, c1); cx++) {
      const i = cy * this.W + cx; if (G.fog[i]) continue;
      const dx = (cx + 0.5) * FOG_CELL - tx, dy = (cy + 0.5) * FOG_CELL - ty;
      if (dx * dx + dy * dy > r * r) continue;
      G.fog[i] = 1; this.g.clearRect(cx, cy, 1, 1); n++;
    }
    return n;
  },
  pct() { if (!G.fog) return 100; let n = 0; for (let i = 0; i < G.fog.length; i++) n += G.fog[i]; return Math.round(n / G.fog.length * 100); },
  // o mapa salvo: casas exploradas em sequências (texto curto)
  pack() { if (!G.fog) return null; let s = '', cur = G.fog[0], run = 0; for (let i = 0; i <= G.fog.length; i++) { if (i < G.fog.length && G.fog[i] === cur && run < 35000) { run++; continue; } s += run.toString(36) + ','; cur = G.fog[i]; run = 1; } return (G.fog[0] ? '1' : '0') + ':' + s; },
  unpack(str, n) {
    const a = new Uint8Array(n); if (!str) return a;
    const [first, rest] = str.split(':'); let v = +first, i = 0;
    for (const r of rest.split(',')) { if (!r) continue; const k = parseInt(r, 36); if (v) a.fill(1, i, Math.min(n, i + k)); i += k; v = v ? 0 : 1; }
    return a;
  },
  update(dt) {
    if (!this.on() || G.place || !G.fog) return;
    this.t -= dt; if (this.t > 0) return; this.t = 0.25;
    const r = FOG_R + (P.sailing ? 12 : P.mounted ? 6 : 0) + (Season.idx() === 3 ? -4 : 0);
    if (this.reveal(P.x / TILE, P.y / TILE, r)) this.dirty = true;
  },
  // por cima do mapa: o escuro do que não foi visto (bordas suaves)
  drawOver(g, x, y, w, h) {
    if (!this.on() || !this.cv) return;
    g.save(); g.imageSmoothingEnabled = true; g.globalAlpha = 0.97; g.drawImage(this.cv, x, y, w, h); g.restore();
  },
  // ---------------------------------------------------------------- tesouros
  T() { return G.treasures || (G.treasures = []); },
  newTreasure() {
    const px = Math.floor(P.x / TILE), py = Math.floor(P.y / TILE);
    for (let k = 0; k < 400; k++) {
      const a = Math.random() * Math.PI * 2, d = U.rint(35, 110), x = Math.round(px + Math.cos(a) * d), y = Math.round(py + Math.sin(a) * d);
      if (!World.inb(x, y) || x < 2 || y < 2 || x > WORLD_W - 3 || y > WORLD_H - 3) continue;
      const i = World.idx(x, y), t = World.tiles[i];
      if (!TINFO[t].walk || World.isWater(t) || t === T.ROAD || t === T.BRIDGE || World.sgrid[i] >= 0) continue;
      if (Urban.villageNear(x, y, 14) >= 0 || World.capitals.some(c => U.dist(x, y, c.x, c.y) < 14)) continue;
      const tr = { x, y, day: G.day }; this.T().push(tr);
      this.reveal(x, y, 9);
      return tr;
    }
    return null;
  },
  dig(tx, ty) {
    const L = this.T(), tr = L.find(q => Math.abs(q.x - tx) <= 1 && Math.abs(q.y - ty) <= 1); if (!tr) return false;
    G.treasures = L.filter(q => q !== tr);
    const g = U.rint(150, 420) * (1 + (typeof Expansion !== 'undefined' ? Expansion.luck() : 0) * 0.4); P.gold += Math.round(g);
    const got = [`${Math.round(g)} 🪙`];
    for (let k = U.rint(1, 2); k > 0; k--) { const it = U.pick(['gem', 'ruby', 'emerald', 'pearl', 'ancient_coin', 'gold_bar'].filter(x => ITEMS[x])); const n = U.rint(1, 3); Inv.add(it, n); got.push(`${n} ${ITEMS[it].name}`); }
    if (Math.random() < 0.15) { const r = U.pick(['ancient_blade', 'crystal_crown', 'lucky_charm', 'amber_amulet'].filter(x => ITEMS[x])); if (r) { Inv.add(r, 1); got.push('✨ ' + ITEMS[r].name); } }
    Sound.play('chest'); Sound.play('coin'); UI.banner('💰 Tesouro desenterrado!');
    UI.msg(`🗺️ O X estava certo! Você desenterrou: ${got.join(', ')}.`, 'gold', true);
    Progress.add('treasures'); Progress.diary('🗺️ Desenterrou um tesouro seguindo um mapa.');
    return true;
  },
  // as marcas X no mapa
  drawX(g, X, Y, r) {
    for (const tr of this.T()) {
      const x = X(tr.x + 0.5), y = Y(tr.y + 0.5);
      g.save(); g.strokeStyle = '#1a1208'; g.lineWidth = r * 0.7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke();
      g.strokeStyle = '#e8302a'; g.lineWidth = r * 0.4; g.stroke(); g.restore();
    }
  },
  // carta do reino: clareia o território inteiro de um reino
  chart(ci) {
    if (ci === undefined || ci < 0 || !World.terr) return 0;
    let n = 0;
    for (let cy = 0; cy < this.H; cy++) for (let cx = 0; cx < this.W; cx++) {
      const tx = cx * FOG_CELL + 2, ty = cy * FOG_CELL + 2; if (!World.inb(tx, ty) || World.terr[World.idx(tx, ty)] !== ci) continue;
      const i = cy * this.W + cx; if (!G.fog[i]) { G.fog[i] = 1; this.g.clearRect(cx, cy, 1, 1); n++; }
    }
    return n;
  },
};

// carta do reino (item novo)
if (!ITEMS.region_chart) {
  ITEMS.region_chart = { name: 'Carta do Reino', icon: '📜', cat: 'Diversos', price: 60, use: 'chart' };
  ART_ITEMS.region_chart = ART_ITEMS.treasure_map || ART_ITEMS.parchment || ['scroll', 'linen'];
  for (const k of ['wp_vpost', 'wp_observatory', 'wp_vhall']) if (SHOPS[k] && !SHOPS[k].sells.includes('region_chart')) { SHOPS[k].sells.push('region_chart'); SHOPS[k].sells.sort((a, b) => Order.itemValue(a) - Order.itemValue(b)); }
}

{
  // jogo novo: com neblina (e o começo já visto); jogo salvo antigo: sem neblina (o mapa todo continua à vista)
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) {
    G.fog = null; G.treasures = []; G.fogOn = true;
    const r = await ng0(...a);
    if (G.state === 'play') { G.fogOn = true; Fog.init(); Fog.reveal(P.x / TILE, P.y / TILE, 22); }
    return r;
  };
  // ao carregar: a neblina do jogo salvo (jogo de antes da neblina: sem neblina)
  const ld0 = Game.load.bind(Game);
  Game.load = async function (slot, onProgress, data) {
    const s = data || Saves.read(slot);
    if (s && typeof s === 'object') { G.fogOn = !!s.fogOn; G.treasures = s.treasures || []; G.fogPacked = s.fogOn ? s.fog : null; G.fog = null; }
    const r = await ld0(slot, onProgress, s);
    if (G.state === 'play') { if (G.fogPacked) G.fog = Fog.unpack(G.fogPacked, Math.ceil(WORLD_W / FOG_CELL) * Math.ceil(WORLD_H / FOG_CELL)); G.fogPacked = null; Fog.init(); }
    return r;
  };
  const sn0 = Game.snapshot.bind(Game);
  Game.snapshot = function (...a) { const s = sn0(...a); if (s && typeof s === 'object') { s.fogOn = !!G.fogOn; s.fog = G.fogOn ? Fog.pack() : null; s.treasures = G.treasures || []; } return s; };
  // a cada quadro: o que está em volta fica visto
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); Fog.update(dt); };
  // minimapa: o escuro por cima e os X dos tesouros
  const dm0 = Game.drawMinimap.bind(Game);
  Game.drawMinimap = function (ctx, cw) {
    const r = dm0(ctx, cw), R = this.miniRect; if (!R || G.dungeon) return r;
    ctx.save(); ctx.beginPath(); ctx.roundRect(R.x, R.y, R.s, R.s, 6); ctx.clip();
    Fog.drawOver(ctx, R.x, R.y, R.s, R.s);
    const k = R.s / WORLD_W; Fog.drawX(ctx, tx => R.x + tx * k, ty => R.y + ty * k, 3);
    const px = R.x + P.x / TILE * k, py = R.y + P.y / TILE * k; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1b4f8a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    return r;
  };
  // os lugares do mapa (lista, busca e toque) só os que você já viu
  const pl0 = MapView.places.bind(MapView);
  MapView.places = function (...a) { const L = pl0(...a); return Fog.on() && Array.isArray(L) ? L.filter(p => p && (p.x === undefined || Fog.seen(p.x, p.y))) : L; };
  // usar o mapa do tesouro e a carta do reino
  const us0 = Expansion.use.bind(Expansion);
  Expansion.use = function (k) {
    if (k === 'treasure_map') {
      if (G.dungeon) { UI.msg('Aqui embaixo o mapa não serve de nada.', 'bad'); return; }
      const tr = Fog.newTreasure(); if (!tr) { UI.msg('O mapa está ilegível...', 'bad'); return; }
      Inv.add(k, -1); G.ping = { x: tr.x + 0.5, y: tr.y + 0.5, name: 'X do tesouro' };
      UI.msg(`🗺️ O mapa mostra um X a ${Math.round(U.dist(tr.x, tr.y, P.x / TILE, P.y / TILE))} passos daqui (marcado no mapa). Leve uma pá e cave em cima dele!`, 'gold', true);
      return;
    }
    if (k === 'region_chart') {
      const ci = Clima.civAt(Math.floor(P.x / TILE), Math.floor(P.y / TILE));
      if (ci < 0) { UI.msg('Use a carta dentro de um reino para ver o território dele.', 'bad'); return; }
      Inv.add(k, -1); const n = Fog.chart(ci);
      UI.msg(`📜 A carta revela todo o território de ${CIV_DEFS[ci].name}${n ? '' : ' (você já conhecia tudo)'}.`, 'gold');
      return;
    }
    return us0(k);
  };
  // cavar em cima do X
  const du0 = Dig.use.bind(Dig);
  Dig.use = function (tx, ty) { if (Dig.mode() === 'dig' && Fog.dig(tx, ty)) return true; return du0(tx, ty); };
}

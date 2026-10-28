'use strict';
// Navegação de verdade.
//  • ⛵ Estaleiro (em todo porto): compre uma Caravela ou um Galeão. O navio é mais rápido que o barco a remo, tem
//    porão para carga e casco que aguenta tempestades e piratas (conserto no porto).
//  • 📦 Comércio por mar: no porto, compre mercadorias para o porão pelo preço daquele reino e venda em outro porto —
//    cada reino tem o que sobra (barato) e o que falta (caro).
//  • 🧭 Viagens: do porto, zarpe para outro porto ou para as ilhas grandes. No caminho podem vir tempestades (o casco
//    sofre e parte da carga pode ir ao mar) e piratas (lutar, fugir ou pagar).
//  • 🏴‍☠️ Navegando em alto-mar, piratas aparecem em barcos e atacam com arcos; na tempestade, o barco sofre (e o navio
//    sem casco afunda — você vai parar na praia mais perto).
const SHIPS = {
  caravel: { name: 'Caravela', icon: '⛵', price: 1800, hold: 120, hull: 120, speed: 1.35, power: 8, desc: 'Rápida e leve: boa para o comércio entre os portos.' },
  galleon: { name: 'Galeão',   icon: '🚢', price: 4500, hold: 300, hull: 240, speed: 1.15, power: 18, desc: 'Grande e armado: carrega muito e enfrenta piratas.' },
};
const SEA_GOODS = ['spices', 'silk_cloth', 'wine', 'salt', 'olive_oil', 'amber', 'iron_bar', 'honey', 'cloth', 'dates', 'furs', 'pearl', 'perfume', 'coal'];
const SHIP_NAMES = ['Estrela do Mar', 'Gaivota', 'Rainha das Ondas', 'Andorinha', 'Tormenta', 'Sereia', 'Vento Leste', 'Lua Cheia', 'Esperança', 'Dragão Azul'];
if (!CREATURES.pirate) CREATURES.pirate = { name: 'Pirata', hp: 75, dmg: 12, speed: 70, r: 10, faction: 'bandit', gold: [15, 45], xp: 35, aggro: 11, drops: { rope: [0, 2] } };

const Sea = {
  ship() { return G.ship || null; },
  goods() { return SEA_GOODS.filter(k => ITEMS[k]); },
  used() { const s = this.ship(); return s ? Object.values(s.hold).reduce((a, n) => a + n, 0) : 0; },
  speed() { const s = this.ship(); return s ? SHIPS[s.kind].speed : 1; },
  civOfPort(s) { return typeof s.owner === 'number' && s.owner >= 0 ? s.owner : (World.terr ? World.terr[World.idx(s.x, s.y)] : 0); },
  // preço no porto (o do reino do porto)
  price(s, k) { const ci = Math.max(0, this.civOfPort(s)); return Game.price(ci, k); },
  // ---------------------------------------------------------------- estaleiro
  buy(kind) {
    const d = SHIPS[kind]; if (!d) return;
    const old = this.ship(), credit = old ? Math.round(SHIPS[old.kind].price * 0.5) : 0;
    if (P.gold + credit < d.price) { UI.msg(`O ${d.name} custa ${d.price} 🪙${credit ? ` (o seu navio vale ${credit} na troca)` : ''}.`, 'bad'); return; }
    if (old && this.used()) { UI.msg('Venda a carga do porão antes de trocar de navio.', 'bad'); return; }
    P.gold -= d.price - credit;
    G.ship = { kind, name: U.pick(SHIP_NAMES), hull: d.hull, hold: {} };
    Sound.play('coin'); UI.banner(`${d.icon} ${d.name} ${G.ship.name}!`);
    UI.msg(`${d.icon} O ${d.name} "${G.ship.name}" é seu! Embarque em qualquer margem (E) — ele é mais rápido que o barco a remo e tem porão para ${d.hold} mercadorias.`, 'gold', true);
    Progress.add('ships'); Progress.diary(`${d.icon} Comprou o ${d.name} "${G.ship.name}".`);
  },
  repairCost() { const s = this.ship(); return s ? Math.round((SHIPS[s.kind].hull - s.hull) * 3) : 0; },
  repair() { const c = this.repairCost(); if (!c) return; if (P.gold < c) { UI.msg(`O conserto custa ${c} 🪙.`, 'bad'); return; } P.gold -= c; this.ship().hull = SHIPS[this.ship().kind].hull; UI.msg(`🔨 Casco consertado (${c} 🪙).`, 'gold'); },
  sellShip() { const s = this.ship(); if (!s) return; if (this.used()) { UI.msg('Venda a carga do porão primeiro.', 'bad'); return; } const g = Math.round(SHIPS[s.kind].price * 0.5 * s.hull / SHIPS[s.kind].hull); P.gold += g; G.ship = null; if (P.sailing && Inv.count('boat') <= 0) P.sailing = false; UI.msg(`⚓ Você vendeu o navio por ${g} 🪙.`, 'gold'); },
  // ---------------------------------------------------------------- porão
  load(sid, k, n) {
    const s = World.structs[sid], sh = this.ship(); if (!sh || !s) return;
    const pr = this.price(s, k).buy; n = Math.min(n, SHIPS[sh.kind].hold - this.used(), Math.floor(P.gold / pr));
    if (n <= 0) { UI.msg(this.used() >= SHIPS[sh.kind].hold ? 'O porão está cheio.' : 'Ouro insuficiente.', 'bad'); return; }
    P.gold -= n * pr; sh.hold[k] = (sh.hold[k] || 0) + n; Sound.play('coin');
  },
  unload(sid, k, n) {
    const s = World.structs[sid], sh = this.ship(); if (!sh || !s) return;
    n = Math.min(n, sh.hold[k] || 0); if (n <= 0) return;
    const pr = this.price(s, k).sell; P.gold += n * pr; sh.hold[k] -= n; if (!sh.hold[k]) delete sh.hold[k];
    Sound.play('coin'); Progress.add('seaTrade', n * pr);
  },
  // ---------------------------------------------------------------- viagens
  dests(from) {
    const out = Ports.list().filter(s => s !== from).map(s => ({ kind: 'port', s, name: `Porto de ${CIV_DEFS[this.civOfPort(s)] ? CIV_DEFS[this.civOfPort(s)].short : '?'}`, x: s.x, y: s.y }));
    (World.islands || []).slice(0, 4).forEach((is, k) => out.push({ kind: 'island', is, name: `Ilha ${['do Dragão', 'das Gaivotas', 'Perdida', 'dos Corais'][k]}`, x: is.x, y: is.y }));
    return out.map(d => Object.assign(d, { dist: Math.round(U.dist(from.x, from.y, d.x, d.y)) }));
  },
  sail(sid, di) {
    const from = World.structs[sid], d = this.dests(from)[di], sh = this.ship(); if (!from || !d || !sh) return;
    if (sh.hull < 25) { UI.msg('O casco está muito avariado: conserte antes de zarpar.', 'bad'); return; }
    const fee = 15 + Math.round(d.dist / 10); if (P.gold < fee) { UI.msg(`A tripulação cobra ${fee} 🪙 pela viagem.`, 'bad'); return; }
    P.gold -= fee;
    G.voyage = { sid, d: { kind: d.kind, name: d.name, sid: d.s ? d.s.id : null, isl: d.is ? World.islands.indexOf(d.is) : null, dist: d.dist }, log: [`⛵ ${sh.name} zarpou rumo a ${d.name} (${d.dist} léguas, ${fee} 🪙 para a tripulação).`] };
    UI.close();
    this.go();
  },
  // os acontecimentos da viagem, um por um (os piratas esperam a sua escolha)
  go() {
    const V = G.voyage, sh = this.ship(); if (!V || !sh) return;
    const legs = Math.max(1, Math.round(V.d.dist / 60));
    V.leg = V.leg || 0;
    while (V.leg < legs) {
      V.leg++;
      const r = Math.random(), stormy = typeof Clima !== 'undefined' && G.civs.some(c => Clima.kind(c.id) === 'tempestade') ? 0.12 : 0;
      if (r < 0.14 + stormy) {
        const dmg = U.rint(12, 34); sh.hull = Math.max(0, sh.hull - dmg);
        V.log.push(`⛈️ Tempestade! O casco sofreu ${dmg} de dano (${sh.hull}/${SHIPS[sh.kind].hull}).`);
        if (sh.hull < 40 && this.used()) { const lost = this.dump(0.3); V.log.push(`🌊 Parte da carga foi ao mar: ${lost}.`); }
        if (sh.hull <= 0) { this.wreck(V.log); return; }
      } else if (r < 0.32 + stormy) { V.pirates = { n: U.rint(3, 7), toll: 40 + Math.round(this.used() * 0.8) }; this.pirateWin(); return; }
      else if (r < 0.4 + stormy) { const f = U.pick(['cod', 'sardine', 'tuna', 'shark'].filter(k => ITEMS[k])); if (f) { const n = U.rint(2, 6); Inv.add(f, n); V.log.push(`🎣 A tripulação pescou ${n} ${ITEMS[f].name}.`); } }
    }
    this.arrive();
  },
  power() { const sh = this.ship(); return (sh ? SHIPS[sh.kind].power : 3) + Game.allies().length * 3 + P.level * 0.6 + (sh ? sh.hull / 30 : 0); },
  pirateWin() {
    const V = G.voyage, p = V.pirates, win = Math.round(U.clamp(this.power() / (this.power() + p.n * 2.2), 0.1, 0.92) * 100), flee = Math.round(U.clamp(0.25 + (this.speed() - 1) * 1.2, 0.2, 0.8) * 100);
    UI.open('🏴‍☠️ Piratas!', `<div class="card sea-pir"><p>Velas negras no horizonte: <b>${p.n} barcos piratas</b> cercam o ${UI.esc(this.ship().name)}.</p>
      <div class="act-row"><button class="primary" data-act="sea" data-op="pfight">⚔️ Lutar (${win}% de chance)</button><button data-act="sea" data-op="pflee">💨 Fugir (${flee}%)</button><button data-act="sea" data-op="ppay" ${P.gold >= p.toll ? '' : 'disabled'}>💰 Pagar ${p.toll} 🪙</button></div></div>
      <ul class="sea-log">${V.log.map(l => `<li>${UI.esc(l)}</li>`).join('')}</ul>`, 'seaPirates', []);
  },
  pirates(op) {
    const V = G.voyage, p = V && V.pirates, sh = this.ship(); if (!p || !sh) return;
    if (op === 'ppay') { if (P.gold < p.toll) return; P.gold -= p.toll; V.log.push(`💰 Você pagou ${p.toll} 🪙 e os piratas foram embora.`); }
    else if (op === 'pflee' && Math.random() < U.clamp(0.25 + (this.speed() - 1) * 1.2, 0.2, 0.8)) V.log.push('💨 O vento ajudou: vocês deixaram os piratas para trás.');
    else if (op === 'pfight' && Math.random() < U.clamp(this.power() / (this.power() + p.n * 2.2), 0.1, 0.92)) {
      const g = U.rint(60, 160) * p.n; P.gold += g; const d = U.rint(5, 18); sh.hull = Math.max(1, sh.hull - d);
      Progress.add('kill_pirate', p.n); Progress.add('pirateWins'); Game.gainXp(20 * p.n);
      V.log.push(`⚔️ Vitória! Os piratas fugiram deixando ${g} 🪙 (o casco levou ${d} de dano).`);
    } else {
      const d = U.rint(20, 45); sh.hull = Math.max(0, sh.hull - d); const lost = this.dump(0.5);
      V.log.push(`☠️ Os piratas abordaram o navio: levaram ${lost || 'pouca coisa'} e o casco levou ${d} de dano.`);
      P.hp = Math.max(1, P.hp - 20);
      if (sh.hull <= 0) { V.pirates = null; this.wreck(V.log); return; }
    }
    V.pirates = null; UI.close(); this.go();
  },
  dump(f) { const sh = this.ship(), out = []; for (const k of Object.keys(sh.hold)) { const n = Math.ceil(sh.hold[k] * f); sh.hold[k] -= n; if (sh.hold[k] <= 0) delete sh.hold[k]; out.push(`${n} ${ITEMS[k].name}`); } return out.join(', '); },
  arrive() {
    const V = G.voyage; G.voyage = null; if (!V) return;
    let ok = false;
    if (V.d.kind === 'port') { const s = World.structs[V.d.sid]; if (s) { const p = freeSpotNear((s.x + s.w / 2) * TILE, (s.y + s.h + 0.8) * TILE, 60); P.x = p.x; P.y = p.y; ok = true; } }
    else { const is = World.islands[V.d.isl]; const b = is && this.beach(is.x, is.y, is.r + 6); if (b) { P.x = (b.x + 0.5) * TILE; P.y = (b.y + 0.8) * TILE; ok = true; } }
    P.sailing = false; P.mounted = false;
    for (const a of Game.allies()) { const s = freeSpotNear(P.x, P.y, 50); a.x = s.x; a.y = s.y; a.target = null; }
    V.log.push(ok ? `⚓ Chegada: ${V.d.name}.` : '⚓ A viagem terminou onde começou.');
    Progress.add('voyages'); if (V.d.kind === 'island') G.stats.islands = 1;
    if (typeof Trans !== 'undefined') try { Trans.show('back'); } catch (e) { /* a tela de passagem é só enfeite */ }
    UI.open('🧭 Diário de bordo', `<ul class="sea-log">${V.log.map(l => `<li>${UI.esc(l)}</li>`).join('')}</ul>`, 'seaLog', []);
  },
  wreck(log) {
    const sh = this.ship(); G.voyage = null;
    log.push(`💥 O ${sh.name} afundou! Você nadou até a praia mais perto, sem a carga.`);
    G.ship = null; P.sailing = false;
    const b = this.beach(P.x / TILE, P.y / TILE, 60); if (b) { P.x = (b.x + 0.5) * TILE; P.y = (b.y + 0.8) * TILE; }
    P.hp = Math.max(1, Math.round(P.hp * 0.5));
    Progress.diary(`💥 Perdeu o navio ${sh.name} no mar.`);
    UI.open('💥 Naufrágio', `<ul class="sea-log">${log.map(l => `<li>${UI.esc(l)}</li>`).join('')}</ul>`, 'seaLog', []);
  },
  // praia: terra firme colada na água, perto de (x, y)
  beach(x, y, R) {
    let best = null, bd = 1e9;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const tx = Math.round(x + i), ty = Math.round(y + j); if (!World.inb(tx, ty)) continue;
      const t = World.tile(tx, ty); if (World.isWater(t) || !TINFO[t].walk || World.blocked(tx, ty, false)) continue;
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => World.isWater(World.tile(tx + dx, ty + dy)))) continue;
      const d = i * i + j * j; if (d < bd) { bd = d; best = { x: tx, y: ty }; }
    }
    return best;
  },
  // ---------------------------------------------------------------- navegando no mapa: piratas e tempestades
  t: 0, st: 0,
  update(dt) {
    if (!P.sailing || G.dungeon || G.place) return;
    const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE), deep = World.tile(tx, ty) === T.DEEP;
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 20;
      const alive = G.ents.filter(e => e.kind === 'pirate' && !e.dead).length;
      if (deep && alive < 3 && Math.random() < 0.2) this.spawnPirates();
    }
    // tempestade em alto-mar
    if (G.weather && G.weather.type === 'storm' && G.weather.level > 0.5) {
      this.st -= dt;
      if (this.st <= 0) {
        this.st = 3;
        const sh = this.ship();
        if (sh) { sh.hull = Math.max(0, sh.hull - U.rint(2, 5)); if (sh.hull <= 0) { this.wreck([`⛈️ A tempestade castigou o ${sh.name} até o fim.`]); return; } }
        else P.hp = Math.max(1, P.hp - 3);
        if (G.realTime - (this.warnT || 0) > 12) { this.warnT = G.realTime; UI.msg(sh ? `⛈️ Tempestade! O casco do ${sh.name} está em ${sh.hull}/${SHIPS[sh.kind].hull}. Procure a costa!` : '⛈️ Tempestade! As ondas jogam o barco: procure a costa!', 'bad'); }
      }
    }
  },
  spawnPirates() {
    const n = U.rint(1, 2);
    for (let k = 0; k < n; k++) {
      for (let tries = 0; tries < 40; tries++) {
        const a = Math.random() * Math.PI * 2, d = U.rnd(8, 11) * TILE, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE); if (!World.inb(tx, ty) || !World.isWater(World.tile(tx, ty))) continue;
        const e = Game.spawn('pirate', x, y, { leash: 40, archer: true }); e.sailing = true; e.pirate = true; break;
      }
    }
    if (G.realTime - (this.pWarn || 0) > 30) { this.pWarn = G.realTime; UI.msg('🏴‍☠️ Velas negras! Piratas se aproximam.', 'bad'); }
  },
};

ACHIEVEMENTS.push(
  { id: 'ship', icon: '⛵', name: 'Armador', desc: 'Compre um navio.', t: s => (s.ships || 0) >= 1 },
  { id: 'voyages5', icon: '🧭', name: 'Lobo do Mar', desc: 'Complete 5 viagens por mar.', t: s => (s.voyages || 0) >= 5 },
  { id: 'pirates10', icon: '🏴‍☠️', name: 'Terror dos Piratas', desc: 'Derrote 10 piratas.', t: s => (s.kill_pirate || 0) >= 10 },
  { id: 'seatrade', icon: '📦', name: 'Mercador dos Mares', desc: 'Venda 5.000 🪙 em mercadorias do porão.', t: s => (s.seaTrade || 0) >= 5000 },
);

{
  // embarcar: com navio, não precisa do barco a remo
  const ba0 = Game.boatAction.bind(Game);
  Game.boatAction = function () {
    const r = ba0(); if (r || P.sailing || !Sea.ship()) return r;
    const water = this.findNearTile((x, y) => World.isWater(World.tile(x, y)) && World.tile(x, y) !== T.BRIDGE && !World.blocked(x, y, true));
    return water && { label: `Embarcar no ${SHIPS[Sea.ship().kind].name} ${Sea.ship().name}`, run: () => {
      P.sailing = true; P.fishing = null; P.mounted = false; P.x = (water.x + 0.5) * TILE; P.y = (water.y + 0.8) * TILE;
      UI.msg(`${SHIPS[Sea.ship().kind].icon} A bordo do ${Sea.ship().name}! E perto da margem para desembarcar.`, 'gold');
    } };
  };
  // o navio desenhado (casco, mastro e vela com as cores do herói); o barco a remo, como sempre
  const db0 = drawBoat;
  // eslint-disable-next-line no-global-assign
  drawBoat = function (ctx, x, y, dir, anim, moving, front, pirate) {
    const sh = !pirate && Sea.ship();
    if (!sh) return db0(ctx, x, y, dir, anim, moving, front);
    const big = sh.kind === 'galleon' ? 1.35 : 1.1;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + Math.sin(anim * 2.4) * 1.8)); ctx.scale(dir * big, big);
    if (!front) {
      if (moving) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-34, 2, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.ellipse(0, -4, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-2, -58, 3, 56);
      const sw = Math.sin(anim * (moving ? 3 : 1)) * 2;
      ctx.fillStyle = '#e2d4aa'; ctx.strokeStyle = '#7a6a4a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(1, -56); ctx.quadraticCurveTo(22 + sw, -40, 1, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-1, -54); ctx.quadraticCurveTo(-18 + sw, -40, -1, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PLAYER_COLOR; ctx.fillRect(-6, -42, 12, 3);
      ctx.fillStyle = PLAYER_COLOR; ctx.fillRect(1, -66, 10, 6);
    } else {
      ctx.fillStyle = '#6a4220'; ctx.beginPath(); ctx.moveTo(-30, -6); ctx.quadraticCurveTo(0, 10, 34, -10); ctx.lineTo(30, 2); ctx.quadraticCurveTo(0, 15, -28, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8a050'; ctx.fillRect(-22, 0, 44, 2);
      for (let k = -16; k <= 16; k += 8) { ctx.fillStyle = '#2a1a0a'; ctx.fillRect(k, 3, 3, 3); }
    }
    ctx.restore();
  };
  // pirata: um bandido num barco
  const cd0 = Creature.prototype.draw;
  Creature.prototype.draw = function (ctx, cx, cy) {
    if (this.kind !== 'pirate' || this.dead) return cd0.call(this, ctx, cx, cy);
    const x = this.x - cx, y = this.y - cy;
    db0(ctx, x, y, this.dir || 1, this.anim, this.moving, false);
    this.kind = 'bandit'; this.y -= 5; try { cd0.call(this, ctx, cx, cy); } finally { this.kind = 'pirate'; this.y += 5; }
    db0(ctx, x, y, this.dir || 1, this.anim, this.moving, true);
    ctx.fillStyle = '#111'; ctx.fillRect(Math.round(x) + 2 * (this.dir || 1), Math.round(y) - 34, 8, 5);
  };
  // a cada quadro, no mar
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); Sea.update(dt); };
  // no porto: estaleiro, porão e viagens
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showPort' && args && World.structs[args[0]]) body = Sea.portHtml(World.structs[args[0]]) + body;
    return op0(title, body, fn, args, sub);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'sea') return a0(a, d);
    const sid = +d.s;
    switch (d.op) {
      case 'buy': Sea.buy(d.k); break;
      case 'repair': Sea.repair(); break;
      case 'sellship': Sea.sellShip(); break;
      case 'load': Sea.load(sid, d.k, +d.n); break;
      case 'unload': Sea.unload(sid, d.k, d.n === 'all' ? 1e9 : +d.n); break;
      case 'sail': Sea.sail(sid, +d.i); return;
      case 'pfight': case 'pflee': case 'ppay': Sea.pirates(d.op); return;
    }
    if (UI.cur && UI.cur.fn === 'showPort') UI.showPort(sid);
  };
  // o jogo salvo guarda o navio
  const sn0 = Game.snapshot.bind(Game);
  Game.snapshot = function (...a) { const s = sn0(...a); if (s && typeof s === 'object') s.ship = G.ship || null; return s; };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (slot, onProgress, data) { const s = data || Saves.read(slot); const r = await ld0(slot, onProgress, s); if (G.state === 'play') { G.ship = s && s.ship ? s.ship : null; G.voyage = null; } return r; };
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { G.ship = null; G.voyage = null; return ng0(...a); };
}

// a parte do porto (em cima da janela do porto)
Sea.portHtml = function (s) {
  const sh = this.ship(), esc = UI.esc.bind(UI), ci = this.civOfPort(s), sid = s.id;
  const yard = Object.entries(SHIPS).map(([k, d]) => `<div class="pt-row"><span class="pt-ic">${d.icon}</span><span class="pt-t"><b>${d.name} · ${d.price} 🪙</b><small>${d.desc} Porão ${d.hold} · casco ${d.hull}</small></span>
    <span class="act-row"><button data-act="sea" data-op="buy" data-k="${k}" data-s="${sid}" ${sh && sh.kind === k ? 'disabled' : ''}>${sh && sh.kind === k ? 'Você tem' : sh ? 'Trocar' : 'Comprar'}</button></span></div>`).join('');
  const mine = sh ? `<div class="pt-row"><span class="pt-ic">${SHIPS[sh.kind].icon}</span><span class="pt-t"><b>${esc(sh.name)}</b><small>casco ${sh.hull}/${SHIPS[sh.kind].hull} · porão ${this.used()}/${SHIPS[sh.kind].hold}</small></span>
    <span class="act-row"><button data-act="sea" data-op="repair" data-s="${sid}" ${this.repairCost() && P.gold >= this.repairCost() ? '' : 'disabled'}>🔨 Consertar${this.repairCost() ? ` (${this.repairCost()} 🪙)` : ''}</button><button data-act="sea" data-op="sellship" data-s="${sid}">Vender</button></span></div>` : '';
  const trade = sh ? `<div class="card sea-trade"><div class="sec">📦 Comércio por mar <span>preços de ${CIV_DEFS[ci] ? CIV_DEFS[ci].short : 'aqui'} · porão ${this.used()}/${SHIPS[sh.kind].hold}</span></div><table class="trade sea-tb"><tr><th>Mercadoria</th><th>Compra</th><th>Venda</th><th>No porão</th><th></th></tr>${this.goods().map(k => { const p = this.price(s, k), n = sh.hold[k] || 0;
      return `<tr><td>${UI.ii(k)} ${ITEMS[k].name}</td><td>${p.buy}</td><td>${p.sell}</td><td><b>${n}</b></td><td class="act-row"><button data-act="sea" data-op="load" data-s="${sid}" data-k="${k}" data-n="10" ${P.gold >= p.buy && this.used() < SHIPS[sh.kind].hold ? '' : 'disabled'}>+10</button><button data-act="sea" data-op="unload" data-s="${sid}" data-k="${k}" data-n="all" ${n ? '' : 'disabled'}>Vender</button></td></tr>`; }).join('')}</table>
      <small class="muted">Compre onde está barato e venda num porto de outro reino: cada reino tem o que sobra e o que falta.</small></div>` : '';
  const dests = sh ? this.dests(s).map((d, i) => `<button data-act="sea" data-op="sail" data-s="${sid}" data-i="${i}">${d.kind === 'island' ? '🏝️' : '⚓'} ${esc(d.name)} <small>${d.dist} léguas</small></button>`).join('') : '';
  return `<div class="card sea-yard"><div class="sec">⛵ Estaleiro${sh ? ' e o seu navio' : ''}</div>${mine}${yard}</div>${trade}${sh ? `<div class="card sea-go"><div class="sec">🧭 Zarpar para <span>tempestades e piratas no caminho</span></div><div class="act-row sea-dests">${dests}</div></div>` : ''}`;
};

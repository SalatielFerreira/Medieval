'use strict';
// Feras errantes: de tempos em tempos um Dragão Errante, um Grifo ou uma Serpente do Rio aparece no mundo e vai, mês a
// mês, de vila em vila atacando (prosperidade, moradores e tesouro). Cada reino atacado põe ouro na recompensa pela
// cabeça da fera. Ela aparece no mapa (onde você já viu) e, quando você chega perto, está lá de verdade: derrotá-la paga
// a recompensa inteira, dá fama, a gratidão dos reinos e um troféu.
const BEAST_KINDS = {
  wild_dragon: { name: 'Dragão Errante', icon: '🐉', base: 'dragon', hp: 1500, dmg: 36, speed: 95, r: 24, gold: [500, 800], xp: 1000, trophy: ['dragon_scale', 6], bounty: 900, land: 'hill' },
  griffin:     { name: 'Grifo',          icon: '🦅', hp: 950,  dmg: 28, speed: 125, r: 18, gold: [300, 500], xp: 650, trophy: ['griffin_feather', 3], bounty: 600, land: 'hill' },
  river_serpent:{ name: 'Serpente do Rio', icon: '🐍', hp: 1100, dmg: 30, speed: 75, r: 22, gold: [350, 550], xp: 750, trophy: ['serpent_fang', 2], bounty: 650, land: 'water' },
};
for (const [k, b] of Object.entries(BEAST_KINDS)) if (!CREATURES[k]) CREATURES[k] = { name: b.name, hp: b.hp, dmg: b.dmg, speed: b.speed, r: b.r, faction: 'wild', gold: b.gold, xp: b.xp, aggro: 13, drops: {} };
if (!ITEMS.griffin_feather) ITEMS.griffin_feather = { name: 'Pena de Grifo', icon: '🪶', cat: 'Diversos', price: 220 };
if (!ITEMS.serpent_fang) ITEMS.serpent_fang = { name: 'Presa de Serpente', icon: '🦷', cat: 'Diversos', price: 260 };
Object.assign(ART_ITEMS, { griffin_feather: ART_ITEMS.feather || ['horn', 'gold'], serpent_fang: ['clawi', 'bone'] });

const Beasts = {
  L() { return G.beasts || (G.beasts = []); },
  def(b) { return BEAST_KINDS[b.kind]; },
  bounty(b) { return Object.values(b.bounty || {}).reduce((a, n) => a + n, 0); },
  // onde a fera nasce: montanhas ou colinas longe das vilas (a serpente, na água)
  spot(kind) {
    const water = BEAST_KINDS[kind].land === 'water';
    for (let k = 0; k < 600; k++) {
      const x = U.rint(10, WORLD_W - 10), y = U.rint(10, WORLD_H - 10), t = World.tile(x, y);
      if (water ? !World.isWater(t) || t === T.DEEP : t !== T.HILL && t !== T.SNOW && t !== T.MOUNT) continue;
      if (World.villages.some(v => U.dist(x, y, v.x, v.y) < 25)) continue;
      return { x, y };
    }
    return null;
  },
  spawn(kind) {
    kind = kind || U.pick(Object.keys(BEAST_KINDS));
    const p = this.spot(kind); if (!p) return null;
    const b = { id: (G.beastSeq = (G.beastSeq || 0) + 1), kind, x: p.x, y: p.y, hp: BEAST_KINDS[kind].hp, day: G.day, bounty: {}, attacks: 0, target: -1 };
    this.L().push(b); this.aim(b);
    Diplo.chronicle(`${this.def(b).icon} ${this.def(b).name} foi visto${kind === 'river_serpent' ? 'a' : ''} nas terras selvagens. As vilas trancam as portas.`, true);
    UI.msg(`${this.def(b).icon} Um${kind === 'river_serpent' ? 'a' : ''} ${this.def(b).name} apareceu no mundo! Os reinos vão pagar pela cabeça dele${kind === 'river_serpent' ? 'a' : ''}.`, 'bad', true);
    return b;
  },
  // a próxima vila: a mais perto que ainda não foi atacada por ela neste ano (a serpente prefere vilas perto da água)
  aim(b) {
    const ok = World.villages.map((v, i) => ({ v, i })).filter(x => x.v && !x.v.ruin && x.i !== b.last);
    const near = ok.sort((a, c) => U.dist(a.v.x, a.v.y, b.x, b.y) - U.dist(c.v.x, c.v.y, b.x, b.y)).slice(0, 4);
    const t = U.pick(near); b.target = t ? t.i : -1;
  },
  // todo mês: anda até a vila e ataca
  monthTick() {
    const L = this.L();
    if (L.length < 2 && G.day > 6 && Math.random() < 0.07) this.spawn();
    for (const b of L.slice()) {
      if (b.alive === false) continue;
      const v = World.villages[b.target]; if (!v) { this.aim(b); continue; }
      const d = U.dist(b.x, b.y, v.x, v.y), step = this.def(b).speed / 2.2;
      if (d > step) { b.x = Math.round(b.x + (v.x - b.x) / d * step); b.y = Math.round(b.y + (v.y - b.y) / d * step); continue; }
      b.x = v.x + U.rint(-6, 6); b.y = v.y + U.rint(-6, 6);
      this.attack(b, b.target);
      b.last = b.target; this.aim(b);
    }
  },
  attack(b, vi) {
    const v = World.villages[vi], D = this.def(b); if (!v) return;
    b.attacks++;
    v.beastHit = G.day; v.prosper = Math.max(0, (v.prosper || 0) - 8);
    const res = People.residents(vi).filter(p => !p.capanga && !p.kin && p.age >= 14), dead = [];
    for (let k = U.rint(0, 2); k > 0 && res.length; k--) { const p = res.splice(U.rint(0, res.length - 1), 1)[0]; People.die(p, `atacado pelo ${D.name}`); dead.push(p.name); }
    const c = !v.free ? G.civs[v.civ] : null;
    if (c && !c.dead) {
      const loss = Math.min(Math.max(0, Math.round(c.treasury)), U.rint(60, 180)); c.treasury -= loss; c.happy = Math.max(0, (c.happy || 0) - 3);
      // o reino põe ouro na recompensa
      const add = Math.min(Math.max(0, Math.round(c.treasury * 0.1)), 300) + 100; if (c.ruler !== 'player') { c.treasury -= Math.min(c.treasury, add); b.bounty[v.civ] = (b.bounty[v.civ] || 0) + add; }
    }
    const mine = v.lord === 'player' || (c && c.ruler === 'player'), known = mine || U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 70;
    Diplo.chronicle(`${D.icon} ${D.name} atacou ${v.name}${dead.length ? `: ${dead.join(', ')} não ${dead.length === 1 ? 'sobreviveu' : 'sobreviveram'}` : ''}.`, known);
    if (known) UI.msg(`${D.icon} ${D.name} atacou ${v.name}!${dead.length ? ` ${dead.length} morador(es) morreram.` : ''} Recompensa pela cabeça: ${this.bounty(b)} 🪙.`, 'bad', true);
    if (typeof Rumors !== 'undefined') Rumors.atV(vi, `${D.name} atacou ${v.name}. Quem matar a fera recebe ${this.bounty(b)} moedas.`);
  },
  // perto do herói, a fera existe de verdade
  t: 0,
  update(dt) {
    this.t -= dt; if (this.t > 0 || G.dungeon || G.place) return; this.t = 1;
    for (const b of this.L()) {
      if (b.alive === false) continue;
      const near = U.dist(P.x / TILE, P.y / TILE, b.x, b.y) < 26, e = b.ent && !b.ent.dead && G.ents.includes(b.ent) ? b.ent : null;
      if (near && !e) {
        const D = this.def(b), sp = D.land === 'water' ? { x: (b.x + 0.5) * TILE, y: (b.y + 0.8) * TILE } : freeSpotNear((b.x + 0.5) * TILE, (b.y + 0.5) * TILE, 120);
        const c = Game.spawn(b.kind, sp.x, sp.y, { leash: 14 }); c.maxHp = BEAST_KINDS[b.kind].hp; c.hp = b.hp; c.beast = b.id; if (D.land === 'water') c.sailing = true;
        b.ent = c;
        if (!b.seen) { b.seen = true; UI.msg(`${D.icon} ${D.name} está aqui perto! Recompensa: ${this.bounty(b)} 🪙.`, 'bad', true); Sound.play('roar'); }
      } else if (!near && e) { b.hp = e.hp; e.dead = true; b.ent = null; }
      else if (e) b.hp = e.hp;
    }
  },
  // derrotada: recompensa, fama, gratidão e troféu
  slain(e, byPlayer) {
    const b = this.L().find(x => x.id === e.beast); if (!b) return;
    const D = this.def(b), pay = this.bounty(b);
    G.beasts = this.L().filter(x => x !== b);
    if (!byPlayer) { Diplo.chronicle(`${D.icon} ${D.name} foi abatido.`, true); return; }
    P.gold += pay; Court.addFame(25);
    for (const ci of Object.keys(b.bounty)) Game.addRelation(+ci, 12);
    const [it, n] = D.trophy; if (ITEMS[it]) Inv.add(it, n);
    Progress.add('beasts'); Progress.diary(`${D.icon} Abateu o ${D.name} e recebeu ${pay} 🪙 de recompensa.`);
    UI.banner(`${D.icon} ${D.name} abatido!`);
    UI.msg(`${D.icon} Você abateu ${D.name}! Recompensa dos reinos: ${pay} 🪙, +25 de fama e ${n} ${ITEMS[it] ? ITEMS[it].name : ''}.`, 'gold', true);
    Diplo.chronicle(`${D.icon} ${G.name} ${G.surname || ''} abateu ${D.name} e livrou as vilas.`, true);
  },
  // desenho do grifo e da serpente (o dragão errante usa o desenho do dragão)
  drawGriffin(ctx, x, y, dir, anim, hurt) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir * 1.4, 1.4);
    const fly = Math.sin(anim * 2) * 4, wing = Math.sin(anim * 6) * 8, body = hurt ? '#ff9080' : '#b07a3a', head = hurt ? '#ffc0b0' : '#f2ead8';
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(0, -18 + fly);
    ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-26, -22 - wing); ctx.lineTo(-12, -4); ctx.fill();
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-24, 2, -26, -6); ctx.lineTo(-22, -2); ctx.fill();
    for (const lx of [-8, 6]) ctx.fillRect(lx, 5, 3, 9);
    ctx.fillStyle = head; ctx.beginPath(); ctx.ellipse(13, -7, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8b030'; ctx.beginPath(); ctx.moveTo(18, -8); ctx.lineTo(24, -5); ctx.lineTo(18, -4); ctx.fill();
    ctx.fillStyle = '#1a1208'; ctx.fillRect(14, -9, 2, 2);
    ctx.fillStyle = '#a06a2a'; ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(-18, -26 + wing); ctx.lineTo(-4, -2); ctx.fill();
    ctx.restore();
  },
  drawSerpent(ctx, x, y, dir, anim, hurt) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
    const col = hurt ? '#ff9080' : '#2e7a5a', dark = '#1a4a36';
    ctx.fillStyle = 'rgba(20,40,60,0.35)'; ctx.beginPath(); ctx.ellipse(0, 2, 34, 7, 0, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 4; k++) { const px = -28 + k * 14, py = -6 + Math.sin(anim * 3 + k) * 5; ctx.fillStyle = k % 2 ? dark : col; ctx.beginPath(); ctx.ellipse(px, py, 8, 6, 0, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(22, 0); ctx.quadraticCurveTo(26, -30, 36, -34); ctx.lineTo(44, -28); ctx.quadraticCurveTo(34, -24, 30, 0); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(40, -32, 8, 5, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd34a'; ctx.fillRect(41, -35, 2, 2);
    ctx.fillStyle = '#c84a4a'; ctx.fillRect(47, -30, 5, 1);
    ctx.restore();
  },
};

{
  // desenho
  const cd0 = Creature.prototype.draw;
  Creature.prototype.draw = function (ctx, cx, cy) {
    if (this.dead || this.sleeping) return cd0.call(this, ctx, cx, cy);
    const x = this.x - cx, y = this.y - cy, hurt = this.hurt > 0;
    if (this.kind === 'wild_dragon') { drawDragon(ctx, x, y, this.dir, this.anim, hurt); return; }
    if (this.kind === 'griffin') { Beasts.drawGriffin(ctx, x, y, this.dir, this.anim, hurt); return; }
    if (this.kind === 'river_serpent') { Beasts.drawSerpent(ctx, x, y, this.dir, this.anim, hurt); return; }
    return cd0.call(this, ctx, cx, cy);
  };
  // abatida
  const k0 = Game.kill.bind(Game);
  Game.kill = function (e, src) { const r = k0(e, src); if (e && e.beast) Beasts.slain(e, src === P || (src && fac(src) === 'player')); return r; };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Beasts.monthTick(); };
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); Beasts.update(dt); };
  // no mapa e no minimapa: onde a fera foi vista (se você já conhece o lugar)
  const seen = b => typeof Fog === 'undefined' || Fog.seen(b.x, b.y) || b.attacks > 0;
  const md0 = MapView.draw.bind(MapView);
  MapView.draw = function () {
    md0(); if (!this.cv || G.dungeon) return;
    const g = this.cv.getContext('2d'), dpr = window.devicePixelRatio || 1, z = this.z;
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const b of Beasts.L()) { if (!seen(b)) continue; const x = (b.x - this.ox) * z, y = (b.y - this.oy) * z; g.font = '22px sans-serif'; g.fillText(Beasts.def(b).icon, x, y); g.font = '600 11px sans-serif'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.85)'; const t = `${Beasts.def(b).name} · ${Beasts.bounty(b)} 🪙`; g.strokeText(t, x, y + 18); g.fillStyle = '#ffb04a'; g.fillText(t, x, y + 18); }
    g.restore();
  };
  const dm0 = Game.drawMinimap.bind(Game);
  Game.drawMinimap = function (ctx, cw) {
    const r = dm0(ctx, cw), R = this.miniRect; if (!R || G.dungeon) return r;
    const k = R.s / WORLD_W; ctx.save(); ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    for (const b of Beasts.L()) if (seen(b)) ctx.fillText(Beasts.def(b).icon, R.x + b.x * k, R.y + b.y * k + 4);
    ctx.restore(); return r;
  };
  // ameaça no painel do reino
  if (typeof Board !== 'undefined') {
    const th0 = Board.threats.bind(Board);
    Board.threats = function (ci) { const out = th0(ci); for (const b of Beasts.L()) { const v = World.villages[b.target]; if (v && !v.free && v.civ === ci) out.unshift({ lvl: 3, ic: Beasts.def(b).icon, t: `${Beasts.def(b).name} rumo a ${v.name} (recompensa ${Beasts.bounty(b)} 🪙)` }); } return out; };
  }
  ACHIEVEMENTS.push({ id: 'beast', icon: '🐉', name: 'Matador de Feras', desc: 'Abata uma fera errante.', t: s => (s.beasts || 0) >= 1 }, { id: 'beast3', icon: '🦅', name: 'Flagelo das Feras', desc: 'Abata 3 feras errantes.', t: s => (s.beasts || 0) >= 3 });
}

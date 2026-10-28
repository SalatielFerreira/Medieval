'use strict';
// Vida das cidades (crescimento, muralhas e ruínas) e caravanas de comércio entre os reinos.

// prosperidade necessária para cada nível (1 a 10): nível 2 ganha casas e poço, 3 ergue muralhas,
// do 4 ao 10 cada nível traz mais uma casa e uma família nova (e cabe mais gente)
const VILLAGE_LVLS = [0, 9, 20, 32, 45, 60, 76, 93, 111, 130], VILLAGE_MAX = 10, PROSPER_MAX = 140;
const REALM_LVL = 5; // nível que a vila livre do herói precisa para virar reino
const Towns = {
  levelOf(p) { let l = 1; for (let k = 1; k < VILLAGE_LVLS.length; k++) if (p >= VILLAGE_LVLS[k]) l = k + 1; return l; },
  init() { for (const v of World.villages) if (v.prosper === undefined) Object.assign(v, { prosper: U.rnd(4, 12), level: 1, ruin: 0 }); },
  // posições de expansão calculadas sempre na mesma ordem (o resultado é igual ao recarregar o jogo)
  build(v, vi) {
    if (v.extra) return;
    v.extra = { houses: [], walls: [], well: null };
    const civ = v.civ;
    for (let r = 9; r <= 14 && v.extra.houses.length < 3; r++) for (let k = 0; k < 24 && v.extra.houses.length < 3; k++) {
      const a = k / 24 * Math.PI * 2 + vi;
      const x = Math.round(v.x + Math.cos(a) * r) - 1, y = Math.round(v.y + Math.sin(a) * r * 0.8) - 1;
      if (!World.areaOk(x - 1, y - 1, 4, 4) || !World.areaFree(x - 1, y - 1, 4, 4) || this.onRoad(x, y, 2, 2)) continue;
      v.extra.houses.push(World.addStruct('vhouse', x, y, 2, 2, civ, { growth: 2, village: vi }));
    }
    // uma casa a mais em cada nível do 4 ao 10
    for (let r = 10, lv = 4; r <= 15 && lv <= VILLAGE_MAX; r++) for (let k = 0; k < 28 && lv <= VILLAGE_MAX; k++) {
      const a = k / 28 * Math.PI * 2 + vi * 1.7;
      const x = Math.round(v.x + Math.cos(a) * r) - 1, y = Math.round(v.y + Math.sin(a) * r * 0.8) - 1;
      if (!World.areaOk(x - 1, y - 1, 4, 4) || !World.areaFree(x - 1, y - 1, 4, 4) || this.onRoad(x, y, 2, 2)) continue;
      v.extra.houses.push(World.addStruct('vhouse', x, y, 2, 2, civ, { growth: lv++, village: vi }));
    }
    if (World.areaOk(v.x + 3, v.y - 1, 1, 1) && World.areaFree(v.x + 3, v.y - 1, 1, 1)) v.extra.well = World.addStruct('well', v.x + 3, v.y - 1, 1, 1, civ, { growth: 2, village: vi });
    const R = 16;
    for (let y = v.y - R; y <= v.y + R; y++) for (let x = v.x - R; x <= v.x + R; x++) {
      const ring = Math.max(Math.abs(x - v.x), Math.abs(y - v.y) * 1.25 | 0) === R;
      if (!ring || Math.abs(x - v.x) < 2 || Math.abs(y - v.y) < 2) continue;
      if (!World.inb(x, y) || World.blocked(x, y) || this.onRoad(x, y, 1, 1) || World.sgrid[World.idx(x, y)] >= 0) continue;
      const t = World.tile(x, y);
      if (t === T.WATER || t === T.BRIDGE) continue;
      v.extra.walls.push(World.addStruct('vwall', x, y, 1, 1, civ, { growth: 3, village: vi }));
    }
    this.show(v);
  },
  onRoad(x, y, w, h) {
    for (let j = y - 1; j <= y + h; j++) for (let i = x - 1; i <= x + w; i++) { const t = World.tile(i, j); if (t === T.ROAD || t === T.BRIDGE) return true; }
    return false;
  },
  // mostra ou esconde as construções conforme o nível e as ruínas
  show(v) {
    for (const s of [...v.extra.houses, ...v.extra.walls, ...(v.extra.well ? [v.extra.well] : [])]) {
      if (s.removed) continue; // demolida pelo governador ou pelo rei
      const was = s.hidden;
      s.hidden = v.level < s.growth;
      if (was !== s.hidden) World.structTouch(s); // a casa nova (ou a que sumiu) aparece no mapa
      s.blocks = !s.hidden;
      s.owner = v.civ;
    }
    const houses = World.structs.filter(s => s.type === 'vhouse' && !s.hidden && (s.village === World.villages.indexOf(v) || U.dist(s.x, s.y, v.x, v.y) < 9));
    houses.forEach((s, k) => { s.ruined = k < v.ruin; });
  },
  applyAll() { World.villages.forEach((v, i) => { this.build(v, i); this.show(v); }); this.syncOwners(); },
  // os moradores só constroem em lugar vazio: obra de NPC que ficou em cima de outra (a sua, ou uma mudada de lugar)
  // muda para um lugar livre perto da vila — ou é desfeita, se não houver lugar
  settle() {
    if (G.dungeon) return 0;
    const N = WORLD_W * WORLD_H, occ = new Int32Array(N).fill(-1), E = Urban.E();
    const rank = s => s.built || s.owner === 'player' ? 0 : s.added || (E.moved && E.moved[s.okey]) ? 1
      : s.npcBuilt || s.fam !== undefined || s.growth !== undefined ? 3 : 2;
    const vis = World.structs.filter(s => s && !s.removed && !s.hidden && s.w && s.h).map(s => [rank(s), s]).sort((a, b) => a[0] - b[0] || a[1].id - b[1].id);
    const hits = s => { for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) { if (!World.inb(i, j)) continue; const o = occ[World.idx(i, j)]; if (o >= 0 && o !== s.id) return true; } return false; };
    const paint = s => { for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) if (World.inb(i, j)) { const k = World.idx(i, j); occ[k] = s.id; World.sgrid[k] = s.id; } };
    let fixed = 0; const moved = [];
    for (const [r, s] of vis) {
      if (r < 3 || !hits(s)) { paint(s); continue; }
      fixed++;
      const spot = s.type === 'vwall' ? null : this.freeSpot(s, occ);
      if (spot) { moved.push({ x: s.x, y: s.y, w: s.w, h: s.h }); Urban.relocate(s, spot.x, spot.y); paint(s); moved.push(s); }
      else { Urban.record('remove', s, s.x, s.y); World.removeStruct(s); }
    }
    if (fixed) { for (const [, s] of vis) if (!s.removed) { paint(s); } for (const s of moved) World.touchArea(s.x - 1, s.y - 1, s.w + 2, s.h + 2); }
    return fixed;
  },
  freeSpot(s, occ) {
    const vi = s.village !== undefined ? s.village : s.fam !== undefined && Families.get(s.fam) ? Families.get(s.fam).seat : -1;
    const v = World.villages[vi] || { x: s.x, y: s.y };
    const free = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { if (!World.inb(i, j)) return false; const k = World.idx(i, j); if (occ[k] >= 0 || World.blocker(k)) return false; } return true; };
    for (let r = 5; r <= 30; r++) for (let k = 0; k < 28 + r; k++) {
      const a = k / (28 + r) * Math.PI * 2 + s.id * 0.7 + r * 0.37;
      const x = Math.round(v.x + Math.cos(a) * r) - 1, y = Math.round(v.y + Math.sin(a) * r * 0.8) - 1;
      if (!World.areaOk(x - 1, y - 1, s.w + 2, s.h + 2) || !free(x - 1, y - 1, s.w + 2, s.h + 2) || this.onRoad(x, y, s.w, s.h)) continue;
      if (U.dist(x + s.w / 2, y + s.h / 2, P.x / TILE, P.y / TILE) < 3) continue;
      return { x, y };
    }
    return null;
  },
  // as construções de cada vila pertencem ao reino da vila (ex.: a vila livre que virou o seu reino)
  syncOwners() {
    for (const s of World.structs) {
      if (!s || s.village === undefined || typeof s.owner !== 'number' || s.type === 'castle') continue;
      const v = World.villages[s.village];
      if (v && s.owner !== v.civ) s.owner = v.civ;
    }
  },
  dayTick() {
    World.villages.forEach((v, vi) => {
      const c = G.civs[v.civ], raided = v.raid && v.raid.until >= G.day - ECON_DAYS;
      // vila livre: cresce por conta própria, sem depender da felicidade e do tesouro de um reino
      const happy = v.free ? 60 : c.happy, rich = v.free ? false : c.treasury > 600;
      v.prosper = U.clamp(v.prosper + (typeof VillageEcon !== "undefined" ? VillageEcon.delta(v, vi, happy, rich, raided) : (happy - 45) / 35 + (rich ? 0.5 : 0) + U.rnd(-0.4, 0.8) - (raided ? 5 : 0)), 0, PROSPER_MAX); // cresce conforme o poder econômico da vila
      if (raided && Math.random() < 0.6) v.ruin = Math.min(3, v.ruin + 1);
      else if (!raided && v.ruin > 0 && Math.random() < 0.3) v.ruin--;
      const lvl = this.levelOf(v.prosper);
      const known = U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 60 || c.ruler === 'player';
      if (lvl > v.level) {
        if (known) Game.note(`🏘️ ${v.name} prosperou e chegou ao nível ${lvl}: ${lvl === 3 ? 'ergueu muralhas!' : lvl === 2 ? 'ganhou novas casas e um poço.' : 'mais uma casa e uma família nova.'}${lvl === REALM_LVL && v.free && v.lord === 'player' ? ' Agora ela pode virar um reino: erga o Castelo.' : ''}`, 'gold');
        Diplo.chronicle(`🏘️ ${v.name.startsWith("Vila ") ? "A " + v.name : "A vila de " + v.name} (${v.free ? 'vila livre' : Diplo.name(v.civ)}) cresceu e chegou ao nível ${lvl}.`);
        if (lvl >= 2) { const fam = People.create({ rank: 'peasant', civ: v.civ, home: { type: 'village', idx: vi }, age: U.rint(20, 40) }); fam.met = false; }
      } else if (lvl < v.level && known) UI.msg(`🏚️ ${v.name} está em decadência.`, 'bad');
      v.level = lvl;
      this.show(v);
    });
    this.settle(); // casas que surgem com o nível novo não ficam em cima das suas obras
    this.syncOwners();
    VillageWorks.monthTick(); // obras das vilas: aluguéis, recursos, prosperidade e famílias novas
    NpcRoads.tick(); // moradores abrem caminhos até as casas e lojas
    NpcRoads.upgradeTick(); // e evoluem as estradas da vila, um nível por vez
    NpcRoads.travelTick(); // e as do reino inteiro, por onde os moradores e as caravanas passam
    NPCWork.monthTick(); // coleta longe do jogador
    NPCWork.clearTick(); // e desmatam a terra das vilas e dos castelos
    Faith.monthTick();
    People.purseTick(); // as lojas rendem para os próprios donos
    Ports.monthTick();
    Shops.ensure(); // cada loja com o seu responsável
    Trips.monthTick(); // desempregados e crianças passeiam por reinos em paz
  },
};

// ====================================================================== caravanas
const CARAVAN_GOODS = [['spices', 2, 5], ['silk_cloth', 1, 3], ['wine', 2, 5], ['iron_bar', 3, 6], ['cloth', 3, 6], ['honey', 2, 4]];
const Caravans = {
  list() { return G.caravans || (G.caravans = []); },
  dayTick() {
    G.caravans = this.list().filter(c => !c.done);
    for (let k = 0; k < 2 && G.caravans.length < 8; k++) {
      const a = U.rint(0, CIV_DEFS.length - 1), b = (a + U.rint(1, CIV_DEFS.length - 1)) % CIV_DEFS.length;
      if (Diplo.atWar(a, b)) continue;
      const path = World.findPath(World.capitals[a].door.x, World.capitals[a].door.y, World.capitals[b].door.x, World.capitals[b].door.y);
      if (!path || path.length < 20) continue;
      path.reverse();
      this.list().push({
        id: G.day * 10 + k, from: a, to: b, path, pos: 0, done: false, robbed: false, escort: 0, ambush: Math.random() < 0.4, ambushed: false,
        goods: CARAVAN_GOODS.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(([it, x, y]) => ({ k: it, n: U.rint(x, y) })),
      });
      Diplo.chronicle(`🐫 Uma caravana partiu de ${Diplo.name(a)} rumo a ${Diplo.name(b)}.`);
    }
  },
  tile(c) { const i = c.path[Math.min(c.path.length - 1, Math.floor(c.pos))]; return { x: i % WORLD_W, y: (i / WORLD_W) | 0 }; },
  update(dt) {
    if (G.dungeon) return;
    for (const c of this.list()) {
      if (c.done) continue;
      const t = this.tile(c), d = U.dist(P.x / TILE, P.y / TILE, t.x, t.y);
      const ent = G.ents.find(e => e.kind === 'caravan' && e.carId === c.id && !e.dead);
      if (!ent) {
        if (c.entGone) { c.done = true; continue; }
        c.pos += dt * 1.2;
        if (d < 30) this.spawn(c, t);
      } else {
        c.pos = ent.pathPos;
        if (d < 12) c.escort += dt;
        if (c.ambush && !c.ambushed && c.escort > 6) {
          c.ambushed = true;
          for (let k = 0; k < 4; k++) { const sp = freeSpotNear(ent.x + U.rnd(-200, 200), ent.y + U.rnd(-160, 160), 60); Game.spawn('bandit', sp.x, sp.y, { leash: 18, tag: 'amb' + c.id, archer: k === 0 }); }
          UI.banner('⚠️ Bandidos atacam a caravana!'); UI.msg('Defenda a caravana e receba uma recompensa do reino!', 'bad');
        }
        if (d > 46) { ent.dead = true; }
      }
      if (c.pos >= c.path.length - 1) this.arrive(c, ent);
    }
  },
  spawn(c, t) {
    const e = Game.spawn('caravan', (t.x + 0.5) * TILE, (t.y + 0.8) * TILE, { civ: c.from, leash: 999 });
    e.carId = c.id; e.car = c; e.pathPos = c.pos;
    for (let k = 0; k < (c.owner === 'player' ? c.guards : 2); k++) {
      const g = Game.spawn('guard', e.x - 30 - k * 20, e.y + 12, { civ: c.from, leash: 4, tag: 'carg' + c.id });
      g.follow = e;
    }
  },
  arrive(c, ent) {
    c.done = true;
    if (ent) ent.dead = true;
    for (const e of G.ents) if (e.tag === 'carg' + c.id) e.dead = true;
    if (c.owner === 'player') { Market.arrive(c); return; }
    if (c.ambushed && !c.robbed && c.escort > 15) {
      const g = U.rint(70, 140);
      P.gold += g; Game.addRelation(c.from, 10); Game.gainXp(40);
      UI.msg(`🐫 A caravana chegou em segurança graças a você! ${Diplo.name(c.from)} paga ${g} 🪙 (+10 relação).`, 'gold');
      Progress.add('caravansSaved'); Court.addService(c.from, 5);
    }
  },
  // assalto: o jogador ataca a caravana
  rob(c, ent) {
    if (c.owner === 'player') return;
    c.robbed = true; ent.hostileToPlayer = true; Market.robbed(c);
    Game.addRelation(c.from, -35);
    for (const e of G.ents) if (e.tag === 'carg' + c.id) e.target = P;
    UI.msg(`Você atacou a caravana de ${Diplo.name(c.from)}! Seus guardas reagem. (−35 relação)`, 'bad');
  },
  loot(c, e) {
    const g = U.rint(60, 150);
    P.gold += g;
    for (const it of c.goods) Inv.add(it.k, it.n);
    UI.msg(`Você saqueou a caravana: ${g} 🪙 e ${c.goods.map(x => x.n + ' ' + ITEMS[x.k].name).join(', ')}.`, 'gold');
    c.done = true; c.entGone = true;
    Progress.add('caravansRobbed'); Faith.addSin(1, 'Saquear uma caravana');
  },
  // movimento da entidade da caravana pela estrada
  move(e, dt) {
    const c = e.car;
    if (!c || c.done) { e.dead = true; return; }
    const i = c.path[Math.min(c.path.length - 1, Math.floor(e.pathPos) + 1)];
    const tx = (i % WORLD_W + 0.5) * TILE, ty = (((i / WORLD_W) | 0) + 0.8) * TILE;
    const enemies = G.ents.some(o => !o.dead && o.kind === 'bandit' && U.dist(o.x, o.y, e.x, e.y) < 5 * TILE);
    if (enemies) { e.moving = false; return; }
    const dx = tx - e.x, dy = ty - e.y, L = Math.hypot(dx, dy);
    if (L < 6) { e.pathPos = Math.min(c.path.length - 1, Math.floor(e.pathPos) + 1); return; }
    e.x += dx / L * 46 * dt; e.y += dy / L * 46 * dt; e.moving = true;
    if (Math.abs(dx) > 1) e.dir = dx < 0 ? -1 : 1;
  },
};
function drawCaravan(ctx, x, y, dir, anim, moving, col, hurt) {
  drawHorse(ctx, x + dir * 26, y, dir, anim, moving, '#7a4a26', false);
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(-8, 0, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hurt ? '#ff8080' : '#8b5a2b'; ctx.fillRect(-28, -24, 40, 16);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-30, -24); ctx.quadraticCurveTo(-8, -48, 14, -24); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-20, -36, 3, 12); ctx.fillRect(-4, -38, 3, 14);
  const r = anim * (moving ? 6 : 0);
  for (const wx of [-20, 4]) {
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, -6, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wx + Math.cos(r) * 7, -6 + Math.sin(r) * 7); ctx.lineTo(wx - Math.cos(r) * 7, -6 - Math.sin(r) * 7); ctx.stroke();
  }
  ctx.restore();
}

// ====================================================================== trabalho dos civis
// Camponeses, andarilhos e mendigos — e lenhadores, pedreiros e caçadores que não têm loja — cortam árvores, quebram
// pedras e colhem plantas em volta de casa, dentro do próprio reino, e levam o que juntaram para a vila. Longe de você,
// cada vila também coleta todo mês (NPCWork.monthTick): o armazém do reino e as famílias enriquecem.
const GATHER_RANKS = ['peasant', 'wanderer', 'beggar', 'lumber', 'mason', 'hunter'];
const GATHER_PREF = { lumber: 'axe', mason: 'pick' }; // o lenhador prefere árvores; o pedreiro, pedras
const NPCWork = {
  can(e) {
    const p = e.npc;
    return !!p && p.alive && GATHER_RANKS.includes(p.rank) && !p.shop && p.age >= 16 && !p.capanga && (p.job === undefined || p.job === null) &&
      !p.kin && !p.council && p.spouse !== 'player' && !p.hostile && e.kind === 'villager' && !e.placeNpc && e.inside == null;
  },
  update(e, dt, sp) {
    if (!this.can(e) || G.dungeon) return false;
    const w = e.work || (e.work = { mode: 'idle', t: U.rnd(1, 5) });
    // à noite todos voltam para casa
    if (G.darkness > 0.55 && w.mode !== 'return') { if (w.mode !== 'idle') { w.mode = w.carry ? 'return' : 'idle'; w.t = 30; } if (w.mode === 'idle') return false; }
    const tilePos = i => ({ x: (i % WORLD_W + 0.5) * TILE, y: (((i / WORLD_W) | 0) + 1) * TILE });
    switch (w.mode) {
      case 'idle':
        w.t -= dt;
        if (w.t <= 0 && !(G.darkness > 0.55) && !this.pick(e, w)) w.t = U.rnd(3, 7);
        return false;
      case 'go': {
        if (World.obj[w.i] !== w.type) { w.mode = 'idle'; w.t = 2; return false; }
        const d = U.dist(e.x, e.y, w.ax, w.ay);
        w.t -= dt; w.chk -= dt;
        if (d < 16) { w.mode = 'work'; w.t = 1.2; return true; }
        e.moveToward(w.ax, w.ay, sp * 0.6, dt);
        // sem progresso: desiste deste alvo e procura outro
        if (w.chk <= 0) { if (w.lastD - d < 6) { (e.badT = e.badT || []).push(w.i); w.mode = 'idle'; w.t = 1; } w.lastD = d; w.chk = 2; }
        if (w.t <= 0) { w.mode = 'idle'; w.t = 4; }
        return true;
      }
      case 'work': {
        if (World.obj[w.i] !== w.type) { w.mode = 'idle'; w.t = 2; return true; }
        const p = tilePos(w.i);
        e.dir = p.x < e.x ? -1 : 1; e.aim = Math.atan2(p.y - 20 - e.y, p.x - e.x);
        w.t -= dt;
        if (w.t <= 0) {
          w.t = 1.2;
          const o = OBJ[w.type];
          e.swing = 0.28;
          World.objHp[w.i] = Math.max(0, World.objHp[w.i] - 1);
          World.shake(w.i);
          const near = U.dist(e.x, e.y, P.x, P.y) < 9 * TILE;
          if (near) { Sound.play(o.tool === 'axe' ? 'chop' : o.tool === 'pick' ? 'mine' : 'pickup', { vol: 0.35 }); Game.burst(p.x, p.y - 16, o.pc, 3); }
          if (World.objHp[w.i] <= 0) {
            const res = Object.keys(o.drops), k = res[0], [a, b] = o.drops[k];
            w.carry = { k, n: Math.max(1, U.rint(a, b)) };
            World.removeObj(w.i);
            if (near) Game.burst(p.x, p.y - 16, o.pc, 10);
            w.mode = 'return'; w.t = 40;
          }
        }
        return true;
      }
      case 'return': {
        const h = e.home;
        w.t -= dt;
        if (U.dist(e.x, e.y, h.x, h.y) > 26 && w.t > 0) e.moveToward(h.x, h.y, sp * 0.55, dt);
        else this.deposit(e, w);
        return true;
      }
    }
    return false;
  },
  // procura algo para coletar perto de casa, no território do reino
  pick(e, w) {
    const hx = Math.floor(e.home.x / TILE), hy = Math.floor(e.home.y / TILE), civ = Families.civOf(e.npc);
    const sx = Math.floor(World.start.x), sy = Math.floor(World.start.y);
    let best = null, bd = 1e9;
    const pref = GATHER_PREF[e.npc.rank];
    for (let k = 0; k < 60; k++) {
      const x = hx + U.rint(-18, 18), y = hy + U.rint(-14, 14);
      if (!World.inb(x, y)) continue;
      const i = World.idx(x, y), t = World.obj[i];
      if (!t || OBJ[t].min > 1 || World.terr[i] !== civ) continue;
      if (pref && OBJ[t].tool !== pref && Math.random() < 0.8) continue;
      if (Math.abs(x - sx) < 9 && Math.abs(y - sy) < 9) continue; // não mexe perto da cabana do jogador
      if (e.badT && e.badT.includes(i)) continue;
      if (G.ents.some(o => o !== e && o.work && o.work.i === i && o.work.mode !== 'idle')) continue;
      // precisa de um lugar livre ao lado para trabalhar
      const side = [[0, 1], [-1, 0], [1, 0], [0, -1]].find(([dx, dy]) => !World.blocked(x + dx, y + dy));
      if (!side) continue;
      const d = U.dist(x, y, e.x / TILE, e.y / TILE);
      if (d < bd) { bd = d; best = { i, ax: (x + side[0] + 0.5) * TILE, ay: (y + side[1] + 0.8) * TILE }; }
    }
    if (best === null) return false;
    w.mode = 'go'; w.i = best.i; w.ax = best.ax; w.ay = best.ay; w.type = World.obj[best.i]; w.t = 30; w.chk = 2; w.lastD = 1e9;
    if (e.badT && e.badT.length > 12) e.badT.splice(0, 6);
    return true;
  },
  // entrega o que juntou: vai para o armazém do reino e enriquece a família
  deposit(e, w) {
    const c = w.carry;
    w.mode = 'idle'; w.t = U.rnd(2, 5); w.carry = null;
    if (!c) return;
    const civ = Families.civOf(e.npc), C = G.civs[civ];
    if (C && C.stock[c.k] !== undefined) C.stock[c.k] += c.n;
    const f = Families.of(e.npc);
    if (f) f.wealth += Math.max(1, Math.round(ITEMS[c.k].price * c.n * 0.5));
    if (G.stats) G.stats.npcGathered = (G.stats.npcGathered || 0) + c.n;
  },
  // longe de você, cada vila também coleta: madeira e pedra para o armazém do reino, e um pouco de renda para as famílias
  monthTick() {
    const win = Season.winter() ? 0.6 : 1;
    World.villages.forEach((v, vi) => {
      if (!v || v.ruin >= 3) return;
      const ppl = People.residents(vi).filter(p => GATHER_RANKS.includes(p.rank) && !p.shop && p.age >= 16 && p.age <= 65 && !p.capanga && (p.job === undefined || p.job === null));
      if (!ppl.length) return;
      const got = { wood: 0, stone: 0 };
      for (const p of ppl) { got.wood += p.rank === 'lumber' ? 4 : p.rank === 'mason' ? 0 : 2; got.stone += p.rank === 'mason' ? 4 : p.rank === 'lumber' ? 0 : 1; const f = Families.of(p); if (f) f.wealth += 2; }
      const c = G.civs[v.civ];
      if (c && !v.free) for (const k in got) c.stock[k] = Math.min(3000, (c.stock[k] || 0) + Math.round(got[k] * win));
      if (G.stats) G.stats.npcGathered = (G.stats.npcGathered || 0) + Math.round((got.wood + got.stone) * win);
    });
  },
  // ------------------------------------------------------------ desmatamento
  // Terra ocupada: a área da vila (e um pouco em volta, que cresce com o nível) e os arredores dos castelos. Ali, o que é
  // cortado ou quebrado não rebrota; longe dali a natureza volta como sempre.
  settledR(v) { return VILLAGE_R + 2 + Math.min(12, (v.level || 1) * 2); },
  settled(x, y) {
    for (const v of World.villages) if (v && !v.removed && v.ruin < 3 && Math.abs(x - v.x) <= this.settledR(v) && Math.abs(y - v.y) <= this.settledR(v)) return true;
    for (const c of World.capitals) if (c && U.dist(x, y, c.x, c.y) <= 24) return true;
    return false;
  },
  // o que os moradores derrubam: árvores e pedras comuns (os veios de minério e as plantas de colher ficam)
  clearable(t) { const o = OBJ[t]; return !!o && (o.tool === 'axe' || o.tool === 'pick') && o.min <= 1; },
  // ficam de pé as árvores que dão fruta e uma em cada sete (sombra): a vila fica limpa, mas não pelada
  shade(i, t) { const o = OBJ[t]; return !!o.tree && (i % 7 === 0 || Object.keys(o.drops || {}).some(k => ITEMS[k] && ITEMS[k].food)); },
  // todo mês, mesmo longe de você: cada vila derruba árvores e pedras de dentro para fora; os castelos limpam os arredores
  clearTick() {
    if (G.dungeon) return 0;
    const px = P.x / TILE, py = P.y / TILE, sx = Math.floor(World.start.x), sy = Math.floor(World.start.y);
    let total = 0;
    const clear = (cx, cy, R, n, civ) => {
      const cand = [];
      for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
        if (!World.inb(x, y)) continue;
        const i = World.idx(x, y), t = World.obj[i];
        if (!t || !this.clearable(t) || World.sgrid[i] >= 0 || this.shade(i, t)) continue;
        if (U.dist(x, y, px, py) < 14) continue;                          // nada some diante dos seus olhos
        if (Math.abs(x - sx) < 9 && Math.abs(y - sy) < 9) continue;         // nem perto da sua cabana
        cand.push([Math.abs(x - cx) + Math.abs(y - cy), i, t]);
      }
      cand.sort((a, b) => a[0] - b[0]);                                    // do centro para fora
      const got = { wood: 0, stone: 0 };
      for (const [, i, t] of cand.slice(0, n)) {
        World.obj[i] = 0; World.objHp[i] = 0;
        const k = OBJ[t].tool === 'axe' ? 'wood' : 'stone'; got[k] += 2;
        World.touchArea(i % WORLD_W, (i / WORLD_W) | 0, 1, 1);
        total++;
      }
      const C = G.civs[civ]; if (C) for (const k in got) C.stock[k] = Math.min(3000, (C.stock[k] || 0) + got[k]);
    };
    World.villages.forEach((v, vi) => {
      if (!v || v.ruin >= 3) return;
      const workers = People.residents(vi).filter(p => p.age >= 16 && p.age <= 65 && !p.capanga).length;
      clear(v.x, v.y, this.settledR(v), Math.min(40, 6 + workers), v.free ? -1 : v.civ);
    });
    World.capitals.forEach((c, ci) => { if (c && G.civs[ci]) clear(c.x, c.y, 24, 20, ci); });
    // o que já tinha sido cortado na terra ocupada não volta mais
    World.regrow = World.regrow.filter(r => !this.settled(r.i % WORLD_W, (r.i / WORLD_W) | 0));
    return total;
  },
  toolOf(e) { const w = e.work; return w && w.mode === 'work' && World.obj[w.i] ? OBJ[World.obj[w.i]].tool : null; },
};

// ================================================================ estradas dos moradores
// Os moradores ligam as casas, lojas, capelas e empreendimentos da vila à estrada mais próxima (a que liga
// as vilas e castelos). Cada vila abre até 2 caminhos por mês; no começo do jogo as vilas já nascem ligadas.
// As estradas ficam em G.npcRoads (índices dos blocos) e são refeitas ao carregar o jogo.
const ROAD_TYPES = ['vhouse', 'store', 'tavern', 'smith', 'lumber', 'quarry', 'chapel'];
// Regras: cada construção de morador abre UMA estrada a partir do lugar onde está, sempre até a estrada principal
// (as estradas do mapa e as que você fez). Se você destruir essa estrada, ela continua destruída: o morador não refaz
// a estrada do mesmo lugar. Se você mudar a construção de lugar, ele abre uma estrada nova a partir do lugar novo.
// G.npcRoadFrom[okey] = porta de onde a construção já abriu (ou já tinha) estrada · G.roadCut[i] = blocos que você destruiu.
const NpcRoads = {
  isRoad(i) { const t = World.tiles[i]; return t === T.ROAD || t === T.BRIDGE; },
  cut() { return G.roadCut || (G.roadCut = {}); },
  from() { return G.npcRoadFrom || (G.npcRoadFrom = {}); },
  doorKey(s) { const d = this.door(s); return d.x + ',' + d.y; },
  // estrada principal: estrada que não foi aberta pelos moradores
  mainSet() { const n = new Set(G.npcRoads || []); return i => this.isRoad(i) && !n.has(i); },
  // o jogador destruiu um bloco de estrada
  removed(i) { this.cut()[i] = 1; if (G.npcRoads) G.npcRoads = G.npcRoads.filter(x => x !== i); },
  // o jogador construiu estrada (de novo) num bloco
  rebuilt(i) { delete this.cut()[i]; },
  // jogos salvos antes destas regras: tudo o que já existe conta como "já tem estrada"
  adopt() { if (G.npcRoadFrom) return; const F = this.from(); for (const s of World.structs) if (this.wants(s)) F[s.okey] = this.doorKey(s); },
  // porta: o bloco logo abaixo do meio da construção
  door(s) { return { x: s.x + Math.floor(s.w / 2), y: s.y + s.h }; },
  wants(s) { return s && !s.removed && !s.hidden && s.village !== undefined && (ROAD_TYPES.includes(s.type) || s.fam !== undefined) && World.villages[s.village]; },
  connected(s) {
    const d = this.door(s);
    if (!World.inb(d.x, d.y)) return true;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1]]) { const x = d.x + dx, y = d.y + dy; if (World.inb(x, y) && this.isRoad(World.idx(x, y))) return true; }
    return false;
  },
  // caminho mais curto (busca em largura numa janela ao redor da porta) até qualquer bloco de estrada
  path(s, R = 22) {
    const d = this.door(s);
    if (!World.inb(d.x, d.y) || World.sgrid[World.idx(d.x, d.y)] >= 0 || World.isWater(World.tiles[World.idx(d.x, d.y)])) return null;
    const W = 2 * R + 1, from = new Int32Array(W * W).fill(-2), q = [], isMain = this.mainSet(), cut = this.cut();
    const loc = (x, y) => (y - d.y + R) * W + (x - d.x + R);
    from[loc(d.x, d.y)] = -1; q.push(d.x, d.y);
    for (let h = 0; h < q.length; h += 2) {
      const x = q[h], y = q[h + 1], i = World.idx(x, y);
      if (isMain(i)) {
        const out = []; let k = loc(x, y);
        for (let cx = x, cy = y; ; ) { const p = from[k]; if (p === -1) break; const px = p % W + d.x - R, py = ((p / W) | 0) + d.y - R; out.push(World.idx(px, py)); k = p; cx = px; cy = py; }
        return out.length <= 34 ? out : null;
      }
      for (const [dx, dy] of DIRS4) {
        const nx = x + dx, ny = y + dy;
        if (Math.abs(nx - d.x) > R || Math.abs(ny - d.y) > R || !World.inb(nx, ny)) continue;
        const l = loc(nx, ny); if (from[l] !== -2) continue;
        const ni = World.idx(nx, ny);
        if (World.sgrid[ni] >= 0 || (World.isWater(World.tiles[ni]) && World.tiles[ni] !== T.BRIDGE) || cut[ni]) continue;
        from[l] = loc(x, y); q.push(nx, ny);
      }
    }
    return null;
  },
  build(s) {
    const p = this.path(s);
    if (!p || !p.length) { s.noRoad = G.day; return false; }
    World.carveRoad(p);
    G.npcRoads = G.npcRoads || [];
    for (const i of p) G.npcRoads.push(i);
    return true;
  },
  // por mês: as vilas (e os castelos) dos NPCs evoluem as próprias estradas, um nível por vez, até o nível que a vila sustenta
  // (vila 1–2: cascalho · 3–4: pedra · 5–6: calçada · 7+: Estrada Real; castelos chegam à real). As vilas em que você é o governador ficam com você.
  upgradeTick(per = 8) {
    if (G.dungeon) return 0;
    if (!World.roadLv || World.roadLv.length !== WORLD_W * WORLD_H) World.roadLv = new Uint8Array(WORLD_W * WORLD_H);
    const E = Urban.E(); E.rlv = E.rlv || {};
    let total = 0;
    const work = (cx, cy, R, max, pay) => {
      const cand = [];
      for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
        if (!World.inb(x, y) || sqDist(x, y, cx, cy) > R) continue;
        const i = World.idx(x, y); if (World.tiles[i] !== T.ROAD) continue;
        const cur = World.roadLv[i] || 1; if (cur >= max) continue;
        cand.push([cur, U.dist(x, y, cx, cy), i]);
      }
      cand.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // primeiro as mais simples e as do centro
      let n = 0;
      for (const [cur, , i] of cand) {
        if (n >= per || !pay(cur + 1)) break;
        World.roadLv[i] = cur + 1; E.rlv[i] = cur + 1; World.setTile(i, T.ROAD); n++;
      }
      return n;
    };
    World.villages.forEach(v => {
      if (v.lord === 'player' || v.removed) return;
      const lv = v.level || 1, max = Math.min(5, 1 + Math.floor((lv + 1) / 2)), c = G.civs[v.civ];
      // vila livre paga com a própria prosperidade; vila de um reino, com o tesouro do rei (no seu reino, a vila paga sozinha e não tira do seu tesouro)
      const pay = L => { if (v.free || !c || c.ruler === 'player') return true; const p = 4 * L; if (c.treasury < 300 + p) return false; c.treasury -= p; return true; };
      total += work(v.x, v.y, VILLAGE_R, max, pay);
    });
    World.capitals.forEach((cp, ci) => {
      const c = G.civs[ci]; if (!c || c.ruler === 'player' || c.dead) return;
      total += work(cp.x, cp.y, 12, 5, L => { const p = 4 * L; if (c.treasury < 300 + p) return false; c.treasury -= p; return true; });
    });
    return total; // cada bloco evoluído já foi redesenhado (setTile)
  },
  // as estradas por onde se passa: as caravanas melhoram o caminho que percorrem (até a pedra), e cada reino cuida das
  // estradas do seu território inteiro, pagando com o tesouro (até o nível que as suas vilas já alcançaram)
  travelTick() {
    if (G.dungeon) return 0;
    if (!World.roadLv || World.roadLv.length !== WORLD_W * WORLD_H) World.roadLv = new Uint8Array(WORLD_W * WORLD_H);
    const E = Urban.E(); E.rlv = E.rlv || {};
    const up = (i, max, pay) => { if (World.tiles[i] !== T.ROAD) return false; const cur = World.roadLv[i] || 1; if (cur >= max || !pay(cur + 1)) return false; World.roadLv[i] = cur + 1; E.rlv[i] = cur + 1; World.setTile(i, T.ROAD); return true; };
    let total = 0;
    for (const c of Caravans.list()) {
      if (c.done || !c.path) continue;
      const cand = c.path.filter(i => World.tiles[i] === T.ROAD && (World.roadLv[i] || 1) < 3).sort((a, b) => (World.roadLv[a] || 1) - (World.roadLv[b] || 1)).slice(0, 25);
      for (const i of cand) if (up(i, 3, () => true)) total++;
    }
    const byCiv = new Map();
    for (let i = 0; i < World.tiles.length; i++) { if (World.tiles[i] !== T.ROAD) continue; const t = World.terr[i]; if (!(t >= 0)) continue; (byCiv.get(t) || byCiv.set(t, []).get(t)).push(i); }
    // durante o jogo, cada reino é um pedaço próprio do mês
    for (const [ci, tiles] of byCiv) {
      if (typeof Perf !== 'undefined' && Perf.slicing) Perf.queue.push(Object.assign(() => this.travelCiv(ci, tiles, up), { label: 'NpcRoads.travelTick(reino)' }));
      else total += this.travelCiv(ci, tiles, up);
    }
    return total;
  },
  // um reino melhora as 40 estradas mais gastas (as de nível mais baixo, mais perto do castelo primeiro)
  travelCiv(ci, tiles, up) {
    const c = G.civs[ci]; if (!c || c.dead) return 0;
    const vs = World.villages.filter(v => v && !v.free && v.civ === ci && !v.ruin), avg = vs.length ? vs.reduce((a, v) => a + (v.level || 1), 0) / vs.length : 1;
    const max = Math.min(5, 1 + Math.floor((avg + 1) / 2)), cp = World.capitals[ci];
    // no seu reino os moradores fazem por conta própria; nos outros, o rei paga
    const pay = L => { if (c.ruler === 'player') return true; const p = 3 * L; if (c.treasury < 300 + p) return false; c.treasury -= p; return true; };
    // a ordem (nível, distância, bloco) vira um número só: a ordenação de números é bem mais rápida que a de listas
    const keys = []; for (const i of tiles) { if (World.tiles[i] !== T.ROAD) continue; const L = World.roadLv[i] || 1; if (L >= max) continue; const dx = cp ? i % WORLD_W - cp.x : 0, dy = cp ? ((i / WORLD_W) | 0) - cp.y : 0; keys.push(L * 1e13 + (dx * dx + dy * dy) * 1e6 + i); }
    const cand = Float64Array.from(keys).sort();
    let n = 0; for (const k of cand) { if (n >= 40) break; const i = k % 1e6; if (up(i, max, pay)) n++; else if (c.ruler !== 'player' && c.treasury < 310) break; }
    return n;
  },
  // por mês: cada vila liga até n construções (as que não acharam caminho tentam de novo daqui a um ano)
  tick(n = 2) {
    if (G.dungeon) return;
    let any = false;
    const per = {}, F = this.from();
    for (const s of World.structs) {
      if (!this.wants(s)) continue;
      const key = this.doorKey(s);
      if (F[s.okey] === key) continue;                                  // já abriu (ou já tinha) estrada deste lugar
      if (this.connected(s)) { F[s.okey] = key; continue; }
      if (s.noRoad !== undefined && s.noRoadAt === key && G.day - s.noRoad < 12) continue;
      if ((per[s.village] = (per[s.village] || 0) + 1) > n) continue;
      if (this.build(s)) { any = true; F[s.okey] = key; } else s.noRoadAt = key;
    }
    // cada caminho aberto já redesenhou os próprios blocos (carveRoad): nada de refazer o mapa inteiro
    return any;
  },
  // começo do jogo: todas as vilas já ligadas
  init() { this.tick(99); },
  // ao carregar: refaz as estradas abertas pelos moradores
  restore() {
    const cut = this.cut();
    if (G.npcRoads) G.npcRoads = G.npcRoads.filter(i => !cut[i]);
    for (const i of G.npcRoads || []) if (World.sgrid[i] < 0 && !this.isRoad(i)) World.carveRoad([i]);
    // os níveis das estradas abertas pelos moradores (elas só voltam agora, depois das obras)
    const E = Urban.E();
    if (World.roadLv) for (const k in E.rlv || {}) if (World.tiles[+k] === T.ROAD) World.roadLv[+k] = E.rlv[k];
    this.adopt();
  },
};

// ================================================================ portos
// Um porto na costa perto de cada castelo que tem mar por perto (lugar sempre igual para o mesmo mundo).
// O mestre do porto compra peixes, polvos, tubarões e baleias com a bolsa do porto e vende barcos e varas.
const PORT_BUYS = ['trout', 'carp', 'sardine', 'cod', 'octopus', 'shark', 'whale', 'goldfish', 'cooked_fish'];
const PORT_SELLS = [['boat', 120], ['fishing_rod', 25], ['rope', 6]];
const Ports = {
  list() { return World.structs.filter(s => s && s.type === 'port' && !s.removed); },
  state(s) { G.ports = G.ports || {}; const k = s.x + ',' + s.y; return G.ports[k] || (G.ports[k] = { purse: 2500 }); },
  // procura uma faixa de costa (terra com água ao sul ou ao lado) até 34 blocos do castelo
  place() {
    if ((G.terrain || 0) < 3 || this.list().length) return;
    for (let ci = 0; ci < Math.min(World.capitals.length, 7); ci++) {
      const cp = World.capitals[ci]; let best = null, bd = 1e9;
      // terreno 11 (menos lagos): o reino sem costa perto procura o mar mais longe
      for (const R of (G.terrain || 0) >= 13 ? [34, 64, 100] : (G.terrain || 0) >= 11 ? [34, 64] : [34]) { if (best) break;
      for (let y = cp.y - R; y <= cp.y + R; y++) for (let x = cp.x - R; x <= cp.x + R; x++) {
        if (!World.areaOk(x, y, 4, 3) || !World.areaFree(x, y, 4, 3)) continue;
        let land = true; for (let j = y; j < y + 3 && land; j++) for (let i = x; i < x + 4; i++) { const t = World.tiles[World.idx(i, j)]; if (!TINFO[t].walk || World.isWater(t) || t === T.ROAD) { land = false; break; } }
        if (!land) continue;
        let water = 0; for (let i = x - 1; i <= x + 4; i++) { if (World.inb(i, y + 3) && World.isWater(World.tiles[World.idx(i, y + 3)])) water++; }
        if (water < 4) continue;
        const d = U.dist(x, y, cp.x, cp.y); if (d < bd && d > 9) { bd = d; best = { x, y }; }
      }
      }
      if (!best) continue;
      for (let j = best.y; j < best.y + 3; j++) for (let i = best.x; i < best.x + 4; i++) World.obj[World.idx(i, j)] = 0;
      const st = World.addStruct('port', best.x, best.y, 4, 3, ci);
      const path = World.findPath(best.x + 1, best.y - 1, cp.door.x, cp.door.y); if (path) World.carveRoad(path);
    }
    World.chunks = new Map(); if (World.mini) World.buildMinimap();
  },
  price(k) { const it = ITEMS[k]; return Math.max(1, Math.round(it.price * (k === 'whale' || k === 'shark' || k === 'octopus' ? 1 : 0.9))); },
  sell(sid, k, n) {
    const s = World.structs[sid], st = this.state(s), pr = this.price(k);
    n = Math.min(n, Inv.count(k), Math.floor(st.purse / pr));
    if (n <= 0) { UI.msg(Inv.count(k) ? 'O mestre do porto não tem dinheiro para isso agora.' : 'Você não tem isso.', 'bad'); return; }
    Inv.add(k, -n); P.gold += n * pr; st.purse -= n * pr; Sound.play('coin');
    UI.msg(`⚓ Vendeu ${n}× ${ITEMS[k].name} por ${n * pr} Salin.`, 'gold');
  },
  buy(sid, k, price) {
    const st = this.state(World.structs[sid]);
    if (P.gold < price) { UI.msg('Salin insuficiente.', 'bad'); return; }
    P.gold -= price; st.purse += price; Inv.add(k, 1); UI.msg(`⚓ Comprou ${ITEMS[k].name}.`, 'gold');
  },
  monthTick() { for (const k in G.ports || {}) G.ports[k].purse = Math.min(6000, G.ports[k].purse + 400); this.ensureKeepers(); },
  // ------------------------------------------------------------ marinheiro que toma conta do porto
  // cada porto tem um marinheiro (p.port = código do porto). Ele mora na vila mais próxima e fica no cais;
  // se morrer, outro marinheiro chega no mês seguinte.
  keeper(s) { return G.people.find(p => p.alive && p.port === s.okey) || null; },
  portOf(p) { return p && p.port ? this.list().find(s => s.okey === p.port) || null : null; },
  homeFor(s) {
    if (s.village !== undefined && World.villages[s.village]) return s.village;
    // vila mais próxima do mesmo reino (ou, se não houver, a mais próxima de todas)
    const near = list => list.sort((a, c) => U.dist(a.v.x, a.v.y, s.x, s.y) - U.dist(c.v.x, c.v.y, s.x, s.y))[0];
    const all = World.villages.map((v, vi) => ({ v, vi })), same = all.filter(x => x.v.civ === s.owner);
    const pick = near(same.length ? same : all);
    return pick ? pick.vi : -1;
  },
  ensureKeepers() {
    for (const s of this.list()) {
      if (this.keeper(s)) continue;
      const vi = this.homeFor(s);
      const civ = typeof s.owner === 'number' && s.owner >= 0 ? s.owner : vi >= 0 ? World.villages[vi].civ : 0;
      const p = People.create({ rank: 'sailor', age: U.rint(22, 55), civ, home: vi >= 0 ? { type: 'village', idx: vi } : { type: 'wild' },
        trait: U.pick(['alegre', 'corajoso', 'leal', 'rabugento', 'ganancioso']) });
      p.port = s.okey;
    }
  },
  // o marinheiro aparece no cais quando você está por perto
  ambient(spawnNpc) {
    for (const s of this.list()) {
      if (U.dist(P.x / TILE, P.y / TILE, s.x + s.w / 2, s.y + s.h / 2) > 28) continue;
      const p = this.keeper(s);
      if (!p || G.spawned.has(p.id)) continue;
      const e = spawnNpc(p, (s.x + s.w / 2) * TILE, (s.y + s.h + 0.9) * TILE, 2, typeof s.owner === 'number' ? s.owner : -1);
      if (e) e.atPort = s.okey;
    }
  },
};

// na terra ocupada (vilas e arredores dos castelos), o que é cortado ou quebrado não rebrota
{
  const ro0 = World.removeObj.bind(World);
  World.removeObj = function (i) {
    const n = this.regrow.length; ro0(i);
    if (this.regrow.length > n && NPCWork.settled(i % WORLD_W, (i / WORLD_W) | 0)) this.regrow.pop();
  };
}

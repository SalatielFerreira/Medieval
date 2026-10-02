'use strict';
// Combate avançado: bloqueio com escudo, golpe forte carregado, esquiva, ordens para os capangas
// e batalhas em campo aberto entre os exércitos dos reinos.

const Moves = {
  update(dt) {
    P.iframes = Math.max(0, (P.iframes || 0) - dt);
    P.dodgeCd = (P.dodgeCd || 0) - dt;
    if (P.dodgeT > 0) { P.dodgeT -= dt; moveEnt(P, P.dvx * dt, P.dvy * dt); }
    const wantBlock = G.mouse.right || G.keys.KeyX || Touch.block || Pad.block;
    P.blocking = !!wantBlock && !P.mounted && !P.sailing && P.stamina > 2 && !P.fishing;
    if (P.blocking) P.aim = Math.atan2(G.mouse.wy - (P.y - 14), G.mouse.wx - P.x);
    if (P.charging && !P.gatherHold && (P.charge || 0) > 0.12 && this.gatherInstead()) { P.charging = false; P.charge = 0; P.gatherHold = true; }
    if (P.charging) {
      P.charge = Math.min(1.2, (P.charge || 0) + dt);
      if (P.charge > 0.45 && !P.chargeSnd) { P.chargeSnd = true; Sound.play('ui'); }
    }
  },
  // segurar o botão perto de recursos coleta sem parar (se não houver inimigo por perto)
  gatherInstead() {
    if (P.mounted || P.sailing || P.fishing) return false;
    if (G.ents.some(e => !e.dead && canHit(e) && U.dist(e.x, e.y, P.x, P.y) < 4 * TILE)) return false;
    const px = P.x / TILE, py = (P.y - 8) / TILE, tool = P.equip.tool && ITEMS[P.equip.tool].tool;
    for (let y = Math.floor(py) - 2; y <= Math.floor(py) + 2; y++) for (let x = Math.floor(px) - 2; x <= Math.floor(px) + 2; x++) {
      if (!World.inb(x, y) || U.dist(x + 0.5, y + 0.5, px, py) > 1.9) continue;
      const i = World.idx(x, y);
      if (World.obj[i] || ((tool === 'hoe' || tool === 'water') && G.plots[i])) return true;
    }
    return false;
  },
  dodge() {
    if ((P.dodgeCd || 0) > 0 || P.stamina < 18 || P.mounted || P.sailing || P.dead) return;
    let dx = (G.keys.KeyD || G.keys.ArrowRight ? 1 : 0) - (G.keys.KeyA || G.keys.ArrowLeft ? 1 : 0) + (G.padMove ? G.padMove.x : 0) + (G.touchMove ? G.touchMove.x : 0);
    let dy = (G.keys.KeyS || G.keys.ArrowDown ? 1 : 0) - (G.keys.KeyW || G.keys.ArrowUp ? 1 : 0) + (G.padMove ? G.padMove.y : 0) + (G.touchMove ? G.touchMove.y : 0);
    if (Math.hypot(dx, dy) < 0.2) { dx = -Math.cos(P.aim); dy = -Math.sin(P.aim); }
    const L = Math.hypot(dx, dy);
    P.dvx = dx / L * 560; P.dvy = dy / L * 560;
    P.dodgeT = 0.2; P.iframes = 0.32; P.dodgeCd = 0.7; P.stamina -= 18;
    Game.burst(P.x, P.y - 4, 'rgba(230,220,200,0.8)', 8);
    Sound.play('swing');
  },
  blockPct() { const s = P.equip.shield && ITEMS[P.equip.shield]; return s ? s.block : 0.25; },
  // dano recebido pelo jogador passa por aqui (esquiva e bloqueio)
  filter(amount, src) {
    if (P.iframes > 0) { Game.addText(P.x, P.y - 44, 'Esquivou!', '#9ad0ff'); return 0; }
    if (P.blocking && src) {
      const a = Math.atan2(src.y - P.y, src.x - P.x);
      if (U.angDiff(a, P.aim) < 1.3) {
        const k = this.blockPct();
        P.stamina = Math.max(0, P.stamina - amount * 0.7);
        Game.addText(P.x, P.y - 44, 'Bloqueou!', '#e8e0c8');
        Sound.play('block');
        Progress.add('blocks');
        return amount * (1 - k);
      }
    }
    return amount;
  },
  startCharge() { P.charging = true; P.charge = 0; P.chargeSnd = false; },
  release() {
    const c = P.charge || 0;
    P.charging = false; P.charge = 0;
    if (c >= 0.45) this.heavy(c); else Game.playerAction(true, true);
  },
  heavy(c) {
    if (P.atkCd > 0 && P.atkCd > 0.2) return;
    const aim = Math.atan2(G.mouse.wy - (P.y - 14), G.mouse.wx - P.x);
    const dmg = Game.pDmg() * (1.5 + c);
    let hit = 0;
    for (const e of G.ents) {
      if (e.dead || !canHit(e)) continue;
      const d = U.dist(P.x, P.y - 10, e.x, e.y - 10);
      if (d > 58 + e.r || U.angDiff(Math.atan2(e.y - P.y, e.x - P.x), aim) > 1.4) continue;
      Game.damage(e, dmg, P);
      if (!e.dead) moveEnt(e, Math.cos(aim) * 22, Math.sin(aim) * 22);
      hit++;
    }
    P.aim = aim; P.dir = Math.cos(aim) < 0 ? -1 : 1; P.swing = 0.32; P.atkCd = 0.6;
    P.stamina = Math.max(0, P.stamina - 16);
    Game.addText(P.x, P.y - 50, hit ? `Golpe forte! ×${hit}` : 'Golpe forte!', '#ffd36b');
    Sound.play('swing'); if (hit) Sound.play('hit');
  },
};

// ====================================================================== ordens para os capangas
const ORDERS = { follow: { name: 'Seguir', icon: '👣' }, attack: { name: 'Atacar', icon: '⚔️' }, hold: { name: 'Aguardar aqui', icon: '✋' } };
const Orders = {
  cycle() {
    const keys = Object.keys(ORDERS), i = keys.indexOf(G.order || 'follow');
    G.order = keys[(i + 1) % keys.length];
    if (G.order === 'hold') G.holdPos = { x: P.x, y: P.y };
    UI.msg(`${ORDERS[G.order].icon} Ordem aos capangas: ${ORDERS[G.order].name}.`);
    Sound.play('ui');
  },
};

// ====================================================================== batalhas em campo aberto
const Battles = {
  list() { return G.battles || (G.battles = []); },
  active() { return this.list().filter(b => !b.done); },
  create(a, b) {
    const A = World.capitals[a], B = World.capitals[b];
    let x = Math.round(A.x + (B.x - A.x) * 0.5), y = Math.round(A.y + (B.y - A.y) * 0.5);
    // procura um campo aberto perto do ponto médio entre as capitais
    let spot = null;
    for (let r = 0; r < 20 && !spot; r++) for (let k = 0; k < 16 && !spot; k++) {
      const tx = Math.round(x + Math.cos(k / 16 * Math.PI * 2) * r), ty = Math.round(y + Math.sin(k / 16 * Math.PI * 2) * r);
      if (World.areaOk(tx - 5, ty - 3, 11, 7) && !World.blocked(tx, ty)) spot = { x: tx, y: ty };
    }
    if (!spot) return null;
    const bt = { id: Date.now() % 100000 + this.list().length, a, b, x: spot.x, y: spot.y, day: G.day, size: { [a]: Math.min(9, 3 + (G.civs[a].garrison >> 1)), [b]: Math.min(9, 3 + (G.civs[b].garrison >> 1)) }, side: null, started: false, done: false };
    this.list().push(bt);
    Diplo.chronicle(`⚔️ Os exércitos de ${Diplo.name(a)} e ${Diplo.name(b)} se preparam para a batalha em campo aberto.`, Diplo.involves(a, b));
    return bt;
  },
  tag(b, c) { return `bat${b.id}_${c}`; },
  update() {
    for (const b of this.active()) {
      const d = U.dist(P.x / TILE, P.y / TILE, b.x, b.y);
      if (!b.started && d < 34 && !G.dungeon) {
        b.started = true;
        for (const [c, off] of [[b.a, -5], [b.b, 5]]) {
          for (let k = 0; k < b.size[c]; k++) {
            const sp = freeSpotNear((b.x + off) * TILE, (b.y + (k - b.size[c] / 2) * 0.7) * TILE, TILE * 1.5);
            const e = Game.spawn('guard', sp.x, sp.y, { civ: c, leash: 26, tag: this.tag(b, c), archer: k % 3 === 2 });
            e.home = { x: b.x * TILE, y: b.y * TILE }; e.battle = b.id; e.aggroOv = 16;
          }
        }
        UI.banner(`⚔️ Batalha: ${Diplo.name(b.a)} × ${Diplo.name(b.b)}`);
        if (!b.side && !G.civs.some(c => c.ruler === 'player' && (c.id === b.a || c.id === b.b))) setTimeout(() => { if (!UI.isOpen()) UI.showBattle(b); }, 200);
        else if (G.civs[b.a].ruler === 'player' || G.civs[b.b].ruler === 'player') b.side = G.civs[b.a].ruler === 'player' ? b.a : b.b;
      }
      if (!b.started) continue;
      const alive = c => G.ents.filter(e => e.tag === this.tag(b, c) && !e.dead).length;
      const na = alive(b.a), nb = alive(b.b);
      if (d > 50) { this.resolve(b, null); continue; }
      if (na === 0 || nb === 0) this.resolve(b, na > 0 ? b.a : b.b);
    }
  },
  join(b, side) {
    b.side = side;
    const enemy = side === b.a ? b.b : b.a;
    b.prevWar = G.civs[enemy].atWar;
    G.civs[enemy].atWar = true;
    UI.msg(`Você luta por ${Diplo.name(side)}! Seus capangas atacarão os soldados de ${Diplo.name(enemy)}. (T muda as ordens)`, 'gold');
  },
  resolve(b, winner) {
    b.done = true;
    for (const e of G.ents) if (e.tag && e.tag.startsWith(`bat${b.id}_`)) e.dead = true;
    if (winner === null) {
      // sem o jogador por perto, a força decide
      winner = Diplo.strength(b.a) + U.rnd(0, 6) >= Diplo.strength(b.b) + U.rnd(0, 6) ? b.a : b.b;
    }
    const loser = winner === b.a ? b.b : b.a;
    G.civs[loser].garrison = Math.max(0, G.civs[loser].garrison - 3);
    Diplo.addRel(winner, loser, -5);
    Diplo.chronicle(`🏆 ${Diplo.name(winner)} venceu a batalha contra ${Diplo.name(loser)}.`, Diplo.involves(winner, loser) || !!b.side);
    if (b.side !== null && b.side !== undefined) {
      const enemy = b.side === b.a ? b.b : b.a;
      if (G.civs[enemy].ruler !== 'player' && !Diplo.warsOf(enemy).some(w => G.civs[w.a].ruler === 'player' || G.civs[w.b].ruler === 'player')) G.civs[enemy].atWar = !!b.prevWar;
      if (b.side === winner) {
        const g = U.rint(80, 160);
        P.gold += g; Game.gainXp(60); Game.addRelation(winner, 15);
        UI.banner('🏆 Vitória!'); UI.msg(`Seu lado venceu! ${Diplo.name(winner)} recompensa você com ${g} 🪙 (+15 relação).`, 'gold');
        Progress.add('battlesWon'); Court.addService(winner, 8);
      } else UI.msg(`Seu lado perdeu a batalha. ${Diplo.name(winner)} guardará rancor (−20 relação).`, 'bad');
      Game.addRelation(enemy, -20);
    }
  },
  dayTick() {
    for (const b of this.active()) if (G.day - b.day > ECON_DAYS) this.resolve(b, null);
    for (const w of Diplo.D().wars) if (!this.active().some(b => (b.a === w.a && b.b === w.b) || (b.a === w.b && b.b === w.a)) && Math.random() < 0.5) this.create(w.a, w.b);
    G.battles = this.list().filter(b => !b.done || G.day - b.day < 3 * ECON_DAYS);
  },
};

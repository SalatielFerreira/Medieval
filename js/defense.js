'use strict';
// Defesa das vilas: todo ataque vem de fora dos muros. Os inimigos chegam diante do portão (ou além da muralha, se a
// vila não tiver portão), arrombam o portão fechado e só então entram; os soldados da vila defendem do lado de dentro.
// O portão tem resistência: arrombado, não fecha mais até ser consertado.

const GATE_HP = 300;
const Defense = {
  RING: 16,
  // o portão que defende a vila é o que fica na muralha dela (um portão seu longe dali não conta)
  gateOf(vi) { const v = World.villages[vi]; return typeof Gate !== 'undefined' && v ? Gate.list().find(s => s.village === vi && U.dist(s.x, s.y, v.x, v.y) <= GATE_REACH) || null : null; },
  // direção de dentro para fora, passando pelo portão
  out(v, g) { const dx = g.x + 0.5 - v.x, dy = g.y + 0.5 - v.y, d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d }; },
  spawnRaider(v, vi) {
    const g = this.gateOf(vi);
    let x, y;
    if (g) { const o = this.out(v, g); x = (g.x + 0.5 + o.x * 7 + U.rnd(-2, 2)) * TILE; y = (g.y + 0.5 + o.y * 7 + U.rnd(-2, 2)) * TILE; }
    else { const a = Math.random() * Math.PI * 2; x = (v.x + Math.cos(a) * (this.RING + 6)) * TILE; y = (v.y + Math.sin(a) * (this.RING + 6) / 1.25) * TILE; }
    const s = freeSpotNear(x, y, 3 * TILE);
    const e = Game.spawn('guard', s.x, s.y, { civ: v.raid.by, leash: 30, tag: 'raid' + vi, archer: Math.random() < 0.3 });
    e.raidVi = vi; e.aggroOv = 9;
    return e;
  },
  // quantos soldados defendem: a guarnição do reino (ou os vigias da vila livre)
  defenders(v) { const c = G.civs[v.civ]; return U.clamp(2 + Math.floor(((c && !v.free ? c.garrison : 4) || 0) / 5), 2, 6); },
  spawnDefender(v, vi) {
    const g = this.gateOf(vi);
    let x = v.x * TILE, y = v.y * TILE;
    if (g) { const o = this.out(v, g); x = (g.x + 0.5 - o.x * 4 + U.rnd(-1.5, 1.5)) * TILE; y = (g.y + 0.5 - o.y * 4 + U.rnd(-1.5, 1.5)) * TILE; }
    let s = freeSpotNear(x, y, 3 * TILE);
    if (Math.max(Math.abs(s.x / TILE - v.x), Math.abs(s.y / TILE - v.y) * 1.25) >= this.RING - 1) s = freeSpotNear(v.x * TILE, v.y * TILE, 4 * TILE); // sempre do lado de dentro
    const e = Game.spawn('guard', s.x, s.y, { civ: v.civ, leash: 10, tag: 'def' + vi });
    e.aggroOv = 10;
    return e;
  },
  hp(g) { const d = Gate.data(g); if (d.hp === undefined) d.hp = GATE_HP; return d.hp; },
  // a cada meio segundo: os inimigos marcham até o portão, batem nele e, arrombado, entram na vila
  t: 0,
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.5;
    if (G.place || G.dungeon) return;
    World.villages.forEach((v, vi) => {
      if (!v.raid || v.raid.until < G.day) return;
      const raiders = G.ents.filter(e => !e.dead && e.tag === 'raid' + vi); if (!raiders.length) return;
      const g = this.gateOf(vi), d = g && Gate.data(g);
      const inside = { x: v.x * TILE, y: v.y * TILE };
      if (!g || d.broken) { for (const e of raiders) if (!e.target) { e.home = inside; e.leash = 20 * TILE; } return; }
      const o = this.out(v, g), front = { x: (g.x + 0.5 + o.x * 1.2) * TILE, y: (g.y + 0.5 + o.y * 1.2) * TILE };
      const closed = g.blocks;
      let hits = 0;
      for (const e of raiders) {
        if (!closed) { if (!e.target) { e.home = inside; e.leash = 20 * TILE; } continue; } // portão aberto: entram
        // com o portão fechado, quem está do lado de dentro não é alvo: primeiro é preciso arrombar o portão
        if (e.target && Math.max(Math.abs(e.target.x / TILE - v.x), Math.abs(e.target.y / TILE - v.y) * 1.25) < this.RING) e.target = null;
        if (!e.target) { e.home = front; e.leash = 1.5 * TILE; e.wx = front.x + U.rnd(-12, 12); e.wy = front.y + U.rnd(-12, 12); e.wt = 0.7; } // marcham direto até o portão
        if (U.dist(e.x, e.y, (g.x + 0.5) * TILE, (g.y + 0.5) * TILE) < 3.2 * TILE) { hits++; e.swing = 0.25; e.dir = (g.x + 0.5) * TILE < e.x ? -1 : 1; }
      }
      if (hits) {
        this.hp(g); d.hp = Math.max(0, d.hp - hits * 4);
        if (Math.random() < 0.3) { Game.burst((g.x + 0.5) * TILE, (g.y + 0.5) * TILE, '#8b5a2b', 4); Sound.play('chop', { vol: 0.5 }); }
        if (d.hp <= 0) {
          d.broken = true; d.alarm = 0; Gate.apply(g);
          Gate.log(g, `💥 O portão foi arrombado por ${Diplo.name(v.raid.by)}.`);
          UI.banner(`💥 O portão de ${v.name} caiu!`);
          if (Gate.mine(g) || U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 30) UI.msg(`💥 Os soldados de ${Diplo.name(v.raid.by)} arrombaram o portão de ${v.name} e estão entrando!`, 'bad', true);
        }
      }
    });
  },
};

{
  // portão arrombado não fecha; o conserto custa madeira e pedra
  const cn0 = Gate.closedNow.bind(Gate);
  Gate.closedNow = function (s, d) { if (d && d.broken) return false; return cn0(s, d); };
  Gate.repair = function (s) {
    const d = this.data(s), cost = { wood: 15, stone: 15 };
    if (!this.mine(s)) return;
    if (!Inv.has(cost)) { UI.msg('O conserto custa 15 madeiras e 15 pedras.', 'bad'); return; }
    Inv.pay(cost); d.hp = GATE_HP; d.broken = false; this.apply(s); this.log(s, '🔨 Portão consertado.');
    UI.msg('🔨 O portão está de pé de novo.', 'gold'); Sound.play('build');
  };
  const open0 = Gate.open.bind(Gate);
  Gate.open = function (sid) {
    open0(sid);
    const s = World.structs[sid], pb = UI.panel && UI.panel.querySelector('.pb'); if (!s || !pb) return;
    const d = this.data(s), hp = Defense.hp(s);
    const div = document.createElement('div'); div.className = 'card'; div.style.marginTop = '10px';
    div.innerHTML = `<div class="sec">🛡️ Resistência do portão <span>${d.broken ? 'arrombado' : `${hp} / ${GATE_HP}`}</span></div>
      <div class="va-bar"><i style="width:${Math.round(hp / GATE_HP * 100)}%;${d.broken || hp < GATE_HP / 3 ? 'background:linear-gradient(90deg,#8a1a1a,#e04848)' : ''}"></i></div>
      <p class="dt-desc">Os ataques vêm de fora dos muros: os inimigos chegam diante do portão e, se ele estiver fechado, tentam arrombá-lo enquanto os soldados da vila defendem do lado de dentro. ${d.broken ? 'Arrombado, ele não fecha até ser consertado.' : ''}</p>
      ${this.mine(s) && (d.broken || hp < GATE_HP) ? `<div class="act-row"><button class="primary" data-act="gate" data-s="${s.id}" data-k="repair" data-v="1">🔨 Consertar (15 madeiras e 15 pedras)</button></div>` : ''}`;
    pb.insertBefore(div, pb.children[1] || null);
  };
  const act0 = Gate.act.bind(Gate);
  Gate.act = function (dd) { if (dd.k === 'repair') { const s = World.structs[+dd.s]; if (s) { this.repair(s); this.open(s.id); } return; } return act0(dd); };
  // desenho: portão arrombado (sem as folhas, com lascas no chão)
  const ds0 = World.drawStruct.bind(World);
  World.drawStruct = function (ctx, s, X, Y, time) {
    const r = ds0(ctx, s, X, Y, time);
    if (s.type === 'vgate') { const d = Gate.peek(s); if (d && d.broken) { ctx.fillStyle = 'rgba(25,15,8,0.55)'; ctx.fillRect(X + 6, Y - 4, 20, 34); ctx.fillStyle = '#6b4423'; for (let k = 0; k < 5; k++) ctx.fillRect(X + 4 + k * 5, Y + 26 + (k % 2) * 3, 6, 2); } }
    return r;
  };
  const wu0 = War.update.bind(War);
  War.update = function (dt) { Defense.update(dt); return wu0(dt); };
}

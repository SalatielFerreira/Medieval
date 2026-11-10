'use strict';
// Depois de uma briga, quem se feriu cuida de si: longe do perigo por alguns segundos, o morador (ou o guarda, o vigia)
// ferido vai até a Casa de Curas ou a Enfermaria mais perto e é tratado lá; sem uma por perto, para e come alguma coisa.
// Fora de briga a vida também volta devagar.
const Curar = {
  CALM: 6,          // segundos sem apanhar nem lutar
  FAR: 35,          // até onde vai procurar a casa de curas (blocos)
  KINDS: ['villager', 'guard', 'sentry'],
  CLINICS: ['vclinic', 'vinfirm'],
  FOODS: ['🍞', '🍎', '🧀', '🍗', '🥖'],
  ok(e) {
    if (!e || e.dead || e.sleeping || e.inRoom || e.escort || e.placeNpc || e.battle || !e.npc || !this.KINDS.includes(e.kind)) return false;
    const p = e.npc; if (p.hostile || p.hit || p.band || p.capanga) return false;
    if (['arena', 'duelist', 'engine'].includes(e.faction) || /^(raid|asl|def|reb|crw)/.test(e.tag || '')) return false;
    return true;
  },
  calm(e) { return !e.target && (G.realTime - (e.hitT || -99)) > this.CALM; },
  clinic(e) {
    let best = null, bd = this.FAR * TILE;
    for (const s of World.structs) { if (!s || s.removed || !this.CLINICS.includes(s.type)) continue; const d = U.dist(e.x, e.y, (s.x + s.w / 2) * TILE, (s.y + s.h) * TILE); if (d < bd) { bd = d; best = s; } }
    return best;
  },
  door(s) { return { x: (s.x + s.w / 2) * TILE, y: (s.y + s.h + 0.6) * TILE }; },
  stop(e) { e.heal = null; },
  // devolve true quando o cuidado comandou o movimento neste quadro
  step(e, dt) {
    if (!this.ok(e)) { if (e && e.heal) this.stop(e); return false; }
    if (e.hp >= e.maxHp) { if (e.heal) this.stop(e); return false; }
    if (!this.calm(e)) { if (e.heal) this.stop(e); return false; }
    e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.004 * dt); // volta devagar
    let h = e.heal;
    if (!h && e.hp < e.maxHp * 0.75) {
      const s = this.clinic(e);
      if (s) h = e.heal = { mode: 'go', s, t: 60 };
      else if ((e.eatCd || 0) < G.realTime) h = e.heal = { mode: 'eat', t: 3.5, ic: U.pick(this.FOODS) };
    }
    if (!h) return false;
    h.t -= dt; e.anim += dt; e.hurt -= dt; e.moving = false;
    if (h.mode === 'eat') {
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.12 * dt);
      if (h.t <= 0 || e.hp >= e.maxHp) { e.eatCd = G.realTime + 45; this.stop(e); }
      return true;
    }
    if (h.s.removed || h.t <= 0) { this.stop(e); return false; }
    const dr = this.door(h.s);
    if (h.mode === 'go') {
      if (U.dist(e.x, e.y, dr.x, dr.y) < 1.6 * TILE) { h.mode = 'treat'; h.t = 30; }
      else { const sp = e.def.speed * World.speedAt(e.x, e.y) * (e.spMul || 1) * 0.8; e.moveToward(dr.x, dr.y, sp, dt); }
      return true;
    }
    // sendo tratado na porta da casa de curas
    e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.2 * dt);
    if (e.hp >= e.maxHp) this.stop(e);
    return true;
  },
};

{
  // quem apanha ou bate fica "em briga" por alguns segundos
  const dm0 = Game.damage.bind(Game);
  Game.damage = function (target, amount, src) {
    const r = dm0(target, amount, src);
    if (target && target !== P) target.hitT = G.realTime;
    if (src && src !== P) src.hitT = G.realTime;
    return r;
  };
  const up0 = Creature.prototype.update;
  Creature.prototype.update = function (dt) {
    try { if (this.npc && Curar.step(this, dt)) return; } catch (err) { console.error(err); this.heal = null; }
    return up0.call(this, dt);
  };
  // o sinal sobre a cabeça: a comida, o caminho da casa de curas ou o tratamento
  const dr0 = Creature.prototype.draw;
  Creature.prototype.draw = function (ctx, cx, cy) {
    const r = dr0.call(this, ctx, cx, cy), h = this.heal;
    if (h && !this.dead) {
      const x = this.x - cx, y = this.y - cy - 50 + Math.sin((G.realTime || 0) * 4) * 1.5;
      ctx.save(); ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(h.mode === 'eat' ? h.ic : h.mode === 'go' ? '🩹' : '🌿', x, y);
      ctx.restore();
    }
    return r;
  };
}

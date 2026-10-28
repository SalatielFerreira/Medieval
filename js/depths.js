'use strict';
// Masmorras mais fundas: cada caverna tem andares (3; o covil do dragão, 4). Em cada andar há uma escada que desce,
// vigiada por um guardião; as criaturas ficam mais fortes a cada andar e os baús, mais ricos. O chefe mora no último
// andar e, na primeira vez que cai, deixa um item lendário que só existe lá (um por tipo de chefe).
const LEGENDS = {
  troll:        { k: 'trollking_maul',  name: 'Martelo do Rei Troll',   icon: '🔨', slot: 'weapon', dmg: 56, color: '#7a8a5a', len: 27, price: 2400, desc: 'Esmaga armaduras: golpes pesados que derrubam qualquer um.' },
  skel_king:    { k: 'deathless_blade', name: 'Lâmina do Rei Morto',    icon: '⚔️', slot: 'weapon', dmg: 50, color: '#b8f0ff', len: 28, price: 2600, desc: 'Fria como o túmulo: cada golpe devolve um pouco de vida.', leech: 0.08 },
  spider_queen: { k: 'widow_bow',       name: 'Arco da Viúva Negra',    icon: '🏹', slot: 'weapon', dmg: 34, ranged: true, color: '#3a2a3a', len: 16, price: 2200, desc: 'Flechas envenenadas que voam longe.' },
  dragon:       { k: 'dragonfang',      name: 'Presa do Dragão',        icon: '🗡️', slot: 'weapon', dmg: 66, color: '#ff8a3a', len: 30, price: 4200, desc: 'Forjada do dente do Dragão Ancestral: a arma mais forte dos Sete Reinos.' },
};
for (const L of Object.values(LEGENDS)) if (!ITEMS[L.k]) ITEMS[L.k] = { name: L.name, icon: L.icon, cat: 'Armas', price: L.price, slot: L.slot, dmg: L.dmg, ranged: L.ranged, color: L.color, len: L.len, legend: true, desc: L.desc, leech: L.leech };

Object.assign(ART_ITEMS, { trollking_maul: ['hammer', 'troll'], deathless_blade: ['sword', 'ancient'], widow_bow: ['bow', 'bear'], dragonfang: ['sword', 'dragon'] });
CIV_STRUCTS.cave_down = { name: 'Escada que Desce', blocks: false };
CIV_STRUCTS.cave_up = { name: 'Escada que Sobe', blocks: false };

const Depths = {
  L() { return G.legends || (G.legends = {}); },
  // descer e subir
  down() { const d = G.dungeon; if (!d || d.floor >= d.depth) return; Sound.play('chest', { vol: 0.4 }); Dungeon.enter(d.cave, d.floor + 1); },
  up() { const d = G.dungeon; if (!d || d.floor <= 1) return; Dungeon.enter(d.cave, d.floor - 1, true); },
};

{
  // o que se faz com a escada
  const il0 = Game.interactLabel.bind(Game);
  Game.interactLabel = function (s) {
    if (s && s.type === 'cave_down') return G.dungeon ? `Descer ao ${G.dungeon.floor + 1}º andar` : 'Descer';
    if (s && s.type === 'cave_up') return G.dungeon ? `Subir ao ${G.dungeon.floor - 1}º andar` : 'Subir';
    return il0(s);
  };
  const us0 = Game.useStruct.bind(Game);
  Game.useStruct = function (s) {
    if (s && s.type === 'cave_down') { const g = G.ents.find(e => !e.dead && e.floorGuard === G.dungeon.floor && U.dist(e.x, e.y, (s.x + 0.5) * TILE, (s.y + 0.5) * TILE) < 14 * TILE); if (g) { UI.msg(`⚔️ ${g.nameTag} bloqueia a escada! Derrote-o primeiro.`, 'bad'); return; } Depths.down(); return; }
    if (s && s.type === 'cave_up') { Depths.up(); return; }
    return us0(s);
  };
  // a escada desenhada (de pedra, descendo para o escuro; ou subindo com luz no alto)
  const ds0 = World.drawStruct;
  World.drawStruct = function (ctx, s, X, Y, time) {
    if (s && (s.type === 'cave_down' || s.type === 'cave_up')) {
      const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(X + x), Math.round(Y + y), w, h); };
      const down = s.type === 'cave_down';
      R(-4, 2, 40, 30, '#2a2420'); R(-2, 4, 36, 26, '#3a332c');
      for (let k = 0; k < 5; k++) R(2 + k * 2, 6 + k * 5, 28 - k * 4, 4, down ? U.shade('#8a8278', -k * 0.12) : U.shade('#8a8278', -(4 - k) * 0.12));
      if (down) { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(X + 10, Y + 24, 12, 6); }
      else { const gl = 0.35 + Math.sin(time * 2) * 0.1; ctx.fillStyle = `rgba(255,220,140,${gl})`; ctx.fillRect(X + 6, Y + 2, 20, 6); }
      ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(down ? '▼' : '▲', X + 16, Y - 2); ctx.textAlign = 'left';
      return;
    }
    return ds0.call(this, ctx, s, X, Y, time);
  };
  // guardião vencido: a escada fica livre (e não volta mais); chefe vencido: o lendário na primeira vez
  const k0 = Game.kill.bind(Game);
  Game.kill = function (e, src) {
    const r = k0(e, src);
    if (e && e.floorGuard && G.dungeon) {
      const st = Dungeon.state(G.dungeon.idx); st.guards = st.guards || []; if (!st.guards.includes(e.floorGuard)) st.guards.push(e.floorGuard);
      UI.msg(`🗝️ ${e.nameTag} caiu: a escada para o ${e.floorGuard + 1}º andar está livre.`, 'gold');
      const g = U.rint(80, 160) * e.floorGuard; P.gold += g; Game.addText(e.x, e.y - 60, `+${g} 🪙`, '#ffd54a');
      Progress.add('guardians');
    }
    return r;
  };
  const bk0 = Dungeon.onBossKill.bind(Dungeon);
  Dungeon.onBossKill = function (e) {
    const r = bk0(e);
    const d = G.dungeon, L = d && LEGENDS[d.theme];
    if (L && !Depths.L()[d.theme]) {
      Depths.L()[d.theme] = G.day; Inv.add(L.k, 1);
      UI.banner(`✨ Item lendário: ${L.name}!`);
      UI.msg(`✨ No fundo de ${d.name} você encontra ${L.name} — ${L.desc} Só existe um em todos os reinos.`, 'gold', true);
      Progress.diary(`✨ Encontrou o lendário ${L.name} no fundo de ${d.name}.`);
      Diplo.chronicle(`✨ ${G.name} ${G.surname || ''} saiu de ${d.name} com ${L.name}.`, true);
      Progress.add('legends');
    }
    return r;
  };
  // baús: mais ricos a cada andar
  const oc0 = Dungeon.openChest.bind(Dungeon);
  Dungeon.openChest = function (s) {
    const f = (G.dungeon && G.dungeon.floor) || 1, g0 = P.gold, was = s.opened;
    const r = oc0(s);
    if (!was && f > 1) {
      const extra = Math.round((P.gold - g0) * (f - 1) * 0.6); P.gold += extra;
      const it = U.pick(['gold_bar', 'gem', 'mithril_bar', 'ruby', 'emerald'].filter(x => ITEMS[x])); if (it) Inv.add(it, f - 1);
      UI.msg(`💰 Tesouro do ${f}º andar: +${extra} 🪙${it ? ` e ${f - 1} ${ITEMS[it].name}` : ''}.`, 'gold');
    }
    return r;
  };
  // golpe que rouba vida (Lâmina do Rei Morto)
  const dm0 = Game.damage.bind(Game);
  Game.damage = function (target, amount, src) {
    const r = dm0(target, amount, src);
    const w = src === P && P.equip.weapon && ITEMS[P.equip.weapon];
    if (w && w.leech && target !== P && amount > 0) P.hp = Math.min(P.maxHp, P.hp + Math.max(1, Math.round(amount * w.leech)));
    return r;
  };
  // o nome do guardião aparece em cima dele
  const cd0 = Creature.prototype.draw;
  Creature.prototype.draw = function (ctx, cx, cy) {
    const r = cd0.call(this, ctx, cx, cy);
    if (this.nameTag && !this.dead) { ctx.save(); ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; const x = Math.round(this.x - cx), y = Math.round(this.y - cy) - 50; ctx.strokeText(this.nameTag, x, y); ctx.fillStyle = '#ffb04a'; ctx.fillText(this.nameTag, x, y); ctx.restore(); }
    return r;
  };
}

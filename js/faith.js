'use strict';
// Religião: capelas nas vilas, catedrais nas capitais, padres, orações, doações, bênçãos,
// casamento na igreja, batizados e peregrinações aos santuários.

const Faith = {
  // capela em cada vila, catedral em cada capital e três santuários isolados (posições sempre iguais)
  init() {
    World.villages.forEach((v, vi) => { if (!v.chapel) this.chapelFor(v, vi); });
    for (let c = 0; c < CIV_DEFS.length; c++) {
      const cp = World.capitals[c];
      if (!cp.cathedral) cp.cathedral = Arena.place('cathedral', cp.x, cp.y, 3, 3, c, 9, 16, c * 1.7 + Math.PI);
    }
    if (!World.shrines) this.placeShrines();
  },
  chapelFor(v, vi) {
    const s = Arena.place('chapel', v.x, v.y, 2, 2, v.civ, 5, 11, vi * 0.9 + 2);
    if (s) { s.village = vi; v.chapel = s; }
    return s;
  },
  placeShrines() {
    World.shrines = [];
    const names = ['Santuário da Montanha Branca', 'Santuário das Três Fontes', 'Santuário do Eremita'];
    const rng = U.mulberry32(World.seed + 777);
    for (let tries = 0; tries < 6000 && World.shrines.length < 3; tries++) {
      const x = Math.floor(rng() * (WORLD_W - 20)) + 10, y = Math.floor(rng() * (WORLD_H - 20)) + 10;
      if (World.terr[World.idx(x, y)] >= 0 && tries < 4000) continue;
      if (!World.areaOk(x - 1, y - 1, 4, 4) || !World.areaFree(x - 1, y - 1, 4, 4)) continue;
      if (World.villages.some(v => U.dist(v.x, v.y, x, y) < 25) || World.capitals.some(c => U.dist(c.x, c.y, x, y) < 30)) continue;
      if (World.shrines.some(s => U.dist(s.x, s.y, x, y) < 60)) continue;
      const s = World.addStruct('shrine', x, y, 2, 2, -1, { shrine: World.shrines.length, sname: names[World.shrines.length] });
      World.shrines.push(s);
    }
  },
  // um padre (ou madre) em cada vila
  ensurePriests() {
    World.villages.forEach((v, vi) => {
      if (!G.people.some(p => p.alive && p.rank === 'priest' && p.home.type === 'village' && p.home.idx === vi))
        People.create({ rank: 'priest', age: U.rint(30, 60), civ: v.civ, home: { type: 'village', idx: vi }, trait: U.pick(['gentil', 'leal', 'timido']) });
    });
  },
  piety() { return Math.round(G.piety || 0); },
  addPiety(n) { G.piety = Math.max(0, (G.piety || 0) + n); },
  priestOf(vi) { return G.people.find(p => p.alive && p.rank === 'priest' && p.home.type === 'village' && p.home.idx === vi); },
  pray() {
    if (G.prayDay === G.day) { UI.msg('Você já rezou hoje. Volte amanhã.'); return; }
    G.prayDay = G.day; this.addPiety(2); Farm.addBuff('blessed');
    UI.msg('🙏 Você rezou em silêncio. Sente o coração mais leve.', 'gold');
  },
  donate(ci, n) {
    if (P.gold < n) return;
    P.gold -= n; this.addPiety(n / 10);
    if (ci >= 0) { const c = G.civs[ci]; c.happy = Math.min(100, c.happy + n / 100); Court.addService(ci, n / 50); Game.addRelation(ci, n / 80); }
    UI.msg(`💛 Você doou ${n} 🪙 à igreja. O povo comenta sua generosidade.`, 'gold');
    Progress.add('donated', n);
  },
  bless() {
    const cost = this.piety() >= 50 ? 0 : 40;
    if (P.gold < cost) { UI.msg(`A bênção pede uma oferta de ${cost} 🪙.`, 'bad'); return; }
    P.gold -= cost; Farm.addBuff('holy'); this.addPiety(1);
    UI.msg(`✨ O padre abençoa você${cost ? '' : ' (de graça, pela sua devoção)'}.`, 'gold');
  },
  // casamento na igreja: dispensa o anel (para quem já namora e tem romance 70+)
  canWed(p) { return p && p.alive && p.dating && p.rom >= 70; },
  wed(p, vi) {
    if (!this.canWed(p)) return;
    if (P.gold < 80) { UI.msg('A cerimônia custa 80 🪙.', 'bad'); return; }
    P.gold -= 80;
    P.inv.silver_ring = (P.inv.silver_ring || 0) + 1;
    const r = People.propose(Object.assign(p, { rom: Math.max(p.rom, 85) }));
    if (r) {
      p.aff = Math.min(100, p.aff + 10); this.addPiety(10);
      for (const q of People.residents(vi)) q.aff = Math.min(100, q.aff + 3);
      UI.banner(`⛪ Casamento na capela de ${World.villages[vi].name}!`);
      UI.msg(`Os sinos tocam: ${G.name} e ${p.name} se casaram diante de toda a vila.`, 'gold');
    }
  },
  baptize(id) {
    const c = People.get(id);
    if (!c || c.baptized) return;
    c.baptized = true; c.aff = Math.min(100, c.aff + 5); this.addPiety(5);
    UI.msg(`💧 ${c.name} foi batizad${c.sex === 'f' ? 'a' : 'o'}. ${c.sex === 'f' ? 'Ela' : 'Ele'} terá +10 de vida se herdar a família.`, 'gold');
  },
  // peregrinação: visitar cada santuário uma vez
  startPilgrimage(i) {
    const s = World.shrines[i];
    G.pilgrim = i; G.ping = { x: s.x + 1, y: s.y + 1, name: s.sname };
    UI.msg(`🧭 Peregrinação ao ${s.sname}. Siga a seta dourada.`, 'gold');
  },
  visitShrine(s) {
    G.shrines = G.shrines || {};
    if (G.shrines[s.shrine]) { UI.msg('Você já fez a peregrinação a este santuário. Reza mais um pouco e segue viagem.'); Farm.addBuff('blessed'); return; }
    G.shrines[s.shrine] = G.day;
    P.maxHp += 15; P.hp = P.maxHp; this.addPiety(20); Farm.addBuff('holy'); Court.addFame(5);
    if (G.pilgrim === s.shrine) { G.pilgrim = null; G.ping = null; P.gold += 60; }
    UI.banner(`🕯️ ${s.sname}`);
    UI.msg(`Peregrinação completa! +15 de vida máxima para sempre, +20 de devoção e a Graça Divina.`, 'gold');
    Progress.add('pilgrimages'); Progress.diary(`🕯️ Peregrinação ao ${s.sname}.`);
    Sound.play('levelup');
  },
};

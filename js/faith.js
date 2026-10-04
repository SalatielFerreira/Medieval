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
    if (G.prayDay === G.day) { UI.msg('Você já rezou este mês. Volte no próximo.'); return; }
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
    if (this.sins()) { UI.msg('O padre balança a cabeça: "Primeiro a confissão, depois a bênção."', 'bad'); return; }
    const cost = this.piety() >= 50 ? 0 : 40;
    if (P.gold < cost) { UI.msg(`A bênção pede uma oferta de ${cost} 🪙.`, 'bad'); return; }
    P.gold -= cost; Farm.addBuff('holy'); this.addPiety(1);
    UI.msg(`✨ O padre abençoa você${cost ? '' : ' (de graça, pela sua devoção)'}.`, 'gold');
  },
  // estado da igreja no jogo salvo: missa do mês, missa dos antepassados, pecados, dízimo e esmolas
  C() { return G.church || (G.church = { sins: 0, tithe: false }); },
  sins() { return this.C().sins || 0; },
  addSin(n, why) { const c = this.C(); c.sins = (c.sins || 0) + n; if (why && c.sins === n) UI.msg(`⛪ ${why} pesa na sua consciência. Uma confissão na igreja alivia.`); },
  // missa: uma por mês, com os moradores da vila
  mass(vi) {
    const c = this.C();
    if (c.massDay === G.day) { UI.msg('A missa deste mês já foi. Volte no próximo.'); return; }
    c.massDay = G.day; this.addPiety(3); Farm.addBuff('blessed');
    if (vi !== undefined && vi !== null) for (const q of People.residents(vi)) q.aff = Math.min(100, q.aff + 2);
    UI.msg(`🔔 Você assistiu à missa${vi !== undefined && vi !== null ? ' com o povo de ' + World.villages[vi].name : ''}. Os moradores gostaram de ver você ali.`, 'gold');
  },
  // confissão: a penitência é uma esmola por pecado; depois o padre volta a abençoar
  penance() { return this.sins() * 15; },
  confess() {
    const n = this.sins();
    if (!n) { UI.msg('O padre sorri: "Sua alma está em paz, meu filho."'); return; }
    const cost = this.penance();
    if (P.gold < cost) { UI.msg(`A penitência pede ${cost} 🪙 em esmolas.`, 'bad'); return; }
    P.gold -= cost; this.C().sins = 0; this.addPiety(5); Farm.addBuff('blessed');
    UI.msg(`🕊️ Você se confessou e cumpriu a penitência (${cost} 🪙 em esmolas). Seus pecados foram perdoados.`, 'gold');
  },
  // esmola aos pobres da vila: os mendigos agradecem e um deles consegue recomeçar a vida
  alms(vi) {
    const c = this.C();
    if (P.gold < 30) { UI.msg('A esmola é de 30 🪙.', 'bad'); return; }
    if (c.almsDay === G.day) { UI.msg('Você já deu esmolas este mês.'); return; }
    P.gold -= 30; c.almsDay = G.day; this.addPiety(3);
    const poor = vi !== undefined && vi !== null ? People.residents(vi).filter(q => q.rank === 'beggar') : [];
    for (const q of poor) q.aff = Math.min(100, q.aff + 15);
    const v = World.villages[vi]; if (v) v.prosper = Math.min(30, (v.prosper || 0) + 0.5);
    if (poor.length && Math.random() < 0.5) { const q = poor[0]; q.rank = 'peasant'; UI.msg(`💛 Com a sua ajuda, ${q.name} deixou de mendigar e voltou a trabalhar no campo.`, 'gold'); }
    else UI.msg(`💛 Você deu esmolas aos pobres${v ? ' de ' + v.name : ''}. ${poor.length ? poor.length + (poor.length === 1 ? ' mendigo agradece.' : ' mendigos agradecem.') : 'As famílias mais pobres agradecem.'}`, 'gold');
  },
  // dízimo: 5% do seu ouro todo mês (até 100), para a igreja do reino onde você estiver
  tithe(on) { this.C().tithe = !!on; UI.msg(on ? '⛪ Você passou a pagar o dízimo: 5% do seu ouro todo mês (no máximo 100).' : 'Você parou de pagar o dízimo.', on ? 'gold' : ''); },
  // missa pelos antepassados: uma por ano
  requiem() {
    const c = this.C(), year = Math.floor(G.day / 12);
    if (!(G.dynasty || []).length) return;
    if (c.requiemYear === year) { UI.msg('Os antepassados já foram lembrados este ano.'); return; }
    if (P.gold < 50) { UI.msg('A missa pelos antepassados pede 50 🪙.', 'bad'); return; }
    P.gold -= 50; c.requiemYear = year; this.addPiety(5); Court.addFame(2); Farm.addBuff('holy');
    UI.msg(`🕯️ Velas acesas por ${G.dynasty.map(h => h.name).join(', ')}. A memória da Casa ${G.surname} é honrada.`, 'gold');
  },
  monthTick() {
    const c = this.C();
    if (c.tithe && P.gold > 0) { const n = Math.min(100, Math.max(1, Math.round(P.gold * 0.05))); P.gold -= n; this.addPiety(2); Game.note(`⛪ Dízimo: −${n} 🪙 · +2 de devoção.`); }
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
    UI.msg(`Peregrinação completa! +15 de vida máxima para sempre, +20 de devoção e a Graça Divina.`, 'gold', true);
    Progress.add('pilgrimages'); Progress.diary(`🕯️ Peregrinação ao ${s.sname}.`);
    Sound.play('levelup');
  },
};

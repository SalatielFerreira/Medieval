'use strict';
// Religiões e culturas: cada reino tem a sua fé e o seu povo, com gostos, saudação e festa própria.
//  • 5 religiões, cada uma com um dom para quem a segue. Você escolhe a sua (e pode se converter) nos templos;
//    rezar num templo de outra fé rende metade. Reinos da mesma fé se aproximam; de fés diferentes, se estranham.
//  • Como rei, você pode decretar a sua fé como a religião do reino (o povo estranha no começo).
//  • 7 culturas: cada povo paga mais pelo que gosta (mexe nos preços), valoriza presentes do seu gosto e tem uma
//    festa anual (o reino fica mais feliz e vira feira).

const RELIGIONS = {
  sol:     { name: 'Igreja do Sol Eterno',     icon: '☀️', color: '#f2c14a', god: 'o Sol Eterno',       temple: 'Igreja',      gift: 'Fé rende 25% a mais e cada prece cura você.' },
  antigos: { name: 'Fé dos Deuses Antigos',    icon: '🪓', color: '#6a8ab0', god: 'Odrin e os Antigos', temple: 'Salão dos Antigos', gift: 'Golpes corpo a corpo 10% mais fortes.' },
  lua:     { name: 'Culto da Lua Prateada',    icon: '🌙', color: '#b8c0e8', god: 'a Senhora da Lua',   temple: 'Santuário Lunar', gift: 'Magias 15% mais fortes e gastam menos energia.' },
  chama:   { name: 'Ordem da Chama Sagrada',   icon: '🔥', color: '#e86a2a', god: 'a Chama Sagrada',    temple: 'Templo da Chama', gift: 'Forja, fundição e armeiro rendem 15% a mais.' },
  terra:   { name: 'Caminho da Mãe Terra',     icon: '🌿', color: '#6aa84f', god: 'a Mãe Terra',        temple: 'Bosque Sagrado', gift: 'Colheitas e criações rendem 20% a mais.' },
};
const cultoA = g => g.startsWith('o ') ? 'ao ' + g.slice(2) : g.startsWith('a ') ? 'à ' + g.slice(2) : 'a ' + g;
const CIV_RELIGION = ['sol', 'chama', 'antigos', 'terra', 'lua', 'lua', 'sol'];
const CULTURES = [
  { people: 'Midgardianos', icon: '🌾', value: 'Honra e trabalho no campo', greet: 'Que os seus campos sejam fartos!', likes: ['beer', 'mead', 'cooked_meat', 'bread', 'wool_cloak', 'iron_axe'], fest: 2, festName: 'Festa da Colheita' },
  { people: 'Dorneses', icon: '🏜️', value: 'Comércio e hospitalidade', greet: 'Sol e sombra para você, viajante.', likes: ['wine', 'spices', 'silk_cloth', 'olive_oil', 'grape', 'dates'], fest: 1, festName: 'Festa do Sol Alto' },
  { people: 'Nortenhos', icon: '❄️', value: 'Coragem e força', greet: 'O inverno chega para todos. Que ele te encontre forte.', likes: ['mead', 'wolf_pelt', 'bear_coat', 'wool', 'salted_meat', 'war_axe'], fest: 3, festName: 'Noite Mais Longa' },
  { people: 'Valacos', icon: '🌲', value: 'A floresta e os antepassados', greet: 'Que a floresta te guarde.', likes: ['honey', 'herbal_tea', 'mushroom', 'berries', 'candle', 'lavender'], fest: 0, festName: 'Festa das Flores' },
  { people: 'Olimpianos', icon: '🏛️', value: 'Saber e artes', greet: 'Saudações, amigo da sabedoria.', likes: ['wine', 'olive_oil', 'marble_block', 'book', 'painting', 'lute'], fest: 1, festName: 'Jogos Olímpicos' },
  { people: 'Babilônios', icon: '🐫', value: 'Riqueza e luxo', greet: 'Que o ouro corra na sua bolsa!', likes: ['spices', 'perfume', 'pearl', 'gold_ring', 'silk_cloth', 'pearl_necklace'], fest: 2, festName: 'Grande Bazar' },
  { people: 'Gondorianos', icon: '🐎', value: 'Cavalaria e fé', greet: 'Honra e escudo, amigo!', likes: ['iron_sword', 'saddle', 'bread', 'wine', 'kite_shield', 'horsehair'], fest: 0, festName: 'Torneio da Primavera' },
];

const Religion = {
  R() { G.urban = G.urban || {}; return G.urban.rel || (G.urban.rel = { map: {}, mine: null, fest: {} }); },
  of(ci) { if (ci < 0 || ci === undefined || !CIV_DEFS[ci]) return null; return this.R().map[ci] || CIV_RELIGION[ci % CIV_RELIGION.length]; },
  culture(ci) { return ci >= 0 && CULTURES[ci % CULTURES.length] || null; },
  civAt(x, y) { const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE); return World.inb(tx, ty) ? World.terr[World.idx(tx, ty)] : -1; },
  mine() {
    const R = this.R();
    if (!R.mine) { const ci = G.mainRealm !== undefined && G.mainRealm !== null && G.mainRealm >= 0 ? G.mainRealm : this.civAt(G.spawn ? G.spawn.x : P.x, G.spawn ? G.spawn.y : P.y); R.mine = this.of(ci >= 0 ? ci : 0) || 'sol'; }
    return R.mine;
  },
  is(r) { return this.mine() === r; },
  // fé de uma pessoa: a do reino onde mora
  faithOf(p) { const h = p.home || {}; const ci = h.type === 'village' && World.villages[h.idx] ? World.villages[h.idx].civ : h.type === 'castle' ? h.civ : p.civ; return this.of(ci) || 'sol'; },
  // gosto do povo: paga mais pelo que gosta
  taste(ci, k) { const c = this.culture(ci); return c && c.likes.includes(k) ? 1.25 : 1; },
  convert(r) {
    const old = this.mine(); if (old === r || !RELIGIONS[r]) return;
    this.R().mine = r; G.piety = Math.floor((G.piety || 0) / 2);
    for (const c of G.civs) { const cr = this.of(c.id); if (cr === r) Game.addRelation(c.id, 5); else if (cr === old) Game.addRelation(c.id, -5); }
    UI.banner(`${RELIGIONS[r].icon} ${RELIGIONS[r].name}`);
    UI.msg(`${RELIGIONS[r].icon} Você se converteu: agora a sua fé é ${RELIGIONS[r].name}. ${RELIGIONS[r].gift} (A fé acumulada caiu pela metade; os reinos dessa fé gostaram, os da antiga, não.)`, 'gold', true);
    Diplo.chronicle(`${RELIGIONS[r].icon} ${G.name} se converteu: agora segue ${RELIGIONS[r].name}.`, true);
    Progress.diary(`${RELIGIONS[r].icon} Converteu-se: ${RELIGIONS[r].name}.`);
  },
  decree(ci) {
    const c = G.civs[ci], r = this.mine(); if (!c || c.ruler !== 'player' || this.of(ci) === r) return;
    this.R().map[ci] = r; c.happy = Math.max(0, c.happy - 15);
    UI.msg(`📜 Decreto: ${RELIGIONS[r].name} é agora a fé de ${CIV_DEFS[ci].name}. O povo estranha (−15 de felicidade), mas os reinos da mesma fé passam a ver vocês como irmãos.`, 'gold', true);
    Diplo.chronicle(`📜 ${CIV_DEFS[ci].name} adotou a ${RELIGIONS[r].name} por decreto de ${G.name}.`, true);
  },
  // todo mês: aproximação entre reinos da mesma fé, distância entre fés diferentes; festas dos povos
  monthTick() {
    const n = G.civs.length, mine = this.mine();
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      if (G.civs[a].ruler === 'player' || G.civs[b].ruler === 'player') continue;
      if (Diplo.addRel) Diplo.addRel(a, b, this.of(a) === this.of(b) ? 0.6 : -0.25);
    }
    for (const c of G.civs) if (c.ruler !== 'player') Game.addRelation(c.id, this.of(c.id) === mine ? 0.4 : -0.15);
    // festa anual de cada povo, no começo da estação dela
    const year = Calendar.of(G.day).year, R = this.R();
    G.civs.forEach((c, ci) => {
      const cu = this.culture(ci); if (!cu || World.season !== cu.fest || R.fest[ci] === year) return;
      R.fest[ci] = year; c.happy = Math.min(100, c.happy + 6);
      if (typeof Commerce !== 'undefined' && !Commerce.fair()) Commerce.st().fair = { ci, until: G.day + 1, name: cu.festName };
      Diplo.chronicle(`${cu.icon} ${cu.festName} em ${CIV_DEFS[ci].short}: os ${cu.people} celebram.`);
      if (this.civAt(P.x, P.y) === ci) { UI.banner(`${cu.icon} ${cu.festName}!`); UI.msg(`${cu.icon} Os ${cu.people} celebram a ${cu.festName}: o reino fica feliz e a feira se enche de mercadores.`, 'gold'); Farm.addBuff('charm'); }
    });
  },
  card(ci) {
    const r = RELIGIONS[this.of(ci)], cu = this.culture(ci); if (!r || !cu) return '';
    return `<div class="card"><div class="sec">${r.icon} ${UI.esc(r.name)} · ${cu.icon} ${UI.esc(cu.people)}</div><p class="dt-desc">Fé de ${CIV_DEFS[ci].short}: culto ${cultoA(r.god)}. Povo: ${UI.esc(cu.value)}. Gostam de ${cu.likes.filter(k => ITEMS[k]).map(k => ITEMS[k].name).join(', ')} (pagam 25% a mais). Festa: ${UI.esc(cu.festName)}.${this.of(ci) === this.mine() ? ' <b class="ok">É a sua fé.</b>' : ''}</p></div>`;
  },
  // janela das religiões (nos templos e com os sacerdotes)
  show(ci) {
    const here = this.of(ci), mine = this.mine(), c = G.civs[ci];
    const h = `<p>Sua fé: <b>${RELIGIONS[mine].icon} ${RELIGIONS[mine].name}</b> · fé acumulada: ${Math.round(G.piety || 0)}. ${here ? `Fé deste lugar: <b>${RELIGIONS[here].icon} ${RELIGIONS[here].name}</b>.` : ''}</p>
      <div class="kgrid two">${Object.entries(RELIGIONS).map(([k, r]) => { const civs = G.civs.filter(x => this.of(x.id) === k).map(x => CIV_DEFS[x.id].short);
        return `<div class="card"><div class="sec"><span class="cdot" style="background:${r.color}"></span> ${r.icon} ${r.name}${k === mine ? ' <small class="ok">sua fé</small>' : ''}</div>
          <p class="dt-desc">Culto ${cultoA(r.god)}. Dom: ${r.gift}<br>Reinos: ${civs.join(', ') || 'nenhum'}.</p>
          ${k !== mine && k === here ? `<div class="act-row"><button class="primary" data-act="relconv" data-r="${k}">Converter-se</button></div>` : ''}</div>`; }).join('')}</div>
      ${c && c.ruler === 'player' && here !== mine ? `<div class="act-row"><button data-act="reldecree" data-c="${ci}">📜 Decretar a ${RELIGIONS[mine].name} como fé de ${CIV_DEFS[ci].short} (−15 de felicidade)</button></div>` : ''}
      <p class="muted">Para se converter a outra fé, vá a um templo dela (as capelas e catedrais seguem a fé do reino) ou fale com um sacerdote dela.</p>`;
    UI.open('⛪ Religiões', h, 'showReligions', [ci], 'As fés dos reinos');
  },
};

// ------------------------------------------------------------------ ganchos
{
  // fé: rende metade em terra de outra religião; a Igreja do Sol rende 25% a mais
  const ap0 = Faith.addPiety.bind(Faith);
  Faith.addPiety = function (n) {
    if (n > 0) { const ci = Religion.civAt(P.x, P.y); if (ci >= 0 && Religion.of(ci) !== Religion.mine()) n *= 0.5; if (Religion.is('sol')) n *= 1.25; }
    return ap0(n);
  };
  const pr0 = Faith.pray.bind(Faith);
  Faith.pray = function () { const r = pr0.apply(this, arguments); if (Religion.is('sol')) P.hp = Math.min(P.maxHp, P.hp + Math.round(P.maxHp * 0.25)); return r; };
  // dons das religiões
  const d0 = Game.damage.bind(Game);
  Game.damage = function (t, amount, src) { if (src === P && t !== P && Religion.is('antigos')) { const w = P.equip.weapon && ITEMS[P.equip.weapon]; if (!w || !w.ranged) amount *= 1.1; } return d0(t, amount, src); };
  const pd0 = Game.pDmg.bind(Game);
  Game.pDmg = function () { const d = pd0(); const w = P.equip.weapon && ITEMS[P.equip.weapon]; return w && w.magic && Religion.is('lua') ? d * 1.15 : d; };
  const sh0 = Ranged.shoot.bind(Ranged);
  Ranged.shoot = function (aim) { const w = P.equip.weapon && ITEMS[P.equip.weapon], r = sh0(aim); if (r && w && w.magic && Religion.is('lua')) P.stamina = Math.min(Game.maxSt(), P.stamina + 2); return r; };
  const cr0 = Game.craft.bind(Game);
  Game.craft = function (ri, n) {
    const r = RECIPES[ri], before = Inv.count(r.out); cr0(ri, n);
    const made = Inv.count(r.out) - before;
    if (made > 0 && Religion.is('chama') && ['forja', 'fundicao', 'armeiro'].includes(r.station)) { let x = 0; for (let k = 0; k < Math.round(made / r.n); k++) if (Math.random() < 0.15) x += r.n; if (x) { Inv.add(r.out, x); UI.msg(`🔥 A Chama Sagrada abençoou a forja: +${x} ${ITEMS[r.out].name}.`, 'gold'); } }
  };
  const h0 = Farm.harvest.bind(Farm);
  Farm.harvest = function (i) { const p = this.plots()[i], c = p && CROPS[p.crop], r = h0(i); if (r && c && Religion.is('terra') && Math.random() < 0.6) Inv.add(c.item, 1); return r; };
  const cp0 = Content.produce.bind(Content);
  Content.produce = function (s) { const out = cp0(s); if (out && Religion.is('terra')) for (const k in out) out[k] = Math.round(out[k] * 1.2); return out; };
  // presentes do gosto do povo valem mais
  const g0 = People.gift.bind(People);
  People.gift = function (p, k) { const r = g0(p, k); const cu = Religion.culture(People.civOf ? People.civOf(p) : p.civ); if (cu && cu.likes.includes(k)) { People.addAff(p, 4); if (r && typeof r === 'object') r.note = (r.note ? r.note + ' ' : '') + `${cu.icon} É do gosto dos ${cu.people}!`; } return r; };
  // saudação do povo e fé da pessoa na conversa
  const ln0 = Mind.line.bind(Mind);
  Mind.line = function (p) { if (Math.random() < 0.12) { const cu = Religion.culture(p.home && p.home.type === 'village' && World.villages[p.home.idx] ? World.villages[p.home.idx].civ : p.civ); if (cu) return cu.greet; } return ln0(p); };
  const ch0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) { const out = ch0(p), r = RELIGIONS[Religion.faithOf(p)]; if (r) out.push(`<span>${r.icon} ${UI.esc(r.name)}</span>`); return out; };
  const ac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) { ac0(p, acts); if (p.rank === 'priest') acts.push(['religion', `${RELIGIONS[Religion.faithOf(p)].icon} Falar sobre a fé`]); };
  const ta0 = Lifesim.talkAct.bind(Lifesim);
  Lifesim.talkAct = function (p, op) {
    if (op !== 'religion') return ta0(p, op);
    const h = p.home || {}, ci = h.type === 'village' && World.villages[h.idx] ? World.villages[h.idx].civ : p.civ;
    Religion.show(ci); return 'shown';
  };
  // mês
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Religion.monthTick(); };
  // janelas: templos, castelos e o seu reino mostram a fé e o povo
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if ((fn === 'showChapel') && args && World.structs[args[0]]) {
      const s = World.structs[args[0]], ci = typeof s.owner === 'number' ? s.owner : -1, r = RELIGIONS[Religion.of(ci)];
      if (r) { title = `${r.icon} ${r.temple}`; body = `<div class="card"><div class="sec">${r.icon} ${r.name}</div><p class="dt-desc">Culto ${cultoA(r.god)}. Dom dos fiéis: ${r.gift}${Religion.of(ci) === Religion.mine() ? ' <b class="ok">É a sua fé.</b>' : ' Você segue outra fé: rezar aqui rende metade.'}</p><div class="act-row"><button data-act="relshow" data-c="${ci}">⛪ Religiões${Religion.of(ci) !== Religion.mine() ? ' · converter-se' : ''}</button></div></div>` + body; }
    }
    if (fn === 'showCastle' && args && args[0] !== undefined) body += Religion.card(args[0]);
    return op0(title, body, fn, args, sub);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'relshow') { Religion.show(+d.c); return; }
    if (a === 'relconv') { Religion.convert(d.r); Religion.show(Religion.civAt(P.x, P.y)); return; }
    if (a === 'reldecree') { Religion.decree(+d.c); Religion.show(+d.c); return; }
    return a0(a, d);
  };
}

'use strict';
// Obras dos governadores da IA: as vilas que a IA comanda também erguem as Obras nas vilas, cada uma pensando sozinha.
//  • Quem decide: o governador da vila; sem governador, o rei (da IA). Onde você governa (vila ou reino sem governador),
//    a IA não mexe. Numa vila do seu reino com governador da IA, ele constrói só com o caixa da vila (nada do seu tesouro).
//  • O dinheiro: cada vila tem um caixa de obras que enche todo mês com o poder econômico dela, o nível e uma parte dos
//    aluguéis das obras; o rei da IA manda uma verba do tesouro quando sobra dinheiro (metade em tempo de guerra).
//  • O jeito de cada um: o ofício do governador costuma dar o gosto dele (o comerciante prefere comércio, o padre a fé, o cavaleiro
//    a defesa...), cada vila tem as suas manias e a sorte faz o resto. O que falta (armazém, taverna, capela, poço...)
//    pesa mais; em guerra, a defesa; reino pobre, o que dá dinheiro; reino rico, fé, cultura e praça.
//  • As regras: uma obra por vez, sem repetir (só a plantação pode ter até 3); obra grande só em vila grande (o valor da
//    obra cresce com o nível, e Universidade, Catedral e outras têm nível mínimo); algumas pedem outra antes (a Catedral
//    pede a Capela, a Universidade a Escola...); peixe só perto da água e mina só perto da montanha; um limite de obras por
//    nível; depois de construir, a vila descansa de 2 a 4 meses. O governador escolhe um projeto e junta dinheiro até
//    poder pagar (às vezes muda de ideia).
//  • A obra vai para um lote do traçado da vila (com a rua em volta) e entra na crônica.
const NW_SKIP = ['vhouse', 'vgate', 'vwall', 'bank', 'port', 'cemetery', 'arena']; // casas (os moradores), portão, e as do reino
const NW_REQ = { vuniv: ['vschool'], vcathedral: ['chapel'], vmonastery: ['chapel'], vthermae: ['vbath'], vinfirm: ['vclinic'], vhmarket: ['vmarket'], vcraft: ['vguild'], vguild: ['smith'], vmint: ['vtrade'], vinn: ['tavern'], vinn2: ['tavern'], vpawn: ['store'], vtrade: ['store'], vfishshop: ['vfishery'] };
const NW_MINLVL = { vhmarket: 3, vhall: 3, vmonastery: 4, vthermae: 4, vguild: 4, vmint: 5, vcraft: 5, vuniv: 6, vcathedral: 8 };
const NW_BASIC = ['store', 'tavern', 'chapel', 'well', 'smith', 'field', 'lumber', 'quarry'];
const NW_PERSONAS = {
  mercador:  { name: 'comerciante', w: { com: 2.4, serv: 1.3 } },
  artesao:   { name: 'artesão', w: { prod: 2.4, casa: 1.3 } },
  lavrador:  { name: 'lavrador', w: { faz: 2.4, prod: 1.2 } },
  guerreiro: { name: 'guerreiro', w: { def: 2.6, praca: 1.1 } },
  devoto:    { name: 'devoto', w: { fe: 2.6, serv: 1.3 } },
  erudito:   { name: 'erudito', w: { cult: 2.6, serv: 1.3 } },
  vaidoso:   { name: 'vaidoso', w: { praca: 2.4, com: 1.2 } },
  prudente:  { name: 'prudente', w: { casa: 1.6, serv: 1.4, faz: 1.3 } },
};
const NW_BY_RANK = { merchant: 'mercador', innkeeper: 'mercador', smith: 'artesao', mason: 'artesao', lumber: 'artesao', peasant: 'lavrador', hunter: 'lavrador', farmer: 'lavrador', knight: 'guerreiro', mercenary: 'guerreiro', soldier: 'guerreiro', priest: 'devoto' };
const NW_OTHER = ['erudito', 'vaidoso', 'prudente', 'mercador', 'devoto'];

const NpcWorks = {
  off: false,
  S() { const u = G.urban || (G.urban = {}); return u.npcw || (u.npcw = {}); },
  // a classe de cada obra (a mesma da janela Obras nas vilas)
  cls: (() => { const m = {}; for (const [k, , , keys] of OBRAS_CLASSES) for (const x of keys) if (x.startsWith('c:')) m[x.slice(2)] = k; return m; })(),
  types() { return Object.keys(this.cls).filter(t => CIVIC[t] && !NW_SKIP.includes(t)); },
  cost(t) { const v = Order.buildValue('c:' + t); return Math.round((v === null || v === undefined ? Order.costValue(CIVIC[t].cost) : v) * 1.8); },
  // quem manda na vila (da IA): o governador ou, sem ele, o rei; null onde você governa
  ruler(v) {
    if (!v || v.removed || v.lord === 'player' || v.chief === 'player') return null;
    const ch = v.chief !== undefined ? G.people[v.chief] : null;
    if (ch && ch.alive) return ch;
    const c = !v.free && G.civs[v.civ];
    if (c && c.ruler === 'npc' && !c.dead) { const k = G.people[c.rulerId]; if (k && k.alive) return k; }
    return null;
  },
  // a força do reino: rico ou pobre, em guerra ou em paz, rei da IA (manda verba) ou não
  realm(v) {
    const c = !v.free && G.civs[v.civ];
    if (!c || c.dead) return { c: null, npc: false, rich: 1, war: false };
    const ci = G.civs.indexOf(c), war = G.civs.some((o, j) => j !== ci && o && !o.dead && Diplo.atWar(ci, j));
    return { c, ci, npc: c.ruler === 'npc', rich: U.clamp((c.treasury || 0) / 1200, 0.4, 2), war };
  },
  state(vi, who) {
    const S = this.S(), v = World.villages[vi];
    let st = S[vi];
    if (!st) {
      const taste = {}; for (const [k] of OBRAS_CLASSES) taste[k] = Math.round(U.rnd(0.7, 1.3) * 100) / 100;
      st = S[vi] = { fund: U.rint(20, 60) * (v.level || 1), wait: U.rint(0, 2), taste, built: [], log: [] };
    }
    // governador novo, cabeça nova: o gosto vem do ofício dele (e o projeto antigo é revisto)
    if (who && st.chief !== who.id) {
      st.chief = who.id; st.plan = null;
      st.persona = (Math.random() < 0.6 && NW_BY_RANK[who.rank]) || (NW_BY_RANK[who.rank] ? U.pick(Object.keys(NW_PERSONAS)) : NW_OTHER[who.id % NW_OTHER.length]);
    }
    return st;
  },
  // o que a vila já tem
  have(vi) { const m = {}; for (const s of World.structs) if (s && !s.removed && s.village === vi) m[s.type] = (m[s.type] || 0) + 1; return m; },
  near(v, pred, r) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const x = v.x + i, y = v.y + j; if (World.inb(x, y) && pred(World.tiles[World.idx(x, y)])) return true; } return false; },
  geo(st, v) { if (!st.geo) st.geo = { water: this.near(v, t => World.isWater(t), 16), rock: this.near(v, t => t === T.MOUNT, 18) }; return st.geo; },
  // a obra pode entrar na lista desta vila?
  allowed(t, v, st, have) {
    const L = v.level || 1, max = 50 + 75 * L;
    if ((have[t] || 0) >= (t === 'field' ? 3 : 1)) return false;
    if (NW_MINLVL[t] ? L < NW_MINLVL[t] : this.cost(t) / 1.8 > max) return false;
    if ((NW_REQ[t] || []).some(r => !have[r])) return false;
    const g = this.geo(st, v);
    if ((t === 'vfishery' || t === 'vfishshop') && !g.water) return false;
    if (t === 'vmine' && !g.rock) return false;
    return true;
  },
  // quanto o governador quer esta obra
  want(t, v, vi, st, R, have) {
    const c = this.cls[t], P0 = NW_PERSONAS[st.persona] || NW_PERSONAS.prudente;
    let w = (P0.w[c] || 1) * (st.taste[c] || 1);
    if (NW_BASIC.includes(t) && !have[t]) w *= 3;
    if (t === 'field') w *= 0.5;
    if (t === 'vtenement' && People.residents(vi).length >= Families.vcap(v) * 0.85) w *= 4;
    if (R.war && c === 'def') w *= 2.5;
    if (R.rich < 0.7 && (c === 'com' || c === 'prod')) w *= 1.5;
    if (R.rich > 1.3 && (c === 'fe' || c === 'cult' || c === 'praca')) w *= 1.5;
    const d = VWORKS[t]; if (d) w *= 1 + (d.rent || 0) / 30 + (d.pm || 0);
    return w * U.rnd(0.6, 1.4);
  },
  // escolhe um projeto que dê para pagar em até uns 8 meses
  choose(v, vi, st, R, inc) {
    const have = this.have(vi), reach = st.fund + Math.max(10, inc) * 8;
    const opts = this.types().filter(t => this.allowed(t, v, st, have) && this.cost(t) <= reach);
    if (!opts.length) return null;
    const ws = opts.map(t => this.want(t, v, vi, st, R, have)), sum = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum; for (let i = 0; i < opts.length; i++) { r -= ws[i]; if (r <= 0) return opts[i]; }
    return opts[opts.length - 1];
  },
  // quanto entra no caixa de obras por mês (sem a verba do rei)
  income(v, vi) {
    const L = v.level || 1, rent = VillageWorks.of(vi).reduce((a, s) => a + ((VWORKS[s.type] || {}).rent || 0), 0);
    let g = VillageEcon.power(vi) * 0.25 + L * 3 + rent * 0.3;
    if (v.ruin) g *= 0.6;
    const c = !v.free && G.civs[v.civ]; if (c && !c.dead && (c.treasury || 0) < 100) g *= 0.8; // reino quebrado cobra mais impostos
    return Math.max(0, g);
  },
  // a verba do rei da IA: só do que sobra no tesouro
  grant(v, R) {
    if (!R.npc) return 0;
    const nv = World.villages.filter(x => x && !x.removed && !x.free && x.civ === v.civ).length, reserve = 200 + 40 * nv;
    if (R.c.treasury <= reserve) return 0;
    return Math.max(0, Math.round(Math.min((R.c.treasury - reserve) * 0.08, 12 + 8 * (v.level || 1)) * (R.war ? 0.5 : 1)));
  },
  limit(v) { return 2 + 2 * (v.level || 1); },
  fundMax(v) { return 250 + 250 * (v.level || 1); }, // o caixa não junta além disso (o resto fica com os moradores)
  // um lote livre no traçado da vila (como o TownPlan arruma: fileiras a cada 3 blocos, a avenida do centro livre)
  spot(vi, w, h) {
    const v = World.villages[vi], occ = new Map(), s = { id: -2, w, h }, hh = TownPlan.span(h);
    for (let j = v.y - PLAN_HY - 3; j <= v.y + PLAN_HY + 3; j++) for (let i = v.x - PLAN_HX - 3; i <= v.x + PLAN_HX + 3; i++) {
      if (!World.inb(i, j)) continue; const k = World.idx(i, j), id = World.sgrid[k];
      if (id >= 0 && World.structs[id] && !World.structs[id].removed) occ.set(k, id);
    }
    const px = Math.floor(P.x / TILE), py = Math.floor(P.y / TILE);
    let best = null, bs = 1e9;
    for (let k = -4; k <= 4; k++) {
      const top = v.y + 3 * k;
      if (top < v.y - PLAN_HY || top + hh - 1 > v.y + PLAN_HY) continue;
      for (let x = v.x - PLAN_HX; x + w - 1 <= v.x + PLAN_HX; x++) {
        if (x <= v.x && x + w - 1 >= v.x) continue;
        const sc = Math.abs(x + w / 2 - v.x - 0.5) + Math.abs(top + hh / 2 - v.y) * 1.6 + Math.random() * 4;
        if (sc >= bs) continue;
        if (TownPlan.fits(s, x, top, hh, vi, occ, px, py)) { bs = sc; best = { x, y: top }; }
      }
    }
    return best;
  },
  // ergue a obra no lote (sem contar como feito seu, mesmo que você esteja no modo de obras)
  raise(vi, t, p) {
    const d = CIVIC[t], m = Urban.mode; Urban.mode = null;
    let s; try { s = Urban.addCivic(t, p.x, p.y, vi); } finally { Urban.mode = m; }
    const E = Urban.E();
    for (let j = p.y; j < p.y + d.h; j++) for (let i = p.x; i < p.x + d.w; i++) {
      const k = World.idx(i, j);
      if (World.tiles[k] === T.ROAD && E.mine[k] === undefined) { const g = Urban.groundOf(k); World.tiles[k] = g; E.roads[k] = g; if (World.roadLv) World.roadLv[k] = 0; if (E.rlv) delete E.rlv[k]; }
    }
    TownPlan.roads(vi);
    World.touchArea(p.x - 2, p.y - 2, d.w + 4, d.h + 4);
    return s;
  },
  // um mês de uma vila
  village(vi) {
    const v = World.villages[vi], who = this.ruler(v); if (!who || G.dungeon || this.off) return;
    const st = this.state(vi, who), R = this.realm(v), inc = this.income(v, vi);
    // o mês enche o caixa até o teto (doações podem passar dele); a verba do rei só cobre o que falta
    const room = Math.max(0, this.fundMax(v) - st.fund), gr = Math.min(this.grant(v, R), Math.max(0, Math.round(room - inc)));
    if (gr) R.c.treasury -= gr;
    st.fund = Math.round(st.fund + Math.min(room, inc + gr));
    if (st.wait > 0) { st.wait--; return; }
    if (st.built.length >= this.limit(v)) return;
    const have = this.have(vi);
    if (st.plan && (!this.allowed(st.plan, v, st, have) || Math.random() < 0.08)) st.plan = null; // já tem, não dá mais ou mudou de ideia
    if (!st.plan) st.plan = this.choose(v, vi, st, R, inc + gr);
    const t = st.plan; if (!t) return;
    const cost = this.cost(t); if (st.fund < cost) return; // juntando dinheiro
    const p = this.spot(vi, CIVIC[t].w, CIVIC[t].h);
    if (!p) { st.plan = null; st.wait = 3; return; } // a vila está cheia: espera crescer
    this.raise(vi, t, p);
    st.fund -= cost; st.plan = null; st.wait = U.rint(2, 4); st.built.push(t);
    const d = CIVIC[t], chief = v.chief === who.id, title = chief ? (who.sex === 'f' ? 'governadora' : 'governador') : RANKS[who.rank] ? (who.sex === 'f' ? RANKS[who.rank].f : RANKS[who.rank].m).toLowerCase() : 'rei';
    const line = `${d.icon} ${d.name} (${cost} 🪙)`;
    st.log.unshift({ t, day: G.day }); if (st.log.length > 8) st.log.length = 8;
    if (chief && typeof Politics !== 'undefined') Politics.addDeed(vi, who.id, U.clamp(cost / 15, 3, 20), `🏗️ Ergueu ${d.name} em ${v.name}`);
    const mine = R.c && R.c.ruler === 'player', known = mine || U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 60;
    Diplo.chronicle(`🏗️ ${v.name} ganhou ${line}: obra d${who.sex === 'f' ? 'a' : 'o'} ${title} ${People.full(who)}.`, known);
    if (mine) Game.note(`🏗️ ${People.full(who)}, governador${who.sex === 'f' ? 'a' : ''} de ${v.name}, ergueu ${d.icon} ${d.name} com o caixa da vila.`, 'gold');
    if (typeof World.buildMinimap === 'function') World.buildMinimap();
  },
  monthTick() {
    World.villages.forEach((v, vi) => {
      if (!this.ruler(v)) return;
      if (typeof Perf !== 'undefined' && Perf.slicing) Perf.queue.push(Object.assign(() => { if (World.villages[vi] === v) this.village(vi); }, { label: 'NpcWorks.village' }));
      else this.village(vi);
    });
  },
};

{
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { NpcWorks.monthTick(); } catch (e) { console.error(e); } };
}

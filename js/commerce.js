'use strict';
// Comércio: a economia ligada de ponta a ponta.
//  1. Cadeia de produção: os empreendimentos que transformam (moinho, padaria, ferraria, vidraria...) gastam insumos.
//     O responsável usa primeiro o que está no depósito do negócio, depois o que os seus outros negócios produziram e,
//     por fim, compra no mercado do reino (com o caixa, ou com o seu ouro). Sem insumo, produz menos.
//  2. Oferta e procura: vender muito do mesmo item num reino derruba o preço lá; comprar muito, sobe. Reinos ricos
//     pagam mais pelo luxo e cada cultura tem os seus gostos (ver religion.js).
//  3. Encomendas: o rei, as vilas, as tavernas e as guildas fazem pedidos com prazo e recompensa.
//  4. Manutenção e riscos: os prédios se desgastam (produzem menos), podem pegar fogo ou ser roubados; o seguro cobre.
//  5. Funcionários: ganham experiência (aprendiz → mestre), produzem mais, pedem aumento, fazem greve e a concorrência
//     tenta levá-los.
//  6. Guildas de ofício: entre numa, ou funde a sua e recrute gente das outras guildas pela intimidade (amizade).
//  7. Feiras de estação e leilões nos castelos.
//  8. Sócios: um morador rico entra com parte do valor e leva parte do lucro.
//  9. Painel dos negócios: lucro, retorno, estado, insumos, funcionários, seguro, sócio, encomendas e guildas.

// ------------------------------------------------------------------ 1. insumos por mês, numa produção cheia
const BIZ_INPUTS = {
  biz_mill: { wheat: 6 }, biz_bakery: { flour: 4, egg: 1 }, biz_smithy: { iron_ore: 2, copper_ore: 1, tin_ore: 1, coal: 2 },
  biz_brewery: { barley: 4, honey: 1 }, biz_tannery: { bark: 2, salt: 1 }, biz_weaver: { fiber: 6, wool: 1 }, biz_jeweler: { silver_bar: 1, gold_bar: 1 },
  biz_apothecary: { herb: 4, vial: 1 }, biz_carpentry: { wood: 8 }, biz_chandler: { honey: 1, fish_oil: 1 }, biz_pottery: { clay: 6, coal: 1 },
  biz_glass: { sand: 4, coal: 1 }, biz_dyer: { rose_petals: 2, lavender: 2, sunflower: 2, cloth: 1 }, biz_press: { olive: 5, grape: 3 },
  biz_smelter: { copper_ore: 2, zinc_ore: 1, tin_ore: 2, lead_ore: 1, coal: 2 }, biz_armorer: { iron_bar: 2, cloth: 3 }, biz_bowyer: { wood: 4, feather: 3 },
  biz_scribe: { bark: 3, coal: 1 }, biz_magic: { herb: 2, glass: 1 }, biz_butcher: { salt: 1 }, biz_tailor: { cloth: 3, wool: 2 }, biz_cobbler: { leather: 3 },
  biz_bathhouse: { wood: 4, soap: 1 }, biz_shipyard: { wood: 6, pinecone: 2 }, biz_charcoal: { wood: 10 }, biz_cooper: { wood: 6, iron_bar: 1 },
  biz_perfumer: { lavender: 3, rose_petals: 2, olive_oil: 1 }, biz_mason: { stone: 8, limestone: 2 }, biz_ropery: { fiber: 8 }, biz_inn: { bread: 2, beer: 2 },
  biz_theatre: { candle: 2 },
};
for (const k in BIZ_INPUTS) for (const i in BIZ_INPUTS[k]) if (!ITEMS[i]) delete BIZ_INPUTS[k][i];
const LUXURY_CATS = ['Diversos'];
const FIRE_PRONE = ['biz_smithy', 'biz_glass', 'biz_smelter', 'biz_charcoal', 'biz_pottery', 'biz_bakery', 'biz_chandler'];
const WORK_LV = ['Aprendiz', 'Ajudante', 'Oficial', 'Experiente', 'Mestre'], WORK_XP = [0, 3, 8, 15, 24];

const Commerce = {
  U() { G.urban = G.urban || {}; return G.urban; },
  st() { const u = this.U(); return u.com || (u.com = { sat: {}, contracts: [], cseq: 1, guilds: null, myGuild: null, member: null, fair: null, auction: null, log: [] }); },
  log(t) { const L = this.st().log; L.unshift({ d: G.day, t }); if (L.length > 30) L.length = 30; },
  // valor de reposição de um prédio (para seguro, conserto e sócios)
  value(s) { return Math.round(Order.costValue(BUILDINGS[s.type].cost)); },
  // ---------------------------------------------------------------- 1. insumos
  inputs(s, k) { const base = BIZ_INPUTS[s.type]; if (!base) return null; const out = {}; for (const i in base) out[i] = Math.ceil(base[i] * k); return out; },
  inbox(s) { return s.inbox || (s.inbox = {}); },
  // quanto dá para conseguir (sem gastar) — para a janela
  supply(s, k) {
    const need = this.inputs(s, k); if (!need) return null;
    const box = this.inbox(s), own = this.ownStock(s), ci = Biz.civOf(s);
    const res = {}; for (const i in need) { const have = (box[i] || 0) + (own[i] || 0); res[i] = { need: need[i], have, price: this.wholesale(ci, i) }; }
    return res;
  },
  ownStock(s) { const o = {}; for (const b of Biz.list()) if (b !== s) for (const src of [b.shelf, b.goods]) for (const k in src || {}) o[k] = (o[k] || 0) + src[k]; return o; },
  wholesale(ci, k) { return Math.max(1, Math.round(Game.price(ci, k).buy * 0.8)); },
  // compra e separa os insumos do mês; devolve a fração da produção que dá para fazer (0 a 1) e o custo
  acquire(s, k) {
    const need = this.inputs(s, k); if (!need || k <= 0) return { f: 1, cost: 0, miss: [] };
    const box = this.inbox(s), ci = Biz.civOf(s), c = G.civs[ci];
    let f = 1, cost = 0; const miss = [], got = {};
    for (const i in need) {
      let left = need[i];
      const fromBox = Math.min(left, box[i] || 0); box[i] = (box[i] || 0) - fromBox; if (box[i] <= 0) delete box[i]; left -= fromBox;
      for (const b of Biz.list()) { if (left <= 0) break; if (b === s) continue; for (const src of [b.shelf, b.goods]) { if (!src || !src[i] || left <= 0) continue; const n = Math.min(left, src[i]); src[i] -= n; if (src[i] <= 0) delete src[i]; left -= n; } }
      if (left > 0) {
        const pr = this.wholesale(ci, i), stock = c && c.stock[i] !== undefined ? c.stock[i] : Infinity;
        let n = Math.min(left, stock);
        const pay = (m) => { const fromTill = Math.min(s.till || 0, m); s.till = (s.till || 0) - fromTill; const rest = m - fromTill; if (rest > P.gold) return false; P.gold -= rest; return true; };
        while (n > 0 && !pay(n * pr)) n--;
        if (n > 0) { cost += n * pr; left -= n; if (c && c.stock[i] !== undefined) c.stock[i] -= n; if (c) c.treasury += Math.round(n * pr * 0.2); this.sat(ci, i, -n); }
      }
      got[i] = need[i] - left;
      if (left > 0) miss.push(ITEMS[i].name);
      f = Math.min(f, got[i] / need[i]);
    }
    return { f, cost, miss };
  },
  // ---------------------------------------------------------------- 2. oferta e procura
  sat(ci, k, n) { if (ci < 0 || !ITEMS[k]) return; const S = this.st().sat; S[ci] = S[ci] || {}; S[ci][k] = (S[ci][k] || 0) + n; },
  satMul(ci, k) { const v = ((this.st().sat[ci] || {})[k]) || 0; return U.clamp(1 - v / 70, 0.55, 1.4); },
  // riqueza do reino: luxo vale mais nos ricos; comida e ferramentas, um pouco mais nos pobres
  wealthMul(ci, k) {
    const c = G.civs[ci]; if (!c) return 1;
    const rich = U.clamp((c.treasury / Math.max(60, c.pop)) * 0.25 + (c.happy - 50) / 200, -0.2, 0.35), it = ITEMS[k];
    if (LUXURY_CATS.includes(it.cat) || it.price >= 60) return 1 + rich;
    if (['Comida', 'Ferramentas'].includes(it.cat)) return 1 - rich * 0.3;
    return 1;
  },
  // ---------------------------------------------------------------- 3. encomendas
  newContract(from, ci, item, n, days) {
    const S = this.st(), it = ITEMS[item]; if (!it || ci < 0) return;
    const reward = Math.round(it.price * n * U.rnd(1.35, 1.7));
    S.contracts.push({ id: S.cseq++, from, ci, item, n, reward, fame: Math.max(1, Math.round(reward / 150)), due: G.day + (days || 3), taken: false });
  },
  offers(ci) { return this.st().contracts.filter(k => !k.taken && (ci === undefined || k.ci === ci)); },
  mine() { return this.st().contracts.filter(k => k.taken); },
  genContracts() {
    const S = this.st(); S.contracts = S.contracts.filter(k => k.taken || k.due > G.day);
    if (this.offers().length >= 8) return;
    const pick = U.pick, civs = G.civs.filter(c => CIV_DEFS[c.id]);
    for (let t = 0; t < 3; t++) {
      const c = pick(civs), war = Diplo.warsOf(c.id).length > 0, r = Math.random();
      if (war && r < 0.5) this.newContract(`O exército de ${CIV_DEFS[c.id].short}`, c.id, pick(['arrow', 'bolt', 'iron_sword', 'gambeson', 'buckler', 'bread', 'salted_meat', 'iron_arrow']), U.rint(10, 40), 3);
      else if (r < 0.45) this.newContract(`As obras de ${CIV_DEFS[c.id].short}`, c.id, pick(['brick', 'plank', 'stone_block', 'roof_tile', 'beam', 'glass', 'quicklime', 'nails']), U.rint(12, 40), 4);
      else if (r < 0.75) this.newContract(`A taverna de ${pick(World.villages.filter(v => v.civ === c.id).map(v => v.name).concat([CIV_DEFS[c.id].short]))}`, c.id, pick(['beer', 'wine', 'mead', 'cheese', 'bread', 'sausage', 'hop_ale', 'cider']), U.rint(8, 24), 3);
      else this.newContract(`A corte de ${CIV_DEFS[c.id].short}`, c.id, pick(['perfume', 'silk_cloth', 'red_cloth', 'pearl_necklace', 'candle', 'painting', 'wine', 'stained_glass']), U.rint(2, 8), 4);
    }
    const g = this.st().myGuild; if (g && g.members.length >= 3 && Math.random() < 0.6) { const c = pick(civs); this.newContract(`Membros da sua guilda (${g.name})`, c.id, pick(['rope', 'cloth', 'iron_bar', 'leather', 'plank', 'flour']), U.rint(15, 35), 4); }
  },
  take(id) { const k = this.st().contracts.find(x => x.id === id); if (!k || k.taken) return; if (this.mine().length >= 4) { UI.msg('Você já tem 4 encomendas em andamento.', 'bad'); return; } k.taken = true; k.due = Math.max(k.due, G.day + 2); UI.msg(`📜 Encomenda aceita: ${k.n} ${ITEMS[k.item].name} para ${k.from} até ${Calendar.short(k.due)}.`, 'gold'); },
  // entrega: da mochila e, se faltar, do que os seus negócios produziram
  deliver(id) {
    const k = this.st().contracts.find(x => x.id === id && x.taken); if (!k) return;
    let have = Inv.count(k.item) + Object.values(Biz.list()).reduce((a, b) => a + ((b.shelf || {})[k.item] || 0) + ((b.goods || {})[k.item] || 0), 0);
    if (have < k.n) { UI.msg(`Faltam ${k.n - have} ${ITEMS[k.item].name} (mochila + estoque dos seus negócios).`, 'bad'); return; }
    let left = k.n; const fromInv = Math.min(left, Inv.count(k.item)); Inv.add(k.item, -fromInv); left -= fromInv;
    for (const b of Biz.list()) for (const src of [b.shelf, b.goods]) { if (left <= 0 || !src || !src[k.item]) continue; const n = Math.min(left, src[k.item]); src[k.item] -= n; if (src[k.item] <= 0) delete src[k.item]; left -= n; }
    let pay = k.reward; if (this.guildOf('player') && this.st().member) pay = Math.round(pay * 1.1);
    P.gold += pay; Court.addFame(k.fame); Game.addRelation(k.ci, 3);
    this.st().contracts = this.st().contracts.filter(x => x !== k);
    Sound.play('coin'); UI.msg(`📜 Encomenda entregue a ${k.from}: +${pay} 🪙, +${k.fame} de fama e +3 de relação.`, 'gold'); Progress.diary(`📜 Entregou ${k.n} ${ITEMS[k.item].name} para ${k.from}.`);
    this.log(`Encomenda entregue: ${k.n} ${ITEMS[k.item].name} (+${pay} 🪙)`);
  },
  // ---------------------------------------------------------------- 4. manutenção e riscos
  cond(s) { if (s.cond === undefined) s.cond = 100; return s.cond; },
  condMul(s) { const c = this.cond(s); return c >= 60 ? 1 : 0.35 + c / 92; },
  repairCost(s) { return Math.max(10, Math.round(this.value(s) * 0.12 * (100 - this.cond(s)) / 100)); },
  repair(s) { const c = this.repairCost(s); if (this.cond(s) >= 100) return; if (P.gold < c) { UI.msg(`O conserto custa ${c} 🪙.`, 'bad'); return; } P.gold -= c; s.cond = 100; Sound.play('chop'); UI.msg(`🔧 ${BUILDINGS[s.type].name} consertado por ${c} 🪙.`, 'gold'); },
  premium(s) { return Math.max(5, Math.round(this.value(s) * 0.012)); },
  guarded(s) { return World.structs.some(o => o.owner === 'player' && !o.removed && ['watchtower', 'archer_tower', 'ballista', 'pillory', 'barracks'].includes(o.type) && U.dist(o.x, o.y, s.x, s.y) < 16); },
  risks(s) {
    if (s.insured) { const p = this.premium(s); if (P.gold >= p) { P.gold -= p; s.insPaid = (s.insPaid || 0) + p; } else { s.insured = false; UI.msg(`🛡️ O seguro de ${BUILDINGS[s.type].name} venceu: faltou ouro para o prêmio.`, 'bad'); } }
    s.cond = Math.max(0, this.cond(s) - U.rint(2, 4));
    const name = BUILDINGS[s.type].name;
    const fire = Math.random() < (FIRE_PRONE.includes(s.type) ? 0.03 : 0.012);
    if (fire) {
      let loss = Math.round((s.till || 0) * 0.3); s.till = (s.till || 0) - loss;
      for (const k in s.shelf || {}) { const n = Math.ceil(s.shelf[k] / 2); loss += n * ITEMS[k].price; s.shelf[k] -= n; if (s.shelf[k] <= 0) delete s.shelf[k]; }
      s.cond = Math.max(0, s.cond - 45);
      if (s.insured) { const pay = Math.round(loss * 0.9 + this.repairCost(s)); P.gold += pay; UI.msg(`🔥 Incêndio no seu ${name}! O seguro pagou ${pay} 🪙.`, 'bad', true); }
      else UI.msg(`🔥 Incêndio no seu ${name}: perdas de ${loss} 🪙 e o prédio ficou danificado. (Um seguro teria coberto.)`, 'bad', true);
      this.log(`Incêndio: ${name}`);
    }
    if (!this.guarded(s) && Math.random() < 0.025 && (s.till || 0) > 20) {
      const loss = Math.round(s.till * 0.4); s.till -= loss;
      if (s.insured) { P.gold += loss; UI.msg(`🦹 Ladrões levaram ${loss} 🪙 do caixa do ${name}. O seguro devolveu tudo.`, 'bad'); }
      else UI.msg(`🦹 Ladrões levaram ${loss} 🪙 do caixa do ${name}. Uma torre de vigia, um quartel ou um pelourinho por perto afasta os ladrões.`, 'bad', true);
      this.log(`Roubo: ${name} (−${loss} 🪙)`);
    }
  },
  // ---------------------------------------------------------------- 5. funcionários
  lv(p) { const x = p.bizXp || 0; let l = 0; for (let i = 0; i < WORK_XP.length; i++) if (x >= WORK_XP[i]) l = i; return l; },
  staff(s) {
    const ws = Biz.workers(s); if (!ws.length) return;
    for (const p of ws) {
      const before = this.lv(p); p.bizXp = (p.bizXp || 0) + 1; const now = this.lv(p);
      if (now > before) { p.raise = (p.raise || 0) + 1; People.addAff(p, 3); UI.msg(`🎓 ${p.name} virou ${WORK_LV[now]} no seu ${BUILDINGS[s.type].name}: produz mais e o salário subiu 1 🪙.`, 'gold'); }
      // a concorrência tenta levar os bons
      if (now >= 3 && Math.random() < 0.05) {
        if (p.aff < 25) { Biz.fire(p); People.addAff(p, 8); UI.msg(`🏃 ${p.name} (${WORK_LV[now]}) aceitou a proposta de um concorrente e deixou o seu ${BUILDINGS[s.type].name}. Amizade alta segura os bons funcionários.`, 'bad', true); this.log(`${p.name} foi trabalhar para a concorrência`); }
        else UI.msg(`🤝 Um concorrente tentou levar ${p.name}, mas ${p.sex === 'f' ? 'ela' : 'ele'} recusou por lealdade a você.`);
      }
    }
    // greve: gente insatisfeita para tudo por um mês
    const unhappy = Biz.workers(s).filter(p => p.aff < -4);
    if (Biz.workers(s).length >= 2 && unhappy.length >= Math.ceil(Biz.workers(s).length / 2) && Math.random() < 0.5) { s.strike = G.day + 1; UI.msg(`✊ Greve no seu ${BUILDINGS[s.type].name}! Os funcionários cruzaram os braços. Negocie no painel dos negócios.`, 'bad', true); this.log(`Greve: ${BUILDINGS[s.type].name}`); }
  },
  settle(s) { const ws = Biz.workers(s), cost = ws.length * 12; if (P.gold < cost) { UI.msg(`O acordo custa ${cost} 🪙 (12 por funcionário).`, 'bad'); return; } P.gold -= cost; for (const p of ws) People.addAff(p, 15); s.strike = 0; UI.msg(`🤝 Acordo fechado: ${cost} 🪙 de bônus e todos voltaram ao trabalho.`, 'gold'); },
  // ---------------------------------------------------------------- 6. guildas
  GUILDS: {
    smiths: { name: 'Cavaleiros Templários', icon: '✠', trade: 'ferreiros e armeiros', ranks: ['smith', 'armorer'], biz: ['biz_smithy', 'biz_smelter', 'biz_armorer', 'biz_jeweler'] },
    merchants: { name: 'Illuminati', icon: '👁️', trade: 'mercadores e banqueiros', ranks: ['merchant', 'trader'], biz: ['biz_shop', 'biz_bank', 'biz_inn', 'biz_theatre'] },
    crafts: { name: 'Maçonaria', icon: '📐', trade: 'pedreiros, carpinteiros e oleiros', ranks: ['carpenter', 'potter', 'glazier', 'mason', 'sawyer'], biz: ['biz_carpentry', 'biz_pottery', 'biz_glass', 'biz_mason', 'biz_cooper', 'biz_shipyard', 'biz_quarry', 'biz_lumber'] },
    weavers: { name: 'Priorado de Sião', icon: '⚜️', trade: 'tecelões e alfaiates', ranks: ['weaver', 'tailor'], biz: ['biz_weaver', 'biz_tailor', 'biz_dyer', 'biz_ropery'] },
    victuals: { name: 'Cavaleiros Hospitalários', icon: '✚', trade: 'padeiros, cervejeiros e taverneiros', ranks: ['baker', 'miller', 'brewer', 'innkeeper', 'vintner', 'smoker'], biz: ['biz_mill', 'biz_bakery', 'biz_brewery', 'biz_winery', 'biz_dairy', 'biz_press', 'biz_butcher', 'biz_farm', 'biz_ranch', 'biz_fishery', 'biz_saltworks'] },
    hunters: { name: 'Ordem Teutônica', icon: '🦅', trade: 'caçadores, curtidores e arqueiros', ranks: ['hunter'], biz: ['biz_tannery', 'biz_cobbler', 'biz_bowyer', 'biz_stables'] },
    healers: { name: 'Ordem Rosa-Cruz', icon: '🌹', trade: 'curandeiros, alquimistas e magos', ranks: ['healer', 'mage'], biz: ['biz_apothecary', 'biz_magic', 'biz_perfumer', 'biz_barber', 'biz_bathhouse', 'biz_chandler', 'biz_scribe', 'biz_charcoal', 'biz_mine'] },
  },
  // guilda de uma pessoa (ou 'player' = a sua)
  guildOf(p) {
    if (p === 'player') return this.st().member || (this.st().myGuild ? 'player' : null);
    if (p.guild !== undefined) return p.guild;
    const g = Object.keys(this.GUILDS).find(k => this.GUILDS[k].ranks.includes(p.rank) || (p.prof && this.GUILDS[k].ranks.includes(p.prof)));
    p.guild = g || null; return p.guild;
  },
  guildName(g) { return g === 'player' ? (this.st().myGuild ? this.st().myGuild.name : 'Sua guilda') : this.GUILDS[g] ? this.GUILDS[g].name : ''; },
  members(g) { return G.people.filter(p => p.alive && p.age >= 16 && this.guildOf(p) === g); },
  master(g) { return this.members(g).sort((a, b) => (b.bizXp || 0) + b.age / 10 - (a.bizXp || 0) - a.age / 10)[0] || null; },
  guildOfBiz(t) { return Object.keys(this.GUILDS).find(k => this.GUILDS[k].biz.includes(t)) || null; },
  join(g) {
    const S = this.st(); if (S.myGuild) { UI.msg('Você já é mestre da sua própria guilda.', 'bad'); return; }
    if (!Biz.list().some(s => this.guildOfBiz(s.type) === g)) { UI.msg(`A ${this.GUILDS[g].name} só aceita quem tem um negócio do ofício.`, 'bad'); return; }
    if (P.gold < 100) { UI.msg('A entrada custa 100 🪙.', 'bad'); return; }
    P.gold -= 100; S.member = g; UI.msg(`${this.GUILDS[g].icon} Você entrou na ${this.GUILDS[g].name}: preços combinados (+10% nas vendas do ofício), encomendas 10% melhores. Mensalidade: 5 🪙.`, 'gold');
  },
  leave() { const S = this.st(); if (!S.member) return; UI.msg(`Você saiu da ${this.GUILDS[S.member].name}.`); S.member = null; },
  nameCheck(t) { if (t.length < 3) return 'O nome precisa de pelo menos 3 letras.'; if (Object.values(this.GUILDS).some(g => g.name.toLowerCase() === t.toLowerCase())) return 'Já existe uma ordem com esse nome.'; return null; },
  found() {
    const S = this.st();
    if (S.myGuild) return; if (Biz.list().length < 2) { UI.msg('Para fundar uma guilda você precisa ter pelo menos 2 empreendimentos.', 'bad'); return; }
    if (P.gold < 500) { UI.msg('Fundar a guilda custa 500 🪙 (alvará e salão).', 'bad'); return; }
    Dialog.prompt({ icon: '🏛️', title: 'Nome da sua guilda', text: 'Como a sua guilda vai se chamar?', value: `Irmandade ${G.surname}`, max: 40, ok: 'Fundar (500 🪙)',
      suggestions: [`Irmandade ${G.surname}`, 'Ordem do Leão Dourado', 'Liga dos Mercadores Livres', 'Companhia da Rosa Negra'], check: t => this.nameCheck(t) },
      name => { if (S.myGuild || P.gold < 500) return; this.doFound(name); if (UI.cur && UI.cur.fn === 'showBizBoard') UI.showBizBoard('guilds'); });
  },
  rename() {
    const g = this.st().myGuild; if (!g) return;
    Dialog.prompt({ icon: '✏️', title: 'Renomear a guilda', text: 'Novo nome da sua guilda:', value: g.name, max: 40, check: t => this.nameCheck(t) },
      name => { g.name = name; UI.msg(`🏛️ A sua guilda agora se chama ${name}.`, 'gold'); if (UI.cur && UI.cur.fn === 'showBizBoard') UI.showBizBoard('guilds'); });
  },
  doFound(name) {
    const S = this.st();
    P.gold -= 500; S.member = null; S.myGuild = { name, founded: G.day, members: [], rep: 10 };
    UI.banner('🏛️ Guilda fundada!'); UI.msg(`🏛️ Você fundou a ${S.myGuild.name}. Recrute gente das outras guildas conversando com elas: quanto mais importante a pessoa na guilda dela, mais intimidade (amizade) é preciso.`, 'gold', true);
    Diplo.chronicle(`🏛️ ${G.name} fundou a ${S.myGuild.name}.`, true);
  },
  // intimidade necessária para trazer alguém para a sua guilda
  recruitNeed(p) { const g = this.guildOf(p); if (!g) return 20; const m = this.master(g); return m === p ? 70 : (p.bizXp || 0) >= 15 ? 50 : 35; },
  recruit(p) {
    const S = this.st(); if (!S.myGuild) return { text: 'Que guilda?', note: 'Funde a sua guilda no painel dos negócios.' };
    if (this.guildOf(p) === 'player') return { text: 'Já sou da sua guilda!', note: '' };
    const need = this.recruitNeed(p), old = this.guildOf(p);
    if (p.aff < need) { People.addAff(p, -2); return { text: old ? `Deixar a ${this.GUILDS[old].name}? Mal te conheço...` : 'Ainda não confio tanto em você.', note: `Precisa de amizade ${need} (agora ${Math.round(p.aff)}). ${old && this.master(old) === p ? 'É a mestra/o mestre da guilda dela: pede muito mais.' : ''}` }; }
    p.guild = 'player'; S.myGuild.members.push(p.id); S.myGuild.rep += old && this.master(old) === p ? 10 : 2; People.addAff(p, 5);
    if (old) this.log(`${p.name} deixou a ${this.GUILDS[old].name} pela sua guilda`);
    return { text: old ? `Está decidido: deixo a ${this.GUILDS[old].name} e entro na ${S.myGuild.name}!` : `Conte comigo na ${S.myGuild.name}!`, note: `🏛️ ${p.name} entrou na sua guilda (${S.myGuild.members.length + 0} membros). Mensalidade: +3 🪙 por mês.` };
  },
  myMembers() { const G0 = this.st().myGuild; if (!G0) return []; G0.members = G0.members.filter(id => G.people[id] && G.people[id].alive && G.people[id].guild === 'player'); return G0.members.map(id => G.people[id]); },
  // bônus de produção: guilda própria (+1% por membro, até 25%) ou a do ofício (+5%); fora da guilda do ofício: −5%
  guildMul(s) {
    const S = this.st(), g = this.guildOfBiz(s.type);
    if (S.myGuild) return 1 + Math.min(0.25, this.myMembers().length * 0.01);
    if (S.member && S.member === g) return 1.05;
    return g && this.members(g).length >= 4 ? 0.95 : 1;
  },
  // ---------------------------------------------------------------- 7. feiras e leilões
  FAIRS: ['Feira da Primavera', 'Feira de São João', 'Feira da Colheita', 'Mercado de Inverno'],
  fair(ci) { const f = this.st().fair; return f && f.until >= G.day && (ci === undefined || f.ci === ci) ? f : null; },
  AUCTION_POOL: ['mithril_sword', 'dragon_shield', 'elven_bow', 'storm_staff', 'mithril_mail', 'crystal_crown', 'royal_sword', 'pearl_necklace', 'painting', 'relic', 'orb', 'dragon_helm', 'tome', 'spyglass'],
  auction(ci) { const a = this.st().auction; return a && a.until >= G.day && (ci === undefined || a.ci === ci) ? a : null; },
  bid(ci) {
    const a = this.auction(ci); if (!a) return;
    const next = Math.round(Math.max(a.price, a.top || 0) * 1.1);
    if (P.gold < next - (a.mine || 0)) { UI.msg(`O lance mínimo é ${next} 🪙.`, 'bad'); return; }
    P.gold -= next - (a.mine || 0); a.mine = next; a.top = next;
    UI.msg(`🔨 Seu lance: ${next} 🪙 por ${ITEMS[a.item].name}. O leilão fecha na virada do mês.`, 'gold');
  },
  // ---------------------------------------------------------------- 8. sócios
  partnerCands(s) {
    const v = this.value(s);
    return G.people.filter(p => p.alive && p.age >= 25 && !p.capanga && !p.kin && (['merchant', 'trader', 'knight', 'innkeeper'].includes(p.rank) || NOBLE_RANKS.includes(p.rank)) && People.purse(p) >= v * 0.4 && p.aff >= 10).slice(0, 4);
  },
  takePartner(s, pid) {
    const p = G.people[pid]; if (!p || s.partner) return;
    const pay = Math.round(this.value(s) * 0.4); if (People.purse(p) < pay) { UI.msg(`${p.name} não tem ${pay} 🪙.`, 'bad'); return; }
    p.purse = People.purse(p) - pay; P.gold += pay; s.partner = { pid, share: 0.3, since: G.day, got: 0 }; People.addAff(p, 10);
    UI.msg(`🤝 ${People.full(p)} virou sócio do seu ${BUILDINGS[s.type].name}: entrou com ${pay} 🪙 e leva 30% do lucro.`, 'gold');
  },
  buyOut(s) {
    if (!s.partner) return; const cost = Math.round(this.value(s) * 0.5); if (P.gold < cost) { UI.msg(`Comprar a parte do sócio custa ${cost} 🪙.`, 'bad'); return; }
    const p = G.people[s.partner.pid]; P.gold -= cost; if (p) p.purse = People.purse(p) + cost; s.partner = null; UI.msg(`O negócio voltou a ser só seu (${cost} 🪙 ao antigo sócio).`, 'gold');
  },
  // ---------------------------------------------------------------- o mês dos negócios
  before() {
    for (const s of Biz.list()) {
      s.inF = 1; s.inMiss = [];
      if (s.strike > G.day) continue;
      const ws = Biz.workers(s); if (!ws.length) continue;
      s.noIn = true; const fc = Biz.forecast(s); s.noIn = false;
      const r = this.acquire(s, fc.k || 0); s.inF = r.f; s.inMiss = r.miss; s.inCost = r.cost;
      if (r.cost) Biz.addRev(s, -r.cost);
    }
  },
  after() {
    const S = this.st();
    for (const s of Biz.list()) {
      this.risks(s); this.staff(s);
      if (s.partner) { const p = G.people[s.partner.pid], e = Biz.earn(s), cut = Math.round((e.lastPaid || 0) * s.partner.share); if (!p || !p.alive) s.partner = null; else if (cut > 0 && P.gold >= cut) { P.gold -= cut; p.purse = People.purse(p) + cut; s.partner.got += cut; } }
      if (s.inF < 0.99 && s.inMiss && s.inMiss.length && Biz.workers(s).length) this.log(`${BUILDINGS[s.type].name}: faltou ${s.inMiss.join(', ')}`);
    }
    // guilda: mensalidade de quem é membro; a sua guilda recebe dos membros
    if (S.member) { if (P.gold >= 5) P.gold -= 5; else { UI.msg(`Você foi expulso da ${this.GUILDS[S.member].name} por não pagar a mensalidade.`, 'bad'); S.member = null; } }
    if (S.myGuild) { const n = this.myMembers().length; if (n) { P.gold += n * 3; S.myGuild.rep += Math.ceil(n / 5); } }
    // oferta e procura voltam ao normal aos poucos
    for (const ci in S.sat) for (const k in S.sat[ci]) { S.sat[ci][k] *= 0.6; if (Math.abs(S.sat[ci][k]) < 1) delete S.sat[ci][k]; }
    // encomendas vencidas
    for (const k of S.contracts.filter(x => x.taken && x.due < G.day)) { Game.addRelation(k.ci, -5); Court.addFame(-1); UI.msg(`📜 Você não entregou a encomenda de ${k.n} ${ITEMS[k.item].name} para ${k.from}: −5 de relação e −1 de fama.`, 'bad', true); this.log(`Encomenda perdida: ${k.from}`); }
    S.contracts = S.contracts.filter(x => !(x.taken && x.due < G.day));
    this.genContracts();
    // feira de estação
    if (!this.fair() && Math.random() < 0.35) { const c = U.pick(G.civs.filter(x => CIV_DEFS[x.id])); S.fair = { ci: c.id, until: G.day + 1, name: this.FAIRS[World.season] || this.FAIRS[0] }; UI.msg(`🎪 ${S.fair.name} em ${CIV_DEFS[c.id].name}: este mês você vende 20% mais caro e compra 10% mais barato lá, e os negócios do reino vendem mais.`, 'gold', true); Diplo.chronicle(`🎪 ${S.fair.name} em ${CIV_DEFS[c.id].short}: mercadores de todos os reinos.`); }
    // leilão
    const a = S.auction;
    if (a && a.until < G.day) {
      const rival = Math.round(a.price * U.rnd(1.05, 1.7));
      if (a.mine && a.mine >= rival) { Inv.add(a.item, 1); UI.msg(`🔨 Você arrematou ${ITEMS[a.item].name} por ${a.mine} 🪙 no leilão de ${CIV_DEFS[a.ci].short}!`, 'gold', true); Progress.diary(`🔨 Arrematou ${ITEMS[a.item].name} em leilão.`); }
      else if (a.mine) { P.gold += a.mine; UI.msg(`🔨 Um nobre pagou ${rival} 🪙 por ${ITEMS[a.item].name}: o seu lance de ${a.mine} 🪙 foi devolvido.`); }
      S.auction = null;
    }
    if (!S.auction && Math.random() < 0.5) { const item = U.pick(this.AUCTION_POOL.filter(k => ITEMS[k])), c = U.pick(G.civs.filter(x => CIV_DEFS[x.id])); S.auction = { ci: c.id, item, price: Math.round(ITEMS[item].price * 0.7), until: G.day + 1, mine: 0, top: 0 }; }
  },
};

// ------------------------------------------------------------------ ganchos
{
  // produção: insumos, estado do prédio, greve, nível dos funcionários e guilda
  const fc0 = Biz.forecast.bind(Biz);
  Biz.forecast = function (s) {
    const r = fc0(s);
    const ws = Biz.workers(s), lvMul = ws.length ? 1 + ws.reduce((a, p) => a + Commerce.lv(p), 0) / ws.length * 0.07 : 1;
    let m = lvMul * Commerce.condMul(s) * Commerce.guildMul(s);
    if (s.strike > G.day) m = 0;
    if (!s.noIn && s.inF !== undefined) m *= s.inF;
    if (s.noIn) m = lvMul * Commerce.condMul(s);
    for (const k in r.out) r.out[k] = Math.round(r.out[k] * m);
    if (r.gold) r.gold = Math.round(r.gold * m * (Commerce.fair(Biz.civOf(s)) ? 1.15 : 1));
    return r;
  };
  const w0 = Biz.wage.bind(Biz);
  Biz.wage = function (p, s) { return w0(p, s) + (p.raise || 0); };
  const dt0 = Biz.dayTick.bind(Biz);
  Biz.dayTick = function (...a) { Commerce.before(); const r = dt0(...a); Commerce.after(); for (const s of this.list()) delete s.inF; return r; };
  // os fregueses do mês contam como oferta naquele reino; a feira vende mais
  if (Biz.sellMonth) {
    const sm0 = Biz.sellMonth.bind(Biz);
    Biz.sellMonth = function (s) {
      const before = Object.assign({}, s.shelf || {}); let rev = sm0(s);
      const ci = Biz.civOf(s); for (const k in before) { const n = before[k] - ((s.shelf || {})[k] || 0); if (n > 0) Commerce.sat(ci, k, n * 0.5); }
      const g = Commerce.guildOfBiz(s.type), S = Commerce.st();
      if (S.member && S.member === g) rev = Math.round(rev * 1.1);
      if (Commerce.fair(ci)) rev = Math.round(rev * 1.15);
      return rev;
    };
  }
  // preços: oferta e procura, riqueza do reino e feira
  const pr0 = Game.price.bind(Game);
  Game.price = function (ci, k) {
    const r = pr0(ci, k), it = ITEMS[k]; if (!it) return r;
    const m = (MARKET_GOODS.includes(k) ? 1 : Commerce.satMul(ci, k)) * Commerce.wealthMul(ci, k) * (typeof Religion !== 'undefined' ? Religion.taste(ci, k) : 1);
    return { buy: Math.max(1, Math.round(r.buy * m)), sell: Math.max(1, Math.round(r.sell * m)) };
  };
  const pf0 = Game.priceFor.bind(Game);
  Game.priceFor = function (ci, k, owner) {
    const r = pf0(ci, k, owner); const f = Commerce.fair(ci < 0 ? 0 : ci);
    return f ? { buy: Math.max(1, Math.round(r.buy * 0.9)), sell: Math.max(1, Math.round(r.sell * 1.2)) } : r;
  };
  const tr0 = Game.trade.bind(Game);
  Game.trade = function (ci, k, n, mode, owner) {
    const before = Inv.count(k); tr0(ci, k, n, mode, owner); const moved = Math.abs(Inv.count(k) - before);
    if (moved && !MARKET_GOODS.includes(k)) Commerce.sat(ci < 0 ? 0 : ci, k, mode === 'sell' ? moved : -moved);
  };
  // conversa: recrutar para a sua guilda
  const ac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    ac0(p, acts);
    if (Commerce.st().myGuild && p.age >= 16 && Commerce.guildOf(p) !== 'player' && !p.capanga && !p.kin) acts.push(['grecruit', `🏛️ Convidar para a ${Commerce.st().myGuild.name} (amizade ${Commerce.recruitNeed(p)})`]);
  };
  const ta0 = Lifesim.talkAct.bind(Lifesim);
  Lifesim.talkAct = function (p, op) { return op === 'grecruit' ? Commerce.recruit(p) : ta0(p, op); };
  const ch0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) {
    const out = ch0(p), g = Commerce.guildOf(p);
    if (g) out.push(`<span>🏛️ ${UI.esc(Commerce.guildName(g))}${g !== 'player' && Commerce.master(g) === p ? ' · mestre' : ''}</span>`);
    if (p.job !== undefined && p.job !== null && World.structs[p.job]) out.push(`<span>🎓 ${WORK_LV[Commerce.lv(p)]}</span>`);
    return out;
  };
}

// ------------------------------------------------------------------ 9. painel dos negócios
{
  UI.showBizBoard = function (tab) {
    const S = Commerce.st(), L = Biz.list(); tab = tab || this.sel.bbTab || 'biz'; this.sel.bbTab = tab;
    const tabs = [['biz', '🏭 Negócios'], ['contracts', '📜 Encomendas'], ['guilds', '🏛️ Guildas'], ['market', '🎪 Feiras e leilões'], ['log', '📒 Ocorrências']];
    let h = `<div class="tabs">${tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="bboard" data-t="${k}">${n}</button>`).join('')}</div>`;
    if (tab === 'biz') {
      const t = Biz.totals();
      h += `<p>Lucro do último mês: <b class="${t.lastProfit >= 0 ? 'ok' : 'bad'}">${t.lastProfit} 🪙</b> · desde o início: <b>${t.profit} 🪙</b> · ${L.length} negócios.</p>`;
      h += L.length ? L.map(s => {
        const e = Biz.earn(s), val = Commerce.value(s), roi = val ? Math.round((e.paid || 0) / val * 100) : 0, ws = Biz.workers(s), cond = Commerce.cond(s);
        const sup = Commerce.supply(s, Math.max(1, ws.length)), lack = sup ? Object.entries(sup).filter(([, x]) => x.have < x.need).map(([k, x]) => `${ITEMS[k].name} (${x.price} 🪙/un.)`) : [];
        const last = e.last ? e.last.rev - e.last.wages : 0, p = s.partner && G.people[s.partner.pid];
        return `<div class="card bb-card"><div class="sec">${UI.esc(BUILDINGS[s.type].name)} <span class="${last >= 0 ? 'ok' : 'bad'}">${last >= 0 ? '+' : ''}${last} 🪙 no mês${last < 0 ? ' · ⚠️ prejuízo' : ''}</span></div>
          <div class="bb-row"><span>💰 Devolveu ${roi}% do que custou</span><span>🏚️ Estado ${cond}%${cond < 60 ? ' <b class="bad">produz menos</b>' : ''}</span><span>👷 ${ws.length ? ws.map(w => `${UI.esc(w.name)} (${WORK_LV[Commerce.lv(w)]})`).join(', ') : 'sem funcionários'}</span></div>
          <div class="bb-row"><span>${BIZ_INPUTS[s.type] ? `📦 Insumos: ${Object.entries(BIZ_INPUTS[s.type]).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ')} por mês${lack.length ? ` · <b class="bad">vai comprar no mercado: ${lack.join(', ')}</b>` : ' · <b class="ok">abastecido</b>'}` : '📦 Não usa insumos'}</span></div>
          <div class="bb-row"><span>🛡️ ${s.insured ? `Segurado (${Commerce.premium(s)} 🪙/mês)` : 'Sem seguro'}</span><span>🤝 ${p ? `Sócio: ${UI.esc(People.full(p))} (30%, já levou ${s.partner.got} 🪙)` : 'Sem sócio'}</span>${s.strike > G.day ? '<span class="bad">✊ EM GREVE</span>' : ''}</div>
          <div class="act-row">${cond < 100 ? `<button data-act="bbrepair" data-s="${s.id}">🔧 Consertar (${Commerce.repairCost(s)} 🪙)</button>` : ''}<button data-act="bbins" data-s="${s.id}">${s.insured ? 'Cancelar seguro' : `🛡️ Segurar (${Commerce.premium(s)} 🪙/mês)`}</button>
            ${BIZ_INPUTS[s.type] ? `<button data-act="bbfeed" data-s="${s.id}">📦 Entregar insumos da mochila</button>` : ''}${s.strike > G.day ? `<button class="primary" data-act="bbsettle" data-s="${s.id}">🤝 Negociar com os grevistas</button>` : ''}
            ${p ? `<button data-act="bbbuyout" data-s="${s.id}">Comprar a parte do sócio (${Math.round(val * 0.5)} 🪙)</button>` : Commerce.partnerCands(s).map(c => `<button data-act="bbpartner" data-s="${s.id}" data-p="${c.id}">🤝 Sócio: ${UI.esc(c.name)} (+${Math.round(val * 0.4)} 🪙)</button>`).slice(0, 2).join('')}</div></div>`;
      }).join('') : '<p class="muted">Você ainda não tem empreendimentos. Construa um em Construção → Empreendimentos.</p>';
    } else if (tab === 'contracts') {
      const mine = Commerce.mine(), offers = Commerce.offers();
      const row = (k, btn) => `<div class="item"><span class="ic">${UI.ii(k.item)}</span><div class="info"><b>${k.n} × ${UI.esc(ITEMS[k.item].name)}</b><small>${UI.esc(k.from)} · prazo ${Calendar.short(k.due)} · você tem ${Inv.count(k.item)}</small></div><b class="ok">${k.reward} 🪙</b>${btn}</div>`;
      h += `<h3>Em andamento (${mine.length}/4)</h3><div class="list">${mine.map(k => row(k, `<button class="primary" data-act="bbdeliver" data-k="${k.id}">Entregar</button>`)).join('') || '<p class="muted">Nenhuma.</p>'}</div>
        <h3>Pedidos abertos</h3><div class="list">${offers.map(k => row(k, `<button data-act="bbtake" data-k="${k.id}">Aceitar</button>`)).join('') || '<p class="muted">Nenhum pedido agora: volte no mês que vem.</p>'}</div>
        <p class="muted">A entrega sai da mochila e, se faltar, do estoque dos seus negócios. Atrasar custa relação e fama.</p>`;
    } else if (tab === 'guilds') {
      const my = S.myGuild;
      h += my ? `<div class="card"><div class="sec">🏛️ ${UI.esc(my.name)} <span>prestígio ${my.rep} · <button data-act="bbrename">✏️ Renomear</button></span></div><p>Você é o mestre. ${Commerce.myMembers().length} membros pagam 3 🪙 por mês cada, e os seus negócios produzem +${Math.min(25, Commerce.myMembers().length)}%. Recrute conversando com as pessoas (as que já são de outra guilda pedem mais amizade; mestres de guilda, muito mais).</p>
          <div class="list">${Commerce.myMembers().map(p => `<div class="item"><span class="ic">👤</span><div class="info"><b>${UI.esc(People.full(p))}</b><small>${UI.esc(People.title(p))}</small></div><button data-act="tk" data-op="open" data-id="${p.id}">💬</button></div>`).join('') || '<p class="muted">Nenhum membro ainda.</p>'}</div></div>`
        : `<div class="card"><div class="sec">🏛️ Fundar a sua guilda</div><p>Com 2 empreendimentos e 500 🪙 você funda a sua guilda (você escolhe o nome) e passa a recrutar gente das outras ordens pela amizade.</p><div class="act-row"><button class="primary" data-act="bbfound" ${Biz.list().length >= 2 && P.gold >= 500 ? '' : 'disabled'}>Fundar (500 🪙)</button></div></div>`;
      h += Object.entries(Commerce.GUILDS).map(([g, d]) => { const m = Commerce.master(g), n = Commerce.members(g).length, me = S.member === g;
        return `<div class="card"><div class="sec">${d.icon} ${d.name} <span>${n} membros${me ? ' · <b class="ok">você é membro</b>' : ''}</span></div><p class="dt-desc">Ordem dos ${d.trade}. Mestre: ${m ? UI.esc(People.full(m)) : '—'}. Negócios do ofício: ${d.biz.filter(b => BUILDINGS[b]).map(b => BUILDINGS[b].name).slice(0, 5).join(', ')}…</p>
          <div class="act-row">${me ? '<button data-act="bbleave">Sair</button>' : my ? '' : `<button data-act="bbjoin" data-g="${g}">Entrar (100 🪙 + 5/mês)</button>`}${m ? `<button data-act="tk" data-op="open" data-id="${m.id}">💬 Falar com o mestre</button>` : ''}</div></div>`; }).join('');
    } else if (tab === 'market') {
      const f = Commerce.fair(), a = Commerce.auction();
      h += `<div class="card"><div class="sec">🎪 Feira</div><p>${f ? `<b>${f.name}</b> em ${CIV_DEFS[f.ci].name} até ${Calendar.short(f.until)}: lá você vende 20% mais caro, compra 10% mais barato, e os negócios do reino vendem 15% mais.` : 'Nenhuma feira agora. Elas acontecem nas viradas de estação, cada vez num reino.'}</p></div>
        <div class="card"><div class="sec">🔨 Leilão</div>${a ? `<p><b>${UI.esc(ITEMS[a.item].name)}</b> no castelo de ${CIV_DEFS[a.ci].short} · lance atual: ${Math.max(a.price, a.top || 0)} 🪙${a.mine ? ` (seu: ${a.mine} 🪙)` : ''} · fecha em ${Calendar.short(a.until)}.</p><div class="act-row"><button class="primary" data-act="bbbid" data-c="${a.ci}">Dar lance (${Math.round(Math.max(a.price, a.top || 0) * 1.1)} 🪙)</button></div>` : '<p>Nenhum leilão agora.</p>'}</div>
        <div class="card"><div class="sec">📈 Oferta e procura</div><p class="dt-desc">Vender muito do mesmo item num reino derruba o preço lá por alguns meses; comprar muito, sobe. Reinos ricos pagam mais por luxo, e cada cultura tem os seus gostos (veja o castelo de cada reino).</p></div>`;
    } else {
      h += `<div class="list">${S.log.map(x => `<div class="item"><span class="ic">📒</span><div class="info"><b>${UI.esc(x.t)}</b><small>${Calendar.short(x.d)}</small></div></div>`).join('') || '<p class="muted">Nada ainda.</p>'}</div>`;
    }
    this.open('📊 Painel dos negócios', `<div class="bboard">${h}</div>`, 'showBizBoard', [tab], 'Seus negócios, encomendas, guildas e mercados');
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    const s = d && d.s !== undefined ? World.structs[+d.s] : null;
    switch (a) {
      case 'bboard': this.showBizBoard(d.t); return;
      case 'bbrepair': Commerce.repair(s); break;
      case 'bbins': s.insured = !s.insured; UI.msg(s.insured ? `🛡️ ${BUILDINGS[s.type].name} segurado contra incêndio e roubo.` : 'Seguro cancelado.'); break;
      case 'bbfeed': { const box = Commerce.inbox(s); let n = 0; for (const k in BIZ_INPUTS[s.type]) { const c = Inv.count(k); if (c > 0) { Inv.add(k, -c); box[k] = (box[k] || 0) + c; n += c; } } UI.msg(n ? `📦 ${n} insumos entregues ao depósito do negócio.` : 'Você não tem os insumos deste negócio na mochila.'); break; }
      case 'bbsettle': Commerce.settle(s); break;
      case 'bbpartner': Commerce.takePartner(s, +d.p); break;
      case 'bbbuyout': Commerce.buyOut(s); break;
      case 'bbtake': Commerce.take(+d.k); break;
      case 'bbdeliver': Commerce.deliver(+d.k); break;
      case 'bbfound': Commerce.found(); return;
      case 'bbrename': Commerce.rename(); return;
      case 'bbjoin': Commerce.join(d.g); break;
      case 'bbleave': Commerce.leave(); break;
      case 'bbbid': Commerce.bid(+d.c); break;
      default: return a0(a, d);
    }
    this.showBizBoard();
  };
  // o painel abre pelas janelas dos negócios, pelo Portfólio e pelos castelos (encomendas e leilão de lá)
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showBiz' || fn === 'showBizShop') body = `<div class="act-row"><button data-act="bboard" data-t="biz">📊 Painel dos negócios</button><button data-act="bboard" data-t="contracts">📜 Encomendas</button></div>` + body;
    if (fn === 'showCastle' && args && args[0] !== undefined) {
      const ci = args[0], offs = Commerce.offers(ci), auc = Commerce.auction(ci);
      if (offs.length || auc) body += `<div class="card"><div class="sec">📜 Negócios com ${CIV_DEFS[ci].short}</div><p class="dt-desc">${offs.length ? `${offs.length} encomenda(s) aberta(s) daqui.` : ''} ${auc ? `Leilão de <b>${UI.esc(ITEMS[auc.item].name)}</b> neste castelo.` : ''}</p><div class="act-row"><button data-act="bboard" data-t="contracts">📜 Ver encomendas</button>${auc ? '<button data-act="bboard" data-t="market">🔨 Leilão</button>' : ''}</div></div>`;
    }
    return op0(title, body, fn, args, sub);
  };
}

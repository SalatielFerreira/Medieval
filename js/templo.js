'use strict';
// Sociedade secreta, segunda parte: o Templo da sociedade e o poder das irmandades.
//  • Grau conquistado não se perde: perder o prazo de uma missão tira pontos, mas o grau fica (o mais alto que você
//    alcançou).
//  • Missões mais variadas: caçar lobos, limpar as criptas, erguer obras, fazer networking no templo, recrutar gente
//    importante, encher o cofre da loja, conversar com os irmãos, presentear nobres, obras de caridade...
//  • 🏛️ Templo da sociedade (Construir → Baús e estábulo, para quem é da sociedade): a loja onde os irmãos se encontram. Lá
//    você cuida do cofre da loja (dinheiro dos irmãos, investimentos da sociedade), nomeia os cargos (Tesoureiro,
//    Orador, Guarda do Templo, Secretário), faz networking e recruta pessoas importantes.
//  • ⚔️ Poder: cada sociedade tem um poder sobre o mundo (riqueza das famílias dos irmãos + influência: reis, nobres e
//    cavaleiros que são irmãos). Com o poder, um Mestre derruba governadores e um poder grande derruba reis (põe um
//    irmão no trono). O poder serve ao bem (caridade) ou ao mal (intimidação), e a fama da sua irmandade corre.
//  • 😨 As famílias temem você: quem sabe que você é de uma sociedade forte não declara guerra à sua família — só as
//    casas muito poderosas têm coragem.
const SOC2_POSTS = {
  tesoureiro: { icon: '💰', name: 'Tesoureiro', desc: 'Cuida das contas: os investimentos da loja rendem +0,5% ao mês.' },
  orador:     { icon: '🗣️', name: 'Orador',     desc: 'Fala pela loja nas cortes: +3 de influência por mês.' },
  guarda:     { icon: '🛡️', name: 'Guarda do Templo', desc: 'Protege os irmãos: menos assassinos chegam até você.' },
  secretario: { icon: '📜', name: 'Secretário', desc: 'Guarda os segredos: mais cartas lacradas com segredos.' },
};
const SOC2_FUNDS = {
  comercio: { icon: '⚖️', name: 'Rotas de comércio', lo: -0.005, hi: 0.03, desc: 'rende 0% a 3% ao mês' },
  terras:   { icon: '🌾', name: 'Terras e fazendas', lo: 0.004, hi: 0.012, desc: 'rende 0,4% a 1,2%, quase sem risco' },
  minas:    { icon: '⛏️', name: 'Minas e pedreiras', lo: -0.03, hi: 0.06, desc: 'de −3% a +6%: arriscado' },
};
const SOC2_TITLES = ['Aprendiz', 'Companheiro', 'Mestre da Loja', 'Grão-Mestre'];
Object.assign(KO_MISSIONS, {
  wolves:      { icon: '🐺', text: 'Cace 5 lobos que ameaçam os irmãos.', how: 'Os lobos andam pelas florestas, longe das vilas (mais à noite e no inverno).', stat: 'kill_wolf', need: 5 },
  crypt:       { icon: '💀', text: 'Derrote 6 esqueletos nas criptas das cavernas.', how: 'Entre numa caverna: os esqueletos ficam nas partes mais fundas.', stat: 'kill_skeleton', need: 6 },
  camps2:      { icon: '🔥', text: 'Destrua 2 acampamentos de bandidos.', how: 'No mapa, os acampamentos aparecem com um X vermelho: derrote os bandidos de cada um.', stat: 'camps', need: 2 },
  build:       { icon: '🏗️', text: 'Construa 2 coisas pelo menu Construir.', how: 'Vale qualquer construção feita depois que a missão chegou: um baú, uma fogueira, uma cerca, uma casa... Cada uma conta 1.', go: 'showBuild', goTxt: '🏗️ Abrir o Construir', stat: 'built', need: 2 },
  soc_net:     { icon: '🤝', text: 'Faça networking no templo 2 vezes.', stat: 'soc_net', need: 2 },
  soc_recruit: { icon: '🎖️', text: 'Recrute uma pessoa importante para a sociedade.', stat: 'soc_recruit', need: 1 },
  soc_vault:   { icon: '💰', text: 'Ponha 500 🪙 no cofre da loja.', stat: 'soc_vault', need: 500 },
  soc_talk:    { icon: '🕯️', text: 'Converse com 3 irmãos da sociedade.', stat: 'soc_talk', need: 3 },
  soc_gift:    { icon: '🎁', text: 'Presenteie 2 nobres ou cavaleiros.', stat: 'soc_gift', need: 2 },
  soc_charity: { icon: '🍞', text: 'Faça uma obra de caridade em nome da sociedade.', stat: 'soc_charity', need: 1 },
});
{
  const add = { smiths: ['crypt', 'camps2', 'soc_charity'], merchants: ['soc_vault', 'soc_recruit', 'soc_net'], crafts: ['build', 'soc_net', 'soc_vault'], weavers: ['soc_gift', 'soc_recruit', 'soc_talk'],
    victuals: ['soc_charity', 'soc_talk', 'wolves'], hunters: ['wolves', 'crypt', 'camps2'], healers: ['soc_charity', 'soc_gift', 'soc_talk'] };
  for (const k in add) if (KORDERS[k]) KORDERS[k].likes = [...new Set([...(KORDERS[k].likes || []), ...add[k]])];
}
// o templo: obra de quem é da sociedade
if (typeof BUILD_ICONS !== 'undefined') BUILD_ICONS.soc_temple = () => `<path d="M3 11 L16 3 L29 11 Z" fill="#5a4a8a" stroke="#2a2040" stroke-width="1.2"/><rect x="4" y="11" width="24" height="3" fill="#d8d2c4" stroke="#6e675a" stroke-width=".8"/>${[6, 11, 16, 21, 26].map(x => `<rect x="${x - 1.6}" y="14" width="3.2" height="11" fill="#efeae0" stroke="#8e877a" stroke-width=".6"/>`).join('')}<rect x="2" y="25" width="28" height="4" fill="#a8a194" stroke="#6e675a" stroke-width=".8"/><circle cx="16" cy="8.2" r="1.8" fill="#e8c06a"/>`;
BUILDINGS.soc_temple = { name: 'Templo da Sociedade', w: 3, h: 3, blocks: true, cost: { stone: 60, wood: 30, gold_bar: 2 }, desc: 'A loja da sua sociedade secreta: o cofre dos irmãos, os investimentos, os cargos, o networking e os recrutamentos. Só para quem é de uma sociedade.' };

const Soc2 = {
  S() { const u = G.urban || (G.urban = {}); const s = u.soc2 || (u.soc2 = {}); s.best = s.best || {}; s.inv = s.inv || {}; s.posts = s.posts || {}; s.log = s.log || []; s.vault = s.vault || 0; s.infl = s.infl || 0; s.karma = s.karma || 0; s.cand = s.cand || {}; return s; },
  key() { return KOrders.S().key; },
  def() { return KOrders.def(); },
  rank() { return Secret.member() ? KOrders.rank() : -1; },
  title() { const r = this.rank(); return r < 0 ? '' : SOC2_TITLES[r]; },
  admin() { return this.rank() >= 2; },
  temple() { return World.structs.find(s => s && !s.removed && s.type === 'soc_temple' && s.owner === 'player') || null; },
  log(t) { const S = this.S(); S.log.unshift({ day: G.day, t }); if (S.log.length > 14) S.log.length = 14; },
  // ---------------------------------------------------------------- poder das sociedades
  power(k) {
    const own = k === 'own' || k === this.key(), B = k === 'own' ? [] : Secret.brothers(k), fams = new Set();
    let kings = 0, nobles = 0, knights = 0, crafts = 0, wealth = 0;
    for (const p of B) {
      if (G.civs.some(c => !c.dead && c.rulerId === p.id && c.ruler !== 'player')) kings++; else if (['consort', 'heir'].includes(p.rank)) nobles++; else if (p.rank === 'knight') knights++; else crafts++;
      const f = Families.of(p); if (f && !f.player && !fams.has(f.id)) { fams.add(f.id); wealth += f.wealth || 0; }
    }
    const S = this.S();
    if (own) wealth += S.vault + Object.values(S.inv).reduce((a, n) => a + n, 0) + P.gold * 0.2;
    const infl = kings * 40 + nobles * 12 + knights * 5 + crafts + (own ? S.infl + (G.civs.filter(c => c.ruler === 'player').length * 40) + Math.max(0, this.rank()) * 10 : 0);
    return { kings, nobles, knights, crafts, brothers: B.length, wealth: Math.round(wealth), infl: Math.round(infl), power: Math.round(wealth / 60 + infl) };
  },
  ranking() { const keys = Object.keys(SECRET_SOC); if (this.key() === 'own') keys.push('own'); return keys.map(k => ({ k, d: k === 'own' ? KOrders.S().own : SECRET_SOC[k], ...this.power(k) })).sort((a, b) => b.power - a.power); },
  // quem tem coragem de declarar guerra à sua família
  fearBar() { if (!Secret.member()) return 0; const r = Math.max(0, this.rank()), S = this.S(); return Math.round(this.power(this.key()).power * (0.35 + 0.15 * r) * (1 + Math.max(0, -S.karma) / 200)); },
  // ---------------------------------------------------------------- cofre e investimentos
  vaultIn(n) { n = Math.min(Math.floor(n), P.gold); if (n < 1) return; P.gold -= n; this.S().vault += n; Progress.add('soc_vault', n); Sound.play('coin'); this.log(`💰 Você pôs ${n} 🪙 no cofre da loja.`); this.check(); },
  vaultOut(n) { if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se mexe no cofre.`, 'bad'); return; } const S = this.S(); n = Math.min(Math.floor(n), S.vault); if (n < 1) return; S.vault -= n; P.gold += n; Sound.play('coin'); this.log(`💰 Você tirou ${n} 🪙 do cofre da loja.`); },
  invest(k, n) { if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se decidem os investimentos.`, 'bad'); return; } const S = this.S(); n = Math.min(Math.floor(n), S.vault); if (n < 1) { UI.msg('O cofre da loja não tem esse dinheiro.', 'bad'); return; } S.vault -= n; S.inv[k] = (S.inv[k] || 0) + n; this.log(`${SOC2_FUNDS[k].icon} ${n} 🪙 do cofre foram para ${SOC2_FUNDS[k].name}.`); },
  divest(k, n) { if (!this.admin()) return; const S = this.S(); n = Math.min(Math.floor(n), Math.floor(S.inv[k] || 0)); if (n < 1) return; S.inv[k] -= n; S.vault += n; this.log(`${SOC2_FUNDS[k].icon} ${n} 🪙 voltaram de ${SOC2_FUNDS[k].name} para o cofre.`); },
  spend(n) { const S = this.S(); if (S.vault >= n) { S.vault -= n; return true; } UI.msg(`O cofre da loja precisa de ${n} 🪙.`, 'bad'); return false; },
  // ---------------------------------------------------------------- rede: networking, recrutar, cargos
  netOk() { return (this.S().netDay || -1) !== G.day; },
  network() {
    const k = this.key(); if (!k) return;
    if (!this.temple()) { UI.msg('Construa o Templo da sociedade para receber os irmãos.', 'bad'); return; }
    if (!this.netOk()) { UI.msg('Os irmãos já se reuniram neste mês: volte no mês que vem.', 'bad'); return; }
    const S = this.S(), B = k === 'own' ? [] : Secret.brothers(k).filter(p => p.age >= 18);
    if (P.gold < 50 && S.vault < 50) { UI.msg('O banquete dos irmãos custa 50 🪙.', 'bad'); return; }
    if (S.vault >= 50) S.vault -= 50; else P.gold -= 50;
    S.netDay = G.day; S.infl += 2; Progress.add('soc_net');
    const met = B.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const p of met) { p.met = true; People.addAff(p, 8); }
    const t = met.length ? `🤝 Banquete na loja: você conversou com ${met.map(p => People.full(p)).join(', ')} (+8 de amizade cada) e a influência subiu.` : '🤝 Banquete na loja: a influência subiu.';
    this.log(t); UI.msg(t, 'gold'); this.check();
  },
  candidates() {
    const k = this.key(); if (!k || k === 'own') return [];
    const imp = p => NOBLE_RANKS.includes(p.rank) || ['knight', 'merchant', 'trader'].includes(p.rank) || G.civs.some(c => c.rulerId === p.id) || Chiefdom.vilOf(p) >= 0;
    return G.people.filter(p => p.alive && p.met && p.age >= 18 && !p.kin && p.spouse !== 'player' && !p.capanga && !Secret.ssoc(p) && !(typeof Commerce !== 'undefined' && Commerce.guildOf(p)) && imp(p))
      .sort((a, b) => (b.aff || 0) - (a.aff || 0)).slice(0, 12);
  },
  recruit(pid) {
    const k = this.key(), p = People.get(pid); if (!k || k === 'own' || !p) return;
    const S = this.S(); S.tried = S.tried || {};
    if ((S.tried[pid] || -99) === G.day) { UI.msg(`${People.full(p)} já ouviu a proposta neste mês.`, 'bad'); return; }
    S.tried[pid] = G.day;
    const pw = this.power(k).power, ch = U.clamp(((p.aff || 0) - 10) / 90 + pw / 1500 + (this.rank() * 0.05), 0.05, 0.95);
    if (Math.random() < ch) {
      p.ssoc = k; delete p.socOut; p.socMiss = 0; S.infl += G.civs.some(c => c.rulerId === p.id) ? 15 : NOBLE_RANKS.includes(p.rank) ? 6 : 3; People.addAff(p, 10); Progress.add('soc_recruit');
      const t = `🎖️ ${People.full(p)} fez o juramento: agora é irmão da ${SECRET_SOC[k].name}.`; this.log(t); UI.msg(t, 'gold', true); this.check();
    } else { People.addAff(p, -4); UI.msg(`${People.full(p)} recusou o convite secreto (chance era ${Math.round(ch * 100)}%).`, 'bad'); }
  },
  postable() { const k = this.key(); if (!k || k === 'own') return []; return Secret.brothers(k).filter(p => this.postWhy(p) === null); },
  // por que um irmão não pode assumir um cargo (null: pode)
  postWhy(p) { return !p || !p.alive ? 'morreu' : p.age < 18 ? 'jovem demais' : p.capanga ? 'segue você como capanga' : !p.met ? 'vocês ainda não se conhecem' : (p.aff || 0) < 20 ? `amizade ${Math.round(p.aff || 0)} (precisa de 20)` : null; },
  // os irmãos para escolher (os que podem primeiro, depois pela amizade)
  pickList() { const k = this.key(); if (!k || k === 'own') return []; return Secret.brothers(k).filter(p => p.alive && p.age >= 18 && !p.capanga).sort((a, b) => (this.postWhy(a) === null ? 0 : 1) - (this.postWhy(b) === null ? 0 : 1) || (b.aff || 0) - (a.aff || 0)); },
  appoint(post, pid) {
    if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se nomeiam os cargos.`, 'bad'); return false; }
    const S = this.S(), p = People.get(pid), why = this.postWhy(p);
    if (!p || !SOC2_POSTS[post] || !Secret.myBro(p)) { UI.msg('Escolha um irmão da sociedade.', 'bad'); return false; }
    if (why) { UI.msg(`${People.full(p)} não pode assumir: ${why}.`, 'bad'); return false; }
    for (const k in S.posts) if (S.posts[k] === p.id) delete S.posts[k];
    S.posts[post] = p.id; People.addAff(p, 5);
    const t = `${SOC2_POSTS[post].icon} ${People.full(p)} agora é ${SOC2_POSTS[post].name} da loja.`; this.log(t); UI.msg(t, 'gold');
    return true;
  },
  vacate(post) { if (!this.admin()) return; const h = this.holder(post); delete this.S().posts[post]; if (h) this.log(`${SOC2_POSTS[post].icon} ${People.full(h)} deixou de ser ${SOC2_POSTS[post].name} da loja.`); },
  holder(post) { const id = this.S().posts[post], p = id !== undefined && People.get(id); return p && p.alive ? p : null; },
  // ---------------------------------------------------------------- poder: governadores, reis, bem e mal
  govTargets() {
    return World.villages.map((v, vi) => ({ v, vi, p: v && v.chief !== undefined && v.chief !== null ? People.get(v.chief) : null }))
      .filter(x => x.v && !x.v.ruin && x.p && x.p.alive && x.v.lord !== 'player' && !(G.civs[x.v.civ] && G.civs[x.v.civ].ruler === 'player') && !Secret.myBro(x.p))
      .sort((a, b) => U.dist(a.v.x, a.v.y, P.x / TILE, P.y / TILE) - U.dist(b.v.x, b.v.y, P.x / TILE, P.y / TILE)).slice(0, 8);
  },
  // ---------------------------------------------------------------- candidatos da sociedade: um irmão indicado para o
  // lugar de um governador ou de um rei. O dinheiro investido nele (campanha, presentes, subornos) vira apoio: mais
  // chance de a trama dar certo, e é ele quem assume quando o governador ou o rei cai.
  GOV_GOAL: 4000, KING_GOAL: 30000,
  cand(key) { const c = this.S().cand[key], p = c && People.get(c.pid); if (!c || !p || !p.alive || !Secret.myBro(p) || this.candWhy(key, p)) { if (c) delete this.S().cand[key]; return null; } return { ...c, p }; },
  support(key) { const c = this.cand(key); return c ? U.clamp(c.inv / (key[0] === 'g' ? this.GOV_GOAL : this.KING_GOAL), 0, 1) : 0; },
  // por que um irmão não pode ser o candidato (null: pode). Governador: um irmão que mora na vila; rei: qualquer irmão adulto.
  candWhy(key, p) {
    if (!p || !p.alive) return 'morreu'; if (p.age < 20) return 'jovem demais (20+)'; if (p.capanga || p.kin || p.spouse === 'player') return 'é da sua casa';
    if (G.civs.some(c => c.rulerId === p.id)) return 'já é rei';
    if (key[0] === 'g') { const vi = +key.slice(1), v = World.villages[vi]; if (!v) return 'vila sumiu'; if (v.chief === p.id) return 'já governa a vila'; if (!(p.home && p.home.type === 'village' && p.home.idx === vi)) return 'não mora na vila'; if (Chiefdom.vilOf(p) >= 0) return 'já governa outra vila'; }
    return null;
  },
  candList(key) {
    const k = this.key(); if (!k || k === 'own') return [];
    const ci = key[0] === 'k' ? +key.slice(1) : -1, res = key[0] === 'g' ? People.residents(+key.slice(1)) : Secret.brothers(k);
    return res.filter(p => p.alive && p.age >= 18 && Secret.isBro(p, k) && !p.capanga && !p.kin && p.spouse !== 'player')
      .sort((a, b) => (this.candWhy(key, a) ? 1 : 0) - (this.candWhy(key, b) ? 1 : 0) || (ci >= 0 ? (Lodges.civOf(b) === ci) - (Lodges.civOf(a) === ci) : 0) || (NOBLE_RANKS.includes(b.rank) - NOBLE_RANKS.includes(a.rank)) || (b.aff || 0) - (a.aff || 0)).slice(0, 30);
  },
  nominate(key, pid) {
    if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se indica um candidato.`, 'bad'); return false; }
    const p = People.get(pid), why = p && Secret.myBro(p) ? this.candWhy(key, p) : 'não é irmão da sociedade';
    if (why) { UI.msg(`${p ? People.full(p) : 'Essa pessoa'} não pode ser o candidato: ${why}.`, 'bad'); return false; }
    const S = this.S(), old = S.cand[key];
    S.cand[key] = { pid: p.id, inv: old && old.pid === p.id ? old.inv : 0, day: G.day }; People.addAff(p, 5);
    const t = `👤 A loja indicou ${People.full(p)} para ${this.seatName(key)}.`; this.log(t); UI.msg(t, 'gold');
    return true;
  },
  seatName(key) { return key[0] === 'g' ? `governar ${World.villages[+key.slice(1)].name}` : `o trono de ${CIV_DEFS[+key.slice(1)].short}`; },
  // investir no candidato: sai do cofre da loja (ou do seu bolso, se o cofre não tiver)
  backCand(key, n) {
    if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se investe num candidato.`, 'bad'); return false; }
    const c = this.cand(key); if (!c) { UI.msg('Indique um irmão primeiro.', 'bad'); return false; }
    const S = this.S(); n = Math.floor(n); if (!(n >= 1)) return false;
    if (S.vault >= n) S.vault -= n; else if (P.gold >= n) P.gold -= n; else { UI.msg(`Nem o cofre da loja nem o seu bolso têm ${n.toLocaleString('pt-BR')} 🪙.`, 'bad'); return false; }
    S.cand[key].inv += n; c.p.purse = People.purse(c.p) + Math.round(n * 0.2); People.addAff(c.p, Math.min(10, Math.max(1, Math.round(n / 500))));
    Sound.play('coin');
    this.log(`💰 ${n.toLocaleString('pt-BR')} 🪙 na campanha de ${People.full(c.p)} para ${this.seatName(key)} (apoio ${Math.round(this.support(key) * 100)}%).`);
    return true;
  },
  // o candidato assume o governo da vila (e continua governando: é o eleito até a próxima eleição)
  seatGov(vi, p) { const v = World.villages[vi]; v.chief = p.id; v.elected = p.id; v.lordFam = p.fam; delete this.S().cand['g' + vi]; People.addAff(p, 15); Court.addFame(3); },
  govChance(vi) { return U.clamp(0.3 + this.power(this.key()).power / 400 + this.support('g' + vi) * 0.45, 0.2, 0.95); },
  kingChance(ci) { const c = G.civs[ci]; return U.clamp(0.25 + this.power(this.key()).power / 600 - ((c && c.garrison) || 0) / 120 + this.rank() * 0.05 + this.support('k' + ci) * 0.45, 0.1, 0.95); },
  topGov(vi) {
    if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se move a sociedade contra um governador.`, 'bad'); return; }
    const v = World.villages[vi], old = v && People.get(v.chief); if (!old) return;
    const ch = this.govChance(vi), cd = this.cand('g' + vi);
    if (!this.spend(800)) return;
    const k = this.key();
    if (Math.random() < ch) {
      const bro = cd ? cd.p : k !== 'own' ? People.residents(vi).find(p => p.age >= 20 && Secret.isBro(p, k) && p !== old) : null;
      if (bro) this.seatGov(vi, bro); else { delete v.chief; delete v.elected; }
      this.S().infl += 6;
      const t = `🕯️ A sociedade derrubou ${People.full(old)}, governador de ${v.name}${bro ? `: o irmão ${People.full(bro)} assumiu` : ''}.`;
      this.log(t); UI.msg(t, 'gold', true); Diplo.chronicle(`🕯️ ${People.full(old)} perdeu o governo de ${v.name} de uma hora para outra. Sussurram sobre uma irmandade.`, true);
    } else { this.S().karma -= 3; if (cd) this.S().cand['g' + vi].inv = Math.floor(cd.inv / 2); UI.msg(`🕯️ A trama contra ${People.full(old)} falhou (chance ${Math.round(ch * 100)}%). O dinheiro foi perdido${cd ? ' e o apoio ao candidato caiu pela metade' : ''}.`, 'bad', true); if (G.civs[v.civ]) Game.addRelation(v.civ, -10); }
  },
  kingTargets() { return G.civs.filter(c => c && !c.dead && !c.anarchy && c.ruler !== 'player' && c.rulerId != null && !Secret.kingBro(c.id)); },
  KING_COST: 3000, KING_POWER: 120,
  topKing(ci) {
    if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se move a sociedade contra um rei.`, 'bad'); return; }
    const k = this.key(), pw = this.power(k).power, c = G.civs[ci];
    if (!c || c.ruler === 'player') return;
    if (pw < this.KING_POWER) { UI.msg(`A sociedade ainda não tem poder para derrubar um rei (precisa de ${this.KING_POWER}, tem ${pw}).`, 'bad'); return; }
    const ch = this.kingChance(ci), king = People.get(c.rulerId), old = c.rulerName, cd = this.cand('k' + ci);
    if (!this.spend(this.KING_COST)) return;
    if (Math.random() < ch && king) {
      let heir = cd && cd.p !== king ? cd.p : k !== 'own' ? Secret.brothers(k).filter(p => p.alive && p.age >= 20 && p !== king && !p.capanga && !p.kin && p.spouse !== 'player' && !G.civs.some(o => o.rulerId === p.id)).sort((a, b) => (Families.civOf ? (Families.civOf(b) === ci) - (Families.civOf(a) === ci) : 0) || NOBLE_RANKS.includes(b.rank) - NOBLE_RANKS.includes(a.rank))[0] : null;
      People.die(king, 'derrubado por uma sociedade secreta');
      if (heir) { for (const p of G.people) if (p.alive && p.rank === 'ruler' && p.civ === ci && p !== heir) p.rank = 'knight'; Succession.seat(c, heir, 'ruler'); People.addAff(heir, 20); }
      delete this.S().cand['k' + ci];
      c.happy = Math.max(0, (c.happy || 50) - 8); if (typeof Heraldry !== 'undefined') Heraldry.apply();
      this.S().infl += 25; Court.addFame(10);
      const t = `👑 A sociedade derrubou ${old}${heir ? ` e pôs o irmão ${People.full(heir)} no trono de ${CIV_DEFS[ci].short}` : ''}.`;
      this.log(t); UI.banner(`🕯️ Queda do rei de ${CIV_DEFS[ci].short}`); UI.msg(t, 'gold', true); Diplo.chronicle(`🗡️ ${old} caiu em ${CIV_DEFS[ci].name}. Nas tavernas, falam de mãos escondidas.`, true);
      Progress.diary(`🕯️ Derrubou ${old} pela sociedade secreta.`);
    } else {
      this.S().karma -= 8; Game.addRelation(ci, -30); if (cd) this.S().cand['k' + ci].inv = Math.floor(cd.inv / 2);
      UI.msg(`🕯️ O complô contra ${old} foi descoberto (chance era ${Math.round(ch * 100)}%): ${CIV_DEFS[ci].short} odeia você agora e o ouro se perdeu.`, 'bad', true);
    }
  },
  charity() {
    if (!this.spend(500)) return;
    const S = this.S(); S.karma = Math.min(100, S.karma + 10); S.infl += 2;
    for (const c of G.civs) if (c && !c.dead) c.happy = Math.min(100, (c.happy || 50) + 2);
    Court.addFame(3); if (typeof G.piety === 'number') G.piety += 2; Progress.add('soc_charity');
    const t = '🍞 A loja pagou pão, remédios e telhados para os pobres dos reinos: o povo fala bem da irmandade.'; this.log(t); UI.msg(t, 'gold'); this.check();
  },
  intimidate() {
    if (!this.spend(300)) return;
    const S = this.S(); S.karma = Math.max(-100, S.karma - 10); S.infl += 3; let n = 0;
    for (const f of Object.values(G.fams || {})) if (f.grudge > 0) { f.grudge = Math.max(0, f.grudge - 40); n++; }
    const t = `😨 Recados anônimos na porta das casas rivais: ${n ? `${n} famílias engoliram o rancor` : 'ninguém mais ousa falar mal de você'}. O medo da irmandade cresce.`;
    this.log(t); UI.msg(t, 'bad');
  },
  karmaName() { const k = this.S().karma; return k >= 40 ? 'benfeitora' : k >= 10 ? 'respeitada' : k > -10 ? 'discreta' : k > -40 ? 'temida' : 'sombria'; },
  // ---------------------------------------------------------------- o mês da loja
  monthTick() {
    if (!Secret.member()) return;
    const S = this.S(), k = this.key();
    // mensalidades: todo irmão paga o valor que o líder definiu (do próprio bolso); alguns ainda fazem doações
    const due = this.duesValue(); let paid = 0, n = 0, don = 0, dn = 0, me = 0, late = 0; const out = [];
    if (k !== 'own') for (const p of Secret.brothers(k)) {
      if (!p.alive || p.age < 18 || p.capanga) continue;
      const pu = People.purse(p);
      if (due > 0 && pu >= due) { p.purse = pu - due; paid += due; n++; p.socMiss = 0; }
      else if (due > 0) { p.socMiss = (p.socMiss || 0) + 1; late++; if (p.socMiss >= this.EXPEL_AFTER) { out.push(p); continue; } }
      else p.socMiss = 0;
      if (Math.random() < 0.12) { const left = People.purse(p), g = Math.max(5, Math.round(left * U.rnd(0.02, 0.08))); if (left >= g + 10) { p.purse = left - g; don += g; dn++; } }
    }
    if (!this.leader() && due > 0) {
      if (P.gold >= due) { P.gold -= due; me = due; paid += due; S.miss = 0; }
      else { S.miss = (S.miss || 0) + 1; UI.msg(`🕯️ Você não pagou a mensalidade da sociedade (${due} 🪙). Atrasos: ${S.miss}/3.`, 'bad', true); if (S.miss >= 3) { S.miss = 0; KOrders.violate('deixou de pagar as mensalidades'); } }
    }
    for (const p of out) this.expel(p, `${this.EXPEL_AFTER} meses sem pagar a mensalidade`);
    S.vault += paid + don; S.lastDues = { day: G.day, due, n, paid, don, dn, me, late, out: out.length };
    const dues = paid + don;
    if (this.temple()) { const up = Math.min(S.vault, 20); S.vault -= up; }
    let gain = 0; const tes = this.holder('tesoureiro') ? 0.005 : 0;
    for (const f in SOC2_FUNDS) { const n = S.inv[f] || 0; if (n < 1) continue; const g = Math.round(n * (U.rnd(SOC2_FUNDS[f].lo, SOC2_FUNDS[f].hi) + tes)); S.inv[f] = Math.max(0, n + g); gain += g; }
    if (this.holder('orador')) S.infl += 3;
    if (this.holder('guarda') && (G.assassins || 0) > 0 && Math.random() < 0.5) G.assassins--;
    if (this.holder('secretario') && Math.random() < 0.5) { const t = Secret.secret(); if (t) { const s2 = Secret.S(); s2.secrets.unshift({ day: G.day, t }); if (s2.secrets.length > 8) s2.secrets.length = 8; } }
    if (dues || gain) Game.note(`🏛️ Loja: mensalidades ${paid} 🪙 (${n + (me ? 1 : 0)} irmãos)${don ? `, doações ${don} 🪙 (${dn})` : ''}${gain ? `, investimentos ${gain >= 0 ? '+' : ''}${gain} 🪙` : ''}.`);
  },
  // ---------------------------------------------------------------- mensalidade (o líder define)
  DUES: { crafts: 15, smiths: 10, merchants: 30, weavers: 20, victuals: 5, hunters: 10, healers: 15, own: 10 },
  DUES_MAX: 1000000, EXPEL_AFTER: 12,
  // expulsar um irmão da sociedade (perde os cargos e a candidatura)
  expel(p, why) {
    const k = this.key(); if (!p || !k || k === 'own') return;
    if (p.ssoc === k) p.ssoc = null; p.socOut = k; p.socMiss = 0;
    const S = this.S(); for (const q in S.posts) if (S.posts[q] === p.id) delete S.posts[q]; for (const q in S.cand) if (S.cand[q].pid === p.id) delete S.cand[q];
    const t = `⛔ ${People.full(p)} foi expulso da ${SECRET_SOC[k] ? SECRET_SOC[k].name : 'sociedade'}: ${why}.`; this.log(t); if (p.met) UI.msg(t, 'bad');
  },
  // irmãos em atraso com a mensalidade (os mais atrasados primeiro)
  late() { const k = this.key(); if (!k || k === 'own') return []; return Secret.brothers(k).filter(p => p.alive && (p.socMiss || 0) > 0).sort((a, b) => b.socMiss - a.socMiss); },
  // quantos irmãos têm dinheiro para pagar um valor
  canPay(v) { const k = this.key(); if (!k || k === 'own') return [0, 0]; const L = Secret.brothers(k).filter(p => p.alive && p.age >= 18 && !p.capanga); return [L.filter(p => People.purse(p) >= v).length, L.length]; },
  duesValue() { const S = this.S(), k = this.key(); return S.dues !== undefined && S.duesKey === k ? S.dues : (this.DUES[k] !== undefined ? this.DUES[k] : 10); },
  leader() { const k = this.key(); return k === 'own' || (!!k && this.rank() >= 3); },
  leaderName() {
    const k = this.key(); if (!k) return '';
    const head = typeof SocLore !== 'undefined' ? SocLore.of(k).head : 'líder';
    if (this.leader()) return `você (${head})`;
    if (typeof Lodges !== 'undefined') { const near = World.capitals.map((cp, i) => ({ i, d: cp ? U.dist(cp.x, cp.y, P.x / TILE, P.y / TILE) : 1e9 })).sort((a, b) => a.d - b.d)[0]; const h = near && Lodges.L().list.some(x => x.k === k && x.ci === near.i) ? Lodges.head(k, near.i) : null; if (h && h !== 'player') return `${People.full(h)} (${head})`; }
    return `o ${head}`;
  },
  setDues(n) {
    if (!this.leader()) { UI.msg('Só o líder da sociedade define a mensalidade.', 'bad'); return; }
    if (!(n >= 0)) { UI.msg('Escreva um valor (0 para grátis).', 'bad'); return; }
    const S = this.S(); S.dues = Math.min(this.DUES_MAX, Math.max(0, Math.round(n))); S.duesKey = this.key();
    const [ok, all] = this.canPay(S.dues);
    this.log(`📅 A mensalidade passou a ${S.dues.toLocaleString('pt-BR')} 🪙 por mês.`); UI.msg(`📅 Mensalidade: ${S.dues ? `${S.dues.toLocaleString('pt-BR')} 🪙 por mês (hoje ${ok} de ${all} irmãos têm como pagar)` : 'grátis'}. Quem ficar ${this.EXPEL_AFTER} meses sem pagar é expulso.`, 'gold');
  },
  // missão cumprida na hora (sem esperar o fim do mês)
  check() { const K = KOrders.S(), m = K.mission; if (!m || m.k === 'donate') return; const M = KO_MISSIONS[m.k]; if (M && M.stat && KOrders.progress() >= M.need) KOrders.done(); },
  // ---------------------------------------------------------------- a página da sociedade (Portfólio → Sociedades secretas)
  memberPage() {
    Secret.seed();
    const K = KOrders.S(), d = KOrders.def(), k = Secret.key(), r = KOrders.rank(), esc = UI.esc.bind(UI), own = K.key === 'own';
    const m = K.mission, M = m && KO_MISSIONS[m.k], prog = m && M.stat ? Math.min(KOrders.progress(), M.need) : 0;
    const pw = this.power(K.key), rank = this.ranking(), pos = rank.findIndex(x => x.k === K.key) + 1, S2 = Secret.S(), S = this.S();
    const next = KO_RANKS[r + 1], need = next ? next[1] : 0, pts = K.pts || 0;
    const steps = SECRET_RANKS.map((n, i) => `<div class="scx-step ${i < r ? 'done' : ''} ${i === r ? 'cur' : ''}"><i>${i < r ? '✔' : i + 1}</i><b>${n}</b>${own ? '' : `<small>${KO_RANKS[i][1]} missões${i === 3 ? ' · 120 fama' : ''}</small>`}</div>`).join('');
    const nextBar = own || !next ? '' : `<div class="scx-next"><span>Para ${SECRET_RANKS[r + 1]}: ${Math.min(pts, need)}/${need} missões</span><i><i style="width:${Math.round(Math.min(1, pts / Math.max(1, need)) * 100)}%"></i></i></div>`;
    const top = `<div class="scx-top" style="--c:${d.col};--x:${d.cross}">${Secret.emblem(d, 54)}
        <div class="scx-id"><small>Você é <b>${SECRET_RANKS[r]}</b>${pos ? ` · a ${pos}ª sociedade mais poderosa` : ''}</small><h3>${esc(d.name)}</h3><i>"${esc(d.motto || d.oath)}"</i></div>
        <div class="scx-path"><div class="scx-steps">${steps}</div>${nextBar}</div>
        <div class="scx-acts"><button class="primary" data-act="tp" data-op="tab" data-k="loja">🏛️ Abrir o templo</button><button class="scx-quit" data-act="ko" data-op="leave">🏳️ Deixar</button></div></div>`;
    // quadro 1: a missão, o juramento e as cartas
    const viol = own ? 0 : K.viol || 0;
    const mis = own || r >= 3 ? `<div class="scx-mis"><span>⚜️</span><div><b>Você é ${typeof SocLore !== 'undefined' ? esc(SocLore.of(own ? 'own' : k).head) : 'o líder'} da ${own ? 'sua sociedade' : esc(d.name)}</b><small>${own ? 'A sua palavra é a lei: não há missões a cumprir.' : 'Não há mais missões para você: agora você administra a sociedade (mensalidade, cargos, cofre e poder).'}</small><button data-act="tp" data-op="tab" data-k="${own ? 'loja' : 'tesouro'}">🏛️ Administrar</button></div></div>`
      : m ? `<div class="scx-mis"><span>${M.icon}</span><div><b>${M.text}</b>${M.how ? `<small class="scx-how">💡 ${M.how}</small>` : ''}<small>até ${Calendar.short(m.until)} · vale +5 de fama e 1 missão para o grau</small>${M.go ? `<button data-act="kogo" data-k="${M.go}">${M.goTxt || 'Ir'}</button>` : ''}${M.stat ? `<i class="scx-bar"><i style="width:${Math.round(prog / M.need * 100)}%"></i></i><em>${prog}/${M.need}</em>` : ''}
          ${m.k === 'donate' ? `<button class="primary" data-act="ko" data-op="donate" ${P.gold >= 250 ? '' : 'disabled'}>💰 Doar 250 🪙</button>` : ''}</div></div>`
      : '<p class="muted">A próxima missão chega no mês que vem.</p>';
    const oath = `<div class="scx-oath"><span>⚖️</span><div><b>Juramento</b><small>${esc(d.oath)}</small></div>${own ? '' : `<span class="scx-pips" title="quebras do juramento">${[0, 1, 2].map(i => `<i class="${i < viol ? 'on' : ''}"></i>`).join('')}</span>`}</div>`;
    const letters = S2.secrets.length ? S2.secrets.slice(0, 8).map(x => `<div class="scx-letter"><em>${Calendar.short(x.day)}</em><span>${esc(x.t)}</span></div>`).join('') : `<p class="muted">${r >= 1 ? 'Nenhuma carta neste mês.' : 'Os irmãos contam segredos a partir de Companheiro.'}</p>`;
    const cardA = `<section class="card scx-card scx-a"><div class="sec">${own || r >= 3 ? '⚜️ A sua sociedade' : '📜 Missão secreta do mês'}</div>${mis}${oath}
        <div class="sec scx-sub">🕯️ Cartas lacradas <span>segredos</span></div><div class="scx-list">${letters}</div></section>`;
    // quadro 2: o que a sociedade faz por você e o poder dela
    const ben = Secret.benefits(r, k).map(b => `<div class="scx-ben"><span>${b[0]}</span><b>${b[1]}</b><small>${esc(b[2])}</small></div>`).join('');
    const cardB = `<section class="card scx-card scx-b"><div class="sec">✨ O que a sociedade faz por você</div><div class="scx-bens">${ben}</div>
        <div class="scx-stats"><div><small>⚔️ Poder</small><b>${pw.power}</b></div><div><small>🕯️ Influência</small><b>${pw.infl}</b></div><div><small>💰 Cofre da loja</small><b>${Math.round(S.vault).toLocaleString('pt-BR')}</b></div><div><small>📅 Mensalidade</small><b>${this.duesValue()} 🪙</b></div></div></section>`;
    // quadro 3: irmãos poderosos e cavaleiros que seguem você
    const p2 = k ? Secret.powerful(k) : null, cname = p => { const c = G.civs.find(x => x.rulerId === p.id); return c && CIV_DEFS[c.id] ? CIV_DEFS[c.id].short : '?'; };
    // todos os irmãos, dos mais importantes aos mestres de ofício: clique para conversar
    const wt = p => G.civs.some(c => c.rulerId === p.id && c.ruler !== 'player') ? 4 : ['consort', 'heir'].includes(p.rank) || NOBLE_RANKS.includes(p.rank) ? 3 : p.rank === 'knight' ? 2 : 1;
    const icon = p => ['', '🔨', '🛡️', '🎖️', '👑'][wt(p)];
    const bros = k ? Secret.brothers(k).filter(p => p.alive).sort((a, b) => wt(b) - wt(a) || (b.met ? 1 : 0) - (a.met ? 1 : 0) || (b.aff || 0) - (a.aff || 0))
      .map(p => [icon(p), p, wt(p) === 4 ? `Rei de ${cname(p)}` : People.title(p)]) : [];
    const kn = KOrders.knights();
    const cardC = `<section class="card scx-card scx-c"><div class="sec">🤝 Os irmãos <span>${k ? `${Secret.brothers(k).length} membros · clique para conversar` : 'a sua sociedade'}</span></div>
        <div class="scx-list">${bros.length ? bros.map(([ic, p, t]) => `<button class="scx-bro scx-click" data-act="tk" data-op="open" data-id="${p.id}" title="Conversar com ${esc(People.full(p))}"><span>${ic}</span><b>${esc(People.full(p))}</b><small>${esc(t)} · ${esc(People.homeName ? People.homeName(p) : '')}${p.met ? ` · amizade ${Math.round(p.aff || 0)}` : ' · ainda não se conhecem'}</small><em>💬</em></button>`).join('') : '<p class="muted">Nenhum rei, nobre ou cavaleiro entre os irmãos ainda.</p>'}
</div>
        <div class="sec scx-sub">🛡️ Cavaleiros que seguem você <span>${kn.length}</span></div>
        <div class="scx-kn">${kn.length ? kn.map(p => `<span class="scx-chip">${d.icon} ${esc(People.full(p))}${p.korderWait ? ' · esperando vaga' : ''}</span>`).join('') : `<small class="muted">${r >= 1 ? 'Nenhum cavaleiro agora.' : 'A partir de Companheiro a sociedade manda cavaleiros.'}</small>`}
          ${r >= 1 ? '<button data-act="ko" data-op="armor">🛡️ Vestir o kit</button>' : ''}</div></section>`;
    return top + cardA + cardB + cardC;
  },
  // ---------------------------------------------------------------- a página de quem ainda não é de uma sociedade
  outsiderPage() {
    Secret.seed();
    const S = Secret.S(), esc = UI.esc.bind(UI), inv = Object.keys(S.invites), fe = KOrders.canFound();
    const cards = Object.entries(SECRET_SOC).map(([k, s]) => {
      const pw = Secret.powerful(k), f = Secret.friends(k), iv = S.invites[k], best = f.length ? Math.round(f[0].aff) : 0, ch = Secret.chance(best), bl = f.length ? Secret.blocked(k, best) : null;
      const L = typeof SocLore !== 'undefined' ? SocLore.of(k) : null;
      const st = iv ? ['inv', '🕯️ Convite recebido!'] : bl ? ['no', /expuls/.test(bl) ? '⛔ expulso' : '⏳ espere o mês que vem'] : !f.length ? ['far', 'conheça um irmão'] : ch >= 1 ? ['ok', 'convite garantido'] : ch ? ['mid', `${Math.round(ch * 100)}% de chance por mês`] : ['far', 'amizade 40+ para ter chance'];
      const btn = iv ? `<button class="primary" data-act="sec" data-op="accept" data-k="${k}">🕯️ Aceitar</button><button class="sco-dec" data-act="sec" data-op="decline" data-k="${k}">recusar</button>`
        : f.length ? `<button data-act="sec" data-op="ask" data-k="${k}" ${bl ? 'disabled' : ''}>🤝 Pedir a ${esc(f[0].name)}</button>` : '';
      return `<div class="sco-card ${st[0]}" style="--c:${s.col};--x:${s.cross}">${Secret.emblem(s, 40)}
        <div class="sco-tx"><b>${esc(s.name)}</b><i>"${esc(s.motto)}"</i><small>👑 ${pw.kings.length} ${pw.kings.length === 1 ? 'rei' : 'reis'} · 🎖️ ${pw.nobles.length + pw.knights.length} nobres · ${Secret.brothers(k).length} irmãos${L ? ` · líder: ${esc(L.head)}` : ''}</small></div>
        <div class="sco-st"><div class="sco-aff"><span>🤝 ${f.length ? `${esc(f[0].name)} · ${best}` : 'nenhum amigo'}</span><i><i style="width:${best}%"></i></i></div><em>${st[1]}</em><div class="sco-btn">${btn}</div></div></div>`;
    }).join('');
    const steps = [['🤝', 'Faça amizade', 'Converse e dê presentes a um irmão (cada sociedade tem os seus: veja os ofícios e os nobres de cada uma).'],
      ['📈', 'A amizade abre a porta', 'Com 40 de amizade há chance de convite todo mês; com 80, metade das vezes; com 100, o convite é garantido.'],
      ['🕯️', 'Aceite o convite', 'Peça o apadrinhamento aqui ou na conversa com o irmão. Dentro, os irmãos protegem, enriquecem e guardam segredos com você.']];
    const ben = [['🛡️', 'Proteção', 'reis irmãos aliviam multas e prisão'], ['💰', 'Riqueza', 'empreendimentos rendem mais'], ['⚔️', 'Exército', 'cavaleiros e irmãos nas guerras'], ['🕯️', 'Segredos', 'cartas com o que ninguém sabe']];
    return `<div class="sco">
      <div class="sco-top"><div class="sco-candle">🕯️</div><div class="sco-intro"><small>Irmandades escondidas nos sete reinos</small><h3>Só entra quem é convidado</h3>
          <div class="sco-ben">${ben.map(b => `<span>${b[0]} <b>${b[1]}</b> ${b[2]}</span>`).join('')}</div></div>
        <div class="sco-steps">${steps.map((x, i) => `<div><i>${i + 1}</i><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('')}</div></div>
      ${inv.length ? `<div class="sco-invbar">🕯️ Você tem ${inv.length === 1 ? 'um convite' : inv.length + ' convites'} esperando: aceite no cartão da sociedade.</div>` : ''}
      <div class="sco-main"><div class="sco-grid">${cards}</div>
        <div class="card sco-found"><div class="sec">✨ Fundar a sua</div><p class="dt-desc">Em vez de entrar numa, crie a sua sociedade: você é o líder desde o primeiro dia e escolhe o nome, a cor, os graus, os cargos e os costumes.</p>
          <input id="koName" maxlength="40" placeholder="Irmandade de ${esc(G.surname || G.name)}"><div class="sco-cols">${KO_COLORS.map(c => `<button class="ko-col" data-act="ko" data-op="col" data-c="${c}" style="background:${c}" ${UI.sel.koCol === c ? 'data-on="1"' : ''}></button>`).join('')}</div>
          <div class="sco-req">${['100 de fama', 'governar um reino ou ser Conde', '4.000 🪙'].map(t => `<span>• ${t}</span>`).join('')}</div>
          <button class="primary" data-act="ko" data-op="found" ${fe ? 'disabled' : ''}>🕯️ Fundar — 4.000 🪙</button>${fe ? `<small class="muted">${esc(fe)}</small>` : ''}</div></div></div>`;
  },
  // ---------------------------------------------------------------- a janela do templo
  TABS: [['loja', '🏛️ A loja'], ['tesouro', '💰 Tesouro'], ['rede', '🤝 Rede e cargos'], ['poder', '⚔️ Poder'], ['missoes', '📜 Missões e graus']],
  show(tab) {
    tab = this.TABS.some(t => t[0] === tab) ? tab : 'loja';
    const d = this.def();
    if (!d) { UI.open('🏛️ Templo', '<div class="card"><p class="dt-desc">Este templo é de uma sociedade secreta. Entre numa sociedade (Portfólio → Sociedades secretas) para usá-lo.</p></div>', 'showTemple', [tab]); return; }
    const k = this.key(), S = this.S(), pw = this.power(k), r = this.rank(), adm = this.admin(), esc = UI.esc.bind(UI);
    const B = (op, x, label, ok, cls) => `<button class="${cls || ''}" data-act="tp" data-op="${op}" data-k="${x}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const Bn = (op, x, n, label, ok) => `<button data-act="tp" data-op="${op}" data-k="${x}" data-n="${n}" ${ok ? '' : 'disabled'}>${label}</button>`;
    const Q = typeof BankView !== 'undefined' ? BankView.AMTS : [100, 500, 1000, 5000, 10000, 100000];
    const kv = (a, b, cls) => `<div class="bp-kv"><span>${a}</span><b class="${cls || ''}">${b}</b></div>`;
    let body = '';
    if (tab === 'loja') {
      const rank = this.ranking(), pos = rank.findIndex(x => x.k === k) + 1;
      body = `<div class="card tp-me" style="--c:${d.col};--x:${d.cross}"><div class="sec">${d.icon} ${esc(d.name)} <span>${pos}º poder do mundo</span></div>
          <div class="bp-big"><b>${esc(this.title())}</b><small>o seu grau${adm ? ' · você administra o cofre, os cargos e o poder' : ` · a partir de ${SOC2_TITLES[2]} você administra`}</small></div>
          ${kv('⚔️ Poder da sociedade', pw.power)}${kv('💰 Riqueza (famílias dos irmãos + loja)', pw.wealth.toLocaleString('pt-BR') + ' 🪙')}${kv('🕯️ Influência', pw.infl)}
          ${kv('👑 Reis irmãos', pw.kings)}${kv('🎖️ Nobres e cavaleiros', pw.nobles + pw.knights)}${kv('🔨 Mestres de ofício', pw.crafts)}
          ${kv('⚖️ Fama da irmandade', this.karmaName(), S.karma >= 10 ? 'ok' : S.karma <= -10 ? 'bad' : '')}${kv('😨 Só declara guerra à sua família quem tem influência', this.fearBar() + '+')}</div>
        <div class="card"><div class="sec">🏛️ Os templos</div>${this.temple() ? `<p class="dt-desc">O templo da ${esc(d.name)} está de pé. Os irmãos se reúnem aqui: networking, recrutamento, o cofre e os cargos.</p>${kv('🏛️ Manutenção', '20 🪙 por mês (do cofre)')}` : `<p class="dt-desc">Os irmãos se reúnem nos templos da sociedade em cada reino (perto das capitais). Construa também o seu <b>Templo da Sociedade</b> (Construir → Baús e estábulo) para receber os irmãos em casa.</p>`}
          ${k !== 'own' && typeof Lodges !== 'undefined' ? `<div class="sec" style="margin-top:10px">🏛️ ${esc(SocLore.of(k).temple)}s nos reinos</div>${Lodges.listHtml(k)}` : ''}</div>
        <div class="card"><div class="sec">🌍 As sociedades no mundo</div>${rank.map((x, i) => `<div class="crow ${x.k === k ? 'tp-mine' : ''}"><span class="ri">${x.d ? x.d.icon : '🕯️'}</span><span><b>${i + 1}. ${esc(x.d ? x.d.name : x.k)}</b><small>👑 ${x.kings} · 🎖️ ${x.nobles + x.knights} · ${x.brothers} irmãos · ${x.wealth.toLocaleString('pt-BR')} 🪙</small><i class="ex-risk tp-pw"><i style="width:${Math.round(x.power / Math.max(1, rank[0].power) * 100)}%"></i></i></span><b>${x.power}</b></div>`).join('')}</div>`;
    } else if (tab === 'tesouro') {
      const tot = Object.values(S.inv).reduce((a, n) => a + n, 0);
      body = `<div class="card"><div class="sec">💰 Cofre da loja <span>${adm ? 'você administra' : `só a partir de ${SOC2_TITLES[2]}`}</span></div>
          <div class="bp-big"><b>${Math.round(S.vault).toLocaleString('pt-BR')} 🪙</b><small>dinheiro dos irmãos, guardado na loja</small></div>
          <div class="rd-ops"><span>Pôr</span><div class="act-row">${Q.map(n => Bn('vin', 0, n, `+${n}`, P.gold >= n)).join('')}</div><span>Tirar</span><div class="act-row">${Q.map(n => Bn('vout', 0, n, `−${n}`, adm && S.vault >= n)).join('')}</div></div>
          ${(() => { const due = this.duesValue(), ld = S.lastDues, lead = this.leader();
            return `<div class="sec" style="margin-top:10px">📅 Mensalidade <span>${due} 🪙 por mês</span></div>
            ${kv('Quem define', esc(this.leaderName()))}
            ${lead ? (() => { const [ok, all] = this.canPay(due); return `<div class="tp-duesf"><input id="tpDues" type="number" inputmode="numeric" min="0" max="${this.DUES_MAX}" step="1" value="${due}" aria-label="Mensalidade em Salins"><span>🪙 por mês</span><button class="primary" data-act="tp" data-op="dues">💾 Definir</button></div><small class="muted tp-dnote">Qualquer valor (0 = grátis) · hoje ${ok} de ${all} irmãos têm como pagar ${due.toLocaleString('pt-BR')} 🪙</small>`; })() : kv('Você paga', `${due.toLocaleString('pt-BR')} 🪙 por mês${S.miss ? ` · ${S.miss}/3 atrasos` : ''}`, S.miss ? 'bad' : '')}
            ${(() => { const L = this.late(); return kv(`⛔ Em atraso <small>${this.EXPEL_AFTER} meses sem pagar = expulso</small>`, L.length ? `${L.length} ${L.length === 1 ? 'irmão' : 'irmãos'} · ${L.slice(0, 2).map(p => `${esc(p.name)} ${p.socMiss}/${this.EXPEL_AFTER}`).join(', ')}` : 'ninguém', L.some(p => p.socMiss >= this.EXPEL_AFTER - 2) ? 'bad' : ''); })()}
            ${ld ? kv('📥 Último mês', `${ld.n + (ld.me ? 1 : 0)} pagaram ${ld.paid.toLocaleString('pt-BR')} 🪙 · ${ld.dn} doaram ${ld.don} 🪙${ld.out ? ` · ${ld.out} expulsos` : ''}`) : kv('📥 Último mês', 'ainda não houve cobrança')}
            ${kv('🏛️ Manutenção do templo', this.temple() ? '20 🪙/mês' : '—')}`; })()}
          <div class="sec" style="margin-top:10px">📒 Livro da loja</div>${S.log.length ? S.log.map(l => `<div class="bank-log"><small>${Calendar.short(l.day)}</small> ${esc(l.t)}</div>`).join('') : '<p class="muted">Nada anotado ainda.</p>'}</div>
        <div class="card bk3-wide"><div class="sec">📈 Investimentos da sociedade <span>${tot.toLocaleString('pt-BR')} 🪙 aplicados</span></div>
          ${Object.entries(SOC2_FUNDS).map(([f, F]) => `<div class="crow"><span class="ri">${F.icon}</span><span><b>${F.name} · ${Math.round(S.inv[f] || 0).toLocaleString('pt-BR')} 🪙</b><small>${F.desc}${this.holder('tesoureiro') ? ' · +0,5% do Tesoureiro' : ''}</small></span>
            <span class="act-row">${Q.map(n => Bn('inv', f, n, `+${n}`, adm && S.vault >= n)).join('')}${Q.map(n => Bn('div', f, n, `−${n}`, adm && (S.inv[f] || 0) >= n)).join('')}</span></div>`).join('')}
          <small class="muted">O dinheiro sai do cofre da loja e volta para ele. ${adm ? '' : `Só a partir de ${SOC2_TITLES[2]} se decide.`}</small></div>`;
    } else if (tab === 'rede' && UI.sel.tpPick && SOC2_POSTS[UI.sel.tpPick]) {
      // escolher o irmão para um cargo
      const q = UI.sel.tpPick, Q2 = SOC2_POSTS[q], h = this.holder(q), L = this.pickList(), other = p => Object.keys(S.posts).find(x => x !== q && S.posts[x] === p.id);
      body = `<div class="card bk3-wide tp-pick"><div class="sec">${Q2.icon} Escolher o ${Q2.name} <span>${h ? `hoje: ${esc(People.full(h))}` : 'vago'}</span></div><p class="dt-desc">${Q2.desc} Pode assumir o irmão que você conhece e que confia em você (amizade 20+). Cada irmão ocupa um cargo só.</p>
          <div class="tp-plist">${L.length ? L.map(p => { const why = this.postWhy(p), o = other(p); return `<div class="crow ${h === p ? 'tp-mine' : ''}"><span class="ri">${G.civs.some(c => c.rulerId === p.id) ? '👑' : NOBLE_RANKS.includes(p.rank) ? '🎖️' : p.rank === 'knight' ? '🛡️' : '🔨'}</span><span><b>${esc(People.full(p))}</b><small>${esc(People.title ? People.title(p) : p.rank)} · ${p.met ? `amizade ${Math.round(p.aff || 0)}` : 'ainda não se conhecem'}${o ? ` · hoje é ${SOC2_POSTS[o].name}` : ''}${why ? ` · <i class="bad">${esc(why)}</i>` : ''}</small></span><span class="act-row">${h === p ? '<b class="ok">✓ no cargo</b>' : `<button class="${why ? '' : 'primary'}" data-act="tp" data-op="pick" data-k="${q}" data-i="${p.id}" ${why || !adm ? 'disabled' : ''}>Escolher</button>`}</span></div>`; }).join('') : '<p class="muted">A sua sociedade ainda não tem irmãos para os cargos.</p>'}</div>
          <div class="act-row tp-pbar"><button data-act="tp" data-op="pickx">◀ Voltar</button>${h ? `<button data-act="tp" data-op="vacate" data-k="${q}" ${adm ? '' : 'disabled'}>Deixar vago</button>` : ''}</div></div>`;
    } else if (tab === 'poder' && UI.sel.tpCand && /^[gk]\d+$/.test(UI.sel.tpCand)) {
      // indicar o irmão que vai assumir o governo da vila ou o trono
      const key = UI.sel.tpCand, cd = this.cand(key), L = this.candList(key), gov = key[0] === 'g', ci = gov ? -1 : +key.slice(1);
      body = `<div class="card bk3-wide tp-pick"><div class="sec">👤 Candidato para ${esc(this.seatName(key))} <span>${cd ? `hoje: ${esc(People.full(cd.p))} · apoio ${Math.round(this.support(key) * 100)}%` : 'ninguém indicado'}</span></div><p class="dt-desc">${gov ? 'O candidato precisa morar na vila. Quando a sociedade derrubar o governador, é ele quem assume' : 'Quando a sociedade derrubar o rei, é este irmão que sobe ao trono'}. Depois de indicar, invista nele na aba Poder: cada Salin vira apoio e aumenta a chance da trama.</p>
          <div class="tp-plist">${L.length ? L.map(p => { const why = this.candWhy(key, p); return `<div class="crow ${cd && cd.p === p ? 'tp-mine' : ''}"><span class="ri">${NOBLE_RANKS.includes(p.rank) ? '🎖️' : p.rank === 'knight' ? '🛡️' : '🔨'}</span><span><b>${esc(People.full(p))}</b><small>${esc(People.title ? People.title(p) : p.rank)} · ${esc(People.homeName ? People.homeName(p) : '')}${!gov && Lodges.civOf(p) === ci ? ' · do reino' : ''} · ${p.met ? `amizade ${Math.round(p.aff || 0)}` : 'ainda não se conhecem'}${why ? ` · <i class="bad">${esc(why)}</i>` : ''}</small></span><span class="act-row">${cd && cd.p === p ? '<b class="ok">✓ indicado</b>' : `<button class="${why ? '' : 'primary'}" data-act="tp" data-op="nom" data-k="${key}" data-i="${p.id}" ${why || !adm ? 'disabled' : ''}>Indicar</button>`}</span></div>`; }).join('') : `<p class="muted">${gov ? 'Nenhum irmão mora nesta vila. Recrute alguém de lá (aba Rede e cargos).' : 'A sua sociedade ainda não tem irmãos para o trono.'}</p>`}</div>
          <div class="act-row tp-pbar"><button data-act="tp" data-op="candx">◀ Voltar</button>${cd ? `<button data-act="tp" data-op="uncand" data-k="${key}" ${adm ? '' : 'disabled'}>Retirar a indicação</button>` : ''}</div></div>`;
    } else if (tab === 'rede') {
      const C = this.candidates(), tr = S.tried || {};
      body = `<div class="card"><div class="sec">🤝 Networking <span>uma vez por mês</span></div><p class="dt-desc">Um banquete no templo (50 🪙, do cofre ou do seu bolso): você conhece irmãos, a amizade com eles sobe e a influência da loja cresce.</p>
          <div class="act-row">${B('net', 0, this.netOk() ? '🍷 Reunir os irmãos' : '✔ Os irmãos já se reuniram', !!this.temple() && this.netOk())}</div>${this.temple() ? '' : '<small class="muted">Precisa do Templo da Sociedade.</small>'}
          <div class="sec" style="margin-top:10px">🏅 Cargos da loja</div>${Object.entries(SOC2_POSTS).map(([q, Q2]) => { const h = this.holder(q); return `<div class="crow"><span class="ri">${Q2.icon}</span><span><b>${Q2.name}: ${h ? esc(People.full(h)) : '<i>vago</i>'}</b><small>${Q2.desc}</small></span><span class="act-row">${B('post', q, h ? '👤 Trocar' : '👤 Escolher', adm && k !== 'own')}</span></div>`; }).join('')}</div>
        <div class="card bk3-wide"><div class="sec">🎖️ Recrutar gente importante <span>${C.length} que você conhece</span></div><p class="dt-desc">Nobres, cavaleiros, mercadores, governadores e reis que você conhece. A chance sobe com a amizade e o poder da sociedade; cada um ouve a proposta uma vez por mês.</p>
          ${C.length ? C.map(p => `<div class="crow"><span class="ri">${G.civs.some(c => c.rulerId === p.id) ? '👑' : NOBLE_RANKS.includes(p.rank) ? '🎖️' : p.rank === 'knight' ? '🛡️' : '💼'}</span><span><b>${esc(People.full(p))}</b><small>${esc(People.title ? People.title(p) : p.rank)} · amizade ${Math.round(p.aff || 0)}</small></span><span class="act-row">${B('rec', p.id, tr[p.id] === G.day ? 'Já ouviu' : '🕯️ Convidar', k !== 'own' && tr[p.id] !== G.day)}</span></div>`).join('') : '<p class="muted">Conheça nobres, cavaleiros e mercadores (converse com eles) para poder recrutá-los.</p>'}</div>`;
    } else if (tab === 'poder') {
      const gv = this.govTargets(), kt = this.kingTargets(), ok = pw.power >= this.KING_POWER;
      body = `<div class="card"><div class="sec">⚖️ Bem ou mal <span>${this.karmaName()}</span></div><i class="ex-risk tp-karma"><i style="width:${Math.round((S.karma + 100) / 2)}%"></i></i>
          <p class="dt-desc">O poder da irmandade serve ao bem e ao mal. O povo e as famílias sabem que você é da sociedade: quanto mais temida, menos gente ousa enfrentar a sua família.</p>
          <div class="crow"><span class="ri">🍞</span><span><b>Obras de caridade</b><small>500 🪙 do cofre · o povo dos reinos fica mais feliz, +fama</small></span><span class="act-row">${B('charity', 0, 'Fazer', S.vault >= 500)}</span></div>
          <div class="crow"><span class="ri">😨</span><span><b>Intimidar os rivais</b><small>300 🪙 do cofre · as famílias engolem o rancor, a irmandade fica temida</small></span><span class="act-row">${B('fear', 0, 'Fazer', S.vault >= 300)}</span></div></div>
        <div class="card"><div class="sec">🏘️ Governadores <span>${adm ? 'derrubar: 800 🪙' : 'Mestre'}</span></div>
          ${gv.length ? gv.map(x => { const key = 'g' + x.vi, cd = this.cand(key), sp = this.support(key); return `<div class="crow tp-seat"><span class="ri">🏘️</span><span><b>${esc(x.v.name)}</b><small>${esc(People.full(x.p))} · ${x.v.free ? 'vila livre' : CIV_DEFS[x.v.civ].short} · chance ${Math.round(this.govChance(x.vi) * 100)}%</small>${cd ? `<small class="tp-cd">👤 ${esc(cd.p.name)} · apoio ${Math.round(sp * 100)}%<i class="ex-risk"><i style="width:${Math.round(sp * 100)}%"></i></i></small>` : ''}</span><span class="act-row">${B('cand', key, cd ? '👤 Trocar' : '👤 Indicar', adm && k !== 'own')}${cd ? Q.map(n => Bn('cinv', key, n, `+${n}`, adm && (S.vault >= n || P.gold >= n))).join('') : ''}${B('gov', x.vi, cd ? 'Derrubar e empossar' : 'Derrubar', adm && S.vault >= 800)}</span></div>`; }).join('') : '<p class="muted">Nenhum governador que não seja irmão.</p>'}</div>
        <div class="card"><div class="sec">👑 Reis <span>derrubar: ${this.KING_COST} 🪙 · poder ${this.KING_POWER}+</span></div>${ok ? '' : `<p class="dt-desc">A sociedade tem poder ${pw.power}: recrute gente importante, faça networking e encha o cofre para chegar a ${this.KING_POWER}.</p>`}
          ${kt.map(c => { const key = 'k' + c.id, cd = this.cand(key), sp = this.support(key), ch = this.kingChance(c.id); return `<div class="crow tp-seat"><span class="ri">👑</span><span><b>${esc(c.rulerName)}</b><small>${CIV_DEFS[c.id].short} · guarnição ${c.garrison || 0} · chance ${Math.round(ch * 100)}%</small>${cd ? `<small class="tp-cd">👤 ${esc(cd.p.name)} · apoio ${Math.round(sp * 100)}%<i class="ex-risk"><i style="width:${Math.round(sp * 100)}%"></i></i></small>` : ''}</span><span class="act-row">${B('cand', key, cd ? '👤 Trocar' : '👤 Indicar', adm && k !== 'own')}${cd ? Q.map(n => Bn('cinv', key, n, `+${n}`, adm && (S.vault >= n || P.gold >= n))).join('') : ''}${B('king', c.id, cd ? 'Derrubar e coroar' : 'Derrubar', adm && ok && S.vault >= this.KING_COST)}</span></div>`; }).join('') || '<p class="muted">Todos os reis já são irmãos.</p>'}</div>`;
    } else {
      const K = KOrders.S(), m = K.mission, M = m && KO_MISSIONS[m.k], best = S.best[k] || 0;
      body = `<div class="card"><div class="sec">📜 Missão do mês</div>${r >= 3 || k === 'own' ? '<div class="sc-mis"><span>⚜️</span><div><b>Sem missões: você administra a sociedade</b><small>No grau mais alto não há mais missões. Cuide da mensalidade, dos cargos, do cofre e do poder da irmandade.</small></div></div>' : m ? `<div class="sc-mis"><span>${M.icon}</span><div><b>${M.text}</b>${M.how ? `<small class="scx-how">💡 ${M.how}</small>` : ''}<small>${M.stat ? `progresso ${Math.min(KOrders.progress(), M.need)}/${M.need} · ` : ''}até ${Calendar.short(m.until)}</small>${M.go ? `<button data-act="kogo" data-k="${M.go}">${M.goTxt || 'Ir'}</button>` : ''}</div></div>` : '<p class="muted">A próxima missão chega no mês que vem.</p>'}
          <div class="sec" style="margin-top:10px">🪜 Graus</div>${SOC2_TITLES.map((n, i) => `<div class="crow ${i <= r ? 'tp-mine' : ''}"><span class="ri">${i < r ? '✔' : i === r ? '★' : '·'}</span><span><b>${n}</b><small>${KO_RANKS[i] ? `${KO_RANKS[i][1]} missões cumpridas` : ''}${i === 3 ? ' e 120 de fama' : ''}</small></span><span></span></div>`).join('')}
          <small class="muted">Grau conquistado não se perde: perder o prazo tira pontos, mas o seu grau mais alto (${SOC2_TITLES[Math.max(r, best)]}) fica.</small></div>
        <div class="card bk3-wide"><div class="sec">🗺️ Missões que a sociedade dá <span>${Object.keys(KO_MISSIONS).length}</span></div>${Object.entries(KO_MISSIONS).map(([q, X]) => `<div class="crow ${d.likes && d.likes.includes(q) ? 'tp-mine' : ''}"><span class="ri">${X.icon}</span><span><b>${X.text}</b><small>${d.likes && d.likes.includes(q) ? 'a sua sociedade gosta desta' : 'pode aparecer'}</small></span><span></span></div>`).join('')}</div>`;
    }
    const rail = this.TABS.map(([t, l]) => { const m2 = l.match(/^(\S+)\s+(.*)$/); return `<button class="bk3-tab ${t === tab ? 'on' : ''}" data-act="tp" data-op="tab" data-k="${t}"><span class="bk3-ti">${m2[1]}</span><span class="bk3-tl"><b>${m2[2]}</b><small>${t === 'tesouro' ? Math.round(S.vault).toLocaleString('pt-BR') + ' 🪙' : t === 'poder' ? 'poder ' + pw.power : t === 'loja' ? this.title() : t === 'rede' ? (this.netOk() ? 'reunião disponível' : 'reunião feita') : (r >= 3 ? 'sem missões' : KOrders.S().mission ? 'missão ativa' : '')}</small></span></button>`; }).join('');
    const html = `<div class="bk3 tp3" style="--c:${d.col};--x:${d.cross}"><aside class="bk3-rail"><div class="bk3-id"><span class="bk3-seal tp-seal">${d.icon}</span><span><b>${esc(d.name)}</b><small>${esc(this.title())}</small></span></div>
        <nav class="bk3-tabs">${rail}</nav><div class="bk3-purse"><small>Cofre da loja</small><b>${Math.round(S.vault).toLocaleString('pt-BR')} 🪙</b></div></aside>
      <section class="bk3-main"><header class="bk3-top"><span class="bk3-pi">${(this.TABS.find(t => t[0] === tab) || this.TABS[0])[1].split(' ')[0]}</span><span class="bk3-pt"><b>${(this.TABS.find(t => t[0] === tab) || this.TABS[0])[1].replace(/^\S+\s+/, '')}</b><small>${esc(d.motto || d.oath || '')}</small></span><span class="bk3-chips"><span class="bk3-chip">⚔️ poder ${pw.power}</span><span class="bk3-chip">🪙 ${P.gold.toLocaleString('pt-BR')} no bolso</span></span>${(tab === 'tesouro' || tab === 'poder') && typeof BankView !== 'undefined' ? `<span class="bk3-amtsel"><small>Valor</small>${BankView.AMTS.map(a => `<button type="button" data-amt="${a}" class="${a === BankView.amt ? 'on' : ''}">${a.toLocaleString('pt-BR')}</button>`).join('')}</span>` : ''}</header>
        <div class="bk3-body" data-tab="tp-${tab}">${body}</div></section></div>`;
    UI.open(`🏛️ Templo da ${d.name}`, html, 'showTemple', [tab], this.title());
    if (typeof BankView !== 'undefined') {
      BankView.compact(UI.panel.querySelector('.bk3-body'));
      const sel = UI.panel.querySelector('.bk3-amtsel');
      if (sel) sel.addEventListener('click', ev => { const b = ev.target.closest('button[data-amt]'); if (!b) return; ev.stopPropagation(); BankView.amt = +b.dataset.amt; for (const x of sel.querySelectorAll('button')) x.classList.toggle('on', x === b); BankView.applyAmt(UI.panel); });
      BankView.fit('tp-' + tab); requestAnimationFrame(() => { if (UI.cur && UI.cur.fn === 'showTemple') BankView.fit('tp-' + tab); });
    }
  },
};
if (!WIDE_PANELS.includes('showTemple')) WIDE_PANELS.push('showTemple');

{
  // grau conquistado não se perde
  const rk0 = KOrders.rank.bind(KOrders);
  KOrders.rank = function () { const r = rk0(), K = this.S(); if (!K.key || K.key === 'own') return r; const S = Soc2.S(); const b = S.best[K.key] || 0; if (r > b) S.best[K.key] = r; return Math.max(r, b); };
  const lv0 = KOrders.leave.bind(KOrders);
  KOrders.leave = function (...a) { const k = this.S().key; const r = lv0(...a); if (k) { const S = Soc2.S(); delete S.best[k]; S.posts = {}; S.cand = {}; } return r; };
  // contadores das missões novas
  const tk0 = People.talk.bind(People);
  People.talk = function (p, ...r) { const res = tk0(p, ...r); try { if (p && Secret.myBro(p)) { const S = Soc2.S(); S.talked = S.talked || {}; if (S.talked[p.id] !== G.day) { S.talked[p.id] = G.day; Progress.add('soc_talk'); Soc2.check(); } } } catch (e) { console.error(e); } return res; };
  const gf0 = People.gift.bind(People);
  People.gift = function (p, ...r) { const res = gf0(p, ...r); try { if (p && (NOBLE_RANKS.includes(p.rank) || p.rank === 'knight')) { Progress.add('soc_gift'); Soc2.check(); } } catch (e) { console.error(e); } return res; };
  // as famílias temem a sua irmandade: só as muito poderosas declaram guerra à sua família
  const nw0 = Court.npcWar.bind(Court);
  Court.npcWar = function (p) {
    if (p && Secret.member()) {
      const f = Families.of(p), bar = Soc2.fearBar();
      if (f && !f.player && Families.influence(f) < bar) {
        if (Math.random() < 0.35) UI.msg(`😨 ${People.full(p)} pensou em declarar guerra à sua família, mas teme a ${Soc2.def().name}.`, 'gold');
        return false;
      }
    }
    return nw0(p);
  };
  // o templo no mapa: desenho, aviso e janela
  const dx0 = typeof drawStructExtra === 'function' ? drawStructExtra : null;
  // eslint-disable-next-line no-global-assign
  drawStructExtra = function (ctx, s, X, Y, time, H) {
    if (s.type !== 'soc_temple') return dx0 && dx0(ctx, s, X, Y, time, H);
    const { R, w, h, shadow } = H, d = Soc2.def() || { col: '#6a5a8a', cross: '#e8d8a0', icon: '🕯️' };
    shadow();
    R(4, h - 18, w - 8, 14, '#8e877a'); R(4, h - 6, w - 8, 3, '#6e675a');                // escadaria
    R(10, 28, w - 20, h - 46, '#d8d2c4');                                                 // paredes
    for (let k = 0; k < 5; k++) { const x = 12 + k * ((w - 30) / 4); R(x, 30, 6, h - 50, '#efeae0'); R(x, 30, 6, 3, '#bdb6a6'); } // colunas
    ctx.fillStyle = d.col; ctx.beginPath(); ctx.moveTo(X + 2, Y + 30); ctx.lineTo(X + w / 2, Y + 4); ctx.lineTo(X + w - 2, Y + 30); ctx.fill(); // frontão
    ctx.fillStyle = d.cross; ctx.fillRect(X + 2, Y + 28, w - 4, 3);
    R(w / 2 - 8, h - 38, 16, 20, '#3a2a1e');                                              // porta
    ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.fillStyle = d.cross; ctx.fillText(d.icon, X + w / 2, Y + 24); ctx.textAlign = 'left';
    if (G.darkness > 0.2) { const f = 0.7 + Math.sin(time * 3) * 0.2; R(w / 2 - 6, h - 36, 12, 4, U.rgba('#ffcf6b', f)); }
  };
  const il0 = Game.interactLabel.bind(Game);
  Game.interactLabel = function (s) { if (s && s.type === 'soc_temple') return `Templo da sociedade — ${Secret.member() ? 'a loja dos irmãos' : 'fechado para quem não é irmão'}`; return il0(s); };
  const ci0 = Content2.interact.bind(Content2);
  Content2.interact = function (s) { if (s && s.type === 'soc_temple') { Soc2.show('loja'); return true; } return ci0(s); };
  UI.showTemple = tab => Soc2.show(tab);
  // só quem é de uma sociedade ergue o templo
  const cb0 = Game.canBuild.bind(Game);
  Game.canBuild = function (k, ...a) { if (k === 'soc_temple') { if (!Secret.member()) return 'Só quem é de uma sociedade secreta ergue o templo dela'; if (Soc2.temple()) return 'A sua sociedade já tem um templo'; } return cb0(k, ...a); };
  // no menu Construir: Baús e estábulo (a categoria que todo mundo vê; o templo é ao ar livre, sem lado de dentro)
  UI.expCats = UI.expCats || {}; UI.expCats.guarda = [...new Set([...(UI.expCats.guarda || []), 'soc_temple'])];
  // o mês da loja
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Soc2.monthTick(); } catch (e) { console.error(e); } };
  // a página das sociedades ganha a porta do templo
  const pg0 = Secret.page.bind(Secret);
  // a página de quem é da sociedade: uma faixa com o grau e três quadros (missão, benefícios, irmãos) que cabem na janela
  Secret.page = function () { try { return Secret.member() ? Soc2.memberPage() : Soc2.outsiderPage(); } catch (e) { console.error(e); return pg0(); } };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'tp') return a0(a, d);
    const n = d.n === 'all' ? Infinity : +d.n, cur = UI.cur && UI.cur.fn === 'showTemple' ? UI.cur.args[0] : 'loja';
    switch (d.op) {
      case 'tab': UI.sel.tpPick = null; UI.sel.tpCand = null; Soc2.show(d.k); return;
      case 'vin': Soc2.vaultIn(n); break;
      case 'vout': Soc2.vaultOut(n); break;
      case 'inv': Soc2.invest(d.k, n); break;
      case 'div': Soc2.divest(d.k, n); break;
      case 'net': Soc2.network(); break;
      case 'rec': Soc2.recruit(+d.k); break;
      case 'post': UI.sel.tpPick = d.k; break;
      case 'pick': if (Soc2.appoint(d.k, +d.i)) UI.sel.tpPick = null; break;
      case 'vacate': Soc2.vacate(d.k); UI.sel.tpPick = null; break;
      case 'pickx': UI.sel.tpPick = null; break;
      case 'cand': UI.sel.tpCand = d.k; break;
      case 'nom': if (Soc2.nominate(d.k, +d.i)) UI.sel.tpCand = null; break;
      case 'uncand': if (Soc2.admin()) delete Soc2.S().cand[d.k]; UI.sel.tpCand = null; break;
      case 'candx': UI.sel.tpCand = null; break;
      case 'cinv': Soc2.backCand(d.k, n); break;
      case 'gov': Soc2.topGov(+d.k); break;
      case 'king': { const ci = +d.k; Dialog.confirm({ icon: '👑', title: 'Derrubar um rei', danger: true, ok: 'Mover a sociedade', text: `Gastar ${Soc2.KING_COST} 🪙 do cofre para derrubar ${G.civs[ci].rulerName}? Se falhar, ${CIV_DEFS[ci].short} vai odiar você.` }, () => { Soc2.topKing(ci); Soc2.show('poder'); }); return; }
      case 'charity': Soc2.charity(); break;
      case 'dues': { const el = document.getElementById('tpDues'), v = el ? String(el.value).trim() : String(d.k); Soc2.setDues(v === '' ? NaN : +v); break; }
      case 'fear': Soc2.intimidate(); break;
    }
    Soc2.show(cur);
  };
}

{
  // no grau mais alto (Grão-Mestre) acabam as missões: você administra a sociedade
  const nm0 = KOrders.newMission.bind(KOrders);
  KOrders.newMission = function (...a) { const S = this.S(); if (S.key && S.key !== 'own' && this.rank() >= KO_RANKS.length - 1) { S.mission = null; return; } return nm0(...a); };
  const pr0 = KOrders.promote.bind(KOrders);
  KOrders.promote = function (r, ...a) { const res = pr0(r, ...a); if (r >= KO_RANKS.length - 1 && this.S().key !== 'own') { this.S().mission = null; UI.msg('⚜️ No grau mais alto não há mais missões: agora você administra a sociedade (mensalidade, cargos, cofre e poder).', 'gold', true); } return res; };
  const kt0 = KOrders.monthTick.bind(KOrders);
  KOrders.monthTick = function (...a) { const S = this.S(); if (S.key && S.key !== 'own' && this.rank() >= KO_RANKS.length - 1) { S.mission = null; for (const p of this.knights()) { this.dress(p); if (p.korderWait) this.call(p); } return; } const r = kt0(...a); for (const p of this.knights()) this.dress(p); return r; };
  // quem foi expulso deixa de ser irmão (mesmo que o ofício dele seja de uma guilda da sociedade)
  const ib0 = Secret.isBro.bind(Secret);
  Secret.isBro = function (p, k) { return !!p && p.socOut !== k && ib0(p, k); };
  // o governador caiu ou morreu: o candidato da sociedade com apoio de 50%+ assume
  if (typeof Integrity !== 'undefined') {
    const va0 = Integrity.vacate.bind(Integrity);
    Integrity.vacate = function (vi, ...a) {
      const r = va0(vi, ...a);
      try { if (Secret.member() && Soc2.support('g' + vi) >= 0.5) { const c = Soc2.cand('g' + vi); Soc2.seatGov(vi, c.p); const t = `👤 ${People.full(c.p)}, o candidato da sociedade, assumiu o governo de ${World.villages[vi].name}.`; Soc2.log(t); UI.msg(t, 'gold', true); } } catch (e) { console.error(e); }
      return r;
    };
  }
}

// o botão da missão (ex.: abrir o menu Construir)
{ const a0 = UI.act.bind(UI); UI.act = function (a, d) { if (a === 'kogo') { if (typeof this[d.k] === 'function') { this.close(); this[d.k](); } return; } return a0(a, d); }; }
// a missão é conferida assim que o que ela conta anda (ex.: a 2ª construção cumpre "construir 2 coisas" na hora,
// sem esperar a virada do mês)
{
  const pa0 = Progress.add.bind(Progress);
  Progress.add = function (k, ...a) {
    const r = pa0(k, ...a);
    try { const m = KOrders.S().mission, M = m && KO_MISSIONS[m.k]; if (M && M.stat === k) Soc2.check(); } catch (e) { /* sem sociedade */ }
    return r;
  };
}

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
  wolves:      { icon: '🐺', text: 'Cace 5 lobos que ameaçam os irmãos.', stat: 'kill_wolf', need: 5 },
  crypt:       { icon: '💀', text: 'Derrote 6 esqueletos nas criptas das cavernas.', stat: 'kill_skeleton', need: 6 },
  camps2:      { icon: '🔥', text: 'Destrua 2 acampamentos de bandidos.', stat: 'camps', need: 2 },
  build:       { icon: '🏗️', text: 'Erga 2 construções em nome da sociedade.', stat: 'built', need: 2 },
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
  S() { const u = G.urban || (G.urban = {}); const s = u.soc2 || (u.soc2 = {}); s.best = s.best || {}; s.inv = s.inv || {}; s.posts = s.posts || {}; s.log = s.log || []; s.vault = s.vault || 0; s.infl = s.infl || 0; s.karma = s.karma || 0; return s; },
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
      p.ssoc = k; S.infl += G.civs.some(c => c.rulerId === p.id) ? 15 : NOBLE_RANKS.includes(p.rank) ? 6 : 3; People.addAff(p, 10); Progress.add('soc_recruit');
      const t = `🎖️ ${People.full(p)} fez o juramento: agora é irmão da ${SECRET_SOC[k].name}.`; this.log(t); UI.msg(t, 'gold', true); this.check();
    } else { People.addAff(p, -4); UI.msg(`${People.full(p)} recusou o convite secreto (chance era ${Math.round(ch * 100)}%).`, 'bad'); }
  },
  postable() { const k = this.key(); if (!k || k === 'own') return []; return Secret.brothers(k).filter(p => p.met && p.age >= 18 && (p.aff || 0) >= 20); },
  appoint(post) {
    if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se nomeiam os cargos.`, 'bad'); return; }
    const S = this.S(), L = this.postable(); if (!L.length) { UI.msg('Nenhum irmão que você conhece e confia em você (amizade 20+).', 'bad'); return; }
    const cur = L.findIndex(p => p.id === S.posts[post]), nx = L[(cur + 1) % L.length];
    for (const k in S.posts) if (S.posts[k] === nx.id) delete S.posts[k];
    S.posts[post] = nx.id; People.addAff(nx, 5);
    this.log(`${SOC2_POSTS[post].icon} ${People.full(nx)} agora é ${SOC2_POSTS[post].name} da loja.`);
  },
  holder(post) { const id = this.S().posts[post], p = id !== undefined && People.get(id); return p && p.alive ? p : null; },
  // ---------------------------------------------------------------- poder: governadores, reis, bem e mal
  govTargets() {
    return World.villages.map((v, vi) => ({ v, vi, p: v && v.chief !== undefined && v.chief !== null ? People.get(v.chief) : null }))
      .filter(x => x.v && !x.v.ruin && x.p && x.p.alive && x.v.lord !== 'player' && !(G.civs[x.v.civ] && G.civs[x.v.civ].ruler === 'player') && !Secret.myBro(x.p))
      .sort((a, b) => U.dist(a.v.x, a.v.y, P.x / TILE, P.y / TILE) - U.dist(b.v.x, b.v.y, P.x / TILE, P.y / TILE)).slice(0, 8);
  },
  topGov(vi) {
    if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se move a sociedade contra um governador.`, 'bad'); return; }
    const v = World.villages[vi], old = v && People.get(v.chief); if (!old) return;
    if (!this.spend(800)) return;
    const k = this.key(), pw = this.power(k).power, ch = U.clamp(0.3 + pw / 400, 0.2, 0.9);
    if (Math.random() < ch) {
      const bro = k !== 'own' ? People.residents(vi).find(p => p.age >= 20 && Secret.isBro(p, k) && p !== old) : null;
      if (bro) v.chief = bro.id; else delete v.chief;
      this.S().infl += 6;
      const t = `🕯️ A sociedade derrubou ${People.full(old)}, governador de ${v.name}${bro ? `: o irmão ${People.full(bro)} assumiu` : ''}.`;
      this.log(t); UI.msg(t, 'gold', true); Diplo.chronicle(`🕯️ ${People.full(old)} perdeu o governo de ${v.name} de uma hora para outra. Sussurram sobre uma irmandade.`, true);
    } else { this.S().karma -= 3; UI.msg(`🕯️ A trama contra ${People.full(old)} falhou (chance ${Math.round(ch * 100)}%). O dinheiro foi perdido.`, 'bad', true); if (G.civs[v.civ]) Game.addRelation(v.civ, -10); }
  },
  kingTargets() { return G.civs.filter(c => c && !c.dead && !c.anarchy && c.ruler !== 'player' && c.rulerId != null && !Secret.kingBro(c.id)); },
  KING_COST: 3000, KING_POWER: 120,
  topKing(ci) {
    if (!this.admin()) { UI.msg(`Só a partir de ${SOC2_TITLES[2]} se move a sociedade contra um rei.`, 'bad'); return; }
    const k = this.key(), pw = this.power(k).power, c = G.civs[ci];
    if (!c || c.ruler === 'player') return;
    if (pw < this.KING_POWER) { UI.msg(`A sociedade ainda não tem poder para derrubar um rei (precisa de ${this.KING_POWER}, tem ${pw}).`, 'bad'); return; }
    if (!this.spend(this.KING_COST)) return;
    const ch = U.clamp(0.25 + pw / 600 - (c.garrison || 0) / 120 + this.rank() * 0.05, 0.1, 0.85), king = People.get(c.rulerId), old = c.rulerName;
    if (Math.random() < ch && king) {
      let heir = k !== 'own' ? Secret.brothers(k).filter(p => p.alive && p.age >= 20 && p !== king && !p.capanga && !p.kin && p.spouse !== 'player' && !G.civs.some(o => o.rulerId === p.id)).sort((a, b) => (Families.civOf ? (Families.civOf(b) === ci) - (Families.civOf(a) === ci) : 0) || NOBLE_RANKS.includes(b.rank) - NOBLE_RANKS.includes(a.rank))[0] : null;
      People.die(king, 'derrubado por uma sociedade secreta');
      if (heir) { for (const p of G.people) if (p.alive && p.rank === 'ruler' && p.civ === ci && p !== heir) p.rank = 'knight'; Succession.seat(c, heir, 'ruler'); }
      c.happy = Math.max(0, (c.happy || 50) - 8); if (typeof Heraldry !== 'undefined') Heraldry.apply();
      this.S().infl += 25; Court.addFame(10);
      const t = `👑 A sociedade derrubou ${old}${heir ? ` e pôs o irmão ${People.full(heir)} no trono de ${CIV_DEFS[ci].short}` : ''}.`;
      this.log(t); UI.banner(`🕯️ Queda do rei de ${CIV_DEFS[ci].short}`); UI.msg(t, 'gold', true); Diplo.chronicle(`🗡️ ${old} caiu em ${CIV_DEFS[ci].name}. Nas tavernas, falam de mãos escondidas.`, true);
      Progress.diary(`🕯️ Derrubou ${old} pela sociedade secreta.`);
    } else {
      this.S().karma -= 8; Game.addRelation(ci, -30);
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
    const due = this.duesValue(); let paid = 0, n = 0, don = 0, dn = 0, me = 0;
    if (k !== 'own') for (const p of Secret.brothers(k)) {
      if (!p.alive || p.age < 18 || p.capanga) continue;
      const pu = People.purse(p);
      if (due > 0 && pu >= due) { p.purse = pu - due; paid += due; n++; }
      if (Math.random() < 0.12) { const left = People.purse(p), g = Math.max(5, Math.round(left * U.rnd(0.02, 0.08))); if (left >= g + 10) { p.purse = left - g; don += g; dn++; } }
    }
    if (!this.leader() && due > 0) {
      if (P.gold >= due) { P.gold -= due; me = due; paid += due; S.miss = 0; }
      else { S.miss = (S.miss || 0) + 1; UI.msg(`🕯️ Você não pagou a mensalidade da sociedade (${due} 🪙). Atrasos: ${S.miss}/3.`, 'bad', true); if (S.miss >= 3) { S.miss = 0; KOrders.violate('deixou de pagar as mensalidades'); } }
    }
    S.vault += paid + don; S.lastDues = { day: G.day, due, n, paid, don, dn, me };
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
  DUES_OPTS: [0, 5, 10, 20, 50, 100],
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
    const S = this.S(); S.dues = Math.max(0, Math.round(n)); S.duesKey = this.key();
    this.log(`📅 A mensalidade passou a ${S.dues} 🪙 por mês.`);
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
    const mis = own ? `<div class="scx-mis"><span>⚜️</span><div><b>Você é ${typeof SocLore !== 'undefined' ? esc(SocLore.of('own').head) : 'o líder'} da sua sociedade</b><small>A sua palavra é a lei: não há missões a cumprir.</small></div></div>`
      : m ? `<div class="scx-mis"><span>${M.icon}</span><div><b>${M.text}</b><small>até ${Calendar.short(m.until)} · vale +5 de fama e 1 missão para o grau</small>${M.stat ? `<i class="scx-bar"><i style="width:${Math.round(prog / M.need * 100)}%"></i></i><em>${prog}/${M.need}</em>` : ''}
          ${m.k === 'donate' ? `<button class="primary" data-act="ko" data-op="donate" ${P.gold >= 250 ? '' : 'disabled'}>💰 Doar 250 🪙</button>` : ''}</div></div>`
      : '<p class="muted">A próxima missão chega no mês que vem.</p>';
    const oath = `<div class="scx-oath"><span>⚖️</span><div><b>Juramento</b><small>${esc(d.oath)}</small></div>${own ? '' : `<span class="scx-pips" title="quebras do juramento">${[0, 1, 2].map(i => `<i class="${i < viol ? 'on' : ''}"></i>`).join('')}</span>`}</div>`;
    const letters = S2.secrets.length ? S2.secrets.slice(0, 8).map(x => `<div class="scx-letter"><em>${Calendar.short(x.day)}</em><span>${esc(x.t)}</span></div>`).join('') : `<p class="muted">${r >= 1 ? 'Nenhuma carta neste mês.' : 'Os irmãos contam segredos a partir de Companheiro.'}</p>`;
    const cardA = `<section class="card scx-card scx-a"><div class="sec">📜 Missão secreta ${own ? '' : 'do mês'}</div>${mis}${oath}
        <div class="sec scx-sub">🕯️ Cartas lacradas <span>segredos</span></div><div class="scx-list">${letters}</div></section>`;
    // quadro 2: o que a sociedade faz por você e o poder dela
    const ben = Secret.benefits(r, k).map(b => `<div class="scx-ben"><span>${b[0]}</span><b>${b[1]}</b><small>${esc(b[2])}</small></div>`).join('');
    const cardB = `<section class="card scx-card scx-b"><div class="sec">✨ O que a sociedade faz por você</div><div class="scx-bens">${ben}</div>
        <div class="scx-stats"><div><small>⚔️ Poder</small><b>${pw.power}</b></div><div><small>🕯️ Influência</small><b>${pw.infl}</b></div><div><small>💰 Cofre da loja</small><b>${Math.round(S.vault).toLocaleString('pt-BR')}</b></div><div><small>📅 Mensalidade</small><b>${this.duesValue()} 🪙</b></div></div></section>`;
    // quadro 3: irmãos poderosos e cavaleiros que seguem você
    const p2 = k ? Secret.powerful(k) : null, cname = p => { const c = G.civs.find(x => x.rulerId === p.id); return c && CIV_DEFS[c.id] ? CIV_DEFS[c.id].short : '?'; };
    const bros = p2 ? [...p2.kings.map(p => ['👑', p, `Rei de ${cname(p)}`]), ...p2.nobles.map(p => ['🎖️', p, People.title(p)]), ...p2.knights.map(p => ['🛡️', p, People.title(p)])] : [];
    const kn = KOrders.knights();
    const cardC = `<section class="card scx-card scx-c"><div class="sec">🤝 Irmãos poderosos <span>${k ? `${Secret.brothers(k).length} irmãos` : 'a sua sociedade'}</span></div>
        <div class="scx-list">${bros.length ? bros.map(([ic, p, t]) => `<div class="scx-bro"><span>${ic}</span><b>${esc(People.full(p))}</b><small>${esc(t)}${p.met ? ` · amizade ${Math.round(p.aff || 0)}` : ''}</small></div>`).join('') : '<p class="muted">Nenhum rei, nobre ou cavaleiro entre os irmãos ainda.</p>'}
          ${p2 && p2.crafts ? `<small class="muted scx-crafts">🔨 e ${p2.crafts} mestres de ofício${Commerce.GUILDS[k] ? ` (${esc(Commerce.GUILDS[k].trade)})` : ''}</small>` : ''}</div>
        <div class="sec scx-sub">🛡️ Cavaleiros que seguem você <span>${kn.length}</span></div>
        <div class="scx-kn">${kn.length ? kn.map(p => `<span class="scx-chip">${d.icon} ${esc(People.full(p))}${p.korderWait ? ' · esperando vaga' : ''}</span>`).join('') : `<small class="muted">${r >= 1 ? 'Nenhum cavaleiro agora.' : 'A partir de Companheiro a sociedade manda cavaleiros.'}</small>`}
          ${r >= 1 ? '<button data-act="ko" data-op="armor">🛡️ Pegar o manto</button>' : ''}</div></section>`;
    return top + cardA + cardB + cardC;
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
    const Q = [100, 500, 1000, 5000];
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
            ${lead ? `<div class="act-row tp-dues">${this.DUES_OPTS.map(v => `<button class="${v === due ? 'on' : ''}" data-act="tp" data-op="dues" data-k="${v}">${v ? v + ' 🪙' : 'Grátis'}</button>`).join('')}</div>` : kv('Você paga', `${due} 🪙 por mês${S.miss ? ` · ${S.miss}/3 atrasos` : ''}`, S.miss ? 'bad' : '')}
            ${ld ? kv('📥 Último mês', `${ld.n + (ld.me ? 1 : 0)} pagaram ${ld.paid} 🪙 · ${ld.dn} doaram ${ld.don} 🪙`) : kv('📥 Último mês', 'ainda não houve cobrança')}
            ${kv('🏛️ Manutenção do templo', this.temple() ? '20 🪙/mês' : '—')}`; })()}
          <div class="sec" style="margin-top:10px">📒 Livro da loja</div>${S.log.length ? S.log.map(l => `<div class="bank-log"><small>${Calendar.short(l.day)}</small> ${esc(l.t)}</div>`).join('') : '<p class="muted">Nada anotado ainda.</p>'}</div>
        <div class="card bk3-wide"><div class="sec">📈 Investimentos da sociedade <span>${tot.toLocaleString('pt-BR')} 🪙 aplicados</span></div>
          ${Object.entries(SOC2_FUNDS).map(([f, F]) => `<div class="crow"><span class="ri">${F.icon}</span><span><b>${F.name} · ${Math.round(S.inv[f] || 0).toLocaleString('pt-BR')} 🪙</b><small>${F.desc}${this.holder('tesoureiro') ? ' · +0,5% do Tesoureiro' : ''}</small></span>
            <span class="act-row">${Q.map(n => Bn('inv', f, n, `+${n}`, adm && S.vault >= n)).join('')}${Q.map(n => Bn('div', f, n, `−${n}`, adm && (S.inv[f] || 0) >= n)).join('')}</span></div>`).join('')}
          <small class="muted">O dinheiro sai do cofre da loja e volta para ele. ${adm ? '' : `Só a partir de ${SOC2_TITLES[2]} se decide.`}</small></div>`;
    } else if (tab === 'rede') {
      const C = this.candidates(), tr = S.tried || {};
      body = `<div class="card"><div class="sec">🤝 Networking <span>uma vez por mês</span></div><p class="dt-desc">Um banquete no templo (50 🪙, do cofre ou do seu bolso): você conhece irmãos, a amizade com eles sobe e a influência da loja cresce.</p>
          <div class="act-row">${B('net', 0, this.netOk() ? '🍷 Reunir os irmãos' : '✔ Os irmãos já se reuniram', !!this.temple() && this.netOk())}</div>${this.temple() ? '' : '<small class="muted">Precisa do Templo da Sociedade.</small>'}
          <div class="sec" style="margin-top:10px">🏅 Cargos da loja</div>${Object.entries(SOC2_POSTS).map(([q, Q2]) => { const h = this.holder(q); return `<div class="crow"><span class="ri">${Q2.icon}</span><span><b>${Q2.name}: ${h ? esc(People.full(h)) : '<i>vago</i>'}</b><small>${Q2.desc}</small></span><span class="act-row">${B('post', q, h ? 'Trocar' : 'Nomear', adm)}</span></div>`; }).join('')}</div>
        <div class="card bk3-wide"><div class="sec">🎖️ Recrutar gente importante <span>${C.length} que você conhece</span></div><p class="dt-desc">Nobres, cavaleiros, mercadores, governadores e reis que você conhece. A chance sobe com a amizade e o poder da sociedade; cada um ouve a proposta uma vez por mês.</p>
          ${C.length ? C.map(p => `<div class="crow"><span class="ri">${G.civs.some(c => c.rulerId === p.id) ? '👑' : NOBLE_RANKS.includes(p.rank) ? '🎖️' : p.rank === 'knight' ? '🛡️' : '💼'}</span><span><b>${esc(People.full(p))}</b><small>${esc(People.title ? People.title(p) : p.rank)} · amizade ${Math.round(p.aff || 0)}</small></span><span class="act-row">${B('rec', p.id, tr[p.id] === G.day ? 'Já ouviu' : '🕯️ Convidar', k !== 'own' && tr[p.id] !== G.day)}</span></div>`).join('') : '<p class="muted">Conheça nobres, cavaleiros e mercadores (converse com eles) para poder recrutá-los.</p>'}</div>`;
    } else if (tab === 'poder') {
      const gv = this.govTargets(), kt = this.kingTargets(), ok = pw.power >= this.KING_POWER;
      body = `<div class="card"><div class="sec">⚖️ Bem ou mal <span>${this.karmaName()}</span></div><i class="ex-risk tp-karma"><i style="width:${Math.round((S.karma + 100) / 2)}%"></i></i>
          <p class="dt-desc">O poder da irmandade serve ao bem e ao mal. O povo e as famílias sabem que você é da sociedade: quanto mais temida, menos gente ousa enfrentar a sua família.</p>
          <div class="crow"><span class="ri">🍞</span><span><b>Obras de caridade</b><small>500 🪙 do cofre · o povo dos reinos fica mais feliz, +fama</small></span><span class="act-row">${B('charity', 0, 'Fazer', S.vault >= 500)}</span></div>
          <div class="crow"><span class="ri">😨</span><span><b>Intimidar os rivais</b><small>300 🪙 do cofre · as famílias engolem o rancor, a irmandade fica temida</small></span><span class="act-row">${B('fear', 0, 'Fazer', S.vault >= 300)}</span></div></div>
        <div class="card"><div class="sec">🏘️ Derrubar governadores <span>800 🪙 · ${adm ? `chance ${Math.round(U.clamp(0.3 + pw.power / 400, 0.2, 0.9) * 100)}%` : 'Mestre'}</span></div>
          ${gv.length ? gv.map(x => `<div class="crow"><span class="ri">🏘️</span><span><b>${esc(x.v.name)}</b><small>${esc(People.full(x.p))} · ${x.v.free ? 'vila livre' : CIV_DEFS[x.v.civ].short}</small></span><span class="act-row">${B('gov', x.vi, 'Derrubar', adm && S.vault >= 800)}</span></div>`).join('') : '<p class="muted">Nenhum governador que não seja irmão.</p>'}</div>
        <div class="card"><div class="sec">👑 Derrubar reis <span>${this.KING_COST} 🪙 · poder ${this.KING_POWER}+</span></div>${ok ? '' : `<p class="dt-desc">A sociedade tem poder ${pw.power}: recrute gente importante, faça networking e encha o cofre para chegar a ${this.KING_POWER}.</p>`}
          ${kt.map(c => { const ch = U.clamp(0.25 + pw.power / 600 - (c.garrison || 0) / 120 + r * 0.05, 0.1, 0.85); return `<div class="crow"><span class="ri">👑</span><span><b>${esc(c.rulerName)}</b><small>${CIV_DEFS[c.id].short} · guarnição ${c.garrison || 0} · chance ${Math.round(ch * 100)}%</small></span><span class="act-row">${B('king', c.id, 'Derrubar', adm && ok && S.vault >= this.KING_COST)}</span></div>`; }).join('') || '<p class="muted">Todos os reis já são irmãos.</p>'}</div>`;
    } else {
      const K = KOrders.S(), m = K.mission, M = m && KO_MISSIONS[m.k], best = S.best[k] || 0;
      body = `<div class="card"><div class="sec">📜 Missão do mês</div>${m ? `<div class="sc-mis"><span>${M.icon}</span><div><b>${M.text}</b><small>${M.stat ? `progresso ${Math.min(KOrders.progress(), M.need)}/${M.need} · ` : ''}até ${Calendar.short(m.until)}</small></div></div>` : '<p class="muted">A próxima missão chega no mês que vem.</p>'}
          <div class="sec" style="margin-top:10px">🪜 Graus</div>${SOC2_TITLES.map((n, i) => `<div class="crow ${i <= r ? 'tp-mine' : ''}"><span class="ri">${i < r ? '✔' : i === r ? '★' : '·'}</span><span><b>${n}</b><small>${KO_RANKS[i] ? `${KO_RANKS[i][1]} missões cumpridas` : ''}${i === 3 ? ' e 120 de fama' : ''}</small></span><span></span></div>`).join('')}
          <small class="muted">Grau conquistado não se perde: perder o prazo tira pontos, mas o seu grau mais alto (${SOC2_TITLES[Math.max(r, best)]}) fica.</small></div>
        <div class="card bk3-wide"><div class="sec">🗺️ Missões que a sociedade dá <span>${Object.keys(KO_MISSIONS).length}</span></div>${Object.entries(KO_MISSIONS).map(([q, X]) => `<div class="crow ${d.likes && d.likes.includes(q) ? 'tp-mine' : ''}"><span class="ri">${X.icon}</span><span><b>${X.text}</b><small>${d.likes && d.likes.includes(q) ? 'a sua sociedade gosta desta' : 'pode aparecer'}</small></span><span></span></div>`).join('')}</div>`;
    }
    const rail = this.TABS.map(([t, l]) => { const m2 = l.match(/^(\S+)\s+(.*)$/); return `<button class="bk3-tab ${t === tab ? 'on' : ''}" data-act="tp" data-op="tab" data-k="${t}"><span class="bk3-ti">${m2[1]}</span><span class="bk3-tl"><b>${m2[2]}</b><small>${t === 'tesouro' ? Math.round(S.vault).toLocaleString('pt-BR') + ' 🪙' : t === 'poder' ? 'poder ' + pw.power : t === 'loja' ? this.title() : t === 'rede' ? (this.netOk() ? 'reunião disponível' : 'reunião feita') : (KOrders.S().mission ? 'missão ativa' : '')}</small></span></button>`; }).join('');
    const html = `<div class="bk3 tp3" style="--c:${d.col};--x:${d.cross}"><aside class="bk3-rail"><div class="bk3-id"><span class="bk3-seal tp-seal">${d.icon}</span><span><b>${esc(d.name)}</b><small>${esc(this.title())}</small></span></div>
        <nav class="bk3-tabs">${rail}</nav><div class="bk3-purse"><small>Cofre da loja</small><b>${Math.round(S.vault).toLocaleString('pt-BR')} 🪙</b></div></aside>
      <section class="bk3-main"><header class="bk3-top"><span class="bk3-pi">${(this.TABS.find(t => t[0] === tab) || this.TABS[0])[1].split(' ')[0]}</span><span class="bk3-pt"><b>${(this.TABS.find(t => t[0] === tab) || this.TABS[0])[1].replace(/^\S+\s+/, '')}</b><small>${esc(d.motto || d.oath || '')}</small></span><span class="bk3-chips"><span class="bk3-chip">⚔️ poder ${pw.power}</span><span class="bk3-chip">🪙 ${P.gold.toLocaleString('pt-BR')} no bolso</span></span>${tab === 'tesouro' && typeof BankView !== 'undefined' ? `<span class="bk3-amtsel"><small>Valor</small>${BankView.AMTS.map(a => `<button type="button" data-amt="${a}" class="${a === BankView.amt ? 'on' : ''}">${a.toLocaleString('pt-BR')}</button>`).join('')}</span>` : ''}</header>
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
  KOrders.leave = function (...a) { const k = this.S().key; const r = lv0(...a); if (k) { const S = Soc2.S(); delete S.best[k]; S.posts = {}; } return r; };
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
  Secret.page = function () { if (!Secret.member()) return pg0(); try { return Soc2.memberPage(); } catch (e) { console.error(e); return pg0(); } };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'tp') return a0(a, d);
    const n = d.n === 'all' ? Infinity : +d.n, cur = UI.cur && UI.cur.fn === 'showTemple' ? UI.cur.args[0] : 'loja';
    switch (d.op) {
      case 'tab': Soc2.show(d.k); return;
      case 'vin': Soc2.vaultIn(n); break;
      case 'vout': Soc2.vaultOut(n); break;
      case 'inv': Soc2.invest(d.k, n); break;
      case 'div': Soc2.divest(d.k, n); break;
      case 'net': Soc2.network(); break;
      case 'rec': Soc2.recruit(+d.k); break;
      case 'post': Soc2.appoint(d.k); break;
      case 'gov': Soc2.topGov(+d.k); break;
      case 'king': { const ci = +d.k; Dialog.confirm({ icon: '👑', title: 'Derrubar um rei', danger: true, ok: 'Mover a sociedade', text: `Gastar ${Soc2.KING_COST} 🪙 do cofre para derrubar ${G.civs[ci].rulerName}? Se falhar, ${CIV_DEFS[ci].short} vai odiar você.` }, () => { Soc2.topKing(ci); Soc2.show('poder'); }); return; }
      case 'charity': Soc2.charity(); break;
      case 'dues': Soc2.setDues(+d.k); break;
      case 'fear': Soc2.intimidate(); break;
    }
    Soc2.show(cur);
  };
}

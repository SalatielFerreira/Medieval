'use strict';
// Cidadania e as regras da corte.
//  • Você começa livre, sem reino. Pode escolher a cidadania de qualquer reino que não esteja em guerra com você
//    (Corte e cidadania → 🪪 Cidadania). Ao assumir um cargo na corte ou um título de nobreza de um reino, a cidadania
//    passa a ser dele na hora. Sendo rei, a sua cidadania é o seu reino.
//  • Com cidadania, cargo e título só no reino a que você pertence: nada de títulos em dois reinos nem de servir a duas
//    cortes. Trocar de cidadania (ou renunciar a ela) faz perder o cargo e o título.
//  • Um cargo na corte pede boa relação com o reino E amizade com o rei, além do reconhecimento. As sociedades secretas
//    pesam: um rei irmão da sua sociedade (e irmãos no círculo do rei) facilitam; um rei de outra sociedade dificulta.
// As tarefas de cada cargo (general, secretário, conselheiro e embaixador) ficam em gabinete.js.

// o que cada cargo pede: reconhecimento e amizade com o rei (a relação com o reino é sempre 40+)
const COURT_NEED = { advisor: { renown: 40, aff: 25 }, treasurer: { renown: 55, aff: 35 }, general: { renown: 65, aff: 40 }, diplomat: { renown: 75, aff: 45 } };
const COURT_REL = 40;
// os cargos com nomes e tarefas novos (as chaves continuam as mesmas)
Object.assign(COURT_OFFICES.advisor, { name: 'Conselheiro do Rei', f: 'Conselheira do Rei', icon: '📜', desc: 'Escolhe as leis do reino com o rei: propõe leis novas e pede o fim das que não servem.', task: 'Leis' });
Object.assign(COURT_OFFICES.treasurer, { name: 'Secretário do Tesouro', f: 'Secretária do Tesouro', icon: '💰', desc: 'Cuida da economia: os impostos, os investimentos, as festas e as dívidas do reino.', task: 'Tesouro' });
Object.assign(COURT_OFFICES.general, { name: 'General do Rei', f: 'Generala do Rei', icon: '⚔️', desc: 'Manda nos soldados: recruta, pede escolta e comanda as guerras do reino no campo de batalha.', task: 'Exército' });
Object.assign(COURT_OFFICES.diplomat, { name: 'Embaixador', f: 'Embaixadora', icon: '🤝', desc: 'Representa o reino: alianças, paz e guerra com os outros reinos.', task: 'Diplomacia' });

const Cid = {
  S() { const u = G.urban || (G.urban = {}); return u.cid || (u.cid = { civ: -1, since: -1, ok: false }); },
  live(ci) { const c = G.civs[ci]; return !!c && !c.dead; },
  // os reinos que são seus
  ruled() { return G.civs.filter(c => c && c.ruler === 'player' && !c.dead).map(c => c.id); },
  // a sua cidadania (-1 = livre). Rei: o seu reino
  get() {
    const R = this.ruled();
    if (R.length) return G.mainRealm !== undefined && G.mainRealm !== null && R.includes(G.mainRealm) ? G.mainRealm : R[0];
    const s = this.S(); return s.civ >= 0 && this.live(s.civ) ? s.civ : -1;
  },
  name(ci) { return ci >= 0 && CIV_DEFS[ci] ? CIV_DEFS[ci].short : 'sem reino'; },
  // pode ter cargo ou título neste reino?
  allows(ci) { const c = this.get(); return c < 0 || c === ci; },
  why(ci) { const c = this.get(); return c >= 0 && c !== ci ? `Você é cidadão de ${this.name(c)}: cargo e título só no seu reino. Para servir a ${this.name(ci)}, troque de cidadania (e perca o cargo e o título).` : ''; },
  // o que você perde trocando de cidadania
  losses(ci) {
    const out = [], cur = RoyalCourt.C();
    if (cur && cur.civ !== ci) out.push(`o cargo de ${RoyalCourt.officeName(cur.office)} de ${this.name(cur.civ)}`);
    for (const t of Court.titledCivs()) if (t !== ci) out.push(`o título de ${Court.titleName(Court.levelIn(t), t)}`);
    return out;
  },
  // perde o que for de outro reino (quiet: sem mensagens por item)
  strip(ci, why, quiet) {
    const cur = RoyalCourt.C();
    if (cur && cur.civ !== ci) RoyalCourt.leave(why, quiet);
    for (const t of Court.titledCivs()) if (t !== ci) { if (quiet) { delete Court.holdings()[t]; Court.syncPrincipal(); } else Court.loseTitle(why, t); }
  },
  // vira cidadão (sem perguntar): o que for de outro reino é perdido
  set(ci, how) {
    const s = this.S(), old = this.get();
    if (this.ruled().length) return false; // rei: a cidadania é o reino dele
    if (ci >= 0 && !this.live(ci)) return false;
    if (old === ci) return true;
    this.strip(ci, ci >= 0 ? `você virou cidadão de ${this.name(ci)}` : 'você renunciou à cidadania');
    s.civ = ci; s.since = G.day;
    if (ci >= 0) {
      UI.banner(`🪪 Cidadão de ${this.name(ci)}`);
      UI.msg(`🪪 Agora você é cidadão de ${CIV_DEFS[ci].name}${how ? ` (${how})` : ''}. Cargo na corte e título de nobreza, só deste reino.`, 'gold', true);
      Progress.diary(`🪪 Virou cidadão de ${CIV_DEFS[ci].name}.`);
      Game.addRelation(ci, 3);
    } else { UI.msg('🏳️ Você renunciou à cidadania: está livre, sem reino.', ''); Progress.diary('🏳️ Renunciou à cidadania.'); }
    if (typeof UI !== 'undefined' && UI.isOpen && UI.isOpen()) try { UI.refresh(); } catch (e) { /* janela fechada */ }
    return true;
  },
  // escolher pela janela: avisa o que se perde
  choose(ci) {
    if (this.ruled().length) { UI.msg('Você é rei: a sua cidadania é o seu reino.', 'bad'); return; }
    if (ci >= 0) { const c = G.civs[ci]; if (!this.live(ci)) return; if (c.atWar) { UI.msg(`${this.name(ci)} está em guerra com você: não aceita a sua cidadania.`, 'bad'); return; } }
    const L = this.losses(ci), go = () => this.set(ci, 'por escolha');
    if (!L.length) { go(); return; }
    Dialog.confirm({ icon: ci >= 0 ? '🪪' : '🏳️', title: ci >= 0 ? `Cidadania de ${this.name(ci)}` : 'Renunciar à cidadania',
      text: `${ci >= 0 ? `Virar cidadão de ${CIV_DEFS[ci].name}` : 'Ficar sem reino'} faz você perder ${L.join(' e ')}. Continuar?`, ok: ci >= 0 ? 'Mudar de cidadania' : 'Renunciar', danger: true }, go);
  },
  // ------------------------------------------------------------ a corte: rei, sociedades e exigências
  king(ci) { return typeof Secret !== 'undefined' ? Secret.ruler(ci) : null; },
  kingAff(ci) { const k = this.king(ci); return k ? Math.round(k.aff || 0) : 0; },
  addKingAff(ci, n) { const k = this.king(ci); if (k && n) People.addAff(k, n); },
  // a sociedade de alguém (ou null)
  socOf(p) { if (!p || typeof Secret === 'undefined') return null; for (const k of Object.keys(SECRET_SOC)) if (Secret.isBro(p, k)) return k; return null; },
  mySoc() { return typeof Secret !== 'undefined' && Secret.member() ? Secret.key() : null; },
  // as sociedades na corte: o rei e o círculo do rei, com quem é de cada uma
  forces(ci) {
    const out = [], king = this.king(ci), circle = typeof Politics !== 'undefined' ? Politics.circlePeople(ci) : [];
    const add = (p, role) => { const k = this.socOf(p); if (!k) return; let r = out.find(x => x.k === k); if (!r) out.push(r = { k, d: SECRET_SOC[k], who: [] }); r.who.push({ p, role }); };
    if (king) add(king, 'rei');
    for (const x of circle) add(x.p, (KING_CIRCLE[x.seat] || ['', ''])[x.p.sex === 'f' ? 1 : 0]);
    return out.sort((a, b) => (b.who.some(w => w.role === 'rei') ? 1 : 0) - (a.who.some(w => w.role === 'rei') ? 1 : 0) || b.who.length - a.who.length);
  },
  // o peso das sociedades nas exigências: { aff, renown, notes }
  mods(ci) {
    const m = { aff: 0, renown: 0, notes: [] }, mine = this.mySoc(), king = this.king(ci);
    if (!king) return m;
    const ks = this.socOf(king);
    if (mine && ks === mine) { m.aff -= 15; m.renown -= 10; m.notes.push(['ok', `${SECRET_SOC[mine].icon} O rei é seu irmão da ${SECRET_SOC[mine].name}: −15 de amizade e −10 de reconhecimento exigidos`]); }
    else if (ks && mine) { m.aff += 10; m.notes.push(['bad', `${SECRET_SOC[ks].icon} O rei é da ${SECRET_SOC[ks].name}, outra sociedade: +10 de amizade exigida`]); }
    else if (ks) m.notes.push(['', `${SECRET_SOC[ks].icon} O rei é da ${SECRET_SOC[ks].name}: entrar para ela abriria portas`]);
    if (mine) {
      const n = (typeof Politics !== 'undefined' ? Politics.circlePeople(ci) : []).filter(x => Secret.isBro(x.p, mine)).length;
      if (n) { m.aff -= 3 * n; m.notes.push(['ok', `${SECRET_SOC[mine].icon} ${n} ${n === 1 ? 'irmão' : 'irmãos'} no círculo do rei: −${3 * n} de amizade exigida`]); }
    }
    return m;
  },
  need(ci, office) { const b = COURT_NEED[office] || COURT_NEED.advisor, m = this.mods(ci); return { renown: Math.max(10, b.renown + m.renown), aff: U.clamp(b.aff + m.aff, 0, 100), rel: COURT_REL }; },
  // as exigências de um cargo, uma a uma: [texto, ok, valor, alvo]
  checks(ci, office) {
    const c = G.civs[ci], n = this.need(ci, office), rn = RoyalCourt.renown(ci), aff = this.kingAff(ci), rel = Math.round(c.relation || 0);
    return [
      ['🤝 Relação com o reino', rel >= n.rel, rel, n.rel],
      ['👑 Amizade com o rei', aff >= n.aff, aff, n.aff],
      ['⭐ Reconhecimento', rn >= n.renown, rn, n.renown],
      ['🪪 Cidadania', this.allows(ci), this.allows(ci) ? (this.get() === ci ? this.name(ci) : 'livre') : this.name(this.get()), null],
      ['🕊️ Em paz com o reino', !c.atWar, c.atWar ? 'em guerra' : 'em paz', null],
    ];
  },
  canHold(ci, office) { const c = G.civs[ci]; return !!c && c.ruler !== 'player' && !this.ruled().length && !!this.king(ci) && this.checks(ci, office).every(x => x[1]); },
  // pedir um lugar na corte (sem esperar o convite)
  ask(ci) {
    if (!this.canHold(ci, 'advisor')) { UI.msg('Você ainda não cumpre as exigências para entrar na corte.', 'bad'); return false; }
    G.courtInvite = { civ: ci, day: G.day };
    return RoyalCourt.join(ci);
  },
};

{
  // ---------------------------------------------------------------- a corte segue as regras novas
  RoyalCourt.canBeInvited = function (ci) {
    const c = G.civs[ci];
    return !!c && c.ruler !== 'player' && !Cid.ruled().length && !c.atWar && !this.isMember(ci) && Cid.canHold(ci, 'advisor');
  };
  const jn0 = RoyalCourt.join.bind(RoyalCourt);
  RoyalCourt.join = function (ci) {
    if (!Cid.allows(ci)) { G.courtInvite = null; UI.msg(Cid.why(ci), 'bad'); return false; }
    const r = jn0(ci);
    if (r && Cid.get() !== ci) Cid.set(ci, 'você entrou para a corte');
    return r;
  };
  RoyalCourt.setOffice = function (k) {
    const cur = this.C(), o = COURT_OFFICES[k];
    if (!cur || !o || cur.office === k) return;
    if (!Cid.canHold(cur.civ, k)) { UI.msg(`Para ser ${this.officeName(k)}, cumpra as exigências do cargo (relação, amizade com o rei e reconhecimento).`, 'bad'); return; }
    if (cur.office === 'treasurer') delete G.civs[cur.civ].secTax; // os impostos voltam a ser do rei
    cur.office = k; cur.since2 = G.day;
    UI.banner(`${o.icon} ${this.officeName(k)}`);
    UI.msg(`${o.icon} Você agora é ${this.officeName(k)} de ${CIV_DEFS[cur.civ].short}. ${o.desc}`, 'gold', true);
    Progress.diary(`${o.icon} Virou ${this.officeName(k)} de ${CIV_DEFS[cur.civ].short}.`);
  };
  // o rei também precisa gostar de você: amizade muito baixa e você sai da corte
  const tk0 = RoyalCourt.tick.bind(RoyalCourt);
  RoyalCourt.tick = function () {
    tk0();
    const cur = this.C(); if (!cur) return;
    if (!Cid.king(cur.civ)) return;
    if (Cid.kingAff(cur.civ) < -10) { this.leave(`${G.civs[cur.civ].rulerName} não confia mais em você`); return; }
    // servir na corte pesa a favor da sua sociedade
    if (Cid.mySoc() && typeof Soc2 !== 'undefined') Soc2.S().infl += 2;
  };
  const lv0 = RoyalCourt.leave.bind(RoyalCourt);
  RoyalCourt.leave = function (...a) { const cur = this.C(); if (cur && G.civs[cur.civ]) delete G.civs[cur.civ].secTax; return lv0(...a); };
  // ---------------------------------------------------------------- títulos só no seu reino
  const rt0 = Court.requestTitle.bind(Court);
  Court.requestTitle = function (ci) {
    if (!Cid.allows(ci)) { UI.msg(Cid.why(ci), 'bad'); return false; }
    const r = rt0(ci);
    if (r && Cid.get() !== ci) Cid.set(ci, 'você recebeu um título');
    return r;
  };
  // ---------------------------------------------------------------- virou rei: a cidadania é o seu reino
  const br0 = Game.becomeRuler.bind(Game);
  Game.becomeRuler = function (ci, ...a) {
    const r = br0(ci, ...a);
    if (G.civs[ci] && G.civs[ci].ruler === 'player') { Cid.S().civ = ci; Cid.strip(ci, `agora você é soberano de ${CIV_DEFS[ci].short}`); }
    return r;
  };
  // ---------------------------------------------------------------- jogos salvos de antes: uma cidadania só
  Cid.migrate = function () {
    const s = this.S(); if (s.ok) return; s.ok = true;
    const cur = RoyalCourt.C(), T = Court.titledCivs();
    let ci = this.ruled().length ? this.get() : cur ? cur.civ : T.length ? T[0] : -1;
    if (ci < 0) return;
    if (!this.ruled().length) s.civ = ci;
    const L = this.losses(ci);
    if (L.length) { this.strip(ci, 'regra nova: cargo e título só no seu reino', true); UI.msg(`🪪 Regra nova: cargo e título só no reino da sua cidadania (${this.name(ci)}). Você deixou ${L.join(' e ')}.`, 'gold', true); }
  };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); try { if (G.state === 'play') Cid.migrate(); } catch (e) { console.error(e); } return r; };
  const ng0 = Game.newGame && Game.newGame.bind(Game);
  if (ng0) Game.newGame = function (...a) { const r = ng0(...a); try { Cid.S().ok = true; } catch (e) { /* ainda sem mundo */ } return r; };
}

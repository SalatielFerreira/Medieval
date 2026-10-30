'use strict';
// Ordens de cavalaria (Portfólio → ⚜️ Ordens de cavalaria).
//  • Entre numa ordem (Templários, Ordem do Dragão, Ordem da Rosa, Hospitalários): cada uma pede nível e fama, e tem um
//    juramento — quebrar (crimes, matar inocentes; na Ordem do Dragão, fugir da caça às feras) pesa, e três quebras são
//    expulsão.
//  • Missões: todo mês a ordem dá uma (caçar bandidos, limpar acampamento, abater uma fera, vencer guardiões das
//    cavernas, piratas, doar ouro). Cumprir sobe de patente: Escudeiro → Cavaleiro → Comendador → Grão-Mestre.
//  • A partir de Cavaleiro: a armadura da ordem (gibão e elmo) e cavaleiros da ordem que obedecem a você (seguem como
//    capangas: 1 como Cavaleiro, 3 como Comendador, 5 como Grão-Mestre).
//  • Ou funde a sua própria ordem (fama 100, um reino ou título de Conde, 4.000 🪙): nome e cor à sua escolha, você é o
//    Grão-Mestre, e a ordem arma um cavaleiro novo por mês (até 6), com soldo.
const KORDERS = {
  templo: { name: 'Ordem do Templo',  icon: '✠', col: '#e8e4dc', cross: '#b8202a', mat: 'silver', lvl: 5, fame: 30, piety: 10, oath: 'Não cometer crimes e não tirar vidas inocentes.', likes: ['bandits', 'camp', 'donate'] },
  dragao: { name: 'Ordem do Dragão',  icon: '🐉', col: '#2a5a3a', cross: '#e0b040', mat: 'dragon', lvl: 6, fame: 40, oath: 'Nunca recusar a caça a uma fera.', likes: ['beast', 'guardians', 'camp'] },
  rosa:   { name: 'Ordem da Rosa',    icon: '🌹', col: '#7a1a3a', cross: '#f0d0d8', mat: 'gold', lvl: 4, fame: 50, oath: 'Proteger as vilas e não cometer crimes.', likes: ['bandits', 'donate', 'camp'] },
  hospital:{ name: 'Hospitalários',   icon: '✚', col: '#1a1a20', cross: '#f4f4f4', mat: 'iron', lvl: 3, fame: 20, oath: 'Socorrer os pobres, não roubar e não tirar vidas inocentes.', likes: ['donate', 'bandits', 'guardians'] },
};
const KO_RANKS = [['Escudeiro', 0, 0], ['Cavaleiro', 2, 1], ['Comendador', 5, 3], ['Grão-Mestre', 10, 5]]; // [nome, missões, cavaleiros]
const KO_MISSIONS = {
  bandits:   { icon: '🗡️', text: 'Derrote 8 bandidos.', stat: 'kill_bandit', need: 8 },
  camp:      { icon: '🏕️', text: 'Destrua um acampamento de bandidos.', stat: 'camps', need: 1 },
  beast:     { icon: '🐉', text: 'Abata uma fera errante.', stat: 'beasts', need: 1, when: () => typeof Beasts !== 'undefined' && Beasts.L().length > 0 },
  guardians: { icon: '🗝️', text: 'Vença 2 guardiões das cavernas.', stat: 'guardians', need: 2 },
  pirates:   { icon: '🏴‍☠️', text: 'Derrote 4 piratas.', stat: 'kill_pirate', need: 4, when: () => !!G.ship },
  donate:    { icon: '💰', text: 'Doe 250 🪙 à ordem.', need: 250 },
};
const KO_COLORS = ['#b8202a', '#2a4a8a', '#2a6a3a', '#7a1a5a', '#c8a030', '#1a1a20'];

const KOrders = {
  S() { const u = G.urban || (G.urban = {}); return u.korder || (u.korder = { key: null, pts: 0, viol: 0, mission: null, own: null, left: {} }); },
  def() { const S = this.S(); return S.key === 'own' ? S.own : KORDERS[S.key] || null; },
  rank() { const S = this.S(); if (S.key === 'own') return 3; let r = 0; KO_RANKS.forEach(([, n], i) => { if (S.pts >= n && (i < 3 || (G.fame || 0) >= 120)) r = i; }); return r; },
  rankName() { return KO_RANKS[this.rank()][0]; },
  // pode entrar?
  why(k) {
    const d = KORDERS[k], S = this.S();
    if (S.key) return 'Você já é de uma ordem.';
    if ((S.left[k] || -99) > G.day - 12) return 'Esta ordem não aceita você de volta tão cedo.';
    if (P.level < d.lvl) return `Precisa do nível ${d.lvl}.`;
    if ((G.fame || 0) < d.fame) return `Precisa de ${d.fame} de fama.`;
    if (d.piety && (G.piety || 0) < d.piety) return `Precisa de ${d.piety} de fé (reze, doe à igreja).`;
    return null;
  },
  join(k) {
    const e = this.why(k); if (e) { UI.msg(e, 'bad'); return; }
    const S = this.S(); Object.assign(S, { key: k, pts: 0, viol: 0, mission: null, since: G.day });
    const d = KORDERS[k];
    UI.banner(`${d.icon} ${d.name}`);
    UI.msg(`${d.icon} Você jurou diante dos irmãos da ${d.name}: "${d.oath}" Agora é ${KO_RANKS[0][0]}. Cumpra as missões para subir.`, 'gold', true);
    Progress.diary(`${d.icon} Entrou para a ${d.name} como ${KO_RANKS[0][0]}.`); Diplo.chronicle(`${d.icon} ${G.name} ${G.surname || ''} entrou para a ${d.name}.`, true);
    this.newMission();
  },
  leave(why) {
    const S = this.S(), d = this.def(); if (!S.key) return;
    if (S.key !== 'own') S.left[S.key] = G.day;
    for (const p of G.people) if (p.alive && p.korder) { p.korder = null; if (p.capanga) { p.capanga = false; for (const e of G.ents) if (e.npc === p) e.dead = true; G.spawned.delete(p.id); } }
    Object.assign(S, { key: null, pts: 0, viol: 0, mission: null, own: null });
    UI.msg(`${d.icon} ${why || 'Você deixou a ordem'}. Os cavaleiros dela voltaram para o comando.`, 'bad', true);
    Progress.diary(`${d.icon} Deixou a ${d.name}${why ? ` (${why})` : ''}.`);
  },
  // ---------------------------------------------------------------- missões
  newMission() {
    const S = this.S(), d = this.def(); if (!d || S.key === 'own') return;
    const opts = Object.keys(KO_MISSIONS).filter(m => !KO_MISSIONS[m].when || KO_MISSIONS[m].when());
    const liked = opts.filter(m => d.likes.includes(m)), k = Math.random() < 0.7 && liked.length ? U.pick(liked) : U.pick(opts);
    const M = KO_MISSIONS[k];
    S.mission = { k, until: G.day + 3, base: M.stat ? (Progress.S()[M.stat] || 0) : 0 };
  },
  progress() { const S = this.S(), m = S.mission; if (!m) return 0; const M = KO_MISSIONS[m.k]; return M.stat ? Math.max(0, (Progress.S()[M.stat] || 0) - m.base) : 0; },
  done() {
    const S = this.S(), d = this.def(), r0 = this.rank(); S.pts++; S.mission = null;
    Court.addFame(5); Game.gainXp(60);
    UI.msg(`${d.icon} Missão cumprida para a ${d.name}! (+5 de fama)`, 'gold', true);
    const r1 = this.rank();
    if (r1 > r0) this.promote(r1);
    this.newMission();
  },
  donate() { const S = this.S(); if (!S.mission || S.mission.k !== 'donate') return; if (P.gold < 250) { UI.msg('Você precisa de 250 🪙.', 'bad'); return; } P.gold -= 250; Sound.play('coin'); this.done(); },
  promote(r) {
    const d = this.def(), [name] = KO_RANKS[r];
    UI.banner(`${d.icon} ${name} da ${d.name}!`);
    UI.msg(`${d.icon} Você agora é ${name} da ${d.name}${r >= 1 ? ': já pode vestir a armadura da ordem e comandar cavaleiros' : ''}.`, 'gold', true);
    Progress.diary(`${d.icon} Subiu a ${name} da ${d.name}.`);
    if (r >= 1) this.armor();
    this.muster();
  },
  // a armadura da ordem (gibão e elmo, com as cores dela)
  armorKeys() { const S = this.S(); return S.key ? ['ko_tabard_' + S.key, 'ko_helm_' + S.key] : []; },
  makeItems(k, d) {
    if (!ITEMS['ko_tabard_' + k]) ITEMS['ko_tabard_' + k] = { name: `Gibão da ${d.name}`, icon: d.icon, cat: 'Armaduras', price: 400, slot: 'torso', def: 10, color: d.col, korder: k };
    if (!ITEMS['ko_helm_' + k]) ITEMS['ko_helm_' + k] = { name: `Elmo da ${d.name}`, icon: '⛑️', cat: 'Armaduras', price: 260, slot: 'head', def: 6, color: d.col === '#1a1a20' ? '#5a5a62' : '#c4cad0', korder: k };
    ART_ITEMS['ko_tabard_' + k] = ['cuirass', d.mat || 'iron']; ART_ITEMS['ko_helm_' + k] = ['helm', 'steel'];
  },
  armor() { const S = this.S(); if (!S.key) return; this.makeItems(S.key, this.def()); for (const k of this.armorKeys()) if (!Inv.count(k)) Inv.add(k, 1); },
  // cavaleiros da ordem que seguem você
  knights() { return G.people.filter(p => p.alive && p.korder); },
  muster() {
    const S = this.S(), d = this.def(); if (!d) return;
    const want = S.key === 'own' ? Math.min(6, S.own.knights || 0) : KO_RANKS[this.rank()][2];
    let n = this.knights().length;
    while (n < want) {
      const p = People.create({ rank: 'knight', age: U.rint(22, 40), sex: Math.random() < 0.8 ? 'm' : 'f', trait: U.pick(['leal', 'corajoso', 'orgulhoso']), civ: -1, home: { type: 'wild' } });
      p.korder = S.key; p.loyal = 80; p.met = true;
      this.makeItems(S.key, d); p.equip.torso = 'ko_tabard_' + S.key; p.equip.head = 'ko_helm_' + S.key; p.equip.weapon = 'iron_sword';
      n++;
      this.call(p);
    }
  },
  call(p) {
    if (p.capanga) return true;
    if (Game.allies().length >= Game.followerCap()) { p.korderWait = true; return false; }
    p.capanga = true; p.korderWait = false; Game.spawnCapanga(p);
    UI.msg(`${this.def().icon} ${People.full(p)}, cavaleir${p.sex === 'f' ? 'a' : 'o'} da ordem, se apresentou para seguir você.`, 'gold');
    return true;
  },
  // juramento quebrado
  violate(what) {
    const S = this.S(), d = this.def(); if (!S.key || S.key === 'own') return;
    S.viol++;
    if (S.viol >= 3) { this.leave(`expulso da ${d.name}: ${what}`); return; }
    UI.msg(`${d.icon} Você quebrou o juramento da ${d.name} (${what}). ${3 - S.viol === 1 ? 'Mais uma e você é expulso.' : `Mais ${3 - S.viol} e você é expulso.`}`, 'bad', true);
  },
  // ---------------------------------------------------------------- a sua própria ordem
  canFound() {
    if (this.S().key) return 'Deixe a sua ordem antes de fundar outra.';
    if ((G.fame || 0) < 100) return 'Precisa de 100 de fama.';
    if (!G.civs.some(c => c.ruler === 'player') && !Court.titledCivs().some(ci => Court.levelIn(ci) >= 2)) return 'Precisa governar um reino ou ter o título de Conde.';
    if (P.gold < 4000) return 'Custa 4.000 🪙.';
    return null;
  },
  found(name, col) {
    const e = this.canFound(); if (e) { UI.msg(e, 'bad'); return; }
    name = String(name || '').trim().slice(0, 40) || `Ordem de ${G.surname || G.name}`;
    P.gold -= 4000;
    const S = this.S(); Object.assign(S, { key: 'own', pts: 0, viol: 0, mission: null, own: { name, icon: '⚜️', col: KO_COLORS.includes(col) ? col : KO_COLORS[0], cross: '#f0e0b0', mat: 'gold', knights: 1, since: G.day, oath: 'A palavra do Grão-Mestre é a lei.' } });
    UI.banner(`⚜️ ${name}`); UI.msg(`⚜️ Você fundou a ${name} e é o Grão-Mestre. Todo mês ela arma um cavaleiro novo (até 6), com soldo de 20 🪙 cada.`, 'gold', true);
    Progress.diary(`⚜️ Fundou a ${name}.`); Diplo.chronicle(`⚜️ ${G.name} ${G.surname || ''} fundou a ${name}.`, true);
    this.armor(); this.muster();
  },
  // ---------------------------------------------------------------- todo mês
  monthTick() {
    const S = this.S(), d = this.def(); if (!d) return;
    if (S.key === 'own') {
      const n = this.knights().length, pay = n * 20;
      if (P.gold >= pay) P.gold -= pay; else { const c = G.civs.find(x => x.ruler === 'player'); if (c && c.treasury >= pay) c.treasury -= pay; else { for (const p of this.knights().slice(-1)) { p.korder = null; p.capanga = false; G.spawned.delete(p.id); } UI.msg('⚜️ Sem soldo, um cavaleiro deixou a sua ordem.', 'bad'); } }
      if (pay) Game.note(`⚜️ Soldo dos cavaleiros da ${d.name}: −${pay} 🪙.`);
      S.own.knights = Math.min(6, (S.own.knights || 0) + 1); this.muster(); Court.addFame(1);
      return;
    }
    const m = S.mission;
    if (m && m.k !== 'donate' && this.progress() >= KO_MISSIONS[m.k].need) this.done();
    else if (m && G.day > m.until) {
      S.pts = Math.max(0, S.pts - 1); S.mission = null;
      if (S.key === 'dragao' && m.k === 'beast') this.violate('fugiu da caça à fera');
      else UI.msg(`${d.icon} Você não cumpriu a missão da ${d.name} a tempo.`, 'bad');
      if (this.S().key) this.newMission();
    } else if (!m) this.newMission();
    for (const p of this.knights()) if (p.korderWait) this.call(p);
  },
  // ---------------------------------------------------------------- a página
  page() {
    const S = this.S(), d = this.def(), esc = UI.esc.bind(UI);
    if (d) {
      const r = this.rank(), next = KO_RANKS[r + 1], m = S.mission, M = m && KO_MISSIONS[m.k];
      const prog = m && M.stat ? `${Math.min(this.progress(), M.need)}/${M.need}` : '';
      const kn = this.knights().map(p => `<span class="ko-kn">${d.icon} ${esc(People.full(p))}${p.korderWait ? ' <small>(esperando vaga)</small>' : ''}</span>`).join('');
      return `<div class="card ko-me" style="--ko:${d.col};--kx:${d.cross}"><div class="ko-banner"><span>${d.icon}</span></div><div><h3>${esc(d.name)}</h3><small>${this.rankName()}${S.key !== 'own' ? ` · ${S.pts} missões${next ? ` · ${next[0]} com ${next[1]}${r + 1 === 3 ? ' e 120 de fama' : ''}` : ''}` : ` · fundada por você · ${this.knights().length}/6 cavaleiros`}</small>
          <p class="dt-desc">⚖️ Juramento: ${esc(d.oath)}${S.key !== 'own' ? ` · quebras: ${S.viol}/3` : ''}</p></div></div>
        ${S.key !== 'own' ? `<div class="card"><div class="sec">📜 Missão do mês</div>${m ? `<div class="ko-mis"><span>${M.icon}</span><div><b>${M.text}</b><small>${prog ? `progresso ${prog} · ` : ''}até ${Calendar.short(m.until)}</small></div>${m.k === 'donate' ? `<button class="primary" data-act="ko" data-op="donate" ${P.gold >= 250 ? '' : 'disabled'}>Doar 250 🪙</button>` : ''}</div>` : '<p class="muted">Nenhuma missão agora.</p>'}</div>` : ''}
        <div class="card"><div class="sec">🛡️ Cavaleiros que obedecem a você <span>${this.knights().length}</span></div>${kn || '<p class="muted">A partir de Cavaleiro, a ordem manda cavaleiros para seguir você.</p>'}
          ${r >= 1 ? `<div class="act-row"><button data-act="ko" data-op="armor">🛡️ Pegar a armadura da ordem</button></div>` : ''}</div>
        <div class="act-row"><button class="danger" data-act="ko" data-op="leave">🏳️ Deixar a ordem</button></div>`;
    }
    const rows = Object.entries(KORDERS).map(([k, o]) => { const e = this.why(k); return `<div class="crow ko-row" style="--ko:${o.col};--kx:${o.cross}"><span class="ri ko-ic">${o.icon}</span><span><b>${o.name}</b><small>Juramento: ${o.oath} · nível ${o.lvl}, fama ${o.fame}${o.piety ? `, fé ${o.piety}` : ''}</small></span>
      <span class="act-row"><button class="primary" data-act="ko" data-op="join" data-k="${k}" ${e ? 'disabled' : ''} title="${e || ''}">${e ? esc(e) : 'Fazer o juramento'}</button></span></div>`; }).join('');
    const fe = this.canFound();
    return `<div class="card"><div class="sec">⚜️ As ordens dos Sete Reinos</div><p class="dt-desc">Cada ordem dá missões; cumprindo, você sobe de Escudeiro a Grão-Mestre, ganha a armadura dela e cavaleiros que seguem você. Quebrar o juramento três vezes é expulsão.</p>${rows}</div>
      <div class="card"><div class="sec">✨ Fundar a sua ordem <span>${fe ? esc(fe) : 'você pode'}</span></div>
        <div class="act-row ko-found"><input id="koName" maxlength="40" placeholder="Ordem de ${esc(G.surname || G.name)}">${KO_COLORS.map(c => `<button class="ko-col" data-act="ko" data-op="col" data-c="${c}" style="background:${c}" ${UI.sel.koCol === c ? 'data-on="1"' : ''}></button>`).join('')}
        <button class="primary" data-act="ko" data-op="found" ${fe ? 'disabled' : ''}>⚜️ Fundar — 4.000 🪙</button></div></div>`;
  },
};

{
  // juramento: crimes e vidas inocentes
  const cm0 = Crime.commit.bind(Crime);
  Crime.commit = function (...a) { const r = cm0(...a); if (r && ['templo', 'rosa', 'hospital'].includes(KOrders.S().key)) KOrders.violate(String(a[1] || 'um crime')); return r; };
  const as0 = Faith.addSin.bind(Faith);
  Faith.addSin = function (n, why) { const r = as0(n, why); if (/inocente/i.test(why || '') && ['templo', 'hospital'].includes(KOrders.S().key)) KOrders.violate('tirou uma vida inocente'); return r; };
  // as armaduras das ordens já conhecidas (jogo salvo)
  for (const [k, d] of Object.entries(KORDERS)) KOrders.makeItems(k, d);
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); if (G.state === 'play' && KOrders.S().key === 'own') KOrders.makeItems('own', KOrders.S().own); return r; };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); KOrders.monthTick(); };
  // Portfólio → Gestão
  const ni0 = Board.navItems.bind(Board);
  Board.navItems = function () { const d = KOrders.def(); return ni0().concat([['x:ordens', '⚜️', 'Ordens de cavalaria', d && KOrders.S().mission ? '!' : '']]); };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { if (nav === 'x:ordens') return UI.pageHead('⚜️', 'Ordens de cavalaria', 'Juramento, missões, patentes, armadura e cavaleiros') + KOrders.page(); return kp0(nav); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'ko') return a0(a, d);
    switch (d.op) {
      case 'join': KOrders.join(d.k); break;
      case 'donate': KOrders.donate(); break;
      case 'armor': KOrders.armor(); UI.msg('🛡️ A armadura da ordem está na sua mochila.', 'gold'); break;
      case 'leave': Dialog.confirm({ icon: '🏳️', title: 'Deixar a ordem', danger: true, ok: 'Deixar', text: 'Os cavaleiros dela voltam para o comando e você perde a patente.' }, () => { KOrders.leave(); UI.refresh(); }); return;
      case 'col': UI.sel.koCol = d.c; break;
      case 'found': { const el = document.getElementById('koName'); KOrders.found(el ? el.value : '', UI.sel.koCol); break; }
    }
    UI.refresh();
  };
  ACHIEVEMENTS.push({ id: 'knight_o', icon: '⚜️', name: 'Cavaleiro de uma Ordem', desc: 'Chegue a Cavaleiro numa ordem.', t: () => KOrders.S().key && KOrders.rank() >= 1 }, { id: 'grandmaster', icon: '👑', name: 'Grão-Mestre', desc: 'Seja Grão-Mestre de uma ordem.', t: () => KOrders.S().key && KOrders.rank() >= 3 });
}

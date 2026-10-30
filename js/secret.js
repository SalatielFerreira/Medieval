'use strict';
// Sociedades secretas (Portfólio → Gestão → 🕯️ Sociedades secretas): as Guildas de ofício e as Ordens de cavalaria
// viraram uma coisa só. São sete sociedades (Templários, Illuminati, Maçonaria, Priorado de Sião, Hospitalários, Ordem
// Teutônica e Rosa-Cruz), cada uma com os seus irmãos de verdade: os mestres de um ofício (os ferreiros são Templários,
// os mercadores são Illuminati...) e gente poderosa — reis, nobres e cavaleiros — que entrou por escolha própria.
//  • Entrar: só por convite. Um irmão que gosta de você (amizade) convida quando você tem o nível e a fama que a
//    sociedade pede; ou você pede o apadrinhamento a um irmão amigo. Também dá para fundar a sua.
//  • Graus: Aprendiz → Companheiro → Mestre → Grão-Mestre, cumprindo a missão secreta de cada mês (a de antes das ordens).
//  • Benefícios (crescem com o grau):
//    🛡️ irmãos poderosos protegem: no reino de um rei irmão a multa cai pela metade (Mestre: o caso é abafado) e a pena
//       de prisão encurta; irmãos não aceitam matar você nem entram para bandos contra você;
//    💰 investimentos: os seus empreendimentos rendem mais (e mais ainda os do ofício da sociedade); vendas e encomendas
//       10% melhores (como era a guilda);
//    ⚔️ exército: cavaleiros da sociedade seguem você e, nas guerras do seu reino, irmãos soldados entram no exército;
//    🕯️ segredos e influência: cartas com os segredos do mês (assassinos contratados, quem fala em guerra, famílias com
//       rancor), a relação com os reinos de reis irmãos sobe todo mês e os irmãos votam em você nas eleições das vilas.
// O estado de antes (G.urban.korder) continua o mesmo; os convites e os segredos ficam em G.urban.secret.
const SECRET_SOC = {
  smiths:    { name: 'Cavaleiros Templários', icon: '✠', col: '#e8e4dc', cross: '#b8202a', mat: 'silver', lvl: 5, fame: 30, strict: true, oath: 'Não cometer crimes e não tirar vidas inocentes.', likes: ['bandits', 'camp', 'donate'], motto: 'Non nobis, Domine.' },
  merchants: { name: 'Illuminati', icon: '👁️', col: '#1a2a4a', cross: '#e8c06a', mat: 'gold', lvl: 4, fame: 40, oath: 'Guardar os segredos da sociedade e fazer o ouro trabalhar.', likes: ['donate', 'guardians', 'camp'], motto: 'A luz por trás do trono.' },
  crafts:    { name: 'Maçonaria', icon: '📐', col: '#2a3a5a', cross: '#d8d8e0', mat: 'iron', lvl: 3, fame: 20, oath: 'Construir, proteger os irmãos e nunca trair a palavra.', likes: ['donate', 'camp', 'bandits'], motto: 'O esquadro e o compasso.' },
  weavers:   { name: 'Priorado de Sião', icon: '⚜️', col: '#5a1a3a', cross: '#f0d0a0', mat: 'gold', lvl: 4, fame: 30, oath: 'Proteger a linhagem e os segredos do Priorado.', likes: ['guardians', 'donate', 'beast'], motto: 'O sangue guarda o segredo.' },
  victuals:  { name: 'Cavaleiros Hospitalários', icon: '✚', col: '#1a1a20', cross: '#f4f4f4', mat: 'iron', lvl: 3, fame: 20, strict: true, oath: 'Socorrer os pobres, não roubar e não tirar vidas inocentes.', likes: ['donate', 'bandits', 'guardians'], motto: 'Pro fide, pro utilitate hominum.' },
  hunters:   { name: 'Ordem Teutônica', icon: '🦅', col: '#e8e4dc', cross: '#1a1a20', mat: 'iron', lvl: 6, fame: 40, oath: 'Nunca recusar a caça a uma fera.', likes: ['beast', 'guardians', 'camp'], motto: 'Ajudar, defender, curar.' },
  healers:   { name: 'Rosa-Cruz', icon: '🌹', col: '#7a1a3a', cross: '#f0d0d8', mat: 'gold', lvl: 4, fame: 30, oath: 'Buscar o saber escondido e curar quem sofre.', likes: ['guardians', 'donate', 'beast'], motto: 'A rosa floresce na cruz.' },
};
// as ordens de antes viram as sociedades
const SECRET_FROM = { templo: 'smiths', dragao: 'hunters', rosa: 'healers', hospital: 'victuals' };
// graus (as missões para subir e os cavaleiros que seguem você são os de antes)
const SECRET_RANKS = ['Aprendiz', 'Companheiro', 'Mestre', 'Grão-Mestre'];
// investimentos e exército, por grau
const SECRET_INV = [0.05, 0.08, 0.12, 0.18], SECRET_ARMY = [0, 3, 6, 12];

// as sociedades no lugar das ordens (as missões, a armadura e os cavaleiros continuam com orders.js)
for (const k of Object.keys(KORDERS)) delete KORDERS[k];
Object.assign(KORDERS, SECRET_SOC);
SECRET_RANKS.forEach((n, i) => { if (KO_RANKS[i]) KO_RANKS[i][0] = n; });
for (const [k, d] of Object.entries(KORDERS)) KOrders.makeItems(k, d);

const Secret = {
  S() { const u = G.urban || (G.urban = {}); return u.secret || (u.secret = { invites: {}, asked: {}, secrets: [], seeded: false }); },
  key() { const k = KOrders.S().key; return k && k !== 'own' ? k : null; },
  member() { return !!KOrders.S().key; },
  rank() { return this.member() ? KOrders.rank() : -1; },
  // quem é irmão de uma sociedade: os do ofício dela e quem entrou por escolha
  isBro(p, k) { return !!p && p.alive && (p.soc === k || (!p.soc && typeof Commerce !== 'undefined' && Commerce.guildOf(p) === k)); },
  myBro(p) { const k = this.key(); return !!k && this.isBro(p, k); },
  brothers(k) { return G.people.filter(p => this.isBro(p, k) && p.age >= 16); },
  // os poderosos de cada sociedade: reis, nobres e cavaleiros (sorteados uma vez; os reis novos decidem quando assumem)
  seed() {
    const S = this.S(), keys = Object.keys(SECRET_SOC);
    const roll = (p, ch) => { if (!p || p.socRoll) return; p.socRoll = true; if (U.hash2(p.id, 77, 3) < ch) p.soc = keys[Math.floor(U.hash2(p.id, 13, 5) * keys.length) % keys.length]; };
    for (const c of G.civs) if (!c.dead && c.ruler !== 'player' && c.rulerId != null) roll(G.people[c.rulerId], 0.7);
    if (!S.seeded) { for (const p of G.people) if (p.alive && ['consort', 'heir'].includes(p.rank)) roll(p, 0.35); else if (p.alive && p.rank === 'knight') roll(p, 0.3); S.seeded = true; }
  },
  ruler(ci) { const c = G.civs[ci]; return c && !c.dead && c.ruler !== 'player' && c.rulerId != null ? G.people[c.rulerId] : null; },
  // o rei deste reino é seu irmão?
  kingBro(ci) { const p = this.ruler(ci); return p && this.myBro(p) ? p : null; },
  // os irmãos que você conhece (e gostam de você)
  friends(k) { return this.brothers(k).filter(p => p.met && (p.aff || 0) >= 15).sort((a, b) => b.aff - a.aff); },
  // ---------------------------------------------------------------- convites
  reqs(k) { const d = SECRET_SOC[k]; return P.level >= d.lvl && (G.fame || 0) >= d.fame; },
  invite(k, p) {
    const S = this.S(); if (S.invites[k] || this.member()) return;
    S.invites[k] = { by: p.id, until: G.day + 3 };
    UI.banner(`🕯️ Um convite secreto`);
    UI.msg(`🕯️ ${People.full(p)} chamou você num canto: a ${SECRET_SOC[k].name} quer você entre os irmãos. Veja em Portfólio → Sociedades secretas.`, 'gold', true);
    Progress.diary(`🕯️ Recebeu um convite secreto da ${SECRET_SOC[k].name}, por ${People.full(p)}.`);
  },
  ask(k) {
    const S = this.S(), d = SECRET_SOC[k], f = this.friends(k)[0];
    if (this.member()) return;
    if ((S.asked[k] || -99) > G.day - 2) { UI.msg('Os irmãos ainda estão pensando no seu pedido.', 'bad'); return; }
    if (!f) { UI.msg(`Você não conhece nenhum irmão da ${d.name} que goste de você.`, 'bad'); return; }
    S.asked[k] = G.day;
    if (!this.reqs(k)) { UI.msg(`${People.full(f)}: "Ainda não. A ${d.name} pede nível ${d.lvl} e ${d.fame} de fama."`, 'bad'); return; }
    if (f.aff >= 35 || Math.random() < 0.4) this.invite(k, f);
    else UI.msg(`${People.full(f)}: "Ainda não confio o bastante em você para isso."`, 'bad');
  },
  accept(k) {
    const S = this.S(); if (!S.invites[k]) return;
    delete S.invites[k]; S.joinOk = k;
    KOrders.join(k); S.joinOk = null;
    if (this.key() === k) { S.invites = {}; if (typeof Commerce !== 'undefined' && !Commerce.st().myGuild) Commerce.st().member = k; }
  },
  decline(k) { const S = this.S(); const iv = S.invites[k]; delete S.invites[k]; const p = iv && G.people[iv.by]; if (p) p.aff = Math.max(-100, (p.aff || 0) - 5); },
  // ---------------------------------------------------------------- todo mês
  monthTick() {
    this.seed(); const S = this.S();
    for (const k in S.invites) if (S.invites[k].until < G.day) delete S.invites[k];
    if (!this.member()) {
      // um irmão amigo convida
      if (!Object.keys(S.invites).length) for (const k of Object.keys(SECRET_SOC)) { const f = this.friends(k)[0]; if (f && f.aff >= 45 && this.reqs(k) && Math.random() < 0.25) { this.invite(k, f); break; } }
      return;
    }
    const k = this.key(), r = this.rank();
    // influência: os reinos de reis irmãos gostam mais de você
    if (k) for (const c of G.civs) if (this.kingBro(c.id)) Game.addRelation(c.id, 1 + r);
    // segredos: a carta do mês
    if (r >= 1 && Math.random() < 0.6) { const t = this.secret(); if (t) { S.secrets.unshift({ day: G.day, t }); if (S.secrets.length > 8) S.secrets.length = 8; UI.msg(`🕯️ Uma carta lacrada dos irmãos: ${t}`, 'gold'); } }
  },
  secret() {
    const out = [];
    if ((G.assassins || 0) > 0) { const f = typeof Hitmen !== 'undefined' ? Hitmen.payer() : null; out.push(f ? `a ${Families.name(f)} pagou assassinos para matar você.` : 'alguém na corte pagou assassinos para matar você.'); }
    const mine = G.civs.filter(c => c.ruler === 'player');
    for (const c of mine) for (const o of G.civs) if (o.id !== c.id && !o.dead && !Diplo.atWar(c.id, o.id) && Diplo.rel(c.id, o.id) < -40) out.push(`o rei de ${CIV_DEFS[o.id].short} fala em guerra contra ${CIV_DEFS[c.id].short}.`);
    for (const f of Object.values(G.fams || {})) if (f.grudge >= 30) out.push(`a ${Families.name(f)} guarda rancor dos seus negócios${f.grudge >= 60 ? ' e planeja sabotar você' : ''}.`);
    for (const c of G.civs) if (!c.dead && c.ruler !== 'player' && (c.happy || 0) < 30) out.push(`o povo de ${CIV_DEFS[c.id].short} está à beira da revolta.`);
    const rich = Object.values(G.fams || {}).filter(f => !f.player && f.wealth > 2000).sort((a, b) => b.wealth - a.wealth)[0];
    if (rich) out.push(`a ${Families.name(rich)} esconde ${Math.round(rich.wealth).toLocaleString('pt-BR')} 🪙 nos cofres.`);
    return out.length ? U.pick(out) : null;
  },
  // ---------------------------------------------------------------- a página
  esc(s) { return UI.esc(s); },
  powerful(k) {
    const B = this.brothers(k), kings = B.filter(p => G.civs.some(c => !c.dead && c.rulerId === p.id && c.ruler !== 'player')), nobles = B.filter(p => ['consort', 'heir'].includes(p.rank)), knights = B.filter(p => p.rank === 'knight' && !p.korder);
    return { kings, nobles, knights, crafts: B.length - kings.length - nobles.length - knights.length };
  },
  emblem(d, sz) { return `<span class="sc-emb" style="--c:${d.col};--x:${d.cross};width:${sz}px;height:${Math.round(sz * 1.15)}px;font-size:${Math.round(sz * 0.45)}px">${d.icon}</span>`; },
  benefits(r, k) {
    const kb = G.civs.filter(c => this.kingBro(c.id)), inv = Math.round(SECRET_INV[Math.max(0, r)] * 100);
    return [['🛡️', 'Proteção dos irmãos', kb.length ? `${kb.map(c => CIV_DEFS[c.id].short).join(', ')}: ${r >= 2 ? 'o caso é abafado' : 'multa pela metade'}; pena de prisão menor` : 'Nenhum rei irmão agora: os irmãos não aceitam matar você'],
      ['💰', 'Investimentos', `+${inv}% nos seus empreendimentos${k ? ` (+${inv + 10}% nos de ${Commerce.GUILDS[k] ? Commerce.GUILDS[k].trade : 'ofício'})` : ''}; vendas e encomendas +10%`],
      ['⚔️', 'Exército', `${KOrders.knights().length} ${KOrders.knights().length === 1 ? 'cavaleiro segue' : 'cavaleiros seguem'} você · +${SECRET_ARMY[Math.max(0, r)]} irmãos soldados nas guerras do seu reino`],
      ['🕯️', 'Segredos e influência', `${r >= 1 ? 'cartas com os segredos do mês' : 'cartas a partir de Companheiro'} · relação +${1 + Math.max(0, r)}/mês com reis irmãos · votos dos irmãos nas eleições`]];
  },
  page() {
    this.seed();
    const S = this.S(), K = KOrders.S(), d = KOrders.def(), esc = this.esc.bind(this);
    if (d) {
      const k = this.key(), r = KOrders.rank(), m = K.mission, M = m && KO_MISSIONS[m.k], prog = m && M.stat ? `${Math.min(KOrders.progress(), M.need)}/${M.need}` : '';
      const pw = k ? this.powerful(k) : null;
      const path = SECRET_RANKS.map((n, i) => `<div class="sc-step ${i <= r ? 'on' : ''} ${i === r ? 'cur' : ''}"><i>${i + 1}</i><small>${n}</small>${K.key !== 'own' ? `<em>${KO_RANKS[i][1]} missões</em>` : ''}</div>`).join('');
      const bros = k ? [...pw.kings.map(p => ['👑', p, `Rei de ${CIV_DEFS[(G.civs.find(c => c.rulerId === p.id) || {}).id] ? CIV_DEFS[G.civs.find(c => c.rulerId === p.id).id].short : '?'}`]), ...pw.nobles.map(p => ['🎖️', p, People.title(p)]), ...pw.knights.slice(0, 4).map(p => ['🛡️', p, People.title(p)])] : [];
      return `<div class="sc-hero me" style="--c:${d.col};--x:${d.cross}">${this.emblem(d, 84)}<div class="sc-htx"><small>Você é ${SECRET_RANKS[r]}</small><h3>${esc(d.name)}</h3><i class="sc-motto">"${esc(d.motto || d.oath)}"</i>
          <div class="sc-path">${path}</div><small class="sc-oath">⚖️ Juramento: ${esc(d.oath)}${K.key !== 'own' ? ` · quebras ${K.viol}/3` : ''}</small></div></div>
        <div class="sc-cols">
          <div class="card sc-ben"><div class="sec">✨ O que a sociedade faz por você</div>${this.benefits(r, k).map(b => `<div class="sc-b"><span>${b[0]}</span><b>${b[1]}</b><small>${esc(b[2])}</small></div>`).join('')}</div>
          <div class="sc-side">
            ${K.key !== 'own' ? `<div class="card"><div class="sec">📜 Missão secreta do mês</div>${m ? `<div class="sc-mis"><span>${M.icon}</span><div><b>${M.text}</b><small>${prog ? `progresso ${prog} · ` : ''}até ${Calendar.short(m.until)}</small></div>${m.k === 'donate' ? `<button class="primary" data-act="ko" data-op="donate" ${P.gold >= 250 ? '' : 'disabled'}>Doar 250 🪙</button>` : ''}</div>` : '<small class="muted">A próxima missão chega no mês que vem.</small>'}</div>` : ''}
            <div class="card"><div class="sec">🕯️ Cartas lacradas <span>segredos</span></div>${S.secrets.length ? S.secrets.slice(0, 5).map(s => `<div class="sc-sec"><em>${Calendar.short(s.day)}</em><span>${esc(s.t)}</span></div>`).join('') : `<small class="muted">${r >= 1 ? 'Nenhum segredo ainda: as cartas chegam na virada do mês.' : 'Os irmãos só contam segredos a partir de Companheiro.'}</small>`}</div>
          </div>
          <div class="card sc-bros"><div class="sec">🤝 Irmãos poderosos <span>${k ? `${this.brothers(k).length} irmãos` : 'a sua sociedade'}</span></div>${bros.length ? bros.map(([ic, p, t]) => `<div class="sc-bro"><span>${ic}</span><b>${esc(People.full(p))}</b><small>${esc(t)}</small></div>`).join('') : '<small class="muted">Nenhum poderoso entre os irmãos ainda.</small>'}
            ${k ? `<small class="muted sc-cr">🔨 e ${pw.crafts} mestres de ofício (${esc(Commerce.GUILDS[k] ? Commerce.GUILDS[k].trade : '')})</small>` : ''}
            <div class="sec sc-sub">🛡️ Cavaleiros que seguem você <span>${KOrders.knights().length}</span></div>${KOrders.knights().map(p => `<div class="sc-bro"><span>${d.icon}</span><b>${esc(People.full(p))}</b><small>${p.korderWait ? 'esperando vaga' : 'com você'}</small></div>`).join('') || '<small class="muted">A partir de Companheiro, a sociedade manda cavaleiros para seguir você.</small>'}
            ${r >= 1 ? `<div class="act-row"><button data-act="ko" data-op="armor">🛡️ Pegar o manto da sociedade</button></div>` : ''}</div>
        </div>
        <div class="sc-quit"><button class="danger" data-act="ko" data-op="leave">🏳️ Deixar a sociedade</button></div>`;
    }
    const inv = Object.entries(S.invites);
    const ben = [['🛡️', 'Irmãos protegem', 'Um rei irmão alivia a multa e a prisão; irmãos não aceitam matar você.'], ['💰', 'Investimentos', 'Os seus empreendimentos rendem mais; vendas e encomendas melhores.'],
      ['⚔️', 'Exército', 'Cavaleiros da sociedade seguem você e irmãos lutam nas suas guerras.'], ['🕯️', 'Segredos e influência', 'Cartas com os segredos do mês, reis irmãos mais amigos e votos nas eleições.']];
    const cards = Object.entries(SECRET_SOC).map(([k, s]) => {
      const pw = this.powerful(k), f = this.friends(k), iv = S.invites[k], e = KOrders.why(k), ok = this.reqs(k);
      const btn = iv ? `<button class="primary" data-act="sec" data-op="accept" data-k="${k}">🕯️ Aceitar o convite</button>`
        : f.length ? `<button data-act="sec" data-op="ask" data-k="${k}" ${ok ? '' : 'disabled'}>🤝 Pedir a ${esc(f[0].name)}</button>` : '<small class="muted">Faça amizade com um irmão</small>';
      return `<div class="sc-card ${iv ? 'inv' : ''}" style="--c:${s.col};--x:${s.cross}">${this.emblem(s, 56)}<b>${esc(s.name)}</b><i class="sc-motto">"${esc(s.motto)}"</i>
        <small class="sc-trade">🔨 ${esc(Commerce.GUILDS[k] ? Commerce.GUILDS[k].trade : '')}</small>
        <div class="sc-req"><span class="${P.level >= s.lvl ? 'ok' : ''}">⭐ nível ${s.lvl}</span><span class="${(G.fame || 0) >= s.fame ? 'ok' : ''}">✨ fama ${s.fame}</span></div>
        <div class="sc-pw">${pw.kings.length ? `<span>👑 ${pw.kings.length} ${pw.kings.length === 1 ? 'rei' : 'reis'}</span>` : ''}${pw.nobles.length ? `<span>🎖️ ${pw.nobles.length} ${pw.nobles.length === 1 ? 'nobre' : 'nobres'}</span>` : ''}<span>🤝 ${this.brothers(k).length} ${this.brothers(k).length === 1 ? 'irmão' : 'irmãos'}</span></div>
        <small class="sc-fr">${f.length ? `Você conhece: ${f.slice(0, 2).map(p => `${esc(p.name)} (${Math.round(p.aff)})`).join(', ')}` : 'Você não conhece nenhum irmão'}</small>
        <div class="sc-ca">${btn}</div>${iv ? `<small class="sc-ivby">convite de ${esc(People.full(G.people[iv.by]))} · até ${Calendar.short(iv.until)} · <button class="link" data-act="sec" data-op="decline" data-k="${k}">recusar</button></small>` : ''}</div>`;
    }).join('');
    const fe = KOrders.canFound();
    // (três páginas: cabe na janela; as sociedades se dividem em partes se não couberem)
    const about = `<div class="sc-hero"><div class="sc-candle">🕯️</div><div class="sc-htx"><small>Irmandades escondidas nos Sete Reinos</small><h3>Sociedades secretas</h3><p>Ninguém entra sem ser convidado: um irmão precisa confiar em você. Lá dentro, os irmãos se protegem, enriquecem juntos e sabem o que ninguém sabe.</p></div>
        <div class="sc-ways">${ben.map(b => `<div><span>${b[0]}</span><b>${b[1]}</b><small>${b[2]}</small></div>`).join('')}</div></div>
      <div class="sc-how"><b>Como entrar</b><span>1. Faça amizade com um irmão (converse, dê presentes).</span><span>2. Tenha o nível e a fama que a sociedade pede.</span><span>3. Peça o apadrinhamento a ele, ou espere: um irmão amigo convida você.</span></div>`;
    const found = `<div class="card sc-found"><div class="sec">✨ Fundar a sua sociedade <span>${fe ? esc(fe) : 'você pode'}</span></div><p class="dt-desc">Você é o Grão-Mestre desde o primeiro dia: escolha o nome e a cor. Todo mês a sua sociedade arma um cavaleiro novo (até 6), com soldo de 20 🪙 cada.</p>
        <div class="act-row ko-found"><input id="koName" maxlength="40" placeholder="Irmandade de ${esc(G.surname || G.name)}">${KO_COLORS.map(c => `<button class="ko-col" data-act="ko" data-op="col" data-c="${c}" style="background:${c}" ${UI.sel.koCol === c ? 'data-on="1"' : ''}></button>`).join('')}
        <button class="primary" data-act="ko" data-op="found" ${fe ? 'disabled' : ''}>🕯️ Fundar — 4.000 🪙</button></div></div>`;
    return Services.subs('sc0', [['sociedades', '🕯️', `As sociedades${inv.length ? ` (${inv.length} ${inv.length === 1 ? 'convite' : 'convites'})` : ''}`, `${inv.length ? `<div class="sc-invbar">🕯️ Você tem ${inv.length === 1 ? 'um convite' : inv.length + ' convites'}: ${inv.map(([k]) => esc(SECRET_SOC[k].name)).join(', ')}.</div>` : ''}<div class="sc-grid sv-pl">${cards}</div>`],
      ['sobre', '📜', 'Como funciona', about], ['fundar', '✨', 'Fundar a sua', found]]);
  },
};

{
  // jogos salvos: as ordens de antes viram as sociedades; quem era da guilda vira Aprendiz da sociedade dela
  const migrate = () => {
    const K = KOrders.S(), C = typeof Commerce !== 'undefined' ? Commerce.st() : {};
    if (SECRET_FROM[K.key]) K.key = SECRET_FROM[K.key];
    for (const p of G.people) if (p.korder && SECRET_FROM[p.korder]) p.korder = SECRET_FROM[p.korder];
    for (const k in K.left || {}) if (SECRET_FROM[k]) { K.left[SECRET_FROM[k]] = K.left[k]; delete K.left[k]; }
    if (!K.key && C.member && SECRET_SOC[C.member]) Object.assign(K, { key: C.member, pts: 0, viol: 0, mission: null, since: G.day });
    if (!K.key && C.myGuild) Object.assign(K, { key: 'own', pts: 0, viol: 0, mission: null, own: { name: C.myGuild.name, icon: '🕯️', col: KO_COLORS[0], cross: '#f0e0b0', mat: 'gold', knights: 1, since: C.myGuild.founded || G.day, oath: 'A palavra do Grão-Mestre é lei.' } });
    if (K.key === 'own' && K.own) KOrders.makeItems('own', K.own);
    Secret.seed();
  };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); if (G.state === 'play') { try { migrate(); } catch (e) { console.error(e); } } return r; };
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = function (...a) { const r = ng0(...a); try { Secret.seed(); } catch (e) { console.error(e); } return r; };
  // só entra quem foi convidado
  const why0 = KOrders.why.bind(KOrders);
  KOrders.why = function (k) { const e = why0(k); if (e) return e; return Secret.S().joinOk === k || Secret.S().invites[k] ? null : 'Só entra quem é convidado.'; };
  const lv0 = KOrders.leave.bind(KOrders);
  KOrders.leave = function (...a) { const r = lv0(...a); if (typeof Commerce !== 'undefined') Commerce.st().member = null; return r; };
  // juramento: crimes (as sociedades estritas) — o de antes olhava os nomes das ordens antigas
  const cm0 = Crime.commit.bind(Crime);
  Crime.commit = function (ci, what, fine, ...rest) {
    const p = Secret.kingBro(ci), r = Secret.rank();
    if (p && r >= 2) { UI.msg(`🕯️ ${People.full(p)}, seu irmão e rei de ${CIV_DEFS[ci].short}, abafou o caso: ninguém vai procurar você por ${what}.`, 'gold'); return false; }
    if (p) fine = Math.round(fine / 2);
    const res = cm0(ci, what, fine, ...rest);
    if (res && p) UI.msg(`🕯️ ${People.full(p)}, seu irmão e rei de ${CIV_DEFS[ci].short}, cortou a multa pela metade.`, 'gold');
    const d = KOrders.def(); if (res && d && d.strict && KOrders.S().key !== 'own') KOrders.violate(String(what || 'um crime'));
    return res;
  };
  // prisão: um rei irmão encurta a pena
  if (typeof Prison !== 'undefined') {
    const se0 = Prison.sentence.bind(Prison);
    Prison.sentence = function (ci, bounty) { const s = se0(ci, bounty), p = Secret.kingBro(ci); if (p) { s.months = Math.max(1, Math.floor(s.months / (Secret.rank() >= 2 ? 3 : 2))); s.brother = p; } return s; };
  }
  // irmãos não aceitam matar você nem entram para bandos
  if (typeof Hitmen !== 'undefined') { const hf0 = Hitmen.fit.bind(Hitmen); Hitmen.fit = function (p, k) { return !Secret.myBro(p) && hf0(p, k); }; }
  if (typeof Bands !== 'undefined') { const bf0 = Bands.fit.bind(Bands); Bands.fit = function (p) { return !Secret.myBro(p) && bf0(p); }; }
  // investimentos: os empreendimentos rendem mais (e mais ainda os do ofício da sociedade)
  const fc0 = Biz.forecast.bind(Biz);
  Biz.forecast = function (s) {
    const f = fc0(s), r = Secret.rank(); if (r < 0) return f;
    const k = Secret.key(), mul = 1 + SECRET_INV[r] + (k && typeof Commerce !== 'undefined' && Commerce.guildOfBiz(s.type) === k ? 0.1 : 0);
    const out = {}; for (const it in f.out) out[it] = Math.round(f.out[it] * mul);
    return Object.assign({}, f, { out, gold: Math.round(f.gold * mul) });
  };
  // exército: irmãos soldados nas guerras do seu reino
  const ao0 = War.armyOf.bind(War);
  War.armyOf = function (ci, cfg) { const a = ao0(ci, cfg); const r = Secret.rank(); if (a && r >= 0 && G.civs[ci] && G.civs[ci].ruler === 'player' && SECRET_ARMY[r]) { a.soldiers += SECRET_ARMY[r]; a.soc = SECRET_ARMY[r]; } return a; };
  // eleições: os irmãos votam em você
  if (typeof Politics !== 'undefined' && Politics.likes) { const lk0 = Politics.likes.bind(Politics); Politics.likes = function (r, who) { return lk0(r, who) + (who === 'player' && Secret.myBro(r) ? 15 : 0); }; }
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Secret.monthTick(); } catch (e) { console.error(e); } };
  // Portfólio → Gestão: a página das Sociedades secretas no lugar das Ordens de cavalaria
  const ni0 = Board.navItems.bind(Board);
  Board.navItems = function () { return ni0().map(it => it[0] === 'x:ordens' ? ['x:ordens', '🕯️', 'Sociedades secretas', Object.keys(Secret.S().invites).length ? '!' : it[3], !!Object.keys(Secret.S().invites).length] : it); };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { if (nav === 'x:ordens') return UI.pageHead('🕯️', 'Sociedades secretas', 'Irmãos, graus, segredos e proteção — só por convite') + Secret.page(); return kp0(nav); };
  // a página cabe na janela: o que não couber vira partes (◀ 1/2 ▶)
  const sk0 = UI.showKingdom.bind(UI);
  UI.showKingdom = function (...a) { const r = sk0(...a); if (this.sel.knav === 'x:ordens') { try { Services.paginate(); } catch (e) { console.error(e); } } return r; };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'sec') return a0(a, d);
    if (d.op === 'ask') Secret.ask(d.k); else if (d.op === 'accept') Secret.accept(d.k); else if (d.op === 'decline') Secret.decline(d.k);
    UI.refresh();
  };
  // Negócios: a aba Guildas saiu (as guildas agora são as sociedades)
  if (UI.showBizBoard) { const bb0 = UI.showBizBoard.bind(UI); UI.showBizBoard = function (tab) { if ((tab || this.sel.bbTab) === 'guilds') { this.sel.bbTab = 'biz'; this.sel.knav = 'x:ordens'; return this.showKingdom(); } return bb0(tab); }; }
}

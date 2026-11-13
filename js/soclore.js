'use strict';
// Cada sociedade com os seus nomes e costumes, e um templo de cada sociedade em cada reino:
//  • Graus, cargos, o nome do templo e o título de quem o comanda são os de cada sociedade: na Maçonaria, Aprendiz,
//    Companheiro e Mestre Maçom, a Grande Loja e o Grão-Mestre (o líder dos maçons), o Orador, o Secretário e o Cobridor;
//    nos Templários, a Comendadoria e o Mestre do Templo; nos Illuminati, a Igreja Minerval e o Areopagita; no Priorado,
//    o Nautonnier; nos Hospitalários, o Grão-Prior; na Ordem Teutônica, o Alto Mestre; na Rosa-Cruz, o Imperator... Na sociedade que você
//    fundar, você escolhe os nomes e os costumes (no templo, aba Costumes).
//  • 🏛️ Em cada reino há um templo de cada sociedade, perto da capital, com o seu Grão-Mestre (um irmão importante
//    daquele reino). Irmãos entram, reúnem-se com os irmãos dali e conversam com o Grão-Mestre; quem não é da sociedade
//    só fala com o Grão-Mestre na porta. Chegando ao grau mais alto, você comanda o templo da sua sociedade nos reinos
//    que governa (ou no reino mais perto).
const SOC_LORE = {
  crafts:    { ranks: ['Aprendiz', 'Companheiro', 'Mestre Maçom', 'Grão-Mestre'], temple: 'Grande Loja', head: 'Grão-Mestre', member: 'irmão',
    posts: { tesoureiro: 'Tesoureiro', orador: 'Orador', guarda: 'Cobridor', secretario: 'Secretário' },
    custom: 'Sessões de avental, com o esquadro e o compasso sobre o altar; cada grau tem o seu toque e a sua palavra de passe.' },
  smiths:    { ranks: ['Escudeiro', 'Cavaleiro', 'Comendador', 'Mestre do Templo'], temple: 'Comendadoria', head: 'Mestre do Templo', member: 'irmão cavaleiro',
    posts: { tesoureiro: 'Tesoureiro da Ordem', orador: 'Senescal', guarda: 'Marechal', secretario: 'Capelão' },
    custom: 'Manto branco com a cruz vermelha; o capítulo se reúne de joelhos e os irmãos juram pobreza, castidade e obediência.' },
  merchants: { ranks: ['Noviço', 'Minerval', 'Iluminado', 'Areopagita'], temple: 'Igreja Minerval', head: 'Areopagita', member: 'iluminado',
    posts: { tesoureiro: 'Tesoureiro', orador: 'Insinuante', guarda: 'Censor', secretario: 'Escrivão' },
    custom: 'Cada irmão usa um nome secreto; as cartas andam em cifra e ninguém conhece mais que o seu superior direto.' },
  weavers:   { ranks: ['Noviço', 'Cruzado', 'Senescal', 'Nautonnier'], temple: 'Priorado', head: 'Nautonnier', member: 'irmão',
    posts: { tesoureiro: 'Tesoureiro', orador: 'Arauto', guarda: 'Condestável', secretario: 'Arquivista' },
    custom: 'Guardam a genealogia da linhagem sagrada e juram sobre o pergaminho dos ancestrais, à luz de uma única vela.' },
  victuals:  { ranks: ['Irmão Servente', 'Cavaleiro de Justiça', 'Bailio', 'Grão-Prior'], temple: 'Grão-Priorado', head: 'Grão-Prior', member: 'irmão hospitalário',
    posts: { tesoureiro: 'Conservador', orador: 'Hospitalário', guarda: 'Marechal', secretario: 'Chanceler' },
    custom: 'Manto negro com a cruz branca de oito pontas; os pobres e os enfermos são servidos antes dos irmãos sentarem à mesa.' },
  hunters:   { ranks: ['Meio-Irmão', 'Cavaleiro', 'Comendador', 'Alto Mestre'], temple: 'Comenda', head: 'Alto Mestre', member: 'irmão cavaleiro',
    posts: { tesoureiro: 'Tressler', orador: 'Grão-Comendador', guarda: 'Marechal', secretario: 'Chanceler' },
    custom: 'Manto branco com a cruz negra; vivem em castelos-conventos e caçam as feras das fronteiras.' },
  healers:   { ranks: ['Zelator', 'Theoricus', 'Philosophus', 'Imperator'], temple: 'Templo da Rosa', head: 'Imperator', member: 'frater',
    posts: { tesoureiro: 'Tesoureiro', orador: 'Orador', guarda: 'Guardião do Portal', secretario: 'Arquivista' },
    custom: 'Estudam a alquimia e a cura em silêncio; uma rosa sobre a cruz marca a porta da casa de cada irmão.' },
};
const SOC_LORE_OWN = { ranks: ['Iniciado', 'Irmão', 'Mestre', 'Grão-Mestre'], temple: 'Templo', head: 'Grão-Mestre', member: 'irmão',
  posts: { tesoureiro: 'Tesoureiro', orador: 'Orador', guarda: 'Guarda do Templo', secretario: 'Secretário' }, custom: '' };
const SOC_DEF_RANKS = ['Aprendiz', 'Companheiro', 'Mestre', 'Grão-Mestre'];
CIV_STRUCTS.soc_lodge = { name: 'Templo', blocks: true };
if (typeof FIXED_STRUCTS !== 'undefined' && !FIXED_STRUCTS.includes('soc_lodge')) FIXED_STRUCTS.push('soc_lodge');

const SocLore = {
  // os nomes e costumes de uma sociedade (a sua: os que você escolheu)
  of(k) {
    if (k === 'own') { const o = (KOrders.S().own || {}).lore || {}; return { ...SOC_LORE_OWN, ...o, posts: { ...SOC_LORE_OWN.posts, ...(o.posts || {}) }, ranks: (o.ranks && o.ranks.length === 4 ? o.ranks : SOC_LORE_OWN.ranks) }; }
    return SOC_LORE[k] || { ...SOC_LORE_OWN };
  },
  // as telas usam as listas de nomes de sempre: elas passam a ter os nomes da sua sociedade
  sync() {
    const k = KOrders.S().key, L = k ? this.of(k) : null, R = L ? L.ranks : SOC_DEF_RANKS;
    R.forEach((n, i) => { if (KO_RANKS[i]) KO_RANKS[i][0] = n; SECRET_RANKS[i] = n; SOC2_TITLES[i] = n; });
    for (const q in SOC2_POSTS) SOC2_POSTS[q].name = L ? L.posts[q] || SOC2_POSTS[q].name : SOC_LORE_OWN.posts[q];
  },
};

// ---------------------------------------------------------------- os templos dos reinos
const Lodges = {
  L() { const u = G.urban || (G.urban = {}); return u.lodges || (u.lodges = { list: [], heads: {}, net: {} }); },
  key(k, ci) { return k + ':' + ci; },
  struct(k, ci) { return World.structs.find(s => s && !s.removed && s.type === 'soc_lodge' && s.soc === k && s.owner === ci) || null; },
  name(k, ci) { return `${SocLore.of(k).temple} de ${CIV_DEFS[ci] ? CIV_DEFS[ci].short : '?'}`; },
  // um lugar perto da capital, dentro do reino, sem estrada nem construção (o mesmo a cada carregamento: fica guardado)
  spot(ci, ki) {
    const cp = World.capitals[ci]; if (!cp) return null;
    for (let r = 16; r <= 46; r += 2) for (let a = 0; a < 28; a++) {
      const ang = (a / 28 + ki / 7 + ci * 0.11) * Math.PI * 2, x = Math.round(cp.x + Math.cos(ang) * r) - 1, y = Math.round(cp.y + Math.sin(ang) * r * 0.85) - 1;
      if (!World.inb(x - 1, y - 1) || !World.inb(x + 4, y + 4)) continue;
      if (World.terr && World.terr[World.idx(x + 1, y + 1)] !== ci) continue;
      if (!World.areaOk(x, y, 3, 3) || !World.areaFree(x - 1, y - 1, 5, 5) || (typeof Towns !== 'undefined' && Towns.onRoad(x, y, 3, 3))) continue;
      if (World.villages.some(v => v && U.dist(v.x, v.y, x, y) < 9)) continue;
      return { x, y };
    }
    return null;
  },
  // espalhados pelo reino inteiro: longe da capital, das vilas, das estradas e um do outro
  spread(ci, taken) {
    const cands = [], W = WORLD_W, H = WORLD_H, cp = World.capitals[ci];
    for (let y = 4; y < H - 6; y += 3) for (let x = 4; x < W - 6; x += 3) if (World.terr[y * W + x] === ci) cands.push([x, y]);
    const rnd = U.mulberry32((World.seed ^ (ci * 7919 + 13)) >>> 0);
    for (let k = cands.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [cands[k], cands[j]] = [cands[j], cands[k]]; }
    for (const [x, y] of cands) {
      if (World.terr[World.idx(x + 1, y + 1)] !== ci || World.terr[World.idx(x + 3, y + 3)] !== ci) continue;
      if (cp && U.dist(cp.x, cp.y, x, y) < 12) continue;
      if (!World.areaOk(x, y, 3, 3) || !World.areaFree(x - 1, y - 1, 5, 5) || (typeof Towns !== 'undefined' && Towns.onRoad(x, y, 3, 3))) continue;
      if (World.villages.some(v => v && U.dist(v.x, v.y, x, y) < 10)) continue;
      if (taken.some(t => U.dist(t.x, t.y, x, y) < 14)) continue;
      return { x, y };
    }
    return null;
  },
  ensure() {
    const L = this.L(), keys = Object.keys(SECRET_SOC);
    // versão 2: os templos saem de perto da capital e se espalham pelo reino
    if (L.placed && L.v !== 2) { for (const x of L.list) { const s = this.struct(x.k, x.ci); if (s) World.removeStruct(s); } L.list = []; L.placed = false; }
    if (!L.placed) {
      for (const c of G.civs) {
        if (!c || c.dead || !World.capitals[c.id]) continue;
        const taken = [];
        keys.forEach((k, ki) => { if (L.list.some(x => x.k === k && x.ci === c.id)) return; const p = this.spread(c.id, taken) || this.spot(c.id, ki); if (p) { taken.push(p); World.freeArea(p.x, p.y, 3, 3); L.list.push({ k, ci: c.id, x: p.x, y: p.y }); World.addStruct('soc_lodge', p.x, p.y, 3, 3, c.id, { soc: k }); } });
      }
      L.placed = true; L.v = 2;
    } else for (const x of L.list) if (!this.struct(x.k, x.ci)) { World.freeArea(x.x, x.y, 3, 3); World.addStruct('soc_lodge', x.x, x.y, 3, 3, x.ci, { soc: x.k }); }
    if (World.chunks) World.chunks.clear();
  },
  // o Grão-Mestre de cada templo: um irmão importante do reino (se não houver, um cavaleiro veterano entra para a sociedade)
  civOf(p) { return typeof Families !== 'undefined' && Families.civOf ? Families.civOf(p) : p.civ; },
  weight(p) { return G.civs.some(c => c.rulerId === p.id) ? 4 : NOBLE_RANKS.includes(p.rank) ? 3 : p.rank === 'knight' ? 2 : 1; },
  playerHeads(k, ci) {
    if (Secret.key() !== k || KOrders.rank() < 3) return false;
    const mine = G.civs.filter(c => c.ruler === 'player').map(c => c.id);
    if (mine.length) return mine.includes(ci);
    const S = Soc2.S(); if (S.homeLodge === undefined) { const near = World.capitals.map((cp, i) => ({ i, d: cp ? U.dist(cp.x, cp.y, P.x / TILE, P.y / TILE) : 1e9 })).sort((a, b) => a.d - b.d)[0]; S.homeLodge = near ? near.i : 0; }
    return S.homeLodge === ci;
  },
  head(k, ci) {
    if (this.playerHeads(k, ci)) return 'player';
    const L = this.L(), id = L.heads[this.key(k, ci)], cur = id !== undefined ? People.get(id) : null;
    if (cur && cur.alive && Secret.isBro(cur, k)) return cur;
    const B = Secret.brothers(k).filter(p => p.alive && p.age >= 25 && !p.capanga && !p.kin && p.spouse !== 'player' && this.civOf(p) === ci).sort((a, b) => this.weight(b) - this.weight(a) || b.age - a.age);
    let h = B[0];
    if (!h) { h = People.create({ rank: 'knight', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(42, 62), sex: Math.random() < 0.75 ? 'm' : 'f' }); h.ssoc = k; h.socRoll = true; }
    L.heads[this.key(k, ci)] = h.id; return h;
  },
  brothersIn(k, ci) { return Secret.brothers(k).filter(p => p.alive && this.civOf(p) === ci); },
  // reunião no templo de um reino (uma vez por mês em cada templo)
  meet(k, ci) {
    if (Secret.key() !== k) { UI.msg('Só os irmãos se reúnem no templo.', 'bad'); return; }
    const L = this.L(), key = this.key(k, ci); if (L.net[key] === G.day) { UI.msg('Os irmãos deste templo já se reuniram neste mês.', 'bad'); return; }
    if (P.gold < 30) { UI.msg('A reunião custa 30 🪙 (vinho e velas).', 'bad'); return; }
    P.gold -= 30; L.net[key] = G.day; Soc2.S().infl += 2; Progress.add('soc_net');
    const h = this.head(k, ci), met = this.brothersIn(k, ci).filter(p => p !== h).sort(() => Math.random() - 0.5).slice(0, 2);
    if (h && h !== 'player') met.unshift(h);
    for (const p of met) { p.met = true; People.addAff(p, 7); }
    const t = `🕯️ Reunião na ${this.name(k, ci)}: ${met.length ? met.map(p => People.full(p)).join(', ') + ' (+7 de amizade)' : 'os irmãos brindaram à sociedade'}.`;
    Soc2.log(t); UI.msg(t, 'gold'); Soc2.check();
  },
  listHtml(k) {
    const esc = UI.esc.bind(UI), rows = this.L().list.filter(x => x.k === k).sort((a, b) => a.ci - b.ci);
    if (!rows.length) return '<p class="muted">A sua sociedade não tem templos nos reinos.</p>';
    return rows.map(x => { const h = this.head(x.k, x.ci), n = this.brothersIn(x.k, x.ci).length;
      return `<div class="crow ${h === 'player' ? 'tp-mine' : ''}"><span class="ri">🏛️</span><span><b>${esc(this.name(x.k, x.ci))}</b><small>${SocLore.of(k).head}: ${h === 'player' ? '<b>você</b>' : esc(People.full(h))} · ${n} ${n === 1 ? 'irmão' : 'irmãos'} no reino</small></span><span class="act-row"><button data-act="lodge" data-op="map" data-k="${x.k}" data-c="${x.ci}">📍</button></span></div>`; }).join('');
  },
  // a janela do templo de um reino
  show(sid) {
    const s = World.structs[sid]; if (!s || s.type !== 'soc_lodge') return;
    SocLore.sync();
    const k = s.soc, ci = s.owner, d = SECRET_SOC[k], L = SocLore.of(k), esc = UI.esc.bind(UI), mine = Secret.key() === k, h = this.head(k, ci), B = this.brothersIn(k, ci);
    const hName = h === 'player' ? 'Você' : People.full(h), done = this.L().net[this.key(k, ci)] === G.day;
    const bros = B.filter(p => p !== h).sort((a, b) => this.weight(b) - this.weight(a)).slice(0, 10);
    const body = `<div class="lg-hero" style="--c:${d.col};--x:${d.cross}">${Secret.emblem(d, 64)}<div><small>${esc(d.name)} · ${esc(CIV_DEFS[ci].name)}</small><h3>${esc(this.name(k, ci))}</h3><i>"${esc(d.motto || d.oath)}"</i><p>${esc(L.custom)}</p></div></div>
      <div class="lg-cols"><div class="card"><div class="sec">👑 ${esc(L.head)}</div>
          <div class="lg-head"><b>${esc(hName)}</b><small>${h === 'player' ? `você comanda a ${esc(this.name(k, ci))}` : esc(People.title ? People.title(h) : h.rank) + (h.met ? ` · amizade ${Math.round(h.aff || 0)}` : '')}</small></div>
          ${h !== 'player' ? `<div class="act-row"><button data-act="lodge" data-op="talk" data-k="${h.id}">💬 Falar com ${h.sex === 'f' ? 'a' : 'o'} ${esc(L.head)}</button></div>` : ''}
          <div class="sec" style="margin-top:10px">🪜 Graus da ${esc(d.name)}</div><div class="lg-ranks">${L.ranks.map((n, i) => `<span class="${mine && i <= KOrders.rank() ? 'on' : ''}">${i + 1}. ${esc(n)}</span>`).join('')}</div>
          <div class="sec" style="margin-top:10px">🏅 Cargos</div><div class="lg-ranks">${Object.values(L.posts).map(n => `<span>${esc(n)}</span>`).join('')}</div></div>
        <div class="card"><div class="sec">🤝 ${mine ? 'Irmãos deste reino' : 'Os irmãos'} <span>${B.length}</span></div>
          ${mine ? (bros.length ? bros.map(p => `<div class="scx-bro"><span>${G.civs.some(c => c.rulerId === p.id) ? '👑' : NOBLE_RANKS.includes(p.rank) ? '🎖️' : p.rank === 'knight' ? '🛡️' : '🔨'}</span><b>${esc(People.full(p))}</b><small>${esc(People.title ? People.title(p) : p.rank)}</small></div>`).join('') : '<p class="muted">Ainda não há outros irmãos neste reino.</p>')
            : `<p class="dt-desc">As portas só se abrem para os ${esc(L.member)}s da ${esc(d.name)}. Quem quiser entrar precisa da amizade de um irmão — comece falando com ${h.sex === 'f' ? 'a' : 'o'} ${esc(L.head)}.</p>`}
          ${mine ? `<div class="act-row" style="margin-top:8px"><button class="primary" data-act="lodge" data-op="meet" data-k="${k}" data-c="${ci}" ${done ? 'disabled' : ''}>${done ? '✔ Reunião feita neste mês' : '🕯️ Reunir-se com os irmãos (30 🪙)'}</button><button data-act="tp" data-op="tab" data-k="loja">🏛️ A sua loja</button></div>` : ''}</div></div>`;
    UI.open(`🏛️ ${this.name(k, ci)}`, body, 'showLodge', [sid], d.name);
  },
};

{
  // nomes da sociedade em todas as telas
  for (const [o, n] of [[Soc2, 'show'], [Soc2, 'memberPage'], [KOrders, 'promote'], [KOrders, 'join'], [KOrders, 'leave'], [KOrders, 'found']]) {
    const f = o[n].bind(o); o[n] = function (...a) { SocLore.sync(); const r = f(...a); SocLore.sync(); return r; };
  }
  // o título: o grau, ou o comando de um templo
  const ti0 = Soc2.title.bind(Soc2);
  Soc2.title = function () {
    const k = Secret.key(); if (!k || this.rank() < 3) return ti0();
    const L = Lodges.L().list.find(x => x.k === k && Lodges.playerHeads(k, x.ci));
    return L ? `${SocLore.of(k).head} da ${Lodges.name(k, L.ci)}` : ti0();
  };
  // os templos no mundo: desenho, aviso e janela
  const dx0 = drawStructExtra;
  drawStructExtra = function (ctx, s, X, Y, time, H) {
    if (s.type !== 'soc_lodge') return dx0(ctx, s, X, Y, time, H);
    const d = SECRET_SOC[s.soc] || { col: '#5a4a8a', cross: '#e8d8a0', icon: '🕯️' }, { R, w, h, shadow } = H;
    shadow();
    R(4, h - 18, w - 8, 14, '#8e877a'); R(4, h - 6, w - 8, 3, '#6e675a');
    R(10, 28, w - 20, h - 46, '#d8d2c4');
    for (let k = 0; k < 5; k++) { const x = 12 + k * ((w - 30) / 4); R(x, 30, 6, h - 50, '#efeae0'); R(x, 30, 6, 3, '#bdb6a6'); }
    ctx.fillStyle = d.col; ctx.beginPath(); ctx.moveTo(X + 2, Y + 30); ctx.lineTo(X + w / 2, Y + 4); ctx.lineTo(X + w - 2, Y + 30); ctx.fill();
    ctx.fillStyle = d.cross; ctx.fillRect(X + 2, Y + 28, w - 4, 3);
    R(w / 2 - 8, h - 38, 16, 20, '#3a2a1e');
    ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.fillStyle = d.cross; ctx.fillText(d.icon, X + w / 2, Y + 24); ctx.textAlign = 'left';
  };
  const il0 = Game.interactLabel.bind(Game);
  Game.interactLabel = function (s) { if (s && s.type === 'soc_lodge') return `${Lodges.name(s.soc, s.owner)} — ${Secret.key() === s.soc ? 'entrar' : 'só para irmãos (falar com o ' + SocLore.of(s.soc).head + ')'}`; return il0(s); };
  const ci0 = Content2.interact.bind(Content2);
  Content2.interact = function (s) { if (s && s.type === 'soc_lodge') { Lodges.show(s.id); return true; } return ci0(s); };
  UI.showLodge = sid => Lodges.show(sid);
  // criados ao começar e ao carregar o jogo (no mesmo lugar)
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { const r = await ng0(...a); if (G.state === 'play') { try { Secret.seed(); Lodges.ensure(); SocLore.sync(); } catch (e) { console.error(e); } } return r; };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); if (G.state === 'play') { try { Lodges.ensure(); SocLore.sync(); } catch (e) { console.error(e); } } return r; };
  // os cargos com os nomes da sociedade; os templos dos reinos na aba A loja
  const sh0 = Soc2.show.bind(Soc2);
  Soc2.show = function (tab) {
    const own = KOrders.S().key === 'own';
    if (tab === 'costumes' && own) { sh0('loja'); SocLore.custForm(); return; }
    const r = sh0(tab);
    if (own && UI.panel) { const nav = UI.panel.querySelector('.bk3-tabs'); if (nav && !nav.querySelector('[data-k="costumes"]')) nav.insertAdjacentHTML('beforeend', `<button class="bk3-tab" data-act="tp" data-op="tab" data-k="costumes"><span class="bk3-ti">🎨</span><span class="bk3-tl"><b>Costumes</b><small>nomes e ritos</small></span></button>`); }
    return r;
  };
  // a sua sociedade: você escolhe os nomes dos graus, dos cargos, do templo, do comandante e os costumes
  SocLore.custForm = function () {
    const own = KOrders.S().own; if (!own || !UI.panel) return;
    const L = SocLore.of('own'), esc = UI.esc.bind(UI), inp = (id, v, ph) => `<input id="${id}" maxlength="40" value="${esc(v || '')}" placeholder="${esc(ph || '')}">`;
    const nav = UI.panel.querySelector('.bk3-tabs');
    if (nav) { for (const b of nav.querySelectorAll('.bk3-tab')) b.classList.remove('on'); if (!nav.querySelector('[data-k="costumes"]')) nav.insertAdjacentHTML('beforeend', `<button class="bk3-tab on" data-act="tp" data-op="tab" data-k="costumes"><span class="bk3-ti">🎨</span><span class="bk3-tl"><b>Costumes</b><small>nomes e ritos</small></span></button>`); else nav.querySelector('[data-k="costumes"]').classList.add('on'); }
    const t = UI.panel.querySelector('.bk3-pt b'); if (t) t.textContent = 'Costumes';
    const pi = UI.panel.querySelector('.bk3-pi'); if (pi) pi.textContent = '🎨';
    const body = UI.panel.querySelector('.bk3-body'); if (!body) return;
    body.className = 'bk3-body stretch';
    body.innerHTML = `<div class="card lg-form"><div class="sec">🪜 Os graus</div>${L.ranks.map((n, i) => `<label><span>${i + 1}º grau</span>${inp('slr' + i, n, SOC_LORE_OWN.ranks[i])}</label>`).join('')}
        <div class="sec" style="margin-top:10px">🏛️ O templo</div><label><span>Nome do templo</span>${inp('slt', L.temple, 'Templo')}</label><label><span>Quem comanda</span>${inp('slh', L.head, 'Grão-Mestre')}</label><label><span>Como os irmãos se chamam</span>${inp('slm', L.member, 'irmão')}</label></div>
      <div class="card lg-form"><div class="sec">🏅 Os cargos</div>${Object.keys(SOC2_POSTS).map(q => `<label><span>${SOC2_POSTS[q].icon} ${esc(SOC2_POSTS[q].desc.split(':')[0])}</span>${inp('slp_' + q, L.posts[q], SOC_LORE_OWN.posts[q])}</label>`).join('')}
        <div class="sec" style="margin-top:10px">✒️ Lema e juramento</div><label><span>Lema</span>${inp('slmo', own.motto || '', 'A palavra do líder é a lei.')}</label><label><span>Juramento</span>${inp('slo', own.oath || '', 'Nunca trair um irmão.')}</label></div>
      <div class="card lg-form"><div class="sec">🕯️ Costumes e ritos</div><textarea id="slc" maxlength="300" rows="6" placeholder="Como os irmãos se vestem, se reconhecem, se reúnem...">${esc(L.custom || '')}</textarea>
        <div class="act-row" style="margin-top:10px"><button class="primary" data-act="tp" data-op="lore">💾 Guardar os costumes</button></div><small class="muted">Os nomes aparecem nas telas da sociedade, no templo e nas mensagens.</small></div>`;
  };
  SocLore.saveForm = function () {
    const own = KOrders.S().own; if (!own) return;
    const v = id => { const el = document.getElementById(id); return el ? String(el.value || '').trim().slice(0, id === 'slc' ? 300 : 40) : ''; };
    const D = SOC_LORE_OWN;
    own.lore = { ranks: D.ranks.map((n, i) => v('slr' + i) || n), temple: v('slt') || D.temple, head: v('slh') || D.head, member: v('slm') || D.member,
      posts: Object.fromEntries(Object.keys(D.posts).map(q => [q, v('slp_' + q) || D.posts[q]])), custom: v('slc') };
    if (v('slmo')) own.motto = v('slmo'); if (v('slo')) own.oath = v('slo');
    SocLore.sync(); UI.msg('🎨 Os costumes da sua sociedade foram guardados.', 'gold');
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'tp' && d.op === 'lore') { SocLore.saveForm(); Soc2.show('costumes'); return; }
    if (a !== 'lodge') return a0(a, d);
    if (d.op === 'meet') { Lodges.meet(d.k, +d.c); const s = Lodges.struct(d.k, +d.c); if (s) Lodges.show(s.id); return; }
    if (d.op === 'talk') { UI.showTalk(+d.k); return; }
    if (d.op === 'map') { const s = Lodges.struct(d.k, +d.c); if (s && typeof MapView !== 'undefined' && MapView.ping) { MapView.ping(s.x + 1, s.y + 1); } else if (s) { G.ping = { x: s.x + 1, y: s.y + 1 }; UI.msg(`📍 ${Lodges.name(d.k, +d.c)} marcado no mapa.`); } return; }
  };
  // o Grão-Mestre de cada templo: se morrer, outro irmão assume no mês seguinte
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { for (const x of Lodges.L().list) Lodges.head(x.k, x.ci); } catch (e) { console.error(e); } };
}

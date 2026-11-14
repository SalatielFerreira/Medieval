'use strict';
// O Haras redesenhado (as regras do haras, das raças, do cruzamento e das corridas continuam em horses.js):
//  🐎 Meus cavalos — à esquerda o cavalo escolhido em destaque (o desenho de verdade do jogo, as qualidades, as corridas
//     e vitórias dele e as ações); à direita todos os seus cavalos e as baias livres, para escolher.
//  🎨 Personalizar — dar nome ao cavalo e escolher a pelagem, a crina e a cauda, a manta da sela (até nas cores do seu
//     reino), as meias brancas e a estrela na testa. Tudo aparece no cavalo de verdade, no mundo.
//  💕 Cruzamento — a égua e o garanhão escolhidos em cartões, com o potro esperado.
//  🏇 Grande Prêmio — o páreo do mês (como antes).
// Os desenhos dos cavalos nas janelas (haras e estábulo) são o mesmo desenho do mundo, feito numa telinha.
const HORSE_COATS = [['Castanho', '#6a4022'], ['Alazão', '#a0522d'], ['Preto', '#24201e'], ['Tordilho', '#a9a9a6'], ['Baio', '#c9a06a'], ['Palomino', '#d8b46a'], ['Branco', '#ece6da'], ['Ruão', '#8a5a4a'], ['Lobuno', '#7a7466'], ['Zaino', '#3a2418']];
const HORSE_MANES = [['Da pelagem', ''], ['Preta', '#1a1410'], ['Castanha', '#4a2a16'], ['Loira', '#e8d08a'], ['Branca', '#f2efe6'], ['Ruiva', '#a0401a'], ['Cinza', '#7a7a7a']];
const HORSE_BLANKETS = [['Vermelha', '#7a1f2a'], ['Azul', '#24407a'], ['Verde', '#2a5a2e'], ['Roxa', '#5a2a6a'], ['Preta', '#1e1a1a'], ['Dourada', '#b8902a'], ['Branca', '#e8e2d6']];
const HORSE_NAME_MAX = 18;

Object.assign(Horses, {
  // a chave do desenho: a pelagem e, se houver, a crina, a manta e as marcas
  key(h) {
    if (!h) return '#7a4a26';
    const L = h.look, c = h.color || '#7a4a26';
    if (!L) return c;
    return `${c}|${L.mane || ''}|${L.blanket || ''}|${(L.socks ? 's' : '') + (L.blaze ? 'b' : '')}`;
  },
  all() { return [P.horse, ...this.herd()].filter(Boolean).map(h => this.fix(h)); },
  byId(id) { return this.all().find(h => h.id === id) || null; },
  // o cavalo escolhido na janela (o montado, se nenhum)
  sel() { const h = this.byId(UI.sel.hsSel); return h || (P.horse ? this.fix(P.horse) : this.herd()[0] || null); },
  // a telinha onde o cavalo é desenhado (o desenho de verdade entra depois de abrir a janela)
  cv(key, w, cls) { return `<canvas class="hs-cv ${cls || ''}" data-hk="${UI.esc(key)}" width="${w}" height="${Math.round(w * 0.75)}"></canvas>`; },
  paint(root) {
    for (const c of (root || document).querySelectorAll('canvas.hs-cv[data-hk]')) {
      const g = c.getContext('2d'), k = c.dataset.hk, sc = c.width / 62;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
      g.setTransform(sc, 0, 0, sc, Math.round(c.width * 0.42), Math.round(c.height * 0.93));
      try { drawHorse(g, 0, 0, 1, 0.4, false, k, false); } catch (e) { /* desenho */ }
      g.setTransform(1, 0, 0, 1, 0, 0);
    }
  },
  // as cores do reino da sua cidadania (para a manta)
  realmBlanket() { const ci = typeof Cid !== 'undefined' ? Cid.get() : -1; return ci >= 0 && CIV_DEFS[ci] ? [`De ${CIV_DEFS[ci].short}`, Game.civColor(ci)] : null; },
  // personalizar
  setLook(id, k, v) {
    const h = this.byId(id); if (!h) return;
    const L = h.look || (h.look = {});
    if (k === 'coat') h.color = v; else if (k === 'socks' || k === 'blaze') L[k] = !L[k]; else L[k] = v;
  },
  rename(id, name) {
    const h = this.byId(id); if (!h) return;
    const n = String(name || '').replace(/[<>]/g, '').trim().slice(0, HORSE_NAME_MAX);
    if (!n) { UI.msg('Escreva um nome para o cavalo.', 'bad'); return; }
    const old = h.name; h.name = n; UI.msg(`🐎 ${old} agora se chama ${n}.`, 'gold');
  },
  record(h) { return { races: h.races || 0, wins: h.wins || 0, pods: h.pods || 0 }; },
  age(h) { const m = Math.max(0, G.day - (h.born || 0)); return m < 12 ? `${m} ${m === 1 ? 'mês' : 'meses'}` : `${Math.floor(m / 12)} ${Math.floor(m / 12) === 1 ? 'ano' : 'anos'}`; },
});

// as telinhas no lugar dos desenhos simples (também no páreo e no Estábulo)
Horses.svg = function (color, size) { return this.cv(color, size); };

Object.assign(Horses, {
  TABS: [['cavalos', '🐎', 'Meus cavalos'], ['visual', '🎨', 'Personalizar'], ['cruzar', '💕', 'Cruzamento'], ['premio', '🏇', 'Grande Prêmio']],
  tabs(tab) {
    const R = this.nextRace();
    return `<div class="tabs subtabs hs-tabs">${this.TABS.map(([k, ic, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="hs" data-op="tab" data-k="${k}">${ic} ${l}${k === 'premio' && !R.ran ? ' <em class="hs-dot">!</em>' : ''}</button>`).join('')}</div>`;
  },
  // o cartão pequeno de um cavalo (para escolher)
  tile(h, on) {
    const mounted = h === P.horse, B = HORSE_BREEDS[h.breed];
    return `<button class="hs-tile ${on ? 'on' : ''}" data-act="hs" data-op="sel" data-i="${h.id}">${this.cv(this.key(h), 66)}
      <span class="hs-tn"><b>${UI.esc(h.name)}</b><small>${B.name} · ${h.sex === 'm' ? '♂' : '♀'}${this.adult(h) ? '' : ' · potro'}${h.foal ? ' · 🍼' : ''}</small>${this.stars(h)}</span>${mounted ? '<em class="hs-mt">🐎 montado</em>' : ''}</button>`;
  },
  cavalosPage() {
    const h = this.sel(), stalls = this.stalls(), herd = this.herd();
    if (!h) return `<div class="hs-pg2"><div class="hs-none2">${this.cv('#6a5a44', 180)}<h3>Você ainda não tem cavalo</h3><small>Compre um no seu Estábulo: o primeiro vem montado com você. Para guardar mais, construa Estábulos (4 baias cada).</small></div></div>`;
    const r = this.record(h), mounted = h === P.horse, B = HORSE_BREEDS[h.breed];
    const big = `<div class="card hs-big"><div class="hs-bigpic">${this.cv(this.key(h), 220, 'big')}</div>
      <div class="hs-bigtx"><small>${mounted ? 'O cavalo que você monta' : 'No seu haras'}</small><h3>${UI.esc(h.name)} ${this.stars(h)}</h3>
        <div class="hs-who">${B.name} · ${h.sex === 'm' ? '♂ garanhão' : '♀ égua'} · ${this.age(h)}${this.adult(h) ? '' : ' · potro'}${h.foal ? ` · prenha 🍼 (${Math.max(0, h.foal.due - G.day)} m)` : ''}</div>
        ${this.stats(h)}
        <div class="hs-rec"><span>🏁 <b>${r.races}</b> corridas</span><span>🥇 <b>${r.wins}</b> vitórias</span><span>🏅 <b>${r.pods}</b> pódios</span></div>
        <div class="hs-acts2"><button class="primary" data-act="hs" data-op="tab" data-k="visual">🎨 Personalizar</button>
          ${mounted ? '' : `<button data-act="hs" data-op="ride" data-i="${h.id}" ${this.adult(h) ? '' : 'disabled'}>🐎 Montar</button><button class="danger" data-act="hs" data-op="sell" data-i="${h.id}">💰 Vender</button>`}</div></div></div>`;
    const tiles = this.all().map(x => this.tile(x, x === h));
    for (let i = herd.length; i < stalls; i++) tiles.push('<div class="hs-tile free"><span>🌾</span><small>Baia livre</small></div>');
    const list = `<div class="card hs-list"><div class="sec">🏡 Os seus cavalos <span>${herd.length}/${stalls} baias · ${STALLS_PER} por Estábulo</span></div>
      <div class="hs-tiles">${tiles.join('')}</div>${stalls ? '' : '<small class="muted">Construa um Estábulo (Construção → Baús e estábulo) para guardar mais cavalos e criar potros.</small>'}</div>`;
    return `<div class="hs-pg2 hs-two">${big}${list}</div>`;
  },
  visualPage() {
    const h = this.sel(); if (!h) return this.cavalosPage();
    const L = h.look || {}, esc = UI.esc.bind(UI);
    const sw = (k, list, cur) => `<div class="hs-sws">${list.filter(Boolean).map(([n, c]) => `<button class="hs-sw ${cur === c ? 'on' : ''}" data-act="hs" data-op="look" data-k="${k}" data-v="${c}" title="${esc(n)}"><i style="background:${c || 'linear-gradient(135deg,' + h.color + ',' + h.color + ')'}"></i><small>${esc(n)}</small></button>`).join('')}</div>`;
    const coats = HORSE_COATS.some(c => c[1] === h.color) ? HORSE_COATS : [['Original', h.color], ...HORSE_COATS];
    const rb = this.realmBlanket(), blankets = rb ? [...HORSE_BLANKETS, rb] : HORSE_BLANKETS;
    const pick = this.all().map(x => `<button class="hs-chip ${x === h ? 'on' : ''}" data-act="hs" data-op="sel" data-i="${x.id}" data-k="visual">${esc(x.name)}</button>`).join('');
    return `<div class="hs-pg2 hs-vis">
      <div class="card hs-prev"><div class="hs-chips">${pick}</div><div class="hs-prevpic">${this.cv(this.key(h), 260, 'big')}</div>
        <div class="hs-name"><input id="hsName" maxlength="${HORSE_NAME_MAX}" value="${esc(h.name)}" aria-label="Nome do cavalo"><button class="primary" data-act="hs" data-op="name" data-i="${h.id}">✏️ Dar nome</button></div>
        <small class="muted">${HORSE_BREEDS[h.breed].name} · ${h.sex === 'm' ? '♂ garanhão' : '♀ égua'} · a aparência não muda as qualidades.</small></div>
      <div class="card hs-opts">
        <div class="hs-opt"><b>🐴 Pelagem</b>${sw('coat', coats, h.color)}</div>
        <div class="hs-opt"><b>💈 Crina e cauda</b>${sw('mane', HORSE_MANES, L.mane || '')}</div>
        <div class="hs-opt"><b>🧣 Manta da sela</b>${sw('blanket', blankets, L.blanket || '#7a1f2a')}</div>
        <div class="hs-opt"><b>✨ Marcas</b><div class="hs-marks"><button class="${L.socks ? 'on' : ''}" data-act="hs" data-op="look" data-k="socks" data-i="${h.id}">🧦 Meias brancas</button><button class="${L.blaze ? 'on' : ''}" data-act="hs" data-op="look" data-k="blaze" data-i="${h.id}">⭐ Estrela na testa</button></div></div>
      </div></div>`;
  },
  cruzarPage() {
    const pr = this.pair(), herd = this.herd(), stalls = this.stalls(), esc = UI.esc.bind(UI);
    const m = pr.mares.find(h => h.id === UI.sel.hsM) || pr.mares[0], s = pr.studs.find(h => h.id === UI.sel.hsS) || pr.studs[0];
    const col = (list, cur, op, title) => `<div class="card hs-side"><div class="sec">${title}</div>${list.length ? `<div class="hs-picks">${list.map(h => `<button class="hs-pk ${h === cur ? 'on' : ''}" data-act="hs" data-op="${op}" data-i="${h.id}">${this.cv(this.key(h), 54)}<span><b>${esc(h.name)}</b><small>💨${h.speed} 🫁${h.stamina} 💪${h.strength}</small></span></button>`).join('')}</div>` : '<small class="muted">Nenhum adulto pronto.</small>'}</div>`;
    const avg = (a, b) => Math.round((a + b) / 2);
    const mid = m && s ? `<div class="card hs-mid"><div class="sec">🍼 O potro esperado</div><div class="hs-par">${this.cv(this.key(m), 90)}<span class="hs-x">×</span>${this.cv(this.key(s), 90)}</div>
        <div class="hs-stats hs-exp"><span>💨 Velocidade ${this.bar(avg(m.speed, s.speed), 'sp')}<b>~${avg(m.speed, s.speed)}</b></span><span>🫁 Fôlego ${this.bar(avg(m.stamina, s.stamina), 'st')}<b>~${avg(m.stamina, s.stamina)}</b></span><span>💪 Força ${this.bar(avg(m.strength, s.strength), 'sr')}<b>~${avg(m.strength, s.strength)}</b></span></div>
        <small class="muted">Nasce em ${HORSE_FOAL} meses e pode ser montado com ${HORSE_GROW}. Às vezes sai melhor que os pais.</small>
        <button class="primary big" data-act="hs" data-op="breed2" data-m="${m.id}" data-s="${s.id}" ${herd.length < stalls && this.haras() ? '' : 'disabled'}>💕 Cruzar ${esc(m.name)} e ${esc(s.name)}</button>
        ${herd.length < stalls ? '' : '<small class="bad">Falta uma baia livre para o potro.</small>'}${this.haras() ? '' : '<small class="bad">Construa um Haras para cruzar.</small>'}</div>`
      : `<div class="card hs-mid"><div class="hs-none2"><span>💕</span><small>Para cruzar: uma égua e um garanhão adultos (um deles pode ser o que você monta). Você tem ${pr.mares.length} ${pr.mares.length === 1 ? 'égua' : 'éguas'} e ${pr.studs.length} ${pr.studs.length === 1 ? 'garanhão' : 'garanhões'} prontos.</small></div></div>`;
    return `<div class="hs-pg2 hs-three">${col(pr.mares, m, 'pickM', '♀ Égua')}${mid}${col(pr.studs, s, 'pickS', '♂ Garanhão')}</div>`;
  },
});
{
  const pg0 = Horses.page.bind(Horses);
  Horses.page = function () {
    const tab = this.TABS.some(t => t[0] === UI.sel.hsTab) ? UI.sel.hsTab : 'cavalos';
    if (tab === 'premio') { const h = pg0(); return this.tabs('premio') + h.replace(/^<div class="tabs subtabs hs-tabs">[\s\S]*?<\/div>/, ''); }
    return this.tabs(tab) + (tab === 'visual' ? this.visualPage() : tab === 'cruzar' ? this.cruzarPage() : this.cavalosPage());
  };
  // os desenhos entram depois de a janela abrir (haras, estábulo, corrida)
  const op0 = UI.open.bind(UI);
  UI.open = function (...a) { const r = op0(...a); if (this.panel && this.panel.querySelector('canvas.hs-cv')) try { Horses.paint(this.panel); } catch (e) { console.error(e); } return r; };
  // corridas: o histórico de cada cavalo
  const rc0 = Horses.race.bind(Horses);
  Horses.race = function (...a) {
    const h = P.horse, n0 = this.S().hist.length, top = this.S().hist[0];
    const r = rc0(...a);
    const H = this.S().hist; if (h && H.length && (H.length !== n0 || H[0] !== top)) { const pl = H[0].place; h.races = (h.races || 0) + 1; if (pl === 1) h.wins = (h.wins || 0) + 1; if (pl <= 3) h.pods = (h.pods || 0) + 1; }
    return r;
  };
  // as ações novas
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'hs') return a0(a, d);
    switch (d.op) {
      case 'sel': UI.sel.hsSel = +d.i; if (d.k) UI.sel.hsTab = d.k; UI.refresh(); return;
      case 'look': { const h = Horses.sel(); if (h) Horses.setLook(h.id, d.k, d.v || ''); UI.refresh(); return; }
      case 'name': { const el = document.getElementById('hsName'); Horses.rename(+d.i, el ? el.value : ''); UI.refresh(); return; }
      case 'pickM': UI.sel.hsM = +d.i; UI.refresh(); return;
      case 'pickS': UI.sel.hsS = +d.i; UI.refresh(); return;
      case 'breed2': Horses.breed(+d.m, +d.s); UI.refresh(); return;
      case 'ride': UI.sel.hsSel = +d.i; break;
    }
    return a0(a, d);
  };
  // Enter no nome também dá o nome
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'hsName') { const b = UI.panel && UI.panel.querySelector('[data-op="name"]'); if (b) b.click(); } });
}

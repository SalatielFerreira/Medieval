'use strict';
// Menu principal: fundo animado com o tema do jogo e criação do herói.

const SKIN_TONES = ['#f5d3ae', '#f0c896', '#d9a676', '#b07a4c', '#7a4e2e'];
const HAIR_STYLES = [['short', 'Curto'], ['long', 'Longo'], ['ponytail', 'Rabo de cavalo'], ['braids', 'Tranças'], ['curly', 'Cacheado'], ['bun', 'Coque'], ['mohawk', 'Moicano'], ['bald', 'Careca']];
const BEARD_STYLES = [['none', 'Sem barba'], ['short', 'Curta'], ['full', 'Cheia'], ['mustache', 'Bigode'], ['goatee', 'Cavanhaque'], ['long', 'Longa']];
const TUNIC_COLORS = ['#3d6b8f', '#8f3d5e', '#4a7a3a', '#8e1f2a', '#6a4a8a', '#a8791a', '#5a5a62', '#2a4a6a', '#e0d4b8'];
const PANTS_COLORS = ['#4a3a2a', '#2a2a30', '#3a4a2a', '#5a2a2a', '#6b5a45', '#2a3a5a'];

const Menu = {
  hero: { name: 'Aventureiro', sex: 'm', age: 22, hair: HAIR_COLORS.castanho, skin: '#f0c896', hairStyle: 'short', beardStyle: 'short', tunic: '#3d6b8f', pants: '#4a3a2a', diff: 'normal' },
  running: false,

  show() {
    G.state = 'menu';
    Sound.music('menu');
    const m = document.getElementById('menu');
    m.classList.remove('hidden');
    if (!this.built) this.build();
    this.mainCard();
    if (!this.running) { this.running = true; this.t0 = performance.now(); requestAnimationFrame(t => this.loop(t)); }
    this.checkUpdate();
    clearInterval(this.updTimer);
    this.updTimer = setInterval(() => { if (G.state === 'menu') this.checkUpdate(); }, 60000);
  },
  hide() {
    document.getElementById('menu').classList.add('hidden');
    this.running = false;
    clearInterval(this.updTimer);
  },
  build() {
    const m = document.getElementById('menu');
    m.innerHTML = `<canvas id="menuBg"></canvas>
      <div class="menu-wrap" id="menuWrap">
        <div class="menu-title"><h1>MED<span class="mt-i">I<span class="mt-fl">⚜</span></span>EVAL</h1><div class="mt-line"></div><h4>Os Sete Reinos</h4></div>
        <div class="menu-card" id="menuCard"></div>
      </div>
      <div class="upd-modal hidden" id="updModal"></div>`;
    m.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) this.act(b.dataset.m, b.dataset); });
    m.addEventListener('input', e => {
      if (e.target.id === 'heroName') { this.hero.name = e.target.value; this.nameTag(); }
      if (e.target.id === 'heroSurname') { this.hero.surname = e.target.value; this.nameTag(); }
      if (e.target.id === 'heroAge') { this.hero.age = +e.target.value; document.getElementById('ageVal').textContent = this.hero.age + ' anos'; this.ageNote(); }
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && G.state === 'menu') this.checkUpdate(); });
    window.addEventListener('resize', () => { if (G.state === 'menu') this.fit(); });
    this.bg = document.getElementById('menuBg');
    // estrelas e montanhas fixas
    const r = U.mulberry32(777);
    this.stars = Array.from({ length: 160 }, () => ({ x: r(), y: r() * 0.45, s: r() * 1.6 + 0.4, p: r() * 6 }));
    const ridge = (n, amp, base, seed) => { const nz = U.makeNoise(seed); return Array.from({ length: n + 1 }, (_, i) => base - U.fbm(nz, i / 9, 0.5, 4) * amp); };
    this.far = ridge(120, 0.26, 0.8, 11);
    this.mid = ridge(120, 0.1, 0.9, 23);
    this.trees = Array.from({ length: 70 }, () => ({ x: r(), h: 0.03 + r() * 0.04 }));
    this.birds = Array.from({ length: 6 }, () => ({ x: r(), y: 0.15 + r() * 0.2, v: 0.008 + r() * 0.01, p: r() * 6 }));
    this.embers = [];
    this.built = true;
  },
  // cada cartão define o tamanho da janela; o título encolhe nas telas maiores (criador, ajuda)
  setCard(html, kind) {
    const card = document.getElementById('menuCard'), wrap = document.getElementById('menuWrap');
    card.className = 'menu-card mc-' + kind;
    wrap.className = 'menu-wrap ' + (kind === 'main' ? '' : 'compact');
    card.style.zoom = '';
    card.innerHTML = html;
    this.fit();
  },
  // nunca rolar: se a tela for pequena demais, a janela inteira é reduzida para caber
  fit() {
    const card = document.getElementById('menuCard'), wrap = document.getElementById('menuWrap');
    if (!card) return;
    const measure = () => {
      card.style.zoom = '';
      const title = wrap.querySelector('.menu-title');
      const gap = parseFloat(getComputedStyle(wrap).rowGap) || 0, pad = 32;
      const avail = window.innerHeight - (title ? title.getBoundingClientRect().height : 0) - gap - pad - 10, availW = window.innerWidth - 24;
      const r = card.getBoundingClientRect();
      const z = Math.min(1, avail / r.height, availW / r.width);
      if (z < 0.999) card.style.zoom = Math.max(0.3, z).toFixed(3);
    };
    requestAnimationFrame(measure);
    clearTimeout(this.fitT); this.fitT = setTimeout(measure, 350);
    if (document.fonts && !this.fontHook) { this.fontHook = true; document.fonts.ready.then(() => this.fit()); }
  },
  versionText() { const v = window.GAME_VERSION || 'local'; return v === 'local' ? 'versão local' : 'versão ' + v; },

  // ------------------------------------------------------------ cartões
  mainCard() {
    const info = Game.saveInfo();
    const opt = (m, ic, title, sub, cls, extra) => `<button class="mc-opt ${cls || ''}" data-m="${m}" ${extra || ''}><span class="mo-ic">${ic}</span><span class="mo-tx"><b>${title}</b><small>${sub}</small></span><span class="mo-go">›</span></button>`;
    this.setCard(`
      <div class="mc-orn"><span></span>⚜<span></span></div>
      <p class="mc-intro">Toda grande dinastia começou com alguém que ousou sonhar. Sete coroas aguardam quem tiver coragem de conquistá-las.<br><em>Da cabana ao trono: escreva a lenda que os bardos vão cantar.</em></p>
      <div class="mc-opts">
        ${info ? opt('load', '▶', 'Continuar a jornada', `${UI.esc(info.name)}${info.age ? ` · ${info.age} anos` : ''} · ${Calendar.short(info.day)} · nível ${info.level || 1}`, 'main', `data-n="${info.slot}"`) : ''}
        ${opt('create', '⚔️', 'Novo jogo', 'Crie seu herói e comece do zero', info ? '' : 'main')}
        ${opt('slots', '📜', 'Jogos salvos', 'Carregar, importar e exportar · 3 espaços')}
      </div>
      <div class="mc-foot"><span>${this.versionText()}</span></div>`, 'main');
  },
  slotsCard() {
    const fmt = t => t ? new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    const rows = Saves.list().map((inf, i) => {
      const n = i + 1;
      return `<div class="slotrow ${inf ? '' : 'empty'}"><div class="sr-n">${n}</div>
        <div class="sr-info">${inf ? `<b>${UI.esc(inf.name)}</b><small>${inf.sex === 'f' ? 'Heroína' : 'Herói'} · ${inf.age} anos · nível ${inf.level || 1} · ${Calendar.short(inf.day)}${inf.ruled ? ` · 👑 ${inf.ruled} reino(s)` : ''} · salvo em ${fmt(inf.savedAt)}${Saves.size(n) ? ` · ${Saves.size(n)} KB` : ''}</small>` : '<b>Espaço vazio</b><small>Comece um novo jogo ou importe um arquivo</small>'}</div>
        <div class="sr-acts">${inf ? `<button class="mc-main" data-m="load" data-n="${n}">▶ Carregar</button><button data-m="export" data-n="${n}" title="Baixar arquivo">⬇️ Exportar</button><button data-m="del" data-n="${n}" title="Apagar">🗑️</button>`
          : ''}<button data-m="import" data-n="${n}" title="Importar arquivo para este espaço">⬆️ Importar</button></div></div>`;
    }).join('');
    this.setCard(`<h2 class="mc-h">📜 Jogos salvos</h2><div class="slotlist">${rows}</div>
      <p class="mc-note">Exportar baixa um arquivo .json (bom para guardar ou levar para outro computador) · Importar coloca um arquivo no espaço · Dormir em casa salva automaticamente.</p>
      <div class="mc-btns row"><button data-m="back">← Voltar</button></div>`, 'slots');
  },
  createCard() {
    const h = this.hero;
    if (h.surname === undefined) h.surname = U.pick(SURNAMES);
    const sw = (key, list) => list.map(([v, label]) => `<button class="sw ${h[key] === v ? 'on' : ''}" data-m="set" data-k="${key}" data-v="${v}" title="${label}" style="background:${v}"></button>`).join('');
    const picker = (key, list, label, id) => `<div class="cr-row" ${id ? `id="${id}"` : ''}><label>${label}</label><div class="picker"><button data-m="cyc" data-k="${key}" data-d="-1">‹</button><b id="pk_${key}">${list.find(x => x[0] === h[key])[1]}</b><button data-m="cyc" data-k="${key}" data-d="1">›</button></div></div>`;
    const slot = h.slot || Saves.firstFree() || 1;
    this.setCard(`
      <h2 class="mc-h">⚔️ Crie seu herói</h2>
      <div class="cr3">
        <div class="cr-prev">
          <canvas id="heroPrev" width="220" height="260"></canvas>
          <div class="cr-tag" id="heroTag"></div>
          <div class="cr-note" id="ageNote"></div>
        </div>
        <div class="cr-col">
          <div class="cr-sec">📜 Identidade</div>
          <div class="cr-names"><label>Nome<input id="heroName" maxlength="18" value="${UI.esc(h.name)}"></label>
            <label>Sobrenome da família<input id="heroSurname" maxlength="16" value="${UI.esc(h.surname || '')}"></label></div>
          <div class="cr-row"><label>Sexo</label><div class="seg"><button class="${h.sex === 'm' ? 'on' : ''}" data-m="set" data-k="sex" data-v="m">♂ Masculino</button><button class="${h.sex === 'f' ? 'on' : ''}" data-m="set" data-k="sex" data-v="f">♀ Feminino</button></div></div>
          <div class="cr-row"><label>Idade <b id="ageVal">${h.age} anos</b></label><input type="range" id="heroAge" min="16" max="80" value="${h.age}"></div>
          <div class="cr-row"><label>Dificuldade</label><div class="seg">${Object.entries(DIFFICULTY).map(([k, d]) => `<button class="${h.diff === k ? 'on' : ''}" data-m="set" data-k="diff" data-v="${k}">${d.name}</button>`).join('')}</div>
            <small class="cr-diff" id="diffNote">${DIFFICULTY[h.diff].desc}</small></div>
          <div class="cr-row"><label>Espaço de salvamento</label><div class="seg">${Saves.list().map((inf, i) => `<button class="${slot === i + 1 ? 'on' : ''}" data-m="set" data-k="slot" data-v="${i + 1}" title="${inf ? 'Ocupado: ' + UI.esc(inf.name) : 'Vazio'}">${i + 1}${inf ? ' · ocupado' : ' · livre'}</button>`).join('')}</div></div>
        </div>
        <div class="cr-col">
          <div class="cr-sec">🎨 Aparência</div>
          <div class="cr-row"><label>Cor do cabelo</label><div class="swatches">${sw('hair', Object.entries(HAIR_COLORS).map(([n, c]) => [c, n]))}</div></div>
          ${picker('hairStyle', HAIR_STYLES, 'Penteado')}
          ${h.sex === 'f' ? '' : picker('beardStyle', BEARD_STYLES, 'Barba', 'beardRow')}
          <div class="cr-row"><label>Tom de pele</label><div class="swatches">${sw('skin', SKIN_TONES.map(c => [c, 'pele']))}</div></div>
          <div class="cr-row"><label>Cor da túnica</label><div class="swatches">${sw('tunic', TUNIC_COLORS.map(c => [c, 'túnica']))}</div></div>
          <div class="cr-row"><label>Cor da calça</label><div class="swatches">${sw('pants', PANTS_COLORS.map(c => [c, 'calça']))}</div></div>
        </div>
      </div>
      <div class="mc-btns row"><button data-m="back">← Voltar</button><button class="mc-main" data-m="start">⚔️ Começar a jornada</button></div>`, 'create');
    this.ageNote(); this.nameTag();
  },
  nameTag() {
    const el = document.getElementById('heroTag');
    if (el) el.textContent = `${(this.hero.name || '').trim() || 'Sem nome'} ${(this.hero.surname || '').trim()}`;
  },
  ageNote() {
    const a = this.hero.age, el = document.getElementById('ageNote');
    if (!el) return;
    el.textContent = a < 25 ? 'Jovem e cheio de energia' : a < 40 ? 'No auge da vida' : a < 55 ? 'Os primeiros fios brancos aparecem' : a < 68 ? 'Cabelos grisalhos de experiência' : 'Cabelos brancos de um ancião';
  },

  // ------------------------------------------------------------ atualização (GitHub Pages)
  // procura sozinho (ao abrir, a cada minuto no menu e ao voltar para a aba) e avisa quando há versão nova
  checkUpdate() {
    const cur = window.GAME_VERSION || 'local';
    if (location.protocol === 'file:' || cur === 'local') return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.version && j.version !== cur) this.showUpdate(j.version);
    }).catch(() => {});
  },
  showUpdate(v) {
    const el = document.getElementById('updModal');
    if (!el || this.dismissed === v) return;
    el.innerHTML = `<div class="upd-box"><div class="upd-ic">🔄</div>
      <h3>Nova versão disponível!</h3>
      <p>O jogo foi atualizado. Clique em <b>Atualizar o jogo</b> para carregar a versão nova, sem nada guardado do cache.<br><small>Seus jogos salvos continuam intactos.</small></p>
      <div class="upd-vers"><span>Aberta: ${UI.esc(window.GAME_VERSION)}</span><span>Nova: ${UI.esc(v)}</span></div>
      <div class="mc-btns row"><button data-m="upddismiss" data-v="${UI.esc(v)}">Depois</button><button class="mc-main" data-m="updnow" data-v="${UI.esc(v)}">🔄 Atualizar o jogo</button></div></div>`;
    el.classList.remove('hidden');
  },
  // recarrega a página com a versão no endereço: o navegador busca tudo de novo
  updateNow(v) {
    try { if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k))); } catch (e) { /* sem cache de service worker */ }
    location.replace(location.pathname + '?v=' + encodeURIComponent(v) + location.hash);
  },

  act(a, d) {
    if (a === 'create') this.createCard();
    else if (a === 'back') this.mainCard();
    else if (a === 'slots') this.slotsCard();
    else if (a === 'updnow') this.updateNow(d.v);
    else if (a === 'upddismiss') { if (d.v) this.dismissed = d.v; document.getElementById('updModal').classList.add('hidden'); }
    else if (a === 'export') Saves.exportSlot(+d.n);
    else if (a === 'del') Dialog.confirm({ icon: '🗑️', title: 'Apagar jogo salvo', text: `Apagar o jogo salvo do espaço ${d.n}? Isso não pode ser desfeito.`, ok: 'Apagar', danger: true }, () => { Saves.remove(+d.n); this.slotsCard(); });
    else if (a === 'import') {
      const go = () => Saves.importFile(+d.n, ok => { if (ok) this.slotsCard(); });
      if (Saves.info(+d.n)) Dialog.confirm({ icon: '⬆️', title: 'Importar jogo', text: `O espaço ${d.n} já tem um jogo. Substituir pelo arquivo importado?`, ok: 'Substituir', danger: true }, go);
      else go();
    }
    else if (a === 'load') {
      const n = +d.n;
      this.hide();
      UI.loading('Carregando sua jornada...', async prog => { if (!(await Game.load(n, prog))) { this.show(); Dialog.alert({ icon: '⚠️', title: 'Não foi possível carregar', text: 'Este jogo salvo não pôde ser aberto.' }); } });
    }
    else if (a === 'set') {
      this.hero[d.k] = d.k === 'slot' ? +d.v : d.v;
      const card = document.getElementById('menuCard');
      for (const b of card.querySelectorAll(`[data-k="${d.k}"]`)) b.classList.toggle('on', b.dataset.v === d.v);
      if (d.k === 'diff') document.getElementById('diffNote').textContent = DIFFICULTY[d.v].desc;
      if (d.k === 'sex') {
        if (d.v === 'f' && this.hero.tunic === '#3d6b8f') this.hero.tunic = '#8f3d5e';
        if (d.v === 'm' && this.hero.tunic === '#8f3d5e') this.hero.tunic = '#3d6b8f';
        if (d.v === 'f' && this.hero.hairStyle === 'short') this.hero.hairStyle = 'long';
        if (d.v === 'm' && this.hero.hairStyle === 'long') this.hero.hairStyle = 'short';
        this.createCard();
      }
    } else if (a === 'cyc') {
      const list = d.k === 'hairStyle' ? HAIR_STYLES : BEARD_STYLES;
      const i = list.findIndex(x => x[0] === this.hero[d.k]);
      const n = list[(i + +d.d + list.length) % list.length];
      this.hero[d.k] = n[0];
      document.getElementById('pk_' + d.k).textContent = n[1];
    } else if (a === 'start') {
      const name = (this.hero.name || '').trim();
      this.hero.surname = (this.hero.surname || '').trim().replace(/^./, c => c.toUpperCase());
      if (!name) { document.getElementById('heroName').focus(); return; }
      const slot = this.hero.slot || Saves.firstFree() || 1;
      if (Saves.info(slot) && !d.sure) {
        Dialog.confirm({ icon: '📜', title: 'Espaço ocupado', text: `O espaço ${slot} já tem um jogo salvo. Ele será substituído quando você salvar. Continuar?`, ok: 'Começar mesmo assim', danger: true }, () => this.act('start', { sure: true }));
        return;
      }
      this.hide();
      const h = this.hero;
      const hero = Object.assign({}, h, { name, slot, diff: h.diff, style: { hair: h.hairStyle, beard: h.sex === 'f' ? 'none' : h.beardStyle, tunic: h.tunic, pants: h.pants } });
      UI.loading('Gerando o mundo...', prog => Game.newGame(hero, prog));
    }
  },

  // ------------------------------------------------------------ animação
  loop(now) {
    if (!this.running) return;
    const t = (now - this.t0) / 1000;
    this.drawBg(t);
    const prev = document.getElementById('heroPrev');
    if (prev) this.drawHero(prev, t);
    requestAnimationFrame(n => this.loop(n));
  },
  drawHero(cv, t) {
    const g = cv.getContext('2d'), h = this.hero;
    g.clearRect(0, 0, cv.width, cv.height);
    const grd = g.createRadialGradient(cv.width / 2, cv.height - 30, 10, cv.width / 2, cv.height - 30, cv.width / 2);
    grd.addColorStop(0, 'rgba(255,200,120,0.35)'); grd.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    const female = h.sex === 'f';
    drawHuman(g, cv.width / 2, cv.height - 22 + Math.sin(t * 2) * 1.5, {
      scale: 5, body: h.tunic, legs: h.pants, skin: h.skin,
      hair: People.hairAt(h.hair, h.age), hairStyle: h.hairStyle, beardStyle: female ? 'none' : h.beardStyle, skirt: female,
      dir: 1, moving: false, swing: 0, aim: 0, anim: t,
    });
  },
  drawBg(t) {
    const cv = this.bg, W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    const g = cv.getContext('2d');
    // céu ao entardecer
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a0d2a'); sky.addColorStop(0.3, '#2c1c4a'); sky.addColorStop(0.52, '#8a3a50'); sky.addColorStop(0.66, '#e8803c'); sky.addColorStop(0.8, '#f6b860'); sky.addColorStop(1, '#f6b860');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (const s of this.stars) {
      g.globalAlpha = 0.35 + Math.sin(t * 1.5 + s.p) * 0.35;
      g.fillStyle = '#fff'; g.fillRect(s.x * W, s.y * H, s.s, s.s);
    }
    g.globalAlpha = 1;
    // sol
    const sx = W * 0.5, sy = H * 0.7;
    const sun = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.35);
    sun.addColorStop(0, 'rgba(255,230,160,0.95)'); sun.addColorStop(0.12, 'rgba(255,190,110,0.8)'); sun.addColorStop(1, 'rgba(255,140,80,0)');
    g.fillStyle = sun; g.beginPath(); g.arc(sx, sy, H * 0.35, 0, Math.PI * 2); g.fill();
    // pássaros
    g.strokeStyle = 'rgba(30,15,25,0.7)'; g.lineWidth = 2;
    for (const b of this.birds) {
      const x = ((b.x + t * b.v) % 1.2 - 0.1) * W, y = b.y * H + Math.sin(t + b.p) * 8, f = Math.sin(t * 8 + b.p) * 4;
      g.beginPath(); g.moveTo(x - 8, y - f); g.lineTo(x, y); g.lineTo(x + 8, y - f); g.stroke();
    }
    // montanhas distantes
    const ridge = (pts, col, snow) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      pts.forEach((v, i) => g.lineTo(i / (pts.length - 1) * W, v * H));
      g.lineTo(W, H); g.fill();
      if (snow) {
        g.fillStyle = 'rgba(255,230,230,0.35)';
        pts.forEach((v, i) => { if (v < 0.6 && i % 2 === 0) { const x = i / (pts.length - 1) * W; g.beginPath(); g.moveTo(x - 10, v * H + 14); g.lineTo(x, v * H); g.lineTo(x + 10, v * H + 14); g.fill(); } });
      }
    };
    ridge(this.far, '#4a2a4e', true);
    // névoa
    for (let k = 0; k < 3; k++) {
      const y = H * (0.72 + k * 0.05), off = (t * (6 + k * 4)) % W;
      const fog = g.createLinearGradient(0, y - 30, 0, y + 30);
      fog.addColorStop(0, 'rgba(255,200,180,0)'); fog.addColorStop(0.5, 'rgba(255,200,180,0.12)'); fog.addColorStop(1, 'rgba(255,200,180,0)');
      g.fillStyle = fog; g.fillRect(-off, y - 30, W * 2, 60);
    }
    ridge(this.mid, '#2a1628', false);
    // castelo sobre a colina
    this.drawCastle(g, W * 0.15, H * 0.9, Math.min(W, H) / 640, t);
    this.drawCastle(g, W * 0.88, H * 0.93, Math.min(W, H) / 1100, t);
    // pinheiros
    g.fillStyle = '#160b14';
    for (const tr of this.trees) {
      const x = tr.x * W, i = Math.floor(tr.x * (this.mid.length - 1)), y = this.mid[i] * H + 4, h = tr.h * H;
      g.beginPath(); g.moveTo(x - h * 0.3, y); g.lineTo(x, y - h); g.lineTo(x + h * 0.3, y); g.fill();
    }
    // chão e tochas
    g.fillStyle = '#0e070c'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * 0.94); g.quadraticCurveTo(W * 0.5, H * 0.9, W, H * 0.95); g.lineTo(W, H); g.fill();
    for (const tx of [0.3, 0.7]) this.torch(g, W * tx, H * 0.93, t);
    for (const e of this.embers) { e.y -= e.v; e.x += Math.sin(e.y / 20) * 0.4; e.l -= 0.012; }
    this.embers = this.embers.filter(e => e.l > 0);
    for (const e of this.embers) { g.globalAlpha = e.l; g.fillStyle = '#ffb04a'; g.fillRect(e.x, e.y, 2, 2); }
    g.globalAlpha = 1;
    // vinheta
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  },
  torch(g, x, y, t) {
    const f = Math.sin(t * 13 + x) * 3;
    const glow = g.createRadialGradient(x, y - 70, 0, x, y - 70, 120);
    glow.addColorStop(0, 'rgba(255,170,70,0.45)'); glow.addColorStop(1, 'rgba(255,170,70,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(x, y - 70, 120, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1608'; g.fillRect(x - 4, y - 66, 8, 66);
    g.fillStyle = '#4a3020'; g.fillRect(x - 8, y - 70, 16, 8);
    g.fillStyle = '#ff7b1c'; g.beginPath(); g.moveTo(x - 9, y - 70); g.quadraticCurveTo(x + f, y - 112, x + 9, y - 70); g.fill();
    g.fillStyle = '#ffd34a'; g.beginPath(); g.moveTo(x - 5, y - 70); g.quadraticCurveTo(x - f * 0.5, y - 95, x + 5, y - 70); g.fill();
    if (Math.random() < 0.3) this.embers.push({ x: x + U.rnd(-4, 4), y: y - 85, v: U.rnd(0.6, 1.4), l: 1 });
  },
  drawCastle(g, cx, base, s, t) {
    const R = (x, y, w, h) => g.fillRect(cx + x * s, base - y * s, w * s, h * s);
    g.fillStyle = '#1a0d18';
    // colina
    g.beginPath(); g.moveTo(cx - 200 * s, base + 30 * s); g.quadraticCurveTo(cx, base - 30 * s, cx + 200 * s, base + 30 * s); g.fill();
    R(-110, 60, 220, 60);
    for (let k = -110; k < 110; k += 16) R(k, 70, 9, 10);
    for (const x of [-130, 100]) { R(x, 120, 30, 120); for (let k = 0; k < 30; k += 10) R(x + k, 130, 6, 10); }
    R(-40, 150, 80, 150); for (let k = -40; k < 40; k += 14) R(k, 160, 8, 10);
    R(-10, 210, 20, 60);
    g.beginPath(); g.moveTo(cx - 14 * s, base - 210 * s); g.lineTo(cx, base - 250 * s); g.lineTo(cx + 14 * s, base - 210 * s); g.fill();
    // janelas acesas
    for (const [x, y] of [[-25, 120], [15, 120], [-5, 175], [-120, 95], [110, 95], [-60, 40], [50, 40]]) {
      const a = 0.65 + Math.sin(t * 3 + x) * 0.25;
      g.fillStyle = `rgba(255,190,90,${a})`; R(x, y, 7, 11);
    }
    g.fillStyle = '#1a0d18';
    // portão
    g.fillStyle = 'rgba(255,150,60,0.35)'; R(-14, 34, 28, 34);
    // bandeiras
    const cols = CIV_DEFS.map(c => c.color);
    [[-118, 120], [112, 120], [-2, 250]].forEach(([x, y], i) => {
      g.fillStyle = '#1a0d18'; R(x, y + 34, 2, 34);
      const w = Math.sin(t * 3 + i) * 3;
      g.fillStyle = cols[i];
      g.beginPath(); g.moveTo(cx + (x + 2) * s, base - (y + 34) * s); g.lineTo(cx + (x + 26) * s, base - (y + 28 + w) * s); g.lineTo(cx + (x + 2) * s, base - (y + 20) * s); g.fill();
    });
  },
};

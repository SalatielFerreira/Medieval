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
  },
  hide() {
    document.getElementById('menu').classList.add('hidden');
    this.running = false;
  },
  build() {
    const m = document.getElementById('menu');
    m.innerHTML = `<canvas id="menuBg"></canvas>
      <div class="menu-wrap">
        <div class="menu-title"><div class="mt-orn">⚜</div><h1>MEDIEVAL</h1><div class="mt-line"></div><h4>Os Sete Reinos</h4></div>
        <div class="menu-card" id="menuCard"></div>
      </div>
      <div class="menu-foot">Feito com HTML5 · Clique para começar sua lenda</div>`;
    m.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) this.act(b.dataset.m, b.dataset); });
    m.addEventListener('input', e => {
      if (e.target.id === 'heroName') this.hero.name = e.target.value;
      if (e.target.id === 'heroSurname') this.hero.surname = e.target.value;
      if (e.target.id === 'heroAge') { this.hero.age = +e.target.value; document.getElementById('ageVal').textContent = this.hero.age + ' anos'; this.ageNote(); }
    });
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

  // ------------------------------------------------------------ cartões
  mainCard() {
    const info = Game.saveInfo();
    document.getElementById('menuCard').innerHTML = `
      <p class="mc-intro">Sete reinos disputam estas terras. Você começa com uma cabana e nada mais.<br>Colete, crie, ame, lute... e funde uma dinastia.</p>
      <div class="mc-btns">
        ${info ? `<button class="mc-main" data-m="load" data-n="${info.slot}">▶ Continuar — ${UI.esc(info.name)}${info.age ? `, ${info.age} anos` : ''} · dia ${info.day}</button>` : ''}
        <button class="${info ? '' : 'mc-main'}" data-m="create">⚔️ Novo jogo</button>
        <button data-m="slots">📜 Jogos salvos · importar e exportar</button>
        <button data-m="help">❓ Como jogar</button>
      </div>`;
  },
  slotsCard() {
    const fmt = t => t ? new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    const rows = Saves.list().map((inf, i) => {
      const n = i + 1;
      return `<div class="slotrow ${inf ? '' : 'empty'}"><div class="sr-n">${n}</div>
        <div class="sr-info">${inf ? `<b>${UI.esc(inf.name)}</b><small>${inf.sex === 'f' ? 'Heroína' : 'Herói'} · ${inf.age} anos · nível ${inf.level || 1} · dia ${inf.day}${inf.ruled ? ` · 👑 ${inf.ruled} reino(s)` : ''}<br>salvo em ${fmt(inf.savedAt)}</small>` : '<b>Espaço vazio</b><small>Comece um novo jogo ou importe um arquivo</small>'}</div>
        <div class="sr-acts">${inf ? `<button class="mc-main" data-m="load" data-n="${n}">Carregar</button><button data-m="export" data-n="${n}" title="Baixar arquivo">⬇️</button><button data-m="del" data-n="${n}" title="Apagar">🗑️</button>`
          : ''}<button data-m="import" data-n="${n}" title="Importar arquivo para este espaço">⬆️</button></div></div>`;
    }).join('');
    document.getElementById('menuCard').innerHTML = `<h2 class="mc-h">Jogos salvos</h2><div class="slotlist">${rows}</div>
      <p class="mc-note">⬇️ exporta para um arquivo .json · ⬆️ importa um arquivo para o espaço · Dormir em casa salva automaticamente.</p>
      <div class="mc-btns row"><button data-m="back">← Voltar</button></div>`;
  },
  createCard() {
    if (this.hero.surname === undefined) this.hero.surname = U.pick(SURNAMES);
    const h = this.hero;
    const sw = (key, list) => list.map(([v, label]) => `<button class="sw ${h[key] === v ? 'on' : ''}" data-m="set" data-k="${key}" data-v="${v}" title="${label}" style="background:${v}"></button>`).join('');
    document.getElementById('menuCard').innerHTML = `
      <h2 class="mc-h">Crie seu herói</h2>
      <div class="creator">
        <div class="cr-prev"><canvas id="heroPrev" width="180" height="220"></canvas><div class="cr-note" id="ageNote"></div></div>
        <div class="cr-form">
          <div class="cr-names"><label>Nome do herói<input id="heroName" maxlength="18" value="${UI.esc(h.name)}"></label>
          <label>Sobrenome da família<input id="heroSurname" maxlength="16" value="${UI.esc(h.surname || '')}"></label></div>
          <label>Sexo</label>
          <div class="seg"><button class="${h.sex === 'm' ? 'on' : ''}" data-m="set" data-k="sex" data-v="m">♂ Masculino</button><button class="${h.sex === 'f' ? 'on' : ''}" data-m="set" data-k="sex" data-v="f">♀ Feminino</button></div>
          <label>Idade <b id="ageVal">${h.age} anos</b><input type="range" id="heroAge" min="16" max="80" value="${h.age}"></label>
          <label>Cor do cabelo</label><div class="swatches">${sw('hair', Object.entries(HAIR_COLORS).map(([n, c]) => [c, n]))}</div>
          <label>Tom de pele</label><div class="swatches">${sw('skin', SKIN_TONES.map(c => [c, 'pele']))}</div>
          <div class="cr-pick"><label>Cabelo</label><div class="picker"><button data-m="cyc" data-k="hairStyle" data-d="-1">‹</button><b id="pk_hairStyle">${HAIR_STYLES.find(x => x[0] === h.hairStyle)[1]}</b><button data-m="cyc" data-k="hairStyle" data-d="1">›</button></div></div>
          <div class="cr-pick" ${h.sex === 'f' ? 'style="display:none"' : ''} id="beardRow"><label>Barba</label><div class="picker"><button data-m="cyc" data-k="beardStyle" data-d="-1">‹</button><b id="pk_beardStyle">${BEARD_STYLES.find(x => x[0] === h.beardStyle)[1]}</b><button data-m="cyc" data-k="beardStyle" data-d="1">›</button></div></div>
          <label>Cor da túnica</label><div class="swatches">${sw('tunic', TUNIC_COLORS.map(c => [c, 'túnica']))}</div>
          <label>Cor da calça</label><div class="swatches">${sw('pants', PANTS_COLORS.map(c => [c, 'calça']))}</div>
          <label>Dificuldade</label><div class="seg">${Object.entries(DIFFICULTY).map(([k, d]) => `<button class="${h.diff === k ? 'on' : ''}" data-m="set" data-k="diff" data-v="${k}" title="${d.desc}">${d.name}</button>`).join('')}</div>
          <small class="cr-diff" id="diffNote">${DIFFICULTY[h.diff].desc}</small>
          <label>Espaço de salvamento</label><div class="seg">${Saves.list().map((inf, i) => `<button class="${(this.hero.slot || Saves.firstFree() || 1) === i + 1 ? 'on' : ''}" data-m="set" data-k="slot" data-v="${i + 1}" title="${inf ? 'Ocupado: ' + UI.esc(inf.name) : 'Vazio'}">${i + 1}${inf ? ' ●' : ''}</button>`).join('')}</div>
        </div>
      </div>
      <div class="mc-btns row"><button data-m="back">← Voltar</button><button class="mc-main" data-m="start">⚔️ Começar a jornada</button></div>`;
    this.ageNote();
  },
  ageNote() {
    const a = this.hero.age, el = document.getElementById('ageNote');
    if (!el) return;
    el.textContent = a < 25 ? 'Jovem e cheio de energia' : a < 40 ? 'No auge da vida' : a < 55 ? 'Os primeiros fios brancos aparecem' : a < 68 ? 'Cabelos grisalhos de experiência' : 'Cabelos brancos de um ancião';
  },
  helpCard() {
    document.getElementById('menuCard').innerHTML = `<div class="mc-help">${HELP_HTML}</div><div class="mc-btns"><button data-m="back">← Voltar</button></div>`;
  },
  act(a, d) {
    if (a === 'create') this.createCard();
    else if (a === 'back') this.mainCard();
    else if (a === 'help') this.helpCard();
    else if (a === 'slots') this.slotsCard();
    else if (a === 'export') Saves.exportSlot(+d.n);
    else if (a === 'del') { if (confirm(`Apagar o jogo salvo do espaço ${d.n}? Isso não pode ser desfeito.`)) { Saves.remove(+d.n); this.slotsCard(); } }
    else if (a === 'import') {
      if (Saves.info(+d.n) && !confirm(`O espaço ${d.n} já tem um jogo. Substituir pelo arquivo importado?`)) return;
      Saves.importFile(+d.n, ok => { if (ok) this.slotsCard(); });
    }
    else if (a === 'load') {
      const n = +d.n;
      this.hide();
      UI.loading('Carregando sua jornada...', async prog => { if (!(await Game.load(n, prog))) { alert('Não foi possível carregar este jogo salvo.'); this.show(); } });
    }
    else if (a === 'set') {
      this.hero[d.k] = d.k === 'slot' ? +d.v : d.v;
      const card = document.getElementById('menuCard');
      for (const b of card.querySelectorAll(`[data-k="${d.k}"]`)) b.classList.toggle('on', b.dataset.v === d.v);
      if (d.k === 'diff') document.getElementById('diffNote').textContent = DIFFICULTY[d.v].desc;
      if (d.k === 'sex') {
        document.getElementById('beardRow').style.display = d.v === 'f' ? 'none' : '';
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
      if (Saves.info(slot) && !confirm(`O espaço ${slot} já tem um jogo salvo. Ele será substituído quando você salvar. Continuar?`)) return;
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
    const grd = g.createRadialGradient(90, 200, 10, 90, 200, 90);
    grd.addColorStop(0, 'rgba(255,200,120,0.35)'); grd.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    const female = h.sex === 'f';
    drawHuman(g, 90, 206 + Math.sin(t * 2) * 1.5, {
      scale: 4.2, body: h.tunic, legs: h.pants, skin: h.skin,
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

'use strict';
// Interface: HUD, mensagens e painéis (HTML sobre o canvas).

const TRADE_GOODS = ['wood', 'stone', 'clay', 'coal', 'copper_ore', 'tin_ore', 'iron_ore', 'fiber', 'rope', 'leather', 'iron_bar', 'bronze_bar',
  'wheat', 'berries', 'meat', 'cooked_meat', 'bread', 'cooked_fish', 'fishing_rod'];

const PANEL_ICONS = {
  showInventory: 'backpack', showCrafting: 'hammer', showBuild: 'build', showKingdom: 'crown', showSettings: 'gear', showHelp: 'star',
  showTalk: 'chat', showGift: 'star', showEquipC: 'shield', showShop: 'coin', showTavern: 'users', showCastle: 'castle',
  showRest: 'build', showFarm: 'food', showBarracks: 'shield', showChest: 'backpack', showStable: 'users',
  showBiz: 'coin', showFamily: 'users', showHire: 'coin', showGuard: 'shield', showChapel: 'star', showArena: 'sword', showJoust: 'sword', showTree: 'users', showMatch: 'users',
  showAnimals: 'food', showPTavern: 'coin', showCaravan: 'coin', showBattle: 'sword', showDiary: 'book', showProf: 'star',
};
// janelas principais, na ordem da barra de botões (as setas do cabeçalho pulam de uma para a outra)
const MAIN_WINDOWS = [['showInventory', 'Mochila'], ['showCrafting', 'Criar'], ['showBuild', 'Construir'], ['showKingdom', 'Portfólio'], ['showMap', 'Mapa'], ['showDiary', 'Diário'], ['showSettings', 'Ajustes']];
const WIDE_PANELS = ['showInventory', 'showCrafting', 'showBuild', 'showDiary', 'showTree', 'showKingdom', 'showSettings'];

const UI = {
  cur: null,
  kTab: -1,
  sel: { inv: null, cat: 'Todos', craft: 0, st: 'all', can: false, build: 'cabin', ksub: 'resumo' },

  init() {
    this.panel = document.getElementById('panel');
    this.log = document.getElementById('log');
    this.promptEl = document.getElementById('prompt');
    this.bannerEl = document.getElementById('banner');
    this.panel.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      this.act(b.dataset.act, b.dataset);
    });
    this.panel.addEventListener('input', e => {
      const el = e.target;
      if (el.type === 'range' && el.dataset.set) { const l = el.parentNode.querySelector('.rv'); if (l) l.textContent = Math.round(el.value * 100) + '%'; }
    });
    this.panel.addEventListener('change', e => {
      const el = e.target.closest('[data-set]');
      if (el) Game.setSetting(el.dataset.set, el.type === 'checkbox' ? el.checked : el.value);
      // Ajustes no celular: a prévia da tela acompanha a mudança
      if (el && el.type === 'checkbox' && this.cur && this.cur.fn === 'showSettings' && this.sel.stab === 'tela') this.showSettings();
    });
    this.buildHud();
    this.initDrag();
    this.talkEl = document.getElementById('talkBtn');
    this.talkEl.innerHTML = `${icon('chat')}<span>Conversar</span>`;
    this.talkEl.addEventListener('click', () => { if (this.talkEl.dataset.id) this.showTalk(+this.talkEl.dataset.id); });
    document.getElementById('gameover').addEventListener('click', e => {
      const b = e.target.closest('[data-go]');
      if (!b) return;
      if (b.dataset.go === 'heir') Game.continueAs(+b.dataset.id);
      else if (b.dataset.go === 'load') { this.hideGameOver(); this.loading('Carregando sua jornada...', async prog => { if (!(await Game.load(G.slot, prog))) { Dialog.alert({ icon: '📜', title: 'Sem jogo salvo', text: 'Não há jogo salvo neste espaço.' }, () => this.showGameOver(this.goCause)); } }); }
      else if (b.dataset.go === 'menu') { this.hideGameOver(); Game.toMenu(); }
    });
    document.getElementById('birth').addEventListener('click', e => {
      if (!e.target.closest('[data-birth]')) return;
      const inp = document.getElementById('babyName');
      const name = inp.value.trim();
      if (!name) { inp.focus(); return; }
      document.getElementById('birth').classList.add('hidden');
      this.modal = false; G.paused = !!this.cur;
      Game.birth(name, this.babySex);
    });
  },

  // ------------------------------------------------------------ HUD
  buildHud() {
    const stat = (id, cls, ic, tip) => `<div class="stat ${cls}" id="${id}" title="${tip}">${icon(ic)}<div class="track"><em></em><i></i><span></span></div></div>`;
    const hud = document.getElementById('hud');
    hud.classList.add('glass');
    hud.innerHTML = `
      <div class="hud-card">
        <div class="portrait"><canvas id="portrait" width="60" height="60"></canvas><div class="lvl" id="hudLvl">1</div></div>
        <div class="hud-main">
          <div class="hud-name" id="hudName"></div>
          <div class="hud-title" id="hudTitle"></div>
          <div class="xpbar"><i id="hudXp"></i></div>
          <div class="xptext" id="hudXpT"></div>
        </div>
      </div>
      ${stat('hpBar', 'hp', 'heart', 'Vida')}
      ${stat('stBar', 'st', 'bolt', 'Energia')}
      ${stat('huBar', 'hu', 'food', 'Fome')}
      <div class="hud-res">
        <div class="gold" title="Ouro pessoal">${icon('coin')}<b id="hudGold">0</b></div>
        <div class="fame" title="Fama">${icon('star')}<b id="hudFame">0</b></div>
        <div title="Seguidores">${icon('users')}<b id="hudFol">0/2</b></div>
        <div title="Dano">${icon('sword')}<b id="hudAtk">0</b></div>
        <div title="Defesa">${icon('shield')}<b id="hudDef">0</b></div>
      </div>
      <div class="hud-buffs" id="hudBuffs"></div>`;
    const clock = document.getElementById('clock');
    clock.classList.add('glass');
    clock.innerHTML = `
      <div class="clk-top"><span class="clk-ic" id="clkIcon"></span><span class="clk-txt"><b id="clkDay">Dezembro</b><small id="clkPhase"></small></span><span class="clk-pie" id="clkPie"><i></i></span></div>
      <div class="clk-zone" id="clkZone"></div>`;
    const quick = document.getElementById('quick');
    quick.classList.add('glass');
    quick.innerHTML = `<div class="q-row">
        <div class="q-tool" data-qt="1" id="qToolBox" title="Ferramenta em mãos — clique ou Q para trocar"><span class="q-ic" id="qToolIc"></span><b id="qToolName"></b><em id="qToolSub"></em></div>
        <div class="q-load" id="qLoadBox" title="Carga da mochila"><span id="qLoadT"></span><div class="q-lbar"><i id="qLoad"></i></div></div></div>
      <div class="q-row">
        <div class="q-slots" title="Algibeira: teclas 1 a 4 (arraste comidas para cá na Mochila)">${[0, 1, 2, 3].map(q => `<div class="q-slot" data-qs="${q}"><span class="q-ic" id="qs${q}"></span><span class="q-n" id="qn${q}"></span></div>`).join('')}</div>
        <div class="q-ord" data-qo="1" id="qOrdBox" title="Ordem aos capangas — clique ou T para trocar"><b id="qOrder"></b></div></div>`;
    quick.addEventListener('click', e => {
      if (G.state !== 'play' || G.paused) return;
      if (e.target.closest('[data-qt]')) Game.cycleTool();
      if (e.target.closest('[data-qo]')) Orders.cycle();
      const qs = e.target.closest('[data-qs]');
      if (qs) Game.useQuick(+qs.dataset.qs);
    });
    const tb = document.getElementById('toolbar');
    tb.classList.add('glass');
    const btn = (fn, ic, label, key) => `<button data-tb="${fn}" title="${label} (${key})">${icon(ic)}<small>${label}</small></button>`;
    tb.innerHTML = btn('showInventory', 'backpack', 'Mochila', 'I') + btn('showCrafting', 'hammer', 'Criar', 'C') +
      btn('showBuild', 'build', 'Construir', 'B') + btn('showKingdom', 'crown', 'Portfólio', 'K') +
      btn('showMap', 'map', 'Mapa', 'M') + btn('showDiary', 'book', 'Diário', 'J') + '<span class="sep"></span>' + btn('showSettings', 'gear', 'Ajustes', 'Esc');
    tb.addEventListener('click', e => {
      const b = e.target.closest('[data-tb]');
      if (!b || G.state !== 'play') return;
      this.toggle(b.dataset.tb);
    });
    this.portraitKey = '';
  },
  toggle(fn) {
    if (this.cur && this.cur.fn === fn) { this.close(); return; }
    if (this.cur) this.close();
    G.placing = null; Urban.stop();
    this[fn]();
  },
  showGameUI(on) {
    for (const id of ['hud', 'rightcol', 'toolbar']) document.getElementById(id).classList.toggle('hidden', !on);
    if (!on) { document.getElementById('keys').classList.add('hidden'); MapView.hide(); Touch.show(false); }
    else Game.applySettings();
  },

  // ------------------------------------------------------------ utilidades
  esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  fmtCost(cost, have) {
    have = have || (k => k === 'gold' ? P.gold : Inv.count(k));
    return Object.entries(cost).map(([k, n]) => {
      const ok = have(k) >= n;
      const info = k === 'gold' ? { icon: '🪙', name: 'ouro' } : (ITEMS[k] || GROUP_INFO[k]);
      const ic = info.icon, nm = info.name;
      return `<span class="c ${ok ? '' : 'bad'}" title="${nm}">${ic} ${n}</span>`;
    }).join(' ');
  },
  itemDesc(it) {
    const p = [];
    if (it.dmg) p.push(`Dano ${it.dmg}`);
    if (it.def) p.push(`Defesa ${it.def}`);
    if (it.food) p.push(`+${it.food} fome${it.heal ? `, +${it.heal} vida` : ''}`);
    if (it.tool) p.push(TOOL_NAMES[it.tool]); // só o uso (Corte, Mineração...); o material já está no nome
    if (it.fish) p.push('peixe cru — asse na fogueira');
    if (it.block) p.push(`bloqueia ${Math.round(it.block * 100)}%`);
    if (it.buff) p.push(`${BUFFS[it.buff].icon} ${BUFFS[it.buff].desc}`);
    if (it.seed) p.push(`plante com a enxada · ${daysText(CROPS[it.seed].days * ECON_DAYS)}`);
    return p.join(' · ');
  },
  bar(v, max, cls) { return `<div class="mbar ${cls || ''}"><i style="width:${U.clamp(v / max * 100, 0, 100)}%"></i></div>`; },

  open(title, body, fn, args, sub) {
    // guarda a rolagem das áreas internas para a janela não "pular" ao atualizar
    const scrolls = {};
    if (this.cur && this.cur.fn === fn) for (const el of this.panel.querySelectorAll('[data-scroll], .pb')) scrolls[el.dataset.scroll || 'pb'] = el.scrollTop;
    this.cur = { fn, args: args || [] };
    const clean = String(title).replace(/^[^\p{L}\p{N}]+/u, '');
    const ic = PANEL_ICONS[fn] || 'star';
    this.panel.className = WIDE_PANELS.includes(fn) ? 'wide' : '';
    this.panel.innerHTML = `<div class="ph"><div class="ph-ic">${icon(ic)}</div><div class="ph-t"><h2>${clean}</h2>${sub ? `<small>${sub}</small>` : ''}</div>
      ${this.winNavHtml(fn)}<button class="x" data-act="close" title="Fechar (Esc)">${icon('x')}</button></div><div class="pb">${body}</div>`;
    this.panel.classList.remove('hidden');
    document.body.classList.add('win-open'); // os controles de toque somem enquanto a janela está aberta
    for (const el of this.panel.querySelectorAll('[data-scroll], .pb')) { const k = el.dataset.scroll || 'pb'; if (scrolls[k]) el.scrollTop = scrolls[k]; }
    G.paused = true;
  },
  // setas ◀ ▶ no cabeçalho das janelas principais
  winNavHtml(fn, attr) {
    const i = MAIN_WINDOWS.findIndex(w => w[0] === fn);
    if (i < 0) return '';
    const n = MAIN_WINDOWS.length, prev = MAIN_WINDOWS[(i - 1 + n) % n], next = MAIN_WINDOWS[(i + 1) % n];
    const a = attr || 'data-act="wnav"';
    return `<div class="ph-nav"><button class="nav-arr" ${a} data-d="-1" title="${prev[1]}">${icon('chevL')}</button><button class="nav-arr" ${a} data-d="1" title="${next[1]}">${icon('chevR')}</button></div>`;
  },
  wnav(d) {
    const i = MAIN_WINDOWS.findIndex(w => this.cur && w[0] === this.cur.fn);
    if (i < 0) return;
    const n = MAIN_WINDOWS.length, fn = MAIN_WINDOWS[(i + d + n) % n][0];
    this.close();
    G.placing = null; Urban.stop();
    this[fn]();
    Sound.play('ui');
  },
  close() { this.panel.classList.add('hidden'); MapView.hide(); this.cur = null; G.paused = false; document.body.classList.remove('win-open'); },
  isOpen() { return !!this.cur; },
  refresh() { if (this.cur) this[this.cur.fn](...this.cur.args); },

  // avisos em janelinhas flutuantes no canto: ícone, texto, fechar e uma barrinha do tempo restante.
  // Só aparecem na tela os de problema ('bad') e os importantes (big = true); os de rotina ficam só no histórico.
  msg(text, cls, big) {
    if (cls !== 'bad' && !big) { this.hist = this.hist || []; this.hist.push({ day: G.day, text }); if (this.hist.length > 60) this.hist.shift(); return; }
    const last = this.log.lastElementChild;
    if (last && last.dataset.t === text && !last.classList.contains('out')) {
      const n = (+last.dataset.n || 1) + 1; last.dataset.n = n; last.querySelector('.tc-n').textContent = '×' + n;
      this.toastLife(last); return;
    }
    const m = text.match(/^((?:\p{Extended_Pictographic}|️|‍)+)\s*/u);
    const d = document.createElement('div');
    d.className = 'toast ' + (cls || '');
    d.dataset.t = text; d.dataset.cls = cls || '';
    d.innerHTML = '<span class="tc-ic"></span><span class="tc-tx"></span><span class="tc-n"></span><button class="tc-x" title="Fechar">✕</button><i class="tc-life"></i>';
    d.querySelector('.tc-ic').textContent = m ? m[1] : cls === 'bad' ? '⚠️' : cls === 'gold' ? '✨' : '📜';
    d.querySelector('.tc-tx').textContent = m ? text.slice(m[0].length) : text;
    d.querySelector('.tc-x').addEventListener('click', ev => { ev.stopPropagation(); this.toastOut(d); });
    d.addEventListener('mouseenter', () => { clearTimeout(d._t); d.classList.add('hold'); });
    d.addEventListener('mouseleave', () => { d.classList.remove('hold'); this.toastLife(d); });
    this.log.appendChild(d);
    const live = [...this.log.children].filter(x => !x.classList.contains('out'));
    while (live.length > 5) this.toastOut(live.shift());
    this.toastLife(d);
  },
  toastLife(d) {
    clearTimeout(d._t);
    const ms = d.dataset.cls === 'bad' ? 9000 : 6500, bar = d.querySelector('.tc-life');
    bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = `tclife ${ms}ms linear forwards`;
    d._t = setTimeout(() => this.toastOut(d), ms);
  },
  toastOut(d) { if (!d || d.classList.contains('out')) return; clearTimeout(d._t); d.classList.add('out'); setTimeout(() => d.remove(), 320); },
  banner(text) {
    this.bannerEl.textContent = text;
    this.bannerEl.classList.remove('show'); void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('show');
  },
  prompt(text) {
    if (this.lastPrompt === text) return;
    this.lastPrompt = text;
    this.promptEl.innerHTML = text || '';
    this.promptEl.style.display = text ? 'block' : 'none';
  },

  updateHUD() {
    if (Touch.on) Touch.update();
    const $ = id => document.getElementById(id);
    const txt = (id, v) => { const el = $(id); if (el.textContent !== String(v)) el.textContent = v; };
    const html = (id, v) => { const el = $(id); if (el._h !== v) { el._h = v; el.innerHTML = v; } };
    const setBar = (id, v, max) => {
      const el = $(id), pct = U.clamp(v / max * 100, 0, 100) + '%';
      el.querySelector('i').style.width = pct;
      el.querySelector('em').style.width = pct;
      el.querySelector('span').textContent = Math.ceil(Math.max(0, v)) + ' / ' + max;
      el.classList.toggle('low', v / max < 0.25);
    };
    setBar('hpBar', P.hp, P.maxHp); setBar('stBar', P.stamina, 100); setBar('huBar', P.hunger, 100);
    txt('hudName', G.name + (G.surname ? ' ' + G.surname : ''));
    txt('hudLvl', P.level);
    const title = Game.playerTitle();
    html('hudTitle', (title.king ? icon('crown') : '') + this.esc(title.text));
    $('hudXp').style.width = U.clamp(P.xp / Game.xpNext() * 100, 0, 100) + '%';
    txt('hudXpT', `Nível ${P.level} · ${P.xp} / ${Game.xpNext()} XP`);
    txt('hudGold', P.gold);
    txt('hudFame', Court.fame());
    txt('hudFol', Game.allies().length + '/' + Game.followerCap());
    txt('hudAtk', Math.round(Game.pDmg()));
    txt('hudDef', Game.pDef());
    Game.drawPortrait($('portrait'));

    const night = Game.isNight();
    html('clkIcon', night ? icon('moon', 'moon') : icon('sun', 'sun'));
    const cdt = Calendar.of(G.day);
    txt('clkDay', MONTHS[cdt.month][0]);
    const ck = document.getElementById('clock'), ct = `${Calendar.full(G.day)} · ${Season.cur().name}`;
    if (ck.title !== ct) ck.title = ct;
    const se = Season.cur();
    txt('clkPhase', `${se.icon} Ano ${cdt.year}`);
    // a pizza: de dia se enche em 5 minutos; à noite mostra quanto falta para amanhecer
    const pie = $('clkPie'), fill = night ? G.time / NIGHT_LEN : Game.dayFill();
    pie.classList.toggle('night', night);
    pie.style.setProperty('--fill', (fill * 360).toFixed(1) + 'deg');
    pie.title = night ? 'Noite: o dia volta em ' + Math.ceil(NIGHT_LEN - G.time) + 's' : 'O mês vira em ' + Math.ceil(DAY_LEN - G.time) + 's';
    const zc = G.zone >= 0 ? Game.civColor(G.zone) : '#9ad65a';
    const zone = G.dungeon ? '🕯️ ' + G.dungeon.name : G.zone >= 0 ? CIV_DEFS[G.zone].name : 'Terras Selvagens';
    html('clkZone', `${icon('compass')}<span style="color:${zc}">${zone}</span>` +
      (G.zone >= 0 && G.civs[G.zone].ruler === 'player' ? ' <span class="badge" style="background:#a8791a">SEU REINO</span>' : '') +
      (G.zone >= 0 && G.civs[G.zone].atWar ? ' <span class="badge">GUERRA</span>' : '') +
      (G.siege ? ' <span class="badge">CERCO</span>' : ''));

    const now = G.realTime;
    html('hudBuffs', Farm.active().map(k => { const b = BUFFS[k], left = Math.ceil((P.buffs[k] - now) / 60 * 10) / 10;
      return `<span class="buff" title="${b.name}: ${b.desc}">${b.icon}<small>${Math.max(1, Math.ceil(P.buffs[k] - now))}s</small></span>`; }).join(''));
    const al = Game.allies().length;
    txt('qOrder', al ? `${ORDERS[G.order || 'follow'].icon} ${ORDERS[G.order || 'follow'].name}` : '');
    $('qOrdBox').classList.toggle('hidden', !al);
    for (const b of document.querySelectorAll('#toolbar [data-tb]')) b.classList.toggle('on', !!(this.cur && this.cur.fn === b.dataset.tb));
    const tk = P.equip.tool, tit = tk && ITEMS[tk];
    const wt = Store.weight(), cap = Store.capacity();
    $('qLoad').style.width = U.clamp(wt / cap * 100, 0, 100) + '%';
    $('qLoad').classList.toggle('over', wt > cap);
    txt('qLoadT', `${P.horse ? (P.mounted ? '🐎 ' : '🐴 ') : '🎒 '}${wt}/${cap}`);
    $('qLoadBox').classList.toggle('over', wt > cap);
    html('qToolIc', tit ? tit.icon : '✋');
    txt('qToolName', tit ? tit.name : 'Mãos livres');
    { const tb = $('qToolBox'), tt = `${tit ? tit.name + ' (' + TOOL_NAMES[tit.tool] + ' · ' + TIER_NAMES[tit.tier] + ')' : 'Mãos livres'} — clique ou Q para trocar`; if (tb.title !== tt) tb.title = tt; }
    txt('qToolSub', tit ? `${TOOL_NAMES[tit.tool]} · ${TIER_NAMES[tit.tier]}` : 'Sem ferramenta');
    for (let q = 0; q < 4; q++) {
      const k = P.quick[q];
      html('qs' + q, k ? ITEMS[k].icon : '');
      txt('qn' + q, k ? Inv.count(k) : '');
      $('qs' + q).parentNode.classList.toggle('empty', !k || Inv.count(k) <= 0);
    }
  },

  // ------------------------------------------------------------ painéis
  // ============================================================ janelas principais (padrão único)
  // Mochila (inventário): bolsos, grade de itens e o herói equipado
  // inventário no estilo "Last Day on Earth": bolsos e mochila em grade à esquerda, o herói equipado à direita
  showInventory() {
    const order = ['Recursos', 'Materiais', 'Comida', 'Sementes', 'Ferramentas', 'Armas', 'Armaduras', 'Diversos'];
    const keys = this.invKeys(order), S = this.sel;
    const eqOf = k => Object.keys(P.equip).find(s => P.equip[s] === k);
    const glyph = { weapon: '⚔️', tool: '⛏️', head: '🪖', torso: '👕', legs: '👖', feet: '🥾', shield: '🛡️' };
    const slot = key => {
      const sl = EQUIP_SLOTS.find(x => x.key === key), k = P.equip[key], it = k && ITEMS[k];
      return `<div class="pd-slot ${it ? 'full' : ''} ${it && S.inv === k ? 'on' : ''}" data-drop="equip" data-slot="${key}" ${it ? `data-drag="eq" data-k="${k}" data-act="isel"` : ''} title="${sl.name} — ${sl.sub}${it ? ': ' + it.name + ' (arraste para fora para tirar)' : ' (arraste um item para cá)'}">
        <span class="pd-ic">${it ? it.icon : `<i class="pd-empty">${glyph[key]}</i>`}</span><small>${sl.name}</small></div>`;
    };
    this.showInventoryGrid(keys, slot, eqOf, Game.playerTitle(), Store.weight(), Store.capacity());
  },
  showInventoryGrid(keys, slot, eqOf, t, w, cap) {
    const S = this.sel;
    if (!S.inv || !P.inv[S.inv]) S.inv = keys[0] || null;
    const cell = k => { const it = ITEMS[k]; return `<div class="tile ${S.inv === k ? 'on' : ''}" data-act="isel" data-k="${k}" data-drag="inv" data-drop="tile" title="${it.name}">${it.icon}<span class="tn">${P.inv[k]}</span>${eqOf(k) ? '<span class="te">EQ</span>' : ''}</div>`; };
    // grade fixa como numa mochila de verdade: as casas vazias também aparecem
    const cols = 6, n = Math.max(cols * 3, Math.ceil(keys.length / cols) * cols);
    const cells = keys.map(cell).join('') + '<div class="tile empty" data-drop="grid"></div>'.repeat(n - keys.length);
    const quick = [0, 1, 2, 3].map(q => {
      const k = P.quick[q], it = k && ITEMS[k];
      return `<div class="tile qtile ${it && S.inv === k ? 'on' : ''}" data-drop="quick" data-q="${q}" ${it ? `data-drag="quick" data-k="${k}" data-act="isel"` : ''}>${it ? `${it.icon}<span class="tn">${Inv.count(k)}</span>` : ''}</div>`;
    }).join('');
    // o botão principal muda conforme o item escolhido
    const k = S.inv, it = k && ITEMS[k], eq = k && eqOf(k);
    const use = !it ? '' : it.food || it.heal ? (it.food ? 'Comer' : 'Usar') : it.slot ? (eq ? 'Tirar' : it.slot === 'tool' ? 'Empunhar' : 'Equipar') : it.seed ? 'Plantar' : '';
    const xpPct = U.clamp(P.xp / Game.xpNext() * 100, 0, 100);
    const body = `<div class="ldi">
      <div class="ldi-l">
        <div class="ldi-sec"><span class="ldi-lab">Bolsos</span><div class="ldi-row">${quick}</div></div>
        <div class="ldi-sec grow"><span class="ldi-lab">Mochila</span><div class="ldi-grid" data-scroll="inv" data-drop="grid">${cells}</div></div>
        <div class="ldi-bar"><button class="primary" data-act="iuse" ${use ? '' : 'disabled'}>${use || 'Usar'}</button>
          <span class="ldi-sel">${it ? `<b>${this.esc(it.name)}</b> ×${Inv.count(k)}` : '<span class="muted">Toque num item</span>'}</span>
          <button class="ldi-trash" data-act="itrash" ${it ? '' : 'disabled'} title="Descartar">${icon('trash')}</button></div>
      </div>
      <div class="ldi-r">
        <div class="ldi-head"><span class="ldi-lv">${String(P.level).padStart(2, '0')}</span>
          <div class="ldi-who"><b>${this.esc(G.name)}</b><small>${this.esc(t.text)} · ${P.age} anos</small><div class="ldi-xp"><i style="width:${xpPct}%"></i></div></div>
          <span class="ldi-chip">🍎 ${Math.round(P.hunger)}</span><span class="ldi-chip">⚡ ${Math.round(P.stamina)}</span></div>
        <div class="ldi-doll"><div class="pd-col">${slot('weapon')}${slot('shield')}${slot('tool')}</div>
          <div class="pd-mid"><canvas id="invDoll" width="120" height="170"></canvas></div>
          <div class="pd-col">${slot('head')}${slot('torso')}${slot('legs')}${slot('feet')}</div></div>
        <div class="ldi-stats"><span title="Vida">❤ ${Math.ceil(P.hp)}/${P.maxHp}</span><span title="Dano">⚔ ${Math.round(Game.pDmg())}</span><span title="Defesa">🛡 ${Game.pDef()}</span><span title="Carga" class="${w > cap ? 'bad' : ''}">🎒 ${w}/${cap}</span></div>
      </div></div>`;
    this.open('Inventário', body, 'showInventory', [], `${P.gold} 🪙`);
    const cv = document.getElementById('invDoll');
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    drawHuman(g, 60, 158, Object.assign(playerLook(), { scale: 3.3, dir: 1, moving: false, swing: 0, rod: false }));
  },
  // itens na ordem escolhida pelo jogador (arrastando); os novos vão para o fim, por categoria
  invKeys(order) {
    const byCat = (a, b) => order.indexOf(ITEMS[a].cat) - order.indexOf(ITEMS[b].cat) || ITEMS[a].name.localeCompare(ITEMS[b].name);
    const keys = Object.keys(P.inv).filter(k => P.inv[k] > 0);
    const ord = P.invOrder || [];
    return keys.sort((a, b) => {
      const ia = ord.indexOf(a), ib = ord.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return byCat(a, b);
    });
  },
  // ------------------------------------------------------------ arrastar e soltar na mochila
  initDrag() {
    const pan = this.panel;
    let drag = null;
    const start = (e, el) => {
      drag = { el, kind: el.dataset.drag, k: el.dataset.k, slot: el.dataset.slot, q: el.dataset.q, x: e.clientX, y: e.clientY, on: false, touch: e.pointerType === 'touch', t0: performance.now(), id: e.pointerId, scroller: el.closest('.scroll') };
    };
    pan.addEventListener('pointerdown', e => {
      const el = e.target.closest('[data-drag]');
      if (!el || !this.cur || this.cur.fn !== 'showInventory' || e.button > 0) return;
      start(e, el);
    });
    window.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y, dist = Math.hypot(dx, dy);
      if (!drag.on) {
        // no toque: segure um instante para arrastar; deslizar logo rola a lista
        if (drag.touch && performance.now() - drag.t0 < 220) { if (dist > 8 && drag.scroller) { drag.scroll = true; } }
        if (drag.scroll) { drag.scroller.scrollTop -= e.clientY - (drag.ly === undefined ? drag.y : drag.ly); drag.ly = e.clientY; return; }
        if (dist < 7) return;
        drag.on = true;
        const g = document.createElement('div');
        g.className = 'drag-ghost';
        g.textContent = ITEMS[drag.k] ? ITEMS[drag.k].icon : '?';
        document.body.appendChild(g); drag.ghost = g;
        document.body.classList.add('dragging');
        drag.el.classList.add('drag-src');
      }
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const tg = over && over.closest('[data-drop]');
      for (const x of pan.querySelectorAll('.drop-over')) x.classList.remove('drop-over');
      if (tg) tg.classList.add('drop-over');
      e.preventDefault();
    }, { passive: false });
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (!d.on) return;
      d.ghost.remove(); document.body.classList.remove('dragging');
      this.suppressClick = true; setTimeout(() => { this.suppressClick = false; }, 60);
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const tg = over && over.closest('[data-drop]');
      this.dropItem(d, tg ? tg.dataset : null);
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', e => { if (drag && drag.ghost) { drag.ghost.remove(); document.body.classList.remove('dragging'); } drag = null; });
    pan.addEventListener('click', e => { if (this.suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);
  },
  dropItem(d, t) {
    const k = d.k, it = ITEMS[k];
    const where = t ? t.drop : null;
    if (d.kind === 'inv') {
      if (where === 'equip') {
        if (it.slot === t.slot) { Game.equip(k); Sound.play('ui'); }
        else this.msg(it.slot ? `${it.name} vai no espaço ${EQUIP_SLOTS.find(x => x.key === it.slot).name}.` : `${it.name} não é equipável.`, 'bad');
      } else if (where === 'quick') {
        if (it.food || it.heal || it.tool) Game.setQuick(+t.q, k); else this.msg('Na algibeira vão comidas, remédios e ferramentas.', 'bad');
      } else if (where === 'trash') this.discard(k);
      else if (where === 'tile' && t.k !== k) {
        const order = this.invKeys(['Recursos', 'Materiais', 'Comida', 'Sementes', 'Ferramentas', 'Armas', 'Armaduras', 'Diversos']).filter(x => x !== k);
        order.splice(order.indexOf(t.k), 0, k);
        P.invOrder = order;
      }
    } else if (d.kind === 'eq') {
      if (where === 'trash') this.discard(k);
      else if (where !== 'equip') { const sl = Object.keys(P.equip).find(s => P.equip[s] === k); if (sl) { P.equip[sl] = null; this.msg(`Você tirou ${it.name}.`); } }
    } else if (d.kind === 'quick') {
      const from = P.quick.indexOf(k);
      if (where === 'quick') { const to = +t.q, other = P.quick[to]; P.quick[to] = k; P.quick[from] = other || null; }
      else if (from >= 0) P.quick[from] = null;
    }
    this.sel.inv = k;
    this.refresh();
  },
  discard(k) {
    const it = ITEMS[k], n = Inv.count(k);
    if (!n) return;
    Dialog.confirm({ icon: '🗑️', title: 'Descartar', text: `Descartar ${n}× ${it.name}? Os itens somem para sempre.`, ok: 'Descartar', danger: true }, () => { this.doDiscard(k); this.refresh(); });
  },
  doDiscard(k) {
    const it = ITEMS[k], n = Inv.count(k);
    for (const s in P.equip) if (P.equip[s] === k) P.equip[s] = null;
    for (let q = 0; q < 4; q++) if (P.quick[q] === k) P.quick[q] = null;
    Inv.add(k, -n);
    this.msg(`Você descartou ${n}× ${it.name}.`);
  },

  // detalhes de uma receita: nome, materiais e onde conseguir cada um
  craftDetailHtml(r, so) {
    const it = ITEMS[r.out];
    const req = Object.entries(r.cost).map(([k, n]) => {
      const info = ITEMS[k] || GROUP_INFO[k], have = Inv.count(k);
      return `<div class="req-row"><span>${info.icon}</span><span>${info.name}</span><b class="${have >= n ? 'ok' : 'bad'}">${have}/${n}</b></div>`;
    }).join('');
    return `<div class="dt-head"><div class="dt-ic">${it.icon}</div><div><div class="dt-name">${it.name}${r.n > 1 ? ' ×' + r.n : ''}</div><div class="dt-cat">${it.cat}</div></div></div>
      <div><div class="sec">Materiais</div><div class="req">${req}</div></div>
      <div><div class="sec">Onde conseguir</div><div class="src-list">${Object.keys(r.cost).map(k => {
        const info = ITEMS[k] || GROUP_INFO[k];
        return `<div class="src-row"><span>${info.icon}</span><span><b>${info.name}:</b> ${this.whereToGet(k)}</span></div>`;
      }).join('')}</div>
        ${!so ? `<small class="bad">Fique perto da estação (${STATIONS[r.station].name.split(' /')[0]}) para criar.</small>` : ''}</div>`;
  },
  // quadro de detalhes que nunca rola: escolhe UM tamanho para todos os itens da lista (o maior em que o mais longo
  // ainda cabe). Telas pequenas ampliam até 145%; telas grandes só diminuem se faltar espaço (janela do navegador baixa).
  fitDetail(sel, list, inner, extraKey) {
    const box = document.querySelector('#panel ' + sel + ' .cdt-in');
    if (!box) return;
    box.style.zoom = '';
    const small = document.body.classList.contains('small');
    const dt = box.parentNode, act = dt.querySelector('.act-row');
    const right = () => dt.getBoundingClientRect().right - 6;
    // fundo do quadro menos a altura dos botões
    const limit = () => dt.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(dt).paddingBottom) || 0) - (act ? act.getBoundingClientRect().height : 0) - 10;
    const fits = () => {
      const last = box.lastElementChild;
      if (last && last.getBoundingClientRect().bottom > limit()) return false;
      for (const el of box.querySelectorAll('.req-row, .src-row, .dt-head, .dt-desc, .chip, small')) if (el.getBoundingClientRect().right > right()) return false;
      return true;
    };
    // mesma lista e mesma tela: reaproveita o tamanho já calculado
    this.fitCache = this.fitCache || {};
    const key = list.join(',') + '|' + (extraKey || '') + '|' + innerWidth + 'x' + innerHeight;
    if (this.fitCache[sel] === undefined || this.fitCache[sel].key !== key) {
      const html = box.innerHTML;
      let z = small ? 1.45 : 1;
      for (const i of list) {
        box.innerHTML = inner(i);
        box.style.zoom = z.toFixed(2);
        while (z > 0.7 && !fits()) { z -= 0.05; box.style.zoom = z.toFixed(2); }
      }
      box.innerHTML = html;
      this.fitCache[sel] = { key, z };
    }
    const z = this.fitCache[sel].z;
    box.style.zoom = z < 0.999 || small ? z.toFixed(2) : '';
  },
  // de onde vem um material, em poucas palavras (coleta, caça, pesca, criação ou loja)
  whereToGet(k) {
    if (k === 'fish') return 'Pesca (vara de pesca na água)';
    const out = [], it = ITEMS[k];
    const objs = [...new Set(OBJ.filter(o => o && o.drops[k]).map(o => o.name))];
    if (objs.length) out.push(objs.join(', '));
    const mobs = Object.values(CREATURES).filter(c => c.drops && c.drops[k]).map(c => c.name);
    if (mobs.length) out.push('caça: ' + mobs.join(', '));
    if (it.fish || k === 'goldfish' || k === 'old_boot') out.push('pesca');
    const crop = Object.values(CROPS).find(c => c.item === k);
    if (crop) out.push('plantação (enxada e sementes)');
    const animal = { egg: 'galinheiro', milk: 'curral (vacas)', wool: 'curral (ovelhas)', honey: 'colmeia' }[k];
    if (animal) out.push(animal);
    const rc = RECIPES.find(x => x.out === k);
    if (rc) out.push('criar ' + (rc.station ? 'na ' + STATIONS[rc.station].name.split(' /')[0] : 'à mão'));
    if (!out.length) { const shop = Object.values(SHOPS).find(sh => sh.sells.includes(k)); if (shop) out.push('à venda: ' + shop.name); }
    return out.join(' · ') || 'comércio e recompensas';
  },
  // Criar: filtros por estação, lista de receitas e painel com ingredientes
  // criação: a janela C mostra só o que se faz à mão; cada estação (fogueira, bancada, forja...) mostra só as suas receitas
  showCrafting(station) {
    const S = this.sel, st = station || null;
    const near = {};
    for (const k in STATIONS) near[k] = Game.nearStation(k);
    const stOk = r => r.station === null || near[r.station];
    const maxOf = r => Math.min(...Object.entries(r.cost).map(([k, n]) => Math.floor(Inv.count(k) / n)));
    const list = RECIPES.map((r, i) => ({ r, i })).filter(({ r }) => r.station === st);
    if (!list.some(x => x.i === S.craft)) S.craft = list.length ? list[0].i : RECIPES.findIndex(r => r.station === st);
    const stIcon = { fogueira: '🔥', bancada: '🪚', forja: '⚒️', cozinha: '🥖', cervejaria: '🍺' };
    const tabs = st ? `<div class="st-head">${stIcon[st]} <b>${STATIONS[st].name}</b> ${near[st] ? '<span class="ok">● por perto</span>' : '<span class="bad">● longe — volte para perto dela</span>'}</div>`
      : '';
    const cats = ['Ferramentas', 'Armas', 'Armaduras', 'Materiais', 'Comida', 'Diversos'];
    let rows = '';
    for (const cat of cats) {
      const inCat = list.filter(({ r }) => ITEMS[r.out].cat === cat);
      if (!inCat.length) continue;
      rows += `<div class="grp">${cat}</div>`;
      for (const { r, i } of inCat) {
        const it = ITEMS[r.out], can = maxOf(r) > 0, so = stOk(r);
        const st = so && can ? ['ok', 'Pode criar'] : !so ? ['st', STATIONS[r.station].name.split(' ')[0]] : ['mat', 'Falta material'];
        rows += `<button class="rrow ${S.craft === i ? 'on' : ''}" data-act="csel" data-r="${i}"><span class="ri">${it.icon}</span>
          <span><b>${it.name}${r.n > 1 ? ' ×' + r.n : ''}</b><small>${this.itemDesc(it) || it.cat}</small></span><span class="rs ${st[0]}">${st[1]}</span></button>`;
      }
    }
    if (!rows) rows = '<p class="muted">Nenhuma receita com esses filtros.</p>';
    const r = RECIPES[S.craft], so = stOk(r), mx = maxOf(r);
    this.craftInner = i => this.craftDetailHtml(RECIPES[i], stOk(RECIPES[i]));
    this.craftList = list.map(x => x.i);
    this.craftNear = list.map(x => stOk(x.r) ? 1 : 0).join(''); // o aviso de estação muda a altura
    const detail = `<div class="cdt-in">${this.craftDetailHtml(r, so)}</div>
      <div class="act-row"><button class="primary" data-act="craft" data-r="${S.craft}" data-n="1" ${so && mx > 0 ? '' : 'disabled'}>Criar</button>
        <button data-act="craft" data-r="${S.craft}" data-n="${Math.max(1, mx)}" ${so && mx > 0 ? '' : 'disabled'}>Máximo (${so ? mx : 0})</button></div>`;
    const bagCard = st === 'bancada' && Store.nextBag() ? `<div class="card bagup"><div class="sec">🎒 Melhorar mochila <span>nível ${Store.bagLvl()} → ${Store.bagLvl() + 1}</span></div>
      <div class="kv"><div>Agora<b>${Store.bag().cap}</b></div><div>Depois<b class="ok">${Store.nextBag().cap}</b></div></div><div class="cost">${this.fmtCost(Store.nextBag().cost)}</div>
      <button class="primary" data-act="bagup" ${Inv.has(Store.nextBag().cost) && near.bancada ? '' : 'disabled'}>Melhorar para ${Store.nextBag().name}</button></div>` : '';
    const body = `<div class="split"><div class="col">${tabs}${bagCard}
        <div class="scroll" data-scroll="craft">${rows}</div></div>
      <div class="card detail craft-dt">${detail}</div></div>`;
    this.open(st ? STATIONS[st].name.split(' /')[0] : 'Criação', body, 'showCrafting', [st], st ? 'Receitas desta estação' : 'Itens que você faz com as próprias mãos');
    this.fitDetail('.craft-dt', this.craftList, this.craftInner, this.craftNear);
  },

  // Construir: lista agrupada e detalhes com custo (inclui estradas, reformas e as obras de chefe e rei)
  binfo(k) {
    if (!BUILDINGS[k]) return Urban.info(k);
    const b = BUILDINGS[k], n = World.structs.filter(s => s.owner === 'player' && s.type === k && !s.removed).length;
    return { name: b.name, icon: Game.buildIcon(k), cost: b.cost, desc: b.desc, sub: `${b.w}×${b.h} · ${n ? `você tem ${n}` : 'nenhuma ainda'}`, can: Inv.has(b.cost),
      cat: `${b.w}×${b.h} espaços · ${b.blocks ? 'sólida' : 'pode-se andar por cima'}`, btn: '📍 Construir no mapa', owned: n, size: `${b.w}×${b.h}` };
  },
  showBuild() {
    const S = this.sel;
    // categorias no menu lateral: [chave, ícone, nome, itens]
    const cats = [['moradia', '🏠', 'Moradia', ['cabin', 'house', 'manor']], ['producao', '🔨', 'Produção', ['campfire', 'workbench', 'forge', 'oven', 'brewery']],
      ['fazenda', '🐄', 'Fazenda e animais', ['farm', 'coop', 'pen', 'beehive']], ['negocios', '💼', 'Empreendimentos', ['biz_farm', 'biz_mill', 'biz_lumber', 'biz_quarry', 'biz_mine', 'biz_smithy', 'biz_shop', 'ptavern']],
      ['guarda', '📦', 'Baús e estábulo', ['chest', 'stable']], ['defesa', '🛡️', 'Defesa e exército', ['barracks', 'wall_wood', 'wall_stone']],
      ['estradas', '🛣️', 'Estradas', ['road', 'u:unroad']], ['reformas', '🔀', 'Reformas', ['u:move', 'u:demolish']]]
      .map(([k, ic, name, ks]) => [k, ic, name, ks.filter(x => BUILDINGS[x] || x.includes(':') || x === 'road')]);
    const auth = Urban.hasAny();
    if (auth) cats.push(['obras', '🏗️', 'Obras nas vilas', Object.keys(CIVIC).map(k => 'c:' + k)]);
    this.buildCats = cats;
    const catOf = k => (cats.find(c => c[3].includes(k)) || cats[0])[0];
    if (S.build && S.build.startsWith('c:') && !auth) S.build = null;
    if (!S.bcat || !cats.some(c => c[0] === S.bcat)) S.bcat = S.build ? catOf(S.build) : 'moradia';
    const cat = cats.find(c => c[0] === S.bcat);
    if (!S.build || !cat[3].includes(S.build)) S.build = cat[3][0];
    // cada linha: nome, quantas você tem e o custo (verde se tem o material, vermelho se falta)
    const costMini = cost => Object.entries(cost).map(([k, n]) => `<i class="${Inv.count(k) >= n ? 'ok' : 'bad'}">${ITEMS[k].icon}${n}</i>`).join('');
    const rows = cat[3].map(k => {
      const b = this.binfo(k), tool = !b.cost;
      const sub = tool ? b.sub : `${b.owned !== undefined ? (b.owned ? `você tem ${b.owned} · ` : '') : ''}<span class="bcost">${costMini(b.cost)}</span>`;
      return `<button class="rrow ${S.build === k ? 'on' : ''}" data-act="bsel" data-k="${k}"><span class="ri">${b.icon}</span>
        <span><b>${b.name}</b><small>${sub}</small></span><span class="rs ${tool || b.can ? 'ok' : 'mat'}">${tool ? 'Grátis' : b.can ? 'Disponível' : 'Falta material'}</span></button>`;
    }).join('');
    const mine = Urban.myVillages(), kings = G.civs.filter(c => c.ruler === 'player');
    this.buildPower = kings.length || mine.length ? `<small class="ok">Você manda em: ${[...kings.map(c => '👑 ' + CIV_DEFS[c.id].short + ' (reino todo)'), ...mine.map(x => '🏘️ ' + this.esc(x.v.name))].join(' · ')}</small>`
      : '<small class="muted">Para mexer nos imóveis e estradas das vilas, torne-se chefe de uma vila (fundando, conquistando ou pedindo ao rei) ou rei.</small>';
    this.buildCatKey = S.bcat;
    const b = this.binfo(S.build);
    const detail = `<div class="cdt-in">${this.buildDetailHtml(S.build)}</div>
      <div class="act-row"><button class="primary" data-act="${BUILDINGS[S.build] ? 'build' : 'urban'}" data-k="${S.build}" ${b.can ? '' : 'disabled'}>${b.btn}</button></div>`;
    const ready = c => c[3].filter(k => { const x = this.binfo(k); return x.cost && x.can; }).length;
    const groups = [['Sua base', cats.slice(0, 6).map(c => [c[0], c[1], c[2], ready(c)])], ['Estradas e vilas', cats.slice(6).map(c => [c[0], c[1], c[2]])]];
    this.open('Construção', `<div class="bld iconnav">${this.navHtml(groups, S.bcat, 'bcat', `<div class="split"><div class="col"><div class="scroll" data-scroll="build">${rows}</div></div><div class="card detail bld-dt">${detail}</div></div>`)}</div>`,
      'showBuild', [], 'Erga sua base, abra estradas e reforme as vilas');
    this.fitDetail('.bld-dt', cat[3], k => this.buildDetailHtml(k), S.bcat);
  },
  // detalhes de uma construção: o que é, informações em etiquetas e o custo
  buildDetailHtml(k) {
    const b = this.binfo(k), B = BUILDINGS[k];
    const tags = B ? [`📐 ${b.size}`, B.blocks ? '🧱 sólida' : '👣 dá para andar por cima', `🏠 você tem ${b.owned}`] : [];
    const req = b.cost ? Object.entries(b.cost).map(([c, n]) => {
      const have = Inv.count(c);
      return `<div class="req-row"><span>${ITEMS[c].icon}</span><span>${ITEMS[c].name}</span><b class="${have >= n ? 'ok' : 'bad'}">${have}/${n}</b></div>`;
    }).join('') : '';
    const cat = (this.buildCats || []).find(c => c[3].includes(k));
    return `<div class="dt-head"><div class="dt-ic">${b.icon}</div><div><div class="dt-name">${b.name}</div><div class="dt-cat">${cat ? cat[2] : b.sub}</div></div></div>
      <p class="dt-desc">${b.desc}</p>
      ${tags.length ? `<div class="chips">${tags.map(t => `<span class="chip">${t}</span>`).join('')}</div>` : ''}
      ${req ? `<div><div class="sec">Custo</div><div class="req">${req}</div></div>` : ''}
      ${B ? '<small class="muted">Depois de clicar, escolha o local perto de você. Não dá para construir sobre estradas ou água, nem dentro das cidades dos outros.</small>' : ''}
      ${['estradas', 'reformas', 'obras'].includes(cat && cat[0]) ? this.buildPower : ''}`;
  },

  // ============================================================ menu lateral (Reino, Ajustes e Construção)
  // groups: [[título do grupo, [[chave, ícone, nome, número, alerta]]]]
  navHtml(groups, cur, act, body) {
    const item = ([k, ic, label, badge, warn]) => `<button class="snav-i ${cur === k ? 'on' : ''}" data-act="${act}" data-k="${k}"><span class="si">${ic}</span><span class="sl">${label}</span>${badge !== undefined && badge !== '' && badge !== 0 ? `<em class="${warn ? 'warn' : ''}">${badge}</em>` : ''}</button>`;
    return `<div class="navlay"><nav class="snav">${groups.map(([title, items]) => (title ? `<div class="snav-g">${title}</div>` : '') + items.map(item).join('')).join('')}</nav>
      <div class="snav-body" data-scroll="snav">${body}</div></div>`;
  },
  // ============================================================ janelas de conteúdo do Reino: nunca rolam
  // Todas usam o mesmo tamanho de ícone e texto (nada é encolhido).
  // Telas grandes: o mesmo visual das telas pequenas, mas tudo numa página só — os quadros se arrumam numa grade
  // (classe .kdesk + data-nav, ver css "Portfólio no computador").
  // Telas pequenas: o conteúdo vira páginas inteiras (um quadro nunca é cortado ao meio; só uma lista maior que a
  // tela é dividida, repetindo o título do quadro). Arraste para o lado para trocar de página; os pontinhos embaixo
  // mostram em qual você está.
  fitReino(nav, pkey) {
    nav = nav || this.sel.knav;
    const body = this.panel.querySelector('.iconnav .snav-body'), box = body && body.querySelector('.kpg');
    if (!box) return;
    const small = document.body.classList.contains('small');
    body.classList.add('kfit');
    const isHead = el => el.matches('.pg-head, .tabs, .subtabs, .ktabs');
    const flat = [];
    const walk = parent => { for (const el of [...parent.children]) { if (small && el.matches('.fam-d, .biz-d, .atl-d, .gc-d, .ln-d')) continue; if (el.matches('.kbody, .fam-m, .biz-m, .atl-m, .gc-m, .ln-m') || (el.tagName === 'DIV' && !el.className && el.children.length > 1)) walk(el); else flat.push(el); } };
    walk(box);
    const head = [], units = [];
    for (const el of flat) (units.length === 0 && isHead(el) ? head : units).push(el);
    const bottom = () => body.getBoundingClientRect().bottom - 2;
    const lists = (el, tiles) => [el, ...el.querySelectorAll('*')].filter(d => d.children.length >= 3 && !d.closest('.tpair, .fm-crest, .at-main, .at-people, .gc-top, .gc-rank, .gc-risk, .ln-tree, .ln-ties, .ln-map, .dy-ach-top, .dy-gens, .dy-chart, .dy-stats, .st-play, .st-sound, .st-touch, .st-card, .st-screen') && !d.matches('select, svg, svg *, .seg, .chips, .swatches, .hswatch, .tabs, .act-row, .titles' + (tiles ? '' : ', .tiles')));
    const deepList = (el, tiles) => lists(el, tiles).sort((x, y) => y.children.length - x.children.length)[0] || null;
    if (!small) {
      const on = nav.startsWith('d:') || nav.startsWith('s:') || ['overview', 'crown', 'family', 'villages', 'biz', 'atlas', 'families', 'tree'].includes(nav);
      body.classList.toggle('kfit', on); box.classList.toggle('kdesk', on);
      if (on) box.dataset.nav = nav;
      return;
    }
    // telas pequenas: páginas inteiras lado a lado, trocadas arrastando
    const W = body.clientWidth, H = body.clientHeight - 14; // 14 = espaço dos pontinhos
    const pages = [];
    let cur;
    const fresh = () => { cur = document.createElement('div'); cur.className = 'kpg kpage'; cur.style.width = W + 'px'; cur.dataset.nav = nav; for (const h of head) cur.appendChild(h.cloneNode(true)); body.innerHTML = ''; body.appendChild(cur); };
    const fits = () => cur.scrollHeight <= H + 1;
    const hasContent = () => cur.children.length > head.length;
    const push = () => { pages.push(cur); fresh(); };
    // um quadro vai inteiro; só o que é maior que a tela inteira tem a lista dividida (repetindo o título do quadro)
    const place = (u, depth) => {
      cur.appendChild(u);
      if (fits()) return;
      // cabe inteiro numa página nova? então vai para a próxima; senão é dividido a partir daqui (sem deixar buraco)
      const uh = u.getBoundingClientRect().height, headH = head.reduce((h, e) => h + e.getBoundingClientRect().height + 12, 0);
      u.remove();
      if (hasContent() && uh <= H - headH) { push(); cur.appendChild(u); return; }
      const L0 = depth < 4 ? deepList(u, true) : null;
      if (!L0) { cur.appendChild(u); push(); return; }
      const path = []; for (let e = L0; e !== u; e = e.parentNode) path.unshift([...e.parentNode.children].indexOf(e));
      const rows = [...L0.children];
      const shell = () => { const k = u.cloneNode(true); let L = k; for (const i of path) L = L.children[i]; L.innerHTML = ''; return [k, L]; };
      let [k, L] = shell(); cur.appendChild(k);
      for (const row of rows) {
        L.appendChild(row);
        if (fits()) continue;
        row.remove();
        if (L.children.length) { push(); [k, L] = shell(); cur.appendChild(k); L.appendChild(row); if (fits()) continue; row.remove(); }
        // nem uma linha sozinha cabe: divide essa linha por dentro
        k.remove(); place(row, depth + 1); [k, L] = shell(); cur.appendChild(k);
      }
      if (!L.children.length) k.remove();
    };
    fresh();
    // um quadro marcado com .kalone fica sozinho na página dele
    for (const u of units) { const alone = u.matches('.kalone'); if (alone && hasContent()) push(); place(u, 0); if (alone && hasContent()) push(); }
    if (hasContent() || !pages.length) pages.push(cur);
    body.innerHTML = '';
    const track = document.createElement('div'); track.className = 'kpages';
    for (const p of pages) track.appendChild(p);
    const dots = document.createElement('div'); dots.className = 'kdots';
    dots.innerHTML = pages.length > 1 ? pages.map((_, i) => `<i data-i="${i}"></i>`).join('') : '';
    body.appendChild(track); body.appendChild(dots);
    const S = this.sel, key = pkey || S.knav + '/' + S.ksub; S.kpageOf = S.kpageOf || {};
    const mark = () => { const i = Math.round(track.scrollLeft / W); S.kpageOf[key] = i; dots.querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j === i)); };
    track.addEventListener('scroll', () => { clearTimeout(this._kdt); this._kdt = setTimeout(mark, 60); });
    dots.addEventListener('click', e => { const d = e.target.closest('i'); if (d) track.scrollTo({ left: +d.dataset.i * W, behavior: 'smooth' }); });
    track.scrollLeft = Math.min(S.kpageOf[key] || 0, pages.length - 1) * W;
    mark();
  },
  pageHead(ic, title, sub) { return `<div class="pg-head"><span class="pg-ic">${ic}</span><div><h3>${title}</h3>${sub ? `<small>${sub}</small>` : ''}</div></div>`; },

  // ============================================================ Reino
  // Você (visão geral, coroa, família, vilas e guardas, empreendimentos) · Seus reinos (um por reino) · O mundo
  showKingdom(ci) {
    const S = this.sel, ruled = G.civs.filter(c => c.ruler === 'player');
    if (ci !== undefined && ci >= 0 && G.civs[ci] && G.civs[ci].ruler === 'player') S.knav = 'k:' + ci;
    if (!S.knav) S.knav = ruled.length ? 'k:' + ruled[0].id : 'overview';
    if (S.knav === 'market' || S.knav === 'news') S.knav = 'overview'; // páginas que saíram do Reino
    if (S.knav.startsWith('k:') && !ruled.some(c => 'k:' + c.id === S.knav)) S.knav = ruled.length ? 'k:' + ruled[0].id : 'overview';
    const mine = Urban.myVillages(), alerts = this.kAlerts();
    const groups = [['Você', [['overview', '🏠', 'Visão geral', alerts.length, alerts.length > 0], ['crown', '👑', 'Coroa e títulos'], ['family', '👪', 'Família'],
      ['villages', '🏘️', 'Vilas e guardas', mine.length], ['biz', '💼', 'Empreendimentos', Biz.list().length]]]];
    if (ruled.length) groups.push(['Seus reinos', ruled.map(c => ['k:' + c.id, Heraldry.armsSvg(c.id, 16), CIV_DEFS[c.id].short,
      c.rebel > 0 || c.atWar ? '!' : '', c.rebel > 0 || c.atWar])]);
    groups.push(['O mundo', [['atlas', '🗺️', 'Reino'], ['families', '🏛️', 'Grandes Casas'], ['tree', '🌳', 'Linhagens']]]);
    const page = this.kPage(S.knav);
    this.open('Portfólio', `<div class="iconnav">${this.navHtml(groups, S.knav, 'knav', `<div class="kpg">${page}</div>`)}</div>`, 'showKingdom', [], 'Você, seus reinos e o mundo');
    this.fitReino();
    if (S.knav === 'tree') {
      // no computador o mapa ocupa um quadro alto: a tela do desenho acompanha o tamanho do quadro
      const cv = document.getElementById('relMapM');
      if (cv && !document.body.classList.contains('small')) { const b = cv.parentElement; cv.width = Math.round(b.clientWidth * 1.4); cv.height = Math.round(b.clientHeight * 1.4); }
      this.drawRelMap(Families.ensurePlayer(), 'relMapM');
    }
    if (S.knav === 'tree' && S.ttab === 'relacoes') this.drawRelMap(Families.ensurePlayer());
  },
  // avisos importantes (aparecem na Visão geral)
  kAlerts() {
    const out = [];
    for (const c of G.civs.filter(x => x.ruler === 'player')) {
      const s = CIV_DEFS[c.id].short, fc = Game.civForecast(c);
      if (c.rebel > 0) out.push([`⚠️ ${s}: o povo está à beira da revolta (${c.rebel}/3).`, 'k:' + c.id]);
      if (fc.wheat < fc.need) out.push([`🌾 ${s}: falta trigo, o povo vai passar fome.`, 'k:' + c.id]);
      for (const pl of Court.plotsOf(c.id)) out.push([`🗡️ ${s}: conspiração descoberta no conselho.`, 'k:' + c.id]);
      for (const r of (G.revolts || []).filter(r => !r.done && r.civ === c.id)) out.push([`🔥 ${s}: a ${Families.name(Families.get(r.fam) || { surname: '?' })} se revoltou.`, 'k:' + c.id]);
    }
    for (const a of (G.assaults || []).filter(a => a.state !== 'done')) out.push([`🚩 ${Diplo.name(a.att)} ${a.state === 'march' ? 'marcha contra' : 'ataca'} ${Sieges.targetName(a)}.`, 'villages']);
    if (G.courtInvite) out.push([`👑 ${G.civs[G.courtInvite.civ].rulerName} convidou você para a corte de ${CIV_DEFS[G.courtInvite.civ].short} (responda no castelo).`, 'crown']);
    { const cc = RoyalCourt.C(); if (cc && G.day - cc.lastVisit > COURT_ABSENCE.warn) out.push([`👑 A corte de ${CIV_DEFS[cc.civ].short} sente a sua falta: apareça no castelo.`, 'crown']); }
    if (G.vwar && World.villages[G.vwar.vi]) out.push([`⚔️ Ataque a ${World.villages[G.vwar.vi].name}: faltam ${G.vwar.left} milicianos.`, 'villages']);
    for (const c of G.civs) if (c.ruler !== 'player' && c.atWar) out.push([`⚔️ ${CIV_DEFS[c.id].short} está em guerra com você.`, 'crown']);
    return out;
  },
  kPage(nav) {
    const S = this.sel, ruled = G.civs.filter(c => c.ruler === 'player');
    if (nav === 'overview') {
      const t = Game.playerTitle(), f = Families.ensurePlayer(), mine = Urban.myVillages();
      const link = (k, label, val, ic, hue) => `<button class="stile link ov" style="--hue:${hue}" data-act="knav" data-k="${k}"><span class="ov-ic">${ic}</span><small>${label}</small><b>${val}</b></button>`;
      const res = (label, val, ic, hue, sub) => `<div class="stile ov" style="--hue:${hue}"><span class="ov-ic">${ic}</span><small>${label}</small><b>${val}</b>${sub ? `<em class="ov-sub">${sub}</em>` : ''}</div>`;
      const alerts = this.kAlerts();
      return this.pageHead(t.king ? '👑' : '🛡️', `${this.esc(G.name)} ${this.esc(G.surname || '')}`, `${this.esc(t.text)} · nível ${P.level} · ${P.age} anos · ${Calendar.full(G.day)}`)
        + (alerts.length ? `<div class="card"><div class="sec">⚠️ Atenção</div>${alerts.map(([txt, k]) => `<div class="alert row">${this.esc(txt)}<button data-act="knav" data-k="${k}">Ver</button></div>`).join('')}</div>` : '')
        + `<div class="card ov-card"><div class="sec">Seus domínios <span>clique para abrir</span></div><div class="tiles big">
          ${link(ruled.length ? 'k:' + ruled[0].id : 'crown', 'Reinos governados', ruled.length, '👑', 45)}${link('villages', 'Vilas que você chefia', mine.length, '🏘️', 120)}
          ${link('biz', 'Empreendimentos', Biz.list().length, '💼', 28)}${link('villages', 'Guardas', Guards.all().length, '🛡️', 210)}
          ${link('family', 'Família', (Families.members(f).length + 1) + (Families.members(f).length ? ' pessoas' : ' pessoa'), '👪', 330)}${link('crown', 'Título', Court.title() ? this.esc(Court.titleName()) : '—', Court.title() ? Court.title().icon : '⚜️', 275)}</div></div>
        <div class="card ov-card"><div class="sec">Recursos pessoais</div><div class="tiles big">
          ${res('Ouro', `${P.gold} <i class="ov-u">🪙</i>`, '💰', 45)}${res('Influência', `⭐ ${Families.influence(f)}`, '🏛️', 200)}
          ${res('Capangas', `${Game.allies().length} / ${Game.followerCap()}`, '⚔️', 0, `<i class="ov-bar"><i style="width:${Math.round(Game.allies().length / Math.max(1, Game.followerCap()) * 100)}%"></i></i>`)}${res('Fama', `🌟 ${Court.fame()}`, '📣', 35)}
          ${res('Devoção', `🙏 ${Faith.piety()}`, '⛪', 260)}${res('Caravanas na estrada', `🐫 ${Market.mine().length}`, '🐫', 90)}</div></div>
        `;
    }
    if (nav === 'crown') {
      const t = Court.T();
      const titleTxt = Court.title() ? `${Court.title().icon} Você é <b>${this.esc(Court.titleName())}</b>.<span class="tperks"> Vantagens: ${Court.title().perks}.</span>` : 'Você ainda não tem título de nobreza.';
      return this.pageHead('👑', 'Coroa e títulos', ruled.length ? `Você governa ${ruled.map(c => CIV_DEFS[c.id].short).join(', ')}` : 'Os caminhos até o trono')
        + `<div class="tpair"><div class="card"><div class="sec">⚜️ Título de nobreza</div><p>${titleTxt}</p>
          <div class="titles">${NOBLE_TITLES.map((nt, i) => `<span class="tchip ${t.lvl >= i ? 'on' : ''}">${nt.icon} ${P.sex === 'f' ? nt.f : nt.m}</span>`).join('')}</div>
          <div class="tladder" style="--prog:${Math.max(0, t.lvl) / (NOBLE_TITLES.length - 1) * 100}%">${NOBLE_TITLES.map((nt, i) => `<div class="tstep ${t.lvl > i ? 'done' : t.lvl === i ? 'cur' : t.lvl + 1 === i ? 'next' : ''}"><span class="tmedal">${nt.icon}</span><small>${P.sex === 'f' ? nt.f : nt.m}</small></div>`).join('')}</div>
          <small class="muted">Peça no castelo de um reino.</small></div>
        ${(() => { const got = CIVIL_TITLES.filter(ct => Court.hasCivil(ct.id));
          return `<div class="card civil-card"><div class="sec">🎖️ Título civil</div><p>${got.length ? `Você é <b>${got.map(ct => ct.icon + ' ' + Court.civilName(ct)).join(', ')}</b>.` : 'Você ainda não tem título civil.'}</p>
          <div class="titles">${CIVIL_TITLES.map(ct => `<span class="tchip ${Court.hasCivil(ct.id) ? 'on' : ''}">${ct.icon} ${Court.civilName(ct)}</span>`).join('')}</div>
          <div class="tmedals">${CIVIL_TITLES.map(ct => `<div class="tstep ${Court.hasCivil(ct.id) ? 'got' : 'locked'}"><span class="tmedal">${ct.icon}</span><small>${Court.civilName(ct)}</small></div>`).join('')}</div>
          <small class="muted">Ganhos pelos seus feitos · ${got.length}/${CIVIL_TITLES.length}</small></div></div>`; })()}
        ${(() => {
          // corte do rei: só o convite pendente (aceitar ou recusar) ou a corte em que você já está
          const inv = G.courtInvite, cur = RoyalCourt.C();
          if (inv && !RoyalCourt.isMember(inv.civ)) {
            const c = G.civs[inv.civ], o = COURT_OFFICES.advisor;
            return `<div class="card court-inv kalone"><div class="sec">👑 Convite da corte</div>
              <div class="ci-letter"><div class="ci-seal">${Heraldry.armsSvg(inv.civ, 46)}</div><div class="ci-text">
                <p><b>${this.esc(c.rulerName)}</b> convida você para a corte de <b>${CIV_DEFS[inv.civ].name}</b>.</p>
                <div class="ci-office">${o.icon} <b>${RoyalCourt.officeName('advisor')}</b> · ~${o.pay} 🪙 por mês</div></div></div>
              <small class="muted">${cur ? `Aceitar faz você deixar a corte de ${CIV_DEFS[cur.civ].short}. ` : ''}Na corte é preciso aparecer no castelo de tempos em tempos.</small>
              <div class="act-row"><button class="primary" data-act="cjoin" data-c="${inv.civ}">✔ Aceitar</button><button data-act="cdecline" data-c="${inv.civ}">Recusar</button></div></div>`;
          }
          if (cur) {
            const o = COURT_OFFICES[cur.office];
            return `<div class="card court-inv kalone"><div class="sec">👑 Sua corte</div>
              <div class="ci-letter"><div class="ci-seal">${Heraldry.armsSvg(cur.civ, 46)}</div><div class="ci-text">
                <p>Você está na corte de <b>${CIV_DEFS[cur.civ].name}</b>.</p>
                <div class="ci-office">${o.icon} <b>${RoyalCourt.officeName(cur.office)}</b></div></div></div>
              <small class="muted">Troque de cargo e peça audiências no castelo do rei.</small></div>`;
          }
          // o reino que está mais perto de mandar o convite
          const best = G.civs.filter(c => c.ruler !== 'player').map(c => ({ c, rn: RoyalCourt.renown(c.id), rel: Math.round(c.relation) }))
            .sort((a, b) => (Math.min(b.rn, COURT_INVITE.renown) + Math.min(b.rel, COURT_INVITE.rel)) - (Math.min(a.rn, COURT_INVITE.renown) + Math.min(a.rel, COURT_INVITE.rel)))[0];
          const bar = (v, max) => `<span class="ci-bar"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%"></i></span>`;
          return `<div class="card court-inv kalone"><div class="sec">👑 Convite da corte</div>
            <div class="ci-letter empty"><div class="ci-seal">📜</div><div class="ci-text"><p>Nenhum convite no momento.</p>
              <small class="muted">O rei convida quem tem reconhecimento ${COURT_INVITE.renown}+ e relação ${COURT_INVITE.rel}+ com o reino.</small></div></div>
            ${best ? `<div class="ci-near"><div class="ci-near-h">Mais perto de convidar: <b>${CIV_DEFS[best.c.id].short}</b></div>
              <div class="ci-row"><span>Reconhecimento</span>${bar(best.rn, COURT_INVITE.renown)}<b>${best.rn}/${COURT_INVITE.renown}</b></div>
              <div class="ci-row"><span>Relação</span>${bar(best.rel, COURT_INVITE.rel)}<b>${Math.max(0, best.rel)}/${COURT_INVITE.rel}</b></div></div>` : ''}</div>`;
        })()}
        ${(() => {
          // relação com cada reino num medidor simples: de -100 (inimigo) a +100 (aliado)
          const face = r => r >= 75 ? '😀' : r >= 40 ? '🙂' : r >= 10 ? '😐' : r > -20 ? '😶' : r > -60 ? '😠' : '😡';
          const rows = G.civs.map(c => {
            const mine = c.ruler === 'player', r = mine ? 100 : Math.round(c.relation), pct = (r + 100) / 2;
            const col = mine ? '#e8c06a' : r >= 40 ? '#5fd35f' : r >= 10 ? '#9be37a' : r > -20 ? '#c9b48a' : r > -60 ? '#e8944a' : '#e05a4a';
            return `<div class="rmeter"><span class="cdot" style="background:${Game.civColor(c.id)}"></span><b>${CIV_DEFS[c.id].short}</b>
              <span class="rm-bar"><i style="width:${pct}%;background:${col}"></i><em></em></span>
              <span class="rm-val">${c.atWar && !mine ? '<span class="badge">GUERRA</span> ' : ''}${mine ? '👑' : face(r)} ${mine ? 'seu reino' : (r > 0 ? '+' : '') + r}</span></div>`;
          }).join('');
          return `<div class="card rel-card kalone"><div class="sec">🤝 Sua relação com os 7 reinos <span>−100 inimigo · +100 aliado</span></div><div class="rmeters">${rows}</div></div>`;
        })()}`;
    }
    if (nav === 'family') {
      const f = Families.ensurePlayer(), mem = Families.members(f).filter(p => p.alive);
      const kids = mem.filter(p => p.kin === 'child' && p.age >= 16 && p.spouse === null);
      const role = p => p.spouse === 'player' ? 'cônjuge' : p.kin === 'child' ? (p.prof ? PROFESSIONS[p.prof].icon + ' ' + (p.sex === 'f' ? PROFESSIONS[p.prof].f : PROFESSIONS[p.prof].name) : 'filh' + (p.sex === 'f' ? 'a' : 'o')) : p.kin || '';
      // telas pequenas: brasão da casa, membros em cartões e casamentos arranjados, cada um na sua página
      const rank = Families.ranking().findIndex(x => x.f === f) + 1, gens = (G.dynasty || []).length + 1;
      const spouse = mem.find(p => p.spouse === 'player'), children = mem.filter(p => p.kin === 'child');
      const roleIc = p => p.spouse === 'player' ? '💍' : p.kin === 'child' ? (p.prof ? PROFESSIONS[p.prof].icon : (p.age < 14 ? '🧒' : p.sex === 'f' ? '👧' : '👦')) : '🧑';
      const mcard = p => `<div class="fm-card"><span class="fm-av" style="--c:${f.color}">${roleIc(p)}</span><div class="fm-tx"><b>${this.esc(p.name)}</b><small>${role(p)} · ${p.age} anos</small></div>
        <button data-act="tk" data-op="open" data-id="${p.id}" title="Conversar">💬</button></div>`;
      const mobile = `<div class="fam-m">
        <div class="card fm-crest kalone"><div class="fm-shield" style="--c:${f.color}"><span>${this.esc((G.surname || '?')[0])}</span></div>
          <div class="fm-info"><b class="fm-name">Casa ${this.esc(G.surname)}</b><small>Geração ${gens} · ${rank ? rank + 'ª casa mais influente' : 'casa nova'}</small>
            <div class="fm-stats"><span>⭐ <b>${Families.influence(f)}</b><small>influência</small></span><span>👪 <b>${mem.length + 1}</b><small>${mem.length ? 'membros' : 'membro'}</small></span>
              <span>💍 <b>${spouse ? this.esc(spouse.name) : '—'}</b><small>cônjuge</small></span><span>👶 <b>${children.length}</b><small>${children.length === 1 ? 'filho' : 'filhos'}</small></span></div>
            <button data-act="knav" data-k="tree">🌳 Árvore da família</button></div></div>
        <div class="card fm-members kalone"><div class="sec">Membros da casa <span>toque em 💬 para conversar</span></div>
          <div class="fm-grid"><div class="fm-card you"><span class="fm-av" style="--c:${f.color}">🛡️</span><div class="fm-tx"><b>${this.esc(G.name)}</b><small>você · ${P.age} anos</small></div></div>${mem.map(mcard).join('')}</div>
          ${mem.length ? '' : '<div class="fm-empty"><span>💍 Case-se</span><span>👶 Tenha filhos</span><span>🧬 Eles herdam tudo se você morrer</span></div>'}</div>
        ${kids.length ? `<div class="card fm-match kalone"><div class="sec">💒 Casamentos arranjados <span>150 🪙</span></div>
          <div class="fm-grid">${kids.map(k => `<div class="fm-card"><span class="fm-av" style="--c:${f.color}">${roleIc(k)}</span><div class="fm-tx"><b>${this.esc(k.name)}</b><small>${k.age} anos</small></div><button data-act="match" data-id="${k.id}">Arranjar</button></div>`).join('')}</div>
          <small class="muted">Case seus filhos com herdeiros de outros reinos (alianças) ou com as famílias mais poderosas.</small></div>` : ''}</div>`;
      return this.pageHead('👪', `Casa ${this.esc(G.surname)}`, `Influência ⭐ ${Families.influence(f)} · ${mem.length + 1} membros`) + mobile
        + `<div class="fam-d"><div class="card"><div class="sec">Membros <span>converse com eles para escolher profissões e ter filhos</span></div>
          <div class="crow2">${this.personLine('player')}</div>
          ${mem.map(p => `<div class="crow2">${this.personLine(p, role(p))} ${p.alive ? `<button data-act="tk" data-op="open" data-id="${p.id}">💬</button>` : ''}</div>`).join('') || '<p class="muted">Case-se e tenha filhos para a sua casa crescer. Se você morrer, continua o jogo como um dos filhos.</p>'}</div>
        ${kids.length ? `<div class="card"><div class="sec">💒 Casamentos arranjados <span>150 🪙</span></div>${kids.map(k => `<div class="crow2">${this.personLine(k)} <button data-act="match" data-id="${k.id}">Arranjar casamento</button></div>`).join('')}
          <small class="muted">Case seus filhos com herdeiros de outros reinos (alianças) ou com as famílias mais poderosas (lealdade e fim de rivalidades).</small></div>` : ''}
        <div class="act-row"><button data-act="knav" data-k="tree">🌳 Árvore da família e relações</button></div></div>`;
    }
    if (nav === 'villages') {
      const mine = Urban.myVillages(), site = Families.playerSite(), have = k => k === 'gold' ? P.gold : Inv.count(k);
      const vrow = ({ v, i }) => { const res = People.residents(i).length, post = { kind: 'village', vi: i };
        return `<div class="crow"><span class="ri">🏘️</span><span><b>${this.esc(v.name)}</b><small>${v.free ? 'Vila livre' : CIV_DEFS[v.civ].short} · nível ${v.level || 1} · ${res} moradores · impostos ${res * Court.villageTax()} 🪙/dia · guardas ${Guards.at(post).length}/${Guards.cap(post)}</small></span>
          <span class="act-row"><button data-act="vping" data-v="${i}" title="Marcar no mapa">📍</button></span></div>`; };
      return this.pageHead('🏘️', 'Vilas e guardas', 'O chefe recebe impostos e manda nas estradas e nos imóveis da vila')
        + `<div class="card vchief"><div class="sec">Vilas que você chefia <span>${mine.length}</span></div>${mine.map(vrow).join('') || '<div class="vg-empty"><span class="vg-emb">🏘️</span><b>Nenhuma vila ainda</b><small>Peça, conquiste ou funde a sua.</small></div><p class="muted vg-none">Nenhuma ainda.</p>'}
          <small class="muted">Como chefe, use Construir → Reformas e Obras para mudar, demolir e erguer imóveis e estradas dentro da vila.</small></div>
        ${this.guardsHtml()}
        <div class="card"><div class="sec">Como virar chefe de uma vila</div><div class="ways">
          <div class="way"><span class="way-ic">📜</span><b>Pedir ao rei</b><small>No castelo do reino, com boa relação e ouro.</small></div>
          <div class="way"><span class="way-ic">⚔️</span><b>Conquistar</b><small>Converse com o chefe da vila e desafie-o. O rei decide se é uma afronta.</small></div>
          <div class="way"><span class="way-ic">🏗️</span><b>Fundar</b><small>A Vila ${this.esc(G.surname)}, livre de qualquer reino (título Conquistador).</small></div></div></div>
        <div class="card found"><div class="sec">🏗️ Fundar a Vila ${this.esc(G.surname)}</div>
          <p class="dt-desc">Fique no centro de um lugar aberto (longe de outras vilas e castelos) e funde uma vila com o nome da sua família, livre de qualquer reino. Colonos se mudam para lá e pagam impostos a você.</p>
          <div class="found-row"><span class="found-lab">Custo</span><div class="cost">${this.fmtCost(FOUND_COST, have)}</div></div>
          ${(() => { const conq = Court.hasCivil('conquistador'), gold = Math.min(100, P.gold / FOUND_COST.gold * 100);
            return `<div class="vg-req"><div class="vg-step ${conq ? 'ok' : ''}"><span>🚩</span><b>Título Conquistador</b><em>${conq ? '✔' : 'falta'}</em></div>
              <div class="vg-step ${P.gold >= FOUND_COST.gold ? 'ok' : ''}"><span>🪙</span><b>${P.gold} / ${FOUND_COST.gold}</b><i class="vg-bar"><i style="width:${gold}%"></i></i></div>
              <div class="vg-step ${site.ok === true ? 'ok' : ''}"><span>📍</span><b>Lugar aberto</b><em>${site.ok === true ? '✔' : conq ? 'procure' : '—'}</em></div></div>`; })()}
          <div class="found-go"><div class="found-st ${site.ok === true ? 'ok' : 'bad'}">${site.ok === true ? `Este lugar serve (território de ${CIV_DEFS[site.civ].short}).` : this.esc(site.ok)}</div>
            <button class="primary" data-act="found" ${site.ok === true && Inv.has(FOUND_COST) ? '' : 'disabled'}>🏘️ Fundar aqui</button></div></div>`;
    }
    if (nav === 'biz') {
      const biz = Biz.list();
      // telas pequenas: painel do dono e um cartão por empreendimento
      const fcs = biz.map(b => ({ b, fc: Biz.forecast(b) }));
      const staff = fcs.reduce((a, x) => a + Biz.workerCount(x.b), 0), slots = biz.reduce((a, b) => a + BIZ_TYPES[b.type].slots, 0);
      const wages = fcs.reduce((a, x) => a + x.fc.wages, 0), goldDay = fcs.reduce((a, x) => a + x.fc.gold, 0), till = biz.reduce((a, b) => a + (b.till || 0), 0);
      const made = {}; for (const x of fcs) for (const it in x.fc.out) if (x.fc.out[it] > 0) made[it] = (made[it] || 0) + x.fc.out[it];
      const madeHtml = Object.entries(made).map(([it, n]) => `<span class="bz-chip">${ITEMS[it].icon} <b>+${n}</b> ${ITEMS[it].name}</span>`).join('');
      const outOf = k => { const d = BIZ_TYPES[k]; return d.out ? Object.keys(d.out).map(it => ITEMS[it].icon).join('') : d.gold ? '🪙' : '🍺'; };
      const bcard = b => { const d = BIZ_TYPES[b.type], fc = Biz.forecast(b), n = Biz.workerCount(b);
        return `<div class="bz-card ${n ? '' : 'idle'}"><span class="bz-ic">${Game.buildIcon(b.type)}</span><div class="bz-tx"><b>${BUILDINGS[b.type].name}</b>
          <span class="bz-seats">${Array.from({ length: d.slots }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}<small>${n}/${d.slots}</small></span>
          <small>${n ? `−${fc.wages} 🪙/dia${fc.gold ? ` · +${fc.gold} 🪙` : ` · ${outOf(b.type)}`}` : 'sem funcionários'}${b.till ? ` · caixa ${b.till} 🪙` : ''}</small></div>
          <button data-act="bizopen" data-s="${b.id}">Abrir</button></div>`; };
      const mobile = `<div class="biz-m">
        <div class="card bz-dash kalone"><div class="sec">Painel do dono <span>por dia</span></div>
          <div class="bz-stats"><div><span class="bz-big">💼</span><b>${biz.length}</b><small>${biz.length === 1 ? 'empreendimento' : 'empreendimentos'}</small></div>
            <div><span class="bz-big">👷</span><b>${staff}/${slots}</b><small>funcionários</small><i class="bz-bar"><i style="width:${slots ? staff / slots * 100 : 0}%"></i></i></div>
            <div><span class="bz-big">💸</span><b class="${wages ? 'bad' : ''}">−${wages}</b><small>salários 🪙</small></div>
            <div><span class="bz-big">💰</span><b class="${goldDay ? 'ok' : ''}">+${goldDay}</b><small>lucro 🪙${till ? ` · caixa ${till}` : ''}</small></div></div>
          <div class="bz-made">${madeHtml || `<span class="muted">${biz.length ? 'Contrate moradores para começar a produzir.' : 'Nada produzindo ainda: construa um empreendimento e contrate moradores das vilas.'}</span>`}</div>
          ${P.gold < wages * 3 && wages ? '<div class="bz-warn">⚠️ Pouco ouro para os salários: sem pagamento, os funcionários se revoltam.</div>' : ''}</div>
        ${biz.length ? `<div class="card bz-list kalone"><div class="sec">Seus empreendimentos <span>${biz.length}</span></div><div class="bz-grid">${biz.map(bcard).join('')}</div></div>` : ''}</div>`;
      return this.pageHead('💼', 'Empreendimentos', 'Construa em Construir → Empreendimentos e contrate moradores das vilas') + mobile
        + `<div class="biz-d"><div class="card">${biz.map(s => { const fc = Biz.forecast(s); return `<div class="crow"><span class="ri">${Game.buildIcon(s.type)}</span><span><b>${BUILDINGS[s.type].name}</b><small>${Biz.workerCount(s)}/${BIZ_TYPES[s.type].slots} funcionários · salários ${fc.wages} 🪙/dia${s.till ? ` · caixa ${s.till} 🪙` : ''}</small></span><span class="act-row"><button data-act="bizopen" data-s="${s.id}">Abrir</button></span></div>`; }).join('')
          || '<p class="muted">Nenhum ainda. Construa uma Fazenda Comercial, Moinho, Serraria, Pedreira, Mina, Ferraria, Empório ou a sua Taverna, e contrate moradores das vilas próximas.</p>'}</div></div>`;
    }
    if (nav.startsWith('k:')) return this.kingdomPage(+nav.slice(2));
    if (nav === 'atlas') return this.atlasHtml();
    if (nav === 'families') {
      const all = Families.ranking(), total = G.people.filter(p => p.alive).length;
      // telas pequenas: 1) pódio e a sua posição · 2) ranking do 4º ao 11º · 3) casas inquietas (pouca lealdade ou em revolta)
      const civOf = fm => fm.civ >= 0 ? CIV_DEFS[fm.civ].short : 'sem reino';
      const crest = (fm, size) => `<span class="gc-crest" style="--c:${fm.color};--s:${size}px">${this.esc((fm.surname || '?')[0])}</span>`;
      const mine = all.findIndex(x => x.f.player), me = all[mine];
      const revolts = all.filter(x => Families.activeRevoltOf(x.f));
      const podium = [1, 0, 2].map(i => all[i]).map((x, k) => x ? `<button class="gc-pod p${[2, 1, 3][k]}" data-act="${x.f.player ? 'knav' : 'famview'}" data-k="family" data-f="${x.f.id}">
          <span class="gc-medal">${['🥈', '🥇', '🥉'][k]}</span>${crest(x.f, [36, 44, 34][k])}<b>${this.esc(Families.name(x.f))}</b><small>${civOf(x.f)}</small><em>⭐ ${x.inf}</em></button>` : '<span></span>').join('');
      const uneasy = all.filter(x => !x.f.player && !x.f.noble && (Families.activeRevoltOf(x.f) || x.f.loyalty < 35)).sort((a, b) => (!!Families.activeRevoltOf(b.f) - !!Families.activeRevoltOf(a.f)) || a.f.loyalty - b.f.loyalty).slice(0, 6);
      const mobile = `<div class="gc-m">
        <div class="card gc-top kalone"><div class="gc-podium">${podium}</div>
          <div class="gc-side"><div class="gc-you">${me ? crest(me.f, 30) : ''}<div><small>Sua casa</small><b>${mine >= 0 ? mine + 1 + 'º' : '—'}</b><small>de ${all.length} · ⭐ ${me ? me.inf : 0}</small></div></div>
            <div class="gc-num"><span>🏛️ <b>${all.length}</b> casas</span><span>👥 <b>${total}</b> pessoas</span><span class="${revolts.length ? 'bad' : ''}">🔥 <b>${revolts.length}</b> em revolta</span></div></div></div>
        <div class="card gc-rank kalone"><div class="sec">Ranking de influência <span>toque para ver</span></div><div class="gc-grid">
          ${all.slice(3, 11).map((x, i) => `<button class="gc-row ${x.f.player ? 'you' : ''}" data-act="${x.f.player ? 'knav' : 'famview'}" data-k="family" data-f="${x.f.id}"><span class="gc-n">${i + 4}º</span>${crest(x.f, 24)}<span class="gc-tx"><b>${this.esc(Families.name(x.f))}${x.f.noble ? ' 👑' : ''}</b><small>${civOf(x.f)}</small></span><em>⭐ ${x.inf}</em></button>`).join('')}</div></div>
        <div class="card gc-risk kalone"><div class="sec">⚠️ Casas inquietas <span>lealdade à coroa</span></div>
          ${uneasy.length ? `<div class="gc-grid">${uneasy.map(x => { const rv = Families.activeRevoltOf(x.f), l = Math.round(x.f.loyalty);
            return `<button class="gc-row ${rv ? 'revolt' : ''}" data-act="famview" data-f="${x.f.id}">${crest(x.f, 24)}<span class="gc-tx"><b>${this.esc(Families.name(x.f))}</b><small>${rv ? `🔥 em revolta · força ${rv.str}` : `${civOf(x.f)} · ${x.f.wealth} 🪙`}</small>
              <i class="gc-loy"><i style="width:${l}%;background:${l < 25 ? '#c0392b' : '#d6ae60'}"></i></i></span><em>${l}</em></button>`; }).join('')}</div>`
          : '<div class="gc-calm"><span>🕊️</span><b>Os reinos estão em paz</b><small>Nenhuma casa ameaça a coroa no momento.</small></div>'}
          <small class="muted gc-note">Casas ricas e com pouca lealdade podem declarar guerra à coroa.</small></div></div>`;
      return this.pageHead('🏛️', 'Grandes Casas', `${all.length} famílias e ${total} pessoas vivas no mundo`) + mobile
        + `<div class="gc-d"><p class="muted">A influência soma riqueza, membros, empreendimentos, títulos e vilas. Famílias com pouca lealdade e muita riqueza podem declarar guerra à coroa.</p>
        <div class="card famlist">${all.slice(0, 40).map((x, i) => this.famRow(x, i, true)).join('')}</div></div>`;
    }
    if (nav === 'tree') { S.treeFam = G.playerFam; S.treeInK = true; const f = Families.ensurePlayer();
      return this.pageHead('🌳', 'Linhagens', 'Sua árvore genealógica e as relações entre as casas') + this.lineageMobile(f) + `<div class="ln-d">${this.treeBody(f)}</div>`; }
    return '';
  },
  // um reino governado pelo jogador: uma fileira de abas e o conteúdo
  kingdomPage(ci) {
    const S = this.sel, c = G.civs[ci], d = CIV_DEFS[ci], fc = Game.civForecast(c);
    const have = k => k === 'gold' ? c.treasury : (c.stock[k] || 0);
    const net = fc.income - fc.upkeep, wheatNet = fc.wheat - fc.need;
    const subs = [['resumo', '📊 Resumo'], ['economia', '💰 Economia'], ['obras', '🏗️ Obras'], ['exercito', '🛡️ Exército e povo'], ['conselho', '🎩 Conselho'], ['diplo', '🤝 Diplomacia'], ['brasao', '⚜️ Bandeira e brasão']];
    if (!subs.some(([k]) => k === S.ksub)) S.ksub = 'resumo';
    const st = subs.map(([k, lab]) => `<button class="tab ${S.ksub === k ? 'on' : ''}" data-act="ksub" data-s="${k}">${lab}${k === 'conselho' && Court.plotsOf(ci).length ? ' <span class="badge">!</span>' : ''}</button>`).join('');
    let sec = '';
    if (S.ksub === 'resumo') {
      sec = `<div class="tiles big">
          <div class="stile"><small>População</small><b>${c.pop} / ${Game.popCap(c)}</b></div>
          <div class="stile"><small>Felicidade</small><b class="${c.happy < 30 ? 'bad' : ''}">${Math.round(c.happy)}%</b><span class="pbar"><i style="width:${c.happy}%;background:${c.happy < 30 ? '#c0392b' : '#5fd35f'}"></i></span></div>
          <div class="stile"><small>Tesouro do reino</small><b>${c.treasury} 🪙</b></div>
          <div class="stile"><small>Saldo por mês</small><b class="${net < 0 ? 'bad' : 'ok'}">${net >= 0 ? '+' : ''}${net} 🪙</b></div>
          <div class="stile"><small>Guarnição</small><b>${c.garrison} / ${Game.maxGarrison(c)}</b></div>
          <div class="stile"><small>Trigo por mês</small><b class="${wheatNet < 0 ? 'bad' : 'ok'}">${wheatNet >= 0 ? '+' : ''}${wheatNet} 🌾</b></div>
        </div>
        ${c.rebel > 0 ? `<div class="alert">⚠️ O povo está à beira da revolta (${c.rebel}/3 meses). Baixe impostos ou faça um festival (aba Exército e povo).</div>` : ''}
        ${wheatNet < 0 ? '<div class="alert">⚠️ Falta trigo: o povo vai passar fome. Invista em Fazendas Reais (aba Obras) ou deposite trigo (aba Economia).</div>' : ''}
        <div class="card"><div class="sec">Impostos</div><div class="taxbox">
          <button data-act="tax" data-c="${ci}" data-d="-0.05" ${c.tax <= 0 ? 'disabled' : ''}>−5%</button><div class="val">${Math.round(c.tax * 100)}%</div>
          <button data-act="tax" data-c="${ci}" data-d="0.05" ${c.tax >= 0.5 ? 'disabled' : ''}>+5%</button>
          <div class="muted">Arrecadação: <b>${fc.income} 🪙/dia</b> · soldos da guarnição: −${fc.upkeep} 🪙/dia.<br>Cada +5% rende ~${Math.round(c.pop * 0.1)} 🪙/dia, mas reduz a felicidade em cerca de 8 pontos.</div></div></div>`;
    } else if (S.ksub === 'economia') {
      sec = `<div class="kgrid two"><div class="card"><div class="sec">Tesouro do reino</div><div class="bignum">${c.treasury} 🪙</div>
          <div class="act-row"><button data-act="kgold" data-c="${ci}" data-n="-100" ${c.treasury >= 100 ? '' : 'disabled'}>Sacar 100</button><button data-act="kgold" data-c="${ci}" data-n="-all" ${c.treasury > 0 ? '' : 'disabled'}>Sacar tudo</button></div></div>
        <div class="card"><div class="sec">Seu ouro pessoal</div><div class="bignum">${P.gold} 🪙</div>
          <div class="act-row"><button data-act="kgold" data-c="${ci}" data-n="100" ${P.gold >= 100 ? '' : 'disabled'}>Depositar 100</button><button data-act="kgold" data-c="${ci}" data-n="all" ${P.gold > 0 ? '' : 'disabled'}>Depositar tudo</button></div></div></div>
        <div class="card"><div class="sec">Armazéns do reino</div><table class="trade"><tr><th>Recurso</th><th>Estoque</th><th>Produção/dia</th><th>Você tem</th><th></th></tr>${KINGDOM_RES.map(k => `<tr>
          <td>${ITEMS[k].icon} ${ITEMS[k].name}</td><td><b>${c.stock[k] || 0}</b></td><td class="ok">+${fc.prod[k]}</td><td>${Inv.count(k)}</td>
          <td><button data-act="kres" data-c="${ci}" data-k="${k}" data-n="-10" ${(c.stock[k] || 0) >= 10 ? '' : 'disabled'}>Retirar 10</button><button data-act="kres" data-c="${ci}" data-k="${k}" data-n="10" ${Inv.count(k) >= 10 ? '' : 'disabled'}>Depositar 10</button></td></tr>`).join('')}</table></div>`;
    } else if (S.ksub === 'diplo') {
      sec = `<p class="muted">Relações de ${d.short} com os outros reinos. Os custos saem do tesouro do reino (${c.treasury} 🪙).</p><div class="rels">` + G.civs.filter(o => o.id !== ci).map(o => {
        const r = Math.round(Diplo.rel(ci, o.id)), war = Diplo.atWar(ci, o.id), al = Diplo.allied(ci, o.id);
        return `<div class="relrow dip"><span class="cdot" style="background:${Game.civColor(o.id)}"></span>
          <span><b>${CIV_DEFS[o.id].name}</b><small>${this.esc(o.rulerName)} · guarnição ${o.garrison}</small></span>
          <span class="pbar"><i style="left:50%;width:${Math.abs(r) / 2}%;${r < 0 ? 'transform:translateX(-100%);background:#c0392b' : 'background:#5fd35f'}"></i><em></em></span>
          <span class="rlab">${r} ${war ? '<span class="badge">GUERRA</span>' : al ? '<span class="tag">ALIADO</span>' : ''}</span>
          <span class="act-row">${o.ruler === 'player' ? '<small class="muted">seu reino</small>' : `<button data-act="dipl" data-c="${ci}" data-o="${o.id}" data-x="gift" ${c.treasury >= 100 ? '' : 'disabled'} title="Presentes: +12 de relação">🎁 100</button>
            ${war ? `<button data-act="dipl" data-c="${ci}" data-o="${o.id}" data-x="peace" ${c.treasury >= 300 ? '' : 'disabled'}>🕊️ Paz 300</button>`
              : `<button data-act="dipl" data-c="${ci}" data-o="${o.id}" data-x="ally" ${!al && r >= 40 && c.treasury >= 200 ? '' : 'disabled'} title="Exige relação 40+">🤝 Aliança 200</button>
                 <button class="danger" data-act="dipl" data-c="${ci}" data-o="${o.id}" data-x="war">⚔️ Guerra</button>`}`}</span></div>`;
      }).join('') + '</div>';
    } else if (S.ksub === 'brasao') {
      const hx = Heraldry.get(ci);
      const pick = (k, v, inner, label, on) => `<button class="hpick ${on ? 'on' : ''}" data-act="hset" data-c="${ci}" data-k="${k}" data-v="${v}" title="${label}">${inner}<small>${label}</small></button>`;
      sec = `<div class="kgrid two">
        <div class="card herald-prev"><div class="sec">Prévia</div>
          <div class="hp-row">${Heraldry.flagSvg(ci, 150, 100)}${Heraldry.armsSvg(ci, 92)}</div>
          <div class="hp-name">${this.esc(d.name)}</div>
          <div class="act-row"><button data-act="hreset" data-c="${ci}">↺ Voltar ao original</button></div>
          <small class="muted">A bandeira tremula nas torres do castelo e o brasão fica sobre o portão.</small></div>
        <div class="card"><div class="sec">Nome do reino</div>
          <div class="cr-names"><label>Nome completo<input id="hName" maxlength="32" value="${this.esc(d.name)}"></label><label>Nome curto<input id="hShort" maxlength="14" value="${this.esc(d.short)}"></label></div>
          <div class="act-row" style="margin-top:6px"><button class="primary" data-act="hname" data-c="${ci}">✍️ Renomear o reino</button></div>
          <div class="sec" style="margin-top:12px">Cor do reino</div>
          <div class="hswatch">${TINCTURES.map(([c, n]) => `<button class="sw ${hx.color === c ? 'on' : ''}" data-act="hset" data-c="${ci}" data-k="color" data-v="${c}" title="${n}" style="background:${c}"></button>`).join('')}</div>
          <div class="sec" style="margin-top:12px">Metal (segunda cor)</div>
          <div class="hswatch">${METALS.map(([c, n]) => `<button class="sw ${hx.metal === c ? 'on' : ''}" data-act="hset" data-c="${ci}" data-k="metal" data-v="${c}" title="${n}" style="background:${c}"></button>`).join('')}</div>
          <small class="muted">A cor aparece nas fronteiras, no mapa, nos guardas e nos telhados.</small></div></div>
        <div class="card"><div class="sec">Bandeira</div><div class="hgrid">${FLAG_PATTERNS.map(([k, n]) => pick('flag', k, Heraldry.flagSvg(ci, 54, 36, { flag: k }), n, hx.flag === k)).join('')}</div></div>
        <div class="card"><div class="sec">Brasão: divisão do escudo</div><div class="hgrid">${ARMS_DIVISIONS.map(([k, n]) => pick('division', k, Heraldry.armsSvg(ci, 34, { division: k }), n, hx.division === k)).join('')}</div>
          <div class="sec" style="margin-top:12px">Brasão: símbolo</div><div class="hgrid">${CHARGES.map(ch => pick('charge', ch, Heraldry.armsSvg(ci, 34, { charge: ch }), '', hx.charge === ch)).join('')}</div></div>`;
    } else if (S.ksub === 'conselho') {
      sec = this.councilHtml(ci);
    } else if (S.ksub === 'obras') {
      sec = `<p class="muted">As obras são pagas com o tesouro e os armazéns do reino, não com o seu bolso. Para mexer em casas, lojas, estradas e até mudar o castelo de lugar, use Construir → Reformas e Obras.</p><div class="kgrid">${Object.entries(INVESTMENTS).map(([k, inv]) => {
        const can = Object.entries(inv.cost).every(([r, n]) => have(r) >= n);
        return `<div class="card inv-card"><div class="dt-head"><div class="dt-ic sm">${inv.icon}</div><div><b>${inv.name}</b><div class="dt-cat">Nível ${c.invest[k]}</div></div></div>
          <p class="dt-desc">${inv.desc}</p><div class="cost">${this.fmtCost(inv.cost, have)}</div>
          <button class="primary" data-act="invest" data-c="${ci}" data-k="${k}" ${can ? '' : 'disabled'}>Investir</button></div>`;
      }).join('')}</div>`;
    } else {
      const capOk = Game.allies().length < Game.followerCap(), post = { kind: 'castle', civ: ci };
      sec = `<div class="kgrid">
        <div class="card inv-card"><div class="dt-head"><div class="dt-ic sm">🛡️</div><div><b>Recrutar guarnição</b><div class="dt-cat">${c.garrison} / ${Game.maxGarrison(c)} soldados</div></div></div>
          <p class="dt-desc">Soldados defendem o castelo e as vilas.</p><div class="cost">${this.fmtCost({ gold: 40, wheat: 5 }, have)}</div>
          <button class="primary" data-act="krecruit" data-c="${ci}" ${have('gold') >= 40 && have('wheat') >= 5 && c.garrison < Game.maxGarrison(c) ? '' : 'disabled'}>Recrutar +1</button></div>
        <div class="card inv-card"><div class="dt-head"><div class="dt-ic sm">⚔️</div><div><b>Convocar escolta</b><div class="dt-cat">Seguidores ${Game.allies().length} / ${Game.followerCap()}</div></div></div>
          <p class="dt-desc">Um soldado da guarnição passa a seguir você como capanga.</p>
          <button class="primary" data-act="kescort" data-c="${ci}" ${c.garrison > 1 && capOk ? '' : 'disabled'}>Convocar</button></div>
        <div class="card inv-card"><div class="dt-head"><div class="dt-ic sm">🎉</div><div><b>Festival</b><div class="dt-cat">Felicidade atual ${Math.round(c.happy)}%</div></div></div>
          <p class="dt-desc">Uma grande festa: +10 de felicidade agora e mais no próximo mês.</p><div class="cost">${this.fmtCost({ gold: 100, wheat: 40 }, have)}</div>
          <button class="primary" data-act="kfest" data-c="${ci}" ${have('gold') >= 100 && have('wheat') >= 40 ? '' : 'disabled'}>Realizar festival</button></div>
        <div class="card inv-card"><div class="dt-head"><div class="dt-ic sm">🏰</div><div><b>Guardas no castelo</b><div class="dt-cat">${Guards.at(post).length} / ${Guards.cap(post)} capangas</div></div></div>
          <p class="dt-desc">Converse com um capanga e escolha "Mandar fazer guarda" para deixá-lo defendendo o castelo.</p></div></div>`;
    }
    return this.pageHead(Heraldry.armsSvg(ci, 30), d.name, `Governado por ${this.esc(G.name)} · ${this.esc(d.desc)}`)
      + `<div class="tabs subtabs">${st}</div><div class="kbody">${sec}</div>`;
  },
  personLine(p, extra) {
    if (!p) return '<span class="muted">—</span>';
    if (p === 'player') return `<b>${this.esc(G.name + ' ' + G.surname)}</b> <small class="muted">(você)</small>`;
    return `<b>${this.esc(People.full(p))}</b> <small class="muted">${People.title(p)}, ${p.age} anos${extra ? ' · ' + extra : ''}</small>`;
  },
  famRow(x, i, showCiv) {
    const f = x.f, mem = Families.members(f), rv = Families.activeRevoltOf(f);
    const status = f.player ? '<span class="tag">SUA CASA</span>' : f.noble ? '<span class="tag gold">REAL</span>' : rv ? '<span class="badge">EM REVOLTA</span>' : '';
    return `<div class="famrow ${showCiv ? '' : 'compact'}"><span class="fr-n">${i + 1}º</span><span class="fr-dot" style="background:${f.color}"></span>
      <span><b>${this.esc(Families.name(f))}</b> ${status}<small>${showCiv && f.civ >= 0 ? CIV_DEFS[f.civ].short + ' · ' : ''}${this.esc(Families.seatName(f))} · ${mem.length} membros${f.player ? '' : ` · ${f.wealth} 🪙`} · ${f.player ? Biz.list().length : f.biz.length} empreend.${f.founded !== null && World.villages[f.founded] ? ' · fundou ' + this.esc(World.villages[f.founded].name) : ''}</small></span>
      <span class="fr-inf" title="Influência">⭐ ${x.inf}</span>
      ${f.player || f.noble ? '<span></span>' : `<span class="pbar" title="Lealdade à coroa: ${Math.round(f.loyalty)}"><i style="width:${f.loyalty}%;background:${f.loyalty < 25 ? '#c0392b' : f.loyalty < 50 ? '#d6ae60' : '#5fd35f'}"></i></span>`}
      ${f.player ? '<span></span>' : `<button data-act="famview" data-f="${f.id}">Ver</button>`}</div>`;
  },
  // os sete reinos: cortes, vilas, famílias e números de cada um
  atlasHtml() {
    const S = this.sel;
    const ci = S.atlas !== undefined ? S.atlas : (G.zone >= 0 ? G.zone : 0);
    const c = G.civs[ci], d = CIV_DEFS[ci];
    const tabs = G.civs.map(o => `<button class="tab ${o.id === ci ? 'on' : ''}" data-act="atlasciv" data-c="${o.id}"><span class="cdot" style="background:${Game.civColor(o.id)}"></span>${CIV_DEFS[o.id].short}</button>`).join('');
    const ppl = Families.civPeople(ci), fams = Families.ranking(ci).filter(x => !x.f.player);
    const court = G.people.filter(p => p.alive && p.home.type === 'castle' && p.home.civ === ci && NOBLE_RANKS.includes(p.rank)).sort((a, b) => RANKS[a.rank].order - RANKS[b.rank].order || b.age - a.age);
    const vills = World.villages.map((v, i) => ({ v, i })).filter(x => x.v.civ === ci && !x.v.free);
    const rv = (G.revolts || []).filter(r => !r.done && r.civ === ci);
    // telas pequenas: 1) escudos dos reinos, estandarte e números · 2) corte e famílias · 3) vilas e seus chefes
    const col = Game.civColor(ci), births = (G.births || {})[ci] || 0, last = (G.lastBirths || {})[ci] || 0;
    const stat = (ic, label, val, cls) => `<div class="at-st"><span>${ic}</span><b class="${cls || ''}">${val}</b><small>${label}</small></div>`;
    const lordOf = v => v.lord === 'player' ? '<b class="ok">você</b>' : v.lordFam !== undefined && Families.get(v.lordFam) ? 'Casa ' + this.esc(Families.get(v.lordFam).surname) : 'a coroa';
    const mobile = `<div class="atl-m">
      <div class="card at-main kalone" style="--kc:${col}">
        <div class="at-pick">${G.civs.map(o => `<button class="${o.id === ci ? 'on' : ''}" data-act="atlasciv" data-c="${o.id}" style="--oc:${Game.civColor(o.id)}">${Heraldry.armsSvg(o.id, 22)}<small>${CIV_DEFS[o.id].short}</small></button>`).join('')}</div>
        <div class="at-banner">${Heraldry.armsSvg(ci, 36)}<div class="at-bt"><b>${d.name}</b><small>${this.esc(c.rulerName)} · ${Game.relationText(c)}</small><small class="at-desc">${this.esc(d.desc)}</small></div>${Heraldry.flagSvg(ci, 42, 28)}</div>
        ${rv.length ? `<div class="at-revolt">🔥 ${rv.map(r => `${this.esc(Families.name(Families.get(r.fam)))} em revolta (força ${r.str})`).join(' · ')}</div>` : ''}
        <div class="at-stats">${stat('👥', 'pessoas', ppl.length)}${stat('🧒', 'crianças', ppl.filter(p => p.age < 14).length)}${stat('🏛️', 'famílias', fams.length)}${stat('🏘️', 'vilas', vills.length)}
          ${stat('👶', `nasceram · antes ${last}`, births)}${stat('🛡️', 'guarnição', c.garrison)}${stat(c.happy < 30 ? '😠' : c.happy < 60 ? '😐' : '😊', 'felicidade', Math.round(c.happy) + '%', c.happy < 30 ? 'bad' : '')}${stat('💰', 'tesouro', c.treasury)}</div></div>
      <div class="card at-people kalone" style="--kc:${col}"><div class="at-cols">
        <div><div class="sec">👑 Corte real</div><div class="at-list">
          ${c.ruler === 'player' ? `<div class="at-row"><span class="at-ic">👑</span><span><b>${this.esc(G.name + ' ' + G.surname)}</b><small>você · soberano</small></span></div>` : ''}
          ${court.slice(0, 4).map(p => `<div class="at-row"><span class="at-ic">${p.rank === 'ruler' ? '👑' : p.rank === 'consort' ? '💍' : '⚜️'}</span><span><b>${this.esc(People.full(p))}</b><small>${People.title(p)} · ${p.age} anos</small></span></div>`).join('') || (c.ruler === 'player' ? '' : '<p class="muted">Sem corte.</p>')}</div></div>
        <div><div class="sec">🏛️ Famílias mais influentes</div><div class="at-list">
          ${fams.slice(0, 4).map((x, i) => `<div class="at-row"><span class="at-rank">${i + 1}º</span><span><b><i class="at-dot" style="background:${x.f.color}"></i>${this.esc(Families.name(x.f))}${x.f.noble ? ' 👑' : Families.activeRevoltOf(x.f) ? ' 🔥' : ''}</b><small>⭐ ${x.inf} · ${Families.members(x.f).length} membros</small></span><button data-act="famview" data-f="${x.f.id}">Ver</button></div>`).join('') || '<p class="muted">Nenhuma.</p>'}</div></div></div></div>
      <div class="card at-vills kalone" style="--kc:${col}"><div class="sec">🏘️ Vilas e seus chefes <span>${vills.length}</span></div><div class="at-vgrid">
        ${vills.map(({ v, i }) => { const ch = Families.chiefOf(v), res = People.residents(i).length, cap = Families.vcap(v);
          return `<div class="at-v ${v.ruin ? 'ruin' : ''}"><span class="at-lv">${v.level || 1}</span><div><b>${this.esc(v.name)}${v.founded ? ' <small class="tag">nova</small>' : ''}${v.ruin ? ' <small class="bad">ruínas</small>' : ''}</b>
            <i class="at-bar"><i style="width:${Math.min(100, res / Math.max(1, cap) * 100)}%"></i></i><small>👥 ${res}/${cap} · chefe ${ch === 'player' ? '<b class="ok">você</b>' : ch ? this.esc(People.full(ch)) : '—'} · senhor ${lordOf(v)}</small></div></div>`; }).join('') || '<p class="muted">Nenhuma vila.</p>'}</div></div></div>`;
    return this.pageHead('🗺️', 'Reino', 'Cortes, vilas, famílias e números de cada reino') + mobile + `<div class="atl-d"><div class="tabs ktabs">${tabs}</div>
      <div class="atlas-head herald" style="border-color:${Game.civColor(ci)}">${Heraldry.armsSvg(ci, 34)}${Heraldry.flagSvg(ci, 42, 28)}<div><b style="color:${Game.civColor(ci)}">${d.name}</b><small>${this.esc(d.desc)} · ${this.esc(c.rulerName)} · ${Game.relationText(c)}</small></div></div>
      ${rv.map(r => `<div class="alert">🔥 A ${this.esc(Families.name(Families.get(r.fam)))} está em revolta contra a coroa (dia ${r.days + 1}, força ${r.str}). <button data-act="famview" data-f="${r.fam}">Ver</button></div>`).join('')}
      <div class="tiles big">
        <div class="stile"><small>Pessoas</small><b>${ppl.length}</b></div>
        <div class="stile"><small>Crianças</small><b>${ppl.filter(p => p.age < 14).length}</b></div>
        <div class="stile"><small>Famílias</small><b>${fams.length}</b></div>
        <div class="stile"><small>Vilas</small><b>${vills.length}</b></div>
        <div class="stile"><small>Nascimentos no ano</small><b>${(G.births || {})[ci] || 0}</b><small>ano passado: ${(G.lastBirths || {})[ci] || 0}</small></div>
        <div class="stile"><small>Guarnição</small><b>${c.garrison}</b></div>
        <div class="stile"><small>Felicidade</small><b>${Math.round(c.happy)}%</b></div>
        <div class="stile"><small>Tesouro</small><b>${c.treasury} 🪙</b></div>
      </div>
      <div class="kgrid two">
        <div class="card"><div class="sec">👑 Corte real</div>
          ${c.ruler === 'player' ? `<div class="crow2">${this.personLine('player')} <span class="tag gold">SOBERANO</span></div>` : ''}
          ${court.map(p => `<div class="crow2">${this.personLine(p, Families.of(p) ? 'Casa ' + Families.of(p).surname : '')}</div>`).join('') || (c.ruler === 'player' ? '' : '<p class="muted">Sem corte.</p>')}</div>
        <div class="card"><div class="sec">🏛️ Famílias mais influentes</div>${fams.slice(0, 6).map((x, i) => this.famRow(x, i, false)).join('') || '<p class="muted">Nenhuma.</p>'}</div>
      </div>
      <div class="card"><div class="sec">🏘️ Vilas e seus chefes</div>
        <table class="trade vtable"><tr><th>Vila</th><th>Nível</th><th>Moradores</th><th>Chefe</th><th>Senhor</th></tr>${vills.map(({ v, i }) => {
          const ch = Families.chiefOf(v), res = People.residents(i).length;
          const lord = v.lord === 'player' ? '<b class="ok">Você</b>' : v.lordFam !== undefined && Families.get(v.lordFam) ? 'Casa ' + this.esc(Families.get(v.lordFam).surname) : '<span class="muted">a coroa</span>';
          return `<tr><td><b>${this.esc(v.name)}</b>${v.founded ? ' <small class="tag">nova</small>' : ''}${v.ruin ? ' <small class="bad">ruínas</small>' : ''}</td><td>${v.level || 1}</td><td>${res} / ${Families.vcap(v)}</td>
            <td>${ch === 'player' ? 'Você' : ch ? `${this.esc(People.full(ch))}<small class="muted"> · ${ch.age} anos</small>` : '<span class="muted">—</span>'}</td><td>${lord}</td></tr>`;
        }).join('')}</table></div></div>`;
  },

  // ------------------------------------------------------------ uma família
  showFamily(fid) {
    const f = Families.get(fid);
    if (!f) return;
    if (f.player) { this.sel.knav = 'family'; this.showKingdom(); return; }
    const mem = Families.members(f).sort((a, b) => b.age - a.age), h = Families.head(f), rv = Families.activeRevoltOf(f);
    const ruler = G.civs[f.civ] && G.civs[f.civ].ruler === 'player';
    const bizs = World.structs.filter(s => s.fam === f.id && FAMILY_BIZ[s.type]);
    const body = `<div class="card hero-card" style="border-color:${f.color}"><div class="hc-ic" style="color:${f.color}">🏛️</div><div><b>${this.esc(Families.name(f))}</b>${f.noble ? ' <span class="tag gold">CASA REAL</span>' : ''}<br>
        <span class="muted">${f.civ >= 0 ? CIV_DEFS[f.civ].name : 'Sem reino'} · sede: ${this.esc(Families.seatName(f))} · desde ${Calendar.short(f.since)}</span></div></div>
      ${rv ? `<div class="alert">🔥 Em guerra contra a coroa de ${CIV_DEFS[rv.civ].short}! Dia ${rv.days + 1} da revolta · força rebelde ${rv.str} · guarnição real ${G.civs[rv.civ].garrison}.
        ${rv.side ? `<b>Você apoia ${rv.side === 'rebel' ? 'os rebeldes' : 'a coroa'}.</b>` : ruler ? '<b>É o seu reino: vá até a vila e derrote os rebeldes!</b>' : `<div class="act-row"><button class="danger" data-act="revside" data-r="${rv.id}" data-side="rebel">🔥 Apoiar a revolta</button><button class="primary" data-act="revside" data-r="${rv.id}" data-side="crown">🛡️ Defender a coroa</button></div>`}</div>` : ''}
      <div class="tiles big">
        <div class="stile"><small>Influência</small><b>⭐ ${Families.influence(f)}</b></div>
        <div class="stile"><small>Riqueza</small><b>${f.wealth} 🪙</b></div>
        <div class="stile"><small>Membros</small><b>${mem.length}</b></div>
        <div class="stile"><small>Empreendimentos</small><b>${bizs.length}</b></div>
        <div class="stile"><small>Lealdade à coroa</small><b class="${f.loyalty < 25 ? 'bad' : ''}">${f.noble ? '—' : Math.round(f.loyalty)}</b></div>
        <div class="stile"><small>Vila fundada</small><b>${f.founded !== null && World.villages[f.founded] ? this.esc(World.villages[f.founded].name) : '—'}</b></div>
      </div>
      <div class="kgrid two">
        <div class="card"><div class="sec">👪 Membros <span>chefe: ${h ? this.esc(h.name) : '—'}</span></div><div class="scroll" style="max-height:260px">
          ${mem.map(p => `<div class="crow2">${this.personLine(p, p.maiden && p.maiden !== p.surname ? 'nascid' + (p.sex === 'f' ? 'a ' : 'o ') + p.maiden : '')}${p === h ? ' <span class="tag">chefe</span>' : ''}${Families.isChief(p) ? ' <span class="tag gold">chefe da vila</span>' : ''}</div>`).join('')}</div></div>
        <div class="card"><div class="sec">🏗️ Empreendimentos</div>
          ${bizs.map(s => `<div class="crow2">${FAMILY_BIZ[s.type].icon} <b>${FAMILY_BIZ[s.type].name}</b> <small class="muted">rende ${FAMILY_BIZ[s.type].income} 🪙/dia</small></div>`).join('') || '<p class="muted">Ainda nenhum. Famílias ricas abrem moinhos, empórios, oficinas, quintas e vinhedos.</p>'}
          <div class="act-row" style="margin-top:8px"><button data-act="tree" data-f="${f.id}">🌳 Árvore e relações</button>${typeof f.seat === 'number' ? `<button data-act="fping" data-f="${f.id}">📍 Marcar a sede no mapa</button>` : ''}
            ${Court.canDeal(f) ? (Court.isEnemy(f) ? `<button class="primary" data-act="fpeace" data-f="${f.id}">🕊️ Pedir paz</button>`
              : `${Court.isAlly(f) ? `<button data-act="funally" data-f="${f.id}">💔 Desfazer a aliança</button>` : `<button class="primary" data-act="fally" data-f="${f.id}" ${P.gold >= Court.ALLY_COST ? '' : 'disabled'}>🤝 Propor aliança — ${Court.ALLY_COST} 🪙</button>`}<button class="danger" data-act="fenemy" data-f="${f.id}">⚔️ Declarar inimiga</button>`) : ''}
            ${ruler && !f.noble ? `<button class="primary" data-act="famfavor" data-f="${f.id}" ${P.gold >= 200 ? '' : 'disabled'} title="Aumenta a lealdade e evita revoltas">🎁 Conceder favores — 200 🪙</button>` : ''}</div></div>
      </div>`;
    this.open('Família', body, 'showFamily', [fid], `${f.civ >= 0 ? CIV_DEFS[f.civ].short : ''} · ${mem.length} membros`);
  },

  // ------------------------------------------------------------ capangas de guarda
  showGuard(id) {
    const p = People.get(id);
    const rows = Guards.places().map(post => {
      const n = Guards.at(post).length, cap = Guards.cap(post), here = Guards.same(p.post, post);
      return `<button class="rrow" data-act="tk" data-op="guard" data-k="${Guards.key(post)}" data-id="${id}" ${n >= cap || here ? 'disabled' : ''}><span class="ri">${post.kind === 'village' ? '🏘️' : '🏰'}</span>
        <span><b>${this.esc(Guards.name(post))}</b><small>${post.kind === 'village' ? 'sua vila (chefe)' : 'seu castelo (rei)'} · guardas ${n}/${cap}</small></span><span class="rs ${n >= cap ? 'mat' : 'ok'}">${here ? 'Aqui' : n >= cap ? 'Lotado' : 'Mandar'}</span></button>`;
    }).join('') || '<p class="muted">Você não é chefe de nenhuma vila nem rei.</p>';
    this.open('🛡️ Guarda de ' + this.esc(p.name), `<p>Onde ${this.esc(p.name)} vai montar guarda? ${p.sex === 'f' ? 'Ela' : 'Ele'} patrulha o lugar, enfrenta bandidos, rebeldes e soldados inimigos e ajuda a defender quando um exército ataca. Guardas não contam no limite de seguidores, mas continuam recebendo soldo (4 🪙 por dia).</p>
      <div class="list">${rows}</div><div class="btns"><button data-act="tk" data-op="open" data-id="${id}">← Voltar à conversa</button></div>`, 'showGuard', [id]);
  },
  guardsHtml() {
    const list = Guards.all(), places = Guards.places();
    if (!list.length && !places.length) return '';
    const rows = list.map(p => { const st = People.capangaStats(p); return `<div class="crow"><span class="ri">🛡️</span><span><b>${this.esc(People.full(p))}</b><small>guarda em ${this.esc(Guards.name(p.post))} · ⭐ nível ${st.lvl} · ⚔️ ${st.dmg} · 🛡️ ${st.def}</small></span>
      <span class="act-row"><button data-act="tk" data-op="unguard" data-id="${p.id}">👣 Chamar de volta</button></span></div>`; }).join('');
    const sum = places.map(post => `${this.esc(Guards.name(post))}: ${Guards.at(post).length}/${Guards.cap(post)}`).join(' · ');
    return `<div class="card" style="margin-top:10px"><div class="sec">🛡️ Guardas <span>${sum || 'sem vila nem castelo'}</span></div>${rows || '<p class="muted">Nenhum capanga de guarda. Converse com um capanga e escolha “Mandar fazer guarda”.</p>'}</div>`;
  },

  // ------------------------------------------------------------ empreendimento do jogador
  showHire(id) {
    const p = People.get(id);
    const rows = Biz.list().map(s => {
      const full = Biz.workerCount(s) >= BIZ_TYPES[s.type].slots, sk = Biz.skilled(p, s);
      return `<button class="rrow" data-act="tk" data-op="hire" data-s="${s.id}" data-id="${id}" ${full || P.gold < 15 ? 'disabled' : ''}><span class="ri">${Game.buildIcon(s.type)}</span>
        <span><b>${BUILDINGS[s.type].name}</b><small>${Biz.workerCount(s)}/${BIZ_TYPES[s.type].slots} funcionários · salário ${Biz.wage(p, s)} 🪙/dia${sk ? ' · ⭐ especialista (+50%)' : ''}</small></span><span class="rs ${full ? 'mat' : 'ok'}">${full ? 'Lotado' : 'Contratar'}</span></button>`;
    }).join('');
    this.open('💼 Contratar ' + this.esc(p.name), `<p>Em qual empreendimento ${this.esc(p.name)} vai trabalhar? O contrato custa 15 🪙 de adiantamento, e o salário é pago todo amanhecer.</p>
      <div class="list">${rows}</div><div class="btns"><button data-act="tk" data-op="open" data-id="${id}">← Voltar à conversa</button></div>`, 'showHire', [id]);
  },
  showBiz(sid) {
    const s = World.structs[sid], d = BIZ_TYPES[s.type], fc = Biz.forecast(s), ws = Biz.workers(s);
    const near = U.dist(P.x / TILE, P.y / TILE, s.x + s.w / 2, s.y + s.h / 2) < 6;
    const goods = Object.keys(s.goods || {}).filter(k => s.goods[k] > 0);
    const cands = Biz.candidates(s);
    const outTxt = Object.entries(fc.out).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMS[k].icon} ${n} ${ITEMS[k].name}`).join(', ') + (fc.gold ? ` 🪙 ${fc.gold}` : '');
    const body = `<div class="kgrid two">
      <div class="card"><div class="sec">👷 Funcionários <span>${ws.length}/${d.slots}</span></div>
        ${ws.map(p => `<div class="crow"><span class="ri">${p.sex === 'm' ? '👨' : '👩'}</span><span><b>${this.esc(People.full(p))}</b><small>${People.title(p)} · ${Biz.wage(p, s)} 🪙/dia${Biz.skilled(p, s) ? ' · ⭐ especialista' : ''} · humor ${Math.round(p.aff)}</small></span>
          <span class="act-row"><button data-act="bizfire2" data-s="${sid}" data-id="${p.id}">Demitir</button></span></div>`).join('') || '<p class="muted">Ninguém trabalhando ainda.</p>'}
        <div class="sec" style="margin-top:10px">Candidatos <span>vilas próximas · contrato 15 🪙</span></div>
        ${cands.map(({ p, d: dd }) => `<div class="crow"><span class="ri">${p.sex === 'm' ? '👨' : '👩'}</span><span><b>${this.esc(People.full(p))}</b><small>${People.title(p)}, ${p.age} anos · ${this.esc(People.homeName(p))} · ${Math.round(dd)} passos${Biz.skilled(p, s) ? ' · ⭐ especialista' : ''}</small></span>
          <span class="act-row"><button class="primary" data-act="bizhire" data-s="${sid}" data-id="${p.id}" ${ws.length < d.slots && P.gold >= 15 ? '' : 'disabled'}>Contratar</button></span></div>`).join('') || '<p class="muted">Ninguém disponível por perto. Converse com moradores e use “Contratar para trabalhar”.</p>'}</div>
      <div class="card"><div class="sec">📦 Produção</div>
        <div class="kv"><div>Produz por mês<b>${outTxt || '—'}</b></div><div>Salários por mês<b>${fc.wages} 🪙</b></div>${d.season ? `<div>Estação<b>${Season.winter() ? '❄️ metade no inverno' : 'normal'}</b></div>` : ''}${s.type === 'ptavern' ? `<div>Vendas extras/dia<b>+${ws.length * d.sales}</b></div>` : ''}</div>
        <div class="sec" style="margin-top:10px">Guardado</div>
        <div class="chips">${goods.map(k => `<span class="chip">${ITEMS[k].icon} ${s.goods[k]} ${ITEMS[k].name}</span>`).join('')}${s.till ? `<span class="chip">🪙 ${s.till}</span>` : ''}${!goods.length && !s.till ? '<span class="muted">Nada ainda.</span>' : ''}</div>
        <label class="chk"><input type="checkbox" data-act="bizauto" data-s="${sid}" ${s.autosell ? 'checked' : ''}> Vender a produção automaticamente (60% do preço, o dinheiro vai direto para você)</label>
        <div class="act-row"><button class="primary" data-act="bizcollect" data-s="${sid}" ${near && (goods.length || s.till) ? '' : 'disabled'}>🧺 Recolher tudo</button>${near ? '' : '<small class="muted">Vá até o empreendimento para recolher.</small>'}</div></div></div>`;
    this.open('💼 ' + BUILDINGS[s.type].name, body, 'showBiz', [sid], 'Seu empreendimento');
  },


  // ============================================================ Ajustes: Jogo · Tela · Som · Controles · Como jogar
  showSettings(tab) {
    const S = this.sel;
    if (tab) S.stab = tab;
    else if (!(this.cur && this.cur.fn === 'showSettings')) S.stab = 'jogo'; // Esc e o botão Ajustes abrem na aba Jogo
    S.stab = S.stab || 'jogo';
    this.showSettingsM();
  },
  // menu de ícones à esquerda e cada assunto em quadros; escolhas viram botões (o paginador arruma: páginas no celular, uma página no computador)
  showSettingsM() {
    const S = this.sel, s = G.settings, tab = S.stab, small = document.body.classList.contains('small');
    const sw = (key, ic, label, sub) => `<div class="st-row"><span class="st-ic">${ic}</span><div class="st-tx"><b>${label}</b><small>${sub}</small></div>
      <label class="switch"><input type="checkbox" data-set="${key}" ${s[key] ? 'checked' : ''}><span></span></label></div>`;
    const chips = (key, opts, cur) => `<div class="st-chips">${opts.map(([v, t, sub]) => `<button class="st-chip ${String(cur) === String(v) ? 'on' : ''}" data-act="setopt" data-k="${key}" data-v="${v}"><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div>`;
    const range = (key, ic, label, sub) => `<div class="st-vol"><span class="st-ic big">${ic}</span><div class="st-tx"><b>${label}</b><small>${sub}</small>
      <div class="range-box"><input type="range" min="0" max="1" step="0.05" data-set="${key}" value="${+s[key]}"><span class="rv">${Math.round(+s[key] * 100)}%</span></div></div></div>`;
    let page = '';
    if (tab === 'jogo') {
      const inf = Saves.info(G.slot), blocked = G.dungeon ? 'Dentro de cavernas não dá para salvar.' : G.siege ? 'Durante um cerco não dá para salvar.' : '';
      const when = inf && inf.savedAt ? new Date(inf.savedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'nunca';
      const big = (cls, act, ic, label, sub, dis) => `<button class="st-big ${cls}" data-act="${act}" ${dis ? 'disabled' : ''}><span class="st-bic">${ic}</span><b>${label}</b><small>${sub}</small></button>`;
      page = this.pageHead('▶', 'Jogo', `${this.esc(G.name)} ${this.esc(G.surname || '')} · ${Calendar.full(G.day)} · espaço ${G.slot}`)
        + `<div class="card st-play kalone"><div class="st-bigs">
          ${big('go', 'close', '▶', 'Continuar jogando', 'Voltar para a aventura')}
          ${big('', 'savenow', '💾', 'Salvar agora', blocked || `Espaço ${G.slot} · último: ${when}`, blocked)}
          ${big('', 'export', '⬇️', 'Exportar arquivo', 'Um .json para importar no menu', G.dungeon)}
          ${big('quit', 'quit', icon('run'), 'Sair para o menu', 'O que não foi salvo se perde')}</div></div>`;
    } else if (tab === 'tela') {
      page = this.pageHead('🖥️', 'Tela e interface', 'Minimapa e o que aparece na tela')
        + `<div class="card st-screen kalone"><div class="st-cols">${small ? '' : `<div class="st-col"><div class="sec">🔍 Escala</div><small class="st-hint">A automática se ajusta ao tamanho da tela</small>${chips('uiScale', [['auto', 'Auto'], [0.7, '70%'], [0.85, '85%'], [1, '100%'], [1.15, '115%'], [1.3, '130%']], s.uiScale)}</div>`}<div class="st-col"><div class="sec">🗺️ Minimapa</div>${sw('minimap', '👁️', 'Mostrar', 'toque nele para abrir o mapa')}${chips('miniSize', [[140, 'P', 'pequeno'], [180, 'M', 'médio'], [230, 'G', 'grande']], s.miniSize)}</div><div class="st-col"><div class="sec">📋 Informações</div>${sw('numbers', '🔢', 'Números nas barras', 'vida, energia e fome')}${sw('keysbar', '⌨️', 'Barra de atalhos', 'teclas no rodapé')}</div><div class="st-col st-pcol"><div class="sec">👀 Prévia</div><div class="sp-screen"><div class="sp-hud">${[['hp', 100], ['en', 80], ['fo', 60]].map(([k, v]) => `<div class="sp-bar ${k}"><i style="width:${v}%"></i>${s.numbers ? `<em>${v}</em>` : ''}</div>`).join('')}</div>${s.minimap ? `<div class="sp-mini" style="--m:${s.miniSize / 230}"></div>` : ''}<div class="sp-hero"></div>${s.keysbar ? '<div class="sp-keys"><i></i><i></i><i></i><i></i><i></i></div>' : ''}</div></div></div></div>`;
    } else if (tab === 'som') {
      page = this.pageHead('🔊', 'Som', 'Música e efeitos, todos criados pelo próprio jogo')
        + `<div class="card st-sound kalone">${range('music', '🎵', 'Música', 'Muda de dia, à noite, nas cavernas e em batalha')}${range('sfx', '🔔', 'Efeitos', 'Passos, golpes, machado, fogueira, chuva...')}
          ${sw('mute', '🔇', 'Silenciar tudo', 'Desliga todo o áudio do jogo')}</div>`;
    } else if (tab === 'controles') {
      const h = this.helpParts();
      page = this.pageHead('🎮', 'Controles', small ? 'Controles de toque' : 'Teclado e mouse')
        + (small ? '' : `<div class="card st-keys"><div class="sec">⌨️ Teclado e mouse</div><div class="hk-grid">${h.rows.map(([k, v]) => `<div class="hk"><kbd>${k}</kbd><span>${v}</span></div>`).join('')}</div></div>`)
        + (small ? `<div class="card st-touch kalone"><div class="sec">👆 Controles de toque <span>ligam sozinhos no celular</span></div><div class="st-tgrid">${[['🕹️', 'Joystick', 'à esquerda: arraste para andar'], ['⚔️', 'Atacar', 'golpeia e coleta recursos'], ['✋', 'Interagir', 'conversar, abrir e usar'], ['🛡️', 'Bloquear e esquivar', 'botões ao lado do ataque'], ['🗺️', 'Minimapa', 'toque para abrir o mapa'], ['☰', 'Barra de baixo', 'mochila, criar, construir e mais']].map(([i, t, d]) => `<div class="st-tip"><span class="st-ic">${i}</span><div class="st-tx"><b>${t}</b><small>${d}</small></div></div>`).join('')}</div></div>` : '');
    } else {
      const h = this.helpParts();
      page = this.pageHead('❓', 'Como jogar', 'Primeiros passos e dicas')
        + `<div class="card st-steps"><div class="sec">🧭 Primeiros passos</div><div class="st-list">${h.steps.map((x, i) => `<div class="st-step"><span class="st-n">${i + 1}</span><span>${x}</span></div>`).join('')}${small ? '' : h.paras.map(x => `<div class="st-step tip"><span class="st-n">💡</span><span>${x}</span></div>`).join('')}</div></div>
        ${small && h.paras.length ? `<div class="card st-tipsc"><div class="sec">💡 Dicas</div><div class="st-list">${h.paras.map(x => `<div class="st-step tip"><span class="st-n">💡</span><span>${x}</span></div>`).join('')}</div></div>` : ''}`;
    }
    const groups = [[null, [['jogo', '▶', 'Jogo'], ['tela', '🖥️', 'Tela e interface'], ['som', '🔊', 'Som'], ['controles', '🎮', 'Controles'], ['ajuda', '❓', 'Como jogar']]]];
    this.open('Ajustes', `<div class="iconnav st">${this.navHtml(groups, tab, 'stab', `<div class="kpg">${page}</div>`)}</div>`, 'showSettings', [], 'Jogo, tela, som e controles');
    this.fitReino('s:' + tab, 'set/' + tab);
    // computador, Como jogar: a letra dos passos diminui um pouco até todos caberem na página
    if (!small && tab === 'ajuda') {
      const l = this.panel.querySelector('.st-steps .st-list');
      const out = () => { const r = l.getBoundingClientRect(), c = l.lastElementChild.getBoundingClientRect(); return c.right > r.right + 1 || c.bottom > r.bottom + 1; };
      for (let px = 12; px >= 9.5 && out(); px -= 0.5) l.style.fontSize = px + 'px';
    }
  },
  // partes do texto de ajuda (tabela de teclas, passos e parágrafos)
  helpParts() {
    if (!this._help) {
      const div = document.createElement('div'); div.innerHTML = HELP_HTML;
      this._help = { rows: [...div.querySelectorAll('table tr')].map(tr => [...tr.children].map(td => td.innerHTML)),
        steps: [...div.querySelectorAll('li')].map(li => li.innerHTML), paras: [...div.querySelectorAll('p')].map(p => p.innerHTML) };
    }
    return this._help;
  },

  // o lar: uma cena com a lareira (o céu muda com a hora) e três ações grandes; dormir já salva o jogo
  showRest(sid) {
    const s = World.structs[sid], cabin = s.type === 'cabin', place = cabin ? 'cabana' : s.type === 'manor' ? 'casarão' : 'casa';
    const h = Game.hour(), hh = String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor(h % 1 * 60)).padStart(2, '0');
    const sky = h >= 21 || h < 5 ? 'night' : h < 7 ? 'dawn' : h < 18 ? 'day' : 'dusk';
    const box = Store.box(s), stored = Object.values(box).reduce((a, n) => a + (n || 0), 0), kinds = Object.keys(box).filter(k => box[k] > 0).length;
    const hurt = P.hp < P.maxHp;
    const line = sky === 'night' ? 'A noite caiu lá fora. O fogo da lareira ainda crepita.' : sky === 'dusk' ? 'O sol se põe atrás das árvores. Hora de descansar?' : sky === 'dawn' ? 'O dia está nascendo. A lareira ainda está morna.' : `O sol entra pela janela da ${place}. Tudo arrumado e quente.`;
    const chip = (ic, v, cls) => `<span class="rh-chip ${cls || ''}">${ic} <b>${v}</b></span>`;
    const act = (cls, attrs, ic, label, sub) => `<button class="ra ${cls}" ${attrs}><span class="ra-ic">${ic}</span><span class="ra-t"><b>${label}</b><small>${sub}</small></span></button>`;
    const body = `<div class="rest">
      <div class="rest-hero ${sky}"><div class="rh-stars"></div><div class="rh-fire"><span class="rh-glow"></span><span class="rh-flame">🔥</span></div>
        <div class="rh-t"><small class="rh-time">🕯️ ${hh} · ${Calendar.full(G.day)}</small><b>${cabin ? 'Sua Cabana' : s.type === 'manor' ? 'Seu Casarão' : 'Sua Casa'}</b><small>${line}</small>
          <div class="rh-chips">${chip('❤️', Math.round(P.hp) + '/' + P.maxHp, hurt ? 'bad' : '')}${chip('🍎', Math.round(P.hunger))}${chip('⚡', Math.round(P.stamina))}</div></div></div>
      <div class="rest-acts">
        ${act('main', `data-act="sleep" data-s="${sid}"`, '🛏️', 'Dormir até o amanhecer', `${hurt ? 'Recupera toda a vida · ' : ''}salva no espaço ${G.slot}`)}
        ${act('', `data-act="chest" data-s="${sid}"`, '📦', `Baú da ${place}`, stored ? `${stored} itens · ${kinds} tipos guardados` : 'Vazio · guarde o que pesa')}
        ${act('fire', 'data-act="craftat" data-st="fogueira"', '🍖', 'Cozinhar na lareira', 'Carne, peixe e pratos')}
      </div></div>`;
    this.open(cabin ? 'Cabana' : s.type === 'manor' ? 'Casarão' : 'Casa', body, 'showRest', [sid], 'Seu lar: descanse, cozinhe e guarde itens');
  },

  showChest(sid) {
    const s = World.structs[sid], box = Store.box(s);
    const row = (k, n, to) => `<div class="crow"><span class="ri">${ITEMS[k].icon}</span><span><b>${ITEMS[k].name}</b><small>×${n} · peso ${Math.round(itemWeight(k) * n * 10) / 10}</small></span>
      <span class="act-row">${['1', '10', 'all'].map(q => `<button data-act="cmove" data-s="${sid}" data-k="${k}" data-q="${q}" data-to="${to}">${to === '1' ? '→' : '←'} ${q === 'all' ? 'Tudo' : q}</button>`).join('')}</span></div>`;
    const inv = Object.keys(P.inv).filter(k => !Object.values(P.equip).includes(k) || P.inv[k] > 1).sort((x, y) => ITEMS[x].cat.localeCompare(ITEMS[y].cat));
    const stored = Object.keys(box).sort((x, y) => ITEMS[x].cat.localeCompare(ITEMS[y].cat));
    const w = Store.weight(), cap = Store.capacity();
    const h = `<div class="chest-layout">
      <div class="card col"><div class="sec">Mochila <span class="${w > cap ? 'bad' : ''}">carga ${w} / ${cap}</span></div>
        <div class="scroll" data-scroll="cinv">${inv.length ? inv.map(k => row(k, P.inv[k], '1')).join('') : '<p class="muted">Mochila vazia.</p>'}</div></div>
      <div class="card col"><div class="sec">Baú <span>${stored.length} tipos de item</span></div>
        <div class="scroll" data-scroll="cbox">${stored.length ? stored.map(k => row(k, box[k], '0')).join('') : '<p class="muted">O baú está vazio.</p>'}</div></div></div>
      <div class="act-row" style="margin-top:10px"><button class="primary" data-act="cstash" data-s="${sid}">📦 Guardar todos os recursos e materiais</button>
      <small class="muted">Itens no baú não pesam na mochila. Cada baú guarda o seu próprio conteúdo.</small></div>`;
    this.open('Baú', h, 'showChest', [sid], `${s.type === 'chest' ? 'Baú' : 'Baú da casa'} em ${s.x}, ${s.y}`);
  },

  showStable() {
    const h = `<div class="kgrid two">
      <div class="card inv-card"><div class="dt-head"><div class="dt-ic sm">🐴</div><div><b>Cavalo</b><div class="dt-cat">${P.horse ? 'Você tem: ' + this.esc(P.horse.name) : 'Você não tem cavalo'}</div></div></div>
        <p class="dt-desc">Quase o dobro da velocidade (tecla R para montar). Os alforjes carregam +${HORSE_CARRY} de peso.</p>
        <button class="primary" data-act="buyride" data-k="horse" data-p="220" ${!P.horse && P.gold >= 220 ? '' : 'disabled'}>Comprar — 220 🪙</button></div>
      <div class="card inv-card"><div class="dt-head"><div class="dt-ic sm">🛒</div><div><b>Carroça</b><div class="dt-cat">${P.cart ? 'Você tem uma carroça' : 'Precisa de um cavalo para puxar'}</div></div></div>
        <p class="dt-desc">Seu cavalo puxa a carroça e você carrega +${CART_CARRY} de peso.</p>
        <button class="primary" data-act="buyride" data-k="cart" data-p="160" ${P.horse && !P.cart && P.gold >= 160 ? '' : 'disabled'}>Comprar — 160 🪙</button></div></div>`;
    this.open('Estábulo', h, 'showStable', [], 'Cavalos e carroças para viajar mais rápido');
  },

  showFarm() {
    const n = World.structs.filter(s => s.owner === 'player' && s.type === 'farm').length;
    this.open('🌾 Fazenda', `<p>Suas plantações de trigo estão crescendo.</p><p>Você possui <b>${n}</b> fazenda(s), que produzem <b>${n * 6}</b> de trigo a cada amanhecer.</p><p class="muted">Use o trigo para assar pão na fogueira ou venda nos mercados.</p>`, 'showFarm');
  },

  showBarracks() {
    const cap = Game.followerCap(), n = Game.allies().length;
    const cost = { gold: 35, wheat: 5 };
    const can = Inv.has(cost) && n < cap;
    this.open('🛡️ Quartel', `<p>Recrutas treinam com espadas de madeira no pátio.</p>
      <p>Seguidores: <b>${n}/${cap}</b> · Cada soldado cobra 4 🪙 por mês.</p>
      <div class="btns"><button data-act="train" ${can ? '' : 'disabled'}>Treinar soldado — ${this.fmtCost(cost)}</button></div>`, 'showBarracks');
  },

  // ------------------------------------------------------------ lojas especializadas
  showShop(type, vi, npcId) {
    const sh = SHOPS[type];
    const owner = npcId != null ? People.get(npcId) : People.shopkeeper(vi, sh.rank);
    const v = vi >= 0 ? World.villages[vi] : null;
    const title = `${sh.icon} ${sh.name}${v ? ' de ' + v.name : ''}`;
    if (!owner || !owner.alive) { this.open(title, `<p class="bad">Fechado. ${type === 'hunter' ? 'O caçador' : 'O dono'} morreu sem deixar herdeiros para o ofício.</p>`, 'showShop', [type, vi, npcId]); return; }
    const civ = owner.civ >= 0 ? owner.civ : (v ? v.civ : 0);
    const c = G.civs[civ];
    this.shopCtx = { civ, owner: owner.id };
    if (c.atWar || owner.hostile || owner.aff <= -60) {
      this.open(title, `<p class="bad">${UI.esc(owner.name)} cruza os braços: "Não faço negócio com ${c.atWar ? 'inimigos do reino' : 'gente como você'}!"</p>`, 'showShop', [type, vi, npcId]);
      return;
    }
    const rel = People.relation(owner);
    const disc = Math.round(owner.aff / 4);
    let h = `<div class="shopowner"><canvas class="mini-portrait" data-pid="${owner.id}" width="44" height="44"></canvas>
      <div><b>${UI.esc(People.full(owner))}</b> · ${People.title(owner)} · <span style="color:${rel.col}">${rel.text}</span><br>
      <small>Tesouro do reino: ${c.treasury} 🪙 · Seu ouro: ${P.gold} 🪙 · ${disc > 0 ? `Desconto de amizade: ${disc}%` : disc < 0 ? `Preços ${-disc}% mais caros (não gosta de você)` : 'Seja amigo do dono para ganhar desconto'}</small></div>
      <button data-act="tk" data-op="open" data-id="${owner.id}">💬 Conversar</button></div>
      <h3>À venda</h3><table class="trade"><tr><th>Item</th><th>Você tem</th><th>Estoque</th><th>Preço</th><th></th></tr>`;
    for (const k of sh.sells) {
      const it = ITEMS[k], pr = Game.priceFor(civ, k, owner);
      const raw = c.stock[k] !== undefined;
      const can = P.gold >= pr.buy && (!raw || c.stock[k] > 0);
      h += `<tr><td>${it.icon} ${it.name}</td><td>${Inv.count(k)}</td><td>${raw ? c.stock[k] : '∞'}</td><td>${pr.buy} 🪙${this.trendIcon(civ, k)}</td>
        <td><button data-act="trade2" data-k="${k}" data-n="1" data-m="buy" ${can ? '' : 'disabled'}>Comprar 1</button><button data-act="trade2" data-k="${k}" data-n="10" data-m="buy" ${can ? '' : 'disabled'}>10</button></td></tr>`;
    }
    h += '</table><h3>Vender para esta loja</h3>';
    const mine = Object.keys(P.inv).filter(k => sh.buys(ITEMS[k]));
    if (!mine.length) h += `<p class="muted">Você não tem nada que interesse ${type === 'hunter' ? 'ao caçador' : 'a esta loja'}.</p>`;
    else {
      h += '<table class="trade"><tr><th>Item</th><th>Você tem</th><th>Paga</th><th></th></tr>';
      for (const k of mine) {
        const it = ITEMS[k], pr = Game.priceFor(civ, k, owner);
        const can = c.treasury >= pr.sell;
        h += `<tr><td>${it.icon} ${it.name}${Object.values(P.equip).includes(k) ? ' <small class="muted">(equipado)</small>' : ''}</td><td>${Inv.count(k)}</td><td>${pr.sell} 🪙${this.trendIcon(civ, k)}</td>
          <td><button data-act="trade2" data-k="${k}" data-n="1" data-m="sell" ${can ? '' : 'disabled'}>Vender 1</button><button data-act="trade2" data-k="${k}" data-n="10" data-m="sell" ${can ? '' : 'disabled'}>10</button></td></tr>`;
      }
      h += '</table>';
    }
    this.open(title, h, 'showShop', [type, vi, npcId]);
    this.drawMiniPortraits();
  },

  // ------------------------------------------------------------ conversa com NPCs
  drawPersonPortrait(cv, p, scale) {
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    const lk = People.look(p);
    if (p.capanga && !p.equip.torso) lk.body = PLAYER_COLOR;
    drawHuman(g, cv.width / 2, cv.height * 0.92 + (scale > 2.5 ? 0 : 18), Object.assign(lk, { scale: (lk.scale || 1) * scale, dir: 1, moving: false, swing: 0, aim: 0, weapon: null, shield: null }));
  },
  drawMiniPortraits() {
    for (const cv of this.panel.querySelectorAll('canvas[data-pid]')) this.drawPersonPortrait(cv, People.get(+cv.dataset.pid), 1.6);
  },
  showTalk(id, res) {
    const p = People.get(id);
    if (!p || !p.alive) { this.close(); return; }
    p.met = true;
    const rel = People.relation(p), t = TRAITS[p.trait];
    const adult = People.isAdult(p);
    const affBar = `<div class="rbar"><span>Amizade</span><div class="rt"><i style="left:50%;width:${Math.abs(p.aff) / 2}%;${p.aff < 0 ? 'transform:translateX(-100%);background:#c0392b' : 'background:#5a9a2a'}"></i><em></em></div><b>${Math.round(p.aff)}</b></div>`;
    const romBar = People.canRomance(p) || p.rom > 0 ? `<div class="rbar"><span>Romance</span><div class="rt"><i style="width:${p.rom}%;background:#d0508a"></i></div><b>${Math.round(p.rom)}</b></div>` : '';
    const text = res ? res.text : People.say(p);
    const shop = RANKS[p.rank].shop;
    const acts = [['talk', '💬 Conversar'], ['compliment', '😊 Elogiar'], ['giftmenu', '🎁 Presentear']];
    if (People.canRomance(p)) {
      acts.push(['flirt', '💘 Paquerar']);
      if (!p.dating && p.spouse !== 'player') acts.push(['date', '💕 Pedir em namoro']);
    }
    if (p.dating) acts.push(['propose', '💍 Pedir em casamento']);
    if (p.spouse === 'player') acts.push(['child', G.family.dueDay ? '👶 O bebê está a caminho!' : G.family.tryChild ? '👶 Planejando um filho...' : '👶 Ter um filho']);
    if (p.dating || p.spouse === 'player') acts.push(['breakup', '💔 Terminar']);
    if (shop && shop !== 'tavern' && p.age >= 14 && (shop === 'hunter' || p.home.type === 'village')) acts.push(['shopnpc', '⚖️ Negociar']);
    if (p.job !== undefined && p.job !== null) acts.push(['bizfire', '📤 Demitir do empreendimento']);
    else if (Biz.can(p) === true && Biz.list().length) acts.push(['hiremenu', '💼 Contratar para trabalhar']);
    if (p.capanga) { const sk = STANCES[p.stance] || STANCES.normal; acts.push(['equipc', '🛡️ Equipar e treinar'], ['stance', `${sk.icon} Postura: ${sk.name}`], ['dismiss', '🏠 Dispensar']); }
    if (p.capanga && p.post) acts.push(['unguard', '👣 Voltar a me seguir']);
    else if (p.capanga && Guards.places().length) acts.push(['guardmenu', '🛡️ Mandar fazer guarda']);
    else if (People.canRecruit(p)) acts.push(['recruit', `🤝 Recrutar como capanga — ${People.recruitCost(p)} 🪙`]);
    if (adult && !p.kin && p.spouse !== 'player') acts.push(['insult', '😠 Insultar']);
    { const fm = Families.of(p); if (adult && !p.kin && p.spouse !== 'player' && !p.capanga && Court.canDeal(fm)) {
      if (Court.isEnemy(fm)) acts.push(['fpeace', `🕊️ Pedir paz à Casa ${UI.esc(fm.surname)}`]);
      else { acts.push(Court.isAlly(fm) ? ['funally', '💔 Desfazer a aliança'] : ['fally', `🤝 Propor aliança — ${Court.ALLY_COST} 🪙`]); acts.push(['fenemy', `⚔️ Declarar a Casa ${UI.esc(fm.surname)} inimiga`]); } } }
    if (p.rank === 'priest') acts.push(['church', '⛪ Assuntos da igreja']);
    { const ev = WorldEvents.cur(); if (p.lost && ev && ev.kind === 'lost' && ev.pid === p.id && !ev.escort) acts.unshift(['escort', '🧭 Venha comigo, eu levo você']); }
    { const vi = Chiefdom.vilOf(p); if (vi >= 0 && G.civs[World.villages[vi].civ].ruler !== 'player') acts.push(['vchallenge', '⚔️ Desafiar pela chefia da vila']); }
    if (p.kin === 'child' && p.age >= 12) acts.push(['profmenu', p.prof ? `${PROFESSIONS[p.prof].icon} Mudar profissão` : '🎓 Escolher profissão']);
    const st = p.capanga ? People.capangaStats(p) : null;
    const h = `<div class="talk">
        <div class="tk-left"><canvas id="tkPortrait" width="128" height="150"></canvas><div class="tk-rel" style="color:${rel.col}">${rel.text}</div></div>
        <div class="tk-right">
          <div class="tk-name">${UI.esc(People.full(p))}${p.maiden && p.maiden !== p.surname ? ` <small class="muted">(nascid${p.sex === 'f' ? 'a' : 'o'} ${UI.esc(p.maiden)})</small>` : ''}</div>
          <div class="tk-sub">${People.title(p)} · ${p.age} ${p.age === 1 ? 'ano' : 'anos'} · ${p.sex === 'm' ? 'Homem' : 'Mulher'} · ${People.homeName(p)}</div>
          <div class="tk-tags">${Families.of(p) ? `<span class="famchip" data-act="famview" data-f="${p.fam}" style="border-color:${Families.of(p).color}">🏛️ ${UI.esc(Families.name(Families.of(p)))}</span>` : ''}
            ${Families.isChief(p) ? `<span class="tag">Chefe de ${UI.esc(World.villages.find(v => v.chief === p.id).name)}</span>` : ''}
            ${p.job !== undefined && p.job !== null && World.structs[p.job] ? `<span>💼 Trabalha no seu <b>${UI.esc(BUILDINGS[World.structs[p.job].type].name)}</b></span>` : ''}
            ${p.capanga ? `<span>⭐ Nível <b>${p.clvl || 1}</b> · ${STANCES[p.stance] ? STANCES[p.stance].icon + ' ' + STANCES[p.stance].name : '⚖️ Equilibrado'}</span>` : ''}${p.home.type === 'village' && p.age >= 16 && !p.capanga ? `<span>🏠 ${Homes.status(p)}</span>` : ''}<span>Personalidade: <b>${t.name}</b></span><span>Gosta de: <b>${p.aff >= 35 || p.kin ? ITEMS[p.fav].icon + ' ' + ITEMS[p.fav].name : '???'}</b></span>
            ${st ? `<span>⚔️ Dano <b>${st.dmg}</b> · 🛡️ Defesa <b>${st.def}</b></span>` : ''}${p.hostile ? '<span class="bad">Hostil!</span>' : ''}${Court.isEnemy(Families.of(p)) ? '<span class="bad">⚔️ Casa inimiga</span>' : Court.isAlly(Families.of(p)) ? '<span class="ok">🤝 Casa aliada</span>' : ''}</div>
          ${affBar}${romBar}
          <div class="speech">“${UI.esc(text)}”</div>
          ${res && res.note ? `<div class="tk-note">${UI.esc(res.note)}</div>` : ''}
        </div></div>
      <div class="tk-acts">${acts.map(([op, lab]) => `<button data-act="tk" data-op="${op}" data-id="${p.id}">${lab}</button>`).join('')}</div>`;
    this.open('💬 Conversa', h, 'showTalk', [id, res]);
    this.drawPersonPortrait(document.getElementById('tkPortrait'), p, 3);
  },
  showGift(id) {
    const p = People.get(id);
    const keys = Object.keys(P.inv).filter(k => !Object.values(P.equip).includes(k) || P.inv[k] > 1)
      .sort((a, b) => (b === p.fav) - (a === p.fav) || ITEMS[b].price - ITEMS[a].price);
    let h = `<p>O que você quer dar para <b>${UI.esc(p.name)}</b>? Presentes valiosos agradam mais, e o favorito agrada muito mais.</p>
      <div class="btns"><button data-act="tk" data-op="gold" data-n="10" data-id="${id}" ${P.gold >= 10 ? '' : 'disabled'}>🪙 10 moedas</button>
      <button data-act="tk" data-op="gold" data-n="50" data-id="${id}" ${P.gold >= 50 ? '' : 'disabled'}>🪙 50 moedas</button>
      <button data-act="tk" data-op="gold" data-n="100" data-id="${id}" ${P.gold >= 100 ? '' : 'disabled'}>🪙 100 moedas</button></div><div class="list">`;
    if (!keys.length) h += '<p class="muted">Sua mochila está vazia.</p>';
    for (const k of keys) {
      const it = ITEMS[k];
      h += `<div class="item"><span class="ic">${it.icon}</span><div class="info"><b>${it.name}</b> ×${P.inv[k]}${k === p.fav && (p.aff >= 35 || p.kin) ? ' <span class="tag">favorito!</span>' : ''}<small>vale ${it.price} 🪙</small></div>
        <div class="acts"><button data-act="tk" data-op="gift" data-k="${k}" data-id="${id}">Dar</button></div></div>`;
    }
    h += `</div><div class="btns"><button data-act="tk" data-op="open" data-id="${id}">← Voltar à conversa</button></div>`;
    this.open('🎁 Presentear ' + UI.esc(p.name), h, 'showGift', [id]);
  },
  showEquipC(id) {
    const p = People.get(id), st = People.capangaStats(p);
    let h = `<p>Entregue armas e armaduras da sua mochila para <b>${UI.esc(People.full(p))}</b>. Itens removidos voltam para você.</p>
      <div class="stats"><div>⭐ Nível <b>${st.lvl}</b> · ${p.cxp || 0}/${People.capXpNext(p)} XP</div><div>❤️ Vida <b>${st.hp}</b></div><div>⚔️ Dano <b>${st.dmg}</b></div><div>🛡️ Defesa <b>${st.def}</b></div></div>
      ${this.bar(p.cxp || 0, People.capXpNext(p))}
      <div class="sec" style="margin-top:10px">Postura em combate</div><div class="act-row">${Object.entries(STANCES).map(([k, s]) => `<button class="${(p.stance || 'normal') === k ? 'primary' : ''}" data-act="tk" data-op="setstance" data-k="${k}" data-id="${id}" title="${s.desc}">${s.icon} ${s.name}</button>`).join('')}</div>
      <small class="muted">${(STANCES[p.stance] || STANCES.normal).desc}. Capangas ganham experiência derrotando inimigos (quem dá o golpe final leva mais).</small>
      <div class="sec" style="margin-top:10px">Equipamento</div><div class="equip6">`;
    for (const sl of EQUIP_SLOTS) {
      if (sl.key === 'tool') continue;
      const k = p.equip[sl.key], it = k && ITEMS[k];
      h += `<div class="eslot ${it ? 'full' : ''}"><span class="eic">${it ? it.icon : '·'}</span><div class="info"><small>${sl.name}</small><b>${it ? it.name : 'Nada'}</b><small>${it ? (it.dmg ? 'Dano ' + it.dmg : 'Defesa +' + it.def) : ''}</small></div>
        ${it ? `<button data-act="tk" data-op="cun" data-k="${sl.key}" data-id="${id}">✕</button>` : ''}</div>`;
    }
    h += '</div><h3>Da sua mochila</h3><div class="list">';
    const keys = Object.keys(P.inv).filter(k => ITEMS[k].slot && ITEMS[k].slot !== 'tool');
    if (!keys.length) h += '<p class="muted">Você não tem armas nem armaduras para entregar.</p>';
    for (const k of keys) {
      const it = ITEMS[k];
      h += `<div class="item"><span class="ic">${it.icon}</span><div class="info"><b>${it.name}</b> ×${P.inv[k]}<small>${this.itemDesc(it)}</small></div>
        <div class="acts"><button data-act="tk" data-op="ceq" data-k="${k}" data-id="${id}">Entregar</button></div></div>`;
    }
    h += `</div><div class="btns"><button data-act="tk" data-op="open" data-id="${id}">← Voltar à conversa</button></div>`;
    this.open('🛡️ Equipar ' + UI.esc(p.name), h, 'showEquipC', [id]);
  },
  talkAct(d) {
    const p = People.get(+d.id);
    if (!p) return;
    let r = null;
    switch (d.op) {
      case 'open': this.showTalk(p.id); return;
      case 'talk': r = People.talk(p); break;
      case 'compliment': r = People.compliment(p); break;
      case 'giftmenu': this.showGift(p.id); return;
      case 'gift': r = People.gift(p, d.k); break;
      case 'gold': r = People.giveGold(p, +d.n); break;
      case 'flirt': r = People.flirt(p); break;
      case 'date': r = People.date(p); break;
      case 'fally': r = Court.allyWith(Families.of(p)); break;
      case 'funally': { const fm = Families.of(p); Dialog.confirm({ icon: '💔', title: 'Desfazer a aliança', text: `Desfazer a aliança com a ${Families.name(fm)}?`, ok: 'Desfazer', danger: true }, () => this.showTalk(p.id, Court.unally(fm))); return; }
      case 'fenemy': { const fm = Families.of(p); Dialog.confirm({ icon: '⚔️', title: 'Declarar inimiga', text: `Declarar a ${Families.name(fm)} inimiga da sua casa? Os adultos dela poderão ser enfrentados até a morte, e eles vão revidar.`, ok: 'Declarar inimiga', danger: true }, () => this.showTalk(p.id, Court.declareEnemy(fm))); return; }
      case 'fpeace': r = Court.peace(Families.of(p)); break;
      case 'propose': r = People.propose(p); break;
      case 'breakup': Dialog.confirm({ icon: '💔', title: 'Terminar', text: `Terminar o relacionamento com ${p.name}?`, ok: 'Terminar', danger: true }, () => this.showTalk(p.id, People.breakUp(p))); return;
      case 'child':
        if (!G.family.dueDay) { G.family.tryChild = true; r = { text: 'Sim... vamos aumentar a nossa família! ❤', note: 'Durmam em casa (Cabana, Casa ou Casarão) para tentar ter um filho.' }; }
        else r = { text: 'Falta pouco para o bebê chegar!', note: '' };
        break;
      case 'shopnpc': this.showShop(RANKS[p.rank].shop, p.home.type === 'village' ? p.home.idx : -1, p.id); return;
      case 'recruit': r = People.recruit(p); break;
      case 'dismiss': r = People.dismiss(p); break;
      case 'stance': { const ks = Object.keys(STANCES), k = ks[(ks.indexOf(p.stance || 'normal') + 1) % ks.length]; People.setStance(p, k); r = { text: { aggressive: 'Vou pra cima deles!', normal: 'Do jeito de sempre, chefe.', defensive: 'Fico de olho e protejo você.' }[k], note: `Postura: ${STANCES[k].icon} ${STANCES[k].name} — ${STANCES[k].desc}.` }; break; }
      case 'setstance': People.setStance(p, d.k); this.showEquipC(p.id); return;
      case 'guardmenu': this.showGuard(p.id); return;
      case 'guard': if (Guards.assign(p, Guards.decode(d.k))) { this.close(); return; } this.showGuard(p.id); return;
      case 'unguard': { const ok = Guards.recall(p); if (this.cur && this.cur.fn === 'showKingdom') { this.refresh(); return; } if (ok) { this.close(); return; } break; }
      case 'equipc': this.showEquipC(p.id); return;
      case 'ceq': {
        const it = ITEMS[d.k];
        if (Inv.count(d.k) <= 0) return;
        if (p.equip[it.slot]) Inv.add(p.equip[it.slot], 1);
        Inv.add(d.k, -1); p.equip[it.slot] = d.k;
        Game.refreshCapanga(p); this.showEquipC(p.id); return;
      }
      case 'cun': if (p.equip[d.k]) { Inv.add(p.equip[d.k], 1); p.equip[d.k] = null; Game.refreshCapanga(p); } this.showEquipC(p.id); return;
      case 'insult': r = People.insult(p); break;
      case 'escort': WorldEvents.escort(); this.close(); UI.msg(`🧭 ${p.name} segue você. Leve-${p.sex === 'f' ? 'a' : 'o'} até qualquer vila ou castelo.`, 'gold'); return;
      case 'vchallenge': {
        const vi = Chiefdom.vilOf(p), v = World.villages[vi];
        if (!v) return;
        Dialog.confirm({ icon: '⚔️', title: 'Desafiar o chefe', text: `Atacar ${v.name} para tomar a chefia de ${p.name}? A milícia vai lutar, e o rei decide se isso é uma afronta à coroa.`, ok: 'Atacar a vila', danger: true }, () => { this.close(); Chiefdom.challenge(vi); });
        return;
      }
      case 'profmenu': this.showProf(p.id); return;
      case 'hiremenu': this.showHire(p.id); return;
      case 'church': { const ch = World.villages[p.home.idx] && World.villages[p.home.idx].chapel; if (ch) this.showChapel(ch.id); return; }
      case 'hire': { const s = World.structs[+d.s]; if (Biz.hire(p, s)) { this.showTalk(p.id, { text: 'Pode contar comigo, patrão! Começo amanhã cedo.', note: `Salário: ${Biz.wage(p, s)} 🪙 por dia.` }); return; } break; }
      case 'bizfire': Biz.fire(p); this.showTalk(p.id, { text: 'Tudo bem... boa sorte com os negócios.', note: '' }); return;
      case 'setprof': Progress.setProf(p, d.k); this.showTalk(p.id, { text: 'Vou dar o meu melhor para honrar a família!', note: PROFESSIONS[d.k].desc }); return;
    }
    if (r && Farm.has('charm') && ['talk', 'compliment', 'flirt'].includes(d.op)) p.aff = Math.min(100, p.aff + 1);
    if (r && r.fight) {
      this.close();
      const e = G.spawned.get(p.id);
      if (e) e.target = P;
      UI.msg(r.note, 'bad');
      return;
    }
    this.showTalk(p.id, r);
  },

  // ------------------------------------------------------------ botão de conversa sobre o NPC
  talkButton(e, cx, cy) {
    const el = this.talkEl;
    if (!e) { if (el.style.display !== 'none') el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.dataset.id = e.npc.id;
    const z = Game.zoom || 1;
    el.style.left = Math.round((e.x - cx) * z) + 'px';
    el.style.top = Math.round((e.y - cy - (e.npc.age < 14 ? 34 : 50)) * z - 36) + 'px';
  },

  // ------------------------------------------------------------ fim de jogo e nascimento
  showGameOver(cause) {
    this.goCause = cause;
    const heirs = Game.heirs();
    const el = document.getElementById('gameover');
    el.innerHTML = `<div class="gobox">
      <div class="go-skull">☠</div><h1>FIM DE JOGO</h1>
      <p class="go-cause"><b>${UI.esc(G.name)}</b> morreu ${UI.esc(cause)} aos ${P.age} anos, em ${Calendar.full(G.day)}.</p>
      ${heirs.length ? '<h3>Continue a sua linhagem</h3><div class="go-heirs">' + heirs.map(h => `<button data-go="heir" data-id="${h.id}">
          <canvas data-pid="${h.id}" width="56" height="56"></canvas><span><b>${UI.esc(h.name)}</b><small>${h.sex === 'm' ? 'Filho' : 'Filha'} · ${h.age} anos${h.age < 16 ? ` (assume aos 16)` : ''}</small></span></button>`).join('') + '</div>'
        : '<p class="muted2">Você não deixou herdeiros. Case-se e tenha filhos para continuar sua linhagem numa próxima vez.</p>'}
      <div class="go-btns"><button data-go="load">📜 Carregar último jogo salvo</button><button data-go="menu">🏰 Voltar ao menu</button></div></div>`;
    el.classList.remove('hidden');
    for (const cv of el.querySelectorAll('canvas[data-pid]')) this.drawPersonPortrait(cv, People.get(+cv.dataset.pid), 1.9);
  },
  hideGameOver() { document.getElementById('gameover').classList.add('hidden'); },
  showBirth() {
    this.babySex = Math.random() < 0.5 ? 'm' : 'f';
    const sp = G.family.spouse !== null ? People.get(G.family.spouse) : null;
    const el = document.getElementById('birth');
    el.innerHTML = `<div class="birthbox"><div class="go-skull">👶</div><h2>${this.babySex === 'm' ? 'É um menino!' : 'É uma menina!'}</h2>
      <p>${sp ? UI.esc(sp.name) + ' e ' : ''}${UI.esc(G.name)} receberam ${this.babySex === 'm' ? 'um filho' : 'uma filha'} saudável.</p>
      <label>Escolha o nome <input id="babyName" maxlength="18" placeholder="${U.pick(this.babySex === 'm' ? NAMES_M : NAMES_F)}"></label>
      <button data-birth="1">Dar o nome</button></div>`;
    el.classList.remove('hidden');
    this.modal = true; G.paused = true;
    const inp = document.getElementById('babyName');
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') el.querySelector('[data-birth]').click(); });
    setTimeout(() => inp.focus(), 50);
  },

  showTavern(sid, rumor) {
    const s = World.structs[sid];
    const v = World.villages[s.village];
    const c = G.civs[s.owner];
    if (c.atWar) { this.open('🍺 Taverna de ' + v.name, '<p class="bad">O taverneiro aponta para a porta: "Aqui não servimos inimigos do reino!"</p>', 'showTavern', [sid]); return; }
    const cap = Game.followerCap(), n = Game.allies().length;
    const r = rumor || U.pick(RUMORS);
    const keeper = People.shopkeeper(s.village, 'innkeeper');
    if (!keeper) { this.open('🍺 Taverna de ' + v.name, '<p class="bad">A taverna está fechada. O taverneiro morreu sem herdeiros.</p>', 'showTavern', [sid]); return; }
    const h = `<div class="shopowner"><canvas class="mini-portrait" data-pid="${keeper.id}" width="44" height="44"></canvas><div><b>${UI.esc(People.full(keeper))}</b> · ${People.title(keeper)}<br><small>“${UI.esc(TRAITS[keeper.trait].line)}”</small></div>
      <button data-act="tk" data-op="open" data-id="${keeper.id}">💬 Conversar</button></div>
      <p>O cheiro de cerveja e ensopado enche o salão. Mercenários jogam dados num canto.</p>
      <blockquote>“${r}”</blockquote>
      <p>Seguidores: <b>${n}/${cap}</b> · Cada soldado cobra 4 🪙 por mês.</p>
      <div class="btns col">
        <button data-act="hire" data-s="${sid}" ${P.gold >= 60 && n < cap ? '' : 'disabled'}>⚔️ Contratar mercenário — 60 🪙</button>
        <button data-act="buyride" data-k="horse" data-p="250" ${!P.horse && P.gold >= 250 ? '' : 'disabled'}>🐴 ${P.horse ? 'Você já tem ' + this.esc(P.horse.name) : 'Comprar um cavalo — 250 🪙'}</button>
        <button data-act="buyride" data-k="cart" data-p="180" ${P.horse && !P.cart && P.gold >= 180 ? '' : 'disabled'}>🛒 ${P.cart ? 'Você já tem uma carroça' : 'Comprar uma carroça — 180 🪙 (precisa de cavalo)'}</button>
        <button data-act="buyfood" data-s="${sid}" data-k="bread" data-p="8" ${P.gold >= 8 ? '' : 'disabled'}>🍞 Comprar pão — 8 🪙</button>
        <button data-act="buyfood" data-s="${sid}" data-k="cooked_meat" data-p="12" ${P.gold >= 12 ? '' : 'disabled'}>🍖 Comprar carne assada — 12 🪙</button>
        <button data-act="rumor" data-s="${sid}">👂 Ouvir outro boato</button>
      </div>`;
    this.open('🍺 Taverna de ' + v.name, h, 'showTavern', [sid, r]);
    this.drawMiniPortraits();
  },

  showCastle(ci) {
    const c = G.civs[ci], d = CIV_DEFS[ci];
    if (c.ruler === 'player') { this.showKingdom(ci); return; }
    RoyalCourt.visit(ci);
    const need = Game.claimNeeds(ci), canClaim = c.relation >= need.rel && P.gold >= need.gold && !c.atWar;
    let h = `<div class="castle-herald">${Heraldry.armsSvg(ci, 44)}${Heraldry.flagSvg(ci, 60, 40)}<p><i>${d.desc}</i></p></div>
      <div class="stats">
        <div>👑 Soberano: <b>${this.esc(c.rulerName)}</b></div><div>👥 População: <b>${c.pop}</b></div>
        <div>🛡️ Guarnição: <b>${c.garrison}</b> soldados</div><div>💰 Tesouro: <b>${c.treasury}</b> 🪙</div>
        <div>🤝 Relação: ${this.relBar(c)}</div><div>${c.atWar ? '<span class="bad">⚔️ EM GUERRA com você</span>' : '🕊️ Em paz'}</div>
      </div><div class="btns col">`;
    if (!c.atWar) {
      h += `<button data-act="tribute" data-c="${ci}" ${P.gold >= 100 ? '' : 'disabled'}>🎁 Oferecer tributo — 100 🪙 (+8 relação)</button>
        <button data-act="claim" data-c="${ci}" ${canClaim ? '' : 'disabled'}>📜 Reivindicar o trono pela diplomacia — ${need.gold} 🪙 (exige relação ${need.rel}+)</button>
        <button class="danger" data-act="war" data-c="${ci}">⚔️ Declarar guerra e sitiar o castelo</button>`;
    } else {
      h += `<button data-act="peace" data-c="${ci}" ${P.gold >= 300 ? '' : 'disabled'}>🕊️ Propor paz — 300 🪙</button>`;
      if (!G.siege) h += `<button class="danger" data-act="siege" data-c="${ci}">⚔️ Iniciar o cerco</button>`;
      else h += `<button data-act="deploy" data-k="ram" ${Inv.count('ram') ? '' : 'disabled'}>🪵 Montar aríete (${Inv.count('ram')}) — tecla G</button>
        <button data-act="deploy" data-k="catapult" ${Inv.count('catapult') ? '' : 'disabled'}>🏹 Montar catapulta (${Inv.count('catapult')})</button>
        <small class="muted">Derrube o portão (${Math.ceil(G.siege.gate || 0)} de resistência) com aríetes, catapultas ou golpes. Enquanto ele estiver de pé, arqueiros atiram das muralhas e o soberano não sai.</small>`;
    }
    h += this.courtCard(ci) + this.titleCard(ci) + this.chiefCard(ci);
    const court = G.people.filter(q => q.alive && q.home.type === 'castle' && q.home.civ === ci).sort((a, b) => RANKS[a.rank].order - RANKS[b.rank].order);
    h += '</div><h3>Corte real</h3><div class="list">' + (RoyalCourt.isMember(ci) ? `<div class="item"><span class="ic">${COURT_OFFICES[RoyalCourt.C().office].icon}</span><div class="info"><b>${UI.esc(G.name + ' ' + G.surname)}</b><small>${RoyalCourt.officeName(RoyalCourt.C().office)} · você</small></div></div>` : '') + court.map(q => { const rl = People.relation(q); return `<div class="item"><canvas class="mini-portrait" data-pid="${q.id}" width="44" height="44"></canvas>
      <div class="info"><b>${UI.esc(People.full(q))}</b><small>${People.title(q)} · ${q.age} anos · <span style="color:${rl.col}">${rl.text}</span></small></div>
      <div class="acts"><button data-act="tk" data-op="open" data-id="${q.id}">💬 Falar</button></div></div>`; }).join('') + '</div>';
    h += `<p class="muted">Para conquistar pela força, derrote toda a guarnição (${c.garrison} soldados) e depois o próprio soberano diante dos portões. Leve seguidores!</p>`;
    this.open(`🏰 Castelo — ${d.name}`, h, 'showCastle', [ci]);
    this.drawMiniPortraits();
  },
  // a corte do rei: convite, cargo, salário, audiências e propostas
  courtCard(ci) {
    const c = G.civs[ci], rn = RoyalCourt.renown(ci), cur = RoyalCourt.C(), inv = G.courtInvite && G.courtInvite.civ === ci;
    const bar = (v, max) => `<span class="pbar" style="display:inline-block;width:120px;vertical-align:middle"><i style="width:${Math.min(100, v / max * 100)}%;background:${v >= max ? '#5fd35f' : '#d6ae60'}"></i></span>`;
    if (!RoyalCourt.isMember(ci)) {
      return `<div class="card court-card"><div class="sec">👑 Corte de ${CIV_DEFS[ci].short} <span>reconhecimento ${rn}</span></div>
        ${inv ? `<div class="alert gold">👑 ${this.esc(c.rulerName)} convidou você para a corte!
            <div class="act-row" style="margin-top:6px"><button class="primary" data-act="cjoin" data-c="${ci}">Aceitar o convite</button><button data-act="cdecline" data-c="${ci}">Recusar</button></div></div>`
          : `<p class="dt-desc">Com reconhecimento ${COURT_INVITE.renown}+ e relação ${COURT_INVITE.rel}+, o rei convida você para a corte: salário, um cargo e a atenção do rei.</p>
            <div class="req"><div class="req-row"><span>${rn >= COURT_INVITE.renown ? '✔' : '✖'}</span><span>Reconhecimento ${bar(rn, COURT_INVITE.renown)}</span><b class="${rn >= COURT_INVITE.renown ? 'ok' : 'bad'}">${rn}/${COURT_INVITE.renown}</b></div>
              <div class="req-row"><span>${c.relation >= COURT_INVITE.rel ? '✔' : '✖'}</span><span>Relação com o reino</span><b class="${c.relation >= COURT_INVITE.rel ? 'ok' : 'bad'}">${Math.round(c.relation)}/${COURT_INVITE.rel}</b></div></div>
            <small class="muted">O reconhecimento soma serviços prestados (caçar bandidos, salvar caravanas, batalhas, torneios, tributos, doações), fama e relação.${cur ? ` Você já serve à corte de ${CIV_DEFS[cur.civ].short}.` : ''}</small>`}</div>`;
    }
    const o = COURT_OFFICES[cur.office], away = G.day - cur.lastVisit, audOk = G.day - cur.audience >= COURT_AUDIENCE_DAYS;
    const offices = Object.entries(COURT_OFFICES).map(([k, x]) => `<button class="${cur.office === k ? 'primary' : ''}" data-act="coffice" data-k="${k}" ${rn >= x.renown && cur.office !== k ? '' : 'disabled'} title="${x.desc} (reconhecimento ${x.renown}+)">${x.icon} ${RoyalCourt.officeName(k)}${rn < x.renown ? ' · ' + x.renown : ''}</button>`).join('');
    const others = G.civs.filter(x => x.id !== ci);
    return `<div class="card court-card"><div class="sec">👑 Você está na corte de ${CIV_DEFS[ci].short} <span>desde ${Calendar.short(cur.since)} · reconhecimento ${rn}</span></div>
      <p class="dt-desc">${o.icon} <b>${RoyalCourt.officeName(cur.office)}</b> — ${o.desc} Salário todo mês: ~${o.pay + Math.floor(rn / 20) * 5} 🪙.</p>
      <div class="act-row">${offices}</div>
      <div class="act-row" style="margin-top:8px"><button data-act="caudience" ${audOk ? '' : 'disabled'}>📜 Audiência com o rei${audOk ? '' : ' (em ' + (COURT_AUDIENCE_DAYS - (G.day - cur.audience)) + ' dias)'}</button>
        ${cur.office === 'general' ? `<button data-act="cescort" ${c.garrison > 2 && Game.allies().length < Game.followerCap() ? '' : 'disabled'}>⚔️ Pedir escolta</button>` : ''}
        <button class="danger" data-act="cleave">🚪 Deixar a corte</button></div>
      ${cur.office === 'diplomat' ? `<div class="sec" style="margin-top:10px">🤝 Propor ao rei</div>${others.map(x => { const war = Diplo.atWar(ci, x.id), al = Diplo.allied(ci, x.id);
        return `<div class="crow2"><span class="cdot" style="background:${Game.civColor(x.id)}"></span> <b>${CIV_DEFS[x.id].short}</b> <small class="muted">relação ${Math.round(Diplo.rel(ci, x.id))}${war ? ' · em guerra' : al ? ' · aliados' : ''}</small>
          ${war ? `<button data-act="cprop" data-o="${x.id}" data-x="peace">🕊️ Paz</button>` : `<button data-act="cprop" data-o="${x.id}" data-x="ally" ${al ? 'disabled' : ''}>🤝 Aliança</button>${x.ruler === 'player' ? '' : `<button class="danger" data-act="cprop" data-o="${x.id}" data-x="war">⚔️ Guerra</button>`}`}</div>`; }).join('')}` : ''}
      <small class="${away > COURT_ABSENCE.warn ? 'bad' : 'muted'}">Apareça no castelo pelo menos a cada ${COURT_ABSENCE.warn} meses (última visita: ${away === 0 ? 'este mês' : 'há ' + away + ' dias'}). Guerra com o reino ou relação abaixo de 10 tiram você da corte.</small></div>`;
  },
  chiefCard(ci) {
    const c = G.civs[ci], vills = World.villages.map((v, i) => ({ v, i })).filter(x => x.v.civ === ci && !x.v.free);
    if (!vills.length) return '';
    const rows = vills.map(({ v, i }) => {
      if (v.lord === 'player') return `<div class="crow2">🏘️ <b>${this.esc(v.name)}</b> <small class="ok">você é o chefe</small></div>`;
      const need = Chiefdom.askNeed(i), wait = G.askDay && (G.askDay[i] || 0) > G.day;
      const ok = !c.atWar && c.relation >= need.rel && P.gold >= need.gold && !wait;
      return `<div class="crow2">🏘️ <b>${this.esc(v.name)}</b> <small class="muted">${People.residents(i).length} moradores · exige relação ${need.rel}+${wait ? ' · recusou até ' + Calendar.text(G.askDay[i]) : ''}</small>
        <button data-act="vask" data-v="${i}" ${ok ? '' : 'disabled'}>📜 Pedir a chefia — ${need.gold} 🪙</button></div>`;
    }).join('');
    return `<div class="card" style="margin-top:10px"><div class="sec">🏘️ Chefia das vilas <span>o chefe manda nas estradas e nos imóveis da vila</span></div>${rows}
      <small class="muted">Também dá para virar chefe fundando uma vila (Portfólio → Vilas e guardas) ou pela força: converse com o chefe da vila e desafie-o. Atacar uma vila não é guerra com a coroa: o rei decide se foi uma afronta.</small></div>`;
  },
  relBar(c) { return `<b>${Math.round(c.relation)}</b> ${Game.relationText(c)}`; },

  showMap() {
    if (G.dungeon) { this.msg('O mapa não funciona dentro das cavernas.', 'bad'); return; }
    this.panel.classList.add('hidden');
    this.cur = { fn: 'showMap', args: [] };
    G.paused = true;
    MapView.show();
  },

  showHelp() { this.open('❓ Como jogar', HELP_HTML, 'showHelp'); },

  // ------------------------------------------------------------ ações
  // ------------------------------------------------------------ escolha de profissão dos filhos
  showProf(id) {
    const p = People.get(id);
    const rows = Object.entries(PROFESSIONS).map(([k, pr]) => {
      const no = k === 'governor' && !G.civs.some(c => c.ruler === 'player');
      return `<button class="rrow ${p.prof === k ? 'on' : ''}" data-act="tk" data-op="setprof" data-k="${k}" data-id="${id}" ${no ? 'disabled title="Você precisa governar um reino"' : ''}>
        <span class="ri">${pr.icon}</span><span><b>${p.sex === 'f' ? pr.f : pr.name}</b><small>${pr.desc}</small></span><span class="rs ${no ? 'mat' : 'ok'}">${p.prof === k ? 'Atual' : no ? 'Sem reino' : 'Escolher'}</span></button>`;
    }).join('');
    this.open('🎓 Profissão de ' + this.esc(p.name), `<p>Que caminho ${this.esc(p.name)} deve seguir? Cada profissão ajuda a família de um jeito.</p>
      <div class="list">${rows}</div><div class="btns"><button data-act="tk" data-op="open" data-id="${id}">← Voltar à conversa</button></div>`, 'showProf', [id]);
  },

  // ------------------------------------------------------------ galinheiro, curral e colmeia
  showAnimals(sid) {
    const s = World.structs[sid], cap = Farm.cap(s), a = s.animals || {}, g = s.goods || {};
    const names = { chicken: ['🐔', 'Galinha', 'põe 1 ovo por mês'], cow: ['🐄', 'Vaca', 'dá 1 leite por mês'], sheep: ['🐑', 'Ovelha', 'dá 2 lãs a cada 2 meses'] };
    const animals = Object.keys(cap).map(k => `<div class="crow"><span class="ri">${names[k][0]}</span><span><b>${names[k][1]} — ${a[k] || 0}/${cap[k]}</b><small>${names[k][2]}</small></span>
      <span class="act-row"><button class="primary" data-act="buyanimal" data-s="${sid}" data-k="${k}" ${P.gold >= ANIMAL_PRICES[k] && (a[k] || 0) < cap[k] ? '' : 'disabled'}>Comprar — ${ANIMAL_PRICES[k]} 🪙</button></span></div>`).join('');
    const goods = Object.keys(g).filter(k => g[k] > 0);
    const title = { coop: '🐔 Galinheiro', pen: '🐄 Curral', beehive: '🐝 Colmeia' }[s.type];
    this.open(title, `${s.type === 'beehive' ? '<p>As abelhas produzem 1 mel por mês (menos no inverno).</p>' : `<div class="list">${animals}</div>`}
      <div class="card" style="margin-top:10px"><div class="sec">Produção guardada</div>
        <div class="chips">${goods.length ? goods.map(k => `<span class="chip">${ITEMS[k].icon} ${g[k]} ${ITEMS[k].name}</span>`).join('') : '<span class="muted">Nada ainda — volte amanhã.</span>'}</div>
        <div class="act-row" style="margin-top:8px"><button class="primary" data-act="collect" data-s="${sid}" ${goods.length ? '' : 'disabled'}>🧺 Recolher tudo</button></div></div>
      <small class="muted">${Season.winter() ? '❄️ No inverno os animais produzem menos.' : 'A produção acontece a cada amanhecer.'}</small>`, 'showAnimals', [sid], 'Sua criação de animais');
  },

  // ------------------------------------------------------------ taverna do jogador
  ptStock(s, k, q) {
    s.stock = s.stock || {};
    const n = q === 'all' ? Inv.count(k) : Math.min(+q, Inv.count(k));
    if (n <= 0) return;
    Inv.add(k, -n); s.stock[k] = (s.stock[k] || 0) + n;
  },
  showPTavern(sid) {
    const s = World.structs[sid], st = s.stock || {};
    const sellable = Object.keys(P.inv).filter(k => ITEMS[k].cat === 'Comida' && (ITEMS[k].buff || ['bread', 'cooked_meat', 'cooked_fish', 'veg_soup'].includes(k)));
    const row = k => `<div class="crow"><span class="ri">${ITEMS[k].icon}</span><span><b>${ITEMS[k].name}</b><small>×${P.inv[k]} · rende ~${Math.round(ITEMS[k].price * (ITEMS[k].buff ? 1.5 : 1.2))} 🪙 cada</small></span>
      <span class="act-row">${['1', '5', 'all'].map(q => `<button data-act="ptstock" data-s="${sid}" data-k="${k}" data-q="${q}">→ ${q === 'all' ? 'Tudo' : q}</button>`).join('')}</span></div>`;
    const stocked = Object.keys(st).filter(k => st[k] > 0);
    const civ = World.terr[World.idx(s.x, s.y)];
    this.open('🍻 Sua Taverna', `<div class="chest-layout">
      <div class="card col"><div class="sec">Da mochila <span>comidas e bebidas</span></div>
        <div class="scroll" data-scroll="ptinv">${sellable.length ? sellable.map(row).join('') : '<p class="muted">Cozinhe pratos no Forno ou fabrique cerveja, hidromel e vinho na Cervejaria.</p>'}</div></div>
      <div class="card col"><div class="sec">No balcão <span>${stocked.reduce((a, k) => a + st[k], 0)} itens</span></div>
        <div class="scroll">${stocked.length ? stocked.map(k => `<div class="crow"><span class="ri">${ITEMS[k].icon}</span><span><b>${ITEMS[k].name}</b><small>×${st[k]}</small></span></div>`).join('') : '<p class="muted">Balcão vazio.</p>'}</div>
        <div class="kv"><div>Caixa<b>${s.till || 0} 🪙</b></div><div>Fregueses/dia<b>${civ >= 0 ? 8 : 4}</b></div></div>
        <div class="act-row"><button class="primary" data-act="ptcollect" data-s="${sid}" ${(s.till || 0) > 0 ? '' : 'disabled'}>🪙 Recolher o caixa</button></div></div></div>
      <small class="muted">A cada amanhecer os fregueses compram o que está no balcão (os itens mais caros primeiro). Tavernas dentro de um reino vendem o dobro e melhoram a relação com ele.</small>`, 'showPTavern', [sid], 'Venda seus pratos e bebidas');
  },

  // ------------------------------------------------------------ caravana de comércio
  showCaravan(e) {
    const c = e.car;
    if (!c) return;
    this.open('🐫 Caravana de ' + Diplo.name(c.from), `<p>Uma caravana mercante de <b>${Diplo.name(c.from)}</b> segue pela estrada rumo a <b>${Diplo.name(c.to)}</b>.</p>
      <div class="card"><div class="sec">Carga</div><div class="chips">${c.goods.map(x => `<span class="chip">${ITEMS[x.k].icon} ${x.n} ${ITEMS[x.k].name}</span>`).join('')}</div></div>
      <div class="kgrid two" style="margin-top:10px">
        <div class="card"><div class="sec">🛡️ Escoltar</div><p class="dt-desc">Acompanhe a caravana de perto. Se bandidos atacarem e ela chegar ao destino em segurança, o reino paga uma recompensa.</p>
          <small class="muted">Tempo escoltando: ${Math.floor(c.escort)} s</small>
          <div class="act-row"><button class="primary" data-act="close">Vou proteger vocês!</button></div></div>
        <div class="card"><div class="sec">🏴 Assaltar</div><p class="dt-desc">Ataque os guardas e saqueie a carga e o ouro. A relação com ${Diplo.name(c.from)} cai muito.</p>
          <div class="act-row"><button class="danger" data-act="carrob" data-c="${c.id}">Assaltar a caravana</button></div></div></div>`, 'showCaravan', [e], 'Comércio entre os reinos');
  },

  // ------------------------------------------------------------ batalha em campo aberto
  showBattle(b) {
    const side = (c, opp) => `<div class="card"><div class="sec" style="color:${Game.civColor(c)}">${Diplo.name(c)}</div>
      <p class="dt-desc">${b.size[c]} soldados · relação com você: <b>${G.civs[c].ruler === 'player' ? 'seu reino' : Math.round(G.civs[c].relation)}</b></p>
      <div class="act-row"><button class="primary" data-act="batjoin" data-b="${b.id}" data-side="${c}">⚔️ Lutar por ${CIV_DEFS[c].short}</button></div>
      <small class="muted">Se vencer: ouro, experiência e +15 de relação. ${Diplo.name(opp)} perde 20 de relação com você.</small></div>`;
    this.open('⚔️ Batalha em campo aberto', `<p>Os exércitos de <b>${Diplo.name(b.a)}</b> e <b>${Diplo.name(b.b)}</b> estão prestes a se enfrentar aqui perto!</p>
      <div class="kgrid two">${side(b.a, b.b)}${side(b.b, b.a)}</div>
      <p class="muted">Seus capangas lutam com você. Use <b>T</b> para mudar a ordem (seguir, atacar, aguardar), clique com o botão direito para <b>bloquear</b>, <b>Z</b> para esquivar, segure o clique para bater sem parar e segure <b>V</b> para um <b>golpe forte</b>.</p>
      <div class="act-row"><button data-act="batjoin" data-b="${b.id}" data-side="none">Ficar de fora</button></div>`, 'showBattle', [b], 'Escolha um lado ou fique neutro');
  },

  // ------------------------------------------------------------ diário do herói
  // Diário do Herói: menu de ícones à esquerda; nas telas pequenas em páginas de arrastar, no computador tudo numa página
  showDiary() { this.showDiaryM(); },

  // cada seção do diário em quadros (o paginador arruma: páginas nas telas pequenas, grade no computador)
  showDiaryM() {
    const S = this.sel, st = G.stats || {};
    const tab = ['ach', 'stats', 'dyn', 'contas', 'log'].includes(S.dtab) ? S.dtab : 'ach';
    const got = ACHIEVEMENTS.filter(a => G.ach[a.id]);
    const groups = [['', [['ach', '🏆', 'Conquistas', got.length], ['stats', '📊', 'Estatísticas'], ['dyn', '🌳', 'Dinastia'], ['contas', '📒', 'Contas'], ['log', '📜', 'Diário']]]];
    const tile = (ic, label, val, hue) => `<div class="dy-st" style="--hue:${hue}"><span class="dy-ic">${ic}</span><b>${val || 0}</b><small>${label}</small></div>`;
    let page = '';
    if (tab === 'ach') {
      const pct = Math.round(got.length / ACHIEVEMENTS.length * 100);
      const last = got.slice().sort((a, b) => G.ach[b.id] - G.ach[a.id]).slice(0, 3);
      const next = ACHIEVEMENTS.filter(a => !G.ach[a.id]).slice(0, 3);
      const mini = (a, on) => `<div class="dy-mini ${on ? 'got' : ''}"><span>${a.icon}</span><div><b>${a.name}</b><small>${on ? Calendar.short(G.ach[a.id]) : a.desc}</small></div></div>`;
      page = this.pageHead('🏆', 'Conquistas', `${got.length} de ${ACHIEVEMENTS.length} desbloqueadas`)
        + `<div class="card dy-ach-top kalone"><div class="dy-ring" style="--p:${pct}"><div><b>${got.length}</b><small>de ${ACHIEVEMENTS.length}</small></div></div>
          <div class="dy-ach-side"><div class="sec">${last.length ? 'Últimas conquistas' : 'Comece por aqui'}</div>${(last.length ? last.map(a => mini(a, true)) : next.map(a => mini(a, false))).join('')}</div></div>
        <div class="card dy-ach"><div class="sec">Todas as conquistas <span>${pct}%</span></div><div class="dy-grid">${ACHIEVEMENTS.slice().sort((a, b) => !!G.ach[b.id] - !!G.ach[a.id]).map(a =>
          `<div class="dy-a ${G.ach[a.id] ? 'got' : ''}"><span class="dy-medal">${a.icon}</span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`).join('')}</div></div>`;
    } else if (tab === 'stats') {
      const kills = Object.keys(st).filter(k => k.startsWith('kill_')).reduce((a, k) => a + st[k], 0);
      const card = (title, items) => `<div class="card dy-stats kalone"><div class="sec">${title}</div><div class="dy-sgrid">${items.map(x => tile(...x)).join('')}</div></div>`;
      page = this.pageHead('📊', 'Estatísticas', 'Tudo o que você já fez nesta vida')
        + card('⚒️ Trabalho', [['🪓', 'árvores cortadas', st.trees, 30], ['⛏️', 'rochas quebradas', st.ores, 220], ['🌿', 'plantas colhidas', st.plants, 110], ['🎣', 'peixes pescados', st.fish, 200],
          ['🌱', 'sementes plantadas', st.planted, 95], ['🌾', 'alimentos colhidos', st.harvested, 45], ['🔨', 'itens criados', st.crafted, 25], ['🏗️', 'construções', st.built, 15]])
        + card('⚔️ Combate', [['⚔️', 'abatidos', kills, 0], ['🗡️', 'bandidos derrotados', st.kill_bandit, 350], ['☠️', 'chefes derrotados', st.bosses, 280], ['🏕️', 'acampamentos destruídos', st.camps, 20],
          ['🛡️', 'golpes bloqueados', st.blocks, 210], ['🏆', 'batalhas vencidas', st.battlesWon, 45], ['🐫', 'caravanas salvas', st.caravansSaved, 120], ['🏴', 'caravanas saqueadas', st.caravansRobbed, 0]])
        + card('🍻 Vida', [['💰', 'baús abertos', st.chests, 45], ['🍺', 'bebidas tomadas', st.drinks, 35], ['🍻', 'lucro da taverna', st.tavernGold, 40], ['💍', 'casamentos', st.marriages, 330],
          ['👶', 'filhos', st.children, 300], ['🌟', 'nível', P.level, 50], ['📅', 'meses vividos', G.day, 260], ['🪙', 'ouro agora', P.gold, 45]]);
    } else if (tab === 'dyn') {
      const kids = G.people.filter(p => p.kin === 'child');
      const heroes = [...(G.dynasty || []), { name: G.name, sex: P.sex, age: P.age, level: P.level, cur: true, kingdoms: G.civs.filter(c => c.ruler === 'player').map(c => CIV_DEFS[c.id].short) }];
      page = this.pageHead('🌳', 'Dinastia', `Casa ${this.esc(G.surname)} · ${heroes.length}ª geração`)
        + `<div class="card dy-gens kalone"><div class="sec">Gerações <span>${heroes.length}</span></div><div class="dy-line">${heroes.map((h, i) => `<div class="dy-gen ${h.cur ? 'cur' : ''}">
            <span class="dy-face">${h.cur ? '🛡️' : '✝'}</span><b>${this.esc(h.name)}</b><small>${i + 1}ª geração · nível ${h.level}</small><small>${h.cur ? `herói atual · ${h.age} anos` : `morreu ${this.esc(h.cause || '')} aos ${h.age}`}</small>${h.kingdoms && h.kingdoms.length ? `<em>👑 ${h.kingdoms.join(', ')}</em>` : ''}</div>`).join('<span class="dy-arrow">›</span>')}</div>
          <div class="dy-facts"><span>📅 <b>${G.day}</b> ${G.day === 1 ? "mês" : "meses"}</span><span>🗓️ ${Calendar.full(G.day)}</span><span>👑 <b>${G.civs.filter(c => c.ruler === 'player').length}</b> reinos</span><span>🪙 <b>${P.gold}</b></span><span>⚖️ ${DIFFICULTY[G.diff || 'normal'].name}</span></div></div>
        <div class="card dy-kids kalone"><div class="sec">Filhos <span>${kids.filter(k => k.alive).length} vivos · eles herdam tudo se você morrer</span></div>${kids.length ? `<div class="dy-kgrid">${kids.map(k => `<div class="dy-kid ${k.sex} ${k.alive ? '' : 'dead'}">
            <span class="dy-face">${!k.alive ? '✝' : k.prof ? PROFESSIONS[k.prof].icon : k.age < 14 ? (k.sex === 'm' ? '👦' : '👧') : (k.sex === 'm' ? '👨' : '👩')}</span><div><b>${this.esc(k.name)}</b><small>${k.age} anos · ${k.prof ? (k.sex === 'f' ? PROFESSIONS[k.prof].f : PROFESSIONS[k.prof].name) : k.age >= 12 ? 'sem profissão' : 'criança'}</small></div>
            ${k.alive ? `<button data-act="tk" data-op="open" data-id="${k.id}">💬</button>` : ''}</div>`).join('')}</div>` : '<div class="dy-empty"><span>👶</span><b>Nenhum filho ainda</b><small>Case-se e tenha filhos para a casa continuar depois de você.</small></div>'}</div>`;
    } else if (tab === 'contas') {
      const L = G.ledger || [], last = L.slice(0, 12).reverse(), max = Math.max(1, ...last.map(e => Math.abs(e.gold)));
      const inG = L.reduce((a, e) => a + Math.max(0, e.gold), 0), outG = L.reduce((a, e) => a + Math.min(0, e.gold), 0);
      page = this.pageHead('📒', 'Contas', 'Impostos, soldos, salários, colheitas e vendas de cada mês')
        + `<div class="card dy-chart kalone"><div class="sec">Últimos meses <span>${L.length} registrados</span></div>
          ${L.length ? `<div class="dy-bars">${last.map(e => `<div class="dy-bar ${e.gold < 0 ? 'neg' : 'pos'}" title="${Calendar.short(e.day)}"><i style="height:${Math.max(3, Math.abs(e.gold) / max * 100)}%"></i><small>${Calendar.short(e.day).split(' ')[0]}</small></div>`).join('')}</div>` : '<div class="dy-empty"><span>📒</span><b>Nenhum mês fechado ainda</b><small>Todo mês o resumo da sua economia aparece aqui.</small></div>'}
          <div class="dy-facts"><span class="ok">▲ <b>+${inG}</b> 🪙 ganhos</span><span class="bad">▼ <b>${outG}</b> 🪙 gastos</span><span>= <b class="${inG + outG < 0 ? 'bad' : 'ok'}">${inG + outG > 0 ? '+' : ''}${inG + outG}</b> 🪙 saldo</span></div></div>
        ${L.length ? `<div class="card dy-ledger"><div class="sec">Mês a mês</div><div class="dy-months">${L.map(e => `<div class="dy-month"><span class="dy-date">${Calendar.short(e.day)}</span>
            <b class="${e.gold < 0 ? 'bad' : e.gold > 0 ? 'ok' : ''}">${e.gold > 0 ? '+' : ''}${e.gold} 🪙</b><small>${[...e.got.slice(0, 3), ...e.notes.slice(0, 2)].map(x => this.esc(x)).join(' · ') || '—'}</small></div>`).join('')}</div></div>` : ''}`;
    } else {
      const D = G.diary || [];
      page = this.pageHead('📜', 'Diário', `${D.length} anotações da sua jornada`)
        + (D.length ? `<div class="card dy-log"><div class="sec">Sua história</div><div class="dy-entries">${D.map(e => `<div class="dy-entry"><span class="dy-date">${Calendar.short(e.day)}</span><span>${this.esc(e.text)}</span></div>`).join('')}</div></div>`
          : '<div class="card dy-log kalone"><div class="dy-empty"><span>📜</span><b>Nada escrito ainda</b><small>Casamentos, filhos, títulos e grandes feitos ficam anotados aqui.</small></div></div>');
    }
    this.open('Diário do Herói', `<div class="iconnav dy">${this.navHtml(groups, tab, 'dnav', `<div class="kpg">${page}</div>`)}</div>`, 'showDiary', [],
      `${this.esc(G.name)} · ${Object.keys(G.ach || {}).length} conquistas · ${(G.dynasty || []).length + 1}ª geração`);
    this.fitReino('d:' + tab, 'diary/' + tab);
  },

  trendIcon(ci, k) { const t = Market.trend(ci, k); return t === 'up' ? ' <span class="bad" title="Preço alto: escassez">▲</span>' : t === 'down' ? ' <span class="ok" title="Preço baixo: fartura">▼</span>' : ''; },

  // ------------------------------------------------------------ títulos de nobreza (no castelo)
  titleCard(ci) {
    const t = Court.T(), r = Court.nextReq(ci);
    const cur = t.lvl >= 0 ? `${Court.title().icon} Você é <b>${this.esc(Court.titleName())}</b>.` : 'Você ainda não tem título de nobreza.';
    if (!r) return `<div class="card" style="margin-top:10px"><div class="sec">⚜️ Títulos de nobreza</div><p>${cur} Não há título mais alto para conceder.</p></div>`;
    const other = t.lvl >= 0 && t.civ !== ci ? `<p class="bad">Você serve a ${CIV_DEFS[t.civ].short}. Jurar lealdade a ${CIV_DEFS[ci].short} começa do primeiro título.</p>` : '';
    return `<div class="card" style="margin-top:10px"><div class="sec">⚜️ Títulos de nobreza <span>serviços prestados aqui: ${Court.service(ci)} · fama ${Court.fame()}</span></div>
      <p>${cur}</p>${other}
      <div class="titles">${NOBLE_TITLES.map((nt, i) => `<span class="tchip ${t.civ === ci && t.lvl >= i ? 'on' : ''}">${nt.icon} ${P.sex === 'f' ? nt.f : nt.m}</span>`).join('<span class="tarrow">→</span>')}</div>
      <div class="sec" style="margin-top:8px">Próximo: ${r.t.icon} ${P.sex === 'f' ? r.t.f : r.t.m}</div>
      <div class="req">${r.checks.map(([lab, ok, v]) => `<div class="req-row"><span>${ok ? '✔' : '✖'}</span><span>${lab}</span><b class="${ok ? 'ok' : 'bad'}">${v}</b></div>`).join('')}</div>
      <p class="dt-desc">Vantagens: ${r.t.perks}.</p>
      <small class="muted">Serviços: caçar bandidos no reino, salvar caravanas, vencer batalhas e torneios, esmagar revoltas, tributos e doações às igrejas.</small>
      <div class="act-row"><button class="primary" data-act="title" data-c="${ci}" ${r.checks.every(x => x[1]) ? '' : 'disabled'}>${r.t.icon} Pedir o título</button></div></div>`;
  },

  // ------------------------------------------------------------ conselho real
  councilHtml(ci) {
    const S = this.sel, plots = Court.plotsOf(ci), c = G.civs[ci];
    let h = plots.map(pl => { const p = G.people[pl.pid]; return `<div class="alert">🗡️ <b>${this.esc(People.full(p))}</b> (${COUNCIL[pl.seat].m}) conspira contra você!
      <div class="act-row"><button data-act="judge" data-p="${pl.id}" data-v="pardon">🤝 Perdoar</button><button data-act="judge" data-p="${pl.id}" data-v="exile">🚪 Banir</button><button class="danger" data-act="judge" data-p="${pl.id}" data-v="execute">⚔️ Executar</button></div></div>`; }).join('');
    h += `<p class="muted">Cada conselheiro é uma pessoa do reino, com competência ⭐ e lealdade próprias (a amizade com você). Conselheiros desleais podem conspirar; o espião-mor descobre corruptos e traidores.${c.stolen && Court.member(ci, 'spy') ? ` Desvios descobertos até agora: ${c.stolen} 🪙.` : ''}</p><div class="kgrid two">`;
    for (const seat in COUNCIL) {
      const d = COUNCIL[seat], p = Court.member(ci, seat);
      h += `<div class="card"><div class="sec">${d.icon} ${d.m}</div>`;
      if (p) {
        const loyal = Math.round(p.aff);
        h += `<div class="crow2">${this.personLine(p, Families.of(p) ? 'Casa ' + Families.of(p).surname : '')}</div>
          <div class="kv"><div>Competência<b>${'⭐'.repeat(Math.ceil(p.comp / 2))} ${p.comp}</b></div><div>Lealdade<b class="${loyal < 15 ? 'bad' : loyal > 50 ? 'ok' : ''}">${loyal}</b></div>${p.exposed ? '<div>Situação<b class="bad">CORRUPTO</b></div>' : ''}</div>
          <div class="act-row"><button data-act="tk" data-op="open" data-id="${p.id}">💬 Falar</button><button data-act="cdismiss" data-c="${ci}" data-s="${seat}">Dispensar</button></div>`;
      } else h += `<p class="muted">Cargo vago.</p>`;
      h += `<small class="muted">${d.desc}</small>`;
      if (S.cseat === seat) {
        h += '<div class="sec" style="margin-top:8px">Candidatos</div>' + Court.candidates(ci).map(q => `<div class="crow"><span class="ri">${q.sex === 'm' ? '👨' : '👩'}</span><span><b>${this.esc(People.full(q))}</b><small>${People.title(q)}, ${q.age} anos · ⭐ ${q.comp} · lealdade ${Math.round(q.aff)}</small></span>
          <span class="act-row"><button class="primary" data-act="appoint" data-c="${ci}" data-s="${seat}" data-id="${q.id}">Nomear</button></span></div>`).join('');
      } else h += `<div class="act-row"><button data-act="cpick" data-s="${seat}">${p ? 'Trocar' : 'Nomear alguém'}</button></div>`;
      h += '</div>';
    }
    return h + '</div>';
  },

  // ------------------------------------------------------------ casamentos arranjados
  showMatch(id) {
    const ch = People.get(id), list = Court.marriageable(ch);
    const rows = list.map(({ p, kind }) => {
      const f = Families.of(p), civ = Families.civOf(p);
      return `<div class="crow"><span class="ri">${kind === 'royal' ? '👑' : '🏛️'}</span><span><b>${this.esc(People.full(p))}</b><small>${People.title(p)}, ${p.age} anos · ${civ >= 0 ? CIV_DEFS[civ].short : ''} · ${kind === 'royal' ? 'aliança entre reinos' : (f ? 'Casa ' + this.esc(f.surname) + ' · lealdade +35' : '')}${f && f.rival === G.playerFam ? ' · fim da rivalidade' : ''}</small></span>
        <span class="act-row"><button class="primary" data-act="domatch" data-id="${id}" data-q="${p.id}" ${P.gold >= 150 ? '' : 'disabled'}>💒 Casar — 150 🪙</button></span></div>`;
    }).join('') || '<p class="muted">Nenhum pretendente disponível agora. Herdeiros reais só aceitam filhos de reis e duques.</p>';
    this.open(`💒 Casamento para ${this.esc(ch.name)}`, `<p>Escolha com quem ${this.esc(ch.name)} vai se casar. ${ch.sex === 'm' ? 'A noiva virá morar com a sua família e levará o sobrenome ' + this.esc(G.surname) + '.' : 'Ela assumirá o sobrenome do marido e irá morar com ele, mas continua sendo sua herdeira.'}</p>
      <div class="list">${rows}</div><div class="btns"><button data-act="kview" data-v="casa">← Voltar</button></div>`, 'showMatch', [id]);
  },


  // ------------------------------------------------------------ igreja
  showChapel(sid) {
    const s = World.structs[sid], vi = s.village, v = World.villages[vi], ci = s.type === 'cathedral' ? s.owner : v ? v.civ : -1;
    const priest = vi !== undefined ? Faith.priestOf(vi) : null;
    const dating = G.people.find(p => p.alive && p.dating);
    const babies = G.people.filter(p => p.alive && p.kin === 'child' && !p.baptized);
    const shr = World.shrines || [];
    const h = `<div class="card hero-card"><div class="hc-ic">⛪</div><div><b>${s.type === 'cathedral' ? 'Catedral de ' + CIV_DEFS[ci].short : 'Capela de ' + this.esc(v.name)}</b><br>
        <span class="muted">${priest ? `${People.title(priest)} ${this.esc(People.full(priest))} cuida da igreja.` : 'O bispo celebra a missa.'} · sua devoção: 🙏 ${Faith.piety()}</span></div></div>
      <div class="kgrid two">
        <div class="card"><div class="sec">🙏 Fé</div><div class="btns col">
          <button data-act="pray" ${G.prayDay === G.day ? 'disabled' : ''}>🙏 Rezar (uma vez por mês · Bênção)</button>
          <button data-act="bless">✨ Pedir a bênção do padre — ${Faith.piety() >= 50 ? 'grátis' : '40 🪙'} (Graça Divina)</button>
          <div class="act-row">${[10, 50, 200].map(n => `<button data-act="donate" data-c="${ci}" data-n="${n}" ${P.gold >= n ? '' : 'disabled'}>💛 Doar ${n}</button>`).join('')}</div></div>
          <small class="muted">Doações aumentam a devoção, a felicidade do reino e contam como serviço prestado para títulos.</small></div>
        <div class="card"><div class="sec">💒 Sacramentos</div>
          ${dating ? (Faith.canWed(dating) ? `<button class="primary" data-act="cwed" data-id="${dating.id}" data-v="${vi}" ${P.gold >= 80 && vi !== undefined ? '' : 'disabled'}>💒 Casar com ${this.esc(dating.name)} aqui — 80 🪙 (sem anel)</button>` : `<p class="muted">Para casar na igreja com ${this.esc(dating.name)}, o romance precisa chegar a 70 (agora ${Math.round(dating.rom)}).</p>`) : '<p class="muted">Namore alguém para poder casar na igreja.</p>'}
          ${babies.map(b => `<button data-act="baptize" data-id="${b.id}">💧 Batizar ${this.esc(b.name)}</button>`).join('')}
          <div class="sec" style="margin-top:10px">🕯️ Peregrinações</div>
          ${shr.map((x, i) => `<div class="crow2">${G.shrines && G.shrines[x.shrine] ? '✔' : '🕯️'} <b>${this.esc(x.sname)}</b> <small class="muted">${Math.round(U.dist(P.x / TILE, P.y / TILE, x.x, x.y))} passos</small> ${G.shrines && G.shrines[x.shrine] ? '<small class="ok">visitado</small>' : `<button data-act="pilgrim" data-i="${i}">Partir</button>`}</div>`).join('')}
          <small class="muted">Cada santuário visitado dá +15 de vida máxima para sempre.</small></div></div>`;
    this.open('Igreja', h, 'showChapel', [sid], 'Fé, sacramentos e peregrinações');
  },

  // ------------------------------------------------------------ arena e torneios
  showArena(ci) {
    const tr = Arena.tourney(), card = Arena.fightCard(ci), horse = !!P.horse;
    const bet = `<label class="betbox">Aposta: <select id="betAmt">${[0, 25, 50, 100, 250, 500].filter(n => n <= P.gold).map(n => `<option value="${n}">${n} 🪙</option>`).join('')}</select></label>`;
    const tiers = ARENA_TIERS.map((t, i) => `<div class="crow"><span class="ri">${['🥉', '🥈', '🥇'][i]}</span><span><b>${t.name}</b><small>prêmio ${t.prize} 🪙 · aposta paga ${t.odds}× · +${t.fame} fama · recomendado nível ${t.lvl}+</small></span>
      <span class="act-row"><button class="primary" data-act="duel" data-c="${ci}" data-t="${i}">⚔️ Duelo</button><button data-act="joust" data-c="${ci}" data-t="${i}" ${horse ? '' : 'disabled title="Precisa de cavalo"'}>🐎 Justa</button></span></div>`).join('');
    const h = `<div class="card hero-card"><div class="hc-ic">🏟️</div><div><b>Arena de ${CIV_DEFS[ci].name}</b><br><span class="muted">Sua fama: 🌟 ${Court.fame()} · ouro ${P.gold} 🪙. Na arena ninguém morre: quem cai primeiro perde.</span></div></div>
      ${tr ? `<div class="alert gold">🏟️ Grande Torneio em ${CIV_DEFS[tr.ci].short} até ${Calendar.text(tr.until)}! ${tr.ci === ci ? (tr.won ? 'Você é o campeão deste ano!' : tr.out ? 'Você já foi eliminado.' : `<button class="primary" data-act="tourney" data-c="${ci}" ${P.gold >= 50 ? '' : 'disabled'}>Inscrever-se — 50 🪙 (3 lutas, prêmio 500 🪙)</button>`) : 'Vá até lá para competir.'}</div>` : ''}
      <div class="kgrid two"><div class="card"><div class="sec">⚔️ Lutar</div>${bet}${tiers}
        <small class="muted">Justa: três passadas a cavalo. Clique em "Golpear" quando a marca passar pelo centro dourado.</small></div>
        <div class="card"><div class="sec">💰 Apostar na luta de hoje</div>
          ${card.done ? '<p class="muted">A luta de hoje já aconteceu. Volte amanhã.</p>' : `<p><b>${this.esc(card.a.name)}</b> (paga ${card.a.odds}×) contra <b>${this.esc(card.b.name)}</b> (paga ${card.b.odds}×)</p>
          <div class="act-row"><button data-act="betfight" data-c="${ci}" data-s="a">Apostar em ${this.esc(card.a.name.split(' ')[0])}</button><button data-act="betfight" data-c="${ci}" data-s="b">Apostar em ${this.esc(card.b.name.split(' ')[0])}</button></div>
          <small class="muted">Use o valor escolhido em "Aposta".</small>`}</div></div>`;
    this.open('Arena', h, 'showArena', [ci], 'Duelos, justas, torneios e apostas');
  },
  showJoust() {
    const j = G.joust;
    if (!j) return;
    const t = ARENA_TIERS[j.tier];
    const h = `<p>Justa contra <b>${this.esc(j.foeName)}</b> (${t.name}). Placar: você <b>${j.me}</b> × <b>${j.foe}</b> ${this.esc(j.foeName.split(' ')[0])} · passada ${Math.min(3, j.pass + 1)}/3</p>
      <div class="joust"><div class="jbar"><i class="jzone"></i><i class="jzone2"></i><i class="jmark" id="jMark"></i></div></div>
      <div class="list">${j.log.map(l => `<div class="crow2">${this.esc(l)}</div>`).join('')}</div>
      ${j.over ? `<div class="alert ${j.result.startsWith('🏆') ? 'gold' : ''}">${this.esc(j.result)}</div><div class="act-row"><button class="primary" data-act="close">Sair</button><button onclick="UI.showArena(${j.ci})">Voltar à arena</button></div>`
        : `<div class="act-row"><button class="primary big" data-act="jstrike">🐎 Golpear! (Espaço)</button></div>`}`;
    this.open('🐎 Justa', h, 'showJoust', []);
    const loop = () => {
      const m = document.getElementById('jMark');
      if (!m || !G.joust || G.joust.over || !this.cur || this.cur.fn !== 'showJoust') return;
      m.style.left = (Arena.joustPos() * 100) + '%';
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  // ------------------------------------------------------------ árvore genealógica e mapa de relações
  showTree(fid, inKingdom) {
    const S = this.sel; S.ttab = S.ttab || 'arvore';
    if (inKingdom) { S.knav = 'tree'; this.showKingdom(); return; }
    S.treeFam = fid; S.treeInK = false;
    const f = Families.get(fid) || Families.ensurePlayer();
    this.open('Linhagem', this.treeBody(f), 'showTree', [fid], `${this.esc(Families.name(f))} — linhagem e relações`);
    if (S.ttab === 'relacoes') this.drawRelMap(f);
  },
  // abas "árvore" e "relações" de uma família
  treeBody(f) {
    const S = this.sel; S.ttab = S.ttab || 'arvore';
    const tabs = `<div class="tabs">${[['arvore', '🌳 Árvore da família'], ['relacoes', '🕸️ Relações entre as casas']].map(([k, l]) => `<button class="tab ${S.ttab === k ? 'on' : ''}" data-act="ttab" data-t="${k}">${l}</button>`).join('')}</div>`;
    if (S.ttab === 'arvore') return tabs + `<div class="scroll" style="max-height:62vh"><div class="ftree">${this.treeHtml(f)}</div></div>`;
    const rel = Court.relationsOf(f);
    return tabs + `<div class="relmap-wrap"><canvas id="relMap" width="760" height="460"></canvas>
      <div class="rel-legend"><span><i style="background:#5fd35f"></i>Parentes por casamento</span><span><i style="background:#6fa8ff"></i>Aliados</span><span><i style="background:#e04848"></i>Rivais</span><small class="muted">Clique numa casa para ver os detalhes.</small></div>
      <div class="list">${rel.map(x => `<div class="crow2"><span style="color:${x.kind === 'rival' ? '#e04848' : x.kind === 'ally' ? '#6fa8ff' : '#5fd35f'}">${x.kind === 'rival' ? '😠 Rival' : x.kind === 'ally' ? '🤝 Aliada' : '💍 Parente'}</span> · <b>${this.esc(Families.name(x.f))}</b></div>`).join('') || '<p class="muted">Esta casa ainda não tem laços nem rivalidades.</p>'}</div></div>`;
  },
  // telas pequenas: 1) árvore por gerações · 2) laços com as outras casas · 3) mapa de relações
  lineageMobile(f) {
    const face = q => q.alive === false ? '✝' : q.age < 14 ? '🧒' : q.sex === 'f' ? '👩' : '👨';
    const node = (q, cls, sub) => `<div class="ln-node ${q.sex || ''} ${cls || ''}" ${typeof q.id === 'number' && q.alive ? `data-act="tk" data-op="open" data-id="${q.id}"` : ''}><span class="ln-face">${face(q)}</span><span class="ln-tx"><b>${this.esc(q.name)}</b><small>${sub}</small></span></div>`;
    const ghost = txt => `<div class="ln-node ghost"><span class="ln-face">＋</span><span class="ln-tx"><small>${txt}</small></span></div>`;
    const more = (list, max, fn) => list.slice(0, max).map(fn).join('') + (list.length > max ? `<div class="ln-more">+${list.length - max}</div>` : '');
    const sp = G.family.spouse !== null ? People.get(G.family.spouse) : null;
    const kids = G.people.filter(k => k.parents.includes('player') || k.kin === 'child');
    const kidIds = new Set(kids.map(k => k.id));
    const grand = G.people.filter(g => g.parents.some(id => kidIds.has(id)));
    const dyn = G.dynasty || [];
    const row = (label, inner) => `<div class="ln-gen"><span class="ln-lab">${label}</span><div class="ln-row">${inner}</div></div>`;
    const tree = `<div class="card ln-tree kalone"><div class="sec">🌳 Árvore da Casa ${this.esc(G.surname)} <span>${dyn.length + 1}ª geração</span></div><div class="ln-gens">
      ${row('Antes', dyn.length ? more(dyn.slice().reverse(), 4, (h, i) => node({ name: h.name, sex: h.sex, alive: false }, 'dead', `${dyn.length - i}ª geração · aos ${h.age}`)) : '<div class="ln-first">Você é a primeira geração da casa.</div>')}
      ${row('Você', node({ name: G.name + ' ' + G.surname, sex: P.sex }, 'hero', `${P.age} anos`) + '<span class="ln-ring">💍</span>' + (sp ? node(sp, '', `${sp.age} anos`) : ghost('Sem cônjuge')))}
      ${row('Filhos', kids.length ? more(kids, 4, k => node(k, '', `${k.age} anos${k.alive ? '' : ' · ✝'}`)) : ghost('Ainda sem filhos'))}
      ${grand.length ? row('Netos', more(grand, 4, g => node(g, '', `${g.age} anos`))) : ''}</div></div>`;
    const rel = Court.relationsOf(f);
    const col = (kind, ic, title, empty) => { const xs = rel.filter(x => x.kind === kind);
      return `<div class="ln-col ${kind}"><div class="ln-ch"><span>${ic}</span><b>${title}</b><em>${xs.length}</em></div>${xs.length ? more(xs, 4, x => `<button class="ln-house" data-act="famview" data-f="${x.f.id}"><i style="background:${x.f.color}"></i>${this.esc(Families.name(x.f))}</button>`) : `<small class="muted">${empty}</small>`}</div>`; };
    const ties = `<div class="card ln-ties kalone"><div class="sec">🤝 Laços da sua casa <span>toque numa casa</span></div><div class="ln-cols">
      ${col('kin', '💍', 'Parentes', 'Case-se ou case seus filhos com outra casa.')}${col('ally', '🤝', 'Aliados', 'Converse com alguém de outra casa e proponha uma aliança.')}${col('rival', '😠', 'Rivais', 'Converse com alguém e declare a casa dele inimiga.')}</div></div>`;
    const map = `<div class="card ln-map kalone"><div class="sec">🕸️ Mapa de relações <span class="ln-leg"><i style="background:#5fd35f"></i>parentes <i style="background:#6fa8ff"></i>aliados <i style="background:#e04848"></i>rivais</span></div>
      <div class="ln-cv"><canvas id="relMapM" width="900" height="300"></canvas></div></div>`;
    return `<div class="ln-m">${tree}${ties}${map}</div>`;
  },
  treeHtml(f) {
    const mem = Families.members(f, true);
    const ids = new Set(mem.map(p => p.id));
    const node = (p, depth) => {
      if (depth > 6) return '';
      const sp = typeof p.spouse === 'number' ? G.people[p.spouse] : null;
      const kids = G.people.filter(k => k.parents.includes(p.id) && (ids.has(k.id) || k.parents.length) && k.id !== p.id);
      const card = q => `<span class="tnode ${q.alive ? '' : 'dead'} ${q.sex}"><b>${this.esc(q.name)}</b><small>${q.alive ? `${q.age} anos · ${People.title(q)}` : '✝'}${q.maiden && q.maiden !== q.surname ? ' · nascid' + (q.sex === 'f' ? 'a ' : 'o ') + this.esc(q.maiden) : ''}</small></span>`;
      return `<li><div class="tcouple">${card(p)}${sp ? '<span class="tring">💍</span>' + card(sp) : ''}</div>${kids.length ? `<ul>${kids.map(k => node(k, depth + 1)).join('')}</ul>` : ''}</li>`;
    };
    if (f.player) {
      // a dinastia do jogador: heróis anteriores, o herói atual e os descendentes
      const heroes = (G.dynasty || []).map((h, i) => `<span class="tnode dead ${h.sex}"><b>${this.esc(h.name)}</b><small>${i + 1}ª geração · ✝ aos ${h.age}</small></span>`).join('<span class="tarrow">→</span>');
      const kids = G.people.filter(k => k.parents.includes('player') || k.kin === 'child' || k.kin === 'sibling');
      const sp = G.family.spouse !== null ? People.get(G.family.spouse) : null;
      return `${heroes ? `<div class="tline">${heroes}<span class="tarrow">→</span></div>` : ''}<ul class="troot"><li><div class="tcouple"><span class="tnode hero"><b>${this.esc(G.name)} ${this.esc(G.surname)}</b><small>você · ${P.age} anos</small></span>${sp ? '<span class="tring">💍</span><span class="tnode"><b>' + this.esc(sp.name) + '</b><small>' + sp.age + ' anos</small></span>' : ''}</div>
        ${kids.length ? `<ul>${kids.map(k => node(k, 1)).join('')}</ul>` : ''}</li></ul>`;
    }
    // raízes: membros cujos pais não estão na família (os fundadores e quem casou para dentro sem par)
    const inFam = q => q.parents.some(id => ids.has(id));
    const roots = mem.filter(p => {
      if (inFam(p)) return false;
      const sp = typeof p.spouse === 'number' && ids.has(p.spouse) ? G.people[p.spouse] : null;
      return !(sp && (inFam(sp) || sp.id < p.id)); // quem casou para dentro aparece ao lado do cônjuge
    });
    return `<ul class="troot">${roots.slice(0, 12).map(p => node(p, 0)).join('')}</ul>`;
  },
  drawRelMap(f, id) {
    const cv = document.getElementById(id || 'relMap');
    if (!cv) return;
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const rel = Court.relationsOf(f);
    const others = Families.ranking().map(x => x.f).filter(o => o !== f && !rel.some(r => r.f === o)).slice(0, Math.max(0, 12 - rel.length));
    const nodes = [{ f, x: W / 2, y: H / 2, main: true }, ...[...rel.map(r => r.f), ...others].map((o, i, a) => ({ f: o, x: W / 2 + Math.cos(i / a.length * Math.PI * 2 - Math.PI / 2) * (W * 0.38), y: H / 2 + Math.sin(i / a.length * Math.PI * 2 - Math.PI / 2) * (H * 0.38) }))];
    g.clearRect(0, 0, W, H);
    const edge = (a, b, kind) => { g.strokeStyle = kind === 'rival' ? '#e04848' : kind === 'ally' ? '#6fa8ff' : '#5fd35f'; g.lineWidth = 2.5; g.setLineDash(kind === 'rival' ? [8, 6] : []); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.setLineDash([]); };
    // laços de todas as casas mostradas
    for (const a of nodes) for (const r of Court.relationsOf(a.f)) { const b = nodes.find(n => n.f === r.f); if (b && a.f.id < b.f.id) edge(a, b, r.kind); }
    for (const n of nodes) {
      const r = n.main ? 30 : 20;
      g.fillStyle = n.f.player ? PLAYER_COLOR : n.f.color; g.beginPath(); g.arc(n.x, n.y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = n.f.noble ? '#ffd54a' : '#1a1208'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#fff6dc'; g.font = `bold ${n.main ? 14 : 12}px sans-serif`; g.textAlign = 'center';
      g.fillText(n.f.surname, n.x, n.y + r + 15);
      g.font = '14px sans-serif'; g.fillText(n.f.player ? '🏠' : n.f.noble ? '👑' : '🏛️', n.x, n.y + 5);
    }
    cv.onclick = ev => {
      const rc = cv.getBoundingClientRect(), x = (ev.clientX - rc.left) * W / rc.width, y = (ev.clientY - rc.top) * H / rc.height;
      const n = nodes.find(q => U.dist(q.x, q.y, x, y) < 26);
      if (n) this.showFamily(n.f.id);
    };
  },

  act(a, d) {
    switch (a) {
      case 'close': this.close(); return;
      case 'hset': Heraldry.set(+d.c, { [d.k]: d.v }); break;
      case 'hname': Heraldry.rename(+d.c, (document.getElementById('hName') || {}).value, (document.getElementById('hShort') || {}).value); break;
      case 'hreset': Dialog.confirm({ icon: '↺', title: 'Voltar ao original', text: `Voltar o reino ao nome, à cor, à bandeira e ao brasão originais (${CIV_BASE[+d.c].name})?`, ok: 'Voltar ao original' }, () => { Heraldry.reset(+d.c); this.refresh(); }); return;
      case 'cjoin': RoyalCourt.join(+d.c); break;
      case 'cdecline': RoyalCourt.decline(+d.c); break;
      case 'coffice': RoyalCourt.setOffice(d.k); break;
      case 'caudience': RoyalCourt.audience(); break;
      case 'cescort': RoyalCourt.escort(); break;
      case 'cprop': RoyalCourt.propose(+d.o, d.x); break;
      case 'cleave': Dialog.confirm({ icon: '🚪', title: 'Deixar a corte', text: 'Deixar a corte do rei? Você perde o cargo e o salário.', ok: 'Deixar a corte', danger: true }, () => { RoyalCourt.leave('você pediu para sair', true); this.refresh(); }); return;
      case 'wnav': this.wnav(+d.d); return;
      case 'open': this[d.fn](); return;
      case 'equip': Game.equip(d.k); break;
      case 'unequip': P.equip[d.k] = null; break;
      case 'quick': Game.setQuick(+d.q, d.k); break;
      case 'unquick': P.quick[+d.q] = null; break;
      case 'eat': Game.eat(d.k); break;
      case 'craft': Game.craft(+d.r, +d.n); break;
      case 'build': this.close(); Game.startPlacing(d.k); return;
      case 'urban': this.close(); Urban.start(d.k); return;
      case 'vask': Chiefdom.ask(+d.v); break;
      case 'save': Game.save(World.structs[+d.s]); break;
      case 'sleep': this.close(); Game.sleep(World.structs[+d.s]); return;
      case 'train': Game.train(); break;
      case 'trade2': Game.trade(this.shopCtx.civ, d.k, +d.n, d.m, People.get(this.shopCtx.owner)); break;
      case 'tk': this.talkAct(d); return;
      case 'hire': Game.hire(); break;
      case 'buyfood': if (P.gold >= +d.p) { P.gold -= +d.p; Inv.add(d.k, 1); G.civs[World.structs[+d.s].owner].treasury += +d.p; } break;
      case 'rumor': this.showTavern(+d.s); return;
      case 'tribute': Game.tribute(+d.c); break;
      case 'claim': this.close(); Game.claimThrone(+d.c); return;
      case 'war':
        Dialog.confirm({ icon: '⚔️', title: 'Declarar guerra', text: `Declarar guerra contra ${CIV_DEFS[+d.c].name}? Os guardas atacarão você e o cerco começará.`, ok: 'Declarar guerra', danger: true }, () => { this.close(); Game.declareWar(+d.c); });
        return;
      case 'siege': this.close(); Game.startSiege(+d.c); return;
      case 'peace': Game.makePeace(+d.c); break;
      case 'ktab': this.sel.knav = 'k:' + d.c; this.showKingdom(); return;
      case 'knav': this.sel.knav = d.k; this.showKingdom(); return;
      case 'dnav': this.sel.dtab = d.k; this.showDiary(); return;
      case 'stab': this.showSettings(d.k); return;
      case 'setopt': Game.setSetting(d.k, d.v); this.showSettings(); return;
      case 'bcat': this.sel.bcat = d.k; this.sel.build = null; this.showBuild(); return;
      case 'vping': { const v = World.villages[+d.v]; if (v) { G.ping = { x: v.x + 0.5, y: v.y - 0.5, name: v.name }; this.msg(`📍 Destino marcado: ${v.name}.`, 'gold'); } break; }
      case 'tax': Game.setTax(+d.c, +d.d); break;
      case 'kgold': Game.kGold(+d.c, d.n); break;
      case 'kres': Game.kRes(+d.c, d.k, +d.n); break;
      case 'invest': Game.invest(+d.c, d.k); break;
      case 'krecruit': Game.kRecruit(+d.c); break;
      case 'kescort': Game.kEscort(+d.c); break;
      case 'kfest': Game.kFestival(+d.c); break;
      case 'quit': this.close(); Game.toMenu(); return;
      case 'chest': this.showChest(+d.s); Sound.play('chest'); return;
      case 'cmove': Store.move(World.structs[+d.s], d.k, d.q, d.to === '1'); break;
      case 'cstash': Store.stashResources(World.structs[+d.s]); break;
      case 'buyride': Ride.buy(d.k, +d.p); break;
      case 'setslot': G.slot = +d.n; break;
      case 'export': if (!G.dungeon) Saves.download(Game.snapshot()); return;
      case 'dipl': Diplo.playerAction(+d.c, +d.o, d.x); break;
      case 'isel': this.sel.inv = d.k; break;
      // botão "Usar" da mochila do celular: come, equipa/tira ou escolhe a semente
      case 'iuse': {
        const k = this.sel.inv, it = k && ITEMS[k]; if (!it) break;
        const eq = Object.keys(P.equip).find(s => P.equip[s] === k);
        if (it.food || it.heal) Game.eat(k); else if (it.slot) { if (eq) P.equip[eq] = null; else Game.equip(k); } else if (it.seed) P.seed = k;
        break;
      }
      case 'itrash': if (this.sel.inv) this.discard(this.sel.inv); return;
      case 'setseed': P.seed = d.k; this.msg(`🌱 Semente escolhida: ${ITEMS[d.k].name}. Use a enxada num canteiro arado.`); break;
      case 'savenow': if (G.siege) { this.msg('Não é possível salvar durante um cerco.', 'bad'); return; } Game.save(null); break;
      case 'buyanimal': Farm.buyAnimal(World.structs[+d.s], d.k); break;
      case 'collect': Farm.collect(World.structs[+d.s]); break;
      case 'ptstock': this.ptStock(World.structs[+d.s], d.k, d.q); break;
      case 'ptcollect': { const s = World.structs[+d.s]; if (s.till > 0) { P.gold += s.till; this.msg(`Você recolheu ${s.till} 🪙 do caixa da taverna.`, 'gold'); s.till = 0; Sound.play('coin'); } break; }
      case 'carrob': {
        const e = G.ents.find(x => x.kind === 'caravan' && x.carId === +d.c && !x.dead);
        if (!e) return;
        Dialog.confirm({ icon: '🏴', title: 'Assaltar a caravana', text: 'Assaltar a caravana? Os guardas vão atacar e o reino ficará furioso com você.', ok: 'Assaltar', danger: true }, () => { Caravans.rob(e.car, e); this.close(); });
        return;
      }
      case 'batjoin': { const b = Battles.list().find(x => x.id === +d.b); if (b && d.side !== 'none') Battles.join(b, +d.side); this.close(); return; }
      case 'dtab': this.sel.dtab = d.t; break;
      case 'kview': this.sel.knav = { meu: 'overview', casa: 'family', atlas: 'atlas', familias: 'families', linhagens: 'tree' }[d.v] || 'overview'; this.showKingdom(); return;
      case 'craftat': this.showCrafting(d.st); return;
      case 'bagup': Store.upgradeBag(); break;
      case 'title': Court.requestTitle(+d.c); break;
      case 'deploy': this.close(); Sieges.deploy(d.k); return;
      case 'appoint': Court.appoint(+d.c, d.s, People.get(+d.id)); this.sel.cseat = null; break;
      case 'cpick': this.sel.cseat = d.s; break;
      case 'cdismiss': Court.dismiss(+d.c, d.s); break;
      case 'judge': Court.judge(+d.p, d.v); break;
      case 'match': this.showMatch(+d.id); return;
      case 'domatch': { const ch = People.get(+d.id), q = People.get(+d.q); if (Court.arrange(ch, q)) { this.sel.knav = 'family'; this.showKingdom(); return; } break; }
      case 'tree': this.showTree(+d.f); return;
      case 'ttab': this.sel.ttab = d.t; this.showTree(this.sel.treeFam, this.sel.treeInK); return;
      case 'pray': Faith.pray(); break;
      case 'donate': Faith.donate(+d.c, +d.n); break;
      case 'bless': Faith.bless(); break;
      case 'cwed': Faith.wed(People.get(+d.id), +d.v); break;
      case 'baptize': Faith.baptize(+d.id); break;
      case 'pilgrim': Faith.startPilgrimage(+d.i); break;
      case 'duel': Arena.startDuel(+d.c, +d.t, +(document.getElementById('betAmt') || {}).value || 0); return;
      case 'tourney': Arena.enterTourney(+d.c); return;
      case 'joust': Arena.joustStart(+d.c, +d.t, +(document.getElementById('betAmt') || {}).value || 0); return;
      case 'jstrike': Arena.joustStrike(); this.showJoust(); return;
      case 'betfight': Arena.bet(+d.c, d.s, +(document.getElementById('betAmt') || {}).value || 0); break;
      case 'cvdest': this.sel.cv.to = +d.c; break;
      case 'cvadd': { const cv = this.sel.cv, n = d.n === 'all' ? Inv.count(d.k) : Math.min(Inv.count(d.k), (cv.cargo[d.k] || 0) + +d.n); cv.cargo[d.k] = Math.max(0, n); break; }
      case 'cvguard': this.sel.cv.guards = U.clamp(this.sel.cv.guards + +d.n, 0, 4); break;
      case 'cvsend': { const cv = this.sel.cv; if (Market.send(+d.f, cv.to, cv.cargo, cv.guards)) this.sel.cv = { to: null, cargo: {}, guards: 1 }; break; }
      case 'atlasciv': this.sel.atlas = +d.c; this.sel.knav = 'atlas'; this.showKingdom(); return;
      case 'famview': this.showFamily(+d.f); return;
      case 'bizopen': this.showBiz(+d.s); return;
      case 'bizhire': { const p = People.get(+d.id); Biz.hire(p, World.structs[+d.s]); this.showBiz(+d.s); return; }
      case 'bizfire2': { Biz.fire(People.get(+d.id)); this.showBiz(+d.s); return; }
      case 'bizcollect': Biz.collect(World.structs[+d.s]); break;
      case 'bizauto': { const s = World.structs[+d.s]; s.autosell = !s.autosell;
        // ao ligar, o que já estava guardado é vendido e o faturamento cai na hora no seu ouro
        if (s.autosell) { const g = Biz.cashOut(s); if (g) { this.msg(`🪙 Produção vendida: você recebeu ${g} 🪙.`, 'gold'); Sound.play('coin'); } }
        break; }
      case 'revside': { const r = Families.revolt(+d.r); if (r && !r.side) Families.joinRevolt(r, d.side); break; }
      case 'fally': { const r = Court.allyWith(Families.get(+d.f)); this.msg(r.note || r.text, r.note && r.note.startsWith('Agora') ? 'gold' : 'bad'); break; }
      case 'funally': { const f = Families.get(+d.f); Dialog.confirm({ icon: '💔', title: 'Desfazer a aliança', text: `Desfazer a aliança com a ${Families.name(f)}?`, ok: 'Desfazer', danger: true }, () => { this.msg(Court.unally(f).note); this.refresh(); }); return; }
      case 'fenemy': { const f = Families.get(+d.f); Dialog.confirm({ icon: '⚔️', title: 'Declarar inimiga', text: `Declarar a ${Families.name(f)} inimiga da sua casa? Os adultos dela poderão ser enfrentados até a morte, e eles vão revidar.`, ok: 'Declarar inimiga', danger: true }, () => { this.msg(Court.declareEnemy(f).note, 'bad'); this.refresh(); }); return; }
      case 'fpeace': { const f = Families.get(+d.f), ok = Court.canPeace(f); this.msg(Court.peace(f).note, ok ? 'gold' : 'bad'); break; }
      case 'famfavor': { const f = Families.get(+d.f); if (f && P.gold >= 200) { P.gold -= 200; f.favor = (f.favor || 0) + 25; f.loyalty = Math.min(100, f.loyalty + 15); this.msg(`A ${Families.name(f)} agradece os favores da coroa (+15 de lealdade).`, 'gold'); } break; }
      case 'fping': { const f = Families.get(+d.f), v = typeof f.seat === 'number' ? World.villages[f.seat] : null; if (v) { G.ping = { x: v.x + 0.5, y: v.y - 0.5, name: v.name }; this.msg(`📍 Destino marcado: ${v.name}.`, 'gold'); } break; }
      case 'found': Dialog.confirm({ icon: '🏘️', title: `Fundar a Vila ${G.surname}`, text: `Fundar a vila aqui? Custa ${FOUND_COST.gold} 🪙. Ela será livre, sem pertencer a reino nenhum.`, ok: 'Fundar' }, () => { if (Families.playerFound()) this.close(); else this.refresh(); }); return;
      case 'csel': this.sel.craft = +d.r; break;
      case 'cst': this.sel.st = d.s; break;
      case 'bsel': this.sel.build = d.k; break;
      case 'ksub': this.sel.ksub = d.s; break;
      case 'kping': {
        const cp = World.capitals[+d.c];
        G.ping = { x: cp.door.x + 0.5, y: cp.door.y + 1.5, name: 'Castelo de ' + CIV_DEFS[+d.c].short };
        this.msg(`📍 Destino marcado: ${G.ping.name}. Siga a seta dourada.`, 'gold');
        break;
      }
    }
    this.refresh();
  },

  showMainMenu() { Menu.show(); },
  // tela de carregamento enquanto o mundo é gerado (a geração leva alguns segundos)
  loading(text, fn) {
    const el = document.getElementById('loading'), bar = el.querySelector('.ld-bar i'), lab = el.querySelector('small');
    el.querySelector('.ld-t').textContent = text;
    bar.classList.remove('det'); bar.style.width = '';
    lab.textContent = 'Preparando...';
    el.classList.remove('hidden');
    const progress = (p, l) => { bar.classList.add('det'); bar.style.width = Math.round(p * 100) + '%'; if (l) lab.textContent = l + '...'; };
    setTimeout(async () => {
      try { await fn(progress); }
      catch (e) { Dialog.alert({ icon: '⚠️', title: 'Algo deu errado', text: 'Erro: ' + e.message }); }
      finally { el.classList.add('hidden'); }
    }, 40);
  },

};

const HELP_HTML = `
<h3>Controles</h3>
<table class="keys">
<tr><td>W A S D / Setas</td><td>Andar</td></tr>
<tr><td>Shift</td><td>Correr (gasta vigor)</td></tr>
<tr><td>Clique esquerdo / Espaço</td><td>Atacar e coletar recursos (segure para repetir o golpe)</td></tr>
<tr><td>V (segure e solte)</td><td><b>Golpe forte</b> com arma corpo a corpo</td></tr>
<tr><td>Botão direito / X (segure)</td><td>Bloquear com o escudo</td></tr>
<tr><td>Z</td><td>Esquivar (rolamento rápido)</td></tr>
<tr><td>T</td><td>Ordem aos capangas: seguir, atacar, aguardar</td></tr>
<tr><td>J</td><td>Diário: conquistas, estatísticas e dinastia</td></tr>
<tr><td>G</td><td>Montar aríete ou catapulta durante um cerco</td></tr>
<tr><td>Clique numa pessoa</td><td>Conversar com ela</td></tr>
<tr><td>E</td><td>Conversar com pessoas e interagir (cabana, lojas, taverna, castelo, forja...)</td></tr>
<tr><td>I</td><td>Inventário (equipar e comer)</td></tr>
<tr><td>C</td><td>Criação de itens</td></tr>
<tr><td>B</td><td>Construção</td></tr>
<tr><td>K</td><td>Gerenciar seu reino</td></tr>
<tr><td>M</td><td>Mapa do mundo</td></tr>
<tr><td>F</td><td>Comer a melhor comida da mochila</td></tr>
<tr><td>Q</td><td>Trocar a ferramenta empunhada (machado, picareta, vara de pesca)</td></tr>
<tr><td>R</td><td>Montar / desmontar do cavalo</td></tr>
<tr><td>1 2 3 4</td><td>Usar o item da algibeira (come a comida ou empunha a ferramenta)</td></tr>
<tr><td>Esc</td><td>Fechar janelas / pausa</td></tr>
</table>
<h3>Primeiros passos</h3>
<ol>
<li>Colete <b>madeira</b> nas árvores e <b>pedra</b> nas rochas (com as mãos já dá, mas é lento).</li>
<li>Crie um <b>Machado</b> e uma <b>Picareta de Pedra</b> (C) e empunhe a ferramenta certa (Q). A picareta de pedra quebra <b>carvão, cobre e estanho</b>.</li>
<li>Funda <b>bronze</b> (cobre + estanho + carvão) na forja. A picareta de bronze quebra <b>ferro</b>; a de ferro, <b>prata e ouro</b>; a de aço, <b>gemas</b>.</li>
<li>Colha <b>linho</b> para fazer corda e tecido. Com corda e madeira faça uma <b>Vara de Pesca</b> e, na bancada, um <b>Barco a Remo</b>.</li>
<li>Construa uma <b>Fogueira</b>, uma <b>Bancada</b> e uma <b>Forja</b> (B) perto da sua cabana.</li>
<li>Cace cervos e javalis para obter <b>carne</b> e <b>couro</b>. Asse a carne na fogueira.</li>
<li>Equipe <b>Elmo, Gibão, Calções e Botas</b>: cada peça soma defesa.</li>
<li>Cada vila tem <b>Armazém, Madeireira, Pedreira e Ferreiro</b>, cada um vendendo e comprando o seu tipo de mercadoria. <b>Caçadores</b> andam pelos arredores vendendo peles, ossos, chifres e presas.</li>
<li>Chegue perto de qualquer pessoa e aperte <b>E</b> (ou clique no balão 💬) para conversar: elogie, dê presentes (cada um tem um favorito), paquere, recrute <b>capangas</b> e equipe-os com armas e armaduras.</li>
<li>Com amizade e romance altos, peça em namoro; com um <b>Anel de Prata</b>, peça em casamento. Casados, durmam em casa para ter filhos.</li>
<li>Com um <b>arco</b> equipado, clique para atirar flechas (ou segure Espaço para mirar no inimigo mais próximo).</li>
<li>Explore as <b>cavernas</b> nas montanhas e ilhas: monstros, minérios raros, baús de tesouro e chefes com itens lendários.</li>
<li>A mochila tem <b>limite de peso</b>: guarde itens no Baú, ou compre um <b>cavalo</b> e uma <b>carroça</b> na taverna.</li>
<li>O <b>calendário</b> conta meses, não dias: a pizza do relógio se enche em 5 minutos de dia; quando completa, escurece, vira o mês e vem 1 minuto de noite. O ano (12 meses) dura 72 minutos. O jogo começa em dezembro. As <b>estações</b> seguem os meses: primavera (março a maio), verão, outono e inverno (dezembro a fevereiro). No inverno a fome aperta, os lobos atacam mais e as fazendas não produzem. Árvores, pedras e minérios coletados só renascem depois de 1 ano.</li>
<li>Abra <b>estradas</b> (B → Estradas): de graça; sobre rio raso vira ponte. Clique e arraste.</li>
<li>Como chefe ou rei, mande capangas <b>fazer guarda</b> na sua vila ou no seu castelo (converse com o capanga).</li>
<li>Vire <b>chefe de uma vila</b> fundando a sua, conquistando (converse com o chefe e desafie-o) ou pedindo ao rei no castelo. O chefe (na vila) e o rei (no reino todo) podem criar, mudar de lugar e demolir estradas e imóveis (B → Reformas e Obras).</li>
<li>Com a <b>Enxada</b>, are a terra, plante sementes e colha; regue com o <b>Regador</b> (encha na água). Chuva também rega.</li>
<li>Construa <b>Galinheiro, Curral e Colmeia</b> para ovos, leite, lã e mel; cozinhe no <b>Forno</b> e fabrique bebidas na <b>Cervejaria</b>. Pratos e bebidas dão <b>efeitos temporários</b>.</li>
<li>Monte sua própria <b>Taverna</b> e venda pratos e bebidas.</li>
<li>A economia (impostos, soldos, salários, colheitas) anda uma vez por mês; veja o resumo em Diário → Contas. As pessoas envelhecem um ano em janeiro.</li>
<li>Fique atento aos <b>eventos</b>: mercadores perdidos, tesouros enterrados, lobos atacando vilas e até dragões. Eles aparecem marcados no mapa.</li>
<li>Capangas sobem de nível lutando. Escolha a <b>postura</b> de cada um (agressivo, equilibrado ou defensivo) conversando com eles.</li>
<li>Segure o clique (ou o Espaço) para atacar e coletar sem parar. Para o <b>golpe forte</b>, segure V e solte.</li>
<li><b>Caravanas</b> viajam entre os reinos: escolte-as contra bandidos ou assalte-as.</li>
<li>Reinos em guerra travam <b>batalhas em campo aberto</b>: escolha um lado e lute com seus capangas.</li>
<li>Escolha a <b>profissão dos filhos</b> conversando com eles (a partir dos 12 anos).</li>
<li>Se você morrer é <b>fim de jogo</b>, mas pode continuar a linhagem como um dos seus filhos, que herda tudo.</li>
<li>Conquiste um castelo (ou compre o trono pela diplomacia) e torne-se <b>Rei</b>!</li>
</ol>
<p>Como rei, você controla impostos, tesouro, armazéns, investimentos e a guarnição de cada reino, separados do seu ouro pessoal. Cuide da felicidade do povo ou ele se revoltará.</p>
<p class="muted">Salve na sua Cabana, nas Casas ou a qualquer momento em Ajustes (Esc). No modo Fácil, ao morrer você volta para casa e perde parte do ouro. Controle (gamepad) e toque também funcionam.</p>`;

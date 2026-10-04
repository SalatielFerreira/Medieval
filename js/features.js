'use strict';
// Sistemas de jogo: arcos e flechas, cavalo e carroça, peso e baús, estações e clima,
// espaços de salvamento (com exportar/importar) e geração do mundo em segundo plano.

// ====================================================================== arcos e flechas
const Ranged = {
  projs: [],
  ammo() { return Inv.count('iron_arrow') > 0 ? 'iron_arrow' : Inv.count('arrow') > 0 ? 'arrow' : null; },
  // disparo do jogador
  shoot(aim) {
    const a = this.ammo();
    if (!a) {
      if (G.realTime - (this.warn || 0) > 2.5) { this.warn = G.realTime; UI.msg('Sem flechas! Crie Flechas (madeira + pedra) ou Flechas de Ferro na forja.', 'bad'); }
      P.atkCd = 0.5; return false;
    }
    Inv.add(a, -1);
    this.fire(P, aim, Game.pDmg() + ITEMS[a].adm, a);
    P.aim = aim; P.dir = Math.cos(aim) < 0 ? -1 : 1; P.swing = 0.25; P.atkCd = 0.62;
    Sound.play('bow');
    return true;
  },
  fire(src, aim, dmg, kind) {
    const sp = 540;
    this.projs.push({ x: src.x + Math.cos(aim) * 12, y: src.y - 16 + Math.sin(aim) * 12, vx: Math.cos(aim) * sp, vy: Math.sin(aim) * sp, ang: aim, dmg, src, kind, life: 0.95 });
  },
  update(dt) {
    for (const p of this.projs) {
      for (let k = 0; k < 3 && p.life > 0; k++) {
        p.x += p.vx * dt / 3; p.y += p.vy * dt / 3;
        const tx = Math.floor(p.x / TILE), ty = Math.floor((p.y + 14) / TILE);
        const t = World.tile(tx, ty), i = World.inb(tx, ty) ? World.idx(tx, ty) : -1;
        if (i < 0 || t === T.MOUNT || t === T.CWALL || (World.obj[i] && OBJ[World.obj[i]].blocks) || (World.sgrid[i] >= 0 && World.structs[World.sgrid[i]].blocks)) { p.life = 0; break; }
        const targets = p.src === P || fac(p.src) === 'player' ? G.ents.filter(e => !e.dead && (p.src === P ? canHit(e) : hostile(p.src, e))) : [P, ...G.ents.filter(e => !e.dead && hostile(p.src, e))];
        for (const e of targets) {
          if (U.dist(p.x, p.y, e.x, e.y - 14) < (e.r || 10) + 6) {
            Game.damage(e, p.dmg, p.src); Sound.play('arrowhit'); p.life = 0; break;
          }
        }
      }
      p.life -= dt;
    }
    this.projs = this.projs.filter(p => p.life > 0);
  },
  draw(ctx, cx, cy) {
    for (const p of this.projs) {
      ctx.save(); ctx.translate(p.x - cx, p.y - cy); ctx.rotate(p.ang);
      ctx.fillStyle = '#6b4423'; ctx.fillRect(-12, -1, 14, 2);
      ctx.fillStyle = p.kind === 'iron_arrow' ? '#cfd6dd' : '#9a9a9a'; ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(10, 0); ctx.lineTo(6, 3); ctx.fill();
      ctx.fillStyle = '#e8e0c8'; ctx.fillRect(-13, -3, 4, 2); ctx.fillRect(-13, 1, 4, 2);
      ctx.restore();
    }
  },
};

// ====================================================================== cavalo e carroça
const HORSE_NAMES = ['Relâmpago', 'Trovão', 'Estrela', 'Canela', 'Ventania', 'Faísca', 'Luar', 'Bravo'];
const Ride = {
  toggle() {
    if (!P.horse) { UI.msg('Você não tem cavalo. Compre um na taverna de qualquer vila ou no seu Estábulo.', 'bad'); return; }
    if (P.sailing) return;
    if (G.dungeon) { UI.msg('Não dá para montar dentro das cavernas.', 'bad'); return; }
    P.mounted = !P.mounted; P.fishing = null;
    if (P.mounted) { P.hx = P.x; P.hy = P.y; }
    UI.msg(P.mounted ? `Você montou ${P.horse.name}. R desmonta.` : `Você desmontou. ${P.horse.name} vai seguir você.`);
    Sound.play('neigh');
  },
  speed() { return P.mounted ? 1.9 : 1; },
  // o cavalo segue o jogador quando ele está a pé
  follow(dt) {
    if (!P.horse) return;
    if (P.mounted || G.dungeon || P.sailing) { if (P.mounted) { P.hx = P.x; P.hy = P.y; } return; }
    if (P.hx === undefined) { P.hx = P.x - 30; P.hy = P.y; }
    const d = U.dist(P.hx, P.hy, P.x, P.y);
    if (d > 20 * TILE) { P.hx = P.x - 30; P.hy = P.y; return; }
    if (d > 48) { const k = Math.min(1, dt * 3 * (d - 48) / d); P.hx += (P.x - P.hx) * k; P.hy += (P.y - P.hy) * k; P.hmoving = true; } else P.hmoving = false;
    if (Math.abs(P.x - P.hx) > 4) P.hdir = P.x < P.hx ? -1 : 1;
  },
  buy(kind, price) {
    if (P.gold < price) return;
    if (kind === 'horse') {
      if (P.horse) return;
      P.gold -= price; P.horse = { name: U.pick(HORSE_NAMES), color: U.pick(['#7a4a26', '#3a2a1e', '#c9b08a', '#8a8a8a', '#f2efe6']) };
      P.hx = P.x - 30; P.hy = P.y;
      UI.banner(`🐴 ${P.horse.name} agora é seu!`); UI.msg('Aperte R para montar e desmontar. O cavalo também carrega peso nos alforjes.', 'gold');
    } else if (kind === 'cart') {
      if (!P.horse || P.cart) return;
      P.gold -= price; P.cart = true;
      UI.msg('🛒 Carroça comprada! Seu cavalo agora puxa muito mais carga.', 'gold');
    }
    Sound.play('coin');
  },
};
function drawHorse(ctx, x, y, dir, anim, moving, col, cart) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
  if (cart) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(-40, 0, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-28, -14); ctx.lineTo(-12, -16); ctx.stroke();
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-54, -26, 28, 14); ctx.fillStyle = '#6b4220'; ctx.fillRect(-54, -26, 28, 3);
    ctx.fillStyle = '#c9a050'; ctx.fillRect(-50, -32, 8, 6); ctx.fillStyle = '#7a8a3a'; ctx.fillRect(-41, -31, 9, 5);
    const r = anim * (moving ? 6 : 0);
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-40, -8, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-40 + Math.cos(r) * 7, -8 + Math.sin(r) * 7); ctx.lineTo(-40 - Math.cos(r) * 7, -8 - Math.sin(r) * 7); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  const st = moving ? Math.sin(anim * 16) * 3 : 0, dark = U.shade(col, -0.18);
  ctx.fillStyle = dark;
  ctx.fillRect(-12, -14, 3, 14 - st); ctx.fillRect(-7, -14, 3, 14 + st); ctx.fillRect(6, -14, 3, 14 - st); ctx.fillRect(11, -14, 3, 14 + st);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -18, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, -22); ctx.lineTo(16, -34); ctx.lineTo(22, -34); ctx.lineTo(24, -28); ctx.lineTo(16, -18); ctx.fill();
  ctx.fillRect(18, -36, 8, 6);
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(22, -34, 2, 2);
  ctx.fillStyle = U.shade(col, -0.3); ctx.fillRect(12, -36, 3, 12); ctx.fillRect(-18, -22, 3, 10);
  ctx.fillStyle = '#7a1f2a'; ctx.fillRect(-6, -27, 12, 4);
  ctx.restore();
}

// ====================================================================== peso e baús
const Store = {
  weight() { let w = 0; for (const k in P.inv) w += itemWeight(k) * P.inv[k]; return Math.round(w); },
  capacity() { return this.bag().cap + (P.horse ? HORSE_CARRY : 0) + (P.horse && P.cart ? CART_CARRY : 0); },
  bagLvl() { return U.clamp(P.bagLvl || 1, 1, BAG_LEVELS.length); },
  bag() { return BAG_LEVELS[this.bagLvl() - 1]; },
  nextBag() { return BAG_LEVELS[this.bagLvl()] || null; },
  // melhora a mochila na bancada
  upgradeBag() {
    const nb = this.nextBag();
    if (!nb) return false;
    if (!Game.nearStation('bancada')) { UI.msg('Melhore a mochila perto de uma Bancada de Trabalho.', 'bad'); return false; }
    if (!Inv.has(nb.cost)) { UI.msg('Faltam materiais para melhorar a mochila.', 'bad'); return false; }
    Inv.pay(nb.cost);
    P.bagLvl = this.bagLvl() + 1;
    UI.banner(`🎒 ${nb.name} (nível ${P.bagLvl})`);
    UI.msg(`Sua mochila agora carrega até ${nb.cap} de peso.`, 'gold');
    Sound.play('levelup');
    return true;
  },
  over() { return this.weight() > this.capacity(); },
  key(s) { return s.x + ',' + s.y; },
  box(s) { const k = this.key(s); if (!G.storage[k]) G.storage[k] = {}; return G.storage[k]; },
  move(s, k, n, toChest) {
    const box = this.box(s);
    const have = toChest ? Inv.count(k) : (box[k] || 0);
    n = n === 'all' ? have : Math.min(+n, have);
    if (n <= 0) return;
    if (toChest) { Inv.add(k, -n); box[k] = (box[k] || 0) + n; }
    else { box[k] -= n; if (box[k] <= 0) delete box[k]; Inv.add(k, n); }
  },
  stashResources(s) {
    for (const k of Object.keys(P.inv)) if (['Recursos', 'Materiais'].includes(ITEMS[k].cat)) this.move(s, k, 'all', true);
  },
};

// ====================================================================== estações e clima
const Season = {
  idx(day) { return Calendar.season(day || G.day); },
  cur() { return SEASONS[this.idx()]; },
  winter() { return this.idx() === 3; },
  apply(announce) {
    const s = this.idx();
    if (World.season === s) return;
    World.season = s; World.chunks = new Map(); World.sprites = null;
    if (announce) {
      UI.banner(`${SEASONS[s].icon} Chegou o ${SEASONS[s].name}`);
      const tips = ['As plantações voltam a crescer e os rios correm cheios.', 'Dias longos e colheita farta.', 'Hora da grande colheita! As árvores ficam douradas.', 'Neve e frio: os lobos ficam famintos, a fome aperta e os rios congelam. Use roupas de pele!'];
      UI.msg(`${SEASONS[s].icon} ${SEASONS[s].name}: ${tips[s]}`, s === 3 ? 'bad' : 'gold');
    }
  },
  // clima muda algumas vezes por dia
  weather(dt) {
    const W = G.weather || (G.weather = { type: 'clear', t: 0, level: 0 });
    W.t -= dt;
    if (W.t <= 0) {
      const s = this.idx(), r = Math.random();
      W.type = s === 3 ? (r < 0.55 ? 'snow' : 'clear') : (r < [0.3, 0.12, 0.38][s] ? (r < 0.06 ? 'storm' : 'rain') : 'clear');
      // chuva e tempestade passam na metade do tempo do tempo bom
      W.t = W.type === 'clear' ? U.rnd(60, 160) : U.rnd(30, 80);
    }
    if (W.type === 'rain' || W.type === 'storm') G.rainedToday = true;
    const target = G.dungeon || W.type === 'clear' ? 0 : W.type === 'storm' ? 1 : 0.7;
    W.level += (target - W.level) * Math.min(1, dt * 0.5);
    Sound.setRain(W.type === 'snow' ? W.level * 0.15 : W.level);
  },
  drawWeather(ctx, cw, ch) {
    const W = G.weather;
    if (!W || W.level < 0.03 || G.dungeon) return;
    const t = G.realTime;
    ctx.save();
    if (W.type === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let k = 0; k < 220 * W.level; k++) {
        const x = (k * 97.3 + t * (18 + (k % 5) * 6) + Math.sin(t + k) * 12) % cw, y = (k * 61.7 + t * (40 + (k % 7) * 9)) % ch;
        ctx.fillRect(x, y, 2 + (k % 3 === 0), 2 + (k % 3 === 0));
      }
    } else {
      ctx.fillStyle = `rgba(20,30,50,${0.18 * W.level})`; ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = 'rgba(180,200,230,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 260 * W.level; k++) {
        const x = (k * 89.1 + t * 120) % cw, y = (k * 53.3 + t * 900) % ch;
        ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14);
      }
      ctx.stroke();
      if (W.type === 'storm' && Math.random() < 0.004) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, 0, cw, ch); }
    }
    ctx.restore();
  },
};

// ====================================================================== espaços de salvamento
const Saves = {
  SLOTS: 3,
  key(n) { return 'medieval_slot_' + n; },
  metaKey(n) { return 'medieval_meta_' + n; },
  // os jogos ficam compactados (prefixo LZ1:); jogos antigos em JSON puro continuam abrindo
  read(n) {
    try {
      const raw = localStorage.getItem(this.key(n));
      if (!raw) return null;
      return JSON.parse(raw.startsWith('LZ1:') ? LZ.decompress(raw.slice(4)) : raw);
    } catch (e) { return null; }
  },
  infoOf(s, n) {
    return { slot: n, name: s.name + (s.surname ? ' ' + s.surname : ''), day: s.day, age: s.player.age, sex: s.player.sex, savedAt: s.savedAt || 0,
      ruled: (s.civs || []).filter(c => c.ruler === 'player').length, level: s.player.level };
  },
  info(n) {
    try { const m = localStorage.getItem(this.metaKey(n)); if (m && localStorage.getItem(this.key(n))) return JSON.parse(m); } catch (e) { /* sem resumo: lê o jogo inteiro */ }
    const s = this.read(n);
    if (!s || !s.player) return null;
    return this.infoOf(s, n);
  },
  // tamanho guardado (em KB) de cada espaço
  size(n) { try { const r = localStorage.getItem(this.key(n)); return r ? Math.round(r.length * 2 / 1024) : 0; } catch (e) { return 0; } },
  list() { return Array.from({ length: this.SLOTS }, (_, i) => this.info(i + 1)); },
  write(n, data) {
    const packed = 'LZ1:' + LZ.compress(JSON.stringify(data));
    localStorage.setItem(this.key(n), packed);
    this.persist();
    try { localStorage.setItem(this.metaKey(n), JSON.stringify(this.infoOf(data, n))); } catch (e) { /* o resumo é opcional */ }
    return packed.length;
  },
  // pede ao navegador para guardar os jogos como dados permanentes (não apagar sozinho quando falta espaço
  // ou o site fica um tempo sem ser aberto). Uma vez por sessão, quando há um jogo para guardar.
  persist() {
    if (this.persistAsked) return;
    this.persistAsked = true;
    try {
      const st = navigator.storage;
      if (!st || !st.persist) return;
      (st.persisted ? st.persisted() : Promise.resolve(false)).then(ok => ok ? true : st.persist()).then(ok => { this.persistent = !!ok; }).catch(() => {});
    } catch (e) { /* navegador sem esse recurso: os jogos continuam salvos normalmente */ }
  },
  remove(n) { localStorage.removeItem(this.key(n)); localStorage.removeItem(this.metaKey(n)); },
  firstFree() { const l = this.list(); const i = l.findIndex(x => !x); return i < 0 ? 0 : i + 1; },
  // jogos salvos da versão anterior vão para o espaço 1
  migrate() {
    try {
      const old = localStorage.getItem('medieval_save_v3');
      if (old && !localStorage.getItem(this.key(1))) localStorage.setItem(this.key(1), old);
      if (old) localStorage.removeItem('medieval_save_v3');
    } catch (e) { /* armazenamento indisponível */ }
  },
  download(data) {
    const name = `medieval_${String(data.name || 'heroi').replace(/[^\w]+/g, '_')}_dia${data.day}.json`;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  exportSlot(n) { const d = this.read(n); if (d) this.download(d); },
  importFile(n, done) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const d = JSON.parse(rd.result);
          if (!d || !d.player || !d.seed || !d.obj) throw new Error('arquivo inválido');
          this.write(n, d);
          done(true);
        } catch (e) { Dialog.alert({ icon: '⚠️', title: 'Não foi possível importar', text: 'O arquivo não é um jogo salvo do MEDIEVAL.' }); done(false); }
      };
      rd.readAsText(f);
    };
    inp.click();
  },
};

// ====================================================================== geração do mundo em segundo plano
const WorldGen = {
  // monta o código do gerador dentro de um Web Worker para a tela de carregamento não travar
  workerSource() {
    const fnObj = (name, obj, keys) => `const ${name}={` + keys.map(k => typeof obj[k] === 'function' ? obj[k].toString() : `${k}:${JSON.stringify(obj[k])}`).join(',') + '};';
    return [
      `const TILE=${TILE},WORLD_W=${WORLD_W},WORLD_H=${WORLD_H},WORLD_PAD=${WORLD_PAD},DIRS4=${JSON.stringify(DIRS4)};`,
      `const T=${JSON.stringify(T)},TINFO=${JSON.stringify(TINFO)},OBJ=${JSON.stringify(OBJ)};`,
      `const CIV_DEFS=${JSON.stringify(CIV_DEFS)},VILLAGE_NAMES=${JSON.stringify(VILLAGE_NAMES)},BUILDINGS=${JSON.stringify(BUILDINGS)},CIV_STRUCTS=${JSON.stringify(CIV_STRUCTS)},CAVE_NAMES=${JSON.stringify(CAVE_NAMES)};`,
      fnObj('U', U, Object.keys(U)),
      MinHeap.toString() + ';',
      fnObj('Dungeon', Dungeon, ['placeCaves']),
      'const World={' + ['idx', 'inb', 'tile', 'generate', 'areaOk', 'areaFree', 'addStruct', 'findPath', 'carveRoad'].map(k => World[k].toString()).join(',') + ',buildMinimap(){}};',
      `const MOUNT_CUT=${MOUNT_CUT};`,
      `onmessage=e=>{postMessage({hello:true});World.onProgress=(p,l)=>postMessage({progress:p,label:l});World.mountCut=e.data.cut;World.terrainV=e.data.terrain;
        const ok=World.generate(e.data.seed);
        if(!ok){postMessage({done:true,ok:false});return;}
        const W=World;
        postMessage({done:true,ok:true,seed:W.seed,tiles:W.tiles,obj:W.obj,objHp:W.objHp,terr:W.terr,sgrid:W.sgrid,elev:W.elev,structs:W.structs,
          villages:W.villages,capitals:W.capitals,camps:W.camps,islands:W.islands,caves:W.caves,start:W.start,startCabin:W.startCabin});};`,
    ].join('\n');
  },
  // terrain: versão do terreno (jogos salvos antigos guardam a versão 1)
  run(seed, onProgress, terrain) {
    setWorldSize(terrain || TERRAIN_V); World.busy = true; World.terrainV = terrain || TERRAIN_V; // o mundo antigo não é desenhado enquanto o novo (de outro tamanho) é gerado
    const cut = TERRAIN_CUTS[terrain || TERRAIN_V];
    World.mountCut = cut;
    return new Promise(res => { const resolve = ok => { World.busy = false; res(ok); };
      let finished = false;
      const sync = () => {
        if (finished) return;
        finished = true;
        if (onProgress) onProgress(0.15, 'Gerando o mundo (modo simples)');
        // dá tempo de a tela de carregamento aparecer antes do trabalho pesado
        setTimeout(() => { World.onProgress = null; const ok = World.generate(seed); if (ok) { World.thinMountains(); World.buildMinimap(); } resolve(ok); }, 60);
      };
      let w, alive = false;
      if (this.forceSync || typeof Worker === 'undefined') { sync(); return; }
      try { w = new Worker(URL.createObjectURL(new Blob([this.workerSource()], { type: 'text/javascript' }))); } catch (e) { setTimeout(sync, 30); return; }
      // se o navegador bloquear o worker (alguns bloqueiam em arquivos locais), gera do jeito normal
      const watchdog = setTimeout(() => { if (!alive) { w.terminate(); sync(); } }, 2500);
      const timeout = setTimeout(() => { w.terminate(); sync(); }, 60000);
      w.onerror = () => { clearTimeout(timeout); clearTimeout(watchdog); w.terminate(); sync(); };
      w.onmessage = ev => {
        const d = ev.data;
        if (d.hello) { alive = true; return; }
        if (!d.done) { if (onProgress) onProgress(d.progress, d.label); return; }
        if (finished) return;
        finished = true;
        clearTimeout(timeout); clearTimeout(watchdog); w.terminate();
        if (!d.ok) { resolve(false); return; }
        delete d.hello;
        Object.assign(World, d);
        delete World.done; delete World.ok;
        World.regrow = []; World.chunks = new Map(); World.shakes = new Map(); World.sprites = null; World.season = -1;
        World.thinMountains(); World.buildMinimap();
        resolve(true);
      };
      w.postMessage({ seed, cut, terrain: terrain || TERRAIN_V });
    });
  },
};

'use strict';
// Mais construções: moradias (choupana, chalé, solar), oficinas (carpintaria, alquimia, curtidor), criações (chiqueiro,
// pombal, viveiro, ervas, linho, cogumelos), praça (mastro, caramanchão, relógio de sol), cultura (palco, estande de tiro),
// guarda (arca, adega, canil com cão de guarda), defesa (torre de arqueiros, estacas, arsenal) e cinco empreendimentos.

Object.assign(BIZ_TYPES, {
  biz_carpentry: { skill: 'lumber',   slots: 3, wage: 5, out: { plank: 6, beam: 1 } },
  biz_chandler:  { skill: 'peasant',  slots: 2, wage: 4, out: { candle: 6 } },
  biz_pottery:   { skill: 'mason',    slots: 3, wage: 4, out: { clay_pot: 3, brick: 3 } },
  biz_bank:      { skill: 'merchant', slots: 2, wage: 8, gold: 20 },
  biz_dairy:     { skill: 'peasant',  slots: 3, wage: 4, out: { milk: 4, cheese: 2 } },
});
Object.assign(BIZ_TRADE, { biz_carpentry: 'lumber', biz_chandler: 'store', biz_pottery: 'quarry', biz_bank: 'smith', biz_dairy: 'store' });
Object.assign(BIZ_ROOMS, { biz_carpentry: 'lumber', biz_chandler: 'apothecary', biz_pottery: 'bakery', biz_bank: 'jeweler', biz_dairy: 'bakery' });
Object.assign(ROOM_TYPES, {
  hut:   { lay: 'home', theme: 'wood', owned: true, name: () => 'Sua Choupana' },
  lodge: { lay: 'home', theme: 'wood', owned: true, name: () => 'Seu Chalé de Caça' },
  villa: { lay: 'home', theme: 'wood', owned: true, big: true, name: () => 'Seu Solar' },
});
Object.assign(Content.LIGHTS, { villa: 90, lodge: 70, hut: 50, alchemy: 50, stage: 90, archer_tower: 60, cellar: 40, flagpole_p: 0 });
SHOPS.lumber.sells.push('plank', 'beam'); SHOPS.smith.sells.push('nails'); SHOPS.quarry.sells.push('mortar'); SHOPS.store.sells.push('mushroom', 'feather', 'parchment');
GIFTABLE.push('aged_wine', 'elixir', 'mushroom_soup');
for (const k in ITEMS) ITEMS[k].key = k;

const Content2 = {
  t: 0, spikeT: 0, dogT: 0,
  mine(type) { return Content.mine(type); },
  armory() { return this.mine('armory').length > 0; },
  // o que as criações e plantações novas dão por mês
  produce(s) {
    const w = Season.winter();
    switch (s.type) {
      case 'pigsty': return { meat: 3, leather: 1 };
      case 'dovecote': return { feather: 4, egg: 1 };
      case 'fishpond': return w ? { carp: 1 } : { carp: 2, trout: 1 };
      case 'herbgarden': return { herb: w ? 1 : 4 };
      case 'flaxfield': return w ? {} : { fiber: 6 };
      case 'mushroom': return { mushroom: 4 };
    }
    return null;
  },
  label(s) {
    if (s.owner !== 'player') return '';
    const g = Content.goodsTxt(s);
    switch (s.type) {
      case 'pigsty': return `Chiqueiro — ${g || 'engordando'}`;
      case 'dovecote': return `Pombal — ${g || 'nada ainda'}`;
      case 'fishpond': return `Viveiro de Peixes — ${g || 'os peixes crescem'}`;
      case 'herbgarden': return `Canteiro de Ervas — ${g || 'crescendo'}`;
      case 'flaxfield': return `Linhal — ${g || 'crescendo'}`;
      case 'mushroom': return `Cogumelal — ${g || 'brotando'}`;
      case 'carpentry': return 'Carpintaria — serrar madeira';
      case 'alchemy': return 'Mesa de Alquimia — preparar poções';
      case 'tanrack': return 'Curtidor — curtir peles';
      case 'pergola': return 'Caramanchão — sentar à sombra';
      case 'sundial': return 'Relógio de Sol — ver a hora';
      case 'stage': return 'Palco dos Menestréis — noite de música';
      case 'archery': return 'Estande de Tiro — treinar com o arco';
      case 'big_chest': return 'Arca Reforçada — guardar itens';
      case 'cellar': return 'Adega — guardar bebidas';
      case 'kennel': return 'Canil — seu cão de guarda';
      case 'archer_tower': return 'Torre de Arqueiros — vigiando';
      case 'armory': return 'Arsenal — equipamento da tropa';
    }
    return '';
  },
  interact(s) {
    if (s.owner !== 'player') return false;
    if (this.produce(s)) { Biz.collect(s); return true; }
    switch (s.type) {
      case 'carpentry': UI.showCrafting('carpintaria'); return true;
      case 'alchemy': UI.showCrafting('alquimia'); return true;
      case 'tanrack': UI.showCrafting('curtidor'); return true;
      case 'pergola': P.stamina = Game.maxSt(); UI.msg('🌿 Um descanso à sombra das trepadeiras: energia cheia.'); return true;
      case 'sundial': { const h = Game.hour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60); UI.msg(`☀️ O relógio de sol marca ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}${h >= 6 && h < 21 ? ` · faltam ${Math.max(0, Math.round(21 - h))} horas para anoitecer` : ' · é noite: o relógio não marca nada!'}.`); return true; }
      case 'stage': this.stage(); return true;
      case 'archery': this.archery(); return true;
      case 'big_chest': case 'cellar': UI.showChest(s.id); return true;
      case 'kennel': { const d = this.dog(); UI.msg(d ? `🐕 Seu cão está com ${Math.round(d.hp)} de vida e segue você por onde for.` : '🐕 Um filhote está crescendo no canil: no mês que vem ele estará pronto.'); return true; }
      case 'archer_tower': { const k = Shops.keeper(s); UI.msg(k ? `🏹 ${k.name} ${k.surname}, ${People.title(k).toLowerCase()} da torre, vigia lá de cima: atira em qualquer inimigo a até 9 passos.` : '🏹 A torre está sem arqueiro.'); return true; }
      case 'armory': UI.msg('⚔️ O arsenal equipa seus capangas: +3 de dano e +2 de defesa.'); return true;
    }
    return false;
  },
  onBuild(k) { if (k === 'villa') { Court.addFame(5); UI.msg('🏛️ Um solar à altura do seu nome (+5 de fama).', 'gold'); } if (k === 'kennel') this.dogDue = true; },
  stage() {
    if (G.stageDay === G.day) { UI.msg('🎻 Os menestréis já tocaram este mês. Voltam no mês que vem.'); return; }
    G.stageDay = G.day; Farm.addBuff('courage'); Court.addFame(2);
    UI.banner('🎻 Noite de música!'); UI.msg('🎻 Os menestréis cantam as suas façanhas: Coragem (+15% de dano) e +2 de fama.', 'gold'); Sound.play('levelup');
  },
  archery() {
    const w = P.equip.weapon && ITEMS[P.equip.weapon];
    if (!w || !w.ranged) { UI.msg('🏹 Equipe um arco para treinar no estande.', 'bad'); return; }
    if ((G.archT || 0) > G.realTime) { UI.msg(`🏹 Recolha as flechas antes de treinar de novo (${Math.ceil(G.archT - G.realTime)} s).`); return; }
    if (P.stamina < 20) { UI.msg('🏹 Você está cansado demais.', 'bad'); return; }
    P.stamina -= 20; G.archT = G.realTime + 40;
    const xp = 35 + P.level * 4; Game.gainXp(xp); Sound.play('bow');
    UI.msg(`🎯 Flechas no alvo: +${xp} de experiência.`, 'gold');
  },
  // o cão de guarda (um por canil, até três)
  dog() { return G.ents.find(e => e.kind === 'dog' && !e.dead) || null; },
  dogs() { return G.ents.filter(e => e.kind === 'dog' && !e.dead); },
  // a cada quadro: torres de arqueiros, estacas e o cão
  update(dt) {
    if (G.dungeon || G.state !== 'play') return;
    this.t -= dt; this.spikeT -= dt; this.dogT -= dt;
    if (this.t <= 0) {
      this.t = 0.4;
      for (const s of this.mine('archer_tower')) {
        if (!Shops.keeper(s)) continue; // quem atira é o arqueiro responsável, lá em cima
        if (U.dist(s.x, s.y, P.x / TILE, P.y / TILE) > 40) continue;
        s.shotT = (s.shotT || 0) - 0.4; if (s.shotT > 0) continue;
        const cx = (s.x + s.w / 2) * TILE, cy = (s.y + s.h / 2) * TILE;
        let best = null, bd = 9 * TILE;
        for (const e of G.ents) { if (e.dead || e.kind === 'villager' || e.dmg <= 0 || !hostile(e, P)) continue; const d = U.dist(e.x, e.y, cx, cy); if (d < bd) { bd = d; best = e; } }
        if (!best) continue;
        const a = Math.atan2(best.y - 14 - (cy - 8), best.x - cx), src = { x: cx + Math.cos(a) * 44, y: cy + 8 + Math.sin(a) * 44, faction: 'player', dmg: 14, civ: -1 };
        Ranged.fire(src, a, 14, 'arrow'); Sound.play('bow', { vol: 0.5 }); s.shotT = 1.6;
        (this.towerAim = this.towerAim || {})[s.id] = { a, dir: Math.cos(a) < 0 ? -1 : 1, until: G.realTime + 0.8 };
      }
    }
    if (this.spikeT <= 0) {
      this.spikeT = 0.5;
      const sp = this.mine('spikes');
      if (sp.length) for (const e of G.ents) {
        if (e.dead || e.dmg <= 0 || !hostile(e, P)) continue;
        const tx = Math.floor(e.x / TILE), ty = Math.floor((e.y - 4) / TILE);
        if (sp.some(s => s.x === tx && s.y === ty)) { Game.damage(e, 8, null); Game.burst(e.x, e.y - 6, '#8a1a1a', 3); }
      }
    }
    if (this.dogT <= 0) {
      this.dogT = 1;
      const kennels = this.mine('kennel'), dogs = this.dogs();
      if (kennels.length && dogs.length < Math.min(3, kennels.length) && this.dogDue !== false && !G.place) {
        const k = kennels[0], s = freeSpotNear(P.x - 30, P.y + 10, 50);
        const d = Game.spawn('dog', s.x, s.y, { leash: 2 }); d.follow = P; d.name = 'Cão de Guarda';
        this.dogDue = dogs.length + 1 < Math.min(3, kennels.length); void k;
        UI.msg('🐕 Seu cão de guarda está com você.');
      }
      for (const d of dogs) if (U.dist(d.x, d.y, P.x, P.y) > 14 * TILE && !G.place) { const s = freeSpotNear(P.x - 30, P.y + 10, 50); d.x = s.x; d.y = s.y; d.target = null; }
    }
    for (const d of this.dogs()) if (!d.target && !G.place && U.dist(d.x, d.y, P.x, P.y) > 70) d.moveToward(P.x - 28, P.y + 12, d.def.speed, dt);
  },
};
// junta as criações, rótulos e interações novas às do Content
{
  const p0 = Content.produce.bind(Content); Content.produce = s => p0(s) || Content2.produce(s);
  const l0 = Content.label.bind(Content); Content.label = s => l0(s) || Content2.label(s);
  const i0 = Content.interact.bind(Content); Content.interact = s => i0(s) || Content2.interact(s);
  const b0 = Content.onBuild.bind(Content); Content.onBuild = k => { b0(k); Content2.onBuild(k); };
  const c0 = People.capangaStats.bind(People); People.capangaStats = p => { const r = c0(p); if (Content2.armory()) { r.dmg += 3; r.def += 2; } return r; };
  const m0 = Content.monthTick.bind(Content); Content.monthTick = () => { m0(); Content2.monthTick(); };
}
// todo mês: a adega envelhece o vinho guardado e o canil cria um filhote se faltar cão (a produção das criações
// vem pelo Content.produce, que o Content.monthTick já chama)
Content2.monthTick = function () {
  for (const s of World.structs) {
    if (s.owner !== 'player' || s.removed || s.type !== 'cellar') continue;
    const box = Store.box(s), n = box.wine || 0;
    if (n > 0) { const a = Math.max(1, Math.floor(n * 0.25)); box.wine -= a; if (box.wine <= 0) delete box.wine; box.aged_wine = (box.aged_wine || 0) + a; }
  }
  if (Content.mine('kennel').length) this.dogDue = true;
};

// ---------------------------------------------------------------- desenho das construções novas
{
  const d0 = drawStructExtra;
  // eslint-disable-next-line no-global-assign
  drawStructExtra = function (ctx, s, X, Y, time, H) {
    const { R, roof, house, flame, flag, shadow, w, h } = H;
    const ell = (x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X + x, Y + y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
    const sign = (x, y, ic) => { R(x, y, 14, 11, '#5a3a1e'); ctx.font = '9px sans-serif'; ctx.fillText(ic, X + x + 1, Y + y + 9); };
    const night = G.darkness > 0.2, sn = World.season;
    const fence = () => { ctx.strokeStyle = '#8b5f38'; ctx.lineWidth = 2; ctx.strokeRect(X + 2, Y + 2, w - 4, h - 4); for (let k = 4; k < w; k += 10) R(k, -2, 2, 6, '#7a5230'); };
    switch (s.type) {
      case 'hut': {
        shadow(); R(8, 28, w - 16, h - 32, '#a08458'); for (let k = 30; k < h - 4; k += 4) R(8, k, w - 16, 1, '#8a6e44');
        ctx.fillStyle = '#c8a860'; ctx.beginPath(); ctx.moveTo(X + 2, Y + 30); ctx.lineTo(X + w / 2, Y + 2); ctx.lineTo(X + w - 2, Y + 30); ctx.fill();
        ctx.strokeStyle = '#a8883a'; ctx.lineWidth = 1; for (let k = 6; k < 28; k += 4) { ctx.beginPath(); ctx.moveTo(X + w / 2 - k * 0.9, Y + 2 + k); ctx.lineTo(X + w / 2 + k * 0.9, Y + 2 + k); ctx.stroke(); }
        R(w / 2 - 5, h - 18, 10, 14, '#3a2410'); if (night) R(14, 38, 6, 5, '#ffd36b');
        break;
      }
      case 'lodge': {
        shadow(); R(6, 22, w - 12, h - 26, '#6a4422'); for (let k = 24; k < h - 4; k += 6) { R(6, k, w - 12, 5, '#7a5230'); ell(8, k + 2.5, 3, 2.5, '#9a6a3a'); ell(w - 8, k + 2.5, 3, 2.5, '#9a6a3a'); }
        roof(2, 2, w - 4, 22, '#3e5a2a'); R(w / 2 - 6, h - 20, 12, 16, '#3a2410');
        R(w / 2 - 10, 24, 20, 4, '#e8dcc0'); R(w / 2 - 12, 18, 3, 8, '#e8dcc0'); R(w / 2 + 9, 18, 3, 8, '#e8dcc0'); // chifres de troféu
        R(14, 32, 8, 7, night ? '#ffd36b' : '#2a2a3a'); R(w - 22, 32, 8, 7, night ? '#ffd36b' : '#2a2a3a'); R(w - 16, -4, 7, 12, '#6b6b6b');
        break;
      }
      case 'villa': {
        shadow(); R(6, 26, w - 12, h - 30, '#e6dcc4'); R(6, 62, w - 12, 3, '#b8a888');
        for (const x of [16, 40, 64, 88]) { R(x, 34, 12, 14, night ? '#ffd36b' : '#3a4a6a'); R(x, 70, 12, 14, night ? '#ffd36b' : '#3a4a6a'); R(x - 1, 33, 14, 2, '#8a6a42'); R(x - 1, 69, 14, 2, '#8a6a42'); }
        R(w / 2 - 9, h - 26, 18, 22, '#5a3a1e'); ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 26, 9, Math.PI, 0); ctx.fill();
        R(w / 2 - 14, h - 6, 28, 4, '#c8bfa8'); roof(2, 2, w - 4, 26, '#4a3a5a'); R(18, -6, 8, 14, '#8a7a6a'); R(w - 26, -6, 8, 14, '#8a7a6a');
        flag(w / 2 - 1, 0, PLAYER_COLOR);
        break;
      }
      case 'carpentry': { shadow(); R(4, 22, w - 8, h - 26, '#9a6a3a'); roof(2, 6, w - 4, 18, '#6a4a2a'); R(8, h - 14, 22, 4, '#c89a5a'); R(8, h - 9, 22, 4, '#b8884a'); R(w - 22, h - 20, 14, 2, '#9a9aa2'); sign(w - 22, 30, '🪚'); break; }
      case 'alchemy': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + 26, w - 8, 5);
        R(4, 12, w - 8, 10, '#6a4a2a'); R(4, 20, w - 8, 3, '#4a2e16'); R(6, 22, 4, 8, '#4a2e16'); R(w - 10, 22, 4, 8, '#4a2e16');
        for (const [x, c] of [[10, '#5ad87a'], [22, '#c84ac8'], [34, '#4ac8e0'], [46, '#e0c84a']]) { R(x, 2, 6, 10, c); R(x + 1, 0, 4, 3, '#efe6d2'); }
        ell(w - 14, 6, 6, 5, '#3a3a40'); const b = (time * 3) % 1; ell(w - 14, 2 - b * 8, 2, 2, 'rgba(150,255,170,0.7)');
        break;
      }
      case 'tanrack': { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + 26, w - 8, 5); R(4, 0, 4, 30, '#6b4423'); R(w - 8, 0, 4, 30, '#6b4423'); R(4, 0, w - 8, 3, '#8b5f38'); R(12, 4, 18, 20, '#a0703a'); R(34, 4, 18, 18, '#8a5a30'); break; }
      case 'pigsty': {
        R(2, 2, w - 4, h - 4, '#7a6040'); fence();
        R(w - 30, 6, 26, 20, '#a8885a'); ctx.fillStyle = '#7a5230'; ctx.beginPath(); ctx.moveTo(X + w - 32, Y + 8); ctx.lineTo(X + w - 17, Y - 2); ctx.lineTo(X + w - 2, Y + 8); ctx.fill();
        for (const [px, py] of [[18, 40], [42, 30], [34, 52]]) { ell(px, py, 9, 6, '#f0a8a8'); ell(px + 8, py - 2, 4, 4, '#f0a8a8'); R(px + 10, py - 3, 2, 2, '#c87878'); R(px - 6, py + 4, 2, 3, '#c87878'); R(px + 4, py + 4, 2, 3, '#c87878'); }
        ell(w / 2 + 10, h - 12, 12, 5, '#5a4630');
        break;
      }
      case 'dovecote': { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 8, Y + 27, 16, 4); R(14, 10, 4, 18, '#6b4423'); R(6, -6, 20, 18, '#e6dcc4'); ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(X + 4, Y - 6); ctx.lineTo(X + 16, Y - 16); ctx.lineTo(X + 28, Y - 6); ctx.fill(); for (const x of [9, 19]) { R(x, -2, 5, 5, '#2a1a10'); R(x, 6, 5, 4, '#2a1a10'); } const fl = Math.sin(time * 5) * 6; R(22 + fl, -20, 3, 2, '#e8e8f0'); break; }
      case 'fishpond': {
        ell(w / 2, h / 2, w / 2 - 2, h / 2 - 2, '#8b8d93'); ell(w / 2, h / 2, w / 2 - 7, h / 2 - 7, '#3a7bc8'); ell(w / 2 - 14, h / 2 - 10, 10, 4, 'rgba(255,255,255,0.25)');
        for (let k = 0; k < 3; k++) { const a = time * (0.8 + k * 0.3) + k * 2; const fx = w / 2 + Math.cos(a) * 22, fy = h / 2 + Math.sin(a) * 14; ell(fx, fy, 5, 2.5, k === 1 ? '#e8a040' : '#c86a3a'); }
        R(w / 2 - 2, 6, 3, 10, '#4f8a36'); ell(w / 2 + 16, h / 2 + 12, 6, 3, '#4f8a36');
        break;
      }
      case 'herbgarden': { R(2, 6, w - 4, h - 8, '#6e4f2e'); for (let k = 0; k < 6; k++) { const x = 6 + k * 9; ell(x, 14, 4, 5, ['#5a9a3a', '#7aa84a', '#8a6a9a'][k % 3]); R(x - 1, 18, 2, 6, '#4f8a36'); } R(2, 6, w - 4, 2, '#8a6a42'); break; }
      case 'flaxfield': {
        R(2, 2, w - 4, h - 4, '#6e4f2e');
        for (let k = 6; k < h - 2; k += 7) for (let j = 5; j < w - 4; j += 5) { const sw = Math.sin(time * 2 + j * 0.3 + k) * 1; R(j + sw, k - 5, 1, 6, sn === 3 ? '#9a9a8a' : '#6aa84f'); if (sn === 0 || sn === 1) R(j + sw - 1, k - 7, 3, 2, '#7a9ae0'); }
        ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.strokeRect(X + 1, Y + 1, w - 2, h - 2);
        break;
      }
      case 'mushroom': { shadow(); R(6, 22, w - 12, h - 26, '#5a4a3a'); roof(4, 6, w - 8, 18, '#3a2e22'); R(w / 2 - 5, h - 18, 10, 14, '#1a120a'); for (const [x, c] of [[10, '#d8302a'], [w - 16, '#e8d8b0']]) { R(x + 2, h - 8, 2, 5, '#efe6d2'); ell(x + 3, h - 9, 5, 3, c); } break; }
      case 'flagpole_p': { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 8, Y + 27, 16, 4); R(15, -40, 3, 68, '#5a3a1e'); R(11, 24, 11, 4, '#7a5230'); const wv = Math.sin(time * 4) * 2; ctx.fillStyle = PLAYER_COLOR; ctx.beginPath(); ctx.moveTo(X + 18, Y - 40); ctx.lineTo(X + 40, Y - 34 + wv); ctx.lineTo(X + 18, Y - 24); ctx.fill(); ctx.fillStyle = '#8e1f2a'; ctx.fillRect(X + 20, Y - 36, 6, 6); break; }
      case 'pergola': {
        R(2, h - 6, w - 4, 4, 'rgba(0,0,0,0.2)');
        for (const x of [4, w - 8]) for (const y of [4, h - 16]) R(x, y - 8, 4, 22, '#8a6a42');
        R(0, -6, w, 4, '#a8844a'); R(0, h - 22, w, 4, '#a8844a'); for (let k = 2; k < w; k += 8) R(k, -8, 3, h - 10, 'rgba(168,132,74,0.85)');
        const leaf = sn === 3 ? '#c8d0d0' : sn === 2 ? '#c8883a' : '#4f8a36'; for (let k = 0; k < 9; k++) ell(4 + (k * 13) % (w - 6), -4 + (k * 7) % (h - 14), 6, 4, leaf);
        if (sn === 0 || sn === 1) for (let k = 0; k < 6; k++) ell(8 + (k * 17) % (w - 10), (k * 11) % (h - 16), 2, 2, ['#e04a6a', '#f2e36b', '#9a5ad8'][k % 3]);
        R(w / 2 - 10, h - 14, 20, 5, '#a06a35');
        break;
      }
      case 'sundial': { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + 26, 24, 5); R(10, 14, 12, 14, '#a5a7ad'); ell(16, 12, 12, 6, '#c5c7cd'); const a = (Game.hour() / 24) * Math.PI * 2; ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 16, Y + 12); ctx.lineTo(X + 16 + Math.cos(a) * 9, Y + 12 + Math.sin(a) * 4); ctx.stroke(); for (let k = 0; k < 12; k++) R(16 + Math.cos(k / 12 * 6.28) * 10, 12 + Math.sin(k / 12 * 6.28) * 5, 1, 1, '#5a5a62'); break; }
      case 'stage': {
        shadow(); R(4, 26, w - 8, h - 30, '#8a5a30'); R(4, 26, w - 8, 4, '#a8743e'); for (let k = 30; k < h - 4; k += 5) R(4, k, w - 8, 1, '#6a4220');
        R(4, -10, 4, 38, '#5a3a1e'); R(w - 8, -10, 4, 38, '#5a3a1e'); R(2, -14, w - 4, 8, '#8e1f2a'); for (let k = 0; k < 6; k++) ell(10 + k * 14, -6, 6, 4, '#a8352a');
        R(8, -6, 10, 30, '#8e1f2a'); R(w - 18, -6, 10, 30, '#8e1f2a');
        const b = Math.abs(Math.sin(time * 4)) * 2; R(w / 2 - 4, 8 - b, 8, 14, '#2a4a8a'); R(w / 2 - 3, 2 - b, 6, 6, '#f0c896'); ell(w / 2 + 8, 16 - b, 5, 4, '#a06a35');
        if (night) flame(12, 24, 0.5), flame(w - 12, 24, 0.5);
        break;
      }
      case 'archery': {
        R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : '#8a9a5a'); ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.strokeRect(X + 2, Y + 2, w - 4, h - 4);
        for (const x of [22, 52, 80]) { R(x - 1, 20, 3, 30, '#6b4423'); ell(x, 22, 11, 11, '#efe6d2'); ell(x, 22, 7, 7, '#c8302a'); ell(x, 22, 3, 3, '#ffd54a'); }
        R(w - 14, h - 22, 3, 18, '#6b4423'); R(w - 18, h - 12, 12, 3, '#a8885a');
        break;
      }
      case 'big_chest': { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X + 3, Y + 26, w - 6, 5); R(4, 10, w - 8, 18, '#7a4a22'); R(4, 6, w - 8, 8, '#9a6030'); R(4, 14, w - 8, 2, '#4a2a12'); for (const x of [4, w / 2 - 2, w - 8]) R(x, 6, 4, 22, '#6a6a72'); R(w / 2 - 4, 12, 8, 7, '#ffd54a'); break; }
      case 'cellar': {
        shadow(); ctx.fillStyle = '#7d7f86'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h - 10, w / 2 - 4, h / 2, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#4f8a36'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h - 22, w / 2 - 8, h / 2 - 14, 0, Math.PI, 0); ctx.fill();
        R(w / 2 - 10, h - 24, 20, 20, '#3a2410'); ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 24, 10, Math.PI, 0); ctx.fill();
        R(w / 2 - 1, h - 30, 2, 26, '#5a3a1e'); R(6, h - 12, 10, 10, '#7a4a22'); R(6, h - 9, 10, 2, '#3a3a3a'); sign(w - 20, h - 18, '🍷');
        break;
      }
      case 'kennel': {
        shadow(); R(6, 24, w - 12, h - 28, '#9a6a3a'); roof(4, 8, w - 8, 18, '#7a3a2a'); ctx.fillStyle = '#1a120a'; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 6, 9, Math.PI, 0); ctx.fill(); R(w / 2 - 9, h - 6, 18, 2, '#1a120a');
        ell(w - 12, h - 4, 6, 3, '#c8c8d0'); R(w - 16, h - 9, 8, 4, '#e8e0d0'); R(8, 30, 14, 8, '#5a3a1e'); ctx.font = '9px sans-serif'; ctx.fillText('🐕', X + 9, Y + 38);
        break;
      }
      case 'archer_tower': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 6, w - 8, 8);
        R(8, -20, w - 16, h + 14, '#8f8a80'); for (let k = -16; k < h - 4; k += 7) R(8, k, w - 16, 1, '#6f6a62'); R(w / 2 - 5, h - 16, 10, 14, '#3a2410');
        R(4, -30, w - 8, 12, '#a5a7ad'); for (let k = 4; k < w - 4; k += 8) R(k, -36, 5, 7, '#a5a7ad'); R(w / 2 - 3, -8, 6, 8, '#2a2a3a');
        flag(w - 10, -36, PLAYER_COLOR);
        break;
      }
      case 'spikes': { for (const [x, y] of [[6, 20], [14, 14], [22, 20], [10, 26], [20, 27]]) { ctx.fillStyle = '#7a5230'; ctx.beginPath(); ctx.moveTo(X + x - 3, Y + y + 4); ctx.lineTo(X + x + 1, Y + y - 8); ctx.lineTo(X + x + 4, Y + y + 4); ctx.fill(); R(x, y - 8, 1, 2, '#c8b88a'); } break; }
      case 'armory': { shadow(); R(4, 22, w - 8, h - 26, '#8f8a80'); for (let k = 26; k < h - 6; k += 6) R(4, k, w - 8, 1, '#6f6a62'); roof(2, 4, w - 4, 20, '#4a4a52'); R(w / 2 - 7, h - 20, 14, 16, '#3a2410'); for (const x of [10, w - 22]) { R(x, 30, 12, 14, '#5a3a1e'); R(x + 5, 31, 2, 12, '#cfd6dd'); R(x + 2, 34, 8, 2, '#b8862a'); } flag(w / 2 - 1, 6, PLAYER_COLOR); break; }
      case 'biz_carpentry': house('#c9a978', '#6a4a2a'); R(8, h - 12, 24, 4, '#c89a5a'); R(8, h - 7, 24, 3, '#b8884a'); sign(w - 24, 30, '🪚'); break;
      case 'biz_chandler': house('#e8dcc0', '#8a6a2a'); sign(w - 22, 30, '🕯️'); for (let k = 0; k < 3; k++) { R(10 + k * 6, h - 12, 3, 8, '#efe8d8'); flame(11.5 + k * 6, h - 12, 0.3); } break;
      case 'biz_pottery': { house('#c8865a', '#7a3a2a'); for (let k = 0; k < 4; k++) { ell(12 + k * 10, h - 8, 4, 5, '#a8553a'); R(10 + k * 10, h - 14, 4, 2, '#8a4430'); } sign(w - 24, 30, '🏺'); break; }
      case 'biz_bank': { shadow(); R(6, 22, w - 12, h - 26, '#e6dfcc'); for (const x of [12, 30, 48, 66, 84]) R(x, 28, 5, h - 34, '#c8bfa8'); ctx.fillStyle = '#5a5a6a'; ctx.beginPath(); ctx.moveTo(X + 2, Y + 24); ctx.lineTo(X + w / 2, Y + 4); ctx.lineTo(X + w - 2, Y + 24); ctx.fill(); ell(w / 2, 16, 6, 6, '#ffd54a'); R(w / 2 - 6, h - 20, 12, 16, '#4a2e16'); break; }
      case 'biz_dairy': { house('#efe6d2', '#3a6a8a'); sign(w - 24, 30, '🧀'); for (let k = 0; k < 2; k++) { R(10 + k * 12, h - 14, 8, 10, '#c8c8d0'); R(11 + k * 12, h - 16, 6, 2, '#e8e8f0'); } break; }
      default: d0(ctx, s, X, Y, time, H);
    }
  };
}

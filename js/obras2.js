'use strict';
// Obras, segunda parte:
//  • 🏛️ Quatro Grandes Obras reais novas: Arsenal Real (o portão do castelo aguenta +30% nos cercos), Hospital Real
//    (+3 de felicidade e os soldados se recuperam: +1 na guarnição a cada 2 meses), Grande Mercado (+6% de impostos) e
//    Estábulos Reais (+3 cavaleiros em cada batalha).
//  • 🛢️ Óleo quente (Obras do reino, ao lado do castelo): caldeirões nas ameias sobre o portão. Num cerco ao seu castelo,
//    quem estiver no pé do portão leva óleo fervendo a cada 1,5 s — quanto mais alto o nível, mais queima. Os reinos da
//    IA também instalam com as eras (e você leva o óleo deles quando ataca).
//  • Janelas: as listas que crescem com o jogo (feudos, audiências, cavaleiros, herdeiros, crônica) rolam dentro do próprio
//    quadro em vez de abrir outra página; os botões da Diplomacia ficam curtos para cada reino caber numa linha.
Object.assign(WORKS, {
  arsenal:   { icon: '🛡️', name: 'Arsenal Real', gold: 2200, months: 8, desc: 'Armas e ferreiros na capital: o portão do castelo aguenta +30% nos cercos.' },
  hospital:  { icon: '🏥', name: 'Hospital Real', gold: 1400, months: 6, desc: 'Cura o povo e os soldados: +3 de felicidade e +1 soldado na guarnição a cada 2 meses.' },
  mercado:   { icon: '🏪', name: 'Grande Mercado', gold: 1600, months: 6, desc: 'Um mercado coberto na capital: +6% de impostos para sempre.' },
  estabulos: { icon: '🐎', name: 'Estábulos Reais', gold: 1800, months: 7, desc: 'Cavalos de guerra criados pela coroa: +3 cavaleiros em cada batalha.' },
});
const OIL_MAX = 5;
const Oil = {
  lvl(ci) { const c = G.civs[ci]; return c && c.invest ? (c.invest.oil || 0) : 0; },
  cost(ci) { const L = this.lvl(ci); return { gold: 200 + L * 150, wood: 30 + L * 10, iron_ore: 10 + L * 5 }; },
  buy(ci) {
    const c = G.civs[ci], L = this.lvl(ci); if (!c || L >= OIL_MAX) return;
    const cost = this.cost(ci), have = r => r === 'gold' ? c.treasury : (c.stock[r] || 0);
    if (!Object.entries(cost).every(([r, n]) => have(r) >= n)) { UI.msg('Falta ouro ou material no tesouro e nos armazéns do reino.', 'bad'); return; }
    for (const [r, n] of Object.entries(cost)) { if (r === 'gold') c.treasury -= n; else c.stock[r] -= n; }
    c.invest.oil = L + 1; UI.msg(`🛢️ Óleo quente de ${CIV_DEFS[ci].short} agora no nível ${L + 1}: ${this.dmg(L + 1)} de dano em quem estiver no pé do portão.`, 'gold');
  },
  dmg(L) { return 8 + L * 7; },
  html(ci) {
    const L = this.lvl(ci), max = L >= OIL_MAX, cost = this.cost(ci), c = G.civs[ci], have = Reinado.have(c), ok = !max && Object.entries(cost).every(([r, n]) => have(r) >= n);
    return Reinado.it('🛢️', `Óleo quente <i>nível ${L}/${OIL_MAX}</i>`, `${L ? `queima ${this.dmg(L)} de vida` : 'caldeirões nas ameias'} de quem chega ao portão nos cercos${max ? '' : `<span class="cost">${UI.fmtCost(cost, have)}</span>`}`,
      max ? '<span class="ok">✔ máximo</span>' : `<button class="primary" data-act="oilbuy" data-c="${ci}" ${ok ? '' : 'disabled'}>${L ? 'Melhorar' : 'Instalar'}</button>`);
  },
  // no cerco a um castelo: quem ataca e está no pé do portão leva óleo
  t: 0, warned: false,
  update(dt) {
    const A = typeof Assault !== 'undefined' ? Assault.A() : null, B = G.place;
    if (!A || A.village !== undefined || !B || B.done || B.phase !== 'fight' || A.gateHp <= 0) return;
    const L = this.lvl(A.def); if (!L) return;
    this.t -= dt; if (this.t > 0) return; this.t = 1.5;
    const m = Assault.gateMid(), fx = (A.x0 - 1.4) * TILE, d = this.dmg(L);
    let hit = 0;
    const burn = e => { Game.damage(e, d, null); hit++; };
    for (const e of G.ents) if (!e.dead && e.battle === B.id && e.wside === A.att && e.faction !== 'engine' && Math.abs(e.x - fx) < 2.6 * TILE && Math.abs(e.y - m.y) < 2.6 * TILE) burn(e);
    if (A.mode === 'attack' && Math.abs(P.x - fx) < 2.6 * TILE && Math.abs(P.y - m.y) < 2.6 * TILE) { Game.damage(P, Math.round(d * 0.6), null); hit++; }
    if (hit) {
      for (let k = 0; k < 3; k++) Game.burst(fx + U.rnd(-20, 20), m.y + U.rnd(-30, 20), k % 2 ? '#ffb030' : '#5a3a10', 6);
      if (!this.warned) { this.warned = true; UI.banner('🛢️ Óleo quente do alto das muralhas!'); }
    }
  },
  // os reinos da IA instalam com as eras
  npcTick() {
    const top = typeof Era !== 'undefined' ? Math.min(OIL_MAX, Math.floor(Era.years() / 150)) : 0;
    for (const c of G.civs) if (c && !c.dead && c.ruler !== 'player' && c.invest && (c.invest.oil || 0) < top && c.treasury > 1500 && Math.random() < 0.15) { c.invest.oil = (c.invest.oil || 0) + 1; c.treasury -= 300; }
  },
};

{
  // efeitos das obras novas
  const im0 = Crown.incomeMul.bind(Crown); Crown.incomeMul = function (c) { return im0(c) * (this.built(c, 'mercado') ? 1.06 : 1); };
  const hb0 = Crown.happyBonus.bind(Crown); Crown.happyBonus = function (c) { return hb0(c) + (c && c.ruler === 'player' && this.built(c, 'hospital') ? 3 : 0); };
  const wm0 = Crown.worksMonth.bind(Crown); Crown.worksMonth = function (c) { const r = wm0(c); if (this.built(c, 'hospital') && G.day % 2 === 0 && c.garrison < Game.maxGarrison(c)) c.garrison++; return r; };
  const ar0 = War.armyOf.bind(War); War.armyOf = function (ci, cfg) { const a = ar0(ci, cfg); if (Crown.built(G.civs[ci], 'estabulos')) a.cav = (a.cav || 0) + 3; return a; };
  const as0 = Assault.start.bind(Assault);
  Assault.start = function (wc) { const r = as0(wc), A = Assault.A(); if (A && A.village === undefined && Crown.built(G.civs[A.def], 'arsenal')) { A.gateMax = A.gateHp = Math.round(A.gateMax * 1.3); } Oil.warned = false; Oil.t = 2; return r; };
  // o óleo nos cercos e os caldeirões desenhados sobre o portão
  const up0 = War.update.bind(War); War.update = function (dt) { const r = up0(dt); try { Oil.update(dt); } catch (e) { console.error(e); } return r; };
  const mt0 = Lifesim.monthTick.bind(Lifesim); Lifesim.monthTick = function () { mt0(); try { Oil.npcTick(); } catch (e) { console.error(e); } };
  // a janela de Obras: o óleo ao lado do castelo; as obras reais em quatro colunas
  const ob0 = Reinado.T.obras.bind(Reinado.T);
  Reinado.T.obras = function (ci, c, ...a) {
    const html = ob0(ci, c, ...a);
    try {
      const t = document.createElement('template'); t.innerHTML = html;
      const g = t.content.querySelector('.rn-inv .rn-grid3'); if (g) g.insertAdjacentHTML('beforeend', Oil.html(ci));
      return [...t.content.childNodes].map(n => n.outerHTML || n.textContent || '').join('');
    } catch (e) { console.error(e); return html; }
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'oilbuy') { Oil.buy(+d.c); this.refresh(); return; } return a0(a, d); };
}

// ---------------------------------------------------------------- janelas: rolagem nas listas que crescem; diplomacia curta
{
  // move o conteúdo do quadro (menos o título) para uma caixa que rola por dentro
  const scrollify = (html, sels) => {
    const t = document.createElement('template'); t.innerHTML = html;
    for (const card of t.content.querySelectorAll(sels)) {
      if (card.querySelector(':scope > .kscroll')) continue;
      const box = document.createElement('div'); box.className = 'kscroll';
      for (const n of [...card.childNodes]) if (!(n.nodeType === 1 && n.matches('.sec'))) box.appendChild(n);
      card.appendChild(box);
    }
    return [...t.content.childNodes].map(n => n.outerHTML || n.textContent || '').join('');
  };
  for (const [tab, sels] of [['vassalos', '.rn-fiefs, .rn-auds, .rn-knights, .rn-grant'], ['corte', '.rn-heirs, .rn-chron']]) {
    const f0 = Reinado.T[tab].bind(Reinado.T);
    Reinado.T[tab] = function (...a) { const h = f0(...a); if (document.body.classList.contains('small')) return h; try { return scrollify(h, sels); } catch (e) { console.error(e); return h; } };
  }

}

// os caldeirões de óleo nas ameias, sobre o portão (só no castelo que tem óleo)
{
  if (typeof FURN !== 'undefined') FURN.bf_oilpot = {};
  const as1 = Assault.start.bind(Assault);
  Assault.start = function (wc) {
    const r = as1(wc), A = Assault.A();
    if (A && A.village === undefined && Oil.lvl(A.def)) for (const dy of [-1, 3]) Places.furn.push(Object.assign({ k: 'bf_oilpot', x: A.x0, y: A.gy + dy, w: 2, h: 1, id: Places.furn.length, lvl: Oil.lvl(A.def) }, FURN.bf_oilpot));
    return r;
  };
  const df0 = drawFurn;
  // eslint-disable-next-line no-global-assign
  drawFurn = function (ctx, f, X, Y, time) {
    if (f.k !== 'bf_oilpot') return df0(ctx, f, X, Y, time);
    const cx = X + 32, cy = Y - 30;
    ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(cx, cy, 13, 9, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(cx - 13, cy - 6, 26, 6);
    ctx.fillStyle = '#5a5f66'; ctx.fillRect(cx - 14, cy - 8, 28, 3);
    ctx.fillStyle = `rgba(${200 + f.lvl * 10},${120 + f.lvl * 10},30,0.9)`; ctx.beginPath(); ctx.ellipse(cx, cy - 6, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 3; k++) { const ph = (time * 0.8 + k * 0.33) % 1; ctx.fillStyle = `rgba(230,230,230,${0.35 * (1 - ph)})`; ctx.beginPath(); ctx.arc(cx - 6 + k * 6, cy - 10 - ph * 20, 3 + ph * 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ff9a30'; ctx.fillRect(cx - 8, cy + 6, 4, 3); ctx.fillRect(cx + 3, cy + 6, 4, 3);
  };
}

// Mais quatro Grandes Obras reais, e o que cada obra rende ao reino (no título do cartão: ouro por mês calculado com os
// impostos de agora, trigo, soldados, felicidade...)
Object.assign(WORKS, {
  moeda:     { icon: '🪙', name: 'Casa da Moeda', gold: 2000, months: 8, desc: 'A coroa cunha as próprias moedas: +60 🪙 por mês no tesouro.' },
  oficinas:  { icon: '⚒️', name: 'Oficinas Reais', gold: 1500, months: 6, desc: 'Lenhadores e canteiros da coroa: +12 de madeira e +8 de pedra por mês nos armazéns.' },
  termas:    { icon: '♨️', name: 'Termas Reais', gold: 1100, months: 5, desc: 'Banhos quentes abertos ao povo na capital: +4 de felicidade.' },
  arqueiros: { icon: '🏹', name: 'Escola de Arqueiros', gold: 1700, months: 7, desc: 'Arqueiros treinados pela coroa: +10% de arqueiros em cada batalha.' },
});
const MINT_GOLD = 60, SHOP_WOOD = 12, SHOP_STONE = 8;
// quanto a obra rende (ou renderia) ao reino
Crown.workGain = function (c, k) {
  const fc = Game.civForecast(c), base = fc.income / Math.max(0.1, this.incomeMul(c));
  const pct = { estrada: 0.06, porto: 0.08, universidade: 0.05, mercado: 0.06 }[k];
  const gold = pct ? Math.round(base * pct) : k === 'moeda' ? MINT_GOLD : 0;
  const wheat = k === 'celeiro' ? Math.round(((fc.prod && fc.prod.wheat) || 0) * (this.built(c, 'celeiro') ? 0.15 / 1.15 : 0.15)) : 0;
  const extra = { celeiro: `+${wheat} 🌾/mês`, muralhas: '+1 nível de muralha', quartel: '+1 🛡️/mês', jardins: '+3 😊 · +10 fama', universidade: '+3 😊', catedral: '+5 😊 · +3 🙏/mês',
    arsenal: 'portão +30%', hospital: '+3 😊 · +½ 🛡️/mês', estabulos: '+3 🐎 na guerra', oficinas: `+${SHOP_WOOD} 🪵 +${SHOP_STONE} 🪨/mês`, termas: '+4 😊', arqueiros: '+10% 🏹 na guerra' }[k];
  return [gold ? `+${gold.toLocaleString('pt-BR')} 🪙/mês` : '', extra || ''].filter(Boolean).join(' · ');
};
{
  const hb1 = Crown.happyBonus.bind(Crown); Crown.happyBonus = function (c) { return hb1(c) + (c && c.ruler === 'player' && this.built(c, 'termas') ? 4 : 0); };
  const wm1 = Crown.worksMonth.bind(Crown);
  Crown.worksMonth = function (c) {
    const r = wm1(c);
    if (this.built(c, 'moeda')) c.treasury += MINT_GOLD;
    if (this.built(c, 'oficinas')) { c.stock.wood = (c.stock.wood || 0) + SHOP_WOOD; c.stock.stone = (c.stock.stone || 0) + SHOP_STONE; }
    return r;
  };
  const ar1 = War.armyOf.bind(War); War.armyOf = function (ci, cfg) { const a = ar1(ci, cfg); if (Crown.built(G.civs[ci], 'arqueiros')) a.archers = Math.min(70, (a.archers || 0) + 10); return a; };
  // a Casa da Moeda aparece nas entradas do mês do tesouro
  const tm0 = Treasury.month.bind(Treasury);
  Treasury.month = function (c) {
    const f = tm0(c);
    if (c && c.ruler === 'player' && !c.anarchy && Crown.built(c, 'moeda')) { f.inc.push(['🪙 Casa da Moeda', MINT_GOLD, false]); f.tin += MINT_GOLD; f.net += MINT_GOLD; f.netMust += MINT_GOLD; }
    return f;
  };
}

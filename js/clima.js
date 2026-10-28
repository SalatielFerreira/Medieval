'use strict';
// Estações e clima mexendo no jogo (antes eram só a paisagem e a chuva na tela):
//  • ❄️ Inverno: a comida fica 25% mais cara (e vende 20% mais caro), a neve deixa as estradas mais lentas e o frio tira
//    um pouco da prosperidade das vilas.
//  • 🍂 Outono: a colheita enriquece as vilas (prosperidade), enche o tesouro dos reinos (imposto da colheita) e os
//    armazéns de trigo; a comida fica 15% mais barata.
//  • 🌦️ O tempo de cada mês, reino por reino: seco, normal, chuvoso, tempestades ou nevasca. Mês seco no verão é seca
//    (comida mais cara, vilas perdem prosperidade); chuva na primavera e no verão é boa para as plantações; e a chuva, a
//    tempestade e a nevasca atrapalham quem ataca aquele reino (lama, arcos molhados, cavalos atolados).
//  • A chuva que cai na tela segue o tempo do reino onde o herói está.
const CLIMA = {
  seco:       { icon: '☀️', name: 'Mês seco',     rain: 0.04, atk: 1,    road: 1 },
  normal:     { icon: '⛅', name: 'Tempo normal', rain: null, atk: 1,    road: 1 },
  chuva:      { icon: '🌧️', name: 'Mês chuvoso',  rain: 0.62, atk: 0.85, road: 1 },
  tempestade: { icon: '⛈️', name: 'Tempestades',  rain: 0.75, atk: 0.7,  road: 0.9 },
  nevasca:    { icon: '🌨️', name: 'Nevasca',      rain: 0.85, atk: 0.75, road: 0.85 },
};
// chance de cada tempo por estação (primavera, verão, outono, inverno)
const CLIMA_P = [
  { seco: 0.1,  normal: 0.5,  chuva: 0.3,  tempestade: 0.1 },
  { seco: 0.35, normal: 0.45, chuva: 0.1,  tempestade: 0.1 },
  { seco: 0.1,  normal: 0.45, chuva: 0.35, tempestade: 0.1 },
  { seco: 0.05, normal: 0.55, chuva: 0.1,  nevasca: 0.3 },
];
const CLIMA_FOOD = [1, 1, 0.85, 1.25];   // preço da comida por estação
const CLIMA_ROAD_WINTER = 0.8;           // neve nas estradas
const HARVEST_TAX = 15;                  // Salin por vila do reino, em cada mês do outono

const Clima = {
  S() { const u = G.urban || (G.urban = {}); return u.clima || (u.clima = { day: -1, w: {} }); },
  // o tempo deste mês no reino ci (sorteado na virada do mês)
  kind(ci) { const S = this.S(); if (S.day !== G.day) this.roll(); return CLIMA[S.w[ci]] ? S.w[ci] : 'normal'; },
  of(ci) { return CLIMA[this.kind(ci)]; },
  roll() {
    const S = this.S(), s = Season.idx(); S.day = G.day; S.w = {};
    for (const c of G.civs) {
      let r = Math.random(), k = 'normal';
      for (const [kk, p] of Object.entries(CLIMA_P[s])) { if (r < p) { k = kk; break; } r -= p; }
      S.w[c.id] = k;
    }
  },
  // o reino onde fica este bloco (ou onde está o herói)
  civAt(tx, ty) { if (!World.terr || !World.inb(tx, ty)) return -1; const t = World.terr[World.idx(tx, ty)]; return t >= 0 && G.civs[t] ? t : -1; },
  here() { return G.place || G.dungeon ? -1 : this.civAt(Math.floor(P.x / TILE), Math.floor(P.y / TILE)); },
  // seca: mês seco no verão
  drought(ci) { return Season.idx() === 1 && this.kind(ci) === 'seco'; },
  food(ci) { return CLIMA_FOOD[Season.idx()] * (ci >= 0 && this.drought(ci) ? 1.1 : 1); },
  // força de quem ataca o reino ci (a lama e a chuva são do lugar da batalha)
  atk(ci) { return ci >= 0 && G.civs[ci] ? this.of(ci).atk : 1; },
  // chance de chover onde o herói está (null = a de sempre)
  rainHere(s) { const ci = this.here(); if (ci < 0) return null; const k = this.of(ci); if (s === 3 && this.kind(ci) !== 'nevasca' && this.kind(ci) !== 'chuva') return k.rain === null ? null : Math.min(k.rain, 0.3); return k.rain; },
  // as estradas no frio e na tempestade
  roadMul(tx, ty) {
    let m = Season.winter() ? CLIMA_ROAD_WINTER : 1;
    const ci = this.civAt(tx, ty); if (ci >= 0) m *= this.of(ci).road;
    return m;
  },
  // o que a estação e o tempo fazem, em palavras
  seasonLines(s) {
    return [
      ['🌱 As plantações voltam a crescer.', '🌧️ Chuva nesta estação é boa para as vilas.'],
      ['☀️ Dias longos.', '🔥 Mês seco no verão é seca: comida 10% mais cara e as vilas perdem prosperidade.', '🌧️ Chuva é boa para as plantações.'],
      ['🍂 Colheita: as vilas prosperam e cada reino recebe o imposto da colheita.', '🥖 Comida 15% mais barata.'],
      ['🥶 Comida 25% mais cara (e vende 20% mais caro).', `🛷 Neve: estradas ${Math.round((1 - CLIMA_ROAD_WINTER) * 100)}% mais lentas.`, '🏚️ O frio tira um pouco da prosperidade das vilas.'],
    ][s];
  },
  kindLine(k) {
    return { seco: 'quem ataca não sofre nada', normal: 'nada muda', chuva: 'quem ataca este reino perde 15% da força', tempestade: 'quem ataca perde 30% da força; estradas 10% mais lentas', nevasca: 'quem ataca perde 25% da força; estradas 15% mais lentas' }[k];
  },
  // ---------------------------------------------------------------- a virada do mês
  monthTick() {
    if (this.S().day !== G.day) this.roll();
    const s = Season.idx(), mine = [];
    World.villages.forEach((v, vi) => {
      if (!v) return;
      const ci = v.free ? -1 : v.civ, k = ci >= 0 ? this.kind(ci) : 'normal';
      let d = 0;
      if (s === 3) d -= 0.5;                                     // frio
      if (s === 2) d += 1.5;                                     // colheita
      if ((s === 0 || s === 1) && k === 'chuva') d += 0.5;       // chuva boa
      if (s === 1 && k === 'seco') d -= 1;                       // seca
      if (d) v.prosper = U.clamp((v.prosper || 0) + d, 0, typeof PROSPER_MAX !== 'undefined' ? PROSPER_MAX : 140);
    });
    if (s === 2) {
      for (const c of G.civs) {
        if (c.dead || c.anarchy) continue;
        const n = World.villages.filter(v => v && !v.free && v.civ === c.id && !v.ruin).length; if (!n) continue;
        const g = n * HARVEST_TAX; c.treasury += g;
        if (c.stock && c.stock.wheat !== undefined) c.stock.wheat = Math.min(3000, c.stock.wheat + n * 6);
        if (c.ruler === 'player') mine.push(`${CIV_DEFS[c.id].short} +${g} 🪙`);
      }
      if (mine.length) Game.note(`🍂 Imposto da colheita: ${mine.join(' · ')}.`, 'gold');
    }
    // o tempo do mês onde você está e nos seus reinos
    const ci = this.here(), k = ci >= 0 ? this.kind(ci) : 'normal';
    if (ci >= 0 && k !== 'normal') UI.msg(`${CLIMA[k].icon} ${CLIMA[k].name} em ${CIV_DEFS[ci].short}${this.drought(ci) ? ' — seca! A comida está mais cara' : ''}: ${this.kindLine(k)}.`, k === 'seco' && !this.drought(ci) ? '' : 'bad');
    for (const c of G.civs) if (c.ruler === 'player' && c.id !== ci && this.kind(c.id) !== 'normal') { const kk = this.kind(c.id); Game.note(`${CLIMA[kk].icon} ${CLIMA[kk].name} no seu reino de ${CIV_DEFS[c.id].short}${this.drought(c.id) ? ' (seca)' : ''}.`); }
  },
  // ---------------------------------------------------------------- a página
  page() {
    const s = Season.idx(), cur = SEASONS[s], cd = Calendar.of(G.day), esc = UI.esc.bind(UI);
    let left = 1; while (left < 12 && Season.idx(G.day + left) === s) left++;
    const next = SEASONS[(s + 1) % 4], here = this.here();
    const seasonCard = `<div class="card cl-season cl-s${s}"><div class="cl-big">${cur.icon}</div><div><h3>${cur.name}</h3><small class="muted">${esc(Calendar.short(G.day))} · ${next.icon} ${next.name} em ${left} ${left === 1 ? 'mês' : 'meses'}</small>
      <ul>${this.seasonLines(s).map(x => `<li>${x}</li>`).join('')}</ul></div></div>`;
    const rows = G.civs.filter(c => !c.dead).map(c => {
      const k = this.kind(c.id), K = CLIMA[k], f = this.food(c.id), mine = c.ruler === 'player';
      return `<div class="crow cl-row ${here === c.id ? 'here' : ''}"><span class="ri">${K.icon}</span><span><b>${Heraldry.armsSvg(c.id, 14)} ${CIV_DEFS[c.id].short}${mine ? ' <span class="tag">seu reino</span>' : ''}${here === c.id ? ' <span class="tag">você está aqui</span>' : ''}</b>
        <small>${K.name}${this.drought(c.id) ? ' — <b class="bad">seca</b>' : ''} · ${this.kindLine(k)} · comida ${f === 1 ? 'no preço normal' : `<b class="${f > 1 ? 'bad' : 'ok'}">${f > 1 ? '+' : ''}${Math.round((f - 1) * 100)}%</b>`}</small></span></div>`;
    }).join('');
    const year = SEASONS.map((x, i) => `<div class="cl-yr ${i === s ? 'on' : ''}"><b>${x.icon} ${x.name}</b><small>${this.seasonLines(i)[0]}</small></div>`).join('');
    return `${seasonCard}<div class="card"><div class="sec">🌦️ O tempo deste mês <span>muda a cada mês, reino por reino</span></div>${rows}</div><div class="card"><div class="sec">📅 O ano</div><div class="cl-year">${year}</div></div>`;
  },
};

{
  // preço da comida pela estação e pela seca
  const pr0 = Game.price.bind(Game);
  Game.price = function (ci, k) {
    const r = pr0(ci, k), it = ITEMS[k]; if (!it || it.cat !== 'Comida') return r;
    const s = Season.idx(), f = Clima.food(ci), fs = s === 3 ? 1.2 / 1.25 : 1; // no inverno a venda sobe 20% (a compra, 25%)
    return { buy: Math.max(1, Math.round(r.buy * f)), sell: Math.max(1, Math.round(r.sell * f * fs)) };
  };
  // estradas mais lentas na neve e na tempestade (fora das salas e cavernas)
  const sa0 = World.speedAt.bind(World);
  World.speedAt = function (px, py) {
    const v = sa0(px, py); if (G.place || G.dungeon) return v;
    const tx = Math.floor(px / TILE), ty = Math.floor((py - 2) / TILE), t = this.tile(tx, ty);
    return t === T.ROAD || t === T.BRIDGE ? v * Clima.roadMul(tx, ty) : v;
  };
  // a virada do mês: o tempo novo antes de tudo (os preços do mês já saem com ele)
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { Clima.monthTick(); mt0(); };
  // a estação nova conta o que muda no jogo
  const ap0 = Season.apply.bind(Season);
  Season.apply = function (announce) { const was = World.season, r = ap0(announce); if (announce && World.season !== was) UI.msg(`${SEASONS[World.season].icon} ${Clima.seasonLines(World.season).join(' ')}`, 'gold'); return r; };
}

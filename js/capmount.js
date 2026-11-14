'use strict';
// Vida e cavalo dos capangas. Curar: na janela Equipar, comida e remédios da sua mochila (cada um cura o dobro no
// capanga, que tem mais vida). Cavalo: na janela Equipar do capanga você entrega um cavalo do seu haras ou compra um na hora
// (as raças do haras). Montado, o capanga anda mais rápido (acompanha você a cavalo), tem mais vida e dá um golpe
// um pouco mais forte; dentro dos imóveis ele desce do cavalo, como todo mundo. Tirar o cavalo devolve ao haras.
const CAP_HORSE_HP = 1.2, CAP_HORSE_DMG = 2;

const CapMount = {
  // p.horse é a cor (como o cavalo dos moradores); p.horseData guarda o cavalo inteiro para voltar ao haras
  has(p) { return !!(p && p.capanga && p.horse); },
  speed(p) { const h = p.horseData; return 1.3 + (h && h.speed ? h.speed * 0.025 : 0.15); },
  give(p, id) {
    if (!p || !p.capanga || p.horse) return;
    const H = Horses.herd(), h = H.find(x => x.id === id); if (!h) return;
    if (!Horses.adult(h)) { UI.msg(`${h.name} ainda é um potro: espere crescer.`, 'bad'); return; }
    Horses.S().herd = H.filter(x => x !== h);
    this.mount(p, h);
    UI.msg(`🐎 ${p.name} agora monta ${h.name}.`, 'gold');
  },
  buy(p, breed) {
    const B = HORSE_BREEDS[breed]; if (!p || !p.capanga || p.horse || !B) return;
    if (P.gold < B.price) { UI.msg(`O ${B.name} custa ${B.price} 🪙.`, 'bad'); return; }
    P.gold -= B.price; const h = Horses.make(breed);
    this.mount(p, h); Sound.play('neigh');
    UI.msg(`🐎 Você comprou ${h.name} (${B.name}) para ${p.name}.`, 'gold');
  },
  mount(p, h) {
    p.horse = Horses.key(h); p.horseData = h;
    const e = G.spawned.get(p.id); if (e) e._hs = 0;
    Game.refreshCapanga(p);
  },
  take(p) {
    if (!this.has(p)) return;
    const h = p.horseData; p.horse = null; p.horseData = null;
    if (h) { h.stall = null; Horses.herd().push(h); }
    const e = G.spawned.get(p.id); if (e && e._hs) { e.spMul = (e.spMul || 1) / (e._hsMul || 1.35); e._hs = 0; }
    Game.refreshCapanga(p);
    UI.msg(`🐎 ${h ? h.name + ' voltou para o seu haras' : 'O cavalo voltou para você'}.`);
  },
  // ---------------------------------------------------------------- curar o capanga (comida e remédios da sua mochila)
  hp(p) { const e = G.spawned.get(p.id), st = People.capangaStats(p); return { e, hp: e ? Math.round(e.hp) : st.hp, max: e ? Math.round(e.maxHp) : st.hp }; },
  healItems() { return Object.keys(P.inv).filter(k => P.inv[k] > 0 && ITEMS[k] && ITEMS[k].heal > 0).sort((a, b) => ITEMS[a].heal - ITEMS[b].heal); },
  heal(p, k) {
    const it = ITEMS[k], H = this.hp(p); if (!it || !it.heal || !Inv.count(k)) return;
    if (!H.e) { UI.msg(`${p.name} não está por perto.`, 'bad'); return; }
    if (H.hp >= H.max) { UI.msg(`${p.name} já está com a vida cheia.`); return; }
    Inv.pay({ [k]: 1 });
    const gain = Math.min(H.max - H.e.hp, it.heal * 2); H.e.hp += gain; // no capanga o remédio rende o dobro (vida maior que a sua)
    Sound.play('pickup'); UI.msg(`❤️ ${p.name} recuperou ${Math.round(gain)} de vida (${it.name}).`, 'gold');
  },
  healHtml(p) {
    const H = this.hp(p), list = this.healItems(), pct = Math.round(H.hp / Math.max(1, H.max) * 100);
    const btns = list.map(k => `<button data-act="capHeal" data-id="${p.id}" data-k="${k}" ${H.e && H.hp < H.max ? '' : 'disabled'}>${UI.ii(k)} ${UI.esc(ITEMS[k].name)} <small>+${ITEMS[k].heal * 2} · ×${Inv.count(k)}</small></button>`).join('');
    return `<div class="sec" style="margin-top:10px">❤️ Vida <span>${H.hp} / ${H.max}</span></div><div class="cm-life"><i style="width:${pct}%" class="${pct < 35 ? 'low' : ''}"></i></div>
      ${!H.e ? '<small class="muted">Chame o capanga para perto para cuidar dele.</small>' : list.length ? `<div class="act-row cm-list">${btns}</div>` : '<small class="muted">Sem comida ou remédio que cure na mochila (frutas, pão, poções, ervas...).</small>'}`;
  },
  // o quadro do cavalo na janela Equipar do capanga
  html(p) {
    const esc = UI.esc.bind(UI), id = p.id;
    if (this.has(p)) {
      const h = p.horseData || {}, B = HORSE_BREEDS[h.breed];
      return `<div class="sec" style="margin-top:10px">🐎 Cavalo</div><div class="cm-row cm-on"><span class="cm-horse" style="--hc:${p.horse}">🐎</span>
        <span class="cm-tx"><b>${esc(h.name || 'Cavalo')}</b><small>${B ? B.name + ' · ' : ''}anda ${Math.round((this.speed(p) - 1) * 100)}% mais rápido · +${Math.round((CAP_HORSE_HP - 1) * 100)}% de vida · +${CAP_HORSE_DMG} de dano</small></span>
        <button data-act="capHorseOff" data-id="${id}">Tirar o cavalo</button></div>`;
    }
    const herd = Horses.herd().filter(h => Horses.adult(h) && !h.foal);
    const mine = herd.map(h => `<button data-act="capHorse" data-id="${id}" data-h="${h.id}"><span class="cm-dot" style="--hc:${h.color}"></span>${esc(h.name)} <small>${HORSE_BREEDS[h.breed] ? HORSE_BREEDS[h.breed].name : ''}</small></button>`).join('');
    const shop = Object.entries(HORSE_BREEDS).map(([k, B]) => `<button data-act="capHorseBuy" data-id="${id}" data-k="${k}" ${P.gold >= B.price ? '' : 'disabled'}>${B.name} <small>${B.price} 🪙</small></button>`).join('');
    return `<div class="sec" style="margin-top:10px">🐎 Cavalo <span>montado, anda mais rápido e aguenta mais</span></div>
      ${mine ? `<small class="muted">Do seu haras:</small><div class="act-row cm-list">${mine}</div>` : ''}
      <small class="muted">Comprar um para ${esc(p.name)}:</small><div class="act-row cm-list">${shop}</div>`;
  },
};

{
  // montado: mais vida e golpe um pouco mais forte
  const cs0 = People.capangaStats.bind(People);
  People.capangaStats = function (p) {
    const st = cs0(p);
    if (CapMount.has(p)) { st.hp = Math.round(st.hp * CAP_HORSE_HP); st.dmg += CAP_HORSE_DMG; }
    return st;
  };
  // o quadro do cavalo entra na janela Equipar, antes do equipamento
  const eq0 = UI.showEquipC.bind(UI);
  UI.showEquipC = function (id) {
    const p = People.get(id), op = UI.open; let args = null;
    UI.open = (...a) => { args = a; };
    try { eq0(id); } finally { UI.open = op; }
    if (!args) return;
    const mark = '<div class="sec" style="margin-top:10px">Equipamento</div>';
    args[1] = p && p.capanga && args[1].includes(mark) ? args[1].replace(mark, CapMount.healHtml(p) + CapMount.html(p) + mark) : args[1];
    return UI.open(...args);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'capHeal') { const p = People.get(+d.id); if (p) { CapMount.heal(p, d.k); UI.showEquipC(p.id); } return; }
    if (a === 'capHorse' || a === 'capHorseBuy' || a === 'capHorseOff') {
      const p = People.get(+d.id); if (!p) return;
      if (a === 'capHorse') CapMount.give(p, +d.h); else if (a === 'capHorseBuy') CapMount.buy(p, d.k); else CapMount.take(p);
      UI.showEquipC(p.id); return;
    }
    return a0(a, d);
  };
}

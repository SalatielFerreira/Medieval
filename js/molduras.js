'use strict';
// Reinado no computador, emoldurado: cada aba vira um painel que ocupa a janela inteira, em colunas. O último quadro de
// cada coluna (ou o escolhido) estica até a base e rola por dentro quando o conteúdo cresce — nenhuma aba vira página
// a mais por causa de uma lista comprida. Os quadros ganham um estilo só (faixa dourada no título, linhas em cartões).
// No Exército entra o quadro "Forças dos reinos" (o seu exército de campo e a força de cada reino comparada).
// (No celular nada muda.)
const RX = {
  // top: quadros numa faixa no alto (largura inteira) · cols: as colunas (seletores dos quadros; 'REST' = o que sobrar)
  // tpl: as larguras das colunas · fill: o quadro que estica em cada coluna (senão, o último)
  SPEC: {
    reino: { cols: [['.rn-stats', '.rn-tax', '.rn-abd'], ['.rn-alerts', 'REST']], tpl: '1.1fr 1fr' },
    tesouro: { cols: [['.rn-fin'], ['REST'], ['.rn-store', '.rn-budget']], tpl: '1fr 1fr 1fr' },
    vassalos: { cols: [['.rn-auds'], ['.rn-fiefs', '.rn-grant'], ['.rn-knights', 'REST']], tpl: '1.15fr 1fr 0.9fr', fill: ['.rn-fiefs'] },
    diplo: { cols: [['.rn-dips', 'REST']], tpl: '1fr', fill: ['.rn-dips'] },
    exercito: { cols: [['.rn-gar', '.rn-troop', '.rn-guards'], ['.rx-power', 'REST']], tpl: '1fr 1.15fr', fill: ['.rn-guards'] },
    obras: { cols: [['.rn-inv', '.rn-works', 'REST']], tpl: '1fr', fill: ['.rn-works'] },
    corte: { top: ['.rn-acts'], cols: [['.rn-heirs'], ['.rn-chron', 'REST']], tpl: '1fr 1fr' },
    brasao: { cols: [['.herald-prev', '.rn-hflag'], ['.rn-hname', '.rn-harms', 'REST']], tpl: '1fr 1fr', fill: ['.rn-hflag', '.rn-harms'] },
  },
  build(tab, html) {
    const S = this.SPEC[tab]; if (!S) return html;
    const t = document.createElement('template'); t.innerHTML = html;
    const used = new Set();
    const pick = sel => { const e = [...t.content.querySelectorAll(sel)].find(x => x.matches('.card') && !used.has(x)); if (e) used.add(e); return e || null; };
    const top = (S.top || []).map(pick).filter(Boolean);
    const cols = S.cols.map(L => L.map(sel => sel === 'REST' ? 'REST' : pick(sel)));
    // o que sobrou: os quadros que não estão na lista (de fora de uma moldura também), na ordem
    const rest = [];
    for (const el of [...t.content.children]) {
      if (used.has(el)) continue;
      const inner = el.matches('.card') ? [el] : [...el.querySelectorAll('.card')].filter(c => !used.has(c) && !c.parentElement.closest('.card'));
      if (inner.length) inner.forEach(c => { if (!used.has(c)) { used.add(c); rest.push(c); } });
      else if (el.textContent.trim()) rest.push(el);
    }
    const out = cols.map(L => L.flatMap(x => x === 'REST' ? rest.splice(0) : x ? [x] : []));
    if (rest.length) out[out.length - 1].push(...rest);
    const fill = new Set((S.fill || []).map(sel => out.flat().find(e => e.matches && e.matches(sel))).filter(Boolean));
    const col = L => { if (!L.length) return '<div class="rx-col"></div>'; const f = L.find(e => fill.has(e)) || L[L.length - 1]; return `<div class="rx-col kscroll">${L.map(e => { if (e === f && e.classList) e.classList.add('rx-fill', 'kscroll'); return e.outerHTML || ''; }).join('')}</div>`; };
    return `<div class="rx rx-${tab}">${top.length ? `<div class="rx-top">${top.map(e => e.outerHTML).join('')}</div>` : ''}<div class="rx-cols" style="grid-template-columns:${S.tpl}">${out.map(col).join('')}</div></div>`;
  },
  // ⚔️ o exército de campo e a força de cada reino
  powerCard(ci) {
    const A = War.armyOf(ci), esc = UI.esc.bind(UI);
    const L = G.civs.filter(c => c && !c.dead).map(c => ({ c, s: Diplo.strength(c.id) })).sort((a, b) => b.s - a.s), max = Math.max(1, ...L.map(x => x.s));
    const tile = (ic, v, l) => `<div class="rx-tile"><span>${ic}</span><b>${v}</b><small>${l}</small></div>`;
    const rows = L.map((x, i) => {
      const me = x.c.id === ci, war = !me && Diplo.atWar(ci, x.c.id), al = !me && Diplo.allied(ci, x.c.id);
      return `<div class="rx-pw ${me ? 'me' : ''} ${war ? 'war' : ''}"><em>${i + 1}º</em><span>${Heraldry.armsSvg(x.c.id, 16)} <b>${esc(CIV_DEFS[x.c.id].short)}</b>${me ? ' <small>você</small>' : war ? ' <small class="bad">⚔️ em guerra</small>' : al ? ' <small class="ok">🤝 aliado</small>' : ''}</span><i class="rx-bar"><i style="width:${Math.round(x.s / max * 100)}%"></i></i><b>${Math.round(x.s)}</b></div>`;
    }).join('');
    return `<div class="card rx-power"><div class="sec">📊 Forças dos reinos <span>guarnição, muralhas, tesouro e aliados</span></div>
      <div class="rx-tiles">${tile('🗡️', A.soldiers, 'soldados de campo')}${tile('🏹', A.archers + '%', 'arqueiros')}${tile('🐎', A.cav, 'cavaleiros')}${tile('🪨', A.cats, 'catapultas')}</div>
      <div class="rx-pws">${rows}</div></div>`;
  },
};

{
  for (const tab of Object.keys(RX.SPEC)) {
    if (!Reinado.T[tab]) continue;
    const f0 = Reinado.T[tab].bind(Reinado.T);
    Reinado.T[tab] = function (ci, c, main, ...r) {
      let h = f0(ci, c, main, ...r);
      if (document.body.classList.contains('small')) return h;
      try {
        if (tab === 'exercito') h += RX.powerCard(ci);
        return RX.build(tab, h);
      } catch (e) { console.error(e); return h; }
    };
  }
}

// Portfólio inteiro, no computador: a lista que crescia em partes (◀ 1/9 ▶) agora rola por dentro e vai até a base da
// janela (a altura acompanha a tela). Só quando rolar não resolve (uma tabela, por exemplo) ela volta a se dividir.
{
  const pl0 = UI.pageList.bind(UI);
  UI.pageList = function (o) {
    const { items, over } = o;
    if (document.body.classList.contains('small') || !items || items.length < 2 || !over()) return pl0(o);
    const list = items[0].parentElement;
    if (!list || list.tagName === 'TBODY' || list.tagName === 'TABLE' || !items.every(c => c.parentElement === list)) return pl0(o);
    const h = Math.ceil(list.getBoundingClientRect().height);
    list.classList.add('kscroll', 'pl-scroll'); list.style.maxHeight = '90px';
    if (over()) { list.classList.remove('kscroll', 'pl-scroll'); list.style.maxHeight = ''; return pl0(o); }
    // a maior altura que ainda cabe (medida em poucos passos)
    let lo = 90, hi = h;
    while (hi - lo > 6) { const mid = (lo + hi) >> 1; list.style.maxHeight = mid + 'px'; if (over()) hi = mid; else lo = mid; }
    list.style.maxHeight = lo + 'px';
    return 1;
  };
}

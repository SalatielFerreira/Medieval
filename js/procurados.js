'use strict';
// Procurados (Serviços → Fora da lei → Procurados): o mural de cartazes de cada reino, com o retrato, o crime e quanto
// a coroa paga pela pessoa — a sua cabeça (quando você é procurado) e as cabeças de gente do povo.
//  · os reis da IA põem a prêmio quem anda no crime no reino deles (salteadores dos bandos, ladrões, assassinos...),
//    e a recompensa sobe um pouco a cada mês até a pessoa ser pega;
//  · os procurados que você declarou como rei aparecem também (a sua coroa não paga a você mesmo);
//  · na conversa com a pessoa: "⛓️ Prender" — viva vale a recompensa inteira (vai para a prisão do reino que a quer);
//    se ela resistir, vira briga. Morta pelas suas mãos, vale a metade. Um reino em guerra com você não paga nada.
// Estado: G.urban.bounty = { pid: { ci, v, why, day } }.
const BTY_MAX = 3;          // cartazes de cada reino ao mesmo tempo
const BTY_CRIMES = ['contrabando', 'roubo de gado', 'deserção do exército', 'fuga da prisão', 'falsificar moedas', 'incendiar um celeiro', 'caça nas terras do rei', 'agredir um guarda'];

const Bounty = {
  S() { const u = G.urban || (G.urban = {}); return u.bounty || (u.bounty = {}); },
  of(p) { return p && this.S()[p.id] || null; },
  // a coroa do jogador também procura gente (Leis e justiça): esses cartazes não pagam a você
  crownWanted() { if (typeof Justice === 'undefined') return []; return Object.entries(Justice.S().wanted).map(([pid, L]) => ({ p: G.people[+pid], ci: L[0] })).filter(x => x.p && x.p.alive); },
  pay(b) { return b && G.civs[b.ci] && !G.civs[b.ci].dead && !G.civs[b.ci].atWar && G.civs[b.ci].ruler !== 'player' ? b.v : 0; },
  fit(p) {
    return p && p.alive && p.age >= 16 && !p.kin && !p.capanga && p.spouse !== 'player' && !p.grown && !['ruler', 'consort', 'heir', 'priest'].includes(p.rank)
      && !(p.jail > G.day) && !(People.isCourt && People.isCourt(p)) && !p.placeNpc;
  },
  crime(p) {
    if ((p.kills || 0) > 0) return ['assassinato', 300 + p.kills * 40];
    if (p.band) return ['salteador de estrada', 220];
    if ((p.stole || 0) > 0) return ['roubo', 120 + Math.min(200, p.stole * 2)];
    return [U.pick(BTY_CRIMES), U.rint(8, 18) * 10];
  },
  // todo mês: cartazes novos, recompensas que sobem, quem foi pego ou morreu sai do mural
  monthTick() {
    const S = this.S();
    for (const [pid, b] of Object.entries(S)) {
      const p = G.people[+pid];
      if (!p || !p.alive || p.jail > G.day || !G.civs[b.ci] || G.civs[b.ci].dead || G.day - b.day > 48) { delete S[pid]; continue; }
      b.v = Math.min(b.v0 * 2, Math.round(b.v * 1.04));
    }
    const n = {}; for (const b of Object.values(S)) n[b.ci] = (n[b.ci] || 0) + 1;
    const civs = G.civs.filter(c => !c.dead && c.ruler !== 'player' && (n[c.id] || 0) < BTY_MAX && Math.random() < 0.45);
    if (!civs.length) return;
    const want = new Set(civs.map(c => c.id)), by = {};
    for (const p of G.people) { if (S[p.id] || !this.fit(p)) continue; const ci = Justice.whereCiv(p); if (want.has(ci)) (by[ci] || (by[ci] = [])).push(p); }
    for (const c of civs) {
      const here = (by[c.id] || []).filter(p => !S[p.id]);
      const bad = here.filter(p => p.band || (p.stole || 0) > 0 || (p.kills || 0) > 0);
      const p = bad.length ? U.pick(bad) : here.length && Math.random() < 0.5 ? U.pick(here) : null;
      if (!p) continue;
      const [why, v] = this.crime(p);
      S[p.id] = { ci: c.id, v, v0: v, why, day: G.day };
      if (p.home && p.home.type === 'village') Rumors.atV(p.home.idx, `Cartazes em ${CIV_DEFS[c.id].short}: ${v} 🪙 por ${People.full(p)} (${why}).`);
    }
  },
  // prender na conversa: fraco (pouca vida) não resiste; senão depende de você e dos seus capangas
  capture(p) {
    const b = this.of(p), crown = !b && typeof Justice !== 'undefined' && Justice.wanted(p).some(ci => Justice.mine(ci));
    if (!b && !crown) return null;
    const e = G.spawned.get(p.id), weak = e && !e.dead && e.hp <= e.maxHp * 0.4;
    const ch = weak ? 1 : Math.min(0.85, 0.25 + (P.level || 1) * 0.03 + Game.allies().length * 0.08);
    if (Math.random() >= ch) { Game.provoke(p); return { ok: false, text: `${People.full(p)} puxa a arma: "Vai ter que me levar à força!"` }; }
    if (crown) {
      const ci = Justice.wanted(p).find(c => Justice.mine(c));
      Justice.arrest(p, ci, 'procurado pela coroa', 0, true); Justice.undeclare(p.id, ci);
      return { ok: true, text: `⛓️ Você prendeu ${People.full(p)}: vai para a prisão de ${CIV_DEFS[ci].short}. Decida o destino em Reinado → Leis e justiça.` };
    }
    const v = this.pay(b), c = G.civs[b.ci];
    Justice.arrest(p, b.ci, 'procurado: ' + b.why, U.rint(6, 14), true);
    delete this.S()[p.id];
    if (v) { P.gold += v; c.treasury = Math.max(0, (c.treasury || 0) - v); Game.addRelation(b.ci, 3); Sound.play('coin'); }
    return { ok: true, text: `⛓️ Você entregou ${People.full(p)} aos guardas de ${CIV_DEFS[b.ci].short}${v ? `: +${v.toLocaleString('pt-BR')} 🪙 de recompensa` : ' — em guerra com você, o reino não paga nada'}.` };
  },
  // morto pelas suas mãos: metade da recompensa
  killed(p) {
    const b = this.of(p); if (!b) return;
    const v = Math.round(this.pay(b) / 2); delete this.S()[p.id];
    if (!v) return;
    P.gold += v; G.civs[b.ci].treasury = Math.max(0, (G.civs[b.ci].treasury || 0) - v);
    UI.msg(`📜 ${People.full(p)} estava a prêmio em ${CIV_DEFS[b.ci].short}: morto vale a metade, +${v.toLocaleString('pt-BR')} 🪙.`, 'gold');
  },
  // ---------------------------------------------------------------- o mural
  list() {
    const px = P.x / TILE, py = P.y / TILE;
    const L = Object.entries(this.S()).map(([pid, b]) => ({ p: G.people[+pid], b })).filter(x => x.p && x.p.alive && !(x.p.jail > G.day));
    for (const x of this.crownWanted()) if (!this.S()[x.p.id] && !(x.p.jail > G.day)) L.push({ p: x.p, b: { ci: x.ci, v: 0, why: 'procurado pela sua coroa', crown: true } });
    for (const x of L) { const w = typeof Favorites !== 'undefined' ? Favorites.where(x.p) : null; x.d = w ? Math.round(U.dist(px, py, w.x, w.y)) : 9999; }
    return L.sort((a, b) => a.d - b.d);
  },
  card(x) {
    const p = x.p, b = x.b, esc = UI.esc.bind(UI), v = this.pay(b), f = p.sex === 'f';
    const val = b.crown ? '<div class="bty-v crown">👑 a sua coroa</div>'
      : v ? `<div class="bty-v"><span>viv${f ? 'a' : 'o'} <b>${v.toLocaleString('pt-BR')}</b> 🪙</span><span>mort${f ? 'a' : 'o'} <b>${Math.round(v / 2).toLocaleString('pt-BR')}</b></span></div>`
        : `<div class="bty-v war">⚔️ ${G.civs[b.ci] && G.civs[b.ci].atWar ? 'em guerra: não paga' : 'não paga'}</div>`;
    return `<div class="bty-card ${b.crown ? 'crown' : ''}"><div class="bty-h">PROCURAD${f ? 'A' : 'O'}</div>
      <canvas class="bty-por" data-bp="${p.id}" width="56" height="64"></canvas>
      <b class="bty-n" title="${esc(People.full(p))}">${esc(People.full(p))}</b><small>${p.age} anos · ${esc(People.homeName(p))}</small>${val}
      <div class="bty-f"><span title="${CIV_DEFS[b.ci] ? CIV_DEFS[b.ci].name : ''}">${G.civs[b.ci] ? Heraldry.armsSvg(b.ci, 14) : ''} ${CIV_DEFS[b.ci] ? CIV_DEFS[b.ci].short : ''}</span><span>${x.d < 9999 ? `📍 ${x.d} passos` : ''}</span>
        <button data-act="bty" data-op="star" data-p="${p.id}" title="${p.starred ? 'Tirar a estrela do mapa' : 'Marcar no mapa com uma estrela'}">${p.starred ? '★' : '☆'}</button></div></div>`;
  },
  page() {
    const L = this.list(), tot = L.reduce((a, x) => a + this.pay(x.b), 0);
    const me = Services.poster().replace('<div class="sv-pface">🕊️</div>', '').replace(/(<div class="sv-ph">[^<]*<\/div>)/, '$1<canvas class="bty-por me" data-bp="player" width="76" height="84"></canvas>');
    const board = L.length ? `<div class="bty-grid kscroll">${L.map(x => this.card(x)).join('')}</div>`
      : '<div class="sv-none">📜<small>Nenhum cartaz nas vilas agora. Os reis põem gente a prêmio todo mês.</small></div>';
    return `<div class="bty-wrap"><div class="bty-me">${me}</div><div class="bty-board"><div class="sv-strip"><span>📜 <b>${L.length}</b> ${L.length === 1 ? 'procurado' : 'procurados'}</span><span>🪙 <b>${tot.toLocaleString('pt-BR')}</b> em recompensas</span>
      <span class="muted">Converse com a pessoa e use ⛓️ Prender: viva vale tudo; morta, a metade.</span></div>${board}</div></div>`;
  },
  drawPortraits(root) {
    for (const cv of root.querySelectorAll('canvas.bty-por')) {
      if (cv.dataset.bp === 'player') {
        const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false;
        drawHuman(g, cv.width / 2, cv.height + 26, Object.assign({}, playerLook(), { scale: 2.1, dir: 1, moving: false, swing: 0, aim: 0, weapon: null, tool: null, shield: null, hurt: false }));
      } else { const p = People.get(+cv.dataset.bp); if (p) UI.drawPersonPortrait(cv, p, 1.9); }
    }
  },
};

if (typeof SVX_GUIDE !== 'undefined') SVX_GUIDE.procurado = { name: 'Procurados', tip: 'Os cartazes dos reinos: quem está a prêmio, o reino que paga e quanto — a sua cabeça também.',
  use: 'Caçar recompensas: achar um procurado, prender (vale tudo) ou matar (vale a metade); e limpar o seu nome com o perdão.',
  how: ['Marque a pessoa com ☆ para ver onde ela está no mapa.', 'Converse com ela e use ⛓️ Prender.', 'Se for você no cartaz, pague o perdão do reino.'],
  when: 'Quando precisar de ouro — ou antes de entrar num reino onde a sua cabeça vale ouro.' };

{
  // a página "Procurado" vira o mural
  const sb0 = Services.subs.bind(Services);
  Services.subs = function (g, list) {
    if (g === 'ol0' || g === 'ol1') list = list.map(x => x[0] === 'procurado' ? [x[0], x[1], x[2], Bounty.page()] : x);
    return sb0(g, list);
  };
  const sk0 = UI.showKingdom.bind(UI);
  UI.showKingdom = function (...a) { const r = sk0(...a); if (this.sel.knav === 'x:outlaw' && this.panel) Bounty.drawPortraits(this.panel); return r; };
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'bty') { const p = People.get(+d.p); if (p && d.op === 'star' && typeof Favorites !== 'undefined') { Favorites.toggle(p); this.refresh(); } return; }
    return act0(a, d);
  };
  // na conversa: prender o procurado (e o selo no cabeçalho)
  const la0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    la0(p, acts);
    const b = Bounty.of(p), crown = typeof Justice !== 'undefined' && Justice.wanted(p).some(ci => Justice.mine(ci));
    if ((b || crown) && Bounty.fit(p)) acts.push(['btyCap', b && Bounty.pay(b) ? `⛓️ Prender — ${Bounty.pay(b).toLocaleString('pt-BR')} 🪙 de recompensa` : '⛓️ Prender (procurado)']);
  };
  const lc0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) { const out = lc0(p), b = Bounty.of(p); if (b) out.unshift(`<span class="tag" style="background:#7a1a12">📜 Procurad${p.sex === 'f' ? 'a' : 'o'} em ${CIV_DEFS[b.ci].short}: ${b.v} 🪙</span>`); return out; };
  const tka0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    if (!d || d.op !== 'btyCap') return tka0(d);
    const p = People.get(+d.id); if (!p) return;
    const r = Bounty.capture(p); if (!r) return;
    this.close(); UI.msg(r.text, r.ok ? 'gold' : 'bad', true); if (r.ok) UI.banner('⛓️ Procurado preso');
  };
  // morto pelas suas mãos: metade
  const kl0 = Game.kill.bind(Game);
  Game.kill = function (e, src) {
    if (e && !e.dead && e.npc && Bounty.of(e.npc) && (src === P || (src && fac(src) === 'player'))) Bounty.killed(e.npc);
    return kl0(e, src);
  };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function (...a) { const r = mt0(...a); try { Bounty.monthTick(); } catch (e) { console.error(e); } return r; };
}

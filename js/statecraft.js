'use strict';
// Mensageiro de paz e renúncia ao trono.
// Em guerra (o seu reino contra outro, ou você mesmo contra um reino), dá para mandar um mensageiro oferecendo ouro
// pela paz: você escolhe a quantia; o outro lado aceita ou recusa conforme a força dos dois, a raiva que sente e o
// tamanho da oferta. Recusada, o mensageiro volta com o ouro (menos o custo da viagem).
// O rei pode renunciar: a coroa passa a um filho adulto (ou ao cônjuge, a um cavaleiro da corte ou a um nobre),
// e você continua no reino como Duque.

const Envoy = {
  list() { return G.envoys || (G.envoys = []); },
  // guerra do seu reino contra other (ou null)
  realmOf(other) {
    for (const c of G.civs) if (c.ruler === 'player' && c.id !== other && Diplo.atWar(c.id, other)) return c.id;
    return null;
  },
  atWar(other) { return this.realmOf(other) !== null || !!(G.civs[other] && G.civs[other].atWar); },
  // quanto o outro lado espera receber
  need(mine, other) {
    const o = G.civs[other];
    if (mine !== null) {
      const ratio = U.clamp((Diplo.strength(other) + 2) / (Diplo.strength(mine) + 2), 0.4, 3);
      return Math.round((250 + o.treasury * 0.1) * ratio * (Diplo.rel(mine, other) < -60 ? 1.3 : 1) / 10) * 10;
    }
    return Math.round((200 + Math.max(0, -o.relation) * 6 + o.treasury * 0.05) / 10) * 10;
  },
  purse(mine) { return mine !== null ? G.civs[mine].treasury : P.gold; },
  mood(gold, need) { const r = gold / need; return r >= 1.5 ? ['generosa', 'ok'] : r >= 1 ? ['justa', 'ok'] : r >= 0.6 ? ['baixa', ''] : ['insultuosa', 'bad']; },
  open(mine, other, gold) {
    if (!this.atWar(other)) { UI.msg(`Você não está em guerra com ${CIV_DEFS[other].name}.`); return; }
    if (mine === undefined) mine = this.realmOf(other);
    if (this.list().some(e => e.other === other)) { UI.msg('📜 O seu mensageiro ainda está a caminho. Aguarde a resposta.'); return; }
    const need = this.need(mine, other), have = this.purse(mine);
    gold = U.clamp(gold === undefined ? Math.min(have, need) : gold, 0, have);
    const [m, cls] = this.mood(gold, need), o = G.civs[other];
    const step = (d, lab) => `<button data-act="envoy" data-op="amt" data-c="${mine === null ? '' : mine}" data-o="${other}" data-g="${U.clamp(gold + d, 0, have)}" ${gold + d < 0 || gold + d > have ? 'disabled' : ''}>${lab}</button>`;
    UI.open('📜 Mensageiro de paz', `<p>Mandar um mensageiro a <b>${UI.esc(o.rulerName)}</b> de ${CIV_DEFS[other].name} pedindo a paz${mine !== null ? ` entre ${CIV_DEFS[mine].short} e ${CIV_DEFS[other].short}` : ''}, com uma oferta em ouro ${mine !== null ? 'do tesouro do reino' : 'do seu bolso'}.</p>
      <div class="card"><p class="dt-desc">${mine !== null ? 'Tesouro' : 'Seu ouro'}: <b>${have} 🪙</b> · Força deles: ${Math.round(Diplo.strength(other))}${mine !== null ? ` · a sua: ${Math.round(Diplo.strength(mine))}` : ''} · Relação: ${Math.round(mine !== null ? Diplo.rel(mine, other) : o.relation)}</p>
      <h3 style="margin:8px 0">Oferta: ${gold} 🪙 <small class="${cls}">(parece ${m})</small></h3>
      <div class="act-row">${step(-5000, '−5000')}${step(-1000, '−1000')}${step(-100, '−100')}${step(-1, '−1')}${step(1, '+1')}${step(100, '+100')}${step(1000, '+1000')}${step(5000, '+5000')}
        <button data-act="envoy" data-op="amt" data-c="${mine === null ? '' : mine}" data-o="${other}" data-g="${Math.min(have, need)}">Oferta justa</button></div>
      <small class="muted">Quanto mais generosa a oferta, maior a chance de aceitarem. Se recusarem, o mensageiro volta com o ouro, menos 10% da viagem; uma oferta insultuosa ainda os irrita.</small></div>
      <div class="act-row"><button class="primary" data-act="envoy" data-op="send" data-c="${mine === null ? '' : mine}" data-o="${other}" data-g="${gold}" ${gold > 0 ? '' : 'disabled'}>📜 Mandar o mensageiro com ${gold} 🪙</button></div>`, 'showEnvoy', [mine, other, gold], 'Ouro em troca da paz');
  },
  send(mine, other, gold) {
    if (gold <= 0 || gold > this.purse(mine)) return;
    if (mine !== null) G.civs[mine].treasury -= gold; else P.gold -= gold;
    this.list().push({ mine, other, gold, at: G.realTime + 12 });
    UI.close();
    UI.msg(`📜 Um mensageiro partiu a galope para ${CIV_DEFS[other].short} levando ${gold} 🪙 e o pedido de paz.`, 'gold');
    Sound.play('ui');
  },
  update() {
    const L = this.list(); if (!L.length) return;
    for (const e of L.slice()) if (G.realTime >= e.at || e.now) { L.splice(L.indexOf(e), 1); this.resolve(e); }
  },
  resolve(e) {
    const { mine, other, gold } = e, o = G.civs[other];
    const still = mine !== null ? Diplo.atWar(mine, other) : !!o.atWar;
    const back = g => { if (mine !== null && G.civs[mine]) G.civs[mine].treasury += g; else P.gold += g; };
    if (!still) { back(gold); UI.msg(`📜 O mensageiro voltou: a guerra com ${CIV_DEFS[other].short} já tinha acabado. O ouro voltou inteiro.`); return; }
    const need = this.need(mine, other), r = gold / need;
    const chance = r >= 1.5 ? 1 : U.clamp(Math.pow(r, 2), 0, 0.95);
    if (Math.random() < chance) {
      o.treasury += gold;
      if (mine !== null) Diplo.makePeace(mine, other, `${G.name} mandou ${gold} moedas pela paz`);
      else { o.atWar = false; o.relation = Math.max(o.relation, -20); if (G.siege && G.siege.civ === other) Game.endSiege(null); for (const g of G.ents) if (g.civ === other && g.angry) { g.angry = false; g.target = null; } }
      if (G.warCall && (G.warCall.enemy === other || G.warCall.side === other)) { G.warCall = null; War.badge(null); }
      UI.banner(`🕊️ Paz com ${CIV_DEFS[other].short}!`);
      UI.msg(`🕊️ ${o.rulerName} aceitou os ${gold} 🪙 e selou a paz${mine !== null ? ` com ${CIV_DEFS[mine].short}` : ' com você'}.`, 'gold', true);
      Diplo.chronicle(`🕊️ ${CIV_DEFS[other].short} aceitou ${gold} moedas de ${G.name} e fez as pazes.`, true);
    } else {
      const fee = Math.round(gold * 0.1); back(gold - fee);
      const insult = r < 0.4;
      if (insult) { if (mine !== null) Diplo.addRel(mine, other, -5); else Game.addRelation(other, -5); }
      UI.msg(`📜 ${o.rulerName} recusou a oferta de ${gold} 🪙${insult ? ' e se sentiu insultado (−5 relação)' : ''}. O mensageiro voltou com ${gold - fee} 🪙.`, 'bad', true);
    }
  },
};

const Abdicate = {
  // quem herda a coroa: filho adulto, cônjuge, um cavaleiro da corte ou um nobre novo
  heir(ci) {
    const kids = G.people.filter(p => p.alive && p.kin === 'child' && p.age >= 16 && !p.capanga).sort((a, b) => b.age - a.age);
    if (kids[0]) return { p: kids[0], why: 'seu filho mais velho', kin: true };
    const sp = G.people.find(p => p.alive && p.spouse === 'player' && !p.capanga);
    if (sp) return { p: sp, why: 'seu cônjuge', kin: true };
    const kn = G.people.find(p => p.alive && p.rank === 'knight' && !p.capanga && p.home.type === 'castle' && p.home.civ === ci);
    if (kn) return { p: kn, why: 'um cavaleiro da corte', kin: false };
    return { p: null, why: 'um nobre do reino', kin: false };
  },
  ask(ci) {
    const c = G.civs[ci]; if (!c || c.ruler !== 'player') return;
    const h = this.heir(ci);
    Dialog.confirm({ icon: '👑', title: `Renunciar ao trono de ${CIV_DEFS[ci].short}`, danger: true, ok: 'Renunciar',
      text: `A coroa de ${CIV_DEFS[ci].name} passa para ${h.p ? `${People.full(h.p)} (${h.why})` : h.why}. O reino deixa de ser seu (tesouro, exército, obras e diplomacia ficam com o novo soberano) e você continua lá como Duque. As guerras do reino continuam com ele.` },
      () => this.go(ci));
  },
  go(ci) {
    const c = G.civs[ci]; if (!c || c.ruler !== 'player') return;
    const h = this.heir(ci);
    const p = h.p || People.create({ rank: 'ruler', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(30, 50) });
    p.rank = 'ruler'; p.civ = ci; p.home = { type: 'castle', civ: ci };
    for (const q of G.people) if (q !== p && q.alive && q.rank === 'ruler' && q.home && q.home.type === 'castle' && q.home.civ === ci) q.rank = 'knight'; // um só soberano
    if (p.capanga) p.capanga = false;
    c.ruler = 'npc'; c.rulerId = p.id; c.rulerName = People.title(p) + ' ' + p.name; c.relation = h.kin ? 100 : 70; c.atWar = false;
    Heraldry.apply();
    if (G.mainRealm === ci) { const other = G.civs.find(o => o.ruler === 'player'); G.mainRealm = other ? other.id : null; }
    if (G.warCall && G.warCall.side === ci && G.warCall.own) { G.warCall = null; War.badge(null); }
    { const t = Court.holdings(); t[ci] = Math.max(t[ci] !== undefined ? t[ci] : -1, 4); } // Duque
    UI.close();
    UI.banner(`👑 ${c.rulerName}, soberano de ${CIV_DEFS[ci].short}`);
    UI.msg(`👑 Você renunciou ao trono. ${People.full(p)} agora governa ${CIV_DEFS[ci].name}, e você é Duque do reino.`, 'gold', true);
    Diplo.chronicle(`👑 ${G.name} ${G.surname} renunciou ao trono de ${CIV_DEFS[ci].name}; ${c.rulerName} foi coroad${p.sex === 'f' ? 'a' : 'o'}.`, true);
    Progress.diary(`👑 Renunciou ao trono de ${CIV_DEFS[ci].name} em favor de ${People.full(p)}.`);
    World.buildMinimap && World.buildMinimap();
  },
};

{
  UI.showEnvoy = function (mine, other, gold) { Envoy.open(mine, other, gold); }; // a janela se atualiza sozinha
  // o botão de paz (do reino e o seu) abre o mensageiro
  const pa0 = Diplo.playerAction.bind(Diplo);
  Diplo.playerAction = function (mine, other, act) { if (act === 'peace') { Envoy.open(mine, other); return; } return pa0(mine, other, act); };
  Game.makePeace = function (ci) { Envoy.open(undefined, ci); };
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'envoy') { const mine = d.c === '' || d.c === undefined ? null : +d.c; if (d.op === 'send') Envoy.send(mine, +d.o, +d.g); else Envoy.open(mine, +d.o, +d.g); return; }
    if (a === 'abdicate') { Abdicate.ask(+d.c); return; }
    return act0(a, d);
  };
  // a renúncia aparece na janela do seu reino (dentro da página, para entrar na divisão em páginas)
  const kpA = UI.kPage.bind(UI);
  UI.kPage = function (nav) {
    const h = kpA(nav), ci = nav && nav.startsWith('k:') ? +nav.slice(2) : -1;
    if (ci < 0 || !G.civs[ci] || G.civs[ci].ruler !== 'player' || !['resumo', 'coroa'].includes(this.sel.ksub || 'resumo') || h.indexOf('data-act="abdicate"') >= 0) return h;
    const card = `<div class="card"><div class="sec">👑 Coroa</div><p class="dt-desc">Passar a coroa adiante: ${UI.esc((() => { const hh = Abdicate.heir(ci); return hh.p ? People.full(hh.p) + ' (' + hh.why + ')' : hh.why; })())} assume o trono e você vira Duque.</p>
        <div class="act-row"><button class="danger" data-act="abdicate" data-c="${ci}">👑 Renunciar ao trono</button></div></div>`;
    const k = h.lastIndexOf('</div>');
    return h.indexOf('<div class="kbody">') >= 0 && k > 0 ? h.slice(0, k) + card + h.slice(k) : h + card;
  };
  // o mensageiro chega enquanto o jogo corre; ao salvar, a resposta já vem (o ouro nunca se perde)
  const wu0 = War.update.bind(War);
  War.update = function (dt) { Envoy.update(); return wu0(dt); };
  const sv0 = Game.save.bind(Game);
  Game.save = function (...a) { for (const e of Envoy.list()) e.now = true; Envoy.update(); return sv0(...a); };
}

// ------------------------------------------------------------------ romance com qualquer pessoa solteira do sexo oposto
// donos de loja, andarilhos, reis, rainhas, cavaleiros... todos, menos quem já é casado (e os seus parentes).
// Quem tem um cargo (soberano, corte, padre, soldado, dono de loja, porto) casa com você mas continua no posto.
{
  People.canRomance = function (p) {
    return !!p && p.alive && this.isAdult(p) && P.age >= 16 && !p.kin && p.rank !== 'child' && p.sex !== P.sex && (p.spouse === null || p.spouse === undefined || p.spouse === 'player');
  };
  const pr0 = People.propose.bind(People);
  People.propose = function (p) {
    if (!p) return pr0(p);
    const noble = NOBLE_RANKS.includes(p.rank) || People.isCourt(p);
    const keep = noble || ['priest', 'soldier', 'knight'].includes(p.rank) || !!p.shop || !!p.port;
    const was = { home: p.home, rank: p.rank, fam: p.fam, surname: p.surname, maiden: p.maiden };
    const r = pr0(p);
    if (r && p.spouse === 'player' && keep) {
      p.home = was.home; p.rank = was.rank;
      if (noble) { p.fam = was.fam; p.surname = was.surname; p.maiden = was.maiden; } // a casa real continua a dela
      r.text = 'SIM! Mil vezes sim! Mas não posso abandonar os meus deveres: continuo no meu posto, e você será sempre bem-vindo.';
      r.note = `${People.full(p)} agora é seu cônjuge (e continua como ${People.title(p)}).`;
    }
    return r;
  };
}

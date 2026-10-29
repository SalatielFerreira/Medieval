'use strict';
// Montaria em combate e companheiros com história.
//  • 🐎 A cavalo, o galope vira força: quanto mais tempo galopando, mais forte o próximo golpe (até +60%). Com lança
//    (Lança de Ferro, Lança de Cavalaria, alabarda...) é uma carga de verdade: até +150% e o inimigo é jogado para trás.
//    O arco a cavalo também acerta mais forte (+20%; o arco curto e o de chifre, +35%).
//  • 🤝 Cada capanga tem lealdade (0 a 100) e o jeito dele (a personalidade). De tempos em tempos ele pede alguma coisa:
//    um pagamento, uma arma melhor, uns dias com a família, caçar bandidos. Atender sobe a lealdade; recusar ou esquecer
//    derruba. Leal demais, luta melhor; com a lealdade lá embaixo, ele pode ir embora levando ouro — ou trair numa
//    guerra. E eles se apaixonam: entre si (e casam) ou por você.
const CAV_SPEAR = /spear|lance|halberd|pike|glaive|lanca/;
const COMP_FAVORS = {
  gold:   { icon: '💰', text: p => `Os tempos estão difíceis... ${p.trait === 'ganancioso' ? 'um capanga como eu merece' : 'preciso de'} ${COMP.goldOf(p)} 🪙 a mais este mês.`, label: p => `💰 Pagar ${COMP.goldOf(p)} 🪙` },
  gear:   { icon: '🛡️', text: () => 'Com esta tralha eu não duro outra luta. Me arranja uma arma melhor (ou uma armadura)?', label: () => '🛡️ Abrir o equipamento' },
  family: { icon: '🏠', text: () => 'Faz tempo que não vejo a minha família. Posso passar um mês com eles?', label: () => '🏠 Pode ir (volta em 1 mês)' },
  hunt:   { icon: '🗡️', text: () => 'Bandidos mataram um amigo meu. Vamos caçar 5 deles juntos?', label: () => '🗡️ Prometer a caçada' },
  feast:  { icon: '🍺', text: () => 'Uma noite de festa na taverna faria bem a todos nós... 30 🪙 e eu pago a primeira rodada!', label: () => '🍺 Dar 30 🪙 para a festa' },
};
const COMP = {
  goldOf(p) { return 20 + (p.clvl || 1) * 10 + (p.trait === 'ganancioso' ? 20 : 0); },
  loyal(p) { if (p.loyal === undefined) p.loyal = { leal: 78, corajoso: 66, ganancioso: 45, desconfiado: 50, orgulhoso: 52 }[p.trait] || 60; return p.loyal; },
  addLoyal(p, n) { p.loyal = U.clamp(this.loyal(p) + n, 0, 100); },
  list() { return G.people.filter(p => p.alive && p.capanga); },
  mood(p) { const l = this.loyal(p); return l >= 80 ? ['💛', 'devoto'] : l >= 55 ? ['🙂', 'leal'] : l >= 30 ? ['😐', 'inquieto'] : l >= 15 ? ['😠', 'insatisfeito'] : ['💢', 'a ponto de partir']; },
  // pedido do mês
  ask(p) {
    if (p.favor || p.away) return;
    const opts = ['gold', 'gear', 'feast', 'hunt', ...(p.home && p.home.type === 'village' ? ['family'] : [])];
    const k = U.pick(opts);
    p.favor = { k, day: G.day, until: G.day + 2, kills: Progress.S().kill_bandit || 0 };
    UI.msg(`${COMP_FAVORS[k].icon} ${p.name} quer falar com você: "${COMP_FAVORS[k].text(p)}" (converse com ${p.sex === 'f' ? 'ela' : 'ele'})`, 'gold');
  },
  grant(p) {
    const f = p.favor; if (!f) return { text: 'Não preciso de nada agora.', note: '' };
    if (f.k === 'gold' || f.k === 'feast') {
      const g = f.k === 'gold' ? this.goldOf(p) : 30; if (P.gold < g) return { text: 'Sem dinheiro, sem conversa.', note: `Você precisa de ${g} 🪙.` };
      P.gold -= g; p.purse = People.purse(p) + g; p.favor = null; this.addLoyal(p, f.k === 'gold' ? 14 : 10);
      if (f.k === 'feast') for (const q of this.list()) if (q !== p) this.addLoyal(q, 4);
      Sound.play('coin');
      return { text: f.k === 'gold' ? 'Isso é que é patrão! Pode contar comigo.' : 'Hoje a rodada é por nossa conta! Viva!', note: `Lealdade de ${p.name}: ${this.loyal(p)}.` };
    }
    if (f.k === 'gear') { UI.showEquipC(p.id); return 'shown'; }
    if (f.k === 'family') {
      p.favor = null; p.away = G.day + 1; this.addLoyal(p, 10);
      for (const e of G.ents) if (e.npc === p) e.dead = true; G.spawned.delete(p.id);
      return { text: 'Obrigado! Volto daqui a um mês, palavra.', note: `${p.name} foi visitar a família e volta no mês que vem.` };
    }
    if (f.k === 'hunt') { f.promised = true; return { text: 'Então vamos! Cinco bandidos, nem um a menos.', note: 'Derrote 5 bandidos (você ou seus capangas) em até 2 meses.' }; }
    return null;
  },
  decline(p) { const f = p.favor; if (!f) return null; p.favor = null; this.addLoyal(p, p.trait === 'leal' ? -4 : -9); return { text: p.trait === 'rabugento' ? 'Hmpf. Já esperava.' : 'Tudo bem... eu entendo.', note: `Lealdade de ${p.name}: ${this.loyal(p)}.` }; },
  // o mês dos companheiros
  monthTick() {
    const L = this.list();
    for (const p of G.people) if (p.alive && p.away && G.day >= p.away) { p.away = null; if (p.capanga) UI.msg(`🏠 ${p.name} voltou da visita à família, com saudades da estrada.`, 'gold'); }
    for (const p of L) {
      const f = p.favor;
      if (f && f.k === 'gear' && (p.equip.weapon !== f.w0 || p.equip.torso !== f.t0) && f.w0 !== undefined) { p.favor = null; this.addLoyal(p, 15); UI.msg(`🛡️ ${p.name} agradece o equipamento novo.`, 'gold'); }
      else if (f && f.k === 'hunt' && f.promised && (Progress.S().kill_bandit || 0) - f.kills >= 5) { p.favor = null; this.addLoyal(p, 16); UI.msg(`🗡️ ${p.name}: "Vingado! Nunca vou esquecer isso."`, 'gold'); }
      else if (f && G.day > f.until) { p.favor = null; this.addLoyal(p, -10); UI.msg(`😠 ${p.name} ficou magoado: você esqueceu o pedido.`, 'bad'); }
      if (f && f.k === 'gear' && f.w0 === undefined) { f.w0 = p.equip.weapon; f.t0 = p.equip.torso; }
      // o jeito de cada um
      const drift = { leal: 1, corajoso: G.civs.some(c => c.ruler === 'player' && c.atWar) ? 2 : 0, ganancioso: P.gold > 2000 ? 0 : -1, desconfiado: -1, alegre: 1, rabugento: -1 }[p.trait] || 0;
      if (drift) this.addLoyal(p, drift);
      if (!p.favor && !p.away && Math.random() < 0.25) this.ask(p);
      // lealdade lá embaixo: vai embora levando um pouco de ouro (ou, numa guerra, passa para o inimigo)
      if (this.loyal(p) < 15 && Math.random() < 0.4) this.leave(p);
    }
    // amor entre os companheiros (e por você)
    const free = L.filter(p => p.alive && p.capanga && p.spouse === null && !p.dating && p.age >= 18);
    for (const a of free) for (const b of free) {
      if (a.id >= b.id || a.sex === b.sex || this.loyal(a) < 50 || this.loyal(b) < 50 || Math.random() > 0.05) continue;
      People.marry(a, b); this.addLoyal(a, 10); this.addLoyal(b, 10);
      UI.banner(`💕 ${a.name} e ${b.name} se casaram!`);
      UI.msg(`💕 De tanto lutar lado a lado, ${a.name} e ${b.name} se apaixonaram e se casaram. Os dois estão mais leais do que nunca.`, 'gold', true);
      Progress.diary(`💕 Os capangas ${a.name} e ${b.name} se casaram.`); return;
    }
    const fan = free.find(p => (p.aff || 0) >= 60 && this.loyal(p) >= 60 && p.sex !== P.sex && G.family.spouse === null && !G.people.some(q => q.alive && q.dating) && Math.random() < 0.08);
    if (fan) { fan.crush = G.day; UI.msg(`💘 ${fan.name} anda diferente com você... fale com ${fan.sex === 'f' ? 'ela' : 'ele'}.`, 'gold'); }
  },
  leave(p) {
    const war = G.civs.find(c => c.ruler === 'player' && c.atWar), foe = war && Diplo.warsOf(war.id)[0];
    const enemy = foe ? (foe.a === war.id ? foe.b : foe.a) : -1;
    const stole = Math.min(P.gold, Math.round(P.gold * 0.08));
    P.gold -= stole; p.capanga = false; p.favor = null;
    for (const e of G.ents) if (e.npc === p) e.dead = true; G.spawned.delete(p.id);
    if (enemy >= 0) { p.rank = 'knight'; p.civ = enemy; p.home = { type: 'castle', civ: enemy }; UI.msg(`🗡️ Traição! ${p.name} passou para o lado de ${CIV_DEFS[enemy].short}${stole ? ` levando ${stole} 🪙` : ''}.`, 'bad', true); Diplo.chronicle(`🗡️ ${p.name}, capanga de ${G.name}, traiu e passou para ${Diplo.name(enemy)}.`, true); }
    else UI.msg(`🚪 ${p.name} foi embora no meio da noite${stole ? ` levando ${stole} 🪙` : ''}: a lealdade tinha acabado.`, 'bad', true);
    Progress.diary(`🚪 ${p.name} deixou o seu bando.`);
  },
};

{
  // ---------------------------------------------------------------- galope e carga
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) {
    cu0(dt);
    if (P.mounted && P.moving) P.gallop = Math.min(3, (P.gallop || 0) + dt); else P.gallop = Math.max(0, (P.gallop || 0) - dt * 3);
  };
  const dm0 = Game.damage.bind(Game);
  Game.damage = function (target, amount, src) {
    if (src === P && P.mounted && target !== P && amount > 0) {
      const w = P.equip.weapon && ITEMS[P.equip.weapon];
      if (w && w.ranged) amount *= /short_bow|horn_bow/.test(P.equip.weapon) ? 1.35 : 1.2;
      else {
        const lance = !!(w && (CAV_SPEAR.test(P.equip.weapon) || w.lance)), g = Math.min(1, (P.gallop || 0) / 1.5);
        const mul = 1 + g * (lance ? 1.5 : 0.6);
        amount *= mul;
        if (lance && g > 0.6 && target.x !== undefined) {
          // a carga joga o inimigo para trás e atrasa o golpe dele
          const a = Math.atan2(target.y - P.y, target.x - P.x);
          for (let k = 0; k < 5; k++) { const nx = target.x + Math.cos(a) * 9, ny = target.y + Math.sin(a) * 9; if (World.blockedAt(nx, ny, target.r || 8)) break; target.x = nx; target.y = ny; }
          if (target.atkCd !== undefined) target.atkCd = Math.max(target.atkCd, 1);
          Game.addText(target.x, target.y - 50, '⚡ Carga!', '#ffd54a'); Progress.add('charges');
        }
        if (g > 0.3) P.gallop = 0; // a carga gasta o embalo
      }
    }
    return dm0(target, amount, src);
  };
  // lança de cavalaria (nova)
  if (!ITEMS.cavalry_lance) {
    ITEMS.cavalry_lance = { name: 'Lança de Cavalaria', icon: '🔱', cat: 'Armas', price: 160, slot: 'weapon', dmg: 20, color: '#c8a050', len: 32, lance: true };
    ART_ITEMS.cavalry_lance = ['spear', 'steel'];
    RECIPES.push({ out: 'cavalry_lance', n: 1, cost: { hardwood: 2, iron_bar: 2, leather: 1 }, station: 'forja' });
    RECIPES.sort((a, b) => Order.recipeValue(a) - Order.recipeValue(b) || Order.itemValue(a.out) - Order.itemValue(b.out)); // da mais simples à mais cara
    for (const k of ['br_tiltyard', 'br_training', 'stable']) if (SHOPS[k] && !SHOPS[k].sells.includes('cavalry_lance')) { SHOPS[k].sells.push('cavalry_lance'); SHOPS[k].sells.sort((a, b) => Order.itemValue(a) - Order.itemValue(b)); }
  }
  const tg0 = Ride.toggle.bind(Ride);
  Ride.toggle = function () { const was = P.mounted; const r = tg0(); if (!was && P.mounted && !G.cavTip) { G.cavTip = 1; UI.msg('🐎 A cavalo, galope e ataque: o embalo deixa o golpe mais forte. Com uma lança é uma carga que derruba o inimigo!', 'gold'); } return r; };
  // ---------------------------------------------------------------- companheiros
  // capanga leal luta melhor (e o insatisfeito, pior)
  const cs0 = People.capangaStats.bind(People);
  People.capangaStats = function (p) { const s = cs0(p); const l = COMP.loyal(p); s.dmg = Math.round(s.dmg * (l >= 80 ? 1.15 : l < 30 ? 0.85 : 1)); s.loyal = l; return s; };
  // na conversa: lealdade, jeito e o pedido
  const ch0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) { const out = ch0(p); if (p.capanga) { const [ic, m] = COMP.mood(p); out.push(`<span class="tag" style="background:#3a2a10">${ic} Lealdade ${COMP.loyal(p)} · ${m}</span>`); if (p.favor) out.push(`<span class="tag" style="background:#6a4a1a">${COMP_FAVORS[p.favor.k].icon} Tem um pedido</span>`); } return out; };
  const ac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    ac0(p, acts);
    if (p.capanga && p.favor) { const F = COMP_FAVORS[p.favor.k]; acts.unshift(['cDecline', '✋ Recusar o pedido']); acts.unshift(['cFavor', p.favor.promised ? '🗡️ A caçada está de pé' : F.label(p)]); }
    if (p.crush && !p.dating && p.spouse === null) acts.unshift(['cLove', `💘 Perguntar o que ${p.sex === 'f' ? 'ela' : 'ele'} sente`]);
  };
  const ta0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    const p = d && People.get(+d.id);
    if (p && d.op === 'cFavor') { if (p.favor && p.favor.promised) { this.showTalk(p.id, { text: 'Faltam alguns ainda. Vamos lá!', note: '' }); return; } const r = COMP.grant(p); if (r === 'shown') return; this.showTalk(p.id, r); return; }
    if (p && d.op === 'cDecline') { this.showTalk(p.id, COMP.decline(p)); return; }
    if (p && d.op === 'cLove') {
      p.crush = null;
      Dialog.confirm({ icon: '💘', title: `${p.name} confessa`, ok: 'Aceitar o namoro', text: `"Depois de tantas batalhas ao seu lado... eu me apaixonei por você." Aceitar namorar ${p.name}?` },
        () => { p.dating = true; p.rom = Math.max(p.rom || 0, 60); COMP.addLoyal(p, 15); UI.msg(`💕 Você e ${p.name} estão namorando!`, 'gold', true); this.showTalk(p.id, { text: 'Eu sabia! ❤', note: '' }); },
        () => { COMP.addLoyal(p, -6); this.showTalk(p.id, { text: 'Ah... tudo bem. Esqueça o que eu disse.', note: '' }); });
      return;
    }
    return ta0(d);
  };
  // capanga longe com a família não aparece
  const sc0 = Game.spawnCapanga ? Game.spawnCapanga.bind(Game) : null;
  if (sc0) Game.spawnCapanga = function (p, ...a) { if (p && p.away && G.day < p.away) return null; return sc0(p, ...a); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); COMP.monthTick(); };
}

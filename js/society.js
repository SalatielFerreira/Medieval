'use strict';
// Sociedade: as pessoas vivem em rede e a sua fama corre entre os grupos.
//  1. Rede de amizades: cada morador tem amigos, desafetos, um melhor amigo e um confidente. O que você faz com uma
//     pessoa respinga no círculo dela (amigos gostam, desafetos não; ofensas se espalham).
//  2. Reputação por grupo: nobreza, clero, povo, mercadores, guildas e submundo — cada um abre portas diferentes.
//  3. Níveis de amizade: conhecido → colega → amigo → melhor amigo → confidente, cada um com um benefício.
//  4. Romance: o cônjuge pede atenção (o casamento esfria se você some), ciúme, traição, divórcio, dote e casamento
//     arranjado dos seus filhos com outras casas (selando alianças).
//  5. Eventos: banquetes com convidados (cuidado com desafetos na mesma mesa) e convites para casamentos, batizados e
//     aniversários (faltar ofende).
//  6. Segredos: guardar (confiança), espalhar (derrubar alguém) ou chantagear (ouro, com risco de denúncia).
//  7. Honra: insulto em público cria um rival, que desafia para duelo; quem perde um parente pelas suas mãos guarda
//     vingança e, adulto, vem cobrar.
//  8. Política local: eleições nas vilas, conselho de anciãos, candidatura, campanha e apoio a candidatos.
//  9. Visitas: moradores aparecem na sua casa (presente, cobrança, reclamação) e você convida para jantar.

const SOC_GROUPS = {
  nobreza:    { name: 'Nobreza',    icon: '👑', good: 'convites para banquetes da corte e 5% de desconto em luxo', bad: 'os nobres te desprezam: luxo 5% mais caro' },
  clero:      { name: 'Clero',      icon: '⛪', good: 'os padres intercedem: multas da justiça 30% menores', bad: 'o clero te vira as costas: bênçãos e casamentos mais caros' },
  povo:       { name: 'Povo',       icon: '👪', good: 'o povo te protege: testemunhas raramente denunciam você e trazem dicas', bad: 'o povo te denuncia por qualquer coisa' },
  mercadores: { name: 'Mercadores', icon: '💰', good: 'preços 5% melhores nas lojas', bad: 'preços 5% piores nas lojas' },
  guildas:    { name: 'Guildas',    icon: '🏛️', good: 'recrutar para a sua guilda pede 10 a menos de amizade e encomendas 10% melhores', bad: 'as guildas dificultam: recrutar pede 10 a mais' },
  submundo:   { name: 'Submundo',   icon: '🗡️', good: 'mercado negro, informantes que vendem segredos e guardas que aceitam suborno', bad: 'os ladrões te escolhem como alvo' },
};
const FRIEND_LV = [[90, 'Confidente', 'Confidente', 'conta segredos e testemunha a seu favor no tribunal'], [70, 'Melhor amigo', 'Melhor amiga', 'empresta sem juros e defende você em brigas'],
  [45, 'Amigo', 'Amiga', '10% de desconto e ajuda quando pedida'], [25, 'Colega', 'Colega', 'dá dicas de mercado e de boatos'], [10, 'Conhecido', 'Conhecida', '']];

const Society = {
  S() { G.urban = G.urban || {}; return G.urban.soc || (G.urban.soc = { rep: {}, invites: [], secrets: [], elect: {}, vend: [], visitDay: -1, banquetDay: -1 }); },
  // ---------------------------------------------------------------- 1. rede de amizades
  ties(p) {
    if (p.ties && p.ties.v === 1) return p.ties;
    const pool = G.people.filter(q => q !== p && q.alive && q.age >= 14 && q.home && p.home && q.home.type === p.home.type && q.home.idx === p.home.idx && q.home.civ === p.home.civ);
    const h = n => U.hash2(p.id, n, 911);
    const score = q => (Math.abs(q.age - p.age) < 12 ? 2 : 0) + (q.fam === p.fam ? 1 : 0) + (q.rank === p.rank ? 1 : 0) + U.hash2(p.id, q.id, 77) * 3;
    const sorted = pool.sort((a, b) => score(b) - score(a));
    const friends = sorted.slice(0, 2 + Math.floor(h(1) * 3)).map(q => q.id);
    const foes = pool.filter(q => !friends.includes(q.id) && q.fam !== p.fam).sort((a, b) => U.hash2(p.id, a.id, 13) - U.hash2(p.id, b.id, 13)).slice(0, Math.floor(h(2) * 2.5)).map(q => q.id);
    const sp = typeof p.spouse === 'number' ? p.spouse : null;
    p.ties = { v: 1, friends, foes, best: friends[0] !== undefined ? friends[0] : null, conf: sp !== null ? sp : friends[1] !== undefined ? friends[1] : friends[0] !== undefined ? friends[0] : null };
    return p.ties;
  },
  circle(p) { const t = this.ties(p); return { friends: t.friends.map(id => G.people[id]).filter(q => q && q.alive), foes: t.foes.map(id => G.people[id]).filter(q => q && q.alive) }; },
  cascading: false,
  // efeito em cascata: o que você faz com alguém respinga nos amigos e desafetos dele (sem avisos na tela)
  cascade(p, n) {
    if (this.cascading || Math.abs(n) < 3 || p.kin) return;
    this.cascading = true;
    const m0 = UI.msg; UI.msg = () => {};
    try {
      const t = this.ties(p), c = this.circle(p);
      for (const q of c.friends) People.addAff(q, n * (q.id === t.best ? 0.4 : 0.25));
      for (const q of c.foes) People.addAff(q, -n * (n > 0 ? 0.2 : 0.15));
      const g = this.groupOf(p); this.rep(g, n * 0.04);
    } finally { UI.msg = m0; this.cascading = false; }
  },
  // ---------------------------------------------------------------- 2. reputação por grupo
  groupOf(p) {
    if (!p) return 'povo';
    if (['ruler', 'consort', 'heir', 'knight'].includes(p.rank) || (typeof NOBLE_RANKS !== 'undefined' && NOBLE_RANKS.includes(p.rank))) return 'nobreza';
    if (p.rank === 'priest' || p.rank === 'hermit') return 'clero';
    if (['beggar', 'wanderer', 'mercenary'].includes(p.rank) || p.jail || p.thief) return 'submundo';
    if (['merchant', 'trader', 'innkeeper', 'vintner'].includes(p.rank)) return 'mercadores';
    if (typeof Commerce !== 'undefined' && Commerce.guildOf(p) && Commerce.guildOf(p) !== 'player') return 'guildas';
    return 'povo';
  },
  repOf(g) { return Math.round(this.S().rep[g] || 0); },
  rep(g, n, why) {
    if (!SOC_GROUPS[g] || !n) return;
    const R = this.S().rep, before = R[g] || 0; R[g] = U.clamp(before + n, -100, 100);
    if (why && Math.abs(n) >= 2) UI.msg(`${SOC_GROUPS[g].icon} ${SOC_GROUPS[g].name} ${n > 0 ? '+' : ''}${Math.round(n)}: ${why}`, n > 0 ? 'gold' : 'bad');
    for (const t of [30, -30]) if ((before < t && R[g] >= t) || (before > t && R[g] <= t)) UI.msg(`${SOC_GROUPS[g].icon} ${SOC_GROUPS[g].name}: ${R[g] >= 30 ? SOC_GROUPS[g].good : R[g] <= -30 ? SOC_GROUPS[g].bad : 'voltou ao normal'}.`, R[g] >= 30 ? 'gold' : 'bad', true);
  },
  good(g) { return this.repOf(g) >= 30; },
  bad(g) { return this.repOf(g) <= -30; },
  // ---------------------------------------------------------------- 3. níveis de amizade
  level(p) { for (let i = 0; i < FRIEND_LV.length; i++) if (p.aff >= FRIEND_LV[i][0]) return FRIEND_LV.length - i; return 0; }, // 5 = confidente
  tip(p) {
    if (Math.random() < 0.5) {
      const k = U.pick(Object.keys(ITEMS).filter(k => ITEMS[k].price >= 8 && ITEMS[k].price <= 120));
      let best = 0; G.civs.forEach((c, ci) => { if (Game.price(ci, k).sell > Game.price(best, k).sell) best = ci; });
      return `Dica de amigo: quem paga melhor por ${ITEMS[k].name} hoje é ${CIV_DEFS[best].short} (${Game.price(best, k).sell} 🪙).`;
    }
    const rs = Rumors.known(p).filter(r => r.about !== p.id); return rs.length ? `Ouvi dizer: ${U.pick(rs.slice(0, 6)).text}` : 'Nada de novo por aqui, amigo.';
  },
  // ---------------------------------------------------------------- 6. segredos
  SECRET_KINDS: [
    ['debt', p => `${p.name} deve dinheiro a um agiota e esconde da família.`],
    ['affair', p => `${p.name} tem um caso escondido.`],
    ['theft', p => `${p.name} roubou da loja onde trabalhava, anos atrás.`],
    ['gold', p => `${p.name} enterrou um pote de moedas atrás de casa.`],
    ['faith', p => `${p.name} reza escondido para outra fé.`],
    ['past', p => `${p.name} já foi bandido de estrada na juventude.`],
  ],
  secretOf(p) { if (!p.sec) { const [k, f] = this.SECRET_KINDS[Math.floor(U.hash2(p.id, 5, 31) * this.SECRET_KINDS.length)]; p.sec = { k, text: f(p) }; } return p.sec; },
  knows(p) { return this.S().secrets.some(s => s.pid === p.id && !s.used); },
  learn(p, how) { if (this.knows(p) || !p.alive) return null; const s = this.secretOf(p); this.S().secrets.push({ pid: p.id, text: s.text, k: s.k, day: G.day }); UI.msg(`🤫 Segredo descoberto${how ? ' (' + how + ')' : ''}: ${s.text}`, 'gold', true); return s; },
  useSecret(p, how) {
    const rec = this.S().secrets.find(s => s.pid === p.id && !s.used); if (!rec) return null;
    if (how === 'keep') { rec.used = 'keep'; People.addAff(p, 15); return { text: 'Você... sabe? E vai guardar? Obrigado. Não vou esquecer isso.', note: `🤫 Você prometeu guardar o segredo: amizade +15 (${p.name} confia mais em você).` }; }
    if (how === 'spread') {
      rec.used = 'spread'; const hv = p.home && p.home.type === 'village' ? p.home.idx : -1;
      if (hv >= 0) Rumors.atV(hv, rec.text); for (const q of this.circle(p).friends) People.addAff(q, -2);
      Mind.feel(p, 'sad', 60); p.shame = G.day + 6; this.rep('povo', -1);
      if (rec.k === 'gold') { const g = U.rint(40, 160); P.gold += g; UI.msg(`🪙 Você achou o pote de moedas: +${g} 🪙.`, 'gold'); }
      if (Math.random() < 0.5) { People.addAff(p, -40); p.rival = true; return { text: 'Foi VOCÊ quem espalhou?! Você vai pagar por isso!', note: `🗣️ O segredo correu a vila: ${p.name} caiu em desgraça (e descobriu que foi você: agora é seu rival).` }; }
      return { text: 'Todo mundo está falando de mim... quem teria contado?', note: `🗣️ O segredo correu a vila: ${p.name} caiu em desgraça.` };
    }
    if (how === 'blackmail') {
      rec.used = 'blackmail'; const ci = p.home && p.home.type === 'village' && World.villages[p.home.idx] ? World.villages[p.home.idx].civ : p.civ;
      if (Math.random() < 0.28 && !this.good('submundo')) { People.addAff(p, -50); p.rival = true; Crime.commit(ci, 'chantagem', 150, null, null, true); return { text: 'Chantagem? Vou direto aos guardas!', note: '⚖️ Deu errado: você foi denunciado por chantagem.' }; }
      const g = Math.max(20, Math.round(People.purse(p) * 0.35)); p.purse = Math.max(0, People.purse(p) - g); P.gold += g; People.addAff(p, -30); this.rep('submundo', 3);
      return { text: 'Está bem... pegue e suma. E nem uma palavra!', note: `💰 Chantagem: +${g} 🪙. ${p.name} agora te odeia em silêncio.` };
    }
    return null;
  },
  // ---------------------------------------------------------------- 4. romance
  spouse() { return G.family && G.family.spouse !== null && G.family.spouse !== undefined ? People.get(G.family.spouse) : null; },
  partner() { return this.spouse() || G.people.find(o => o.alive && (o.dating || o.engaged)); },
  attention(p) { p.attn = G.day; },
  romanceTick() {
    const sp = this.spouse(); if (!sp || !sp.alive) return;
    if ((sp.attn || 0) < G.day - 1) { sp.rom = Math.max(0, sp.rom - 4); if (sp.rom < 45 && Math.random() < 0.5) UI.msg(`💔 ${sp.name} sente a sua falta: o casamento está esfriando (romance ${Math.round(sp.rom)}). Converse, presenteie ou leve para jantar.`, 'bad', true); }
    if (sp.rom < 20 && !sp.affair && Math.random() < 0.25) {
      const q = G.people.find(o => o.alive && o.sex !== sp.sex && o.age >= 18 && o.spouse === null && !o.kin && o.home.type === 'village');
      if (q) { sp.affair = q.id; const vi = q.home.idx; Rumors.atV(vi, `Dizem que ${sp.name} anda se encontrando com ${q.name}...`); }
    }
  },
  divorce(p) {
    if (p.spouse !== 'player') return null;
    const g = Math.round(P.gold * 0.25); P.gold -= g; p.purse = People.purse(p) + g;
    People.breakUp(p); this.rep('clero', -10, 'divórcio'); Court.addFame(-3);
    Progress.diary(`💔 Divorciou-se de ${People.full(p)}.`);
    return { text: 'Então é isso. Adeus.', note: `💔 Divórcio: ${g} 🪙 ficaram com ${p.name}, −10 com o clero e −3 de fama.` };
  },
  confront(p) {
    const q = p.affair !== undefined && G.people[p.affair]; if (!q) return null;
    p.affair = undefined; p.rom = Math.max(0, p.rom - 10);
    if (q.alive) { People.addAff(q, -30); q.rival = true; }
    return { text: 'Você descobriu... Eu errei. Me perdoe, por favor.', note: `💔 ${p.name} confessou o caso com ${q.name}. ${q.name} virou seu rival. Você pode perdoar (continue casado e dê atenção) ou pedir o divórcio.` };
  },
  dowry(p) { const f = Families.of(p); const w = f ? f.wealth || 0 : People.purse(p); return Math.min(600, Math.max(0, Math.round(w * 0.12))); },
  // casamento arranjado: um filho seu (16+, solteiro) com alguém de outra casa, selando aliança
  heirsToWed() { return G.people.filter(c => c.alive && c.kin === 'child' && c.age >= 16 && c.spouse === null && !c.dating); },
  arrange(p, cid) {
    const c = G.people[cid]; if (!c || p.spouse !== null || c.sex === p.sex) return null;
    if (p.aff < 30) return { text: 'Casar com a sua família? Mal nos conhecemos.', note: 'Precisa de amizade 30+.' };
    People.marry(c, p); const f = Families.of(p), pf = Families.ensurePlayer();
    if (f && f.id !== pf.id) { pf.allies = [...new Set([...(pf.allies || []), f.id])]; f.allies = [...new Set([...(f.allies || []), pf.id])]; for (const q of Families.members(f)) People.addAff(q, 10); }
    const d = this.dowry(p); if (d) { P.gold += d; }
    Diplo.chronicle(`💍 ${People.full(c)} e ${People.full(p)} se casaram: as casas ${G.surname} e ${f ? f.surname : p.surname} agora são aliadas.`, true);
    Progress.diary(`💍 Arranjou o casamento de ${c.name} com ${People.full(p)}.`);
    return { text: `Será uma honra unir as nossas casas!`, note: `💍 ${c.name} casou com ${p.name}. As casas viraram aliadas${d ? ` e o dote foi de ${d} 🪙` : ''}.` };
  },
  // ---------------------------------------------------------------- 5. eventos sociais
  invite(p, kind) {
    if (!p || !p.alive || p.aff < 20 || this.S().invites.some(i => i.pid === p.id && i.kind === kind)) return;
    const vi = p.home && p.home.type === 'village' ? p.home.idx : -1; if (vi < 0) return;
    const names = { wedding: 'o casamento', baptism: 'o batizado do bebê', birthday: 'o aniversário' };
    this.S().invites.push({ pid: p.id, kind, vi, until: G.day + 1, name: names[kind] });
    UI.msg(`💌 ${p.name} convida você para ${names[kind]} em ${World.villages[vi].name} (até ${Calendar.short(G.day + 1)}). Vá até a vila e confirme a presença na janela Sociedade.`, 'gold');
  },
  attend(i) {
    const p = G.people[i.pid], v = World.villages[i.vi]; if (!p || !v) return;
    if (U.dist(P.x / TILE, P.y / TILE, v.x, v.y) > 22) { UI.msg(`Você precisa estar em ${v.name} para ir.`, 'bad'); return; }
    People.addAff(p, 12); const f = Families.of(p); if (f) for (const q of Families.members(f)) if (q !== p) People.addAff(q, 4);
    this.rep(this.groupOf(p), 2); this.rep('povo', 1);
    this.S().invites = this.S().invites.filter(x => x !== i);
    UI.msg(`🎉 Você foi a ${i.name} de ${p.name}: amizade +12 e toda a família gostou.`, 'gold');
  },
  // banquete: convidados ganham amizade; desafetos na mesma mesa podem brigar
  banquet(ids) {
    if (this.S().banquetDay === G.day) { UI.msg('Você já deu um banquete este mês.', 'bad'); return; }
    const guests = ids.map(id => G.people[id]).filter(p => p && p.alive); if (!guests.length) { UI.msg('Escolha pelo menos um convidado.', 'bad'); return; }
    const cost = 30 + guests.length * 15; if (P.gold < cost) { UI.msg(`O banquete custa ${cost} 🪙.`, 'bad'); return; }
    P.gold -= cost; this.S().banquetDay = G.day;
    const wine = Inv.count('wine') >= guests.length; if (wine) Inv.add('wine', -guests.length);
    const lines = [];
    for (const g of guests) { People.addAff(g, 10 + (wine ? 5 : 0)); if (this.canRom(g)) g.rom = Math.min(100, g.rom + 3); this.rep(this.groupOf(g), 1.5); }
    for (const a of guests) for (const b of guests) if (a.id < b.id && (this.ties(a).foes.includes(b.id) || this.ties(b).foes.includes(a.id))) { People.addAff(a, -8); People.addAff(b, -8); lines.push(`${a.name} e ${b.name} brigaram na mesa`); Rumors.atP(`Briga no banquete de ${G.name}: ${a.name} e ${b.name} saíram no tapa.`); }
    Court.addFame(Math.min(5, Math.ceil(guests.length / 2)));
    UI.msg(`🍷 Banquete para ${guests.length} convidados (${cost} 🪙${wine ? ', com vinho' : ''}): amizade de todos subiu e +${Math.min(5, Math.ceil(guests.length / 2))} de fama.${lines.length ? ' Mas ' + lines.join('; ') + '.' : ''}`, lines.length ? 'bad' : 'gold', true);
  },
  canRom(p) { return People.canRomance(p) && (p.dating || p.spouse === 'player'); },
  // ---------------------------------------------------------------- 7. honra e vingança
  publicInsult(p) {
    const e = G.spawned && G.spawned.get(p.id);
    const seen = G.ents.filter(x => !x.dead && x.npc && x.npc !== p && e && U.dist(x.x, x.y, e.x, e.y) < 7 * TILE).length;
    if (seen < 2) return false;
    p.rival = true; this.rep(this.groupOf(p), -3); Rumors.atP(`${G.name} insultou ${p.name} na frente de todo mundo.`);
    return true;
  },
  rivals() { return G.people.filter(p => p.alive && p.rival && p.age >= 16); },
  challenge(p) {
    if (!p || !p.alive || G.place || G.duel || G.honor) return;
    Dialog.confirm({ icon: '⚔️', title: 'Duelo de honra', text: `${People.full(p)} desafia você para um duelo de honra${p.vendetta ? `, para vingar ${p.vendetta}` : ''}. Até o primeiro que cair (ninguém morre). Recusar mancha o seu nome.`, ok: 'Aceitar o duelo', cancel: 'Recusar' },
      () => this.startDuel(p),
      () => { this.rep('nobreza', -5, 'recusou um duelo de honra'); this.rep('povo', -2); People.addAff(p, -5); Rumors.atP(`${G.name} fugiu de um duelo com ${p.name}. Covarde!`); });
  },
  startDuel(p) {
    const sp = freeSpotNear(P.x + 50, P.y, 60), st = Ranking.stats(p);
    const e = Game.spawn('villager', sp.x, sp.y, { civ: p.civ, npc: p, leash: 99 });
    e.maxHp = e.hp = 80 + (st.str || 40) * 2; e.dmg = 6 + Math.round((st.str || 40) / 8); e.angry = true; e.target = P; e.honor = true; e.aggroOv = 14;
    G.honor = { pid: p.id, ent: e, t: 0 }; UI.close();
    UI.banner('⚔️ Duelo de honra!'); UI.msg(`⚔️ Duelo com ${p.name}: vence quem derrubar o outro primeiro (ninguém morre).`, 'gold');
  },
  endDuel(won) {
    const d = G.honor; if (!d) return; G.honor = null;
    const p = G.people[d.pid]; if (d.ent && !d.ent.dead) { d.ent.dead = true; G.spawned.delete(d.pid); }
    if (!p) return;
    if (won) { p.rival = false; p.vendetta = null; People.addAff(p, 15); Court.addFame(3); this.rep('nobreza', 3); this.rep('povo', 2); UI.msg(`🏅 Você venceu o duelo: ${p.name} reconhece a derrota (+3 de fama). A rivalidade acabou com honra.`, 'gold', true); Rumors.atP(`${G.name} venceu ${p.name} num duelo de honra.`); }
    else { Court.addFame(-2); this.rep('nobreza', -2); UI.msg(`🩸 ${p.name} venceu o duelo. A rivalidade continua (−2 de fama).`, 'bad', true); Rumors.atP(`${p.name} venceu ${G.name} num duelo de honra.`); }
  },
  // ---------------------------------------------------------------- 8. política local
  E(vi) { const E = this.S().elect; return E[vi] || (E[vi] = { next: G.day + U.rint(4, 10), cand: [], me: false, support: null, push: 0 }); },
  elders(vi) { return People.residents(vi).filter(p => p.age >= 50).sort((a, b) => b.age - a.age).slice(0, 3); },
  candidates(vi) {
    const v = World.villages[vi], E = this.E(vi), out = [];
    const cur = v.chief !== undefined && v.chief !== 'player' ? G.people[v.chief] : null;
    if (cur && cur.alive) out.push(cur);
    for (const p of People.residents(vi).filter(p => p.age >= 30 && !p.kin && p !== cur).sort((a, b) => People.purse(b) + b.age * 3 - People.purse(a) - a.age * 3).slice(0, out.length ? 1 : 2)) out.push(p);
    E.cand = out.map(p => p.id); return out;
  },
  votes(vi) {
    const E = this.E(vi), C = this.candidates(vi), elders = this.elders(vi), res = {};
    for (const c of C) res[c.id] = 0; if (E.me) res.player = 0;
    for (const r of People.residents(vi).filter(p => p.age >= 16)) {
      const w = elders.includes(r) ? 3 : 1; let best = null, bs = -1e9;
      for (const c of C) { const s = (this.ties(r).friends.includes(c.id) ? 30 : 0) - (this.ties(r).foes.includes(c.id) ? 30 : 0) + (r.fam === c.fam ? 25 : 0) + (c.age / 4) + U.hash2(r.id, c.id, G.day) * 20 + (E.support === c.id ? r.aff * 0.25 : 0); if (s > bs) { bs = s; best = c.id; } }
      if (E.me) { const s = r.aff * 0.6 + E.push + (this.good('povo') ? 10 : this.bad('povo') ? -15 : 0) + U.hash2(r.id, 999, G.day) * 20; if (s > bs) { bs = s; best = 'player'; } }
      if (best !== null) res[best] += w;
    }
    return res;
  },
  run(vi) { const E = this.E(vi); if (E.me) return; if (P.gold < 50) { UI.msg('A candidatura custa 50 🪙.', 'bad'); return; } P.gold -= 50; E.me = true; UI.msg(`🗳️ Você é candidato em ${World.villages[vi].name}. A eleição é em ${Calendar.short(E.next)}.`, 'gold'); },
  campaign(vi) {
    const E = this.E(vi); if (!E.me) return; if (P.gold < 40) { UI.msg('Um comício custa 40 🪙.', 'bad'); return; }
    P.gold -= 40; E.push += 4; this.cascading = true; const m0 = UI.msg; UI.msg = () => {}; try { for (const r of People.residents(vi)) People.addAff(r, 2); } finally { UI.msg = m0; this.cascading = false; }
    UI.msg(`📣 Comício em ${World.villages[vi].name}: o povo gostou (+2 de amizade com todos os moradores).`, 'gold');
  },
  support(vi, pid) { const E = this.E(vi); E.support = pid; const p = G.people[pid]; UI.msg(`🗳️ Você apoia ${p ? p.name : '?'} na eleição de ${World.villages[vi].name}.`); },
  election(vi) {
    const v = World.villages[vi], E = this.E(vi); E.next = G.day + 12;
    if (!v || v.lord === 'player' || (G.civs[v.civ] && G.civs[v.civ].ruler === 'player' && !E.me)) { E.me = false; E.push = 0; return; }
    const res = this.votes(vi), ids = Object.keys(res); if (!ids.length) return;
    const win = ids.sort((a, b) => res[b] - res[a])[0], tot = ids.reduce((a, k) => a + res[k], 0);
    const known = E.me || E.support !== null || U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 40;
    if (win === 'player') { Chiefdom.grant(vi, `🗳️ O povo de ${v.name} te elegeu com ${res.player} de ${tot} votos!`); this.rep('povo', 5); }
    else {
      const p = G.people[+win]; v.chief = p.id;
      if (E.support === p.id) { People.addAff(p, 25); UI.msg(`🗳️ ${p.name}, que você apoiou, venceu a eleição de ${v.name}: agora é seu aliado (+25 de amizade).`, 'gold', true); }
      else if (known) UI.msg(`🗳️ ${p.name} venceu a eleição de ${v.name} (${res[win]} de ${tot} votos).${E.me ? ` Você teve ${res.player}.` : ''}`, E.me ? 'bad' : '');
      Rumors.atV(vi, `${p.name} foi eleito chefe de ${v.name}.`);
    }
    E.me = false; E.push = 0; E.support = null;
  },
  // ---------------------------------------------------------------- 9. visitas e jantar
  visit() {
    const S = this.S(); if (S.visitDay === G.day) return; S.visitDay = G.day;
    const friends = G.people.filter(p => p.alive && p.aff >= 45 && !p.kin && !p.capanga && p.spouse !== 'player');
    const r = Math.random();
    if (typeof Loans !== 'undefined' && Loans.L().some(l => l.missed > 0) && r < 0.5) { UI.msg('🚪 Um cobrador bateu à sua porta: "Pague o que deve, ou volto com os guardas!"', 'bad', true); return; }
    if (friends.length && r < 0.55) { const p = U.pick(friends), it = U.pick(['bread', 'apple_pie', 'wine', 'cheese', 'honey_cake', 'candle', 'herbal_tea'].filter(k => ITEMS[k])); Inv.add(it, 1); People.addAff(p, 3); UI.msg(`🚪 ${p.name} veio visitar e trouxe ${ITEMS[it].name} de presente.`, 'gold', true); return; }
    if (r < 0.75) { const near = World.structs.filter(s => s.owner === 'player' && !s.removed && ['pigsty', 'biz_charcoal', 'biz_tannery', 'trench', 'biz_butcher'].includes(s.type)); if (near.length) { const v = World.villages.find(v => U.dist(v.x, v.y, near[0].x, near[0].y) < 20); if (v) { const p = U.pick(People.residents(World.villages.indexOf(v))); if (p) { People.addAff(p, -2); UI.msg(`🚪 ${p.name}, vizinho de ${v.name}, veio reclamar do cheiro do seu ${BUILDINGS[near[0].type].name.toLowerCase()}.`, 'bad'); } } } }
  },
  dinner(p) {
    if (p.dinnerDay === G.day) return { text: 'Ainda estou satisfeito do último jantar!', note: '' };
    const food = Object.keys(P.inv).filter(k => ITEMS[k] && ITEMS[k].cat === 'Comida' && ITEMS[k].price >= 9 && Inv.count(k) > 0);
    if (!food.length) return { text: 'Jantar? Com o quê?', note: 'Você precisa de uma comida preparada (assado, torta, ensopado...).' };
    const k = food.sort((a, b) => ITEMS[b].price - ITEMS[a].price)[0]; Inv.add(k, -1); p.dinnerDay = G.day;
    const gain = 8 + Math.round(ITEMS[k].price / 6); People.addAff(p, gain); this.attention(p);
    let note = `🍽️ Jantar com ${ITEMS[k].name}: amizade +${gain}`;
    if (this.canRom(p) || (People.canRomance(p) && p.aff >= 30)) { p.rom = Math.min(100, p.rom + 6); note += ' · romance +6'; }
    return { text: U.pick(['Que noite agradável! Obrigado pelo convite.', 'A comida estava divina!', 'Precisamos repetir isso.']), note };
  },
  // ---------------------------------------------------------------- o mês
  monthTick() {
    const S = this.S();
    // convites que venceram
    for (const i of S.invites.filter(x => x.until < G.day)) { const p = G.people[i.pid]; if (p && p.alive) { People.addAff(p, -8); UI.msg(`💌 Você faltou a ${i.name} de ${p.name}: ${p.sex === 'f' ? 'ela' : 'ele'} ficou magoad${p.sex === 'f' ? 'a' : 'o'} (−8).`, 'bad'); } }
    S.invites = S.invites.filter(x => x.until >= G.day);
    // aniversários dos amigos
    const bday = G.people.filter(p => p.alive && p.aff >= 40 && !p.kin && p.home.type === 'village' && U.hash2(p.id, 3, 7) * 12 < 1 && (Calendar.of(G.day).month || 0) === Math.floor(U.hash2(p.id, 4, 7) * 12));
    for (const p of bday.slice(0, 1)) this.invite(p, 'birthday');
    this.romanceTick();
    // rivais desafiam; vinganças de família amadurecem
    for (const p of G.people) if (p.alive && p.vendetta && p.age >= 16 && !p.rival) { p.rival = true; UI.msg(`🗡️ ${People.full(p)} cresceu e jurou vingar ${p.vendetta}.`, 'bad', true); }
    const rv = this.rivals(); if (rv.length && Math.random() < 0.35) this.challenge(U.pick(rv));
    // eleições
    World.villages.forEach((v, vi) => { if (G.day >= this.E(vi).next) this.election(vi); });
    // reinos do jogador com imposto alto irritam o povo e agradam a nobreza
    for (const c of G.civs) if (c.ruler === 'player') { if (c.tax > 0.15) { this.rep('povo', -1); this.rep('nobreza', 0.5); } else if (c.tax < 0.08) this.rep('povo', 0.7); }
    // a reputação volta devagar para o neutro
    for (const g in S.rep) S.rep[g] *= 0.98;
  },
  // a cada quadro: duelo de honra
  update() {
    const d = G.honor; if (!d) return;
    if (!d.ent || d.ent.dead) { this.endDuel(true); return; }
    if (U.dist(d.ent.x, d.ent.y, P.x, P.y) > 20 * TILE) { this.endDuel(false); return; }
    d.ent.target = P;
  },
  // janela da sociedade
  show(tab) {
    tab = tab || UI.sel.socTab || 'rep'; UI.sel.socTab = tab; const S = this.S();
    const tabs = [['rep', '📊 Reputação'], ['friends', '💚 Amigos'], ['events', '🎉 Eventos'], ['politics', '🗳️ Política'], ['secrets', '🤫 Segredos']];
    let h = `<div class="tabs">${tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="socTab" data-t="${k}">${n}</button>`).join('')}</div>`;
    if (tab === 'rep') {
      h += Object.entries(SOC_GROUPS).map(([g, d]) => { const v = this.repOf(g); return `<div class="card soc-rep"><div class="sec">${d.icon} ${d.name} <span class="${v >= 30 ? 'ok' : v <= -30 ? 'bad' : ''}">${v > 0 ? '+' : ''}${v}</span></div>
        <div class="soc-bar"><i style="left:50%;width:${Math.abs(v) / 2}%;${v < 0 ? `transform:translateX(-100%);background:#c84a3a` : 'background:#5fb35f'}"></i></div>
        <p class="dt-desc">${v >= 30 ? '✔ ' + d.good : v <= -30 ? '✖ ' + d.bad : `Com +30: ${d.good}. Com −30: ${d.bad}.`}</p></div>`; }).join('');
    } else if (tab === 'friends') {
      const L = G.people.filter(p => p.alive && p.aff >= 10 && !p.kin).sort((a, b) => b.aff - a.aff).slice(0, 30);
      h += `<p class="dt-desc">Níveis: ${FRIEND_LV.slice().reverse().map(x => `<b>${x[1]}</b> (${x[0]}+)${x[3] ? ': ' + x[3] : ''}`).join(' · ')}.</p>`;
      h += `<div class="list">${L.map(p => { const lv = FRIEND_LV.find(x => p.aff >= x[0]); return `<div class="item"><span class="ic">${p.rival ? '⚔️' : '💚'}</span><div class="info"><b>${UI.esc(People.full(p))}</b><small>${lv ? (p.sex === 'f' ? lv[2] : lv[1]) : ''} · amizade ${Math.round(p.aff)} · ${SOC_GROUPS[this.groupOf(p)].name}</small></div><button data-act="tk" data-op="open" data-id="${p.id}">💬</button></div>`; }).join('') || '<p class="muted">Ninguém ainda.</p>'}</div>`;
      const rv = this.rivals(); if (rv.length) h += `<h3>Rivais</h3><div class="list">${rv.map(p => `<div class="item"><span class="ic">⚔️</span><div class="info"><b>${UI.esc(People.full(p))}</b><small>${p.vendetta ? 'vingança: ' + UI.esc(p.vendetta) : 'rival de honra'}</small></div></div>`).join('')}</div>`;
    } else if (tab === 'events') {
      h += `<div class="card"><div class="sec">💌 Convites</div>${S.invites.length ? `<div class="list">${S.invites.map((i, k) => { const p = G.people[i.pid]; return `<div class="item"><span class="ic">🎉</span><div class="info"><b>${UI.esc(i.name)} de ${UI.esc(p ? p.name : '?')}</b><small>em ${UI.esc(World.villages[i.vi].name)} · até ${Calendar.short(i.until)}</small></div><button class="primary" data-act="socGo" data-i="${k}">Comparecer</button></div>`; }).join('')}</div>` : '<p class="muted">Nenhum convite agora.</p>'}</div>`;
      const cand = G.people.filter(p => p.alive && p.met && p.aff >= 10 && !p.kin && p.spouse !== 'player').sort((a, b) => b.aff - a.aff).slice(0, 16), sel = UI.sel.banq || [];
      h += `<div class="card"><div class="sec">🍷 Dar um banquete <span>${30 + sel.length * 15} 🪙</span></div><p class="dt-desc">Escolha até 8 convidados. Todos ganham amizade (com vinho na mochila, mais); nobres e padres à mesa sobem a sua reputação com eles. Cuidado: desafetos na mesma mesa brigam.</p>
        <div class="soc-guests">${cand.map(p => `<button class="${sel.includes(p.id) ? 'on' : ''}" data-act="socPick" data-p="${p.id}">${UI.esc(p.name)} <small>${SOC_GROUPS[this.groupOf(p)].icon}</small></button>`).join('')}</div>
        <div class="act-row"><button class="primary" data-act="socBanquet" ${sel.length && S.banquetDay !== G.day ? '' : 'disabled'}>🍷 Servir o banquete</button></div></div>`;
    } else if (tab === 'politics') {
      const dd = x => U.dist(x.v.x, x.v.y, P.x / TILE, P.y / TILE) - (this.E(x.vi).me ? 1e6 : 0), vs = World.villages.map((v, vi) => ({ v, vi })).sort((x, y) => dd(x) - dd(y)).slice(0, 6);
      h += vs.map(({ v, vi }) => { const E = this.E(vi), C = this.candidates(vi), res = this.votes(vi), el = this.elders(vi);
        return `<div class="card"><div class="sec">🗳️ ${UI.esc(v.name)} <span>eleição em ${Calendar.short(E.next)}</span></div>
          <p class="dt-desc">Conselho de anciãos (voto vale 3): ${el.map(p => UI.esc(p.name)).join(', ') || '—'}. ${v.lord === 'player' ? '<b class="ok">Você governa esta vila.</b>' : ''}</p>
          <div class="list">${C.map(c => `<div class="item"><span class="ic">${v.chief === c.id ? '🏅' : '👤'}</span><div class="info"><b>${UI.esc(People.full(c))}</b><small>${res[c.id] || 0} votos${E.support === c.id ? ' · seu apoio' : ''}</small></div>${E.support === c.id ? '' : `<button data-act="socSupport" data-v="${vi}" data-p="${c.id}">Apoiar</button>`}</div>`).join('')}
            ${E.me ? `<div class="item"><span class="ic">⭐</span><div class="info"><b>Você</b><small>${res.player || 0} votos</small></div><button class="primary" data-act="socCampaign" data-v="${vi}">📣 Comício (40 🪙)</button></div>` : ''}</div>
          ${!E.me && v.lord !== 'player' ? `<div class="act-row"><button data-act="socRun" data-v="${vi}">🗳️ Candidatar-se (50 🪙)</button></div>` : ''}</div>`; }).join('') || '<p class="muted">Nenhuma vila por perto.</p>';
    } else {
      const L = S.secrets.filter(s => !s.used);
      h += `<p class="dt-desc">Segredos vêm dos seus confidentes, de conversas de taverna e, com o submundo a seu favor, de informantes. Na conversa com a pessoa você decide: guardar, espalhar ou chantagear.</p><div class="list">${L.map(s => { const p = G.people[s.pid]; return `<div class="item"><span class="ic">🤫</span><div class="info"><b>${UI.esc(s.text)}</b><small>${p ? UI.esc(People.full(p)) : ''}</small></div>${p ? `<button data-act="tk" data-op="open" data-id="${p.id}">💬</button>` : ''}</div>`; }).join('') || '<p class="muted">Você não sabe segredo nenhum... ainda.</p>'}</div>
        ${this.good('submundo') ? `<div class="act-row"><button data-act="socInformant">🗡️ Pagar um informante (60 🪙)</button></div>` : ''}`;
    }
    UI.open('🤝 Sociedade', `<div class="soc">${h}</div>`, 'showSociety', [tab], 'Reputação, amigos, eventos, política e segredos');
  },
};

// ------------------------------------------------------------------ ganchos
{
  // cascata em toda mudança de amizade com você
  const af0 = People.addAff.bind(People);
  People.addAff = function (p, n) { const r = af0(p, n); if (!Society.cascading) Society.cascade(p, n); return r; };
  // níveis de amizade nos rótulos
  const rl0 = People.relation.bind(People);
  People.relation = function (p) {
    const r = rl0(p); if (p.kin || p.spouse === 'player' || p.engaged || p.dating || p.capanga || p.aff < 10) return p.rival && p.aff < 10 ? { text: 'Rival', col: '#ff7a4a' } : r;
    const lv = FRIEND_LV.find(x => p.aff >= x[0]); return { text: p.sex === 'f' ? lv[2] : lv[1], col: p.aff >= 70 ? '#7ae07a' : p.aff >= 45 ? '#5fd35f' : '#c9e0a0' };
  };
  // atenção ao cônjuge e ciúme
  for (const k of ['talk', 'gift', 'date']) { const f0 = People[k].bind(People); People[k] = function (p, ...a) { const r = f0(p, ...a); if (p && (p.spouse === 'player' || p.dating)) Society.attention(p); return r; }; }
  const fl0 = People.flirt.bind(People);
  People.flirt = function (p) {
    const r = fl0(p), pt = Society.partner();
    if (pt && pt !== p && pt.alive && Math.random() < 0.5) { pt.rom = Math.max(0, pt.rom - 15); People.addAff(pt, -10); UI.msg(`😠 ${pt.name} ficou sabendo do seu flerte com ${p.name} e está com ciúme (romance −15).`, 'bad', true); }
    return r;
  };
  // dote no seu casamento
  const pr0 = People.propose.bind(People);
  People.propose = function (p) { const r = pr0(p); if (p.spouse === 'player' && !p.dowryPaid) { p.dowryPaid = true; const d = Society.dowry(p); if (d) { P.gold += d; if (r) r.note = (r.note || '') + ` A família pagou ${d} 🪙 de dote.`; } } return r; };
  // insulto em público vira rivalidade; reputação do grupo
  const in0 = People.insult.bind(People);
  People.insult = function (p) { const r = in0(p); if (Society.publicInsult(p) && r) r.note = (r.note || '') + ` Em público: ${p.name} agora é seu rival.`; Society.rep(Society.groupOf(p), -1); return r; };
  // esmola e ajuda: povo e submundo; doações à igreja: clero
  const gg0 = People.giveGold.bind(People);
  People.giveGold = function (p, n) { const r = gg0(p, n); if (r) Society.rep(p.rank === 'beggar' ? 'povo' : Society.groupOf(p), Math.min(3, n / 30)); return r; };
  if (typeof Faith !== 'undefined') {
    const dn0 = Faith.donate.bind(Faith); Faith.donate = function (ci, n) { const r = dn0(ci, n); Society.rep('clero', Math.min(5, n / 40)); return r; };
    if (Faith.alms) { const al0 = Faith.alms.bind(Faith); Faith.alms = function (vi) { const r = al0(vi); Society.rep('povo', 2); Society.rep('clero', 1); return r; }; }
  }
  // crime: o submundo gosta, o resto não; o povo protege quem ele estima; o clero intercede na multa
  const cm0 = Crime.commit.bind(Crime);
  Crime.commit = function (ci, what, fine, x, y, sure) {
    if (!sure && Society.good('povo') && Math.random() < 0.5) return false;
    const r = cm0(ci, what, Society.good('clero') ? fine * 0.7 : fine, x, y, sure || Society.bad('povo'));
    if (r) { Society.rep('submundo', 2); Society.rep('povo', -1.5); Society.rep('nobreza', -1); Society.rep('clero', -1); }
    return r;
  };
  // preços: mercadores (todas as lojas) e nobreza (luxo)
  const pf0 = Game.priceFor.bind(Game);
  Game.priceFor = function (ci, k, owner) {
    const r = pf0(ci, k, owner); let m = 1;
    if (owner) { if (Society.good('mercadores')) m -= 0.05; if (Society.bad('mercadores')) m += 0.05; if (ITEMS[k] && ITEMS[k].price >= 60) { if (Society.good('nobreza')) m -= 0.05; if (Society.bad('nobreza')) m += 0.05; } }
    return m === 1 ? r : { buy: Math.max(1, Math.round(r.buy * m)), sell: Math.max(1, Math.round(r.sell * (2 - m))) };
  };
  const tr0 = Game.trade.bind(Game);
  Game.trade = function (ci, k, n, mode, owner) { const g0 = P.gold; tr0(ci, k, n, mode, owner); if (owner && P.gold !== g0) Society.rep('mercadores', Math.min(1, Math.abs(P.gold - g0) / 400)); };
  // guildas: reputação muda a amizade necessária para recrutar
  if (typeof Commerce !== 'undefined') {
    const rn0 = Commerce.recruitNeed.bind(Commerce);
    Commerce.recruitNeed = function (p) { return Math.max(5, rn0(p) + (Society.good('guildas') ? -10 : Society.bad('guildas') ? 10 : 0)); };
    const dl0 = Commerce.deliver.bind(Commerce); Commerce.deliver = function (id) { const n = Commerce.mine().length; dl0(id); if (Commerce.mine().length < n) { Society.rep('mercadores', 2); Society.rep('guildas', 1); } };
  }
  // ladrões preferem quem o submundo odeia
  const ct0 = Crime.monthTick.bind(Crime);
  Crime.monthTick = function () { const r = ct0(); if (Society.bad('submundo') && Math.random() < 0.15 && P.gold > 20) { const g = Math.min(80, Math.round(P.gold * 0.04)); P.gold -= g; UI.msg(`🗡️ Um batedor de carteira te achou na multidão: −${g} 🪙. O submundo não gosta de você.`, 'bad'); } return r; };
  // NPCs se casam e têm filhos: convites
  const mr0 = People.marry.bind(People);
  People.marry = function (a, b) { const r = mr0(a, b); if (a.spouse !== 'player' && b !== 'player' && typeof b === 'object' && !a.kin && !b.kin) { const host = a.aff >= b.aff ? a : b; Society.invite(host, 'wedding'); } return r; };
  const dv0 = Birth.deliver.bind(Birth);
  Birth.deliver = function (m) { const r = dv0(m); if (m && m.alive) Society.invite(m, 'baptism'); return r; };
  // quem perde um parente pelas suas mãos jura vingança
  const kl0 = Game.kill.bind(Game);
  Game.kill = function (e, src) {
    const victim = e && e.npc && !e.dead ? e.npc : null; const r = kl0(e, src);
    if (victim && (src === P || (src && fac(src) === 'player')) && !e.battle) { for (const id of victim.children || []) { const c = G.people[id]; if (c && c.alive && !c.kin) c.vendetta = People.full(victim); } Society.rep(Society.groupOf(victim), -6); }
    return r;
  };
  // duelo de honra: até cair, ninguém morre
  const dm0 = Game.damage.bind(Game);
  Game.damage = function (t, amount, src) {
    const d = G.honor;
    if (d && t === d.ent && t.hp - amount <= t.maxHp * 0.15) { t.hp = t.maxHp * 0.15; Society.endDuel(true); return; }
    if (d && t === P && src === d.ent && P.hp - amount <= P.maxHp * 0.15) { P.hp = Math.max(P.hp, P.maxHp * 0.2); Society.endDuel(false); return; }
    return dm0(t, amount, src);
  };
  // melhor amigo defende você numa briga
  const u0 = Content2.update.bind(Content2);
  Content2.update = function (dt) {
    u0(dt); Society.update();
    Society.defT = (Society.defT || 0) - dt; if (Society.defT > 0 || G.place) return; Society.defT = 0.6;
    const foe = G.ents.find(e => !e.dead && e.target === P && e.dmg > 0 && U.dist(e.x, e.y, P.x, P.y) < 6 * TILE && !e.honor);
    if (!foe) return;
    for (const e of G.ents) if (!e.dead && e.npc && e.npc.aff >= 70 && !e.npc.capanga && e !== foe && e.kind === 'villager' && U.dist(e.x, e.y, P.x, P.y) < 10 * TILE && e.target !== foe) {
      e.target = foe; e.helpP = true; if (!e.saidHelp) { e.saidHelp = true; Game.addText(e.x, e.y - 50, 'Deixa comigo!', '#9be37a'); }
    }
  };
  // o mês
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Society.monthTick(); };
  // dormir em casa: às vezes alguém bate à porta
  const sl0 = Game.sleep.bind(Game);
  Game.sleep = function (s) { const r = sl0(s); if (Math.random() < 0.45) setTimeout(() => Society.visit(), 300); return r; };
  // conversa: ações novas
  const ac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    ac0(p, acts);
    const lv = Society.level(p);
    if (lv >= 2) acts.push(['sTip', '💡 Pedir uma dica']);
    if (lv >= 4 && !p.lent && People.purse(p) >= 40) acts.push(['sLoan', `💰 Pedir emprestado sem juros (até ${Math.min(300, Math.round(People.purse(p) * 0.5))} 🪙)`]);
    if (p.lent) acts.push(['sRepay', `💰 Devolver ${p.lent} 🪙`]);
    if (lv >= 5 && !Society.knows(p) && !p.secTold) acts.push(['sSecret', '🤫 Pedir um segredo ao confidente']);
    if (Society.knows(p)) { acts.push(['sKeep', '🤐 Prometer guardar o segredo']); acts.push(['sSpread', '🗣️ Espalhar o segredo']); acts.push(['sBlack', '💀 Chantagear']); }
    if (p.aff >= 25 && p.age >= 16) acts.push(['sDinner', '🍽️ Convidar para jantar']);
    if (p.spouse === 'player') { if (p.affair !== undefined) acts.push(['sConfront', '💔 Perguntar sobre os boatos']); acts.push(['sDivorce', '💔 Pedir o divórcio']); }
    if (p.spouse === null && !p.kin && p.age >= 16 && Society.heirsToWed().some(c => c.sex !== p.sex)) acts.push(['sArrange', `💍 Propor casamento com um filho seu`]);
    if (p.rival) acts.push(['sDuel', '⚔️ Desafiar para um duelo de honra']);
  };
  const ta0 = Lifesim.talkAct.bind(Lifesim);
  Lifesim.talkAct = function (p, op) {
    switch (op) {
      case 'sTip': return { text: Society.tip(p), note: '💡 Dica de amigo.' };
      case 'sLoan': { const n = Math.min(300, Math.round(People.purse(p) * 0.5)); p.purse -= n; P.gold += n; p.lent = n; p.lentDay = G.day; return { text: 'Para você, sem juros. Devolve quando der.', note: `💰 +${n} 🪙 emprestados (devolva em até 6 meses).` }; }
      case 'sRepay': { if (P.gold < p.lent) return { text: 'Sem pressa.', note: `Você precisa de ${p.lent} 🪙.` }; P.gold -= p.lent; p.purse = People.purse(p) + p.lent; People.addAff(p, 5); const n = p.lent; p.lent = 0; return { text: 'Palavra cumprida! É por isso que confio em você.', note: `Devolveu ${n} 🪙 (amizade +5).` }; }
      case 'sSecret': { p.secTold = true; const s = Society.learn(p, 'confidente'); return { text: s ? `Só para você: ${s.text.replace(p.name, 'eu')}` : 'Não tenho mais segredos para você.', note: '' }; }
      case 'sKeep': return Society.useSecret(p, 'keep');
      case 'sSpread': return Society.useSecret(p, 'spread');
      case 'sBlack': return Society.useSecret(p, 'blackmail');
      case 'sDinner': return Society.dinner(p);
      case 'sConfront': return Society.confront(p);
      case 'sDivorce': return Society.divorce(p);
      case 'sArrange': { const c = Society.heirsToWed().find(c => c.sex !== p.sex); return c ? Society.arrange(p, c.id) : { text: 'Hum?', note: '' }; }
      case 'sDuel': Society.challengeFromPlayer = true; Society.startDuel(p); return 'shown';
    }
    return ta0(p, op);
  };
  const ch0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) {
    const out = ch0(p), t = Society.ties(p), name = id => G.people[id] ? G.people[id].name : null;
    out.push(`<span>${SOC_GROUPS[Society.groupOf(p)].icon} ${SOC_GROUPS[Society.groupOf(p)].name}</span>`);
    if (t.best !== null && name(t.best)) out.push(`<span>💚 Melhor amigo: ${UI.esc(name(t.best))}</span>`);
    if (t.conf !== null && name(t.conf) && t.conf !== t.best) out.push(`<span>🤝 Confidente: ${UI.esc(name(t.conf))}</span>`);
    const foes = t.foes.map(name).filter(Boolean); if (foes.length) out.push(`<span>😠 Desafetos: ${UI.esc(foes.join(', '))}</span>`);
    if (p.rival) out.push(`<span class="tag" style="background:#7a2a1a">⚔️ ${p.vendetta ? 'Vingança' : 'Rival'}</span>`);
    if (Society.knows(p)) out.push('<span class="tag" style="background:#3a2a5a">🤫 Você sabe um segredo</span>');
    return out;
  };
  // janelas: sociedade no Portfólio; testemunha na prisão
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showArrest' && G.people.some(p => p.alive && p.aff >= 90 && !p.kin) && !(G.urban.soc && G.urban.soc.witDay === G.day)) body = body.replace('</div>', '</div><div class="act-row"><button data-act="socWitness" data-c="' + args[0] + '">🧑‍⚖️ Chamar um confidente como testemunha (multa pela metade)</button></div>');
    return op0(title, body, fn, args, sub);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    switch (a) {
      case 'socTab': Society.show(d.t); return;
      case 'socPick': { const L = this.sel.banq || (this.sel.banq = []), id = +d.p, i = L.indexOf(id); if (i >= 0) L.splice(i, 1); else if (L.length < 8) L.push(id); Society.show('events'); return; }
      case 'socBanquet': Society.banquet(this.sel.banq || []); this.sel.banq = []; Society.show('events'); return;
      case 'socGo': { const i = Society.S().invites[+d.i]; if (i) Society.attend(i); Society.show('events'); return; }
      case 'socRun': Society.run(+d.v); Society.show('politics'); return;
      case 'socCampaign': Society.campaign(+d.v); Society.show('politics'); return;
      case 'socSupport': Society.support(+d.v, +d.p); Society.show('politics'); return;
      case 'socInformant': { if (P.gold < 60) { UI.msg('O informante quer 60 🪙.', 'bad'); return; } const p = U.pick(G.people.filter(q => q.alive && q.age >= 18 && !q.kin && !Society.knows(q) && U.dist(P.x / TILE, P.y / TILE, (World.villages[q.home.idx] || { x: -999 }).x, (World.villages[q.home.idx] || { y: -999 }).y) < 50)); if (!p) return; P.gold -= 60; Society.learn(p, 'informante'); Society.show('secrets'); return; }
      case 'socWitness': { const w = Crime.wanted(+d.c); if (w) { w.bounty = Math.round(w.bounty / 2); G.urban.soc.witDay = G.day; UI.msg('🧑‍⚖️ O seu confidente jurou a seu favor: a multa caiu pela metade.', 'gold'); } UI.showArrest(+d.c); return; }
    }
    return a0(a, d);
  };
}
// empréstimos de amigos: se não devolver em 6 meses, a amizade sofre
{
  const m0 = Society.monthTick.bind(Society);
  Society.monthTick = function () { m0(); for (const p of G.people) if (p.alive && p.lent && G.day - (p.lentDay || 0) > 6) { People.addAff(p, -25); p.lentDay = G.day; UI.msg(`💸 ${p.name} cansou de esperar os ${p.lent} 🪙 que emprestou: amizade −25.`, 'bad', true); } };
}

'use strict';
// A ficha de cada morador e os passatempos com ele. Na conversa, a aba "Ficha" mostra quem a pessoa é: estado civil,
// filhos, pais e irmãos, ofício, loja, riqueza, casa, jeito de ser, gostos, sonho, o que ela lembra de você e as
// notícias da vida dela. Algumas coisas são segredo (quanto ela tem guardado, do que gosta, por quem está apaixonada):
// descobre-se com amizade ou pagando uma bebida. E há mais o que fazer junto: beber, jogar dados, treinar, ouvir
// histórias dos mais velhos, pedir conselho, dar os parabéns ou os pêsames, perdoar uma dívida e bancar o cupido.

const SOC_OPS = ['drink', 'congrats', 'condole', 'advice', 'dice', 'spar', 'story', 'cupid', 'forgive'];
const SOC_GOOD = ['💍', '👶', '🏅', '🎓', '🏪', '🛡️', '⚜️', '🐎'];
const SOC_FIGHT = ['soldier', 'knight', 'mercenary', 'hunter', 'ruler', 'heir'];
const Social = {
  S(p) { return p.soc || (p.soc = {}); },
  done(p, op) { return this.S(p)[op] === G.day; },
  ela(p) { return p.sex === 'f' ? 'ela' : 'ele'; },
  o(p) { return p.sex === 'f' ? 'a' : 'o'; },
  single(p) { return p.alive && p.age >= 18 && p.age <= 55 && p.spouse === null && !p.engaged && !p.dating && !p.kin && !p.capanga && !People.isCourt(p) && p.home.type === 'village'; },
  // quem combina com a pessoa na mesma vila (a paixão secreta, se houver, vem primeiro)
  match(p) {
    const ok = q => q && q !== p && this.single(q) && q.sex !== p.sex && q.home.idx === p.home.idx && Math.abs(q.age - p.age) <= 14 && !(p.parents || []).some(x => (q.parents || []).includes(x));
    if (p.crush !== undefined && ok(G.people[p.crush])) return G.people[p.crush];
    return U.pick(People.residents(p.home.idx).filter(ok)) || null;
  },
  acts(p, acts) {
    if (p.capanga) return;
    const adult = p.age >= 16, royal = ['ruler', 'consort'].includes(p.rank);
    if (p.ev && p.ev.until >= G.day && SOC_GOOD.includes(p.ev.icon) && !p.ev.cg) acts.push(['congrats', '🎉 Dar os parabéns']);
    if (p.mourn > G.day && p.condoled !== p.mournFor) acts.push(['condole', '🕯️ Dar os pêsames']);
    if (adult && !this.done(p, 'drink')) acts.push(['drink', '🍺 Pagar uma bebida — 6 🪙']);
    if (adult && !this.done(p, 'advice')) acts.push(['advice', '🧭 Pedir um conselho']);
    if (adult && !royal && p.rank !== 'priest' && (this.S(p).diceDay !== G.day || (this.S(p).diceN || 0) < 3)) acts.push(['dice', '🎲 Jogar dados — 10 🪙']);
    if (adult && (SOC_FIGHT.includes(p.rank) || (p.str || 0) >= 60) && !this.done(p, 'spar')) acts.push(['spar', '⚔️ Treinar juntos']);
    if (p.age >= 55 && !this.done(p, 'story')) acts.push(['story', '📖 Ouvir histórias']);
    if (this.single(p) && G.day - (this.S(p).cupid === undefined ? -99 : this.S(p).cupid) >= 6 && p.spouse !== 'player') acts.push(['cupid', '💘 Bancar o cupido']);
    if (p.debt && p.debt.lender === 'player') acts.push(['forgive', '🤲 Perdoar a dívida']);
  },
  act(p, op) {
    const S = this.S(p), T = TRAITS[p.trait] || {}, name = p.name;
    if (op === 'congrats') {
      p.ev.cg = true; People.addAff(p, 8); Mind.feel(p, 'joy', 20);
      const L = { '💍': 'Obrigad' + this.o(p) + '! O casamento foi o dia mais feliz da minha vida.', '👶': 'Obrigad' + this.o(p) + '! O bebê é a nossa alegria — não dorme, mas é lindo.',
        '🏅': 'Anos de trabalho duro... enfim sou mestre! Obrigad' + this.o(p) + '.', '🎓': 'Estou aprendendo muito com o mestre. Obrigad' + this.o(p) + '!', '🏪': 'Venha conhecer o negócio! Para você, preço de amigo.',
        '🛡️': 'Jurei servir à coroa com honra. Obrigad' + this.o(p) + ' pelas palavras.', '⚜️': 'Quem diria, eu com título de nobreza! Agora me chame de ' + (p.sex === 'f' ? 'Dona' : 'Dom') + ', hein?', '🐎': 'Já viu o meu cavalo? Um animal e tanto!' };
      return { text: L[p.ev.icon] || 'Obrigad' + this.o(p) + '!', note: '+8 de amizade.' };
    }
    if (op === 'condole') {
      p.condoled = p.mournFor; People.addAff(p, 10); Mind.feel(p, 'sad', -30);
      return { text: `Obrigad${this.o(p)}... ${p.mournFor} faz muita falta. Saber que alguém se importa já ajuda.`, note: '+10 de amizade · a tristeza diminui.' };
    }
    if (op === 'drink') {
      if (P.gold < 6) return { text: 'Que gentil... mas você nem tem para a sua!', note: 'Você precisa de 6 🪙.' };
      P.gold -= 6; S.drink = G.day; { const k = p.home && p.home.type === 'village' ? People.shopkeeper(p.home.idx, 'innkeeper') : null; if (k) k.purse = People.purse(k) + 6; } // a bebida é paga ao taverneiro People.addAff(p, p.trait === 'rabugento' ? 3 : 6); Mind.feel(p, 'joy', 15); Sound.play('coin');
      const open = p.trait === 'rabugento' ? 'Hmpf... mas cerveja de graça eu não recuso. ' : p.trait === 'timido' ? 'Ah... obrigad' + this.o(p) + '. *bebe devagar* ' : 'Saúde! ';
      return { text: open + this.secret(p), note: 'Com a bebida, a língua solta: a Ficha mostra o que você descobriu.' };
    }
    if (op === 'advice') {
      S.advice = G.day; People.addAff(p, 2);
      return { text: this.advice(p), note: '' };
    }
    if (op === 'dice') {
      if (S.diceDay !== G.day) { S.diceDay = G.day; S.diceN = 0; }
      if (P.gold < 10) return { text: 'Sem moeda na mesa, sem jogo.', note: 'Você precisa de 10 🪙.' };
      S.diceN++;
      const d = () => U.rint(1, 6), a = [d(), d()], b = [d(), d()], sa = a[0] + a[1], sb = b[0] + b[1];
      const roll = `🎲 Você: ${a[0]}+${a[1]} = ${sa} · ${name}: ${b[0]}+${b[1]} = ${sb}`;
      if (sa === sb) return { text: 'Empate! Ninguém leva nada. Mais uma?', note: roll };
      if (sa > sb) {
        P.gold += 10; if (People.PURSE[p.rank]) p.purse = Math.max(0, People.purse(p) - 10); Sound.play('coin');
        People.addAff(p, ['orgulhoso', 'ganancioso'].includes(p.trait) ? -2 : 1);
        return { text: ['orgulhoso', 'ganancioso'].includes(p.trait) ? 'Sorte de principiante. Isso não fica assim!' : 'Ha! Você tem sorte. Tome as suas moedas.', note: roll + ' — você ganhou 10 🪙.' };
      }
      P.gold -= 10; if (People.PURSE[p.rank]) p.purse = People.purse(p) + 10; People.addAff(p, 2); Mind.feel(p, 'joy', 10);
      return { text: 'Hoje os dados estão comigo! Obrigad' + this.o(p) + ' pelas moedas.', note: roll + ' — você perdeu 10 🪙.' };
    }
    if (op === 'spar') {
      if (P.stamina < 30) return { text: 'Você mal para em pé. Descanse primeiro!', note: 'Precisa de 30 de energia.' };
      Ranking.stats(p); S.spar = G.day; P.stamina -= 30; People.addAff(p, 4);
      const mine = P.level * 6 + U.rint(0, 40), theirs = (p.str || 50) + (p.rank === 'knight' ? 20 : 0) + U.rint(0, 40), win = mine >= theirs;
      Game.gainXp(win ? 20 : 12); Sound.play('hit');
      return { text: win ? `Boa! Você me derrubou de jeito. Treinamos de novo no mês que vem?` : `Mais firme na guarda! Viu como eu entrei por baixo? Assim você aprende.`, note: `${win ? 'Você venceu o treino' : `${name} venceu o treino`} · +${win ? 20 : 12} de experiência · −30 de energia.` };
    }
    if (op === 'story') {
      S.story = G.day; People.addAff(p, 6); Mind.feel(p, 'joy', 15); Game.gainXp(5);
      return { text: this.story(p), note: '+6 de amizade · +5 de experiência.' };
    }
    if (op === 'cupid') {
      if (!this.single(p)) return { text: 'Cupido? Eu? Meu coração já tem dono.', note: '' };
      S.cupid = G.day;
      const q = this.match(p);
      if (!q) return { text: `Cupido? Aqui em ${People.homeName(p)} não tem ninguém que combine comigo...`, note: 'Ninguém solteiro e da idade certa na vila.' };
      const chance = 0.3 + Math.max(0, p.aff) / 250 + Math.max(0, q.aff) / 250 + (p.crush === q.id ? 0.3 : 0);
      if (Math.random() < chance) {
        People.marry(p, q); People.addAff(p, 15); People.addAff(q, 15); Mind.feel(p, 'joy', 70); Mind.feel(q, 'joy', 70);
        News.add('life', `💘 Com uma ajudinha de ${G.name} ${G.surname}, ${People.full(p)} e ${People.full(q)} se casaram em ${People.homeName(p)}!`, { pid: p.id, w: 2 });
        delete p.crush; delete q.crush;
        return { text: `Você falou de mim para ${q.name}?! Nós conversamos, rimos... e vamos nos casar! Nunca vou esquecer isso.`, note: `💍 ${People.full(p)} e ${People.full(q)} se casaram · +15 de amizade com os dois.` };
      }
      People.addAff(p, 2);
      return { text: `${q.name}? Até tentei puxar conversa... mas não rolou. Fica para a próxima.`, note: 'O cupido pode tentar de novo daqui a 6 meses.' };
    }
    return null;
  },
  // o que a bebida revela (fica anotado na Ficha)
  secret(p) {
    const K = p.known || (p.known = {});
    if (!K.wealth) { K.wealth = 1; const w = People.purse(p); return w >= 600 ? `Cá entre nós... tenho uns ${w} 🪙 guardados. Mas não conte a ninguém!` : w >= 150 ? `Tenho as minhas economias: uns ${w} 🪙. Dá para viver.` : `Para ser sincer${this.o(p)}, estou quase sem nada: ${w} 🪙 no bolso.`; }
    if (!K.fav && p.fav && ITEMS[p.fav]) { K.fav = 1; return `Sabe do que eu gosto mesmo? De ${ITEMS[p.fav].name}. Quem me der um, ganha um amigo para sempre.`; }
    if (!K.crush && this.single(p)) {
      K.crush = 1; const q = this.match(p);
      if (q) { p.crush = q.id; return `Posso contar um segredo? Estou de olho em ${People.full(q)}... mas não tenho coragem de falar.`; }
      return 'Coração? Livre, livre. Ninguém por aqui me chamou a atenção ainda.';
    }
    if (!K.dream) { K.dream = 1; return this.wish(p); }
    const rs = Rumors.known(p).filter(r => r.about !== p.id);
    return rs.length ? `Ouvi uma coisa na taverna... ${U.pick(rs.slice(0, 8)).text}` : 'Que bebida boa. A melhor coisa do mês!';
  },
  wish(p) {
    if (p.dream && p.age < 30) return `O meu sonho? Ser ${Careers.dreamName(p)}. Um dia eu chego lá.`;
    if (p.shop) return 'O meu sonho é deixar a loja para os meus filhos, crescendo cada vez mais.';
    if (p.spouse === null && p.age >= 18) return 'O meu sonho é casar e ter uma casa cheia de crianças.';
    if (SOC_FIGHT.includes(p.rank)) return 'Sonho com uma batalha que entre para as canções.';
    return 'Sonho com uma vida tranquila: comida na mesa e a família por perto.';
  },
  // o conselho depende do que a pessoa sabe
  advice(p) {
    const ci = p.civ >= 0 ? p.civ : p.home.type === 'village' && World.villages[p.home.idx] ? World.villages[p.home.idx].civ : -1;
    if ((People.PURSE[p.rank] || p.shop) && ci >= 0 && G.civs[ci]) {
      const ks = Object.keys(ITEMS).filter(k => ITEMS[k].price > 1), up = ks.filter(k => Market.trend(ci, k) === 'up'), down = ks.filter(k => Market.trend(ci, k) === 'down');
      if (up.length || down.length) return `Conselho de quem vive de vender: ${up.length ? `aqui em ${CIV_DEFS[ci].short} está faltando ${ITEMS[U.pick(up)].name} — quem tiver, vende caro` : ''}${up.length && down.length ? '; e ' : ''}${down.length ? `${ITEMS[U.pick(down)].name} está sobrando, compre barato` : ''}.`;
    }
    if (SOC_FIGHT.includes(p.rank)) {
      const c = World.camps.filter(x => !x.cleared && !x.hidden).sort((a, b) => U.dist(a.x, a.y, P.x / TILE, P.y / TILE) - U.dist(b.x, b.y, P.x / TILE, P.y / TILE))[0];
      if (c) return `Tem um acampamento de bandidos a ${MapView.distText(c.x, c.y)} daqui, para o ${this.compass(c.x - P.x / TILE, c.y - P.y / TILE)}. Leve gente e comida: quem limpa aquilo ganha fama.`;
    }
    if (p.rank === 'priest' || p.rank === 'healer') return P.hp < P.maxHp ? 'Você está ferid' + (P.sex === 'f' ? 'a' : 'o') + '. Coma algo quente e durma numa cama: o corpo cura mais rápido do que a gente pensa.' : 'Cuide da alma também: visite a capela, ajude quem precisa. As vilas lembram de quem é bom.';
    const best = World.villages.map((v, vi) => ({ v, vi })).filter(x => !x.v.ruin).sort((a, b) => (b.v.level || 1) - (a.v.level || 1) || (b.v.prosper || 0) - (a.v.prosper || 0))[0];
    return U.pick([best ? `Dizem que ${best.v.name} é a vila que mais cresce. Bom lugar para abrir um negócio.` : 'Trabalhe duro e guarde um pouco todo mês.',
      'Não brigue com as famílias grandes: elas têm memória longa.', 'Quem empresta a juros justos faz amigos; quem cobra demais faz inimigos.', 'No inverno a comida encarece. Guarde trigo no outono.']);
  },
  compass(dx, dy) { const a = Math.atan2(dy, dx) * 180 / Math.PI; return ['leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste', 'norte', 'nordeste'][(Math.round(a / 45) + 8) % 8]; },
  // histórias dos mais velhos: os pais que se foram, as notícias da vida e a sabedoria do tempo
  story(p) {
    const dead = (p.parents || []).map(id => G.people[id]).filter(q => q && !q.alive), ns = News.of(p);
    const opts = [`Quando eu era jovem, ${People.homeName(p)} era só meia dúzia de casas. Hoje veja só!`, 'Já vi três reis subirem ao trono. Todos prometeram paz... nenhum cumpriu.',
      'No inverno em que o rio congelou, comemos raiz por dois meses. Nunca desperdice comida.'];
    if (dead.length) opts.push(`${dead[0].sex === 'f' ? 'Minha mãe' : 'Meu pai'}, ${dead[0].name}, ${dead[0].sex === 'f' ? 'era' : 'era'} ${(People.title(dead[0]) || 'gente simples').toLowerCase()}. Me ensinou tudo o que sei.`);
    if (ns.length) opts.push(`Lembra disso? ${ns[ns.length - 1].text.replace(/^\S+\s/, '')} Parece que foi ontem.`);
    if (p.widow) opts.push(`${p.widow.name}... vivemos muitos anos juntos. Ainda falo com ${p.widow.sex === 'f' ? 'ela' : 'ele'} antes de dormir.`);
    return U.pick(opts);
  },
  forgive(p) {
    const d = p.debt; if (!d || d.lender !== 'player') return;
    Dialog.confirm({ icon: '🤲', title: 'Perdoar a dívida', text: `Perdoar os ${d.total} 🪙 que ${People.full(p)} deve a você? Ela vai lembrar disso para sempre.`, ok: 'Perdoar' }, () => {
      p.debt = null; People.addAff(p, 30); Mind.remember(p, 'gold'); Mind.feel(p, 'joy', 80); this.mark(p);
      News.add('life', `🤲 ${G.name} ${G.surname} perdoou a dívida de ${People.full(p)}, de ${People.homeName(p)}.`, { pid: p.id });
      UI.showTalk(p.id, { text: 'Você... perdoou tudo? Que Deus lhe pague, porque eu nunca vou conseguir. Pode contar comigo para o que precisar.', note: `Dívida de ${d.total} 🪙 perdoada · +30 de amizade.` });
    });
  },
  mark(p) { News.mark(p, '💚', 2); },

  // ------------------------------------------------------------ a ficha
  link(q, extra) {
    if (!q) return '';
    const t = `${UI.esc(q.name)}${extra ? ` <small>${extra}</small>` : ''}`;
    return q.alive ? `<button class="pf-p" data-act="tk" data-op="open" data-id="${q.id}">${t}</button>` : `<span class="pf-p dead">✝ ${t}</span>`;
  },
  marital(p) {
    const o = this.o(p);
    if (p.spouse === 'player') return `💍 Casad${o} com você`;
    if (p.engaged) return `💍 Noiv${o} de você`;
    if (p.dating) return `💕 Namorando você`;
    if (p.spouse !== null && G.people[p.spouse]) return `💍 Casad${o} com ${this.link(G.people[p.spouse])}`;
    if (p.widow) return `🖤 Viúv${o} de ${UI.esc(p.widow.name)}`;
    if (p.age < 16) return 'Criança';
    return p.known && p.known.crush && p.crush !== undefined && G.people[p.crush] && G.people[p.crush].alive ? `💭 Solteir${o} · de olho em ${this.link(G.people[p.crush])}` : `Solteir${o}`;
  },
  wealthTxt(p) {
    const w = People.purse(p), lvl = w >= 1200 ? '💰💰💰 Muito rico' : w >= 600 ? '💰💰 Rico' : w >= 250 ? '💰 Remediado' : w >= 80 ? 'Modesto' : 'Pobre';
    const known = (p.known && p.known.wealth) || p.aff >= 60 || p.kin;
    return known ? `${lvl} · ${w} 🪙` : `${lvl.replace(/💰/g, '').trim() === 'Pobre' ? 'Parece pobre' : 'Parece ' + lvl.replace(/💰/g, '').trim().toLowerCase()} <small class="muted">· 🔒 valor exato: pague uma bebida</small>`;
  },
  row(label, val) { return val ? `<div class="pf-r"><span>${label}</span><b>${val}</b></div>` : ''; },
  html(p) {
    Ranking.stats(p);
    const o = this.o(p), fam = Families.of(p), kids = (p.children || []).map(id => G.people[id]).filter(Boolean), pars = (p.parents || []).map(id => G.people[id]).filter(Boolean);
    const sibs = G.people.filter(q => q !== p && q.parents && p.parents && p.parents.length && q.parents.some(x => p.parents.includes(x)));
    const shop = p.shop && Shops.byKey(p.shop), sdef = shop && (BUILDINGS[shop.type] || (typeof CIV_STRUCTS !== 'undefined' && CIV_STRUCTS[shop.type]));
    const master = p.career && G.people[p.career.master];
    const fav = p.fav && ITEMS[p.fav], favKnown = (p.known && p.known.fav) || p.aff >= 35 || p.kin;
    const mo = Mind.main(p), mem = (p.mem || []).slice().reverse();
    const MEMT = { gift: '🎁 o seu presente', gold: '💰 a sua ajuda em ouro', insult: '💢 a sua ofensa', robbed: '🦹 o roubo na loja', attacked: '⚔️ o seu ataque', funeral: '🕯️ você no enterro', hired: '💼 o emprego que você deu', fired: '😞 a demissão', loan: '🤝 o empréstimo', rent: '🏠 a casa alugada', evicted: '🚪 o despejo', midwife: '👶 o parto' };
    const card = (ic, title, body) => body.trim() ? `<div class="pf-c"><div class="sec">${ic} ${title}</div>${body}</div>` : '';
    const famCard = this.row('Estado civil', this.marital(p))
      + this.row(kids.length === 1 ? 'Filho(a)' : 'Filhos', kids.length ? kids.map(k => this.link(k, k.alive ? k.age + ' anos' : '')).join(' ') : (p.age >= 18 ? 'nenhum' : ''))
      + this.row('Pais', pars.map(q => this.link(q)).join(' '))
      + this.row(sibs.length === 1 ? 'Irmão(ã)' : 'Irmãos', sibs.map(q => this.link(q)).join(' '))
      + this.row('Casa', fam ? `<button class="pf-p" data-act="famview" data-f="${p.fam}">🏛️ ${UI.esc(Families.name(fam))}</button>${Families.isChief(p) ? ' <small>chefe da casa</small>' : ''}` : '')
      + this.row('Nasceu', p.maiden && p.maiden !== p.surname ? `família ${UI.esc(p.maiden)}` : '');
    const workCard = this.row('Ofício', `${UI.esc(People.title(p))}${p.gentry ? ` · ${p.sex === 'f' ? 'Dona' : 'Dom'} ⚜️` : ''}`)
      + this.row('Loja', shop ? `🏪 ${UI.esc(sdef ? sdef.name : 'loja própria')} em ${UI.esc(People.homeName(p))}` : '')
      + this.row('Trabalha', p.job !== undefined && p.job !== null && World.structs[p.job] ? `💼 no seu ${UI.esc(BUILDINGS[World.structs[p.job].type].name)}` : '')
      + this.row('Carreira', p.career ? `🎓 ${CAREER_LVL[p.career.lvl]} de ${UI.esc(Careers.tradeName(p.career.trade, 'm').toLowerCase())}${master && master !== p ? ` · mestre: ${this.link(master)}` : ''}` : '')
      + this.row('Riqueza', p.age >= 16 ? this.wealthTxt(p) : '')
      + this.row('Moradia', p.home.type === 'village' && p.age >= 16 ? `🏠 ${Homes.status(p)} · ${UI.esc(People.homeName(p))}` : `🏠 ${UI.esc(People.homeName(p))}`)
      + this.row('Cavalo', p.horse ? '🐎 tem cavalo próprio' : '')
      + this.row('Dívida', p.debt ? `🧾 deve ${p.debt.total} 🪙${p.debt.lender === 'player' ? ' a você' : ''}` : '')
      + this.row('Fama', p.fame ? `⭐ ${p.fame}${p.hero || p.legend ? ' · herói' + (p.sex === 'f' ? 'na' : '') + ' do reino' : ''}` : '');
    const meCard = this.row('Personalidade', `🎭 ${(TRAITS[p.trait] || {}).name || '—'}`)
      + this.row('Humor', mo ? `${MOODS[mo].icon} ${MOODS[mo].name}` : '🙂 tranquil' + o)
      + this.row('Gosta de', fav ? (favKnown ? `${UI.ii(p.fav)} ${fav.name}` : '🔒 <small class="muted">amizade 35+ ou uma bebida</small>') : '')
      + this.row('Sonho', p.age >= 10 ? (p.dream && p.age < 30 ? `💭 ser ${Careers.dreamName(p)}` : (p.known && p.known.dream) ? `💭 <i>“${this.wish(p)}”</i>` : '🔒 <small class="muted">pague uma bebida</small>') : '')
      + this.row('Força', p.str ? `💪 ${p.str}` : '') + this.row('Inteligência', p.int ? `🧠 ${p.int}` : '');
    const usCard = this.row('Relação', `${People.relation(p).text} · amizade ${Math.round(p.aff)}${p.rom > 0 ? ` · romance ${Math.round(p.rom)}` : ''}`)
      + this.row('Conversas', `${this.S(p).n || 0}`)
      + (mem.length ? `<div class="pf-mem">${mem.map(m => `<span class="${MEM_GOOD[m.k] ? 'ok' : 'bad'}">${MEMT[m.k] || m.k} <small>${Calendar.short(m.day)}</small></span>`).join('')}</div>` : '<p class="muted pf-none">Ainda não há nada entre vocês que fique na memória.</p>');
    const ns = News.of(p);
    return `<div class="pf">${card('💞', 'Família', famCard)}${card('⚒️', 'Trabalho e bens', workCard)}${card('🎭', 'Jeito de ser', meCard)}${card('🤝', 'Vocês dois', usCard)}
      ${ns.length ? card('📰', 'Notícias da vida', ns.map(n => `<div class="tk2-ln"><span class="dy-date">${Calendar.short(n.day)}</span><span>${UI.esc(n.text)}</span></div>`).join('')) : ''}</div>`;
  },
};

{
  // novas ações na conversa
  const ac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) { ac0(p, acts); Social.acts(p, acts); };
  const ta0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    const p = People.get(+d.id);
    if (p && d.op !== 'open') { Social.S(p).n = (Social.S(p).n || 0) + 1; this.sel.tktab = 'talk'; }
    if (p && d.op === 'open' && this.sel.tkfor !== p.id) { this.sel.tktab = 'talk'; this.sel.tkfor = p.id; }
    if (p && d.op === 'forgive') { Social.forgive(p); return; }
    if (p && SOC_OPS.includes(d.op)) { const r = Social.act(p, d.op); this.showTalk(p.id, r); return; }
    return ta0(d);
  };
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'tktab') { this.sel.tktab = d.k; this.refresh(); return; } return act0(a, d); };
  // as abas Conversa e Ficha no lado direito da conversa
  const tk0 = UI.showTalk.bind(UI);
  UI.showTalk = function (id, res) {
    const r = tk0(id, res);
    const p = People.get(id), right = this.panel && this.panel.querySelector('.tk2-r');
    if (!p || !p.alive || !right || !this.cur || this.cur.fn !== 'showTalk') return r;
    if (this.sel.tkfor !== p.id) { this.sel.tkfor = p.id; this.sel.tktab = 'talk'; }
    const tab = this.sel.tktab === 'ficha' ? 'ficha' : 'talk';
    right.insertAdjacentHTML('afterbegin', `<div class="tabs pf-tabs"><button class="tab ${tab === 'talk' ? 'on' : ''}" data-act="tktab" data-k="talk">💬 Conversa</button><button class="tab ${tab === 'ficha' ? 'on' : ''}" data-act="tktab" data-k="ficha">📋 Ficha de ${this.esc(p.name)}</button></div>`);
    if (tab === 'ficha') { right.classList.add('show-pf'); right.insertAdjacentHTML('beforeend', Social.html(p)); }
    // o estado civil também aparece logo abaixo do nome
    const who = this.panel.querySelector('.tk2-who');
    if (who && p.age >= 16) who.insertAdjacentHTML('beforeend', `<small class="pf-civil">${Social.marital(p).replace(/<button[^>]*>|<\/button>/g, '')}</small>`);
    return r;
  };
  // viúvos: quando o cônjuge morre, a pessoa guarda o nome dele
  const die0 = People.die;
  People.die = function (p, cause) {
    const sp = p && p.spouse !== null && p.spouse !== 'player' ? G.people[p.spouse] : null, nm = p ? People.full(p) : '', sx = p ? p.sex : 'm';
    const r = die0.call(People, p, cause);
    if (sp && sp.alive && sp.spouse === null) sp.widow = { name: nm, day: G.day, sex: sx };
    return r;
  };
  const m0 = People.marry;
  People.marry = function (a, b) { m0.call(People, a, b); if (a) a.widow = null; if (b) b.widow = null; };
}

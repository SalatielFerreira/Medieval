'use strict';
// Vida dos moradores à vista. Tudo o que acontece com as pessoas, as famílias, as vilas e os reinos vira notícia no
// Pregoeiro (Diário → Notícias), que todo mês anuncia a manchete. No mundo, os moradores mostram um balão com o que
// estão vivendo (luto, bebê, casamento, promoção...) e às vezes falam sozinhos quando você passa perto. E eles sobem na
// vida: o mestre junta dinheiro e abre um negócio com a família, o soldado valente é armado cavaleiro e o comerciante
// rico compra um título de nobreza.

const NEWS_CATS = [['all', '📰', 'Tudo'], ['life', '💞', 'Gente'], ['biz', '💰', 'Negócios'], ['fam', '🏛️', 'Famílias'], ['vil', '🏘️', 'Vilas'], ['realm', '👑', 'Reinos']];
const NEWS_MAX = 160;
const News = {
  L() { const u = G.urban || (G.urban = {}); return u.news || (u.news = []); },
  skip: false,
  // w: peso da notícia (a de maior peso do mês vira a manchete do Pregoeiro)
  add(cat, text, o) {
    if (this.skip) return;
    o = o || {};
    const L = this.L();
    if (L.some(n => n.text === text && G.day - n.day < 3)) return;
    L.unshift({ day: G.day, cat, text, pid: o.pid !== undefined ? o.pid : null, w: o.w || 1 });
    if (L.length > NEWS_MAX) L.length = NEWS_MAX;
  },
  // a crônica dos reinos já existia: cada linha dela também vira notícia, na seção certa
  catOf(text) {
    if (/^🏗️|^📣|^💰|^📈|^📉|^☀️|^🎪/.test(text)) return 'biz';
    if (/^🏘️|^🏴|^🗺️/.test(text) || /foi anexada/.test(text)) return 'vil';
    if (/família|Família| Casa /.test(text)) return 'fam';
    return 'realm';
  },
  // marca o que a pessoa está vivendo (aparece no balão sobre a cabeça por alguns meses)
  mark(p, icon, months) { if (p && p.alive) { p.ev = { icon, until: G.day + (months || 2) }; } },
  fame(p, n) { if (p) p.fame = (p.fame || 0) + n; },
  // ------------------------------------------------------------ todo mês
  monthTick() {
    this.rise();
    // vilas que perderam movimento (as que crescem já viram notícia pela crônica)
    World.villages.forEach((v, vi) => {
      const lv = v.level || 1;
      if (v._nl !== undefined && lv < v._nl) this.add('vil', `📉 ${v.name} perdeu movimento e caiu para o nível ${lv}.`);
      v._nl = lv;
    });
    // o Pregoeiro anuncia a manchete do mês
    const now = this.L().filter(n => n.day === G.day);
    if (now.length) {
      const top = now.slice().sort((a, b) => b.w - a.w)[0];
      UI.msg(`📰 O Pregoeiro: ${top.text}${now.length > 1 ? ` (mais ${now.length - 1} ${now.length === 2 ? 'notícia' : 'notícias'} no Diário → Notícias)` : ''}`, '', true);
    }
  },
  // subir (e cair) na vida — no máximo um caso de cada tipo por mês, para cada notícia valer
  rise() {
    const ppl = G.people.filter(p => p.alive && !p.kin && !p.capanga && p.spouse !== 'player' && p.age >= 18);
    // 1) mestre de ofício junta dinheiro e abre um negócio com a família
    const masters = ppl.filter(p => p.career && p.career.lvl >= 1 && !p.shop && People.purse(p) >= 200 && !p._opened);
    const m = U.pick(masters);
    if (m && Math.random() < 0.35) {
      const f = Families.of(m);
      if (f && !f.player && !f.noble && World.villages[f.seat] && f.biz.length < 3) {
        const n = f.biz.length;
        m.purse -= 200; f.wealth += 260;
        this.skip = true; try { Families.buildBiz(f); } finally { this.skip = false; }
        if (f.biz.length > n) {
          const b = f.biz[f.biz.length - 1], d = FAMILY_BIZ[b.type];
          m._opened = true; this.fame(m, 2); this.mark(m, '🏪', 3); Mind.feel(m, 'joy', 60);
          this.add('biz', `🏪 ${People.full(m)}, ${m.career.lvl === 2 ? 'mestre' : m.sex === 'f' ? 'oficiala' : 'oficial'} ${Careers.tradeName(m.career.trade, m.sex).toLowerCase()}, juntou as economias e abriu ${d.name === 'Quinta' ? 'uma' : 'um'} ${d.name} com a ${Families.name(f)} em ${World.villages[f.seat].name}.`, { pid: m.id, w: 3 });
        } else { m.purse += 200; f.wealth -= 260; }
      }
    }
    // 2) o soldado mais valente do reino é armado cavaleiro pelo soberano
    const sold = ppl.filter(p => (p.rank === 'soldier' || p.rank === 'mercenary') && p.age <= 45 && p.civ >= 0 && G.civs[p.civ] && G.civs[p.civ].ruler !== 'player' && !p.post);
    for (const p of sold) Ranking.stats(p);
    const k = sold.filter(p => (p.str || 0) >= 62).sort((a, b) => (b.str || 0) - (a.str || 0))[0];
    if (k && Math.random() < 0.15) {
      k.rank = 'knight'; this.fame(k, 2); this.mark(k, '🛡️', 3); Mind.feel(k, 'joy', 70);
      this.add('life', `🛡️ ${People.full(k)} foi armad${k.sex === 'f' ? 'a dama cavaleira' : 'o cavaleiro'} por ${G.civs[k.civ].rulerName || 'o soberano'} de ${Diplo.name(k.civ)}, pela coragem nas armas.`, { pid: k.id, w: 3 });
    }
    // 3) comerciante rico e conhecido compra um título de nobreza
    const rich = ppl.filter(p => People.PURSE[p.rank] && !p.gentry && p.age >= 35 && People.purse(p) >= 880);
    const r = U.pick(rich);
    if (r && Math.random() < 0.05) {
      r.purse -= 400; r.gentry = true; this.fame(r, 2); this.mark(r, '⚜️', 4); Mind.feel(r, 'joy', 70);
      this.add('life', `⚜️ ${r.name} ${r.surname}, ${People.title(r).toLowerCase()} de ${People.homeName(r)}, enriqueceu tanto que comprou um título: agora é ${r.sex === 'f' ? 'Dona' : 'Dom'} ${r.name}.`, { pid: r.id, w: 3 });
    }
    // 4) e quem cai: a loja que quase não vende
    const poor = ppl.filter(p => People.PURSE[p.rank] && p.shop && People.purse(p) < 40 && !p._broke);
    for (const p of ppl) if (p._broke && People.purse(p) > 150) p._broke = 0;
    const b = U.pick(poor);
    if (b) { b._broke = G.day; this.mark(b, '💸', 3); Mind.feel(b, 'sad', 50); this.add('biz', `💸 ${People.full(b)}, de ${People.homeName(b)}, está em apuros: a loja quase não vende e a bolsa está vazia.`, { pid: b.id }); }
  },
  // ------------------------------------------------------------ balões no mundo
  status(p) {
    if (p.jail > G.day) return '⛓️';
    if (p.ev && p.ev.until >= G.day) return p.ev.icon;
    if (p.mourn > G.day) return '🖤';
    if (p.preg) return '🤰';
    if (p.debt) return '💸';
    const mo = Mind.main(p);
    return mo === 'anger' ? '😠' : mo === 'sad' ? '😢' : mo === 'envy' ? '😒' : mo === 'joy' ? '😊' : null;
  },
  bubble(e, ctx, cx, cy) {
    const p = e.npc;
    if (!p || !p.alive || e.kind !== 'villager' || e.sleeping || e.inRoom || typeof P === 'undefined') return;
    const d = U.dist(e.x, e.y, P.x, P.y); if (d > 11 * TILE) return;
    const x = Math.round(e.x - cx), y = Math.round(e.y - cy) - (p.horse && !G.place ? 62 : 46), t = performance.now() / 1000;
    // (os moradores não falam sozinhos em balões: só o ícone do humor ou da novidade aparece)
    const ic = this.status(p); if (!ic) return;
    const bob = Math.sin(t * 2.4 + p.id) * 1.5;
    ctx.fillStyle = 'rgba(255,248,232,0.9)'; ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y - 9 + bob, 10.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 2, y + bob); ctx.lineTo(x + 2, y + bob); ctx.lineTo(x, y + 4 + bob); ctx.closePath(); ctx.fill();
    ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ic, x, y - 4.5 + bob); ctx.textAlign = 'left';
  },
  // ------------------------------------------------------------ a página do Pregoeiro (Diário → Notícias)
  famous() {
    return G.people.filter(p => p.alive && !p.kin && (p.fame || 0) > 0).sort((a, b) => (b.fame || 0) - (a.fame || 0) || People.purse(b) - People.purse(a)).slice(0, 6);
  },
  page() {
    const cat = NEWS_CATS.some(c => c[0] === UI.sel.ncat) ? UI.sel.ncat : 'all';
    const all = this.L(), list = cat === 'all' ? all : all.filter(n => n.cat === cat);
    const icon = c => (NEWS_CATS.find(x => x[0] === c) || NEWS_CATS[0])[1];
    const recent = all.filter(n => G.day - n.day <= 1);
    const top = (recent.length ? recent : all).slice().sort((a, b) => b.w - a.w || b.day - a.day)[0];
    const talk = id => id !== null && G.people[id] && G.people[id].alive ? ` data-act="tk" data-op="open" data-id="${id}"` : '';
    const rows = []; let last = null;
    const small = document.body.classList.contains('small');
    for (const n of list.slice(0, small ? 40 : 80)) {
      if (n.day !== last) { rows.push(`<div class="nw-mh">${Calendar.short(n.day)}</div>`); last = n.day; }
      const m = n.text.match(/^(\S+)\s+(.*)$/s), lead = m && !/[A-Za-zÀ-ú0-9]/.test(m[1]) ? m : null;
      rows.push(`<div class="nw-item ${talk(n.pid) ? 'link' : ''}" data-cat="${n.cat}"${talk(n.pid)}><span class="nw-ic">${lead ? lead[1] : icon(n.cat)}</span><span>${UI.esc(lead ? lead[2] : n.text)}</span></div>`);
    }
    const fam = this.famous().slice(0, small ? 4 : 6);
    return UI.pageHead('📰', 'O Pregoeiro', `${all.length} notícias · a gente, os negócios, as famílias, as vilas e os reinos`)
      + `<div class="tabs nw-cats">${NEWS_CATS.map(([k, ic, lab]) => { const n = k === 'all' ? all.length : all.filter(x => x.cat === k).length;
        return `<button class="nw-cat ${k === cat ? 'on' : ''}" data-act="ncat" data-k="${k}">${ic} ${lab} <small>${n}</small></button>`; }).join('')}</div>`
      + (top ? `<div class="card nw-top"${talk(top.pid)}><span class="nw-kick">📯 ${top.day === G.day ? 'Manchete do mês' : 'Última manchete'} · ${Calendar.short(top.day)}</span><b>${UI.esc(top.text)}</b></div>` : '')
      + `<div class="card nw-fame"><div class="sec">⭐ Gente em destaque</div>${fam.length ? fam.map((p, i) => `<div class="rk-row"${talk(p.id)}><span class="rk-m">${['🥇', '🥈', '🥉'][i] || '⭐'}</span>
          <span class="rk-n"><b>${UI.esc(People.full(p))}</b><small>${UI.esc(People.title(p))} · ${UI.esc(People.homeName(p))}</small></span><span class="rk-v">⭐ ${p.fame}</span></div>`).join('')
          : '<p class="muted">Ninguém se destacou ainda. Quem prospera, vira mestre, abre negócio ou é armado cavaleiro ganha fama.</p>'}
          <p class="dt-desc nw-tip">Os moradores sobem na vida: o mestre junta dinheiro e abre um negócio com a família, o soldado valente vira cavaleiro e o comerciante rico compra um título. Clique numa pessoa para conversar.</p></div>`
      + `<div class="card nw-feed"><div class="sec">${(NEWS_CATS.find(c => c[0] === cat) || NEWS_CATS[0])[1]} Notícias <span>${list.length}</span></div>${rows.length ? `<div class="nw-list">${rows.join('')}</div>`
        : '<div class="dy-empty"><span>📰</span><b>Nada por aqui ainda</b><small>Casamentos, nascimentos, promoções, negócios novos, brigas de famílias e guerras aparecem aqui todo mês.</small></div>'}</div>`;
  },
  // notícias de uma pessoa (na conversa com ela)
  of(p) { return this.L().filter(n => n.pid === p.id).slice(0, 4); },
};

{
  // tudo o que a crônica dos reinos e os boatos já contavam vira notícia
  const ch0 = Diplo.chronicle.bind(Diplo);
  Diplo.chronicle = function (text, important) { ch0(text, important); News.add(News.catOf(text), text, { w: important ? 2 : 1 }); };
  const ra0 = Rumors.add.bind(Rumors);
  Rumors.add = function (text, x, y, o) {
    ra0(text, x, y, o);
    if (/Dizem que/.test(text)) News.add('life', '🗣️ ' + text);
    else News.add(/herança/.test(text) ? 'fam' : 'life', (/casaram/.test(text) ? '💒 ' : /Nasc/.test(text) ? '👶 ' : /bebê/.test(text) ? '🤰 ' : /aposentou/.test(text) ? '🪑 ' : /herança/.test(text) ? '⚖️ ' : '💬 ') + text);
  };
  // casamento, nascimento, mestre de ofício, cavalo novo e morte marcam a pessoa (e os importantes viram notícia)
  const m0 = People.marry;
  People.marry = function (a, b) { m0.call(People, a, b); News.mark(a, '💍', 3); News.mark(b, '💍', 3); };
  const dl0 = Birth.deliver.bind(Birth);
  Birth.deliver = function (m) { const f = m && m.spouse !== null && G.people[m.spouse]; const r = dl0(m); News.mark(m, '👶', 3); if (f) News.mark(f, '👶', 3); return r; };
  const cm0 = Careers.monthTick.bind(Careers);
  Careers.monthTick = function () {
    const lv = new Map(); for (const p of G.people) if (p.alive && p.career) lv.set(p, p.career.lvl);
    const r = cm0();
    for (const p of G.people) {
      if (!p.alive || !p.career) continue;
      const was = lv.has(p) ? lv.get(p) : null;
      if (was === null && p.career.lvl === 0) News.mark(p, '🎓', 2);
      if (was !== null && p.career.lvl > was) {
        News.mark(p, p.career.lvl === 2 ? '🏅' : '🎓', 3);
        if (p.career.lvl === 2) { News.fame(p, 1); News.add('life', `🏅 ${People.full(p)}, de ${People.homeName(p)}, agora é mestre ${Careers.tradeName(p.career.trade, p.sex).toLowerCase()}.`, { pid: p.id }); }
      }
    }
    return r;
  };
  const pt0 = People.purseTick.bind(People);
  People.purseTick = function () {
    const had = new Set(G.people.filter(p => p.horse).map(p => p.id)); const r = pt0();
    for (const p of G.people) if (p.horse && p.alive && !had.has(p.id)) { News.mark(p, '🐎', 2); if (!['ruler', 'consort', 'heir', 'knight'].includes(p.rank)) News.add('biz', `🐎 ${People.full(p)}, de ${People.homeName(p)}, prosperou e comprou um cavalo.`, { pid: p.id }); }
    return r;
  };
  const die0 = People.die;
  People.die = function (p, cause) {
    const known = p && p.alive && p.age >= 16 && !p.kin && ((p.fame || 0) > 0 || p.shop || p.gentry || !['peasant', 'child', 'beggar', 'wanderer', 'soldier', 'mercenary'].includes(p.rank));
    const line = known ? `⚰️ ${People.full(p)}, ${People.title(p).toLowerCase()} de ${People.homeName(p)}, faleceu aos ${p.age} anos.` : null;
    const r = die0.call(People, p, cause);
    if (line) News.add('life', line, { pid: null, w: (p.fame || 0) > 1 || ['ruler', 'consort', 'heir'].includes(p.rank) ? 2 : 1 });
    return r;
  };
  // quem comprou o título é chamado de Dom ou Dona
  const full0 = People.full.bind(People);
  People.full = function (p) { return p && p.gentry ? `${p.sex === 'f' ? 'Dona' : 'Dom'} ${full0(p)}` : full0(p); };
  // o mês: depois de tudo andar, a subida na vida e a manchete
  const et0 = Game.econTick.bind(Game);
  Game.econTick = function (...a) { const r = et0(...a); News.monthTick(); return r; };
  // balões sobre a cabeça dos moradores
  const dr0 = Creature.prototype.draw;
  Creature.prototype.draw = function (ctx, cx, cy) { dr0.call(this, ctx, cx, cy); if (this.npc) News.bubble(this, ctx, cx, cy); };
  // filtro das notícias
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'ncat') { this.sel.ncat = d.k; this.showDiary(); return; } return act0(a, d); };
}

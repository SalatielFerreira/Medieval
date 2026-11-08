# MEDIEVAL — guia de desenvolvimento

Este guia é para quem mexe no código. O **LEIAME.md** é o guia do jogador.

## Como o jogo é feito

- **HTML, CSS e JavaScript puros**, sem etapa de compilação: o que está no repositório é o que roda no navegador.
- **Publicação:** o GitHub Pages publica o ramo `main` a cada envio (`.github/workflows/pages.yml`). Antes de publicar, o
  GitHub roda `node scripts/check.js`; se houver erro de sintaxe ou a lista de carregamento estiver errada, **nada é
  publicado** e o jogo que está no ar continua funcionando.
- **Atualização dos jogadores:** cada commit grava uma versão nova em `version.json` (pelo gancho do Git). O `index.html`
  carrega os scripts com `?v=versão`, e o menu do jogo oferece o botão "Atualizar" quando há versão nova.
- **Offline e instalação:** `sw.js` (service worker) e `manifest.webmanifest` deixam instalar o jogo como app e jogar sem
  internet (sempre tenta a rede primeiro).
- **Desenho:** tudo é desenhado no `<canvas>` por código (personagens, animais, construções, ícones), sem imagens.
  As janelas são HTML por cima do canvas (`js/ui.js` e `css/style.css`).

## Primeiros passos numa máquina nova

```sh
git clone <repositório> && cd MEDIEVAL
node scripts/install-hooks.js   # uma vez: gancho que grava version.json a cada commit
npm install                     # só para os testes (instala o puppeteer-core)
npm run serve                   # joga em http://localhost:8080
npm test                        # verificação + testes no Chrome sem janela
```

O jogo em si não precisa de `npm install`: basta abrir pelo servidor local (abrir o `index.html` direto do disco não
funciona por causa do service worker e dos caminhos).

## Ordem de carregamento

Os scripts são carregados **em ordem**, um depois do outro, pela lista `FILES` do `index.html`. Cada arquivo cria
objetos globais (`World`, `Game`, `UI`, `People`...) que os seguintes usam. Regras:

1. Um arquivo novo precisa entrar na lista `FILES` — o `scripts/check.js` avisa se esquecer.
2. Quem **usa** um objeto na hora de carregar (por exemplo, para envolver uma função) precisa vir **depois** de quem o
   cria. Os módulos de expansão (`workplaces` em diante) ficam no fim por isso.
3. Funções chamadas só durante o jogo podem usar objetos de arquivos carregados depois.

## Como os módulos novos se encaixam

Os sistemas mais novos ficam em arquivos próprios e **envolvem** funções existentes em vez de reescrevê-las:

```js
const original = Biz.dayTick.bind(Biz);
Biz.dayTick = function (...a) {
  const r = original(...a);   // o que já existia continua acontecendo
  Rivalry.monthTick();        // e o módulo novo acrescenta o dele
  return r;
};
```

Assim cada sistema fica num lugar só e dá para tirar um módulo da lista sem quebrar os outros. Ao envolver, sempre
chame a função original e devolva o resultado dela.

## Jogo salvo

- `Game.snapshot()` (em `js/game.js`) monta o objeto salvo e `Game.load()` o restaura. Os campos salvos são listados
  um a um.
- **Dados novos de módulos de expansão** ficam dentro de `G.urban` (que já é salvo), cada módulo na sua chave:
  `G.urban.fin` (finanças), `G.urban.arsenal`, `G.urban.gates`, `G.urban.news` (notícias)... Assim não é preciso mexer no `snapshot`.
- As pessoas vivas são salvas por inteiro (`G.people`): campos novos numa pessoa (`p.debt`, `p.fame`...) já vão junto.
- Construções do jogador são salvas pela posição; obras de vila feitas pelo governador e pelo rei ficam em
  `Urban.E()` (adicionadas, removidas, mudadas de lugar) e são refeitas ao carregar.
- **Um dia do calendário é um mês da economia** (`ECON_DAYS = 1`): prazos em "meses" somam `G.day`.

## Mapa dos arquivos (pasta `js/`)

| Área | Arquivos |
|---|---|
| Base | `util` (aleatoriedade, matemática), `data` (itens, receitas, construções, criaturas, reinos), `dialog` (janelas de confirmação) |
| Ícones | `icons`, `icons2` (itens), `bicons` (construções), `heraldry` (bandeiras e brasões) |
| Mundo | `world` (geração, colisão, terreno e construções), `biomes`, `dungeon` (cavernas), `features` (arcos, cavalo, peso, estações e clima), `ambience` (luzes e clima visual), `mapview` (mapa grande) |
| Pessoas | `people` (identidade, relações, conversa, lojas), `families` (casas, empreendimentos, vilas fundadas, reino fundado), `homes` (casas dos moradores), `lifesim` (gravidez, luto, herança, boatos, carreiras, dívidas, crime), `heroes` (heróis dos reinos), `progress` (estatísticas, conquistas, diário) |
| Personagens e animais | `entities` (movimento, IA, desenho de pessoas e animais), `beasts` (animais da fazenda e dragão), `combat2` (bloqueio, golpe forte, esquiva, ordens) |
| Reinos e política | `diplomacy` (relações, guerras, alianças), `court` (títulos, o conselho único de cada reino — `c.council`, quatro cadeiras —, rivalidades), `crown` (decretos sem os de nome igual às leis, ações do soberano com o Grande Torneio, sagrar cavaleiros, Grandes Obras), `royalcourt`, `statecraft` (mensageiro de paz, renúncia), `faith` (religião) |
| Guerra | `war` (campo de batalha), `siege` (cercos), `arsenal` (máquinas e equipamento da tropa), `arena` |
| Vilas e cidades | `life` (crescimento das vilas, caravanas, estradas dos moradores), `urban` (obras do governador e do rei, estradas), `villageworks` (obras das vilas), `gate` (portão, porteiro, muralhas), `defense` (ataques vindos de fora dos muros), `graves` (cemitérios) |
| Economia | `market` (preços), `farming` (lavoura e animais), `content`/`content2` (mais construções e empreendimentos), `workplaces` (interiores e responsáveis de todos os prédios), `economy` (poder econômico das vilas, itens e lojas próprias, administração da vila), `finance` (poupança, empréstimos, investimentos, lojas do jogador), `rivalry` (concorrência e destaques) |
| Expansão | `expansion` (itens, receitas, lojas, origens das matérias-primas, ferramentas, magia), `expbuild` (as construções novas e o que fazem), `expdraw` (desenho delas no mapa e ícones), `assault` (assalto e defesa de castelo, guarnição 30, 10 catapultas), `favorites` (pessoas favoritas com estrela), `religion` (religiões e culturas dos reinos), `commerce` (insumos, oferta e procura, encomendas, riscos, funcionários, guildas, feiras, leilões, sócios e o painel), `society` (rede de amizades, reputação por grupo, níveis de amizade, romance, eventos, segredos, honra, política local e visitas), `reign` (o reinado: dilemas do conselho do reino, audiências, feudos, a lista única de complôs `R.plots` e o julgamento, espionagem, herdeiros, não agressão e vassalagem, economia de Estado e a moeda, generais e o baile), `bank` (o banco de cada reino: conta, títulos, empréstimos, expedições, cofre, tesouro nacional, crise, falência e anarquia), `politics` (eleições das vilas com mandato de 5 meses, círculo do rei e suborno, golpes de estado), `integrity` (regras que nunca podem quebrar: um rei por reino, governador vivo, tesouro nunca negativo, todo reino com banco; caminhos pelas estradas; carregue-o depois de `perf`), `perf` (desempenho: a virada do mês roda em fatias durante o jogo, índices de famílias e moradores, minimapa refeito aos poucos, cores e rotas guardadas; carregue-o depois dos outros, antes de `order`), `personas` (personalidade dos reis da IA), `laws` (leis e tribunal), `mercs` (companhias de mercenários), `games` (Jogos dos Sete Reinos), `travel` (viajantes entre vilas e reinos), `book` (o livro da crônica da dinastia), `uiplus` (sino e central de avisos, ficha do item, lucro nas oficinas, rendimento das construções, conversa organizada, camadas do mapa, chance na guerra e o grupo Gestão do Portfólio; Negócios abre como página do Portfólio; o Reinado é de `reinado`), `order` (todas as listas do mais barato ao mais caro; carregue-o por último), `treasury` (`Treasury.month(c)`: o mês do tesouro de um reino com todas as entradas e saídas — a mesma conta no Resumo, nas Finanças, em `Bank.health` e na crise do banco) |
| Reino em ordem (outubro) | `townplan` (vilas em quarteirões: lotes alinhados, estrada em volta de cada imóvel, avenida e estrada de volta; reorganiza na primeira vez e põe no lote, todo mês, o que nasce fora do traçado), `nobility` (poderes de cada título no reino; renunciar a título e deixar o governo), `bank2` (Bolsa dos Reinos, Fundo das Guildas, renda vitalícia, seguro das expedições, títulos de 1 e 24 meses), `regalia` (peças de leilão com forma própria no herói e moldura na mochila) |
| Estações e tratados (outubro) | `clima` (o tempo de cada mês, reino por reino: preço da comida no inverno, na colheita e na seca, estradas lentas na neve, colheita no outono, chuva atrapalha quem ataca), `pacts` (os tratados do jogo: casamento entre dinastias — com direito ao trono em `Reign.R().claims` —, comércio, tributos e reféns; as linhas, casamentos e reféns da aba Diplomacia do Reinado), `lineage` (árvore da dinastia no livro e no Portfólio), `realmboard` (Painel do reino: histórico mensal de cada reino, gráficos e ameaças) |
| Inventário e construções (outubro) | `invplus` (efeito dos anéis, balão com o nome do item, limpeza de itens que saíram do jogo), `buildroles` (o que cada categoria de construção faz: produção só fabrica e mostra o que produz, fazenda com loja do responsável que anda livre, cultura e obras com interior/responsável/loja, Defesa nas Obras, infraestrutura retirada, Estrebaria com cavalos, muro emendado no portão) |
| Mar, profundezas e legado (outubro) | `fog` (neblina do mapa, tesouros e carta do reino), `depths` (andares das cavernas, guardiões, lendários), `cavalry` (galope e carga a cavalo; companheiros com lealdade, pedidos, partida e amor — `COMP`), `music` (temas por lugar), `legacy` (conquistas novas e placar da dinastia), `sea` (navios, porão e comércio por mar, viagens com tempestades e piratas, piratas em alto-mar) |
| Feras, ordens e fora da lei (outubro) | `wildbeasts` (feras errantes: `Beasts`, recompensas e troféus — atenção: `beasts.js` é outro arquivo, dos animais da fazenda), `orders` (ordens de cavalaria: `KOrders`), `lawsplus` (multas na rua, contrabando, mercado negro, espiões: `LawsPlus`), `outlaw` (vida de fora da lei: `OutLaw`), `horses` (raças, haras, cruzamento e Grande Prêmio: `Horses`) |
| Obras da IA (outubro) | `npcworks` (`NpcWorks`: os governadores e reis da IA erguem as Obras nas vilas — caixa de obras de cada vila em `G.urban.npcw`, gosto pelo ofício do governador, regras em `NW_SKIP`, `NW_REQ`, `NW_MINLVL`; a obra vai para um lote do `TownPlan` com `Urban.addCivic`) |
| Obras em qualquer lugar (outubro) | `obrasplus` (`ObrasPlus`: obra erguida fora de onde você governa fica sua — `s.mine`, sem `village`, renda no mês; `Urban.foreignRealm` barra só o território de outro reino) |
| Caminho do dinheiro (outubro) | `moneyflow` (`Money.toPerson/toVillage/toRealm/toFamily/toChurch` e `Money.wrap`, que manda para quem recebe o que uma função tirou da sua bolsa; caixa da vila em `NpcWorks.addFund/fundOf`) · classes de Produção, Fazenda e Empreendimentos em `BR_CLASSES` (`buildroles`) · uma música só (`music`: `Sound.TUNES.alegre`) |
| Prisão e Portfólio (outubro) | `prison` (a Prisão de cada castelo: interior com celas, pena decidida pelo rei, `Crime.prison`; criada no fim de `Game.newGame`/`load`), `portfolio` (`PF_GONE`: páginas que saíram do menu e para onde vão; `Portfolio.paginate`/`pageAdv` dividem em partes o que não cabe em Títulos e corte; `Portfolio.outlaw` junta Fora da lei e Mercenários em abas `UI.sel.olTab`; `bizboard` (`BizBoard`: Empreendimentos em abas `UI.sel.bzTab`, histórico de 12 meses em `s.earn.hist` = [entrou, salários, mês], gravado antes de `Biz.dayTick` zerar o mês)) |
| Haras e assassinos (outubro) | `horses` (cavalos, raças e corridas; a construção `haras` com `LAYOUTS.haras` e os móveis `hsbreed`/`hsrace`/`hsbook` que abrem `UI.showHaras`; `Horses.market()` no Estábulo), `hitmen` (`Hitmen`: os assassinos e caçadores de recompensa são pessoas de `G.people` com `p.hit = { kind, by, why }`; troca o `Game.spawn('bandit')` marcado por um morador), `bands` (`Bands`: todo `Game.spawn('bandit')` ganha uma pessoa do bando — `G.urban.bands`, `p.band`, rank `bandit`; recruta moradores pobres da região ou forasteiros; `Bands.rob` dá nome ao ladrão do caixa; acampamento calmo até ser atacado: `camp.angryT`), `services` (`OutLaw.page` e `Mercs.page` redesenhados), `realmview` (`Board.page` redesenhado: faixa, saúde do reino e abas `UI.sel.rvTab`), `secret` (`Secret`: Sociedades secretas — troca `KORDERS` pelas sete sociedades com as chaves de `Commerce.GUILDS`, graus em `KO_RANKS`, irmãos em `p.soc` ou pelo ofício, convites e segredos em `G.urban.secret`; proteção em `Crime.commit`/`Prison.sentence`, investimentos em `Biz.forecast`, exército em `War.armyOf`, votos em `Politics.likes`; `Services.subs`/`paginate` deixam as páginas cabendo na janela), `justice` (`Justice`: prisões com `JAIL_CELLS`×`JAIL_PER_CELL` em `G.urban.justice.jail`, presos com `p.jail`; reis da IA prendem e abrem vaga; procurados em `.wanted`; assaltos encomendados; ações na conversa `jb*`; prisão e procurados na aba Leis e justiça do Reinado, `Justice.page(cs)`), `portfolio2` (`NegBoard` troca `UIP._raw.board` — Negócios em páginas; `Houses` — Grandes Casas em páginas; `Lines` — Linhagens em páginas), `olympics` (`Games.page` em páginas: evento, provas, registros, medalhas e lendas; classificação ao vivo em `Games.S().live`; página Jogos na Arena), `mapplus` (`MapPlus`: ícones e categorias das construções no mapa — `MAP_CATS`, `MAP_ICON`; filtros em `UI.sel.mapOff`), `castleroads` (`CastleRoads`: estrada em volta dos prédios do castelo e a do porto, gravadas em `Urban.E().roads`; feitos em `G.urban.croads`), `diaryview` (`DiaryView`: as páginas do Diário com `Services.subs`; troca o conteúdo de `UI.showDiaryM`)) |
| Vida à vista | `chronicle` (o Pregoeiro: notícias do mês, balões sobre os moradores, subida na vida), `profile` (Ficha do morador na conversa e passatempos) |
| Reinado (novembro) | `reinado` (`Reinado`: a janela Reinado do Portfólio, `knav = 'x:reign'`; papéis em `UI.sel.rnRole` — `'k:<reino>'`, `'v:<vila>'` ou `'t'` —, abas do rei em `UI.sel.rnTab` (`RN_TABS`, geradores em `Reinado.T`), Títulos e corte em `UI.sel.crTab`; `Reinado.route()` leva os atalhos antigos ao lugar novo e `Reinado.go(onde, aba)` abre; carregue-o por último) |
| Interface e controles | `ui` (HUD e janelas), `windows` (cenas de abertura das janelas: tabela WIN_SCENES), `interior` (lugares fechados), `input` (gamepad e toque), `audio`, `menu` |
| Núcleo | `game` (estado, laço principal, salvar e carregar) — carregado quase por último |

## Desempenho: o que evita travadas

- **Chão aos poucos:** apagar `World.chunks` (estação, obras, estradas) não repinta mais a tela num quadro só. Cada pedaço
  pintado também fica em `World.chunkOld`; durante o desenho do jogo (`World.chunkLazy`), passado `CHUNK_BUDGET` ms no
  quadro, o pedaço antigo aparece e o novo fica para o quadro seguinte. `chunkOld` é esquecido ao trocar de mapa (caverna)
  ou ao entrar e sair de um cômodo. O mapa grande (`mapview`) sempre pinta na hora.
- **Desenhos das estações:** `World.makeSprites` guarda um conjunto por estação em `Perf.sprites`; `Perf.prepSeason`
  prepara a próxima com o jogo pausado ou uma janela aberta (`perf.js`).
- **Recorte dos prédios:** `RCache.anySeason` reaproveita o recorte de outra estação com 10 pontos de folga.
- **Cópia de segurança:** `Resume.write(true)` compacta com `LZ.compressAsync` (Web Worker); `Resume.write()` sem argumento
  (ao fechar ou trocar de aba) continua compactando na hora. `Resume.seq` impede que uma cópia antiga sobrescreva a nova.

## Ganhar e perder um trono

- **`Game.onGainRealm(ci)`** (em `game.js`) roda sempre que um reino passa a ser seu: é chamado por `Game.becomeRuler`
  (conquista, usurpação, reivindicação, fundação em `Realm.found`, herança por casamento, fim da regência). Tira o título
  de nobreza do próprio reino (`Court.holdings`, `syncPrincipal`), o procurado (`Crime.clear`), a corte de outro rei
  (`RoyalCourt.leave`), o governo de vila do reino (`Game.syncRealmVillages`), guerras, vassalagem, tratados e
  tributos e reféns (dos Tratados) entre dois reinos seus, e espiões e reivindicações do reino ganho.
- **`Game.onLoseRealm(ci)`** roda depois de `c.ruler` deixar de ser `'player'`, em todos os caminhos: `Game.rebellion`,
  `Bank.collapse`, revolta das famílias (`families.js`), cerco perdido (`siege.js`), rendição (`War.cede`),
  `Abdicate.go`, golpe (`politics.js`, via `Succession.seat`) e `Succession.seat` (sucessão e regência). Limpa decretos,
  inflação, `tradeBonus`, conselho (`c.council`, `p.council`), os complôs do reino (`R.plots` com aquele `ci`),
  `G.warCall`, vassalos, `G.mainRealm`, feudos e o dilema do Reinado; sem nenhum reino, zera complôs, generais, espiões e
  moeda do Reinado (a dívida é do banco do reino e fica com ele).
- Caminho novo de ganhar ou perder um trono: chame o gancho (perder: só se o reino era do jogador).
- Regras que valem a qualquer hora: `Crime.wanted` não vale no reino do jogador; `Court.titleLive(ci)` (sem título no
  próprio reino e vantagens suspensas com `Court.atOdds`, guerra com um reino seu) é usado por `Court.discount`,
  `Court.stipendTick` e `Nobility.power`; `Game.syncRealmVillages` também roda todo mês (vila que entra num reino seu).
- `Game.fixRealms()` acerta jogos salvos antigos no `Game.load` (idempotente).

## Um sistema de cada (fusão dos duplicados)

- **Conselho:** só o do Court (`Court.council(ci)`, cadeiras `COUNCIL`). `Reign.member(k, ci)` e `Reign.councilors(ci)` leem
  essas cadeiras; os dilemas (`Reign.DILEMMAS`, `who` = cadeira) vêm do conselho do reino principal; `spySkill(ci)` usa o
  espião-mor. Lealdade = `p.aff`; ambição = `p.amb` (criada em `Court.traits`).
- **Complôs:** uma lista, `Reign.R().plots` (`{ pid, kind, ci, ripe, found, seat?, fam? }`). O `Court.dayTick` cria os do
  conselho com `Reign.newPlot(..., { ci, seat })`; o `Reign.monthTick` descobre e faz atacar (`Court.strike` para quem tem
  `seat`); julgar é `Reign.resolvePlot` (Reinado → Conselho). `Court.plotsOf(ci)` só lê essa lista.
- **Tratados:** `Pacts` (casamento, comércio, tributo, reféns). No Reinado só `nonagg` em `R.treaties` e a vassalagem.
- **Justiça:** tribunal = `Laws` (casos e leis) + `Justice` (prisão); audiências = `R.aud` (o `Reign.dispute` abre a briga
  de herança). Decretos com o nome de uma lei saíram (`DECREES` não tem feira, toque, caça, escolas).
- **Moeda:** `Reign.debase/strongCoin`, com `c.inflation` em meses (o `Crown.monthCiv` desconta).
- **Exército:** `Game.kRecruit(ci, n)`; `Game.maxGarrison()` = `GARRISON_MAX` (30, em `game.js`).
- **Tesouro:** `Treasury.month(c)` → `{ inc, exp, tin, tout, net, netMust }` (cada linha `[rótulo, valor, opcional]`; o
  opcional para sem ouro). Caminho novo de ouro mensal num reino do jogador: acrescente a linha lá. A dívida é a do banco
  (`Bank.K(ci).debt`); o histórico é o do `Board`; sacar e depositar só com `Bank.take/give`.
- **Jogos salvos:** `Game.migrateFusion(s)` (no `Game.load`, depois do `fixRealms`, idempotente) converte o conselho e os
  complôs antigos, os tratados/reféns do Reinado, os decretos repetidos e a dívida da coroa, e descarta tribunal e
  audiência pendentes da coroa.

## Testes

- `npm run check` — sintaxe de todos os scripts e lista de carregamento (rápido, sem navegador).
- `npm test` — o check e depois os testes de `tests/*.test.js`, cada um num Chrome sem janela com um jogo novo.
- `node tests/run.js soak` — o teste longo: 10 anos com o mês em fatias e sustos (reis e governadores que morrem, tesouro que some); confere todo mês um rei por reino, nenhum governador morto, tesouro nunca negativo e quadros abaixo de 40 ms, e salva e carrega a cada 40 meses (tudo tem que voltar igual).
- `node tests/run.js gate` — só os testes com "gate" no nome.
- Para usar outro navegador, defina a variável `CHROME` com o caminho do executável.

- `node tests/run.js paginas` — percorre todo o menu do Portfólio e todas as abas e sub-abas (clicando os botões de aba),
  no computador e no celular, com o herói rei e governador, três empreendimentos e seis meses de jogo; falha se uma aba
  rolar, tiver página ou quadro cortado, quadro que rola por dentro, página vazia ou meio vazia (menos de 35%) antes de
  outra, ou passar do limite de páginas da tabela `LIMITES` (computador: 1 por aba; Leis e justiça 3 — o tribunal com até
  5 casos; a vila do governador 3. Celular: 4 por aba, com folga maior para as listas que crescem — Leis 10, vila 8,
  ranking das Grandes Casas 16, Por reino e Rival 8, Inquietas 8, meses do Painel 6, Títulos 6, Painel dos empreendimentos
  7). As partes ◀ 1/2 ▶ das listas não contam.

Cada teste exporta uma função que devolve a lista de falhas (vazia = passou). Use `open()` do `tests/harness.js` para
abrir o jogo e `page.evaluate(...)` para mexer no jogo por dentro.

## Convenções

- Textos do jogo em **português**; nomes de código em inglês. Comentários em português, explicando o porquê.
- Quebras de linha **LF** e codificação **UTF-8** (`.gitattributes` e `.editorconfig` cuidam disso).
- A moeda do jogo é o **Salin** (🪙).
- Cada mudança para o jogador entra no **LEIAME.md**.

## Janelas

- **Tamanho das janelas:** as principais (`WIDE_PANELS`), as de negociar e o baú ocupam a tela inteira; as de pouco conteúdo
  têm, no computador, o tamanho do conteúdo (centralizadas, até a altura da tela). No celular, todas ocupam a tela inteira.
- **Cena de abertura:** `UI.scene({ ic, title, kicker, line, chips, theme })` monta a faixa colorida com medalhão;
  `UI.personScene(p, frase)` faz o mesmo com o retrato da pessoa. Temas: gold, green, red, blue, earth, purple, amber,
  stone.
- **Cartões de ação:** `UI.tiles([{ ic, label, sub, attrs, cls, off }])` (o mesmo visual dos cartões da Casa).
- Para dar cena a uma janela sem mexer nela, acrescente uma linha em `WIN_SCENES` (`js/windows.js`).
- O menu do Portfólio é filtrado em `js/portfolio.js` (as páginas antigas continuam em `UI.kPage` e são reaproveitadas).
- As páginas do Portfólio já aprovadas (Visão geral, Família, Empreendimentos, Reino e Grandes Casas) não devem mudar; o
  visual de Coroa e títulos continua no papel Títulos e corte do Reinado.
- **Reinado** (`js/reinado.js`): reúne Seus reinos (`k:`), Suas vilas (`v:`), Finanças do reino (`x:finance`), Coroa e
  títulos (`crown`), Vilas e guardas (`villages`), Sociedade (`x:society`) e Tratados (`x:pacts`). Esses atalhos, `ksub`,
  `crtab`, `Reign.show(aba)`, `UIP.goPage('x:reign', aba)` e `UI.showKingdom(ci)` passam por `Reinado.route()`/`Reinado.go()`
  (tabelas `RN_KSUB` e `RN_RG`). Regra da casa: **cada número, quadro e ação aparece num lugar só** — tesouro, saldo, povo e
  guarnição só na faixa do rei; a renúncia na aba Reino; o banco e o bolso ⇄ tesouro no Tesouro (a janela do banco não tem
  mais depositar/sacar); os guardas de cada posto no lugar dele (`UI.guardsHtml(post)`, `'away'` para os de fora) e as lojas
  sem dono na vila ou no reino delas (`UI.vacancyHtml(filtro)`). Os quadros vêm de funções pequenas: `Reign.*Html`
  (dilema, complôs, espiões, audiências, feudos, herdeiros, orçamento e moeda, tropa, generais, baile, bobo, castelo,
  crônica), `Laws.lawTiles`/`casesHtml`, `Justice.page(cs)`, `Pacts.rowFor/wedCard/hostCard/worldCard`, `Bank.kingCard`,
  `Politics.villageCard/throneCard`, `VillageAdmin.cards`, `UI.titlesPairHtml/courtInvHtml/relCardHtml/villageWaysHtml`.
- **Páginas do Reinado:** papéis de rei e de governador são divididos por `UI.fitReino('x:reign')` (veja "Paginador do
  Portfólio" abaixo); Títulos e corte usa o modo `kdesk` com `data-nav="crown"` e `Portfolio.paginate` no computador.

### Paginador do Portfólio (Portfólio em menos páginas)

Meta: cada aba numa página só no computador (1366×720); quando não cabe de verdade (listas que crescem), o mínimo de
páginas, sem página meio vazia antes de outra, sem quadro cortado e sem quadro que role por dentro. No celular deitado
(844×390, `body.small`) o mesmo, com páginas inteiras lado a lado.

- **Dois paginadores, um para cada caso:**
  1. `UI.fitReino(nav, pkey)` (`ui.js`) — páginas inteiras lado a lado (`.kpages > .kpg`, trocadas arrastando, pelos pontinhos,
     pelas setas ‹ › e pela roda do mouse no computador). Vale no celular para TODAS as páginas do Portfólio (inclusive as
     de Gestão: Avisos, Painel, Sociedades, Serviços e Jogos — `uiplus.js` manda essas para cá só no celular) e, no
     computador, só para o Reinado (`x:reign`). As outras páginas do computador usam o modo `kdesk` (uma grade que enche a
     janela) ou o desenho próprio delas.
  2. `UI.pageList({ items, over, key, host, store, act })` (`ui.js`) — lista que cresce com o jogo, no computador: o que não
     cabe vira partes ◀ 1/2 ▶ no `host` (as abas). É o único laço; `Portfolio.paginate/pageAdv` (`crpg`),
     `Services.paginate` (`svpg`, listas `.sv-pl`), `BizBoard.paginate` (`bzbpg`, listas `.bzb-pg`) e o Painel do reino
     (meses) e os Avisos (`lppg`, em `realmview.js`) só dizem qual é a lista, onde guardar a parte aberta e onde pôr o ◀ ▶.
- **Como o `fitReino` monta as páginas:** o conteúdo da `.kpg` é achatado em "unidades" (os quadros; os invólucros
  `.kbody`, `.sv-root`, `.sv-pg`, `.cr-page`, `.soc`, `.tpair`, `.nb-k2`, `.ln2-two`... são abertos no celular) e o começo
  (`.pg-head`, `.tabs`, `.rg-top`, `.rn-roles`) se repete no alto de cada página. Cada unidade entra na página atual; se
  não cabe: (a) se é grande (mais da metade da página; dois terços no computador) e ainda sobra 30% da página, ela **escorre**
  — começa aqui e continua na próxima; (b) se cabe inteira numa página nova, vai para a próxima — antes disso, no Reinado,
  um quadro menor que vem depois pode ocupar o espaço que sobrou (até 8 à frente); (c) maior que uma página, escorre.
  **Escorrer** (`flow`): o quadro é desmontado em peças (os filhos dele; um filho grande que é lista — filhos parecidos — ou
  que não cabe numa página é desmontado nas linhas dele; uma peça que não cabe sozinha é desmontada de novo) e remontado
  página a página numa cópia vazia do quadro, com o título `.sec` repetido (`.kcont`); um subtítulo nunca fica sozinho no
  pé da página. Nunca são desmontados: `select, svg, canvas, button, .ju-cells, .seg, .chips, .tabs, .act-row, .rn-it,
  .rn-row, .rn-dip, .law, .rn-seat` (`solid`) e os desenhos da lista `keep` (mapa, árvore, pódio...), que vão inteiros
  para uma página deles. `.kalone` fica sozinho na página.
- **Reinado (`x:reign`):** grade de duas colunas "em tijolos" (`.kmas`): linhas de 2px, cada quadro ocupa as linhas da altura
  dele (`grid-row-end: span`) e `grid-auto-flow: dense` faz um quadro baixo subir para o buraco ao lado de um alto. `.wide`
  ocupa a largura toda. No celular os quadros ocupam a largura toda e os baixos (menos de 42% da página) ficam dois a dois
  (`.khalf`); os papéis e a faixa do rei dividem a primeira linha; abaixo vêm as abas.
- **Textos longos:** linhas cortadas (uma ou duas, com `text-overflow`/`-webkit-line-clamp`) ganham o texto inteiro no
  `title` sozinhas (fim do `fitReino`).
- **Como escrever um quadro novo para caber:** um `<div class="card">` com `<div class="sec">título <span>resumo</span></div>`
  e o conteúdo; listas como um elemento com os itens como filhos diretos e parecidos (mesma classe) — assim o paginador
  divide a lista e não o item; linhas baixas (`.rn-it`, `.rn-row`: ícone, nome, uma ou duas linhas de texto, botão); texto
  explicativo curto (o detalhe vai no `title`); `.wide` só se o quadro precisa da largura toda; nada de altura fixa,
  `flex: 1` com `min-height: 0` ou `overflow: auto` no celular (o quadro encolheria e rolaria por dentro — o paginador mede
  a altura de verdade). Regra de CSS que valha durante a montagem deve usar `.kpg.kpage[...]`, não `.kpages > .kpage`
  (a página só entra na trilha `.kpages` depois de montada).
- **Medir:** `node tests/run.js paginas` (abaixo) e, para olhar, as fotos de cada aba (veja o teste).



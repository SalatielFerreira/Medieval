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
| Reinos e política | `diplomacy` (relações, guerras, alianças), `court` (títulos, conselho, rivalidades), `crown` (decretos), `royalcourt`, `statecraft` (mensageiro de paz, renúncia), `faith` (religião) |
| Guerra | `war` (campo de batalha), `siege` (cercos), `arsenal` (máquinas e equipamento da tropa), `arena` |
| Vilas e cidades | `life` (crescimento das vilas, caravanas, estradas dos moradores), `urban` (obras do governador e do rei, estradas), `villageworks` (obras das vilas), `gate` (portão, porteiro, muralhas), `defense` (ataques vindos de fora dos muros), `graves` (cemitérios) |
| Economia | `market` (preços), `farming` (lavoura e animais), `content`/`content2` (mais construções e empreendimentos), `workplaces` (interiores e responsáveis de todos os prédios), `economy` (poder econômico das vilas, itens e lojas próprias, administração da vila), `finance` (poupança, empréstimos, investimentos, lojas do jogador), `rivalry` (concorrência e destaques) |
| Vida à vista | `chronicle` (o Pregoeiro: notícias do mês, balões sobre os moradores, subida na vida) |
| Interface e controles | `ui` (HUD e janelas), `interior` (lugares fechados), `input` (gamepad e toque), `audio`, `menu` |
| Núcleo | `game` (estado, laço principal, salvar e carregar) — carregado quase por último |

## Testes

- `npm run check` — sintaxe de todos os scripts e lista de carregamento (rápido, sem navegador).
- `npm test` — o check e depois os testes de `tests/*.test.js`, cada um num Chrome sem janela com um jogo novo.
- `node tests/run.js gate` — só os testes com "gate" no nome.
- Para usar outro navegador, defina a variável `CHROME` com o caminho do executável.

Cada teste exporta uma função que devolve a lista de falhas (vazia = passou). Use `open()` do `tests/harness.js` para
abrir o jogo e `page.evaluate(...)` para mexer no jogo por dentro.

## Convenções

- Textos do jogo em **português**; nomes de código em inglês. Comentários em português, explicando o porquê.
- Quebras de linha **LF** e codificação **UTF-8** (`.gitattributes` e `.editorconfig` cuidam disso).
- A moeda do jogo é o **Salin** (🪙).
- Cada mudança para o jogador entra no **LEIAME.md**.

# MEDIEVAL — O Último Reino

RPG medieval 2D (visão de cima, estilo pixel art) feito em HTML5 Canvas e JavaScript puro, sem nenhuma instalação.

## Como jogar

Dê dois cliques em `index.html`. O jogo abre no Chrome ou no Edge e funciona offline. O jogo salvo fica guardado no próprio navegador (localStorage), e o jogo pede ao navegador para tratar esses dados como permanentes, para não serem apagados sozinhos.

### Instalar como app (PWA)

Abra o jogo pelo endereço publicado (GitHub Pages) e use o botão **Instalar o jogo** no rodapé do menu inicial. No computador (Chrome ou Edge) o MEDIEVAL vira um app com ícone próprio, em janela sem barra do navegador; no Android aparece na tela inicial e abre em tela cheia, deitado. No iPhone/iPad, toque em Compartilhar → "Adicionar à Tela de Início" (o botão mostra essas instruções). Depois de aberto uma vez, o app funciona sem internet. As atualizações chegam sozinhas quando houver internet (o menu continua mostrando o botão "Atualizar").

## Controles

| Tecla | Ação |
|---|---|
| W A S D / Setas | Andar |
| Shift | Correr (gasta vigor) |
| Clique esquerdo / Espaço | Atacar e coletar recursos (segure para repetir o golpe) |
| V (segure e solte) | **Golpe forte** com arma corpo a corpo |
| Botão direito / X (segure) | Bloquear com o escudo |
| Z | Esquivar |
| T | Ordem aos capangas: seguir, atacar, aguardar aqui |
| J | Diário: conquistas, estatísticas, dinastia |
| Clique numa pessoa | Conversar com ela |
| Roda do mouse | Aproximar ou afastar a câmera (zoom) |
| G | Montar aríete ou catapulta durante um cerco |
| E | Conversar com pessoas e interagir (cabana, lojas, taverna, castelo, forja...) |
| I | Inventário (equipar e comer) |
| B | Construção |
| K | Gerenciar o reino |
| M | Mapa do mundo |
| F | Comer a melhor comida |
| Q | Trocar a ferramenta empunhada (machado, picareta, vara de pesca) |
| 1 2 3 4 | Usar o item guardado na algibeira (bolsa de acesso rápido) |
| R | Montar / desmontar do cavalo |
| Esc | Fechar janelas / Ajustes |

Os mesmos atalhos também ficam na barra de botões no canto inferior direito (Mochila, Criar, Construir, Reino, Mapa, Diário e Ajustes).

**Controle (gamepad):** analógico esquerdo anda, direito mira · A/✕ ataca · B/○ esquiva · X/□ interage · Y/△ mochila · LB troca ferramenta · RB bloqueia · LT monta · RT (segure) golpe forte · Back mapa · Start ajustes · setas usam a algibeira.

**Celular e tablet:** joystick na tela e botões de Atacar, Usar, Bloquear, Esquiva, Cavalo, Ferramenta, Ordens e Comer. Aparecem sozinhos em telas de toque (ou ligue em Ajustes → Controles de toque). A interface se ajusta ao tamanho da tela e, em telas pequenas, as janelas ocupam a tela inteira.

**Janelas:** todas seguem o mesmo padrão escuro com dourado.
- **Mochila:** ficha do personagem com as 6 partes do equipamento, a algibeira e uma grade de itens com filtros. Clique num item para ver detalhes, para que serve e como conseguir.
- **Criação:** filtros por estação (o ponto verde indica que ela está por perto) e ingredientes no formato "tenho/preciso".
- **Construção:** construções agrupadas em Moradia, Produção e Defesa, com o custo detalhado.
- **Reino:** abas Resumo, Economia, Obras e Exército. Sem reino, mostra os caminhos até a coroa e as relações com os 7 reinos.

**Mapa (M ou clique no minimapa):**
- Roda do mouse ou botões + e −: zoom.
- Arrastar: mover o mapa.
- Clique: marcar um destino. Uma seta dourada ao redor do personagem aponta para ele e mostra a distância.
- Botão direito: remover a marcação.
- A lista lateral tem todos os castelos, vilas e perigos. Clique para centralizar ou no alfinete para marcar como destino.

## O que já existe

- **Menu MEDIEVAL** com fundo animado e criação do herói: nome, sexo (muda o cabelo e a roupa), idade de 16 a 80 anos (o cabelo fica grisalho com a idade), cor do cabelo e tom de pele.
- **Pessoas com identidade:** cerca de 450 NPCs com nome, sobrenome de família, idade, hierarquia (Rei, Rainha, Príncipe, Princesa, Cavaleiro, Ferreiro, Madeireiro, Pedreiro, Comerciante, Taverneiro, Caçador, Camponês, Andarilho, Mendigo...), personalidade e presente favorito. Eles envelhecem, têm filhos e morrem. Quando morrem, só os filhos dão continuidade ao ofício.
- **Conversa (E ou balão 💬):** conversar, elogiar, presentear, paquerar, namorar, casar (com Anel de Prata), terminar, insultar (pessoas orgulhosas ou corajosas podem partir para a briga), negociar e recrutar capangas que você equipa com armas e armaduras.
- **Lojas especializadas** em cada vila (Armazém, Madeireira, Pedreira, Ferreiro e Taverna) e **caçadores** que vendem peles, ossos, chifres e presas. A amizade com o dono dá desconto.
- **Família e linhagem:** case-se, tenha filhos (sexo aleatório, você escolhe o nome). O ano segue o calendário de 12 meses (12 meses; cada mês dura 6 minutos reais). Morrer é fim de jogo, mas você pode continuar como seu filho ou filha, que herda tudo.

- **Mapa fixo** de 320×320 tiles, o mesmo em todas as partidas: cerca de 73% de terra, com campos, florestas, colinas, montanhas, neve, rios e lagos. Há **8 ilhas** no mar que só se alcançam de barco e guardam prata, ouro, gemas e carvalhos anciões.
- **7 reinos:** Midgard, Dorne, Winterfel, Valáquia, Olympus, Babilônia e Gondor. Cada um tem castelo, 3 vilas espaçadas (Armazém, Ferreiro, Madeireira, Pedreira, Taverna, casas e plantações), território com fronteiras, estradas e economia própria. Há 14 acampamentos de bandidos; quando um é destruído, ele some e, depois de alguns dias, renasce em outro canto da terra selvagem (fora dos reinos).
- **Árvores:** Carvalho, Pinheiro (resina), Bétula, Teixo, Macieira, Coqueiro e Carvalho Ancião (madeira nobre, exige machado de ferro).
- **Minérios:** Rocha, Carvão, Cobre e Estanho (picareta de pedra); Ferro (bronze); Prata e Ouro (ferro); Gemas (aço). Também há Argila, Linho e Ervas.
- **Ferramenta escolhida por você:** a ferramenta empunhada (tecla Q) define o que você coleta e com que força.
- **Pesca:** com a Vara de Pesca, lance a linha na água e fisgue quando aparecer o **!**. Rios dão trutas, o mar raso dá sardinhas e carpas, e o mar aberto dá bacalhau. Há também o raro Peixe-Dourado.
- **Barco a Remo:** feito na bancada (madeira, corda e resina). Aperte E na margem para embarcar e desembarcar.
- **Criação:** progressão Pedra → Bronze → Ferro → Aço, com lingotes de bronze, ferro, aço, prata e ouro, tijolos, corda e tecido. Há 9 armas, da Lança de Pedra à Espada Real, além de comidas (peixe assado, torta de maçã) e o Unguento de Ervas.
- **Equipamento em 6 partes:** Arma, Ferramenta, **Elmo**, **Gibão**, **Calções** e **Botas**, em linho, couro, bronze, ferro e aço. Cada peça soma defesa.
- **Algibeira:** 4 espaços de acesso rápido, mostrados embaixo do quadro do dia junto com a ferramenta empunhada.
- **Construção:** cabana, fogueira, bancada, forja, casa, casarão de tijolos, fazenda, quartel e muros.
- **Cabana inicial:** salvar, dormir e cozinhar. Se você morrer, volta ao último local de descanso.
- **Ciclo dia/noite** com iluminação (os lobos ficam mais ousados à noite).
- **Combate:** cervos, javalis, lobos, bandidos (com acampamentos), guardas e soberanos.
- **Seguidores:** contrate mercenários nas tavernas ou treine soldados no quartel. Cada um cobra soldo diário.
- **Comércio:** os preços variam conforme a produção e o estoque de cada reino. Vender melhora a relação.
- **Conquista:**
  - **Força:** declare guerra, derrote a guarnição e o soberano.
  - **Diplomacia:** com relação 75+, pague 1500 moedas pelo trono.
- **Gestão do reino:**
  - Impostos, felicidade e população.
  - Tesouro do reino separado do ouro pessoal.
  - Armazéns, investimentos (fazendas, serrarias, pedreiras, minas, moradias e muralhas), guarnição e festivais.
  - Se o povo ficar infeliz por tempo demais, há revolta.

## Novidades: o nome "O Último Reino" e o jogo em inglês e espanhol

- O jogo agora se chama **MEDIEVAL — O Último Reino**.
- **Idioma**: no canto do menu inicial, o botão com a bandeira troca o jogo inteiro para inglês ou espanhol (começa em português). A escolha fica guardada.
- Como funciona: o jogo continua escrito em português; tudo o que vai para a tela passa por `js/i18n.js`, que procura a tradução em `js/lang_en.js` ou `js/lang_es.js`. Depois de mudar ou acrescentar textos, rode `node scripts/i18n-extract.js && node scripts/i18n-build.js` (só os textos novos são traduzidos). Correções à mão vão em `scripts/i18n/fix_en.json` e `fix_es.json`.
- A tela de criar o herói não mostra mais o texto embaixo dos botões de dificuldade (ele aparece ao parar o mouse no botão).
- A barba longa fica na frente do braço; o círculo que a neblina do mapa descobre tem quatro vezes o tamanho original.
- O botão Voltar das janelas só volta de janela para janela: o que você faz dentro de uma janela (dividir itens, trocar de aba) não vira passo, e Voltar sai direto para onde você estava.

## Novidades: a Prisão

- **Cada castelo tem a sua Prisão** (aparece sozinha perto da capital, como a arena e o cemitério): prédio de pedra com torre e porta de ferro. Por dentro: o corredor com o carcereiro e os guardas, braseiros e celas gradeadas — com os moradores que estão presos de verdade.
- **Ir preso:** a pena é decidida pelo rei daquele reino (a multa e o jeito dele: um rei rabugento ou desconfiado é duro, um gentil é brando). Você fica na cela trancada até cumprir: a palha passa um mês e a tigela dá a ração. Cumprida a pena, sai pela porta da prisão. Jogo salvo no meio da pena volta para a cela.
- A Arena e o Cemitério saíram da lista de construção (já vêm com o castelo).
- O zoom voltou a ser como antes (a roda do mouse aproxima e afasta).
- Cesteiro e Sapateiro da Vila desenhados direito (eram altos demais para o tamanho deles).

## Novidades: cidade cheia sem travar

- **Cidades populosas mais leves:** as figuras das pessoas não ficam mais saindo e voltando da memória (era o que travava), as figuras novas ficam prontas aos poucos, e os prédios são redesenhados cada um no seu tempo e recortados no que têm desenhado. Numa cidade com 170 moradores, o quadro caiu de ~21 ms para ~11 ms em média e o pior, de 390 ms para ~30 ms.
- **Pessoas nas ruas** (Ajustes → Tela): Poucas (~35 por vila), Normal (~60, o padrão) ou Todas. O resto do povo fica em casa ou no trabalho; lojistas, funcionários, família, quem você conhece, o governador e quem você precisa achar aparecem sempre.
- **Sem balões de fala** sobre os moradores e os guardas (o ícone de humor continua).
- **Câmera fixa** 50% mais perto que antes (a roda do mouse não muda mais o zoom).
- **Moinhos parados** (as pás não giram: mais leve).

## Novidades: quarto real, cargos e o Capitão

- **Quarto real no castelo:** na Sala do Trono, a cama do rei para salvar e dormir (só para quem é o rei daquele castelo; o castelo vira o ponto de retorno).
- **Empreendimentos:** quem você contrata é o responsável e assume o cargo do lugar (Padeiro, Açougueiro, Tecelão, Tanoeiro, Cordoeiro, Joalheiro...); ao ser dispensado, volta ao ofício de antes. O bônus de ofício (caçadores no curtume etc.) continua valendo.
- **Porto:** o responsável é o **Capitão**.
- **Infraestrutura:** saiu o Posto de Pedágio; a classe se chama Estradas (com Remover estrada) e a Estrada diz só "Clique e arraste".
- O texto embaixo do nome das construções na lista começa sempre com letra maiúscula.
- **Correção:** no primeiro instante do jogo o relógio podia andar para trás e, por isso, às vezes o saque de uma vila não criava os inimigos e os defensores.

## Novidades: todo imóvel é sólido

- **Ninguém anda por cima de nenhum imóvel** (plantações, hortas, currais, campos de treino, enfeites, obras...); só o portão abre a passagem, como sempre. As Estacas e o Fosso agora ferem os inimigos que encostam neles. A ficha não mostra mais "sólida / dá para andar por cima".
- **Classes também em Moradia e Infraestrutura:** Casas e residências; Estradas e pedágio e Ferramentas.
- Na ficha da Fazenda e animais, "Produz e coleta" virou **Coleta**.

## Novidades: fazenda que se vende sozinha e menu mais enxuto

- **Fazenda e animais só para recolher:** ao interagir abre a produção guardada, o botão Recolher tudo e a opção de vender a produção automaticamente (preço de mercado do reino do lugar; o tesouro dele paga). No Galinheiro e no Curral também dá para comprar animais. Essas construções não têm mais responsável. A Fazenda de trigo agora guarda a colheita nela, como as outras.
- **Lucro estimado** na ficha dos empreendimentos (por mês, com 2 funcionários, e em quanto tempo se paga).
- **Saíram do menu:** a Barraca de Feira e o Oratório (Obras), o Posto de Muda e as reformas de estrada (Infraestrutura: o próprio jogo melhora as estradas conforme a economia). Os que você já construiu continuam funcionando.

## Novidades: ficha das construções no mesmo padrão e janela mais rápida

- **Ficha igual em todas as janelas:** ícone, nome, janela e classe; tamanho, se é sólida e quantas você tem; o custo; e os produtos ligados ao imóvel — em Produção o que dá para fabricar, em Fazenda e animais o que se colhe ou recolhe, em Empreendimentos o que o seu estabelecimento produz e vende, em Baús e estábulo e nas Obras o que se compra ali. Saiu o texto de descrição. A letra tem sempre o mesmo tamanho e só a lista de produtos rola quando é comprida.
- **Janela de construção mais rápida:** trocar de categoria abria em até 0,4 s (a ficha de cada construção era montada e medida); agora abre na hora.

## Novidades: o dinheiro tem dono, uma música só e mais classes

- **O caminho do dinheiro:** tudo o que sai da sua bolsa entra na riqueza de quem recebe. Deu 5000 Salin a alguém? A Ficha dele mostra 5000 a mais. Presentes, recrutar, subornar, salários, dote, parteira, soldo dos capangas e parcelas de empréstimo vão para a bolsa da pessoa; doação, festa, comício, candidatura e a entrada do portão vão para o caixa da vila (visto na administração da vila); compras sem comerciante (animais, cavalos, navio, viagem) e a inscrição no torneio vão para o tesouro do reino; a aliança e o favor de uma família, para a riqueza da casa; doações, bênçãos e dízimo, para o padre da vila. E o empréstimo sai da bolsa de quem empresta.
- **Uma música só:** todas as músicas saíram; fica uma melodia alegre e leve (flauta e alaúde), sem tambor nem pandeiro.
- **Classes também em Produção, Fazenda e animais e Empreendimentos:** Cozinha e bebidas, Madeira e ferramentas, Metais e armas, Tecidos e couro, Barro e vidro, Poções e magia; Lavouras, Pomares e vinhas, Animais, Criações especiais; Campo e criação, Matérias-primas, Comida e bebida, Ofícios, Comércio e serviços. Em Baús e estábulo: Guardar itens (baú, armazém grande, adega), Guardar ouro (cofre) e Animais e carga (estábulo, canil, garagem de carroças).
- **Inventário:** o espaço "Gibão" agora se chama "Armadura".
- **Sino de avisos** só na tela do jogo: some quando uma janela está aberta.

## Novidades: construa em qualquer lugar

- **Base e obras em todo o mapa:** dá para construir na terra livre e nas vilas independentes; só não dentro de um reino que não é seu (a não ser na vila que você governa). Fica só um bloco de folga das construções dos outros.
- **A obra fora de onde você governa é sua:** a renda dela vai para você todo mês, só você demole ou muda de lugar, e o responsável vem da vila mais perto ("Sua Padaria", "Seu Correio"). Na sua vila ou numa vila do seu reino, a obra continua sendo da vila. Muralha, portão, banco, porto, cemitério e arena seguem as regras de antes.
- **Obras só com loja e serviços:** as Casas de Aluguel ganharam interior, um senhorio e loja; o Observatório, a Torre de Arqueiros e o Quartel abrem a loja do responsável; o Estábulo de Guerra não rende mais crina (nas obras não se produz nada).

## Novidades: as vilas da IA também constroem

- **Governadores da IA erguem as Obras nas vilas:** as vilas que a IA comanda constroem sozinhas as obras da janela Obras nas vilas (comércio, serviços, produção, fazenda, praça, cultura, fé e defesa), uma de cada vez, num lote do traçado da vila, e cada obra entra na crônica.
- **Cada vila pensa do seu jeito:** o ofício do governador costuma dar o gosto dele (o comerciante prefere comércio, o padre a fé, o cavaleiro a defesa, o lavrador a fazenda...), cada vila tem as suas manias e a sorte faz o resto. O que falta (armazém, taverna, capela, poço) pesa mais; em guerra, a defesa; reino pobre, o que dá dinheiro; reino rico, fé, cultura e praça.
- **Conforme o dinheiro:** cada vila tem um caixa de obras que enche todo mês com o poder econômico dela, o nível e os aluguéis das obras; o rei da IA manda uma verba quando sobra dinheiro no tesouro (metade em guerra). O governador escolhe um projeto e junta dinheiro até poder pagar.
- **Conforme o tamanho:** obra grande só em vila grande (Universidade a partir do nível 6, Catedral do 8...), algumas pedem outra antes (a Catedral pede a Capela, a Universidade a Escola), peixe só perto da água, mina só perto da montanha, e cada nível libera mais obras.
- **Onde você governa, a IA não mexe.** Numa vila do seu reino com governador da IA, ele constrói só com o caixa da vila, sem tocar no seu tesouro.

## Novidades: obras da vila separadas por tipo

- **Praça e decoração** e **Cultura, fé e treino** agora são obras da vila: só aparecem para quem é governador ou rei, e só se constroem onde você governa (numa vila sua ou no seu reino).
- **Obras numa janela só, separadas por classe** (Construção → Estradas e vilas → "Obras na vila" para o governador, "Obras no reino" para o rei; sem o aviso repetido de onde você manda): 🏠 Moradia, 🛒 Comércio, 🏛️ Serviços (correio, casa de curas, banhos, orfanato, paço, porto...), 🔨 Produção, 🐄 Fazenda e animais, ⛲ Praça e decoração, 📚 Cultura e educação, ⛪ Fé e 🛡️ Defesa e treino.
- **Menu de construção mais enxuto:** saíram a Choupana, a Barraca de Viagem, a Casa na Árvore, a Casa Comprida, a Torre de Pedra e o Solar (Moradia); a Arca Reforçada, o Celeiro e a Casa de Gelo (Baús e estábulo); a Cisterna e a Rede de Esgoto (Infraestrutura). As que você já construiu continuam funcionando.
- **Sem obras repetidas:** ficam o Poço, o Lampião, o Chafariz, a Estátua, a Torre de Vigia e a Capela da vila. Saem do menu os seus Poço, Lampião, Chafariz, Estátua do Herói, Torre de Vigia e Capela Particular; os que você já construiu continuam funcionando.
- **Fim da janela Criação:** as ferramentas e armas que se faziam com as mãos agora se fazem na Bancada. Também mudaram: o espaço "Ferramenta" do inventário (antes "Ferram. 2"), o boneco do inventário (sem o quadro e 1,5× maior) e o botão Voltar, que agora volta de primeira para a janela anterior ou para o jogo.

## Novidades: feras errantes, ordens de cavalaria, leis na rua, vida de fora da lei e haras

- **🐉 Feras errantes:** de tempos em tempos um Dragão Errante, um Grifo ou uma Serpente do Rio aparece e vai, mês a mês, de vila em vila atacando (prosperidade, moradores e tesouro). Cada reino atacado põe ouro na recompensa. A fera aparece no mapa e, quando você chega perto, está lá de verdade: abater paga a recompensa, dá fama, a gratidão dos reinos e um troféu (escamas, pena de grifo, presa de serpente).
- **⚜️ Ordens de cavalaria** (Portfólio → Ordens de cavalaria): entre na Ordem do Templo, do Dragão, da Rosa ou nos Hospitalários (nível, fama e, no Templo, fé), faça o juramento e cumpra a missão do mês para subir de Escudeiro a Cavaleiro, Comendador e Grão-Mestre. Você ganha a armadura da ordem e cavaleiros que seguem você (até 5). Três quebras do juramento são expulsão. Ou funde a sua própria ordem (fama 100, um reino ou título de Conde, 4.000 🪙), com nome e cor, que arma um cavaleiro novo por mês.
- **📜 Leis na rua:** com leis em vigor (porte de armas, toque de recolher, caça real, duelos, imposto do vinho), os guardas multam moradores perto de você, com balões de fala, e a multa vai para o tesouro. Nos portos dos seus reinos aparece contrabando (prender ou fazer vista grossa); nos dos outros, dá para comprar contrabando barato, com risco. À noite, nas tavernas, há um mercado negro. Reinos hostis plantam espiões nas suas vilas: boatos dão pistas, um investigador (no Painel do reino) aponta o suspeito e você acusa na conversa.
- **🗡️ Fora da lei** (Portfólio → Fora da lei): assuma um bando num acampamento de bandidos. Ele vira o seu esconderijo, onde você descansa, e os bandidos param de atacar você. Assalte caravanas, saqueie vilas e cobre proteção. Cada golpe sobe a recompensa pela sua cabeça: os guardas daquele reino atacam e aparecem caçadores de recompensa. Compre o perdão de cada rei, ou largue a vida de fora da lei quando quiser.
- **🐎 Haras e corridas:** cada cavalo tem raça (Puro-Sangue, Árabe, Percherão, Andaluz, Pônei) e três qualidades: velocidade (mais rápido montado), fôlego (corridas e carga) e força (carga de peso). Cada Estábulo guarda 4 cavalos. Cruze uma égua e um garanhão e, em 2 meses, nasce um potro que puxa os pais e pode ser montado com 4 meses. Todo mês há um Grande Prêmio num reino, com a corrida ao vivo na janela e prêmios de 400, 150 e 60 🪙.

## Novidades: navegação, masmorras fundas, neblina, cavalaria, companheiros, música e o placar da dinastia

- **⛵ Navegação de verdade:** no estaleiro de todo porto, compre uma Caravela (rápida, porão de 120) ou um Galeão (grande, porão de 300, enfrenta piratas). O navio é mais rápido que o barco a remo e se embarca em qualquer margem. No porto, compre mercadorias para o porão pelo preço daquele reino e venda em outro porto. Zarpe para outros portos ou para as ilhas grandes: no caminho vêm tempestades (o casco sofre e a carga pode ir ao mar) e piratas (lutar, fugir ou pagar). Navegando em alto-mar, piratas atacam de barco, e a tempestade castiga o casco — sem casco, o navio afunda e você vai parar na praia. Conserto no porto.
- **🕳️ Masmorras com andares:** cada caverna tem 3 andares (o covil do dragão, 4), com escada vigiada por um guardião. A cada andar, criaturas mais fortes e baús mais ricos. O chefe mora no último andar e, na primeira vez, deixa um item lendário que só existe lá: Martelo do Rei Troll, Lâmina do Rei Morto (rouba vida), Arco da Viúva Negra e Presa do Dragão.
- **🌫️ Mapa com neblina:** em jogo novo, o mapa e o minimapa só mostram o que você já viu. O Mapa do Tesouro marca um X longe dali (cave com a pá em cima dele), e a Carta do Reino (correio, observatório e prefeitura) revela o território de um reino. Jogos salvos de antes continuam com o mapa todo à vista.
- **🐎 Cavalaria:** o galope dá força ao golpe (até +60%). Com lança, é uma carga de verdade (até +150%), que joga o inimigo para trás. O arco a cavalo acerta mais forte. Há uma Lança de Cavalaria nova (forja, liça e campo de treino).
- **🤝 Companheiros com história:** cada capanga tem lealdade e o jeito dele. Eles pedem coisas (pagamento, arma melhor, visitar a família, caçar bandidos, festa na taverna): atender sobe a lealdade, recusar ou esquecer derruba. O leal luta melhor; sem lealdade, o capanga vai embora levando ouro, ou passa para o inimigo numa guerra. E eles se apaixonam, entre si ou por você.
- **🎵 Música por lugar e momento:** temas novos para a vila, a taverna, o inverno e o mar, além do campo, da noite, da caverna e da batalha.
- **🏆 Conquistas novas e placar da dinastia:** 20 conquistas novas (masmorras, lendários, tesouros, mapa, cargas, bando fiel, tratados, Bolsa, Jogos, navios, piratas...) e um placar com o que cada geração alcançou, lado a lado e com pontos (no livro da crônica e em Portfólio → Linhagens).
- **Correção:** quando o herdeiro assume, a geração que terminou entra na crônica (e no cemitério) com o nome dela. Antes, ficava com o nome do herdeiro.

## Novidades: inventário arrumado e cada construção com a sua função

- **Inventário:** a seção de bolsos saiu da janela — o bolso agora é um atalho: escolha "Bolso 1" ou "Bolso 2" nos botões do item, e ele continua na mochila com a marquinha B1/B2 (os bolsos seguem na tela, teclas 1 e 2). Os botões do item ficam organizados num painel (usar, bolsos, dividir, ficha e descartar), com o nome e o que o item faz.
- **Dividir automático:** um toque divide a pilha em duas metades (num ímpar, 7 vira 4 e 3), sem escolher quantidade e sem a tesourinha no item.
- **Balão com o nome do item** junto do cursor ao parar o mouse sobre ele (na mochila e no equipamento).
- **💍 Anel:** espaço novo embaixo das botas. Anel de Prata: 5% mais barato nas lojas. Anel de Ouro: +1 de fama por mês e mais charme (as pessoas gostam 25% mais do que você faz por elas). Anel de Gema: +3 de defesa.
- **Criação:** uma só receita de Tocha (rende 4) e de Flecha (rende 8, com madeira, sílex e pena); o nome na lista é só o do item e quanto rende aparece embaixo.
- **Os Dados de Osso saíram do jogo** (item, receita, lojas e o uso); em jogos salvos antigos eles somem ao carregar.
- **🔨 Produção:** interação direta, sem lado de dentro e sem responsável — só fabricar. A ficha da construção mostra, embaixo do custo, tudo o que ela pode produzir.
- **🐄 Fazenda e animais:** sem lado de dentro; ao interagir abre a loja do responsável (o que o imóvel produz) e, na mesma janela, o botão para cuidar do lugar (colher, recolher, animais). O responsável anda livre pelo mapa, não fica parado na frente.
- **📚 Cultura, fé e treino:** lado de dentro, responsável e loja (livros na biblioteca, armas no campo de treino, arcos e flechas no estande...); o que cada um já fazia continua lá dentro.
- **🛡️ Defesa e exército** foi para as **Obras nas vilas**: só se constrói onde você governa (vila sua ou o seu reino), com os mesmos interiores, fabricação e lojas.
- **🛣️ Infraestrutura:** saíram o Atracadouro, o Guindaste de Obra e o Moinho de Vento (os que você já tem continuam funcionando).
- **🏗️ Obras nas vilas:** a Feira, o Pomar Comunitário, o Pasto de Ovelhas, o Apiário, o Galinheiro, o Lenhador, a Pocilga, a Fonte Sagrada e a Feira do Gado ganharam lado de dentro, responsável e loja; na capela, o padre vende velas, incenso e água benta. O portão se emenda no muro, e a Estrebaria vende cavalos, carroças e o que eles usam (e compra o seu cavalo).
- **Inventário no celular em pé:** uma coluna só, com a mochila e os botões em cima e o boneco com todos os espaços embaixo.

## Novidades: estações e clima, tratados, árvore da dinastia e painel do reino

- **Estações que mudam o jogo:** no ❄️ inverno a comida fica 25% mais cara (e vende 20% mais caro), a neve deixa as estradas 20% mais lentas e o frio tira um pouco da prosperidade das vilas; no 🍂 outono a colheita enriquece as vilas, enche o tesouro de cada reino (imposto da colheita) e os armazéns de trigo, e a comida fica 15% mais barata.
- **O tempo de cada mês, reino por reino:** seco, normal, chuvoso, tempestades ou nevasca. Mês seco no verão é seca (comida mais cara, vilas perdendo prosperidade); chuva na primavera e no verão ajuda as plantações; chuva, tempestade e nevasca atrapalham quem ataca aquele reino (−15% a −30% de força), também nas guerras da IA e na estimativa de vitória do conselho de guerra. A chuva que cai na tela segue o tempo do reino onde você está. Tudo em Portfólio → 🌸 Estações e clima.
- **📜 Tratados** (Portfólio → Tratados): 💍 casamento entre dinastias (um filho ou filha sua com o herdeiro de outro reino: dote, aliança e quem casa vai morar no castelo de lá); 📦 tratados de comércio de 12 meses (renda para os dois tesouros e 5% de desconto nas compras lá); 💰 tributos (exigir de um reino bem mais fraco, ou comprar a paz pagando por mês); 🕊️ reféns (a paz em troca de um refém; quem entregou não ataca quem guarda — e atacar o reino que guarda um filho seu custa a vida dele). Os reinos da IA também assinam comércio, cobram tributo e trocam reféns.
- **🌳 Árvore da dinastia:** as gerações da sua casa (cada herói com o cônjuge, os filhos, quem continuou a história e os netos), numa página do livro da crônica e em Portfólio → Linhagens.
- **📈 Painel do reino** (Portfólio → Painel do reino): população, tesouro, felicidade, exército, reserva e dívida do banco de cada reino, com a mudança do mês, um gráfico de cada um ao longo de até 3 anos, a tabela dos meses e as ameaças do momento (guerras, rebelião, crise no banco, bárbaros, vilas atacadas, complôs, vizinhos hostis, tributos, seca).
- **Mais leve:** a arrumação das vilas em quarteirões, as estradas dos reinos e as mudanças de família agora rodam em pedaços na virada do mês (a virada caiu de ~8 ms para ~1,6 ms e nenhum pedaço passa de ~20 ms); a estrada de uma vila nova vai até a estrada mais perto (fundar vila não trava mais).
- **Correções:** o negócio de família que muda de lugar no traçado da vila não perde mais o responsável ao carregar o jogo; rei da IA que morre de repente ganha sucessor na hora; um herdeiro casado em outro reino que herda o trono passa a ser do reino que herdou (não fica mais "rei" em dois lugares).

## Novidades: vilas em quarteirões, poder da nobreza, Jogos com pódios e a Bolsa

- **Vilas organizadas:** as casas e os imóveis ficam alinhados em quarteirões, só dentro da área da vila, e a estrada rodeia cada um — de um imóvel para o outro só há estrada. Ruas a cada fileira, uma avenida pelo centro e uma estrada em volta da vila, por dentro da muralha (as estradas de fora chegam nela). Os lotes vazios esperam as casas que a vila ganha ao crescer. Todo mês, o que os moradores, as famílias e as obras constroem fora do traçado ganha um lote. O que você mesmo mudou de lugar fica onde você pôs.
- **Fundar vila custa 100.000 Salin para todos:** o herói, os reis e agora também as famílias (antes elas fundavam com 500). Sem esse dinheiro, ninguém funda vila nova.
- **Aposta até 100.000** na arena (ficha nova de 100.000).
- **Peças de leilão diferenciadas:** a Coroa de Cristal aparece como uma coroa de cristais na cabeça (não mais como elmo); o Elmo de Dragão tem chifres e espinhos; a Cota de Mithril brilha com runas; o Escudo de Dragão leva o brasão dourado; as armas raras brilham na lâmina; e quem veste uma peça de leilão tem um cintilar em volta. Na mochila, elas têm moldura dourada.
- **Jogos dos Sete Reinos com sete provas**, a maioria de luta: duelo de espadas, luta sem armas (só os punhos), Desafio dos Três (três duelos seguidos), Duelo dos Campeões (contra o herói mais forte dos reinos), justa, arco e flecha e a nova corrida a cavalo. Quando você termina todas, os Jogos se encerram na hora com a **cerimônia dos pódios**: ouro, prata e bronze em cada prova, com prêmio (1.500 / 800 / 400) e fama para os três colocados — também para os heróis dos outros reinos. Os pódios dos anos anteriores ficam guardados.
- **Cada título de nobreza dá mais poder no reino que o concedeu** (somando do Cavaleiro ao Duque): desconto nas lojas, voz nas eleições das vilas, feudos (as vilas maiores do reino pagam renda ao nobre), relação com a coroa que cresce sozinha, multas menores e, para o Duque, foro de nobreza (não paga multa no reino) e o direito de erguer muralha e portão em qualquer vila do reino. Os poderes aparecem no castelo e em Portfólio → Coroa e títulos.
- **Deixar o poder** (Portfólio → Coroa e títulos): renunciar ao trono de um reino, deixar o governo de uma vila (o morador mais respeitado assume até a eleição do mês seguinte) ou renunciar a um título de nobreza.
- **Banco com mais aplicações:** 📊 Bolsa dos Reinos (ações de cinco companhias, preço que muda todo mês com as guerras, a colheita e os naufrágios, e dividendos), 🏛️ Fundo das Guildas (rende em média 1% ao mês, quase sem risco), 👑 renda vitalícia (você entrega uma quantia ao Tesouro e recebe 2,2% dela todo mês, para sempre), 🛡️ seguro das expedições (a perdida devolve 70%) e títulos do Tesouro de 1 e de 24 meses.
- **Correção ao abrir o jogo:** o menu e o "continuar" só aparecem depois que todos os arquivos do jogo carregaram. Antes, num carregamento rápido, o jogo salvo podia abrir sem os módulos do fim (e algumas coisas ficavam fora do lugar).

## Novidades: tela de passagem e o cavalo na porta

- **Tela de passagem animada** ao entrar e sair de imóveis (uma porta que se abre), de cavernas (a luz de uma tocha) e do campo de batalha (espadas que se cruzam), com o nome do lugar. Dura menos de meio segundo e só some depois de o lugar novo estar desenhado — nada aparece pela metade.
- **Quem entra montado sai montado:** o cavalo espera na porta e você já sai em cima dele (quem entra a pé sai a pé).

## Novidades: assassinos só ao ar livre, menu limpo e desenho mais leve

- **Assassinos só no mundo aberto:** dentro de qualquer imóvel nenhum aparece; quem vinha atrás de você fica do lado de fora e volta para a fila, e eles só reaparecem quando você sai.
- **Menu limpo:** o sino de avisos e o botão "Conversar" não ficam mais por cima da tela do menu.
- **Prédios e cavalos desenhados uma vez e copiados:** cada prédio vira uma figura pronta (os animados — fogo, bandeiras, plantações — são refeitos 10 vezes por segundo) e os quadros do galope dos cavalos ficam guardados (16 vezes mais rápido).

## Novidades: interior em todas as construções novas

- **43 construções ganharam o lado de dentro e um responsável** que vende o que tem a ver com o lugar. Suas: Fundição, Vidraria, Tinturaria, Lagar, Vinícola, Serraria, Torre do Mago, Sirgaria, Rancho, Estábulo de Guerra, Oficina de Cerco, Moinho de Vento, Celeiro, Armazém Grande, Casa de Gelo, Capela, Observatório e Posto de Muda. Das vilas: Lavanderia, Cestaria, Forno, Pesqueiro, Sapataria, Carvoaria, Açougue, Peixaria, Olaria, Queijaria, Pousada, Correio, Posto da Guarda, Orfanato, Casa de Penhores, Enfermaria, Oficina dos Artesãos, Prefeitura, Guilda, Casa da Moeda, Mercado Coberto, Termas, Mosteiro, Universidade e Catedral.
- **Cada responsável vende o seu,** do mais barato ao mais caro: o açougueiro vende carnes, o vidreiro vende vidro e lunetas, o mago vende pergaminhos e cajados, a casa da moeda vende lingotes... Nos prédios que já têm função própria (depósitos, capela, observatório, posto de muda), o balcão continua fazendo o que fazia, e o responsável vende pela conversa ("Negociar").
- 23 ofícios novos (fundidor, vidreiro, açougueiro, sapateiro, monge, escrivão...), cada um com a roupa do ofício. Campos, cercas, enfeites e as casas dos moradores continuam sem interior.

## Novidades: quantias de 1 a 5000 e aposta até 50.000 (hoje 100.000)

- **Todo botão de quantia de dinheiro** ganhou **1** e **5000**: depositar e sacar (casa e banco), aplicar, expedições, investir em famílias e vilas, dinheiro do banco, pagar dívida, doar e retirar do tesouro, cofre, tesouro do reino, doações na igreja e presentes em moedas. Os mensageiros de paz e de guerra ajustam a oferta de 1 em 1 e de 5000 em 5000.
- **Arena:** a aposta vai até **50.000 Salin** (fichas de 1 a 50.000).

## Correções: estabilidade

- Um só rei por reino: quem assume o trono (herança, golpe, nova dinastia, revolta ou conquista) tira o título dos antigos.
- O governador que morre deixa o cargo na hora: a família assume interinamente e há eleição no mês seguinte.
- O tesouro nunca fica negativo: o rombo vira dívida com o banco do reino.
- O resultado das eleições e as vilas em anarquia continuam iguais depois de carregar o jogo.
- Os acampamentos de bárbaros limpos não voltam ao carregar e somem com a nova dinastia.
- O mês de um jogo antigo não roda mais num jogo novo, e as caravanas não usam rotas de outro jogo.
- O resumo do mês inclui o que os negócios, o banco, os soldos e os prêmios mudaram no seu ouro.
- Viajantes e caravanas seguem as estradas com uma busca leve (o quadro de 117 ms sumiu).

## Novidades: um mundo vivo, leis, mercenários, Jogos e um jogo mais leve

- **⚡ Desempenho:** a virada do mês não trava mais o jogo. Antes ela levava de 70 a 250 ms de uma vez; agora o essencial roda na hora (menos de 1 ms) e o resto é dividido em pedaços pequenos nos quadros seguintes. O minimapa é refeito aos poucos, e as buscas de famílias, moradores, lojas e rotas ficam guardadas. Antes de salvar, o mês termina de rodar. O jogo salvo continua pequeno (cerca de 120 KB comprimido depois de 10 anos de jogo).
- **💰 Economia equilibrada:** as expedições rendiam demais (9% a 12% ao mês na média) e agora rendem de 3% a 4%, ainda com risco. Os títulos pagam 1,2%, 1,6% e 2% ao mês. Os juros das contas saem da reserva do banco, e juros acima de 1% custam ao tesouro do reino. Um investidor que aplica em tudo multiplica o dinheiro por cerca de 2,8 em 10 anos (antes, por mais de 4 em só 5 anos).
- **👑 Reis com personalidade:** cada rei da IA é gastador, guerreiro, prudente ou devoto. Isso muda os impostos, os gastos, o uso do banco (o gastador pode quebrar o reino), as guerras e a paz, a chance de golpe, os mercenários e as leis. A personalidade vem do jeito de ser do rei e muda quando outro rei assume; ela aparece na janela do castelo.
- **⚖️ Leis e tribunal** (Reinado → Leis e tribunal): até 5 leis em vigor (proibir duelos, imposto sobre o vinho, liberdade de culto, toque de recolher, proibir o porte de armas, feira livre, escola para todos, caça real, fim da prisão por dívida, julgamento por combate). Cada lei agrada uns grupos e irrita outros e mexe na felicidade, no tesouro, na lealdade das famílias e em partes do jogo (preços, duelos, crimes). Todo mês chegam casos ao tribunal, com provas mais ou menos fortes: absolva, multe, prenda, exile, enforque ou, com a lei, decida no combate. Condenar inocentes ou soltar culpados mexe com a sua fama de juiz, e às vezes a verdade aparece depois.
- **⚔️ Mercenários** (taverna ou Portfólio → Gestão → Mercenários): seis companhias com nome, capitão, tamanho e preço. Lutam nas suas guerras e, num golpe, seguram a guarda real na porta da sala do trono. Com dois meses sem pagamento, a companhia troca de lado: vai para o inimigo, para quem trama contra você ou vira bando de saqueadores. Os reis guerreiros e as famílias golpistas também contratam.
- **🏅 Jogos dos Sete Reinos:** todo agosto, cada ano num reino, os heróis disputam a justa, o arco e flecha (com um minijogo de pontaria) e os duelos na arena do reino anfitrião, e o povo viaja para assistir. Há medalhas, ouro, fama, festa no reino campeão e um quadro de medalhas de todos os anos.
- **🧳 Viajantes:** os moradores frequentam outras vilas e reinos para fazer compras, visitar parentes e amigos, ver os Jogos, ir à feira, procurar trabalho ou passear. Você os vê andando pelas estradas quando está perto. Eles voltam com compras e amigos novos; às vezes se casam e se mudam, ou ficam famosos no lugar que visitaram.
- **📖 Crônica da dinastia:** um livro ilustrado, com iluminuras, letra capitular e páginas para virar, com a história da sua casa: um capítulo para cada herói da família (reis, guerras, golpes, eleições, falências, casamentos, Jogos). Abre sozinho quando o herdeiro assume e a qualquer hora pelo Diário.
- **🗺️ Mapa:** camadas novas com os bancos, as eleições (⚖️ quando há um empate esperando você), os reinos em crise ou em anarquia e os acampamentos de bárbaros.
- **🗳️ Eleições:** só concorre quem se inscreve (nos 3 meses antes da eleição); quem tem mais feitos e fama se candidata, e o governador costuma tentar a reeleição. Candidato não vota. Sem inscritos, o conselho da vila indica alguém.
- **📱 Celular:** as janelas grandes (banco, política, finanças, conselho de guerra, tribunal, mercenários, Jogos e o livro) foram revistas numa tela de 390 px, e o título das janelas não fica mais escondido pelas setas.

## Novidades: o banco do reino e a política

- **🏦 Banco do reino:** cada reino tem o seu banco, perto do castelo e com nome próprio. No reino que você governa, você funda o banco (Portfólio → o seu reino → Resumo → Fundar o banco), escolhe o lugar no mapa e dá o nome; o nome aparece na administração do reino, onde fica o tesouro nacional.
  - Lá dentro: caixas, mesa do escrivão, quadro das expedições, cofres particulares e a porta do cofre-forte, com banqueiro, caixa, guardas e clientes.
  - **Conta** que rende (os juros quem define é o rei); se o reino quebrar, a conta perde 60%.
  - **Aplicações** (títulos do Tesouro de 3, 6 e 12 meses): o dinheiro financia o reino e volta com juros; se o reino quebrar antes, vira pó.
  - **Empréstimos**, **emprestar aos moradores** e **investir** em famílias e vilas (tudo o que antes ficava na sua casa).
  - **Expedições de comércio** (caravana do sal, vinho, rota da seda, navio às ilhas e mina de prata): quanto mais longe, mais rende e maior o risco.
  - **Cofre particular** para guardar itens (5 🪙 por mês) e, de noite, com uma gazua, dá para tentar **arrombar o cofre-forte**.
  - **Tesouro Nacional** (só o rei, na sala do cofre): juros da conta do povo, pegar dinheiro do banco, emitir títulos, doar ou retirar ouro do tesouro, auditoria contra corruptos e renomear o banco.
- **💥 Falência:** quando o tesouro não paga as contas, o banco cobre o rombo enquanto tiver reserva e crédito. Sem isso o reino entra em crise; com 3 meses de crise ele quebra: o rei cai (você também perde a coroa), as vilas ficam sem dono, o povo vira bárbaro (acampamentos novos e saques) e um exército anarquista anda pelas terras até uma família forte fundar uma nova dinastia (ou alguém tomar o castelo do chefe anarquista). Vale para todos os reinos.
- **🗳️ Eleições nas vilas** (Portfólio → Sociedade → Política): o governador é eleito para um mandato de 5 meses (5 anos de vida). Ganha quem tem mais feitos pela vila (obras, doações, festas, investimentos e bandidos derrotados por perto), melhor relacionamento com os moradores e mais fama; os anciãos votam com peso 3. Quem governa, inclusive você, precisa se reeleger. **Empate:** numa vila de um reino, o rei decide (se o rei for você, a escolha aparece no sino de avisos e na página de Política; sem decisão em um mês, o conselho da vila escolhe). Numa vila sem reino, se quem já governava empatou, ele fica no cargo; se o empate for entre dois candidatos novos, o governador anterior decide.
- **👑 O trono:** a coroa passa de pai para filho, a não ser que alguém a tome. As únicas formas são matar o rei (na guerra ou na sala do trono) ou comprar todo o círculo do rei (general, tesoureiro, camareiro e capitão da guarda) e atacar sem que ninguém o proteja: com todos comprados, a guarda sai da sala do trono.
  - Suborne pela conversa ou pelo castelo; quem recusa pode contar ao rei.
  - Famílias descontentes dão golpes nos reinos da IA (às vezes você ouve o boato antes).
  - Contra você: uma família com pouca lealdade compra o seu conselho e manda soldados traidores atacar onde você estiver, sem a guarda ajudar. Se você vencer, a família é expulsa; se morrer, a coroa vai para os golpistas e o seu herdeiro fica com os outros reinos. O mestre espião pode descobrir o complô antes (Reinado → Espionagem).

## Novidades: o dobro de obras nas vilas (36 → 70)

- **34 obras novas** no menu Construção → Obras nas vilas, em ordem do mais barato ao mais caro:
  - **campo e criação:** Horta Comunitária, Campo de Cevada, Campo de Linho, Galinheiro da Vila, Pocilga da Vila, Pesqueira do Rio, Feira do Gado, Lenhador da Vila e Carvoeiro;
  - **ofícios e comércio:** Cesteiro, Forno Comunitário, Sapateiro da Vila, Açougue da Vila, Peixaria, Oleiro da Vila, Queijaria, Casa de Penhores, Mercado Coberto, Sede das Corporações e Casa da Moeda;
  - **povo e governo:** Cruzeiro, Lavadouro, Fonte Sagrada, Albergue dos Peregrinos, Correio, Posto da Guarda, Orfanato, Enfermaria, Bairro dos Artesãos e Paço do Concelho;
  - **grandes obras:** Termas, Mosteiro, Universidade e Catedral.
- Cada uma tem o seu desenho no mapa e rende algo todo mês: aluguel e comércio, trigo, madeira ou pedra para o reino, prosperidade, lugar para mais moradores ou a chance de atrair famílias novas.

## Novidades: janelas mais úteis e organizadas

- **🔔 Central de avisos:** um sino ao lado do seu retrato mostra quantas coisas precisam de você (pisca em vermelho quando é urgente): dilemas do conselho, audiências, complôs, barões revoltados, convites, encomendas com prazo, greves, parcelas atrasadas, quando você está sendo procurado, cônjuge carente, dívidas com amigos, eleições, leilões e guerras. Cada aviso tem um botão **Ir** que leva direto à janela certa.
- **Portfólio → Gestão:** Avisos, Finanças do reino, Negócios, Sociedade e Reinado viraram páginas do menu lateral do Portfólio (sem botões soltos).
- **💰 Finanças do reino:** extrato do mês (impostos, feudos, vassalos, tratados e alfândega contra soldo, decretos, orçamento, dívida e bobo), o saldo, em quantos meses o tesouro acaba, o gráfico do tesouro nos últimos 12 meses e os riscos (fome, revolta, inflação, guerra, guarnição fraca).
- **📖 Ficha do item:** no inventário e nas oficinas. Mostra para que serve (receitas, construções e insumos), onde conseguir (natureza, caça, lavoura, criações, empreendimentos, oficinas e lojas), os 3 reinos que pagam mais, quem gosta e o efeito. Itens sem uso mostram "Sem uso direto" em vez de "Usar".
- **Oficinas:** cada receita mostra o valor do que você faz, o custo dos ingredientes e o lucro.
- **Construção:** cada obra mostra o que rende por mês, o que consome, os salários e em quantos meses se paga; o menu lateral mostra quantas dá para erguer agora (✓).
- **Conversa:** barra até o próximo nível de amizade com o benefício que ele libera, o que a pessoa quer agora (presente favorito, luto, bebê, dívida, rivalidade, atenção) e o resto das etiquetas em "Mais sobre…".
- **Mapa com camadas:** ligue e desligue seus negócios, favoritos, guerras, religiões, feiras e leilões e feudos.
- **Conselho de guerra:** chance estimada de vitória no campo aberto, no assalto ao castelo ou defendendo as muralhas, e o que se ganha e se perde.

## Novidades: o reinado (Portfólio → Gestão → 👑 Reinado)

- **Conselho real:** tesoureiro, general, sacerdote e mestre espião, cada um com lealdade e ambição. Todo mês um deles traz um dilema (colheita perdida, terras para a igreja, soldo da tropa, espião capturado, empréstimo dos banqueiros, bandidos na fronteira, heresia, monopólio, nobre suspeito, muralhas, festa do padroeiro, imposto da nobreza) com consequências no tesouro, no povo e na reputação dos grupos. Sem resposta, o conselheiro decide por você. Conselheiros desleais e ambiciosos tramam.
- **Audiências:** súditos de todos os grupos pedem justiça, favores e terras ou acusam alguém (dá para mandar investigar). Cada decisão mexe na reputação.
- **Vassalos e feudos:** entregue vilas a nobres. Eles pagam tributo e mandam soldados nas suas guerras; dê honrarias (Barão → Conde → Marquês) para manter a lealdade. Barões insatisfeitos se revoltam: negocie ou esmague a revolta em 3 meses, senão a vila se separa do reino.
- **Espionagem e complôs:** infiltre espiões nos outros reinos (veja guarnição, tesouro e se planejam guerra contra você) e mande sabotar, roubar ou assassinar o herdeiro. Contra você: conselheiros, barões, um herdeiro impaciente ou um cônjuge estrangeiro podem tramar; o mestre espião, o bobo e a vigilância ajudam a descobrir; prenda, exile ou perdoe.
- **Herdeiros:** escolha o tutor de cada filho (guerra, diplomacia, administração ou fé); adultos, eles ajudam o reino de acordo com o que estudaram. Filhos preteridos ficam ressentidos e podem tramar.
- **Diplomacia:** tratados de comércio, de não agressão e de livre passagem; exija vassalagem de reinos fracos (tributo de 10% e soldados); peça reféns (o reino não ataca você); casamento real dos seus filhos com herdeiros de outros reinos, com aliança e direito ao trono (quando o rei de lá morrer, a coroa pode vir para você, ou começa uma guerra de sucessão).
- **Economia de Estado:** orçamento de exército, corte, obras e igreja; desvalorizar a moeda (ouro na hora, inflação depois) ou fortalecê-la; alfândega de 0 a 15%.
- **Exército:** até 3 generais (heróis e cavaleiros) com traços (Agressivo, Defensor, Estrategista, Veterano); a tropa tem moral e treinamento, que mudam a força no campo de batalha; com soldo atrasado e moral baixa, soldados desertam.
- **Corte e legado:** bailes, torneios reais e bobo da corte; o castelo cresce em 5 níveis (mais torres e brasões, felicidade, fama e portão mais forte nos cercos); com 2 reinos você vira Alto Rei e com 3, Imperador; e a crônica do seu reinado registra cada decisão.

## Novidades: sociedade (Portfólio → Gestão → 🤝 Sociedade)

- **Rede de amizades:** cada morador tem amigos, desafetos, um melhor amigo e um confidente (aparecem na ficha). O que você faz com alguém respinga no círculo dele: ajudar agrada os amigos e irrita os desafetos; ofender espalha.
- **Reputação por grupo:** nobreza, clero, povo, mercadores, guildas e submundo. Com +30 cada grupo abre uma porta (desconto em luxo, multas menores, o povo não te denuncia, preços melhores, recrutar mais fácil, mercado negro e informantes); com −30, fecha. Doações, esmolas, crimes, impostos, comércio e encomendas mexem nas notas.
- **Níveis de amizade:** Conhecido (10) → Colega (25: dicas de mercado e boatos) → Amigo (45: desconto) → Melhor amigo (70: empréstimo sem juros e defende você numa briga) → Confidente (90: conta segredos e testemunha a seu favor na prisão, cortando a multa pela metade).
- **Romance:** o cônjuge pede atenção (sem conversa, presente ou jantar, o casamento esfria e pode virar traição); flertar com outra pessoa dá ciúme; dá para confrontar os boatos, perdoar ou pedir o divórcio; a família paga dote no casamento; e você arranja o casamento dos seus filhos com outras casas, selando alianças.
- **Eventos:** dê banquetes escolhendo os convidados (vinho na mochila rende mais; desafetos na mesma mesa brigam). Moradores convidam você para casamentos, batizados e aniversários: vá até a vila e confirme; faltar ofende.
- **Segredos:** venha a saber pelos confidentes ou por informantes do submundo; depois guarde (confiança), espalhe (derruba a pessoa, que pode virar sua rival) ou chantageie (ouro, com risco de denúncia).
- **Honra:** insultar alguém na frente dos outros cria um rival, que desafia para duelo de honra (até alguém cair, ninguém morre). Recusar mancha o nome. Quem perde um pai ou mãe pelas suas mãos jura vingança e, adulto, vem cobrar.
- **Política local:** cada vila elege o chefe todo ano; o conselho de anciãos tem voto triplo. Candidate-se, faça comícios ou apoie um candidato (se ele vencer, vira seu aliado). Vencer dá o governo da vila.
- **Visitas e jantares:** ao dormir em casa, às vezes alguém bate à porta (um amigo com presente, um cobrador, um vizinho reclamando); convide quem quiser para jantar (precisa de uma comida preparada).

## Novidades: ordens famosas, religiões reais e o nome da sua guilda

- **Sua guilda com o nome que você quiser:** ao fundar, você escreve o nome (há sugestões); dá para renomear depois no painel.
- **As guildas do mundo são ordens famosas:** Maçonaria (pedreiros, carpinteiros, oleiros), Illuminati (mercadores e banqueiros), Cavaleiros Templários (ferreiros e armeiros), Cavaleiros Hospitalários (padeiros, cervejeiros, taverneiros), Ordem Teutônica (caçadores, curtidores, arqueiros), Priorado de Sião (tecelões e alfaiates) e Ordem Rosa-Cruz (curandeiros, alquimistas e magos).
- **Religiões reais:** Cristianismo (Midgard), Islamismo (Dorne), Paganismo Nórdico (Winterfel), Judaísmo (Valáquia), Budismo (Olympus), Zoroastrismo (Babilônia) e Hinduísmo (Gondor). Cada templo leva o nome da fé (igreja, mesquita, sinagoga, mosteiro, templo, templo do fogo, salão dos deuses) e cada fé dá um dom a quem a segue.

## Novidades: economia viva, guildas, religiões e culturas

- **Cadeia de produção:** os empreendimentos que transformam gastam insumos todo mês (o moinho gasta trigo, a padaria farinha e ovos, a ferraria minério e carvão, a vidraria areia...). O responsável usa primeiro o depósito do negócio (você entrega da mochila), depois o que os seus outros negócios produziram e, por fim, compra no mercado do reino. Sem insumo, produz menos.
- **Oferta e procura:** vender muito do mesmo item num reino derruba o preço lá por alguns meses; comprar muito, sobe. Reinos ricos pagam mais pelo luxo, e cada povo paga 25% a mais pelo que gosta.
- **Encomendas:** o exército, as obras, as tavernas, a corte e a sua guilda fazem pedidos com prazo e recompensa (ouro, fama e relação). Atrasar custa relação e fama.
- **Manutenção e riscos:** os prédios se desgastam e produzem menos (conserte no painel); incêndio e roubo podem acontecer (torres, quartel ou pelourinho por perto afastam ladrões). O seguro cobre as perdas.
- **Funcionários:** de Aprendiz a Mestre com o tempo; produzem mais e ganham aumento. Insatisfeitos fazem greve; a concorrência tenta levar os bons (amizade alta os segura).
- **Guildas:** 7 guildas de ofício com mestres e membros de verdade. Entre numa (preços combinados e encomendas melhores) ou **funde a sua** (2 negócios e 500 🪙) e **recrute gente das outras guildas** conversando com elas: quem não tem guilda pede amizade 20; membro, 35; experiente, 50; mestre de guilda, 70. Cada membro paga 3 🪙 por mês e aumenta a produção dos seus negócios.
- **Feiras e leilões:** feiras de estação (e as festas dos povos) num reino por vez; leilões de itens raros nos castelos.
- **Sócios:** um morador rico entra com 40% do valor do negócio e leva 30% do lucro; dá para comprar a parte dele depois.
- **Painel dos negócios:** lucro, quanto já devolveu, estado, insumos, funcionários, seguro, sócio, encomendas, guildas, feiras e o livro de ocorrências. Abre na janela de cada empreendimento e no Portfólio.
- **Religiões:** cada fé tem um dom: Cristianismo (fé e cura), Islamismo (comércio), Judaísmo (experiência), Budismo (magia), Hinduísmo (colheitas e criações), Zoroastrismo (forja) e Paganismo Nórdico (golpes mais fortes). Converta-se num templo (capelas e catedrais seguem a fé do reino) ou com um sacerdote; como rei, decrete a sua fé no reino. Reinos da mesma fé se aproximam; de fés diferentes, se estranham.
- **Culturas:** cada reino tem o seu povo (Midgardianos, Dorneses, Nortenhos, Valacos, Olimpianos, Babilônios, Gondorianos), com valores, saudação, gostos (que mexem nos preços e nos presentes) e uma festa anual.

## Novidades: tudo em ordem, do mais fácil ao mais difícil

- Todas as listas do jogo seguem a mesma regra: do mais barato (mais fácil) ao mais caro (mais difícil), pelo valor de mercado de tudo o que custa. Vale para cada categoria do menu Construção (a Moradia vai da Choupana ao Castelo, o último), as obras nas vilas, as receitas de cada oficina, as mercadorias das lojas (comprar e vender), o arsenal, os investimentos e as obras da coroa. As ferramentas grátis de Infraestrutura (tirar estrada, mudar, demolir) ficam no fim.

## Novidades: o dobro de tudo, assalto ao castelo e favoritos

- **O dobro de construções:** Moradia 15 · Produção 20 · Fazenda e animais 20 · Empreendimentos 45 · Praça e decoração 20 · Cultura, fé e treino 10 · Baús e estábulo 10 · Defesa e exército 10 · Infraestrutura 15.
  - **Moradias:** barraca de viagem, casa na árvore, casa comprida, casa de fazenda (+20% nas criações perto), sobrado, torre de pedra, mansão e palacete. Todas salvam e dão descanso; a maioria dá seguidores, aluguel e fama.
  - **Oficinas:** serraria manual, fundição (latão, estanho-chumbo, eletro, mithril), vidraria, bancada de ourives, tinturaria, lagar, moenda de pedra, torre do mago (pergaminhos, cajados, varinhas) e oficina do armeiro.
  - **Criações:** vinhedo, olival, cabril, sirgaria (seda), lago dos patos, coelheira, lupulal e campo de girassóis.
  - **Empreendimentos (22 novos):** vidraria, tinturaria, lagar de azeite, fundição, armaria, arcoaria, casa do escriba, loja de magia, açougue, alfaiataria, sapataria, barbearia, casa de banhos, cavalariça de aluguel, estaleiro, carvoaria, salina, tanoaria, perfumaria, teatro, canteiro de pedra e cordoaria. Cada um emprega moradores, produz, tem balcão e loja próprios.
  - **Praças:** coreto, obelisco, poço dos desejos, lago ornamental, arco triunfal, topiaria, estátua equestre, pelourinho (menos ladrões) e barraca de feira. Perto de uma vila, elas aumentam o poder econômico dela (o nível sobe) e deixam o reino mais feliz.
  - **Cultura:** capela particular, observatório (previsão do tempo e das secas), liça de justa e círculo de pedras (magia mais forte).
  - **Guarda:** celeiro (vira o trigo em farinha), armazém grande, cofre (ouro a salvo, rende 1% ao mês), garagem de carroças (+100 de carga) e casa de gelo.
  - **Defesa:** balista, fosso com estacas, estábulo de guerra (+cavaleiros nas batalhas) e oficina de cerco (máquinas 30% mais baratas).
  - **Infraestrutura:** guindaste (obras perto custam menos), cisterna (rega as plantações), moinho de vento, rede de esgoto, atracadouro, posto de pedágio e posto de muda (viagem rápida entre os seus postos).
- **O dobro de itens (449):** 42 matérias-primas novas (madeiras, pedras, gemas, minérios, ervas raras, partes de monstros, frutos das criações), 25 materiais (vidro, ligas, tintas, tecidos tingidos, papel, sabão...), 16 ferramentas com função, 21 armas (bestas, montantes, alabardas, cajados mágicos), 38 armaduras (conjuntos de mago, patrulheiro, escamas, prata, mithril, nobre e dragão), 52 comidas, bebidas e poções e 27 objetos.
  - Cada matéria-prima tem origem (árvores, rochas e veios dão itens a mais, monstros deixam partes, criações produzem, a pesca traz conchas, algas e mexilhões) e entra em alguma receita; tudo é vendido em lojas ou feito numa oficina.
  - **Ferramentas:** foice (+colheita), tesoura (lã das ovelhas), faca de esfolar (+couro), rede de pesca, lanterna, luneta, gazua, martelo de carpinteiro (obras 15% mais baratas), serrote, tenaz, forcado, bússola, tocha, armadilha (caça todo mês), fole (economiza carvão) e pilão (+poções).
  - **Magia:** cajados e varinhas gastam energia em vez de flechas (fogo queima, gelo deixa lento, tempestade salta de um inimigo para outro); pergaminhos lançam bola de fogo, relâmpago, cura, retorno para casa, pressa e proteção; vestes de mago fortalecem as magias.
  - **Objetos:** instrumentos (toque na taverna para ganhar ouro e fama), dados, tomo do conhecimento, mapa do tesouro, orbe de cristal, água benta, incenso, relíquia, amuleto da sorte e corneta de guerra.
  - 6 lavouras novas: abóbora, cebola, nabo, feijão, alho e ervilha.
- **Guerra:** cada castelo tem até **30 soldados** e cada exército leva até **10 catapultas**.
- **Assalto ao castelo:** no Conselho de Guerra escolha **batalha em campo aberto** (enfraquece a guarnição do inimigo) ou **invadir o castelo**. No assalto, o castelo inimigo tem muralhas, torres, portão e torre de menagem: arrombe o portão (catapultas, aríetes do arsenal, soldados e os seus golpes), entre no pátio e derrube o rei; vencer = o reino é seu. Quando o inimigo é mais forte, às vezes é ele que cerca o **seu** castelo: os arqueiros atiram das muralhas, e se você cair o reino cai. No castelo inimigo, "🏰 Convocar o exército" abre o conselho na hora.
- **Favoritos:** na conversa, "☆ Favoritar" marca a pessoa com uma estrelinha discreta ao lado da cabeça, uma estrela no mapa e no minimapa, e uma seção "Favoritos" no mapa para marcar como destino.

## Novidades: reinos começam pequenos

- **Cada reino começa com uma vila só.** As outras surgem com o tempo, fundadas pelas famílias ricas e pelos reis. Vale para jogos novos; os jogos já salvos continuam com o mapa que tinham.

## Novidades: mais bebês

- **Natalidade maior:** as casadas de 18 a 42 anos engravidam com mais que o dobro da chance de antes (7,5% ao mês) e os gêmeos ficaram mais comuns. O freio das vilas lotadas só age quando a vila está bem acima do que comporta, e o mundo aguenta mais gente antes de os nascimentos rarearem. Resultado: cerca de 60% mais nascimentos.

## Novidades: vilas e castelos desbravados

- **Os moradores desmatam de verdade:** todo mês, mesmo longe de você, cada vila corta árvores e quebra pedras do centro para fora, e a área limpa cresce com o nível da vila; em volta dos castelos também. A madeira e a pedra vão para o armazém do reino. Ficam de pé as árvores que dão fruta e algumas de sombra, e os veios de minério continuam lá.
- **Terra ocupada não rebrota:** dentro e em volta das vilas e dos castelos, o que é cortado ou quebrado (por você ou pelos moradores) não cresce de novo. No campo, a natureza volta como sempre.

## Novidades: o jogo mais leve com muita gente

- **Pessoas desenhadas até 20 vezes mais rápido:** cada figura agora serve para as duas direções (a outra é o espelho) e a memória guarda as que estão na tela. Antes, com muita gente andando, o jogo descartava e redesenhava figuras sem parar.
- **Bandeiras tremulando** são pré-desenhadas uma vez em 12 posições da onda, em vez de recortadas de uma imagem a cada quadro.
- **A cópia de segurança automática** (que junta e compacta o jogo inteiro) passou de a cada 20 segundos para a cada 2 minutos, e só com você parado ou numa janela — nunca no meio de uma caminhada.

## Novidades: moradores mais trabalhadores

- **Coletam mais:** além de camponeses, andarilhos e mendigos, os lenhadores, pedreiros e caçadores sem loja também cortam árvores e quebram pedras (o lenhador prefere árvores; o pedreiro, pedras), vão mais longe de casa e descansam menos entre uma coleta e outra. Longe de você, cada vila também coleta todo mês: madeira e pedra para o armazém do reino e renda para as famílias.
- **Abrem mais negócios:** cada família pode ter até 3 empreendimentos (antes 2), com menos dinheiro guardado, e cada vila comporta mais negócios conforme cresce.
- **Melhoram as estradas do mapa inteiro:** as caravanas melhoram o caminho por onde passam (até o calçamento de pedra), e cada reino cuida das estradas de todo o seu território, pago pelo tesouro, até o nível que as suas vilas já alcançaram.

## Novidades: soldados por todo o reino

- **A guarnição se espalha pelo reino:** só uns poucos (até 6) guardam o castelo, espalhados em volta dele; o resto é repartido entre as vilas do reino — as maiores primeiro, até 8 por vila, cada soldado num canto — e os que sobram patrulham as estradas do território.
- **Os cavaleiros e as damas cavaleiras também:** cada um guarda um lugar — o castelo ou uma das vilas do reino, em rodízio — e não ficam mais amontoados na frente do portão. Ao recrutar, o aviso diz para onde o soldado novo foi.
- **Os seus guardas também:** os capangas que você manda guardar uma vila ficam espalhados por ela; os que você manda para o castelo cobrem o reino inteiro, uns em volta do castelo e os outros pelas vilas do reino.
- **Muralha só de quem manda:** perto de uma vila, só o governador dela ou quem governa o reino a que ela pertence ergue muro ou põe portão. Longe das vilas, os muros da sua base continuam livres.

## Novidades: um muro só

- **A muralha da vila e o seu muro agora são a mesma coisa.** A Muralha saiu de Obras nas vilas: use o **Muro de Pedra** (ou a Paliçada) em **Defesa e exército** — o governador e o rei erguem dentro da vila e em volta dela, e ele serve de muralha, se emenda nos outros muros e recebe o portão.
- **Clique e arraste** para erguer vários trechos de muro de uma vez.
- **No mapa,** os seus muros têm a mesma cor da muralha da vila (a cor do reino onde estão), e não mais o dourado das suas construções.

## Novidades: portão em qualquer lugar entre muros

- O **portão** pode ir em qualquer lugar **entre muros**: na muralha da vila ou nos seus muros de pedra e madeira, perto ou longe das vilas. Basta ter muro dos lados (a até 4 blocos) ou pôr em cima de um trecho de muro. Não vai sobre outro imóvel nem sobre vegetação.
- Quem pode: o governador da vila ou quem governa o reino. O portão fica ligado à vila sua mais próxima, que recebe o pedágio; na defesa contra ataques, só conta o portão que fica na muralha da própria vila.

## Novidades: cemitério, arena e catedral em qualquer lugar

- Quem governa um reino pode **erguer e mudar o cemitério e a arena para qualquer lugar do mapa** — dentro ou fora do reino, perto ou longe das vilas. Só não pode em cima de outro imóvel, de estrada ou de vegetação (corte as árvores e tire as pedras antes).
- **Erguer:** Construir → Obras nas vilas → Cemitério (40 pedras, 20 madeiras) ou Arena → "Escolher o lugar no mapa". **Mudar:** Obras nas vilas → Mudar de lugar, clique nele e depois no lugar novo.
- **A catedral** do reino também pode ser mudada para qualquer lugar (Obras nas vilas → Mudar de lugar), com as mesmas regras.
- Os três são do reino: as lápides da família e os torneios continuam valendo onde quer que estejam, e tudo fica guardado no jogo salvo.

## Novidades: janelas de negociar mais confortáveis

- **Loja e Balcão redesenhados:** comprar e vender lado a lado, cada lista com a sua própria rolagem. Linhas e colunas de tamanho fixo: ao clicar, nada sai do lugar — dá para clicar várias vezes seguidas no mesmo botão.
- **Botões maiores** (1, 10 e "Tudo" para vender), com o principal em dourado; itens que você não pode comprar ficam apagados.
- No topo, o dono com retrato, o seu ouro, a bolsa do dono e o desconto de amizade; no Balcão, os botões − e + do preço ficam ao lado do valor.

## Novidades: a ficha de cada morador e mais o que fazer junto

- **Aba "📋 Ficha" na conversa:** estado civil (casado com quem, viúvo, solteiro, de olho em alguém), filhos, pais, irmãos e a casa da família — clique num nome para conversar com essa pessoa; ofício, loja, carreira e mestre, riqueza, moradia, cavalo, dívidas e fama; personalidade, humor, do que gosta, sonho, força e inteligência; o que a pessoa lembra de você e as notícias da vida dela. O estado civil também aparece logo abaixo do nome.
- **Segredos:** quanto a pessoa tem guardado, do que gosta, o sonho e por quem está apaixonada. Descubra com amizade ou pagando uma bebida.
- **Novas interações:** 🍺 pagar uma bebida, 🎲 jogar dados (10 🪙), ⚔️ treinar juntos (ganha experiência), 📖 ouvir histórias dos mais velhos, 🧭 pedir um conselho (comerciantes contam o que está em falta; soldados, onde há bandidos), 🎉 dar os parabéns, 🕯️ dar os pêsames, 🤲 perdoar uma dívida e 💘 bancar o cupido (pode terminar em casamento!).

## Novidades: janelas padronizadas

- **Tamanho das janelas:** as principais, as de negociar e o baú ocupam a tela inteira; no computador, as de pouco conteúdo (pontos de nível, presentear, fazenda, estábulo...) têm o tamanho do conteúdo, no centro da tela. No celular, todas ocupam a tela inteira.
- **Cena de abertura:** cada janela começa com uma faixa colorida com o medalhão do lugar, o título, uma frase e os números que importam (seguidores, trigo do mês, ouro guardado, força do inimigo...). As janelas sobre uma pessoa (presentear, contratar, profissão, casamento, guarda, equipar) mostram o retrato dela.
- **Cartões grandes** no lugar das listas de botões (taverna, castelo, quartel).
- A faixa vermelha da guerra não cobre mais o título das janelas; a ajuda explica que o E é para as coisas e o clique é para as pessoas.

## Novidades: a vida dos moradores à vista

- **O Pregoeiro (Diário → Notícias):** tudo o que acontece no mundo vira notícia, separada em Gente, Negócios, Famílias, Vilas e Reinos: casamentos, nascimentos, mortes, novos mestres de ofício, negócios abertos, brigas de famílias, vilas que crescem ou caem, secas, escassez e guerras. Todo mês o pregoeiro anuncia a manchete.
- **Gente em destaque:** quem ganha fama aparece no topo; clique para conversar.
- **Os moradores sobem na vida:** o oficial ou mestre de ofício junta as economias e abre um negócio com a família; o soldado mais valente é armado cavaleiro pelo rei; o comerciante rico compra um título e passa a ser chamado de Dom ou Dona. E quem vai mal também aparece: a loja que quase não vende.
- **Balões no mundo:** perto de você, os moradores mostram o que estão vivendo (💍 casou, 👶 bebê, 🖤 luto, 🏅 virou mestre, 🛡️ cavaleiro, 🐎 cavalo novo, 💸 apertado, 😠 bravo...) e às vezes falam sozinhos quando você passa.
- **Na conversa:** a fama da pessoa e as últimas notícias da vida dela.

## Novidades: visual das pessoas

- **Rosto masculino novo:** queixo e mandíbula marcados, olhos com íris e brilho, sobrancelhas grossas, nariz com volume e boca desenhada.
- **Roupa de cada ofício** (homens e mulheres): avental de couro (ferreiro, armeiro, pedreiro), avental branco (padeiro, taverneiro, curandeiro), batina com gola branca e cruz (padre, ermitão), casaco com botões dourados (comerciante), gibão bordado a ouro com joia (rei, rainha e herdeiros), camisa listrada (marinheiro), veste de pele (caçador) e roupa remendada, às vezes com chapéu de palha (camponês). Quem veste uma armadura ou roupa comprada usa a dela.

- **22 penteados:** curto, longo, longo ondulado, médio, chanel, joãozinho, repartido de lado, rabo de cavalo, rabo baixo, maria-chiquinha, tranças, trança coroa, coque, coque no alto, cacheado, black power, dreadlocks, espetado, raspado dos lados, moicano, tonsura de monge e careca.
- **13 barbas:** sem barba, por fazer, curta, cheia, longa, bifurcada, trançada, bigode, bigode guidão, cavanhaque, pera, contorno e costeletas.
- **Mais cores de cabelo:** castanho claro, acaju, loiro claro e preto-azulado.
- **Visual feminino caprichado:** corpete com cintura e busto, vestido longo e rodado que balança ao andar, faixa com laço, ombro bufante, rosto oval, olhos amendoados com cílios e brilho, lábios e blush.
- **Espelho:** em casa, mude penteado, barba, cor do cabelo e cores da roupa a qualquer momento.
- Os moradores nascem com todos esses estilos, e alguns padres usam tonsura.

## Novidades anteriores: vida real para você e para os NPCs, heróis dos reinos

- **Gravidez de verdade:** dura 9 meses, a barriga aparece aos poucos, e o parto tem risco. Uma parteira (moradora mais velha da vila, contratada na conversa por 40 🪙) e um enxoval (vendido no armazém) deixam o parto bem mais seguro. Às vezes nascem gêmeos.
- **Funerais e luto:** quem morre ganha cortejo até a capela e túmulo com nome. A família fica de luto, mais triste e trabalhando menos. Comparecer ao enterro aumenta a amizade.
- **Testamento e herança dos NPCs:** a bolsa do falecido é dividida entre os filhos. Às vezes os irmãos brigam pela herança; no seu reino, a disputa chega ao tribunal.
- **Emoções e memória:** as pessoas lembram do presente, da ajuda, da ofensa ou do roubo, e o humor (alegria, raiva, tristeza, inveja) muda o que elas dizem.
- **Boatos:** notícias correm de vila em vila (nascimentos, mortes, crimes, feitos dos heróis). Pergunte as novidades na conversa ou na taverna.
- **Carreiras:** crianças sonham com uma profissão e vão à escola de manhã. Aos 12 anos viram aprendizes, depois oficiais e mestres. Os velhos se aposentam e o melhor aprendiz assume a oficina.
- **Empréstimos e dívidas:** peça dinheiro ao tesouro do reino (castelo) ou a um comerciante. Parcelas mensais; atrasar traz cobradores e, depois, a lei. Os NPCs também se endividam e podem perder a loja.
- **Crime com consequência:** se alguém vê o crime, o reino passa a procurar você. O guarda dá voz de prisão: pagar a multa, cumprir pena, trabalho forçado ou resistir (e os guardas atacam). Ladrões roubam casas à noite, inclusive as suas (cão de guarda, lampião e arca reforçada ajudam).
- **Aluguel:** alugue as suas casas para famílias da vila e receba todo mês. Quem não paga é despejado; quem junta dinheiro compra casa própria.
- **Escassez:** secas no verão, falta de trigo e guerras encarecem comida e ferro. Na fome o povo faz fila no armazém e, revoltado, saqueia.
- **Conversar com todos:** guardas e soldados agora podem ser clicados para conversar, como qualquer pessoa (só não quem está lutando contra você).
- **Mapa (jogos novos):** Valáquia fica agora no norte, entre Winterfel e Olympus; o leste, onde ela ficava, virou terra selvagem. Jogos salvos antigos mantêm o mapa deles.
- **Heróis dos reinos:** cada reino tem 3 guerreiros famosos com apelido ("o Bravo", "Mão de Ferro"...), fama, vitórias e uma lista de feitos. Eles lutam nas guerras, duelam com heróis inimigos e aparecem montados no campo de batalha. Quando caem, viram lendas, com crônica e lápide. Os velhos penduram a espada. Veja todos em **Diário → Heróis** e converse com eles.

## Novidades anteriores: vilas até o nível 10 e fundação mais cara

- **Atacar pessoas e golpe de estado:** na conversa, "⚔️ Atacar" faz a pessoa revidar (na rua ou dentro dos prédios) e derruba a amizade. Atacar alguém da corte ou da família real chama os guardas do reino que estiverem por perto. Na sala do trono, "🗡️ Atacar o soberano" coloca toda a guarda real (4 a 8 soldados de elite, conforme a guarnição) contra você ao mesmo tempo, e o soberano é muito forte (900 de vida, golpes pesados). Seus capangas entram com você na sala do trono. Se o soberano morrer ali, você toma a coroa como **usurpador**: o povo fica infeliz, os outros reinos desconfiam, os nobres perdem lealdade e o herdeiro jura vingança. Sem o melhor equipamento e o máximo de capangas, é morte certa.
- **Inimigos declaram guerra:** se a relação com alguém cai a -50, a casa dele declara guerra à sua família: vira inimiga (desfaz aliança), contrata assassinos, os adultos dela atacam você quando o encontram e, todo mês, pode mandar mais assassinos. Acaba com o pedido de paz (sua casa precisa ser mais influente).
- **Biomas e mapa maior (jogos novos):** a terra firme cresceu 20% e ganhou **tundra** (entre a neve e o campo: pinheiros, líquen e veios de âmbar), **estepe** (capim seco, acácias e arbustos), **deserto** (dunas, cactos, rochas de arenito, salinas e tamareiras nos oásis) e **pântanos** (brejos com lagoas, salgueiros, juncos, cogumelos e turfeiras). A passagem de um bioma para o outro é gradual: faixas de transição e cores que se misturam nas bordas.
- **Portão em muralha vertical ou horizontal:** o portão se ajusta ao muro em que está (muro à esquerda e à direita: muralha horizontal; em cima e embaixo: vertical) e vale para qualquer muro da vila — a muralha original, trechos novos do governador ou o seu muro de pedra ou madeira. Basta pô-lo onde a estrada atravessa o muro.
- **Demolir e mudar qualquer muralha sua:** o governador demole e muda de lugar as muralhas e os portões da vila dele, dentro e fora dela; os seus muros de pedra e madeira valem em qualquer lugar. No modo Demolir, um clique num trecho de muro derruba na hora (sem confirmação) e arrastar derruba vários.
- **Personagens femininas mais bonitas:** rosto oval e delicado, olhos amendoados maiores (íris, dois brilhos e cílios com o canto levantado), sobrancelhas finas em arco, nariz pequeno, lábios em coração, blush suave e brilho no cabelo (sem brincos, colares nem flores no cabelo).
- **Reino do zero:** o Castelo (Construir → Moradia) funda o seu reino só com os materiais, sem precisar de vila e sem o ouro extra: erga-o em terra selvagem, longe dos outros castelos (uma vila livre sua por perto entra no reino).
- **Governador da vila:** o antigo "chefe da vila" agora se chama governador (ou governadora).
- **Investir nas vilas** (casa → Finanças → Vilas e reinos): o dinheiro vira obras, comércio e empregos — aumenta o poder econômico da vila e rende 1,5% ao mês; o valor cai 2% ao mês (as obras envelhecem) e dá para retirar com 20% de perda.
- **Empreendimentos em outros reinos:** compre a licença de comércio do reino (200 🪙, sem guerra e sem inimizade forte) e construa nas vilas dele; o reino cobra 10% do lucro de imposto.
- **Ataques vêm de fora dos muros:** num saque, os inimigos chegam diante do portão (ou além da muralha), o portão fecha e eles tentam arrombá-lo enquanto os soldados da vila defendem do lado de dentro. O portão tem resistência (300): arrombado, os inimigos entram e ele não fecha mais até ser consertado (15 madeiras e 15 pedras, na janela do portão). Bichos selvagens não nascem mais dentro dos muros, e os predadores ficam longe das vilas.
- **Concorrência com motivo:** cada empreendimento seu numa vila tira fregueses das lojas que vendem o mesmo (e o dono perde dinheiro). A família dona junta rancor — com 30 reclama, com 60 sabota (rouba o caixa ou a prateleira) e com 90 declara guerra à sua família —, sempre avisando o motivo. Preços justos fazem o rancor crescer devagar; vender barato dobra. Indenizar ou investir nos negócios deles acalma (Portfólio → Empreendimentos → Concorrência).
- **NPCs em destaque:** todo mês, os comerciantes que mais enriqueceram viram notícia; quem se destaca várias vezes fica conhecido na região.
- **Finanças em casa** (botão Finanças na sua casa): **Poupança** que rende 1% ao mês e fica a salvo dos ladrões; **Emprestar** a moradores que pedem dinheiro (todo mês aparecem pedidos com valor, juros, prazo e a chance de pagarem em dia) — no prazo eles devolvem com juros; quem não puder paga parte e ganha mais prazo, e o calote vira boato; **Investir** nos negócios de outras famílias (empreendimentos delas e as lojas que administram), até 3000 🪙 em cada uma, recebendo parte do lucro todo mês (há meses fracos; se a família perder os negócios, você recupera metade; resgatar custa 10%).
- **Seus empreendimentos como loja de verdade:** o responsável (o primeiro funcionário) põe a produção na prateleira, vende aos fregueses, repõe a mercadoria do ramo no atacado com parte do que vendeu, paga os salários com o caixa e todo mês te entrega o lucro (ficam 40 🪙 no caixa). No Balcão você define o **preço de cada item** (de 50% a 250%), compra como um freguês (o dinheiro volta como lucro) e vende para a loja. A venda automática antiga saiu: tudo passa pela prateleira.
- **Administração da vila** (Portfólio → Suas vilas, para cada vila em que você é governador): Resumo (nível, barra até o próximo nível, crescimento por mês, em quantos meses sobe, poder econômico e de onde vem o crescimento), Economia (cada parte do poder econômico, rendas, portões e dicas do que construir) e Gente e obras (lojas e obras com o responsável, pôr alguém nas vagas, moradores e lugar para morar).
- **O nível da vila sobe pelo poder econômico dela:** moradores, lojas e obras com responsável, aluguéis das obras, negócios das famílias, feira/chafariz/estátua e caravanas pelo portão. Todo mês a prosperidade cresce conforme esse poder (casas em ruína e saques puxam para baixo), e cada nível exige uma economia maior. No ritmo do jogo, uma vila leva uns 48 meses para ir do nível 1 ao 3–4 (menos se for saqueada ou estiver num reino em guerra).
- **Seus empreendimentos com poucos funcionários:** no máximo 2 por empreendimento — produzem o mesmo que antes com menos gente (e menos salário).
- **Você define o preço** dos produtos de cada empreendimento (60% a 200%): mais caro rende mais por venda, mas os fregueses levam menos (o resto fica guardado); mais barato vende tudo.
- **Cada estabelecimento com a sua mercadoria** (padaria, cervejaria, laticínio, joalheria, olaria, curtume, pesqueiro, botica, cerieiro, carpintaria, casa de câmbio...) e **25 itens novos**: farinha, pão doce, pão de centeio, biscoito, sidra, cerveja preta, uva, peixe salgado, chá de ervas, antídoto, manteiga, coalhada, tecido de linho, óleo de peixe, cera de abelha, telha, barril, lenço bordado, bolsa de couro, sela, pérola, broche de prata, lamparina, vaso vidrado e cadeira de madeira. Os seus empreendimentos também passam a produzir alguns deles.
- **Mais leve:** a virada do mês ficou 3× mais rápida (o mapa não é mais redesenhado inteiro quando os moradores abrem caminhos, evoluem estradas ou constroem casas).
- **Empreendimentos em duas páginas** (Portfólio → Empreendimentos): a aba "📒 Contas e painel" mostra as contas de todos os empreendimentos e o painel do dono, em tamanho grande; a aba "💼 Seus empreendimentos" mostra o resultado de cada um e os cartões para abrir cada empreendimento.
- **O que está equipado não aparece para vender:** nas lojas (e no balcão dos seus empreendimentos) só aparecem os itens que você não está usando; se tiver dois iguais e um equipado, só o extra é vendido.
- **Dormir na estalagem por 10 Salin:** dentro da estalagem da vila, as camas alugam a noite — dorme até o amanhecer (vida e energia cheias, o jogo salva) e o dinheiro vai para o responsável.
- **No campo de batalha, a luta só acaba quando você cai** (ou quando cai o último inimigo): o rei do seu lado pode cair e o seu exército inteiro também — enquanto você estiver de pé, a batalha continua, com os avisos "O rei do seu lado caiu" e "Você luta sozinho!".
- **Torre do porteiro:** ao lado do portão, no muro, com um trecho de muro entre os dois (à esquerda numa muralha horizontal, em cima numa vertical), fica uma torre de vigia com plataforma de madeira e bandeira; o porteiro monta guarda lá em cima, dia e noite, e se vira para os inimigos quando o alarme toca. Para falar com ele, use a janela do portão.
- **Porteiro é um soldado contratado pelo governador:** ninguém assume o portão sozinho. Na janela do portão, o governador escolhe um morador e o contrata como Soldado Porteiro (40 🪙 de alistamento e 8 🪙 de soldo por mês); ele recebe elmo, cota de malha e espada. Dá para dispensar. Sem porteiro, o portão não revista, não prende procurados e não segura os saques.
- **Portão sem estrada:** o portão pode ir em qualquer chão firme na linha de um muro, ou em cima de um trecho de muro (que dá lugar ao portão, abrindo uma passagem). O portão de muralha vertical virou uma torrezinha de entrada, bem visível.
- **Muralha à vontade:** o governador ergue trechos de muralha em qualquer lugar da vila e logo em volta dela (até 26 blocos do centro), quantos quiser, clicando e arrastando como nas estradas (1 pedra por trecho).
- **Construir colado nas suas vilas e no seu reino:** nas vilas em que você é governador e nas do reino em que você é rei, dá para construir encostado em qualquer construção, inclusive emendar o seu muro na muralha da vila (ele se liga a ela, com torre na junção). Nas cidades dos outros continua valendo a distância de 2 blocos.
- **Portão da vila** (Construir → Obras nas vilas, só o governador): instale o portão sobre a estrada, na linha da muralha — as laterais da passagem são fechadas com muralha sozinhas. Com ele (clique no portão):
  - **Pedágio das caravanas** (0 a 40 🪙): cada caravana que atravessa paga. Caravana que passa aquece o comércio da vila; pedágio caro faz caravanas reclamarem (cai a relação) ou darem meia-volta.
  - **Entrada dos forasteiros** (0 a 5 🪙 por pessoa, todo mês) — taxa alta esfria a vila.
  - **Revistar as cargas:** apreende contrabando (multa) e barra ladrões de fora.
  - **Fechar diante de inimigos:** bandidos, feras ou soldados inimigos por perto e o portão fecha — fechado, ninguém atravessa. Com o porteiro, a vila segura metade dos saques e resiste a parte das tentativas de tomada.
  - **Toque de recolher:** fechado à noite (o porteiro ainda abre para as caravanas).
  - **Porteiro** (o responsável, salário de 5 🪙 por mês): fica de guarda, abre para quem pede passagem e dá voz de prisão a quem é procurado no reino.
  - **Livro do portão:** anota caravanas, pedágios, revistas, alarmes, ataques e quem entrou.
- **Tecla E só para as coisas:** o E (e o botão Interagir no celular) agora serve só para portas, baús, prédios e móveis. Para conversar com uma pessoa, clique nela (ou toque no balão 💬 Conversar que aparece sobre quem está perto).
- **Arsenal:** clique no seu Arsenal (ou no móvel lá dentro) para comprar **catapultas** (400 🪙 + madeira e pedra) e **aríetes** (250 🪙 + madeira), que ficam guardados no arsenal; dá para pegar um para a mochila e montar num cerco. Até 4 catapultas do arsenal vão sozinhas com o seu exército para o campo de batalha, e as que sobrevivem voltam. Também equipa a tropa para sempre: **lanças de aço** (+15% de dano), **escudos reforçados** (+20% de vida), **arcos longos** (arqueiros +25% de dano) e **armaduras para cavalos** (cavaleiros +30% de vida). Armas e armaduras: negocie com o armeiro.
- **Guerra por mensageiro:** o botão de guerra (Diplomacia do seu reino, ou no castelo de um reino) manda um mensageiro com a **declaração de guerra** ou com um **ultimato**: "paguem tanto ou haverá guerra". Quanto mais forte você for perto deles (e quanto menos pedir), maior a chance de pagarem; se recusarem, é guerra.
- **Partir para a batalha quando quiser:** em guerra, Diplomacia → "Partir para a batalha" abre o Conselho de Guerra e leva os exércitos ao campo de batalha, com os reis, os soldados e o seu arsenal.
- **Campo de batalha bem maior:** até 172×102 blocos (antes 100×62), com até 60 soldados de cada lado (antes 40). Os exércitos começam mais perto um do outro para a marcha não demorar.
- **Romance com qualquer pessoa solteira do sexo oposto:** donos de loja, andarilhos, reis, rainhas, príncipes, cavaleiros, soldados, padres... todos, menos quem já é casado (e os seus parentes). Quem tem um cargo (soberano, corte, padre, soldado, dono de loja, porto) casa com você mas continua no posto.
- **Negociar com mais responsáveis:** a carpinteira vende e compra tábuas, vigas, pregos e madeira; o oleiro, potes e tijolos; o defumador, carnes defumadas; o adegueiro, vinhos e cervejas; o armeiro, armas e armaduras.
- **Animais da fazenda novos e dentro do curral:** vaca (malhada, com chifres e úbere), ovelha (lã em tufos, cara escura) e galinha (crista, cauda e bicadas) redesenhadas no estilo dos animais selvagens. As vacas e ovelhas agora ficam dentro da cerca do curral (antes passeavam do lado de fora).
- **Dragão novo:** asas de membrana com dedos de osso batendo, pescoço em S, cabeça com chifres, olho de pupila em fenda e fumaça nas narinas, barriga de escamas, espinhos nas costas, patas com garras, cauda que balança e um sopro de fogo de verdade.
- **Mensageiro de paz com ouro:** em guerra (o seu reino contra outro, em Diplomacia, ou você mesmo contra um reino, no castelo dele), mande um mensageiro oferecendo a quantia que quiser (do tesouro do reino ou do seu bolso). Quanto mais generosa a oferta perto do que eles esperam (depende da força dos dois, da raiva e do tesouro deles), maior a chance de aceitarem. Recusada, o mensageiro volta com o ouro menos 10% da viagem; uma oferta insultuosa ainda irrita (−5 relação).
- **Renunciar ao trono:** na janela do seu reino (Resumo ou Decretos), "Renunciar ao trono" passa a coroa a um filho adulto (ou ao cônjuge, a um cavaleiro da corte ou a um nobre). O reino deixa de ser seu e você continua lá como Duque.
- **Guardas da sala do trono atacam na hora:** ao golpear o rei (ou alguém da corte), todos os guardas da sala vêm para cima de você na hora — antes eles davam um passo, voltavam para o posto e ficavam se esbarrando. Dois deles também não nascem mais dentro das colunas.
- **Muralha da vila só pelo governador:** em Construir, a Muralha das vilas só pode ser erguida pelo governador da vila, dentro da vila dele — nem o rei pode. As outras obras das vilas continuam valendo para o governador e para o rei.
- **Primeiro funcionário contratado sozinho:** empreendimento seu sem ninguém trabalhando contrata na hora (ao construir, ao entrar e todo mês) o camponês livre mais perto, sem o adiantamento; o salário mensal continua o mesmo.
- **Trabalhadores são sempre camponeses:** funcionários dos seus empreendimentos e responsáveis dos prédios são camponeses adultos — nunca alguém da corte, de família real ou nobre, padres, soldados ou cavaleiros.
- **Agora dá para entrar em todas as obras das vilas:** celeiro, escola, estalagem, serraria, casa de curas, padaria, moinho, casa de banhos, torre de vigia, tecelagem, cervejaria, entreposto, estrebaria e mina mostram "entrar" ao chegar perto (antes não havia ação nenhuma neles). O galinheiro e o canil também ganharam o lado de dentro, com tratador.
- **Sempre há um responsável:** todo prédio tem alguém cuidando dele o tempo todo — nas vilas que você comanda também. Se o responsável morrer ou se mudar, outra pessoa assume na hora.
- **Negociar é com o responsável:** cada estabelecimento vende o que é dele (pães na padaria, farinha no moinho, tábuas na serraria, minério na mina, ervas e unguentos na casa de curas, tecidos na tecelagem, especiarias no entreposto...) e a compra e a venda são feitas com o responsável, no balcão lá dentro ou em "Negociar" na conversa com ele, usando a bolsa dele.
- **Batalhas em campo aberto no campo de batalha:** ao escolher um lado numa batalha entre outros reinos (mesmo sem ser rei), você marcha com esse exército para o campo de batalha, a tela só para a luta, e cada rei leva os soldados, cavaleiros e catapultas que quiser (o número aparece na hora de escolher). Se vencer: ouro, experiência e +25 de relação.
- **Escudeiros, lanceiros e cavaleiros:** o exército de cada rei agora tem escudeiros na linha de frente (escudo grande, mais vida), lanceiros logo atrás (lança comprida, atacam de mais longe e fazem o dobro de dano em quem está a cavalo), espadachins, arqueiros e mais cavaleiros montados, além do rei e das catapultas.
- **NPCs ricos compram cavalo:** nobres e moradores com a bolsa cheia (700 🪙 ou mais) compram um cavalo e passam a andar montados pelas vilas e estradas.
- **Cavalo novo:** desenhado no mesmo estilo dos outros animais, com patas com joelho e casco, crina, cauda solta, cabeça comprida, rédea e sela.
- **Santuários depois de carregar:** carregar um jogo sem recarregar a página (voltando ao menu) não faz mais os santuários sumirem.
- **Todo prédio tem interior e um responsável** (menos as casas dos moradores): as obras das vilas (padaria, moinho, estalagem, escola, casa de banhos, torre de vigia, tecelagem, cervejaria, entreposto, estrebaria, mina, serraria, celeiro, casa de curas), os empreendimentos das famílias (moinho, empório, oficina), o santuário e os seus prédios (quartel, cervejaria, estábulo, defumadouro, olaria, carpintaria, torre de vigia, torre de arqueiros, arsenal, adega, cogumelal). Cada um tem uma pessoa de verdade cuidando dele, com ofício próprio (Padeiro, Professora, Cavalariço, Sargento, Arqueiro, Zeladora...); o cemitério ganhou o coveiro e a arena, o mestre da arena. Nas vilas que você comanda, você escolhe quem cuida (Portfólio → Vilas e guardas); se não houver ninguém disponível, chega alguém de fora para o serviço. Dentro dos seus prédios, o móvel principal faz o mesmo que clicar neles por fora (treinar soldados, cavalos, bebidas...).
- **Torre de arqueiros com soldado de verdade:** o arqueiro responsável fica lá em cima, vira para os inimigos e é ele quem atira.
- **Moradores só constroem em lugar vazio:** as casas que surgem quando a vila sobe de nível, as casas novas das famílias e os empreendimentos não ficam mais em cima das suas obras nem das que você mudou de lugar. Se algo ficou encavalado (inclusive em jogos salvos antigos), a obra dos moradores muda sozinha para um lugar livre perto da vila.
- **Imóvel dos NPCs que você muda de lugar fica onde você pôs**, também depois de salvar e carregar.
- **Os NPCs evoluem as estradas:** todo mês as vilas e os castelos dos outros sobem as estradas de dentro deles um nível por vez (vila nível 1–2 até cascalho, 3–4 até pedra, 5–6 até calçada, 7+ até Estrada Real; castelos até a real), pagando pelo tesouro do reino (as vilas do seu reino pagam sozinhas). As vilas em que você é o governador ficam por sua conta. Os níveis das estradas abertas pelos moradores agora também ficam salvos.
- **Evoluir estradas sem travar, um nível por vez:** o modo de evoluir estradas travava o jogo (a prévia sob o mouse dava erro); agora mostra o bloco verde ou vermelho com o motivo. A estrada sobe só para o nível seguinte: terra → cascalho → pedra → calçada → Estrada Real (estrada de terra não vira Estrada Real direto). Evoluir pode em qualquer lugar — terra selvagem, reinos e perto de castelos alheios —, menos dentro de uma vila em que você não é o governador (ou o rei). Abrir e remover estradas seguem as regras de antes.
- **Construir em qualquer lugar vazio:** os lugares que as vilas reservam para crescer (casas, poço e muralha que só aparecem nos próximos níveis) não bloqueiam mais o chão. Nas suas vilas e no seu reino você constrói, abre estradas, cava e planta neles; o que estava reservado ali é descartado de vez (e não reaparece por cima da sua obra quando a vila crescer).
- **Pá com terra e areia:** cavar na praia ou no deserto dá Areia; nos outros chãos, Terra. A pá tem três modos (Y ou o botão da pá): Cavar, Aterrar com Terra (a água vira gramado verde) e Aterrar com Areia (vira chão de areia).
- **Obras que enriquecem as vilas (35 no total):** 19 obras novas em Construir → Obras nas vilas — Padaria, Moinho, Pomar Comunitário, Pasto de Ovelhas, Apiário, Estalagem, Escola, Casa de Banhos, Praça Florida, Torre de Vigia, Casas de Aluguel, Tecelagem, Cervejaria da Vila, Entreposto Comercial, Estrebaria, Mina da Vila, Serraria da Vila, Celeiro e Casa de Curas. Todo mês elas rendem Salin (para você, se é o governador; para o tesouro, se a vila é do seu reino), recursos para o reino (trigo, madeira, pedra, ferro), fazem a vila prosperar, abrem lugar para mais moradores e atraem famílias novas.
- **Mapa sempre atualizado:** o minimapa e o mapa grande mudam na hora quando uma estrada ou construção é criada, demolida ou muda de lugar (inclusive as estradas abertas pelos moradores e as casas que surgem quando a vila cresce). As construções aparecem no mapa: as suas em dourado, as dos reinos na cor do telhado, e também portos, cemitérios, cavernas e acampamentos.
- **Soldados defendem a realeza em qualquer lugar:** qualquer golpe seu em alguém da família real ou da corte (por exemplo, depois de declarar a casa real inimiga) faz os soldados do reino atacarem na hora — os que estiverem por perto ou na mesma sala; se não houver nenhum, chegam reforços (na rua, em volta de você; dentro de um lugar, pela porta).
- **Arquibancadas da arena:** agora dá para andar por elas (só o camarote real é fechado). As arquibancadas viraram degraus de pedra com bancos de madeira, sem os bonequinhos pintados: só a plateia de verdade, e no camarote, cadeiras sob o dossel com a família real de verdade.
- **Cemitério por dentro:** entre no cemitério (E): gramado com caminho de terra, o mausoléu dos heróis da dinastia no alto, as lápides da família com o nome gravado (chegue perto e leia a vida da pessoa), túmulos antigos com musgo, ciprestes, lanternas acesas, uma estátua de anjo, canteiros de flores, bancos e o livro do cemitério na entrada.
- **Arena nova por dentro:** maior, com arquibancadas em degraus nos três lados e a plateia sentada nelas, camarote real no alto com a família real, o brasão do reino desenhado no meio da areia, colunas e braseiros nos cantos, portão de ferro dos lutadores e, na entrada, a mesa de inscrição, o suporte de armas e barracas de comida e de bebida.
- **Render-se na batalha:** no campo de batalha aparece o botão 🏳️ Render-se. Você sai vivo: se é o rei comandando o próprio exército, o reino passa para o adversário (um governador da casa dele assume o trono, metade do tesouro vai para ele e a guerra acaba); se lutava por outro reino, a batalha é perdida (−10 de relação com ele e −5 de fama).
- **Botão Voltar de verdade:** toda janela tem o botão ◀ Voltar, que leva para onde você estava: a janela anterior (inclusive trocando pela barra de botões, pelas teclas ou pelas setas, e o mapa) ou, se você abriu direto, de volta para o jogo.
- **Conversar com os soldados e subornar:** os guardas dos castelos e das vilas agora são gente (nome, jeito, amizade) e conversam como todo mundo; os mesmos soldados voltam a aparecer. Com amizade 40+ (70+ se for leal ao reino), "💰 Subornar" (180 🪙 o soldado, 600 o cavaleiro) faz ele largar o reino e virar seu capanga, com espada e armadura, lutando até contra o próprio reino.
- **Morte para valer em todas as dificuldades:** a dificuldade só muda os adversários (no Difícil causam mais dano e resistem mais, no Fácil menos); fome e preços são iguais em todas.
- **Crocodilos maiores:** agora têm mais do que o dobro do comprimento de uma pessoa (e um pouco mais de vida).
- **Cada pessoa num lugar só:** quem aparece dentro de uma loja, taverna ou arena é gente que estava perto dali (quem está trabalhando ou passeando longe continua lá). Enquanto você está lá dentro, essas pessoas não andam lá fora, e quando você sai elas saem junto pela porta.
- **O jogo começa em janeiro** (jogos novos; os salvos continuam com o calendário deles).
- **Morte para valer também na guerra:** morrer em batalha agora é como morrer de qualquer outro jeito (animal, briga, fome, velhice): fim de jogo, o salvo é apagado e você pode continuar como um dos seus filhos ou começar do zero. O fim de jogo mostra como você morreu ("atacado por um lobo", "morto por bandidos", "pelas mãos de um assassino"...).
- **Arena por dentro:** plateia de gente do reino em volta da areia e, na frente do camarote, o rei, a rainha e os príncipes (no seu reino, o seu cônjuge e os seus filhos). Só os lutadores pisam na areia: você não entra até escolher lutar, nem quando aposta numa luta, e no duelo ninguém sai dela até acabar. O duelo só termina quando a vida de um dos dois zera; se você cair, não morre de verdade e não leva o prêmio.
- **Biomas separados por região (jogos novos):** em vez de retalhos espalhados, cada bioma ocupa a sua região: o norte gelado (neve e uma faixa larga de tundra), um grande deserto no sul cercado de estepe (com as margens dos rios verdes, como oásis), uma região de pântanos no meio do continente, do lado oposto ao deserto, e campos e florestas no centro.
- **Pessoas ainda mais caprichadas:** contorno suave em volta da figura; olhos com íris colorida, pálpebra, brilho e cílios; sobrancelhas, nariz com luz e narina, lábios; cabelos com mechas, brilho e pontas (tranças em gomos, rabo de cavalo que balança, coque com fita); barbas com textura e bigode em arco; roupas com gola, decote, cadarço, aba da túnica com barra, punhos, cinto com algibeira; cota de malha sob a armadura; botas com cano dobrado e bico.
- **Cemitérios:** cada reino tem um cemitério cercado perto do castelo. Quem é da sua família (pais, irmãos, filhos, cônjuge, gente da sua casa) e os heróis da dinastia são enterrados no reino onde viviam, com uma lápide que resume a vida: com quem se casou, quantos filhos deixou, a profissão, os combates, como e quando morreu e um epitáfio conforme o jeito da pessoa. Visite (E no cemitério), leia as lápides e deixe flores (um pouco de devoção). As lápides aparecem no mapa, e as dos heróis têm uma coroa.
- **No deserto não chove nem neva:** ao entrar no deserto a chuva e a neve somem aos poucos (e o som também); voltam quando você sai.
- **Predadores atacam as pessoas:** lobos, ursos e crocodilos também atacam moradores, viajantes e caçadores (não dentro dos prédios), e podem matá-los; eles revidam e os guardas ajudam. A morte fica registrada ("morto por um lobo").
- **10 animais selvagens:** chegaram o **crocodilo** (pântanos, ataca), o **alce** (tundra e neve, revida) e o **camelo** (deserto e estepe, foge).
- **Materiais novos:** figo-da-índia, tâmaras, cogumelo, arenito, sal, junco, turfa, líquen, âmbar, couro e dentes de crocodilo, galhada de alce e pelo de camelo. Receitas: carne salgada, sopa de cogumelos, carvão de turfa, corda e cesto de junco, pedra de arenito, tecido e manto de pelo de camelo, couraça de crocodilo, pomada de líquen e amuleto de âmbar.
- **A vida continua lá fora:** entrar e sair de uma loja, taverna ou casa não apaga nem recria mais os moradores; quem estava na rua segue a rotina de onde estava.
- **Interiores mais claros:** pisos, paredes e a luz de dentro das lojas, tavernas e casas ficaram bem mais claros (de dia quase como lá fora; à noite, lampiões e lareira).
- **Personagens e animais redesenhados:** pessoas com formas arredondadas, luz e sombra, rosto com olhos, sobrancelhas, nariz e boca, cabelos e barbas com volume, roupas com cinto, decote e dobras, armaduras com ombreiras e rebites, elmos e coroas com brilho, mãos, sapatos e uma caminhada mais natural. Os animais (cervo, lobo, javali, raposa, coelho, cabra e urso) ganharam pescoço, peito e quadril, patas com joelho, cascos ou patas, focinho, orelhas, olhos com brilho e caudas próprias (galhada, chifres, presas, manchas do filhote de cervo). O desenho fica guardado em imagens prontas, então o jogo continua leve.
- **Fundar uma vila custa 100.000 Salin**, para você e para os reis NPC: eles só fundam quando o tesouro do reino chega a esse valor, e pagam com ele.
- **Vilas até o nível 10:** do nível 4 em diante, cada nível traz mais uma casa e uma família nova, e cabe mais gente.
- **A sua vila livre vira reino a partir do nível 5** (antes era o 3).

## Novidades anteriores: muito mais construções, Infraestrutura e ícones desenhados

- **Construção**: Moradia 7, Produção 11, Fazenda e animais 12, Empreendimentos 23, Praça e decoração 11, Cultura, fé e treino 6, Baús e estábulo 5, Defesa e exército 6 opções. Cada construção tem um ícone desenhado próprio, do tamanho de um emoji.
- **Infraestrutura** (antes Estradas e Reformas): a estrada de terra continua grátis; depois ela evolui até 5 níveis (cascalho, pedra, calçada, Estrada Real), cada um mais rápido para você, os moradores e os animais.
- **Destaques**: torre de arqueiros que atira sozinha, estacas, arsenal para os capangas, canil com cão de guarda, adega que envelhece o vinho, palco dos menestréis, estande de tiro, viveiro de peixes, pombal (penas para flechas), cogumelal.
- **Materiais novos**: tábua, viga, pregos, pergaminho, argamassa, pena, cogumelo, poções de vigor e de força, Elixir Real, vinho envelhecido.
- **Ícones**: todos os itens têm desenho próprio, no formato e na cor do que são.

## Novidades anteriores: lugares fechados, guerras de verdade e o dobro de coisas

- **Interiores**: entre nas lojas, taverna, capela, catedral, castelo (sala do trono), nas suas casas e nos seus empreendimentos. O dono atende no balcão; de dia ele trabalha lá dentro e à noitinha a taverna enche de fregueses. As lojas fecham à noite.
- **Um dono para cada loja**: duas madeireiras na mesma vila têm dois madeireiros.
- **Seus empreendimentos**: balcão para comprar no atacado e pôr mercadoria à venda; o lucro cresce com a população por perto.
- **Guerras de verdade**: quando o seu reino está em guerra você é convocado (não dá para fugir), monta o exército no Conselho de Guerra (soldados, arqueiros, cavaleiros, catapultas, capangas e formação) e luta num campo de batalha próprio, até um lado ser destruído. Reis aliados pedem ajuda nas guerras deles.
- **Mais coisas**: 10 empreendimentos novos (18 ao todo), 27 construções novas (53 ao todo), 17 itens, 3 oficinas (defumadouro, tear, olaria), obras novas nas vilas.
- **Coroa**: 14 decretos, 9 ações, 12 audiências, Grandes Obras reais e o Tribunal do Rei.
- **Visual**: brilho quente das luzes, entardecer dourado, fumaça nas chaminés, reflexos na água, sombras de nuvens, pássaros e vaga-lumes (desligável em Ajustes → Tela).

## Versão anterior (4)

- **Fronteiras do reino crescem:** em Portfólio → seu reino → Obras, **Expandir fronteiras** (pago pelo tesouro e pelos armazéns do reino, até 8 níveis) faz a borda avançar 5 blocos sobre a terra selvagem, sem atravessar o mar aberto nem tomar terra de outro reino; o cartão mostra quantos blocos o reino vai ganhar. Em Portfólio → Vilas e guardas, uma vila livre sua perto de um reino seu ganha o botão **Anexar**: ela entra no reino (com as cores dele) levando a terra selvagem em volta (raio de 17 blocos), e você continua governador dela.

- **Loja fechada sem herdeiro:** se você é o rei ou o senhor da vila, a própria janela da loja fechada (armazém, ferreiro, madeireira, pedreira ou taverna) mostra os moradores sem emprego para você nomear quem assume, e a loja reabre na hora. A lista "Lojas sem dono" em Portfólio → Vilas e guardas agora acha também as lojas que fecharam antes de a vila ser sua.

- **Cavalo no estábulo e venda:** no seu Estábulo, "Deixar no estábulo" faz o cavalo ficar esperando na frente dele (sem os alforjes, a carga da mochila volta ao normal); "Levar comigo" busca de volta. Se o estábulo for demolido, o cavalo volta para você. Dá para **vender o cavalo** (120 Salin, mais 90 se tiver carroça, que vai junto) no estábulo ou na taverna de qualquer vila.
- **Vila que vira reino acompanha as cores:** ao erguer o castelo, todas as construções da sua vila passam a ser do reino novo; trocando a cor do reino, telhados, toldos e bandeiras da vila mudam junto.

- **Pá (cavar e aterrar):** crie a Pá de Pedra (3 madeira e 3 pedra, à mão) ou a Pá de Ferro (forja, cava duas vezes mais rápido). No modo **Cavar**, a terra firme vira água rasa e a água rasa vira mar aberto; cada buraco rende **Terra** e às vezes pedra, argila (mais na beira da água), raízes, ossos, moedas antigas ou até um **tesouro enterrado**. No modo **Aterrar** (tecla Y ou o botão da pá no celular), a Terra da mochila enche o mar aberto (1 Terra → água rasa) e a água rasa (2 Terra → terra firme, areia na beira da água). O bloco-alvo aparece marcado no chão. Use para abrir canais e lagos de pesca, cavar um fosso de mar aberto em volta da sua base (ninguém atravessa a pé), ligar uma ilha à terra firme, ganhar terreno do mar ou levar a água até a vila para erguer um porto. Não dá para cavar sob estradas, construções, plantações nem em vilas e castelos dos outros. Conquistas novas: Escavador e Construtor de Terras.

- **Mais campo verde (jogos novos):** a maior parte das colinas marrons virou campo; ficam só as colinas mais altas. Minérios e cavernas continuam nos mesmos lugares.
- **7 ilhas em anel (jogos novos):** as ilhas rodeiam a terra firme com espaços quase iguais entre elas e a mesma folga até a costa; os tamanhos continuam diferentes (as maiores ficam onde há mais mar). Ficam fora de qualquer reino, e o barco sempre consegue dar a volta no mapa.
- **Mundo sem montanhas e com 2 vilas por reino (jogos novos):** as montanhas viraram colinas e neve (os minérios continuam lá, e as cavernas também), e cada reino começa com 2 vilas. Os reis fundam vilas novas quando elas lotam. Jogos salvos antigos continuam como estavam.
- **Mais mar e portos (jogos novos):** o mapa ficou maior, com uma faixa larga de mar aberto em volta do continente para navegar. Cada reino com mar por perto tem um **Porto** na costa, onde o mestre do porto compra peixes, **polvos**, **tubarões** e **baleias** e vende barco, vara e corda. Tubarões e baleias vivem no alto-mar: pesque de barco, longe da costa. Jogos salvos antigos continuam com o mapa de antes.
- **Fundar o próprio reino:** quando a sua vila livre chega ao nível 5, erga o **Castelo** (Construir → Moradia, depois do Casarão; 3000 🪙 e materiais). Nasce o "Reino <sobrenome>" com castelo, guarnição, território e diplomacia. Um reino fundado por vez: se ele cair, dá para fundar outro.
- **Reino conquistado leva a sua marca:** quem já é rei e toma outro reino passa a usar nele a bandeira, o brasão e a cor do reino principal (os dois continuam reinos diferentes, com relações próprias). Dá para voltar ao brasão próprio na aba Bandeira e brasão.
- **Capangas de guarda em qualquer lugar:** "Ficar de guarda ou esperar" deixa o capanga parado onde você está, numa vila ou castelo seu, ou esperando numa vila ou cidade qualquer. Converse com ele lá para ele voltar a seguir você.
- **Estradas dos moradores:** as casas, lojas, capelas e empreendimentos das vilas são ligados à estrada; todo mês os moradores abrem caminhos até o que ainda não tem acesso.
- **Vila em quadrado:** a área onde o governador constrói é um quadrado (mais fácil de cercar). Muros se emendam com os vizinhos e ganham uma **torrezinha** nos cantos.
- **Reis NPC fundam vilas** quando uma vila do reino lota, e **escolhem um morador sem emprego** para a loja cujo dono morreu sem filho (nas suas vilas e reinos, quem escolhe é você: Portfólio → Vilas e guardas).
- **Dinheiro do comerciante:** cada loja tem a bolsa do próprio dono (o que você gasta vai para ele, e ele só compra o que puder pagar). O tesouro do reino fica para o reino.
- **Igreja nova:** missa do mês, oração, bênção, missa pelos antepassados, confissão (vidas inocentes e caravanas saqueadas viram pecados), casamento, batismo, esmolas aos pobres, doações, dízimo mensal e peregrinações.
- **Conversa nova:** retrato grande, o que a pessoa disse por último e as ações em grupos (Conversa, Coração, Trabalho, Casas).
- **Teclas à sua escolha:** Ajustes → Controles (computador): clique numa ação e aperte a tecla nova.
- **Mais animais e materiais:** raposa, coelho, cabra montesa e urso, com peles, chifres e garras para novas armas (lança e maça de ferro, arco composto de chifre, garras de urso) e roupas (capuz de raposa, botas de coelho, gibão de couro curtido, casaco de urso). Armas, ferramentas, roupas e materiais ganharam ícones desenhados com a cor do material.


- **Corte do rei:** cada reino mede o seu reconhecimento (serviços prestados, fama e relação). Com reconhecimento 40+ e relação 40+, o rei convida você para a corte. Na corte você recebe salário todo mês, escolhe um cargo conforme o reconhecimento (Conselheiro, Tesoureiro Real, General do Rei ou Embaixador), pede audiências ao rei, pede escolta (General) e propõe alianças, paz ou guerra (Embaixador). É preciso aparecer no castelo pelo menos a cada 3 meses; guerra com o reino ou relação muito baixa tiram você da corte.
- **Bandeira e brasão:** cada reino tem a sua bandeira (tremulando nas torres do castelo e na arena) e o seu brasão (sobre o portão do castelo e nas janelas). Quando você é o rei, a aba **Reino → Bandeira e brasão** deixa mudar o nome do reino, a cor (fronteiras, mapa, telhados e guardas), o metal (segunda cor), o desenho da bandeira, a divisão do escudo e o símbolo. Tudo fica no jogo salvo e dá para voltar ao original.
- **Tudo renasce em 1 ano:** arbustos de frutas, linho, ervas e argila agora também levam 1 ano do jogo para voltar, como árvores, pedras e minérios.

- **Cada família tem sua casa:** o casal e os filhos (ou o adulto solteiro) dormem na própria casa. Quem não tem ocupa uma livre ou constrói uma nova perto da vila: a obra leva 3 dias, aparece com andaime e barra de progresso, e os moradores trabalham nela de dia. As casas novas ficam no jogo salvo.
- **Avisos em janelinhas:** as mensagens aparecem em janelinhas flutuantes no tema do jogo, com ícone, botão de fechar e uma barrinha do tempo; avisos repetidos mostram ×2, ×3...
- **Relógio alinhado:** data, estação, ano e hora numa linha só.

- **Economia no ritmo de antes:** impostos, soldos, salários, renda dos reinos, guerras, revoltas e colheitas andam uma vez por mês.
- **Resumo das contas:** em vez de uma mensagem a cada minuto, aparece um resumo a cada mês (ouro e itens). Os detalhes ficam no Diário → Contas. Avisos importantes continuam aparecendo na hora.
- **Vida em ritmo próprio:** as pessoas envelhecem, casam e têm filhos uma vez por ano do calendário, em janeiro (a cada 72 minutos reais), então as famílias e a dinastia continuam vivas.
- **Eventos no mundo:** raramente, um Dragão Ancestral desce das montanhas, fora das cavernas, e aparece marcado no mapa.
- **Capangas mais fortes:** sobem de nível com a experiência (mais dano, defesa e vida) e têm postura: Agressivo, Equilibrado ou Defensivo (converse com eles ou use Equipar e treinar).
- **Rotina dos moradores:** trabalham de dia, ao entardecer muitos vão à taverna (o padre vai à capela) e à noite entram em casa para dormir. As janelas acendem quando há gente em casa.
- **Segurar para repetir:** segure o clique, o Espaço ou o botão Atacar para bater e coletar sem parar. O golpe forte agora é segurando V (no controle, RT; no celular, o botão 💥).
- **Ícone do jogo** na aba do navegador.

- **Calendário de verdade:** o jogo conta meses, não dias. O relógio tem uma pizza que se enche em 5 minutos de dia; quando ela completa, escurece, vira o mês e vem 1 minuto de noite. Cada mês dura 6 minutos e o ano (12 meses) 72 minutos. O jogo começa em janeiro. As estações seguem os meses: primavera (março a maio), verão (junho a agosto), outono (setembro a novembro) e inverno (dezembro a fevereiro). O aniversário de todos é em janeiro, e o Grande Torneio dura o mês de junho inteiro.
- **Metade das montanhas:** as montanhas mais baixas viraram colinas (ou neve, no norte), com minérios. Vale também para jogos salvos antigos; castelos, vilas e cavernas continuam no mesmo lugar.
- **Recursos renascem em 1 ano:** árvores, pedras e minérios coletados só voltam a crescer 1 ano (do jogo) depois.
- **Estradas:** B → Estradas. Clique e arraste para abrir estradas, de graça; sobre rio raso vira ponte. "Remover estrada" tira qualquer estrada ou ponte, até as do mapa (nas vilas e castelos dos outros, só o governador ou o rei). O Muro de Pedra (e a muralha das vilas) custa só 1 pedra.
- **Governador de vila:** vire governador fundando sua vila, **pela força** (converse com o governador e desafie-o: derrote a milícia; o rei decide se o ataque é uma afronta à coroa ou se a vila se defende sozinha) ou **pela diplomacia** (no castelo, peça o governo ao rei com boa relação e ouro). O governador recebe os impostos dos moradores.
- **Guardas:** como governador de vila ou rei, converse com um capanga e escolha "Mandar fazer guarda": ele patrulha a sua vila (até 6 guardas) ou o seu castelo (até 12), enfrenta quem ameaçar e reforça a defesa quando um exército ataca. Guardas não contam no limite de seguidores, mas recebem soldo. Chame de volta pela conversa ou em Portfólio → Vilas e guardas.
- **Obras do governador e do rei:** o governador (dentro da vila) e o rei (no reino todo) podem abrir e remover estradas, **mudar de lugar** e **demolir** casas, lojas, tavernas, capelas, muralhas e todos os imóveis, e **erguer imóveis novos** nas vilas (B → Reformas e Obras), inclusive um **Porto** na beira da água (80 madeira e 40 pedra). O rei também pode mudar o castelo de lugar dentro do reino. Cavernas, acampamentos e santuários não saem do lugar. Suas próprias construções podem ser mudadas e demolidas em qualquer lugar.

## Versão anterior (3)

- **Mochila com 10 níveis:** de 220 até 500 de carga. Melhore na Bancada de Trabalho com couro, corda, tecido e, nos níveis altos, pele de lobo, lã, seda, aço e uma gema.
- **Arrastar e soltar na Mochila:** arraste itens para os espaços do corpo (equipar), para a algibeira (comidas e remédios), para fora do corpo (tirar), para a lixeira (descartar) ou entre si (reorganizar; "Organizar" volta à ordem por categoria). Clique num item para ver os detalhes, que agora cabem inteiros, sem rolagem. No celular, segure o item um instante para arrastar.
- **Criação por local:** a tecla C mostra só o que se faz à mão. As outras receitas aparecem na própria estação: Fogueira (e lareira da cabana e das casas), Bancada, Forja, Forno a Lenha e Cervejaria.
- **Chuvas mais rápidas:** chuva, tempestade e neve duram metade do tempo de antes.
- **Civis trabalhando:** camponeses, andarilhos e mendigos cortam árvores, quebram pedras e colhem plantas perto de casa, dentro do próprio reino, e levam tudo para a vila (vai para o armazém do reino e enriquece a família). À noite eles descansam.

## Versão anterior (2)


- **Títulos de nobreza:** peça títulos no castelo de um reino: Cavaleiro → Barão → Conde → Marquês → Duque. Cada um exige relação, serviços prestados (caçar bandidos no reino, salvar caravanas, vencer batalhas e torneios, esmagar revoltas, tributos, doações), nível e uma taxa. As vantagens são capangas extras (até 18), renda diária do rei, impostos maiores nas suas vilas, desconto nas lojas do reino, o **direito de fundar vilas** (a partir de Barão) e, para o Duque, reivindicar o trono mais barato. Declarar guerra ao seu suserano tira o título.
- **Conselho real** (Portfólio → seu reino → Conselho): nomeie Tesoureiro, General, Espião-mor e Diplomata entre as pessoas do reino. Cada um tem competência e lealdade próprias. Corruptos desviam o tesouro e reinos rivais tentam subornar. Os desleais **conspiram**: o tesoureiro foge com o ouro, o general dá um golpe, o diplomata provoca uma guerra ou alguém contrata assassinos. O espião-mor descobre corruptos e conspirações, e você decide se perdoa, bane ou executa.
- **Casamentos arranjados** (Portfólio → Família): case os filhos com herdeiros de outros reinos (alianças) ou com as famílias poderosas (lealdade e fim das rivalidades).
- **Mercado vivo:** os preços sobem com a escassez (guerra, inverno, caravanas assaltadas, eventos) e caem com a fartura ou quando você vende muito de uma vez. As lojas mostram ▲ e ▼, e Reino → Mercado compara o que cada reino paga.
- **Suas caravanas:** perto de um castelo ou vila, monte uma caravana com suas mercadorias, escolha o destino e a escolta, e lucre com a diferença de preço. Sem escolta, ela pode ser assaltada no caminho; você também pode acompanhá-la e defendê-la.
- **Cercos de verdade:** o portão do castelo tem resistência. Enquanto ele estiver de pé, arqueiros atiram das muralhas e o soberano não sai. Construa **Aríete** e **Catapulta** na bancada e monte-os durante o cerco (tecla **G**). Reinos em guerra com você **atacam seu castelo e suas vilas** com tropas e máquinas: defenda o portão e as casas, ou perca a vila ou o reino.
- **Arenas e torneios:** cada capital tem uma arena com duelos (sem morte), **justas a cavalo** (um minijogo de pontaria), apostas nas lutas do dia e o **Grande Torneio** anual (3 lutas, 500 🪙). Vencer dá fama.
- **Religião:** cada vila tem uma capela com padre, e cada capital uma catedral. Ali você pode rezar (Bênção), pedir a Graça Divina, doar, **casar na igreja** (sem anel) e batizar os filhos. Três **santuários** distantes dão +15 de vida máxima para sempre a quem faz a peregrinação.
- **Parentes, aliados e inimigos:** parentes são as casas ligadas por casamento (a do seu cônjuge, a dos cônjuges dos seus filhos e assim por diante). Conversando com alguém de outra casa (ou na janela da casa) você pode **propor uma aliança** (250 🪙) ou **declarar a casa inimiga**: os adultos dela passam a poder ser enfrentados até a morte e revidam. **Pedir paz** encerra a inimizade e tudo volta ao normal, mas a paz só é aceita se a sua casa for mais influente que a inimiga.
- **Linhagens** (Portfólio → Linhagens, ou "Árvore e relações" na janela de uma família): árvore genealógica visual e um **mapa de relações** entre as casas: parentes por casamento, aliadas e rivais.
- **Jogos longos mais leves:** a população tem um limite suave, as famílias extintas são aposentadas e os jogos salvos ficam **compactados** (~10× menores). Jogos antigos continuam abrindo.

## Versão anterior


- **Famílias e sobrenomes:** cada pessoa pertence a uma casa. Ao casar, a esposa assume o sobrenome do marido (o nome de solteira aparece na conversa) e os filhos herdam o sobrenome da família. Rainhas reinantes mantêm o próprio nome, e quem casa com o herói ou a heroína entra para a casa dele(a).
- **Famílias com poder:** cada casa tem riqueza, influência e lealdade à coroa. As ricas abrem empreendimentos (moinho, empório, oficina, quinta, vinhedo) perto da vila, as mais influentes dão o **governador da vila**, e as grandes fundam a **"Vila <Sobrenome>"**. Casas ambiciosas e desleais podem **declarar guerra à coroa**: rebeldes e guardas lutam perto da vila, você pode apoiar um dos lados, e se os rebeldes vencerem a família **toma o trono** e começa uma nova dinastia (inclusive no seu reino!). Como rei, "Conceder favores" aumenta a lealdade de uma casa.
- **Seus empreendimentos:** construa (B → Empreendimentos) Fazenda Comercial, Moinho, Serraria, Pedreira Própria, Mina, Ferraria e Empório, e contrate moradores (na conversa ou no próprio empreendimento). Cada funcionário recebe salário todo dia; especialistas do ofício rendem +50%. A produção fica guardada para recolher, ou é vendida automaticamente e o faturamento cai direto no seu ouro, sem precisar ir até lá. Funcionários na sua Taverna aumentam as vendas.
- **Até 10 capangas** desde o início, andando com você em formação.
- **População viva:** solteiros se casam, casais têm filhos, e a população dos reinos cresce. Vilas lotadas mandam famílias para vilas com espaço ou para vilas novas.
- **Fundar sua vila:** em Portfólio → Vilas e guardas (sem precisar de título nem de conquista), funde a "Vila <seu sobrenome>" no lugar onde estiver, livre de qualquer reino (100.000 🪙, o mesmo preço que os reis NPC pagam do tesouro para fundar uma vila). Colonos chegam, a vila cresce e paga 2 🪙 por morador todo dia.
- **Janela Portfólio (K):** além dos seus reinos, tem **Reino** (os 7 reinos: pessoas, crianças, famílias, vilas, nascimentos, corte real, famílias influentes e o governador de cada vila), **Grandes Casas** (ranking das casas mais poderosas do mundo e as casas inquietas, com pouca lealdade à coroa), **Família**, **Vilas e guardas** e **Empreendimentos**.
- O criador de herói agora pede o **sobrenome da família**.

## Versão anterior


- **NPCs espalhados:** cada morador fica perto da própria casa e eles se afastam uns dos outros. Clique direto numa pessoa para conversar (um anel dourado mostra quem está sob o cursor).
- **Cidades vivas:** vilas prósperas sobem até o nível 10: casas novas e um poço (nível 2), muralhas (nível 3) e, do 4 ao 10, mais uma casa e uma família nova a cada nível. Vilas atacadas na guerra ficam com casas em ruínas, que se reconstroem com o tempo.
- **Batalhas em campo aberto:** reinos em guerra mandam exércitos se enfrentarem. Ao chegar perto, escolha um lado ou fique de fora; vencendo, você ganha ouro, experiência e relação.
- **Combate novo:** escudos (Madeira, Ferro e Aço) com bloqueio pelo botão direito, golpe forte carregado (segure V) e esquiva (Z). Ordens aos capangas com T.
- **Lavoura:** Enxada para arar, plantar (trigo, cenoura, repolho e cevada) e colher; Regador (encha na água). A chuva também rega e no inverno a terra congela. **Criação:** Galinheiro (ovos), Curral (leite de vaca e lã de ovelha) e Colmeia (mel). Os animais passeiam perto das construções.
- **Culinária e bebidas:** Forno a Lenha (sopa, omelete, ensopado, torta de carne, bolo de mel) e Cervejaria (cerveja, hidromel, vinho). Cada prato dá um efeito temporário (força, defesa, vigor, cura, sabedoria, coragem, charme), mostrado embaixo do painel do herói. **Sua Taverna** vende os pratos e bebidas do balcão todo amanhecer.
- **Caravanas:** viajam entre as capitais. Escolte-as contra bandidos para ganhar recompensa, ou assalte-as (o reino fica furioso).
- **Profissões dos filhos:** a partir dos 12 anos, converse com seu filho e escolha Ferreiro, Lavrador, Comerciante, Cavaleiro, Governador ou Erudito; cada um ajuda a família.
- **Diário do herói:** 33 conquistas, estatísticas, árvore da dinastia e o diário com os grandes momentos.
- **Dificuldade:** Fácil, Normal ou Difícil (no menu e nos Ajustes). Ela só muda os adversários: no Difícil eles causam mais dano e resistem mais; no Fácil, menos. A morte é para valer em todas.
- **Visual do herói:** 8 cabelos, 6 barbas e cores de túnica e calça. Os NPCs também têm cabelos e barbas variados.
- **Salvar a qualquer momento** pela janela de Ajustes (exceto em cavernas e cercos).
- **Árvores:** os pontinhos diagonais dos arbustos foram removidos; na primavera a macieira dá flores, a bétula amentilhos e o carvalho brotos.
- **Música nova:** giga dançante com flauta, alaúde, sanfona e tambor; valsa à noite, marcha no menu, ritmo rápido nas batalhas e tema sombrio nas cavernas.

## Versão anterior

- **Arcos e flechas:** Arco Curto (bancada) e Arco Longo de Teixo (Madeira de Teixo), Flechas (madeira + pedra) e Flechas de Ferro (forja). Clique para atirar. Bandidos, guardas e esqueletos arqueiros também atiram.
- **Cavalo e carroça:** compre na taverna ou no Estábulo. **R** monta e desmonta. O cavalo quase dobra a velocidade, segue você quando está a pé e aumenta a carga; a carroça aumenta muito mais.
- **Peso e baús:** a mochila tem limite de carga; sobrecarregado, você anda devagar e não corre. Baús construíveis e um baú embutido na Cabana, na Casa e no Casarão.
- **Reinos vivos:** relações entre os 7 reinos, incidentes, acordos, guerras com ataques a vilas que mudam de dono, tratados de paz com tributo, alianças e casamentos reais. Aba **Diplomacia** (presentes, aliança, paz, guerra) e **Crônicas** no Reino.
- **Cavernas e masmorras:** 12 cavernas nas montanhas e 3 covis nas ilhas. Interior gerado, com esqueletos, aranhas, morcegos, minérios ricos e baús de tesouro. Governadores com itens lendários: Troll (Clava do Troll), Rei Esqueleto (Lâmina Ancestral), Aranha Rainha (Capuz de Seda) e Dragão Ancestral (Escamas, Coroa de Cristal e a Couraça de Escamas de Dragão).
- **Sons e música:** tudo sintetizado pelo próprio jogo, sem arquivos. Passos que mudam com o terreno, golpes, machado, picareta, arco, fogueira, chuva, moedas, rugido dos governadores, além de trilhas para menu, dia, noite, caverna e batalha. O volume fica nos Ajustes.
- **Estações:** Primavera, Verão, Outono e Inverno (2 dias cada). Folhas douradas no outono, neve e rios congelados no inverno, chuva e tempestade, colheitas diferentes, lobos mais fortes e mais fome no frio (o Manto de Pele de Lobo protege).
- **Jogos salvos:** 3 espaços, salvamento automático ao dormir, e exportar/importar em arquivo .json (no menu e nos Ajustes).
- **Geração em segundo plano:** o mundo é criado num Web Worker, com barra de progresso.

## Estrutura

```
index.html        página do jogo
css/style.css     interface (HUD, painéis, menu)
js/util.js        aleatoriedade, ruído, fila de prioridade
js/audio.js       sons e música sintetizados (Web Audio)
js/dungeon.js     cavernas, masmorras, monstros e governadores
js/features.js    arcos, cavalo, peso/baús, estações/clima, jogos salvos e geração em segundo plano
js/diplomacy.js   reinos vivos: guerras, alianças, casamentos reais e crônicas
js/farming.js     lavoura, animais, efeitos de comida e taverna do jogador
js/combat2.js     bloqueio, esquiva, golpe forte, ordens e batalhas em campo aberto
js/life.js        crescimento e ruína das cidades, caravanas
js/progress.js    conquistas, estatísticas, diário, dinastia e profissões
js/families.js    famílias, sobrenomes, governadores de vila, revoltas, vilas fundadas e empreendimentos com funcionários
js/royalcourt.js  convite e vida na corte dos reis (cargos, salário, audiências)
js/heraldry.js   bandeiras e brasões dos reinos (desenho e mudanças do rei)
js/crown.js       decretos, ações, obras reais e tribunal do rei
js/court.js       títulos de nobreza, conselho real, conspirações, casamentos arranjados e rivalidades
js/market.js      preços dinâmicos e caravanas do jogador
js/events.js      eventos no mundo e rotina dos moradores
js/homes.js       casas dos moradores (cada família constrói a sua)
js/urban.js       estradas, governo das vilas e obras de governadores e reis (mover, criar e demolir imóveis)
js/siege.js       portões, aríetes, catapultas e ataques inimigos às suas terras
js/arena.js       arenas, duelos, justas, Grande Torneio e apostas
js/interior.js    lado de dentro das construções e um dono por loja
js/war.js         guerras de verdade: conselho de guerra e campo de batalha
js/content.js     empreendimentos, construções e obras novas
js/content2.js    mais construções (oficinas, criações, defesa, canil)
js/lifesim.js     vida real: gravidez, luto, boatos, carreiras, dívidas, crime, aluguel e escassez
js/heroes.js      heróis dos reinos (fama, feitos, batalhas e lendas)
js/icons2.js      ícones desenhados de todos os outros itens
js/bicons.js      ícones desenhados das construções, obras e estradas
js/ambience.js    efeitos de ambiente (luz, fumaça, água, nuvens)
js/faith.js       capelas, catedrais, padres, bênçãos, casamento na igreja e santuários
js/input.js       controle (gamepad) e controles de toque
js/people.js      pessoas, famílias, conversas e lojas
js/menu.js        menu principal e criação do herói
js/mapview.js     mapa do mundo
js/data.js        itens, receitas, construções, criaturas, civilizações
js/world.js       geração do mundo, colisão, desenho do terreno e das construções
js/entities.js    criaturas, IA e desenho dos personagens
js/ui.js          painéis e menus
js/game.js        loop principal, controles, combate, economia, cerco, salvamento
```

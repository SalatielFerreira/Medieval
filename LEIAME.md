# MEDIEVAL — Os Sete Reinos

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
| C | Criação de itens |
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

## Novidades: vida real para você e para os NPCs, heróis dos reinos

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
- **Muralha da vila só pelo chefe:** em Construir, a Muralha das vilas só pode ser erguida pelo chefe da vila, dentro da vila dele — nem o rei pode. As outras obras das vilas continuam valendo para o chefe e para o rei.
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
- **Os NPCs evoluem as estradas:** todo mês as vilas e os castelos dos outros sobem as estradas de dentro deles um nível por vez (vila nível 1–2 até cascalho, 3–4 até pedra, 5–6 até calçada, 7+ até Estrada Real; castelos até a real), pagando pelo tesouro do reino (as vilas do seu reino pagam sozinhas). As vilas em que você é o chefe ficam por sua conta. Os níveis das estradas abertas pelos moradores agora também ficam salvos.
- **Evoluir estradas sem travar, um nível por vez:** o modo de evoluir estradas travava o jogo (a prévia sob o mouse dava erro); agora mostra o bloco verde ou vermelho com o motivo. A estrada sobe só para o nível seguinte: terra → cascalho → pedra → calçada → Estrada Real (estrada de terra não vira Estrada Real direto). Evoluir pode em qualquer lugar — terra selvagem, reinos e perto de castelos alheios —, menos dentro de uma vila em que você não é o chefe (ou o rei). Abrir e remover estradas seguem as regras de antes.
- **Construir em qualquer lugar vazio:** os lugares que as vilas reservam para crescer (casas, poço e muralha que só aparecem nos próximos níveis) não bloqueiam mais o chão. Nas suas vilas e no seu reino você constrói, abre estradas, cava e planta neles; o que estava reservado ali é descartado de vez (e não reaparece por cima da sua obra quando a vila crescer).
- **Pá com terra e areia:** cavar na praia ou no deserto dá Areia; nos outros chãos, Terra. A pá tem três modos (Y ou o botão da pá): Cavar, Aterrar com Terra (a água vira gramado verde) e Aterrar com Areia (vira chão de areia).
- **Obras que enriquecem as vilas (35 no total):** 19 obras novas em Construir → Obras nas vilas — Padaria, Moinho, Pomar Comunitário, Pasto de Ovelhas, Apiário, Estalagem, Escola, Casa de Banhos, Praça Florida, Torre de Vigia, Casas de Aluguel, Tecelagem, Cervejaria da Vila, Entreposto Comercial, Estrebaria, Mina da Vila, Serraria da Vila, Celeiro e Casa de Curas. Todo mês elas rendem Salin (para você, se é o chefe; para o tesouro, se a vila é do seu reino), recursos para o reino (trigo, madeira, pedra, ferro), fazem a vila prosperar, abrem lugar para mais moradores e atraem famílias novas.
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

- **Fronteiras do reino crescem:** em Portfólio → seu reino → Obras, **Expandir fronteiras** (pago pelo tesouro e pelos armazéns do reino, até 8 níveis) faz a borda avançar 5 blocos sobre a terra selvagem, sem atravessar o mar aberto nem tomar terra de outro reino; o cartão mostra quantos blocos o reino vai ganhar. Em Portfólio → Vilas e guardas, uma vila livre sua perto de um reino seu ganha o botão **Anexar**: ela entra no reino (com as cores dele) levando a terra selvagem em volta (raio de 17 blocos), e você continua chefe dela.

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
- **Vila em quadrado:** a área onde o chefe constrói é um quadrado (mais fácil de cercar). Muros se emendam com os vizinhos e ganham uma **torrezinha** nos cantos.
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
- **Estradas:** B → Estradas. Clique e arraste para abrir estradas, de graça; sobre rio raso vira ponte. "Remover estrada" tira qualquer estrada ou ponte, até as do mapa (nas vilas e castelos dos outros, só o chefe ou o rei). O Muro de Pedra (e a muralha das vilas) custa só 1 pedra.
- **Chefe de vila:** vire chefe fundando sua vila, **pela força** (converse com o chefe e desafie-o: derrote a milícia; o rei decide se o ataque é uma afronta à coroa ou se a vila se defende sozinha) ou **pela diplomacia** (no castelo, peça a chefia ao rei com boa relação e ouro). O chefe recebe os impostos dos moradores.
- **Guardas:** como chefe de vila ou rei, converse com um capanga e escolha "Mandar fazer guarda": ele patrulha a sua vila (até 6 guardas) ou o seu castelo (até 12), enfrenta quem ameaçar e reforça a defesa quando um exército ataca. Guardas não contam no limite de seguidores, mas recebem soldo. Chame de volta pela conversa ou em Portfólio → Vilas e guardas.
- **Obras do chefe e do rei:** o chefe (dentro da vila) e o rei (no reino todo) podem abrir e remover estradas, **mudar de lugar** e **demolir** casas, lojas, tavernas, capelas, muralhas e todos os imóveis, e **erguer imóveis novos** nas vilas (B → Reformas e Obras), inclusive um **Porto** na beira da água (80 madeira e 40 pedra). O rei também pode mudar o castelo de lugar dentro do reino. Cavernas, acampamentos e santuários não saem do lugar. Suas próprias construções podem ser mudadas e demolidas em qualquer lugar.

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
- **Famílias com poder:** cada casa tem riqueza, influência e lealdade à coroa. As ricas abrem empreendimentos (moinho, empório, oficina, quinta, vinhedo) perto da vila, as mais influentes dão o **chefe da vila**, e as grandes fundam a **"Vila <Sobrenome>"**. Casas ambiciosas e desleais podem **declarar guerra à coroa**: rebeldes e guardas lutam perto da vila, você pode apoiar um dos lados, e se os rebeldes vencerem a família **toma o trono** e começa uma nova dinastia (inclusive no seu reino!). Como rei, "Conceder favores" aumenta a lealdade de uma casa.
- **Seus empreendimentos:** construa (B → Empreendimentos) Fazenda Comercial, Moinho, Serraria, Pedreira Própria, Mina, Ferraria e Empório, e contrate moradores (na conversa ou no próprio empreendimento). Cada funcionário recebe salário todo dia; especialistas do ofício rendem +50%. A produção fica guardada para recolher, ou é vendida automaticamente e o faturamento cai direto no seu ouro, sem precisar ir até lá. Funcionários na sua Taverna aumentam as vendas.
- **Até 10 capangas** desde o início, andando com você em formação.
- **População viva:** solteiros se casam, casais têm filhos, e a população dos reinos cresce. Vilas lotadas mandam famílias para vilas com espaço ou para vilas novas.
- **Fundar sua vila:** em Portfólio → Vilas e guardas (sem precisar de título nem de conquista), funde a "Vila <seu sobrenome>" no lugar onde estiver, livre de qualquer reino (100.000 🪙, o mesmo preço que os reis NPC pagam do tesouro para fundar uma vila). Colonos chegam, a vila cresce e paga 2 🪙 por morador todo dia.
- **Janela Portfólio (K):** além dos seus reinos, tem **Reino** (os 7 reinos: pessoas, crianças, famílias, vilas, nascimentos, corte real, famílias influentes e o chefe de cada vila), **Grandes Casas** (ranking das casas mais poderosas do mundo e as casas inquietas, com pouca lealdade à coroa), **Família**, **Vilas e guardas** e **Empreendimentos**.
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
- **Cavernas e masmorras:** 12 cavernas nas montanhas e 3 covis nas ilhas. Interior gerado, com esqueletos, aranhas, morcegos, minérios ricos e baús de tesouro. Chefes com itens lendários: Troll (Clava do Troll), Rei Esqueleto (Lâmina Ancestral), Aranha Rainha (Capuz de Seda) e Dragão Ancestral (Escamas, Coroa de Cristal e a Couraça de Escamas de Dragão).
- **Sons e música:** tudo sintetizado pelo próprio jogo, sem arquivos. Passos que mudam com o terreno, golpes, machado, picareta, arco, fogueira, chuva, moedas, rugido dos chefes, além de trilhas para menu, dia, noite, caverna e batalha. O volume fica nos Ajustes.
- **Estações:** Primavera, Verão, Outono e Inverno (2 dias cada). Folhas douradas no outono, neve e rios congelados no inverno, chuva e tempestade, colheitas diferentes, lobos mais fortes e mais fome no frio (o Manto de Pele de Lobo protege).
- **Jogos salvos:** 3 espaços, salvamento automático ao dormir, e exportar/importar em arquivo .json (no menu e nos Ajustes).
- **Geração em segundo plano:** o mundo é criado num Web Worker, com barra de progresso.

## Estrutura

```
index.html        página do jogo
css/style.css     interface (HUD, painéis, menu)
js/util.js        aleatoriedade, ruído, fila de prioridade
js/audio.js       sons e música sintetizados (Web Audio)
js/dungeon.js     cavernas, masmorras, monstros e chefes
js/features.js    arcos, cavalo, peso/baús, estações/clima, jogos salvos e geração em segundo plano
js/diplomacy.js   reinos vivos: guerras, alianças, casamentos reais e crônicas
js/farming.js     lavoura, animais, efeitos de comida e taverna do jogador
js/combat2.js     bloqueio, esquiva, golpe forte, ordens e batalhas em campo aberto
js/life.js        crescimento e ruína das cidades, caravanas
js/progress.js    conquistas, estatísticas, diário, dinastia e profissões
js/families.js    famílias, sobrenomes, chefes de vila, revoltas, vilas fundadas e empreendimentos com funcionários
js/royalcourt.js  convite e vida na corte dos reis (cargos, salário, audiências)
js/heraldry.js   bandeiras e brasões dos reinos (desenho e mudanças do rei)
js/crown.js       decretos, ações, obras reais e tribunal do rei
js/court.js       títulos de nobreza, conselho real, conspirações, casamentos arranjados e rivalidades
js/market.js      preços dinâmicos e caravanas do jogador
js/events.js      eventos no mundo e rotina dos moradores
js/homes.js       casas dos moradores (cada família constrói a sua)
js/urban.js       estradas, chefia das vilas e obras de chefes e reis (mover, criar e demolir imóveis)
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

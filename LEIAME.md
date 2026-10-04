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
- **7 reinos:** Valdória, Karthum, Nordheim, Elvaren, Mordrak, Brennor e Valtaris. Cada um tem castelo, 3 vilas espaçadas (Armazém, Ferreiro, Madeireira, Pedreira, Taverna, casas e plantações), território com fronteiras, estradas e economia própria. Há 14 acampamentos de bandidos.
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

## Novidades desta versão

- **Corte do rei:** cada reino mede o seu reconhecimento (serviços prestados, fama e relação). Com reconhecimento 40+ e relação 40+, o rei convida você para a corte. Na corte você recebe salário todo mês, escolhe um cargo conforme o reconhecimento (Conselheiro, Tesoureiro Real, General do Rei ou Embaixador), pede audiências ao rei, pede escolta (General) e propõe alianças, paz ou guerra (Embaixador). É preciso aparecer no castelo pelo menos a cada 3 meses; guerra com o reino ou relação muito baixa tiram você da corte.
- **Bandeira e brasão:** cada reino tem a sua bandeira (tremulando nas torres do castelo e na arena) e o seu brasão (sobre o portão do castelo e nas janelas). Quando você é o rei, a aba **Reino → Bandeira e brasão** deixa mudar o nome do reino, a cor (fronteiras, mapa, telhados e guardas), o metal (segunda cor), o desenho da bandeira, a divisão do escudo e o símbolo. Tudo fica no jogo salvo e dá para voltar ao original.
- **Tudo renasce em 1 ano:** arbustos de frutas, linho, ervas e argila agora também levam 1 ano do jogo para voltar, como árvores, pedras e minérios.

- **Cada família tem sua casa:** o casal e os filhos (ou o adulto solteiro) dormem na própria casa. Quem não tem ocupa uma livre ou constrói uma nova perto da vila: a obra leva 3 dias, aparece com andaime e barra de progresso, e os moradores trabalham nela de dia. As casas novas ficam no jogo salvo.
- **Avisos em janelinhas:** as mensagens aparecem em janelinhas flutuantes no tema do jogo, com ícone, botão de fechar e uma barrinha do tempo; avisos repetidos mostram ×2, ×3...
- **Relógio alinhado:** data, estação, ano e hora numa linha só.

- **Economia no ritmo de antes:** impostos, soldos, salários, renda dos reinos, guerras, revoltas e colheitas andam uma vez por mês.
- **Resumo das contas:** em vez de uma mensagem a cada minuto, aparece um resumo a cada mês (ouro e itens). Os detalhes ficam no Diário → Contas. Avisos importantes continuam aparecendo na hora.
- **Vida em ritmo próprio:** as pessoas envelhecem, casam e têm filhos uma vez por ano do calendário, em janeiro (a cada 72 minutos reais), então as famílias e a dinastia continuam vivas.
- **Eventos no mundo:** tesouro enterrado para cavar (picareta ou enxada) e, raramente, um Dragão Ancestral fora das cavernas. Cada evento aparece marcado no mapa.
- **Capangas mais fortes:** sobem de nível com a experiência (mais dano, defesa e vida) e têm postura: Agressivo, Equilibrado ou Defensivo (converse com eles ou use Equipar e treinar).
- **Rotina dos moradores:** trabalham de dia, ao entardecer muitos vão à taverna (o padre vai à capela) e à noite entram em casa para dormir. As janelas acendem quando há gente em casa.
- **Segurar para repetir:** segure o clique, o Espaço ou o botão Atacar para bater e coletar sem parar. O golpe forte agora é segurando V (no controle, RT; no celular, o botão 💥).
- **Ícone do jogo** na aba do navegador.

- **Calendário de verdade:** o jogo conta meses, não dias. O relógio tem uma pizza que se enche em 5 minutos de dia; quando ela completa, escurece, vira o mês e vem 1 minuto de noite. Cada mês dura 6 minutos e o ano (12 meses) 72 minutos. O jogo começa em dezembro. As estações seguem os meses: primavera (março a maio), verão (junho a agosto), outono (setembro a novembro) e inverno (dezembro a fevereiro). O aniversário de todos é em janeiro, e o Grande Torneio dura o mês de junho inteiro.
- **Metade das montanhas:** as montanhas mais baixas viraram colinas (ou neve, no norte), com minérios. Vale também para jogos salvos antigos; castelos, vilas e cavernas continuam no mesmo lugar.
- **Recursos renascem em 1 ano:** árvores, pedras e minérios coletados só voltam a crescer 1 ano (do jogo) depois.
- **Estradas:** B → Estradas. Clique e arraste para abrir estradas, de graça; sobre rio raso vira ponte. "Remover estrada" tira qualquer estrada ou ponte, até as do mapa (nas vilas e castelos dos outros, só o chefe ou o rei). O Muro de Pedra (e a muralha das vilas) custa só 1 pedra.
- **Chefe de vila:** vire chefe fundando sua vila, **pela força** (converse com o chefe e desafie-o: derrote a milícia; o rei decide se o ataque é uma afronta à coroa ou se a vila se defende sozinha) ou **pela diplomacia** (no castelo, peça a chefia ao rei com boa relação e ouro). O chefe recebe os impostos dos moradores.
- **Guardas:** como chefe de vila ou rei, converse com um capanga e escolha "Mandar fazer guarda": ele patrulha a sua vila (até 6 guardas) ou o seu castelo (até 12), enfrenta quem ameaçar e reforça a defesa quando um exército ataca. Guardas não contam no limite de seguidores, mas recebem soldo. Chame de volta pela conversa ou em Portfólio → Vilas e guardas.
- **Obras do chefe e do rei:** o chefe (dentro da vila) e o rei (no reino todo) podem abrir e remover estradas, **mudar de lugar** e **demolir** casas, lojas, tavernas, capelas, muralhas e todos os imóveis, e **erguer imóveis novos** nas vilas (B → Reformas e Obras). O rei também pode mudar o castelo de lugar dentro do reino. Cavernas, acampamentos e santuários não saem do lugar. Suas próprias construções podem ser mudadas e demolidas em qualquer lugar.

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
- **Fundar sua vila:** em Portfólio → Vilas e guardas, com o título civil Conquistador, funde a "Vila <seu sobrenome>" no lugar onde estiver, livre de qualquer reino (10.000 🪙). Colonos chegam, a vila cresce e paga 2 🪙 por morador todo dia.
- **Janela Portfólio (K):** além dos seus reinos, tem **Reino** (os 7 reinos: pessoas, crianças, famílias, vilas, nascimentos, corte real, famílias influentes e o chefe de cada vila), **Grandes Casas** (ranking das casas mais poderosas do mundo e as casas inquietas, com pouca lealdade à coroa), **Família**, **Vilas e guardas** e **Empreendimentos**.
- O criador de herói agora pede o **sobrenome da família**.

## Versão anterior


- **NPCs espalhados:** cada morador fica perto da própria casa e eles se afastam uns dos outros. Clique direto numa pessoa para conversar (um anel dourado mostra quem está sob o cursor).
- **Cidades vivas:** vilas prósperas ganham casas novas e um poço (nível 2) e depois muralhas (nível 3). Vilas atacadas na guerra ficam com casas em ruínas, que se reconstroem com o tempo.
- **Batalhas em campo aberto:** reinos em guerra mandam exércitos se enfrentarem. Ao chegar perto, escolha um lado ou fique de fora; vencendo, você ganha ouro, experiência e relação.
- **Combate novo:** escudos (Madeira, Ferro e Aço) com bloqueio pelo botão direito, golpe forte carregado (segure V) e esquiva (Z). Ordens aos capangas com T.
- **Lavoura:** Enxada para arar, plantar (trigo, cenoura, repolho e cevada) e colher; Regador (encha na água). A chuva também rega e no inverno a terra congela. **Criação:** Galinheiro (ovos), Curral (leite de vaca e lã de ovelha) e Colmeia (mel). Os animais passeiam perto das construções.
- **Culinária e bebidas:** Forno a Lenha (sopa, omelete, ensopado, torta de carne, bolo de mel) e Cervejaria (cerveja, hidromel, vinho). Cada prato dá um efeito temporário (força, defesa, vigor, cura, sabedoria, coragem, charme), mostrado embaixo do painel do herói. **Sua Taverna** vende os pratos e bebidas do balcão todo amanhecer.
- **Caravanas:** viajam entre as capitais. Escolte-as contra bandidos para ganhar recompensa, ou assalte-as (o reino fica furioso).
- **Profissões dos filhos:** a partir dos 12 anos, converse com seu filho e escolha Ferreiro, Lavrador, Comerciante, Cavaleiro, Governador ou Erudito; cada um ajuda a família.
- **Diário do herói:** 33 conquistas, estatísticas, árvore da dinastia e o diário com os grandes momentos.
- **Dificuldade:** Fácil, Normal ou Difícil (no menu e nos Ajustes). No Fácil, morrer leva você de volta para casa.
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
js/court.js       títulos de nobreza, conselho real, conspirações, casamentos arranjados e rivalidades
js/market.js      preços dinâmicos e caravanas do jogador
js/events.js      eventos no mundo e rotina dos moradores
js/homes.js       casas dos moradores (cada família constrói a sua)
js/urban.js       estradas, chefia das vilas e obras de chefes e reis (mover, criar e demolir imóveis)
js/siege.js       portões, aríetes, catapultas e ataques inimigos às suas terras
js/arena.js       arenas, duelos, justas, Grande Torneio e apostas
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

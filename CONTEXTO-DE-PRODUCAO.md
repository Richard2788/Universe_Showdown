# Contexto de Produção — Universe Showdown

> Documento de referência do produto e da implementação. Use este arquivo para orientar decisões de design, arquitetura, desenvolvimento, testes e futuras contribuições.
> **Estado do projeto:** protótipo jogável (alpha), atualizado em **2026-11-24**.
> **Legenda de status:** **Implementado** = existe no código e tem evidência verificável (teste automatizado ou build); **Parcial** = funciona, mas falta uma parte relevante ou validação; **Pendente** = não existe na build atual.
> Status de código não substitui validação em aparelho físico. O que depende de celular real, deploy ou licença continua pendente até ser comprovado.

## 0. Estado atual da implementação

O projeto saiu do scaffold e hoje é um **protótipo jogável de luta local**. É possível abrir o jogo, escolher a dificuldade da CPU, jogar **Jogador vs CPU**, assistir **CPU vs CPU** ou percorrer a **campanha de 5 fases** (melhor de 3 rounds, cronômetro, pontuação e tela de resultado). O combate tem quatro golpes, defesa direcional, posturas, stun, knockback, efeitos de bloqueio e IA com cinco perfis (três no menu rápido; `elite`/`lendario` nas fases finais).

Ainda não é o MVP completo: faltam save/progressão persistente, seleção de personagem, gamepad, áudio, validação em aparelho físico e publicação no Render.

| Área | Status | Evidência no projeto |
|---|---|---|
| Fundação e build | Implementado | Vite 7, scripts npm, `package-lock.json`; build verificada em 2026-11-23. |
| Arena e loop | Implementado | Canvas lógico 960 × 540, passo fixo de 1/60 s, DPR limitado a 2 e `ResizeObserver`. |
| Movimentação | Implementado | `src/fighters/Fighter.js`, `src/game/physics.js`, `src/config/game.js`; coberta por testes. |
| Combate | Implementado | Quatro golpes com startup/active/recovery, dano, alcance, altura, chip e knockback. |
| Defesa | Implementado | Defesa direcional em pé/agachado, blockstun, empurrão e efeito visual de bloqueio. |
| IA | Implementado | `src/ai/CPUController.js` com cinco perfis (três no menu; `elite`/`lendario` nas fases 4 e 5), reação, esquiva, bloqueio e punição. |
| Animações | Parcial | Plasmo com arte real por estado; oponente ainda em atlas placeholder; sem `victory`/`defeat`. |
| Modos e menu | Implementado | Menu inicial com chips das 5 fases, `pvc`, `cvc`, campanha, seleção de dificuldade e tela cheia. |
| Controles | Parcial | Touch multi-touch e teclado implementados; gamepad pendente. |
| Partida | Implementado | Campanha: melhor de 3, cronômetro, pontuação, progressão e resultado. Partida rápida: vida única e `READY`/`ROUND END`. |
| Áudio | Pendente | Nenhum som ou música implementado. |
| On-line e persistência | Pendente | Fora do MVP; não há backend obrigatório. |
| Testes automatizados | Implementado | 12 arquivos de teste, 25 suítes e 110 checks passando (`npm test`). |
| Publicação | Pendente | Instruções de Render existem; não há URL publicada registrada. |
| Validação em celular físico | Pendente | Nenhum registro de teste em Android/iOS real. |
| Licenças de assets | Pendente | Origem/licença do Plasmo ainda não documentada; ver `CREDITS.md`. |

### O que já é jogável

- Iniciar uma partida contra a CPU em três dificuldades no menu rápido.
- Assistir CPU vs CPU, com controles touch ocultos.
- Jogar a campanha de 5 fases (melhor de 3 rounds, cronômetro e pontuação), com IA `elite`/`lendario` nas fases finais.
- Andar, correr, pular, agachar, defender e executar leve, médio, forte e chute.
- Bloquear golpes altos/médios em pé, médios/baixos agachado, sofrer chip apenas no forte e ser empurrado pelo bloqueio.
- Esquivar de golpes de chão com o pulo e atravessar o oponente por cima.
- Ver barra de vida, status da partida, feedback de bloqueio e overlay de debug (`?debug=1`).
- Reiniciar os lutadores pelo botão **REINICIAR**.

### O que ainda falta para o MVP

- Save/progressão persistente da campanha, seleção de personagem e desbloqueios (Sable planejada).
- Balanceamento fino das fases finais com base em playtest real.
- Gamepad.
- Áudio e controle de volume.
- Pausa explícita por perda de foco/aba oculta (hoje há limpeza de input e clamp de delta).
- Segundo personagem real, arena com arte final e efeitos de impacto mais completos.
- Validação de ergonomia, multi-touch e desempenho em Android/iOS reais.
- Build publicada no Render e URL registrada.
- Licença do código e origem/licença dos assets.

### Verificação desta atualização

Em 2026-11-24:

- `npm test` → **110 checks aprovados**, 25 suítes, 0 falhas.
- `vite build` em diretório temporário → **build concluída sem erro**.
- `sat` consta em `package.json`, mas **não é importado** por nenhum módulo de `src/` ou `tests/`.

## 0.1 Fontes de verdade

Os documentos descrevem o estado; o código define o comportamento. Quando houver divergência, vale o arquivo abaixo — e o documento deve ser corrigido.

| Assunto | Fonte de verdade |
|---|---|
| Golpes, dano, alcance, stun, knockback e estados do lutador | `src/fighters/Fighter.js` |
| Arena, velocidades, passo fixo, margem e spawns | `src/config/game.js` |
| Separação de corpos e virada de face | `src/game/physics.js` |
| Controles e atalhos de teclado | `src/config/controls.js`, `src/core/InputManager.js` |
| IA e perfis de dificuldade | `src/ai/CPUController.js` |
| Corrida por duplo-toque | `src/core/RunDetector.js` |
| Loop com passo fixo | `src/core/GameLoop.js` |
| Animação e arte do Plasmo | `src/characters/Plasmo.js`, `src/characters/animations.js`, `src/rendering/SpriteAnimator.js` |
| Regras visuais e responsividade | `src/styles/main.css`, `src/rendering/CanvasRenderer.js` |
| Estrutura de assets e pipeline | `ASSETS-ATLAS.md` |
| Contrato de regressão | `tests/*.test.mjs` |

## 1. Visão do produto

Desenvolver um jogo de luta 2D tradicional, em visão lateral, executado diretamente no navegador e concebido sob a abordagem **Mobile First**. A experiência principal é projetada primeiro para celulares, especialmente para partidas em orientação horizontal; a versão desktop é uma adaptação da mesma aplicação, com teclado e, futuramente, gamepad. O jogo terá confrontos um contra um, personagens com animações próprias, arena, barras de vida, cronômetro, rounds e um adversário controlado por inteligência artificial local.

A experiência deve lembrar a clareza e a resposta dos jogos clássicos de luta, mas possuir identidade visual, personagens, nomes, cenários, sons e animações originais. Referências a jogos existentes servem apenas para comunicar convenções de gênero e controles; não devem ser copiadas marcas, personagens, sprites, músicas, interfaces protegidas ou outros conteúdos de terceiros.

### Objetivo da primeira versão jogável (MVP)

Entregar uma luta local funcional entre o jogador e um oponente controlado pelo computador, com:

- movimentação horizontal, salto, agachamento e corrida;
- defesa básica;
- quatro comandos de ataque: leve, médio, forte e perna;
- hitboxes, hurtboxes, dano, reação ao golpe e invulnerabilidade/recuperação conforme o estado do personagem;
- barra de vida, cronômetro, rounds e resultado;
- controles touchscreen como forma primária de interação;
- layout, HUD e área de combate projetados primeiro para telas mobile;
- suporte a teclado e à Gamepad API como formas alternativas de entrada;
- adaptação da experiência mobile para desktop, sem duplicar a lógica do jogo;
- build estático publicável no Render.

O status de cada item está na seção 9. O que já está implementado não deve ser tratado como “planejado”; o que falta não deve ser tratado como concluído.

## 2. Público e plataformas

### Princípio obrigatório: Mobile First

Mobile First é uma decisão de produto e de engenharia, não apenas uma etapa de responsividade. Toda nova tela, controle ou funcionalidade deve ser projetada e validada primeiro em um celular real. A experiência desktop deve herdar a mesma hierarquia, clareza e regras de jogo, com controles alternativos.

Requisitos de design e implementação:

- Priorizar a partida em paisagem (landscape), pois a arena de luta exige espaço horizontal. Menus e telas informativas podem funcionar em retrato.
- Em retrato durante a partida, apresentar uma instrução clara para girar o aparelho; não depender de bloqueio obrigatório de orientação via API.
- Usar alvos de toque confortáveis, com referência mínima de 48 × 48 CSS px para comandos primários, espaçamento suficiente e estados visuais de pressionado/desabilitado.
- Posicionar os controles de movimento à esquerda e os quatro ataques à direita, mantendo pulo e agachamento acessíveis sem encobrir HUD ou área de combate. Validar ergonomia em diferentes larguras e proporções.
- Permitir multi-touch real: movimentar, pular/agachar e atacar em combinações simultâneas.
- Não depender de hover, clique preciso, teclado físico ou mouse para qualquer ação essencial.
- Respeitar áreas seguras de telas com recortes e barras do sistema (`safe-area-inset-*`), além das barras dinâmicas dos navegadores mobile.
- Evitar rolagem, zoom acidental e gestos do navegador somente dentro da superfície de jogo/controles, sem bloquear a página inteira desnecessariamente.
- Tratar pausa, troca de aba, interrupção, bloqueio de tela, rotação e retorno ao jogo sem deixar botões presos ou simulação avançando indevidamente.
- Validar desempenho, legibilidade, temperatura/consumo percebido e carregamento dos assets em celulares reais antes de considerar a experiência pronta.

Como referência inicial de teste, considerar uma viewport de jogo em paisagem a partir de aproximadamente 640 × 360 CSS px e também aparelhos menores. Essa referência é um alvo de validação, não uma restrição rígida: a interface deve degradar com elegância e nunca cortar comandos essenciais.

### Estado da validação mobile

A implementação responsiva existe: meta viewport com `viewport-fit=cover`, `100dvh` com fallback, variáveis de safe area, `touch-action: none` restrito à arena/controles, aviso de retrato e layout compacto por altura. Também existe botão de tela cheia com tentativa de travamento em paisagem.

O que **ainda não foi feito**:

- teste em aparelho Android/iOS físico;
- medição de desempenho e consumo em celular intermediário;
- validação de ergonomia em diferentes tamanhos e recortes;
- confirmação de que nenhum botão fica preso após rotação, chamada ou troca de aba.

### Plataformas-alvo

- **Prioridade 1:** navegadores mobile atuais em Android e iOS, com partida preferencialmente em orientação horizontal.
- **Prioridade 2:** navegadores desktop atuais com suporte a Canvas 2D e JavaScript moderno, usando teclado e suporte opcional a gamepad.
- Controles USB/Bluetooth reconhecidos pelo navegador, quando expostos pela Gamepad API — **pendente**.

### Abordagem multiplataforma

Manter **uma única base de código** e uma abordagem Mobile First. A simulação, as regras de combate, os personagens, a IA e a renderização são compartilhados. A interface touchscreen é a referência primária; teclado, gamepad e ajustes de layout para telas grandes são adaptadores da mesma experiência.

O jogador acessa o mesmo endereço web. Não faz parte do MVP criar aplicativos nativos separados para Android, iOS, Windows ou macOS.

## 3. Experiência e regras de jogo

### Formato atual da partida

- Visão lateral 2D e combate um contra um.
- Menu inicial sobre a arena, com o jogo congelado até a escolha do modo.
- Modos **Jogador vs CPU** (`pvc`), **CPU vs CPU** (`cvc`) e **Campanha · 5 fases**. No modo espectador, os controles touch ficam ocultos.
- Na partida rápida, cada lutador começa com **100 de vida**; a partida termina quando uma vida chega a zero e o status muda para `ROUND END`.
- Na campanha, cada fase define vida máxima, paleta, escala, perfil de IA e tempo de round; a partida é melhor de 3 rounds, com vitória por nocaute ou por maior vida no tempo, pontuação acumulada e overlay de resultado (próxima fase, retry ou reinício da campanha).
- A dificuldade da CPU pode ser trocada no menu ou pelos atalhos `1`, `2` e `3` durante a partida rápida.

### Formato da partida (implementado)

- Campanha com 5 fases escalonadas: SENTINELA, VOLT, KRONOS, NÊMESIS e ÔMEGA.
- Melhor de 3 rounds por fase, cronômetro por round e placar de rounds.
- Pontuação por round, vida restante, tempo, KO, round perfeito, dano causado e bônus de fase.
- Tela de resultado com **PRÓXIMA FASE**, **TENTAR NOVAMENTE**, **JOGAR NOVAMENTE** e **VOLTAR AO MENU**.
- Reinício de round/fase sem recarregar a página; save persistente ainda pendente.

### Movimentação

| Parâmetro | Valor atual | Observação |
|---|---:|---|
| Velocidade de caminhada | 125 px/s | Metade do valor original. |
| Velocidade de corrida | 250 px/s | Somente para frente; nunca para recuar. |
| Impulso do pulo | 620 px/s | Arco mais alto para permitir atravessar o oponente. |
| Gravidade | 1500 px/s² | — |
| Velocidade do pulo travado | 62,5 px/s (corrida: 250 px/s) | Direção e velocidade fixadas no impulso; sem controle no ar. |
| Janela de buffer do pulo | 0,1 s | Cobre input pouco antes da aterrissagem. |
| Recuperação de aterrissagem | ~0,42 s | 9 frames de 0,047 s; mantém o estado `jump` no solo. |
| Margem lateral da arena | 55 px | Ninguém ultrapassa a borda. |
| Spawns | 300 / 660 px | Jogador à esquerda; oponente à direita. |

Regras implementadas:

- Andar para a esquerda/direita, pular, agachar e correr.
- A corrida é acionada por **duplo-toque na direção** (janela de 0,28 s) ou por **Shift** no teclado. Só funciona para frente e não substitui a defesa ao recuar.
- O pulo inicia na borda de subida; segurar o botão não repete o pulo.
- **Pulo travado:** a direção e a velocidade horizontal são fixadas no impulso — depois de pular não dá para mudar o arco nem acelerar (andar: 62,5 px/s; corrida antes do pulo: impulso de 250 px/s mantido; sem direção: pulo reto). No ar também não vale agachar, atacar ou bloquear.
- No ar, os corpos podem se sobrepor (pulo atravessa quando a direção aponta para o oponente). No chão, `separateBodies` impede que as hurtboxes se cruzem.
- Quando um lutador aterrissa em cima do outro, a separação empurra apenas quem está por cima, evitando deslizar o oponente.
- A face de cada lutador é atualizada todo frame para encarar o oponente.
- Agachado não anda: a defesa agachada fica parada no lugar.
- A arena tem limites laterais; a câmera é fixa e a arena inteira cabe na resolução lógica.

### Ataques

Fonte da verdade: `ATTACKS` em `src/fighters/Fighter.js`.

| Golpe | Duração | Janela ativa | Dano | Alcance | Altura | Blockstun | Chip | Knockback |
|---|---:|---:|---:|---:|---|---:|---:|---:|
| Leve | 0,28 s | 0,14–0,22 s | 5 | 82 px | `high` | 0,14 s | 0 | 0 |
| Médio | 0,48 s | 0,24–0,33 s | 10 | 62 px | `mid` | 0,18 s | 0 | 0 |
| Forte | 0,72 s | 0,32–0,50 s | 16 | 96 px | `mid` | 0,26 s | 2 | 340 px/s |
| Chute | 0,52 s | 0,13–0,39 s | 12 | 67 px | `low` | 0,20 s | 0 | 240 px/s |

Observações:

- `startup` corresponde ao início da janela ativa (`activeStart`). A 60 Hz, os valores equivalem aproximadamente a 8, 14, 19 e 8 frames para leve, médio, forte e chute — não confundir com a duração total.
- O alcance é medido do centro do lutador e somado à meia-largura da hurtbox do alvo.
- `maxTargetY` limita a altura do alvo: leve, médio e chute usam 90; o forte usa 110 e alcança pulos baixos. Pular é uma esquiva real.
- `height` define a relação com a postura:
  - `high` passa por cima de quem está agachado (a menos que o alvo levante);
  - `low` atinge agachado, mas só é bloqueado por defesa agachada — fura o block em pé;
  - `mid` atinge agachado e é bloqueável nas duas posturas.
- Cada golpe só pode acertar o mesmo alvo uma vez (`attackHit`). Não há golpes multi-hit.
- Durante hitstun, o defensor fica 0,3 s sem ações; o knockback desliza com atrito de 1200 px/s².
- Não há cancelamento, combo, guard meter ou prioridade complexa.

### Defesa e reação

- Defesa tradicional: segurar a direção que se afasta do oponente, no chão e sem atacar.
- Defesa em pé bloqueia `high` e `mid`.
- Defesa agachada bloqueia `mid` e `low`.
- O `low` (chute) **fura** a defesa em pé; o `high` (leve) **passa por cima** de quem está agachado.
- O forte aplica **2 de chip** ao ser bloqueado; leve, médio e chute não tiram vida no bloqueio.
- Todo bloqueio válido aplica blockstun e empurra o defensor:
  - golpes normais: 28 px;
  - forte: 46 px.
- O efeito visual de bloqueio dura 0,28 s e fica mais intenso no forte.
- Bloqueio não gera knockback; o deslocamento é o empurrão de defesa somado ao recuo da caminhada, quando houver.
- Não há defesa no ar, parry, just-frame ou barra de guarda.

### IA da CPU

A IA usa as mesmas ações e os mesmos dados de golpe do jogador — não recebe alcance extra nem lê hitboxes ocultas.

| Dificuldade | Reação | Ritmo de decisão | Agressividade | Esquiva | Corre a partir de | Golpes permitidos |
|---|---:|---:|---:|---:|---:|---|
| Fácil | 0,45–0,80 s | 0,40–0,80 s | 25% | 15% | 200 px | Leve e chute |
| Médio | 0,25–0,40 s | 0,22–0,40 s | 50% | 35% | 130 px | Leve, médio e chute |
| Difícil | 0,10–0,20 s | 0,12–0,20 s | 75% | 60% | 130 px | Todos, com punição |
| Elite (fase 4) | 0,06–0,12 s | 0,08–0,14 s | 88% | 70% | 120 px | Todos, com punição |
| Lendário (fase 5) | 0,03–0,08 s | 0,05–0,10 s | 95% | 80% | 110 px | Todos, com punição |

**Bloqueio (2026-11-24):** clássico e confiável em todos os perfis — ao ver o oponente atacar em alcance (140 px), a CPU segura o recuo até o fim do golpe; contra chute ela agacha junto (a guarda em pé fura). `dodgeChance` só decide esquivar em vez de bloquear; não existe mais "chance de bloquear".

Comportamentos implementados:

- aproximar, recuar, pausar, pular e correr;
- **bloquear segurando o recuo** (e agachar contra chute), com o atraso do perfil;
- escolher golpes por alcance, altura do alvo e postura;
- punir hitstun/recuperação apenas no difícil;
- respeitar startup, recovery, hitstun, aterrissagem e estado do próprio personagem;
- usar pesos de ataque e evitar repetição sem intervalo.

Ainda não há aprendizado, adaptação ao padrão do jogador ou níveis além dos cinco perfis (`facil`, `medio`, `dificil`, `elite`, `lendario`).

### Menu, modos e parâmetros de URL

- `?diff=facil|medio|dificil` pré-seleciona a dificuldade (padrão: `facil`).
- `?debug=1` (qualquer valor) liga o overlay com hurtbox, hitbox, posição, vida, knockback, estado/frame e estado interno da IA.
- `M` abre o menu quando ele está fechado; fechar o menu retorna ao modo anterior sem reiniciar a partida.
- Iniciar uma partida pelo menu sempre chama `reset()` e limpa o input.

## 4. Controles

### Mobile — controles primários

- Direcional virtual no lado esquerdo (esquerda/direita).
- Botões de ataque no lado direito: leve, médio, forte e chute.
- Botões utilitários de pular e agachar acima dos ataques.
- Corrida por duplo-toque na direção; não há botão dedicado de corrida no touch.
- No modo espectador (CPU vs CPU), os controles touch são ocultados.
- Os alvos são dimensionados por `clamp()` conforme a viewport:
  - movimento: ~57–73 px;
  - ataques: ~44–56 px (40 px no layout estreito de retrato);
  - utilitários: ~26–34 px.
- A referência de 48 × 48 px é atendida pelos comandos primários na maioria dos tamanhos, mas **não pelos utilitários** e pode cair para 44 px em telas pequenas (40 px em retrato estreito).
- O estado visual é separado do estado lógico; `pointerup`, `pointercancel`, `lostpointercapture`, `blur`, `visibilitychange` e `pagehide` limpam os botões.
- Cada `pointerId` é rastreado de forma independente; dois dedos no mesmo botão mantêm a ação até o último soltar.

### Desktop — teclado

| Ação | Tecla padrão |
|---|---|
| Esquerda / direita | `A` / `D` ou setas `←` / `→` |
| Pular | `W`, `↑` ou `Espaço` |
| Agachar | `S` ou `↓` |
| Ataque leve | `J` |
| Ataque médio | `K` |
| Ataque forte | `L` |
| Chute | `U` |
| Correr | `Shift` (somente para frente) |
| Dificuldade | `1` fácil, `2` médio, `3` difícil |
| Menu | `M` |
| Tela cheia | `F` |

O mapeamento fica centralizado em `src/config/controls.js`. É possível manter uma direção pressionada e atacar ao mesmo tempo; `InputManager` só desliga uma ação quando nenhuma fonte a mantém.

### Gamepad

**Pendente.** Não há implementação de Gamepad API, mapeamento documentado ou fallback testado. O jogo continua utilizável sem controle.

### Requisitos de implementação dos controles touchscreen

| Requisito | Status |
|---|---|
| `touch-action: none` restrito à superfície de jogo/controles | Implementado |
| Pointer Events com captura de ponteiro | Implementado |
| Tratamento de `pointerup`, `pointercancel` e `lostpointercapture` | Implementado |
| Multi-touch por `pointerId`, sem booleano global | Implementado |
| Estado visual separado do estado lógico | Implementado |
| Limpeza em `blur`, `visibilitychange` e `pagehide` | Implementado |
| Alvos de 48 px em todos os comandos | Parcial (utilitários menores) |
| Validação em aparelho físico | Pendente |

## 5. Diretrizes técnicas

### Stack atual

| Tecnologia | Responsabilidade | Status |
|---|---|---|
| HTML5 | Estrutura da página e ponto de entrada. | Implementado |
| Canvas 2D | Arena, lutadores e efeitos. | Implementado |
| JavaScript ES Modules | Regras, simulação, controles, IA e organização dos módulos. | Implementado |
| CSS | Menus, HUD, botões mobile, layout responsivo e overlays. | Implementado |
| Vite | Servidor de desenvolvimento e build de produção. | Implementado |
| SAT.js (`sat`) | Reservado para colisão geométrica 2D futura. | Declarado, não integrado |
| Render Static Site | Hospedagem da build estática. | Planejado, não publicado |
| Node.js | Ambiente de desenvolvimento e testes. | `>=20.19.0` em `package.json` |

### Decisão sobre colisão e SAT.js

O pacote `sat` está instalado, mas **não é importado** por nenhum módulo. A colisão atual é própria e suficiente para as hitboxes/hurtboxes retangulares do protótipo:

- acerto por alcance horizontal: `|oponente.x - atacante.x| < reach + hurtbox.halfWidth`;
- limite de altura por `maxTargetY`;
- regra explícita de postura (`high`/`mid`/`low`);
- separação de corpos em 1D quando ambos estão no chão.

**Decisão:** não integrar SAT.js nesta fase. A biblioteca passa a ser útil se o projeto adotar hurtboxes/hitboxes poligonais, membros articulados ou golpes com trajetória geométrica real. Até lá, a dependência é uma dívida técnica opcional, não um requisito do MVP. A integração exigiria refazer testes, alinhar coordenadas de sprites e rebalancear alcances, sem ganho de jogo para o formato atual.

### Simulação e renderização

- `requestAnimationFrame` sincroniza a renderização com o navegador.
- A simulação roda em passo fixo de **1/60 s**, com acumulador de delta.
- O delta é limitado a **0,1 s** após pausas/abas em segundo plano.
- A renderização ocorre uma vez por frame de `requestAnimationFrame`, sem alterar a velocidade do combate.
- Animação avança no mesmo passo da simulação, não no render.
- Estados não-loop (`hit`, golpes, `jump`) congelam no último frame.
- Exceções em `update`/`render` são registradas e não interrompem o loop.
- Não há interpolação visual entre estados.
- O menu congela a simulação (`Game.update` retorna cedo), mas o render continua.

### Resolução e adaptação de tela

- Resolução lógica da arena: **960 × 540**.
- Canvas escalado para caber na área disponível, preservando a proporção, com barras de letterbox se necessário.
- `devicePixelRatio` limitado a **2** para evitar custo excessivo.
- `ResizeObserver` recalcula o canvas e os offsets.
- Meta viewport: `width=device-width, initial-scale=1, viewport-fit=cover`.
- `100dvh` com fallback para `100vh`.
- Safe areas aplicadas em HUD, controles, menu e rodapé.
- Em retrato, um aviso cobre a arena pedindo para girar o aparelho.
- Layout compacto por altura (520 px e 400 px) e por largura estreita (380 px).
- Em desktop com mouse/hover, controles touch são ocultados e a área de jogo cresce.
- Tela cheia via Fullscreen API; se indisponível (ex.: iPhone Safari), o botão é ocultado.
- Tentativa de travar orientação em paisagem ao entrar em tela cheia, com falha silenciosa quando o navegador não permite.
- Não há pausa explícita ao ocultar a aba; apenas limpeza de input e clamp do delta.

### Build e publicação

- `npm run dev` inicia o Vite com `--host 0.0.0.0`.
- `npm run build` gera `dist/`.
- `npm run preview` serve a build localmente.
- `npm test` executa os testes com `node --test`.
- O deploy planejado é um **Render Static Site** com `npm ci && npm run build` e publish directory `dist`.
- Ainda não há publicação, URL pública ou data de deploy registrada.

## 6. Arquitetura real

```text
src/
├── main.js
├── config/
│   ├── game.js
│   └── controls.js
├── core/
│   ├── GameLoop.js
│   ├── InputManager.js
│   └── RunDetector.js
├── fighters/
│   └── Fighter.js
├── game/
│   ├── Game.js
│   └── physics.js
├── ai/
│   └── CPUController.js
├── characters/
│   ├── animations.js
│   ├── Plasmo.js
│   └── PlaceholderAtlas.js
├── rendering/
│   ├── CanvasRenderer.js
│   └── SpriteAnimator.js
├── ui/
│   ├── HUD.js
│   ├── TouchControls.js
│   └── FullscreenToggle.js
└── styles/
    └── main.css
```

### Responsabilidades

| Módulo | Responsabilidade |
|---|---|
| `main.js` | Inicializa o jogo, menu, touch, teclado, tela cheia e tratamento de erros. |
| `Game.js` | Orquestra modos, lutadores, IA, loop, reset, animadores e render. |
| `Fighter.js` | Estados, física do lutador, ataques, defesa, dano, stun, knockback e dados de golpe. |
| `physics.js` | Separação de corpos e atualização de face, sem dependência de DOM. |
| `CPUController.js` | Decisões da IA e emissão de ações no mesmo formato do input humano. |
| `GameLoop.js` | Passo fixo, clamp de delta, render e tolerância a exceções. |
| `InputManager.js` | Ações unificadas por fonte (teclado/touch) e limpeza. |
| `RunDetector.js` | Duplo-toque na direção para corrida. |
| `CanvasRenderer.js` | Arena, cenário procedural, lutadores, debug e efeito de bloqueio. |
| `SpriteAnimator.js` | Seleção de frame, `frameAnchors`, recorte e desenho da atlas. |
| `HUD.js` | Escrita de vida, rótulos e status no DOM. |
| `TouchControls.js` | Pointer Events multi-touch e estado visual dos botões. |
| `FullscreenToggle.js` | Fullscreen API e tentativa de orientação. |
| `Plasmo.js` / `animations.js` | Dados de animação por estado. |
| `PlaceholderAtlas.js` | Atlas procedural para oponente e fallback. |

### Fluxo de entrada

Teclado, touchscreen e futuro gamepad são convertidos para o mesmo formato de ações. O sistema de combate não sabe qual dispositivo originou a ação.

```js
const actions = {
  left: false,
  right: false,
  jump: false,
  crouch: false,
  run: false,
  lightAttack: false,
  mediumAttack: false,
  heavyAttack: false,
  kick: false,
};
```

### Estados do lutador

Estados usados pelo `SpriteAnimator` e derivados de `Fighter.getState()`:

`idle`, `walk`, `run`, `jump`, `crouch`, `block`, `hit`, `lightAttack`, `mediumAttack`, `heavyAttack`, `kick`.

Estados lógicos internos adicionais:

- `blockTimer > 0` → blockstun;
- `hitTimer > 0` → hitstun;
- `landingTimer > 0` → recuperação de aterrissagem em solo;
- `attack` ativo → startup/active/recovery derivados de `elapsed`;
- `justLanded` → frame de transição ar → chão.

Não há classe de máquina de estados explícita; as prioridades e transições vivem em `Fighter.getState()` e `Fighter.update()`. `victory`/`defeat` ainda não existem.

### Animação

- Uma atlas por estado para o Plasmo; placeholder 96 × 96 para o oponente.
- `frameAnchors` por frame mantém o corpo no eixo ao espelhar.
- `activeFrom`/`activeTo` devem casar com `activeStart`/`activeEnd`.
- Pipeline detalhado e inventário em `ASSETS-ATLAS.md`.

### Testes

- 14 arquivos de teste em `tests/` (mais `helpers.mjs`), 30 suítes, 129 checks.
- Cobertura: loop, input, HUD, defesa, knockback, locomoção, corrida, pulo travado, altura de golpe, efeito de bloqueio, bloqueio clássico da IA, âncoras e integridade dos dados do Plasmo.
- Os testes são contrato de regressão: mudanças de balanceamento exigem justificativa e atualização explícita dos testes.
- Não há testes de navegador, DOM real, touch físico ou e2e.

## 7. Arte, áudio e propriedade intelectual

### Estado atual da arte

- **Plasmo** (Player 01): arte real em PNG, uma atlas por estado, carregada de `public/assets/characters/plasmo/`.
- **Oponente**: atlas procedural placeholder gerada em canvas, com a mesma grade 96 × 96 do template.
- **Arena e cenário**: desenho procedural com camadas de parallax; não há PNG de cenário.
- **Efeitos**: impacto de bloqueio, escudo, faíscas e anel de choque do forte; marca de contato no frame ativo.
- **UI**: HTML/CSS, sem assets gráficos externos.
- **Fontes**: família do sistema (`Inter, ui-sans-serif, system-ui`), sem arquivo de fonte empacotado.

### Áudio

**Pendente.** Não há efeitos de soco, chute, bloqueio, impacto, round ou trilha sonora. Também não há controle de volume ou mute.

### Propriedade intelectual e licenças

- Priorizar arte original ou assets com licença compatível com o uso pretendido.
- Registrar origem, licença e atribuição de cada asset de terceiros no inventário de assets (`CREDITS.md`).
- Não incluir conteúdo extraído de jogos comerciais.
- Manter personagens, nomes, cenários, efeitos e trilha sonora próprios.
- Separar arquivos de arte, áudio e dados de animação da lógica de combate.
- Planejar fallback visual/silencioso quando algum asset opcional falhar ao carregar.

**Bloqueio atual:** a origem e a licença dos sprites do Plasmo não estão registradas. O projeto não deve ser publicado publicamente até que isso seja resolvido e que exista uma licença para o código. Ver `CREDITS.md`.

## 8. Escopo e fora de escopo

### Dentro do MVP

- Partida local jogador versus IA.
- Dois lutadores — um com arte real e um placeholder.
- Uma arena procedural.
- Quatro botões de ataque (leve, médio, forte e chute).
- Movimentação, pulo, agachamento, corrida e defesa básica.
- Colisão, dano, stun, rounds, HUD e tela de resultado.
- Suporte prioritário a touchscreen, com multi-touch validado em celular real.
- Adaptação para teclado e gamepad básico em desktop.
- Build web estática e publicação no Render.

### Extras já implementados além do MVP original

- Modo espectador CPU vs CPU.
- Campanha de 5 fases com rounds, cronômetro e pontuação.
- Cinco perfis de IA (três no menu rápido; `elite`/`lendario` na campanha).
- Corrida por duplo-toque/Shift.
- Tela cheia, aviso de retrato e overlay de debug.
- Testes automatizados de regressão.

### Fora do MVP

- Multiplayer online e matchmaking.
- Contas, autenticação, perfil e ranking.
- Backend obrigatório para jogar.
- Loja, microtransações ou monetização.
- Aplicativos nativos dedicados.
- Campanha, história, progressão e desbloqueios complexos.
- Grande elenco de personagens e múltiplas arenas.

Esses itens podem ser avaliados após validar a diversão, os controles e a estabilidade do combate local.

## 9. Critérios de aceite do MVP

O MVP só deve ser considerado concluído quando todos os critérios abaixo estiverem atendidos e comprovados.

| # | Critério | Status | Evidência / lacuna |
|---:|---|---|---|
| 1 | Experiência mobile validada em ao menos um Android ou iOS real, e funcionando em desktop. | Pendente | Nenhum teste físico registrado. |
| 2 | Layout principal em mobile landscape, com orientação/feedback em retrato. | Parcial | CSS, safe areas e aviso de retrato existem; falta validação física. |
| 3 | Mover, pular, agachar, defender e usar os quatro ataques por touchscreen e controles alternativos. | Parcial | Touch e teclado implementados; gamepad pendente; validação física pendente. |
| 4 | Ataques com janelas distintas de startup, active e recovery. | Implementado | `ATTACKS` e `Fighter.update`; testes de defesa/altura/knockback. |
| 5 | Hitbox só causa dano na janela ativa e não repete dano. | Implementado | Checagem por `elapsed` + `attackHit`; colisão própria. |
| 6 | Colisões funcionam com os personagens em qualquer direção. | Implementado | Alcance por distância absoluta; testes de espelhamento/face. |
| 7 | IA se aproxima, ataca e defende de forma básica. | Implementado | `CPUController`; cinco perfis; testes de corrida/alcance. |
| 8 | Vida, cronômetro, rounds e resultado atualizados corretamente. | Implementado | Campanha: fase/round, timer, placar e overlay de resultado; partida rápida: vida e `ROUND END`. |
| 9 | Mobile mantém direção + ataque simultâneos, inclusive outros comandos. | Parcial | Multi-touch por `pointerId`; falta validação em aparelho real. |
| 10 | Redimensionar/girar não distorce a arena nem esconde comandos. | Parcial | `ResizeObserver`, letterbox, aviso de retrato; falta validação física. |
| 11 | Alvos de toque confortáveis, com feedback e safe areas. | Parcial | Primários ~44–73 px; utilitários ~26–34 px; safe areas implementadas. |
| 12 | `npm run build` termina sem erros. | Implementado | Build verificada em 2026-11-23. |
| 13 | Versão publicada no Render carrega assets e inicia partida. | Pendente | Sem deploy/URL. |
| 14 | Sem erros críticos no console durante uma partida normal. | Pendente | Build/testes passam; falta verificação formal em navegador/dispositivo. |

**Conclusão:** o MVP **não está concluído**. O núcleo de combate local está funcional e testado, mas faltam partes obrigatórias de partida, validação mobile, publicação e licenciamento.

## 10. Decisões e premissas atuais

| Tema | Decisão atual | Reavaliar quando |
|---|---|---|
| Gênero | Luta 2D em visão lateral | Se houver requisito real de 3D. |
| Código | Uma aplicação JavaScript compartilhada, Mobile First | Se houver limitação técnica comprovada. |
| Plataforma prioritária | Celulares, partida em paisagem | Após dados de uso demonstrarem outra prioridade. |
| Input primário | Touchscreen multi-touch + teclado no desktop | Após testes reais de ergonomia; gamepad a implementar. |
| Renderização | Canvas 2D | Se surgir necessidade visual que justifique outra tecnologia. |
| Colisão | Regras próprias em 1D + altura + postura | Se hurtboxes/hitboxes evoluírem para polígonos convexos. |
| SAT.js | Declarado, não integrado | Quando houver colisão poligonal real; ver seção 5. |
| Loop | Passo fixo 1/60 s + render por `requestAnimationFrame` | Após profiling e testes de latência. |
| Partida | Campanha: melhor de 3, timer e pontuação; partida rápida: vida única | Se o playtest indicar outro formato. |
| Modos | Campanha de 5 fases, `pvc` e `cvc` | Se houver seleção de personagem/arenas. |
| Dificuldade | Cinco perfis (`facil`, `medio`, `dificil`, `elite`, `lendario`) | Se dados de jogo indicarem necessidade de mais níveis. |
| Áudio | Nenhum | Ao implementar feedback sonoro com respeito a autoplay. |
| Multiplayer | Não no MVP | Após validar jogo local e definir modelo autoritativo. |
| Hospedagem | Render Static Site planejado | Ao adicionar serviços de backend. |
| Licença do código | A definir | Antes de qualquer distribuição pública. |
| Assets do Plasmo | Origem/licença a confirmar | Antes de qualquer distribuição pública. |

## 11. Limitações conhecidas e dívidas técnicas

1. **Persistência da campanha:** o progresso entre fases e a pontuação não são salvos; recarregar a página reinicia a campanha. Não há seleção de personagem/desbloqueios.
2. **Gamepad:** não implementado.
3. **Áudio:** não implementado.
4. **Pausa/visibilidade:** aba oculta não pausa explicitamente; há limpeza de input e clamp de delta.
5. **SAT.js:** dependência sem uso; decisão atual é não integrar até haver hitboxes poligonais.
6. **Validação mobile:** nenhuma validação em aparelho físico.
7. **Ergonomia touch:** utilitários de pular/agachar ficam abaixo da referência de 48 px e ataques podem cair para 44 px.
8. **Segundo personagem:** oponente ainda é placeholder procedural.
9. **Cenário:** arena procedural provisória, sem arte final.
10. **Efeitos:** impacto de bloqueio implementado; faltam poeira, impacto de acerto e feedback sonoro.
11. **Licenças:** código sem `LICENSE`; origem/licença do Plasmo não registrada.
12. **Scripts de arte:** `extract-plasmo.ps1` e `measure-anchors.ps1` dependem de PowerShell/Windows e têm caminhos fixos da máquina do autor.
13. **Testes:** apenas unitários em Node; não há testes de DOM real, touch físico ou e2e.
14. **Deploy:** sem publicação no Render.
15. **Dependências:** `sat` instalado sem uso.
16. **Tela de resultado:** a campanha tem overlay de resultado com estatísticas; a partida rápida segue só com `ROUND END` (sem vencedor/estatísticas) por design atual.
17. **Rótulos do HUD:** `index.html` agora expõe ids (`round-label`, `timer`, `score`) preenchidos pelo `HUD`; a legenda decorativa `SIMULAÇÃO DE MOVIMENTO` na arena permanece e pode ser trocada por texto de ambientação final.

## 12. Fontes técnicas de referência

- [SAT.js — repositório e documentação](https://github.com/jriecken/sat-js)
- [Pacote `sat` no npm](https://www.npmjs.com/package/sat)
- [Vite — guia de início](https://vite.dev/guide/)
- [Vite — publicação de sites estáticos, incluindo Render](https://vite.dev/guide/static-deploy)
- [Render — Static Sites](https://render.com/docs/static-sites)
- [MDN — Pointer Events](https://developer.mozilla.org/docs/Web/API/Pointer_events)
- [MDN — Gamepad API](https://developer.mozilla.org/docs/Web/API/Gamepad_API)

## 13. Histórico de alterações

| Data | Alteração |
|---|---|
| 2026-11-16 | Criação do documento de contexto e do roadmap inicial. |
| 2026-11-16 | Primeira implementação mobile-first (canvas, loop, lutadores provisórios, input). |
| 2026-11-17 | Atlas placeholder, spritesheets do Plasmo, combate básico, IA e efeitos iniciais. |
| 2026-11-19 | Testes de módulos, pulo atravessável e ajustes de colisão/input. |
| 2026-11-21 | Empurrão de bloqueio, correção do pulo, novos efeitos e agachamento responsivo. |
| 2026-11-23 | Atualização completa do estado real: combate/IA/defesa/animação implementados; rounds, gamepad, áudio, validação mobile, licenças e deploy pendentes; decisão de não integrar SAT.js nesta fase; criação de `CHANGELOG.md` e `CREDITS.md`. |
| 2026-11-23 | Nova spritesheet de bloqueio do Plasmo (9 poses, fundo transparente), correção do loop de ResizeObserver na tela cheia e CPU mais próxima do oponente (`runDistance`/`rangeOf`). |
| 2026-11-24 | Campanha de 5 fases (rounds, cronômetro, pontuação e resultado), pulo travado (direção/velocidade no impulso, sem controle no ar) e bloqueio clássico confiável da CPU. |

---

**Regra de manutenção deste documento:** quando uma decisão mudar, atualizar a tabela de decisões, o status dos critérios de aceite e o histórico acima. Não transformar uma ideia futura em requisito concluído sem implementação e teste verificáveis. Números de balanceamento devem ser conferidos em `src/fighters/Fighter.js` antes de qualquer atualização.

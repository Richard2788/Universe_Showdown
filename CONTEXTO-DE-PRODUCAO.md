# Contexto de Produção — Jogo de Luta 2D

> Documento de referência do produto e da implementação. Use este arquivo para orientar decisões de design, arquitetura, desenvolvimento, testes e futuras contribuições.  
> Estado do projeto: **planejamento / pré-produção**. Os recursos descritos são requisitos e propostas; não devem ser considerados implementados até serem verificados no código.

## 1. Visão do produto

Desenvolver um jogo de luta 2D tradicional, em visão lateral, executado diretamente no navegador e concebido sob a abordagem **Mobile First**. A experiência principal será projetada primeiro para celulares, especialmente para partidas em orientação horizontal; a versão desktop será uma adaptação da mesma aplicação, com teclado e gamepad. O jogo terá confrontos um contra um, personagens com animações próprias, arena, barras de vida, cronômetro, rounds e um adversário controlado inicialmente por inteligência artificial local.

A experiência deve lembrar a clareza e a resposta dos jogos clássicos de luta, mas possuir identidade visual, personagens, nomes, cenários, sons e animações originais. Referências a jogos existentes servem apenas para comunicar convenções de gênero e controles; não devem ser copiadas marcas, personagens, sprites, músicas, interfaces protegidas ou outros conteúdos de terceiros.

### Objetivo da primeira versão jogável (MVP)

Entregar uma luta local funcional entre o jogador e um oponente controlado pelo computador, com:

- movimentação horizontal, salto e agachamento;
- defesa básica;
- quatro comandos de ataque: leve, médio, forte e perna;
- hitboxes, hurtboxes, dano, reação ao golpe e invulnerabilidade/recuperação conforme o estado do personagem;
- barra de vida, cronômetro, rounds e resultado;
- controles touchscreen como forma primária de interação;
- layout, HUD e área de combate projetados primeiro para telas mobile;
- suporte a teclado e à Gamepad API como formas alternativas de entrada;
- adaptação da experiência mobile para desktop, sem duplicar a lógica do jogo;
- build estático publicável no Render.

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

### Plataformas-alvo

- **Prioridade 1:** navegadores mobile atuais em Android e iOS, com partida preferencialmente em orientação horizontal.
- **Prioridade 2:** navegadores desktop atuais com suporte a Canvas 2D e JavaScript moderno, usando teclado e suporte opcional a gamepad.
- Controles USB/Bluetooth reconhecidos pelo navegador, quando expostos pela Gamepad API.

### Abordagem multiplataforma

Manter **uma única base de código** e uma abordagem Mobile First. A simulação, as regras de combate, os personagens, a IA e a renderização são compartilhados. A interface touchscreen é a referência primária; teclado, gamepad e ajustes de layout para telas grandes são adaptadores da mesma experiência.

O jogador deve acessar o mesmo endereço web. Não faz parte do MVP criar aplicativos nativos separados para Android, iOS, Windows ou macOS.

## 3. Experiência e regras de jogo

### Formato da partida

- Visão lateral 2D e combate um contra um.
- Um jogador humano contra um adversário controlado pela IA.
- Uma arena inicial e dois personagens provisórios.
- Partida dividida em rounds, com cronômetro e condição de vitória por nocaute ou por maior vida ao término do tempo.
- O número de rounds e a duração devem ser configuráveis, não codificados em vários módulos.

### Movimentação

- Andar para a esquerda e para a direita.
- Pular e agachar.
- Virar automaticamente para encarar o adversário.
- Respeitar os limites laterais da arena.
- Evitar que os personagens atravessem um ao outro, conforme as regras de posicionamento definidas para o combate.

### Ataques

O jogo terá quatro comandos principais:

| Comando lógico | Ação | Intenção de design |
|---|---|---|
| `lightAttack` | Ataque leve | Rápido, pouco dano e recuperação curta. |
| `mediumAttack` | Ataque médio | Compromisso intermediário entre velocidade e dano. |
| `heavyAttack` | Ataque forte | Mais lento, maior dano e maior recuperação. |
| `kick` | Ataque de perna/chute | Botão dedicado a golpes de perna, independente dos três ataques de mão. |

O botão de perna deve ter identidade própria e não ser apenas um alias de um dos ataques existentes. Futuramente, ele poderá selecionar variações de chute por postura, distância, direção ou combinação de comandos. No MVP, implementar pelo menos um chute funcional e balanceado.

### Valores iniciais de balanceamento

Os seguintes números são referências de prototipagem e devem ser testados. Não são parâmetros finais:

| Ataque | Dano inicial sugerido | Startup inicial sugerido |
|---|---:|---:|
| Leve | 5 | 6 frames |
| Médio | 10 | 11 frames |
| Forte | 18 | 19 frames |
| Chute | 12 | 13 frames |

Cada movimento deverá ter dados explícitos para `startup`, `active`, `recovery`, `damage`, `pushback`, `hitstun`, `blockstun`, alcance e regra de cancelamento. Não confundir startup com a duração total do golpe. Os números deverão ser centralizados em dados/configuração para facilitar balanceamento.

### Defesa e reação

- Defesa básica ao manter a direção contrária ao adversário.
- Dano reduzido ou nulo em bloqueio, conforme o golpe.
- Reação visual e deslocamento ao receber um golpe.
- Um ataque só deve causar dano durante seus frames ativos.
- Cada golpe só pode acertar o mesmo alvo uma vez, salvo quando for explicitamente um golpe multi-hit.

## 4. Controles

### Mobile — controles primários

O touchscreen é o método de entrada principal do produto e deve ser implementado e testado antes de considerar a camada desktop concluída.

- Direcional virtual no lado esquerdo.
- Botões de ataque no lado direito: leve, médio, forte e chute.
- Pulo e agachamento devem ter comandos fáceis de alcançar; podem compartilhar o direcional somente se os testes de usabilidade comprovarem que isso não prejudica o controle simultâneo.
- Os botões devem responder ao primeiro contato, mostrar feedback tátil/visual quando possível e não esperar eventos de clique dependentes de mouse.
- O sistema deve acompanhar cada `pointerId` de forma independente e limpar o estado em `pointerup`, `pointercancel`, `lostpointercapture`, perda de foco e mudança de visibilidade.
- Evitar que o navegador interprete pressionamentos longos como seleção de texto ou gestos de navegação dentro da área de controles.

### Desktop — configuração alternativa

| Ação | Tecla padrão |
|---|---|
| Esquerda / direita | `A` / `D` ou setas `←` / `→` |
| Pular | `W` ou `↑` |
| Agachar | `S` ou `↓` |
| Ataque leve | `J` |
| Ataque médio | `K` |
| Ataque forte | `L` |
| Chute | `U` |

O mapeamento deve ficar centralizado em uma configuração para permitir remapeamento futuro. Deve ser possível manter uma direção pressionada e atacar simultaneamente.

### Requisitos de implementação dos controles touchscreen

- Aplicar `touch-action: none` somente à superfície de jogo/controles, evitando bloquear desnecessariamente a navegação fora dela.
- Usar Pointer Events com captura de ponteiro quando apropriado e tratamento de cancelamento/perda de captura.
- Não simular multi-touch com um único booleano global: associar cada pressão a seu `pointerId`, permitindo que vários botões permaneçam ativos ao mesmo tempo.
- Separar o estado visual do botão do estado lógico da ação, para que a interface não fique pressionada após interrupções.

### Gamepad

Dar suporte básico a dispositivos reconhecidos pela Gamepad API. O mapeamento inicial deve ser documentado e testado com pelo menos um controle comum. O jogo continua utilizável mesmo quando nenhum controle é detectado.

## 5. Diretrizes técnicas

### Stack escolhida

| Tecnologia | Responsabilidade |
|---|---|
| HTML5 | Estrutura da página e ponto de entrada. |
| Canvas 2D | Renderização da arena, lutadores, efeitos e HUD desenhado no canvas quando apropriado. |
| JavaScript ES Modules | Regras, simulação, controles, IA e organização dos módulos. |
| SAT.js (`sat` no npm) | Testes geométricos de colisão 2D entre polígonos/círculos. |
| CSS | Menus, botões mobile, layout responsivo e overlays. |
| Vite | Servidor de desenvolvimento e build de produção. |
| Render Static Site | Hospedagem da build estática do jogo. |

### Responsabilidade do SAT.js

SAT.js é uma biblioteca de detecção de colisão 2D baseada no Separating Axis Theorem. Deve ser usada como ferramenta geométrica, não como motor completo de jogo.

- **Hurtbox:** área que pode receber ataques.
- **Hitbox:** área ativa de um golpe.
- **Stage bounds:** limites de posicionamento e colisões do cenário, se a representação escolhida justificar o uso do SAT.js.
- O código do jogo continua responsável por estados, frames ativos, dano, stun, empurrão, prioridade e regras de combate.
- Não criar polígonos SAT novos a cada frame sem necessidade; reutilizar objetos e atualizar suas posições/formas para reduzir alocações.
- Usar formas convexas para os testes de polígono. Dividir formas côncavas em partes convexas se necessário.

### Simulação e renderização

- Usar `requestAnimationFrame` para sincronizar a renderização com o navegador.
- Separar atualização da simulação e desenho.
- Preferir passo fixo de simulação, inicialmente 60 ticks por segundo, com acumulador de delta; limitar o delta após pausas ou perda de foco para evitar saltos grandes.
- A renderização pode ocorrer em frequência variável, sem alterar a velocidade do combate.
- Considerar interpolação visual entre estados para suavizar movimento, se necessário.
- Não atrelar o avanço dos frames de golpe à quantidade de chamadas de renderização.

### Resolução e adaptação de tela

- Definir uma resolução lógica de referência para a arena e escalar o Canvas para caber na área disponível.
- Implementar primeiro o layout da partida em uma viewport mobile horizontal; ampliar para tablet e desktop usando breakpoints progressivos.
- Configurar a meta viewport (`width=device-width, initial-scale=1, viewport-fit=cover`) e considerar `100dvh` com fallback apropriado para barras dinâmicas do navegador.
- Aplicar `env(safe-area-inset-*)` nos elementos de interface próximos às bordas.
- Impedir scroll/overscroll acidental na área de jogo, preservando a navegação normal fora dela.
- Considerar `devicePixelRatio` com limite configurável para evitar custo excessivo em telas de alta densidade.
- Redimensionar o Canvas sem distorcer a proporção do campo de luta.
- Reposicionar HUD e controles de toque de forma responsiva; no desktop, ocultar os controles touchscreen e liberar a área para o Canvas.
- Garantir que nenhum botão ou informação essencial fique atrás de recortes, barras do navegador ou HUD.
- Exibir uma orientação visual para girar o dispositivo quando a experiência de combate em retrato for inadequada; não depender de bloqueio obrigatório de orientação.

## 6. Arquitetura sugerida

A arquitetura deve manter limites claros entre simulação, renderização, entradas, conteúdo e interface.

```text
src/
├── main.js
├── game/
│   ├── Game.js
│   ├── GameLoop.js
│   ├── GameConfig.js
│   └── Match.js
├── characters/
│   ├── Fighter.js
│   ├── FighterState.js
│   └── animations.js
├── combat/
│   ├── attacks.js
│   ├── Hitbox.js
│   ├── Hurtbox.js
│   ├── CollisionSystem.js
│   └── DamageSystem.js
├── input/
│   ├── InputManager.js
│   ├── KeyboardInput.js
│   ├── TouchInput.js
│   └── GamepadInput.js
├── ai/
│   └── OpponentAI.js
├── scenes/
│   ├── MenuScene.js
│   ├── ArenaScene.js
│   └── ResultsScene.js
├── rendering/
│   ├── CanvasRenderer.js
│   ├── Camera.js
│   └── effects.js
├── ui/
│   ├── HUD.js
│   └── TouchControls.js
└── styles/
    └── main.css
```

A estrutura acima é uma proposta de destino, não uma exigência de criar todos os arquivos no primeiro commit. Manter módulos pequenos e coesos; evitar classes ou abstrações sem necessidade demonstrada.

### Fluxo de entrada

Teclado, touchscreen e gamepad devem ser convertidos para um formato comum de ações. O sistema de combate não deve saber qual dispositivo originou a ação.

Exemplo de contrato lógico:

```js
const actions = {
  left: false,
  right: false,
  jump: false,
  crouch: false,
  block: false,
  lightAttack: false,
  mediumAttack: false,
  heavyAttack: false,
  kick: false,
};
```

### Estados do lutador

Estados de referência:

`IDLE`, `WALK`, `JUMP`, `CROUCH`, `ATTACK_STARTUP`, `ATTACK_ACTIVE`, `ATTACK_RECOVERY`, `BLOCK`, `HITSTUN`, `BLOCKSTUN`, `KNOCKDOWN`, `VICTORY` e `DEFEAT`.

Definir transições permitidas e prioridades. Evitar combinações impossíveis, como iniciar outro ataque durante recuperação, salvo quando uma regra explícita de cancelamento permitir.

## 7. Arte, áudio e propriedade intelectual

- Priorizar arte original ou assets com licença compatível com o uso pretendido.
- Registrar origem, licença e atribuição de cada asset de terceiros em um inventário de assets.
- Não incluir conteúdo extraído de jogos comerciais.
- Manter personagens, nomes, cenários, efeitos e trilha sonora próprios.
- Separar arquivos de arte, áudio e dados de animação da lógica de combate.
- Planejar fallback visual/silencioso quando algum asset opcional falhar ao carregar.

## 8. Escopo e fora de escopo

### Dentro do MVP

- Partida local jogador versus IA.
- Dois lutadores provisórios.
- Uma arena.
- Quatro botões de ataque (leve, médio, forte e chute).
- Movimentação, pulo, agachamento e defesa básica.
- Colisão, dano, stun, rounds, HUD e tela de resultado.
- Suporte prioritário a touchscreen, com multi-touch validado em celular real.
- Adaptação para teclado e gamepad básico em desktop.
- Build web estática e publicação no Render.

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

O MVP só deve ser considerado concluído quando:

1. A experiência mobile foi validada primeiro em pelo menos um aparelho Android ou iOS real, e também funciona em navegador desktop.
2. O layout principal da partida foi concebido para mobile landscape, com orientação/feedback adequado em retrato.
3. O jogador consegue mover, pular, agachar, defender e usar os quatro ataques por touchscreen e pelos controles alternativos.
4. Os ataques possuem janelas distintas de startup, active e recovery.
5. A hitbox só causa dano durante a janela ativa e não repete dano indevidamente.
6. As colisões funcionam quando os personagens se encaram para qualquer direção.
7. O oponente de IA consegue se aproximar, atacar e defender de forma básica.
8. Vida, cronômetro, rounds e resultado são atualizados corretamente.
9. No mobile, é possível manter uma direção e tocar em um ataque simultaneamente, inclusive com outros comandos quando suportados pelo layout.
10. Redimensionar a janela ou girar o aparelho não distorce a arena nem deixa comandos essenciais fora da tela.
11. Os alvos de toque são confortáveis, possuem feedback visual e respeitam as áreas seguras do aparelho.
12. `npm run build` termina sem erros.
13. A versão publicada no Render carrega os assets e permite iniciar uma partida.
14. Não há erros críticos no console durante uma partida normal.

## 10. Decisões e premissas atuais

| Tema | Decisão atual | Reavaliar quando |
|---|---|---|
| Gênero | Luta 2D em visão lateral | Se houver requisito real de 3D. |
| Código | Uma aplicação JavaScript compartilhada, Mobile First | Se houver limitação técnica comprovada. |
| Plataforma prioritária | Celulares, partida em paisagem | Após dados de uso demonstrarem outra prioridade. |
| Input primário | Touchscreen multi-touch | Se testes reais demonstrarem impedimento técnico ou de usabilidade. |
| Renderização | Canvas 2D | Se surgir necessidade visual que justifique outra tecnologia. |
| Colisão | SAT.js (`sat`) | Se as necessidades de colisão ultrapassarem seu escopo. |
| Loop | Simulação em passo fixo + renderização por `requestAnimationFrame` | Após profiling e testes de latência. |
| Multiplayer | Não no MVP | Após validar jogo local e definir modelo autoritativo. |
| Hospedagem | Render Static Site | Ao adicionar serviços de backend. |

## 11. Fontes técnicas de referência

- [SAT.js — repositório e documentação](https://github.com/jriecken/sat-js)
- [Pacote `sat` no npm](https://www.npmjs.com/package/sat)
- [Vite — guia de início](https://vite.dev/guide/)
- [Vite — publicação de sites estáticos, incluindo Render](https://vite.dev/guide/static-deploy)
- [Render — Static Sites](https://render.com/docs/static-sites)
- [MDN — Pointer Events](https://developer.mozilla.org/docs/Web/API/Pointer_events)
- [MDN — Gamepad API](https://developer.mozilla.org/docs/Web/API/Gamepad_API)

---

**Regra de manutenção deste documento:** quando uma decisão mudar, atualizar a tabela de decisões e registrar a motivação no histórico de alterações do projeto. Não transformar uma ideia futura em requisito concluído sem implementação e teste verificáveis.
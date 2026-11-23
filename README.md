# Universe Showdown — Jogo de Luta 2D

Jogo de luta tradicional em visão lateral, concebido sob a abordagem **Mobile First** e executado diretamente no navegador. A experiência principal é projetada primeiro para celulares, com combate preferencialmente em orientação horizontal e controles touchscreen multi-touch. A mesma aplicação é adaptada para computadores com teclado.

> **Status:** protótipo jogável (alpha), atualizado em **2026-11-23**.
> Combate, defesa, IA, movimentação, animação do Plasmo, controles touch/teclado e modos Jogador vs CPU / CPU vs CPU estão implementados.
> Rounds, cronômetro, resultado, gamepad, áudio, validação em celular físico, licenças de assets e publicação no Render ainda estão pendentes.

## Estado atual

### Implementado

- Arena 2D em Canvas com resolução lógica de 960 × 540 e passo fixo de 1/60 s.
- Movimentação: andar, correr, pular, agachar, virar para o oponente e limites de arena.
- Combate com quatro golpes: leve, médio, forte e chute, com startup, active e recovery.
- Defesa direcional em pé e agachado, com chip apenas no forte, blockstun, empurrão e efeito visual.
- Esquiva por pulo, atravessar o oponente no ar, knockback com atrito e hitstun.
- IA com três dificuldades, reação com atraso, aproximação, corrida, esquiva, bloqueio e punição.
- Modos **Jogador vs CPU** (`pvc`) e **CPU vs CPU** (`cvc`).
- Menu inicial, seleção de dificuldade, tela cheia e aviso de rotação.
- Controles touch multi-touch por `pointerId` e teclado unificado pelo `InputManager`.
- HUD com barras de vida, status `READY`/`ROUND END` e botão de reinício.
- Arte real do Plasmo (Player 01) por estado; oponente em atlas placeholder.
- Overlay de debug (`?debug=1`) e pré-seleção de dificuldade (`?diff=`).
- 88 checks automatizados em 18 suítes (`npm test`).

### Ainda não implementado

- Cronômetro, rounds, placar, tela de resultado e reinício automático de partida.
- Gamepad.
- Áudio, volume e mute.
- Pausa explícita ao trocar de aba/perder foco.
- Segundo personagem com arte real e arena com arte final.
- Validação em aparelho Android/iOS físico.
- Publicação no Render e URL pública.
- Licença do código e registro de origem/licença dos assets.

## Visão geral

O jogador pode andar, correr, pular, agachar, defender e executar quatro tipos de ataque:

| Comando | Descrição |
|---|---|
| Leve | Golpe rápido, dano baixo e recuperação curta. |
| Médio | Golpe intermediário. |
| Forte | Golpe mais lento, com maior dano, chip no bloqueio e knockback. |
| Perna | Chute baixo, capaz de furar a defesa em pé. |

O objetivo atual é zerar a vida do oponente. Não há rounds nem cronômetro: ao chegar a zero, o status muda para `ROUND END` e o jogador reinicia manualmente pelo botão **REINICIAR**.

## Estratégia Mobile First

O desenvolvimento começa pelo celular. A interface principal, a arena, o HUD e os controles devem ser utilizáveis em aparelhos reais antes de considerar a adaptação desktop concluída.

- **Mobile (prioridade principal):** navegador Android/iOS, partida preferencialmente em paisagem, direcional virtual à esquerda e quatro botões de ataque à direita.
- **Desktop (adaptação):** navegador com teclado; controles touchscreen ficam ocultos e a área de jogo aproveita a tela maior.
- **Base compartilhada:** uma única aplicação, com regras de combate e simulação comuns. Apenas entrada e apresentação mudam conforme o dispositivo.
- **Sem app nativo obrigatório:** a versão web roda pelo endereço do jogo.

### Regras de experiência mobile

- Alvos de toque confortáveis, com referência de 48 × 48 CSS px para comandos primários.
- Multi-touch real: mover e atacar simultaneamente.
- Não depender de hover, mouse ou teclado para ações essenciais.
- Respeitar recortes e áreas seguras (`safe-area-inset-*`) e barras dinâmicas do navegador.
- Evitar zoom e rolagem acidental dentro da superfície de jogo, sem bloquear gestos fora dela.
- Em retrato durante o combate, orientar o jogador a girar o aparelho.
- Validar desempenho e legibilidade primeiro em celular físico.

**Validação atual:** a implementação responsiva existe, mas **ainda não foi testada em aparelho físico**. Esse é um critério de aceite pendente.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| JavaScript ES Modules | Regras, simulação, controles, IA e organização dos módulos. |
| HTML5 Canvas 2D | Arena, lutadores e efeitos. |
| CSS | HUD, menus, controles mobile, responsividade e safe areas. |
| Vite 7 | Desenvolvimento local e build de produção. |
| Node.js `>=20.19.0` | Ambiente de desenvolvimento e testes. |
| SAT.js (`sat`) | Declarado como dependência, **não integrado** à colisão atual. |
| Render Static Site | Hospedagem planejada; ainda não publicada. |

### Sobre o SAT.js

O pacote `sat` está instalado, mas não é importado por nenhum módulo. A colisão atual é própria:

- alcance horizontal + meia-largura da hurtbox do alvo;
- limite de altura (`maxTargetY`);
- regra explícita de postura (`high`/`mid`/`low`);
- separação de corpos em 1D quando ambos estão no chão.

A integração do SAT.js fica reservada para quando as hitboxes/hurtboxes evoluírem para polígonos convexos. Para o formato atual, ela não traz benefício que justifique o custo e o risco de rebalanceamento.

## Requisitos

- Node.js `>=20.19.0` (definido em `package.json`).
- npm.
- Git (recomendado).
- Navegador moderno com Canvas 2D e Pointer Events.

## Começar

```bash
git clone https://github.com/Richard2788/Universe_Showdown.git
cd Universe_Showdown
npm install
npm run dev
```

Abra no navegador o endereço informado pelo Vite (normalmente `http://localhost:5173`).

### Build de produção

```bash
npm run build
```

A build é gerada em `dist/`.

### Visualizar a build localmente

```bash
npm run preview
```

O `preview` serve a build para verificação local; ele não substitui um servidor de produção.

### Testes

```bash
npm test
```

Estado atual: **10 arquivos de teste, 18 suítes e 88 checks aprovados**.

## Controles

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

O mapeamento fica em `src/config/controls.js`. É possível manter uma direção pressionada e atacar ao mesmo tempo.

### Mobile — touchscreen

- Direcional virtual no lado esquerdo.
- Botões de ataque leve, médio, forte e chute no lado direito.
- Pular e agachar em botões utilitários acima dos ataques.
- Corrida por **duplo-toque na direção** (janela de 0,28 s).
- Multi-touch com rastreamento independente de `pointerId`.
- Limpeza de estados em `pointerup`, `pointercancel`, perda de captura, `blur`, troca de aba e `pagehide`.
- No modo CPU vs CPU, os controles touch são ocultados.

### Gamepad

**Pendente.** Não há suporte à Gamepad API nesta versão.

## Modos, menu e parâmetros de URL

- **Jogar · Player vs CPU:** o jogador controla o Plasmo; a CPU controla o oponente.
- **Assistir · CPU vs CPU:** as duas IAs jogam; os controles touch ficam ocultos.
- **Dificuldades:** Fácil, Médio e Difícil, com reação, agressividade, bloqueio, esquiva e golpes permitidos diferentes.

| Parâmetro | Efeito |
|---|---|
| `?diff=facil` | Pré-seleciona a dificuldade fácil. |
| `?diff=medio` | Pré-seleciona a dificuldade média. |
| `?diff=dificil` | Pré-seleciona a dificuldade difícil. |
| `?debug=1` | Mostra hurtbox, hitbox, posição, vida, knockback, estado/frame e estado da IA. |

## Estrutura de diretórios

```text
Universe_Showdown/
├── index.html
├── package.json
├── package-lock.json
├── public/
│   └── assets/
│       └── characters/
│           ├── knight/          # knight.json (template; sem PNG)
│           └── plasmo/          # PNG + JSON por estado
├── scripts/
│   ├── convert-texturepacker.mjs
│   ├── extract-plasmo.ps1
│   └── measure-anchors.ps1
├── src/
│   ├── main.js
│   ├── config/
│   │   ├── game.js
│   │   └── controls.js
│   ├── core/
│   │   ├── GameLoop.js
│   │   ├── InputManager.js
│   │   └── RunDetector.js
│   ├── fighters/
│   │   └── Fighter.js
│   ├── game/
│   │   ├── Game.js
│   │   └── physics.js
│   ├── ai/
│   │   └── CPUController.js
│   ├── characters/
│   │   ├── animations.js
│   │   ├── Plasmo.js
│   │   └── PlaceholderAtlas.js
│   ├── rendering/
│   │   ├── CanvasRenderer.js
│   │   └── SpriteAnimator.js
│   ├── ui/
│   │   ├── HUD.js
│   │   ├── TouchControls.js
│   │   └── FullscreenToggle.js
│   └── styles/
│       └── main.css
├── tests/
├── ASSETS-ATLAS.md
├── CHANGELOG.md
├── CONTEXTO-DE-PRODUCAO.md
├── CREDITS.md
├── PLANO-DE-MELHORIAS.md
└── README.md
```

## Arquitetura de combate e animação

- Cada golpe tem dados declarativos em `ATTACKS` (`src/fighters/Fighter.js`): duração, janela ativa, dano, alcance, altura máxima do alvo, `height`, blockstun, chip e knockback.
- O acerto só é aplicado durante a janela ativa e apenas uma vez por golpe.
- A defesa é direcional: segurar o recuo. A postura define o que é bloqueado.
- A IA emite ações no mesmo formato do teclado/touch; o `Fighter` não sabe quem está controlando.
- A simulação roda em passo fixo; a animação avança no mesmo passo, não no `requestAnimationFrame`.
- O Plasmo usa uma atlas PNG por estado, com âncoras por frame; o oponente usa uma atlas procedural placeholder.
- O HUD é DOM; o Canvas desenha arena, lutadores e efeitos.

Fontes de verdade:

| Assunto | Arquivo |
|---|---|
| Golpes e estados | `src/fighters/Fighter.js` |
| Arena, velocidades e loop | `src/config/game.js` |
| Separação de corpos e face | `src/game/physics.js` |
| IA | `src/ai/CPUController.js` |
| Controles | `src/config/controls.js` + `src/core/InputManager.js` |
| Animação | `src/characters/Plasmo.js`, `animations.js`, `SpriteAnimator.js` |
| Assets | `ASSETS-ATLAS.md` |
| Regressão | `tests/*.test.mjs` |

## Testes essenciais

Antes de considerar o MVP pronto, verificar:

- [x] Movimento, salto, agachamento e corrida nos dois sentidos.
- [x] Quatro ataques com janelas de startup, active e recovery.
- [x] Ataques acertam apenas durante a janela ativa.
- [x] O mesmo golpe não aplica dano várias vezes por engano.
- [x] Bloqueio, chip, blockstun e reação ao dano funcionam.
- [x] IA consegue se aproximar, atacar, defender e correr.
- [x] Desktop aceita movimentação e ataque simultâneos.
- [x] Barra de vida e status `READY`/`ROUND END` atualizam.
- [ ] Cronômetro, rounds, placar e resultado.
- [ ] Gamepad.
- [ ] Áudio.
- [ ] Mobile aceita dois ou mais toques simultâneos em aparelho físico, sem botões presos após cancelamento ou troca de aba.
- [ ] Alvos de toque são confortáveis e respeitam recortes/áreas seguras em aparelho real.
- [ ] Em retrato, a orientação para girar o aparelho é clara durante a luta.
- [ ] Redimensionamento ou rotação não distorce a arena nem esconde os controles em aparelho real.
- [x] Build de produção conclui sem erros.
- [ ] URL pública do Render funciona em desktop e mobile.

Os itens marcados com `[x]` têm implementação e/ou teste automatizado; os que dependem de dispositivo físico ou deploy continuam abertos.

## Publicar no Render

A primeira versão não exige backend: a luta contra a IA roda no navegador. O destino planejado é um **Render Static Site**.

1. Envie o repositório para GitHub ou GitLab.
2. No Render, crie um serviço em **New → Static Site**.
3. Conecte o repositório e escolha a branch de publicação.
4. Configure:

   | Campo | Valor |
   |---|---|
   | Build Command | `npm ci && npm run build` |
   | Publish Directory | `dist` |

5. Crie o serviço e aguarde o primeiro deploy.
6. Abra a URL fornecida pelo Render primeiro em um celular real e depois em desktop.
7. Verifique carregamento de imagens/sons, áreas seguras, orientação, controles multi-touch, HUD e início/fim de uma partida.
8. Registre a URL e a data no `CHANGELOG.md`.

**Estado atual:** ainda **não publicado**. Não há URL pública, data de deploy ou verificação em produção registrada.

### Quando será necessário um backend?

Somente quando forem implementados recursos que precisam de estado compartilhado ou persistente, como multiplayer online, matchmaking, contas ou ranking online. Nesse estágio, poderá ser criado um serviço Node.js no Render Web Service, com comunicação WebSocket quando apropriado. Para partidas competitivas, o servidor deverá validar os comandos e o estado do combate.

## Limitações conhecidas

- Sem rounds, cronômetro, placar ou tela de resultado.
- Sem gamepad.
- Sem áudio.
- Sem pausa explícita ao ocultar a aba.
- Oponente e cenário ainda provisórios.
- Validação mobile física pendente.
- Origem/licença dos sprites do Plasmo não registrada.
- Código sem arquivo `LICENSE`.
- Scripts PowerShell de arte dependem de Windows e caminhos fixos.
- `sat` instalado sem uso.
- Testes automatizados são unitários; não há e2e ou teste de DOM real.
- O HUD ainda exibe `ROUND 01` fixo e a legenda `SIMULAÇÃO DE MOVIMENTO`, herdados do protótipo inicial.

## Documentação do projeto

- [`CONTEXTO-DE-PRODUCAO.md`](./CONTEXTO-DE-PRODUCAO.md) — visão de produto, estado real, regras, arquitetura, decisões e critérios de aceite.
- [`PLANO-DE-MELHORIAS.md`](./PLANO-DE-MELHORIAS.md) — roadmap, backlog priorizado e dívidas técnicas.
- [`ASSETS-ATLAS.md`](./ASSETS-ATLAS.md) — atlas, pipeline de animação e inventário da arte.
- [`CHANGELOG.md`](./CHANGELOG.md) — histórico de mudanças do projeto.
- [`CREDITS.md`](./CREDITS.md) — origem, licença e atribuição de assets.

## Referências

- [SAT.js — GitHub](https://github.com/jriecken/sat-js)
- [Pacote `sat` — npm](https://www.npmjs.com/package/sat)
- [Vite — Getting Started](https://vite.dev/guide/)
- [Vite — Static Deploy / Render](https://vite.dev/guide/static-deploy)
- [Render — Static Sites](https://render.com/docs/static-sites)
- [MDN — Pointer Events](https://developer.mozilla.org/docs/Web/API/Pointer_events)
- [MDN — Gamepad API](https://developer.mozilla.org/docs/Web/API/Gamepad_API)

## Licenças e assets

Antes de distribuir o jogo, é necessário:

- definir uma licença para o código e adicionar um arquivo `LICENSE`;
- registrar autor, origem e licença dos sprites do Plasmo;
- confirmar que todos os assets de terceiros têm licença compatível;
- registrar atribuições quando exigidas.

O inventário e o checklist estão em [`CREDITS.md`](./CREDITS.md). **A publicação pública está bloqueada até a regularização.**

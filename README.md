# Jogo de Luta 2D

Jogo de luta tradicional em visão lateral, concebido sob a abordagem **Mobile First** e executado diretamente no navegador. A experiência principal é projetada primeiro para celulares, com combate preferencialmente em orientação horizontal e controles touchscreen multi-touch. A mesma aplicação será adaptada para computadores com teclado e gamepad. O projeto utilizará JavaScript, Canvas 2D, SAT.js e Vite. A primeira versão será uma partida local de um jogador contra um adversário controlado por IA.

> **Status:** planejamento / pré-produção. Este repositório ainda precisa receber a implementação descrita neste documento. Não considere os comandos ou recursos como implementados até que os arquivos correspondentes existam e passem nos testes.

## Visão geral

O jogador poderá andar, pular, agachar, defender e executar quatro tipos de ataque:

| Comando | Descrição |
|---|---|
| Leve | Golpe rápido, dano baixo e recuperação curta. |
| Médio | Golpe intermediário. |
| Forte | Golpe mais lento, com maior dano e recuperação. |
| Perna | Botão dedicado a ataques de chute. |

O MVP terá dois lutadores provisórios, uma arena, barras de vida, cronômetro, rounds e IA simples. O touchscreen é o controle primário; teclado e gamepad serão alternativas para desktop.

## Estratégia Mobile First

O desenvolvimento começa pelo celular. A interface principal, a arena, o HUD e os controles devem ser utilizáveis em aparelhos reais antes de considerar a adaptação desktop concluída. Mobile First é critério de aceite para novas telas e funcionalidades.

- **Mobile (prioridade principal):** navegador Android/iOS, partida preferencialmente em paisagem, direcional virtual à esquerda e quatro botões de ataque à direita.
- **Desktop (adaptação):** navegador com teclado e suporte opcional a gamepad; controles touchscreen ficam ocultos e a área de jogo pode aproveitar a tela maior.
- **Base compartilhada:** uma única aplicação, com regras de combate e simulação comuns. Apenas entrada e apresentação mudam conforme o dispositivo.
- **Sem app nativo obrigatório:** a versão web roda pelo endereço do jogo. Um PWA poderá ser avaliado futuramente.

### Regras de experiência mobile

- Usar alvos de toque confortáveis; 48 × 48 CSS px é a referência inicial para comandos primários, a validar em aparelhos reais.
- Suportar multi-touch: mover e atacar simultaneamente.
- Não depender de hover, mouse ou teclado para ações essenciais.
- Respeitar recortes e áreas seguras da tela (`safe-area-inset-*`) e barras dinâmicas do navegador.
- Evitar zoom e rolagem acidental dentro da superfície de jogo, sem bloquear gestos fora dela.
- Em retrato durante o combate, orientar o jogador a girar o aparelho, sem exigir bloqueio de orientação.
- Validar desempenho e legibilidade primeiro em celular físico.

Como alvo inicial de teste, considerar uma viewport de combate em paisagem por volta de 640 × 360 CSS px e também aparelhos menores; comandos essenciais nunca devem ser cortados.

## Tecnologias

- **JavaScript ES Modules:** regras e sistemas do jogo.
- **HTML5 Canvas 2D:** renderização da arena, lutadores e efeitos.
- **SAT.js:** detecção geométrica de colisões entre hitboxes e hurtboxes.
- **Vite:** desenvolvimento local e build de produção.
- **Render Static Site:** publicação da versão web estática.

SAT.js é distribuído no npm pelo pacote `sat`. Ele auxilia nos testes geométricos; não substitui a lógica de combate, animação, estados ou física do jogo.

## Requisitos de desenvolvimento

- Node.js compatível com a versão do Vite usada pelo projeto.
- npm.
- Git (recomendado para versionamento e deploy).
- Navegador moderno com Canvas 2D e Pointer Events.

Consulte a versão mínima de Node indicada pela documentação da versão de Vite instalada: <https://vite.dev/guide/>.

## Começar do zero

Se este repositório ainda não tiver `package.json` e os arquivos de aplicação, crie uma aplicação Vite JavaScript Vanilla:

```bash
npm create vite@latest jogo-luta -- --template vanilla
cd jogo-luta
npm install
npm install sat
```

O template Vanilla do Vite já inclui scripts básicos de desenvolvimento e build. Se os documentos deste repositório estiverem em outra pasta, copie-os para a raiz do projeto criado.

### Executar localmente

```bash
npm run dev
```

Abra no navegador o endereço local informado pelo Vite (normalmente `http://localhost:5173`).

### Gerar build de produção

```bash
npm run build
```

O Vite gera os arquivos estáticos na pasta `dist/` por padrão.

### Visualizar a build localmente

```bash
npm run preview
```

O comando `preview` serve a build gerada para uma verificação local. Ele não substitui um servidor de produção.

## Controles planejados

### Desktop

| Ação | Tecla padrão |
|---|---|
| Esquerda / direita | `A` / `D` ou `←` / `→` |
| Pular | `W` ou `↑` |
| Agachar | `S` ou `↓` |
| Ataque leve | `J` |
| Ataque médio | `K` |
| Ataque forte | `L` |
| Chute | `U` |

### Mobile — prioridade de implementação

- Direcional virtual no lado esquerdo.
- Botões de ataque leve, médio, forte e chute no lado direito.
- Pulo e agachamento em comandos acessíveis, sem prejudicar ataques simultâneos.
- Suporte a múltiplos toques simultâneos com rastreamento independente de `pointerId`.
- Limpeza de estados em `pointerup`, `pointercancel`, perda de captura, troca de aba e rotação.

O mapeamento pode mudar durante a implementação e deverá ser mantido em configuração centralizada.

## Estrutura de diretórios proposta

A estrutura abaixo descreve a organização planejada. Os módulos serão adicionados progressivamente conforme cada sistema for implementado.

```text
jogo-luta/
├── index.html
├── package.json
├── package-lock.json
├── public/
│   └── assets/
│       ├── characters/
│       ├── backgrounds/
│       ├── effects/
│       └── sounds/
├── src/
│   ├── main.js
│   ├── game/
│   ├── characters/
│   ├── combat/
│   ├── input/
│   ├── ai/
│   ├── scenes/
│   ├── rendering/
│   ├── ui/
│   └── styles/
├── CONTEXTO-DE-PRODUCAO.md
├── PLANO-DE-MELHORIAS.md
└── README.md
```

## Arquitetura de combate

O sistema de combate separará três conceitos:

- **Hurtbox:** área do lutador que pode receber um ataque.
- **Hitbox:** área de contato de um golpe durante seus frames ativos.
- **Estado do lutador:** define o que o personagem pode fazer naquele momento, como andar, atacar, bloquear, receber dano ou se recuperar.

Cada ataque terá parâmetros próprios, incluindo startup, frames ativos, recovery, dano, alcance, empurrão e stun. O SAT.js verificará a colisão das formas; o jogo decidirá se o contato pode causar dano.

## Compatibilidade desktop/mobile

As entradas de teclado, touchscreen e gamepad serão convertidas para ações lógicas comuns, como `left`, `jump`, `lightAttack` e `kick`. Dessa forma, a lógica de combate não precisa conhecer o tipo de dispositivo.

No mobile, a implementação usará Pointer Events para permitir múltiplos toques e tratar cancelamento/perda de captura. O Canvas terá resolução lógica própria e será escalado para a área disponível, preservando a proporção do jogo. A página deverá usar meta viewport adequada, considerar `100dvh` com fallback e aplicar `safe-area-inset-*` em HUD e controles. `touch-action` será limitado à superfície de jogo/controles para não bloquear gestos fora dela.

## Publicar no Render

A primeira versão não exige backend: a luta contra a IA será executada no navegador. Por isso, o destino inicial é um **Render Static Site**.

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

Use `npm ci` quando o `package-lock.json` estiver versionado. Se o projeto usar outro gerenciador de pacotes, ajuste o comando de build de acordo com o lockfile.

### Quando será necessário um backend?

Somente quando forem implementados recursos que precisam de estado compartilhado ou persistente, como multiplayer online, matchmaking, contas ou ranking online. Nesse estágio, poderá ser criado um serviço Node.js no Render Web Service, com comunicação WebSocket quando apropriado. Para partidas competitivas, o servidor deverá validar os comandos e o estado do combate.

## Testes essenciais

Antes de considerar o MVP pronto, verificar:

- [ ] Início e fim de partida sem recarregar a página.
- [ ] Movimento, salto e agachamento nos dois sentidos.
- [ ] Quatro ataques com janelas de startup, active e recovery.
- [ ] Ataques acertam apenas durante a janela ativa.
- [ ] O mesmo golpe não aplica dano várias vezes por engano.
- [ ] Bloqueio e reação ao dano funcionam.
- [ ] IA consegue se aproximar, atacar e defender.
- [ ] Barra de vida, cronômetro e rounds são atualizados.
- [ ] Desktop aceita movimentação e ataque simultâneos.
- [ ] Mobile aceita dois ou mais toques simultâneos, sem deixar botões presos após cancelamento ou troca de aba.
- [ ] Alvos de toque são confortáveis e respeitam recortes/áreas seguras do aparelho.
- [ ] Em retrato, a orientação para girar o aparelho é clara durante a luta.
- [ ] Redimensionamento ou rotação não distorce a arena nem esconde os controles.
- [ ] A experiência foi verificada em celular físico antes da aprovação desktop.
- [ ] Build de produção conclui sem erros.
- [ ] URL pública do Render funciona em desktop e mobile.

## Princípio de contribuição

Antes de adicionar ou alterar uma funcionalidade, validar o fluxo em viewport mobile e sem mouse/hover. Não tratar Mobile First como uma folha de estilos adaptada no final: controles, hierarquia visual, acessibilidade, performance e critérios de aceite devem começar pelo celular.

## Documentação do projeto

- [`CONTEXTO-DE-PRODUCAO.md`](./CONTEXTO-DE-PRODUCAO.md) — visão de produto, escopo, decisões técnicas, arquitetura e critérios de aceite.
- [`PLANO-DE-MELHORIAS.md`](./PLANO-DE-MELHORIAS.md) — roadmap, backlog priorizado e rotina de revisão.

## Referências

- [SAT.js — GitHub](https://github.com/jriecken/sat-js)
- [Pacote `sat` — npm](https://www.npmjs.com/package/sat)
- [Vite — Getting Started](https://vite.dev/guide/)
- [Vite — Static Deploy / Render](https://vite.dev/guide/static-deploy)
- [Render — Static Sites](https://render.com/docs/static-sites)
- [MDN — Pointer Events](https://developer.mozilla.org/docs/Web/API/Pointer_events)
- [MDN — Gamepad API](https://developer.mozilla.org/docs/Web/API/Gamepad_API)

## Licenças e assets

Antes de distribuir o jogo, incluir um arquivo de licença para o código e confirmar que todos os sprites, fontes, músicas e efeitos sonoros têm licença compatível com a distribuição planejada. Registrar atribuições quando exigidas. O jogo deve usar identidade e conteúdo originais.
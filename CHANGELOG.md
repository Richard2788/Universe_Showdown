# Changelog — Universe Showdown

Todas as mudanças relevantes do projeto são registradas aqui.
Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); datas em ISO 8601. O projeto ainda não adota versionamento semântico formal — a versão atual em `package.json` é `0.1.0`.

## [Não lançado]

### Pendente

- Progresso persistente da campanha (save), seleção de personagem e desbloqueios (Sable planejada, entrega própria).
- Gamepad.
- Áudio.
- Pausa explícita em `visibilitychange`/perda de foco.
- Segundo personagem real e arena final.
- Validação em aparelho Android/iOS físico.
- Publicação no Render.
- Licença do código e origem/licença dos assets.

## [2026-11-24] — Campanha de 5 fases: rounds, cronômetro e pontuação

### Adicionado

- Modo **CAMPANHA · 5 FASES** no menu, com fases escalonadas — SENTINELA, VOLT, KRONOS, NÊMESIS e ÔMEGA: vida, paleta, escala do oponente, perfil de IA e tempo de round crescem fase a fase (`src/config/match.js`).
- `src/game/MatchManager.js`: regras puras (sem DOM/`Fighter`) de melhor de 3, cronômetro por round, fim por nocaute ou tempo, pontuação (round, vida restante, tempo, KO, round perfeito, dano causado e bônus de fase) e progressão entre fases.
- HUD de campanha: fase/round, cronômetro com alerta aos 10 s e pontuação com zeros à esquerda. A partida rápida (`pvc`/`cvc`) continua sem relógio/placar.
- Overlay de resultado (vitória, derrota e fim da campanha) com estatísticas e ações **PRÓXIMA FASE**, **TENTAR NOVAMENTE**, **JOGAR NOVAMENTE** e **VOLTAR AO MENU**.
- Banners centrais `ROUND`, `LUTE!` e `K.O.`/pontuação desenhados no canvas.
- Perfis de IA `elite` e `lendario` para as fases 4 e 5 (não aparecem no menu de partida rápida).
- `Fighter` aceita `maxHealth` (oponentes mais fortes mantêm a barra em 100% quando cheios).

### Alterado

- `Game` ganhou o modo `campanha` (`startMatch`, `continueCampaign`, `retryPhase`, `restartCampaign`, `abandonCampaign`), banners e `snapshot()`; `reset()` foi separado em `resetFighters()`, que reaproveita os animadores existentes (sem recriar canvas por round).
- O oponente da campanha usa um atlas placeholder por fase (cor da paleta), com cache para não regenerar a cada round.
- `tests/match.test.mjs` (10 checks) cobre configuração das fases, rounds/cronômetro, pontuação, melhor de 3, derrota/retry e fim da campanha.

### Verificado

- `npm test`: **110 checks aprovados**, 25 suítes, 0 falhas; `npm run build` concluída sem erro.

## [2026-11-24] — Animação de block: uma reação por bloqueio

### Alterado

- `block` deixa de ser postura em loop: agora é uma reação **one-shot disparada apenas em bloqueio bem-sucedido** (`blockAnimTimer` = 8 sprites a 6 fps = 1,33 s, `loop: false`, células 2→9 da sheet — começa com o escudo já formado e termina no último sprite). Segurar para trás sem levar golpe mostra `walk`/`idle`: não existe mais “block parado” em nenhum personagem (`Fighter.getState` é compartilhado por todos).
- A reação tem prioridade sobre andar **e agachar**: a sequência completa joga uma vez por bloqueio (inclusive no bloqueio agachado) e a guarda baixa só volta quando o play termina. Ela só é cortada por atacar, pular ou golpe que furar.
- Novo bloqueio durante um play em curso re-arma do frame 0 (`blockAnimPulse` no impacto + `SpriteAnimator.rewind()` consumido no `Game.update`), para que a 2ª sequência também mostre todos os sprites — combo bloqueado não deixa o sprite congelado no meio.
- `Game.reset()` zera `blockAnimTimer`/`blockAnimPulse`: round novo nunca começa em `block` sem levar golpe.
- `public/assets/characters/plasmo/block.json` (documentação) e o placeholder em `animations.js` alinhados ao runtime: `col: 2, frames: 8, fps: 6, loop: false`.

### Adicionado

- Teste `tests/blockanim.test.mjs` com 12 checks cobrindo o contrato: sem golpe = walk/idle, reação única com prioridade sobre andar/agachar, cortes (atacar/pular/furar), block agachado e re-arm em combo.

### Verificado

- `npm test`: **100 checks aprovados**, 0 falhas; `npm run build` concluída sem erro.

## [2026-11-23] — Bloqueio com sheet nova, tela cheia e proximidade da CPU

### Adicionado

- Nova spritesheet de bloqueio do Plasmo (`WhatsApp Image 2026-11-23 at 14.40.50.jpeg`, 10 poses em grade 1 × 10) com o fundo preto do JPEG removido por chroma key — nenhuma PNG do jogo tem fundo opaco. A sheet enviada antes (2026-11-20) era na verdade o estado `hit` e foi realocada para ele.
- Botão de tela cheia também no menu do jogo; o menu permanece aberto para escolher modo e dificuldade.

### Alterado

- `block` do Plasmo: 4 → 8 frames (sheet nova 2026-11-23 com 10 poses; o runtime usa as células 2→9) e célula 192 × 192 → 320 × 320, com novas âncoras por frame; `extract-plasmo.ps1` (manifesto) e `measure-anchors.ps1` apontam para a sheet nova (retângulos manuais por frame, pois a grade da sheet é irregular).
- `hit` do Plasmo: 3 → 9 frames (sheet de 2026-11-20, grade 5 × 2), célula 192 × 192 → 320 × 320 e 12 → 30 fps — as 9 poses (impacto → atordoado → recupera a guarda) cabem nos 0,3 s de hitstun.
- CPU mais próxima do oponente: `runDistance` 300 / 220 / 170 → 200 / 130 / 130 e margem de `rangeOf` de +8 para −2 px, para que hitboxes menores (ex.: golpe fraco do Knight) alcancem a hurtbox no limite de proximidade.
- Teste `runDistance por perfil` atualizado para os novos valores, com justificativa no próprio teste.

### Corrigido

- Erro “ResizeObserver loop completed with undelivered notifications” ao alternar a tela cheia: `Game.js` passa a usar a flag `_isFullscreen` (atualizada nos eventos `fullscreenchange`) e uma checagem de idempotência em `resize()`.

### Verificado

- `npm test`: **88 checks aprovados**, 0 falhas; `npm run build` concluída sem erro.

## [2026-11-23] — Sincronização documental com o estado real

### Adicionado

- `CHANGELOG.md` com o histórico de marcos do projeto.
- `CREDITS.md` com inventário de origem/licença de código, sprites, fontes e ferramentas.
- Seção de fontes de verdade no contexto de produção.
- Tabela real de golpes, movimentação, defesa e IA nos documentos.
- Registro explícito de limitações, dívidas técnicas e critérios de aceite pendentes.
- Inventário detalhado da arte do Plasmo em `ASSETS-ATLAS.md`.

### Alterado

- `CONTEXTO-DE-PRODUCAO.md`: status de “planejamento/pré-produção” para **protótipo jogável (alpha)**.
- `CONTEXTO-DE-PRODUCAO.md`: arquitetura proposta substituída pela árvore real de `src/`.
- `CONTEXTO-DE-PRODUCAO.md`: controles atualizados com corrida, atalhos de dificuldade, menu e tela cheia.
- `CONTEXTO-DE-PRODUCAO.md`: tabela de decisões e histórico de alterações atualizados.
- `README.md`: status, funcionalidades, comandos, controles, estrutura, testes e limitações reescritos.
- `README.md`: instruções do Render atualizadas para `npm ci && npm run build`, com aviso de que o deploy ainda não ocorreu.
- `PLANO-DE-MELHORIAS.md`: roadmap e checkboxes alinhados ao código; itens de validação física e deploy mantidos abertos.
- `ASSETS-ATLAS.md`: modelo de atlas corrigido para separar placeholder 96 × 96 de arte real por estado.

### Corrigido

- Removida a afirmação de que SAT.js estava integrado. O pacote `sat` está declarado, mas **não é importado**; a colisão atual é própria.
- Corrigidos os valores de balanceamento documentados: forte tem **16** de dano (não 18), e as janelas são expressas em segundos, não em frames fixos.
- Removida a descrição de rounds/timer/resultado como implementados; o estado real é vida única + `ROUND END`.
- Corrigida a descrição da arte: Plasmo usa uma atlas por estado; o oponente usa placeholder procedural.
- Removida a seção contraditória “Começar do zero” do README, que mandava criar um scaffold já existente.

### Verificado

- `npm test`: **88 checks aprovados**, 18 suítes, 0 falhas.
- `vite build` em diretório temporário: **build concluída sem erro**.
- `sat` sem importação em `src/` ou `tests/`.

## [2026-11-21]

### Adicionado

- Empurrão de bloqueio (28 px normal, 46 px no forte).
- Efeito visual de impacto de bloqueio com escudo, faíscas e anel de choque do forte.
- Script `measure-anchors.ps1` para medir âncoras horizontais por frame.
- Testes de espelhamento (`mirror`) e de efeito de bloqueio (`blockfx`).

### Alterado

- Pulo corrigido para garantir a travessia completa por cima do oponente.
- Agachamento e layout touch ajustados para telas menores.
- `Plasmo.js` atualizado com novas âncoras por frame.
- `physics.js` passou a fixar o x do lutador que está embaixo na aterrissagem do outro.

## [2026-11-19]

### Adicionado

- Testes automatizados de módulos: loop, input, HUD, defesa, knockback, locomoção, corrida, balanceamento e âncoras.
- Pulo atravessável: separação de corpos só ocorre quando ambos estão no chão.
- Correções de rastreamento simultâneo de pointers e teclado.

### Alterado

- Colisões e botões de controle ajustados.
- `Fighter` passou a expor `justLanded`, `blockTimer`, `blockFx` e estado de corrida.
- `Game.js` foi dividido em módulos menores (`GameLoop`, `InputManager`, `HUD`, `TouchControls`, `physics`).

## [2026-11-18]

### Alterado

- `.gitignore` passou a excluir `node_modules/`, `dist/`, cache do Vite, logs e arquivos de ambiente.
- Arquivos de build e dependências deixaram de ser versionados.

## [2026-11-17]

### Adicionado

- Atlas placeholder 96 × 96 com layout 19 × 6.
- Spritesheets reais do Plasmo por estado.
- Combate básico com quatro golpes.
- IA inicial (`CPUController`) com perfis de dificuldade.
- Knockback, hitstun, blockstun e debounce de borda de subida.
- Efeitos visuais iniciais e correção de recorte de sprites.
- Scripts `extract-plasmo.ps1` (extração/chroma key) e `convert-texturepacker.mjs` (conversão de atlas).

### Corrigido

- Recorte e alinhamento das células do Plasmo.
- Pivot e espelhamento dos sprites.

## [2026-11-16]

### Adicionado

- Documentos iniciais: `CONTEXTO-DE-PRODUCAO.md`, `PLANO-DE-MELHORIAS.md` e `README.md`.
- Scaffold Vite na raiz com `index.html`, `src/main.js` e `src/styles/main.css`.
- Fundação mobile-first: Canvas, `Game`, `Fighter` e `CanvasRenderer`.
- Input unificado com suporte a teclado e touch.
- Instruções de instalação, build e publicação no Render.

### Alterado

- Prioridades do roadmap ajustadas para Mobile First.
- Estado real do protótipo registrado nos documentos.

---

## Como manter

- Toda mudança relevante de comportamento, arquitetura, deploy ou licença deve gerar uma entrada.
- Use as seções **Adicionado**, **Alterado**, **Corrigido**, **Removido**, **Verificado** e **Pendente** quando aplicável.
- Registre a data, a evidência (teste/build) e, se possível, o commit.
- Não registre como concluído o que depende de validação em dispositivo físico ou deploy sem evidência.

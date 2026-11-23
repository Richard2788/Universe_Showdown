# Plano de Melhorias — Universe Showdown

> Roadmap incremental para transformar o planejamento em um jogo funcional, testável e publicável.
> **Prioridades:** **P0** bloqueia o MVP; **P1** melhora a qualidade do MVP; **P2** expansão após validação.
> **Status atualizado em:** 2026-11-23.
> **Legenda:** `[x]` implementado e verificável; `[ ]` pendente ou parcial (quando parcial, a lacuna está indicada no item).

## 1. Princípios de priorização

1. Projetar e validar cada fluxo primeiro em celular real; Mobile First é requisito de aceite de todas as etapas.
2. Implementar cedo um protótipo touchscreen de movimentação para validar ergonomia e multi-touch antes de expandir o combate.
3. Construir a simulação e as regras de combate em módulos compartilhados, independentes do dispositivo de entrada.
4. Adaptar teclado e gamepad para desktop somente depois de validar a experiência touchscreen.
5. Investir em polimento, conteúdo e recursos online conforme os critérios de aceite e a prioridade do MVP.

## 2. Roadmap resumido

| Etapa | Prioridade | Resultado esperado | Status |
|---|---|---|---|
| A. Fundação técnica Mobile First | P0 | Vite, viewport mobile, safe areas, Canvas e loop estável. | Concluída, exceto lint e pausa explícita |
| B. Protótipo mobile de movimentação | P0 | Arena, lutadores provisórios, direcional e multi-touch. | Implementada; validação física pendente |
| C. Fundação de combate | P0 | Estados, dados de ataques, hitboxes/hurtboxes e colisão. | Parcial: SAT.js não integrado |
| D. Combate funcional | P0 | Dano, bloqueio, stun, pushback, depuração e IA. | Implementado; falta validação física |
| E. Partida completa local | P0 | Vida, timer, rounds, resultado, reinício e IA. | Parcial: sem timer/rounds/resultado |
| F. Adaptação desktop | P1 | Teclado e gamepad via InputManager compartilhado. | Teclado pronto; gamepad pendente |
| G. Polimento e publicação | P0/P1 | Build, acessibilidade, desempenho, testes e Render. | Testes/build prontos; deploy pendente |
| H. Conteúdo e expansão | P2 | Novos personagens, cenários e modos. | Não iniciada |
| I. Multiplayer online | P2 | Partidas online com validação no servidor. | Não iniciada |

## 3. Estado de implementação (2026-11-23)

### O que está pronto

- [x] Scaffold Vite na raiz, entrada HTML/CSS/JS e dependência `sat` declarada.
- [x] Canvas 2D responsivo com resolução lógica 960 × 540, DPR limitado a 2 e `ResizeObserver`.
- [x] Loop de simulação em passo fixo de 1/60 s, com clamp de delta e render por `requestAnimationFrame`.
- [x] Dois lutadores provisórios e movimentação touchscreen/teclado.
- [x] Combate com quatro golpes, janelas de startup/active/recovery, dano, chip, knockback e hitstun.
- [x] Defesa direcional em pé/agachado, blockstun, empurrão e efeito visual de bloqueio.
- [x] IA com três dificuldades, reação, aproximação, corrida, esquiva, bloqueio e punição.
- [x] Corrida por duplo-toque/Shift, pulo atravessável, aterrissagem e separação de corpos.
- [x] Menu inicial, modos `pvc`/`cvc`, seleção de dificuldade, tela cheia e aviso de retrato.
- [x] Arte real do Plasmo por estado, âncoras por frame e fallback placeholder para o oponente.
- [x] HUD em DOM com vida, rótulos, status `READY`/`ROUND END` e reinício.
- [x] Testes automatizados: 10 arquivos de teste, 18 suítes, 88 checks.
- [x] Build de produção verificada sem erros.

### O que falta para o MVP

- [ ] Cronômetro, rounds, placar e tela de resultado.
- [ ] Reinício automático de round/partida.
- [ ] Gamepad.
- [ ] Áudio e controle de volume.
- [ ] Pausa explícita em `visibilitychange`/perda de foco.
- [ ] Validação de multi-touch, ergonomia e desempenho em aparelho físico.
- [ ] Segundo personagem com arte real e arena com arte final.
- [ ] Publicação no Render e URL pública.
- [ ] Licença do código e origem/licença dos assets.

> Não marcar itens como concluídos apenas porque foram discutidos. Itens que dependem de celular real, deploy ou licença permanecem abertos até haver evidência registrada.

## 4. Backlog detalhado

### Etapa A — Fundação técnica

#### P0 — Inicialização do projeto

- [x] Criar projeto JavaScript Vanilla com Vite.
- [x] Definir a experiência mobile horizontal como viewport de referência.
- [x] Configurar meta viewport, `viewport-fit=cover`, `100dvh` com fallback e áreas seguras.
- [x] Criar shell mobile com menu e arena sem dependência de hover ou mouse.
- [x] Instalar SAT.js por meio do pacote npm `sat`.
- [x] Configurar scripts `dev`, `build`, `preview` e `test`.
- [x] Criar `index.html`, folha de estilos e ponto de entrada.
- [ ] Criar convenção de lint/formatação.
- [x] Registrar versão mínima de Node em `package.json` e versionar `package-lock.json`.

**Critério de aceite:** `npm install`, `npm run dev` e `npm run build` funcionam em ambiente limpo; o primeiro carregamento apresenta conteúdo utilizável em celular sem zoom ou scroll horizontal acidental. **Status: atendido em ambiente local; falta validar em celular físico.**

#### P0 — Canvas e ciclo do jogo

- [x] Criar Canvas 2D responsivo.
- [x] Definir resolução lógica inicial da arena (960 × 540).
- [x] Implementar loop com `requestAnimationFrame`.
- [x] Separar atualização fixa da simulação e renderização.
- [ ] Tratar pausa, aba em segundo plano e retomada sem avanço anormal do tempo.
  - Parcial: delta limitado a 0,1 s e input limpo em blur/visibilidade; não há pausa explícita.
- [x] Redimensionar Canvas sem distorção da proporção.

**Critério de aceite:** a cena mantém velocidade de simulação consistente em monitores com diferentes taxas de atualização e após redimensionamento. **Status: loop e resize atendidos; pausa explícita pendente.**

### Etapa B — Protótipo de luta

#### P0 — Personagem e movimentação

- [x] Implementar `Fighter` com posição, velocidade, orientação, vida e estado.
- [x] Implementar andar, salto, gravidade, aterrissagem e agachamento.
- [x] Implementar limites da arena.
- [x] Definir regra para os lutadores não atravessarem um ao outro no chão.
- [x] Implementar orientação automática para o oponente.
- [x] Criar placeholders visuais temporários para os dois lutadores.
- [x] Adicionar corrida para frente e pulo atravessável.

**Critério de aceite:** dois personagens podem se mover na arena, virar um para o outro, pular e agachar sem atravessar os limites. **Status: atendido no código e nos testes; validação física pendente.**

#### P0 — Estados e ataques

- [x] Implementar máquina de estados do lutador.
  - Implementada por prioridades/flags em `Fighter.getState()` e `Fighter.update()`, sem classe dedicada.
- [x] Criar dados declarativos dos golpes.
- [x] Implementar ataque leve.
- [x] Implementar ataque médio.
- [x] Implementar ataque forte.
- [x] Implementar comando dedicado de chute.
- [x] Implementar startup, active e recovery para cada golpe.
- [x] Impedir ataques incompatíveis durante recovery/stun, salvo cancelamentos configurados.
- [x] Adicionar debounce de borda de subida para ataque e pulo.

**Critério de aceite:** cada comando inicia o golpe correto, respeita as janelas temporais e não permite ações inválidas. **Status: atendido e coberto por testes.**

#### P0 — Hitboxes, hurtboxes e dano

- [x] Criar sistema de hitboxes e hurtboxes.
- [ ] Integrar SAT.js para os testes geométricos necessários (avaliar apenas se as hitboxes virarem polígonos).
  - **Decisão atual:** não integrar nesta fase. A colisão é própria (distância + altura + postura) e o `sat` não é importado. Ver decisão na seção 6.
- [x] Atualizar hitboxes conforme estado, direção e dados do golpe.
- [x] Aplicar dano apenas durante frames ativos.
- [x] Garantir no máximo um acerto por alvo por golpe.
- [x] Implementar knockback, hitstun e blockstun básicos.
- [x] Testar colisões quando o jogador está à esquerda e à direita do oponente.
- [x] Adicionar modo de depuração que desenhe hitboxes e hurtboxes.

**Critério de aceite:** não há dano fora da janela ativa; os golpes acertam nos dois sentidos; hitboxes de debug coincidem com o alcance esperado. **Status: atendido com colisão própria; integração SAT.js permanece opcional.**

### Etapa C — Combate completo local

#### P0 — Defesa e regras da partida

- [x] Implementar bloqueio direcional básico.
- [x] Definir dano bloqueado (chip apenas no forte) e reação de bloqueio.
- [x] Criar barra de vida.
- [ ] Criar cronômetro.
- [ ] Implementar fim do round por nocaute ou tempo.
- [ ] Implementar placar de rounds e resultado final.
- [ ] Adicionar reinício completo de partida.
- [x] Adicionar botão de reinício dos lutadores.

**Critério de aceite:** uma partida pode começar, terminar e ser reiniciada sem recarregar a página. **Status: parcial — início, KO e reset manual existem; timer/rounds/resultado não.**

#### P0 — IA inicial

- [x] Criar IA com estados simples: aproximar, manter distância, atacar, defender, pular e correr.
- [x] Evitar comportamento que repita ataque sem intervalo.
- [x] Definir dificuldade inicial configurável (fácil, médio e difícil).
- [x] Fazer a IA respeitar startup, recovery, alcance e estados do próprio personagem.
- [x] Adicionar limites simples de reação para não parecer que a IA conhece comandos antes do tempo.
- [x] Adicionar punição de hitstun/recuperação no perfil difícil.

**Critério de aceite:** o adversário se movimenta, ataca e defende com comportamento compreensível e pode ser vencido por um jogador iniciante. **Status: implementado; falta validação de diversão/balanceamento em dispositivo real.**

### Etapa D — Controles multiplataforma

#### P0 — Input unificado

- [x] Criar `InputManager` com ações independentes de dispositivo.
- [x] Implementar touchscreen usando Pointer Events.
- [x] Suportar múltiplos pointers simultâneos e mapear cada `pointerId` à ação correspondente.
- [x] Implementar teclado com suporte a teclas simultâneas.
- [x] Limpar ações pressionadas ao receber `pointercancel`, `keyup`, `blur` ou perda de foco.
- [x] Prevenir seleção de texto e gestos indesejados na área de controles.
- [ ] Implementar Gamepad API com mapeamento inicial documentado.

**Critério de aceite:** a lógica do personagem recebe o mesmo conjunto de ações independentemente do dispositivo; manter direção e atacar ao mesmo tempo funciona no mobile e no desktop. **Status: touch e teclado atendidos; gamepad e validação física pendentes.**

#### P0 — Interface e ergonomia Mobile First

- [x] Criar direcional virtual no lado esquerdo e quatro botões de ataque no lado direito.
- [x] Definir acesso claro a pulo e agachamento sem prejudicar comandos simultâneos.
- [ ] Adotar 48 × 48 CSS px como referência mínima em todos os comandos primários.
  - Parcial: movimento ~57–73 px, ataques ~44–56 px (40 px em retrato estreito), utilitários ~26–34 px.
- [x] Garantir feedback visual de pressionado e estados de botão consistentes.
- [x] Implementar multi-touch com rastreamento independente de `pointerId`.
- [x] Tratar `pointerup`, `pointercancel`, `lostpointercapture`, `blur`, `visibilitychange` e `pagehide`.
- [x] Respeitar safe areas e barras dinâmicas do navegador.
- [ ] Testar telas pequenas, aparelhos com recortes e diferentes proporções em dispositivo real.
- [x] Exibir orientação recomendada para modo paisagem durante a luta.
- [x] Verificar que o HUD não sobrepõe os controles.
- [ ] Validar a interface em aparelho físico, não apenas no emulador.

**Critério de aceite:** é possível concluir uma partida em celular real, sem comandos encobertos ou difíceis de pressionar, mantendo direção e ataque simultaneamente e sem botões presos após interrupções. **Status: pendente de validação física.**

### Etapa E — Polimento e qualidade

#### P1 — Arte e animação

- [ ] Definir direção de arte original e registrar licença.
  - Parcial: Plasmo tem arte real, mas origem/licença não documentada.
- [x] Criar spritesheets ou animações por estados.
- [x] Adicionar idle, walk, run, jump, crouch, ataques, hit e block.
- [ ] Adicionar victory e defeat.
- [x] Sincronizar os frames de impacto com as janelas de hitbox.
- [x] Criar efeito de impacto de bloqueio.
- [ ] Criar efeitos de impacto de acerto, poeira e feedback adicional.
- [x] Criar cenário provisório com leitura clara dos limites da arena.
- [ ] Criar cenário com arte final.
- [ ] Documentar licença e origem dos assets.

**Critério de aceite:** cada estado importante tem feedback visual claro; o frame de contato coincide com a hitbox ativa. **Status: parcial — combate e bloqueio cobertos; arte final e licenças pendentes.**

#### P1 — Áudio e feedback

- [ ] Adicionar efeitos de soco, chute, bloqueio e impacto.
- [ ] Adicionar feedback de round iniciado e finalizado.
- [ ] Oferecer controle de volume e opção de silenciar.
- [ ] Não iniciar áudio antes de interação do usuário.

**Critério de aceite:** sons são reproduzidos após interação válida e podem ser desligados. **Status: não iniciado.**

#### P1 — Acessibilidade e usabilidade

- [x] Incluir rótulos acessíveis nos botões HTML principais.
- [x] Permitir abrir o menu e pausar a partida de modo claro.
- [ ] Garantir contraste suficiente em todos os indicadores essenciais.
- [ ] Não comunicar estado apenas por cor.
- [ ] Evitar animações excessivamente agressivas em menus.
- [ ] Considerar opção para reduzir efeitos visuais.

**Status: parcial.**

#### P1 — Desempenho e robustez

- [x] Limitar o `devicePixelRatio` usado para o Canvas (máximo 2).
- [x] Evitar polígonos SAT e alocações geométricas por frame.
- [ ] Auditar alocações no loop (spreads de ações/estado).
- [ ] Otimizar carregamento de sprites e áudio.
- [ ] Testar longas sessões e redimensionamentos repetidos.
- [ ] Medir desempenho em pelo menos um celular intermediário.
- [ ] Verificar erros de console e recursos ausentes em navegador real.

**Critério de aceite:** a experiência se mantém jogável no dispositivo de referência, sem degradação progressiva ou erros críticos. **Status: pendente de medição.**

### Etapa F — Testes e publicação no Render

#### P0 — Qualidade antes do deploy

- [x] Criar testes automatizados de regressão.
- [x] Testar ataques nos dois lados da arena.
- [x] Testar golpes bloqueados, altura e fora de alcance.
- [x] Testar múltiplas fontes simultâneas no `InputManager`.
- [ ] Testar `TouchControls` com eventos de ponteiro reais em DOM/aparelho.
- [x] Testar clamp de aba em segundo plano no `GameLoop`.
- [x] Rodar build de produção.
- [ ] Verificar caminhos e maiúsculas/minúsculas dos assets na build em navegador real.
  - Parcial: a build copia os assets e conclui sem erro; falta abrir a build e conferir carregamento das PNGs.
- [ ] Criar checklist de testes manuais desktop e mobile.
- [ ] Testar `TouchControls` em DOM real e em aparelho físico.
- [ ] Testar troca de aba, pausa e retomada em navegador real.

#### P0 — Render Static Site

- [x] Subir o código em repositório Git.
- [ ] Criar Static Site no Render.
- [x] Configurar comando de build previsto: `npm ci && npm run build` (há `package-lock.json`).
- [x] Configurar diretório publicado previsto: `dist`.
- [ ] Configurar branch de deploy.
- [ ] Validar a URL pública em desktop e mobile.
- [ ] Confirmar carregamento dos recursos e funcionamento da partida.

**Critério de aceite:** o endereço público abre o jogo e permite iniciar e concluir uma luta. Registrar URL e data de publicação no histórico. **Status: não publicado.**

### Etapa G — Expansão de conteúdo (P2)

- [ ] Adicionar seleção de personagens.
- [ ] Criar segundo conjunto de movimentos para cada personagem.
- [ ] Adicionar novas arenas com limites configuráveis.
- [ ] Criar variações de chute e golpes especiais.
- [ ] Implementar combos e cancelamentos avançados.
- [ ] Adicionar treino com exibição de dados de golpe.
- [ ] Criar opções de dificuldade adicionais.
- [ ] Implementar configurações de controles e remapeamento.

### Etapa H — Multiplayer online (P2, projeto separado)

- [ ] Definir modelo de sincronização e autoridade do servidor.
- [ ] Criar backend Node.js como Render Web Service.
- [ ] Avaliar WebSockets para troca de comandos/estados.
- [ ] Projetar lobby, criação e encerramento de partidas.
- [ ] Validar comandos e estados no servidor; não confiar no cliente como autoridade de dano/vida.
- [ ] Tratar latência, reconexão, abandono e discrepância de estado.
- [ ] Criar testes de carga e monitoramento antes de abrir para público.

## 5. Estratégia de testes

| Área | Testes existentes | Pendências |
|---|---|---|
| Movimentação | Velocidade, limites, pulo, separação, face e corrida. | Sessão longa e validação física. |
| Combate | Startup/active/recovery, dano, altura, chip, stun e hit único. | Combos, multi-hit e cancelamentos futuros. |
| Defesa | Block em pé/agachado, low furando block, chip do forte, blockstun e pushback. | Validação em dispositivo. |
| Direção | Golpes e face nos dois lados. | — |
| Input desktop | Teclas simultâneas, keyup, blur e fontes. | Teste em navegador real. |
| Input mobile | `InputManager` multi-fonte; limpeza de estado. | `TouchControls` em DOM real e aparelho físico. |
| Gamepad | — | Implementação e testes. |
| Responsividade | Resize, DPR, safe areas e breakpoints por CSS. | Rotação e recortes em aparelho real. |
| Build/hosting | Build e caminhos de assets. | Deploy e URL pública. |

## 6. Dívidas técnicas e riscos

1. **SAT.js sem uso:** o pacote está instalado, mas a colisão é própria. Decisão atual: **não integrar** até existir hitbox poligonal. Risco: dependência morta e documentação anterior incorreta.
2. **Partida incompleta:** sem timer, rounds, placar, resultado e rematch automático.
3. **Gamepad ausente.**
4. **Áudio ausente.**
5. **Pausa/visibilidade:** aba oculta não pausa a simulação explicitamente.
6. **Licenças:** sem `LICENSE`; origem/licença do Plasmo não registrada. Bloqueia publicação.
7. **Arte incompleta:** oponente placeholder e cenário procedural.
8. **Ergonomia touch:** utilitários abaixo de 48 px e ataques de 44 px (40 px em retrato estreito) em telas pequenas.
9. **Scripts de arte Windows-only:** caminhos fixos da máquina do autor.
10. **Sem testes e2e/DOM real:** `TouchControls`, tela cheia e layout não têm cobertura automatizada.
11. **Higiene do repositório:** `package.json` tem alteração local de `allowScripts` não commitada e `sat` sem uso.
12. **Deploy:** nenhuma publicação ou verificação em produção.

### Decisão sobre SAT.js

O SAT.js não é necessário para o combate atual. A colisão por alcance + altura + postura é mais simples, determinística, sem alocações e coberta por testes. A integração passa a ser considerada quando:

- hurtboxes/hitboxes forem polígonos convexos;
- membros/armas tiverem colisão própria;
- golpes precisarem de trajetória geométrica em 2D.

Até lá, `sat` deve ser tratado como dependência opcional; removê-la ou mantê-la é uma decisão de limpeza, não um bloqueio do MVP.

## 7. Sequência recomendada de entregas

1. **Fechar o estado documental:** contexto, README, plano, assets, changelog e créditos alinhados ao código.
2. **Completar a partida local:** cronômetro, rounds, placar, resultado e rematch.
3. **Validar em celular físico:** multi-touch, ergonomia, safe areas, rotação, desempenho e botões presos.
4. **Publicar:** resolver licenças, criar `LICENSE`, publicar no Render e registrar URL/data.
5. **Polir conteúdo:** segundo personagem real, arena final, áudio e efeitos de impacto.
6. **Adaptação desktop completa:** gamepad e remapeamento.
7. **Avaliar SAT.js:** somente se as hitboxes evoluírem para polígonos.
8. **Expansão:** seleção de personagens, novas arenas, combos e treino.
9. **Multiplayer online:** projeto separado, com autoridade no servidor.

A ordem prioriza fechar o MVP jogável e validado antes de investir em conteúdo extenso ou rede.

## 8. Rotina de revisão semanal

Em cada revisão:

1. Identificar o que foi realmente concluído desde a revisão anterior.
2. Conferir os critérios de aceite das tarefas marcadas como concluídas, priorizando testes em celular físico.
3. Verificar se novas telas e recursos respeitam a abordagem Mobile First e não introduzem dependência de hover, mouse ou teclado.
4. Listar bugs, bloqueios e decisões pendentes.
5. Reordenar as três próximas tarefas prioritárias.
6. Não marcar tarefa como concluída apenas porque foi discutida ou planejada.
7. Atualizar este arquivo, o `CONTEXTO-DE-PRODUCAO.md` e o `CHANGELOG.md` quando uma decisão estrutural mudar.

## 9. Registro de alterações

| Data | Alteração | Responsável |
|---|---|---|
| 2026-11-16 | Criação do roadmap inicial a partir do escopo do MVP. | Equipe do projeto |
| 2026-11-16 | Priorização Mobile First: touchscreen e validação em celular passam a orientar todas as etapas. | Equipe do projeto |
| 2026-11-17 | Registro de atlas placeholder, spritesheets do Plasmo, combate básico, IA e efeitos. | Equipe do projeto |
| 2026-11-19 | Registro de testes de módulos, pulo atravessável e ajustes de colisão/input. | Equipe do projeto |
| 2026-11-21 | Registro de empurrão de bloqueio, correção do pulo, efeitos e agachamento responsivo. | Equipe do projeto |
| 2026-11-23 | Sincronização do roadmap com o estado real: etapas A/B concluídas, C/D/E/F parciais, deploy e validação física pendentes; SAT.js registrado como dívida opcional; criação de `CHANGELOG.md` e `CREDITS.md`. | Equipe do projeto |

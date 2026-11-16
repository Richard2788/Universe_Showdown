# Plano de Melhorias — Jogo de Luta 2D

> Roadmap incremental para transformar o planejamento em um jogo funcional, testável e publicável.  
> Prioridades: **P0** bloqueia o MVP; **P1** melhora a qualidade do MVP; **P2** expansão após validação.

## 1. Princípios de priorização

1. Projetar e validar cada fluxo primeiro em celular real; Mobile First é requisito de aceite de todas as etapas.
2. Implementar cedo um protótipo touchscreen de movimentação para validar ergonomia e multi-touch antes de expandir o combate.
3. Construir a simulação e as regras de combate em módulos compartilhados, independentes do dispositivo de entrada.
4. Adaptar teclado e gamepad para desktop somente depois de validar a experiência touchscreen.
5. Investir em polimento, conteúdo e recursos online conforme os critérios de aceite e a prioridade do MVP.

## 2. Roadmap resumido

| Etapa | Prioridade | Resultado esperado |
|---|---|---|
| A. Fundação técnica Mobile First | P0 | Vite, viewport mobile, safe areas, Canvas e loop estável. |
| B. Protótipo mobile de movimentação | P0 | Arena, lutadores provisórios, direcional e multi-touch validados em aparelho real. |
| C. Fundação de combate | P0 | Estados, dados de ataques e colisões SAT.js. |
| D. Combate funcional | P0 | Hitbox/hurtbox, dano, bloqueio, stun, pushback e depuração. |
| E. Partida completa local | P0 | Vida, timer, rounds, resultado, reinício e IA. |
| F. Adaptação desktop | P1 | Teclado e gamepad via InputManager compartilhado. |
| G. Polimento e publicação | P0/P1 | Build, acessibilidade, desempenho, testes e Render. |
| H. Conteúdo e expansão | P2 | Novos personagens, cenários e modos. |
| I. Multiplayer online | P2 | Partidas online com validação no servidor. |

## 3. Backlog detalhado

## Estado de implementação (2026-11)

- [x] Scaffold Vite Vanilla na raiz, entrada HTML/CSS/JS e dependência `sat` declarada.
- [x] Canvas com resolução lógica escalada e loop de simulação em passo fixo.
- [x] Protótipo inicial com dois lutadores provisórios e movimentação touchscreen/teclado.
- [ ] Validar multi-touch e ergonomia em aparelhos físicos Android/iOS.
- [ ] Implementar combate real com SAT.js, IA, partida completa, gamepad e publicação.

O protótipo atual não representa conclusão das etapas B–G. Marque itens como concluídos somente após implementação e teste verificáveis.

## Etapa A — Fundação técnica

### P0 — Inicialização do projeto

- [ ] Criar projeto JavaScript Vanilla com Vite.
- [ ] Definir a experiência mobile horizontal como viewport de referência.
- [ ] Configurar meta viewport, `viewport-fit=cover`, `100dvh` com fallback e áreas seguras (`safe-area-inset-*`).
- [ ] Criar um shell mobile com menu e arena sem dependência de hover ou mouse.
- [ ] Instalar SAT.js por meio do pacote npm `sat`.
- [ ] Configurar scripts `dev`, `build` e `preview`.
- [ ] Criar `index.html`, folha de estilos e ponto de entrada.
- [ ] Criar convenção de lint/formatação quando houver valor para a equipe.
- [ ] Registrar versões de Node e dependências no repositório.

**Critério de aceite:** `npm install`, `npm run dev` e `npm run build` funcionam em ambiente limpo; o primeiro carregamento apresenta conteúdo utilizável em celular sem zoom ou scroll horizontal acidental.

### P0 — Canvas e ciclo do jogo

- [ ] Criar Canvas 2D responsivo.
- [ ] Definir resolução lógica inicial da arena.
- [ ] Implementar loop com `requestAnimationFrame`.
- [ ] Separar atualização fixa da simulação e renderização.
- [ ] Tratar pausa, aba em segundo plano e retomada sem avanço anormal do tempo.
- [ ] Redimensionar Canvas sem distorção da proporção.

**Critério de aceite:** a cena mantém velocidade de simulação consistente em monitores com diferentes taxas de atualização e após redimensionamento da janela.

## Etapa B — Protótipo de luta

### P0 — Personagem e movimentação

- [ ] Implementar classe/estrutura `Fighter` com posição, velocidade, orientação, vida e estado.
- [ ] Implementar andar, salto, gravidade, aterrissagem e agachamento.
- [ ] Implementar limites da arena.
- [ ] Definir regra para os lutadores não atravessarem um ao outro.
- [ ] Implementar orientação automática para o oponente.
- [ ] Criar placeholders visuais temporários para os dois lutadores.

**Critério de aceite:** dois personagens podem se mover na arena, virar um para o outro, pular e agachar sem atravessar os limites.

### P0 — Estados e ataques

- [ ] Implementar máquina de estados do lutador.
- [ ] Criar dados declarativos dos golpes.
- [ ] Implementar ataque leve.
- [ ] Implementar ataque médio.
- [ ] Implementar ataque forte.
- [ ] Implementar comando dedicado de chute.
- [ ] Implementar startup, active e recovery para cada golpe.
- [ ] Impedir ataques incompatíveis durante recovery/stun, salvo cancelamentos configurados.

**Critério de aceite:** cada comando inicia o golpe correto, respeita as janelas temporais e não permite ações inválidas.

### P0 — Hitboxes, hurtboxes e dano

- [ ] Criar sistema de hitboxes e hurtboxes.
- [ ] Integrar SAT.js para os testes geométricos necessários.
- [ ] Atualizar hitboxes conforme estado, direção e animação.
- [ ] Aplicar dano apenas durante frames ativos.
- [ ] Garantir no máximo um acerto por alvo por golpe, salvo multi-hit declarado.
- [ ] Implementar knockback, hitstun e blockstun básicos.
- [ ] Testar colisões quando o jogador estiver à esquerda e à direita do oponente.
- [ ] Adicionar modo de depuração que desenhe hitboxes e hurtboxes.

**Critério de aceite:** não há dano fora da janela ativa; os golpes acertam nos dois sentidos; hitboxes de debug coincidem com o alcance esperado.

## Etapa C — Combate completo local

### P0 — Defesa e regras da partida

- [ ] Implementar bloqueio direcional básico.
- [ ] Definir dano bloqueado e reação de bloqueio.
- [ ] Criar barra de vida e cronômetro.
- [ ] Implementar fim do round por nocaute ou tempo.
- [ ] Implementar placar de rounds e resultado final.
- [ ] Adicionar reinício de partida.

**Critério de aceite:** uma partida pode começar, terminar e ser reiniciada sem recarregar a página.

### P0 — IA inicial

- [ ] Criar IA com estados simples: aproximar, manter distância, atacar, defender e recuperar.
- [ ] Evitar comportamento que repita ataque sem intervalo.
- [ ] Definir dificuldade inicial configurável.
- [ ] Fazer a IA respeitar startup, recovery, alcance e estados do próprio personagem.
- [ ] Adicionar limites simples de reação para não parecer que a IA conhece comandos antes do tempo.

**Critério de aceite:** o adversário se movimenta, ataca e defende com comportamento compreensível e pode ser vencido por um jogador iniciante.

## Etapa D — Controles multiplataforma

### P0 — Input unificado

- [ ] Criar `InputManager` com ações independentes de dispositivo.
- [ ] Implementar touchscreen primeiro usando Pointer Events.
- [ ] Suportar múltiplos pointers simultâneos e mapear cada `pointerId` à ação correspondente.
- [ ] Implementar teclado com suporte a teclas simultâneas como adaptação desktop.
- [ ] Limpar ações pressionadas ao receber `pointercancel`, `keyup`, `blur` ou perda de foco.
- [ ] Prevenir seleção de texto e gestos indesejados apenas na área de controles.
- [ ] Implementar Gamepad API com mapeamento inicial documentado.

**Critério de aceite:** a lógica do personagem recebe o mesmo conjunto de ações independentemente do dispositivo; o touchscreen é validado primeiro e manter direção e atacar ao mesmo tempo funciona no mobile e no desktop.

### P0 — Interface e ergonomia Mobile First

- [ ] Criar direcional virtual no lado esquerdo e quatro botões de ataque no lado direito.
- [ ] Definir acesso claro a pulo e agachamento sem prejudicar comandos simultâneos.
- [ ] Adotar 48 × 48 CSS px como referência mínima inicial para alvos de toque primários, ajustando após testes reais.
- [ ] Garantir feedback visual de pressionado e estados de botão consistentes.
- [ ] Implementar multi-touch com rastreamento independente de `pointerId`.
- [ ] Tratar `pointerup`, `pointercancel`, `lostpointercapture`, `blur`, `visibilitychange` e rotação de tela.
- [ ] Respeitar safe areas e barras dinâmicas do navegador.
- [ ] Testar telas pequenas, aparelhos com recortes e diferentes proporções.
- [ ] Exibir orientação recomendada para modo paisagem durante a luta.
- [ ] Verificar que HUD não sobrepõe Canvas ou controles.
- [ ] Validar a interface em aparelho físico, não apenas no emulador do navegador.

**Critério de aceite:** é possível concluir uma partida em celular real, sem comandos encobertos ou difíceis de pressionar, mantendo direção e ataque simultaneamente e sem botões presos após interrupções.

## Etapa E — Polimento e qualidade

### P1 — Arte e animação

- [ ] Definir direção de arte original.
- [ ] Criar spritesheets ou animações por estados.
- [ ] Adicionar idle, walk, jump, crouch, ataques, hit, block, victory e defeat.
- [ ] Sincronizar os frames de impacto com as janelas de hitbox.
- [ ] Criar efeitos de impacto, poeira e feedback de bloqueio.
- [ ] Criar cenário com leitura clara dos limites da arena.
- [ ] Documentar licença e origem dos assets.

**Critério de aceite:** cada estado importante tem feedback visual claro; o frame de contato visual corresponde ao momento em que a hitbox está ativa.

### P1 — Áudio e feedback

- [ ] Adicionar efeitos de soco, chute, bloqueio e impacto.
- [ ] Adicionar feedback de round iniciado e finalizado.
- [ ] Oferecer controle de volume e opção de silenciar.
- [ ] Não iniciar áudio antes de uma interação do usuário, respeitando políticas de autoplay do navegador.

**Critério de aceite:** sons são reproduzidos após interação válida e podem ser desligados.

### P1 — Acessibilidade e usabilidade

- [ ] Garantir contraste suficiente nos indicadores essenciais.
- [ ] Não comunicar estado apenas por cor.
- [ ] Incluir rótulos acessíveis para botões HTML de interface.
- [ ] Permitir pausar ou sair da partida de modo claro.
- [ ] Evitar animações excessivamente agressivas em menus.
- [ ] Considerar opção para reduzir efeitos visuais.

### P1 — Desempenho e robustez

- [ ] Limitar o `devicePixelRatio` usado para o Canvas.
- [ ] Reutilizar objetos de colisão e vetores quando possível.
- [ ] Evitar alocações excessivas dentro do loop.
- [ ] Otimizar carregamento de sprites e áudio.
- [ ] Testar longas sessões e redimensionamentos repetidos.
- [ ] Medir desempenho em pelo menos um celular intermediário.
- [ ] Verificar erros de console e recursos ausentes.

**Critério de aceite:** a experiência se mantém jogável no dispositivo de referência, sem degradação progressiva ou erros críticos.

## Etapa F — Testes e publicação no Render

### P0 — Qualidade antes do deploy

- [ ] Criar checklist de testes manuais desktop e mobile.
- [ ] Testar ataques nos dois lados da arena.
- [ ] Testar golpes bloqueados, interrompidos e fora de alcance.
- [ ] Testar múltiplos toques e cancelamento de pointer.
- [ ] Testar troca de aba, pausa e retomada.
- [ ] Rodar build de produção.
- [ ] Verificar caminhos e maiúsculas/minúsculas dos assets.

### P0 — Render Static Site

- [ ] Subir o código em repositório Git.
- [ ] Criar Static Site no Render.
- [ ] Configurar comando de build `npm ci && npm run build` (quando houver `package-lock.json`).
- [ ] Configurar diretório publicado como `dist`.
- [ ] Configurar branch de deploy.
- [ ] Validar a URL pública em desktop e mobile.
- [ ] Confirmar carregamento dos recursos e funcionamento da partida.

**Critério de aceite:** o endereço público abre o jogo e permite iniciar e concluir uma luta. Registrar URL e data de publicação no histórico do projeto.

## Etapa G — Expansão de conteúdo (P2)

- [ ] Adicionar seleção de personagens.
- [ ] Criar segundo conjunto de movimentos para cada personagem.
- [ ] Adicionar novas arenas com limites configuráveis.
- [ ] Criar variações de chute e golpes especiais.
- [ ] Implementar combos e cancelamentos avançados.
- [ ] Adicionar treino com exibição de dados de golpe.
- [ ] Criar opções de dificuldade da IA.
- [ ] Implementar configurações de controles e remapeamento.

**Critério de aceite:** o conteúdo adicional usa os mesmos contratos de personagem, golpe, input e colisão; não exige cópias paralelas da lógica.

## Etapa H — Multiplayer online (P2, projeto separado)

- [ ] Definir modelo de sincronização e autoridade do servidor.
- [ ] Criar backend Node.js como Render Web Service.
- [ ] Avaliar WebSockets para troca de comandos/estados.
- [ ] Projetar lobby, criação e encerramento de partidas.
- [ ] Validar comandos e estados no servidor; não confiar no cliente como autoridade de dano/vida.
- [ ] Tratar latência, reconexão, abandono e discrepância de estado.
- [ ] Criar testes de carga e monitoramento antes de abrir para público.

**Critério de aceite:** duas sessões em dispositivos distintos concluem uma partida consistente, com validação server-side e tratamento de desconexões.

## 4. Estratégia de testes

| Área | Testes essenciais |
|---|---|
| Movimentação | Limites, salto, gravidade, agachamento, virada e colisão entre jogadores. |
| Combate | Startup, active, recovery, dano, bloqueio, stun e hit único. |
| Direção | Hitbox correta quando cada personagem está à esquerda/direita. |
| Input desktop | Teclas simultâneas, repetição, keyup e perda de foco. |
| Input mobile | Dois ou mais toques, `pointercancel`, perda de captura, toque longo, blur e fim do toque fora do botão. |
| Ergonomia mobile | Alvos de toque, safe areas, HUD, orientação e uso em aparelho real. |
| Gamepad | Detecção, mapeamento, desconexão e fallback. |
| Responsividade | Diferentes resoluções, DPR, orientação, barras dinâmicas e redimensionamento. |
| Build/hosting | Build limpa, assets, URL pública e carregamento sem erros. |

## 5. Sequência recomendada de entregas

1. **Fundação mobile:** Vite, viewport mobile landscape, safe areas, Canvas e loop fixo; validar carregamento em celular real.
2. **Protótipo mobile de movimentação:** direcional touchscreen, multi-touch e dois lutadores placeholder.
3. **Protótipo de combate:** estados, quatro comandos, hitboxes, hurtboxes e SAT.js.
4. **Partida local:** vida, dano, defesa, rounds, cronômetro e IA simples.
5. **Adaptação desktop:** teclado e gamepad usando o mesmo `InputManager`, mantendo a experiência mobile como referência.
6. **Polimento:** arte, animação, som, HUD e desempenho medido primeiro em celular.
7. **Publicação:** build, Render Static Site, verificação pública em celular e desktop e documentação do deploy.

A ordem valida a ergonomia touchscreen e a mecânica de luta antes de investir em arte extensa ou recursos de rede.

## 6. Rotina de revisão semanal

Em cada revisão:

1. Identificar o que foi realmente concluído desde a revisão anterior.
2. Conferir os critérios de aceite das tarefas marcadas como concluídas, priorizando testes em celular físico.
3. Verificar se novas telas e recursos respeitam a abordagem Mobile First e não introduzem dependência de hover, mouse ou teclado.
4. Listar bugs, bloqueios e decisões pendentes.
5. Reordenar as três próximas tarefas prioritárias.
6. Não marcar tarefa como concluída apenas porque foi discutida ou planejada.
7. Atualizar este arquivo e o contexto de produção quando uma decisão estrutural mudar.

## 7. Registro de alterações

| Data | Alteração | Responsável |
|---|---|---|
| 2026-11-16 | Criação do roadmap inicial a partir do escopo do MVP. | Equipe do projeto |
| 2026-11-16 | Priorização Mobile First: touchscreen e validação em celular passam a orientar todas as etapas. | Equipe do projeto |
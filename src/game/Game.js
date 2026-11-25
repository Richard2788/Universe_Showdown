import { Fighter, ATTACKS, JUMP_ANIM, BLOCK_ANIM } from '../fighters/Fighter.js';
import { CanvasRenderer } from '../rendering/CanvasRenderer.js';
import { SpriteAnimator, loadAtlasImage } from '../rendering/SpriteAnimator.js';
import { ANIMATION_DATA } from '../characters/animations.js';
import { buildPlaceholderAtlas } from '../characters/PlaceholderAtlas.js';
import { ROSTER, getKit } from '../characters/roster.js';
import { CPUController, DIFFICULTIES } from '../ai/CPUController.js';
import { InputManager } from '../core/InputManager.js';
import { RunDetector } from '../core/RunDetector.js';
import { GameLoop } from '../core/GameLoop.js';
import { HUD } from '../ui/HUD.js';
import { MatchManager } from './MatchManager.js';
import {
  WIDTH, HEIGHT, STEP, MAX_FRAME_DELTA, STAGE_MARGIN,
  PLAYER_SPAWN_X, ENEMY_SPAWN_X, isDebugEnabled,
} from '../config/game.js';
import { separateBodies, updateFaces } from './physics.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = new CanvasRenderer(this.ctx, WIDTH, HEIGHT);
    this.hud = new HUD();
    this.input = new InputManager();
    this.runDetector = new RunDetector(); // duplo-toque da direção → corrida
    // Kits dos lutadores (roster.js). O jogador é o Plasmo por padrão;
    // `?player=<id>` é override de desenvolvimento para testar o kit de
    // outro personagem antes do desbloqueio. O oponente padrão continua
    // placeholder (enemyKit null); `?enemy=sable` e a fase 3 da campanha
    // aplicam o kit da Sable — ambos caem no getKit.
    const params = new URLSearchParams(window.location.search);
    this.playerKit = getKit(params.get('player')) ?? ROSTER.plasmo;
    this.enemyKit = getKit(params.get('enemy'));
    this.player = new Fighter(PLAYER_SPAWN_X, this.playerKit.color, 1, {
      // Plasmo: conteúdo normalizado a ~96px (metade do mais alto); escala
      // total 1.1 × 1 ≈ mesmo tamanho do placeholder (~105 px).
      renderScale: this.playerKit.renderScale,
      hurtboxHalfWidth: this.playerKit.hurtbox.halfWidth,
      hurtboxHeight: this.playerKit.hurtbox.height,
      attacks: this.playerKit.attacks,
      jumpAnim: this.playerKit.jumpAnim,
      blockAnim: this.playerKit.blockAnim,
    });
    this.enemy = new Fighter(ENEMY_SPAWN_X, '#ff638c', -1);
    this.kitArtLoads = new Map();
    this.setupAnimators();
    if (this.enemyKit) this.applyEnemyKit(this.enemyKit);
    // ── Campanha: rounds, cronômetro e pontuação ──
    // O MatchManager não conhece DOM/Fighter: o Game informa a vida no
    // snapshot e reage aos eventos (roundStart/roundEnd/phaseEnd).
    this.enemyAtlasCache = new Map();
    this.bannerTimer = 0;
    this.onMatchEvent = null;
    this.match = new MatchManager({ onEvent: (event) => this.handleMatchEvent(event) });
    this.frame = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    // Flag para evitar loop do ResizeObserver quando entra/sai do fullscreen.
    // requestFullscreen() pode disparar o ResizeObserver ANTES de definir
    // document.fullscreenElement, então usamos um flag próprio atualizado
    // pelos eventos fullscreenchange em vez de checar o documento diretamente.
    this._isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
    const onFullscreenChange = () => {
      this._isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    };
    for (const event of [
      'fullscreenchange',
      'webkitfullscreenchange',
      'msfullscreenchange',
    ]) {
      document.addEventListener(event, onFullscreenChange);
    }
    // Modo debug: ?debug=1 exibe hitboxes, posição e estado dos lutadores.
    // (`params` foi lido no topo do construtor, junto com os kits.)
    this.debug = isDebugEnabled();
    this.renderer.debug = this.debug;
    // ── IA da CPU ──
    // ?diff=facil|medio|dificil pré-seleciona a dificuldade (padrão: fácil).
    // O modo ('menu' | 'pvc' | 'cvc') só sai do menu quando o jogador escolhe.
    const diff = params.get('diff');
    this.difficulty = DIFFICULTIES[diff] ? diff : 'facil';
    this.mode = 'menu';
    this.previousMode = null;
    this.cpuPlayer = new CPUController(this.player, this.enemy, this.difficulty);
    this.cpuEnemy = new CPUController(this.enemy, this.player, this.difficulty);
    this.renderer.cpuStates.set(this.player, null);
    this.renderer.cpuStates.set(this.enemy, null);
    // Loop com timestep fixo: a simulação não depende da taxa de render.
    this.gameLoop = new GameLoop({
      update: (dt) => this.update(dt),
      render: () => this.render(),
      step: STEP,
      maxDelta: MAX_FRAME_DELTA,
    });
  }
  /**
   * Cria um SpriteAnimator por lutador usando a atlas placeholder.
   * O Player 01 (Plasmo) recebe as atlases reais de public/assets/characters/
   * plasmo/ (uma por estado) assim que carregam — o placeholder cobre o
   * intervalo. Quando houver arte do oponente, siga o mesmo padrão.
   */
  setupAnimators() {
    const playerAtlas = buildPlaceholderAtlas(this.playerKit.color);
    const enemyAtlas = buildPlaceholderAtlas('#ff638c');
    this.fighterAnimators = new Map([
      [this.player, new SpriteAnimator(playerAtlas, this.playerKit.data)],
      [this.enemy, new SpriteAnimator(enemyAtlas, ANIMATION_DATA)],
    ]);
    for (const [fighter, animator] of this.fighterAnimators) {
      this.renderer.setAnimator(fighter, animator);
    }
    this.applyKitArt(this.player, this.playerKit);
  }

  /** Carrega uma vez as imagens de um kit e as reutiliza em novos rounds. */
  loadKitArt(kit) {
    if (!this.kitArtLoads.has(kit.id)) {
      const { data, folder, cacheBust = '' } = kit;
      const load = Promise.all(Object.entries(data.states).map(([name, state]) =>
        loadAtlasImage(`/assets/characters/${folder}/${state.image}${cacheBust}`)
          .then((image) => [name, image])
      )).then((entries) => new Map(entries));
      this.kitArtLoads.set(kit.id, load);
    }
    return this.kitArtLoads.get(kit.id);
  }

  /** Aplica a arte do kit somente se ele ainda estiver ativo no animador. */
  applyKitArt(fighter, kit) {
    this.loadKitArt(kit).then((images) => {
      const animator = this.fighterAnimators.get(fighter);
      if (!animator || animator.data !== kit.data) return;
      for (const [state, image] of images) animator.setImage(state, image);
      this.renderer.usesPlaceholder = [...this.renderer.animators.values()]
        .some((item) => !item.hasRealArt?.());
    }).catch((error) => {
      console.error(`[Universe Showdown] atlas de ${kit.label} falhou:`, error);
    });
  }

  /** Copia as propriedades de combate e de exibição definidas por um kit. */
  configureFighterKit(fighter, kit) {
    fighter.color = kit.color;
    fighter.renderScale = kit.renderScale;
    fighter.hurtbox = { halfWidth: kit.hurtbox.halfWidth, height: kit.hurtbox.height };
    fighter.attacks = kit.attacks;
    fighter.jumpAnim = kit.jumpAnim;
    fighter.blockAnim = kit.blockAnim;
    fighter.blockAnimTime = kit.blockAnim.frames * kit.blockAnim.frameTime;
  }

  /**
   * Restaura o kit padrão (Plasmo) num oponente placeholder. Sem isto, um
   * oponente SEM kit depois de uma fase com kit herdaria o attacks/jumpAnim/
   * blockAnim do personagem anterior (hoje idênticos ao padrão; a Fase 3,
   * com SABLE_ATTACKS próprios, faria a diferença).
   */
  resetEnemyKitDefaults() {
    this.enemy.attacks = ATTACKS;
    this.enemy.jumpAnim = JUMP_ANIM;
    this.enemy.blockAnim = BLOCK_ANIM;
    this.enemy.blockAnimTime = BLOCK_ANIM.frames * BLOCK_ANIM.frameTime;
  }

  /** Troca o kit do inimigo sem recriar o Fighter nem vazar animadores. */
  applyEnemyKit(kit) {
    this.enemyKit = kit;
    this.configureFighterKit(this.enemy, kit);
    const animator = this.fighterAnimators.get(this.enemy);
    if (!animator) return;
    animator.setData(kit.data);
    // Há uma tela intermediária enquanto o PNG carrega; esta atlas preserva
    // o fallback sem bloquear a fase e é substituída por applyKitArt.
    animator.atlas = buildPlaceholderAtlas(kit.color);
    this.applyKitArt(this.enemy, kit);
  }

  resize() {
    // Se o documento já estiver em fullscreen, não mexer nas dimensões do canvas.
    // Isso evita o loop ResizeObserver <-> fullscreen change que o navegador
    // reporta como "undelivered notifications".
    if (this._isFullscreen) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const newWidth = Math.max(1, Math.round(rect.width * dpr));
    const newHeight = Math.max(1, Math.round(rect.height * dpr));
    // Se as dimensões já estão corretas, não fazer nada — trava qualquer loop
    // do ResizeObserver mesmo que o flag _isFullscreen ainda não esteja setado.
    if (this.canvas.width === newWidth && this.canvas.height === newHeight) return;
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.scale = Math.min(this.canvas.width / WIDTH, this.canvas.height / HEIGHT);
    this.offsetX = (this.canvas.width - WIDTH * this.scale) / 2;
    this.offsetY = (this.canvas.height - HEIGHT * this.scale) / 2;
  }
  start() { this.gameLoop.start(); }
  update(dt) {
    if (this.mode === 'menu') return; // congelado atrás do menu de início
    this.frame++;

    // Banner central (ROUND / LUTE / K.O.): vive no renderer, mas o tempo
    // avança no passo fixo, como todo o resto da simulação.
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.renderer.banner = null;
    }

    const campaign = this.mode === 'campanha';
    // A campanha avança cronômetro/transições ANTES de decidir as ações:
    // se o tempo zerou neste frame, o round já entra em `roundEnd`.
    if (campaign) this.match.update(dt, this.snapshot());
    const fighting = !campaign || this.match.state === 'fighting';

    const actions = this.input.actions;
    // Quem controla cada lutador depende do modo:
    //   pvc       → player humano (teclado/touch) vs CPU
    //   cvc       → CPU vs CPU (espectador)
    //   campanha  → player humano vs CPU da fase
    const ko = this.player.health <= 0 || this.enemy.health <= 0;
    let playerActions = actions;   // modo pvc/campanha: jogador humano
    let enemyActions = {};         // pvc/campanha: controlado pela CPU abaixo
    if (this.mode === 'pvc' || campaign) {
      // Corrida do jogador: duplo-toque na direção (RunDetector) OU a tecla
      // Shift (`actions.run`, vindo do KEY_MAP). A CPU (cvc) já emite `run`.
      const run = this.runDetector.update(actions, dt) || Boolean(actions.run);
      playerActions = { ...actions, run };
      enemyActions = this.cpuEnemy.update(dt);
    }
    if (this.mode === 'cvc') {     // espectador: CPU controla os dois
      playerActions = this.cpuPlayer.update(dt);
      enemyActions = this.cpuEnemy.update(dt);
    }
    // Round encerrado, intro/resultado da campanha ou KO: sem ações.
    if (ko || !fighting) { playerActions = {}; enemyActions = {}; }
    this.player.update(dt, playerActions, this.enemy);
    this.enemy.update(dt, enemyActions, this.player);
    // Animação avança no MESMO passo fixo da simulação (não no render)
    for (const [fighter, animator] of this.fighterAnimators) {
      const state = fighter.getState();
      // Re-arm da reação de block: um novo bloqueio DURANTE o play anterior
      // rebobina do frame 0 (sem isso, a 2ª sequência terminaria congelada
      // antes do timer zerar e não mostraria todos os sprites).
      if (fighter.blockAnimPulse) {
        if (state === 'block' && animator.stateName === 'block') animator.rewind();
        fighter.blockAnimPulse = false;
      }
      animator.setState(state);
      animator.update(dt);
    }
    // Estado interno da IA (mostrado no ?debug=1).
    this.renderer.cpuStates.set(this.player, this.mode === 'cvc' ? this.cpuPlayer.stateName : null);
    this.renderer.cpuStates.set(this.enemy,
      this.mode === 'pvc' || campaign ? this.cpuEnemy.stateName : null);
    // Separação de corpos e virada de face (lógica pura em ./physics.js).
    // Quem aterrissa EM CIMA do oponente fixa o x do de baixo: a separação
    // empurra só o que está por cima (evita deslizar o oponente na aterrissagem).
    const keepFixed = this.player.justLanded ? this.enemy
      : this.enemy.justLanded ? this.player : null;
    separateBodies(this.player, this.enemy, { keepFixed });
    this.player.x = Math.max(STAGE_MARGIN, Math.min(WIDTH - STAGE_MARGIN, this.player.x));
    this.enemy.x = Math.max(STAGE_MARGIN, Math.min(WIDTH - STAGE_MARGIN, this.enemy.x));
    updateFaces(this.player, this.enemy);
    this.player.health = Math.max(0, this.player.health);
    this.enemy.health = Math.max(0, this.enemy.health);

    // Nocaute da campanha: o MatchManager decide round/fase e emite eventos.
    // O duplo KO é empate (ambos levam o round) para nunca travar a partida.
    if (campaign && this.match.state === 'fighting') {
      const playerDead = this.player.health <= 0;
      const enemyDead = this.enemy.health <= 0;
      if (playerDead || enemyDead) {
        const winner = playerDead && enemyDead ? 'draw' : enemyDead ? 'player' : 'enemy';
        this.match.notifyKO(winner, this.snapshot());
      }
    }
  }
  render() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    this.renderer.draw(this.player, this.enemy, this.frame);
    this.hud.sync(this.player, this.enemy);
    if (this.mode === 'campanha') this.hud.syncMatch(this.match);
  }
  /** Snapshot da vida atual para o MatchManager (campanha). */
  snapshot() {
    return {
      playerHealth: this.player.health,
      enemyHealth: this.enemy.health,
      playerMaxHealth: this.player.maxHealth ?? 100,
      enemyMaxHealth: this.enemy.maxHealth ?? 100,
    };
  }

  /** Inicia a partida no modo escolhido (pvc, cvc ou campanha). */
  startMatch(mode) {
    this.mode = mode;
    this.input.clear();
    this.previousMode = null;
    this.renderer.banner = null;
    this.bannerTimer = 0;

    if (mode === 'campanha') {
      // A dificuldade e o oponente são definidos por fase. A dificuldade
      // escolhida no menu continua valendo para a partida rápida.
      this.hud.setCampaign(true);
      this.renderer.playerLabel = 'PLAYER 01';
      this.runDetector.reset();
      this.match.startCampaign();
      return;
    }

    this.hud.setCampaign(false);
    this.cpuPlayer.setDifficulty(this.difficulty);
    this.cpuEnemy.setDifficulty(this.difficulty);
    this.resetEnemyForQuickMatch();
    this.resetFighters();
    this.frame = 0;
    this.runDetector.reset();
    const label = DIFFICULTIES[this.difficulty].label;
    this.renderer.playerLabel = mode === 'cvc' ? 'CPU 01' : 'YOU';
    // Oponente com kit (ex.: Sable) mostra o NOME dele; sem kit, 'CPU'.
    this.renderer.enemyLabel = mode === 'cvc' ? 'CPU 02' : (this.enemyKit?.label ?? 'CPU');
    this.hud.setMatchLabels(mode, label, this.enemyKit?.label);
  }

  /** Eventos emitidos pelo MatchManager (rounds/fases da campanha). */
  handleMatchEvent(event) {
    switch (event.type) {
      case 'phaseStart':
        this.applyPhase(event.phase, event.phaseIndex, event.phaseCount);
        break;
      case 'roundStart':
        this.resetFighters();
        this.input.clear();
        this.runDetector.reset();
        this.showBanner(
          `ROUND ${event.roundNumber}`,
          `${event.phase.name} · ${event.playerWins} × ${event.enemyWins}`,
          1.2,
          'round',
        );
        break;
      case 'fight':
        this.showBanner('LUTE!', '', 0.8, 'fight');
        break;
      case 'roundEnd': {
        const draw = event.winner === 'draw';
        const won = event.winner === 'player';
        const title = event.ko
          ? (won ? 'K.O.!' : draw ? 'DUPLO K.O.' : 'NOCAUTE')
          : (won ? 'TEMPO · VITÓRIA' : draw ? 'TEMPO · EMPATE' : 'TEMPO ESGOTADO');
        this.showBanner(title, `+${event.points} PTS`, 1.8, won ? 'win' : 'lose');
        break;
      }
      case 'phaseEnd':
      case 'campaignEnd':
        this.renderer.banner = null;
        this.bannerTimer = 0;
        this.onMatchEvent?.(event);
        break;
    }
  }

  /** Anúncio central desenhado no canvas (ROUND, LUTE!, K.O.). */
  showBanner(text, sub = '', duration = 1.2, tone = 'round') {
    this.renderer.banner = { text, sub, tone };
    this.bannerTimer = duration;
  }

  /** Configura o oponente e o HUD para a fase atual da campanha. */
  applyPhase(phase, phaseIndex, phaseCount) {
    const kit = getKit(phase.character);
    if (kit) this.applyEnemyKit(kit);
    else {
      this.enemyKit = null;
      this.resetEnemyKitDefaults();
      const animator = this.fighterAnimators.get(this.enemy);
      if (animator?.data !== ANIMATION_DATA) animator.setData(ANIMATION_DATA);
    }
    this.enemy.maxHealth = phase.health;
    this.enemy.health = phase.health;
    this.enemy.color = kit?.color ?? phase.color;
    this.enemy.renderScale = kit?.renderScale ?? phase.renderScale ?? 1;
    this.enemy.hurtbox = kit
      ? { halfWidth: kit.hurtbox.halfWidth, height: kit.hurtbox.height }
      : {
        halfWidth: Math.round(35 * this.enemy.renderScale),
        height: Math.round(120 * this.enemy.renderScale),
      };

    const animator = this.fighterAnimators.get(this.enemy);
    if (animator) {
      if (!kit) animator.atlas = this.enemyAtlas(phase);
      animator.setState('idle');
      animator.frameIndex = 0;
      animator.timeInFrame = 0;
      animator.finished = false;
    }

    this.cpuEnemy.setDifficulty(phase.ai);
    this.renderer.playerLabel = 'PLAYER 01';
    this.renderer.enemyLabel = phase.name;
    this.hud.setCampaign(true);
    this.hud.setCampaignLabels(phase, phaseIndex, phaseCount);
    this.hud.setTimer(phase.timeLimit);
    this.hud.setScore(this.match.score);
  }

  /** Atlas placeholder por fase (mesmo desenho, cor do personagem diferente). */
  enemyAtlas(phase) {
    if (!this.enemyAtlasCache.has(phase.id)) {
      this.enemyAtlasCache.set(phase.id, buildPlaceholderAtlas(phase.color));
    }
    return this.enemyAtlasCache.get(phase.id);
  }

  /** Restaura o oponente padrão ao sair da campanha para uma partida rápida. */
  resetEnemyForQuickMatch() {
    const kit = getKit(new URLSearchParams(window.location.search).get('enemy'));
    if (kit) {
      this.applyEnemyKit(kit);
      this.enemy.maxHealth = 100;
      this.enemy.health = 100;
      return;
    }
    this.enemyKit = null;
    this.resetEnemyKitDefaults();
    this.enemy.maxHealth = 100;
    this.enemy.color = '#ff638c';
    this.enemy.renderScale = 1;
    this.enemy.hurtbox = { halfWidth: 35, height: 120 };
    const animator = this.fighterAnimators.get(this.enemy);
    if (!animator) return;
    if (animator.data !== ANIMATION_DATA) animator.setData(ANIMATION_DATA);
    if (!this.enemyAtlasCache.has('default')) {
      this.enemyAtlasCache.set('default', buildPlaceholderAtlas('#ff638c'));
    }
    animator.atlas = this.enemyAtlasCache.get('default');
    animator.setState('idle');
    animator.frameIndex = 0;
    animator.timeInFrame = 0;
    animator.finished = false;
  }

  /** Volta ao menu de início (congela a simulação; o render continua). */
  openMenu() {
    if (this.mode !== 'menu') this.previousMode = this.mode;
    this.mode = 'menu';
  }

  /** Fecha o menu e retorna ao modo anterior (pvc / cvc / campanha). */
  closeMenu() {
    this.mode = this.previousMode || 'pvc';
    this.previousMode = null;
    this.hud.setCampaign(this.mode === 'campanha');
    this.runDetector.reset(); // não herda o duplo-toque de antes do menu
  }

  /** Troca a dificuldade da CPU em tempo real (atalhos 1/2/3 e menu). */
  setDifficulty(name) {
    if (!DIFFICULTIES[name]) return;
    this.difficulty = name;
    this.cpuPlayer.setDifficulty(name);
    // Na campanha o perfil do oponente é definido pela fase.
    if (this.mode === 'campanha') return;
    this.cpuEnemy.setDifficulty(name);
    if (this.mode !== 'menu') {
      // Atualiza o rótulo do HUD sem interromper o round.
      this.hud.setDifficultyLabel(this.mode, DIFFICULTIES[name].label, this.enemyKit?.label);
    }
  }

  // ── Controles da campanha (chamados pela tela de resultado) ──────────
  /** Avança após uma fase vencida (ou repete a fase perdida). */
  continueCampaign() {
    if (this.mode !== 'campanha') return false;
    this.renderer.banner = null;
    this.bannerTimer = 0;
    return this.match.continuePhase();
  }

  /** Repete a fase atual restaurando a pontuação do início dela. */
  retryPhase() {
    if (this.mode !== 'campanha') return false;
    this.renderer.banner = null;
    this.bannerTimer = 0;
    return this.match.retryPhase();
  }

  /** Reinicia a campanha inteira (fase 1, pontuação zerada). */
  restartCampaign() {
    if (this.mode !== 'campanha') return false;
    this.renderer.banner = null;
    this.bannerTimer = 0;
    this.match.restartCampaign();
    return true;
  }

  /** Abandona a campanha e volta ao menu (a tela de resultado fecha). */
  abandonCampaign() {
    if (this.mode !== 'campanha') return;
    this.match.abort();
    this.hud.setCampaign(false);
    this.renderer.banner = null;
    this.bannerTimer = 0;
    // Deixa uma partida rápida limpa pronta atrás do menu: fechar o menu
    // depois de abandonar não pode retomar a fase com a vida zerada.
    this.startMatch('pvc');
    this.mode = 'menu';
    this.previousMode = 'pvc';
  }

  /** Reposiciona os lutadores e restaura a vida máxima de cada um. */
  resetFighters() {
    // Reutiliza os lutadores existentes: evita acúmulo de entradas órfãs
    // no Map `animators` do CanvasRenderer e mantém os animadores válidos.
    for (const [fighter, animator] of this.fighterAnimators) {
      fighter.x = fighter === this.player ? PLAYER_SPAWN_X : ENEMY_SPAWN_X;
      fighter.y = 0; fighter.vy = 0;
      fighter.face = fighter === this.player ? 1 : -1;
      fighter.health = fighter.maxHealth ?? 100;
      fighter.attack = null; fighter.attackName = null;
      fighter.attackHit = false; fighter.crouch = false; fighter.hitTimer = 0;
      fighter.jumpBuffer = 0; fighter.landingTimer = 0; fighter.walking = false;
      fighter.jumpDir = 0; fighter.jumpSpeed = 0; // sem impulso pendente de pulo
      fighter.blocking = false; fighter.blockTimer = 0;
      fighter.blockAnimTimer = 0; fighter.blockAnimPulse = false; // round novo: sem reação pendente
      fighter.prev = {};
      fighter.blockFx = 0; fighter.blockFxSide = 1; fighter.kbVx = 0;
      fighter.running = false; fighter.justLanded = false;
      animator.setState('idle');
      animator.frameIndex = 0;
      animator.timeInFrame = 0;
      animator.finished = false;
    }
  }

  reset() {
    // Na campanha o botão REINICIAR repete a fase (ou a campanha no final).
    if (this.mode === 'campanha' && this.match.isActive) {
      if (this.match.state === 'campaignEnd') this.match.restartCampaign();
      else this.match.restartPhase();
      return;
    }
    this.resetFighters();
    this.frame = 0;
    this.runDetector.reset(); // round novo: duplo-toque do round anterior não vale
  }
}

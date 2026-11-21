import { Fighter } from '../fighters/Fighter.js';
import { CanvasRenderer } from '../rendering/CanvasRenderer.js';
import { SpriteAnimator, loadAtlasImage } from '../rendering/SpriteAnimator.js';
import { ANIMATION_DATA } from '../characters/animations.js';
import { buildPlaceholderAtlas } from '../characters/PlaceholderAtlas.js';
import { PLASMO_DATA } from '../characters/Plasmo.js';
import { CPUController, DIFFICULTIES } from '../ai/CPUController.js';
import { InputManager } from '../core/InputManager.js';
import { RunDetector } from '../core/RunDetector.js';
import { GameLoop } from '../core/GameLoop.js';
import { HUD } from '../ui/HUD.js';
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
    this.player = new Fighter(PLAYER_SPAWN_X, '#51e3e8', 1, {
      // Plasmo: conteúdo normalizado a ~96px (metade do mais alto); escala
      // total 1.1 × 1 ≈ mesmo tamanho do placeholder (~105 px).
      renderScale: 1,
      hurtboxHalfWidth: 48,
      hurtboxHeight: 100,
    });
    this.enemy = new Fighter(ENEMY_SPAWN_X, '#ff638c', -1);
    this.setupAnimators();
    this.frame = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    // Modo debug: ?debug=1 exibe hitboxes, posição e estado dos lutadores.
    const params = new URLSearchParams(window.location.search);
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
    const playerAtlas = buildPlaceholderAtlas('#51e3e8');
    const enemyAtlas = buildPlaceholderAtlas('#ff638c');
    this.fighterAnimators = new Map([
      [this.player, new SpriteAnimator(playerAtlas, PLASMO_DATA)],
      [this.enemy, new SpriteAnimator(enemyAtlas, ANIMATION_DATA)],
    ]);
    for (const [fighter, animator] of this.fighterAnimators) {
      this.renderer.setAnimator(fighter, animator);
    }
    const states = Object.keys(PLASMO_DATA.states);
    Promise.all(states.map((name) =>
      loadAtlasImage(`/assets/characters/plasmo/${PLASMO_DATA.states[name].image}`)
        .then((img) => this.fighterAnimators.get(this.player)?.setImage(name, img))
    )).then(() => {
      this.renderer.usesPlaceholder = [...this.renderer.animators.values()]
        .some((a) => !a.hasRealArt?.());
    }).catch((error) => console.error('[Universe Showdown] atlas do Plasmo falhou:', error));
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.scale = Math.min(this.canvas.width / WIDTH, this.canvas.height / HEIGHT);
    this.offsetX = (this.canvas.width - WIDTH * this.scale) / 2;
    this.offsetY = (this.canvas.height - HEIGHT * this.scale) / 2;
  }
  start() { this.gameLoop.start(); }
  update(dt) {
    if (this.mode === 'menu') return; // congelado atrás do menu de início
    this.frame++;
    const actions = this.input.actions;
    // Quem controla cada lutador depende do modo:
    //   pvc → player humano (teclado/touch) vs CPU
    //   cvc → CPU vs CPU (espectador)
    const ko = this.player.health <= 0 || this.enemy.health <= 0;
    let playerActions = actions;   // modo pvc: jogador humano (teclado/touch)
    let enemyActions = {};         // pvc: controlado pela CPU abaixo
    if (this.mode === 'pvc') {
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
    if (ko) { playerActions = {}; enemyActions = {}; } // round encerrado
    this.player.update(dt, playerActions, this.enemy);
    this.enemy.update(dt, enemyActions, this.player);
    // Animação avança no MESMO passo fixo da simulação (não no render)
    for (const [fighter, animator] of this.fighterAnimators) {
      animator.setState(fighter.getState());
      animator.update(dt);
    }
    // Estado interno da IA (mostrado no ?debug=1).
    this.renderer.cpuStates.set(this.player, this.mode === 'cvc' ? this.cpuPlayer.stateName : null);
    this.renderer.cpuStates.set(this.enemy, this.mode === 'pvc' ? this.cpuEnemy.stateName : null);
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
  }
  render() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    this.renderer.draw(this.player, this.enemy, this.frame);
    this.hud.sync(this.player, this.enemy);
  }
  /** Inicia o round no modo escolhido ('pvc' = jogador vs CPU, 'cvc' = CPU vs CPU). */
  startMatch(mode) {
    this.mode = mode;
    this.cpuPlayer.setDifficulty(this.difficulty);
    this.cpuEnemy.setDifficulty(this.difficulty);
    this.input.clear();
    this.reset();
    const label = DIFFICULTIES[this.difficulty].label;
    this.renderer.playerLabel = mode === 'cvc' ? 'CPU 01' : 'YOU';
    this.renderer.enemyLabel = mode === 'cvc' ? 'CPU 02' : 'CPU';
    this.hud.setMatchLabels(mode, label);
  }

  /** Volta ao menu de início (congela a simulação; o render continua). */
  openMenu() {
    if (this.previousMode === null) this.previousMode = this.mode;
    this.mode = 'menu';
  }

  /** Fecha o menu e retorna ao modo anterior (pvc / cvc). */
  closeMenu() {
    this.mode = this.previousMode || 'pvc';
    this.previousMode = null;
    this.runDetector.reset(); // não herda o duplo-toque de antes do menu
  }

  /** Troca a dificuldade da CPU em tempo real (atalhos 1/2/3 e menu). */
  setDifficulty(name) {
    if (!DIFFICULTIES[name]) return;
    this.difficulty = name;
    this.cpuPlayer.setDifficulty(name);
    this.cpuEnemy.setDifficulty(name);
    if (this.mode !== 'menu') {
      // Atualiza o rótulo do HUD sem interromper o round.
      this.hud.setDifficultyLabel(this.mode, DIFFICULTIES[name].label);
    }
  }

  reset() {
    // Reutiliza os lutadores existentes: evita acúmulo de entradas órfãs
    // no Map `animators` do CanvasRenderer e mantém os animadores válidos.
    for (const [fighter, animator] of this.fighterAnimators) {
      fighter.x = fighter === this.player ? PLAYER_SPAWN_X : ENEMY_SPAWN_X;
      fighter.y = 0; fighter.vy = 0;
      fighter.face = fighter === this.player ? 1 : -1;
      fighter.health = 100;
      fighter.attack = null; fighter.attackName = null;
      fighter.attackHit = false; fighter.crouch = false; fighter.hitTimer = 0;
      fighter.jumpBuffer = 0; fighter.landingTimer = 0; fighter.walking = false;
      fighter.blocking = false; fighter.blockTimer = 0; fighter.prev = {};
      fighter.blockFx = 0; fighter.blockFxSide = 1; fighter.kbVx = 0;
      fighter.running = false; fighter.justLanded = false;
      animator.setState('idle');
      animator.frameIndex = 0;
      animator.timeInFrame = 0;
      animator.finished = false;
    }
    this.frame = 0;
    this.runDetector.reset(); // round novo: duplo-toque do round anterior não vale
  }
}

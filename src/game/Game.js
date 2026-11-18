import { Fighter } from '../fighters/Fighter.js';
import { CanvasRenderer } from '../rendering/CanvasRenderer.js';
import { SpriteAnimator, loadAtlasImage } from '../rendering/SpriteAnimator.js';
import { ANIMATION_DATA } from '../characters/animations.js';
import { buildPlaceholderAtlas } from '../characters/PlaceholderAtlas.js';
import { PLASMO_DATA } from '../characters/Plasmo.js';
import { CPUController, DIFFICULTIES } from '../ai/CPUController.js';

const WIDTH = 960;
const HEIGHT = 540;
const STEP = 1 / 60;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = new CanvasRenderer(this.ctx, WIDTH, HEIGHT);
    this.input = {
      actions: Object.create(null),
      sources: new Map(),
      set: (action, value, source = 'default') => {
        if (!this.input.sources.has(action)) this.input.sources.set(action, new Set());
        const active = this.input.sources.get(action);
        if (value) active.add(source); else active.delete(source);
        this.input.actions[action] = active.size > 0;
      },
      clear: () => { this.input.actions = Object.create(null); this.input.sources.clear(); },
    };
    this.player = new Fighter(300, '#51e3e8', 1, {
      // Plasmo: conteúdo normalizado a ~96px (metade do mais alto); escala
      // total 1.1 × 1 ≈ mesmo tamanho do placeholder (~105 px).
      renderScale: 1,
      hurtboxHalfWidth: 48,
      hurtboxHeight: 100,
    });
    this.enemy = new Fighter(660, '#ff638c', -1);
    this.setupAnimators();
    this.lastTime = 0;
    this.accumulator = 0;
    this.frame = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    // Modo debug: ?debug=1 exibe hitboxes, posição e estado dos lutadores.
    const params = new URLSearchParams(window.location.search);
    this.debug = params.has('debug');
    this.renderer.debug = this.debug;
    // ── IA da CPU ──
    // ?diff=facil|medio|dificil pré-seleciona a dificuldade (padrão: fácil).
    // O modo ('menu' | 'pvc' | 'cvc') só sai do menu quando o jogador escolhe.
    const diff = params.get('diff');
    this.difficulty = DIFFICULTIES[diff] ? diff : 'facil';
    this.mode = 'menu';
    this.cpuPlayer = new CPUController(this.player, this.enemy, this.difficulty);
    this.cpuEnemy = new CPUController(this.enemy, this.player, this.difficulty);
    this.renderer.cpuStates.set(this.player, null);
    this.renderer.cpuStates.set(this.enemy, null);
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
  start() { requestAnimationFrame((time) => this.loop(time)); }
  loop(time) {
    // try/catch garante que o rAF continue agendado: uma exceção de update
    // ou render não mata o jogo silenciosamente (tela preta).
    try {
      const delta = Math.min((time - (this.lastTime || time)) / 1000, 0.1);
      this.lastTime = time;
      this.accumulator += delta;
      while (this.accumulator >= STEP) {
        this.update(STEP);
        this.accumulator -= STEP;
      }
      this.render();
    } catch (error) {
      console.error('[Universe Showdown] erro no loop:', error);
    }
    requestAnimationFrame((next) => this.loop(next));
  }
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
    if (this.mode === 'pvc') enemyActions = this.cpuEnemy.update(dt);
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
    // Separação física = soma das meia-larguras das hurtbox de cada
    // personagem: os corpos encostam, mas não impedem o alcance dos golpes.
    const distance = this.enemy.x - this.player.x;
    const minDistance = this.player.hurtbox.halfWidth + this.enemy.hurtbox.halfWidth;
    if (Math.abs(distance) < minDistance) {
      const overlap = minDistance - Math.abs(distance);
      const direction = Math.sign(distance) || 1;
      this.player.x -= overlap * direction * 0.5;
      this.enemy.x += overlap * direction * 0.5;
    }
    this.player.x = Math.max(55, Math.min(WIDTH - 55, this.player.x));
    this.enemy.x = Math.max(55, Math.min(WIDTH - 55, this.enemy.x));
    this.player.face = this.enemy.x >= this.player.x ? 1 : -1;
    this.enemy.face = -this.player.face;
    this.player.health = Math.max(0, this.player.health);
    this.enemy.health = Math.max(0, this.enemy.health);
  }
  render() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    this.renderer.draw(this.player, this.enemy, this.frame);
    document.querySelector('#player-health').style.width = this.player.health + '%';
    document.querySelector('#enemy-health').style.width = this.enemy.health + '%';
    document.querySelector('#player-health-label').textContent = Math.ceil(this.player.health);
    document.querySelector('#enemy-health-label').textContent = Math.ceil(this.enemy.health);
    document.querySelector('#status').textContent = this.player.health <= 0 || this.enemy.health <= 0 ? 'ROUND END' : 'READY';
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
    const playerInfo = document.querySelector('#player-label');
    const enemyInfo = document.querySelector('#enemy-label');
    if (playerInfo) playerInfo.textContent = mode === 'cvc' ? `CPU 01 · ${label}` : 'PLAYER 01';
    if (enemyInfo) enemyInfo.textContent = mode === 'cvc' ? `CPU 02 · ${label}` : `CPU · ${label}`;
  }

  /** Volta ao menu de início (congela a simulação; o render continua). */
  openMenu() {
    this.mode = 'menu';
  }

  /** Troca a dificuldade da CPU em tempo real (atalhos 1/2/3 e menu). */
  setDifficulty(name) {
    if (!DIFFICULTIES[name]) return;
    this.difficulty = name;
    this.cpuPlayer.setDifficulty(name);
    this.cpuEnemy.setDifficulty(name);
    if (this.mode !== 'menu') {
      // Atualiza o rótulo do HUD sem interromper o round.
      const label = DIFFICULTIES[name].label;
      const enemyInfo = document.querySelector('#enemy-label');
      const playerInfo = document.querySelector('#player-label');
      if (enemyInfo) enemyInfo.textContent = this.mode === 'cvc' ? `CPU 02 · ${label}` : `CPU · ${label}`;
      if (playerInfo && this.mode === 'cvc') playerInfo.textContent = `CPU 01 · ${label}`;
    }
  }

  reset() {
    // Reutiliza os lutadores existentes: evita acúmulo de entradas órfãs
    // no Map `animators` do CanvasRenderer e mantém os animadores válidos.
    for (const [fighter, animator] of this.fighterAnimators) {
      fighter.x = fighter === this.player ? 300 : 660;
      fighter.y = 0; fighter.vy = 0;
      fighter.face = fighter === this.player ? 1 : -1;
      fighter.health = 100;
      fighter.attack = null; fighter.attackName = null;
      fighter.attackHit = false; fighter.crouch = false; fighter.hitTimer = 0;
      fighter.jumpBuffer = 0; fighter.landingTimer = 0; fighter.walking = false;
      fighter.blocking = false; fighter.blockTimer = 0; fighter.prev = {};
      fighter.blockFx = 0; fighter.blockFxSide = 1; fighter.kbVx = 0;
      animator.setState('idle');
      animator.frameIndex = 0;
      animator.timeInFrame = 0;
      animator.finished = false;
    }
    this.frame = 0;
  }
}

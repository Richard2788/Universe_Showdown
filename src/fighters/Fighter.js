import { WALK_SPEED, RUN_SPEED } from '../config/game.js';

export const ATTACKS = {
  // reach = comprimento da hitbox do golpe, medido do CENTRO do lutador,
  // alinhado à extensão real do membro na arte (a mão do golpe fraco chega
  // a ~82px do centro; o smash do forte a ~93px ≈ duas meias-hurtboxes).
  // maxTargetY = altura máxima (y do oponente) que o golpe alcança: golpes
  // de chão não acertam quem está no ar — o pulo é esquiva real. O forte
  // é o golpe alto e alcança pulos baixos (110).
  // height = trajetória do golpe:
  //   'high' → passa por cima de quem agacha (agachar esquiva);
  //   'low'  → atinge agachado, MAS só é bloqueado agachado (fura o block em pé);
  //   'mid'  → atinge agachado; bloqueável em ambas as posturas.
  // blockstun = trava do defensor ao bloquear; chip = dano ao bloquear.
  // knockback = impulso (px/s) que empurra quem é ATINGIDO sem defesa —
  // só o forte e o chute arremessam; leve/médio não deslocam.
  lightAttack:  { duration: 0.28, damage: 5,  reach: 82, activeStart: 0.14, activeEnd: 0.22, maxTargetY: 90,  height: 'high', blockstun: 0.14, chip: 0, knockback: 0 },
  mediumAttack: { duration: 0.48, damage: 10, reach: 62, activeStart: 0.24, activeEnd: 0.33, maxTargetY: 90,  height: 'mid',  blockstun: 0.18, chip: 0, knockback: 0 },
  heavyAttack:  { duration: 0.72, damage: 16, reach: 96, activeStart: 0.32, activeEnd: 0.50, maxTargetY: 110, height: 'mid',  blockstun: 0.26, chip: 2, knockback: 340 },
  kick:         { duration: 0.52, damage: 12, reach: 67, activeStart: 0.13, activeEnd: 0.39, maxTargetY: 90,  height: 'low',  blockstun: 0.20, chip: 0, knockback: 240 },
};

// Hurtbox padrão (personagens sem configuração própria). 35 mantém os corpos
// comparáveis: o Plasmo (48) continua com alvo mais largo — trade-off do seu
// longo alcance — sem dar alcance grátis demais a quem o acerta.
export const HURTBOX_HALF_WIDTH = 35;

// Recuo empurrado ao bloquear (px) — o "recuo" físico da defesa.
const BLOCK_PUSHBACK = 24;
// Atrito do knockback (px/s²): velocidade de arremesso decai até parar.
const KB_FRICTION = 1200;

// Animação do pulo do Plasmo: 25 frames (arco completo da sheet 5×5).
// Os 16 primeiros cobrem o tempo de ar da física (vy 560 / g 1500 =
// 0,747 s ≈ 16 × 0,047); os 9 restantes são a recuperação de aterrissagem
// (splat → poça → reforma) que roda em solo, segurando o estado 'jump'.
const JUMP_ANIM = { frames: 25, frameTime: 0.047, airFrames: 16 };

export class Fighter {
  /**
   * @param {object} [options]
   * @param {number} [options.renderScale] escala visual do sprite (1 = padrão)
   * @param {number} [options.hurtboxHalfWidth] meia-largura da hurtbox (px, mundo)
   * @param {number} [options.hurtboxHeight] altura da hurtbox (px, mundo)
   */
  constructor(x, color, face, options = {}) {
    this.x = x; this.y = 0; this.vy = 0; this.color = color; this.face = face;
    this.health = 100; this.attack = null; this.attackName = null;
    this.attackHit = false; this.crouch = false; this.hitTimer = 0;
    this.jumpBuffer = 0; // janela em que um comando de pulo ainda vale ao aterrissar
    this.landingTimer = 0; // recuperação de aterrissagem (estado 'jump' em solo)
    this.blocking = false; // segurando o recuo: em postura de defesa
    this.blockTimer = 0;   // blockstun: travado após defender um golpe
    this.blockFx = 0;      // efeito visual de impacto do bloqueio (decai)
    this.blockFxSide = 1;  // lado do defensor onde o golpe foi bloqueado (+1/-1)
    this.kbVx = 0;         // knockback: velocidade de arremesso (px/s, decai)
    this.running = false;  // correndo neste frame (só para frente; animação 'run')
    this.prev = {};        // ações do frame anterior (debounce honesto)
    // Cada personagem tem tamanho e hurtbox próprios (Plasmo é 4× maior).
    this.renderScale = options.renderScale ?? 1;
    this.hurtbox = {
      halfWidth: options.hurtboxHalfWidth ?? HURTBOX_HALF_WIDTH,
      height: options.hurtboxHeight ?? 120,
    };
  }
  /** Estado lógico atual — alimenta o SpriteAnimator. */
  getState() {
    if (this.attack) return this.attackName;
    if (this.hitTimer > 0) return 'hit';
    if (this.y > 0 || this.landingTimer > 0) return 'jump';
    if (this.blockTimer > 0 || this.blocking) return 'block';
    if (this.crouch) return 'crouch';
    if (this.running) return 'run';
    return this.walking ? 'walk' : 'idle'; // andar é detectado pelo input
  }
  update(dt, actions, opponent) {
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    this.blockTimer = Math.max(0, this.blockTimer - dt);
    this.blockFx = Math.max(0, this.blockFx - dt);
    const prev = this.prev; // ações do frame anterior → borda de subida
    this.running = false;   // recalculado no ramo de movimento; falso ao atacar
    if (this.attack) {
      this.attack.elapsed += dt;
      const { activeStart, activeEnd, reach, damage, maxTargetY, height, blockstun, chip, knockback } = this.attack.data;
      // Acerto: distância horizontal dentro do alcance E oponente abaixo da
      // altura máxima do golpe (pular esquiva; o forte alcança pulos baixos).
      if (!this.attackHit && this.attack.elapsed >= activeStart && this.attack.elapsed <= activeEnd
        && opponent.y < maxTargetY
        && Math.abs(opponent.x - this.x) < reach + opponent.hurtbox.halfWidth) {
        // Só o golpe alto (high) passa por cima de quem agacha (esquiva real,
        // sem contato — pode acertar se o alvo levantar).
        const whiffsOverCrouch = height === 'high' && opponent.crouch;
        // Defesa válida: high/mid bloqueiam em ambas as posturas; o low
        // (chute) atinge agachado, porém só o block AGACHADO o segura —
        // quem bloqueia em pé leva o dano.
        const canBlock = opponent.blocking && (height !== 'low' || opponent.crouch);
        if (whiffsOverCrouch) {
          // Passa por cima: nada acontece (pode acertar se o alvo levantar).
        } else if (canBlock) {
          // Defendeu: chip (só o forte tira vida), blockstun e recuo empurrado.
          opponent.health -= chip;
          opponent.blockTimer = blockstun;
          opponent.x += (this.x >= opponent.x ? -1 : 1) * BLOCK_PUSHBACK;
          // Gatilho do efeito visual de impacto do bloqueio (0,28 s de brilho).
          opponent.blockFx = 0.28;
          opponent.blockFxSide = this.x >= opponent.x ? 1 : -1;
          this.attackHit = true;
        } else {
          opponent.health -= damage;
          opponent.hitTimer = 0.3;
          // Knockback: forte e chute arremessam quem é atingido (sem bloqueio)
          // na direção oposta ao atacante; o deslizamento com atrito acontece
          // na física abaixo, mesmo durante o hitstun.
          opponent.kbVx = (this.x >= opponent.x ? -1 : 1) * knockback;
          this.attackHit = true;
        }
      }
      if (this.attack.elapsed >= this.attack.data.duration) this.attack = null;
    } else {
      // Recuperação de aterrissagem: sem input até a animação do pulo acabar
      // (frames de splat → poça → reforma rodam em solo).
      const grounded = this.landingTimer <= 0;
      const stunned = this.blockTimer > 0; // blockstun: sem ações até passar
      // Postura antes do movimento: agachado NÃO anda (defesa agachada fica
      // parada no lugar, como nos clássicos — só a defesa em pé recua).
      this.crouch = grounded && !stunned && Boolean(actions.crouch);
      // Corrida: só para frente (na direção do oponente, `this.face`), fora
      // de agachar, blockstun e hitstun. No ar a velocidade é mantida (pulo
      // corrido) mas `running` fica false — a animação em solo é 'jump'.
      const moving = actions.left !== actions.right;
      const dir = actions.right ? 1 : actions.left ? -1 : 0;
      const forward = moving && dir === this.face;
      const canRun = grounded && !stunned && this.hitTimer <= 0
        && !this.crouch && Boolean(actions.run) && forward;
      this.running = canRun && this.y === 0;
      const speed = canRun ? RUN_SPEED : WALK_SPEED;
      if (grounded && !stunned && !this.crouch && actions.left) this.x -= speed * dt;
      if (grounded && !stunned && !this.crouch && actions.right) this.x += speed * dt;
      // Pulo: dispara na BORDA DE SUBIDA (pressionou agora) — segurar não
      // re-pula. O buffer de 0,1 s cobre o input pouco antes de aterrissar.
      if (actions.jump && !prev.jump) this.jumpBuffer = 0.1;
      else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      if (this.jumpBuffer > 0 && this.y === 0 && grounded && !stunned) {
        this.vy = 560;
        this.jumpBuffer = 0;
      }
      this.walking = grounded && !stunned && moving && !this.crouch;
      if (grounded && !stunned) {
        // Ataques: também só na borda de subida (debounce honesto — vale
        // igual para teclado, touch e CPU, que emite `true` por 1 frame).
        for (const name of Object.keys(ATTACKS)) {
          if (actions[name] && !prev[name]) {
            this.attack = { data: ATTACKS[name], elapsed: 0 };
            this.attackName = name;
            this.attackHit = false;
            this.blocking = false;
            break;
          }
        }
      }
      // Defesa tradicional = recuo: segurar a direção que se afasta do
      // oponente (em solo, sem atacar). Em pé bloqueia high/mid; agachado
      // bloqueia mid/low — a checagem de acerto aplica a tabela.
      const away = opponent.x >= this.x ? -1 : 1;
      const holdingBack = away > 0 ? actions.right : actions.left;
      this.blocking = grounded && !stunned && !this.attack && holdingBack;
    }
    const wasAir = this.y > 0;
    this.vy -= 1500 * dt;
    this.y = Math.max(0, this.y + this.vy * dt);
    // Knockback: deslize para trás com atrito (vale mesmo em hitstun; não é
    // input do jogador — o jogador recupera o controle quando o stun acaba).
    if (this.kbVx !== 0) {
      this.x += this.kbVx * dt;
      const drop = KB_FRICTION * dt;
      this.kbVx = Math.abs(this.kbVx) <= drop ? 0 : this.kbVx - Math.sign(this.kbVx) * drop;
    }
    if (this.y === 0) {
      this.vy = 0;
      if (wasAir) {
        // Pouso: segura o estado 'jump' até a animação terminar no solo.
        this.landingTimer = Math.max(0, JUMP_ANIM.frames * JUMP_ANIM.frameTime
          - JUMP_ANIM.airFrames * JUMP_ANIM.frameTime);
      }
    }
    this.landingTimer = Math.max(0, this.landingTimer - dt);
    this.prev = { ...actions }; // guarda para o debounce do próximo frame
  }
}

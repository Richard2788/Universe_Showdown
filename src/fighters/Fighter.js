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

// Recuo empurrado ao bloquear (px) — o "recuo" físico da defesa. O bloqueio
// do FORTE empurra bem mais, deixando o impacto pesado visível (o médio/leve
// mantém o recuo curto de "um pouco para trás").
const BLOCK_PUSHBACK = 28;
const BLOCK_PUSHBACK_HEAVY = 46;
// Atrito do knockback (px/s²): velocidade de arremesso decai até parar.
const KB_FRICTION = 1200;

// Pulo travado: a direção e a velocidade horizontal são fixadas no IMPULSO.
// Depois de pular não dá mais para mudar o arco nem acelerar — segurar para o
// lado no ar não faz nada, e a velocidade é a escolhida no voo (andar: metade
// da caminhada; corrida: o impulso de 250 px/s é mantido). Pulo sem direção
// é reto, sem deslocar.
const AIR_JUMP_SPEED = WALK_SPEED / 2;

// Animação do pulo do Plasmo: 25 frames (arco completo da sheet 5×5).
// Os 16 primeiros cobrem o tempo de ar da física (vy 560 / g 1500 =
// 0,747 s ≈ 16 × 0,047); os 9 restantes são a recuperação de aterrissagem
// (splat → poça → reforma) que roda em solo, segurando o estado 'jump'.
const JUMP_ANIM = { frames: 25, frameTime: 0.047, airFrames: 16 };

// Reação de block: UMA jogada por bloqueio bem-sucedido, sem repetir enquanto
// o recuo é segurado. Começa no primeiro sprite com o escudo já formado e vai
// até o último da sheet (Plasmo: col 2, 8 frames a 6 fps = 1,33 s — sincrono
// com o estado `block` de src/characters/Plasmo.js, mesmo critério do JUMP_ANIM).
// A reação tem prioridade sobre andar/correr até terminar; depois, segurar para
// trás mostra 'walk' de novo (o input de block É caminhar para trás).
const BLOCK_ANIM = { frames: 8, frameTime: 1 / 6 };
const BLOCK_ANIM_TIME = BLOCK_ANIM.frames * BLOCK_ANIM.frameTime;

export class Fighter {
  /**
   * @param {object} [options]
   * @param {number} [options.renderScale] escala visual do sprite (1 = padrão)
   * @param {number} [options.hurtboxHalfWidth] meia-largura da hurtbox (px, mundo)
   * @param {number} [options.hurtboxHeight] altura da hurtbox (px, mundo)
   * @param {number} [options.maxHealth] vida máxima (padrão 100; fases usam mais)
   */
  constructor(x, color, face, options = {}) {
    this.x = x; this.y = 0; this.vy = 0; this.color = color; this.face = face;
    this.maxHealth = options.maxHealth ?? 100;
    this.health = this.maxHealth; this.attack = null; this.attackName = null;
    this.attackHit = false; this.crouch = false; this.hitTimer = 0;
    this.jumpBuffer = 0; // janela em que um comando de pulo ainda vale ao aterrissar
    this.jumpDir = 0;    // direção travada no impulso do pulo (-1|0|1)
    this.jumpSpeed = 0;  // velocidade travada no impulso (px/s); encerra no pouso
    this.landingTimer = 0; // recuperação de aterrissagem (estado 'jump' em solo)
    this.blocking = false; // segurando o recuo: em postura de defesa
    this.blockTimer = 0;   // blockstun: travado após defender um golpe
    this.blockAnimTimer = 0; // reação visual de block: só após bloqueio bem-sucedido
    this.blockAnimPulse = false; // sinal de re-arm: novo bloqueio reinicia o play (Game.js)
    this.blockFx = 0;      // efeito visual de impacto do bloqueio (decai)
    this.blockFxPower = 1; // intensidade do efeito (1 normal, >1 = bloqueio do forte)
    this.blockFxSide = 1;  // lado do defensor onde o golpe foi bloqueado (+1/-1)
    this.kbVx = 0;         // knockback: velocidade de arremesso (px/s, decai)
    this.running = false;  // correndo neste frame (só para frente; animação 'run')
    this.justLanded = false; // aterrissou neste frame (ar → chão; fixa o x do oponente)
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
    // Reação de block: só existe depois de um bloqueio bem-sucedido (uma vez
    // por bloqueio). Segurar para trás SEM golpe cai no walk/idle — não há
    // "postura de block" sem impacto, para nenhum personagem. Ela vence
    // crouch/walk: a sequência completa (8 sprites) joga uma vez — agachar
    // ou andar só volta quando o timer termina.
    if (this.blockAnimTimer > 0) return 'block';
    if (this.crouch) return 'crouch';
    if (this.y > 0 || this.landingTimer > 0) return 'jump';
    if (this.running) return 'run';
    return this.walking ? 'walk' : 'idle'; // andar é detectado pelo input
  }
  update(dt, actions, opponent) {
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    this.blockTimer = Math.max(0, this.blockTimer - dt);
    this.blockAnimTimer = Math.max(0, this.blockAnimTimer - dt);
    this.blockFx = Math.max(0, this.blockFx - dt);
    if (this.blockFx === 0) this.blockFxPower = 1; // reseta junto com o fade
    const prev = this.prev; // ações do frame anterior → borda de subida
    this.running = false;   // recalculado no ramo de movimento; falso ao atacar
    this.justLanded = false; // vira true só no frame ar → chão (embaixo)
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
          // Reação visual: um play por bloqueio bem-sucedido (reinicia aqui).
          opponent.blockAnimTimer = BLOCK_ANIM_TIME;
          opponent.blockAnimPulse = true; // re-arm: se a anterior ainda toca, rebobina (Game.js)
          const heavy = this.attackName === 'heavyAttack';
          opponent.x += (this.x >= opponent.x ? -1 : 1)
            * (heavy ? BLOCK_PUSHBACK_HEAVY : BLOCK_PUSHBACK);
          // Gatilho do efeito visual de impacto do bloqueio (0,28 s de brilho);
          // o forte dispara em potência maior (raio/faíscas/anel de choque).
          opponent.blockFx = 0.28;
          opponent.blockFxPower = heavy ? 1.8 : 1;
          opponent.blockFxSide = this.x >= opponent.x ? 1 : -1;
          this.attackHit = true;
        } else {
          opponent.health -= damage;
          opponent.hitTimer = 0.3;
          opponent.blockAnimTimer = 0; // golpe que furou: cancela a reação de block
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
      // Chão de verdade: no ar não existe controle (o pulo é travado no
      // impulso) — mover, agachar, atacar e bloquear exigem estar em solo.
      const onGround = grounded && this.y === 0;
      const stunned = this.blockTimer > 0; // blockstun: sem ações até passar
      // Postura antes do movimento: agachado NÃO anda (defesa agachada fica
      // parada no lugar, como nos clássicos — só a defesa em pé recua).
      this.crouch = onGround && !stunned && Boolean(actions.crouch);
      // Agachar NÃO corta a reação de block: a sequência completa joga uma
      // vez por bloqueio (inclusive no bloqueio agachado); a guarda baixa
      // só volta quando o timer termina (getState prioriza a reação).
      // Corrida: só para frente (na direção do oponente, `this.face`), fora
      // de agachar, blockstun e hitstun. No ar a velocidade do impulso é
      // mantida (pulo corrido) mas `running` fica false — a animação é 'jump'.
      const moving = actions.left !== actions.right;
      const dir = actions.right ? 1 : actions.left ? -1 : 0;
      const forward = moving && dir === this.face;
      const canRun = onGround && !stunned && this.hitTimer <= 0
        && !this.crouch && Boolean(actions.run) && forward;
      this.running = canRun && this.y === 0;
      const speed = canRun ? RUN_SPEED : WALK_SPEED;
      if (onGround && !stunned && !this.crouch && actions.left) this.x -= speed * dt;
      if (onGround && !stunned && !this.crouch && actions.right) this.x += speed * dt;
      // Pulo: dispara na BORDA DE SUBIDA (pressionou agora) — segurar não
      // re-pula. O buffer de 0,1 s cobre o input pouco antes de aterrissar.
      if (actions.jump && !prev.jump) this.jumpBuffer = 0.1;
      else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      if (this.jumpBuffer > 0 && this.y === 0 && grounded && !stunned) {
        this.vy = 620;  // antes 565; arco mais alto para garantir atravessada completa por cima
        this.jumpBuffer = 0;
        this.blockAnimTimer = 0; // pular corta a reação de block
        // Direção travada no impulso: no ar não dá para mudar o arco nem a
        // velocidade. Sem direção (ou duas direções), o pulo é reto no lugar.
        this.jumpDir = actions.right && !actions.left ? 1
          : actions.left && !actions.right ? -1 : 0;
        // Corrida antes do pulo mantém o impulso (250 px/s) no ar.
        this.jumpSpeed = this.running ? RUN_SPEED : AIR_JUMP_SPEED;
      }
      this.walking = onGround && !stunned && moving && !this.crouch;
      if (onGround && !stunned) {
        // Ataques: também só na borda de subida (debounce honesto — vale
        // igual para teclado, touch e CPU, que emite `true` por 1 frame).
        for (const name of Object.keys(ATTACKS)) {
          if (actions[name] && !prev[name]) {
            this.attack = { data: ATTACKS[name], elapsed: 0 };
            this.attackName = name;
            this.attackHit = false;
            this.blocking = false;
            this.blockAnimTimer = 0; // atacar corta a reação de block
            break;
          }
        }
      }
      // Defesa tradicional = recuo: segurar a direção que se afasta do
      // oponente (no chão, sem atacar). Em pé bloqueia high/mid; agachado
      // bloqueia mid/low — a checagem de acerto aplica a tabela.
      const away = opponent.x >= this.x ? -1 : 1;
      const holdingBack = away > 0 ? actions.right : actions.left;
      this.blocking = onGround && !stunned && !this.attack && holdingBack;
    }
    const wasAir = this.y > 0;
    this.vy -= 1500 * dt;
    this.y = Math.max(0, this.y + this.vy * dt);
    // Movimento horizontal durante o pulo: vem do IMPULSO travado no voo
    // (`jumpDir`/`jumpSpeed`) — atravessa o oponente quando a direção escolhida
    // aponta para ele, e o input não altera mais o arco nem a velocidade.
    const inAir = this.y > 0 && !this.attack && !this.crouch;
    if (inAir) {
      // Pulo travado (2026-11-24): a direção e a velocidade vêm do impulso.
      // O input não altera o arco — só o impulso definido no voo move o corpo.
      this.x += this.jumpDir * this.jumpSpeed * dt;
    }
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
        this.justLanded = true; // frame ar → chão: Game fixa o x do oponente
        this.jumpDir = 0; // impulso encerra no pouso
        this.jumpSpeed = 0;
      }
    }
    this.landingTimer = Math.max(0, this.landingTimer - dt);
    this.prev = { ...actions }; // guarda para o debounce do próximo frame
  }
}

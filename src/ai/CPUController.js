/**
 * CPUController — IA do oponente (CPU) do protótipo.
 *
 * Observa o próprio lutador e o oponente e devolve, a cada passo fixo, um
 * objeto `actions` com a MESMA forma do input do teclado/touch. O Fighter
 * não sabe se quem joga é humano ou IA — mesma física, nenhum trapaça
 * (sem alcance extra, sem leitura de hitbox oculta).
 *
 * Perfis em DIFFICULTIES: dificuldade controla tempo de reação, ritmo de
 * decisão, agressividade, esquiva e — principalmente — `allowedAttacks`,
 * a lista de tipos de golpe que a CPU pode usar.
 */
import { ATTACKS } from '../fighters/Fighter.js';

// Ordem do mais forte ao mais fraco (para punição: usa o mais forte possível).
const ATTACK_ORDER = ['heavyAttack', 'kick', 'mediumAttack', 'lightAttack'];

export const DIFFICULTIES = {
  facil: {
    label: 'FÁCIL',
    reaction: [0.45, 0.8],   // atraso para reagir ao golpe do oponente (s)
    think: [0.4, 0.8],       // intervalo entre decisões (s)
    aggression: 0.25,        // chance de atacar quando está em alcance
    dodgeChance: 0.15,       // chance de recuar/pular ao reagir a um golpe
    blockChance: 0.08,       // chance de bloquear (segurar o recuo) ao reagir
    pauseChance: 0.35,       // chance de pausar (fica parado) ao decidir
    jumpChance: 0.05,        // chance de pular para fechar distância
    runDistance: 200,        // reduzido de 250 para permitir caminhada mais próxima
    punish: false,           // pune hitstun/recuperação do oponente?
    allowedAttacks: ['lightAttack', 'kick'],
    weights: { lightAttack: 3, kick: 1 },
  },
  medio: {
    label: 'MÉDIO',
    reaction: [0.25, 0.4],
    think: [0.22, 0.4],
    aggression: 0.5,
    dodgeChance: 0.35,
    blockChance: 0.25,
    pauseChance: 0.2,
    jumpChance: 0.08,
    runDistance: 130,        // reduzido de 220 para permitir caminhada mais próxima
    punish: false,
    allowedAttacks: ['lightAttack', 'mediumAttack', 'kick'],
    weights: { lightAttack: 3, mediumAttack: 2, kick: 1.5 },
  },
  dificil: {
    label: 'DIFÍCIL',
    reaction: [0.1, 0.2],
    think: [0.12, 0.2],
    aggression: 0.75,
    dodgeChance: 0.6,
    blockChance: 0.5,
    pauseChance: 0.08,
    jumpChance: 0.12,
    runDistance: 130,        // reduzido de 170 para permitir caminhada mais próxima
    punish: true,
    allowedAttacks: ['lightAttack', 'mediumAttack', 'heavyAttack', 'kick'],
    weights: { lightAttack: 3, mediumAttack: 2, heavyAttack: 1.2, kick: 1.5 },
  },
  // ── Perfis das fases 4 e 5 da campanha ──────────────────────────────
  // Não aparecem no menu de partida rápida: existem para escalar a
  // dificuldade além do "difícil" sem tocar nos perfis já validados.
  elite: {
    label: 'ELITE',
    reaction: [0.06, 0.12],
    think: [0.08, 0.14],
    aggression: 0.88,
    dodgeChance: 0.7,
    blockChance: 0.6,
    pauseChance: 0.04,
    jumpChance: 0.14,
    runDistance: 120,
    punish: true,
    allowedAttacks: ['lightAttack', 'mediumAttack', 'heavyAttack', 'kick'],
    weights: { lightAttack: 3, mediumAttack: 2, heavyAttack: 1.8, kick: 1.6 },
  },
  lendario: {
    label: 'LENDÁRIO',
    reaction: [0.03, 0.08],
    think: [0.05, 0.1],
    aggression: 0.95,
    dodgeChance: 0.8,
    blockChance: 0.72,
    pauseChance: 0.02,
    jumpChance: 0.16,
    runDistance: 110,
    punish: true,
    allowedAttacks: ['lightAttack', 'mediumAttack', 'heavyAttack', 'kick'],
    weights: { lightAttack: 3, mediumAttack: 2, heavyAttack: 2.2, kick: 1.8 },
  },
};

export class CPUController {
  /**
   * @param {Fighter} fighter   lutador controlado pela IA
   * @param {Fighter} opponent  adversário
   * @param {string}  difficulty chave de DIFFICULTIES ('facil'|'medio'|'dificil')
   */
  constructor(fighter, opponent, difficulty = 'facil') {
    this.fighter = fighter;
    this.opponent = opponent;
    this.time = 0;
    this.thinkTimer = 0;      // tempo até a próxima decisão
    this.intent = 'pause';    // approach | retreat | pause | jump
    this.intentTimer = 0;     // duração da intenção atual
    this.stateName = 'pause'; // rótulo para o debug
    this.sawAttack = false;   // oponente iniciou um golpe?
    this.reactAt = Infinity;  // instância em que a reação dispara
    this.reacted = false;     // reação deste golpe já foi processada?
    // Objeto de ações na MESMA forma do input do teclado. Reutilizado entre
    // frames (zerado no início de cada update).
    this.actions = {
      left: false, right: false, crouch: false, jump: false,
      run: false,
      lightAttack: false, mediumAttack: false, heavyAttack: false, kick: false,
    };
    this.setDifficulty(difficulty);
  }

  setDifficulty(name) {
    this.difficulty = DIFFICULTIES[name] ? name : this.difficulty;
    this.profile = DIFFICULTIES[this.difficulty];
    this.thinkTimer = 0;
  }

  rand([min, max]) { return min + Math.random() * (max - min); }

  /** Alcance efetivo de um golpe: mesma condição de acerto do Fighter + margem. */
  rangeOf(name) {
    return ATTACKS[name].reach + this.opponent.hurtbox.halfWidth - 2;
  }

  /** Maior alcance entre os golpes permitidos (para decidir aproximar). */
  bestRange() {
    let range = 0;
    for (const name of this.profile.allowedAttacks) {
      range = Math.max(range, this.rangeOf(name));
    }
    return range;
  }

  /** Sorteia um golpe permitido cujo alcance cobre a distância atual. */
  pickAttack(dist) {
    const targetY = this.opponent.y;
    const pool = this.profile.allowedAttacks.filter((n) => {
      const atk = ATTACKS[n];
      if (dist > this.rangeOf(n) || targetY >= atk.maxTargetY) return false;
      // Golpe alto passa por cima de quem agacha — não adianta usá-lo.
      if (atk.height === 'high' && this.opponent.crouch) return false;
      return true;
    });
    if (pool.length === 0) return null;
    const weights = this.profile.weights;
    // vs agachado: o chute (low) acerta e fura o block em pé — peso dobrado.
    const weightOf = (n) => {
      let w = weights[n] ?? 1;
      if (this.opponent.crouch && ATTACKS[n].height === 'low') w *= 2;
      return w;
    };
    let total = 0;
    for (const n of pool) total += weightOf(n);
    let roll = Math.random() * total;
    for (const n of pool) {
      roll -= weightOf(n);
      if (roll <= 0) return n;
    }
    return pool[pool.length - 1];
  }

  /**
   * Avança a IA um passo fixo e devolve as ações do frame.
   * @param {number} dt passo fixo da simulação
   */
  update(dt) {
    const a = this.actions;
    for (const key in a) a[key] = false;
    this.time += dt;
    const f = this.fighter, o = this.opponent, p = this.profile;

    // Ocupado (golpe próprio, hitstun, recuperação de pouso): só observa.
    if (f.attack || f.hitTimer > 0 || f.landingTimer > 0) {
      this.stateName = f.attack ? 'attack' : f.hitTimer > 0 ? 'hit' : 'landing';
      this.sawAttack = false; this.reacted = false; this.reactAt = Infinity;
      return a;
    }

    const dist = Math.abs(o.x - f.x);
    const dir = Math.sign(o.x - f.x) || 1;
    const oRecovering = Boolean(o.attack && o.attack.elapsed >= o.attack.data.activeEnd);
    const oExposed = o.hitTimer > 0 || oRecovering;

    // ── Reflexo com atraso do perfil: resposta ao golpe do oponente ──
    if (o.attack && !this.sawAttack) {
      this.sawAttack = true;
      this.reactAt = this.time + this.rand(p.reaction);
    } else if (!o.attack) {
      this.sawAttack = false;
      this.reacted = false;
    }
    if (this.sawAttack && !this.reacted && this.time >= this.reactAt) {
      this.reacted = true;
      if (dist < 135) {
        const roll = Math.random();
        if (roll < p.blockChance) {
          // Bloquear: segura o recuo (defesa tradicional) por um tempo.
          this.intent = 'block';
          this.intentTimer = this.rand([0.4, 0.7]);
          this.stateName = 'block';
        } else if (roll < p.blockChance + p.dodgeChance) {
          this.intent = Math.random() < 0.25 ? 'jump' : 'retreat';
          this.intentTimer = this.rand([0.25, 0.6]);
          this.stateName = 'dodge';
        }
      }
    }

    // ── Punição: oponente em hitstun/recuperação → golpe mais forte possível ──
    if (p.punish && oExposed && o.y < 110) {
      for (const name of ATTACK_ORDER) {
        if (!p.allowedAttacks.includes(name)) continue;
        if (o.y >= ATTACKS[name].maxTargetY) continue; // golpe não alcança a altura
        if (dist <= this.rangeOf(name)) {
          a[name] = true;
          this.intent = 'pause'; this.intentTimer = 0.12;
          this.stateName = 'punish:' + name;
          return a;
        }
      }
    }

    // ── Decisão periódica ──
    // Enquanto está comprometido com o block (defesa reagindo ao golpe),
    // não re-decide: segura a postura até o timer do reflexo acabar.
    const committedToBlock = this.intent === 'block' && this.intentTimer > 0;
    this.thinkTimer -= dt;
    if (!committedToBlock && this.thinkTimer <= 0) {
      this.thinkTimer = this.rand(p.think);
      if (o.y < 90 && dist <= this.bestRange() && Math.random() < p.aggression) {
        const name = this.pickAttack(dist);
        if (name) {
          a[name] = true;
          this.intent = 'pause'; this.intentTimer = 0.12;
          this.stateName = 'attack:' + name;
        }
      } else if (Math.random() < p.pauseChance) {
        this.intent = 'pause';
        this.intentTimer = this.rand([0.2, 0.6]);
        this.stateName = 'pause';
      } else if (Math.random() < p.jumpChance && dist > 140) {
        this.intent = 'jump';
        this.intentTimer = 0.15;
        this.stateName = 'jump';
      } else {
        this.intent = 'approach';
        this.intentTimer = this.rand(p.think) + 0.25;
        this.stateName = 'approach';
      }
    }

    // ── Execução da intenção corrente ──
    switch (this.intent) {
      case 'approach':
        if (dist > this.rangeOf('lightAttack')) {
          if (dir > 0) a.right = true; else a.left = true;
          // Longe o bastante, corre para encurtar a distância.
          a.run = dist > (p.runDistance ?? 220);
        }
        break;
      case 'retreat':
      case 'block': // segurar o recuo = postura de defesa no Fighter
        if (dir > 0) a.left = true; else a.right = true;
        break;
      case 'jump':
        a.jump = true;
        break;
    }
    this.intentTimer -= dt;
    if (this.intentTimer <= 0 && this.intent !== 'pause') this.intent = 'pause';

    return a;
  }
}

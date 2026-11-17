const ATTACKS = {
  lightAttack: { duration: 0.28, damage: 5, reach: 105, activeStart: 0.07, activeEnd: 0.15 },
  mediumAttack: { duration: 0.48, damage: 10, reach: 125, activeStart: 0.13, activeEnd: 0.24 },
  heavyAttack: { duration: 0.72, damage: 18, reach: 145, activeStart: 0.25, activeEnd: 0.38 },
  kick: { duration: 0.52, damage: 12, reach: 135, activeStart: 0.16, activeEnd: 0.29 },
};

export class Fighter {
  constructor(x, color, face) {
    this.x = x; this.y = 0; this.vy = 0; this.color = color; this.face = face;
    this.health = 100; this.attack = null; this.attackName = null;
    this.attackHit = false; this.crouch = false; this.hitTimer = 0;
  }
  /** Estado lógico atual — alimenta o SpriteAnimator. */
  getState() {
    if (this.attack) return this.attackName;
    if (this.hitTimer > 0) return 'hit';
    if (this.y < 0) return 'jump';
    if (this.crouch) return 'crouch';
    return this.walking ? 'walk' : 'idle'; // andar é detectado pelo input
  }
  update(dt, actions, opponent) {
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    if (this.attack) {
      this.attack.elapsed += dt;
      const { activeStart, activeEnd, reach, damage } = this.attack.data;
      if (!this.attackHit && this.attack.elapsed >= activeStart && this.attack.elapsed <= activeEnd && Math.abs(opponent.x - this.x) < reach) {
        opponent.health -= damage;
        opponent.hitTimer = 0.3;
        this.attackHit = true;
      }
      if (this.attack.elapsed >= this.attack.data.duration) this.attack = null;
    } else {
      const speed = 250;
      if (actions.left) this.x -= speed * dt;
      if (actions.right) this.x += speed * dt;
      if (actions.jump && this.y === 0) this.vy = -560;
      this.crouch = Boolean(actions.crouch);
      this.walking = Boolean(actions.left || actions.right) && !this.crouch;
      for (const name of Object.keys(ATTACKS)) {
        if (actions[name]) {
          this.attack = { data: ATTACKS[name], elapsed: 0 };
          this.attackName = name;
          this.attackHit = false;
          break;
        }
      }
    }
    this.vy += 1500 * dt;
    this.y = Math.min(0, this.y + this.vy * dt);
    if (this.y === 0) this.vy = 0;
  }
}

const ATTACKS = {
  lightAttack: { duration: 0.28, damage: 5, reach: 105, activeStart: 0.07, activeEnd: 0.15 },
  mediumAttack: { duration: 0.48, damage: 10, reach: 125, activeStart: 0.13, activeEnd: 0.24 },
  heavyAttack: { duration: 0.72, damage: 18, reach: 145, activeStart: 0.25, activeEnd: 0.38 },
  kick: { duration: 0.52, damage: 12, reach: 135, activeStart: 0.16, activeEnd: 0.29 },
};

export class Fighter {
  constructor(x, color, face) {
    this.x = x; this.y = 0; this.vy = 0; this.color = color; this.face = face;
    this.health = 100; this.attack = null; this.attackHit = false; this.crouch = false;
  }
  update(dt, actions, opponent) {
    if (this.attack) {
      this.attack.elapsed += dt;
      const { activeStart, activeEnd, reach, damage } = this.attack.data;
      if (!this.attackHit && this.attack.elapsed >= activeStart && this.attack.elapsed <= activeEnd && Math.abs(opponent.x - this.x) < reach) {
        opponent.health -= damage;
        this.attackHit = true;
      }
      if (this.attack.elapsed >= this.attack.data.duration) this.attack = null;
    } else {
      const speed = 250;
      if (actions.left) this.x -= speed * dt;
      if (actions.right) this.x += speed * dt;
      if (actions.jump && this.y === 0) this.vy = -560;
      this.crouch = Boolean(actions.crouch);
      for (const name of Object.keys(ATTACKS)) {
        if (actions[name]) {
          this.attack = { data: ATTACKS[name], elapsed: 0 };
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

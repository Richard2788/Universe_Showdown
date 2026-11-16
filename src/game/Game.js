import { Fighter } from '../fighters/Fighter.js';
import { CanvasRenderer } from '../rendering/CanvasRenderer.js';

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
    this.player = new Fighter(300, '#51e3e8', 1);
    this.enemy = new Fighter(660, '#ff638c', -1);
    this.lastTime = 0;
    this.accumulator = 0;
    this.frame = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
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
    const delta = Math.min((time - (this.lastTime || time)) / 1000, 0.1);
    this.lastTime = time;
    this.accumulator += delta;
    while (this.accumulator >= STEP) {
      this.update(STEP);
      this.accumulator -= STEP;
    }
    this.render();
    requestAnimationFrame((next) => this.loop(next));
  }
  update(dt) {
    this.frame++;
    const actions = this.input.actions;
    this.player.update(dt, actions, this.enemy);
    this.enemy.update(dt, {}, this.player);
    const distance = this.enemy.x - this.player.x;
    if (Math.abs(distance) < 78) {
      const overlap = 78 - Math.abs(distance);
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
  reset() {
    this.player = new Fighter(300, '#51e3e8', 1);
    this.enemy = new Fighter(660, '#ff638c', -1);
    this.frame = 0;
  }
}

export class CanvasRenderer {
  constructor(ctx, width, height) { this.ctx = ctx; this.width = width; this.height = height; }
  draw(player, enemy, frame) {
    const c = this.ctx;
    const w = this.width, h = this.height;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#172943'); sky.addColorStop(.65, '#25334a'); sky.addColorStop(1, '#111a2a');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.save();
    c.strokeStyle = '#6b87a8'; c.globalAlpha = .13; c.lineWidth = 1;
    for (let x = 0; x < w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 30; y < h; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.restore();
    c.fillStyle = '#202d40'; c.fillRect(0, 420, w, 120);
    c.strokeStyle = '#53647c'; c.globalAlpha = .6; c.beginPath(); c.moveTo(0, 420); c.lineTo(w, 420); c.stroke(); c.globalAlpha = 1;
    for (const [fighter, label] of [[player, 'YOU'], [enemy, 'CPU']]) this.drawFighter(fighter, label);
    c.fillStyle = '#9aabc4'; c.font = '12px ui-monospace,monospace'; c.fillText('UNIVERSE // TRAINING SIMULATION', 24, 32);
    c.fillStyle = '#51e3e8'; c.fillRect(24, 48, 3, 18);
    c.fillStyle = '#d6e1f3'; c.font = 'bold 12px ui-monospace,monospace'; c.fillText('MOVE  •  JUMP  •  STRIKE', 36, 61);
  }
  drawFighter(f, label) {
    const c = this.ctx, x = f.x, floor = 420 - f.y;
    c.save(); c.translate(x, floor); c.scale(f.face, 1);
    c.globalAlpha = .22; c.fillStyle = '#000'; c.beginPath(); c.ellipse(0, 0, 42, 8, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    const crouch = f.crouch ? .72 : 1;
    c.strokeStyle = f.color; c.lineWidth = 17; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8, -20); c.lineTo(-19, -4); c.lineTo(-31, 0); c.stroke();
    c.beginPath(); c.moveTo(8, -20); c.lineTo(20, -5); c.lineTo(32, 0); c.stroke();
    c.lineWidth = 20; c.beginPath(); c.moveTo(0, -90 * crouch); c.lineTo(0, -24); c.stroke();
    c.fillStyle = '#e9f1ff'; c.beginPath(); c.arc(0, -111 * crouch, 19, 0, Math.PI * 2); c.fill();
    c.fillStyle = f.color; c.beginPath(); c.arc(0, -111 * crouch, 15, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#f4f7ff'; c.lineWidth = 12; c.beginPath(); c.moveTo(0, -75 * crouch); c.lineTo(30, -58); c.stroke();
    c.strokeStyle = f.color; c.lineWidth = 10; c.beginPath(); c.moveTo(30, -58); c.lineTo(47, -42); c.stroke();
    if (f.attack) { c.strokeStyle = f.color; c.lineWidth = 14; c.beginPath(); c.moveTo(4, -74); c.lineTo(72, -76); c.stroke(); }
    c.restore();
    c.fillStyle = f.color; c.font = 'bold 12px ui-monospace,monospace'; c.textAlign = 'center'; c.fillText(label, x, floor - 145);
  }
}

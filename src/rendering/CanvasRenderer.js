/**
 * CanvasRenderer — desenha arena, lutadores e HUD.
 *
 * Lutadores: se um SpriteAnimator (atlas) estiver disponível, desenha o
 * frame atual da spritesheet; senão cai no desenho procedural original.
 */
export class CanvasRenderer {
  constructor(ctx, width, height) {
    this.ctx = ctx; this.width = width; this.height = height;
    this.animators = new Map(); // Fighter → SpriteAnimator
    this.cpuStates = new Map(); // Fighter → estado interno da IA (debug)
    this.playerLabel = 'YOU';
    this.enemyLabel = 'CPU';
    this.debug = false;
    this.usesPlaceholder = false;
  }

  setAnimator(fighter, animator) {
    this.animators.set(fighter, animator);
    // Atlas gerada por PlaceholderAtlas (canvas offscreen) → indicador visual.
    if (animator.atlas instanceof HTMLCanvasElement) this.usesPlaceholder = true;
  }

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
    this.drawScenery();
    for (const [fighter, label] of [[player, this.playerLabel], [enemy, this.enemyLabel]]) this.drawFighter(fighter, label);
  }

  /**
   * Cenário placeholder: silhuetas em camadas parallax desenhadas
   * proceduralmente (nenhuma arte externa necessária).
   */
  drawScenery() {
    const c = this.ctx, w = this.width, h = this.height;
    c.save();
    // Camada distante: montanhas
    c.fillStyle = '#1b2940'; c.globalAlpha = .8;
    c.beginPath(); c.moveTo(0, 420);
    for (let x = 0; x <= w; x += 120) {
      const peak = 300 + Math.abs(Math.sin(x * 0.013)) * 90;
      c.lineTo(x + 60, peak); c.lineTo(x + 120, 360 + Math.abs(Math.cos(x * 0.011)) * 40);
    }
    c.lineTo(w, 420); c.closePath(); c.fill();
    // Camada média: colunas/ruínas
    c.globalAlpha = .55; c.fillStyle = '#243650';
    for (let x = 90; x < w; x += 210) {
      const colH = 90 + Math.abs(Math.sin(x * 0.07)) * 60;
      c.fillRect(x, 420 - colH, 26, colH);
      c.fillRect(x - 6, 420 - colH - 10, 38, 12);
    }
    c.restore();
  }

  drawFighter(f, label) {
    const c = this.ctx, x = f.x, floor = 420 - f.y;
    const scale = 1.1 * (f.renderScale ?? 1);
    c.save(); c.translate(x, floor); c.scale(f.face, 1);
    c.globalAlpha = .22; c.fillStyle = '#000'; c.beginPath();
    c.ellipse(0, 0, 42 * (f.renderScale ?? 1), 8 * (f.renderScale ?? 1), 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.restore();

    const animator = this.animators.get(f);
    if (animator) {
      // ── Pipeline atlas: recorta o frame atual da spritesheet ──
      const rect = animator.getFrameRect();
      if (Number.isFinite(rect.sx) && Number.isFinite(rect.sw)) {
        animator.draw(c, x, floor, f.face, scale);
        if (animator.isActive()) {
          // Feedback visual do frame de contato (futuro: efeito de impacto)
          c.fillStyle = '#ffd866'; c.font = 'bold 10px ui-monospace,monospace'; c.textAlign = 'center';
          c.fillText('!', x + f.face * 60, floor - 70);
        }
      } else {
        // Fallback: dados da atlas inválidos → desenho procedural.
        this.drawFighterProcedural(f, x, floor);
      }
    } else {
      this.drawFighterProcedural(f, x, floor);
    }
    // Impacto de bloqueio bem-sucedido: escudo + faíscas no ponto de contato.
    if (f.blockFx > 0) this.drawBlockFx(f, floor);

    c.fillStyle = f.color; c.font = 'bold 12px ui-monospace,monospace'; c.textAlign = 'center';
    c.fillText(label, x, floor - (f.hurtbox?.height ?? 120) - 14);
    if (this.debug) this.drawDebug(f, animator, floor);
  }

  /** Overlay de debug (?debug=1): hurtbox do personagem, hitbox, posição, estado e frame. */
  drawDebug(f, animator, floor) {
    const c = this.ctx;
    const hb = f.hurtbox ?? { halfWidth: 20, height: 120 };
    c.save();
    // Hurtbox do personagem: centrada no pivô (x) e apoiada no chão.
    const hurtW = hb.halfWidth * 2, hurtH = hb.height;
    c.fillStyle = 'rgba(134,241,210,.15)';
    c.strokeStyle = '#86f1d2'; c.lineWidth = 1;
    c.strokeRect(f.x - hb.halfWidth, floor - hurtH, hurtW, hurtH);
    // Hitbox do golpe ativo: metade das dimensões originais. A cor indica a
    // altura do golpe: high = rosa, low = ciano, mid = âmbar.
    const reach = f.attack ? f.attack.data.reach : 0;
    if (reach) {
      const hitH = 40;
      const height = f.attack.data.height;
      c.strokeStyle = height === 'high' ? '#ff638c' : height === 'low' ? '#51e3e8' : '#ffd866';
      c.strokeRect(f.face === 1 ? f.x : f.x - reach, floor - 70, reach, hitH);
    }
    c.fillStyle = '#ffd866'; c.font = '10px ui-monospace,monospace'; c.textAlign = 'center';
    const state = animator ? `${animator.stateName}#${animator.frameIndex}` : '—';
    c.fillText(`x:${Math.round(f.x)} y:${Math.round(f.y)} hp:${Math.round(f.health)} kb:${Math.abs(Math.round(f.kbVx || 0))}`, f.x, floor + 14);
    c.fillText(state, f.x, floor - hurtH - 6);
    // Indicador de defesa (postura de block ou blockstun ativo).
    if (f.blocking || f.blockTimer > 0) {
      c.fillStyle = '#86f1d2';
      c.fillText(f.blockTimer > 0 ? 'DEFESA* (stun)' : 'DEFESA', f.x, floor - hurtH - 34);
      c.fillStyle = '#ffd866';
    }
    // Estado interno da IA (ex.: approach, dodge, attack:lightAttack).
    const cpuState = this.cpuStates.get(f);
    if (cpuState) c.fillText(`ia: ${cpuState}`, f.x, floor - hurtH - 22);
    c.restore();
  }

  /**
   * Impacto de bloqueio bem-sucedido: arco de "escudo" que se expande na
   * direção do atacante + faíscas radiais, tudo com fade (f.blockFx 0.28 → 0).
   * Posição: borda da hurtbox voltada para quem atacou, na altura do peito
   * (mais baixa se estiver agachado/block agachado).
   */
  drawBlockFx(f, floor) {
    const c = this.ctx;
    const t = f.blockFx / 0.28;                 // 1 (recém-bloqueado) → 0
    const half = f.hurtbox?.halfWidth ?? 35;
    const hx = f.x + (f.blockFxSide ?? 1) * (half + 6);
    const hy = floor - (f.crouch ? 34 : 58);
    // Ângulo central do arco: aponta para quem atacou.
    const center = (f.blockFxSide ?? 1) === 1 ? 0 : Math.PI;
    c.save();
    c.globalAlpha = Math.min(1, t * 1.6);
    // Flash suave atrás do escudo.
    c.fillStyle = 'rgba(134,241,210,.28)';
    c.beginPath(); c.arc(hx, hy, 20 + (1 - t) * 26, 0, Math.PI * 2); c.fill();
    // Escudo: arco que se expande e afina.
    const r = 24 + (1 - t) * 20;
    c.strokeStyle = '#86f1d2'; c.lineWidth = 1 + 3 * t; c.lineCap = 'round';
    c.beginPath(); c.arc(hx, hy, r, center - 1.1, center + 1.1); c.stroke();
    // Faíscas radiais (encolhem junto com o fade).
    c.strokeStyle = '#d9fff2'; c.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      const ang = center + i * 0.5;
      const r1 = r + 5, r2 = r + 5 + 15 * t;
      c.beginPath();
      c.moveTo(hx + Math.cos(ang) * r1, hy + Math.sin(ang) * r1);
      c.lineTo(hx + Math.cos(ang) * r2, hy + Math.sin(ang) * r2);
      c.stroke();
    }
    c.restore();
  }

  /** Desenho procedural original (fallback enquanto não há atlas por lutador). */
  drawFighterProcedural(f, x, floor) {
    const c = this.ctx;
    c.save(); c.translate(x, floor); c.scale(f.face, 1);
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
  }
}

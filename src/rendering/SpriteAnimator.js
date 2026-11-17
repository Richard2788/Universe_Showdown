/**
 * SpriteAnimator — toca estados de uma spritesheet (atlas) controlado
 * pela simulação fixa do jogo (não pelo frame de renderização).
 *
 * Pipeline de desenho de um frame:
 *   1. Game.update(dt) chama animator.setState(fighter.getState()).
 *   2. animator.update(dt) avança o índice de frame conforme fps/frameTime.
 *   3. CanvasRenderer pede animator.draw(...) que recorta a célula
 *      (sx, sy, 96, 96) da atlas e desenha com drawImage ancorada no pivô.
 *
 * A atlas pode vir de:
 *   - um canvas gerado por PlaceholderAtlas (fase atual, sem arte externa);
 *   - uma Image/HTMLImageElement carregada de public/assets/characters/...
 *     (fase de arte real — mesma API, zero mudança no resto do jogo).
 */
export class SpriteAnimator {
  /**
   * @param {CanvasImageSource} atlas canvas ou imagem da spritesheet
   * @param {object} data objeto no formato de src/characters/animations.js
   */
  constructor(atlas, data) {
    this.atlas = atlas;
    this.data = data;
    this.meta = data.meta;
    this.stateName = 'idle';
    this.state = data.states.idle ?? Object.values(data.states)[0];
    this.frameIndex = 0;
    this.timeInFrame = 0;
    this.finished = false;
  }

  /**
   * Troca de estado. Estados não-loop reiniciam do frame 0;
   * o mesmo estado em sequência continua de onde parou.
   */
  setState(name) {
    const next = this.data.states[name];
    if (!next || next === this.state) return;
    this.stateName = name;
    this.state = next;
    this.frameIndex = 0;
    this.timeInFrame = 0;
    this.finished = false;
  }

  /** Avança a animação — chamar a cada passo fixo da simulação. */
  update(dt) {
    const s = this.state;
    if (this.finished) return;
    const frameTime = s.frameTime ?? 1 / (s.fps ?? 8);
    this.timeInFrame += dt;
    while (this.timeInFrame >= frameTime) {
      this.timeInFrame -= frameTime;
      if (this.frameIndex < s.frames - 1) {
        this.frameIndex++;
      } else if (s.loop) {
        this.frameIndex = 0;
      } else {
        this.finished = true; // congela no último frame (KO, hit, golpe)
        break;
      }
    }
  }

  /** Estamos dentro da janela de frames ativos (frame de contato visual)? */
  isActive() {
    const { activeFrom, activeTo } = this.state;
    if (activeFrom == null) return false;
    return this.frameIndex >= activeFrom && this.frameIndex <= (activeTo ?? activeFrom);
  }

  /** Retângulo-fonte da célula atual na atlas. */
  getFrameRect() {
    const { frameWidth, frameHeight, pivotX } = this.meta;
    return {
      sx: (this.state.col + this.frameIndex) * frameWidth,
      sy: this.state.row * frameHeight,
      sw: frameWidth,
      sh: frameHeight,
      pivotX,
    };
  }

  /**
   * Desenha o frame atual ancorado no pivô (base entre os pés).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x      posição horizontal do lutador (mundo)
   * @param {number} groundY linha do chão
   * @param {number} face   1 = direita, -1 = esquerda
   * @param {number} [scale] escala de exibição
   */
  draw(ctx, x, groundY, face = 1, scale = 1) {
    const { sx, sy, sw, sh, pivotX } = this.getFrameRect();
    ctx.save();
    ctx.translate(x, groundY);
    ctx.scale(face * scale, scale);
    ctx.drawImage(this.atlas, sx, sy, sw, sh, -pivotX, -sh, sw, sh);
    ctx.restore();
  }
}

/**
 * Carrega uma atlas PNG real (fase de arte final).
 * Uso futuro:
 *   const atlas = await loadAtlasImage('/assets/characters/knight/knight.png');
 *   const animator = new SpriteAnimator(atlas, ANIMATION_DATA);
 */
export function loadAtlasImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar atlas: ${url}`));
    img.src = url;
  });
}

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
    this.atlas = atlas;          // imagem única OU fallback do placeholder
    this.data = data;
    this.meta = data.meta;
    this.stateImages = new Map(); // stateName → Image (uma atlas por estado)
    this.stateName = 'idle';
    this.state = data.states.idle ?? Object.values(data.states)[0];
    this.frameIndex = 0;
    this.timeInFrame = 0;
    this.finished = false;
  }

  /** Associa a atlas (Image) de um estado específico (artes por estado). */
  setImage(stateName, image) {
    this.stateImages.set(stateName, image);
  }

  /** Há arte real carregada para este animador? */
  hasRealArt() {
    return this.stateImages.size > 0;
  }

  /** Imagem da atlas do estado atual (ou o fallback único). */
  getImage() {
    return this.stateImages.get(this.stateName) ?? this.atlas;
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

  /**
   * Rebobina o estado atual sem trocar dele — usado pelo Game.js para
   * re-armar a reação de block quando um novo bloqueio acontece DURANTE o
   * play anterior (senão a 2ª sequência não mostraria todos os sprites).
   */
  rewind() {
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

  /** Retângulo-fonte da célula atual na atlas.
   *
   * Cada estado pode ter sua própria atlas (image/columns/frameWidth no
   * estado). A posição é calculada pelo índice linear (row * columns + col)
   * somado ao frame atual, envolvendo para a linha seguinte se necessário.
   *
   * `anchorX` = pivô horizontal do desenho. Prioridade: âncora POR FRAME
   * (`frameAnchors`) → âncora do estado → `pivotX` (centro da célula).
   * Usar a âncora do corpo evita o salto lateral ao espelhar a sprite.
   */
  getFrameRect() {
    const s = this.state;
    const fw = s.frameWidth ?? this.meta.frameWidth;
    const fh = s.frameHeight ?? this.meta.frameHeight;
    const cols = s.columns ?? this.meta.columns ?? 19;
    const cell = s.row * cols + s.col + this.frameIndex;
    const pivotX = s.pivotX ?? this.meta.pivotX;
    const anchorX = s.frameAnchors?.[this.frameIndex] ?? s.anchorX ?? pivotX;
    return {
      sx: (cell % cols) * fw,
      sy: Math.floor(cell / cols) * fh,
      sw: fw,
      sh: fh,
      pivotX,
      anchorX,
    };
  }

  /**
   * Desenha o frame ancorado no pivô `anchorX` (corpo no eixo de `x`).
   *
   * O espelhamento (`scale(face, 1)`) gira em torno de `anchorX`, não do
   * centro da célula: o corpo permanece na mesma posição na tela ao trocar
   * de face — só braços e pernas trocam de lado.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x      posição horizontal do lutador (mundo)
   * @param {number} groundY linha do chão
   * @param {number} face   1 = direita, -1 = esquerda
   * @param {number} [scale] escala de exibição
   */
  draw(ctx, x, groundY, face = 1, scale = 1) {
    const { sx, sy, sw, sh, anchorX } = this.getFrameRect();
    const image = this.getImage();
    if (!image) return;
    ctx.save();
    ctx.translate(x, groundY);
    ctx.scale(face * scale, scale);
    ctx.drawImage(image, sx, sy, sw, sh, -anchorX, -sh, sw, sh);
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

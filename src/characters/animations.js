/**
 * Dados de animação — Universe Showdown
 *
 * Este arquivo é a "fonte da verdade" da animação em runtime.
 * O formato é intencionalmente compatível com JSON (ver o template
 * public/assets/characters/knight/knight.json), de modo que quando a
 * arte real existir, o mesmo dado pode vir de um arquivo .json importado
 * pelo Vite sem mudar o código do SpriteAnimator.
 *
 * ATLAS — layout de grade fixa:
 *   frameWidth  / frameHeight : tamanho de cada célula em px.
 *   columns / rows            : dimensões da grade.
 *   Cada estado ocupa células contíguas a partir de (row, col).
 *   x = col * frameWidth, y = row * frameHeight.
 *
 * ESTADOS:
 *   row/col     : célula inicial do estado na atlas.
 *   frames      : quantidade de frames do estado.
 *   fps         : velocidade para estados em loop (idle, walk...).
 *   frameTime   : duração de CADA frame em segundos. Usada nos ataques
 *                 para que a animação inteira dure exatamente a duração
 *                 do golpe no combate (frameTime = duration / frames).
 *   loop        : reinicia ao terminar (só em estados cíclicos).
 *   activeFrom / activeTo : índices de frames "ativos" (frame de contato).
 *                 Devem casar com activeStart/activeEnd de ATTACKS
 *                 (src/fighters/Fighter.js): activeFrom ≈ activeStart/duration*frames.
 */

// Nomes alinhados com public/assets/characters/knight/knight.json:
// o runtime (SpriteAnimator) lê meta.frameWidth / meta.frameHeight.
export const FRAME = { frameWidth: 96, frameHeight: 96 };

// Grade: 19 colunas × 6 linhas → atlas de 1824 × 576 px.
export const ATLAS = {
  ...FRAME,
  columns: 19,
  rows: 6,
  // Ponto de referência dentro da célula: base entre os pés.
  pivotX: 48, // centro horizontal
  pivotY: 96, // linha do chão (base da célula)
};

export const ANIMATION_DATA = {
  meta: { ...ATLAS, image: 'knight.png' },
  states: {
    // ── Fila 0: estados neutros ──────────────────────────────
    idle:        { row: 0, col: 0,  frames: 4,  fps: 8,  loop: true },
    walk:        { row: 0, col: 4,  frames: 6,  fps: 12, loop: true },
    // Corrida: células próprias (10..15) da fila 0 — passada maior, fps alto.
    run:         { row: 0, col: 10, frames: 6,  fps: 20, loop: true },
    // ── Fila 1: estados utilitários ──────────────────────────
    jump:        { row: 1, col: 0,  frames: 2,  fps: 6,  loop: false },
    crouch:      { row: 1, col: 2,  frames: 2,  fps: 8,  loop: true },
    block:       { row: 1, col: 4,  frames: 2,  fps: 8,  loop: false },
    hit:         { row: 1, col: 6,  frames: 3,  fps: 12, loop: false },
    // ── Fila 2..5: ataques (1 estado por linha) ──────────────
    // frameTime = duração do golpe / nº de frames (sincronizado com Fighter.js)
    // activeFrom/To ≈ (activeStart/duration)*frames … (activeEnd/duration)*frames
    lightAttack:  { row: 2, col: 0, frames: 6,  frameTime: 0.28 / 6,  loop: false, activeFrom: 2, activeTo: 3 },
    mediumAttack: { row: 3, col: 0, frames: 11, frameTime: 0.48 / 11, loop: false, activeFrom: 3, activeTo: 5 },
    heavyAttack:  { row: 4, col: 0, frames: 19, frameTime: 0.72 / 19, loop: false, activeFrom: 7, activeTo: 10 },
    kick:         { row: 5, col: 0, frames: 13, frameTime: 0.52 / 13, loop: false, activeFrom: 4, activeTo: 7 },
  },
};

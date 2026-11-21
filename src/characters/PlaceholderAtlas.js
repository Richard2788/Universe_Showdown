/**
 * PlaceholderAtlas — gera uma atlas de sprites em um canvas offscreen,
 * desenhando cada frame de forma procedural (boneco estilizado).
 *
 * O resultado é temporário: quando a arte real existir, a atlas PNG
 * exportada (mesmo layout definido em animations.js) substitui este
 * canvas via SpriteAnimator com uma <img> — nada mais muda.
 */

import { ANIMATION_DATA, ATLAS, FRAME } from './animations.js';

const CELL = FRAME.frameWidth;

/** Desenha um boneco dentro de uma célula 96×96 (pés na base da célula). */
function drawPose(c, baseX, baseY, p, color) {
  const cr = p.crouch ?? 1;
  const hipY = baseY - 30 * cr;
  const shoulderY = baseY - 56 * cr;
  const lean = p.lean ?? 0; // deslocamento horizontal do torso/topo

  c.strokeStyle = '#1b2434'; // contorno
  c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';

  // Pernas (pés na baseY)
  for (const [footX, footY, lw] of [
    [p.backFoot[0], p.backFoot[1], 7],
    [p.frontFoot[0], p.frontFoot[1], 7],
  ]) {
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(baseX + lean * 0.4, hipY);
    c.lineTo(baseX + footX, baseY - footY);
    c.stroke();
  }

  // Torso
  c.lineWidth = 10;
  c.beginPath();
  c.moveTo(baseX, hipY);
  c.lineTo(baseX + lean, shoulderY);
  c.stroke();

  // Braços (ombro no topo do torso)
  const shX = baseX + lean;
  for (const hand of [p.backHand, p.frontHand]) {
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(shX, shoulderY + 4);
    c.lineTo(shX + hand[0], shoulderY + 4 + hand[1]);
    c.stroke();
  }

  // Cabeça
  c.beginPath();
  c.arc(shX + lean * 0.3, shoulderY - 11, 9, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  c.stroke();
}

/** Curva de extensão do golpe: sobe até o frame ativo, mantém, recolhe. */
function extension(i, n, activeFrom, activeTo) {
  if (i < activeFrom) return i / Math.max(1, activeFrom);
  if (i <= activeTo) return 1;
  return Math.max(0, 1 - (i - activeTo) / Math.max(1, n - 1 - activeTo));
}

/** Retorna os parâmetros de pose do frame `i` do `state`. */
function poseFor(state, i, s) {
  const n = s.frames;
  const P = (over = {}) => ({
    crouch: 1, lean: 0,
    frontFoot: [8, 0], backFoot: [-8, 0],
    frontHand: [10, 12], backHand: [-8, 12],
    ...over,
  });

  switch (state) {
    case 'idle': {
      const bob = Math.sin((i / n) * Math.PI * 2) * 0.03;
      return P({ crouch: 1 + bob, frontHand: [9, 12], backHand: [-9, 12] });
    }
    case 'walk': {
      const ph = (i / n) * Math.PI * 2;
      const swing = Math.sin(ph);
      return P({
        frontFoot: [swing * 16, Math.max(0, swing) * 4],
        backFoot: [-swing * 16, Math.max(0, -swing) * 4],
        frontHand: [6 - swing * 8, 12], backHand: [-6 + swing * 8, 12],
      });
    }
    case 'run': {
      // Corrida: torso inclinado (lean 5), passada maior e joelho mais alto.
      const ph = (i / n) * Math.PI * 2;
      const swing = Math.sin(ph);
      return P({
        lean: 5,
        frontFoot: [swing * 24, Math.max(0, swing) * 8],
        backFoot: [-swing * 24, Math.max(0, -swing) * 8],
        frontHand: [4 - swing * 14, 8], backHand: [-2 + swing * 14, 6],
      });
    }
    case 'jump':
      return i === 0
        ? P({ frontFoot: [10, 14], backFoot: [-10, 14], frontHand: [12, -8], backHand: [-10, -4] })
        : P({ frontFoot: [16, 6], backFoot: [-14, 10], frontHand: [14, -4], backHand: [-12, 2] });
    case 'crouch':
      return P({ crouch: 0.72, frontFoot: [14, 0], backFoot: [-14, 0], frontHand: [12, 16], backHand: [-10, 16] });
    case 'block':
      return P({ crouch: 0.94, lean: 2, frontHand: [16, -4], backHand: [12, 2] });
    case 'hit': {
      const k = i / (n - 1);
      return P({ lean: -6 - k * 4, frontFoot: [10, 0], backFoot: [-12, 2], frontHand: [4 - k * 4, 8], backHand: [-14 - k * 4, 8] });
    }
    default: {
      // Ataques: braço/perna projetados para frente conforme a extensão.
      const e = extension(i, n, s.activeFrom ?? 1, s.activeTo ?? n - 1);
      const reach = { lightAttack: 30, mediumAttack: 38, heavyAttack: 44, kick: 40 }[state] ?? 30;
      const dy = state === 'kick' ? 26 : -2; // chute sai da altura do quadril
      const legLift = state === 'kick' ? (1 - e) * 10 : 0;
      return P({
        lean: e * 6,
        frontFoot: state === 'kick' ? [8 + e * reach, -legLift] : [10 + e * 6, 0],
        backFoot: state === 'kick' ? [-10, 0] : [-12, 0],
        frontHand: state === 'kick' ? [8, 6] : [6 + e * reach, dy + e * 2],
        backHand: [-10 - e * 4, 10],
      });
    }
  }
}

/**
 * Constrói a atlas placeholder.
 * @param {string} color cor do personagem (cabeça)
 * @param {object} [data] dados de animação (padrão: ANIMATION_DATA)
 * @returns {HTMLCanvasElement} canvas com a atlas desenhada
 */
export function buildPlaceholderAtlas(color = '#9aabc4', data = ANIMATION_DATA) {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS.columns * FRAME.frameWidth;   // 1824
  canvas.height = ATLAS.rows * FRAME.frameHeight;    // 576
  const c = canvas.getContext('2d');

  for (const [state, s] of Object.entries(data.states)) {
    for (let i = 0; i < s.frames; i++) {
      const x = (s.col + i) * FRAME.frameWidth;
      const y = s.row * FRAME.frameHeight;
      c.save();
      c.beginPath();
      c.rect(x, y, FRAME.frameWidth, FRAME.frameHeight);
      c.clip();
      drawPose(c, x + ATLAS.pivotX, y + ATLAS.pivotY - 4, poseFor(state, i, s), color);
      // Frames ativos marcados com um tick no topo (auxílio visual de depuração)
      if (i >= (s.activeFrom ?? -1) && i <= (s.activeTo ?? -2)) {
        c.fillStyle = '#51e3e8';
        c.fillRect(x + FRAME.frameWidth / 2 - 6, y + 4, 12, 3);
      }
      c.restore();
    }
  }
  return canvas;
}

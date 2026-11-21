/**
 * Espelhamento: âncora por frame (anchorX) no SpriteAnimator e integridade
 * dos frameAnchors do Plasmo.
 *
 * 5 checks. Contrato da decisão "âncora por frame em todos os estados":
 * o draw usa -anchorX (frameAnchors[i] → anchorX → pivotX), então o
 * `scale(face, 1)` gira em torno do CORPO — o sprite não desliza ao virar.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SpriteAnimator } from '../src/rendering/SpriteAnimator.js';
import { PLASMO_DATA } from '../src/characters/Plasmo.js';

const mkData = (stateExtra = {}) => ({
  meta: { frameWidth: 96, frameHeight: 96, pivotX: 48, pivotY: 96, columns: 19 },
  states: {
    idle: { row: 0, col: 0, frames: 3, fps: 8, loop: true, ...stateExtra },
  },
});

describe('SpriteAnimator — âncora do desenho', () => {
  it('frameAnchors[frameIndex] tem prioridade sobre o pivô da célula', () => {
    const a = new SpriteAnimator({}, mkData({ frameAnchors: [40, 41, 42] }));
    a.frameIndex = 1;
    assert.equal(a.getFrameRect().anchorX, 41);
    a.frameIndex = 2;
    assert.equal(a.getFrameRect().anchorX, 42);
  });

  it('sem frameAnchors: cai para anchorX do estado e depois para pivotX', () => {
    const withAnchor = new SpriteAnimator({}, mkData({ anchorX: 30 }));
    assert.equal(withAnchor.getFrameRect().anchorX, 30);
    const onlyPivot = new SpriteAnimator({}, mkData());
    assert.equal(onlyPivot.getFrameRect().anchorX, 48);
  });

  it('draw ancora em -anchorX (vira em torno do corpo, não do centro)', () => {
    const a = new SpriteAnimator({ fake: true }, mkData({ frameAnchors: [40, 41, 42] }));
    a.frameIndex = 2; // âncora 42
    const draws = [];
    const ctx = {
      save() {}, restore() {}, translate() {}, scale() {},
      drawImage(...args) { draws.push(args); },
    };
    a.draw(ctx, 100, 200, -1, 1); // face -1: espelha
    assert.equal(draws.length, 1);
    assert.equal(draws[0][5], -42); // dx = -anchorX (dentro do scale(-1,1))
  });
});

describe('Plasmo — integridade dos frameAnchors', () => {
  it('todo estado tem frameAnchors com 1 âncora por frame', () => {
    for (const [name, s] of Object.entries(PLASMO_DATA.states)) {
      assert.ok(Array.isArray(s.frameAnchors), `${name}: falta frameAnchors`);
      assert.equal(s.frameAnchors.length, s.frames,
        `${name}: frameAnchors (${s.frameAnchors.length}) ≠ frames (${s.frames})`);
      for (const anchor of s.frameAnchors) {
        assert.ok(anchor >= 0 && anchor < (s.frameWidth ?? PLASMO_DATA.meta.frameWidth),
          `${name}: âncora ${anchor} fora da célula`);
      }
    }
    // O pulo é a prova de que a âncora POR FRAME importa: o centro de massa
    // varia dezenas de px entre frames (célula de 161 px).
    const jump = PLASMO_DATA.states.jump.frameAnchors;
    assert.ok(Math.max(...jump) - Math.min(...jump) > 20,
      'jump: âncoras devem variar bastante entre frames');
  });

  it('estado run reutiliza walk.png com fps maior e as mesmas âncoras', () => {
    const { run, walk } = PLASMO_DATA.states;
    assert.equal(run.image, 'walk.png');
    assert.deepEqual(run.frameAnchors, walk.frameAnchors);
    assert.ok(run.fps > walk.fps, 'run deve tocar mais rápido que o walk');
  });
});

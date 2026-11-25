/**
 * Sable — kit, arte e sincronia (Fases 1 e 2 do plano).
 *
 * Contrato: a personagem usa as atlas REAIS de
 * public/assets/characters/sable/ em células 192×192 (uma fileira por
 * estado), com timings de ataque derivados de ATTACKS pela mesma fórmula
 * do Plasmo e substituições explícitas onde a fonte não tem arte. Nada
 * aqui altera números de combate — o kit de golpes continua o padrão até
 * a Fase 3 criar SABLE_ATTACKS.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PHASES } from '../src/config/match.js';
import { ROSTER } from '../src/characters/roster.js';
import { Fighter, ATTACKS, BLOCK_ANIM } from '../src/fighters/Fighter.js';
import { SABLE_JUMP_ANIM, SABLE_BLOCK_ANIM } from '../src/characters/Sable.js';
import { DT } from './helpers.mjs';

const CELL = 192;
const kit = ROSTER.sable;

/** Lê o IHDR de um PNG: { width, height } — sem dependência externa. */
function pngSize(path) {
  const buf = readFileSync(path);
  assert.equal(buf.readUInt32BE(12), 0x49484452, `${path}: não é PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const assetPath = (image) =>
  fileURLToPath(new URL(`../public/assets/characters/${kit.folder}/${image}`, import.meta.url));

describe('Sable — kit e campanha', () => {
  it('é a adversária da terceira fase', () => {
    assert.equal(PHASES[2].id, 'sable');
    assert.equal(PHASES[2].character, 'sable');
    assert.equal(PHASES[2].name, ROSTER.sable.label);
  });

  it('tem uma atlas PNG de célula 192×192 para cada estado usado pelo Fighter', () => {
    const states = ['idle', 'walk', 'run', 'jump', 'crouch', 'block', 'hit',
      'lightAttack', 'mediumAttack', 'heavyAttack', 'kick'];
    for (const name of states) {
      const state = kit.data.states[name];
      assert.ok(state, `estado ${name} ausente de SABLE_DATA`);
      const path = assetPath(state.image);
      assert.ok(existsSync(path), `atlas ausente: ${state.image}`);
      const { width, height } = pngSize(path);
      assert.equal(height, CELL, `${state.image}: altura ≠ ${CELL}`);
      assert.equal(width, state.frames * CELL,
        `${state.image}: largura ${width} ≠ frames (${state.frames}) × ${CELL}`);
    }
  });

  it('kick substitui explicitamente a arte do heavyAttack (sem chute na fonte)', () => {
    const { kick, heavyAttack } = kit.data.states;
    assert.equal(kick.image, heavyAttack.image);
    assert.equal(kick.frames, heavyAttack.frames);
    assert.deepEqual(kick.frameAnchors, heavyAttack.frameAnchors,
      'mesma arte ⇒ mesmas âncoras');
  });
});

describe('Sable — sincronia com ATTACKS (fórmula do Plasmo)', () => {
  const ATTACK_STATES = ['lightAttack', 'mediumAttack', 'heavyAttack', 'kick'];

  it('frameTime × frames = duração do golpe e janela ativa no frame certo', () => {
    for (const name of ATTACK_STATES) {
      const state = kit.data.states[name];
      const atk = ATTACKS[name];
      assert.ok(Math.abs(state.frameTime * state.frames - atk.duration) < 1e-9,
        `${name}: frameTime (${state.frameTime}) × frames (${state.frames}) ≠ duração (${atk.duration})`);
      // Janela ativa em frames, derivada dos SEGUNDOS do combate — mesma
      // regra que reproduz todos os valores de src/characters/Plasmo.js:
      //   activeFrom = floor(activeStart/frameTime)  (frame em que começa)
      //   activeTo   = ceil(activeEnd/frameTime) - 1  (último frame com tempo
      //     > activeStart; activeEnd é EXCLUSIVO: 0.39 s = início do frame
      //     seguinte ⇒ kick termina no frame 2 e não no 3)
      // O ε absorve erro de ponto flutuante (0.39/0.13 = 3.0000…1).
      const EPS = 1e-9;
      const from = Math.max(0, Math.floor(atk.activeStart / state.frameTime + EPS));
      const to = Math.max(0, Math.min(state.frames - 1,
        Math.ceil(atk.activeEnd / state.frameTime - EPS) - 1));
      assert.equal(state.activeFrom, from,
        `${name}: activeFrom fora da janela de dano`);
      assert.equal(state.activeTo, to,
        `${name}: activeTo fora da janela de dano`);
      assert.ok(state.activeFrom <= state.activeTo, `${name}: janela invertida`);
    }
  });

  it('pulo: o tempo de ar do kit cobre o voo REAL da física e sobra frame de pouso', () => {
    // Mede o voo com o próprio Fighter (sem número mágico): impulso → chão.
    const f = new Fighter(100, '#fff', 1, {});
    const opp = new Fighter(300, '#fff', -1, {});
    f.update(DT, { jump: true }, opp);
    let airSteps = 0;
    let airborne = f.y !== 0;
    for (let i = 0; i < 400; i++) {
      if (airborne && f.y === 0) break; // pousou
      if (f.y !== 0) { airborne = true; airSteps++; }
      f.update(DT, {}, opp);
    }
    assert.ok(airborne && airSteps > 0, 'o impulso não tirou o lutador do chão');
    const airSeconds = airSteps * DT;
    assert.ok(
      Math.abs(SABLE_JUMP_ANIM.airFrames * SABLE_JUMP_ANIM.frameTime - airSeconds) < 0.03,
      `ar do kit (${(SABLE_JUMP_ANIM.airFrames * SABLE_JUMP_ANIM.frameTime).toFixed(3)} s) `
      + `≠ voo medido (${airSeconds.toFixed(3)} s)`,
    );
    assert.ok(SABLE_JUMP_ANIM.frames > SABLE_JUMP_ANIM.airFrames,
      'sem frame de pouso após o voo');
    assert.equal(SABLE_JUMP_ANIM.frames, kit.data.states.jump.frames,
      'frames do kit ≠ frames do estado jump');
  });

  it('block: reação com a MESMA duração do kit padrão (sem vantagem de recuperação)', () => {
    const sable = SABLE_BLOCK_ANIM.frames * SABLE_BLOCK_ANIM.frameTime;
    const padrao = BLOCK_ANIM.frames * BLOCK_ANIM.frameTime;
    assert.ok(Math.abs(sable - padrao) < 1e-12,
      `reação da Sable (${sable} s) ≠ reação padrão (${padrao} s)`);
    assert.equal(SABLE_BLOCK_ANIM.frames, kit.data.states.block.frames,
      'frames do kit ≠ frames do estado block');
  });
});

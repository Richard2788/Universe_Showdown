/**
 * Gatilho do efeito visual de bloqueio (blockFx) — só em block real.
 *
 * 8 checks. O efeito é estado de simulação (`Fighter.blockFx`), por isso é
 * testável sem canvas: o renderer apenas desenha o que o timer indicar.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mk, step, resolve } from './helpers.mjs';

describe('efeito de impacto de bloqueio', () => {
  it('block de médio dispara o efeito (0.28 s)', () => {
    const { d } = resolve('mediumAttack', { right: true });
    assert.equal(d.blockFx, 0.28);
  });

  it('o efeito aponta para o lado do atacante (atacante à esquerda = -1)', () => {
    const { d } = resolve('mediumAttack', { right: true });
    assert.equal(d.blockFxSide, -1);
  });

  it('block do forte também dispara o efeito', () => {
    const { d } = resolve('heavyAttack', { right: true });
    assert.ok(d.blockFx > 0.2);
  });

  it('o efeito decai sozinho até zero', () => {
    const { d } = resolve('heavyAttack', { right: true });
    for (let i = 0; i < 20; i++) step(d, { right: true }, mk(300));
    assert.equal(d.blockFx, 0);
  });

  it('acerto normal NÃO dispara o efeito', () => {
    const { d } = resolve('mediumAttack', {});
    assert.equal(d.blockFx, 0);
  });

  it('chute furando o block em pé NÃO dispara o efeito', () => {
    const { d } = resolve('kick', { right: true });
    assert.equal(d.blockFx, 0);
  });

  it('whiff alto sobre o agachado NÃO dispara o efeito', () => {
    const { d } = resolve('lightAttack', { crouch: true });
    assert.equal(d.blockFx, 0);
  });

  it('block agachado de chute dispara o efeito', () => {
    const { d } = resolve('kick', { right: true, crouch: true });
    assert.ok(d.blockFx > 0.25);
  });
});

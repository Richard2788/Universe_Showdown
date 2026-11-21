/**
 * Knockback realista: forte e chute arremessam; leve/médio não deslocam.
 *
 * 12 checks. O impulso vive na física (`Fighter.kbVx`), decai por atrito
 * (1200 px/s²) e não é substituído pelo input durante o hitstun.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mk, step, ATTACKS, DT } from './helpers.mjs';

/**
 * Atacante à esquerda (300); alvo recebe o golpe sem defesa e desliza para a
 * DIREITA (+x). Retorna o impulso lido no frame do contato e o estado após
 * 90 frames (1,5 s) de deslize.
 */
function hitAndSlide(atk, dStartX = 330) {
  const a = mk(300), d = mk(dStartX);
  step(a, { [atk]: true }, d);
  const frames = Math.round(ATTACKS[atk].activeStart / DT);
  for (let i = 0; i < frames; i++) { step(a, {}, d); step(d, {}, a); }
  step(a, {}, d); // frame do contato
  const kb0 = d.kbVx, x0 = d.x;
  for (let i = 0; i < 90; i++) { step(a, {}, d); step(d, {}, a); }
  return { a, d, kb0, x0 };
}

describe('knockback', () => {
  it('forte: impulso inicial 340', () => {
    const { kb0 } = hitAndSlide('heavyAttack');
    assert.equal(kb0, 340);
  });

  it('forte: direção para longe do atacante (+x)', () => {
    const { kb0 } = hitAndSlide('heavyAttack');
    assert.ok(kb0 > 0);
  });

  it('forte: desliza bastante (x > 380)', () => {
    const { d } = hitAndSlide('heavyAttack');
    assert.ok(d.x > 380);
  });

  it('forte: atrito zera a velocidade', () => {
    const { d } = hitAndSlide('heavyAttack');
    assert.equal(d.kbVx, 0);
  });

  it('chute: impulso inicial ~240 (decay de 1 frame tolerado)', () => {
    const { kb0 } = hitAndSlide('kick');
    assert.ok(kb0 > 200);
  });

  it('chute: também desliza para longe', () => {
    const { d } = hitAndSlide('kick');
    assert.ok(d.x > 350);
  });

  it('chute: para com o tempo', () => {
    const { d } = hitAndSlide('kick');
    assert.equal(d.kbVx, 0);
  });

  it('leve: sem knockback', () => {
    const { d, kb0, x0 } = hitAndSlide('lightAttack');
    assert.equal(kb0, 0);
    assert.equal(x0, 330);
    assert.equal(d.kbVx, 0);
  });

  it('médio: sem knockback', () => {
    const { d, kb0 } = hitAndSlide('mediumAttack');
    assert.equal(kb0, 0);
    assert.equal(d.x, 330);
  });

  it('forte bloqueado: sem knockback (kbVx 0)', () => {
    const a = mk(300), d = mk(330);
    step(a, { heavyAttack: true }, d);
    const frames = Math.round(ATTACKS.heavyAttack.activeStart / DT);
    for (let i = 0; i < frames; i++) { step(a, {}, d); step(d, { right: true }, a); }
    step(a, {}, d);
    assert.equal(d.kbVx, 0);
  });

  it('forte bloqueado: recuo = caminhada + empurrão do block', () => {
    const a = mk(300), d = mk(330);
    step(a, { heavyAttack: true }, d);
    const frames = Math.round(ATTACKS.heavyAttack.activeStart / DT);
    for (let i = 0; i < frames; i++) { step(a, {}, d); step(d, { right: true }, a); }
    step(a, {}, d);
    // Antes: limiar 40 (caminhada ~40 já passava sozinha). Com o empurrão do
    // forte em 46 px, o recuo passa a ser ~86 px — limiar 70 isola o pushback.
    assert.ok(d.x > 330 + 70);
  });

  it('knockback domina o movimento durante o hitstun', () => {
    const a = mk(300), d = mk(330);
    step(a, { kick: true }, d);
    const frames = Math.round(ATTACKS.kick.activeStart / DT);
    for (let i = 0; i < frames; i++) { step(a, {}, d); step(d, {}, a); }
    step(a, {}, d);
    const xStun = d.x;
    for (let i = 0; i < 10; i++) { step(a, {}, d); step(d, { right: true }, a); }
    assert.ok(d.x > xStun + 10);
  });
});

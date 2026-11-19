/**
 * Balanceamento: acerto por altura (maxTargetY) e alcance do forte.
 *
 * 5 checks. Fonte dos números: `ATTACKS` em src/fighters/Fighter.js —
 * NÃO alterar valores para "fazer o teste passar". Mudança de balanceamento
 * exige justificativa, autorização e regressão completa.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Fighter, ATTACKS, DT } from './helpers.mjs';

const fighter = (x = 300) => new Fighter(x, '#fff', 1, { hurtboxHalfWidth: 35 });

// Inicia o golpe via actions (como o teclado/CPU fazem), ajusta o elapsed
// para o início da janela ativa e roda um passo de física/update.
function hit(atk, oy) {
  const a = fighter(), d = fighter(360);
  a.update(DT, { [atk]: true }, d); // dispara o golpe (no chão)
  a.attack.elapsed = ATTACKS[atk].activeStart;
  d.y = oy;                          // altura do alvo
  d.vy = 0;
  a.update(DT, {}, d);
  return d.health < 100;
}

describe('altura dos golpes (maxTargetY)', () => {
  it('leve acerta no chão e não acerta no ar (y=100 = 90)', () => {
    assert.equal(hit('lightAttack', 0), true);
    assert.equal(hit('lightAttack', 100), false);
  });

  it('médio acerta no chão e não acerta no ar (y=100 > 90)', () => {
    assert.equal(hit('mediumAttack', 0), true);
    assert.equal(hit('mediumAttack', 100), false);
  });

  it('chute acerta no chão e não acerta no ar (y=100 > 90)', () => {
    assert.equal(hit('kick', 0), true);
    assert.equal(hit('kick', 100), false);
  });

  it('forte acerta chão e pulo baixo (y=100), não acerta pulo alto (y=140)', () => {
    assert.equal(hit('heavyAttack', 0), true);
    assert.equal(hit('heavyAttack', 100), true);
    assert.equal(hit('heavyAttack', 140), false);
  });

  it('forte alcança 96 + meia-hurtbox do alvo (dist 130)', () => {
    const a = fighter(), d = fighter(300 + 96 + 34); // 96 + 34 < 96 + 35 → acerta
    a.update(DT, { heavyAttack: true }, d);
    a.attack.elapsed = ATTACKS.heavyAttack.activeStart;
    a.update(DT, {}, d);
    assert.equal(d.health < 100, true);
  });
});

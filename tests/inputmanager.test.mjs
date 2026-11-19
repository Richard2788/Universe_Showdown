/**
 * Contrato do InputManager extraído do `Game.js` na Etapa 1.
 *
 * A regra importante: uma ação só fica inativa quando NENHUMA fonte a segura
 * (teclado + touch no mesmo botão, por exemplo). Antes essa lógica vivia
 * embutida no Game e não tinha teste próprio.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InputManager } from '../src/core/InputManager.js';

describe('InputManager', () => {
  it('ação é inativa por padrão', () => {
    const input = new InputManager();
    assert.equal(input.actions.left, undefined);
  });

  it('liga e desliga uma ação por fonte', () => {
    const input = new InputManager();
    input.set('left', true, 'keyboard');
    assert.equal(input.actions.left, true);
    input.set('left', false, 'keyboard');
    assert.equal(input.actions.left, false);
  });

  it('duas fontes: só desliga quando a última solta', () => {
    const input = new InputManager();
    input.set('kick', true, 'keyboard');
    input.set('kick', true, 'touch');
    input.set('kick', false, 'keyboard');
    assert.equal(input.actions.kick, true); // touch ainda segura
    input.set('kick', false, 'touch');
    assert.equal(input.actions.kick, false);
  });

  it('fontes não vazam entre ações diferentes', () => {
    const input = new InputManager();
    input.set('left', true, 'keyboard');
    input.set('right', true, 'touch');
    input.set('left', false, 'keyboard');
    assert.equal(input.actions.left, false);
    assert.equal(input.actions.right, true);
  });

  it('clear solta todas as ações e fontes', () => {
    const input = new InputManager();
    input.set('left', true, 'keyboard');
    input.set('jump', true, 'touch');
    input.clear();
    assert.equal(Object.keys(input.actions).length, 0);
    assert.equal(input.sources.size, 0);
  });
});

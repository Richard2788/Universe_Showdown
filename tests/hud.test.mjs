/**
 * Paridade do HUD extraído do `Game.js` (Etapa 1).
 *
 * Usa um DOM falso mínimo — o HUD só lê estado e escreve `textContent`/`style`,
 * então não é preciso canvas nem navegador para garantir o mesmo comportamento.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HUD } from '../src/ui/HUD.js';

function makeHUD() {
  const elements = Object.create(null);
  const root = {
    querySelector(selector) {
      elements[selector] ??= { style: {}, textContent: '' };
      return elements[selector];
    },
  };
  return { hud: new HUD(root), elements };
}

describe('HUD', () => {
  it('sync escreve vida, rótulos numéricos e status READY', () => {
    const { hud, elements } = makeHUD();
    hud.sync({ health: 72.4 }, { health: 100 });
    assert.equal(elements['#player-health'].style.width, '72.4%');
    assert.equal(elements['#enemy-health'].style.width, '100%');
    assert.equal(elements['#player-health-label'].textContent, 73);
    assert.equal(elements['#enemy-health-label'].textContent, 100);
    assert.equal(elements['#status'].textContent, 'READY');
  });

  it('sync troca para ROUND END quando alguém zera a vida', () => {
    const { hud, elements } = makeHUD();
    hud.sync({ health: 0 }, { health: 35 });
    assert.equal(elements['#status'].textContent, 'ROUND END');
    assert.equal(elements['#player-health-label'].textContent, 0);
  });

  it('rótulos do modo pvc: PLAYER 01 vs CPU · dificuldade', () => {
    const { hud, elements } = makeHUD();
    hud.setMatchLabels('pvc', 'FÁCIL');
    assert.equal(elements['#player-label'].textContent, 'PLAYER 01');
    assert.equal(elements['#enemy-label'].textContent, 'CPU · FÁCIL');
  });

  it('rótulos do modo cvc: CPU 01/02 · dificuldade', () => {
    const { hud, elements } = makeHUD();
    hud.setMatchLabels('cvc', 'MÉDIO');
    assert.equal(elements['#player-label'].textContent, 'CPU 01 · MÉDIO');
    assert.equal(elements['#enemy-label'].textContent, 'CPU 02 · MÉDIO');
  });

  it('no menu, atalho de dificuldade não escreve rótulo', () => {
    const { hud, elements } = makeHUD();
    elements['#enemy-label'].textContent = 'INTACTO';
    hud.setDifficultyLabel('menu', 'DIFÍCIL');
    assert.equal(elements['#enemy-label'].textContent, 'INTACTO');
  });

  it('em partida pvc, atalho atualiza só o rótulo da CPU', () => {
    const { hud, elements } = makeHUD();
    elements['#player-label'].textContent = 'PLAYER 01';
    hud.setDifficultyLabel('pvc', 'DIFÍCIL');
    assert.equal(elements['#enemy-label'].textContent, 'CPU · DIFÍCIL');
    assert.equal(elements['#player-label'].textContent, 'PLAYER 01');
  });

  it('em partida cvc, atalho atualiza os dois rótulos', () => {
    const { hud, elements } = makeHUD();
    hud.setMatchLabels('cvc', 'FÁCIL');
    hud.setDifficultyLabel('cvc', 'DIFÍCIL');
    assert.equal(elements['#player-label'].textContent, 'CPU 01 · DIFÍCIL');
    assert.equal(elements['#enemy-label'].textContent, 'CPU 02 · DIFÍCIL');
  });
});

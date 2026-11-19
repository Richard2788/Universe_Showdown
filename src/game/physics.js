/**
 * Física pura do combate: separação de corpos e virada de face.
 *
 * Extraída do Game.js sem mudança de comportamento para facilitar testes
 * de regressão (locomotion.test.mjs). Não depende de canvas ou DOM.
 */

/**
 * Separa dois lutadores para que as hurtboxes não se sobreponham.
 * Só aplica quando AMBOS estão no chão (y === 0): no ar, o pulo
 * atravessa o oponente por cima.
 *
 * @param {object} a lutador A
 * @param {object} b lutador B
 */
export function separateBodies(a, b) {
  if (a.y !== 0 || b.y !== 0) return; // no ar, permite sobreposição
  const distance = b.x - a.x;
  const minDistance = a.hurtbox.halfWidth + b.hurtbox.halfWidth;
  if (Math.abs(distance) < minDistance) {
    const overlap = minDistance - Math.abs(distance);
    const direction = Math.sign(distance) || 1;
    a.x -= overlap * direction * 0.5;
    b.x += overlap * direction * 0.5;
  }
}

/**
 * Atualiza a face (1 = direita, -1 = esquerda) de cada lutador para
 * encarar o oponente. Chamado todo frame após o movimento.
 *
 * @param {object} player jogador
 * @param {object} enemy oponente
 */
export function updateFaces(player, enemy) {
  player.face = enemy.x >= player.x ? 1 : -1;
  enemy.face = -player.face;
}

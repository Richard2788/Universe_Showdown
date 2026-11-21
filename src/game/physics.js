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
 * `keepFixed` (opcional) = quem NÃO se move: quando alguém aterrissa
 * em cima do oponente (Game.update passa o de baixo), a sobreposição
 * inteira é resolvida empurrando só o de cima — o x de quem estava
 * embaixo fica fixo e a aterrissagem não desliza o oponente.
 * Sem `keepFixed` (ou com os dois lutadores "solto"), metade da
 * correção vai para cada um (comportamento de sempre).
 *
 * @param {object} a lutador A
 * @param {object} b lutador B
 * @param {object} [options]
 * @param {object|null} [options.keepFixed] lutador que permanece fixo
 */
export function separateBodies(a, b, { keepFixed = null } = {}) {
  if (a.y !== 0 || b.y !== 0) return; // no ar, permite sobreposição
  const distance = b.x - a.x;
  const minDistance = a.hurtbox.halfWidth + b.hurtbox.halfWidth;
  if (Math.abs(distance) < minDistance) {
    const overlap = minDistance - Math.abs(distance);
    const direction = Math.sign(distance) || 1;
    if (keepFixed === a) {
      b.x += overlap * direction; // só o de cima (b) sai de cima do fixo (a)
    } else if (keepFixed === b) {
      a.x -= overlap * direction; // só o de cima (a) sai de cima do fixo (b)
    } else {
      a.x -= overlap * direction * 0.5;
      b.x += overlap * direction * 0.5;
    }
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

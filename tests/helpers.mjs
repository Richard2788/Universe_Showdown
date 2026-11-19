/**
 * Helpers dos testes de sanidade do combate.
 *
 * Regra do projeto (CONTEXTO-DE-PRODUCAO / decisões de arquitetura):
 * estes testes são o CONTRATO de regressão dos sistemas já validados. Não
 * ajustar números de balanceamento para "fazer o teste passar": se o
 * comportamento mudar de propósito, justificar e atualizar o teste junto.
 */
import { Fighter, ATTACKS } from '../src/fighters/Fighter.js';

export { Fighter, ATTACKS };

/** Passo fixo da simulação (60 Hz), igual ao GameLoop. */
export const DT = 1 / 60;

/** Lutador de teste na posição x, com a hurtbox padrão atual (35). */
export const mk = (x) => new Fighter(x, '#fff', 1, { hurtboxHalfWidth: 35 });

/** Um passo fixo de simulação do lutador `f` contra o oponente `opponent`. */
export const step = (f, actions, opponent) => f.update(DT, actions, opponent);

/**
 * Simula um golpe contra um defensor com a postura dada, SEM alterar números:
 * dispara o golpe na borda de subida, avança até a janela ativa e aplica o
 * frame de contato.
 *
 * Convenção: o atacante fica à ESQUERDA (x=300); portanto "recuar" para o
 * defensor = segurar `right`. A separação de corpos (35 px, como o Game.js
 * faz) evita que o defensor atravesse o atacante.
 *
 * @returns {{a: Fighter, d: Fighter, dStartX: number}}
 */
export function resolve(atk, dActions, dStartX = 330) {
  const a = mk(300), d = mk(dStartX);
  step(a, { [atk]: true }, d); // dispara o golpe
  const frames = Math.round(ATTACKS[atk].activeStart / DT);
  for (let i = 0; i < frames; i++) {
    step(a, {}, d); step(d, dActions, a);
    // Separação de corpos (como o Game.js faz): hurtboxes não se atravessam.
    const min = 35;
    if (Math.abs(d.x - a.x) < min) d.x = a.x + Math.sign(d.x - a.x || 1) * min;
  }
  step(a, {}, d); // frame do contato
  return { a, d, dStartX };
}

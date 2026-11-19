/**
 * Configuração global da simulação e da arena.
 *
 * Valores extraídos SEM alteração do `Game.js` (Etapa 1). Qualquer mudança
 * aqui afeta o balanceamento/física já validado: exige justificativa,
 * autorização e regressão completa (`npm test`).
 */

/** Resolução lógica da arena (o canvas é escalado mantendo a proporção). */
export const WIDTH = 960;
export const HEIGHT = 540;

/** Passo fixo da simulação (60 Hz), independente da taxa de render. */
export const STEP = 1 / 60;

/** Teto do delta por frame: evita espiral da morte após aba em segundo plano. */
export const MAX_FRAME_DELTA = 0.1;

/** Margem lateral da arena: ninguém ultrapassa esta distância da borda. */
export const STAGE_MARGIN = 55;

/** Posições iniciais dos lutadores no round. */
export const PLAYER_SPAWN_X = 300;
export const ENEMY_SPAWN_X = 660;

/** Velocidade de caminhada (px/s). Metade do valor original (250 px/s). */
export const WALK_SPEED = 125;

/** Velocidade de corrida (px/s). 2× a caminhada, só para frente. */
export const RUN_SPEED = 250;

/** `?debug=1` (qualquer valor) liga o overlay de depuração. */
export function isDebugEnabled(search = window.location.search) {
  return new URLSearchParams(search).has('debug');
}

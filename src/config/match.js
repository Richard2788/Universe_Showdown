/**
 * Configuração da campanha: fases, rounds, cronômetro e pontuação.
 *
 * Módulo puro (sem DOM) para que as regras possam ser testadas em Node.
 * A ordem de PHASES é a ordem da campanha; cada fase troca o oponente,
 * a paleta/tamanho do personagem, o perfil da IA e o tempo do round.
 */

/** Rounds necessários para vencer uma fase (melhor de 3). */
export const ROUNDS_TO_WIN = 2;

/** Durações dos estados de transição (segundos). */
export const MATCH_TIMINGS = Object.freeze({
  roundIntro: 1.4, // "ROUND N" antes de liberar o combate
  roundEnd: 2.2,   // resultado do round antes do próximo/resumo
});

/**
 * Regras de pontuação. Os valores são multiplicadores/constantes, não
 * balanceamento de combate — ajustar aqui não altera dano nem alcance.
 */
export const SCORE_RULES = Object.freeze({
  roundWin: 1000,      // base por vencer um round
  roundLoss: 150,      // consolação por round perdido
  koBonus: 300,        // vitória por nocaute
  timeoutBonus: 100,   // vitória por tempo
  healthPoint: 10,     // pontos por ponto de vida restante (vitória)
  timePoint: 5,        // pontos por segundo restante (vitória)
  perfectRound: 750,   // round vencido sem levar dano
  damagePoint: 2,      // pontos por dano causado (mesmo perdendo o round)
  phaseClear: 2500,    // bônus por concluir a fase
  phaseStep: 500,      // bônus extra por índice de fase
  phasePerfect: 1500,  // fase vencida por 2 × 0
  drawRound: 500,      // round empatado no tempo
});

/**
 * As 5 fases da campanha.
 *
 * - `ai`      → chave de DIFFICULTIES (src/ai/CPUController.js)
 * - `health`  → vida máxima do oponente
 * - `timeLimit` → segundos do round (pressão cresce fase a fase)
 * - `renderScale`/`color` → diferenciação visual do placeholder
 */
export const PHASES = Object.freeze([
  {
    id: 'sentinela',
    name: 'SENTINELA',
    title: 'Guardião do Setor 07',
    color: '#ff638c',
    ai: 'facil',
    health: 100,
    renderScale: 1,
    timeLimit: 60,
  },
  {
    id: 'volt',
    name: 'VOLT',
    title: 'Velocista de Íon',
    color: '#ffd866',
    ai: 'medio',
    health: 110,
    renderScale: 0.92,
    timeLimit: 60,
  },
  {
    id: 'kronos',
    name: 'KRONOS',
    title: 'Sentinela do Tempo',
    color: '#8d8aff',
    ai: 'dificil',
    health: 125,
    renderScale: 1.12,
    timeLimit: 55,
  },
  {
    id: 'nemesis',
    name: 'NÊMESIS',
    title: 'Executor de Elite',
    color: '#ff9a63',
    ai: 'elite',
    health: 140,
    renderScale: 1.22,
    timeLimit: 50,
  },
  {
    id: 'omega',
    name: 'ÔMEGA',
    title: 'Ameaça Final',
    color: '#ff4d6d',
    ai: 'lendario',
    health: 160,
    renderScale: 1.35,
    timeLimit: 45,
  },
]);

/** Número de fases da campanha (útil na UI). */
export const PHASE_COUNT = PHASES.length;

/** Formata o relógio do round: 60 → "60", 9.2 → "10", 0 → "00". */
export function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return String(total).padStart(2, '0');
}

/** Formata a pontuação com zeros à esquerda: 450 → "000450". */
export function formatScore(score) {
  return String(Math.max(0, Math.round(score))).padStart(6, '0');
}

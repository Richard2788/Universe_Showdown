/**
 * roster.js — registro de personagens com arte/kit próprios.
 *
 * Cada entrada ("kit") reúne TUDO que identifica um personagem no runtime:
 *   - data     → dados de animação (PLASMO_DATA / SABLE_DATA, formato
 *                idêntico ao de src/characters/animations.js);
 *   - folder   → subpasta em public/assets/characters/ (uma atlas por estado);
 *   - cacheBust→ query string de cache por PERSONAGEM (troque ao re-exportar
 *                a arte de um kit sem afetar os outros);
 *   - attacks  → kit de golpes consumido pelo Fighter e pela CPU;
 *   - jumpAnim/blockAnim → timings das animações especiais do kit;
 *   - renderScale/hurtbox → físico visual;
 *   - label    → rótulo desenhado no canvas (não confundir com o HUD, que
 *                continua PLAYER 01/CPU por contrato de teste).
 *
 * Plasmo é o Player 01; Sable é a adversária da fase 3. Ambos passam pelo
 * mesmo pipeline, para que a troca de personagem não recrie o lutador.
 */
import { ATTACKS, JUMP_ANIM, BLOCK_ANIM } from '../fighters/Fighter.js';
import { PLASMO_DATA } from './Plasmo.js';
import { SABLE_DATA, SABLE_JUMP_ANIM, SABLE_BLOCK_ANIM } from './Sable.js';

export const ROSTER = {
  plasmo: {
    id: 'plasmo',
    label: 'PLASMO',
    color: '#51e3e8',
    data: PLASMO_DATA,
    folder: 'plasmo',
    cacheBust: '?v=20261123-block-hit',
    attacks: ATTACKS,
    jumpAnim: JUMP_ANIM,
    blockAnim: BLOCK_ANIM,
    renderScale: 1,
    hurtbox: { halfWidth: 48, height: 100 },
  },
  sable: {
    id: 'sable',
    label: 'SABLE',
    color: '#f0c75e',
    data: SABLE_DATA,
    folder: 'sable',
    cacheBust: '?v=20261124-sable-2',
    attacks: ATTACKS,
    jumpAnim: SABLE_JUMP_ANIM,
    blockAnim: SABLE_BLOCK_ANIM,
    // Arte normalizada a ~96 px de conteúdo de pé (extract-sable.ps1) —
    // escala 1 × 1,1 do renderer = mesmo tamanho do Plasmo.
    renderScale: 1,
    // Meia-largura 42 (mais estreita que as 48 do Plasmo) e altura visual
    // ~105 px (96 × 1,1) — valores do plano da Sable; a altura só posiciona
    // rótulo/debug, o combate usa meia-largura.
    hurtbox: { halfWidth: 42, height: 105 },
  },
};

/** Busca um kit pelo id ('plasmo' | 'sable' | ...). Devolve null se não existir. */
export function getKit(id) {
  return ROSTER[id] ?? null;
}

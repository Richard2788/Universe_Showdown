/**
 * Plasmo — dados de animação do personagem Player 01.
 *
 * Gerado por scripts/extract-plasmo.ps1 a partir de
 * public/assets/characters/plasmo/<estado>.png — cada estado tem sua
 * própria atlas (células por estado, ver frameWidth abaixo; recorte por
 * bounding box, pés na base da célula, pivô central).
 *
 * Timings dos ataques sincronizados com ATTACKS em src/fighters/Fighter.js:
 * frameTime = duração do golpe / nº de frames, e activeFrom/activeTo casam
 * com activeStart/activeEnd (em segundos) do combate.
 */

export const PLASMO_DATA = {
  meta: { frameWidth: 192, frameHeight: 192, pivotX: 96, pivotY: 192 },
  states: {
    idle:        { image: 'idle.png',        row: 0, col: 0, frames: 12, columns: 12, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 8,    loop: true },
    walk:        { image: 'walk.png',        row: 0, col: 0, frames: 7,  columns: 7,  frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 10,   loop: true },
    jump:        { image: 'jump.png',        row: 0, col: 0, frames: 25, columns: 25, frameWidth: 161, frameHeight: 133, pivotX: 80, pivotY: 133, frameTime: 0.047, loop: false },
    crouch:      { image: 'crouch.png',      row: 0, col: 0, frames: 11, columns: 11, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 10,   loop: true },
    block:       { image: 'block.png',       row: 0, col: 0, frames: 4,  columns: 4,  fps: 6,    loop: true },
    hit:         { image: 'hit.png',         row: 0, col: 0, frames: 3,  columns: 3,  fps: 12,   loop: false },
    // Ataques usam células 320×320 (altura normalizada na extração).
    lightAttack:  { image: 'lightAttack.png',  row: 0, col: 0, frames: 10, columns: 10, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, frameTime: 0.028, loop: false, activeFrom: 5, activeTo: 7 },
    mediumAttack: { image: 'mediumAttack.png', row: 0, col: 0, frames: 10, columns: 10, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, frameTime: 0.048, loop: false, activeFrom: 5, activeTo: 6 },
    heavyAttack:  { image: 'heavyAttack.png',  row: 0, col: 0, frames: 16, columns: 16, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, frameTime: 0.045, loop: false, activeFrom: 7, activeTo: 11 },
    kick:         { image: 'kick.png',         row: 0, col: 0, frames: 4,  columns: 4,  frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, frameTime: 0.13, loop: false, activeFrom: 1, activeTo: 2 },
  },
};

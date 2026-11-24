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
    // `frameAnchors` = pivô horizontal POR FRAME (centro de massa do corpo
    // visível, medido por scripts/measure-anchors.ps1). O SpriteAnimator usa
    // -anchorX no draw: a âncora do corpo (não o centro da célula) fica no
    // eixo do lutador, eliminando o salto lateral ao virar o sprite.
    idle:        { image: 'idle.png',        row: 0, col: 0, frames: 12, columns: 12, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 8,    loop: true, frameAnchors: [154.2, 154.2, 157.9, 157.9, 157.5, 157.6, 159.6, 159.6, 160.2, 160.2, 153.8, 153.8] },
    walk:        { image: 'walk.png',        row: 0, col: 0, frames: 7,  columns: 7,  frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 10,   loop: true, frameAnchors: [159.8, 159.8, 160.2, 159.8, 160.6, 160.7, 160.6] },
    // Corrida: reutiliza a sheet do walk a fps maior (20) com as MESMAS
    // âncoras por frame — o corpo continua ancorado do mesmo jeito.
    run:         { image: 'walk.png',        row: 0, col: 0, frames: 7,  columns: 7,  frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 20,   loop: true, frameAnchors: [159.8, 159.8, 160.2, 159.8, 160.6, 160.7, 160.6] },
    jump:        { image: 'jump.png',        row: 0, col: 0, frames: 25, columns: 25, frameWidth: 161, frameHeight: 133, pivotX: 80, pivotY: 133, frameTime: 0.047, loop: false, frameAnchors: [79.9, 80.2, 83.5, 84.9, 84.8, 84.8, 85, 83.4, 84.3, 82.6, 82.5, 82.7, 71.3, 61.4, 61.3, 62.7, 61.2, 61.2, 71.8, 72, 53.4, 53.3, 63.1, 62.6, 59.4] },
    crouch:      { image: 'crouch.png',      row: 0, col: 0, frames: 11, columns: 11, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 10,   loop: true, frameAnchors: [160.8, 160.8, 160.5, 160.1, 160, 159.9, 159.8, 159.9, 160.1, 160, 160] },
    // Reação de block: UMA jogada por bloqueio bem-sucedido — começa na
    // célula 2 (primeiro sprite com o escudo já formado) e segue até a 9
    // (última), sem loop. Células 0–1 (erguendo o escudo) ficam de fora por
    // definição; segurar o recuo sem golpe mostra walk/idle, não este estado.
    block:       { image: 'block.png',       row: 0, col: 2, frames: 8,  columns: 10, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 6,    loop: false, frameAnchors: [167.1, 167.5, 167.1, 165.1, 165.5, 165, 157.1, 157.7] },
    // hit: 9 poses (impacto → atordoado → recupera a guarda) em 0,3 s de
    // hitstun — fps 30 cobre o arco inteiro sem congelar no meio.
    hit:         { image: 'hit.png',         row: 0, col: 0, frames: 9,  columns: 9,  frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, fps: 30,   loop: false, frameAnchors: [153.3, 153.1, 156, 155.6, 164.5, 162.5, 162.2, 157.1, 157.6] },
    // Ataques usam células 320×320 (altura normalizada na extração).
    lightAttack:  { image: 'lightAttack.png',  row: 0, col: 0, frames: 10, columns: 10, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, frameTime: 0.028, loop: false, activeFrom: 5, activeTo: 7, frameAnchors: [161.1, 166.2, 165, 164.9, 164.8, 161.1, 155.5, 155.8, 159.7, 160] },
    mediumAttack: { image: 'mediumAttack.png', row: 0, col: 0, frames: 10, columns: 10, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, frameTime: 0.048, loop: false, activeFrom: 5, activeTo: 6, frameAnchors: [158.6, 162.4, 162.7, 164, 163.9, 165.5, 160.1, 161.2, 161.1, 161.1] },
    heavyAttack:  { image: 'heavyAttack.png',  row: 0, col: 0, frames: 16, columns: 16, frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, frameTime: 0.045, loop: false, activeFrom: 7, activeTo: 11, frameAnchors: [158.9, 158.9, 158.1, 165.3, 165.3, 165.3, 165.3, 159, 161.3, 151.6, 150, 155.7, 155.8, 155.8, 155.5, 155.5] },
    kick:         { image: 'kick.png',         row: 0, col: 0, frames: 4,  columns: 4,  frameWidth: 320, frameHeight: 320, pivotX: 160, pivotY: 320, frameTime: 0.13, loop: false, activeFrom: 1, activeTo: 2, frameAnchors: [165.5, 164, 166.3, 166.3] },
  },
};

/**
 * Sable — dados de animação da personagem (adversária da fase 3 da campanha).
 *
 * Gerado por scripts/extract-sable.ps1 a partir das spritesheets com fundo
 * transparente (pasta externa informada pelo autor; ver ASSETS-ATLAS.md e
 * CREDITS.md): cada estado vira uma atlas PNG por estado em
 * public/assets/characters/sable/ — recorte por bounding box, escala global
 * de paridade com o Plasmo (conteúdo de pé = 96 px → renderScale 1) e pés
 * na base da célula. Os PNGs têm células 192×192 (meta igual ao placeholder).
 *
 * `frameAnchors` = pivô horizontal POR FRAME (centro de massa dos pixels
 * visíveis, A > 20 — mesmo método do Plasmo). O SpriteAnimator usa -anchorX
 * no draw: o corpo fica no eixo do lutador em todos os frames e ao virar,
 * sem deslizar (o salto lateral só apareceria com âncora fixa de célula).
 *
 * Timings dos ataques sincronizados com ATTACKS em src/fighters/Fighter.js
 * (a Sable usa o kit padrão até a Fase 3 do plano criar SABLE_ATTACKS):
 *   - frameTime = duração do golpe / nº de frames;
 *   - activeFrom/activeTo = floor(activeStart|activeEnd / frameTime),
 *     limitado aos frames — mesma fórmula do Plasmo.
 *
 * Estados sem arte própria na fonte: `kick` reutiliza a sheet do
 * heavyAttack (substituição explícita, como run→walk no Plasmo).
 * Folhas da fonte sem estado no runtime: caminhando_tras (andar para trás
 * usa walk espelhado) e levantando (levantar usa idle) — ver ASSETS-ATLAS.md.
 */

export const SABLE_DATA = {
  meta: { frameWidth: 192, frameHeight: 192, pivotX: 96, pivotY: 192 },
  states: {
    idle:         { image: 'idle.png',         row: 0, col: 0, frames: 6, columns: 6, fps: 8,  loop: true,  frameAnchors: [93.4, 94, 94.8, 94.5, 95.2, 94.2] },
    walk:         { image: 'walk.png',         row: 0, col: 0, frames: 7, columns: 7, fps: 10, loop: true,  frameAnchors: [97.6, 97.3, 97.9, 97.3, 96.1, 98.4, 97] },
    // Corrida com arte própria (folha correndo): ciclo ≈ 5/14 = 0,36 s,
    // mesmo ritmo de passadas do run do Plasmo (7/20 = 0,35 s).
    run:          { image: 'run.png',          row: 0, col: 0, frames: 5, columns: 5, fps: 14, loop: true,  frameAnchors: [95.5, 95.6, 96.4, 96.9, 96.5] },
    // Voo: 4 frames × 0,2 s = 0,8 s = tempo de ar medido da física
    // (impulso vy 620 → aterrissa em ~48 passos de 60 Hz); o 5º frame
    // (pousou) fica segurado pelo landingTimer no chão (0,2 s).
    jump:         { image: 'jump.png',         row: 0, col: 0, frames: 5, columns: 5, frameTime: 0.2, loop: false, frameAnchors: [95.7, 99.9, 97.5, 102.5, 94.4] },
    // Descida do agachamento uma vez e trava na pose mais funda (a folha
    // progresse de em pé-parcial → fundo; em loop ficaria "pulsando").
    crouch:       { image: 'crouch.png',       row: 0, col: 0, frames: 3, columns: 3, fps: 8,  loop: false, frameAnchors: [94.9, 94.3, 90.7] },
    // Reação de block: 4 frames com a guarda já formada (frame 0) e a aura
    // elétrica crescendo até o escudo completo — ver SABLE_BLOCK_ANIM.
    block:        { image: 'block.png',        row: 0, col: 0, frames: 4, columns: 4, fps: 6,  loop: false, frameAnchors: [95.8, 98, 96, 92.6] },
    // 6 frames em 0,3 s (fps 20) = mesma duração de hitstun do Plasmo.
    hit:          { image: 'hit.png',          row: 0, col: 0, frames: 6, columns: 6, fps: 20, loop: false, frameAnchors: [95.3, 100.9, 98.9, 94.8, 90.6, 86.5] },
    lightAttack:  { image: 'lightAttack.png',  row: 0, col: 0, frames: 2, columns: 2, frameTime: 0.14, loop: false, activeFrom: 1, activeTo: 1, frameAnchors: [90.8, 91.6] },
    mediumAttack: { image: 'mediumAttack.png', row: 0, col: 0, frames: 4, columns: 4, frameTime: 0.12, loop: false, activeFrom: 2, activeTo: 2, frameAnchors: [96.9, 71.8, 88.4, 89.3] },
    // A janela ativa (frames 1–2) cobre o arremesso; o esmagamento com
    // efeitos (frame 3) cai na recuperação — a Fase 3 (SABLE_ATTACKS)
    // re-sincroniza a janela com o frame de contato da arte.
    heavyAttack:  { image: 'heavyAttack.png',  row: 0, col: 0, frames: 4, columns: 4, frameTime: 0.18, loop: false, activeFrom: 1, activeTo: 2, frameAnchors: [97.4, 96.4, 93.2, 74.8] },
    // Substituição explícita: a fonte não tem chute — usa a sheet do
    // heavyAttack (cena agachada, coerente com o golpe baixo) com o
    // timing do kick de ATTACKS.
    kick:         { image: 'heavyAttack.png',  row: 0, col: 0, frames: 4, columns: 4, frameTime: 0.13, loop: false, activeFrom: 1, activeTo: 2, frameAnchors: [97.4, 96.4, 93.2, 74.8] },
  },
};

/**
 * Tempo de ar do kit: 4 frames no ar (0,8 s = voo medido da física com
 * impulso vy 620) + 1 frame de pouso segurado no chão (0,2 s).
 * Consumido pelo Fighter no landingTimer.
 */
export const SABLE_JUMP_ANIM = { frames: 5, frameTime: 0.2, airFrames: 4 };

/**
 * Reação de block: MESMA duração do kit padrão (8 × 1/6 = 4 × 1/3 ≈ 1,33 s)
 * para o tempo de recuperação visual não mudar entre personagens.
 */
export const SABLE_BLOCK_ANIM = { frames: 4, frameTime: 1 / 3 };

#!/usr/bin/env node
/**
 * convert-texturepacker.mjs
 * Converte uma atlas exportada pelo TexturePacker (formato "JSON (Hash)",
 * células fixas de 96×96, SEM trim) para o formato de dados usado pelo
 * runtime do jogo (public/assets/characters/knight/knight.json e
 * src/characters/animations.js).
 *
 * Uso:
 *   node scripts/convert-texturepacker.mjs <atlas-texturepacker.json> [saida.json]
 *
 * Exemplo:
 *   node scripts/convert-texturepacker.mjs knight-tp.json public/assets/characters/knight/knight.json
 *
 * Convenções esperadas nos nomes dos sprites:
 *   <personagem>_<estado>_<índice>.png   ex.: knight_idle_0.png, knight_kick_12.png
 * O índice determina a ordem dos frames; a posição (x, y) na atlas determina
 * row/col. Funciona com TexturePacker (grid fixo) ou Free Texture Packer
 * (empacotamento automático) — nesse caso a posição real é usada como está,
 * desde que os frames de cada estado fiquem contíguos na mesma linha.
 *
 * Parâmetros de gameplay (fps, frameTime, activeFrom/activeTo, loop) vêm de
 * GAMEPLAY abaixo (sincronizados com src/fighters/Fighter.js) e podem ser
 * sobrescritos editando o JSON gerado.
 */

import { readFileSync, writeFileSync } from 'node:fs';

// ── Layout da atlas (deve casar com src/characters/animations.js) ──
const FRAME_WIDTH = 96;
const FRAME_HEIGHT = 96;
const COLUMNS = 19;
const ROWS = 6;

// Linhas "esperadas" de cada estado conforme src/characters/animations.js.
// Empacotadores automáticos (ex.: Free Texture Packer) podem posicioná-los
// em outra linha/coluna — nesses casos o conversor apenas AVISA e usa a
// posição real, já que o runtime (SpriteAnimator) lê row/col do JSON.
const EXPECTED_STATE_ROW = {
  idle: 0, walk: 0,
  jump: 1, crouch: 1, block: 1, hit: 1,
  lightAttack: 2, mediumAttack: 3, heavyAttack: 4, kick: 5,
};

// Estados cíclicos (loop: true). Os demais tocam uma vez e congelam.
const LOOPING = new Set(['idle', 'walk', 'crouch', 'block']);

// FPS de estados em loop (frameTime = 1/fps).
const LOOP_FPS = { idle: 8, walk: 12, crouch: 8, block: 8 };

// Parâmetros de gameplay dos ataques — DEVEM casar com ATTACKS em
// src/fighters/Fighter.js (duration, activeStart, activeEnd).
const ATTACK_TUNING = {
  lightAttack:  { duration: 0.28, activeStart: 0.07, activeEnd: 0.15 },
  mediumAttack: { duration: 0.48, activeStart: 0.13, activeEnd: 0.24 },
  heavyAttack:  { duration: 0.72, activeStart: 0.25, activeEnd: 0.38 },
  kick:         { duration: 0.52, activeStart: 0.16, activeEnd: 0.29 },
};

// ── Utilitários ──
function fail(message) {
  console.error(`[convert-texturepacker] ERRO: ${message}`);
  process.exit(1);
}

/** Extrai "estado" e "índice" de um nome de sprite. */
function parseSpriteName(name) {
  // "knight_lightAttack_03.png" → estado "lightAttack", índice 3
  const base = name.replace(/\.png$/i, '');
  const match = base.match(/^(?:[a-zA-Z0-9]+)_(.+?)_(\d+)$/);
  if (!match) return null;
  const [, state, index] = match;
  return { state, index: Number.parseInt(index, 10) };
}

/** Verifica que a célula (x, y) casa com o tamanho de célula 96×96. */
function assertGridCell(x, y, name) {
  if (x % FRAME_WIDTH !== 0 || y % FRAME_HEIGHT !== 0) {
    fail(`sprite "${name}" não está alinhado ao grid de ${FRAME_WIDTH}×${FRAME_HEIGHT}px (x=${x}, y=${y}). ` +
      'Use padding 0 e extrude 0; todos os sprites devem ter exatamente 96×96 px, sem trim/rotation.');
  }
}

// ── Leitura da atlas TexturePacker ──
const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? 'animation-data.json';
if (!inputPath) {
  fail('uso: node scripts/convert-texturepacker.mjs <atlas-texturepacker.json> [saida.json]');
}

let atlas;
try {
  atlas = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (error) {
  fail(`não foi possível ler/parsear "${inputPath}": ${error.message}`);
}

if (!atlas.frames || typeof atlas.frames !== 'object') {
  fail('o JSON não contém "frames" — exporte do TexturePacker no formato "JSON (Hash)".');
}

// ── Agrupa frames por estado ──
const framesByState = new Map();
for (const [name, info] of Object.entries(atlas.frames)) {
  const parsed = parseSpriteName(name);
  if (!parsed) {
    console.warn(`[convert-texturepacker] aviso: sprite "${name}" ignorado (nome fora do padrão <char>_<estado>_<índice>).`);
    continue;
  }
  if (!(parsed.state in EXPECTED_STATE_ROW)) {
    console.warn(`[convert-texturepacker] aviso: estado desconhecido "${parsed.state}" (sprite "${name}") ignorado. Estados válidos: ${Object.keys(EXPECTED_STATE_ROW).join(', ')}.`);
    continue;
  }
  assertGridCell(info.frame.x, info.frame.y, name);
  if (info.frame.w !== FRAME_WIDTH || info.frame.h !== FRAME_HEIGHT) {
    fail(`sprite "${name}" tem ${info.frame.w}×${info.frame.h}px — esperado ${FRAME_WIDTH}×${FRAME_HEIGHT} (sem trim).`);
  }
  if (!framesByState.has(parsed.state)) framesByState.set(parsed.state, []);
  framesByState.get(parsed.state).push({ index: parsed.index, x: info.frame.x, y: info.frame.y, name });
}

if (framesByState.size === 0) {
  fail('nenhum sprite reconhecido. Confira os nomes (ex.: knight_idle_0.png).');
}

// ── Monta o objeto de estados no formato do runtime ──
const states = {};
for (const [state, frames] of framesByState) {
  frames.sort((a, b) => a.index - b.index);

  // Índices devem ser contíguos a partir de 0.
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].index !== i) {
      fail(`estado "${state}": índices de frame não são contíguos (esperado ${i}, encontrado ${frames[i].index}).`);
    }
  }

  // Todos os frames do estado devem ser células contíguas na sequência
  // linear da atlas (row * columns + col). Quebra de linha no meio do
  // estado é aceita — o runtime (SpriteAnimator) suporta envolver linhas.
  const sizeW = atlas.meta?.size?.w ?? COLUMNS * FRAME_WIDTH;
  const atlasColumns = Math.round(sizeW / FRAME_WIDTH);
  const linear = (frame) => (frame.y / FRAME_HEIGHT) * atlasColumns + frame.x / FRAME_WIDTH;
  frames.forEach((frame, i) => {
    const cell = linear(frame);
    if (cell !== linear(frames[0]) + i) {
      fail(`estado "${state}": sprite "${frame.name}" não é contíguo na sequência da atlas (célula ${cell}, esperada ${linear(frames[0]) + i}). Renomeie os sprites para que a ordem no empacotador siga os índices, ou reordene-os na lista de arquivos.`);
    }
  });

  const startCell = linear(frames[0]);
  const entry = {
    row: Math.floor(startCell / atlasColumns),
    col: startCell % atlasColumns,
    frames: frames.length,
    loop: LOOPING.has(state),
  };

  if (LOOPING.has(state)) {
    entry.fps = LOOP_FPS[state];
  }

  if (state in ATTACK_TUNING) {
    const tuning = ATTACK_TUNING[state];
    const n = frames.length;
    entry.frameTime = Number((tuning.duration / n).toFixed(4));
    entry.activeFrom = Math.floor((tuning.activeStart / tuning.duration) * n);
    entry.activeTo = Math.min(n - 1, Math.floor((tuning.activeEnd / tuning.duration) * n));
    if (entry.activeTo < entry.activeFrom) entry.activeTo = entry.activeFrom;
  }

  states[state] = entry;
}

// ── Verifica estados obrigatórios ──
const REQUIRED = ['idle', 'walk', 'jump', 'crouch', 'block', 'hit', 'lightAttack', 'mediumAttack', 'heavyAttack', 'kick'];
const missing = REQUIRED.filter((state) => !states[state]);
if (missing.length > 0) {
  console.warn(`[convert-texturepacker] aviso: estados ausentes na atlas: ${missing.join(', ')}. O jogo vai falhar ao tentar usá-los — gere os frames faltantes ou remova-os do runtime.`);
}

// ── Saída ──
// Dimensões reais da atlas (o empacotador automático pode usar outra
// resolução que 19×6 células — o runtime só precisa de frameWidth/Height
// e de columns para calcular índices lineares de célula).
const sizeW = atlas.meta?.size?.w ?? COLUMNS * FRAME_WIDTH;
const sizeH = atlas.meta?.size?.h ?? ROWS * FRAME_HEIGHT;
const columns = sizeW / FRAME_WIDTH;
const rows = sizeH / FRAME_HEIGHT;
if (!Number.isInteger(columns) || !Number.isInteger(rows)) {
  console.warn(`[convert-texturepacker] aviso: atlas de ${sizeW}×${sizeH}px não é múltiplo exato da célula 96×96 — verifique o tamanho da textura no empacotador.`);
}

const output = {
  meta: {
    image: atlas.meta?.image ?? 'spritesheet.png',
    frameWidth: FRAME_WIDTH,
    frameHeight: FRAME_HEIGHT,
    columns,
    rows,
    pivotX: FRAME_WIDTH / 2,
    pivotY: FRAME_HEIGHT, // base da célula = linha do chão (pés)
  },
  states,
};

writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

const count = Object.values(states).reduce((sum, s) => sum + s.frames, 0);
console.log(`[convert-texturepacker] OK: ${count} frames de ${framesByState.size} estados convertidos → ${outputPath}`);
console.log('[convert-texturepacker] Revise frameTime/activeFrom/activeTo dos ataques e sincronize com src/fighters/Fighter.js se as durações mudarem.');

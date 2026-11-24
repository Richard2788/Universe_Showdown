/**
 * Bloqueio clássico da CPU (decisão 2026-11-24).
 *
 * Contrato:
 *   - ao ver o oponente atacar em alcance defensivo (BLOCK_RANGE), a CPU
 *     segura o recuo e bloqueia — o bloqueio é o PADRÃO, sem sorteio;
 *   - `dodgeChance` só decide ESQUIVAR em vez de bloquear (recuar/pular);
 *   - contra chute (low) ela agacha junto com o recuo, senão o golpe fura
 *     a guarda em pé;
 *   - o atraso (reaction) continua por dificuldade, e o golpe iniciado fora
 *     do alcance ainda é bloqueado quando o atacante entra no alcance;
 *   - o pulo de aproximação já sai avançando (direção travada no impulso)
 *     e o pulo de esquiva é reto.
 * Onde o caminho clássico é o alvo, o teste força `dodgeChance = 0` e o
 * atraso já cumprido (`reactAt = 0`) — o sorteio de esquiva tem teste próprio.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Fighter, ATTACKS } from '../src/fighters/Fighter.js';
import { CPUController, DIFFICULTIES } from '../src/ai/CPUController.js';

const DT = 1 / 60;
const mk = (x, face) => new Fighter(x, '#fff', face, { hurtboxHalfWidth: 35 });

/** Defensor (CPU) à direita do atacante, sem esquiva e com reação já cumprida. */
function defender(x, opponentX, difficulty) {
  const f = mk(x, opponentX > x ? -1 : 1);
  const o = mk(opponentX, opponentX > x ? 1 : -1);
  const cpu = new CPUController(f, o, difficulty);
  cpu.profile = { ...cpu.profile, dodgeChance: 0 };
  return { f, o, cpu };
}

describe('CPU bloqueia clássico (segura o recuo)', () => {
  it('ao ver o golpe em alcance, segura a direção oposta (recuo)', () => {
    const { f, o, cpu } = defender(350, 300, 'dificil');
    o.attack = { data: ATTACKS.mediumAttack, elapsed: 0 };
    cpu.sawAttack = true; // já viu o golpe...
    cpu.reactAt = 0;      // ...e o atraso do perfil já passou
    const a = cpu.update(DT);
    f.update(DT, a, o);
    assert.equal(cpu.stateName, 'block');
    assert.equal(a.right, true);  // recua para a direita (afasta do oponente)
    assert.equal(a.left, false);
    assert.equal(a.jump, false);
    assert.equal(f.blocking, true); // postura de defesa ativa
  });

  it('defende de verdade: bloqueia sem dano e com blockstun', () => {
    const { f, o, cpu } = defender(350, 300, 'lendario');
    o.attack = { data: ATTACKS.mediumAttack, elapsed: 0 };
    cpu.sawAttack = true;
    cpu.reactAt = 0;
    // roda IA + física até o golpe tocar (médio: activeStart 0,24 s) e o
    // blockstun terminar dentro da janela (0,24 + 0,18 = 0,42 s)
    for (let i = 0; i < Math.round(0.3 / DT); i++) {
      const a = cpu.update(DT);
      o.update(DT, {}, f); // oponente mantém o golpe em curso
      f.update(DT, a, o);
    }
    assert.equal(f.health, 100); // sem dano: blockstun + recuo
    assert.ok(f.blockTimer > 0);
    assert.ok(f.x > 350); // recuo empurrou para trás
  });

  it('contra chute (low) agacha junto com o recuo e segura o golpe', () => {
    const { f, o, cpu } = defender(350, 300, 'lendario');
    o.attack = { data: ATTACKS.kick, elapsed: 0 };
    o.attackName = 'kick'; // como o Fighter faz ao iniciar o golpe
    cpu.sawAttack = true;
    cpu.reactAt = 0;
    let crouchSeen = false;
    for (let i = 0; i < Math.round(0.15 / DT); i++) {
      const a = cpu.update(DT);
      if (a.crouch) crouchSeen = true;
      o.update(DT, {}, f);
      f.update(DT, a, o);
    }
    assert.ok(crouchSeen, 'CPU pede guarda baixa contra o chute');
    assert.equal(f.health, 100); // chute segurado (não furou a guarda em pé)
    assert.ok(f.blockTimer > 0);
  });

  it('golpe iniciado fora do alcance é bloqueado quando o atacante entra', () => {
    const { f, o, cpu } = defender(400, 300, 'lendario');
    o.attack = { data: ATTACKS.heavyAttack, elapsed: 0 };
    o.x = 200;            // ataque iniciado longe (dist 200 > BLOCK_RANGE)
    cpu.sawAttack = true;
    cpu.reactAt = 0;
    for (let i = 0; i < 10; i++) {
      cpu.update(DT);
      o.update(DT, {}, f);
      f.update(DT, {}, o);
    }
    assert.notEqual(cpu.stateName, 'block'); // ainda longe demais
    o.x = 320; // o atacante entra correndo no alcance defensivo
    const a = cpu.update(DT);
    assert.equal(cpu.stateName, 'block');
    assert.equal(a.right, true);
  });

  it('o bloqueio segura durante a janela ativa do golpe em curso', () => {
    const { f, o, cpu } = defender(350, 300, 'lendario');
    o.attack = { data: ATTACKS.heavyAttack, elapsed: 0 };
    o.attackName = 'heavyAttack';
    cpu.sawAttack = true;
    cpu.reactAt = 0;
    let a = {};
    // O forte dura 0,72 s (ativa 0,32–0,50 s): em 0,4 s a CPU ainda segura
    // o recuo — o timer do reflexo cobre o golpe inteiro.
    for (let i = 0; i < Math.round(0.4 / DT); i++) {
      a = cpu.update(DT);
      o.update(DT, {}, f);
      f.update(DT, a, o);
    }
    assert.equal(cpu.stateName, 'block');
    assert.equal(a.right, true); // continua recuando (sem re-decide)
    assert.equal(cpu.intent, 'block');
  });

  it('respeita o atraso do perfil antes de reagir', () => {
    const { cpu } = defender(350, 300, 'facil');
    cpu.opponent.attack = { data: ATTACKS.mediumAttack, elapsed: 0 };
    cpu.sawAttack = true;
    cpu.reactAt = cpu.time + 0.5; // atraso largo (fácil: 0,45–0,8 s)
    cpu.update(DT);
    assert.notEqual(cpu.stateName, 'block'); // ainda dentro do atraso
    cpu.reactAt = 0; // atraso cumprido
    cpu.update(DT);
    assert.equal(cpu.stateName, 'block');
  });
});

describe('esquiva e pulo da CPU (dodgeChance)', () => {
  it('com dodgeChance total, esquiva em vez de bloquear', () => {
    const { cpu } = defender(350, 300, 'lendario');
    cpu.profile = { ...cpu.profile, dodgeChance: 1 }; // sempre esquiva
    cpu.opponent.attack = { data: ATTACKS.mediumAttack, elapsed: 0 };
    cpu.sawAttack = true;
    cpu.reactAt = 0;
    const a = cpu.update(DT);
    assert.equal(cpu.stateName, 'dodge');
    assert.ok(a.jump || (a.left !== a.right), 'pula no lugar ou recua');
  });

  it('pulo de esquiva é reto (sem direção no impulso)', () => {
    const { cpu } = defender(350, 300, 'lendario');
    cpu.intent = 'jump';
    cpu.jumpForward = false; // pulo de esquiva: reto, no lugar
    cpu.thinkTimer = 10;     // evita re-decide no meio
    const a = cpu.update(DT);
    assert.equal(a.jump, true);
    assert.equal(a.left, false);
    assert.equal(a.right, false);
  });

  it('pulo de aproximação já sai avançando (direção travada no impulso)', () => {
    const { cpu } = defender(300, 500, 'lendario'); // oponente à direita
    cpu.intent = 'jump';
    cpu.jumpForward = true;
    cpu.thinkTimer = 10;
    const a = cpu.update(DT);
    assert.equal(a.jump, true);
    assert.equal(a.right, true); // já avança em direção ao oponente
    assert.equal(a.left, false);
  });
});

describe('perfis de IA (contrato de dados)', () => {
  it('os 5 perfis existem e não têm mais blockChance', () => {
    for (const name of ['facil', 'medio', 'dificil', 'elite', 'lendario']) {
      const p = DIFFICULTIES[name];
      assert.ok(p, `${name} existe`);
      assert.equal('blockChance' in p, false, `${name}: blockChance removido`);
      assert.ok(typeof p.dodgeChance === 'number');
      assert.ok(Array.isArray(p.reaction));
    }
  });
});

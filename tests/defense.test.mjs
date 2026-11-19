/**
 * Debounce honesto, defesa (recuo) e golpes altos/baixos.
 *
 * 21 checks — contrato de regressão dos sistemas de defesa e postura.
 * Qualquer mudança de comportamento deve vir com justificativa e ajuste
 * explícito destes testes.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mk, step, resolve, ATTACKS } from './helpers.mjs';

describe('debounce de ataque e pulo', () => {
  it('segurar o leve por 1 s dispara 1 golpe só (hp 95)', () => {
    const a = mk(300), d = mk(360);
    for (let i = 0; i < 60; i++) step(a, { lightAttack: true }, d);
    assert.equal(d.health, 95);
  });

  it('soltar e pressionar de novo dispara novamente (hp 90)', () => {
    const a = mk(300), d = mk(360);
    for (let i = 0; i < 60; i++) step(a, { lightAttack: true }, d);
    step(a, {}, d); // solta
    for (let i = 0; i < 60; i++) step(a, { lightAttack: true }, d);
    assert.equal(d.health, 90);
  });

  it('segurar o pulo por 2 s pula 1 vez só', () => {
    const f = mk(300), o = mk(660);
    let jumps = 0, wasGround = true;
    for (let i = 0; i < 120; i++) {
      step(f, { jump: true }, o);
      const ground = f.y === 0 && f.landingTimer <= 0;
      if (wasGround && !ground) jumps++;
      wasGround = ground;
    }
    assert.equal(jumps, 1);
  });

  it('uma pressão nova pula de novo (sem re-pulo por segurar)', () => {
    const f = mk(300), o = mk(660);
    for (let i = 0; i < 120; i++) step(f, { jump: true }, o); // segura 2 s
    step(f, {}, o); // solta
    let jumps2 = 0, wasGround = true;
    for (let i = 0; i < 90; i++) {
      step(f, i === 0 ? { jump: true } : {}, o); // uma pressão nova
      const ground = f.y === 0 && f.landingTimer <= 0;
      if (wasGround && !ground) jumps2++;
      wasGround = ground;
    }
    assert.equal(jumps2, 1);
  });
});

describe('bloqueio em pé', () => {
  it('segura o médio sem chip (hp 100)', () => {
    const { d } = resolve('mediumAttack', { right: true });
    assert.equal(d.health, 100);
  });

  it('aplica blockstun', () => {
    const { d } = resolve('mediumAttack', { right: true });
    assert.ok(d.blockTimer > 0);
  });

  it('empurra o defensor para trás', () => {
    const { d, dStartX } = resolve('mediumAttack', { right: true });
    assert.ok(d.x > dStartX + 20);
  });

  it('bloquear o forte tira apenas chip 2 (hp 98)', () => {
    const { d } = resolve('heavyAttack', { right: true });
    assert.equal(d.health, 98);
  });

  it('segura o leve/high (hp 100)', () => {
    const { d } = resolve('lightAttack', { right: true });
    assert.equal(d.health, 100);
  });

  it('o chute/low FURA o block em pé (hp 88)', () => {
    const { d } = resolve('kick', { right: true });
    assert.equal(d.health, 88);
  });
});

describe('posturas: agachado', () => {
  it('agachado SEM defesa leva o chute (hp 88)', () => {
    const { d } = resolve('kick', { crouch: true });
    assert.equal(d.health, 88);
  });

  it('block agachado (recue + S) segura o chute (hp 100)', () => {
    const { d } = resolve('kick', { right: true, crouch: true });
    assert.equal(d.health, 100);
  });

  it('block agachado aplica blockstun', () => {
    const { d } = resolve('kick', { right: true, crouch: true });
    assert.ok(d.blockTimer > 0);
  });

  it('agachado segurando a defesa fica parado (sem andar agachado)', () => {
    const a = mk(300), d = mk(360);
    for (let i = 0; i < 20; i++) { step(a, {}, d); step(d, { right: true, crouch: true }, a); }
    assert.equal(d.x, 360);
  });

  it('defesa em pé continua recuando andando (~42 px em 20 frames)', () => {
    const a = mk(300), d = mk(360);
    for (let i = 0; i < 20; i++) { step(a, {}, d); step(d, { right: true }, a); }
    assert.ok(d.x > 360 + 40);
  });

  it('leve/high passa por cima do agachado (hp 100)', () => {
    const { d } = resolve('lightAttack', { crouch: true });
    assert.equal(d.health, 100);
  });

  it('whiff alto no agachado não aplica blockstun', () => {
    const { d } = resolve('lightAttack', { crouch: true });
    assert.equal(d.blockTimer, 0);
  });
});

describe('acertos sem defesa', () => {
  it('médio acerta (hp 90)', () => {
    const { d } = resolve('mediumAttack', {});
    assert.equal(d.health, 90);
  });

  it('chute acerta (hp 88)', () => {
    const { d } = resolve('kick', {});
    assert.equal(d.health, 88);
  });

  it('avançar (segurar a direção do oponente) NÃO defende (hp 90)', () => {
    const { d } = resolve('mediumAttack', { left: true });
    assert.equal(d.health, 90);
  });
});

describe('esquiva no ar (maxTargetY)', () => {
  it('pulo em y=100 segue esquivando do chute', () => {
    const a = mk(300), d = mk(360);
    step(a, { kick: true }, d);
    a.attack.elapsed = ATTACKS.kick.activeStart;
    d.y = 100;
    step(a, {}, d);
    assert.equal(d.health, 100);
  });
});

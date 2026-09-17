import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { replyTo } from '../public/js/brain.js';

// Cerveau tri et recyclage, critères 7 à 9 de SPEC.md.
const DECHETS = ['plastique', 'verre', 'papier', 'carton', 'pile', 'compost'];
const repli = replyTo('xyzzy une phrase sans aucun mot connu');

describe('Critère 7 — déchets connus', () => {
  it('chaque déchet a sa propre réponse, différente du repli', () => {
    const reponses = DECHETS.map(replyTo);
    assert.equal(new Set(reponses).size, DECHETS.length);
    for (const reponse of reponses) {
      assert.notEqual(reponse, repli);
    }
  });

  it('les trois suggestions reçoivent une consigne de tri', () => {
    for (const [question, dechet] of [['Où jeter mes piles ?', 'pile'], ['Le verre va dans quel bac ?', 'verre'], ['Que faire de mes épluchures ?', 'compost']]) {
      assert.equal(replyTo(question), replyTo(dechet));
      assert.notEqual(replyTo(question), repli, `${question} n'est pas un repli`);
    }
  });

  it('le verre va à la colonne à verre, les piles jamais à la poubelle', () => {
    assert.match(replyTo('verre'), /colonne à verre/);
    assert.match(replyTo('pile'), /jamais à la poubelle/);
  });
});

describe('Critère 8 — mot dans une phrase', () => {
  it('reconnaît le mot malgré majuscules, ponctuation et accents', () => {
    assert.equal(replyTo('Salut !'), replyTo('salut'));
    assert.equal(replyTo('bonjour à tous'), replyTo('salut'));
    assert.equal(replyTo('Épluchures'), replyTo('compost'));
    assert.equal(replyTo('du CARTON, ça va où ?'), replyTo('carton'));
  });

  it('reconnaît les pluriels et les synonymes', () => {
    assert.equal(replyTo('mes vieilles batteries'), replyTo('pile'));
    assert.equal(replyTo('des bocaux'), replyTo('verre'));
    assert.equal(replyTo('un journal'), replyTo('papier'));
    assert.equal(replyTo('les briques de lait'), replyTo('carton'));
    assert.equal(replyTo('un flacon de shampoing'), replyTo('plastique'));
    assert.equal(replyTo('coucou'), replyTo('salut'));
  });

  it('ne confond pas « tester » avec « test »', () => {
    assert.notEqual(replyTo('je veux tester'), replyTo('test'));
    assert.equal(replyTo('je veux tester'), repli);
  });

  it('fait passer le déchet avant la politesse', () => {
    assert.equal(replyTo('salut, et les piles ?'), replyTo('pile'));
    assert.notEqual(replyTo('salut, et les piles ?'), replyTo('salut'));
    assert.notEqual(replyTo('salut, et les piles ?'), repli);
  });
});

describe('Critère 9 — aide et repli', () => {
  it('la réponse à « aide » cite les déchets connus', () => {
    const aide = replyTo('aide');
    for (const dechet of DECHETS) {
      assert.ok(aide.includes(dechet), `« aide » cite ${dechet}`);
    }
  });

  it('un message inconnu renvoie vers « aide »', () => {
    assert.match(repli, /aide/);
    assert.notEqual(repli, replyTo('aide'));
  });
});

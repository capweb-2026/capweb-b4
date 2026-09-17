import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { persona, validatePersona } from '../public/js/persona.js';

// Tests de l'identité de TriMalin, critères 1 à 5 de SPEC.md.
const avec = (champs) => ({ ...persona, ...champs });

describe('Critère 1 — nom', () => {
  it('le persona du projet s’appelle TriMalin', () => {
    assert.equal(persona.nom, 'TriMalin');
  });

  it('accepte un nom de 2 et de 20 caractères', () => {
    // L'accueil suit le nom : le critère 3 exige qu'il le contienne.
    for (const nom of ['ab', 'a'.repeat(20)]) {
      assert.equal(validatePersona(avec({ nom, accueil: `Bonjour, je suis ${nom} !` })).ok, true);
    }
  });

  it('refuse un nom de 1 et de 21 caractères', () => {
    assert.equal(validatePersona(avec({ nom: 'a', accueil: 'Bonjour, je suis a !' })).ok, false);
    const long = 'a'.repeat(21);
    assert.equal(validatePersona(avec({ nom: long, accueil: `Bonjour, je suis ${long} !` })).ok, false);
  });

  it('mesure le nom sans les espaces autour', () => {
    assert.equal(validatePersona(avec({ nom: '  a  ', accueil: 'Bonjour, je suis a !' })).ok, false);
  });

  it('compte une lettre accentuée pour un caractère', () => {
    assert.equal(validatePersona(avec({ nom: 'éé', accueil: 'Bonjour, je suis éé !' })).ok, true);
  });
});

describe('Critère 2 — emoji', () => {
  it('le persona du projet utilise ♻️', () => {
    assert.equal(persona.emoji, '♻️');
  });

  it('accepte un emoji composé, qui compte pour un', () => {
    for (const emoji of ['♻️', '🛡️', '🌱']) {
      assert.equal(validatePersona(avec({ emoji })).ok, true, `${emoji} est un seul emoji`);
    }
  });

  it('refuse deux emojis, du texte et une valeur vide', () => {
    for (const emoji of ['♻️🌱', '🌱🌱', 'a', '', ' ']) {
      assert.equal(validatePersona(avec({ emoji })).ok, false, `${emoji} n’est pas un emoji unique`);
    }
  });
});

describe('Critère 3 — accueil', () => {
  it('l’accueil du projet contient le nom', () => {
    assert.ok(persona.accueil.includes(persona.nom));
  });

  it('refuse un accueil qui ne contient pas le nom', () => {
    assert.equal(validatePersona(avec({ accueil: 'Bonjour, posez votre question !' })).ok, false);
  });

  it('refuse un accueil vide', () => {
    assert.equal(validatePersona(avec({ accueil: '   ' })).ok, false);
  });
});

describe('Critère 4 — suggestions', () => {
  it('le projet propose exactement trois questions, dans l’ordre de la spec', () => {
    assert.deepEqual(persona.suggestions, [
      'Où jeter mes piles ?',
      'Le verre va dans quel bac ?',
      'Que faire de mes épluchures ?'
    ]);
  });

  it('refuse deux ou quatre suggestions', () => {
    assert.equal(validatePersona(avec({ suggestions: ['Une ?', 'Deux ?'] })).ok, false);
    assert.equal(validatePersona(avec({ suggestions: ['Une ?', 'Deux ?', 'Trois ?', 'Quatre ?'] })).ok, false);
  });

  it('refuse une suggestion vide, faite d’espaces ou trop longue', () => {
    assert.equal(validatePersona(avec({ suggestions: ['Une ?', '', 'Trois ?'] })).ok, false);
    assert.equal(validatePersona(avec({ suggestions: ['Une ?', '   ', 'Trois ?'] })).ok, false);
    assert.equal(validatePersona(avec({ suggestions: ['Une ?', 'a'.repeat(281), 'Trois ?'] })).ok, false);
  });

  it('accepte une suggestion de 280 caractères', () => {
    assert.equal(validatePersona(avec({ suggestions: ['Une ?', 'a'.repeat(280), 'Trois ?'] })).ok, true);
  });

  it('refuse deux suggestions identiques', () => {
    assert.equal(validatePersona(avec({ suggestions: ['Une ?', 'Une ?', 'Trois ?'] })).ok, false);
  });
});

describe('validatePersona', () => {
  it('accepte le persona du projet', () => {
    assert.deepEqual(validatePersona(persona), { ok: true });
  });

  it('donne une erreur lisible par règle non respectée', () => {
    const resultat = validatePersona(avec({ nom: 'a', emoji: 'a', suggestions: [] }));
    assert.equal(resultat.ok, false);
    assert.ok(Array.isArray(resultat.erreurs));
    assert.ok(resultat.erreurs.length >= 3);
    for (const erreur of resultat.erreurs) {
      assert.equal(typeof erreur, 'string');
      assert.ok(erreur.trim().length > 0);
    }
  });

  it('ne plante pas sur une valeur qui n’est pas un persona', () => {
    for (const entree of [undefined, null, 42, 'TriMalin', {}, []]) {
      assert.equal(validatePersona(entree).ok, false);
    }
  });
});

describe('Critère 5 — persona.js reste pur', () => {
  it('persona.js ne touche pas à la page', async () => {
    const code = await readFile(new URL('../public/js/persona.js', import.meta.url), 'utf8');
    const sansCommentaires = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.doesNotMatch(sansCommentaires, /\bdocument\b|\bwindow\b|localStorage/);
  });
});

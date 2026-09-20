import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repondre, fournisseurPasserelle } from '../server/ia.js';
import { replyTo } from '../public/js/brain.js';
import { createApp } from '../server/app.js';

// Critères 10 à 14 de SPEC.md. Aucun appel réseau réel : le fournisseur est toujours un faux.
const ici = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(ici, '..', 'public');

const attendre = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

describe('Critère 10-12 — le module parle au modèle', () => {
  it('le fournisseur répond : la source est ia et le texte est le sien', async () => {
    const fournisseur = async () => 'Les ampoules se rapportent en magasin.';
    const r = await repondre({ message: 'où jeter une ampoule ?', fournisseur, delaiMax: 1000 });
    assert.equal(r.source, 'ia');
    assert.equal(r.texte, 'Les ampoules se rapportent en magasin.');
  });

  it('sans fournisseur, la source est regles', async () => {
    const r = await repondre({ message: 'verre', fournisseur: null, delaiMax: 1000 });
    assert.equal(r.source, 'regles');
    assert.equal(r.texte, replyTo('verre'));
  });
});

describe('Critère 13 — le repli', () => {
  it('le fournisseur échoue : la source est regles et le texte celui de replyTo', async () => {
    const fournisseur = async () => { throw new Error('401 clé invalide'); };
    const r = await repondre({ message: 'pile', fournisseur, delaiMax: 1000 });
    assert.equal(r.source, 'regles');
    assert.equal(r.texte, replyTo('pile'));
  });

  it('le fournisseur est trop lent : la source est regles, dans le délai maximal', async () => {
    const fournisseur = async () => { await attendre(500); return 'trop tard'; };
    const debut = Date.now();
    const r = await repondre({ message: 'carton', fournisseur, delaiMax: 40 });
    const ecoule = Date.now() - debut;
    assert.equal(r.source, 'regles');
    assert.equal(r.texte, replyTo('carton'));
    assert.ok(ecoule < 400, `le repli doit arriver dans le délai, pas en ${ecoule} ms`);
  });

  it('une réponse vide de l’IA bascule sur les règles', async () => {
    const r = await repondre({ message: 'papier', fournisseur: async () => '   ', delaiMax: 1000 });
    assert.equal(r.source, 'regles');
    assert.equal(r.texte, replyTo('papier'));
  });

  it('le module ne lève jamais d’erreur, même si le fournisseur n’est pas une fonction', async () => {
    const r = await repondre({ message: 'compost', fournisseur: 'pas une fonction', delaiMax: 50 });
    assert.equal(r.source, 'regles');
  });
});

describe('Critère 10 — un message vide est refusé comme dans validateMessage', () => {
  it('refuse le vide et les espaces seuls, sans appeler le fournisseur', async () => {
    let appele = false;
    const fournisseur = async () => { appele = true; return 'ne doit pas arriver'; };
    for (const entree of ['', '   ', 'a'.repeat(281), 42, null]) {
      const r = await repondre({ message: entree, fournisseur, delaiMax: 1000 });
      assert.equal(r.source, 'regles');
      assert.ok(r.texte.trim().length > 0);
    }
    assert.equal(appele, false, 'un message refusé ne doit jamais partir à l’IA');
  });
});

describe('Critère 14 — la clé reste côté serveur', () => {
  it('sans clé ni adresse, il n’y a pas de fournisseur', () => {
    assert.equal(fournisseurPasserelle({}), null);
    assert.equal(fournisseurPasserelle({ CAPWEB_IA_URL: 'https://exemple.test/v1' }), null);
    assert.equal(fournisseurPasserelle({ CAPWEB_IA_CLE: 'secret' }), null);
  });

  it('avec les deux variables, le fournisseur est une fonction', () => {
    const f = fournisseurPasserelle({ CAPWEB_IA_URL: 'https://exemple.test/v1', CAPWEB_IA_CLE: 'secret' });
    assert.equal(typeof f, 'function');
  });

  it('aucun fichier de public/ ne contient de clé ni d’adresse de passerelle', async () => {
    const { readdir, readFile } = await import('node:fs/promises');
    const fichiers = await readdir(path.join(publicDir, 'js'));
    for (const nom of fichiers) {
      const code = await readFile(path.join(publicDir, 'js', nom), 'utf8');
      assert.doesNotMatch(code, /CAPWEB_IA_CLE|CAPWEB_IA_URL|chat\/completions|Bearer /, `${nom} ne doit contenir ni clé ni passerelle`);
    }
  });
});

describe('Critère 13 — la route locale POST /api/chat', () => {
  const demarrer = async () => {
    const app = createApp({ publicDir, version: 'test' });
    app.listen(0, '127.0.0.1');
    await once(app, 'listening');
    return app;
  };

  it('répond 200 avec la source regles, puisqu’il n’y a pas de clé', async () => {
    const app = await demarrer();
    const { port } = app.address();
    const reponse = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'verre' })
    });
    assert.equal(reponse.status, 200);
    const corps = await reponse.json();
    assert.equal(corps.source, 'regles');
    assert.equal(corps.texte, replyTo('verre'));
    app.close();
  });

  it('un corps illisible ne fait pas planter le serveur', async () => {
    const app = await demarrer();
    const { port } = app.address();
    const reponse = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{pas du json'
    });
    assert.equal(reponse.status, 200);
    const corps = await reponse.json();
    assert.equal(corps.source, 'regles');
    assert.ok(corps.texte.trim().length > 0);
    app.close();
  });

  it('les autres méthodes restent refusées avec 405', async () => {
    const app = await demarrer();
    const { port } = app.address();
    const reponse = await fetch(`http://127.0.0.1:${port}/js/brain.js`, { method: 'POST' });
    assert.equal(reponse.status, 405);
    app.close();
  });
});

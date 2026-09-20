import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { repondre, fournisseurPasserelle } from './ia.js';

// Liste explicite : seuls ces chemins publics sont servis.
const FICHIERS = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/styles.css': 'styles.css',
  '/js/app.js': 'js/app.js',
  '/js/brain.js': 'js/brain.js',
  '/js/persona.js': 'js/persona.js',
  '/js/view.js': 'js/view.js'
};

// MIME corrects pour chaque fichier servi.
const TYPES = {
  'index.html': 'text/html; charset=utf-8',
  'styles.css': 'text/css; charset=utf-8',
  'js/app.js': 'text/javascript; charset=utf-8',
  'js/brain.js': 'text/javascript; charset=utf-8',
  'js/persona.js': 'text/javascript; charset=utf-8',
  'js/view.js': 'text/javascript; charset=utf-8'
};

// Corps d'une requête, avec une limite : un client ne dicte pas la mémoire du serveur.
async function lireCorps(req, octetsMax = 64 * 1024) {
  const morceaux = [];
  let taille = 0;
  for await (const morceau of req) {
    taille += morceau.length;
    if (taille > octetsMax) {
      throw new Error('corps trop long');
    }
    morceaux.push(morceau);
  }
  return Buffer.concat(morceaux).toString('utf8');
}

export function createApp({ publicDir, version = 'dev', fournisseurIA, delaiMax = 3500 } = {}) {
  // Sans les variables d'environnement, le fournisseur est null : l'assistant tourne aux règles.
  const fournisseur = fournisseurIA === undefined ? fournisseurPasserelle(process.env) : fournisseurIA;
  const serveur = http.createServer((req, res) => {
    traiter(req, res).catch(() => {
      // Dernier filet : ne jamais laisser la requête sans réponse.
      if (!res.headersSent) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      }
      res.end('Erreur interne');
    });
  });

  // Seule porte non statique : elle passe le message au module IA et renvoie {texte, source}.
  async function traiterChat(req, res) {
    let message = '';
    let historique = [];
    try {
      const donnees = JSON.parse(await lireCorps(req));
      message = donnees?.message;
      if (Array.isArray(donnees?.historique)) {
        historique = donnees.historique;
      }
    } catch {
      // Corps illisible : on laisse la validation répondre, sans planter.
    }
    const resultat = await repondre({ message, fournisseur, historique, delaiMax });
    const corps = JSON.stringify(resultat);
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(corps) });
    res.end(corps);
  }

  async function traiter(req, res) {
    const methode = (req.method ?? 'GET').toUpperCase();
    let chemin = null;
    try {
      // URL puis décodage : tout encodage suspect hors liste donne 404.
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      chemin = decodeURIComponent(url.pathname);
    } catch {
      chemin = null;
    }
    // La seule exception à « GET et HEAD uniquement ».
    if (methode === 'POST' && chemin === '/api/chat') {
      await traiterChat(req, res);
      return;
    }
    // Toutes les autres méthodes restent refusées (outillage statique J1).
    if (methode !== 'GET' && methode !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Méthode non autorisée');
      return;
    }
    if (chemin === null) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Non trouvé');
      return;
    }
    // Métadonnée de version fournie au démarrage.
    if (chemin === '/version.json') {
      const corps = JSON.stringify({ version });
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(corps) });
      res.end(methode === 'HEAD' ? '' : corps);
      return;
    }
    const relatif = FICHIERS[chemin];
    // Inconnu : 404 neutre, sans fuite du dépôt.
    if (!relatif) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Non trouvé');
      return;
    }
    try {
      // Chemin construit depuis la liste, pas depuis l’URL brute.
      const fichier = path.join(publicDir, relatif);
      const corps = await readFile(fichier);
      res.writeHead(200, { 'content-type': TYPES[relatif], 'content-length': corps.length });
      res.end(methode === 'HEAD' ? '' : corps);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Non trouvé');
    }
  }

  return serveur;
}

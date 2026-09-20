// Câblage : lire le formulaire, mettre à jour l'historique, demander l'affichage.
import { validateMessage, replyTo } from './brain.js';
import { renderMessages } from './view.js';
import { persona } from './persona.js';

const formulaire = document.querySelector('#chat-form');
const champ = document.querySelector('#message');
const liste = document.querySelector('#messages');
const statut = document.querySelector('#status');
const effacer = document.querySelector('#effacer');
const versionElt = document.querySelector('#version');
const nomElt = document.querySelector('#nom');
const emojiElt = document.querySelector('#emoji');
const accueil = document.querySelector('#accueil');
const suggestions = document.querySelector('#suggestions');

const CLE = 'capweb.historique';
const historique = [];

// Affiché dans #status, jamais comme une ligne de #messages : le contrat exige
// exactement deux lignes par échange.
const MODE_DEGRADE = 'Mode dégradé : l’IA n’a pas répondu, voici la réponse de mes règles.';

// La page ne connaît que sa propre porte. Elle ignore tout de la passerelle et de la clé.
async function demanderReponse(message) {
  try {
    const reponse = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, historique })
    });
    if (!reponse.ok) {
      throw new Error(`api ${reponse.status}`);
    }
    const donnees = await reponse.json();
    if (typeof donnees?.texte === 'string' && donnees.texte.trim() !== '') {
      return { texte: donnees.texte, source: donnees.source === 'ia' ? 'ia' : 'regles' };
    }
  } catch {
    // Porte injoignable : la page se replie elle-même sur les règles.
  }
  return { texte: replyTo(message), source: 'regles' };
}

function sauvegarder() {
  localStorage.setItem(CLE, JSON.stringify(historique));
}

// L'identité vient de persona.js : elle n’est écrite qu’à un seul endroit.
function afficherIdentite() {
  nomElt.textContent = persona.nom;
  emojiElt.textContent = persona.emoji;
  accueil.textContent = persona.accueil;
  const boutons = persona.suggestions.map((question) => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.textContent = question;
    bouton.addEventListener('click', () => {
      champ.value = question;
      champ.focus();
    });
    return bouton;
  });
  suggestions.replaceChildren(...boutons);
}

// L'accueil ne s'affiche que quand la conversation est vide.
function afficher() {
  renderMessages(historique, liste, persona.nom);
  accueil.hidden = historique.length > 0;
}

function charger() {
  const brut = localStorage.getItem(CLE);
  if (brut === null) {
    return;
  }
  try {
    const donnees = JSON.parse(brut);
    if (Array.isArray(donnees)) {
      historique.push(...donnees);
    }
  } catch {
    statut.textContent = 'Conversation précédente illisible : nouvelle conversation.';
  }
}

formulaire.addEventListener('submit', async (event) => {
  event.preventDefault();
  const controle = validateMessage(champ.value);
  if (!controle.ok) {
    statut.textContent = controle.error;
    champ.focus();
    return;
  }
  const question = controle.value;
  champ.value = '';
  statut.textContent = '';
  // On demande la réponse avant d'écrire : la conversation garde deux lignes par échange.
  const { texte, source } = await demanderReponse(question);
  historique.push({ role: 'user', text: question });
  historique.push({ role: 'assistant', text: texte });
  sauvegarder();
  afficher();
  statut.textContent = source === 'ia' ? '' : MODE_DEGRADE;
  champ.focus();
});

effacer.addEventListener('click', () => {
  if (!confirm('Effacer toute la conversation ?')) {
    return;
  }
  historique.length = 0;
  localStorage.removeItem(CLE);
  afficher();
  statut.textContent = 'Conversation effacée.';
});

afficherIdentite();
charger();
afficher();

fetch('/version.json', { headers: { accept: 'application/json' } })
  .then((reponse) => (reponse.ok ? reponse.json() : null))
  .then((donnees) => {
    if (donnees && typeof donnees.version === 'string' && versionElt) {
      versionElt.textContent = `version ${donnees.version}`;
    }
  })
  .catch(() => {});

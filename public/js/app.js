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

formulaire.addEventListener('submit', (event) => {
  event.preventDefault();
  const controle = validateMessage(champ.value);
  if (!controle.ok) {
    statut.textContent = controle.error;
    champ.focus();
    return;
  }
  historique.push({ role: 'user', text: controle.value });
  historique.push({ role: 'assistant', text: replyTo(controle.value) });
  sauvegarder();
  afficher();
  champ.value = '';
  statut.textContent = '';
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

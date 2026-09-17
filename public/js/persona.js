// Identité de l'assistant. Aucun accès à la page : ce module reste pur.

export const persona = {
  nom: 'TriMalin',
  emoji: '♻️',
  accueil: 'Bonjour, je suis TriMalin ! Dites-moi quel déchet vous avez, je vous dis dans quel bac le jeter.',
  suggestions: [
    'Où jeter mes piles ?',
    'Le verre va dans quel bac ?',
    'Que faire de mes épluchures ?'
  ]
};

const NOM_MIN = 2;
const NOM_MAX = 20;
const SUGGESTIONS_ATTENDUES = 3;
const SUGGESTION_MAX = 280;

// Un emoji composé comme ♻️ s'écrit avec plusieurs codes : on compte les caractères visibles.
function caracteresVisibles(texte) {
  const decoupeur = new Intl.Segmenter('fr', { granularity: 'grapheme' });
  return [...decoupeur.segment(texte)].map((partie) => partie.segment);
}

function estEmojiUnique(valeur) {
  if (typeof valeur !== 'string') {
    return false;
  }
  const visibles = caracteresVisibles(valeur);
  return visibles.length === 1 && /\p{Extended_Pictographic}/u.test(visibles[0]);
}

export function validatePersona(persona) {
  const erreurs = [];
  if (persona === null || typeof persona !== 'object' || Array.isArray(persona)) {
    return { ok: false, erreurs: ['Le persona doit être un objet { nom, emoji, accueil, suggestions }.'] };
  }

  const { nom, emoji, accueil, suggestions } = persona;

  if (typeof nom !== 'string' || caracteresVisibles(nom.trim()).length < NOM_MIN || caracteresVisibles(nom.trim()).length > NOM_MAX) {
    erreurs.push(`Le nom doit faire de ${NOM_MIN} à ${NOM_MAX} caractères, espaces autour exclus.`);
  }

  if (!estEmojiUnique(emoji)) {
    erreurs.push('L’emoji doit être un seul emoji.');
  }

  if (typeof accueil !== 'string' || accueil.trim() === '') {
    erreurs.push('Le message d’accueil ne doit pas être vide.');
  } else if (typeof nom === 'string' && !accueil.includes(nom.trim())) {
    erreurs.push('Le message d’accueil doit contenir le nom de l’assistant.');
  }

  if (!Array.isArray(suggestions) || suggestions.length !== SUGGESTIONS_ATTENDUES) {
    erreurs.push(`Il faut exactement ${SUGGESTIONS_ATTENDUES} questions suggérées.`);
  } else {
    if (suggestions.some((question) => typeof question !== 'string' || question.trim() === '')) {
      erreurs.push('Aucune question suggérée ne doit être vide.');
    }
    if (suggestions.some((question) => typeof question === 'string' && question.length > SUGGESTION_MAX)) {
      erreurs.push(`Une question suggérée ne doit pas dépasser ${SUGGESTION_MAX} caractères.`);
    }
    if (new Set(suggestions).size !== suggestions.length) {
      erreurs.push('Les questions suggérées doivent être différentes.');
    }
  }

  return erreurs.length === 0 ? { ok: true } : { ok: false, erreurs };
}

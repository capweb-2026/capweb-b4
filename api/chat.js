// Porte d'entrée de la prod (fonction Vercel). Elle ne décide rien : elle transmet au
// module serveur, seul endroit qui parle au modèle.
// Aucune globale Node ici (process, console, Buffer) : le lint n'en autorise aucune dans api/.
import { repondre, fournisseurParDefaut } from '../server/ia.js';

export default async function handler(req, res) {
  // Un GET sert toujours de témoin : « le tuyau existe ».
  if (req.method !== 'POST') {
    res.status(200).json({ pret: true });
    return;
  }
  let corps = req.body ?? {};
  if (typeof corps === 'string') {
    try {
      corps = JSON.parse(corps);
    } catch {
      corps = {};
    }
  }
  const resultat = await repondre({
    message: corps.message,
    historique: Array.isArray(corps.historique) ? corps.historique : [],
    fournisseur: fournisseurParDefaut()
  });
  res.status(200).json(resultat);
}

// Porte d'entrée de la prod (fonction Vercel).
// Étape 1 du CP3 : prouver que le tuyau existe, avant de brancher la moindre IA.
// Aucune globale Node ici (process, console, Buffer) : le lint n'en connaît aucune dans api/.
export default function handler(req, res) {
  res.status(200).json({ pret: true });
}

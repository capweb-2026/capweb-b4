// Affichage de l'historique. Aucune règle de réponse ici.

export function renderMessages(messages, container) {
  const lignes = messages.map((msg) => {
    const li = document.createElement('li');
    const etiquette = msg.role === 'user' ? 'Vous' : 'Assistant';
    li.textContent = `${etiquette} : ${msg.text}`;
    if (msg.role === 'assistant') {
      li.classList.add('bot');
    }
    return li;
  });
  container.replaceChildren(...lignes);
}

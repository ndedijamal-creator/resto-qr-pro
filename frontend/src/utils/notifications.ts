// =====================================================================
// Petit signal sonore généré à la volée (sans fichier audio externe),
// utilisé pour alerter le personnel d'un événement important
// (nouvelle commande, appel client...).
// =====================================================================
export function jouerAlerte(frequence = 880) {
  try {
    const contexte = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillateur = contexte.createOscillator();
    const gain = contexte.createGain();
    oscillateur.type = 'sine';
    oscillateur.frequency.value = frequence;
    gain.gain.setValueAtTime(0.15, contexte.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, contexte.currentTime + 0.4);
    oscillateur.connect(gain);
    gain.connect(contexte.destination);
    oscillateur.start();
    oscillateur.stop(contexte.currentTime + 0.4);
  } catch {
    // Certains navigateurs bloquent l'audio avant une interaction utilisateur : on ignore silencieusement.
  }
}

// Affiche une notification système (hors de l'onglet) si l'utilisateur l'a autorisé.
export async function notifierSysteme(titre: string, corps: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(titre, { body: corps, icon: '/vite.svg' });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(titre, { body: corps, icon: '/vite.svg' });
    }
  }
}

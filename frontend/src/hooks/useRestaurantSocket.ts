// =====================================================================
// Hook réutilisable : connecte le personnel à la room Socket.IO de son
// restaurant afin de recevoir les événements en temps réel (nouvelles
// commandes, changements de statut, notifications).
// =====================================================================
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function useRestaurantSocket(handlers: {
  onNouvelleCommande?: (payload: any) => void;
  onCommandeMaj?: (payload: any) => void;
  onNotification?: (payload: any) => void;
}) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join_restaurant', user.restaurant_id));
    if (handlers.onNouvelleCommande) socket.on('nouvelle_commande', handlers.onNouvelleCommande);
    if (handlers.onCommandeMaj) socket.on('commande_maj', handlers.onCommandeMaj);
    if (handlers.onNotification) socket.on('notification', handlers.onNotification);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
}

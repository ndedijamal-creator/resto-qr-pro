// =====================================================================
// Gestion du temps réel avec Socket.IO
// Chaque restaurant possède sa propre "room" (room = restaurant_<id>)
// afin que les événements ne soient diffusés qu'au bon établissement.
// =====================================================================
let io = null;

function initSocket(serverInstance) {
  const { Server } = require('socket.io');

  io = new Server(serverInstance, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // Le client (staff ou table) rejoint la room de son restaurant
    socket.on('join_restaurant', (restaurantId) => {
      socket.join(`restaurant_${restaurantId}`);
    });

    // Le client final (table) rejoint aussi une room dédiée pour suivre
    // sa propre commande en direct
    socket.on('join_table', (tableId) => {
      socket.join(`table_${tableId}`);
    });

    socket.on('disconnect', () => {
      // Rien de spécifique à nettoyer ici pour l'instant
    });
  });

  return io;
}

/** Diffuse un événement à tout le personnel d'un restaurant */
function emitToRestaurant(restaurantId, event, payload) {
  if (io) io.to(`restaurant_${restaurantId}`).emit(event, payload);
}

/** Diffuse un événement au client assis à une table précise */
function emitToTable(tableId, event, payload) {
  if (io) io.to(`table_${tableId}`).emit(event, payload);
}

module.exports = { initSocket, emitToRestaurant, emitToTable };

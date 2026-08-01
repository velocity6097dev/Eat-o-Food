let ioInstance = null;

function initSockets(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Customer joins a room for their specific order to get live status updates
    socket.on('joinOrder', (orderNumber) => {
      if (orderNumber) socket.join(`order-${orderNumber}`);
    });

    // Admin/kitchen dashboard joins the shared admin room to see all new orders
    socket.on('joinAdmin', () => {
      socket.join('admin-room');
    });
  });
}

// Called whenever an order is created or its status/payment changes
function emitOrderUpdate(order) {
  if (!ioInstance) return;
  ioInstance.to(`order-${order.order_number}`).emit('orderUpdate', order);
  ioInstance.to('admin-room').emit('adminOrderUpdate', order);
}

function emitNewOrder(order) {
  if (!ioInstance) return;
  ioInstance.to('admin-room').emit('newOrder', order);
}

// --- Broad "everything in this shop" sync events -------------------------
// This is a single-restaurant app, so these broadcast to every connected
// client (customer phones + admin devices) rather than a specific room.
// Whenever the owner changes the menu, shop info, tables, categories, or
// promo codes, every open tab picks it up within moments instead of only
// on next page load / refresh.

function emitMenuUpdate() {
  if (!ioInstance) return;
  ioInstance.emit('menuUpdate');
}

function emitShopUpdate(shop) {
  if (!ioInstance) return;
  ioInstance.emit('shopUpdate', shop);
}

function emitTablesUpdate() {
  if (!ioInstance) return;
  ioInstance.emit('tablesUpdate');
}

function emitCategoriesUpdate() {
  if (!ioInstance) return;
  ioInstance.emit('categoriesUpdate');
}

function emitPromoUpdate() {
  if (!ioInstance) return;
  ioInstance.emit('promoUpdate');
}

module.exports = {
  initSockets,
  emitOrderUpdate,
  emitNewOrder,
  emitMenuUpdate,
  emitShopUpdate,
  emitTablesUpdate,
  emitCategoriesUpdate,
  emitPromoUpdate
};

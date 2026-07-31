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

module.exports = { initSockets, emitOrderUpdate, emitNewOrder };

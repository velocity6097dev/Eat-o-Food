<?php
// ============================================================
// POST /api/orders/cancel.php
// Body: { "order_id": 123 }
//
// Deletes an order from the database. Due to ON DELETE CASCADE
// in the database schema, this automatically deletes the
// associated rows in the `order_items` table.
// ============================================================

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

$input = get_json_body();
$orderId = (int) ($input['order_id'] ?? 0);

if ($orderId <= 0) {
    send_error('A valid order ID is required', 400);
}

try {
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);

    // Check if a row was actually deleted
    if ($stmt->rowCount() > 0) {
        send_json([
            'success' => true,
            'message' => 'Order cancelled and removed successfully.'
        ]);
    } else {
        // If rowCount is 0, the order didn't exist (maybe already deleted)
        send_json([
            'success' => false,
            'error'   => 'Order not found or already removed.'
        ], 404);
    }
} catch (Exception $e) {
    send_error('Failed to cancel order: ' . $e->getMessage(), 500);
}
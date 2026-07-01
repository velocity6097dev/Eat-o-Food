<?php
// ============================================================
// GET /api/orders/get.php?id=123
// Returns one order and its items — used by tracking.html to
// poll status (placed -> preparing -> ready -> completed).
// ============================================================

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$orderId = (int) ($_GET['id'] ?? 0);
if ($orderId <= 0) {
    send_error('A valid order id is required');
}

$stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
$stmt->execute([$orderId]);
$order = $stmt->fetch();

if (!$order) {
    send_error('Order not found', 404);
}

$itemsStmt = $pdo->prepare(
    "SELECT item_name AS name, price, quantity FROM order_items WHERE order_id = ?"
);
$itemsStmt->execute([$orderId]);
$order['items'] = $itemsStmt->fetchAll();

send_json(['success' => true, 'order' => $order]);

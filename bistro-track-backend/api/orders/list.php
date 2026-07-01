<?php
// ============================================================
// GET /api/orders/list.php?table=12
// Order history for a table — replaces the client-only
// `orderHistory` array currently kept in localStorage.
// ============================================================

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$tableNumber = trim($_GET['table'] ?? '');
if ($tableNumber === '') {
    send_error('A table query parameter is required');
}

$stmt = $pdo->prepare(
    "SELECT id, table_number, total, payment_status, status, created_at
     FROM orders
     WHERE table_number = ?
     ORDER BY created_at DESC"
);
$stmt->execute([$tableNumber]);

send_json(['success' => true, 'orders' => $stmt->fetchAll()]);

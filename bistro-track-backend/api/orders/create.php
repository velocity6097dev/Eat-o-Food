<?php
// ============================================================
// POST /api/orders/create.php
// Body: {
//   "table_number": "12",
//   "items": [ { "id": 1, "quantity": 2 }, { "id": 4, "quantity": 1 } ],
//   "promo_code": "WELCOME20",       // optional
//   "payment_method": "UPI"          // "UPI" | "Card" | "Counter"
// }
//
// Prices are always re-read from the database — the client never
// gets to decide how much an order costs.
// ============================================================

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

$input = get_json_body();

$tableNumber   = trim((string) ($input['table_number'] ?? ''));
$items         = $input['items'] ?? [];
$promoCode     = strtoupper(trim($input['promo_code'] ?? ''));
$paymentMethod = trim($input['payment_method'] ?? 'UPI');

// Receipt number is only relevant for Counter payments, generated client-side
// and passed through so the cashier and customer see the same number.
$receiptNo = trim((string) ($input['receipt_no'] ?? ''));
if ($receiptNo === '') {
    $receiptNo = null;
}

if ($tableNumber === '' || !is_numeric($tableNumber) || (float) $tableNumber <= 0) {
    send_error('A valid table number is required');
}

if ($paymentMethod === 'Counter' && $receiptNo === null) {
    send_error('Receipt number is required for counter payments');
}

if (!is_array($items) || count($items) === 0) {
    send_error('Cart is empty');
}

// --- Look up trusted prices for every item in the cart ---
$ids = array_values(array_unique(array_map(fn($i) => (int) ($i['id'] ?? 0), $items)));
$ids = array_filter($ids, fn($id) => $id > 0);

if (count($ids) === 0) {
    send_error('Cart is empty');
}

$placeholders = implode(',', array_fill(0, count($ids), '?'));
$stmt = $pdo->prepare(
    "SELECT id, name, price FROM menu_items WHERE id IN ($placeholders) AND is_active = 1"
);
$stmt->execute($ids);

$menuMap = [];
foreach ($stmt->fetchAll() as $row) {
    $menuMap[(int) $row['id']] = $row;
}

$orderItems = [];
$subtotal = 0.0;

foreach ($items as $i) {
    $id  = (int) ($i['id'] ?? 0);
    $qty = (int) ($i['quantity'] ?? 0);

    if ($qty <= 0) {
        continue;
    }
    if (!isset($menuMap[$id])) {
        send_error("Item #$id is no longer on the menu");
    }

    $price = (float) $menuMap[$id]['price'];
    $orderItems[] = [
        'menu_item_id' => $id,
        'name'         => $menuMap[$id]['name'],
        'price'        => $price,
        'quantity'     => $qty,
    ];
    $subtotal += $price * $qty;
}

if (count($orderItems) === 0) {
    send_error('Cart is empty');
}

// --- Promo code (silently ignored if invalid, order still goes through) ---
$discountPercent = 0.0;
$appliedPromo = null;

if ($promoCode !== '') {
    $promoStmt = $pdo->prepare(
        "SELECT code, discount_percent FROM promo_codes
         WHERE code = ? AND is_active = 1
         AND (expires_at IS NULL OR expires_at > NOW())"
    );
    $promoStmt->execute([$promoCode]);
    $promo = $promoStmt->fetch();
    if ($promo) {
        $discountPercent = (float) $promo['discount_percent'];
        $appliedPromo = $promo['code'];
    }
}

// --- Bill math — mirrors the logic in cart.html (GST 5%) ---
$discountAmount   = round($subtotal * ($discountPercent / 100), 2);
$afterDiscount    = $subtotal - $discountAmount;
$gstAmount        = round($afterDiscount * 0.05, 2);
$total            = round($afterDiscount + $gstAmount);

try {
    $pdo->beginTransaction();

    $orderStmt = $pdo->prepare(
        "INSERT INTO orders
            (table_number, receipt_no, subtotal, discount_amount, gst_amount, total, promo_code, payment_method, payment_status, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')"
    );
    $orderStmt->execute([
        $tableNumber, $receiptNo, $subtotal, $discountAmount, $gstAmount, $total, $appliedPromo, $paymentMethod,
    ]);

    $orderId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        "INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)"
    );
    foreach ($orderItems as $oi) {
        $itemStmt->execute([$orderId, $oi['menu_item_id'], $oi['name'], $oi['price'], $oi['quantity']]);
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    send_error('Failed to create order: ' . $e->getMessage(), 500);
}

send_json([
    'success'        => true,
    'order_id'       => $orderId,
    'table_number'   => $tableNumber,
    'receipt_no'     => $receiptNo,
    'items'          => $orderItems,
    'bill'           => [
        'subtotal'        => $subtotal,
        'discount_amount' => $discountAmount,
        'gst_amount'      => $gstAmount,
        'total'           => $total,
    ],
    'promo_applied'  => $appliedPromo,
    'payment_method' => $paymentMethod,
    'status'         => 'pending',
], 201);
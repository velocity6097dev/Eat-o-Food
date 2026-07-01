<?php
// ============================================================
// POST /api/payment/razorpay_order.php
// Body: { "order_id": 45 }
//
// Creates a Razorpay order for the exact amount stored in our
// `orders` table (never trust an amount sent from the browser),
// and hands back the razorpay_order_id the frontend needs to
// open the Razorpay checkout widget.
// ============================================================

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/razorpay.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

$input = get_json_body();
$orderId = (int) ($input['order_id'] ?? 0);

if ($orderId <= 0) {
    send_error('A valid order_id is required');
}

$stmt = $pdo->prepare("SELECT id, total FROM orders WHERE id = ?");
$stmt->execute([$orderId]);
$order = $stmt->fetch();

if (!$order) {
    send_error('Order not found', 404);
}

$amountPaise = (int) round($order['total'] * 100);

$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_USERPWD        => RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode([
        'amount'   => $amountPaise,
        'currency' => 'INR',
        'receipt'  => 'order_' . $orderId,
    ]),
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    send_error('Could not reach Razorpay: ' . $curlError, 502);
}

$razorpayOrder = json_decode($response, true);

if ($httpCode !== 200 || !isset($razorpayOrder['id'])) {
    $msg = $razorpayOrder['error']['description'] ?? 'Unknown Razorpay error';
    send_error('Failed to create Razorpay order: ' . $msg, 502);
}

$update = $pdo->prepare("UPDATE orders SET razorpay_order_id = ? WHERE id = ?");
$update->execute([$razorpayOrder['id'], $orderId]);

send_json([
    'success'           => true,
    'razorpay_order_id' => $razorpayOrder['id'],
    'amount'            => $amountPaise,
    'currency'          => 'INR',
    'key_id'            => RAZORPAY_KEY_ID,
]);

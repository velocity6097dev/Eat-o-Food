<?php
// ============================================================
// POST /api/payment/razorpay_verify.php
// Body: {
//   "order_id": 45,
//   "razorpay_order_id": "order_xxx",
//   "razorpay_payment_id": "pay_xxx",
//   "razorpay_signature": "..."
// }
//
// This is the step that actually proves the payment is genuine.
// Razorpay's checkout.js handler on the frontend only tells you
// "the popup finished" — it does NOT prove the money moved.
// The signature is an HMAC-SHA256 of order_id|payment_id signed
// with your key secret, so only Razorpay (who has the secret)
// could have produced it.
// ============================================================

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/razorpay.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

$input = get_json_body();

$orderId            = (int) ($input['order_id'] ?? 0);
$razorpayOrderId    = $input['razorpay_order_id'] ?? '';
$razorpayPaymentId  = $input['razorpay_payment_id'] ?? '';
$razorpaySignature  = $input['razorpay_signature'] ?? '';

if (!$orderId || !$razorpayOrderId || !$razorpayPaymentId || !$razorpaySignature) {
    send_error('Missing payment verification fields');
}

$expectedSignature = hash_hmac(
    'sha256',
    $razorpayOrderId . '|' . $razorpayPaymentId,
    RAZORPAY_KEY_SECRET
);

if (!hash_equals($expectedSignature, $razorpaySignature)) {
    send_error('Payment signature verification failed — payment not trusted', 400);
}

$stmt = $pdo->prepare(
    "UPDATE orders
     SET payment_status = 'paid', razorpay_payment_id = ?, status = 'preparing'
     WHERE id = ? AND razorpay_order_id = ?"
);
$stmt->execute([$razorpayPaymentId, $orderId, $razorpayOrderId]);

if ($stmt->rowCount() === 0) {
    send_error('Order/payment mismatch — nothing updated', 404);
}

send_json(['success' => true, 'message' => 'Payment verified', 'order_id' => $orderId]);

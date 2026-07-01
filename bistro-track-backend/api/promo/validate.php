<?php
// ============================================================
// POST /api/promo/validate.php
// Body: { "code": "WELCOME20" }
// ============================================================

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed', 405);
}

$input = get_json_body();
$code = strtoupper(trim($input['code'] ?? ''));

if ($code === '') {
    send_error('Promo code is required');
}

$stmt = $pdo->prepare(
    "SELECT code, discount_percent FROM promo_codes
     WHERE code = ? AND is_active = 1
     AND (expires_at IS NULL OR expires_at > NOW())"
);
$stmt->execute([$code]);
$promo = $stmt->fetch();

if (!$promo) {
    send_error("Invalid or expired promo code", 404);
}

send_json([
    'success'          => true,
    'code'             => $promo['code'],
    'discount_percent' => (float) $promo['discount_percent'],
]);

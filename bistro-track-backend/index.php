<?php
header('Content-Type: application/json; charset=UTF-8');

echo json_encode([
    'name'    => 'Eat-o-Food (Bistro Track) API',
    'status'  => 'ok',
    'note'    => 'Owner-side endpoints are intentionally left out until that UI is finalised.',
    'endpoints' => [
        'GET  /api/menu.php'                     => 'Full menu grouped by category',
        'GET  /api/settings.php'                 => 'Restaurant details (name, hours, UPI id)',
        'POST /api/promo/validate.php'           => 'Body: {code}',
        'POST /api/orders/create.php'            => 'Body: {table_number, items[], promo_code?, payment_method}',
        'GET  /api/orders/get.php?id=1'          => 'Single order + items + status',
        'GET  /api/orders/list.php?table=12'     => 'Order history for a table',
        'POST /api/payment/razorpay_order.php'   => 'Body: {order_id} -> creates Razorpay order',
        'POST /api/payment/razorpay_verify.php'  => 'Body: {order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature}',
    ],
], JSON_PRETTY_PRINT);

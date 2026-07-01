<?php
// ============================================================
// Visit this file directly in your browser after uploading:
//   https://yoursite.infinityfreeapp.com/backend/api/_diagnostics/check.php
//
// It checks the two things most likely to trip you up on shared
// hosting: the DB connection, and whether outbound curl to an
// external API (Razorpay) is allowed on your account. Delete
// this file once everything's confirmed working.
// ============================================================

header('Content-Type: application/json; charset=UTF-8');

$results = [];

// --- 1. PHP / extensions ---
$results['php_version'] = PHP_VERSION;
$results['pdo_mysql_available'] = extension_loaded('pdo_mysql');
$results['curl_available'] = function_exists('curl_init');

// --- 2. Database connection ---
try {
    require __DIR__ . '/../../config/database.php'; // sets $pdo or exits with its own JSON error
    $count = $pdo->query("SELECT COUNT(*) AS c FROM menu_items")->fetch();
    $results['database'] = [
        'connected' => true,
        'menu_items_found' => (int) $count['c'],
    ];
} catch (Throwable $e) {
    $results['database'] = ['connected' => false, 'error' => $e->getMessage()];
}

// --- 3. Outbound curl to an external host (what Razorpay needs) ---
if (function_exists('curl_init')) {
    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_USERPWD        => 'test:test', // deliberately invalid — we just want to see if we can reach the server at all
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(['amount' => 100, 'currency' => 'INR']),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    // A 401 Unauthorized response means we successfully reached Razorpay
    // (our fake credentials were rejected, which is expected and fine).
    // A curl error or empty response means outbound requests are blocked.
    $results['outbound_curl_to_razorpay'] = [
        'reached_server' => $httpCode > 0,
        'http_code'      => $httpCode,
        'curl_error'     => $error ?: null,
        'verdict'        => $httpCode === 401
            ? 'Working — got the expected 401 from Razorpay with fake credentials.'
            : (($httpCode > 0)
                ? 'Reached a server but got an unexpected response — check details above.'
                : 'Could not reach Razorpay at all. Outbound curl is likely blocked/unreliable on this account.'),
    ];
} else {
    $results['outbound_curl_to_razorpay'] = 'curl extension not available';
}

echo json_encode($results, JSON_PRETTY_PRINT);

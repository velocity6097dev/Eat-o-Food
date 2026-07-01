<?php
// ============================================================
// Database connection (PDO / MySQL)
//
// InfinityFree (or any shared host) values live here — get all
// four from your control panel: Databases -> MySQL Databases ->
// look at the row for your database, then click "Admin" to
// confirm you're pointed at the right one.
//
//   DB_HOST -> "DB Server" / "Hostname", e.g. sql123.infinityfree.com
//              (NOT "localhost" — shared hosts run MySQL on a
//              separate server from your PHP files)
//   DB_NAME -> full prefixed name, e.g. epiz_12345678_eatofood
//   DB_USER -> full prefixed name, e.g. epiz_12345678
//   DB_PASS -> the password you set when creating the database
//
// If you're instead running this locally in XAMPP/Laragon for
// testing, use: host=localhost, name=eat_o_food, user=root, pass=''
// ============================================================
$DB_HOST = 'sql109.infinityfree.com';   // <-- replace with your DB Hostname
$DB_NAME = 'if0_42310932_eatofood';    // <-- replace with your full DB name
$DB_USER = 'if0_42310932';             // <-- replace with your full DB username
$DB_PASS = 'Velocity6097';    // <-- replace with your DB password

// PHP-side timezone — affects date()/time() calls made in PHP itself
// (not MySQL's NOW()/CURRENT_TIMESTAMP, which is handled below).
date_default_timezone_set('Asia/Kolkata');

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    // The DB server's own system clock isn't reliably UTC or IST on
    // shared hosting, so we override the session timezone explicitly
    // on every connection. This makes NOW() / CURRENT_TIMESTAMP (used
    // by orders.created_at's default) resolve to real IST regardless
    // of whatever timezone the underlying server happens to be in.
    $pdo->exec("SET time_zone = '+05:30'");
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => 'Database connection failed. Check config/database.php — ' . $e->getMessage(),
    ]);
    exit();
}
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

$DB_HOST = 'sqlXXX.infinityfree.com';   // <-- replace with your DB Hostname
$DB_NAME = 'epiz_XXXXXXXX_eatofood';    // <-- replace with your full DB name
$DB_USER = 'epiz_XXXXXXXX';             // <-- replace with your full DB username
$DB_PASS = 'your_database_password';    // <-- replace with your DB password

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
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => 'Database connection failed. Check config/database.php — ' . $e->getMessage(),
    ]);
    exit();
}

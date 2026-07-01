<?php
// TEMPORARY — delete this file after checking. Do not leave it on a
// live server; it has no auth and exposes DB connection status.

require_once __DIR__ . '/database.php';

header('Content-Type: application/json');

$stmt = $pdo->query("SELECT NOW() AS db_now, @@session.time_zone AS session_tz");
$row = $stmt->fetch();

echo json_encode([
    'note'                  => 'This goes through the app\'s real PDO connection (config/database.php), unlike phpMyAdmin which opens its own separate session.',
    'db_now_via_app'        => $row['db_now'],
    'session_timezone'      => $row['session_tz'],
    'php_now'               => date('Y-m-d H:i:s'),
    'php_timezone_setting'  => date_default_timezone_get(),
]);
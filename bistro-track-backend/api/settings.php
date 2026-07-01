<?php
// ============================================================
// GET /api/settings.php
// Restaurant details (name, address, hours, UPI id) — currently
// hardcoded in settings.html. Seeded with the same values so
// nothing changes visually once the owner page is wired up.
// ============================================================

require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$rows = $pdo->query("SELECT `key`, `value` FROM settings")->fetchAll();

$settings = [];
foreach ($rows as $row) {
    $settings[$row['key']] = $row['value'];
}

send_json(['success' => true, 'settings' => $settings]);

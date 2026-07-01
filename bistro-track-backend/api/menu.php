<?php
// ============================================================
// GET /api/menu.php
// Returns the menu grouped by category, matching the structure
// currently hardcoded into menu.html.
// ============================================================

require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed', 405);
}

$categories = $pdo->query(
    "SELECT id, slug, name FROM categories ORDER BY sort_order ASC"
)->fetchAll();

$itemsStmt = $pdo->prepare(
    "SELECT id, name, description, price, emoji, is_veg, is_bestseller, available_from
     FROM menu_items
     WHERE category_id = ? AND is_active = 1
     ORDER BY sort_order ASC"
);

$now = date('H:i:s');
$result = [];

foreach ($categories as $cat) {
    $itemsStmt->execute([$cat['id']]);
    $items = $itemsStmt->fetchAll();

    $items = array_map(function ($item) use ($now) {
        $item['price']         = (float) $item['price'];
        $item['is_veg']        = (bool) $item['is_veg'];
        $item['is_bestseller'] = (bool) $item['is_bestseller'];
        // Fish Curry style items: hidden behind "Available from 6:00 PM"
        $item['is_available']  = $item['available_from'] === null || $item['available_from'] <= $now;
        return $item;
    }, $items);

    $result[] = [
        'id'    => (int) $cat['id'],
        'slug'  => $cat['slug'],
        'name'  => $cat['name'],
        'items' => $items,
    ];
}

send_json(['success' => true, 'categories' => $result]);

<?php
// ============================================================
// CORS — lets the frontend (running on a different origin/port,
// e.g. Live Server or Vercel) call this API from the browser.
// Tighten Access-Control-Allow-Origin to your real domain once
// the frontend is deployed somewhere fixed.
// ============================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Browsers send a pre-flight OPTIONS request before POSTs with a
// JSON body — just acknowledge it and stop.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

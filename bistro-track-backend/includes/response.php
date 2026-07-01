<?php
// ============================================================
// Small helpers so every endpoint replies in a consistent shape.
// ============================================================

function send_json($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function send_error($message, $status = 400) {
    send_json(['success' => false, 'error' => $message], $status);
}

/** Reads and JSON-decodes the request body, returns [] if empty/invalid. */
function get_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

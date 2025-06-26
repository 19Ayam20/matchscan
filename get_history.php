<?php
include_once 'config/inc.connection.php';
header('Content-Type: application/json');

try {
    $stmt = $koneksidb->query('SELECT waktu, barcode, qr, status FROM scan_history ORDER BY id DESC LIMIT 100');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $rows]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

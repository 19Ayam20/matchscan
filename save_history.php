<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once 'config/inc.connection.php';
header('Content-Type: application/json');

// Ambil data dari request
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    error_log('No data received', 3, __DIR__.'/save_history_error.log');
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

$barcode = $data['barcode'] ?? '';
$qr = $data['qr'] ?? '';
$status = $data['status'] ?? '';
$waktu = $data['waktu'] ?? date('Y-m-d H:i:s'); // gunakan waktu dari frontend jika ada

try {
    $stmt = $koneksidb->prepare('INSERT INTO scan_history (waktu, barcode, qr, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([$waktu, $barcode, $qr, $status]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    error_log($e->getMessage(), 3, __DIR__.'/save_history_error.log');
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

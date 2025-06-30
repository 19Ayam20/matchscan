<?php
    header("Cross-Origin-Opener-Policy: same-origin");
    header("Cross-Origin-Embedder-Policy: require-corp");
    // Handler AJAX untuk simpan dan ambil history
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    include_once 'config/inc.connection.php';
    header("Access-Control-Allow-Origin: *");

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'save_history') {
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents('php://input'), true);
        $barcode = isset($data['barcode']) ? $data['barcode'] : '';
        $qr = isset($data['qr']) ? $data['qr'] : '';
        $status = isset($data['status']) ? $data['status'] : '';
        $waktu = isset($data['waktu']) ? $data['waktu'] : date('Y-m-d H:i:s');
        try {
            $stmt = $koneksidb->prepare('INSERT INTO scan_history (waktu, barcode, qr, status) VALUES (?, ?, ?, ?)');
            $stmt->execute(array($waktu, $barcode, $qr, $status));
            echo json_encode(array('success' => true));
        } catch (PDOException $e) {
            echo json_encode(array('success' => false, 'message' => $e->getMessage()));
        }
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_history') {
        header('Content-Type: application/json');
        // Ambil parameter paging & search
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $start = isset($_GET['start']) ? intval($_GET['start']) : 0;
        $length = isset($_GET['length']) ? intval($_GET['length']) : 10;
        try {
            // Total records
            $totalStmt = $koneksidb->query('SELECT COUNT(*) FROM scan_history');
            $totalRecords = $totalStmt->fetchColumn();

            // Filtered records
            $where = '';
            $params = array();
            if ($search !== '') {
                $where = 'WHERE waktu LIKE ? OR barcode LIKE ? OR qr LIKE ? OR status LIKE ?';
                $params = array("%$search%", "%$search%", "%$search%", "%$search%");
            }
            $filteredStmt = $koneksidb->prepare("SELECT COUNT(*) FROM scan_history $where");
            $filteredStmt->execute($params);
            $filteredRecords = $filteredStmt->fetchColumn();

            // Data
            $sql = "SELECT waktu, barcode, qr, status FROM scan_history $where ORDER BY id DESC LIMIT ?, ?";
            $dataStmt = $koneksidb->prepare($sql);
            $bindIdx = 1;
            if ($search !== '') {
                foreach ($params as $v) {
                    $dataStmt->bindValue($bindIdx++, $v, PDO::PARAM_STR);
                }
            }
            $dataStmt->bindValue($bindIdx++, (int)$start, PDO::PARAM_INT);
            $dataStmt->bindValue($bindIdx++, (int)$length, PDO::PARAM_INT);
            $dataStmt->execute();
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(array(
                'success' => true,
                'data' => $rows,
                'recordsTotal' => $totalRecords,
                'recordsFiltered' => $filteredRecords
            ));
        } catch (PDOException $e) {
            echo json_encode(array('success' => false, 'message' => $e->getMessage()));
        }
        exit;
    }
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MSC YIMM PARTS</title>
    <!-- CSS -->
    <link href="assets/css/style.css" rel="stylesheet">
    <!-- BOOTSTRAP -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- JQUERY -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <!-- LIB -->
    <script src="library/html5-qrcode/minified/html5-qrcode.min.js"></script>

</head>

<body class="bg-light h-100 w-100">
    <div class="container-fluid d-flex align-items-center justify-content-center min-vh-100">
        <div class="row justify-content-center w-100">
            <!-- <div id="cameraWarning" class="alert alert-danger d-none text-center mb-3">
                Browser/Device tidak mendukung fitur kamera. Gunakan file upload!
            </div> -->
            <div class="col-md-8">
                <div class="card shadow mb-5">
                    <div class="card-header bg-primary text-white">
                        <h3 class="card-title text-center">Barcode & QR Code Matching</h3>
                    </div>
                    <div class="card-body">
                        <!-- Barcode Scanner -->
                        <div class="mb-4">
                            <h5 class="text-center">Barcode Packing</h5>
                            <div class="btn-group w-100 mb-2" role="group">
                                <input type="radio" class="btn-check" name="barcodeMethod" id="barcodeFile" checked>
                                <label class="btn btn-outline-primary" for="barcodeFile">Scan/File Upload</label>

                                <!-- <input type="radio" class="btn-check" name="barcodeMethod" id="barcodeCamera">
                                <label class="btn btn-outline-primary" for="barcodeCamera">Camera</label> -->
                            </div>

                            <div id="barcodeFileDiv"
                                class="<?php echo isset($_POST['barcodeMethod']) && $_POST['barcodeMethod'] == 'camera' ? 'd-none' : ''; ?>">
                                <input type="file" id="barcodeFileInput" class="form-control" accept="image/*">
                                <div class="text-center">
                                    <img id="barcodePreview" class="img-fluid mt-2 d-none" alt="Barcode Preview"
                                        style="max-width: 300px;">
                                </div>
                            </div>
                            <div id="barcodeCameraDiv"
                                class="<?php echo isset($_POST['barcodeMethod']) && $_POST['barcodeMethod'] == 'camera' ? 'd-none' : ''; ?>">
                                <div class="d-none" id="barcodeReader"></div>
                            </div>
                            <input type="text" id="barcodeInput" class="form-control mt-2 text-muted"
                                placeholder="Barcode value will appear here">
                            <div class="row mt-2">
                                <div class="col-md-4 mb-2">
                                    <input type="text" id="barcodeField1" class="form-control" placeholder="Field 1 (1-11)" disabled>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <input type="text" id="barcodeField2" class="form-control" placeholder="Field 2 (12-25)" disabled>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <input type="text" id="barcodeField3" class="form-control" placeholder="Field 3 (26-69)" disabled>
                                </div>
                            </div>
                        </div>

                        <!-- QR Code Scanner -->
                        <div class="mb-4">
                            <h5 class="text-center">QR Code Label</h5>
                            <div class="btn-group w-100 mb-2" role="group">
                                <input type="radio" class="btn-check" name="qrMethod" id="qrFile" checked>
                                <label class="btn btn-outline-primary" for="qrFile">Scan/File Upload</label>

                                <!-- <input type="radio" class="btn-check" name="qrMethod" id="qrCamera">
                                <label class="btn btn-outline-primary" for="qrCamera">Camera</label> -->
                            </div>

                            <div id="qrFileDiv"
                                class="<?php echo isset($_POST['qrMethod']) && $_POST['qrMethod'] == 'camera' ? 'd-none' : ''; ?>">
                                <input type="file" id="qrFileInput" class="form-control" accept="image/*">
                                <div class="text-center">
                                    <img id="qrPreview" class="img-fluid mt-2 d-none" alt="QR Preview"
                                        style="max-width: 300px;">
                                </div>
                            </div>
                            <div id="qrCameraDiv"
                                class="<?php echo !isset($_POST['qrMethod']) || $_POST['qrMethod'] != 'camera' ? 'd-none' : ''; ?>">
                                <div id="qrReader"></div>
                            </div>

                            <input type="text" id="qrInput" class="form-control mt-2 text-muted"
                                placeholder="QR code value will appear here">
                            <input type="text" id="qrExtracted" class="form-control mt-2" placeholder="QR Extracted (40-54)" disabled>
                        </div>

                        <!-- Result -->
                        <div id="result" class="text-center mt-4">
                            <p class="display-4 font-weight-bolder"></p>
                        </div>

                        <!-- Reset -->
                        <div id="resetButtonDiv" class="text-center mt-3">
                            <button id="resetButton" class="btn btn-danger p-3" style="font-weight: bold;">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card shadow mb-5">
                    <div class="card-header bg-primary text-white">
                        <h3 class="card-title text-center">History Scan</h3>
                    </div>
                    <div class="card-body">
                        <!-- History -->
                        <div id="history" class="mt-4">
                            <div class="d-flex flex-wrap align-items-center mb-2 gap-2">
                                <div>
                                    <label for="historyPageSize" class="me-1">Show</label>
                                    <select id="historyPageSize" class="form-select form-select-sm d-inline-block" style="width: auto;">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span class="ms-1">entries</span>
                                </div>
                                <div class="ms-auto">
                                    <input id="historySearch" type="search" class="form-control form-control-sm" placeholder="Cari..." style="width: 180px;">
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-sm align-middle" id="historyTable">
                                    <thead class="text-center table-dark">
                                        <tr>
                                            <th>Waktu</th>
                                            <th>Barcode</th>
                                            <th>QR</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-break" style="width: 90px; font-size: 12px;"></tbody>
                                </table>
                            </div>
                            <div class="d-flex flex-wrap align-items-center justify-content-between mt-2">
                                <div id="historyInfo" class="small text-muted"></div>
                                <div id="historyPagination" class=""></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Audio -->
    <audio id="beepSound" src="assets/audio/beep.mp3"></audio>
    <audio id="okSound" src="assets/audio/ok.mp3"></audio>
    <audio id="ngSound" src="assets/audio/ng.mp3"></audio>

    <script src="assets/js/scan.js"></script>
    <script src="assets/js/history-table.js"></script>
</body>

</html>
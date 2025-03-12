<?php
header("Cross-Origin-Opener-Policy: same-origin");
header("Cross-Origin-Embedder-Policy: require-corp");
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Matchcode Operasional</title>
    <!-- Di header index.php -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="library/html5-qrcode/minified/html5-qrcode.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

</head>

<!-- Di body index.php -->

<body class="bg-light h-100 w-100">
    <div class="container-fluid mt-5">
        <div class="row justify-content-center">
            <div id="cameraWarning" class="alert alert-danger d-none text-center mb-3">
                Browser/Device tidak mendukung fitur kamera. Gunakan file upload!
            </div>
            <div class="col-md-10">
                <div class="card shadow mb-5">
                    <div class="card-header bg-primary text-white">
                        <h3 class="card-title text-center">Barcode & QR Code Matching</h3>
                    </div>
                    <div class="card-body">
                        <!-- Barcode Scanner -->
                        <div class="mb-4">
                            <h5 class="text-center">Scan Barcode Packing</h5>
                            <div class="btn-group w-100 mb-2" role="group">
                                <input type="radio" class="btn-check" name="barcodeMethod" id="barcodeFile" checked>
                                <label class="btn btn-outline-primary" for="barcodeFile">File Upload</label>

                                <input type="radio" class="btn-check" name="barcodeMethod" id="barcodeCamera">
                                <label class="btn btn-outline-primary" for="barcodeCamera">Camera</label>
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
                                <div class="w-100" id="barcodeReader"></div>
                            </div>
                            <input type="text" id="barcodeInput" class="form-control mt-2 text-muted" readonly
                                placeholder="Barcode value will appear here">
                        </div>

                        <!-- QR Code Scanner -->
                        <div class="mb-4">
                            <h5 class="text-center">Scan QR Code Label</h5>
                            <div class="btn-group w-100 mb-2" role="group">
                                <input type="radio" class="btn-check" name="qrMethod" id="qrFile" checked>
                                <label class="btn btn-outline-primary" for="qrFile">File Upload</label>

                                <input type="radio" class="btn-check" name="qrMethod" id="qrCamera">
                                <label class="btn btn-outline-primary" for="qrCamera">Camera</label>
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

                            <input type="text" id="qrInput" class="form-control mt-2 text-muted" readonly
                                placeholder="QR code value will appear here">
                        </div>

                        <!-- Result -->
                        <div id="result" class="text-center mt-4">
                            <p class="display-4 font-weight-bolder"></p>
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

    <script src="js/scan.js"></script>
</body>

</html>
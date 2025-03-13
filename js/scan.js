let html5QrcodeScanner = null;
let barcodeScanner = null;

// Handle method selection for barcode
document.querySelectorAll('input[name="barcodeMethod"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const isCamera = document.getElementById("barcodeCamera").checked;
    const fileDiv = document.getElementById("barcodeFileDiv");
    const cameraDiv = document.getElementById("barcodeCameraDiv");

    if (isCamera) {
      fileDiv.classList.add("d-none");
      cameraDiv.classList.remove("d-none");
      startBarcodeScanner();
    } else {
      cameraDiv.classList.add("d-none");
      fileDiv.classList.remove("d-none");
      stopBarcodeScanner();
    }
  });
});

// Handle method selection for QR
document.querySelectorAll('input[name="qrMethod"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const isCamera = document.getElementById("qrCamera").checked;
    const fileDiv = document.getElementById("qrFileDiv");
    const cameraDiv = document.getElementById("qrCameraDiv");

    if (isCamera) {
      fileDiv.classList.add("d-none");
      cameraDiv.classList.remove("d-none");
      startQRScanner();
    } else {
      cameraDiv.classList.add("d-none");
      fileDiv.classList.remove("d-none");
      stopQRScanner();
    }
  });
});

// File handling for barcode
document.getElementById("barcodeFileInput").addEventListener("change", (e) => {
  const reader = new FileReader();
  const file = e.target.files[0];

  if (file) {
    // Preview gambar sebelum diproses
    reader.onload = function (event) {
      const imgElement = document.getElementById("barcodePreview");
      imgElement.src = event.target.result;
      imgElement.classList.remove("d-none");
    };
    reader.readAsDataURL(file);

    const html5QrCode = new Html5Qrcode("barcodeReader");
    const config = {
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417 ]
    };

    html5QrCode
      .scanFile(file, true, config)
      .then((decodedText) => {
        document.getElementById("barcodeInput").value = decodedText;
        checkMatch();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to read PDF417 barcode. Please try another image.");
      });
  }
});

// File handling for QR
document.getElementById("qrFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  if (file) {
    // Preview gambar sebelum diproses
    reader.onload = function (event) {
      const imgElement = document.getElementById("qrPreview");
      imgElement.src = event.target.result;
      imgElement.classList.remove("d-none");
    };
    reader.readAsDataURL(file);

    // Proses scan QR
    const html5QrCode = new Html5Qrcode("qrReader");
    const config = {
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
    };

    html5QrCode
      .scanFile(file, true, config)
      .then((decodedText) => {
        document.getElementById("qrInput").value = decodedText;
        checkMatch();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to read QR code. Please try another image.");
      });
  }
});

async function startBarcodeScanner() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Browser tidak mendukung akses kamera");
    }

    if (barcodeScanner) {
      await barcodeScanner.clear();
    }

    barcodeScanner = new Html5Qrcode("barcodeReader");
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417 ],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    };

    await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    await barcodeScanner.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        document.getElementById("barcodeInput").value = decodedText;
        document.getElementById("beepSound").play(); // Add beep sound
        // Stop scanner after successful scan
        await stopBarcodeScanner();
        // Switch back to file upload
        document.getElementById("barcodeFile").checked = true;
        document.getElementById("barcodeCameraDiv").classList.add("d-none");
        document.getElementById("barcodeFileDiv").classList.remove("d-none");
        checkMatch();
      },
      (error) => {
        // Ignore scanning errors
        if (error?.message?.includes("No barcode found")) {
          return;
        }
        console.warn(error);
      }
    );
  } catch (err) {
    console.error(`Camera error:`, err);

    if (err.name === "NotAllowedError") {
      alert("Mohon izinkan akses kamera di pengaturan browser Anda");
    } else if (err.name === "NotFoundError") {
      alert("Kamera tidak ditemukan");
    } else if (err.name === "NotReadableError") {
      alert("Kamera sedang digunakan aplikasi lain");
    } else {
      alert("Gagal mengakses kamera: " + err.message);
    }

    // Switch back to file upload
    document.getElementById("barcodeFile").checked = true;
    const event = new Event("change");
    document.getElementById("barcodeFile").dispatchEvent(event);
  }
}

function startQRScanner() {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear();
  }

  html5QrcodeScanner = new Html5Qrcode("qrReader");
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    }
  };

  html5QrcodeScanner
    .start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        document.getElementById("qrInput").value = decodedText;
        document.getElementById("beepSound").play(); // Add beep sound
        // Stop scanner after successful scan
        await stopQRScanner();
        // Switch back to file upload
        document.getElementById("qrFile").checked = true;
        document.getElementById("qrCameraDiv").classList.add("d-none");
        document.getElementById("qrFileDiv").classList.remove("d-none");
        checkMatch();
      },
      (errorMessage) => {
        // console.log(errorMessage);
      }
    )
    .catch((err) => {
      console.error(`Unable to start scanning: ${err}`);
      alert("Error starting camera. Please try file upload instead.");
    });
}

async function stopBarcodeScanner() {
  if (barcodeScanner) {
    await barcodeScanner.stop();
    barcodeScanner = null;
  }
}

async function stopQRScanner() {
  if (html5QrcodeScanner) {
    await html5QrcodeScanner.stop();
    html5QrcodeScanner = null;
  }
}

// Existing checkMatch function remains the same
function checkMatch() {
  const barcode = document.getElementById("barcodeInput").value;
  const qrCode = document.getElementById("qrInput").value;
  const resultDiv = document.getElementById("result");

  if (barcode && qrCode) {
    // Clear previous result
    resultDiv.innerHTML = '<p class="display-4 p-1 bg-secondary text-light" style="font-weight:bold">Checking...</p>';

    // Add checking delay
    setTimeout(() => {
      if (barcode === qrCode) {
        resultDiv.innerHTML =
          '<p class="display-4 p-1 bg-success text-light" style="font-weight:bold">OK</p>';
        document.getElementById("okSound").play();
      } else {
        resultDiv.innerHTML =
          '<p class="display-4 p-1 bg-danger text-light" style="font-weight:bold">NG</p>';
        document.getElementById("ngSound").play();
      }
    }, 1000); // 1000 milliseconds = 1 seconds
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("barcodeCamera").checked) {
    startBarcodeScanner();
  }
  if (document.getElementById("qrCamera").checked) {
    startQRScanner();
  }
});

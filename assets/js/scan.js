let html5QrcodeScanner = null;
let barcodeScanner = null;

// Handle method selection for barcode
document.querySelectorAll('input[name="barcodeMethod"]').forEach((radio) => {
  radio.addEventListener("change", () => {
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
  radio.addEventListener("change", () => {
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
      imgElement.style.animation = "fadeIn 0.5s ease-out";
    };
    reader.readAsDataURL(file);

    // Make sure Html5Qrcode is loaded from the html5-qrcode library before this script runs
    const html5QrCode = new Html5Qrcode("barcodeReader");
    const config = {
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
      formatsToSupport: [Html5QrcodeSupportedFormats.PDF_417],
      hideQrBoxElement: true,
      qrbox: { width: 250, height: 250 }, // Optional - defines scan area size
      showTorchButtonIfSupported: false, // Hide torch button
      showZoomSliderIfSupported: false, // Hide zoom slider
    };

    html5QrCode
      .scanFile(file, true, config)
      .then((decodedText) => {
        decodedText = decodedText.replace(
          /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
          ""
        );
        document.getElementById("barcodeInput").value = decodedText;
        fillBarcodeFields(decodedText);
        updateLihatPdfBtn();
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
      imgElement.style.animation = "fadeIn 0.5s ease-out";
    };
    reader.readAsDataURL(file);

    // Proses scan QR
    const html5QrCode = new Html5Qrcode("qrReader");
    const config = {
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      hideQrBoxElement: true,
      qrbox: { width: 250, height: 250 }, // Optional - defines scan area size
      showTorchButtonIfSupported: false, // Hide torch button
      showZoomSliderIfSupported: false, // Hide zoom slider
    };

    html5QrCode
      .scanFile(file, true, config)
      .then((decodedText) => {
        decodedText = decodedText.replace(
          /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
          ""
        ); // Tambahkan trim di sini
        document.getElementById("qrInput").value = decodedText;
        updateQrExtractedFields();
        updateLihatPdfBtn();
        checkMatch();
        document.getElementById("resetButton").focus();
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
      formatsToSupport: [Html5QrcodeSupportedFormats.PDF_417],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
    };

    await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    await barcodeScanner.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        // Trim whitespace from the decoded text
        decodedText = decodedText.replace(
          /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
          ""
        );
        document.getElementById("barcodeInput").value = decodedText;
        fillBarcodeFields(decodedText);
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
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true,
    },
  };

  html5QrcodeScanner
    .start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        decodedText = decodedText.replace(
          /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
          ""
        ); // Tambahkan trim di sini
        document.getElementById("qrInput").value = decodedText;
        updateQrExtractedFields();
        document.getElementById("beepSound").play(); // Add beep sound
        // Stop scanner after successful scan
        await stopQRScanner();
        // Switch back to file upload
        document.getElementById("qrFile").checked = true;
        document.getElementById("qrCameraDiv").classList.add("d-none");
        document.getElementById("qrFileDiv").classList.remove("d-none");
      },
      () => {
        // error callback intentionally left blank
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
  const qrExtracted = document.getElementById("qrExtracted").value;

  if (barcode && qrExtracted) {
    // Ambil substring barcode dari karakter ke-12 sampai ke-25 (indeks 11-25)
    const barcodeSub = barcode.substring(11, 25);
    // Animasi checking
    showResult("Checking...", "#ffffff", "bg-secondary");

    setTimeout(() => {
      let status = "NG";
      if (barcodeSub === qrExtracted) {
        showResult("OK", "#ffffff", "bg-success");
        document.getElementById("okSound").play();
        status = "OK";
      } else {
        showResult("NG", "#ffffff", "bg-danger");
        document.getElementById("ngSound").play();
      }
      addHistory(barcodeSub, qrExtracted, status);
    }, 1000);
  }
}

/*
  Function to add history entry
  This function creates a new row in the history table with the current date, barcode, QR, and status
  It also applies the appropriate CSS class based on the status (OK or NG)
*/
function saveHistoryToDB(barcode, qr, status, time) {
  fetch("index.php?action=save_history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode, qr, status, waktu: time }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        console.log(
          "Gagal simpan history: " + (data.message || "Unknown error")
        );
      } else {
        // Jika sukses, fetch ulang history dari database (dengan paging/search)
        loadHistoryFromDB();
      }
    })
    .catch((err) => {
      console.log("AJAX error: " + err);
    });
}

function addHistory(barcode, qr, status) {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const time =
    now.toLocaleDateString("id-ID", options) +
    " - " +
    now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  // Tidak langsung tambah ke tabel, hanya simpan ke database
  saveHistoryToDB(barcode, qr, status, time);
}

// On DOMContentLoaded, setup search/page size and load first page
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("barcodeInput").focus();
  loadHistoryFromDB();
});

// Reset button handler
document.getElementById("resetButton").addEventListener("click", function () {
  let btn = document.getElementById("lihatPdfBtn");

  // Remove the Lihat PDF button if it exists
  if (btn) {
    btn.remove();
  }

  // Reset input values
  document.getElementById("barcodeInput").value = "";
  document.getElementById("qrInput").value = "";

  // Reset preview images
  document.getElementById("barcodePreview").classList.add("d-none");
  document.getElementById("qrPreview").classList.add("d-none");

  // Reset file inputs
  document.getElementById("barcodeFileInput").value = "";
  document.getElementById("qrFileInput").value = "";

  // Reset result display
  document.getElementById("result").innerHTML =
    '<p class="display-4 font-weight-bolder"></p>';

  // Stop any active scanners
  stopBarcodeScanner();
  stopQRScanner();

  // Reset to file upload mode
  document.getElementById("barcodeFile").checked = true;
  document.getElementById("qrFile").checked = true;

  // Show file upload divs and hide camera divs
  document.getElementById("barcodeFileDiv").classList.remove("d-none");
  document.getElementById("barcodeCameraDiv").classList.add("d-none");
  document.getElementById("qrFileDiv").classList.remove("d-none");
  document.getElementById("qrCameraDiv").classList.add("d-none");

  // Kosongkan field pecahan barcode
  document.getElementById("barcodeField1").value = "";
  document.getElementById("barcodeField2").value = "";
  document.getElementById("barcodeField3").value = "";
  document.getElementById("qrExtracted").value = "";

  // Set focus back to barcode input
  document.getElementById("barcodeInput").focus();
});

// Auto-focus ke input barcode saat halaman dimuat
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("barcodeInput").focus();
});

// Handle Enter key untuk physical scanner
document
  .getElementById("barcodeInput")
  .addEventListener("keypress", function (e) {
    if (e.key == "Enter") {
      e.preventDefault();
      this.value = this.value.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
      document.getElementById("qrInput").focus();
    }
  });

document.getElementById("qrInput").addEventListener("input", function () {
  updateLihatPdfBtn();
});

document.getElementById("qrInput").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const qrValue = this.value.replace(
      /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
      ""
    );
    this.value = qrValue;
    updateQrExtractedFields();
    updateLihatPdfBtn();
    checkMatch();
    setTimeout(() => {
      document.getElementById("resetButton").focus();
    }, 1500);
  }
});

function updateLihatPdfBtn() {
  const qrValue = document.getElementById("qrInput").value.trim();
  let btn = document.getElementById("lihatPdfBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "lihatPdfBtn";
    btn.className = "btn btn-warning mt-2 w-100";
    btn.style.display = "none";
    btn.textContent = "LIHAT PDF";
    btn.type = "button";
    document.getElementById("qrInput").parentNode.appendChild(btn);
  }
  if (qrValue && (qrValue.endsWith(".pdf") || qrValue.includes(".pdf"))) {
    let href = qrValue.trim();
    if (!/^https?:\/\//i.test(href))
      href = "https://" + href.replace(/^https?:\/\//i, "");
    btn.onclick = () => window.open(href, "_blank");
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
    btn.onclick = null;
  }
}

// Function to fill barcode fields based on the input
function fillBarcodeFields(barcode) {
  document.getElementById("barcodeField1").value =
    barcode.substring(0, 10) || "";
  document.getElementById("barcodeField2").value =
    barcode.substring(11, 25) || "";
  document.getElementById("barcodeField3").value =
    barcode.substring(25, 69) || "";
}

// Function to extract the QR code value from the input
// Assuming the QR code is a URL and we want to extract a specific part
function extractQrValue(qrCode) {
  if (qrCode && qrCode.length >= 54 && qrCode.startsWith("http")) {
    return qrCode.substring(40, 54);
  }
  return qrCode || "";
}

function updateBarcodeFields() {
  const barcode = document.getElementById("barcodeInput").value;
  fillBarcodeFields(barcode);
}

function updateQrExtractedFields() {
  const qrCode = document.getElementById("qrInput").value;
  document.getElementById("qrExtracted").value = extractQrValue(qrCode);
  // checkMatch(); // HAPUS agar tidak double
}

document
  .getElementById("barcodeInput")
  .addEventListener("input", updateBarcodeFields);
// document.getElementById("qrInput").addEventListener("input", updateQrExtractedFields);

function showResult(message, color, bgColor) {
  const resultElement = document.getElementById("result").querySelector("p");
  resultElement.textContent = message;
  resultElement.style.color = color;
  resultElement.style.fontWeight = "bold";

  // Reset animation
  resultElement.style.animation = "none";
  void resultElement.offsetWidth;
  resultElement.style.animation = "resultPop 0.5s ease-out";

  // Animasi background
  resultElement.classList.remove("bg-secondary", "bg-success", "bg-danger");
  resultElement.classList.add(bgColor);
  resultElement.style.transition = "all 0.5s ease";
}

// DataTable-like History Table Logic
// State for paging/search
let historyPage = 1;
let historyPageSize = 10;
let historySearch = '';
let historyTotal = 0;
let historyFiltered = 0;

function updateHistoryInfo(start, end, total, filtered) {
  const info = document.getElementById('historyInfo');
  if (!info) return;
  if (filtered === 0) {
    info.textContent = 'No entries to show';
  } else {
    info.textContent = `Showing ${start} to ${end} of ${filtered} entries${filtered !== total ? ' (filtered from ' + total + ' total)' : ''}`;
  }
}

function updateHistoryPagination(page, pageSize, filtered) {
  const pag = document.getElementById('historyPagination');
  if (!pag) return;
  pag.innerHTML = '';
  const totalPages = Math.ceil(filtered / pageSize);
  if (totalPages <= 1) return;
  // Prev
  const prev = document.createElement('button');
  prev.className = 'btn btn-sm btn-outline-primary mx-1';
  prev.textContent = 'Prev';
  prev.disabled = page === 1;
  prev.onclick = () => { if (page > 1) { historyPage = page - 1; loadHistoryFromDB(); } };
  pag.appendChild(prev);
  // Page numbers (max 5)
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm ' + (i === page ? 'btn-primary' : 'btn-outline-primary') + ' mx-1';
    btn.textContent = i;
    btn.disabled = i === page;
    btn.onclick = () => { historyPage = i; loadHistoryFromDB(); };
    pag.appendChild(btn);
  }
  // Next
  const next = document.createElement('button');
  next.className = 'btn btn-sm btn-outline-primary mx-1';
  next.textContent = 'Next';
  next.disabled = page === totalPages;
  next.onclick = () => { if (page < totalPages) { historyPage = page + 1; loadHistoryFromDB(); } };
  pag.appendChild(next);
}

function loadHistoryFromDB() {
  const params = new URLSearchParams({
    action: 'get_history',
    start: (historyPage - 1) * historyPageSize,
    length: historyPageSize,
    search: historySearch
  });
  fetch('index.php?' + params.toString())
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const tbody = document.querySelector('#history tbody');
        tbody.innerHTML = '';
        data.data.forEach(row => {
          const statusClass = row.status === "OK" ? "text-success" : "text-danger";
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${row.waktu}</td><td>${row.barcode}</td><td>${row.qr}</td><td class="fw-bold text-center ${statusClass}">${row.status}</td>`;
          tbody.appendChild(tr);
        });
        historyTotal = data.recordsTotal || data.data.length;
        historyFiltered = data.recordsFiltered || data.data.length;
        // Info
        const start = historyFiltered === 0 ? 0 : (historyPage - 1) * historyPageSize + 1;
        const end = Math.min(historyPage * historyPageSize, historyFiltered);
        updateHistoryInfo(start, end, historyTotal, historyFiltered);
        updateHistoryPagination(historyPage, historyPageSize, historyFiltered);
      }
    });
}

function setupHistorySearch() {
  const searchInput = document.getElementById('historySearch');
  if (!searchInput) return;
  let searchTimeout = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      historySearch = this.value.trim();
      historyPage = 1;
      loadHistoryFromDB();
    }, 400);
  });
}

function setupHistoryPageSize() {
  const pageSizeSel = document.getElementById('historyPageSize');
  if (!pageSizeSel) return;
  pageSizeSel.addEventListener('change', function () {
    historyPageSize = parseInt(this.value, 10) || 10;
    historyPage = 1;
    loadHistoryFromDB();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setupHistorySearch();
  setupHistoryPageSize();
  loadHistoryFromDB();
});

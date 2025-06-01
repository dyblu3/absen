// Data storage menggunakan localStorage
let absensi = JSON.parse(localStorage.getItem('absensi')) || [];
let namaSuggestions = JSON.parse(localStorage.getItem('namaSuggestions')) || [];
let mapelSuggestions = JSON.parse(localStorage.getItem('mapelSuggestions')) || [];

function updateDatalists() {
  const namaDatalist = document.getElementById('namaSuggestions');
  const mapelDatalist = document.getElementById('mapelSuggestions');
  namaDatalist.innerHTML = '';
  mapelDatalist.innerHTML = '';

  namaSuggestions.forEach(namaItem => {
    const option = document.createElement('option');
    option.value = namaItem;
    namaDatalist.appendChild(option);
  });

  mapelSuggestions.forEach(mapelItem => {
    const option = document.createElement('option');
    option.value = mapelItem;
    mapelDatalist.appendChild(option);
  });
}

// Fungsi untuk menyimpan data dan update daftar saran
function simpanData() {
  const nama = document.getElementById('nama').value.trim();
  const mapel = document.getElementById('mapel').value.trim();
  const status = document.getElementById('status').value;
  const fee = parseInt(document.getElementById('fee').value) || 0;
  const catatan = document.getElementById('catatan').value;
  const tanggal = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (!nama || !mapel) {
    Swal.fire({
      icon: 'warning',
      title: 'Peringatan',
      text: 'Nama dan Mata Pelajaran harus diisi!'
    });
    return;
  }

  // Update suggestion jika entri baru
  if (!namaSuggestions.includes(nama)) {
    namaSuggestions.push(nama);
    localStorage.setItem('namaSuggestions', JSON.stringify(namaSuggestions));
  }
  if (!mapelSuggestions.includes(mapel)) {
    mapelSuggestions.push(mapel);
    localStorage.setItem('mapelSuggestions', JSON.stringify(mapelSuggestions));
  }

  absensi.unshift({ nama, mapel, status, fee, catatan, tanggal });
  localStorage.setItem('absensi', JSON.stringify(absensi));
  tampilkanData();

  // Reset form
  document.getElementById('nama').value = '';
  document.getElementById('mapel').value = '';
  document.getElementById('catatan').value = '';
  document.getElementById('nama').focus();
  updateDatalists();
}

// Fungsi untuk menampilkan data pada tabel dan ringkasan
function tampilkanData() {
  const tabel = document.querySelector('#tabel-absen tbody');
  tabel.innerHTML = '';
  let totalHadir = 0,
      totalFee = 0;

  absensi.forEach((data, index) => {
    tabel.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${data.nama}</td>
        <td>${data.mapel}</td>
        <td class="status-${data.status.toLowerCase()}">${data.status}</td>
        <td>Rp${data.fee.toLocaleString('id-ID')}</td>
        <td>${data.tanggal}</td>
        <td>${data.catatan || '-'}</td>
        <td>
          <button onclick="confirmHapusData(${index})" style="padding: 5px 10px; font-size: 12px;">
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </td>
      </tr>
    `;
    if (data.status === 'Hadir') {
      totalHadir++;
      totalFee += data.fee;
    }
  });

  document.getElementById('total-pertemuan').textContent = absensi.length;
  document.getElementById('total-hadir').textContent = totalHadir;
  document.getElementById('total-fee').textContent = `Rp${totalFee.toLocaleString('id-ID')}`;
  document.getElementById('rata-fee').textContent = `Rp${totalHadir > 0 ? Math.round(totalFee / totalHadir).toLocaleString('id-ID') : 0}`;
}

// Konfirmasi penghapusan untuk satu data menggunakan SweetAlert2
function confirmHapusData(index) {
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: `Hapus data ${absensi[index].nama}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  }).then(result => {
    if (result.isConfirmed) {
      hapusData(index);
      Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
    }
  });
}

// Fungsi untuk menghapus satu entri
function hapusData(index) {
  absensi.splice(index, 1);
  localStorage.setItem('absensi', JSON.stringify(absensi));
  tampilkanData();
}

// Konfirmasi penghapusan semua data menggunakan SweetAlert2
function confirmHapusSemua() {
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: 'Semua data akan dihapus!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus semuanya!',
    cancelButtonText: 'Batal'
  }).then(result => {
    if (result.isConfirmed) {
      hapusSemua();
      Swal.fire('Terhapus!', 'Semua data berhasil dihapus.', 'success');
    }
  });
}

// Fungsi untuk menghapus semua entri
function hapusSemua() {
  absensi = [];
  localStorage.removeItem('absensi');
  tampilkanData();
}

// Export data sebagai CSV
function exportToCSV() {
  let csv = 'Nama,Mata Pelajaran,Status,Fee,Tanggal,Catatan\n';
  absensi.forEach(data => {
    csv += `"${data.nama}","${data.mapel}","${data.status}",${data.fee},"${data.tanggal}","${data.catatan || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `absensi-privat_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

// Export data sebagai PDF menggunakan jsPDF dan AutoTable
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Data Absensi Privat", 14, 20);
  doc.autoTable({ html: '#tabel-absen', startY: 25 });
  doc.save(`absensi-privat_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Export data sebagai Excel menggunakan SheetJS (xlsx)
function exportToExcel() {
  const worksheetData = [
    ["Nama", "Mata Pelajaran", "Status", "Fee", "Tanggal", "Catatan"],
    ...absensi.map(item => [
      item.nama,
      item.mapel,
      item.status,
      item.fee,
      item.tanggal,
      item.catatan || ""
    ])
  ];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Absensi");
  XLSX.writeFile(wb, `absensi-privat_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Fungsi toggle mode gelap
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Inisialisasi data halaman
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
  tampilkanData();
  updateDatalists();
});
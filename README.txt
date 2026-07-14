PATCH v7.2 — GALERI HASIL MURID

FUNGSI BAHARU
- Menambah menu "Hasil Murid".
- Menambah ruangan "Galeri Hasil Murid" dalam portal.
- Galeri membaca dua jenis gambar:
  1. Gambar lama AppSheet yang disimpan sebagai laluan REKOD TP_Images/nama_fail.jpg.
  2. Gambar bukti baharu yang disimpan sebagai pautan Google Drive penuh oleh portal v7.1.
- Sistem memadankan nama fail lama dengan folder:
  https://drive.google.com/drive/folders/1iNinTVUr5DLYU7agis8_hC1G1f9CkMTE
- Penapis tersedia:
  Tingkatan, Kelas, Topik dan TP.
- Kad galeri memaparkan gambar, nama murid, kelas, topik, TP, tarikh dan guru.
- Klik gambar untuk membuka gambar penuh.
- Maksimum 80 gambar dipaparkan setiap carian supaya portal kekal pantas.

CARA PASANG

GITHUB
1. Ganti script.js
2. Ganti style.css
3. Commit changes

APPS SCRIPT
1. Ganti keseluruhan Code.gs
2. Save
3. Deploy > Manage deployments > Edit > New version > Deploy

SELEPAS PASANG
1. Buka portal.
2. Tekan Ctrl + Shift + R.
3. Tekan menu "Hasil Murid" atau scroll ke Galeri Hasil Murid.
4. Pilih Tingkatan/Kelas/Topik/TP.
5. Tekan Papar Galeri.

NOTA
- Folder gambar lama tidak dipindahkan dan tidak dipadam.
- Rekod dalam Google Sheet tidak diubah.
- Fail baharu yang diambil melalui portal v7.1 juga akan masuk galeri secara automatik.

PATCH v7.5.1 — FIX FILTER DROPDOWN KOSONG

Punca:
- Jika data PBD lambat/tersangkut dimuatkan, dropdown Tingkatan dan Kelas menjadi kosong.

Pembaikan:
- Tambah fallback Tingkatan 1 dan Tingkatan 2.
- Tambah senarai kelas asas supaya Rumusan PBD, cetakan intervensi dan analisis masih boleh dipilih.
- Data sebenar tetap dibaca daripada Apps Script apabila tekan Papar Rumusan / Cetak.

CARA PASANG

GITHUB
1. Ganti index.html
2. Ganti script.js
3. Ganti style.css
4. Commit changes

Apps Script:
- Code.gs tidak wajib diganti jika sistem sudah v7.5.
- Jika mahu selamat, boleh ganti Code.gs dan deploy semula.

Selepas pasang:
1. Tunggu 1-2 minit.
2. Buka portal.
3. Tekan Ctrl + Shift + R dua kali.
4. Cuba dropdown Tingkatan semula.

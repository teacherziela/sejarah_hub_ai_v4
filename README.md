SEJARAH HUB AI v6.2.1 - ISI PBD FIX

Punca pilihan Tingkatan/Kelas kosong:
Apps Script menghantar data murid dengan nama medan kecil (tingkatan, kelas, nama), tetapi modul Isi PBD membaca nama medan lama (Tingkatan, Kelas, Nama Murid).

Versi ini membetulkan kedua-dua bahagian:
- Isi PBD: Tingkatan, Kelas dan murid keluar semula.
- Rumusan: kekal guna TP tertinggi setiap murid.
- Data MURID dan REKOD TP tidak dipadam atau diubah oleh pembetulan ini.

LANGKAH APPS SCRIPT PANITIA AI
1. Ganti Code.gs dengan apps_script_google_sheet.gs dalam pakej ini.
2. Save.
3. Run testPbdClassSummary sekali.
4. Deploy > Manage deployments > Edit > New version > Deploy.

LANGKAH GITHUB
1. Ganti index.html dan script.js.
2. Boleh ganti semua fail dalam pakej untuk paling selamat.
3. Commit changes.
4. Tunggu 1-2 minit dan tekan Ctrl+F5.

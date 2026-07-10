SEJARAH HUB AI v6.6 — IMPORT PEMETAAN TANPA API

VERSI INI TIDAK MENGGUNAKAN OPENAI API DAN TIDAK MEMERLUKAN BAYARAN TAMBAHAN.

ALIRAN KERJA
1. Guru pilih Tingkatan dan Ujian.
2. Guru upload kertas soalan ke portal.
3. Tekan "Salin Pautan untuk Abah".
4. Tampal arahan dan pautan dalam chat ChatGPT.
5. Abah analisis kertas soalan menggunakan langganan ChatGPT pengguna.
6. Abah beri fail CSV atau JSON.
7. Dalam portal, tekan "Import Pemetaan Abah".
8. Pilih fail tersebut.
9. Semak Topik dan Aras yang terisi.
10. Tekan "Simpan Pemetaan Item".

FORMAT CSV
Soalan,Topik,Aras
O1,Bab 1: Mengenali Sejarah,Rendah
O2,Bab 1: Mengenali Sejarah,Sederhana

FORMAT JSON
{
  "items": [
    {"soalan":"O1","topik":"Bab 1: Mengenali Sejarah","aras":"Rendah"}
  ]
}

ARAS YANG DITERIMA
- Rendah
- Sederhana
- Tinggi

GITHUB — GANTI
- index.html
- script.js
- style.css
- admin.html
- admin.js

APPS SCRIPT
- Ganti Code.gs menggunakan apps_script_google_sheet.gs.
- Save.
- Deploy > Manage deployments > Edit > New version > Deploy.
- Buka portal dan tekan Ctrl+F5.

NOTA
- Tidak perlu simpan OPENAI_API_KEY.
- Property OPENAI_API_KEY dan OPENAI_MODEL boleh dipadam daripada Script Properties.
- Fail kertas soalan masih disimpan dalam Google Drive.

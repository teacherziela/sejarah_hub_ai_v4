SEJARAH HUB AI v6.4.1 — OBJEKTIF 0/1 + PEMETAAN TOPIK DAN ARAS

PEMBETULAN UTAMA
1. Markah Objektif hanya boleh dipilih:
   - 1 • Betul
   - 0 • Salah
   - kosong jika belum diisi
2. Nilai 0.5 tidak lagi boleh dimasukkan melalui portal.
3. Apps Script turut memaksa nilai Objektif menjadi 0 atau 1.
4. Pemetaan item hanya memerlukan:
   - Topik / Bab
   - Aras: Rendah, Sederhana atau Tinggi
5. Markah penuh tidak perlu diisi dalam pemetaan kerana sistem sudah tahu:
   - Objektif: 1 markah setiap soalan
   - Struktur: 3, 3, 4
   - Esei: 6, 6, 8
6. Ruangan SK/SP dibuang daripada paparan pemetaan.
7. Jadual analisis item kini memaparkan Aras.

ALIRAN KERJA PEMETAAN
- Seorang guru sahaja muat naik kertas soalan kepada Abah.
- Abah bantu sediakan Topik/Bab dan Aras setiap soalan.
- Pemetaan disimpan sekali mengikut Tingkatan + Ujian.
- Guru lain terus guna pemetaan yang sama.

GITHUB — GANTI
- index.html
- script.js
- style.css
- admin.html
- admin.js

APPS SCRIPT PANITIA AI
- Ganti Code.gs menggunakan apps_script_google_sheet.gs.
- Save.
- Deploy > Manage deployments > Edit > New version > Deploy.
- Buka portal dan tekan Ctrl+F5.

NOTA
- config.js tidak perlu diganti jika URL Web App masih sama.
- Tiada fail Google Sheet baharu diwujudkan.
- Tab PEMETAAN ITEM kekal dalam fail Analisis Item Sejarah 2026.

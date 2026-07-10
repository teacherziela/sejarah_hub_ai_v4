SEJARAH HUB AI v6.4 — ANALISIS PEPERIKSAAN + PBD

SAMBUNGAN DATA
1. PBD Sejarah:
   1NE4UcW7K4G_nVcxL0vU0_CVtAubzu6yOkKAWRLiVooU
2. Analisis Item Sejarah 2026:
   1cqU40Yn90G1pDf9PklITndmXiMqD5Nq06uyML7Mjk6Q

FUNGSI BARU
- Bandingkan peratus peperiksaan setiap murid dengan TP tertinggi.
- Papar murid kedua-dua lemah, TP baik tetapi peperiksaan rendah, atau sebaliknya.
- Key in / edit markah terus ke tab Master Markah.
- Kiraan automatik Objektif 20, Struktur 40, Esei 20, Jumlah 80, Peratus dan Gred.
- Pilihan Tidak Hadir (TH).
- Analisis setiap item O1–O20, S1a–S4c dan E1a–E2c.
- Pemetaan nombor soalan kepada topik dan SK/SP.
- Papar topik paling lemah dan bilangan murid lemah.
- Sistem menggunakan IDMurid/TEMP untuk rekod baharu supaya nama tersalah eja tidak memutuskan padanan.
- Rekod lama masih boleh dipadankan menggunakan nama dan padanan nama hampir yang selamat.
- Rekod duplicate Master Markah diambil baris paling akhir supaya tidak dikira dua kali.
- Fungsi auto daftar murid dan bersih duplicate yang dibuat sebelum ini turut dikekalkan dalam Code.gs v6.4.

TAB BARU YANG DISENGAJAKAN
- Pemetaan soalan memerlukan satu tab bernama PEMETAAN ITEM dalam fail Analisis Item Sejarah 2026.
- Tab ini dicipta automatik apabila sistem v6.4 mula digunakan.
- Tiada fail Google Sheet baharu diwujudkan.

GITHUB — GANTI FAIL
- index.html
- script.js
- style.css
- admin.html
- admin.js
- config.js hanya jika URL Web App berubah.

APPS SCRIPT PANITIA AI
1. Ganti Code.gs dengan kandungan apps_script_google_sheet.gs.
2. Save.
3. Deploy > Manage deployments > Edit > New version > Deploy.
4. Buka portal dan tekan Ctrl+F5.

UJIAN PANTAS
- Pilih Tingkatan 1 > ADIL > UPSA.
- Tekan Papar Analisis.
- Pilih murid dalam bahagian Key In / Edit Markah.
- Isi beberapa item dan tekan Simpan.
- Isi topik dalam Pemetaan Item dan tekan Simpan Pemetaan Item.

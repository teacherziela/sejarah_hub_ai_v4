SEJARAH HUB AI v6.5 — AI AUTO PEMETAAN TOPIK DAN ARAS

FUNGSI BAHARU
- Selepas PDF, DOC, DOCX atau gambar dimuat naik, sistem terus memanggil OpenAI API.
- AI membaca kertas soalan dan memetakan semua O1–O20, S1a–S4c dan E1a–E2c.
- AI mengisi Topik/Bab dan Aras Rendah, Sederhana atau Tinggi.
- Pemetaan terus disimpan dalam tab PEMETAAN ITEM pada fail Analisis Item Sejarah 2026.
- Butang "Analisis AI & Isi Automatik" disediakan untuk cuba semula tanpa upload semula.
- Guru masih boleh menyemak dan membetulkan pemetaan secara manual.

MODEL
- Lalai: gpt-5.6-luna.
- Model boleh ditukar melalui Script Property:
  OPENAI_MODEL = gpt-5.6-terra
- OPENAI_API_KEY mesti sudah disimpan dalam Script Properties.

GITHUB — GANTI
1. index.html
2. script.js
3. style.css
4. admin.html
5. admin.js

APPS SCRIPT PANITIA AI
1. Ganti Code.gs dengan apps_script_google_sheet.gs.
2. Ganti appsscript.json.
3. Save.
4. Run testOpenAiKeyAndPaper untuk semak key dan fail (fungsi ini tidak menggunakan kredit API).
5. Deploy > Manage deployments > Edit > New version > Deploy.
6. Benarkan akses "Connect to an external service" apabila diminta.
7. Buka portal dan tekan Ctrl+F5.
8. Untuk kertas T1 UPSA yang sudah dimuat naik, tekan "Analisis AI & Isi Automatik".

NOTA
- Fail DOCX boleh dibaca sebagai dokumen kaya, tetapi imej/rajah tertanam lebih tepat jika kertas ditukar kepada PDF.
- Setiap analisis menggunakan kredit OpenAI API.

PATCH v7.4.1 — FIX BUTANG CETAK ANALISIS

Punca:
- script.js sudah diganti, tetapi butang cetak tidak muncul kerana butang dijana melalui JavaScript dan portal/cache tidak memaparkannya.

Pembaikan:
- index.html kini mempunyai butang cetak secara terus:
  1. Cetak Analisis Peperiksaan
  2. Cetak Peperiksaan vs PBD
- index.html juga dipaksa baca script.js?v=741 dan style.css?v=741.

CARA PASANG

GITHUB
1. Ganti index.html
2. Ganti script.js
3. Ganti style.css
4. Commit changes

APPS SCRIPT
- Jika Code.gs sudah v7.3/v7.4, tak wajib ganti.
- Jika mahu selamat, ganti Code.gs juga dan deploy semula.

SELEPAS PASANG
1. Tunggu GitHub Pages 1-2 minit.
2. Buka portal.
3. Tekan Ctrl + Shift + R.
4. Pergi Analisis Peperiksaan + PBD.
5. Butang cetak akan kelihatan di bawah/sebelah Papar Analisis.

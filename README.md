SEJARAH HUB AI v6.1 - RUMUSAN KELAS TP FIX

Punca rekod kosong sebelum ini:
- Portal lama cuba kira rumusan daripada rekod yang tidak dihantar ke browser.
- REKOD TP besar, jadi pbdInit/testPbdInit boleh jadi berat.
- Versi ini kira rumusan di Apps Script terus, kemudian hantar hasil ringkas sahaja ke Hub.

Fungsi:
- Rumusan ikut KELAS sahaja.
- Tiada pilihan Topik/Guru pada rumusan.
- 1 murid = 1 TP terkini.
- Senarai TP1-TP2, tiada rekod, dan semua murid.
- Tiada DriveApp / gambar PBD terbaik.

GitHub:
Ganti index.html, script.js, style.css, config.js.
Commit, tunggu 1-2 minit, tekan Ctrl+F5.

Apps Script Panitia Ai:
Ganti Code.gs dengan apps_script_google_sheet.gs.
Ganti appsscript.json.
Save.
Run testPbdClassSummary.
Deploy > Manage deployments > Edit > New version > Deploy.

/**
 * 3K SMART AI — CODE.GS LENGKAP
 * Padam semua kod lama dalam Apps Script, kemudian tampal keseluruhan fail ini.
 * Spreadsheet: Unit 3K SMK Taman Jasmin 2
 */

const CONFIG_3K = {
  SPREADSHEET_ID: '1Yz78l8Q95_JfvrDtra_NXrEzR8UHyftn7RXo7OaO1sU',
  SHEET_INPUT: 'Input Markah',
  SHEET_KELAS: 'Data Kelas',
  FOLDER_GAMBAR_ID: '15O3JjXcBqxUM_f3J4iWrgKcvi29IWgdN',
  // Tukar nombor ini sahaja apabila masuk minggu persekolahan baharu.
  MINGGU_SEKOLAH_AKTIF: 24,
  BULAN: ['JANUARI','FEBRUARI','MAC','APRIL','MEI','JUN','JULAI','OGOS','SEPTEMBER','OKTOBER','NOVEMBER','DISEMBER']
};

function doGet(e) {
  try {
    const action = String(e && e.parameter && e.parameter.action || 'dashboard');
    if (action === 'dashboard') {
      const dashboard = getDashboard3K_();
      dashboard.success = true;
      return output3K_(dashboard);
    }
    if (action === 'save') {
      const data = JSON.parse(e && e.parameter && e.parameter.data || '{}');
      const result = simpanPenilaian3K_(data);
      updateRankingBulanan();
      return output3K_({success:true, message:'Penilaian berjaya disimpan', result});
    }
    if (action === 'updateRanking') {
      updateRankingBulanan();
      return output3K_({success:true, message:'Semua ranking bulanan berjaya dikemas kini'});
    }
    if (action === 'checkDuplicate') {
      return output3K_({success:true, duplicate:semakDuplikasi3K_(e.parameter.kelas, e.parameter.tarikh)});
    }
    if (action === 'reminder') {
      const week = Number(e.parameter.week);
      const year = Number(e.parameter.year) || new Date().getFullYear();
      const status = getWeekStatus3K_(week, year);
      return output3K_({success:true, missingClasses:status.missingClasses, assessedClasses:status.assessedClasses, week:week, year:year});
    }
    return output3K_({success:false, message:'Tindakan tidak dikenali: '+action});
  } catch (err) {
    return output3K_({success:false, message:String(err && err.message || err)});
  }
}

function doPost(e) {
  try {
    const action = e && e.parameter && e.parameter.action || '';
    if (action === 'save') {
      const data = JSON.parse(e.parameter.data || '{}');
      const image = {base64:e.parameter.imageBase64 || '', name:e.parameter.imageName || ''};
      const result = simpanPenilaian3K_(data, image);
      updateRankingBulanan();
      return output3K_({success:true, message:'Penilaian berjaya disimpan', result});
    }
    return output3K_({success:false, message:'Tindakan POST tidak dikenali'});
  } catch (err) {
    return output3K_({success:false, message:String(err && err.message || err)});
  }
}

function output3K_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ss3K_() {
  return SpreadsheetApp.openById(CONFIG_3K.SPREADSHEET_ID);
}

// Cari baris data sebenar melalui ID di kolum A. Jangan gunakan getLastRow()
// kerana formula ARRAYFORMULA Jumlah_Markah memanjang hingga ribuan baris.
function lastInputRow3K_(sheet) {
  const maxRow = sheet.getMaxRows();
  if (maxRow < 2) return 1;
  const ids = sheet.getRange(2, 1, maxRow - 1, 1).getDisplayValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0] || '').trim()) return i + 2;
  }
  return 1;
}

function inputData3K_(sheet) {
  const lastRow = lastInputRow3K_(sheet);
  return sheet.getRange(1, 1, lastRow, 19).getValues();
}

function getDashboard3K_() {
  const ss = ss3K_();
  const input = ss.getSheetByName(CONFIG_3K.SHEET_INPUT);
  if (!input) throw new Error("Sheet 'Input Markah' tidak dijumpai");

  const raw = inputData3K_(input);
  const headers = raw.shift().map(String);
  const idx = index3K_(headers);
  const grouped = {};
  const gallery = [];

  raw.forEach(row => {
    const bulanKey = normalBulan3K_(row[idx.bulan]);
    const markah = Number(row[idx.markah]);
    const kelas = namaKelas3K_(row[idx.tingkatan], row[idx.kelas]);
    if (!bulanKey || !kelas || !Number.isFinite(markah)) return;
    if (!grouped[bulanKey]) grouped[bulanKey] = {};
    if (!grouped[bulanKey][kelas]) grouped[bulanKey][kelas] = {name:kelas, total:0, records:0};
    grouped[bulanKey][kelas].total += markah;
    grouped[bulanKey][kelas].records++;
    const imageRef = String(row[17] || '').trim();
    if (imageRef) gallery.push({ref:imageRef, kelas:kelas, minggu:row[idx.minggu], tarikh:Utilities.formatDate(date3K_(row[idx.tarikh]) || new Date(),'Asia/Kuala_Lumpur','dd/MM/yyyy')});
  });

  const monthlyData = {};
  Object.keys(grouped).forEach(bulan => {
    monthlyData[formatBulan3K_(bulan)] = Object.values(grouped[bulan])
      .map(x => ({name:x.name, score:Number((x.total/x.records).toFixed(2)), records:x.records}))
      .sort((a,b) => b.score-a.score);
  });

  const classes = senaraiKelas3K_();
  const today = new Date();
  // Minggu persekolahan ditetapkan secara manual kerana cuti sekolah
  // menyebabkan nombornya tidak sama dengan minggu kalendar ISO.
  const currentWeek = CONFIG_3K.MINGGU_SEKOLAH_AKTIF;
  const currentYear = today.getFullYear();
  const assessed = new Set();

  raw.forEach(row => {
    const tarikh = date3K_(row[idx.tarikh]);
    if (!tarikh || tarikh.getFullYear() !== currentYear || Number(row[idx.minggu]) !== currentWeek) return;
    assessed.add(namaKelas3K_(row[idx.tingkatan], row[idx.kelas]).toUpperCase());
  });

  const missingClasses = classes.filter(k => !assessed.has(k.toUpperCase()));
  const visibleGallery = gallery.reverse().slice(0,30).map(x => ({url:imageData3K_(x.ref), kelas:x.kelas, minggu:x.minggu, tarikh:x.tarikh})).filter(x=>x.url);
  return {monthlyData, classes, missingClasses, currentWeek, gallery:visibleGallery, serverTime:today.toISOString()};
}

function simpanPenilaian3K_(data, image) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = ss3K_();
    const input = ss.getSheetByName(CONFIG_3K.SHEET_INPUT);
    if (!input) throw new Error("Sheet 'Input Markah' tidak dijumpai");

    const tarikh = date3K_(data.tarikh);
    if (!tarikh) throw new Error('Sila pilih tarikh yang sah');
    const fullClass = String(data.kelas || '').trim();
    if (!fullClass) throw new Error('Sila pilih kelas');

    const parsed = pecahKelas3K_(fullClass);
    const minggu = Number(data.minggu) || CONFIG_3K.MINGGU_SEKOLAH_AKTIF;
    if (!Number.isInteger(minggu) || minggu<1 || minggu>53) throw new Error('Pilihan minggu mestilah antara Minggu 1 hingga Minggu 53');
    if (semakDuplikasi3K_(fullClass, tarikh, minggu)) {
      throw new Error(`${fullClass} sudah dinilai pada minggu ${minggu}. Rekod kedua tidak dibenarkan.`);
    }

    const marks = [];
    for (let n=1; n<=9; n++) {
      const value = Number(data['k'+n] == null ? 0 : data['k'+n]);
      const max = n===9 ? 10 : 5;
      if (!Number.isFinite(value) || value<0 || value>max) {
        throw new Error(`Markah kriteria ${n} mestilah antara 0 hingga ${max}`);
      }
      marks.push(value);
    }
    const total = marks.reduce((a,b)=>a+b,0);
    if (total>50) throw new Error('Jumlah markah tidak boleh melebihi 50');

    const row = lastInputRow3K_(input) + 1;
    const bulan = formatBulan3K_(CONFIG_3K.BULAN[tarikh.getMonth()]);
    const blok = cariBlok3K_(parsed.tingkatan, parsed.kelas);
    const id = Utilities.getUuid().slice(0,8);
    const imageUrl = image && image.base64 ? uploadImage3K_(image.base64, image.name, fullClass, minggu) : '';

    // A:P sahaja. Q ialah formula Jumlah_Markah sedia ada dan tidak disentuh.
    const rowData = [id, tarikh, minggu, bulan, blok, parsed.tingkatan, parsed.kelas].concat(marks);
    input.getRange(row,1,1,16).setValues([rowData]);
    if (imageUrl) input.getRange(row,18).setValue(imageUrl);
    // Catatan di S. R dikhaskan untuk Gambar_Bukti.
    input.getRange(row,19).setValue(String(data.catatan || ''));
    SpreadsheetApp.flush();

    return {id, kelas:fullClass, minggu, bulan, jumlah:total, gambar:imageUrl};
  } finally {
    lock.releaseLock();
  }
}

function uploadImage3K_(base64, originalName, kelas, minggu) {
  const bytes=Utilities.base64Decode(base64);
  if(bytes.length>3000000) throw new Error('Gambar terlalu besar. Sila pilih gambar lain.');
  const folders=DriveApp.getFoldersByName('3K SMART AI - Gambar Bukti');
  const folder=folders.hasNext()?folders.next():DriveApp.createFolder('3K SMART AI - Gambar Bukti');
  const safe=String(kelas).replace(/[^a-zA-Z0-9_-]/g,'_');
  const name=`${safe}_M${minggu}_${Date.now()}.jpg`;
  const blob=Utilities.newBlob(bytes,'image/jpeg',name);
  const file=folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id='+file.getId()+'&sz=w1600';
}

// AppSheet menyimpan gambar sebagai laluan relatif seperti
// Input Markah_Images/abc.Gambar_Bukti.123456.jpg. Fungsi ini mencari fail
// sebenar dalam Google Drive dan menukarkannya kepada URL yang boleh dipaparkan.
function imageUrl3K_(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;

  const fileName = decodeURIComponent(raw.split('/').pop());
  const cache = CacheService.getScriptCache();
  const key = 'img3k_v2_' + Utilities.base64EncodeWebSafe(fileName).slice(0, 177);
  const cached = cache.get(key);
  if (cached) return cached;

  const folder = DriveApp.getFolderById(CONFIG_3K.FOLDER_GAMBAR_ID);
  const files = folder.getFilesByName(fileName);
  if (!files.hasNext()) return '';
  const file = files.next();
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    console.warn('Perkongsian gambar gagal: ' + err.message);
  }
  const url = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600';
  cache.put(key, url, 21600);
  return url;
}

function imageData3K_(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let file;
  const idMatch = raw.match(/[?&]id=([^&]+)/) || raw.match(/\/d\/([^/]+)/);
  try {
    if (idMatch) {
      file = DriveApp.getFileById(idMatch[1]);
    } else {
      const fileName = decodeURIComponent(raw.split('/').pop());
      const files = DriveApp.getFolderById(CONFIG_3K.FOLDER_GAMBAR_ID).getFilesByName(fileName);
      if (!files.hasNext()) return '';
      file = files.next();
    }
    const blob = file.getBlob();
    return 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (err) {
    console.warn('Gambar gagal dibaca: ' + err.message);
    return '';
  }
}

function semakDuplikasi3K_(fullClass, tarikhValue, mingguPilihan) {
  const tarikh = date3K_(tarikhValue);
  if (!tarikh) return false;
  const parsed = pecahKelas3K_(String(fullClass || '').trim());
  const minggu = Number(mingguPilihan) || CONFIG_3K.MINGGU_SEKOLAH_AKTIF;
  const tahun = tarikh.getFullYear();
  const input = ss3K_().getSheetByName(CONFIG_3K.SHEET_INPUT);
  if (!input || input.getLastRow()<2) return false;
  const data = inputData3K_(input);
  const headers = data.shift().map(String);
  const idx = index3K_(headers);
  return data.some(row => {
    const rowDate = date3K_(row[idx.tarikh]);
    return rowDate && rowDate.getFullYear()===tahun && Number(row[idx.minggu])===minggu &&
      String(row[idx.tingkatan]).trim().toUpperCase()===parsed.tingkatan.toUpperCase() &&
      String(row[idx.kelas]).trim().toUpperCase()===parsed.kelas.toUpperCase();
  });
}

function getWeekStatus3K_(week, year) {
  if (!Number.isInteger(week) || week<1 || week>53) throw new Error('Minggu tidak sah');
  const input=ss3K_().getSheetByName(CONFIG_3K.SHEET_INPUT);
  if (!input || input.getLastRow()<2) return {assessedClasses:[], missingClasses:senaraiKelas3K_()};
  const data=inputData3K_(input);
  const headers=data.shift().map(String);
  const idx=index3K_(headers);
  const assessed=new Set();
  data.forEach(row=>{
    const d=date3K_(row[idx.tarikh]);
    if(d && d.getFullYear()===year && Number(row[idx.minggu])===week){
      assessed.add(namaKelas3K_(row[idx.tingkatan],row[idx.kelas]).toUpperCase());
    }
  });
  const allClasses = senaraiKelas3K_();
  return {assessedClasses:allClasses.filter(k=>assessed.has(k.toUpperCase())), missingClasses:allClasses.filter(k=>!assessed.has(k.toUpperCase()))};
}

function getMissingClasses3K_(week, year) {
  return getWeekStatus3K_(week, year).missingClasses;
}

function updateRankingBulanan() {
  const ss = ss3K_();
  const source = ss.getSheetByName(CONFIG_3K.SHEET_INPUT);
  if (!source) throw new Error("Sheet 'Input Markah' tidak dijumpai");
  const data = inputData3K_(source);
  const headers = data.shift().map(String);
  const idx = index3K_(headers);

  CONFIG_3K.BULAN.forEach(bulan => {
    const result = {};
    data.forEach(row => {
      if (normalBulan3K_(row[idx.bulan])!==bulan) return;
      const kelas = namaKelas3K_(row[idx.tingkatan],row[idx.kelas]);
      const markah = Number(row[idx.markah]);
      if (!kelas || !Number.isFinite(markah)) return;
      if (!result[kelas]) result[kelas] = {kelas:kelas, jumlah:0, bil:0};
      result[kelas].jumlah += markah;
      result[kelas].bil++;
    });
    const output = Object.values(result)
      .map(x => [x.kelas,x.jumlah,x.bil,Number((x.jumlah/x.bil).toFixed(2))])
      .sort((a,b)=>b[3]-a[3]);
    const finalOutput = [['Rank','Kelas','Jumlah Markah','Bil Rekod','Purata']];
    output.forEach((x,i)=>finalOutput.push([i+1].concat(x)));
    const sheetName = 'bulan '+bulan.toLowerCase();
    const target = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    target.clearContents();
    target.getRange(1,1,finalOutput.length,5).setValues(finalOutput);
    target.autoResizeColumns(1,5);
  });
  return 'Ranking 12 bulan berjaya dikemas kini';
}

function senaraiKelas3K_() {
  const sh = ss3K_().getSheetByName(CONFIG_3K.SHEET_KELAS);
  if (!sh || sh.getLastRow()<2) return [];
  return sh.getRange(2,2,sh.getLastRow()-1,2).getDisplayValues()
    .map(r=>namaKelas3K_(r[0],r[1])).filter(Boolean);
}

function cariBlok3K_(tingkatan, kelas) {
  const sh = ss3K_().getSheetByName(CONFIG_3K.SHEET_KELAS);
  if (!sh || sh.getLastRow()<2) return '';
  const rows = sh.getRange(2,2,sh.getLastRow()-1,3).getDisplayValues();
  const found = rows.find(r=>String(r[0]).trim().toUpperCase()===tingkatan.toUpperCase() && String(r[1]).trim().toUpperCase()===kelas.toUpperCase());
  return found ? found[2] : '';
}

function index3K_(h) {
  const get = name => { const i=h.indexOf(name); if(i<0) throw new Error(`Lajur '${name}' tidak dijumpai`); return i; };
  return {tarikh:get('Tarikh'),minggu:get('Minggu'),bulan:get('Bulan'),tingkatan:get('Tingkatan'),kelas:get('Kelas'),markah:get('Jumlah_Markah')};
}

function pecahKelas3K_(full) {
  const parts = full.trim().split(/\s+/);
  if (parts[0].toUpperCase()==='PERALIHAN') return {tingkatan:'PERALIHAN',kelas:parts.slice(1).join(' ')};
  return {tingkatan:parts.shift(),kelas:parts.join(' ')};
}

function namaKelas3K_(tingkatan, kelas) {
  const t=String(tingkatan == null ? '' : tingkatan).trim(), k=String(kelas == null ? '' : kelas).trim();
  return t&&k ? `${t.toUpperCase()==='PERALIHAN'?'PERALIHAN':t} ${k}`.trim() : '';
}

function normalBulan3K_(value) {
  const s=String(value == null ? '' : value).trim().toUpperCase();
  return CONFIG_3K.BULAN.includes(s) ? s : '';
}

function formatBulan3K_(value) {
  const s=String(value == null ? '' : value).toLowerCase();
  return s ? s.charAt(0).toUpperCase()+s.slice(1) : '';
}

function date3K_(value) {
  if (value instanceof Date && !isNaN(value)) return value;
  if (!value) return null;
  const text=String(value).trim(), match=text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (match) {
    const parsed=new Date(Number(match[3]),Number(match[2])-1,Number(match[1]));
    return isNaN(parsed) ? null : parsed;
  }
  const d=new Date(value);
  return isNaN(d) ? null : d;
}

function minggu3K_(date) {
  const start=new Date(date.getFullYear(),0,1);
  return Math.ceil((((date-start)/86400000)+start.getDay()+1)/7);
}

// Jalankan fungsi ini sekali untuk menguji sambungan tanpa mengubah data.
function testSambungan3K() {
  const result=getDashboard3K_();
  Logger.log(JSON.stringify({kelas:result.classes.length,minggu:result.currentWeek,belumDinilai:result.missingClasses.length}));
  return 'Sambungan berjaya';
}

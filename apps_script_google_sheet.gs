// SEJARAH HUB AI v5.6.1 - Apps Script ES5 Fix
// Fungsi: Hub + PBD Native + Auto Galeri TP5/TP6

var HUB_SPREADSHEET_ID = '1IDRv2QCN08MgWWQZm861qpqAUcuVZYnwBKebbMz4bs4';
var PBD_SPREADSHEET_ID = '1NE4UcW7K4G_nVcxL0vU0_CVtAubzu6yOkKAWRLiVooU';
var PBD_GALERI_FOLDER_ID = '1iNinTVUr5DLYU7agis8_hC1G1f9CkMTE';

var SHEETS = {
  guru: { name:'BIODATA_GURU', prefix:'G', headers:['ID','Nama','Kad Pengenalan','Jawatan','Opsyen','Ijazah','Pengalaman','Kelas','Email','Telefon','Foto','Status'] },
  pengumuman: { name:'PENGUMUMAN', prefix:'P', headers:['ID','Tahun','Tajuk','Tarikh','Isi','Link','Status'] },
  dskp: { name:'DSKP', prefix:'D', headers:['ID','Tahun','Tajuk','Tingkatan','Link','Status'] },
  linkPantas: { name:'LINK_PANTAS', prefix:'L', headers:['ID','Tahun','Nama','Kategori','Link','Icon','Status'] },
  galeri: { name:'GALERI', prefix:'GA', headers:['ID','Tahun','Tajuk','Tarikh','Kelas','Penerangan','Photo','Status'] },
  bbm: { name:'BBM', prefix:'B', headers:['ID','Tahun','Tajuk','Tingkatan','Bab','Jenis','Link','Status'] }
};

function doGet(e) {
  e = e || { parameter: {} };
  var action = (e.parameter.action || 'hub');
  var year = e.parameter.year || '';

  if (action === 'list') return jsonResponse(readModule('guru'));
  if (action === 'hub') return jsonResponse(readHub(year));
  if (action === 'module') return jsonResponse(readModule(e.parameter.module || 'guru', year));
  if (action === 'pbdInit') return jsonResponse(readPbdInit());

  return jsonResponse({ success:false, message:'Action tidak sah' });
}

function doPost(e) {
  var data = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');
  var module = data.module || 'guru';

  if (data.action === 'add') return jsonResponse(addRecord(module, data));
  if (data.action === 'update') return jsonResponse(updateRecord(module, data));
  if (data.action === 'delete') return jsonResponse(deleteRecord(module, data.id));
  if (data.action === 'savePbdBatch') return jsonResponse(savePbdBatch(data.records || []));

  return jsonResponse({ success:false, message:'Action tidak sah' });
}

function getHubSs() {
  return SpreadsheetApp.openById(HUB_SPREADSHEET_ID);
}

function getPbdSs() {
  return SpreadsheetApp.openById(PBD_SPREADSHEET_ID);
}

function getSheet(module) {
  var cfg = SHEETS[module] || SHEETS.guru;
  var ss = getHubSs();
  var sh = ss.getSheetByName(cfg.name);
  if (!sh) sh = ss.insertSheet(cfg.name);
  sh.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
  return { sh: sh, cfg: cfg };
}

function readHub(year) {
  var manualGaleri = readModule('galeri', year);
  var autoGaleri = readPbdBestGallery(year, 30);

  return {
    guru: readModule('guru'),
    pengumuman: readModule('pengumuman', year),
    dskp: readModule('dskp', year),
    linkPantas: readModule('linkPantas', year),
    galeri: manualGaleri.concat(autoGaleri),
    bbm: readModule('bbm', year)
  };
}

function readModule(module, year) {
  var obj = getSheet(module);
  var sh = obj.sh;
  var values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];

  var headers = values[0];
  var out = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var hasData = false;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null) { hasData = true; break; }
    }
    if (!hasData) continue;

    var o = {};
    for (var i = 0; i < headers.length; i++) {
      o[headers[i]] = row[i] || '';
    }

    if (!year || !o.Tahun || String(o.Tahun) === String(year)) out.push(o);
  }

  return out;
}

function addRecord(module, data) {
  var obj = getSheet(module);
  var sh = obj.sh;
  var cfg = obj.cfg;
  var id = data.id || (cfg.prefix + '-' + new Date().getTime());
  var row = [];

  for (var i = 0; i < cfg.headers.length; i++) {
    var h = cfg.headers[i];
    row.push(h === 'ID' ? id : valueForHeader(h, data));
  }

  sh.appendRow(row);
  return { success:true, message:'Data berjaya ditambah', id:id };
}

function updateRecord(module, data) {
  var obj = getSheet(module);
  var sh = obj.sh;
  var cfg = obj.cfg;
  var values = sh.getDataRange().getValues();

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0]) === String(data.id)) {
      var row = [];
      for (var i = 0; i < cfg.headers.length; i++) {
        var h = cfg.headers[i];
        row.push(h === 'ID' ? data.id : valueForHeader(h, data));
      }
      sh.getRange(r + 1, 1, 1, cfg.headers.length).setValues([row]);
      return { success:true, message:'Data berjaya dikemaskini' };
    }
  }

  return { success:false, message:'ID tidak dijumpai' };
}

function deleteRecord(module, id) {
  var obj = getSheet(module);
  var sh = obj.sh;
  var values = sh.getDataRange().getValues();

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0]) === String(id)) {
      sh.deleteRow(r + 1);
      return { success:true, message:'Data berjaya dipadam' };
    }
  }

  return { success:false, message:'ID tidak dijumpai' };
}

function valueForHeader(h, d) {
  var map = {
    'Nama':'nama',
    'Kad Pengenalan':'kadPengenalan',
    'Jawatan':'jawatan',
    'Opsyen':'opsyen',
    'Ijazah':'ijazah',
    'Pengalaman':'pengalaman',
    'Kelas':'kelas',
    'Email':'email',
    'Telefon':'telefon',
    'Foto':'foto',
    'Status':'status',
    'Tahun':'tahun',
    'Tajuk':'tajuk',
    'Tarikh':'tarikh',
    'Isi':'isi',
    'Link':'link',
    'Tingkatan':'tingkatan',
    'Kategori':'kategori',
    'Icon':'icon',
    'Penerangan':'penerangan',
    'Photo':'photo',
    'Bab':'bab',
    'Jenis':'jenis'
  };

  return d[map[h]] || d[h] || '';
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowsToObjects(values) {
  if (!values || values.length <= 1) return [];
  var headers = values[0];
  var out = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var hasData = false;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null) { hasData = true; break; }
    }
    if (!hasData) continue;

    var o = {};
    for (var i = 0; i < headers.length; i++) {
      o[String(headers[i]).trim()] = row[i] || '';
    }
    out.push(o);
  }

  return out;
}

function readPbdInit() {
  var ss = getPbdSs();
  var murid = rowsToObjects(ss.getSheetByName('MURID').getDataRange().getValues());
  var topik = rowsToObjects(ss.getSheetByName('TOPIK').getDataRange().getValues());
  var rekod = rowsToObjects(ss.getSheetByName('REKOD TP').getDataRange().getValues());
  return { success:true, murid:murid, topik:topik, rekod:rekod };
}

function savePbdBatch(records) {
  if (!records || !records.length) {
    return { success:false, message:'Tiada rekod untuk disimpan' };
  }

  var ss = getPbdSs();
  var sh = ss.getSheetByName('REKOD TP');
  var now = new Date();
  var rows = [];

  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    rows.push([
      Utilities.getUuid().slice(0, 8),
      now,
      r.idMurid || '',
      r.namaMurid || '',
      r.idTopik || '',
      r.tingkatan || '',
      r.kelas || '',
      r.topik || '',
      r.sk || '',
      r.sp || '',
      r.tp || '',
      r.catatan || '',
      r.ditafsirOleh || '',
      '',
      ((r.tingkatan || '') + ' ' + (r.kelas || '')).trim()
    ]);
  }

  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 15).setValues(rows);
  return { success:true, count:rows.length, message:'Rekod TP berjaya disimpan' };
}

// Auto Galeri: paparkan hasil murid PBD terbaik daripada REKOD TP yang ada Foto dan TP 5/6.
function readPbdBestGallery(year, limit) {
  try {
    var ss = getPbdSs();
    var sh = ss.getSheetByName('REKOD TP');
    if (!sh) return [];

    var values = sh.getDataRange().getValues();
    if (values.length <= 1) return [];

    var headers = values[0];
    var idx = {};
    for (var h = 0; h < headers.length; h++) {
      idx[String(headers[h]).trim()] = h;
    }

    var folder = DriveApp.getFolderById(PBD_GALERI_FOLDER_ID);
    var rows = [];

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var tp = Number(row[idx['TP']] || 0);
      var fotoPath = String(row[idx['Foto']] || '').trim();

      if (!((tp === 5) || (tp === 6)) || !fotoPath) continue;

      var tarikh = row[idx['Tarikh']];
      var y = '';
      if (tarikh instanceof Date) y = String(tarikh.getFullYear());
      else y = String(year || '').trim();

      if (year && y && String(y) !== String(year)) continue;

      var fileName = fotoPath.split('/').pop();
      var fileUrl = findFileUrlByName_(folder, fileName);
      if (!fileUrl) continue;

      rows.push({
        ID: 'AUTO-' + String(row[idx['IDRekod']] || fileName),
        Tahun: y || String(year || ''),
        Tajuk: '⭐ Hasil Murid PBD Terbaik',
        Tarikh: tarikh,
        Kelas: row[idx['KELAS BETUL']] || ((row[idx['Tingkatan']] || '') + ' ' + (row[idx['Kelas']] || '')).trim(),
        Penerangan: (row[idx['Nama Murid']] || '') + ' • ' + (row[idx['Topik']] || '') + ' • TP' + tp,
        Photo: fileUrl,
        Status: 'Aktif'
      });
    }

    rows.sort(function(a, b) {
      return new Date(b.Tarikh).getTime() - new Date(a.Tarikh).getTime();
    });

    return rows.slice(0, limit || 30);
  } catch (err) {
    return [];
  }
}

function findFileUrlByName_(folder, fileName) {
  var files = folder.getFilesByName(fileName);
  if (!files.hasNext()) return '';
  var f = files.next();
  return 'https://drive.google.com/file/d/' + f.getId() + '/view?usp=drive_link';
}

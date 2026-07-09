// SEJARAH HUB AI v6.2.1 - ISI PBD + RUMUSAN TP TERTINGGI FIX
// Project: Apps Script Panitia Ai
// Fokus: Rumusan ikut KELAS sahaja.
// Kiraan: 1 murid = 1 TP tertinggi walaupun murid ada banyak rekod. Jika TP sama, ambil rekod terbaru.
// Tiada DriveApp / gambar PBD terbaik.

var HUB_SPREADSHEET_ID = '1IDRv2QCN08MgWWQZm861qpqAUcuVZYnwBKebbMz4bs4';
var PBD_SPREADSHEET_ID = '1NE4UcW7K4G_nVcxL0vU0_CVtAubzu6yOkKAWRLiVooU';

var SHEETS = {
  guru: { name:'BIODATA_GURU', prefix:'G', headers:['ID','Nama','Kad Pengenalan','Jawatan','Opsyen','Ijazah','Pengalaman','Kelas','Email','Telefon','Foto','Status'] },
  pengumuman: { name:'PENGUMUMAN', prefix:'P', headers:['ID','Tahun','Tajuk','Tarikh','Isi','Link','Status'] },
  dskp: { name:'DSKP', prefix:'D', headers:['ID','Tahun','Tajuk','Tingkatan','Link','Status'] },
  linkPantas: { name:'LINK_PANTAS', prefix:'L', headers:['ID','Tahun','Nama','Kategori','Link','Icon','Status'] },
  galeri: { name:'GALERI', prefix:'GA', headers:['ID','Tahun','Tajuk','Tarikh','Kelas','Penerangan','Photo','Status'] },
  bbm: { name:'BBM', prefix:'B', headers:['ID','Tahun','Tajuk','Tingkatan','Bab','Jenis','Link','Status'] }
};

function doGet(e) {
  e = e || { parameter:{} };
  var action = e.parameter.action || 'hub';
  var year = e.parameter.year || '';

  if (action === 'hub') return jsonResponse(readHub(year));
  if (action === 'list') return jsonResponse(readModule('guru'));
  if (action === 'module') return jsonResponse(readModule(e.parameter.module || 'guru', year));

  // Portal PBD
  if (action === 'pbdInitLite' || action === 'pbdInit') return jsonResponse(readPbdInitLite());
  if (action === 'pbdClassSummary') return jsonResponse(readPbdClassSummary(e.parameter.tingkatan || '', e.parameter.kelas || ''));

  // Biarkan kosong supaya portal lama tidak error
  if (action === 'pbdBestGallery') return jsonResponse([]);

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

function getHubSs(){ return SpreadsheetApp.openById(HUB_SPREADSHEET_ID); }
function getPbdSs(){ return SpreadsheetApp.openById(PBD_SPREADSHEET_ID); }

function jsonResponse(data){
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function safeRangeValues_(sh, maxCols) {
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  if (lastRow < 1) return [];
  var lastCol = Math.min(sh.getLastColumn(), maxCols || sh.getLastColumn());
  if (lastCol < 1) return [];
  return sh.getRange(1, 1, lastRow, lastCol).getValues();
}

function getSheet(module){
  var cfg = SHEETS[module] || SHEETS.guru;
  var ss = getHubSs();
  var sh = ss.getSheetByName(cfg.name);
  if (!sh) sh = ss.insertSheet(cfg.name);
  sh.getRange(1,1,1,cfg.headers.length).setValues([cfg.headers]);
  return { sh:sh, cfg:cfg };
}

function readHub(year){
  return {
    guru: readModule('guru'),
    pengumuman: readModule('pengumuman', year),
    dskp: readModule('dskp', year),
    linkPantas: readModule('linkPantas', year),
    galeri: readModule('galeri', year),
    bbm: readModule('bbm', year)
  };
}

function readModule(module, year){
  var obj = getSheet(module);
  var values = safeRangeValues_(obj.sh, 30);
  if (values.length <= 1) return [];

  var headers = values[0];
  var out = [];

  for (var r=1; r<values.length; r++){
    var row = values[r];
    if (!rowHasData_(row)) continue;
    var o = {};
    for (var i=0; i<headers.length; i++) o[String(headers[i]).trim()] = row[i] || '';
    if (!year || !o.Tahun || String(o.Tahun) === String(year)) out.push(o);
  }
  return out;
}

function addRecord(module, data){
  var obj = getSheet(module), sh = obj.sh, cfg = obj.cfg;
  var id = data.id || (cfg.prefix + '-' + new Date().getTime());
  var row = [];

  for (var i=0; i<cfg.headers.length; i++){
    var h = cfg.headers[i];
    row.push(h === 'ID' ? id : valueForHeader(h, data));
  }

  sh.appendRow(row);
  return { success:true, message:'Data berjaya ditambah', id:id };
}

function updateRecord(module, data){
  var obj = getSheet(module), sh = obj.sh, cfg = obj.cfg;
  var values = safeRangeValues_(sh, cfg.headers.length);

  for (var r=1; r<values.length; r++){
    if (String(values[r][0]) === String(data.id)){
      var row = [];
      for (var i=0; i<cfg.headers.length; i++){
        var h = cfg.headers[i];
        row.push(h === 'ID' ? data.id : valueForHeader(h, data));
      }
      sh.getRange(r+1,1,1,cfg.headers.length).setValues([row]);
      return { success:true, message:'Data berjaya dikemaskini' };
    }
  }
  return { success:false, message:'ID tidak dijumpai' };
}

function deleteRecord(module, id){
  var obj = getSheet(module), sh = obj.sh;
  var values = safeRangeValues_(sh, 5);

  for (var r=1; r<values.length; r++){
    if (String(values[r][0]) === String(id)){
      sh.deleteRow(r+1);
      return { success:true, message:'Data berjaya dipadam' };
    }
  }
  return { success:false, message:'ID tidak dijumpai' };
}

function valueForHeader(h,d){
  var map = {
    'Nama':'nama','Kad Pengenalan':'kadPengenalan','Jawatan':'jawatan','Opsyen':'opsyen','Ijazah':'ijazah',
    'Pengalaman':'pengalaman','Kelas':'kelas','Email':'email','Telefon':'telefon','Foto':'foto','Status':'status',
    'Tahun':'tahun','Tajuk':'tajuk','Tarikh':'tarikh','Isi':'isi','Link':'link','Tingkatan':'tingkatan',
    'Kategori':'kategori','Icon':'icon','Penerangan':'penerangan','Photo':'photo','Bab':'bab','Jenis':'jenis'
  };
  return d[map[h]] || d[h] || '';
}

function normalize_(s){
  return String(s || '').toLowerCase().replace(/\s+/g,'').replace(/_/g,'').trim();
}

function rowHasData_(row){
  for(var i=0;i<row.length;i++){
    if(row[i] !== '' && row[i] !== null) return true;
  }
  return false;
}

function rowsToObjects_(values){
  if (!values || values.length <= 1) return [];

  var headers = values[0];
  var out=[];

  for (var r=1; r<values.length; r++){
    var row=values[r];
    if(!rowHasData_(row)) continue;

    var o={ _row:r+1 };
    for(var i=0;i<headers.length;i++){
      var h=String(headers[i]).trim();
      o[h]=row[i] || '';
      o[normalize_(h)] = row[i] || '';
    }
    out.push(o);
  }
  return out;
}

function pick_(o, names){
  for(var i=0;i<names.length;i++){
    var n=names[i];
    if(o[n] !== undefined && o[n] !== null && String(o[n]).trim() !== '') return o[n];

    var nn=normalize_(n);
    if(o[nn] !== undefined && o[nn] !== null && String(o[nn]).trim() !== '') return o[nn];
  }
  return '';
}

function cleanName_(s){
  return String(s||'').replace(/\s*KPM-Guru\s*$/i,'').trim();
}

function getDateNum_(v){
  var d = new Date(v);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function fmtDate_(v){
  var d = new Date(v);
  if(isNaN(d.getTime())) return String(v||'');
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function tpNum_(v){
  var raw=String(v||'').replace(/[^\d.]/g,'');
  return Number(raw||0);
}

function muridObj_(o){
  var id = String(pick_(o,['IDMurid','ID Murid','ID'])).trim();
  var nama = String(pick_(o,['Nama Murid','Nama'])).trim();
  var tingkatan = String(pick_(o,['Tingkatan','Tingkat','Tingka'])).trim();
  var kelas = String(pick_(o,['Kelas'])).trim();
  var status = String(pick_(o,['Status']) || 'AKTIF').trim();

  // Hantar kedua-dua format supaya modul Rumusan dan Isi PBD sama-sama boleh baca.
  return {
    id: id,
    nama: nama,
    tingkatan: tingkatan,
    kelas: kelas,
    status: status,
    IDMurid: id,
    'Nama Murid': nama,
    Tingkatan: tingkatan,
    Kelas: kelas,
    Status: status
  };
}

function rekodObj_(o){
  var kelasBetul = String(pick_(o,['KELAS BETUL','Kelas Betul','Kelas_Betul'])).trim();
  var ting = String(pick_(o,['Tingkatan','Tingkat','Tingka'])).trim();
  var kelas = String(pick_(o,['Kelas'])).trim();

  if(kelasBetul && /^\d+/.test(kelasBetul)){
    var parts=kelasBetul.split(/\s+/);
    ting=parts.shift();
    kelas=parts.join(' ');
  }

  return {
    idRekod:String(pick_(o,['IDRekod','ID Rekod'])).trim(),
    tarikh:pick_(o,['Tarikh']),
    dateNum:getDateNum_(pick_(o,['Tarikh'])),
    idMurid:String(pick_(o,['IDMurid','ID Murid','IDMu'])).trim(),
    nama:String(pick_(o,['Nama Murid','Nama'])).trim(),
    tingkatan:ting,
    kelas:kelas,
    topik:String(pick_(o,['Topik'])).trim(),
    tp:tpNum_(pick_(o,['TP'])),
    guru:cleanName_(pick_(o,['Ditafsir_Oleh','Ditafsir Oleh','Guru','Guru Penilai'])),
    row:o._row || 0
  };
}

function readPbdInitLite(){
  var ss=getPbdSs();
  var muridSh=ss.getSheetByName('MURID');
  var topikSh=ss.getSheetByName('TOPIK');

  return {
    success:true,
    murid: muridSh ? rowsToObjects_(safeRangeValues_(muridSh, 10)).map(muridObj_) : [],
    topik: topikSh ? rowsToObjects_(safeRangeValues_(topikSh, 20)) : [],
    rekod: []
  };
}

function readPbdClassSummary(tingkatan, kelas){
  try{
    if(!tingkatan || !kelas) return { success:false, message:'Pilih tingkatan dan kelas.' };

    var ss=getPbdSs();
    var muridSh=ss.getSheetByName('MURID');
    var rekodSh=ss.getSheetByName('REKOD TP');
    var guruSh=ss.getSheetByName('GURU');

    if(!muridSh || !rekodSh) return { success:false, message:'Sheet MURID atau REKOD TP tidak dijumpai.' };

    var muridAll=rowsToObjects_(safeRangeValues_(muridSh, 10)).map(muridObj_);
    var murid=muridAll.filter(function(m){
      var st=String(m.status||'AKTIF').toUpperCase();
      return st !== 'PINDAH' && st !== 'TIDAK AKTIF' &&
        String(m.tingkatan)===String(tingkatan) &&
        String(m.kelas)===String(kelas);
    });

    var rekodAll=rowsToObjects_(safeRangeValues_(rekodSh, 15)).map(rekodObj_);

    var muridById={}, muridByName={};
    for(var i=0;i<murid.length;i++){
      if(murid[i].id) muridById[murid[i].id]=murid[i];
      muridByName[normalize_(murid[i].nama)] = murid[i];
    }

    var bestByKey={};
    var totalRecords=0;

    for(var r=0;r<rekodAll.length;r++){
      var rec=rekodAll[r];
      if(rec.tp <= 0) continue;

      var m = rec.idMurid ? muridById[rec.idMurid] : null;
      if(!m && rec.nama) m = muridByName[normalize_(rec.nama)];

      if(!m) continue;

      totalRecords++;
      var key=m.id || normalize_(m.nama);

      if(!bestByKey[key] ||
        rec.tp > bestByKey[key].tp ||
        (rec.tp === bestByKey[key].tp && rec.dateNum > bestByKey[key].dateNum) ||
        (rec.tp === bestByKey[key].tp && rec.dateNum === bestByKey[key].dateNum && rec.row > bestByKey[key].row)){
        bestByKey[key]=rec;
      }
    }

    var tpCounts={1:0,2:0,3:0,4:0,5:0,6:0};
    var noRecord=[], weak=[], allList=[];
    var adaTp=0, sumTp=0;

    for(var j=0;j<murid.length;j++){
      var student=murid[j];
      var key2=student.id || normalize_(student.nama);
      var lr=bestByKey[key2];

      if(!lr){
        noRecord.push({ id:student.id, nama:student.nama, status:'Tiada rekod' });
        allList.push({ id:student.id, nama:student.nama, tp:'', tarikh:'', guru:'', status:'Tiada rekod' });
        continue;
      }

      adaTp++;
      sumTp += lr.tp;

      if(tpCounts[lr.tp] !== undefined) tpCounts[lr.tp]++;

      var item={ id:student.id, nama:student.nama, tp:lr.tp, tarikh:fmtDate_(lr.tarikh), guru:lr.guru, topik:lr.topik };
      if(lr.tp <= 2) weak.push(item);
      allList.push(item);
    }

    weak.sort(function(a,b){ return Number(a.tp)-Number(b.tp) || a.nama.localeCompare(b.nama); });
    noRecord.sort(function(a,b){ return a.nama.localeCompare(b.nama); });
    allList.sort(function(a,b){ return a.nama.localeCompare(b.nama); });

    var guruKelas = findGuruForClass_(guruSh, tingkatan, kelas, rekodAll);

    return {
      success:true,
      tingkatan:tingkatan,
      kelas:kelas,
      guruKelas:guruKelas,
      summary:{
        totalActive:murid.length,
        adaTp:adaTp,
        tiadaTp:noRecord.length,
        weakCount:weak.length,
        tpCounts:tpCounts,
        avgTp:adaTp ? Math.round((sumTp/adaTp)*100)/100 : 0,
        totalRecords:totalRecords
      },
      weakList:weak,
      noRecordList:noRecord,
      allList:allList
    };

  }catch(err){
    return { success:false, message:String(err) };
  }
}

function findGuruForClass_(guruSh, tingkatan, kelas, rekodAll){
  var label=normalize_(String(tingkatan)+' '+String(kelas));
  var names=[];

  if(guruSh){
    var gurus=rowsToObjects_(safeRangeValues_(guruSh, 20));
    for(var i=0;i<gurus.length;i++){
      var nama=cleanName_(pick_(gurus[i],['Nama Guru','Nama']));
      var kelasDiajar=String(pick_(gurus[i],['Kelas Diajar','Kelas']));
      if(nama && normalize_(kelasDiajar).indexOf(label)>-1) names.push(nama);
    }
  }

  if(names.length) return unique_(names).slice(0,5);

  var counts={};
  for(var r=0;r<rekodAll.length;r++){
    var rec=rekodAll[r];
    if(String(rec.tingkatan)===String(tingkatan) && String(rec.kelas)===String(kelas) && rec.guru){
      counts[rec.guru]=(counts[rec.guru]||0)+1;
    }
  }

  var top=[];
  for(var k in counts) top.push([k,counts[k]]);
  top.sort(function(a,b){ return b[1]-a[1]; });

  for(var t=0;t<top.length;t++) names.push(top[t][0]);

  return unique_(names).slice(0,5);
}

function unique_(arr){
  var seen={}, out=[];
  for(var i=0;i<arr.length;i++){
    if(!seen[arr[i]]){
      seen[arr[i]]=true;
      out.push(arr[i]);
    }
  }
  return out;
}

function savePbdBatch(records){
  if(!records || !records.length) return { success:false, message:'Tiada rekod untuk disimpan' };

  var ss=getPbdSs();
  var sh=ss.getSheetByName('REKOD TP');
  if(!sh) return { success:false, message:'Sheet REKOD TP tidak dijumpai' };

  var now=new Date();
  var rows=[];

  for(var i=0;i<records.length;i++){
    var r=records[i];
    rows.push([
      Utilities.getUuid().slice(0,8),
      now,
      r.idMurid||'',
      r.namaMurid||'',
      r.idTopik||'',
      r.tingkatan||'',
      r.kelas||'',
      r.topik||'',
      r.sk||'',
      r.sp||'',
      r.tp||'',
      r.catatan||'',
      r.ditafsirOleh||'',
      '',
      ((r.tingkatan||'')+' '+(r.kelas||'')).trim()
    ]);
  }

  sh.getRange(sh.getLastRow()+1,1,rows.length,15).setValues(rows);

  return { success:true, count:rows.length, message:'Rekod TP berjaya disimpan' };
}

function testPbdClassSummary(){
  var data=readPbdClassSummary('1','CENDEKIA');
  Logger.log(JSON.stringify(data.summary));
  Logger.log('Lemah: '+data.weakList.length+' Tiada rekod: '+data.noRecordList.length);
}

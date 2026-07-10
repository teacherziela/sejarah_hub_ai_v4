// SEJARAH HUB AI v6.4.1 - OBJEKTIF 0/1 + PEMETAAN TOPIK DAN ARAS
// Project: Apps Script Panitia Ai
// Fokus: Rumusan ikut KELAS sahaja.
// Kiraan: 1 murid = 1 TP tertinggi walaupun murid ada banyak rekod. Jika TP sama, ambil rekod terbaru.
// Tiada DriveApp / gambar PBD terbaik.

var HUB_SPREADSHEET_ID = '1IDRv2QCN08MgWWQZm861qpqAUcuVZYnwBKebbMz4bs4';
var PBD_SPREADSHEET_ID = '1NE4UcW7K4G_nVcxL0vU0_CVtAubzu6yOkKAWRLiVooU';
var EXAM_SPREADSHEET_ID = '1cqU40Yn90G1pDf9PklITndmXiMqD5Nq06uyML7Mjk6Q';

var SHEETS = {
  guru: { name:'BIODATA_GURU', prefix:'G', headers:['ID','Nama','Kad Pengenalan','Jawatan','Opsyen','Ijazah','Pengalaman','Kelas','Email','Telefon','Foto','Status'] },
  pengumuman: { name:'PENGUMUMAN', prefix:'P', headers:['ID','Tahun','Tajuk','Tarikh','Isi','Link','Status'] },
  dskp: { name:'DSKP', prefix:'D', headers:['ID','Tahun','Tajuk','Tingkatan','Link','Status'] },
  linkPantas: { name:'LINK_PANTAS', prefix:'L', headers:['ID','Tahun','Nama','Kategori','Link','Icon','Status'] },
  galeri: { name:'GALERI', prefix:'GA', headers:['ID','Tahun','Tajuk','Tarikh','Kelas','Penerangan','Photo','Status'] },
  bbm: { name:'BBM', prefix:'B', headers:['ID','Tahun','Tajuk','Tingkatan','Bab','Jenis','Link','Status'] },
  itemMap: { name:'PEMETAAN ITEM', prefix:'IM', source:'exam', headers:['ID','Tingkatan','Ujian','Soalan','Topik','Aras','Markah Penuh','Status'] }
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

  // Analisis peperiksaan + PBD
  if (action === 'examInit') return jsonResponse(readExamInit());
  if (action === 'examAnalysis') return jsonResponse(readExamAnalysis(e.parameter.tingkatan || '', e.parameter.kelas || '', e.parameter.ujian || ''));
  if (action === 'examStudent') return jsonResponse(readExamStudent(e.parameter.idMurid || '', e.parameter.nama || '', e.parameter.tingkatan || '', e.parameter.kelas || '', e.parameter.ujian || ''));
  if (action === 'itemMap') return jsonResponse(readItemMap(e.parameter.tingkatan || '', e.parameter.ujian || ''));

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
  if (data.action === 'saveExamRecord') return jsonResponse(saveExamRecord(data));
  if (data.action === 'saveItemMapBatch') return jsonResponse(saveItemMapBatch(data));

  return jsonResponse({ success:false, message:'Action tidak sah' });
}

function getHubSs(){ return SpreadsheetApp.openById(HUB_SPREADSHEET_ID); }
function getPbdSs(){ return SpreadsheetApp.openById(PBD_SPREADSHEET_ID); }
function getExamSs(){ return SpreadsheetApp.openById(EXAM_SPREADSHEET_ID); }

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
  var ss = cfg.source === 'exam' ? getExamSs() : getHubSs();
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
    bbm: readModule('bbm', year),
    itemMap: readModule('itemMap')
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
  formatDateColumn_(sh, sh.getLastRow(), cfg);
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
      formatDateColumn_(sh, r+1, cfg);
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

function parseCalendarDate_(value){
  if(value instanceof Date && !isNaN(value.getTime())) return value;

  var s=String(value||'').trim();
  if(!s) return '';

  var iso=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(iso) return new Date(Number(iso[1]), Number(iso[2])-1, Number(iso[3]));

  var my=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if(my) return new Date(Number(my[3]), Number(my[2])-1, Number(my[1]));

  var d=new Date(s);
  return isNaN(d.getTime()) ? s : d;
}

function formatDateColumn_(sh, row, cfg){
  var tarikhIndex=cfg.headers.indexOf('Tarikh');
  if(tarikhIndex > -1) sh.getRange(row, tarikhIndex+1).setNumberFormat('dd/MM/yyyy');
}

function valueForHeader(h,d){
  var map = {
    'Nama':'nama','Kad Pengenalan':'kadPengenalan','Jawatan':'jawatan','Opsyen':'opsyen','Ijazah':'ijazah',
    'Pengalaman':'pengalaman','Kelas':'kelas','Email':'email','Telefon':'telefon','Foto':'foto','Status':'status',
    'Tahun':'tahun','Tajuk':'tajuk','Tarikh':'tarikh','Isi':'isi','Link':'link','Tingkatan':'tingkatan',
    'Kategori':'kategori','Icon':'icon','Penerangan':'penerangan','Photo':'photo','Bab':'bab','Jenis':'jenis',
    'Ujian':'ujian','Soalan':'soalan','Topik':'topik','SK/SP':'sksp','Markah Penuh':'markahPenuh'
  };
  var value=d[map[h]] || d[h] || '';
  return h === 'Tarikh' ? parseCalendarDate_(value) : value;
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

  var rows=[];

  for(var i=0;i<records.length;i++){
    var r=records[i];
    var selectedDate=parseCalendarDate_(r.tarikh || new Date());
    rows.push([
      Utilities.getUuid().slice(0,8),
      selectedDate,
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

  var startRow=sh.getLastRow()+1;
  sh.getRange(startRow,1,rows.length,15).setValues(rows);
  sh.getRange(startRow,2,rows.length,1).setNumberFormat('dd/MM/yyyy');

  return { success:true, count:rows.length, message:'Rekod TP berjaya disimpan' };
}

function testPbdClassSummary(){
  var data=readPbdClassSummary('1','CENDEKIA');
  Logger.log(JSON.stringify(data.summary));
  Logger.log('Lemah: '+data.weakList.length+' Tiada rekod: '+data.noRecordList.length);
}


// ============================================================
// MODUL ANALISIS PEPERIKSAAN + PBD v6.4
// Sumber markah: Analisis Item Sejarah 2026 / Master Markah
// Sumber murid & TP: PBD Sejarah / MURID + REKOD TP
// ============================================================

function examItemDefs_(){
  var out=[];
  var i;

  for(i=1;i<=20;i++) out.push({ key:'O'+i, section:'Objektif', max:1 });

  for(i=1;i<=4;i++){
    out.push({ key:'S'+i+'a', section:'Struktur', max:3 });
    out.push({ key:'S'+i+'b', section:'Struktur', max:3 });
    out.push({ key:'S'+i+'c', section:'Struktur', max:4 });
  }

  for(i=1;i<=2;i++){
    out.push({ key:'E'+i+'a', section:'Esei', max:6 });
    out.push({ key:'E'+i+'b', section:'Esei', max:6 });
    out.push({ key:'E'+i+'c', section:'Esei', max:8 });
  }

  return out;
}

function findHeaderIndex_(headers, names){
  for(var i=0;i<names.length;i++){
    var wanted=normalize_(names[i]);
    for(var c=0;c<headers.length;c++){
      if(normalize_(headers[c])===wanted) return c;
    }
  }
  return -1;
}

function ensureExamIdColumn_(sh){
  var lastCol=Math.max(1,sh.getLastColumn());
  var headers=sh.getRange(1,1,1,lastCol).getValues()[0];
  var idx=findHeaderIndex_(headers,['IDMurid','ID Murid']);

  if(idx>-1) return { index:idx, headers:headers };

  idx=headers.length;
  sh.getRange(1,idx+1).setValue('IDMurid');
  headers.push('IDMurid');

  return { index:idx, headers:headers };
}

function examValue_(row, headers, names){
  var idx=findHeaderIndex_(headers,names);
  return idx>-1 ? row[idx] : '';
}

function examNumber_(v){
  if(v===null || v===undefined || v==='') return '';
  var n=Number(v);
  return isNaN(n) ? '' : n;
}

function normalizeClass_(v){
  return String(v||'').toUpperCase().replace(/\s+/g,'').replace('PROGESIF','PROGRESIF').trim();
}

function examGrade_(percent){
  if(percent===null || percent===undefined || percent==='') return '';
  var p=Number(percent);
  if(isNaN(p)) return '';
  if(p>=82) return 'A';
  if(p>=66) return 'B';
  if(p>=50) return 'C';
  if(p>=35) return 'D';
  if(p>=20) return 'E';
  return 'F';
}

function clampScore_(v,max){
  if(v===null || v===undefined || v==='') return '';
  var n=Number(v);
  if(isNaN(n)) return '';
  if(n<0) n=0;
  if(n>max) n=max;
  return Math.round(n*100)/100;
}

function objectiveBinary_(v){
  if(v===null || v===undefined || v==='') return '';
  var n=Number(v);
  if(isNaN(n)) return '';
  return n>=0.5 ? 1 : 0;
}

function readExamRows_(){
  var ss=getExamSs();
  var sh=ss.getSheetByName('Master Markah');
  if(!sh) return { sh:null, headers:[], rows:[] };

  var idInfo=ensureExamIdColumn_(sh);
  var values=safeRangeValues_(sh,Math.max(60,sh.getLastColumn()));
  if(values.length<=1) return { sh:sh, headers:idInfo.headers, rows:[] };

  var headers=values[0];
  var defs=examItemDefs_();
  var rows=[];

  for(var r=1;r<values.length;r++){
    var row=values[r];
    if(!rowHasData_(row)) continue;

    var itemScores={};
    for(var d=0;d<defs.length;d++){
      itemScores[defs[d].key]=examNumber_(examValue_(row,headers,[defs[d].key]));
    }

    rows.push({
      _row:r+1,
      idMurid:String(examValue_(row,headers,['IDMurid','ID Murid'])||'').trim(),
      nama:String(examValue_(row,headers,['Nama Murid','Nama'])||'').trim(),
      tingkatan:String(examValue_(row,headers,['Tingkatan'])||'').trim(),
      kelas:String(examValue_(row,headers,['Kelas'])||'').trim(),
      ujian:String(examValue_(row,headers,['Ujian'])||'').trim(),
      jumlahObj:examNumber_(examValue_(row,headers,['Jumlah Obj'])),
      jumlahStruktur:examNumber_(examValue_(row,headers,['Jumlah Struktur'])),
      jumlahEsei:examNumber_(examValue_(row,headers,['Jumlah Esei'])),
      total:examNumber_(examValue_(row,headers,['JUMLAH BESAR','Jumlah Besar','Total'])),
      peratus:examNumber_(examValue_(row,headers,['Peratus'])),
      gred:String(examValue_(row,headers,['Gred'])||'').trim(),
      itemScores:itemScores,
      raw:row
    });
  }

  return { sh:sh, headers:headers, rows:rows };
}

function readExamStudents_(){
  var ss=getExamSs();
  var sh=ss.getSheetByName('Nama Murid');
  if(!sh) return [];

  var values=safeRangeValues_(sh,10);
  if(values.length<=1) return [];

  var headers=values[0];
  var out=[];

  for(var r=1;r<values.length;r++){
    var row=values[r];
    if(!rowHasData_(row)) continue;

    out.push({
      id:String(examValue_(row,headers,['IDMurid','ID Murid','f','ID'])||'').trim(),
      nama:String(examValue_(row,headers,['Nama Murid','Nama'])||'').trim(),
      tingkatan:String(examValue_(row,headers,['Tingkatan'])||'').trim(),
      kelas:String(examValue_(row,headers,['Kelas'])||'').trim(),
      ic:String(examValue_(row,headers,['NoIC/NoKP','NoIC','No KP'])||'').trim(),
      status:String(examValue_(row,headers,['Status'])||'AKTIF').trim()
    });
  }

  return out;
}

function readItemMap(tingkatan, ujian){
  var obj=getSheet('itemMap');
  var values=safeRangeValues_(obj.sh,obj.cfg.headers.length);
  var rows=rowsToObjects_(values);

  rows=rows.filter(function(x){
    var status=String(pick_(x,['Status'])||'AKTIF').toUpperCase();
    var okStatus=status!=='TIDAK AKTIF';
    var okT=!tingkatan || String(pick_(x,['Tingkatan']))===String(tingkatan);
    var okU=!ujian || normalize_(pick_(x,['Ujian']))===normalize_(ujian);
    return okStatus && okT && okU;
  });

  return { success:true, rows:rows, items:examItemDefs_() };
}

function readExamInit(){
  var exam=readExamRows_();
  var ujianMap={};

  for(var i=0;i<exam.rows.length;i++){
    if(exam.rows[i].ujian) ujianMap[exam.rows[i].ujian]=true;
  }

  var ujian=Object.keys(ujianMap).sort();
  if(!ujian.length) ujian=['UPSA'];

  return {
    success:true,
    ujian:ujian,
    items:examItemDefs_(),
    itemMap:readItemMap('','').rows
  };
}

function readExamStudent(idMurid, nama, tingkatan, kelas, ujian){
  try{
    var exam=readExamRows_();
    var target=null;

    for(var i=exam.rows.length-1;i>=0;i--){
      var row=exam.rows[i];
      var sameExam=!ujian || normalize_(row.ujian)===normalize_(ujian);
      if(!sameExam) continue;

      if(idMurid && row.idMurid && String(row.idMurid)===String(idMurid)){
        target=row;
        break;
      }

      if(!target &&
        normalize_(row.nama)===normalize_(nama) &&
        String(row.tingkatan)===String(tingkatan) &&
        normalizeClass_(row.kelas)===normalizeClass_(kelas)){
        target=row;
      }
    }

    return {
      success:true,
      found:!!target,
      record:target ? {
        idMurid:target.idMurid,
        nama:target.nama,
        tingkatan:target.tingkatan,
        kelas:target.kelas,
        ujian:target.ujian,
        itemScores:target.itemScores,
        total:target.total,
        peratus:target.peratus,
        gred:target.gred
      } : {
        idMurid:idMurid,
        nama:nama,
        tingkatan:tingkatan,
        kelas:kelas,
        ujian:ujian,
        itemScores:{}
      }
    };
  }catch(err){
    return { success:false, message:String(err) };
  }
}

function saveExamRecord(data){
  try{
    var ss=getExamSs();
    var sh=ss.getSheetByName('Master Markah');
    if(!sh) return { success:false, message:'Sheet Master Markah tidak dijumpai.' };

    var idInfo=ensureExamIdColumn_(sh);
    var headers=idInfo.headers;
    var defs=examItemDefs_();
    var scores=data.scores || {};
    var th=!!data.tidakHadir;
    var cleanScores={};

    for(var i=0;i<defs.length;i++){
      cleanScores[defs[i].key]=th
        ? ''
        : (defs[i].section==='Objektif'
          ? objectiveBinary_(scores[defs[i].key])
          : clampScore_(scores[defs[i].key],defs[i].max));
    }

    var jumlahObj=0;
    for(var o=1;o<=20;o++) jumlahObj += Number(cleanScores['O'+o]||0);

    var jumlahStruktur=0;
    for(var s=1;s<=4;s++){
      jumlahStruktur += Number(cleanScores['S'+s+'a']||0);
      jumlahStruktur += Number(cleanScores['S'+s+'b']||0);
      jumlahStruktur += Number(cleanScores['S'+s+'c']||0);
    }

    var esei1=Number(cleanScores.E1a||0)+Number(cleanScores.E1b||0)+Number(cleanScores.E1c||0);
    var esei2=Number(cleanScores.E2a||0)+Number(cleanScores.E2b||0)+Number(cleanScores.E2c||0);
    var jumlahEsei=Math.max(esei1,esei2);
    var total=jumlahObj+jumlahStruktur+jumlahEsei;
    var peratus=Math.round((total/80)*100);
    var gred=th ? 'TH' : examGrade_(peratus);

    var row=new Array(headers.length).fill('');

    function set_(names,value){
      var idx=findHeaderIndex_(headers,names);
      if(idx>-1) row[idx]=value;
    }

    set_(['Nama Murid','Nama'],String(data.namaMurid||'').trim());
    set_(['Tingkatan'],String(data.tingkatan||'').trim());
    set_(['Kelas'],String(data.kelas||'').trim().toUpperCase());
    set_(['Ujian'],String(data.ujian||'UPSA').trim().toUpperCase());
    set_(['IDMurid','ID Murid'],String(data.idMurid||'').trim());

    for(var d=0;d<defs.length;d++) set_([defs[d].key],cleanScores[defs[d].key]);

    set_(['Jumlah Obj'],th?'':jumlahObj);
    set_(['Jumlah Struktur'],th?'':jumlahStruktur);
    set_(['Jumlah Esei'],th?'':jumlahEsei);
    set_(['JUMLAH BESAR','Jumlah Besar','Total'],th?'':total);
    set_(['Peratus'],th?'':peratus);
    set_(['Gred'],gred);

    var values=safeRangeValues_(sh,headers.length);
    var targetRow=0;

    for(var r=1;r<values.length;r++){
      var rid=String(examValue_(values[r],headers,['IDMurid','ID Murid'])||'').trim();
      var rujian=String(examValue_(values[r],headers,['Ujian'])||'').trim();
      var sameExam=normalize_(rujian)===normalize_(data.ujian||'UPSA');

      if(data.idMurid && rid && String(rid)===String(data.idMurid) && sameExam){
        targetRow=r+1;
      }
    }

    if(!targetRow){
      for(var r2=1;r2<values.length;r2++){
        var sameName=normalize_(examValue_(values[r2],headers,['Nama Murid','Nama']))===normalize_(data.namaMurid);
        var sameT=String(examValue_(values[r2],headers,['Tingkatan']))===String(data.tingkatan);
        var sameK=normalizeClass_(examValue_(values[r2],headers,['Kelas']))===normalizeClass_(data.kelas);
        var sameU=normalize_(examValue_(values[r2],headers,['Ujian']))===normalize_(data.ujian||'UPSA');

        if(sameName && sameT && sameK && sameU) targetRow=r2+1;
      }
    }

    var mode='dikemaskini';

    if(targetRow){
      sh.getRange(targetRow,1,1,headers.length).setValues([row]);
    }else{
      targetRow=sh.getLastRow()+1;
      sh.getRange(targetRow,1,1,headers.length).setValues([row]);
      mode='ditambah';
    }

    return {
      success:true,
      message:'Markah berjaya '+mode,
      row:targetRow,
      jumlahObj:jumlahObj,
      jumlahStruktur:jumlahStruktur,
      jumlahEsei:jumlahEsei,
      total:th?'':total,
      peratus:th?'':peratus,
      gred:gred
    };
  }catch(err){
    return { success:false, message:String(err) };
  }
}

function saveItemMapBatch(data){
  try{
    var tingkatan=String(data.tingkatan||'').trim();
    var ujian=String(data.ujian||'').trim().toUpperCase();
    var items=data.items || [];

    if(!tingkatan || !ujian) return { success:false, message:'Tingkatan dan ujian diperlukan.' };

    var obj=getSheet('itemMap');
    var sh=obj.sh;
    var cfg=obj.cfg;
    var values=safeRangeValues_(sh,cfg.headers.length);
    var keep=[cfg.headers];

    for(var r=1;r<values.length;r++){
      var row=values[r];
      if(!rowHasData_(row)) continue;

      var sameT=String(row[1])===String(tingkatan);
      var sameU=normalize_(row[2])===normalize_(ujian);

      if(!(sameT && sameU)) keep.push(row.slice(0,cfg.headers.length));
    }

    var defs=examItemDefs_();
    var defByKey={};
    for(var d=0;d<defs.length;d++) defByKey[defs[d].key]=defs[d];

    for(var i=0;i<items.length;i++){
      var it=items[i];
      var key=String(it.soalan||'').trim();
      if(!key) continue;

      var max=defByKey[key] ? defByKey[key].max : 1;
      var aras=String(it.aras||'').trim();
      var allowed={Rendah:true,Sederhana:true,Tinggi:true};
      if(!allowed[aras]) aras='';

      keep.push([
        'IM-'+new Date().getTime()+'-'+i,
        tingkatan,
        ujian,
        key,
        String(it.topik||'').trim(),
        aras,
        max,
        'AKTIF'
      ]);
    }

    sh.clearContents();
    sh.getRange(1,1,keep.length,cfg.headers.length).setValues(keep);
    sh.getRange(1,1,1,cfg.headers.length).setFontWeight('bold');

    return { success:true, count:items.length, message:'Pemetaan item berjaya disimpan.' };
  }catch(err){
    return { success:false, message:String(err) };
  }
}

function levenshtein_(a,b){
  a=normalize_(a);
  b=normalize_(b);

  if(a===b) return 0;
  if(!a.length) return b.length;
  if(!b.length) return a.length;

  var prev=[];
  var curr=[];
  var i,j;

  for(j=0;j<=b.length;j++) prev[j]=j;

  for(i=1;i<=a.length;i++){
    curr[0]=i;

    for(j=1;j<=b.length;j++){
      var cost=a.charAt(i-1)===b.charAt(j-1)?0:1;
      curr[j]=Math.min(
        curr[j-1]+1,
        prev[j]+1,
        prev[j-1]+cost
      );
    }

    prev=curr.slice();
  }

  return prev[b.length];
}

function nameSimilarity_(a,b){
  var na=normalize_(a);
  var nb=normalize_(b);
  var maxLen=Math.max(na.length,nb.length);
  if(!maxLen) return 1;
  return 1-(levenshtein_(na,nb)/maxLen);
}

function bestTpForClass_(tingkatan,kelas){
  var ss=getPbdSs();
  var muridSh=ss.getSheetByName('MURID');
  var rekodSh=ss.getSheetByName('REKOD TP');

  var murid=rowsToObjects_(safeRangeValues_(muridSh,10)).map(muridObj_).filter(function(m){
    var st=String(m.status||'AKTIF').toUpperCase();
    return st!=='PINDAH' && st!=='TIDAK AKTIF' &&
      String(m.tingkatan)===String(tingkatan) &&
      normalizeClass_(m.kelas)===normalizeClass_(kelas);
  });

  var byId={};
  var byName={};

  for(var i=0;i<murid.length;i++){
    byId[murid[i].id]=murid[i];
    byName[normalize_(murid[i].nama)]=murid[i];
  }

  var best={};
  var rekod=rowsToObjects_(safeRangeValues_(rekodSh,15)).map(rekodObj_);

  for(var r=0;r<rekod.length;r++){
    var rec=rekod[r];
    var m=rec.idMurid ? byId[rec.idMurid] : null;
    if(!m && rec.nama) m=byName[normalize_(rec.nama)];
    if(!m || rec.tp<=0) continue;

    var key=m.id || normalize_(m.nama);

    if(!best[key] ||
      rec.tp>best[key].tp ||
      (rec.tp===best[key].tp && rec.dateNum>best[key].dateNum) ||
      (rec.tp===best[key].tp && rec.dateNum===best[key].dateNum && rec.row>best[key].row)){
      best[key]=rec;
    }
  }

  return { murid:murid, best:best };
}

function chooseExamForStudent_(student,rows){
  var exactName=null;
  var bestFuzzy=null;
  var bestScore=0;
  var secondScore=0;

  for(var i=0;i<rows.length;i++){
    var row=rows[i];

    if(student.id && row.idMurid && String(student.id)===String(row.idMurid)){
      row._match='ID';
      return row;
    }

    if(normalize_(student.nama)===normalize_(row.nama)){
      exactName=row;
    }

    var score=nameSimilarity_(student.nama,row.nama);

    if(score>bestScore){
      secondScore=bestScore;
      bestScore=score;
      bestFuzzy=row;
    }else if(score>secondScore){
      secondScore=score;
    }
  }

  if(exactName){
    exactName._match='NAMA';
    return exactName;
  }

  if(bestFuzzy && bestScore>=0.86 && (bestScore-secondScore)>=0.03){
    bestFuzzy._match='NAMA HAMPIR';
    return bestFuzzy;
  }

  return null;
}

function readExamAnalysis(tingkatan, kelas, ujian){
  try{
    if(!tingkatan || !kelas || !ujian){
      return { success:false, message:'Pilih tingkatan, kelas dan ujian.' };
    }

    var tpData=bestTpForClass_(tingkatan,kelas);
    var examData=readExamRows_();

    var filteredExam=examData.rows.filter(function(r){
      return String(r.tingkatan)===String(tingkatan) &&
        normalizeClass_(r.kelas)===normalizeClass_(kelas) &&
        normalize_(r.ujian)===normalize_(ujian);
    });

    // Elak rekod lama/duplicate dikira dua kali. Ambil baris paling akhir bagi setiap murid.
    var uniqueExam={};
    for(var ux=0;ux<filteredExam.length;ux++){
      var ur=filteredExam[ux];
      var ukey=ur.idMurid || normalize_(ur.nama);
      if(!uniqueExam[ukey] || ur._row>uniqueExam[ukey]._row) uniqueExam[ukey]=ur;
    }
    filteredExam=Object.keys(uniqueExam).map(function(k){ return uniqueExam[k]; });

    var comparison=[];
    var usedRows={};
    var totalExam=0, examCount=0, totalTp=0, tpCount=0;
    var highExamLowTp=0, lowExamHighTp=0, bothLow=0, consistentGood=0;

    for(var i=0;i<tpData.murid.length;i++){
      var student=tpData.murid[i];
      var exam=chooseExamForStudent_(student,filteredExam);
      var tpRec=tpData.best[student.id || normalize_(student.nama)];
      var tp=tpRec ? Number(tpRec.tp) : '';
      var percent=exam && exam.peratus!=='' ? Number(exam.peratus) : '';
      var status='';

      if(percent==='' && tp==='') status='Tiada markah & TP';
      else if(percent==='') status='Tiada markah peperiksaan';
      else if(tp==='') status='Tiada rekod TP';
      else if(percent<35 && tp<=2){ status='Perlu intervensi segera'; bothLow++; }
      else if(percent>=66 && tp<=2){ status='Peperiksaan tinggi, TP rendah'; highExamLowTp++; }
      else if(percent<35 && tp>=4){ status='TP baik, peperiksaan rendah'; lowExamHighTp++; }
      else if(percent>=50 && tp>=4){ status='Konsisten baik'; consistentGood++; }
      else status='Perlu pemantauan';

      if(percent!==''){ totalExam+=percent; examCount++; }
      if(tp!==''){ totalTp+=tp; tpCount++; }

      if(exam) usedRows[exam._row]=true;

      comparison.push({
        id:student.id,
        nama:student.nama,
        peratus:percent,
        gred:exam ? exam.gred : '',
        tp:tp,
        status:status,
        match:exam ? exam._match : '',
        jumlahObj:exam ? exam.jumlahObj : '',
        jumlahStruktur:exam ? exam.jumlahStruktur : '',
        jumlahEsei:exam ? exam.jumlahEsei : ''
      });
    }

    comparison.sort(function(a,b){
      if(a.peratus==='' && b.peratus!=='') return 1;
      if(a.peratus!=='' && b.peratus==='') return -1;
      return Number(a.peratus||0)-Number(b.peratus||0) || a.nama.localeCompare(b.nama);
    });

    var mapRows=readItemMap(tingkatan,ujian).rows;
    var mapByQuestion={};

    for(var m=0;m<mapRows.length;m++){
      var q=String(pick_(mapRows[m],['Soalan'])).trim();
      if(q) mapByQuestion[q]=mapRows[m];
    }

    var defs=examItemDefs_();
    var itemAnalysis=[];
    var topicStudent={};

    for(var d=0;d<defs.length;d++){
      var def=defs[d];
      var map=mapByQuestion[def.key] || {};
      // Markah penuh datang daripada format peperiksaan, bukan input pemetaan.
      var max=def.max;

      var sum=0, answered=0, weakCount=0;

      for(var e=0;e<filteredExam.length;e++){
        var val=filteredExam[e].itemScores[def.key];
        if(val==='') continue;

        answered++;
        sum+=Number(val||0);
        if(Number(val||0)/max<0.5) weakCount++;

        var sid=filteredExam[e].idMurid || normalize_(filteredExam[e].nama);
        var topic=String(pick_(map,['Topik'])||'Belum dipetakan').trim();
        var tk=sid+'|'+topic;

        if(!topicStudent[tk]){
          topicStudent[tk]={ student:sid, topic:topic, score:0, possible:0 };
        }

        topicStudent[tk].score+=Number(val||0);
        topicStudent[tk].possible+=max;
      }

      itemAnalysis.push({
        soalan:def.key,
        bahagian:def.section,
        topik:String(pick_(map,['Topik'])||'Belum dipetakan').trim(),
        aras:String(pick_(map,['Aras'])||'').trim(),
        markahPenuh:max,
        dijawab:answered,
        lemah:weakCount,
        peratus:answered ? Math.round((sum/(answered*max))*1000)/10 : 0
      });
    }

    var topicAgg={};

    Object.keys(topicStudent).forEach(function(k){
      var row=topicStudent[k];

      if(!topicAgg[row.topic]){
        topicAgg[row.topic]={ topik:row.topic, score:0, possible:0, students:0, weakStudents:0 };
      }

      topicAgg[row.topic].score+=row.score;
      topicAgg[row.topic].possible+=row.possible;
      topicAgg[row.topic].students++;

      if(row.possible && row.score/row.possible<0.5){
        topicAgg[row.topic].weakStudents++;
      }
    });

    var topicAnalysis=Object.keys(topicAgg).map(function(k){
      var t=topicAgg[k];
      return {
        topik:t.topik,
        peratus:t.possible ? Math.round((t.score/t.possible)*1000)/10 : 0,
        murid:t.students,
        muridLemah:t.weakStudents
      };
    }).sort(function(a,b){
      return a.peratus-b.peratus || b.muridLemah-a.muridLemah;
    });

    return {
      success:true,
      tingkatan:tingkatan,
      kelas:kelas,
      ujian:ujian,
      summary:{
        totalActive:tpData.murid.length,
        adaMarkah:examCount,
        tiadaMarkah:tpData.murid.length-examCount,
        avgExam:examCount ? Math.round((totalExam/examCount)*10)/10 : 0,
        avgTp:tpCount ? Math.round((totalTp/tpCount)*100)/100 : 0,
        highExamLowTp:highExamLowTp,
        lowExamHighTp:lowExamHighTp,
        bothLow:bothLow,
        consistentGood:consistentGood
      },
      students:comparison,
      itemAnalysis:itemAnalysis,
      topicAnalysis:topicAnalysis
    };
  }catch(err){
    return { success:false, message:String(err) };
  }
}


function testExamIntegration(){
  var init=readExamInit();
  Logger.log('Ujian: '+JSON.stringify(init.ujian));

  var analysis=readExamAnalysis('1','ADIL','UPSA');
  Logger.log('Analisis 1 ADIL: '+JSON.stringify(analysis.summary));

  var map=readItemMap('1','UPSA');
  Logger.log('Pemetaan item: '+map.rows.length);
}


// ============================================================
// FUNGSI SEDIA ADA DIKEKALKAN: AUTO DAFTAR MURID
// ============================================================
// AUTO DAFTAR MURID BARU — TAB MURID ASAL SAHAJA
// Tidak mencipta fail baharu dan tidak mencipta tab baharu.
// Murid baharu diberi ID TEMP seterusnya secara automatik.
// Jika IC sudah wujud, rekod lama dikemas kini dan baris baharu dikosongkan supaya tidak duplicate.

var AUTO_MURID_SPREADSHEET_ID = '1NE4UcW7K4G_nVcxL0vU0_CVtAubzu6yOkKAWRLiVooU';

function pasangTriggerAutoDaftarMurid() {
  var ss = SpreadsheetApp.openById(AUTO_MURID_SPREADSHEET_ID);

  // Elak trigger berganda jika fungsi ini dijalankan lebih daripada sekali.
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'autoDaftarMuridBilaEdit_') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('autoDaftarMuridBilaEdit_')
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  SpreadsheetApp.getUi().alert(
    'Trigger auto daftar murid sudah dipasang.\n\n' +
    'Selepas ini, apabila Nama, Tingkatan dan Kelas diisi dalam tab MURID, ' +
    'ID TEMP dan Status AKTIF akan diisi secara automatik.'
  );
}

function autoDaftarMuridBilaEdit_(e) {
  if (!e || !e.range) return;

  var sh = e.range.getSheet();

  if (sh.getName() !== 'MURID') return;
  if (e.range.getRow() < 2) return;

  var firstCol = e.range.getColumn();
  var lastCol = firstCol + e.range.getNumColumns() - 1;

  // Hanya bertindak apabila edit menyentuh kolum B:F.
  if (lastCol < 2 || firstCol > 6) return;

  var lock = LockService.getDocumentLock();

  try {
    lock.waitLock(15000);

    var firstRow = e.range.getRow();
    var lastRow = firstRow + e.range.getNumRows() - 1;

    for (var row = firstRow; row <= lastRow; row++) {
      prosesSatuBarisMurid_(sh, row);
    }
  } finally {
    lock.releaseLock();
  }
}

function prosesSemuaMuridTanpaID() {
  var ss = SpreadsheetApp.openById(AUTO_MURID_SPREADSHEET_ID);
  var sh = ss.getSheetByName('MURID');

  if (!sh) throw new Error('Tab MURID tidak dijumpai.');

  var lock = LockService.getDocumentLock();
  var diproses = 0;

  try {
    lock.waitLock(15000);

    var lastRow = sh.getLastRow();

    for (var row = 2; row <= lastRow; row++) {
      var sebelum = String(sh.getRange(row, 1).getDisplayValue() || '').trim();
      var nama = String(sh.getRange(row, 2).getDisplayValue() || '').trim();

      if (!sebelum && nama) {
        prosesSatuBarisMurid_(sh, row);
        diproses++;
      }
    }
  } finally {
    lock.releaseLock();
  }

  SpreadsheetApp.getUi().alert(
    'Selesai memproses baris murid yang belum mempunyai ID.\n\n' +
    'Baris diperiksa: ' + diproses
  );
}

function prosesSatuBarisMurid_(sh, row) {
  var rowRange = sh.getRange(row, 1, 1, 6);
  var values = rowRange.getDisplayValues()[0];

  var id = String(values[0] || '').trim();
  var nama = kemasNamaAuto_(values[1]);
  var tingkatan = String(values[2] || '').trim();
  var kelas = String(values[3] || '').trim().toUpperCase();
  var ic = kemasIcAuto_(values[4]);
  var status = String(values[5] || '').trim().toUpperCase();

  // Jangan sentuh baris yang belum lengkap atau sudah mempunyai ID.
  if (id) return;
  if (!nama || !tingkatan || !kelas) return;

  var lastRow = sh.getLastRow();
  var allData = lastRow >= 2
    ? sh.getRange(2, 1, lastRow - 1, 6).getDisplayValues()
    : [];

  var strongIc = icKukuhAuto_(ic);
  var matchRow = 0;
  var matchId = '';

  // 1. Padanan utama menggunakan IC yang sah.
  if (strongIc) {
    for (var i = 0; i < allData.length; i++) {
      var actualRow = i + 2;
      if (actualRow === row) continue;

      var existingIc = kemasIcAuto_(allData[i][4]);

      if (existingIc && existingIc === ic) {
        matchRow = actualRow;
        matchId = String(allData[i][0] || '').trim();
        break;
      }
    }
  }

  // 2. Jika IC tiada/tidak kukuh, guna nama penuh + tingkatan.
  if (!matchRow) {
    var namaKey = namaKunciAuto_(nama);
    var candidates = [];

    for (var j = 0; j < allData.length; j++) {
      var candidateRow = j + 2;
      if (candidateRow === row) continue;

      var existingName = namaKunciAuto_(allData[j][1]);
      var existingTing = String(allData[j][2] || '').trim();

      if (existingName === namaKey && existingTing === tingkatan) {
        candidates.push({
          row: candidateRow,
          id: String(allData[j][0] || '').trim()
        });
      }
    }

    // Auto gabung hanya jika ada satu padanan sahaja.
    if (candidates.length === 1) {
      matchRow = candidates[0].row;
      matchId = candidates[0].id;
    }
  }

  if (matchRow && matchId) {
    // Murid sudah wujud: kemas kini baris lama, bukan cipta duplicate.
    sh.getRange(matchRow, 2, 1, 5).setValues([[
      nama,
      tingkatan,
      kelas,
      ic || String(sh.getRange(matchRow, 5).getDisplayValue() || '').trim(),
      'AKTIF'
    ]]);

    sh.getRange(matchRow, 5).setNumberFormat('@');
    sh.getRange(row, 1, 1, 6).clearContent();

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Murid sudah wujud. ' + matchId +
      ' dikemas kini ke kelas ' + kelas + '. Baris duplicate dibuang.',
      'Murid dikemas kini',
      7
    );

    return;
  }

  // Murid benar-benar baharu: beri ID TEMP seterusnya.
  var nextId = dapatkanIdTempSeterusnya_(allData);

  sh.getRange(row, 1).setNumberFormat('@').setValue(nextId);
  sh.getRange(row, 2).setValue(nama);
  sh.getRange(row, 3).setValue(tingkatan);
  sh.getRange(row, 4).setValue(kelas);

  if (ic) {
    sh.getRange(row, 5).setNumberFormat('@').setValue(ic);
  }

  sh.getRange(row, 6).setValue(status || 'AKTIF');

  SpreadsheetApp.getActiveSpreadsheet().toast(
    nama + ' didaftarkan sebagai ' + nextId + '.',
    'Murid baharu',
    5
  );
}

function dapatkanIdTempSeterusnya_(allData) {
  var maxTemp = 0;

  allData.forEach(function(row) {
    var id = String(row[0] || '').trim();
    var match = id.match(/^TEMP(\d+)$/i);

    if (match) {
      maxTemp = Math.max(maxTemp, Number(match[1]));
    }
  });

  return 'TEMP' + (maxTemp + 1);
}

function kemasNamaAuto_(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function namaKunciAuto_(value) {
  return kemasNamaAuto_(value)
    .replace(/[^A-Z0-9]/g, '');
}

function kemasIcAuto_(value) {
  var text = String(value || '').trim();

  if (!text) return '';

  if (/[eE][+-]?\d+/.test(text)) {
    var numberValue = Number(text);

    if (!isNaN(numberValue)) {
      text = Utilities.formatString('%.0f', numberValue);
    }
  }

  return text
    .replace(/\.0$/, '')
    .replace(/[^0-9A-Za-z]/g, '')
    .toUpperCase();
}

function icKukuhAuto_(ic) {
  if (!ic) return false;

  // IC Malaysia 12 digit, tetapi elakkan nombor sementara berakhir 000000.
  if (/^\d{12}$/.test(ic)) {
    return !/000000$/.test(ic);
  }

  // Pasport/ID asing yang mengandungi huruf.
  return /^[A-Z0-9]{7,}$/.test(ic) && /[A-Z]/.test(ic);
}


// ============================================================
// FUNGSI SEDIA ADA DIKEKALKAN: PEMBERSIH DUPLICATE
// ============================================================
// PEMBERSIH DUPLICATE MURID — SELAMAT UNTUK REKOD TP
// Tampal kod ini di PALING BAWAH Code.gs sedia ada.
// Jangan padam atau ganti kod portal yang sedia ada.
//
// Kod ini:
// 1. Tidak mencipta fail baharu.
// 2. Tidak mencipta tab baharu.
// 3. Tidak menukar nama fail atau nama tab.
// 4. Kekalkan satu ID TEMP sahaja bagi murid yang sama.
// 5. Pindahkan semua REKOD TP daripada ID duplicate kepada ID yang dikekalkan.
// 6. Padam baris duplicate daripada tab MURID.
// 7. Tidak mengubah markah TP, topik, tarikh atau guru.

var DUP_PBD_SPREADSHEET_ID = '1NE4UcW7K4G_nVcxL0vU0_CVtAubzu6yOkKAWRLiVooU';

function bersihDuplicateMuridSelamat() {
  var ss = SpreadsheetApp.openById(DUP_PBD_SPREADSHEET_ID);
  var muridSh = ss.getSheetByName('MURID');
  var rekodSh = ss.getSheetByName('REKOD TP');

  if (!muridSh) throw new Error('Tab MURID tidak dijumpai.');
  if (!rekodSh) throw new Error('Tab REKOD TP tidak dijumpai.');

  var muridData = muridSh.getDataRange().getValues();
  var rekodData = rekodSh.getDataRange().getValues();

  if (muridData.length < 2) throw new Error('Tab MURID kosong.');
  if (rekodData.length < 1) throw new Error('Tab REKOD TP kosong.');

  var mh = dupHeaderMap_(muridData[0]);
  var rh = dupHeaderMap_(rekodData[0]);

  var mId = dupFindCol_(mh, ['IDMurid', 'ID Murid']);
  var mNama = dupFindCol_(mh, ['Nama Murid', 'Nama']);
  var mTing = dupFindCol_(mh, ['Tingkatan']);
  var mKelas = dupFindCol_(mh, ['Kelas']);
  var mIc = dupFindCol_(mh, ['NoIC/NoKP', 'NoIC', 'No IC']);
  var mStatus = dupFindCol_(mh, ['Status']);

  var rId = dupFindCol_(rh, ['IDMurid', 'ID Murid']);
  var rNama = dupFindCol_(rh, ['Nama Murid', 'Nama']);

  if ([mId, mNama, mTing, mKelas, mIc, mStatus, rId, rNama]
      .some(function(x) { return x < 0; })) {
    throw new Error(
      'Header tidak lengkap. MURID mesti ada IDMurid, Nama Murid, ' +
      'Tingkatan, Kelas, NoIC/NoKP, Status. REKOD TP mesti ada IDMurid dan Nama Murid.'
    );
  }

  // Bilangan rekod TP bagi setiap ID membantu memilih ID yang paling selamat.
  var rekodCount = {};
  for (var rr = 1; rr < rekodData.length; rr++) {
    var rid = String(rekodData[rr][rId] || '').trim();
    if (rid) rekodCount[rid] = (rekodCount[rid] || 0) + 1;
  }

  var murid = [];
  for (var r = 1; r < muridData.length; r++) {
    var id = String(muridData[r][mId] || '').trim();
    var nama = String(muridData[r][mNama] || '').trim();

    if (!id || !nama) continue;

    var ic = dupCleanIc_(muridData[r][mIc]);

    murid.push({
      index: murid.length,
      sheetRow: r + 1,
      id: id,
      nama: nama,
      namaKey: dupCleanName_(nama),
      tingkatan: String(muridData[r][mTing] || '').trim(),
      kelas: String(muridData[r][mKelas] || '').trim(),
      ic: ic,
      validIc: dupValidIc_(ic),
      status: String(muridData[r][mStatus] || '').trim().toUpperCase(),
      recordCount: rekodCount[id] || 0
    });
  }

  var parent = [];
  for (var p = 0; p < murid.length; p++) parent[p] = p;

  function find_(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union_(a, b) {
    var ra = find_(a);
    var rb = find_(b);
    if (ra !== rb) parent[rb] = ra;
  }

  // Padanan paling kuat: IDMurid sama.
  var byId = {};
  murid.forEach(function(m) {
    if (byId[m.id] !== undefined) union_(m.index, byId[m.id]);
    else byId[m.id] = m.index;
  });

  // Padanan paling selamat: IC sah sama.
  var byIc = {};
  murid.forEach(function(m) {
    if (!m.validIc) return;

    if (byIc[m.ic] !== undefined) union_(m.index, byIc[m.ic]);
    else byIc[m.ic] = m.index;
  });

  // Padanan nama sama dalam tingkatan sama.
  // Auto-merge hanya apabila kumpulan tidak mempunyai dua IC sah yang berbeza.
  var byNameTing = {};
  murid.forEach(function(m) {
    var key = m.tingkatan + '|' + m.namaKey;
    if (!byNameTing[key]) byNameTing[key] = [];
    byNameTing[key].push(m);
  });

  var skipped = [];

  Object.keys(byNameTing).forEach(function(key) {
    var group = byNameTing[key];
    if (group.length < 2) return;

    var validIcSet = {};
    group.forEach(function(m) {
      if (m.validIc) validIcSet[m.ic] = true;
    });

    var distinctValidIc = Object.keys(validIcSet).length;

    if (distinctValidIc <= 1) {
      for (var i = 1; i < group.length; i++) {
        union_(group[0].index, group[i].index);
      }
    } else {
      skipped.push(group[0].nama + ' — IC sah berbeza, tidak dipadam automatik');
    }
  });

  // Bina kumpulan akhir.
  var components = {};
  murid.forEach(function(m) {
    var root = find_(m.index);
    if (!components[root]) components[root] = [];
    components[root].push(m);
  });

  var duplicateGroups = Object.keys(components)
    .map(function(k) { return components[k]; })
    .filter(function(g) { return g.length > 1; });

  if (duplicateGroups.length === 0) {
    SpreadsheetApp.getUi().alert(
      'Tiada duplicate selamat untuk digabungkan.\n\n' +
      (skipped.length
        ? 'Perlu semakan manual:\n- ' + skipped.join('\n- ')
        : 'Semua nama sudah bersih.')
    );
    return;
  }

  var oldIdToKeepId = {};
  var keeperNameById = {};
  var rowsToDelete = [];
  var mergedNames = [];

  duplicateGroups.forEach(function(group) {
    // Baris semasa: utamakan AKTIF, kemudian IC sah,
    // kemudian ID yang mempunyai paling banyak REKOD TP.
    var activeRows = group.filter(function(m) {
      return m.status === 'AKTIF';
    });

    var detailSource = activeRows.length
      ? dupBestRow_(activeRows)
      : dupBestRow_(group);

    var keeper = dupBestRow_(group, detailSource);

    // Ambil IC sah daripada mana-mana rekod dalam kumpulan.
    var bestIc = '';
    for (var i = 0; i < group.length; i++) {
      if (group[i].validIc) {
        bestIc = group[i].ic;
        break;
      }
    }

    // Kekalkan ID keeper, tetapi guna nama/kelas/status semasa.
    muridSh.getRange(keeper.sheetRow, mNama + 1).setValue(detailSource.nama);
    muridSh.getRange(keeper.sheetRow, mTing + 1).setValue(detailSource.tingkatan);
    muridSh.getRange(keeper.sheetRow, mKelas + 1).setValue(detailSource.kelas);
    muridSh.getRange(keeper.sheetRow, mIc + 1).setNumberFormat('@');
    muridSh.getRange(keeper.sheetRow, mIc + 1)
      .setValue(bestIc || detailSource.ic || keeper.ic);
    muridSh.getRange(keeper.sheetRow, mStatus + 1)
      .setValue(activeRows.length ? 'AKTIF' : detailSource.status);

    keeperNameById[keeper.id] = detailSource.nama;

    group.forEach(function(m) {
      if (m.sheetRow === keeper.sheetRow) return;

      oldIdToKeepId[m.id] = keeper.id;
      rowsToDelete.push(m.sheetRow);
    });

    mergedNames.push(
      detailSource.nama + ' → kekal ' + keeper.id +
      ' | buang ' +
      group.filter(function(m) { return m.sheetRow !== keeper.sheetRow; })
        .map(function(m) { return m.id; })
        .join(', ')
    );
  });

  // Sambungkan semua REKOD TP lama kepada ID keeper.
  var relinked = 0;
  var rekodChanged = false;

  for (var x = 1; x < rekodData.length; x++) {
    var oldId = String(rekodData[x][rId] || '').trim();
    var keepId = oldIdToKeepId[oldId];

    if (keepId) {
      rekodData[x][rId] = keepId;
      rekodData[x][rNama] = keeperNameById[keepId] || rekodData[x][rNama];
      relinked++;
      rekodChanged = true;
    }
  }

  if (rekodChanged) {
    var idNameValues = rekodData.slice(1).map(function(row) {
      return [row[rId], row[rNama]];
    });

    rekodSh.getRange(2, rId + 1, idNameValues.length, 2)
      .setValues(idNameValues);
  }

  // Padam baris duplicate dari bawah ke atas supaya nombor baris tidak lari.
  rowsToDelete.sort(function(a, b) { return b - a; });

  rowsToDelete.forEach(function(rowNumber) {
    muridSh.deleteRow(rowNumber);
  });

  SpreadsheetApp.flush();

  var message =
    'Pembersihan duplicate selesai.\n\n' +
    'Kumpulan duplicate digabung: ' + duplicateGroups.length + '\n' +
    'Baris duplicate dibuang: ' + rowsToDelete.length + '\n' +
    'REKOD TP disambung semula: ' + relinked + '\n\n' +
    'ID TEMP keeper dikekalkan. Markah TP tidak diubah.';

  if (skipped.length) {
    message +=
      '\n\nTidak dipadam kerana IC sah berbeza:\n- ' +
      skipped.join('\n- ');
  }

  Logger.log(mergedNames.join('\n'));
  SpreadsheetApp.getUi().alert(message);
}

function dupBestRow_(group, preferredDetails) {
  var preferredStatus = preferredDetails
    ? preferredDetails.status
    : '';

  return group.slice().sort(function(a, b) {
    var aActive = a.status === 'AKTIF' ? 1 : 0;
    var bActive = b.status === 'AKTIF' ? 1 : 0;

    if (bActive !== aActive) return bActive - aActive;

    var aPreferred = preferredStatus && a.status === preferredStatus ? 1 : 0;
    var bPreferred = preferredStatus && b.status === preferredStatus ? 1 : 0;

    if (bPreferred !== aPreferred) return bPreferred - aPreferred;
    if ((b.validIc ? 1 : 0) !== (a.validIc ? 1 : 0)) {
      return (b.validIc ? 1 : 0) - (a.validIc ? 1 : 0);
    }

    if (b.recordCount !== a.recordCount) {
      return b.recordCount - a.recordCount;
    }

    return a.sheetRow - b.sheetRow;
  })[0];
}

function dupHeaderMap_(headers) {
  var map = {};

  headers.forEach(function(h, i) {
    map[dupHeaderKey_(h)] = i;
  });

  return map;
}

function dupFindCol_(map, names) {
  for (var i = 0; i < names.length; i++) {
    var key = dupHeaderKey_(names[i]);
    if (map[key] !== undefined) return map[key];
  }

  return -1;
}

function dupHeaderKey_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_\/-]+/g, '')
    .trim();
}

function dupCleanName_(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function dupCleanIc_(value) {
  var text = String(value || '').trim();

  if (!text) return '';

  if (/[eE][+-]?\d+/.test(text)) {
    var numberValue = Number(text);
    if (!isNaN(numberValue)) {
      text = Utilities.formatString('%.0f', numberValue);
    }
  }

  return text
    .replace(/\.0$/, '')
    .replace(/[^0-9A-Za-z]/g, '')
    .toUpperCase();
}

function dupValidIc_(ic) {
  if (!/^\d{12}$/.test(ic)) return false;

  if (/000000$/.test(ic)) return false;

  var placeholders = {
    '120000000000': true,
    '130000000000': true,
    '131000000000': true
  };

  return !placeholders[ic];
}

const SHEETS = {
  guru: { name:'BIODATA_GURU', prefix:'G', headers:['ID','Nama','Kad Pengenalan','Jawatan','Opsyen','Ijazah','Pengalaman','Kelas','Email','Telefon','Foto','Status'] },
  pengumuman: { name:'PENGUMUMAN', prefix:'P', headers:['ID','Tahun','Tajuk','Tarikh','Isi','Link','Status'] },
  dskp: { name:'DSKP', prefix:'D', headers:['ID','Tahun','Tajuk','Tingkatan','Link','Status'] },
  linkPantas: { name:'LINK_PANTAS', prefix:'L', headers:['ID','Tahun','Nama','Kategori','Link','Icon','Status'] },
  galeri: { name:'GALERI', prefix:'GA', headers:['ID','Tahun','Tajuk','Tarikh','Kelas','Penerangan','Photo','Status'] },
  bbm: { name:'BBM', prefix:'B', headers:['ID','Tahun','Tajuk','Tingkatan','Bab','Jenis','Link','Status'] }
};

function doGet(e) {
  const action = (e.parameter.action || 'hub');
  const year = e.parameter.year || '';
  if (action === 'list') return jsonResponse(readModule('guru'));
  if (action === 'hub') return jsonResponse(readHub(year));
  if (action === 'module') return jsonResponse(readModule(e.parameter.module || 'guru', year));
  if (action === 'pbdInit') return jsonResponse(readPbdInit());
  return jsonResponse({ success:false, message:'Action tidak sah' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  const module = data.module || 'guru';
  if (data.action === 'add') return jsonResponse(addRecord(module, data));
  if (data.action === 'update') return jsonResponse(updateRecord(module, data));
  if (data.action === 'delete') return jsonResponse(deleteRecord(module, data.id));
  if (data.action === 'savePbdBatch') return jsonResponse(savePbdBatch(data.records || []));
  return jsonResponse({ success:false, message:'Action tidak sah' });
}

function getSheet(module) {
  const cfg = SHEETS[module] || SHEETS.guru;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(cfg.name);
  if (!sh) sh = ss.insertSheet(cfg.name);
  sh.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
  return { sh, cfg };
}

function readHub(year) {
  const manualGaleri = readModule('galeri', year);
  const autoGaleri = readPbdBestGallery(year, 30);
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
  const { sh } = getSheet(module);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(r => r.some(c => c !== ''))
    .map(row => {
      const o = {};
      headers.forEach((h,i)=>o[h]=row[i] || '');
      return o;
    })
    .filter(o => !year || !o.Tahun || String(o.Tahun) === String(year));
}

function addRecord(module, data) {
  const { sh, cfg } = getSheet(module);
  const id = data.id || (cfg.prefix + '-' + new Date().getTime());
  const row = cfg.headers.map(h => h === 'ID' ? id : valueForHeader(h, data));
  sh.appendRow(row);
  return { success:true, message:'Data berjaya ditambah', id };
}

function updateRecord(module, data) {
  const { sh, cfg } = getSheet(module);
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    if (String(values[i][0]) === String(data.id)) {
      const row = cfg.headers.map(h => h === 'ID' ? data.id : valueForHeader(h, data));
      sh.getRange(i+1,1,1,cfg.headers.length).setValues([row]);
      return { success:true, message:'Data berjaya dikemaskini' };
    }
  }
  return { success:false, message:'ID tidak dijumpai' };
}

function deleteRecord(module, id) {
  const { sh } = getSheet(module);
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    if (String(values[i][0]) === String(id)) {
      sh.deleteRow(i+1);
      return { success:true, message:'Data berjaya dipadam' };
    }
  }
  return { success:false, message:'ID tidak dijumpai' };
}

function valueForHeader(h, d) {
  const map = {
    'Nama':'nama','Kad Pengenalan':'kadPengenalan','Jawatan':'jawatan','Opsyen':'opsyen','Ijazah':'ijazah','Pengalaman':'pengalaman','Kelas':'kelas','Email':'email','Telefon':'telefon','Foto':'foto','Status':'status','Tahun':'tahun','Tajuk':'tajuk','Tarikh':'tarikh','Isi':'isi','Link':'link','Tingkatan':'tingkatan','Kategori':'kategori','Icon':'icon','Penerangan':'penerangan','Photo':'photo','Bab':'bab','Jenis':'jenis'
  };
  return d[map[h]] || d[h] || '';
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}


// ================= MODUL PBD DALAM HUB v5 =================
const PBD_SPREADSHEET_ID = '1NE4UcW7K4G_nVcxL0vU0_CVtAubzu6yOkKAWRLiVooU';
const PBD_GALERI_FOLDER_ID = '1iNinTVUr5DLYU7agis8_hC1G1f9CkMTE';
function getPbdSs(){ return SpreadsheetApp.openById(PBD_SPREADSHEET_ID); }
function rowsToObjects(values){
  if(values.length<=1) return [];
  const headers=values[0];
  return values.slice(1).filter(r=>r.some(c=>c!==''&&c!==null)).map(r=>{
    const o={}; headers.forEach((h,i)=>o[String(h).trim()]=r[i]||''); return o;
  });
}
function readPbdInit(){
  const ss=getPbdSs();
  const murid=rowsToObjects(ss.getSheetByName('MURID').getDataRange().getValues());
  const topik=rowsToObjects(ss.getSheetByName('TOPIK').getDataRange().getValues());
  const rekod=rowsToObjects(ss.getSheetByName('REKOD TP').getDataRange().getValues());
  return {success:true, murid:murid, topik:topik, rekod:rekod};
}
function savePbdBatch(records){
  if(!records.length) return {success:false,message:'Tiada rekod untuk disimpan'};
  const ss=getPbdSs();
  const sh=ss.getSheetByName('REKOD TP');
  const now=new Date();
  const rows=records.map(r=>[
    Utilities.getUuid().slice(0,8), now, r.idMurid||'', r.namaMurid||'', r.idTopik||'', r.tingkatan||'', r.kelas||'', r.topik||'', r.sk||'', r.sp||'', r.tp||'', r.catatan||'', r.ditafsirOleh||'', '', ((r.tingkatan||'')+' '+(r.kelas||'')).trim()
  ]);
  sh.getRange(sh.getLastRow()+1,1,rows.length,15).setValues(rows);
  return {success:true,count:rows.length,message:'Rekod TP berjaya disimpan'};
}


// Auto Galeri: paparkan hasil murid PBD terbaik daripada REKOD TP yang ada Foto dan TP 5/6.
function readPbdBestGallery(year, limit) {
  try {
    const ss = getPbdSs();
    const sh = ss.getSheetByName('REKOD TP');
    if (!sh) return [];
    const values = sh.getDataRange().getValues();
    if (values.length <= 1) return [];
    const headers = values[0].map(h => String(h).trim());
    const idx = {};
    headers.forEach((h, i) => idx[h] = i);
    const folder = DriveApp.getFolderById(PBD_GALERI_FOLDER_ID);
    const rows = [];

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const tp = Number(row[idx['TP']] || 0);
      const fotoPath = String(row[idx['Foto']] || '').trim();
      if (!(tp === 5 || tp === 6) || !fotoPath) continue;

      const tarikh = row[idx['Tarikh']];
      const y = tarikh instanceof Date ? String(tarikh.getFullYear()) : String(year || '').trim();
      if (year && y && String(y) !== String(year)) continue;

      const fileName = fotoPath.split('/').pop();
      const fileUrl = findFileUrlByName_(folder, fileName);
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

    rows.sort((a, b) => new Date(b.Tarikh).getTime() - new Date(a.Tarikh).getTime());
    return rows.slice(0, limit || 30);
  } catch (err) {
    return [];
  }
}

function findFileUrlByName_(folder, fileName) {
  const files = folder.getFilesByName(fileName);
  if (!files.hasNext()) return '';
  const f = files.next();
  return 'https://drive.google.com/file/d/' + f.getId() + '/view?usp=drive_link';
}

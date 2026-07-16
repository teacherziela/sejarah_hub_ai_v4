let hub = { guru:[], pengumuman:[], dskp:[], linkPantas:[], galeri:[], bbm:[] };
let guruData = [];
const fallback = { guru:[], pengumuman:[], dskp:[], linkPantas:[], galeri:[], bbm:[] };
function esc(s){return String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function isAktif(x){ return String(x.Status||'Aktif').toLowerCase() !== 'tidak aktif'; }
function byYear(list, year){ return (list||[]).filter(x=>String(x.Tahun||year)===String(year) && isAktif(x)); }
function driveImg(url){
  if(!url) return '';
  const raw = String(url).trim();
  if(!/^https?:\/\//i.test(raw)) return '';
  const m = raw.match(/\/d\/([^/]+)|id=([^&]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]||m[2]}&sz=w900` : raw;
}
function fmtDate(v){
  if(!v) return '';
  const s=String(v).trim();
  const d = new Date(s);
  if(!isNaN(d)) return d.toLocaleDateString('ms-MY',{day:'2-digit',month:'2-digit',year:'numeric'});
  return s;
}
function todayInputValue(){
  const d=new Date();
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function cleanName(n){ return String(n||'').replace(/\s*KPM-Guru\s*$/i,'').trim(); }
function yearsText(v){
  const s=String(v||'').trim();
  if(!s) return '';
  return /tahun/i.test(s) ? s.replace('sejarah','Sejarah') : `${s} Tahun mengajar Sejarah`;
}
function waLink(phone){
  const digits=String(phone||'').replace(/\D/g,'');
  if(!digits) return '';
  const ms=digits.startsWith('0')?'6'+digits:digits;
  return `https://wa.me/${ms}`;
}
function logo(){return 'logo-smktj2.jpg'}
function getYear(){return document.getElementById('yearSelect').value || CONFIG.DEFAULT_YEAR || '2026';}
async function apiHub(year){
  try{
    const res=await fetch(`${CONFIG.SHEET_API_URL}?action=hub&year=${encodeURIComponent(year)}&v=${Date.now()}`);
    if(!res.ok) throw new Error('API gagal');
    const data=await res.json();
    if(Array.isArray(data)) return {...fallback, guru:data};
    return {...fallback, ...data};
  }catch(e){ console.warn(e); return fallback; }
}
function openUrl(url){ if(url) window.open(url,'_blank'); }
function scrollToPanel(id){ document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); }
function isBiodataGuruLink(x){ const text=[x?.Nama,x?.Kategori,x?.title].join(' ').toLowerCase(); return text.includes('biodata') || text.includes('guru'); }
async function init(){
  document.getElementById('yearSelect').value = CONFIG.DEFAULT_YEAR || '2026';
  document.getElementById('yearSelect').addEventListener('change', loadYear);
  document.getElementById('reloadBtn').addEventListener('click', loadYear);
  document.getElementById('searchGuru').addEventListener('input', e=>{ const q=e.target.value.toLowerCase(); renderGuru(guruData.filter(g=>Object.values(g).join(' ').toLowerCase().includes(q))); });
  const pbdTarikh=document.getElementById('pbdTarikh');
  if(pbdTarikh && !pbdTarikh.value) pbdTarikh.value=todayInputValue();
  document.getElementById('pbdTingkatan').addEventListener('change', onPbdTingkatan);
  document.getElementById('pbdKelas').addEventListener('change', onPbdKelas);
  document.getElementById('pbdLoadBtn').addEventListener('click', loadPbdStudents);
  document.getElementById('pbdSaveBtn').addEventListener('click', savePbdBatch);
  document.getElementById('rumusTingkatan')?.addEventListener('change', onRumusTingkatan);
  document.getElementById('rumusKelas')?.addEventListener('change', renderPbdSummary);
  document.getElementById('rumusUjian')?.addEventListener('change', renderPbdSummary);
  document.getElementById('rumusRefreshBtn')?.addEventListener('click', renderPbdSummary);
  document.getElementById('pbdPrintReportBtn')?.addEventListener('click', openPbdPrintReport);
  document.getElementById('pbdInterventionReportBtn')?.addEventListener('click', openPbdInterventionReport);

  document.getElementById('examTingkatan')?.addEventListener('change', onExamTingkatan);
  document.getElementById('examKelas')?.addEventListener('change', onExamContextChanged);
  document.getElementById('examUjian')?.addEventListener('change', onExamContextChanged);
  document.getElementById('examAnalyseBtn')?.addEventListener('click', renderExamAnalysis);
  document.getElementById('examPrintOnlyBtn')?.addEventListener('click',()=>openExamPrintReport('examOnly'));
  document.getElementById('examPrintPbdBtn')?.addEventListener('click',()=>openExamPrintReport('examPbd'));
  document.getElementById('examStudent')?.addEventListener('change', loadExamStudent);
  document.getElementById('examLoadStudentBtn')?.addEventListener('click', loadExamStudent);
  document.getElementById('examSaveBtn')?.addEventListener('click', saveExamRecord);
  document.getElementById('examTH')?.addEventListener('change', updateExamPreview);
  document.getElementById('examMapSaveBtn')?.addEventListener('click', saveExamItemMap);
  setupQuestionPaperUpload();

  await loadYear();
  await initPbd();
  initPbdEvidenceGallery();
  initHipActivityGallery();
  await initExam();
}
async function loadYear(){
  const year=getYear();
  hub = await apiHub(year);
  guruData = (hub.guru||[]).filter(isAktif);
  renderStats(year); renderMenu(year); renderPengumuman(byYear(hub.pengumuman,year)); renderLinks(byYear(hub.linkPantas,year)); renderDskp(byYear(hub.dskp,year)); renderGuru(guruData); renderPbdGuruOptions(); renderBbm(byYear(hub.bbm,year)); renderGaleri(byYear(hub.galeri,year));
}
function renderStats(year){
  const stats=[['Guru',guruData.length],['Pengumuman',byYear(hub.pengumuman,year).length],['Link',byYear(hub.linkPantas,year).length],['Galeri',byYear(hub.galeri,year).length]];
  document.getElementById('statStrip').innerHTML = stats.map(([a,b])=>`<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');
}
function renderMenu(year){
  const fixed=[
    {icon:'📊',title:'PBD / Rumusan',target:'pbdPanel'},
    {icon:'🖼️',title:'Hasil Murid',target:'pbdEvidenceGalleryPanel'},
    {icon:'🎬',title:'Aktiviti HIP',target:'hipActivityPanel'},
    {icon:'🧩',title:'Analisis Peperiksaan',target:'examPanel'},
    {icon:'👥',title:'Ahli Panitia',target:'guruPanel'}
  ];
  const quick=byYear(hub.linkPantas,year).map(x=>isBiodataGuruLink(x)
    ? {icon:x.Icon||'👩‍🏫',title:x.Nama,target:'guruPanel'}
    : {icon:x.Icon||'🔗',title:x.Nama,url:x.Link});
  const menus=[...fixed,...quick].slice(0,12);
  document.getElementById('menuGrid').innerHTML = menus.map(m=>`<div class="hex" onclick="${m.url?`openUrl('${String(m.url).replace(/'/g,"\\'")}')`:`scrollToPanel('${m.target}')`}"><div><span class="ico">${esc(m.icon)}</span>${esc(m.title)}</div></div>`).join('');
}
function miniCard(title, text, icon, url, target){
  const action = target ? `scrollToPanel('${target}')` : (url ? `openUrl('${String(url).replace(/'/g,"\\'")}')` : '');
  return `<article class="mini-card"><div class="mini-ico">${esc(icon||'🔗')}</div><h3>${esc(title)}</h3>${text?`<p>${esc(text)}</p>`:''}${action?`<button onclick="${action}">Buka</button>`:''}</article>`;
}
function renderPengumuman(list){
  document.getElementById('pengumumanGrid').innerHTML = list.length ? list.map(p=>miniCard(p.Tajuk, `${fmtDate(p.Tarikh)} ${p.Isi||''}`, '📢', p.Link)).join('') : '<p class="note">Belum ada pengumuman aktif.</p>';
}
function renderLinks(list){ document.getElementById('linkGrid').innerHTML = list.length ? list.map(l=>miniCard(l.Nama, l.Kategori, l.Icon||'🔗', isBiodataGuruLink(l)?'':l.Link, isBiodataGuruLink(l)?'guruPanel':'' )).join('') : '<p class="note">Belum ada link pantas.</p>'; }
function renderDskp(list){ document.getElementById('dskpGrid').innerHTML = list.length ? list.map(d=>miniCard(d.Tajuk, d.Tingkatan, '📚', d.Link)).join('') : '<p class="note">Belum ada DSKP/dokumen aktif.</p>'; }
function renderBbm(list){ document.getElementById('bbmGrid').innerHTML = list.length ? list.map(b=>miniCard(b.Tajuk, [b.Tingkatan,b.Bab,b.Jenis].filter(Boolean).join(' • '), '🎮', b.Link)).join('') : '<p class="note">Belum ada BBM aktif.</p>'; }
function renderGaleri(list){
  const box=document.getElementById('galeriGrid');
  box.innerHTML = list.length ? list.map(g=>`<article class="gallery-card"><img src="${driveImg(g.Photo||g.Foto)||logo()}" onerror="this.onerror=null;this.src='logo-smktj2.jpg'"><h3>${esc(g.Tajuk)}</h3><p>${esc(fmtDate(g.Tarikh))} ${esc(g.Kelas||'')}</p><p>${esc(g.Penerangan||'')}</p></article>`).join('') : '<p class="note">Belum ada galeri aktiviti.</p>';
}
function renderPbdBest(list){ return; }
function renderGuru(list){
  const grid=document.getElementById('guruGrid');
  if(!list.length){grid.innerHTML='<p class="note">Belum ada biodata guru aktif dalam Google Sheet.</p>';return;}
  grid.innerHTML=list.map(g=>`<div class="guru-card premium-card"><img class="avatar" src="${driveImg(g.Foto)||logo()}" onerror="this.onerror=null;this.src='logo-smktj2.jpg'"><div><h3>${esc(cleanName(g.Nama))}</h3><p>${esc(g.Jawatan||'Guru Akademik')}</p><p class="note">${esc(yearsText(g.Pengalaman)||g.Kelas||'')}</p>${String(g.Opsyen||'').split(',').filter(Boolean).map(t=>`<span class="tag">${esc(t.trim())}</span>`).join('')}</div><button onclick="openProfile('${esc(g.ID)}')">Lihat Profil</button></div>`).join('');
}
function renderPbdGuruOptions(){
  const sel=document.getElementById('pbdGuru');
  if(!sel) return;
  const current=sel.value;
  const names=[...new Set((guruData||[]).map(g=>cleanName(g.Nama)).filter(Boolean))].sort();
  sel.innerHTML='<option value="">Pilih guru</option>'+names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  if(current && names.includes(current)) sel.value=current;
  else if(names.length) sel.value=names[0];
}
function openProfile(id){
  const g=guruData.find(x=>String(x.ID)===String(id)); if(!g) return;
  const email = String(g.Email||'').trim();
  const phone = String(g.Telefon||'').trim();
  const whatsapp = waLink(phone);
  document.getElementById('profileBody').innerHTML=`
    <div class="profile-hero">
      <img class="avatar big" src="${driveImg(g.Foto)||logo()}" onerror="this.onerror=null;this.src='logo-smktj2.jpg'">
      <div>
        <h2>${esc(cleanName(g.Nama))}</h2>
        <p class="profile-job">${esc(g.Jawatan||'Guru Akademik')}</p>
        <div class="profile-tags">${String(g.Opsyen||'').split(',').filter(Boolean).map(t=>`<span class="tag">${esc(t.trim())}</span>`).join('')}</div>
      </div>
    </div>
    <div class="profile-info">
      <p><b>🎓 Ijazah</b><span>${esc(g.Ijazah||'-')}</span></p>
      <p><b>⏳ Pengalaman</b><span>${esc(yearsText(g.Pengalaman)||'-')}</span></p>
      <p><b>🏫 Kelas Diajar</b><span>${esc(g.Kelas||'-')}</span></p>
      <p><b>📧 Email</b><span>${email?`<a href="mailto:${esc(email)}">${esc(email)}</a>`:'-'}</span></p>
      <p><b>📱 Telefon</b><span>${esc(phone||'-')}</span></p>
    </div>
    <div class="profile-actions">
      ${whatsapp?`<button onclick="openUrl('${whatsapp}')">WhatsApp</button>`:''}
      ${email?`<button onclick="openUrl('mailto:${esc(email)}')">Email</button>`:''}
    </div>`;
  document.getElementById('profileDialog').showModal();
}
function closeProfile(){document.getElementById('profileDialog').close();}
init();


// ================= MODUL ISI PBD DALAM HUB =================
let pbdData = { murid:[], topik:[], rekod:[] };
let currentPbdSummaryData = null;
let currentPbdListContext = {type:'active', value:''};
function pbdApiUrl(params){
  const qs = new URLSearchParams(params);
  qs.set('v', Date.now());
  return `${CONFIG.SHEET_API_URL}?${qs.toString()}`;
}
async function initPbd(){
  try{
    document.getElementById('pbdStatus').textContent='Memuat data PBD...';
    const res = await fetch(pbdApiUrl({action:'pbdInitLite'}));
    pbdData = await res.json();
    if(!pbdData.success) throw new Error(pbdData.message||'Gagal baca data PBD');

    forcePopulatePbdFilters();
    renderPbdGuruOptions();
    initPbdSummaryControls();
    renderPbdSummary();
    document.getElementById('pbdStatus').textContent='Sedia. Pilih tingkatan dan kelas untuk rumusan, atau isi PBD seperti biasa.';
  }catch(e){
    // Jangan biarkan dropdown kosong. Filter masih boleh digunakan untuk rumusan/cetak
    // kerana data sebenar akan dibaca terus daripada Apps Script.
    pbdData = pbdData || {murid:[],topik:[],rekod:[]};
    forcePopulatePbdFilters();
    initPbdSummaryControls();
    document.getElementById('pbdStatus').textContent='Data murid belum penuh dimuatkan, tetapi filter asas telah dipulihkan. Cuba pilih kelas dan papar rumusan.';
  }
}
function onPbdTingkatan(){
  const ting=document.getElementById('pbdTingkatan').value;
  const kelas=[...new Set((pbdData.murid||[]).filter(m=>String(muridTing(m))===String(ting) && muridStatus(m)!=='PINDAH').map(m=>muridKelas(m)).filter(Boolean))].sort();
  document.getElementById('pbdKelas').innerHTML='<option value="">Pilih Kelas</option>'+kelas.map(k=>`<option value="${esc(k)}">${esc(ting+' '+k)}</option>`).join('');
  renderPbdTopik();
  document.getElementById('pbdStudents').innerHTML='';
  document.getElementById('pbdSaveBtn').style.display='none';
}
function onPbdKelas(){ document.getElementById('pbdStudents').innerHTML=''; document.getElementById('pbdSaveBtn').style.display='none'; }
function renderPbdTopik(){
  const ting=document.getElementById('pbdTingkatan').value;
  const opts=(pbdData.topik||[]).filter(t=>!ting || String(t.Tingkatan)==String(ting));
  document.getElementById('pbdTopik').innerHTML='<option value="">Pilih Topik / SP</option>'+opts.map(t=>`<option value="${esc(t.IDTopik)}">${esc((t['SK (Standard Kandungan)']||t.Topik||'')+' — '+(t['SP (Standard Pembelajaran)']||''))}</option>`).join('');
}
function selectedTopik(){ const id=document.getElementById('pbdTopik').value; return (pbdData.topik||[]).find(t=>String(t.IDTopik)===String(id)); }
function muridIdOf(m){ return m.IDMurid || m['IDMurid '] || m['ID Murid'] || m.idMurid || m.id || ''; }
function muridNama(m){ return String(val(m,['Nama Murid','Nama','nama'])).trim(); }
function muridFoto(m){ return String(val(m,['Foto','foto','Photo','photo','Gambar'])||'').trim(); }
function muridStatus(m){ return String(val(m,['Status','status'])||'AKTIF').trim().toUpperCase(); }
function updatePbdProgress(){
  const rows=[...document.querySelectorAll('.pbd-row')];
  const chosen=rows.filter(r=>r.dataset.tp).length;
  const saved=rows.filter(r=>r.classList.contains('pbd-saved')).length;
  const box=document.getElementById('pbdProgress');
  if(box) box.textContent = rows.length ? `${chosen} dipilih • ${saved} baru disimpan • ${rows.length} murid` : '';
}
function loadPbdStudents(){
  const ting=document.getElementById('pbdTingkatan').value;
  const kelas=document.getElementById('pbdKelas').value;
  const topik=selectedTopik();
  if(!ting||!kelas||!topik){ document.getElementById('pbdStatus').textContent='Pilih Tingkatan, Kelas dan Topik dulu.'; return; }
  const students=(pbdData.murid||[]).filter(m=>String(muridTing(m))===String(ting)&&String(muridKelas(m))===String(kelas)&&muridStatus(m)!=='PINDAH');
  const rekodMap={};
  (pbdData.rekod||[]).filter(r=>String(r['ID Topik'])===String(topik.IDTopik)).forEach(r=>{ rekodMap[String(r.IDMurid)] = r.TP; });
  document.getElementById('pbdStatus').innerHTML=`✅ ${students.length} murid dipaparkan untuk <b>Tingkatan ${esc(ting)} ${esc(kelas)}</b>. Pilih TP murid, kemudian tekan Simpan.`;
  document.getElementById('pbdStudents').innerHTML = students.map((m,i)=>{
    const muridId = muridIdOf(m);
    const nama = muridNama(m);
    const current=rekodMap[String(muridId)]||'';
    const showEvidence=Number(current)>0;
    return `<article class="pbd-row"
      data-id="${esc(muridId)}"
      data-name="${esc(nama)}"
      data-current-tp="${esc(current)}"
      data-evidence="">
      <div class="pbd-name">
        <b>${i+1}. ${esc(nama)}</b>
        <span>${esc(ting+' '+kelas)} • ID: ${esc(muridId||'-')}</span>
        <small class="save-state"></small>
      </div>

      <div class="tp-buttons">${[1,2,3,4,5,6].map(tp=>`<button type="button" class="tp tp${tp} ${String(current)===String(tp)?'active':''}" onclick="pickTp(this,${tp})">TP${tp}</button>`).join('')}</div>

      <div class="pbd-photo-tools evidence-tools ${showEvidence?'show':''}">
        <div class="pbd-photo-preview evidence-preview">
          <span class="evidence-placeholder">🖼️</span>
        </div>
        <label class="pbd-camera-btn" title="Ambil gambar hasil kerja murid sebagai bukti pentaksiran.">
          <span>📸</span>
          <span class="camera-label">Ambil Bukti Kerja</span>
          <input type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            capture="environment"
            onchange="handlePbdEvidence(this)">
        </label>
        <small class="photo-state">Pilihan — gambar ini disimpan bersama rekod TP, bukan sebagai gambar muka.</small>
      </div>

      <input class="catatan" placeholder="Catatan jika perlu" />
    </article>`;
  }).join('');
  document.getElementById('pbdSaveBtn').style.display=students.length?'inline-flex':'none';
  updatePbdProgress();
}
function pickTp(btn,tp){
  const row=btn.closest('.pbd-row');
  row.dataset.tp=tp;
  row.classList.remove('pbd-saved');
  row.querySelector('.save-state').textContent='Belum disimpan';
  row.querySelectorAll('.tp').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');

  const evidenceTools=row.querySelector('.pbd-photo-tools');
  if(evidenceTools) evidenceTools.classList.add('show');

  const state=row.querySelector('.photo-state');
  if(state && !row.dataset.evidence){
    state.textContent=`📸 Boleh ambil gambar hasil kerja sebagai bukti TP${tp}. Tidak wajib.`;
  }
  updatePbdProgress();
}
function readFileAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Gambar tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });
}

async function compressPbdEvidencePhoto(file){
  if(!file || !String(file.type||'').startsWith('image/')){
    throw new Error('Pilih fail gambar JPG, PNG atau WebP.');
  }

  const source=await readFileAsDataUrl(file);
  const img=await new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('Format gambar tidak dapat dibuka. Guna kamera atau fail JPG/PNG.'));
    image.src=source;
  });

  const maxSide=900;
  let width=img.naturalWidth||img.width;
  let height=img.naturalHeight||img.height;
  const scale=Math.min(1,maxSide/Math.max(width,height));
  width=Math.max(1,Math.round(width*scale));
  height=Math.max(1,Math.round(height*scale));

  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false});
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,width,height);
  ctx.drawImage(img,0,0,width,height);

  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.82));
  if(!blob) throw new Error('Gambar gagal diproses.');

  const dataUrl=await readFileAsDataUrl(blob);
  return {
    base64:dataUrl.split(',')[1]||'',
    mimeType:'image/jpeg',
    extension:'jpg',
    preview:dataUrl,
    bytes:blob.size
  };
}

function updatePbdEvidencePreview(row,url){
  const preview=row.querySelector('.pbd-photo-preview');
  if(!preview) return;

  if(url){
    const src=driveImg(url)||url;
    preview.innerHTML=`<a href="${esc(src)}" target="_blank" rel="noopener" title="Buka bukti gambar">
      <img class="pbd-evidence-thumb" src="${esc(src)}" alt="Bukti hasil kerja ${esc(row.dataset.name||'murid')}">
    </a>`;
  }else{
    preview.innerHTML='<span class="evidence-placeholder">🖼️</span>';
  }
}

async function handlePbdEvidence(input){
  const row=input.closest('.pbd-row');
  const file=input.files?.[0];
  if(!row || !file) return;

  const state=row.querySelector('.photo-state');
  const label=row.querySelector('.camera-label');
  let selectedTp=Number(row.dataset.tp||row.dataset.currentTp||0);

  if(!selectedTp){
    if(state) state.textContent='Pilih TP dahulu sebelum mengambil bukti kerja.';
    input.value='';
    return;
  }

  // Jika bukti ditambah pada TP lama, tandakan baris untuk disimpan semula.
  if(!row.dataset.tp){
    row.dataset.tp=String(selectedTp);
    row.classList.remove('pbd-saved');
    row.querySelector('.save-state').textContent='Belum disimpan';
  }

  if(state) state.textContent='⏳ Memproses gambar hasil kerja...';

  try{
    const photo=await compressPbdEvidencePhoto(file);
    if(photo.bytes>2.5*1024*1024){
      throw new Error('Gambar masih terlalu besar. Cuba ambil gambar semula.');
    }

    updatePbdEvidencePreview(row,photo.preview);
    if(state) state.textContent='⏳ Menyimpan bukti ke Google Drive...';

    const ting=document.getElementById('pbdTingkatan').value;
    const kelas=document.getElementById('pbdKelas').value;
    const tarikh=document.getElementById('pbdTarikh')?.value||'';
    const topik=selectedTopik()||{};
    const safeName=String(row.dataset.name||'murid')
      .replace(/[^a-z0-9]+/gi,'_')
      .replace(/^_+|_+$/g,'');

    const res=await fetch(CONFIG.SHEET_API_URL,{
      method:'POST',
      body:JSON.stringify({
        action:'uploadPbdEvidence',
        idMurid:row.dataset.id||'',
        namaMurid:row.dataset.name||'',
        tingkatan:ting,
        kelas:kelas,
        idTopik:topik.IDTopik||'',
        topik:topik.Topik||'',
        tp:selectedTp,
        tarikh:tarikh,
        fileName:`BUKTI_TP${selectedTp}_${safeName||'murid'}_${Date.now()}.jpg`,
        mimeType:photo.mimeType,
        base64:photo.base64
      })
    });

    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Gagal simpan bukti kerja');

    row.dataset.evidence=out.url||'';
    updatePbdEvidencePreview(row,out.thumbnailUrl||out.url||photo.preview);
    if(label) label.textContent='Tukar Bukti Kerja';
    if(state){
      state.textContent=out.sharingOk===false
        ? '⚠️ Bukti disimpan, tetapi paparan umum mungkin disekat oleh akaun sekolah.'
        : `✅ Bukti TP${selectedTp} disimpan. Tekan Simpan untuk merekod TP.`;
    }
  }catch(e){
    updatePbdEvidencePreview(row,row.dataset.evidence||'');
    if(state) state.textContent='❌ '+e.message;
  }finally{
    input.value='';
    updatePbdProgress();
  }
}


async function savePbdBatch(){
  const saveBtn=document.getElementById('pbdSaveBtn');
  if(saveBtn.dataset.busy==='1') return;
  const topik=selectedTopik();
  const ting=document.getElementById('pbdTingkatan').value;
  const kelas=document.getElementById('pbdKelas').value;
  const tarikh=document.getElementById('pbdTarikh')?.value || '';
  const guru=cleanName(document.getElementById('pbdGuru').value || 'Guru Sejarah');
  if(!tarikh){ document.getElementById('pbdStatus').textContent='Pilih tarikh pentaksiran melalui kalendar dahulu.'; return; }
  const activeRows=[...document.querySelectorAll('.pbd-row')].filter(r=>r.dataset.tp);
  const rows=activeRows.map(r=>({
    idMurid:r.dataset.id, namaMurid:r.dataset.name, tingkatan:ting, kelas:kelas, idTopik:topik.IDTopik,
    topik:topik.Topik, sk:topik['SK (Standard Kandungan)'], sp:topik['SP (Standard Pembelajaran)'],
    tarikh:tarikh,
    tp:r.dataset.tp,
    catatan:r.querySelector('.catatan').value,
    ditafsirOleh:guru,
    foto:r.dataset.evidence||''
  }));
  if(!rows.length){ document.getElementById('pbdStatus').textContent='Pilih TP sekurang-kurangnya seorang murid.'; return; }
  saveBtn.dataset.busy='1';
  saveBtn.disabled=true;
  const oldText=saveBtn.textContent;
  saveBtn.textContent='⏳ Menyimpan...';
  document.getElementById('pbdStatus').textContent=`Menyimpan ${rows.length} rekod TP untuk ${fmtDate(tarikh)}...`;
  try{
    const res=await fetch(CONFIG.SHEET_API_URL,{method:'POST',body:JSON.stringify({action:'savePbdBatch',records:rows})});
    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Gagal simpan');
    activeRows.forEach(r=>{
      r.classList.add('pbd-saved');
      r.querySelector('.save-state').textContent=r.dataset.evidence
        ? '✅ TP dan bukti sudah disimpan'
        : '✅ Sudah disimpan';
      r.dataset.currentTp=r.dataset.tp||r.dataset.currentTp||'';
      delete r.dataset.tp;
    });
    document.getElementById('pbdStatus').innerHTML=`✅ Berjaya simpan <b>${out.count||rows.length}</b> rekod TP bertarikh <b>${esc(fmtDate(tarikh))}</b>. Data sudah masuk ke Google Sheet.`;
    updatePbdProgress();
  }catch(e){
    document.getElementById('pbdStatus').textContent='Gagal simpan: '+e.message;
  }finally{
    saveBtn.dataset.busy='0';
    saveBtn.disabled=false;
    saveBtn.textContent=oldText;
  }
}


// ================= RUMUSAN KELAS TP v6.0 =================
function val(obj, names){
  for(const n of names){
    if(obj && obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];
  }
  const keys = Object.keys(obj||{});
  const norm = x => String(x||'').toLowerCase().replace(/\s+/g,'').replace(/_/g,'');
  for(const n of names){
    const wanted = norm(n);
    const k = keys.find(x=>norm(x)===wanted);
    if(k && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
  }
  return '';
}
function muridTing(m){ return String(val(m,['Tingkatan','Tingkat','Tingka'])).trim(); }
function muridKelas(m){ return String(val(m,['Kelas'])).trim(); }
const FALLBACK_SEJARAH_CLASSES = {
  '1':['ADIL','BESTARI','CENDEKIA','GIGIH','JUJUR','TEKUN','YAKIN','RASIONAL'],
  '2':['ADIL','CENDEKIA','DEDIKASI','EHSAN','GIGIH','PROGRESIF','RASIONAL','USAHA']
};

function fallbackTingkatanList(){
  const fromData=[...new Set((pbdData.murid||[]).map(m=>muridTing(m)).filter(Boolean))]
    .sort((a,b)=>Number(a)-Number(b));
  return fromData.length ? fromData : ['1','2'];
}

function fallbackClassList(ting){
  const fromData=[...new Set(activeMuridFor(ting,'').map(m=>muridKelas(m)).filter(Boolean))].sort();
  if(fromData.length) return fromData;
  return (FALLBACK_SEJARAH_CLASSES[String(ting)]||[]).slice();
}

function populateSelectOptions(select, placeholder, rows, labelFn){
  if(!select) return;
  const current=select.value;
  select.innerHTML=`<option value="">${esc(placeholder)}</option>`+
    rows.map(x=>`<option value="${esc(x)}">${esc(labelFn?labelFn(x):x)}</option>`).join('');
  if(rows.includes(current)) select.value=current;
}

function forcePopulatePbdFilters(){
  const tings=fallbackTingkatanList();

  populateSelectOptions(document.getElementById('pbdTingkatan'),'Pilih Tingkatan',tings,t=>`Tingkatan ${t}`);
  populateSelectOptions(document.getElementById('rumusTingkatan'),'Pilih Tingkatan',tings,t=>`Tingkatan ${t}`);
  populateSelectOptions(document.getElementById('examTingkatan'),'Pilih Tingkatan',tings,t=>`Tingkatan ${t}`);
  populateSelectOptions(document.getElementById('galleryPbdTingkatan'),'Semua Tingkatan',tings,t=>`Tingkatan ${t}`);
  populateSelectOptions(document.getElementById('hipTingkatan'),'Pilih Tingkatan',tings,t=>`Tingkatan ${t}`);

  ['pbd','rumus','exam','galleryPbd','hip'].forEach(prefix=>{
    const tingEl=document.getElementById(prefix==='pbd'?'pbdTingkatan':`${prefix}Tingkatan`);
    const kelasEl=document.getElementById(prefix==='pbd'?'pbdKelas':`${prefix}Kelas`);
    if(!tingEl||!kelasEl) return;
    const ting=tingEl.value||tings[0]||'';
    if(!tingEl.value && tings.length && (prefix==='rumus'||prefix==='exam')) tingEl.value=tings[0];
    const realTing=tingEl.value||ting;
    const classes=realTing ? fallbackClassList(realTing) : [];
    const placeholder=prefix==='galleryPbd'?'Semua Kelas':'Pilih Kelas';
    populateSelectOptions(kelasEl,placeholder,classes,k=>realTing?`Tingkatan ${realTing} ${k}`:k);
    if((prefix==='rumus'||prefix==='exam') && classes.length && !kelasEl.value) kelasEl.value=classes[0];
  });
}

function activeMuridFor(ting, kelas){
  return (pbdData.murid||[]).filter(m=>{
    const status = String(val(m,['Status'])||'AKTIF').toUpperCase();
    const aktif = status !== 'PINDAH' && status !== 'TIDAK AKTIF';
    return aktif && (!ting || String(muridTing(m))===String(ting)) && (!kelas || String(muridKelas(m))===String(kelas));
  });
}
function initPbdSummaryControls(){
  const tingSel = document.getElementById('rumusTingkatan');
  const kelasSel = document.getElementById('rumusKelas');
  if(!tingSel || !kelasSel) return;

  const tings = fallbackTingkatanList();
  tingSel.innerHTML = '<option value="">Pilih Tingkatan</option>' + tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');
  if(tings.length && !tingSel.value) tingSel.value = tings[0];
  onRumusTingkatan();
}
function onRumusTingkatan(){
  const ting = document.getElementById('rumusTingkatan')?.value || '';
  const kelasSel = document.getElementById('rumusKelas');
  if(!kelasSel) return;

  const kelas = fallbackClassList(ting);
  kelasSel.innerHTML = '<option value="">Pilih Kelas</option>' + kelas.map(k=>`<option value="${esc(k)}">${esc(ting ? ting+' '+k : k)}</option>`).join('');
  if(kelas.length && !kelasSel.value) kelasSel.value = kelas[0];
  renderPbdSummary();
}
async function fetchClassSummary(ting, kelas, ujian){
  const url = pbdApiUrl({
    action:'pbdClassSummary',
    tingkatan:ting,
    kelas:kelas,
    ujian:ujian||'UPSA'
  });
  const res = await fetch(url);
  const data = await res.json();
  if(!data.success) throw new Error(data.message || 'Gagal baca rumusan kelas');
  return data;
}
function renderEmptySummary(msg){
  const meta = document.getElementById('pbdSummaryMeta');
  const cards = document.getElementById('pbdSummaryCards');
  const chart = document.getElementById('pbdTpChart');
  const teacherBox = document.getElementById('pbdGuruSummary');
  const fame = document.getElementById('pbdFameGrid');
  const weak = document.getElementById('pbdWeakList');
  const noRec = document.getElementById('pbdNoRecordList');
  const all = document.getElementById('pbdAllTpList');
  if(meta) meta.innerHTML = msg;
  if(cards) cards.innerHTML = '';
  if(chart) chart.innerHTML = '';
  if(teacherBox) teacherBox.innerHTML = '';
  if(fame) fame.innerHTML = '<p class="note">Belum dipaparkan.</p>';
  currentPbdSummaryData = null;
  if(weak) weak.innerHTML = '<p class="note">Belum dipaparkan.</p>';
  if(noRec) noRec.innerHTML = '<p class="note">Belum dipaparkan.</p>';
  if(all) all.innerHTML = '<p class="note">Belum dipaparkan.</p>';
}
async function renderPbdSummary(){
  const meta = document.getElementById('pbdSummaryMeta');
  const cards = document.getElementById('pbdSummaryCards');
  const chart = document.getElementById('pbdTpChart');
  const teacherBox = document.getElementById('pbdGuruSummary');
  const fameBox = document.getElementById('pbdFameGrid');
  if(!meta || !cards || !chart || !teacherBox || !fameBox) return;

  const ting = document.getElementById('rumusTingkatan')?.value || '';
  const kelas = document.getElementById('rumusKelas')?.value || '';
  const ujian = examNorm(document.getElementById('rumusUjian')?.value || 'UPSA');
  if(!ting || !kelas){ renderEmptySummary('Pilih tingkatan dan kelas dahulu.'); return; }

  meta.innerHTML = '⏳ Memuat rumusan kelas, profil murid dan Fame of Sejarah...';
  cards.innerHTML = '';
  chart.innerHTML = '';
  teacherBox.innerHTML = '';
  fameBox.innerHTML = '<p class="note">Sedang menyusun pencapaian murid...</p>';

  try{
    const data = await fetchClassSummary(ting, kelas, ujian);
    currentPbdSummaryData = data;

    const s = data.summary || {};
    const tp = s.tpCounts || {1:0,2:0,3:0,4:0,5:0,6:0};
    const percent = s.totalActive ? Math.round((s.adaTp/s.totalActive)*100) : 0;
    const guruText = (data.guruKelas && data.guruKelas.length) ? data.guruKelas.join(', ') : 'Belum dipadankan';

    meta.innerHTML = `📌 <b>Tingkatan ${esc(ting)} ${esc(kelas)}</b> • Peperiksaan Fame: <b>${esc(ujian)}</b><br>👩‍🏫 Guru kelas / guru sejarah: <b>${esc(guruText)}</b><br><span class="note">Klik mana-mana kotak KPI, bar TP atau nama murid untuk melihat senarai dan profil terperinci.</span>`;

    const summary = [
      {title:'👨‍🎓 Murid Aktif',num:s.totalActive||0,desc:'Klik untuk lihat semua murid',type:'active'},
      {title:'✅ Ada TP',num:s.adaTp||0,desc:`${percent}% murid sudah ada TP`,type:'hasTp'},
      {title:'❌ Tiada Rekod',num:s.tiadaTp||0,desc:'Klik untuk tindakan susulan',type:'noRecord'},
      {title:'🚨 TP1–TP2',num:s.weakCount||0,desc:'Murid perlu bimbingan',type:'weak'},
      {title:'⭐ TP5',num:tp[5]||0,desc:'Klik senarai murid TP5',type:'tp',value:5},
      {title:'🏆 TP6',num:tp[6]||0,desc:'Klik senarai murid TP6',type:'tp',value:6},
      {title:'📊 Purata TP',num:s.avgTp || '-',desc:'Klik semua murid yang ada TP',type:'hasTp'},
      {title:'🗂️ Jumlah Rekod',num:s.totalRecords||0,desc:'Klik untuk sejarah rekod PBD',type:'records'}
    ];

    cards.innerHTML = summary.map(x=>`
      <button type="button" class="summary-card clickable-summary"
        onclick="openPbdStudentList('${x.type}',${x.value===undefined?"''":JSON.stringify(x.value)})">
        <span>${esc(x.title)}</span>
        <b>${esc(x.num)}</b>
        <small>${esc(x.desc)}</small>
        <em>Tekan untuk buka ↗</em>
      </button>`).join('');

    const max = Math.max(1, ...[1,2,3,4,5,6].map(n=>tp[n]||0));
    chart.innerHTML = `
      <h3>Graf Taburan TP Tertinggi Kelas <small>• setiap bar boleh diklik</small></h3>
      ${[1,2,3,4,5,6].map(n=>`
        <button type="button" class="tp-bar-row clickable-bar" onclick="openPbdStudentList('tp',${n})">
          <span>TP${n}</span>
          <div class="tp-bar-shell"><div class="tp-bar fill-tp${n}" style="width:${Math.round(((tp[n]||0)/max)*100)}%"></div></div>
          <b>${tp[n]||0}</b>
        </button>`).join('')}`;

    renderPbdFame(data.fameList||[], ujian);

    teacherBox.innerHTML = `
      <h3>Nota Rumusan</h3>
      <div class="teacher-row"><span>Kaedah kiraan PBD</span><b>1 murid = 1 TP tertinggi</b></div>
      <div class="teacher-row"><span>Markah ${esc(ujian)}</span><b>${s.examCount||0} daripada ${s.totalActive||0} murid</b></div>
      <div class="teacher-row"><span>Syarat Fame</span><b>TP4–TP6 dan Gred A/B</b></div>
      <div class="teacher-row"><span>Gambar murid</span><b>Tak wajib — avatar huruf dijana automatik</b></div>`;

    document.getElementById('pbdWeakList').innerHTML = renderStudentTable(data.weakList||[], 'Tiada murid TP1–TP2. Alhamdulillah, kelas nampak steady.');
    document.getElementById('pbdNoRecordList').innerHTML = renderStudentTable(data.noRecordList||[], 'Semua murid aktif sudah ada rekod TP.');
    document.getElementById('pbdAllTpList').innerHTML = renderStudentTable(data.allList||[], 'Belum ada senarai murid.');
  }catch(e){
    renderEmptySummary('Gagal muat rumusan: '+esc(e.message));
  }
}

function studentKeyOf(x){
  return String(x?.studentKey || x?.id || x?.nama || '').trim();
}

function studentInitials(name){
  const parts=String(name||'Murid').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return 'M';
  const first=parts[0]?.[0]||'M';
  const last=parts.length>1 ? parts[parts.length-1][0] : (parts[0]?.[1]||'');
  return (first+last).toUpperCase();
}

function studentAvatarTone(name){
  let hash=0;
  for(const ch of String(name||'')) hash=((hash<<5)-hash)+ch.charCodeAt(0);
  return Math.abs(hash)%8;
}

function studentAvatarHtml(student, size=''){
  const photo=driveImg(student?.foto||student?.photo||'');
  if(photo){
    return `<img class="student-avatar ${size}" src="${esc(photo)}" alt="" onerror="this.outerHTML='<span class=&quot;student-avatar ${size} tone-${studentAvatarTone(student?.nama)}&quot;>${studentInitials(student?.nama)}</span>'">`;
  }
  return `<span class="student-avatar ${size} tone-${studentAvatarTone(student?.nama)}">${esc(studentInitials(student?.nama))}</span>`;
}

function examBadge(student){
  if(student?.peratus==='' || student?.peratus===null || student?.peratus===undefined) return '<span class="mini-badge muted-badge">Belum ada markah</span>';
  return `<span class="mini-badge grade-${esc(String(student.gred||'').toLowerCase())}">${esc(student.gred||'-')} • ${esc(student.peratus)}%</span>`;
}

function renderPbdFame(list, ujian){
  const box=document.getElementById('pbdFameGrid');
  if(!box) return;

  if(!list.length){
    box.innerHTML=`<div class="fame-empty">
      <div class="fame-empty-icon">🌱</div>
      <b>Belum ada murid memenuhi syarat Fame</b>
      <p>Fame akan muncul apabila murid mendapat TP4–TP6 dan Gred A/B bagi ${esc(ujian)}.</p>
    </div>`;
    return;
  }

  box.innerHTML=list.map((s,i)=>`
    <button type="button" class="fame-card rank-${i+1}" onclick="openPbdStudentProfile('${encodeURIComponent(studentKeyOf(s))}')">
      <span class="fame-rank">${i<3?['🥇','🥈','🥉'][i]:'#'+(i+1)}</span>
      ${studentAvatarHtml(s,'fame-avatar')}
      <span class="fame-title">${esc(s.fameTitle||'Bintang Sejarah')}</span>
      <strong>${esc(s.nama||'-')}</strong>
      <small>Tingkatan ${esc(s.tingkatan||'')} ${esc(s.kelas||'')}</small>
      <div class="fame-scores">
        <span>TP${esc(s.tp||'-')}</span>
        <span>${esc(s.ujian||ujian)} ${esc(s.peratus)}%</span>
        <span>Gred ${esc(s.gred||'-')}</span>
      </div>
      <em>Tekan untuk profil</em>
    </button>`).join('');
}

function renderStudentTable(list, emptyText){
  if(!list || !list.length) return `<p class="note">${esc(emptyText)}</p>`;
  const rows = list.slice(0,80).map((x,i)=>{
    const tpText = x.tp ? `TP${x.tp}` : (x.status || 'Tiada rekod');
    const examText = x.peratus!=='' && x.peratus!==undefined ? `${x.peratus}% (${x.gred||'-'})` : '-';
    return `<tr>
      <td>${i+1}</td>
      <td>
        <button type="button" class="student-name-link" onclick="openPbdStudentProfile('${encodeURIComponent(studentKeyOf(x))}')">
          ${studentAvatarHtml(x,'mini-avatar')}
          <span><b>${esc(x.nama||'-')}</b><small>${esc(x.id||'')}</small></span>
        </button>
      </td>
      <td>${esc(tpText)}</td>
      <td>${esc(examText)}</td>
      <td>${esc(x.tarikh||'-')}</td>
      <td>${esc(cleanName(x.guru||'-'))}</td>
    </tr>`;
  }).join('');

  return `<div class="table-scroll"><table class="pbd-table">
    <thead><tr><th>Bil</th><th>Nama Murid</th><th>TP</th><th>Peperiksaan</th><th>Tarikh</th><th>Guru</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>${list.length>80?`<p class="note">Dipaparkan 80 daripada ${list.length} murid.</p>`:''}</div>`;
}

function filterPbdStudents(type,value){
  const data=currentPbdSummaryData;
  if(!data) return [];
  const all=data.allList||[];
  if(type==='hasTp') return all.filter(x=>Number(x.tp)>0);
  if(type==='noRecord') return all.filter(x=>!Number(x.tp));
  if(type==='weak') return all.filter(x=>Number(x.tp)>0&&Number(x.tp)<=2);
  if(type==='tp') return all.filter(x=>Number(x.tp)===Number(value));
  if(type==='fame') return data.fameList||[];
  return all;
}

function pbdListTitle(type,value){
  if(type==='hasTp') return '✅ Murid yang Sudah Ada TP';
  if(type==='noRecord') return '❌ Murid Tiada Rekod TP';
  if(type==='weak') return '🚨 Murid TP1–TP2';
  if(type==='tp') return `📊 Senarai Murid TP${value}`;
  if(type==='fame') return '🌟 Fame of Sejarah';
  if(type==='records') return '🗂️ Semua Rekod PBD Kelas';
  return '👨‍🎓 Semua Murid Aktif';
}

function openPbdStudentList(type='active',value=''){
  const data=currentPbdSummaryData;
  if(!data) return;

  currentPbdListContext={type,value};
  const dialog=document.getElementById('studentExplorerDialog');
  const body=document.getElementById('studentExplorerBody');
  if(!dialog||!body) return;

  if(type==='records'){
    const records=data.recordList||[];
    body.innerHTML=`<div class="student-dialog-head">
      <div><p class="eyebrow">TINGKATAN ${esc(data.tingkatan)} ${esc(data.kelas)}</p><h2>${pbdListTitle(type,value)}</h2></div>
      <span class="count-pill">${records.length} rekod</span>
    </div>
    ${records.length?`<div class="record-timeline">${records.map(r=>`
      <button type="button" class="record-item" onclick="openPbdStudentProfile('${encodeURIComponent(studentKeyOf(r))}')">
        ${studentAvatarHtml(r,'mini-avatar')}
        <span><b>${esc(r.nama)}</b><small>${esc(r.tarikh||'-')} • ${esc(r.topik||'Topik tidak dinyatakan')} • ${esc(cleanName(r.guru||'-'))}</small></span>
        <strong>TP${esc(r.tp)}</strong>
      </button>`).join('')}</div>`:'<p class="note">Belum ada rekod PBD.</p>'}`;
  }else{
    const students=filterPbdStudents(type,value);
    body.innerHTML=`<div class="student-dialog-head">
      <div><p class="eyebrow">TINGKATAN ${esc(data.tingkatan)} ${esc(data.kelas)}</p><h2>${pbdListTitle(type,value)}</h2></div>
      <span class="count-pill">${students.length} murid</span>
    </div>
    <div class="student-card-list">${students.map(s=>`
      <button type="button" class="student-list-card" onclick="openPbdStudentProfile('${encodeURIComponent(studentKeyOf(s))}')">
        ${studentAvatarHtml(s,'list-avatar')}
        <span class="student-list-main">
          <strong>${esc(s.nama||'-')}</strong>
          <small>${esc(s.status||'Klik untuk lihat rekod PBD dan peperiksaan')}</small>
        </span>
        <span class="student-list-score">${s.tp?`<b>TP${esc(s.tp)}</b>`:'<b>Tiada TP</b>'}${examBadge(s)}</span>
      </button>`).join('')}</div>`;
  }

  if(!dialog.open) dialog.showModal();
}

function findPbdStudent(key){
  const decoded=decodeURIComponent(String(key||''));
  return (currentPbdSummaryData?.allList||[]).find(x=>studentKeyOf(x)===decoded);
}

function openPbdStudentProfile(encodedKey){
  const s=findPbdStudent(encodedKey);
  if(!s) return;

  const dialog=document.getElementById('studentExplorerDialog');
  const body=document.getElementById('studentExplorerBody');
  const records=s.records||[];
  const hasBack=currentPbdListContext?.type;

  body.innerHTML=`
    <div class="student-profile-top">
      ${studentAvatarHtml(s,'profile-avatar')}
      <div>
        <p class="eyebrow">PROFIL MURID SEJARAH</p>
        <h2>${esc(s.nama||'-')}</h2>
        <p>Tingkatan ${esc(s.tingkatan||currentPbdSummaryData?.tingkatan||'')} ${esc(s.kelas||currentPbdSummaryData?.kelas||'')}</p>
        <div class="profile-badges">
          <span class="mini-badge tp-badge">${s.tp?`TP${esc(s.tp)}`:'Tiada TP'}</span>
          ${examBadge(s)}
          ${s.fameTitle?`<span class="mini-badge fame-badge">${esc(s.fameTitle)}</span>`:''}
        </div>
      </div>
    </div>

    <div class="student-kpi-grid">
      <div><span>TP Tertinggi</span><b>${s.tp?`TP${esc(s.tp)}`:'-'}</b></div>
      <div><span>${esc(s.ujian||currentPbdSummaryData?.ujian||'Peperiksaan')}</span><b>${s.peratus!==''&&s.peratus!==undefined?`${esc(s.peratus)}%`:'-'}</b></div>
      <div><span>Gred</span><b>${esc(s.gred||'-')}</b></div>
      <div><span>Jumlah Rekod PBD</span><b>${esc(s.recordCount||0)}</b></div>
    </div>

    <section class="profile-section">
      <h3>📝 Ringkasan Peperiksaan</h3>
      <div class="exam-mini-grid">
        <div><span>Objektif</span><b>${s.jumlahObj!==''&&s.jumlahObj!==undefined?esc(s.jumlahObj):'-'}</b></div>
        <div><span>Struktur</span><b>${s.jumlahStruktur!==''&&s.jumlahStruktur!==undefined?esc(s.jumlahStruktur):'-'}</b></div>
        <div><span>Esei</span><b>${s.jumlahEsei!==''&&s.jumlahEsei!==undefined?esc(s.jumlahEsei):'-'}</b></div>
      </div>
    </section>

    <section class="profile-section">
      <h3>📚 Rekod PBD</h3>
      ${records.length?`<div class="profile-records">${records.map((r,i)=>`
        <article class="${r.bukti?'has-evidence':''}">
          <span class="record-number">${i+1}</span>
          ${r.bukti?`<a class="profile-evidence-link" href="${esc(driveImg(r.bukti)||r.bukti)}" target="_blank" rel="noopener">
            <img src="${esc(driveImg(r.bukti)||r.bukti)}" alt="Bukti PBD">
          </a>`:''}
          <div><b>${esc(r.topik||'Topik tidak dinyatakan')}</b><small>${esc(r.tarikh||'-')} • ${esc(cleanName(r.guru||'-'))}${r.bukti?' • 📸 Ada bukti kerja':''}</small></div>
          <strong>TP${esc(r.tp)}</strong>
        </article>`).join('')}</div>`:'<p class="note">Murid ini belum mempunyai rekod TP.</p>'}
    </section>

    ${hasBack?`<button type="button" class="pill student-back-btn" onclick="openPbdStudentList('${currentPbdListContext.type}',${JSON.stringify(currentPbdListContext.value)})">← Kembali ke senarai</button>`:''}`;

  if(!dialog.open) dialog.showModal();
}

function closeStudentExplorer(){
  const dialog=document.getElementById('studentExplorerDialog');
  if(dialog?.open) dialog.close();
}


// ================= LAPORAN PBD UNTUK CETAK v6.9 =================
async function openPbdPrintReport(){
  const ting=document.getElementById('rumusTingkatan')?.value||'';
  const kelas=document.getElementById('rumusKelas')?.value||'';
  const status=document.getElementById('pbdSummaryMeta');

  if(!ting||!kelas){
    if(status) status.textContent='Pilih Tingkatan dan Kelas dahulu sebelum mencetak laporan.';
    return;
  }

  // Buka tab segera supaya pelayar tidak menyekat popup selepas proses fetch.
  const printWin=window.open('','_blank');
  if(!printWin){
    if(status) status.textContent='Popup disekat. Benarkan popup untuk portal ini, kemudian cuba lagi.';
    return;
  }

  printWin.document.open();
  printWin.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Memuat Laporan PBD</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;text-align:center;color:#24314d} .spin{font-size:42px;animation:p 1s infinite alternate}@keyframes p{to{transform:scale(1.15)}}</style>
    </head><body><div class="spin">📚</div><h2>Memuat laporan PBD...</h2><p>Tingkatan ${esc(ting)} ${esc(kelas)}</p></body></html>`);
  printWin.document.close();

  try{
    const url=pbdApiUrl({
      action:'pbdPrintReport',
      tingkatan:ting,
      kelas:kelas,
      v:Date.now()
    });
    const res=await fetch(url);
    const data=await res.json();
    if(!data.success) throw new Error(data.message||'Gagal menjana laporan PBD');

    printWin.document.open();
    printWin.document.write(buildPbdPrintHtml(data));
    printWin.document.close();
  }catch(e){
    printWin.document.open();
    printWin.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Ralat Laporan</title></head>
      <body style="font-family:Arial,sans-serif;padding:40px"><h2>❌ Laporan gagal dijana</h2><p>${esc(e.message)}</p>
      <button onclick="window.close()">Tutup</button></body></html>`);
    printWin.document.close();
  }
}

function chunkArray(items,size){
  const out=[];
  for(let i=0;i<items.length;i+=size) out.push(items.slice(i,i+size));
  return out;
}

function buildPbdPrintHtml(data){
  const logoUrl=new URL('logo-smktj2.jpg',location.href).href;
  const topics=Array.isArray(data.topics)?data.topics:[];
  const students=Array.isArray(data.students)?data.students:[];
  const chunks=topics.length?chunkArray(topics,6):[[]];
  const totalChunks=chunks.length;

  const pages=chunks.map((topicChunk,pageIndex)=>{
    const topicHeaders=topicChunk.map(t=>`
      <th class="topic-col">
        <span class="topic-code">${esc(t.code||'')}</span>
        <span>${esc(t.title||'Topik')}</span>
      </th>`).join('');

    const bodyRows=students.map((s,i)=>{
      const cells=topicChunk.map(t=>{
        const rec=(s.values||{})[t.key];
        const detail=rec
          ? `TP${esc(rec.tp)} • ${esc(rec.tarikh||'')} • ${esc(rec.guru||'')}`
          : 'Belum ada rekod';
        return `<td class="tp-cell" title="${detail}">${rec?esc(rec.tp):''}</td>`;
      }).join('');

      return `<tr>
        <td class="bil">${i+1}</td>
        <td class="student-name">${esc(s.nama||'-')}</td>
        ${cells}
      </tr>`;
    }).join('');

    const emptyMessage=!topics.length
      ? `<tr><td colspan="3" class="empty-report">Belum ada rekod TP bagi kelas ini.</td></tr>`
      : '';

    return `<section class="report-page ${pageIndex<totalChunks-1?'page-break':''}">
      <header class="report-header">
        <img src="${logoUrl}" alt="Logo sekolah">
        <div>
          <h1>LAPORAN REKOD TP PBD SEJARAH</h1>
          <h2>SMK TAMAN JASMIN 2</h2>
        </div>
      </header>

      <div class="report-meta">
        <div><b>Kelas:</b> Tingkatan ${esc(data.tingkatan)} ${esc(data.kelas)}</div>
        <div><b>Tarikh Cetakan:</b> ${esc(data.printDate||'')}</div>
        <div><b>Guru:</b> ${esc((data.guruKelas||[]).join(', ')||'Guru Sejarah')}</div>
        <div><b>Bahagian Topik:</b> ${pageIndex+1} / ${totalChunks}</div>
      </div>

      <table>
        <colgroup>
          <col class="bil-col">
          <col class="name-col">
          ${topicChunk.map(()=>'<col class="tp-col">').join('')}
        </colgroup>
        <thead>
          <tr>
            <th>Bil</th>
            <th>Nama Murid</th>
            ${topicHeaders}
          </tr>
        </thead>
        <tbody>${bodyRows||emptyMessage}</tbody>
      </table>

      <footer class="report-foot">
        <span>Setiap sel memaparkan TP tertinggi murid bagi topik tersebut. Jika TP sama, rekod paling baharu digunakan.</span>
        <span>${students.length} murid aktif • ${topics.length} topik mempunyai rekod</span>
      </footer>
    </section>`;
  }).join('');

  return `<!doctype html>
  <html lang="ms">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Laporan PBD - Tingkatan ${esc(data.tingkatan)} ${esc(data.kelas)}</title>
    <style>
      :root{--ink:#172033;--line:#263246;--soft:#eef3f8;--accent:#274c77}
      *{box-sizing:border-box}
      body{margin:0;background:#e9eef5;color:var(--ink);font-family:Arial,Helvetica,sans-serif}
      .toolbar{
        position:sticky;top:0;z-index:20;
        display:flex;justify-content:center;gap:10px;align-items:center;
        padding:12px;background:#172033;color:#fff;
        box-shadow:0 6px 18px rgba(0,0,0,.2)
      }
      .toolbar button{
        border:0;border-radius:999px;padding:11px 18px;font-weight:800;cursor:pointer
      }
      .print-btn{background:#32c5ff;color:#092033}
      .close-btn{background:#fff;color:#172033}
      .toolbar small{opacity:.8;margin-left:8px}
      .report-page{
        width:277mm;min-height:190mm;
        margin:10mm auto;padding:8mm;
        background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.13)
      }
      .report-header{display:flex;justify-content:center;align-items:center;gap:15px;text-align:center;margin-bottom:5mm}
      .report-header img{width:18mm;height:18mm;object-fit:contain}
      .report-header h1{margin:0;font-size:18pt;letter-spacing:.3px}
      .report-header h2{margin:2mm 0 0;font-size:13pt}
      .report-meta{
        display:grid;grid-template-columns:1fr 1fr;gap:2mm 8mm;
        margin:0 0 4mm;font-size:9pt
      }
      table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8.2pt}
      thead{display:table-header-group}
      tr{break-inside:avoid}
      th,td{border:1.2px solid var(--line);padding:2.2mm 1.4mm;vertical-align:middle}
      th{background:var(--soft);text-align:center;font-weight:800;line-height:1.15}
      .bil-col{width:10mm}.name-col{width:72mm}.tp-col{width:auto}
      .bil{text-align:center}
      .student-name{text-align:left;font-weight:700}
      .tp-cell{text-align:center;font-size:11pt;font-weight:800}
      .topic-col{font-size:7.7pt;overflow-wrap:anywhere}
      .topic-code{display:block;color:var(--accent);font-size:7pt;margin-bottom:1mm}
      .report-foot{
        display:flex;justify-content:space-between;gap:10mm;
        margin-top:3mm;font-size:7.5pt;color:#45556d
      }
      .empty-report{text-align:center;padding:15mm}
      @media print{
        @page{size:A4 landscape;margin:7mm}
        body{background:#fff}
        .toolbar{display:none!important}
        .report-page{
          width:auto;min-height:auto;margin:0;padding:0;box-shadow:none
        }
        .page-break{break-after:page;page-break-after:always}
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
      <button class="close-btn" onclick="window.close()">Tutup</button>
      <small>Pilih “Save as PDF” dalam tetingkap cetak jika mahu fail PDF.</small>
    </div>
    ${pages}
  </body>
  </html>`;
}


// ================= GALERI HASIL MURID / BUKTI PBD v7.2 =================
function initPbdEvidenceGallery(){
  if(document.getElementById('pbdEvidenceGalleryPanel')) return;

  const anchor=document.getElementById('pbdPanel');
  if(!anchor) return;

  const section=document.createElement('section');
  section.id='pbdEvidenceGalleryPanel';
  section.className='panel evidence-gallery-panel';
  section.innerHTML=`
    <div class="section-head evidence-gallery-head">
      <div>
        <p class="eyebrow">BUKTI PENTAKSIRAN BILIK DARJAH</p>
        <h2>🖼️ Galeri Hasil Murid</h2>
        <p class="note">Gambar lama daripada AppSheet dan bukti baharu daripada portal dipaparkan terus di sini.</p>
      </div>
      <span class="evidence-gallery-badge">Klik gambar untuk buka penuh</span>
    </div>

    <div class="controls evidence-gallery-controls">
      <label>Tingkatan
        <select id="galleryPbdTingkatan"><option value="">Semua Tingkatan</option></select>
      </label>
      <label>Kelas
        <select id="galleryPbdKelas"><option value="">Semua Kelas</option></select>
      </label>
      <label>Topik
        <select id="galleryPbdTopik"><option value="">Semua Topik</option></select>
      </label>
      <label>TP
        <select id="galleryPbdTp">
          <option value="">Semua TP</option>
          <option value="1">TP1</option>
          <option value="2">TP2</option>
          <option value="3">TP3</option>
          <option value="4">TP4</option>
          <option value="5">TP5</option>
          <option value="6">TP6</option>
        </select>
      </label>
      <button type="button" class="pill primary" id="galleryPbdLoadBtn">Papar Galeri</button>
    </div>

    <div id="galleryPbdStatus" class="note pbd-status-box">
      Pilih kelas atau tekan Papar Galeri untuk melihat bukti hasil kerja.
    </div>
    <div id="galleryPbdGrid" class="student-work-gallery">
      <div class="gallery-empty-state">
        <span>🖼️</span>
        <b>Galeri sedia digunakan</b>
        <p>Gambar akan dipadankan dengan rekod murid, kelas, topik dan TP.</p>
      </div>
    </div>`;

  anchor.insertAdjacentElement('afterend',section);

  const tingSel=document.getElementById('galleryPbdTingkatan');
  const tings=[...new Set((pbdData.murid||[]).map(m=>String(muridTing(m)||'')).filter(Boolean))]
    .sort((a,b)=>Number(a)-Number(b));
  tingSel.innerHTML='<option value="">Semua Tingkatan</option>'+
    tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');

  tingSel.addEventListener('change',onEvidenceGalleryTingkatan);
  document.getElementById('galleryPbdKelas').addEventListener('change',syncEvidenceGalleryTopik);
  document.getElementById('galleryPbdLoadBtn').addEventListener('click',loadPbdEvidenceGallery);

  // Ikut pilihan semasa Isi PBD jika ada.
  const currentTing=document.getElementById('pbdTingkatan')?.value||'';
  const currentClass=document.getElementById('pbdKelas')?.value||'';
  if(currentTing){
    tingSel.value=currentTing;
    onEvidenceGalleryTingkatan();
    document.getElementById('galleryPbdKelas').value=currentClass;
  }
  syncEvidenceGalleryTopik();
}

function onEvidenceGalleryTingkatan(){
  const ting=document.getElementById('galleryPbdTingkatan')?.value||'';
  const classes=[...new Set((pbdData.murid||[])
    .filter(m=>(!ting||String(muridTing(m))===String(ting))&&muridStatus(m)!=='PINDAH')
    .map(m=>String(muridKelas(m)||'').trim())
    .filter(Boolean))].sort();

  const classSel=document.getElementById('galleryPbdKelas');
  classSel.innerHTML='<option value="">Semua Kelas</option>'+
    classes.map(k=>`<option value="${esc(k)}">${ting?`Tingkatan ${esc(ting)} `:''}${esc(k)}</option>`).join('');
  syncEvidenceGalleryTopik();
}

function syncEvidenceGalleryTopik(){
  const ting=document.getElementById('galleryPbdTingkatan')?.value||'';
  const topics=(pbdData.topik||[])
    .filter(t=>!ting||String(t.Tingkatan||'')===String(ting))
    .map(t=>({
      value:String(t.IDTopik||t.Topik||'').trim(),
      label:String(t.Topik||t['SK (Standard Kandungan)']||'Topik').trim()
    }))
    .filter(t=>t.value&&t.label);

  const unique=[];
  const seen=new Set();
  topics.forEach(t=>{
    const key=examNorm(t.label);
    if(!seen.has(key)){seen.add(key);unique.push(t);}
  });

  const sel=document.getElementById('galleryPbdTopik');
  const previous=sel?.value||'';
  if(sel){
    sel.innerHTML='<option value="">Semua Topik</option>'+
      unique.map(t=>`<option value="${esc(t.label)}">${esc(t.label)}</option>`).join('');
    if([...sel.options].some(o=>o.value===previous)) sel.value=previous;
  }
}

function evidenceGalleryImageUrl(item){
  return item.thumbnailUrl||driveImg(item.url)||item.url||'';
}

async function loadPbdEvidenceGallery(){
  const grid=document.getElementById('galleryPbdGrid');
  const status=document.getElementById('galleryPbdStatus');
  if(!grid||!status) return;

  const ting=document.getElementById('galleryPbdTingkatan')?.value||'';
  const kelas=document.getElementById('galleryPbdKelas')?.value||'';
  const topik=document.getElementById('galleryPbdTopik')?.value||'';
  const tp=document.getElementById('galleryPbdTp')?.value||'';

  status.innerHTML='⏳ Sedang memadankan rekod PBD dengan gambar dalam Google Drive...';
  grid.innerHTML=Array.from({length:6},()=>'<div class="work-gallery-skeleton"></div>').join('');

  try{
    const res=await fetch(pbdApiUrl({
      action:'pbdEvidenceGallery',
      tingkatan:ting,
      kelas:kelas,
      topik:topik,
      tp:tp,
      limit:80
    }));
    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Galeri gagal dibaca');

    const rows=out.rows||[];
    status.innerHTML=`✅ <b>${rows.length}</b> bukti hasil kerja dipaparkan`+
      `${out.unresolved?` • ${out.unresolved} fail lama belum dapat dipadankan`:''}.`;

    if(!rows.length){
      grid.innerHTML=`<div class="gallery-empty-state">
        <span>🔎</span>
        <b>Tiada gambar untuk pilihan ini</b>
        <p>Cuba pilih kelas, topik atau TP yang lain.</p>
      </div>`;
      return;
    }

    grid.innerHTML=rows.map((item,i)=>{
      const img=evidenceGalleryImageUrl(item);
      return `<article class="student-work-card">
        <button type="button" class="student-work-image" onclick="openUrl('${String(item.viewUrl||item.url||img).replace(/'/g,"\\'")}')">
          <img src="${esc(img)}" alt="Hasil kerja ${esc(item.nama||'murid')}"
            loading="lazy"
            onerror="this.closest('.student-work-image').classList.add('image-error');this.style.display='none'">
          <span class="image-error-label">🖼️<small>Buka gambar</small></span>
          <span class="work-tp-badge">TP${esc(item.tp||'-')}</span>
        </button>
        <div class="student-work-info">
          <p class="work-number">BUKTI #${i+1}</p>
          <h3>${esc(item.nama||'-')}</h3>
          <p><b>${esc(item.tingkatan||'')} ${esc(item.kelas||'')}</b> • ${esc(item.tarikh||'-')}</p>
          <p class="work-topic">${esc(item.topik||item.sk||'Topik tidak dinyatakan')}</p>
          <small>Ditafsir oleh ${esc(cleanName(item.guru||'-'))}</small>
          ${item.catatan?`<p class="work-note">“${esc(item.catatan)}”</p>`:''}
        </div>
      </article>`;
    }).join('');
  }catch(e){
    status.innerHTML='❌ Galeri gagal dimuatkan: '+esc(e.message);
    grid.innerHTML=`<div class="gallery-empty-state"><span>⚠️</span><b>Galeri tidak dapat dibuka</b><p>${esc(e.message)}</p></div>`;
  }
}


// ================= GALERI AKTIVITI MURID / BUKTI HIP v7.3 =================
let hipSelectedVideoFile=null;
let hipSelectedVideoObjectUrl='';

function initHipActivityGallery(){
  if(document.getElementById('hipActivityPanel')) return;

  const anchor=document.getElementById('pbdEvidenceGalleryPanel') || document.getElementById('pbdPanel');
  if(!anchor) return;

  const section=document.createElement('section');
  section.id='hipActivityPanel';
  section.className='panel hip-activity-panel';
  section.innerHTML=`
    <div class="section-head hip-section-head">
      <div>
        <p class="eyebrow">HIGHLY IMMERSIVE PROGRAMME</p>
        <h2>🎬 Galeri Aktiviti Murid & Bukti HIP</h2>
        <p class="note">Rakam video pendek melalui telefon atau masukkan pautan video Google Drive / YouTube.</p>
      </div>
      <span class="hip-limit-badge">Video terus: maksimum 15 MB</span>
    </div>

    <div class="hip-upload-card">
      <div class="controls hip-controls">
        <label>Tingkatan
          <select id="hipTingkatan"><option value="">Pilih Tingkatan</option></select>
        </label>
        <label>Kelas
          <select id="hipKelas"><option value="">Pilih Kelas</option></select>
        </label>
        <label>Tarikh Aktiviti
          <input id="hipTarikh" type="date">
        </label>
        <label>Guru
          <select id="hipGuru"><option value="">Pilih Guru</option></select>
        </label>
        <label class="hip-title-field">Tajuk Aktiviti HIP
          <input id="hipTajuk" type="text" placeholder="Contoh: Greek Leisure Speaking Challenge">
        </label>
        <label>Nama Murid / Kumpulan
          <input id="hipPeserta" type="text" placeholder="Contoh: Kumpulan Athena / Seluruh kelas">
        </label>
        <label class="hip-note-field">Penerangan ringkas
          <textarea id="hipCatatan" rows="2" placeholder="Aktiviti, kemahiran bahasa atau hasil pembelajaran"></textarea>
        </label>
      </div>

      <div class="hip-video-source">
        <div class="hip-record-box">
          <label class="hip-record-btn">
            <span class="hip-record-icon">📹</span>
            <span><b>Rakam / Pilih Video</b><small>Telefon akan menawarkan kamera atau galeri</small></span>
            <input id="hipVideoFile" type="file" accept="video/*" capture="environment">
          </label>
          <p class="hip-or">ATAU</p>
          <label class="hip-link-field">Pautan video besar
            <input id="hipVideoLink" type="url" placeholder="Google Drive atau YouTube">
            <small>Gunakan pautan jika video melebihi 15 MB.</small>
          </label>
        </div>

        <div id="hipVideoPreview" class="hip-video-preview">
          <span>🎞️</span>
          <b>Belum ada video dipilih</b>
          <small>Video pendek 20–60 saat paling sesuai sebagai bukti HIP.</small>
        </div>
      </div>

      <div class="hip-actions">
        <button type="button" class="pill primary" id="hipSaveBtn">💾 Simpan Bukti HIP</button>
        <button type="button" class="pill" id="hipResetBtn">Kosongkan</button>
      </div>
      <div id="hipUploadStatus" class="note pbd-status-box">Belum ada video disimpan.</div>
    </div>

    <div class="hip-gallery-header">
      <div>
        <h3>🎥 Video Aktiviti yang Disimpan</h3>
        <p class="note">Gunakan pilihan Tingkatan dan Kelas di atas, kemudian tekan Muat Semula Galeri.</p>
      </div>
      <button type="button" class="pill" id="hipLoadGalleryBtn">🔄 Muat Semula Galeri</button>
    </div>

    <div id="hipGalleryStatus" class="note pbd-status-box">Galeri belum dimuatkan.</div>
    <div id="hipVideoGallery" class="hip-video-gallery">
      <div class="gallery-empty-state">
        <span>🎬</span>
        <b>Galeri HIP sedia digunakan</b>
        <p>Video akan dipaparkan mengikut kelas dan tarikh aktiviti.</p>
      </div>
    </div>

    <dialog id="hipVideoDialog" class="profile-dialog hip-video-dialog">
      <button class="close" type="button" onclick="closeHipVideo()">×</button>
      <div id="hipVideoDialogBody"></div>
    </dialog>`;

  anchor.insertAdjacentElement('afterend',section);

  const tingSel=document.getElementById('hipTingkatan');
  const tings=[...new Set((pbdData.murid||[]).map(m=>String(muridTing(m)||'')).filter(Boolean))]
    .sort((a,b)=>Number(a)-Number(b));
  tingSel.innerHTML='<option value="">Pilih Tingkatan</option>'+
    tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');

  const guruSel=document.getElementById('hipGuru');
  const guruNames=[...new Set([
    ...(guruData||[]).map(g=>cleanName(val(g,['Nama Guru','Nama','nama']))),
    ...[...document.querySelectorAll('#pbdGuru option')].map(o=>cleanName(o.value))
  ].filter(Boolean))].sort();
  guruSel.innerHTML='<option value="">Pilih Guru</option>'+
    guruNames.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');

  const currentGuru=document.getElementById('pbdGuru')?.value||'';
  if(currentGuru && guruNames.includes(cleanName(currentGuru))) guruSel.value=cleanName(currentGuru);

  document.getElementById('hipTarikh').value=new Date().toISOString().slice(0,10);
  tingSel.addEventListener('change',syncHipClasses);
  document.getElementById('hipVideoFile').addEventListener('change',handleHipVideoFile);
  document.getElementById('hipSaveBtn').addEventListener('click',saveHipActivityVideo);
  document.getElementById('hipResetBtn').addEventListener('click',resetHipForm);
  document.getElementById('hipLoadGalleryBtn').addEventListener('click',loadHipActivityGallery);

  const currentTing=document.getElementById('pbdTingkatan')?.value||'';
  const currentClass=document.getElementById('pbdKelas')?.value||'';
  if(currentTing){
    tingSel.value=currentTing;
    syncHipClasses();
    document.getElementById('hipKelas').value=currentClass;
  }
}

function syncHipClasses(){
  const ting=document.getElementById('hipTingkatan')?.value||'';
  const classes=[...new Set((pbdData.murid||[])
    .filter(m=>String(muridTing(m)||'')===String(ting)&&muridStatus(m)!=='PINDAH')
    .map(m=>String(muridKelas(m)||'').trim())
    .filter(Boolean))].sort();

  const sel=document.getElementById('hipKelas');
  const previous=sel.value||'';
  sel.innerHTML='<option value="">Pilih Kelas</option>'+
    classes.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
  if(classes.includes(previous)) sel.value=previous;
}

function formatBytes(bytes){
  const n=Number(bytes||0);
  if(n<1024) return `${n} B`;
  if(n<1024*1024) return `${(n/1024).toFixed(1)} KB`;
  return `${(n/(1024*1024)).toFixed(1)} MB`;
}

function handleHipVideoFile(input){
  const file=input.files?.[0];
  const preview=document.getElementById('hipVideoPreview');
  const status=document.getElementById('hipUploadStatus');

  hipSelectedVideoFile=null;
  if(hipSelectedVideoObjectUrl){
    URL.revokeObjectURL(hipSelectedVideoObjectUrl);
    hipSelectedVideoObjectUrl='';
  }

  if(!file){
    preview.innerHTML='<span>🎞️</span><b>Belum ada video dipilih</b><small>Video pendek 20–60 saat paling sesuai sebagai bukti HIP.</small>';
    return;
  }

  if(!String(file.type||'').startsWith('video/')){
    input.value='';
    status.textContent='Pilih fail video.';
    return;
  }

  if(file.size>15*1024*1024){
    input.value='';
    status.innerHTML=`⚠️ Video <b>${esc(file.name)}</b> bersaiz ${formatBytes(file.size)}. Had upload terus ialah 15 MB. Upload ke Google Drive atau YouTube dan tampal pautannya.`;
    preview.innerHTML='<span>🔗</span><b>Gunakan ruangan pautan video</b><small>Video besar lebih stabil jika disimpan terus di Google Drive.</small>';
    return;
  }

  hipSelectedVideoFile=file;
  hipSelectedVideoObjectUrl=URL.createObjectURL(file);
  preview.innerHTML=`
    <video controls playsinline preload="metadata" src="${esc(hipSelectedVideoObjectUrl)}"></video>
    <div><b>${esc(file.name)}</b><small>${formatBytes(file.size)} • ${esc(file.type||'video')}</small></div>`;
  status.innerHTML='✅ Video dipilih. Lengkapkan tajuk aktiviti dan tekan <b>Simpan Bukti HIP</b>.';
}

function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Video tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });
}

async function saveHipActivityVideo(){
  const status=document.getElementById('hipUploadStatus');
  const btn=document.getElementById('hipSaveBtn');
  const ting=document.getElementById('hipTingkatan').value;
  const kelas=document.getElementById('hipKelas').value;
  const tarikh=document.getElementById('hipTarikh').value;
  const guru=document.getElementById('hipGuru').value;
  const tajuk=document.getElementById('hipTajuk').value.trim();
  const peserta=document.getElementById('hipPeserta').value.trim();
  const catatan=document.getElementById('hipCatatan').value.trim();
  const link=document.getElementById('hipVideoLink').value.trim();

  if(!ting||!kelas||!tarikh||!guru||!tajuk){
    status.textContent='Lengkapkan Tingkatan, Kelas, Tarikh, Guru dan Tajuk Aktiviti.';
    return;
  }
  if(!hipSelectedVideoFile&&!link){
    status.textContent='Rakam/pilih video atau tampal pautan video dahulu.';
    return;
  }

  btn.disabled=true;
  btn.textContent='⏳ Menyimpan video...';
  status.innerHTML=hipSelectedVideoFile
    ? `⏳ Sedang menghantar video ${formatBytes(hipSelectedVideoFile.size)} ke Google Drive...`
    : '⏳ Sedang menyimpan pautan video...';

  try{
    const payload={
      action:'saveHipActivityVideo',
      tingkatan:ting,
      kelas:kelas,
      tarikhAktiviti:tarikh,
      guru:guru,
      tajuk:tajuk,
      peserta:peserta||'Seluruh kelas',
      catatan:catatan,
      videoLink:link
    };

    if(hipSelectedVideoFile){
      const dataUrl=await fileToDataUrl(hipSelectedVideoFile);
      payload.base64=dataUrl.split(',')[1]||'';
      payload.mimeType=hipSelectedVideoFile.type||'video/mp4';
      payload.fileName=hipSelectedVideoFile.name||`HIP_${Date.now()}.mp4`;
      payload.sizeBytes=hipSelectedVideoFile.size||0;
    }

    const res=await fetch(CONFIG.SHEET_API_URL,{
      method:'POST',
      body:JSON.stringify(payload)
    });
    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Video gagal disimpan');

    status.innerHTML=out.sharingOk===false
      ? '⚠️ Video disimpan tetapi perkongsian umum disekat. Pengguna mungkin perlu login akaun sekolah untuk menonton.'
      : '✅ Bukti video HIP berjaya disimpan dan dimasukkan ke galeri.';

    const keepTing=ting, keepClass=kelas, keepGuru=guru;
    resetHipForm(true);
    document.getElementById('hipTingkatan').value=keepTing;
    syncHipClasses();
    document.getElementById('hipKelas').value=keepClass;
    document.getElementById('hipGuru').value=keepGuru;
    await loadHipActivityGallery();
  }catch(e){
    status.textContent='❌ '+e.message;
  }finally{
    btn.disabled=false;
    btn.textContent='💾 Simpan Bukti HIP';
  }
}

function resetHipForm(keepStatus=false){
  document.getElementById('hipTajuk').value='';
  document.getElementById('hipPeserta').value='';
  document.getElementById('hipCatatan').value='';
  document.getElementById('hipVideoLink').value='';
  document.getElementById('hipVideoFile').value='';
  hipSelectedVideoFile=null;

  if(hipSelectedVideoObjectUrl){
    URL.revokeObjectURL(hipSelectedVideoObjectUrl);
    hipSelectedVideoObjectUrl='';
  }

  document.getElementById('hipVideoPreview').innerHTML=
    '<span>🎞️</span><b>Belum ada video dipilih</b><small>Video pendek 20–60 saat paling sesuai sebagai bukti HIP.</small>';
  if(!keepStatus) document.getElementById('hipUploadStatus').textContent='Borang dikosongkan.';
}

async function loadHipActivityGallery(){
  const grid=document.getElementById('hipVideoGallery');
  const status=document.getElementById('hipGalleryStatus');
  if(!grid||!status) return;

  const ting=document.getElementById('hipTingkatan')?.value||'';
  const kelas=document.getElementById('hipKelas')?.value||'';

  status.textContent='⏳ Memuatkan video aktiviti HIP...';
  grid.innerHTML=Array.from({length:4},()=>'<div class="hip-gallery-skeleton"></div>').join('');

  try{
    const res=await fetch(pbdApiUrl({
      action:'hipActivityGallery',
      tingkatan:ting,
      kelas:kelas,
      limit:40,
      v:Date.now()
    }));
    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Galeri HIP gagal dibaca');

    const rows=out.rows||[];
    status.innerHTML=`✅ <b>${rows.length}</b> video aktiviti HIP dipaparkan.`;

    if(!rows.length){
      grid.innerHTML=`<div class="gallery-empty-state">
        <span>🎬</span><b>Belum ada video</b>
        <p>Rakam video pendek atau masukkan pautan video bagi kelas ini.</p>
      </div>`;
      return;
    }

    grid.innerHTML=rows.map((item,i)=>`
      <article class="hip-video-card">
        <button type="button" class="hip-video-poster"
          onclick="openHipVideo('${encodeURIComponent(item.previewUrl||item.viewUrl||item.videoUrl||'')}','${encodeURIComponent(item.tajuk||'Aktiviti HIP')}')">
          ${item.thumbnailUrl
            ? `<img src="${esc(item.thumbnailUrl)}" alt="${esc(item.tajuk||'Video HIP')}" loading="lazy" onerror="this.style.display='none'">`
            : ''}
          <span class="hip-play-icon">▶</span>
          <span class="hip-video-number">VIDEO #${i+1}</span>
        </button>
        <div class="hip-video-info">
          <p class="eyebrow">${esc(item.tarikhAktiviti||'-')} • TINGKATAN ${esc(item.tingkatan||'')} ${esc(item.kelas||'')}</p>
          <h3>${esc(item.tajuk||'Aktiviti HIP')}</h3>
          <p><b>${esc(item.peserta||'Seluruh kelas')}</b></p>
          ${item.catatan?`<p class="hip-video-note">${esc(item.catatan)}</p>`:''}
          <small>Guru: ${esc(cleanName(item.guru||'-'))}</small>
          <div class="hip-video-card-actions">
            <button type="button" onclick="openHipVideo('${encodeURIComponent(item.previewUrl||item.viewUrl||item.videoUrl||'')}','${encodeURIComponent(item.tajuk||'Aktiviti HIP')}')">▶ Mainkan</button>
            <button type="button" onclick="openUrl('${String(item.viewUrl||item.videoUrl||'').replace(/'/g,"\\'")}')">↗ Buka</button>
          </div>
        </div>
      </article>`).join('');
  }catch(e){
    status.textContent='❌ '+e.message;
    grid.innerHTML=`<div class="gallery-empty-state"><span>⚠️</span><b>Galeri gagal dimuatkan</b><p>${esc(e.message)}</p></div>`;
  }
}

function openHipVideo(encodedUrl,encodedTitle){
  const url=decodeURIComponent(String(encodedUrl||''));
  const title=decodeURIComponent(String(encodedTitle||'Aktiviti HIP'));
  const dialog=document.getElementById('hipVideoDialog');
  const body=document.getElementById('hipVideoDialogBody');
  if(!dialog||!body||!url) return;

  const canEmbed=/drive\.google\.com\/file\/d\/[^/]+\/preview|youtube\.com\/embed\//i.test(url);
  body.innerHTML=`
    <p class="eyebrow">BUKTI VIDEO HIP</p>
    <h2>${esc(title)}</h2>
    <div class="hip-player-wrap">
      ${canEmbed
        ? `<iframe src="${esc(url)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
        : `<video controls playsinline src="${esc(url)}"></video>`}
    </div>
    <button type="button" class="pill" onclick="openUrl('${String(url).replace(/'/g,"\\'")}')">↗ Buka video dalam tab baharu</button>`;

  if(!dialog.open) dialog.showModal();
}

function closeHipVideo(){
  const dialog=document.getElementById('hipVideoDialog');
  const body=document.getElementById('hipVideoDialogBody');
  if(body) body.innerHTML='';
  if(dialog?.open) dialog.close();
}


// ================= ANALISIS PEPERIKSAAN + PBD v6.4 =================
let examData={ ujian:['UPSA'], items:[], itemMap:[] };

function examApiUrl(params){
  return pbdApiUrl(params);
}

function examNorm(v){
  return String(v||'').toUpperCase().replace(/\s+/g,' ').trim();
}

function examClassNorm(v){
  return examNorm(v).replace(/\s+/g,'').replace('PROGESIF','PROGRESIF');
}

function examGrade(percent){
  const p=Number(percent||0);
  if(p>=82) return 'A';
  if(p>=66) return 'B';
  if(p>=50) return 'C';
  if(p>=35) return 'D';
  if(p>=20) return 'E';
  return 'F';
}

function examItemsFallback(tingkatan){
  const out=[];
  for(let i=1;i<=20;i++) out.push({key:`O${i}`,section:'Objektif',max:1});
  for(let i=1;i<=4;i++){
    out.push({key:`S${i}a`,section:'Struktur',max:3});
    out.push({key:`S${i}b`,section:'Struktur',max:3});
    out.push({key:`S${i}c`,section:'Struktur',max:4});
  }

  // Pecahan esei berbeza mengikut tingkatan.
  // T1: E1 = 6/6/8, E2 = 4/8/8
  // T2: E1 = 4/8/8, E2 = 6/6/8
  const t=String(tingkatan||'1');
  const scheme=t==='2'
    ? {E1:[4,8,8],E2:[6,6,8]}
    : {E1:[6,6,8],E2:[4,8,8]};

  ['E1','E2'].forEach(key=>{
    const marks=scheme[key];
    out.push({key:`${key}a`,section:'Esei',max:marks[0]});
    out.push({key:`${key}b`,section:'Esei',max:marks[1]});
    out.push({key:`${key}c`,section:'Esei',max:marks[2]});
  });
  return out;
}

async function initExam(){
  const status=document.getElementById('examStatus');
  if(!status) return;

  try{
    status.textContent='Menghubungkan Analisis Item Sejarah 2026...';
    const res=await fetch(examApiUrl({action:'examInit'}));
    const data=await res.json();
    if(!data.success) throw new Error(data.message||'Gagal baca fail markah');

    examData={
      ujian:(data.ujian||['UPSA']).map(examNorm).filter(Boolean),
      items:(data.items||examItemsFallback()),
      itemMap:data.itemMap||[]
    };

    const allExamNames=[...new Set([...examData.ujian,'UPSA','UASA','PPT'])];
    const list=document.getElementById('examUjianList');
    list.innerHTML=allExamNames.map(x=>`<option value="${esc(x)}"></option>`).join('');

    const fameExam=document.getElementById('rumusUjian');
    if(fameExam){
      const previous=fameExam.value||'UPSA';
      fameExam.innerHTML=allExamNames.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
      fameExam.value=allExamNames.includes(previous)?previous:(allExamNames[0]||'UPSA');
    }

    initExamControls();
    renderPbdSummary();
    renderExamMarksGrid({});
    renderExamMapGrid();

    status.textContent='Sedia. Pilih tingkatan, kelas dan ujian untuk membandingkan markah peperiksaan dengan TP.';
  }catch(e){
    status.textContent='Gagal sambung data markah: '+e.message;
  }
}

function initExamControls(){
  ensureExamPrintButtons();
  const tingSel=document.getElementById('examTingkatan');
  if(!tingSel) return;

  const tings=fallbackTingkatanList();

  tingSel.innerHTML='<option value="">Pilih Tingkatan</option>'+tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');

  if(tings.length){
    tingSel.value=tings[0];
    onExamTingkatan();
  }
}

function onExamTingkatan(){
  const ting=document.getElementById('examTingkatan').value;
  const kelas=fallbackClassList(ting);

  const kelasSel=document.getElementById('examKelas');
  kelasSel.innerHTML='<option value="">Pilih Kelas</option>'+kelas.map(k=>`<option value="${esc(k)}">${esc(ting+' '+k)}</option>`).join('');

  if(kelas.length) kelasSel.value=kelas[0];
  onExamContextChanged();
}

function onExamContextChanged(){
  populateExamStudents();
  renderExamMarksGrid({});
  renderExamMapGrid();
  loadQuestionPaperInfo();
  clearExamAnalysis();
}

function currentExamContext(){
  return {
    tingkatan:document.getElementById('examTingkatan')?.value||'',
    kelas:document.getElementById('examKelas')?.value||'',
    ujian:examNorm(document.getElementById('examUjian')?.value||'UPSA')
  };
}

let currentQuestionPaper={url:'',name:'',id:''};

function setupQuestionPaperUpload(){
  const zone=document.getElementById('questionDropZone');
  const input=document.getElementById('questionFileInput');
  const choose=document.getElementById('questionChooseBtn');
  const open=document.getElementById('questionOpenBtn');
  const copy=document.getElementById('questionCopyBtn');
  const importBtn=document.getElementById('mappingImportBtn');
  const importInput=document.getElementById('mappingImportInput');
  const templateBtn=document.getElementById('mappingTemplateBtn');
  if(!zone||!input) return;

  const browse=()=>input.click();
  zone.addEventListener('click',browse);
  zone.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){ e.preventDefault(); browse(); }
  });
  choose?.addEventListener('click',browse);
  input.addEventListener('change',()=>{
    const file=input.files?.[0];
    if(file) uploadQuestionPaper(file);
    input.value='';
  });

  ['dragenter','dragover'].forEach(type=>zone.addEventListener(type,e=>{
    e.preventDefault();
    zone.classList.add('dragging');
  }));
  ['dragleave','drop'].forEach(type=>zone.addEventListener(type,e=>{
    e.preventDefault();
    zone.classList.remove('dragging');
  }));
  zone.addEventListener('drop',e=>{
    const file=e.dataTransfer?.files?.[0];
    if(file) uploadQuestionPaper(file);
  });

  open?.addEventListener('click',()=>{
    if(currentQuestionPaper.url) window.open(currentQuestionPaper.url,'_blank');
  });
  copy?.addEventListener('click',copyQuestionPaperLink);
  importBtn?.addEventListener('click',()=>importInput?.click());
  importInput?.addEventListener('change',async()=>{
    const file=importInput.files?.[0];
    if(file) await importExamMappingFile(file);
    importInput.value='';
  });
  templateBtn?.addEventListener('click',downloadExamMappingTemplate);
}

function allowedQuestionFile(file){
  const name=String(file?.name||'').toLowerCase();
  const type=String(file?.type||'').toLowerCase();
  return /\.(pdf|doc|docx|jpg|jpeg|png|webp)$/.test(name) ||
    /pdf|msword|officedocument|image\//.test(type);
}

function readFileAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(new Error('Fail tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });
}

async function uploadQuestionPaper(file){
  const ctx=currentExamContext();
  const status=document.getElementById('questionUploadStatus');
  const zone=document.getElementById('questionDropZone');

  if(!ctx.tingkatan||!ctx.ujian){
    status.textContent='Pilih tingkatan dan ujian dahulu sebelum memuat naik.';
    return;
  }
  if(!allowedQuestionFile(file)){
    status.textContent='Format tidak disokong. Gunakan PDF, Word, JPG, PNG atau WEBP.';
    return;
  }
  if(file.size>8*1024*1024){
    status.textContent='Fail melebihi 8 MB. Kecilkan atau mampatkan fail dahulu.';
    return;
  }

  status.textContent=`Memuat naik ${file.name}...`;
  zone?.classList.add('uploading');

  try{
    const dataUrl=await readFileAsDataUrl(file);
    const base64=String(dataUrl).split(',')[1]||'';
    const res=await fetch(CONFIG.SHEET_API_URL,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        action:'uploadQuestionPaper',
        tingkatan:ctx.tingkatan,
        ujian:ctx.ujian,
        fileName:file.name,
        mimeType:file.type||'application/octet-stream',
        base64:base64
      })
    });
    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Muat naik gagal');

    currentQuestionPaper={url:out.url||'',name:out.name||file.name,id:out.id||''};
    renderQuestionPaperInfo();
    status.innerHTML=`✅ <b>${esc(currentQuestionPaper.name)}</b> sudah dimuat naik untuk Tingkatan ${esc(ctx.tingkatan)} • ${esc(ctx.ujian)}. Tekan <b>Salin Pautan untuk Abah</b>. Selepas dapat fail pemetaan, tekan <b>Import Pemetaan Abah</b>.`;
  }catch(e){
    status.textContent='Gagal muat naik: '+e.message;
  }finally{
    zone?.classList.remove('uploading');
  }
}

async function loadQuestionPaperInfo(){
  const ctx=currentExamContext();
  const status=document.getElementById('questionUploadStatus');
  if(!status) return;

  currentQuestionPaper={url:'',name:'',id:''};
  renderQuestionPaperInfo();

  if(!ctx.tingkatan||!ctx.ujian){
    status.textContent='Pilih tingkatan dan ujian untuk melihat kertas soalan.';
    return;
  }

  status.textContent='Menyemak kertas soalan...';
  try{
    const res=await fetch(examApiUrl({
      action:'questionPaperInfo',
      tingkatan:ctx.tingkatan,
      ujian:ctx.ujian,
      v:Date.now()
    }));
    const out=await res.json();
    if(out.success&&out.url){
      currentQuestionPaper={url:out.url,name:out.name||'Kertas soalan',id:out.id||''};
      renderQuestionPaperInfo();
      status.innerHTML=`📄 Kertas semasa: <b>${esc(currentQuestionPaper.name)}</b>. Salin pautan untuk Abah atau import fail pemetaan yang sudah siap.`;
    }else{
      status.textContent='Belum ada kertas soalan untuk tingkatan dan ujian ini.';
    }
  }catch(e){
    status.textContent='Tidak dapat menyemak kertas soalan: '+e.message;
  }
}

function renderQuestionPaperInfo(){
  const open=document.getElementById('questionOpenBtn');
  const copy=document.getElementById('questionCopyBtn');
  const has=Boolean(currentQuestionPaper.url);
  if(open) open.hidden=!has;
  if(copy) copy.hidden=!has;
}

async function copyQuestionPaperLink(){
  const ctx=currentExamContext();
  const status=document.getElementById('questionUploadStatus');
  if(!currentQuestionPaper.url){
    status.textContent='Belum ada pautan kertas soalan untuk disalin.';
    return;
  }
  const text=`Tolong petakan kertas soalan Sejarah Tingkatan ${ctx.tingkatan} (${ctx.ujian}) kepada Topik/Bab dan Aras Rendah, Sederhana atau Tinggi bagi setiap item. Sediakan fail CSV atau JSON untuk saya import ke Sejarah Hub AI. Format: Soalan,Topik,Aras. Pautan: ${currentQuestionPaper.url}`;
  try{
    await navigator.clipboard.writeText(text);
    status.innerHTML='✅ Arahan dan pautan sudah disalin. Tampal dalam chat Abah.';
  }catch(e){
    window.prompt('Salin teks ini dan tampal dalam chat Abah:',text);
  }
}


function mappingCsvEscape(value){
  const s=String(value??'');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}

function downloadExamMappingTemplate(){
  const ctx=currentExamContext();
  const status=document.getElementById('questionUploadStatus');
  if(!ctx.tingkatan||!ctx.ujian){
    status.textContent='Pilih tingkatan dan ujian dahulu.';
    return;
  }

  const items=examItemsFallback(ctx.tingkatan);
  const rows=[['Soalan','Topik','Aras'],...items.map(it=>[it.key,'',''])];
  const csvText=rows.map(row=>row.map(mappingCsvEscape).join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csvText],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`Pemetaan_Sejarah_T${ctx.tingkatan}_${ctx.ujian}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  status.innerHTML='✅ Template CSV sudah dimuat turun. Hantar bersama kertas soalan kepada Abah jika perlu.';
}

function parseMappingCsv(text){
  const rows=[];
  let row=[],cell='',quoted=false;

  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted&&text[i+1]==='"'){ cell+='"'; i++; }
      else quoted=!quoted;
    }else if(ch===','&&!quoted){
      row.push(cell); cell='';
    }else if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&text[i+1]==='\n') i++;
      row.push(cell); cell='';
      if(row.some(v=>String(v).trim()!=='')) rows.push(row);
      row=[];
    }else{
      cell+=ch;
    }
  }
  row.push(cell);
  if(row.some(v=>String(v).trim()!=='')) rows.push(row);
  if(!rows.length) return [];

  const headers=rows[0].map(h=>examNorm(String(h).replace(/^\ufeff/,'')));
  const qIndex=headers.findIndex(h=>['SOALAN','ITEM','QUESTION'].includes(h));
  const tIndex=headers.findIndex(h=>['TOPIK','TOPIK / BAB','TOPIK/BAB','BAB'].includes(h));
  const aIndex=headers.findIndex(h=>['ARAS','LEVEL'].includes(h));

  if(qIndex<0||tIndex<0||aIndex<0){
    throw new Error('Header CSV mesti mempunyai Soalan, Topik dan Aras.');
  }

  return rows.slice(1).map(r=>({
    soalan:String(r[qIndex]||'').trim(),
    topik:String(r[tIndex]||'').trim(),
    aras:String(r[aIndex]||'').trim()
  })).filter(r=>r.soalan);
}

function normalizeImportedMapping(data){
  const source=Array.isArray(data)?data:(data?.items||data?.rows||[]);
  if(!Array.isArray(source)) throw new Error('Format JSON tidak sah.');

  return source.map(r=>({
    soalan:String(r.soalan??r.Soalan??r.item??r.Item??'').trim(),
    topik:String(r.topik??r.Topik??r.bab??r.Bab??'').trim(),
    aras:String(r.aras??r.Aras??r.level??r.Level??'').trim()
  })).filter(r=>r.soalan);
}

function normalizeMappingLevel(value){
  const key=examNorm(value);
  if(key==='RENDAH') return 'Rendah';
  if(key==='SEDERHANA') return 'Sederhana';
  if(key==='TINGGI') return 'Tinggi';
  return '';
}

async function importExamMappingFile(file){
  const ctx=currentExamContext();
  const status=document.getElementById('questionUploadStatus');

  if(!ctx.tingkatan||!ctx.ujian){
    status.textContent='Pilih tingkatan dan ujian dahulu.';
    return;
  }

  if(!/\.(csv|json)$/i.test(file.name)){
    status.textContent='Gunakan fail CSV atau JSON daripada Abah.';
    return;
  }

  try{
    const text=await file.text();
    let imported;

    if(/\.json$/i.test(file.name)||/^\s*[\[{]/.test(text)){
      imported=normalizeImportedMapping(JSON.parse(text));
    }else{
      imported=parseMappingCsv(text);
    }

    if(!imported.length) throw new Error('Fail tidak mempunyai rekod pemetaan.');

    const validImported=imported
      .map(r=>({
        soalan:r.soalan,
        topik:String(r.topik||'').trim(),
        aras:normalizeMappingLevel(r.aras)
      }))
      .filter(r=>r.soalan&&r.topik&&r.aras);

    if(!validImported.length){
      throw new Error('Fail ini ialah template kosong atau tiada pemetaan lengkap. Tiada data pada skrin diubah.');
    }

    const mapRows=[...document.querySelectorAll('.map-row')];
    const byKey={};
    validImported.forEach(r=>{ byKey[examNorm(r.soalan)]=r; });

    let filled=0;
    const notFound=[];

    mapRows.forEach(row=>{
      const key=examNorm(row.dataset.question);
      const item=byKey[key];
      if(!item) return;

      const topicInput=row.querySelector('.map-topic');
      const levelInput=row.querySelector('.map-level');

      if(topicInput) topicInput.value=item.topik;
      if(levelInput) levelInput.value=item.aras;
      filled++;
    });

    validImported.forEach(item=>{
      const found=mapRows.some(row=>examNorm(row.dataset.question)===examNorm(item.soalan));
      if(!found) notFound.push(item.soalan);
    });

    status.innerHTML=`✅ Fail <b>${esc(file.name)}</b> berjaya diimport. <b>${filled}</b> item lengkap. Semak paparan di bawah, kemudian tekan <b>Simpan Pemetaan Item</b>.`;
    document.getElementById('examMapStatus').innerHTML=notFound.length
      ? `⚠️ Item ini tiada dalam borang semasa: ${esc(notFound.join(', '))}`
      : `✅ Semua item dalam fail telah dimasukkan. Tekan Simpan Pemetaan Item.`;

    document.getElementById('examMapGrid')?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    status.innerHTML=`❌ Import gagal: ${esc(e.message)}`;
  }
}


function populateExamStudents(){
  const {tingkatan,kelas}=currentExamContext();
  const students=(pbdData.murid||[])
    .filter(m=>muridStatus(m)!=='PINDAH' &&
      String(muridTing(m))===String(tingkatan) &&
      examClassNorm(muridKelas(m))===examClassNorm(kelas))
    .sort((a,b)=>muridNama(a).localeCompare(muridNama(b)));

  const sel=document.getElementById('examStudent');
  sel.innerHTML='<option value="">Pilih murid</option>'+students.map(m=>{
    const id=muridIdOf(m);
    return `<option value="${esc(id)}" data-name="${esc(muridNama(m))}">${esc(muridNama(m))}</option>`;
  }).join('');

  renderExamMarksGrid({});
  document.getElementById('examSaveStatus').textContent=students.length
    ? `${students.length} murid aktif tersedia untuk key in.`
    : 'Tiada murid aktif untuk kelas ini.';
}

function clearExamAnalysis(){
  document.getElementById('examSummaryCards').innerHTML='';
  document.getElementById('examStudentTable').innerHTML='<p class="note">Tekan Papar Analisis.</p>';
  document.getElementById('examWeakTopics').innerHTML='<p class="note">Tekan Papar Analisis.</p>';
  document.getElementById('examItemTable').innerHTML='<p class="note">Tekan Papar Analisis.</p>';
}

function summaryCard(title,value,desc,cls=''){
  return `<article class="summary-card ${cls}"><h3>${title}</h3><strong>${esc(value)}</strong><p>${esc(desc)}</p></article>`;
}


function ensureExamPrintButtons(){
  if(document.getElementById('examPrintActions')) return;

  const analyseBtn=document.getElementById('examAnalyseBtn');
  if(!analyseBtn) return;

  const wrap=document.createElement('div');
  wrap.id='examPrintActions';
  wrap.className='exam-print-actions';
  wrap.innerHTML=`
    <button type="button" class="pill exam-report-btn" id="examPrintOnlyBtn">🖨️ Cetak Analisis Peperiksaan</button>
    <button type="button" class="pill exam-report-btn pbd-compare-btn" id="examPrintPbdBtn">📊 Cetak Peperiksaan vs PBD</button>
  `;

  analyseBtn.insertAdjacentElement('afterend',wrap);
  document.getElementById('examPrintOnlyBtn')?.addEventListener('click',()=>openExamPrintReport('examOnly'));
  document.getElementById('examPrintPbdBtn')?.addEventListener('click',()=>openExamPrintReport('examPbd'));
}

async function openExamPrintReport(mode){
  const ctx=currentExamContext();
  const status=document.getElementById('examStatus');

  if(!ctx.tingkatan||!ctx.kelas||!ctx.ujian){
    if(status) status.textContent='Pilih tingkatan, kelas dan ujian dahulu sebelum mencetak laporan.';
    return;
  }

  const win=window.open('','_blank');
  if(!win){
    if(status) status.textContent='Popup disekat. Benarkan popup untuk portal ini, kemudian cuba lagi.';
    return;
  }

  win.document.open();
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Memuat laporan</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;text-align:center;color:#24314d}.icon{font-size:44px}</style></head>
    <body><div class="icon">📊</div><h2>Memuat laporan...</h2><p>Tingkatan ${esc(ctx.tingkatan)} ${esc(ctx.kelas)} • ${esc(ctx.ujian)}</p></body></html>`);
  win.document.close();

  try{
    const res=await fetch(examApiUrl({action:'examAnalysis',...ctx,v:Date.now()}));
    const data=await res.json();
    if(!data.success) throw new Error(data.message||'Gagal menjana laporan');

    const html=mode==='examPbd'
      ? buildExamPbdPrintHtml(data)
      : buildExamOnlyPrintHtml(data);

    win.document.open();
    win.document.write(html);
    win.document.close();
  }catch(e){
    win.document.open();
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Ralat Laporan</title></head>
      <body style="font-family:Arial,sans-serif;padding:40px"><h2>❌ Laporan gagal dijana</h2><p>${esc(e.message)}</p>
      <button onclick="window.close()">Tutup</button></body></html>`);
    win.document.close();
  }
}

function examPrintDate(){
  return new Date().toLocaleDateString('ms-MY',{day:'2-digit',month:'2-digit',year:'numeric'});
}

function examPrintNum(v,suffix=''){
  if(v===''||v===null||v===undefined) return '-';
  return `${v}${suffix}`;
}

function examReportBaseCss(){
  return `
    :root{--ink:#172033;--line:#253047;--soft:#eef3f8;--accent:#263b7a;--muted:#54637d}
    *{box-sizing:border-box}
    body{margin:0;background:#e9eef5;color:var(--ink);font-family:Arial,Helvetica,sans-serif}
    .toolbar{position:sticky;top:0;z-index:20;display:flex;justify-content:center;gap:10px;align-items:center;padding:12px;background:#172033;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.18)}
    .toolbar button{border:0;border-radius:999px;padding:11px 18px;font-weight:800;cursor:pointer}
    .print-btn{background:#32c5ff;color:#092033}.close-btn{background:#fff;color:#172033}
    .toolbar small{opacity:.8;margin-left:8px}
    .page{width:277mm;min-height:190mm;margin:10mm auto;padding:8mm;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.13)}
    .page.break{break-after:page;page-break-after:always}
    .header{display:flex;justify-content:center;align-items:center;gap:14px;text-align:center;margin-bottom:5mm}
    .header img{width:18mm;height:18mm;object-fit:contain}
    h1{margin:0;font-size:18pt;letter-spacing:.25px} h2{margin:2mm 0 0;font-size:13pt} h3{margin:6mm 0 2.5mm;font-size:12pt}
    .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2mm 8mm;margin:0 0 5mm;font-size:9pt}
    .kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:4mm 0 5mm}
    .kpi div{border:1.2px solid var(--line);border-radius:5px;padding:3mm;background:#f8fafc}
    .kpi span{display:block;color:var(--muted);font-size:8pt}.kpi b{display:block;font-size:17pt;margin-top:1mm}
    table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8.4pt;margin-top:2mm}
    thead{display:table-header-group} tr{break-inside:avoid}
    th,td{border:1.1px solid var(--line);padding:2mm 1.5mm;vertical-align:middle;word-wrap:break-word}
    th{background:var(--soft);text-align:center;font-weight:800}
    td.center{text-align:center}.name{font-weight:700}.small{font-size:7.5pt;color:var(--muted)}
    .status-good{color:#166534;font-weight:800}.status-warn{color:#92400e;font-weight:800}.status-danger{color:#991b1b;font-weight:800}
    .foot{display:flex;justify-content:space-between;gap:10mm;margin-top:4mm;font-size:7.5pt;color:#45556d}
    @media print{
      @page{size:A4 landscape;margin:7mm}
      body{background:#fff}.toolbar{display:none!important}
      .page{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none}
      .break{break-after:page;page-break-after:always}
    }`;
}

function statusClass(status){
  const s=examNorm(status);
  if(s.includes('INTERVENSI')||s.includes('RENDAH')||s.includes('TIADA')) return 'status-danger';
  if(s.includes('SELARAS')||s.includes('PEMANTAUAN')) return 'status-warn';
  if(s.includes('KONSISTEN')) return 'status-good';
  return '';
}

function reportToolbar(){
  return `<div class="toolbar">
    <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
    <button class="close-btn" onclick="window.close()">Tutup</button>
    <small>Pilih “Save as PDF” jika mahu simpan sebagai fail PDF.</small>
  </div>`;
}

function reportHeader(title,subtitle){
  const logoUrl=new URL('logo-smktj2.jpg',location.href).href;
  return `<header class="header">
    <img src="${logoUrl}" alt="Logo sekolah">
    <div><h1>${title}</h1><h2>${subtitle||'SMK TAMAN JASMIN 2'}</h2></div>
  </header>`;
}

function buildExamOnlyPrintHtml(data){
  const s=data.summary||{};
  const students=(data.students||[]).slice().sort((a,b)=>{
    if(a.peratus===''&&b.peratus!=='') return 1;
    if(a.peratus!==''&&b.peratus==='') return -1;
    return Number(b.peratus||0)-Number(a.peratus||0) || String(a.nama||'').localeCompare(String(b.nama||''));
  });
  const items=data.itemAnalysis||[];
  const topics=data.topicAnalysis||[];

  const studentRows=students.map((x,i)=>`<tr>
    <td class="center">${i+1}</td>
    <td class="name">${esc(x.nama)}</td>
    <td class="center">${examPrintNum(x.jumlahObj)}</td>
    <td class="center">${examPrintNum(x.jumlahStruktur)}</td>
    <td class="center">${examPrintNum(x.jumlahEsei)}</td>
    <td class="center"><b>${examPrintNum(x.peratus,'%')}</b></td>
    <td class="center"><b>${esc(x.gred||'-')}</b></td>
  </tr>`).join('');

  const itemRows=items.map((x,i)=>`<tr>
    <td class="center">${i+1}</td>
    <td class="center">${esc(x.soalan)}</td>
    <td>${esc(x.bahagian)}</td>
    <td>${esc(x.topik)}</td>
    <td class="center">${esc(x.aras||'-')}</td>
    <td class="center">${esc(x.markahPenuh)}</td>
    <td class="center">${esc(x.dijawab)}</td>
    <td class="center">${esc(x.lemah)}</td>
    <td class="center"><b>${esc(x.peratus)}%</b></td>
  </tr>`).join('');

  const topicRows=topics.slice(0,12).map((x,i)=>`<tr>
    <td class="center">${i+1}</td>
    <td>${esc(x.topik)}</td>
    <td class="center"><b>${esc(x.peratus)}%</b></td>
    <td class="center">${esc(x.murid||0)}</td>
    <td class="center">${esc(x.muridLemah||0)}</td>
  </tr>`).join('');

  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>Laporan Analisis Peperiksaan</title>
    <style>${examReportBaseCss()}</style></head><body>
    ${reportToolbar()}
    <section class="page break">
      ${reportHeader('LAPORAN ANALISIS PEPERIKSAAN SEJARAH','SMK TAMAN JASMIN 2')}
      <div class="meta">
        <div><b>Kelas:</b> Tingkatan ${esc(data.tingkatan)} ${esc(data.kelas)}</div>
        <div><b>Ujian:</b> ${esc(data.ujian)}</div>
        <div><b>Tarikh Cetakan:</b> ${examPrintDate()}</div>
      </div>
      <div class="kpi">
        <div><span>Murid Aktif</span><b>${esc(s.totalActive||0)}</b></div>
        <div><span>Ada Markah</span><b>${esc(s.adaMarkah||0)}</b></div>
        <div><span>Tiada Markah</span><b>${esc(s.tiadaMarkah||0)}</b></div>
        <div><span>Purata Peperiksaan</span><b>${esc(s.avgExam||0)}%</b></div>
      </div>
      <h3>Senarai Markah Murid</h3>
      <table>
        <colgroup><col style="width:10mm"><col><col style="width:20mm"><col style="width:23mm"><col style="width:20mm"><col style="width:21mm"><col style="width:17mm"></colgroup>
        <thead><tr><th>Bil</th><th>Nama Murid</th><th>Obj</th><th>Struktur</th><th>Esei</th><th>Peratus</th><th>Gred</th></tr></thead>
        <tbody>${studentRows||'<tr><td colspan="7" class="center">Tiada data markah.</td></tr>'}</tbody>
      </table>
      <div class="foot"><span>Analisis ini berdasarkan rekod markah terkini bagi setiap murid.</span><span>${students.length} murid dipaparkan</span></div>
    </section>

    <section class="page">
      ${reportHeader('ANALISIS ITEM DAN TOPIK PEPERIKSAAN','SMK TAMAN JASMIN 2')}
      <div class="meta">
        <div><b>Kelas:</b> Tingkatan ${esc(data.tingkatan)} ${esc(data.kelas)}</div>
        <div><b>Ujian:</b> ${esc(data.ujian)}</div>
        <div><b>Tarikh Cetakan:</b> ${examPrintDate()}</div>
      </div>
      <h3>Topik Paling Lemah</h3>
      <table>
        <colgroup><col style="width:10mm"><col><col style="width:26mm"><col style="width:26mm"><col style="width:28mm"></colgroup>
        <thead><tr><th>Bil</th><th>Topik</th><th>Peratus</th><th>Murid</th><th>Murid Lemah</th></tr></thead>
        <tbody>${topicRows||'<tr><td colspan="5" class="center">Tiada data topik.</td></tr>'}</tbody>
      </table>
      <h3>Analisis Mengikut Soalan</h3>
      <table>
        <colgroup><col style="width:8mm"><col style="width:14mm"><col style="width:22mm"><col><col style="width:22mm"><col style="width:18mm"><col style="width:18mm"><col style="width:18mm"><col style="width:18mm"></colgroup>
        <thead><tr><th>Bil</th><th>Item</th><th>Bahagian</th><th>Topik</th><th>Aras</th><th>Markah</th><th>Dijawab</th><th>Lemah</th><th>%</th></tr></thead>
        <tbody>${itemRows||'<tr><td colspan="9" class="center">Tiada analisis item.</td></tr>'}</tbody>
      </table>
      <div class="foot"><span>Peratus item dikira berbanding markah penuh item dan jumlah murid yang menjawab.</span><span>${items.length} item</span></div>
    </section>
  </body></html>`;
}

function buildExamPbdPrintHtml(data){
  const s=data.summary||{};
  const students=data.students||[];
  const intervention=students.filter(x=>examNorm(x.status).includes('INTERVENSI'));
  const mismatch=students.filter(x=>examNorm(x.status).includes('TINGGI')||examNorm(x.status).includes('RENDAH')||examNorm(x.status).includes('BERBEZA'));
  const good=students.filter(x=>examNorm(x.status).includes('KONSISTEN'));

  const rows=students.map((x,i)=>`<tr>
    <td class="center">${i+1}</td>
    <td class="name">${esc(x.nama)}</td>
    <td class="center"><b>${examPrintNum(x.peratus,'%')}</b></td>
    <td class="center">${esc(x.gred||'-')}</td>
    <td class="center"><b>${x.tp?`TP${esc(x.tp)}`:'-'}</b></td>
    <td class="${statusClass(x.status)}">${esc(x.status||'-')}</td>
    <td class="center">${esc(x.match||'-')}</td>
  </tr>`).join('');

  const focusRows=[...intervention,...mismatch].slice(0,18).map((x,i)=>`<tr>
    <td class="center">${i+1}</td>
    <td class="name">${esc(x.nama)}</td>
    <td class="center">${examPrintNum(x.peratus,'%')}</td>
    <td class="center">${x.tp?`TP${esc(x.tp)}`:'-'}</td>
    <td class="${statusClass(x.status)}">${esc(x.status)}</td>
    <td>${recommendationForExamPbd(x)}</td>
  </tr>`).join('');

  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>Laporan Peperiksaan vs PBD</title>
    <style>${examReportBaseCss()}</style></head><body>
    ${reportToolbar()}
    <section class="page break">
      ${reportHeader('LAPORAN PEPERIKSAAN VS PBD SEJARAH','SMK TAMAN JASMIN 2')}
      <div class="meta">
        <div><b>Kelas:</b> Tingkatan ${esc(data.tingkatan)} ${esc(data.kelas)}</div>
        <div><b>Ujian:</b> ${esc(data.ujian)}</div>
        <div><b>Tarikh Cetakan:</b> ${examPrintDate()}</div>
      </div>
      <div class="kpi">
        <div><span>Purata Peperiksaan</span><b>${esc(s.avgExam||0)}%</b></div>
        <div><span>Purata TP</span><b>${esc(s.avgTp||0)}</b></div>
        <div><span>Kedua-dua Lemah</span><b>${esc(s.bothLow||0)}</b></div>
        <div><span>Konsisten Baik</span><b>${esc(s.consistentGood||0)}</b></div>
      </div>
      <h3>Senarai Perbandingan Murid</h3>
      <table>
        <colgroup><col style="width:10mm"><col><col style="width:22mm"><col style="width:16mm"><col style="width:18mm"><col style="width:45mm"><col style="width:25mm"></colgroup>
        <thead><tr><th>Bil</th><th>Nama Murid</th><th>Peperiksaan</th><th>Gred</th><th>TP</th><th>Status</th><th>Padanan</th></tr></thead>
        <tbody>${rows||'<tr><td colspan="7" class="center">Tiada data perbandingan.</td></tr>'}</tbody>
      </table>
      <div class="foot"><span>TP yang digunakan ialah TP tertinggi murid; jika TP sama, rekod paling baharu digunakan.</span><span>${students.length} murid dipaparkan</span></div>
    </section>

    <section class="page">
      ${reportHeader('RUMUSAN TINDAKAN SUSULAN','SMK TAMAN JASMIN 2')}
      <div class="meta">
        <div><b>Kelas:</b> Tingkatan ${esc(data.tingkatan)} ${esc(data.kelas)}</div>
        <div><b>Ujian:</b> ${esc(data.ujian)}</div>
        <div><b>Tarikh Cetakan:</b> ${examPrintDate()}</div>
      </div>
      <div class="kpi">
        <div><span>Perlu Intervensi</span><b>${intervention.length}</b></div>
        <div><span>Tidak Selaras</span><b>${(s.highExamLowTp||0)+(s.lowExamHighTp||0)}</b></div>
        <div><span>Konsisten Baik</span><b>${good.length}</b></div>
        <div><span>Tiada Markah</span><b>${esc(s.tiadaMarkah||0)}</b></div>
      </div>
      <h3>Cadangan Tindakan Mengikut Murid</h3>
      <table>
        <colgroup><col style="width:10mm"><col><col style="width:25mm"><col style="width:20mm"><col style="width:45mm"><col style="width:70mm"></colgroup>
        <thead><tr><th>Bil</th><th>Nama Murid</th><th>Peperiksaan</th><th>TP</th><th>Status</th><th>Cadangan Tindakan</th></tr></thead>
        <tbody>${focusRows||'<tr><td colspan="6" class="center">Tiada murid dalam kategori intervensi/tidak selaras.</td></tr>'}</tbody>
      </table>
      <h3>Nota Interpretasi</h3>
      <table>
        <tbody>
          <tr><th style="width:52mm">Kedua-dua Lemah</th><td>Peperiksaan bawah 35% dan TP1–TP2. Keutamaan untuk intervensi dan bimbingan asas.</td></tr>
          <tr><th>Tidak Selaras</th><td>Markah peperiksaan dan TP menunjukkan jurang ketara. Semak bukti PBD, topik yang diuji dan bentuk pentaksiran.</td></tr>
          <tr><th>Konsisten Baik</th><td>Murid menunjukkan pencapaian peperiksaan sekurang-kurangnya 50% dan TP4–TP6.</td></tr>
        </tbody>
      </table>
      <div class="foot"><span>Laporan ini membantu guru menyasarkan intervensi, pengayaan dan semakan bukti PBD.</span><span>Sejarah Hub AI</span></div>
    </section>
  </body></html>`;
}

function recommendationForExamPbd(x){
  const s=examNorm(x.status);
  if(s.includes('INTERVENSI')) return 'Bimbingan asas, latihan berpandu dan semakan semula topik paling lemah.';
  if(s.includes('PEPERIKSAAN TINGGI')) return 'Semak bukti PBD dan beri peluang tugasan KBAT atau pembentangan untuk mengukuhkan TP.';
  if(s.includes('TP BAIK')) return 'Semak kemahiran menjawab peperiksaan dan beri latihan format soalan.';
  if(s.includes('TIADA MARKAH')) return 'Lengkapkan rekod markah peperiksaan atau semak status kehadiran.';
  if(s.includes('TIADA REKOD TP')) return 'Lengkapkan pentaksiran PBD bagi topik berkaitan.';
  return 'Teruskan pemantauan dan beri latihan pengukuhan.';
}

async function renderExamAnalysis(){
  const ctx=currentExamContext();
  const status=document.getElementById('examStatus');

  if(!ctx.tingkatan||!ctx.kelas||!ctx.ujian){
    status.textContent='Pilih tingkatan, kelas dan ujian dahulu.';
    return;
  }

  status.textContent='Mengira markah peperiksaan, TP dan kelemahan topik...';

  try{
    const res=await fetch(examApiUrl({action:'examAnalysis',...ctx}));
    const data=await res.json();
    if(!data.success) throw new Error(data.message||'Gagal analisis');

    const s=data.summary||{};

    document.getElementById('examSummaryCards').innerHTML=[
      summaryCard('👩‍🎓 Murid Aktif',s.totalActive||0,'Jumlah murid semasa'),
      summaryCard('✅ Ada Markah',s.adaMarkah||0,'Sudah key in peperiksaan'),
      summaryCard('❌ Tiada Markah',s.tiadaMarkah||0,'Belum key in'),
      summaryCard('📈 Purata Peperiksaan',`${s.avgExam||0}%`,'Purata kelas'),
      summaryCard('🏅 Purata TP',s.avgTp||0,'TP tertinggi murid'),
      summaryCard('🚨 Kedua-dua Lemah',s.bothLow||0,'Peperiksaan <35% dan TP1–TP2','danger-card'),
      summaryCard('🔄 Tidak Selaras',(s.highExamLowTp||0)+(s.lowExamHighTp||0),'Markah dan TP berbeza ketara','warn-card'),
      summaryCard('🌟 Konsisten Baik',s.consistentGood||0,'Peperiksaan ≥50% dan TP4–TP6','good-card')
    ].join('');

    renderExamStudentTable(data.students||[]);
    renderExamItemTable(data.itemAnalysis||[]);
    renderExamWeakTopics(data.topicAnalysis||[]);

    status.innerHTML=`✅ Analisis <b>Tingkatan ${esc(ctx.tingkatan)} ${esc(ctx.kelas)}</b> bagi <b>${esc(ctx.ujian)}</b> sudah siap.`;
  }catch(e){
    status.textContent='Gagal analisis: '+e.message;
  }
}

function renderExamStudentTable(rows){
  const box=document.getElementById('examStudentTable');
  if(!rows.length){
    box.innerHTML='<p class="note">Tiada data murid.</p>';
    return;
  }

  box.innerHTML=`<table class="exam-table">
    <thead><tr><th>Nama Murid</th><th>Obj</th><th>Struktur</th><th>Esei</th><th>Exam</th><th>Gred</th><th>TP</th><th>Rumusan</th></tr></thead>
    <tbody>${rows.map(r=>{
      const pc=r.peratus===''?'-':`${r.peratus}%`;
      const tp=r.tp===''?'-':`TP${r.tp}`;
      return `<tr class="${/intervensi|rendah|Tiada/i.test(r.status)?'row-alert':''}">
        <td><b>${esc(r.nama)}</b><small>${esc(r.id||'')}</small></td>
        <td>${r.jumlahObj===''?'-':esc(r.jumlahObj)}</td>
        <td>${r.jumlahStruktur===''?'-':esc(r.jumlahStruktur)}</td>
        <td>${r.jumlahEsei===''?'-':esc(r.jumlahEsei)}</td>
        <td><b>${esc(pc)}</b></td>
        <td>${esc(r.gred||'-')}</td>
        <td><b>${esc(tp)}</b></td>
        <td><span class="status-chip">${esc(r.status)}</span>${r.match==='NAMA HAMPIR'?'<small>Padanan nama hampir</small>':''}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

function renderExamItemTable(rows){
  const box=document.getElementById('examItemTable');
  if(!rows.length){
    box.innerHTML='<p class="note">Tiada markah item untuk dianalisis.</p>';
    return;
  }

  box.innerHTML=`<table class="exam-table item-table">
    <thead><tr><th>Soalan</th><th>Bahagian</th><th>Topik</th><th>Aras</th><th>Markah Penuh</th><th>Dijawab</th><th>Murid Lemah</th><th>Penguasaan</th></tr></thead>
    <tbody>${rows.map(r=>`<tr class="${Number(r.peratus)<50?'row-alert':''}">
      <td><b>${esc(r.soalan)}</b></td>
      <td>${esc(r.bahagian)}</td>
      <td>${esc(r.topik||'Belum dipetakan')}</td>
      <td><span class="level-chip level-${examNorm(r.aras||'').toLowerCase()}">${esc(r.aras||'-')}</span></td>
      <td>${esc(r.markahPenuh)}</td>
      <td>${esc(r.dijawab)}</td>
      <td>${esc(r.lemah)}</td>
      <td><div class="mini-bar"><span style="width:${Math.max(0,Math.min(100,Number(r.peratus||0)))}%"></span></div><b>${esc(r.peratus)}%</b></td>
    </tr>`).join('')}</tbody>
  </table>`;
}

function renderExamWeakTopics(rows){
  const box=document.getElementById('examWeakTopics');
  if(!rows.length){
    box.innerHTML='<p class="note">Isi pemetaan item untuk melihat kelemahan mengikut topik.</p>';
    return;
  }

  box.innerHTML=`<table class="exam-table">
    <thead><tr><th>Topik</th><th>Penguasaan</th><th>Murid Lemah</th></tr></thead>
    <tbody>${rows.map(r=>`<tr class="${Number(r.peratus)<50?'row-alert':''}">
      <td><b>${esc(r.topik)}</b></td>
      <td>${esc(r.peratus)}%</td>
      <td>${esc(r.muridLemah)} / ${esc(r.murid)}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

function itemMapForContext(){
  const ctx=currentExamContext();
  const map={};

  (examData.itemMap||[]).forEach(r=>{
    if(String(r.Tingkatan||r.tingkatan||'')===String(ctx.tingkatan) &&
      examNorm(r.Ujian||r.ujian||'')===ctx.ujian){
      const key=String(r.Soalan||r.soalan||'').trim();
      if(key) map[key]=r;
    }
  });

  return map;
}

function renderExamMapGrid(){
  const box=document.getElementById('examMapGrid');
  if(!box) return;

  const ctx=currentExamContext();
  const map=itemMapForContext();
  const items=examItemsFallback(currentExamContext().tingkatan);

  box.innerHTML=`<div class="map-header"><b>Soalan</b><b>Topik / Bab</b><b>Aras</b></div>`+
    items.map(it=>{
      const r=map[it.key]||{};
      const topic=r.Topik||r.topik||'';
      const aras=examNorm(r.Aras||r.aras||'');
      return `<div class="map-row" data-question="${esc(it.key)}">
        <b>${esc(it.key)}</b>
        <input class="map-topic" placeholder="Contoh: Bab 4 Tamadun Awal" value="${esc(topic)}" />
        <select class="map-level">
          <option value="">Pilih aras</option>
          <option value="Rendah" ${aras==='RENDAH'?'selected':''}>Rendah</option>
          <option value="Sederhana" ${aras==='SEDERHANA'?'selected':''}>Sederhana</option>
          <option value="Tinggi" ${aras==='TINGGI'?'selected':''}>Tinggi</option>
        </select>
      </div>`;
    }).join('');

  document.getElementById('examMapStatus').textContent=ctx.tingkatan&&ctx.ujian
    ? `Pemetaan untuk Tingkatan ${ctx.tingkatan} • ${ctx.ujian}`
    : 'Pilih tingkatan dan ujian.';
}

async function saveExamItemMap(){
  const ctx=currentExamContext();
  const status=document.getElementById('examMapStatus');

  if(!ctx.tingkatan||!ctx.ujian){
    status.textContent='Pilih tingkatan dan ujian dahulu.';
    return;
  }

  const items=[...document.querySelectorAll('.map-row')].map(row=>({
    soalan:row.dataset.question,
    topik:row.querySelector('.map-topic').value.trim(),
    aras:row.querySelector('.map-level').value
  }));

  status.textContent='Menyimpan pemetaan item...';

  try{
    const res=await fetch(CONFIG.SHEET_API_URL,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:'saveItemMapBatch',tingkatan:ctx.tingkatan,ujian:ctx.ujian,items})
    });
    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Gagal simpan');

    const reload=await fetch(examApiUrl({action:'itemMap',tingkatan:ctx.tingkatan,ujian:ctx.ujian}));
    const mapped=await reload.json();

    examData.itemMap=(examData.itemMap||[]).filter(r=>!(
      String(r.Tingkatan||r.tingkatan||'')===String(ctx.tingkatan) &&
      examNorm(r.Ujian||r.ujian||'')===ctx.ujian
    )).concat(mapped.rows||[]);

    status.innerHTML=`✅ ${esc(out.count||items.length)} item disimpan untuk <b>Tingkatan ${esc(ctx.tingkatan)} • ${esc(ctx.ujian)}</b>.`;
  }catch(e){
    status.textContent='Gagal simpan pemetaan: '+e.message;
  }
}

function renderExamMarksGrid(scores){
  const box=document.getElementById('examMarksGrid');
  if(!box) return;

  const items=examItemsFallback(currentExamContext().tingkatan);
  let lastSection='';

  box.innerHTML=items.map(it=>{
    const head=it.section!==lastSection?`<h4 class="marks-section-title">${esc(it.section)}</h4>`:'';
    lastSection=it.section;
    const value=scores&&scores[it.key]!==undefined&&scores[it.key]!==''?scores[it.key]:'';

    if(it.section==='Objektif'){
      const binaryValue=String(value)==='1'?'1':String(value)==='0'?'0':'';
      return `${head}<label class="mark-cell objective-cell"><span>${esc(it.key)} <small>/ 1</small></span>
        <select class="exam-mark objective-mark" data-key="${esc(it.key)}" data-max="1">
          <option value="" ${binaryValue===''?'selected':''}>—</option>
          <option value="1" ${binaryValue==='1'?'selected':''}>1 • Betul</option>
          <option value="0" ${binaryValue==='0'?'selected':''}>0 • Salah</option>
        </select>
      </label>`;
    }

    return `${head}<label class="mark-cell"><span>${esc(it.key)} <small>/ ${esc(it.max)}</small></span>
      <input class="exam-mark" data-key="${esc(it.key)}" data-max="${esc(it.max)}" type="number" min="0" max="${esc(it.max)}" step="1" value="${esc(value)}" />
    </label>`;
  }).join('');

  box.querySelectorAll('.exam-mark').forEach(input=>{
    input.addEventListener(input.tagName==='SELECT'?'change':'input',updateExamPreview);
  });
  updateExamPreview();
}

function collectExamScores(){
  const out={};
  document.querySelectorAll('.exam-mark').forEach(input=>{
    out[input.dataset.key]=input.value;
  });
  return out;
}

function calculateExamPreview(){
  const scores=collectExamScores();
  const items=examItemsFallback(currentExamContext().tingkatan);
  const maxByKey=Object.fromEntries(items.map(i=>[i.key,Number(i.max)]));

  const n=key=>{
    const raw=scores[key];
    if(raw===''||raw===undefined) return 0;
    return Math.max(0,Math.min(maxByKey[key]||999,Number(raw)||0));
  };

  let obj=0,structure=0;
  for(let i=1;i<=20;i++) obj+=n(`O${i}`);
  for(let i=1;i<=4;i++) structure+=n(`S${i}a`)+n(`S${i}b`)+n(`S${i}c`);

  const e1=n('E1a')+n('E1b')+n('E1c');
  const e2=n('E2a')+n('E2b')+n('E2c');
  const essay=Math.max(e1,e2);
  const total=obj+structure+essay;
  const percent=Math.round(total/80*100);

  return {obj,structure,essay,total,percent,grade:examGrade(percent)};
}

function updateExamPreview(){
  const th=document.getElementById('examTH')?.checked;
  document.querySelectorAll('.exam-mark').forEach(input=>input.disabled=!!th);

  const p=calculateExamPreview();
  document.getElementById('examMarkPreview').textContent=th
    ? 'Status: TIDAK HADIR (TH)'
    : `Obj ${p.obj}/20 • Struktur ${p.structure}/40 • Esei ${p.essay}/20 • Jumlah ${p.total}/80 • ${p.percent}% • Gred ${p.grade}`;
}

async function loadExamStudent(){
  const sel=document.getElementById('examStudent');
  const id=sel.value;
  const opt=sel.selectedOptions[0];
  const nama=opt?.dataset.name||opt?.textContent||'';
  const ctx=currentExamContext();
  const status=document.getElementById('examSaveStatus');

  if(!id){
    renderExamMarksGrid({});
    status.textContent='Pilih murid dahulu.';
    return;
  }

  status.textContent='Membaca markah sedia ada...';

  try{
    const res=await fetch(examApiUrl({action:'examStudent',idMurid:id,nama, ...ctx}));
    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Gagal baca');

    document.getElementById('examTH').checked=String(out.record?.gred||'').toUpperCase()==='TH';
    renderExamMarksGrid(out.record?.itemScores||{});
    status.textContent=out.found
      ? `Markah sedia ada dimuat. Simpan akan mengemas kini rekod ${ctx.ujian}.`
      : 'Belum ada markah. Isi dan simpan sebagai rekod baharu.';
  }catch(e){
    status.textContent='Gagal muat markah: '+e.message;
  }
}

async function saveExamRecord(){
  const sel=document.getElementById('examStudent');
  const id=sel.value;
  const opt=sel.selectedOptions[0];
  const nama=opt?.dataset.name||opt?.textContent||'';
  const ctx=currentExamContext();
  const status=document.getElementById('examSaveStatus');
  const btn=document.getElementById('examSaveBtn');

  if(!id||!ctx.tingkatan||!ctx.kelas||!ctx.ujian){
    status.textContent='Pilih tingkatan, kelas, ujian dan murid.';
    return;
  }

  btn.disabled=true;
  status.textContent='Menyimpan markah ke Master Markah...';

  try{
    const res=await fetch(CONFIG.SHEET_API_URL,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        action:'saveExamRecord',
        idMurid:id,
        namaMurid:nama,
        tingkatan:ctx.tingkatan,
        kelas:ctx.kelas,
        ujian:ctx.ujian,
        tidakHadir:document.getElementById('examTH').checked,
        scores:collectExamScores()
      })
    });

    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Gagal simpan');

    status.innerHTML=`✅ ${esc(out.message)} • Jumlah <b>${out.total===''?'TH':out.total+'/80'}</b> • ${out.peratus===''?'':esc(out.peratus)+'% • '}Gred <b>${esc(out.gred)}</b>.`;
    await renderExamAnalysis();
  }catch(e){
    status.textContent='Gagal simpan markah: '+e.message;
  }finally{
    btn.disabled=false;
  }
}

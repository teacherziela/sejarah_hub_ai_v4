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
  document.getElementById('rumusRefreshBtn')?.addEventListener('click', renderPbdSummary);

  document.getElementById('examTingkatan')?.addEventListener('change', onExamTingkatan);
  document.getElementById('examKelas')?.addEventListener('change', onExamContextChanged);
  document.getElementById('examUjian')?.addEventListener('change', onExamContextChanged);
  document.getElementById('examAnalyseBtn')?.addEventListener('click', renderExamAnalysis);
  document.getElementById('examStudent')?.addEventListener('change', loadExamStudent);
  document.getElementById('examLoadStudentBtn')?.addEventListener('click', loadExamStudent);
  document.getElementById('examSaveBtn')?.addEventListener('click', saveExamRecord);
  document.getElementById('examTH')?.addEventListener('change', updateExamPreview);
  document.getElementById('examMapSaveBtn')?.addEventListener('click', saveExamItemMap);
  setupQuestionPaperUpload();

  await loadYear();
  await initPbd();
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
  const fixed=[{icon:'📊',title:'PBD / Rumusan',target:'pbdPanel'},{icon:'🧩',title:'Analisis Peperiksaan',target:'examPanel'},{icon:'👥',title:'Ahli Panitia',target:'guruPanel'}];
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
    const tings = [...new Set((pbdData.murid||[]).map(m=>muridTing(m)).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
    document.getElementById('pbdTingkatan').innerHTML = '<option value="">Pilih Tingkatan</option>' + tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');
    renderPbdGuruOptions();
    initPbdSummaryControls();
    renderPbdSummary();
    document.getElementById('pbdStatus').textContent='Sedia. Pilih tingkatan dan kelas untuk rumusan, atau isi PBD seperti biasa.';
  }catch(e){
    document.getElementById('pbdStatus').textContent='Gagal muat PBD: '+e.message;
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
    const current=rekodMap[String(muridId)]||'';
    return `<article class="pbd-row" data-id="${esc(muridId)}" data-name="${esc(muridNama(m))}">
      <div class="pbd-name"><b>${i+1}. ${esc(muridNama(m))}</b><span>${esc(ting+' '+kelas)} • ID: ${esc(muridId||'-')}</span><small class="save-state"></small></div>
      <div class="tp-buttons">${[1,2,3,4,5,6].map(tp=>`<button type="button" class="tp tp${tp} ${String(current)===String(tp)?'active':''}" onclick="pickTp(this,${tp})">TP${tp}</button>`).join('')}</div>
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
  updatePbdProgress();
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
    tarikh:tarikh, tp:r.dataset.tp, catatan:r.querySelector('.catatan').value, ditafsirOleh:guru
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
      r.querySelector('.save-state').textContent='✅ Sudah disimpan';
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

  const tings = [...new Set((pbdData.murid||[]).map(m=>muridTing(m)).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  tingSel.innerHTML = '<option value="">Pilih Tingkatan</option>' + tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');
  if(tings.length) tingSel.value = tings[0];
  onRumusTingkatan();
}
function onRumusTingkatan(){
  const ting = document.getElementById('rumusTingkatan')?.value || '';
  const kelasSel = document.getElementById('rumusKelas');
  if(!kelasSel) return;

  const kelas = [...new Set(activeMuridFor(ting,'').map(m=>muridKelas(m)).filter(Boolean))].sort();
  kelasSel.innerHTML = '<option value="">Pilih Kelas</option>' + kelas.map(k=>`<option value="${esc(k)}">${esc(ting ? ting+' '+k : k)}</option>`).join('');
  if(kelas.length) kelasSel.value = kelas[0];
  renderPbdSummary();
}
async function fetchClassSummary(ting, kelas){
  const url = pbdApiUrl({action:'pbdClassSummary', tingkatan:ting, kelas:kelas});
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
  const weak = document.getElementById('pbdWeakList');
  const noRec = document.getElementById('pbdNoRecordList');
  const all = document.getElementById('pbdAllTpList');
  if(meta) meta.innerHTML = msg;
  if(cards) cards.innerHTML = '';
  if(chart) chart.innerHTML = '';
  if(teacherBox) teacherBox.innerHTML = '';
  if(weak) weak.innerHTML = '<p class="note">Belum dipaparkan.</p>';
  if(noRec) noRec.innerHTML = '<p class="note">Belum dipaparkan.</p>';
  if(all) all.innerHTML = '<p class="note">Belum dipaparkan.</p>';
}
async function renderPbdSummary(){
  const meta = document.getElementById('pbdSummaryMeta');
  const cards = document.getElementById('pbdSummaryCards');
  const chart = document.getElementById('pbdTpChart');
  const teacherBox = document.getElementById('pbdGuruSummary');
  if(!meta || !cards || !chart || !teacherBox) return;

  const ting = document.getElementById('rumusTingkatan')?.value || '';
  const kelas = document.getElementById('rumusKelas')?.value || '';
  if(!ting || !kelas){ renderEmptySummary('Pilih tingkatan dan kelas dahulu.'); return; }

  meta.innerHTML = '⏳ Memuat rumusan kelas...';
  cards.innerHTML = '';
  chart.innerHTML = '';
  teacherBox.innerHTML = '';
  try{
    const data = await fetchClassSummary(ting, kelas);
    const s = data.summary || {};
    const tp = s.tpCounts || {1:0,2:0,3:0,4:0,5:0,6:0};
    const percent = s.totalActive ? Math.round((s.adaTp/s.totalActive)*100) : 0;
    const guruText = (data.guruKelas && data.guruKelas.length) ? data.guruKelas.join(', ') : 'Belum dipadankan';

    meta.innerHTML = `📌 <b>Tingkatan ${esc(ting)} ${esc(kelas)}</b><br>👩‍🏫 Guru kelas / guru sejarah: <b>${esc(guruText)}</b><br><span class="note">Kiraan ini guna <b>TP tertinggi setiap murid</b>. Kalau seorang murid ada banyak rekod, sistem ambil TP paling tinggi. Jika TP sama, sistem ambil rekod paling baru.</span>`;

    const summary = [
      ['👨‍🎓 Murid Aktif', s.totalActive||0, 'Bilangan murid aktif dalam kelas'],
      ['✅ Ada TP', s.adaTp||0, `${percent}% murid sudah ada TP`],
      ['❌ Tiada Rekod', s.tiadaTp||0, 'Murid langsung belum ada rekod TP'],
      ['🚨 TP1–TP2', s.weakCount||0, 'Murid lemah / perlu bimbingan'],
      ['⭐ TP5', tp[5]||0, 'Murid cemerlang'],
      ['🏆 TP6', tp[6]||0, 'Murid tahap tertinggi'],
      ['📊 Purata TP', s.avgTp || '-', 'Purata TP tertinggi kelas'],
      ['🗂️ Jumlah Rekod', s.totalRecords||0, 'Semua rekod asal kelas ini']
    ];

    cards.innerHTML = summary.map(([title,num,desc])=>`
      <div class="summary-card">
        <span>${esc(title)}</span>
        <b>${esc(num)}</b>
        <small>${esc(desc)}</small>
      </div>`).join('');

    const max = Math.max(1, ...[1,2,3,4,5,6].map(n=>tp[n]||0));
    chart.innerHTML = `
      <h3>Graf Taburan TP Tertinggi Kelas</h3>
      ${[1,2,3,4,5,6].map(n=>`
        <div class="tp-bar-row">
          <span>TP${n}</span>
          <div class="tp-bar-shell"><div class="tp-bar fill-tp${n}" style="width:${Math.round(((tp[n]||0)/max)*100)}%"></div></div>
          <b>${tp[n]||0}</b>
        </div>`).join('')}`;

    teacherBox.innerHTML = `
      <h3>Nota Rumusan</h3>
      <div class="teacher-row"><span>Kaedah kiraan</span><b>1 murid = 1 TP tertinggi</b></div>
      <div class="teacher-row"><span>TP1–TP2</span><b>${s.weakCount||0} murid perlu bimbingan</b></div>
      <div class="teacher-row"><span>Belum direkod</span><b>${s.tiadaTp||0} murid</b></div>`;

    document.getElementById('pbdWeakList').innerHTML = renderStudentTable(data.weakList||[], ['Bil','Nama Murid','TP','Tarikh','Guru'], 'Tiada murid TP1–TP2. Alhamdulillah, kelas nampak steady.');
    document.getElementById('pbdNoRecordList').innerHTML = renderStudentTable(data.noRecordList||[], ['Bil','Nama Murid','Status'], 'Semua murid aktif sudah ada rekod TP.');
    document.getElementById('pbdAllTpList').innerHTML = renderStudentTable(data.allList||[], ['Bil','Nama Murid','TP Tertinggi','Tarikh','Guru'], 'Belum ada senarai murid.');
  }catch(e){
    renderEmptySummary('Gagal muat rumusan: '+esc(e.message));
  }
}
function renderStudentTable(list, headers, emptyText){
  if(!list || !list.length) return `<p class="note">${esc(emptyText)}</p>`;
  const rows = list.slice(0,80).map((x,i)=>{
    const tpText = x.tp ? `TP${x.tp}` : (x.status || 'Tiada rekod');
    return `<tr>
      <td>${i+1}</td>
      <td>${esc(x.nama||'-')}<br><small>${esc(x.id||'')}</small></td>
      <td>${esc(tpText)}</td>
      <td>${esc(x.tarikh||'-')}</td>
      <td>${esc(cleanName(x.guru||'-'))}</td>
    </tr>`;
  }).join('');
  return `<div class="table-scroll"><table class="pbd-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>${list.length>80?`<p class="note">Dipaparkan 80 daripada ${list.length} rekod.</p>`:''}</div>`;
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

function examItemsFallback(){
  const out=[];
  for(let i=1;i<=20;i++) out.push({key:`O${i}`,section:'Objektif',max:1});
  for(let i=1;i<=4;i++){
    out.push({key:`S${i}a`,section:'Struktur',max:3});
    out.push({key:`S${i}b`,section:'Struktur',max:3});
    out.push({key:`S${i}c`,section:'Struktur',max:4});
  }
  for(let i=1;i<=2;i++){
    out.push({key:`E${i}a`,section:'Esei',max:6});
    out.push({key:`E${i}b`,section:'Esei',max:6});
    out.push({key:`E${i}c`,section:'Esei',max:8});
  }
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

    const list=document.getElementById('examUjianList');
    list.innerHTML=[...new Set([...examData.ujian,'UPSA','UASA','PPT'])].map(x=>`<option value="${esc(x)}"></option>`).join('');

    initExamControls();
    renderExamMarksGrid({});
    renderExamMapGrid();

    status.textContent='Sedia. Pilih tingkatan, kelas dan ujian untuk membandingkan markah peperiksaan dengan TP.';
  }catch(e){
    status.textContent='Gagal sambung data markah: '+e.message;
  }
}

function initExamControls(){
  const tingSel=document.getElementById('examTingkatan');
  if(!tingSel) return;

  const tings=[...new Set((pbdData.murid||[])
    .filter(m=>muridStatus(m)!=='PINDAH')
    .map(m=>muridTing(m))
    .filter(Boolean))]
    .sort((a,b)=>Number(a)-Number(b));

  tingSel.innerHTML='<option value="">Pilih Tingkatan</option>'+tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');

  if(tings.length){
    tingSel.value=tings[0];
    onExamTingkatan();
  }
}

function onExamTingkatan(){
  const ting=document.getElementById('examTingkatan').value;
  const kelas=[...new Set((pbdData.murid||[])
    .filter(m=>muridStatus(m)!=='PINDAH' && String(muridTing(m))===String(ting))
    .map(m=>muridKelas(m))
    .filter(Boolean))]
    .sort();

  const kelasSel=document.getElementById('examKelas');
  kelasSel.innerHTML='<option value="">Pilih Kelas</option>'+kelas.map(k=>`<option value="${esc(k)}">${esc(ting+' '+k)}</option>`).join('');

  if(kelas.length) kelasSel.value=kelas[0];
  onExamContextChanged();
}

function onExamContextChanged(){
  populateExamStudents();
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

  const items=examData.items.length?examData.items:examItemsFallback();
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

    const mapRows=[...document.querySelectorAll('.map-row')];
    const byKey={};
    imported.forEach(r=>{ byKey[examNorm(r.soalan)]=r; });

    let filled=0;
    const missing=[];

    mapRows.forEach(row=>{
      const key=examNorm(row.dataset.question);
      const item=byKey[key];
      if(!item) return;

      const topicInput=row.querySelector('.map-topic');
      const levelInput=row.querySelector('.map-level');
      const level=normalizeMappingLevel(item.aras);

      if(topicInput) topicInput.value=item.topik;
      if(levelInput) levelInput.value=level;

      if(item.topik&&level) filled++;
      else missing.push(row.dataset.question);
    });

    status.innerHTML=`✅ Fail <b>${esc(file.name)}</b> berjaya diimport. <b>${filled}</b> item lengkap. Semak paparan di bawah, kemudian tekan <b>Simpan Pemetaan Item</b>.`;
    document.getElementById('examMapStatus').innerHTML=missing.length
      ? `⚠️ Import selesai tetapi item ini belum lengkap: ${esc(missing.join(', '))}`
      : `✅ Semua item yang ditemui dalam fail telah dimasukkan. Tekan Simpan Pemetaan Item.`;

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
  const items=examData.items.length?examData.items:examItemsFallback();

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

  const items=examData.items.length?examData.items:examItemsFallback();
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
  const items=examData.items.length?examData.items:examItemsFallback();
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

let hub = { guru:[], pengumuman:[], dskp:[], linkPantas:[], galeri:[], pbdBest:[], bbm:[] };
let guruData = [];
const fallback = { guru:[], pengumuman:[], dskp:[], linkPantas:[], galeri:[], pbdBest:[], bbm:[] };
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
  document.getElementById('pbdTingkatan').addEventListener('change', onPbdTingkatan);
  document.getElementById('pbdKelas').addEventListener('change', onPbdKelas);
  document.getElementById('pbdLoadBtn').addEventListener('click', loadPbdStudents);
  document.getElementById('pbdSaveBtn').addEventListener('click', savePbdBatch);
  document.getElementById('rumusTingkatan')?.addEventListener('change', onRumusTingkatan);
  document.getElementById('rumusKelas')?.addEventListener('change', renderPbdSummary);
  document.getElementById('rumusTopik')?.addEventListener('change', renderPbdSummary);
  document.getElementById('rumusGuru')?.addEventListener('change', renderPbdSummary);
  document.getElementById('rumusRefreshBtn')?.addEventListener('click', renderPbdSummary);
  await loadYear();
  await initPbd();
}
async function loadYear(){
  const year=getYear();
  hub = await apiHub(year);
  guruData = (hub.guru||[]).filter(isAktif);
  renderStats(year); renderMenu(year); renderPengumuman(byYear(hub.pengumuman,year)); renderLinks(byYear(hub.linkPantas,year)); renderDskp(byYear(hub.dskp,year)); renderGuru(guruData); renderPbdGuruOptions(); renderBbm(byYear(hub.bbm,year)); renderGaleri(byYear(hub.galeri,year)); renderPbdBest(byYear(hub.pbdBest,year));
}
function renderStats(year){
  const stats=[['Guru',guruData.length],['Pengumuman',byYear(hub.pengumuman,year).length],['Link',byYear(hub.linkPantas,year).length],['Galeri',byYear(hub.galeri,year).length],['PBD Terbaik',byYear(hub.pbdBest,year).length]];
  document.getElementById('statStrip').innerHTML = stats.map(([a,b])=>`<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');
}
function renderMenu(year){
  const fixed=[{icon:'📊',title:'PBD / Rumusan',target:'pbdPanel'},{icon:'👥',title:'Ahli Panitia',target:'guruPanel'}];
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
function renderPbdBest(list){
  const box=document.getElementById('pbdBestGrid');
  if(!box) return;
  box.innerHTML = list.length ? list.map(g=>`<article class="gallery-card pbd-best-card"><img src="${driveImg(g.Photo||g.Foto)||logo()}" onerror="this.onerror=null;this.src='logo-smktj2.jpg'"><h3>${esc(g.Tajuk||'⭐ Hasil Murid PBD Terbaik')}</h3><p>${esc(fmtDate(g.Tarikh))} ${esc(g.Kelas||'')}</p><p>${esc(g.Penerangan||'')}</p></article>`).join('') : '<p class="note">Belum ada gambar PBD TP5/TP6. Pastikan Apps Script sudah deploy dan folder REKOD TP_Images boleh dibaca.</p>';
}
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
    const res = await fetch(pbdApiUrl({action:'pbdInit'}));
    pbdData = await res.json();
    if(!pbdData.success) throw new Error(pbdData.message||'Gagal baca data PBD');
    const tings = [...new Set((pbdData.murid||[]).map(m=>String(m.Tingkatan||'').trim()).filter(Boolean))].sort();
    document.getElementById('pbdTingkatan').innerHTML = '<option value="">Pilih Tingkatan</option>' + tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');
    renderPbdGuruOptions();
    initPbdSummaryControls();
    renderPbdSummary();
    document.getElementById('pbdStatus').textContent='Sedia. Pilih tingkatan, kelas dan topik.';
  }catch(e){
    document.getElementById('pbdStatus').textContent='Gagal muat PBD: '+e.message;
  }
}
function onPbdTingkatan(){
  const ting=document.getElementById('pbdTingkatan').value;
  const kelas=[...new Set((pbdData.murid||[]).filter(m=>String(m.Tingkatan)==String(ting) && String(m.Status||'AKTIF').toUpperCase()!=='PINDAH').map(m=>String(m.Kelas||'').trim()).filter(Boolean))].sort();
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
function muridIdOf(m){ return m.IDMurid || m['IDMurid '] || m['ID Murid'] || m.idMurid || ''; }
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
  const students=(pbdData.murid||[]).filter(m=>String(m.Tingkatan)==String(ting)&&String(m.Kelas)==String(kelas)&&String(m.Status||'AKTIF').toUpperCase()!=='PINDAH');
  const rekodMap={};
  (pbdData.rekod||[]).filter(r=>String(r['ID Topik'])===String(topik.IDTopik)).forEach(r=>{ rekodMap[String(r.IDMurid)] = r.TP; });
  document.getElementById('pbdStatus').innerHTML=`✅ ${students.length} murid dipaparkan untuk <b>Tingkatan ${esc(ting)} ${esc(kelas)}</b>. Pilih TP murid, kemudian tekan Simpan.`;
  document.getElementById('pbdStudents').innerHTML = students.map((m,i)=>{
    const muridId = muridIdOf(m);
    const current=rekodMap[String(muridId)]||'';
    return `<article class="pbd-row" data-id="${esc(muridId)}" data-name="${esc(m['Nama Murid'])}">
      <div class="pbd-name"><b>${i+1}. ${esc(m['Nama Murid'])}</b><span>${esc(ting+' '+kelas)} • ID: ${esc(muridId||'-')}</span><small class="save-state"></small></div>
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
  const guru=cleanName(document.getElementById('pbdGuru').value || 'Guru Sejarah');
  const activeRows=[...document.querySelectorAll('.pbd-row')].filter(r=>r.dataset.tp);
  const rows=activeRows.map(r=>({
    idMurid:r.dataset.id, namaMurid:r.dataset.name, tingkatan:ting, kelas:kelas, idTopik:topik.IDTopik,
    topik:topik.Topik, sk:topik['SK (Standard Kandungan)'], sp:topik['SP (Standard Pembelajaran)'],
    tp:r.dataset.tp, catatan:r.querySelector('.catatan').value, ditafsirOleh:guru
  }));
  if(!rows.length){ document.getElementById('pbdStatus').textContent='Pilih TP sekurang-kurangnya seorang murid.'; return; }
  saveBtn.dataset.busy='1';
  saveBtn.disabled=true;
  const oldText=saveBtn.textContent;
  saveBtn.textContent='⏳ Menyimpan...';
  document.getElementById('pbdStatus').textContent=`Menyimpan ${rows.length} rekod TP...`;
  try{
    const res=await fetch(CONFIG.SHEET_API_URL,{method:'POST',body:JSON.stringify({action:'savePbdBatch',records:rows})});
    const out=await res.json();
    if(!out.success) throw new Error(out.message||'Gagal simpan');
    activeRows.forEach(r=>{
      r.classList.add('pbd-saved');
      r.querySelector('.save-state').textContent='✅ Sudah disimpan';
      delete r.dataset.tp;
    });
    document.getElementById('pbdStatus').innerHTML=`✅ Berjaya simpan <b>${out.count||rows.length}</b> rekod TP. Data sudah masuk ke Google Sheet.`;
    updatePbdProgress();
  }catch(e){
    document.getElementById('pbdStatus').textContent='Gagal simpan: '+e.message;
  }finally{
    saveBtn.dataset.busy='0';
    saveBtn.disabled=false;
    saveBtn.textContent=oldText;
  }
}


// ================= RUMUSAN PBD DALAM HUB v5.8 =================
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
function muridNama(m){ return String(val(m,['Nama Murid','Nama'])).trim(); }
function rekodTing(r){
  const kb=String(val(r,['KELAS BETUL','Kelas Betul','Kelas_Betul'])).trim();
  if(kb && /^\d+/.test(kb)) return kb.split(/\s+/)[0];
  return String(val(r,['Tingkatan','Tingkat','Tingka'])).trim();
}
function rekodKelas(r){
  const kb=String(val(r,['KELAS BETUL','Kelas Betul','Kelas_Betul'])).trim();
  if(kb && /^\d+\s+/.test(kb)) return kb.replace(/^\d+\s+/,'').trim();
  return String(val(r,['Kelas'])).trim();
}
function rekodMuridId(r){ return String(val(r,['IDMurid','ID Murid','ID Murid '])).trim(); }
function rekodNama(r){ return String(val(r,['Nama Murid','Nama'])).trim(); }
function rekodTopikId(r){ return String(val(r,['ID Topik','IDTopik','ID Topi'])).trim(); }
function rekodTopikText(r){ return String(val(r,['Topik'])).trim(); }
function rekodTP(r){
  const raw = String(val(r,['TP'])).replace(/[^\d.]/g,'');
  return Number(raw||0);
}
function rekodGuru(r){ return cleanName(val(r,['Ditafsir_Oleh','Ditafsir Oleh','Guru','Guru Penilai'])); }
function rekodDateNum(r){
  const t = val(r,['Tarikh']);
  const d = new Date(t);
  return isNaN(d) ? 0 : d.getTime();
}
function activeMuridFor(ting, kelas){
  return (pbdData.murid||[]).filter(m=>{
    const aktif = String(val(m,['Status'])||'AKTIF').toUpperCase() !== 'PINDAH';
    return aktif && (!ting || String(muridTing(m))===String(ting)) && (!kelas || String(muridKelas(m))===String(kelas));
  });
}
function filteredRekod(ting, kelas, topikId, guru){
  return (pbdData.rekod||[]).filter(r=>{
    const okT = !ting || String(rekodTing(r))===String(ting);
    const okK = !kelas || String(rekodKelas(r))===String(kelas);
    const okTopik = !topikId || String(rekodTopikId(r))===String(topikId);
    const okGuru = !guru || rekodGuru(r).toLowerCase()===String(guru).toLowerCase();
    return okT && okK && okTopik && okGuru && rekodTP(r)>0;
  });
}
function initPbdSummaryControls(){
  const tingSel = document.getElementById('rumusTingkatan');
  const kelasSel = document.getElementById('rumusKelas');
  const topikSel = document.getElementById('rumusTopik');
  const guruSel = document.getElementById('rumusGuru');
  if(!tingSel || !kelasSel || !topikSel || !guruSel) return;

  const tings = [...new Set((pbdData.murid||[]).map(m=>muridTing(m)).filter(Boolean))].sort();
  tingSel.innerHTML = '<option value="">Semua Tingkatan</option>' + tings.map(t=>`<option value="${esc(t)}">Tingkatan ${esc(t)}</option>`).join('');
  if(tings.length) tingSel.value = tings[0];

  const gurus = [...new Set((pbdData.rekod||[]).map(r=>rekodGuru(r)).filter(Boolean))].sort();
  guruSel.innerHTML = '<option value="">Semua Guru</option>' + gurus.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');

  onRumusTingkatan();
}
function onRumusTingkatan(){
  const ting = document.getElementById('rumusTingkatan')?.value || '';
  const kelasSel = document.getElementById('rumusKelas');
  const topikSel = document.getElementById('rumusTopik');
  if(!kelasSel || !topikSel) return;

  const kelas = [...new Set(activeMuridFor(ting,'').map(m=>muridKelas(m)).filter(Boolean))].sort();
  kelasSel.innerHTML = '<option value="">Semua Kelas</option>' + kelas.map(k=>`<option value="${esc(k)}">${esc(ting ? ting+' '+k : k)}</option>`).join('');

  const topik = (pbdData.topik||[]).filter(t=>!ting || String(val(t,['Tingkatan','Tingkat','Tingka']))===String(ting));
  topikSel.innerHTML = '<option value="">Semua Topik</option>' + topik.map(t=>{
    const id = val(t,['IDTopik','ID Topik','ID']);
    const label = [val(t,['Topik','SK (Standard Kandungan)']), val(t,['SP (Standard Pembelajaran)','SP'])].filter(Boolean).join(' — ');
    return `<option value="${esc(id)}">${esc(label||id)}</option>`;
  }).join('');

  renderPbdSummary();
}
function renderPbdSummary(){
  const meta = document.getElementById('pbdSummaryMeta');
  const cards = document.getElementById('pbdSummaryCards');
  const chart = document.getElementById('pbdTpChart');
  const teacherBox = document.getElementById('pbdGuruSummary');
  if(!meta || !cards || !chart || !teacherBox) return;

  const ting = document.getElementById('rumusTingkatan')?.value || '';
  const kelas = document.getElementById('rumusKelas')?.value || '';
  const topikId = document.getElementById('rumusTopik')?.value || '';
  const guru = document.getElementById('rumusGuru')?.value || '';

  const murid = activeMuridFor(ting, kelas);
  const rekod = filteredRekod(ting, kelas, topikId, guru);
  const muridKeys = new Set(murid.map(m=>String(muridIdOf(m)||muridNama(m)).trim()).filter(Boolean));

  const latestByStudent = {};
  rekod.forEach(r=>{
    const key = String(rekodMuridId(r) || rekodNama(r)).trim();
    if(!key) return;
    if(!latestByStudent[key] || rekodDateNum(r) >= rekodDateNum(latestByStudent[key])){
      latestByStudent[key] = r;
    }
  });

  const dinilaiKeys = new Set(Object.keys(latestByStudent));
  const tiadaTp = [...muridKeys].filter(k=>!dinilaiKeys.has(k)).length;
  const adaTp = dinilaiKeys.size;

  const tpCounts = {1:0,2:0,3:0,4:0,5:0,6:0};
  Object.values(latestByStudent).forEach(r=>{
    const tp = rekodTP(r);
    if(tpCounts[tp] !== undefined) tpCounts[tp]++;
  });

  const rekodTotal = rekod.length;
  const percent = muridKeys.size ? Math.round((adaTp/muridKeys.size)*100) : 0;
  const topikText = topikId ? (document.querySelector(`#rumusTopik option[value="${CSS.escape(topikId)}"]`)?.textContent || 'Topik dipilih') : 'Semua topik';
  const labelKelas = [ting?`Tingkatan ${ting}`:'Semua tingkatan', kelas?kelas:'Semua kelas'].join(' • ');

  meta.innerHTML = `📌 <b>${esc(labelKelas)}</b> | ${esc(topikText)} ${guru?`| Guru: <b>${esc(guru)}</b>`:''}`;

  const summary = [
    ['👨‍🎓 Murid Aktif', muridKeys.size, 'Bilangan murid aktif dalam pilihan semasa'],
    ['✅ Ada TP', adaTp, `${percent}% murid ada rekod TP`],
    ['❌ Tiada TP', tiadaTp, 'Murid belum ada rekod TP untuk pilihan ini'],
    ['🏆 TP6', tpCounts[6], 'Bilangan murid tahap tertinggi'],
    ['⭐ TP5', tpCounts[5], 'Bilangan murid cemerlang'],
    ['🗂️ Jumlah Rekod', rekodTotal, 'Semua rekod penilaian yang dipadankan']
  ];

  cards.innerHTML = summary.map(([title,num,desc])=>`
    <div class="summary-card">
      <span>${esc(title)}</span>
      <b>${esc(num)}</b>
      <small>${esc(desc)}</small>
    </div>`).join('');

  const max = Math.max(1, ...Object.values(tpCounts));
  chart.innerHTML = `
    <h3>Graf Taburan TP</h3>
    ${[1,2,3,4,5,6].map(tp=>`
      <div class="tp-bar-row">
        <span>TP${tp}</span>
        <div class="tp-bar-shell"><div class="tp-bar fill-tp${tp}" style="width:${Math.round((tpCounts[tp]/max)*100)}%"></div></div>
        <b>${tpCounts[tp]}</b>
      </div>`).join('')}`;

  const byGuru = {};
  rekod.forEach(r=>{
    const g = rekodGuru(r) || 'Tidak dinyatakan';
    byGuru[g] = (byGuru[g]||0) + 1;
  });
  const topGuru = Object.entries(byGuru).sort((a,b)=>b[1]-a[1]).slice(0,8);
  teacherBox.innerHTML = `
    <h3>Rumusan Guru / Rekod</h3>
    ${topGuru.length ? topGuru.map(([g,n])=>`<div class="teacher-row"><span>${esc(g)}</span><b>${n} rekod</b></div>`).join('') : '<p class="note">Belum ada rekod guru untuk pilihan ini.</p>'}
  `;
}

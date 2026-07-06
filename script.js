let hub = { guru:[], pengumuman:[], dskp:[], linkPantas:[], galeri:[], bbm:[] };
let guruData = [];
const fallback = { guru:[], pengumuman:[], dskp:[], linkPantas:[], galeri:[], bbm:[] };
function esc(s){return String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function isAktif(x){ return String(x.Status||'Aktif').toLowerCase() !== 'tidak aktif'; }
function byYear(list, year){ return (list||[]).filter(x=>String(x.Tahun||year)===String(year) && isAktif(x)); }
function driveImg(url){ if(!url) return ''; const m=String(url).match(/\/d\/([^/]+)|id=([^&]+)/); return m?`https://drive.google.com/thumbnail?id=${m[1]||m[2]}&sz=w700`:url; }
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
async function init(){
  document.getElementById('yearSelect').value = CONFIG.DEFAULT_YEAR || '2026';
  document.getElementById('yearSelect').addEventListener('change', loadYear);
  document.getElementById('reloadBtn').addEventListener('click', loadYear);
  document.getElementById('searchGuru').addEventListener('input', e=>{ const q=e.target.value.toLowerCase(); renderGuru(guruData.filter(g=>Object.values(g).join(' ').toLowerCase().includes(q))); });
  await loadYear();
}
async function loadYear(){
  const year=getYear();
  hub = await apiHub(year);
  guruData = (hub.guru||[]).filter(isAktif);
  renderStats(year); renderMenu(year); renderPengumuman(byYear(hub.pengumuman,year)); renderLinks(byYear(hub.linkPantas,year)); renderDskp(byYear(hub.dskp,year)); renderGuru(guruData); renderBbm(byYear(hub.bbm,year)); renderGaleri(byYear(hub.galeri,year));
}
function renderStats(year){
  const stats=[['Guru',guruData.length],['Pengumuman',byYear(hub.pengumuman,year).length],['Link',byYear(hub.linkPantas,year).length],['Galeri',byYear(hub.galeri,year).length]];
  document.getElementById('statStrip').innerHTML = stats.map(([a,b])=>`<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');
}
function renderMenu(year){
  const fixed=[{icon:'👥',title:'Ahli Panitia',target:'guruPanel'}];
  const quick=byYear(hub.linkPantas,year).map(x=>({icon:x.Icon||'🔗',title:x.Nama,url:x.Link}));
  const menus=[...fixed,...quick].slice(0,12);
  document.getElementById('menuGrid').innerHTML = menus.map(m=>`<div class="hex" onclick="${m.url?`openUrl('${String(m.url).replace(/'/g,"\\'")}')`:`scrollToPanel('${m.target}')`}"><div><span class="ico">${esc(m.icon)}</span>${esc(m.title)}</div></div>`).join('');
}
function miniCard(title, text, icon, url){ return `<article class="mini-card"><div class="mini-ico">${esc(icon||'🔗')}</div><h3>${esc(title)}</h3>${text?`<p>${esc(text)}</p>`:''}${url?`<button onclick="openUrl('${String(url).replace(/'/g,"\\'")}')">Buka</button>`:''}</article>`; }
function renderPengumuman(list){
  document.getElementById('pengumumanGrid').innerHTML = list.length ? list.map(p=>miniCard(p.Tajuk, `${p.Tarikh||''} ${p.Isi||''}`, '📢', p.Link)).join('') : '<p class="note">Belum ada pengumuman aktif.</p>';
}
function renderLinks(list){ document.getElementById('linkGrid').innerHTML = list.length ? list.map(l=>miniCard(l.Nama, l.Kategori, l.Icon||'🔗', l.Link)).join('') : '<p class="note">Belum ada link pantas.</p>'; }
function renderDskp(list){ document.getElementById('dskpGrid').innerHTML = list.length ? list.map(d=>miniCard(d.Tajuk, d.Tingkatan, '📚', d.Link)).join('') : '<p class="note">Belum ada DSKP/dokumen aktif.</p>'; }
function renderBbm(list){ document.getElementById('bbmGrid').innerHTML = list.length ? list.map(b=>miniCard(b.Tajuk, [b.Tingkatan,b.Bab,b.Jenis].filter(Boolean).join(' • '), '🎮', b.Link)).join('') : '<p class="note">Belum ada BBM aktif.</p>'; }
function renderGaleri(list){
  const box=document.getElementById('galeriGrid');
  box.innerHTML = list.length ? list.map(g=>`<article class="gallery-card"><img src="${driveImg(g.Photo||g.Foto)||logo()}" onerror="this.onerror=null;this.src='assets/logo-smktj2.jpg'"><h3>${esc(g.Tajuk)}</h3><p>${esc(g.Tarikh||'')} ${esc(g.Kelas||'')}</p><p>${esc(g.Penerangan||'')}</p></article>`).join('') : '<p class="note">Belum ada galeri aktiviti.</p>';
}
function renderGuru(list){
  const grid=document.getElementById('guruGrid');
  if(!list.length){grid.innerHTML='<p class="note">Belum ada biodata guru aktif dalam Google Sheet.</p>';return;}
  grid.innerHTML=list.map(g=>`<div class="guru-card"><img class="avatar" src="${driveImg(g.Foto)||logo()}" onerror="this.onerror=null;this.src='assets/logo-smktj2.jpg'"><div><h3>${esc(g.Nama)}</h3><p>${esc(g.Jawatan)}</p><p class="note">${esc(g.Pengalaman||g.Kelas)}</p>${String(g.Opsyen||'').split(',').filter(Boolean).map(t=>`<span class="tag">${esc(t.trim())}</span>`).join('')}</div><button onclick="openProfile('${esc(g.ID)}')">Lihat Profil</button></div>`).join('');
}
function openProfile(id){
  const g=guruData.find(x=>String(x.ID)===String(id)); if(!g) return;
  document.getElementById('profileBody').innerHTML=`<img class="avatar big" src="${driveImg(g.Foto)||logo()}" onerror="this.onerror=null;this.src='assets/logo-smktj2.jpg'"><h2>${esc(g.Nama)}</h2><p><b>Kad Pengenalan:</b> ${esc(g['Kad Pengenalan'])}</p><p><b>Jawatan:</b> ${esc(g.Jawatan)}</p><p><b>Opsyen:</b> ${esc(g.Opsyen)}</p><p><b>Ijazah:</b> ${esc(g.Ijazah)}</p><p><b>Pengalaman:</b> ${esc(g.Pengalaman)}</p><p><b>Kelas:</b> ${esc(g.Kelas)}</p><p><b>Email:</b> ${esc(g.Email)}</p><p><b>Telefon:</b> ${esc(g.Telefon)}</p>`;
  document.getElementById('profileDialog').showModal();
}
function closeProfile(){document.getElementById('profileDialog').close();}
init();

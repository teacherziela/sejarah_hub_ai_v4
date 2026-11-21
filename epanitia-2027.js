/* e-Panitia Sejarah: independent annual document and application directory.
   No student data or passwords are stored in this public repository. */
(()=>{
'use strict';
const APP_LINKS=[
  {label:'HistoryVerse 360',url:'https://teacherziela.github.io/historyverse/',desc:'Portal pembelajaran dan permainan Sejarah'},
  {label:'Ahli Fikir',url:'https://teacherziela.github.io/Ahli-Fikir/murid.html',desc:'Aktiviti respons dan pemikiran murid'},
  {label:'Simulasi Peperiksaan',url:'https://teacherziela.github.io/simulasi-peperiksaan/',desc:'Latihan dan simulasi'},
  {label:'Kajian Kes Sejarah',url:'https://teacherziela.github.io/Hub-Kajian-Kes-Sejarah/',desc:'Tugasan kajian kes'},
  {label:'Detektif Sumber',url:'https://teacherziela.github.io/Detektif-sumber/',desc:'Permainan sumber sejarah'},
  {label:'Melaka Maritime Quest',url:'https://teacherziela.github.io/melaka-maritime-quest/',desc:'Pengembaraan Kesultanan Melayu Melaka'}
];
const CATEGORIES=[{"id":"am","icon":"👥","name":"01 Pengurusan Am","desc":"Biodata guru, carta organisasi, agihan tugas","items":["Biodata Guru & PDF","Carta Organisasi","Agihan Tugas","Senarai Ahli Panitia"]},{"id":"surat","icon":"✉️","name":"02 Pekeliling & Surat","desc":"Surat rasmi dan arahan","items":["Pekeliling","Surat Masuk","Surat Keluar"]},{"id":"mesyuarat","icon":"🤝","name":"03 Mesyuarat","desc":"Agenda, minit dan tindakan","items":["Notis & Agenda","Minit Mesyuarat","Maklum Balas"]},{"id":"pentaksiran","icon":"📊","name":"04 Pentaksiran","desc":"Takwim, JSU, headcount, post-mortem","items":["Takwim Pentaksiran","Jadual Penyediaan Kertas","Jadual Penyemakan","Headcount","Post-Mortem Dalaman","Post-Mortem Awam","JSU & Analisis Item","PBD & UASA","Intervensi"]},{"id":"strategik","icon":"🎯","name":"05 Perancangan Strategik","desc":"Pelan strategik, taktikal dan operasi","items":["Pelan Strategik","Pelan Taktikal","Pelan Operasi","KPI & ETR"]},{"id":"kewangan","icon":"💼","name":"06 Kewangan","desc":"Peruntukan, anggaran dan perbelanjaan","items":["Anggaran Belanjawan","Peruntukan","Rekod Perbelanjaan"]},{"id":"kurikulum","icon":"📖","name":"07 Kurikulum & PdPc","desc":"DSKP, RPT, RPH, KBAT, PAK21","items":["DSKP","RPT","RPH","Pencerapan PdPc","PAK21 & KBAT"]},{"id":"program","icon":"🗓️","name":"08 Program & Aktiviti","desc":"Kertas kerja, OPR, laporan bergambar","items":["Takwim","Kertas Kerja","OPR","Laporan Bergambar"]},{"id":"standard","icon":"📁","name":"09 Evidens Standard 1–5","desc":"Senarai semak dan bukti pelaksanaan","items":["Standard 1 – Kepimpinan","Standard 2 – Organisasi","Standard 3 – Pengurusan","Standard 4 – PdPc","Standard 5 – Kemenjadian"]},{"id":"inovasi","icon":"🎮","name":"10 Inovasi Digital","desc":"HistoryVerse, permainan dan BBM","items":["HistoryVerse 360","BBM Digital","Impak & Suara Murid","Kajian Tindakan"]},{"id":"prestasi","icon":"📈","name":"11 Analisis & Intervensi","desc":"PBD, UASA dan tindakan susulan","items":["Analisis PBD","Analisis UASA","Analisis Item","Pelan Intervensi"]},{"id":"galeri","icon":"🗃️","name":"12 Laporan & Arkib","desc":"Dokumen, galeri dan pencapaian","items":["Laporan Tahunan","Galeri Program","Pencapaian","Sijil"]}];
const STORAGE_KEY='epanitia-directory-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const validUrl=v=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
const year=()=>String(document.getElementById('yearSelect')?.value||'2027');
let links=[];
try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');links=Array.isArray(value)?value.filter(x=>x&&/^20\d\d$/.test(String(x.year))&&validUrl(x.url)):[];}catch{}
const state={category:'all',search:''};
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(links));return true;}catch{return false;}}
function show(){
 const root=document.getElementById('epanitiaRoot');if(!root)return;
 const y=year(),query=state.search.toLowerCase();
 const matches=links.filter(x=>String(x.year)===y&&(state.category==='all'||x.category===state.category)&&[x.name,x.category,x.description].join(' ').toLowerCase().includes(query));
 const yearCount=links.filter(x=>String(x.year)===y).length;
 root.innerHTML=`
 <div class="ep-heading"><div><p class="ep-eyebrow">ARKIB DIGITAL TAHUN ${esc(y)}</p><h2>Dashboard e-Panitia Sejarah</h2><p>12 modul tersusun mengikut tahun. Pilih kategori untuk membuka dokumen dan evidens tahun berkenaan. Rekod tahun lama kekal berasingan.</p></div><div class="ep-count"><b>${yearCount}</b><small>Pautan peribadi tahun ${esc(y)}</small></div></div>
 <div class="ep-tools"><label>Carian dokumen<input id="epSearch" type="search" placeholder="Contoh: pelan operasi, minit, OPR..." value="${esc(state.search)}"></label><label>Kategori<select id="epCategory"><option value="all">Semua kategori</option>${CATEGORIES.map(c=>`<option value="${c.id}" ${state.category===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><button class="ep-action" id="epGuide" type="button">Cara simpan dokumen</button></div>
 <div class="ep-cards">${CATEGORIES.filter(c=>state.category==='all'||state.category===c.id).filter(c=>!query||[c.name,c.desc,...c.items].join(' ').toLowerCase().includes(query)).map(c=>`<article class="ep-card"><span class="ep-icon">${c.icon}</span><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p><ul>${c.items.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><button type="button" data-filter="${c.id}">Lihat fail ${esc(y)}</button></article>`).join('')}</div>
 <div class="ep-subhead"><h3>🔗 Pautan Dokumen Tahun ${esc(y)}</h3><span>Disusun mengikut tahun dan kategori</span></div>
 <div class="ep-links">${matches.length?matches.map(x=>`<article class="ep-link"><div><strong>${esc(x.name)}</strong><small>${esc(CATEGORIES.find(c=>c.id===x.category)?.name||x.category)} · ${esc(x.description||'')}</small></div><a href="${esc(validUrl(x.url))}" target="_blank" rel="noopener noreferrer">Buka ↗</a><button type="button" data-remove="${esc(x.id)}" title="Padam pautan tempatan">×</button></article>`).join(''):'<p class="ep-empty">Belum ada pautan dalam kategori/tahun ini. Dokumen sebenar tidak dipadam — tambah pautan Google Drive melalui borang di bawah.</p>'}</div>
 <details class="ep-editor"><summary>➕ Daftar pautan Google Drive untuk tahun ${esc(y)}</summary><form id="epForm"><label>Nama dokumen<input name="name" maxlength="120" required placeholder="Contoh: Pelan Taktikal Sejarah 2027"></label><label>Kategori<select name="category">${CATEGORIES.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label><label>Pautan fail / folder<input name="url" type="url" required placeholder="https://drive.google.com/..."></label><label>Catatan (pilihan)<input name="description" maxlength="180" placeholder="Contoh: Versi diluluskan"></label><button type="submit" class="ep-action">Simpan pautan</button><p class="ep-hint">Versi awal: pautan disimpan pada pelayar/peranti ini sahaja, bukan pangkalan data bersama. Untuk semua guru melihat rekod yang sama, sambungan Google Sheets berizin diperlukan.</p><p id="epMessage" role="status"></p></form></details>
 <p class="ep-privacy">🔒 Jangan masukkan pautan data murid sensitif atau fail sulit yang dikongsi secara awam. Kebenaran akses Google Drive kekal mengawal siapa boleh melihat dokumen.</p>`;
 root.querySelector('#epSearch').addEventListener('input',e=>{const start=e.target.selectionStart;state.search=e.target.value;show();const n=document.getElementById('epSearch');n?.focus();n?.setSelectionRange(start,start);});
 root.querySelector('#epCategory').addEventListener('change',e=>{state.category=e.target.value;show();});
 root.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.filter;state.search='';show();root.querySelector('.ep-subhead')?.scrollIntoView({behavior:'smooth',block:'start'});}));
 root.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Buang pautan daripada pelayar ini? Dokumen asal tidak dipadam.')){links=links.filter(x=>x.id!==b.dataset.remove);persist();show();}}));
 root.querySelector('#epGuide').addEventListener('click',()=>{root.querySelector('details.ep-editor').open=true;root.querySelector('.ep-editor').scrollIntoView({behavior:'smooth'});});
 root.querySelector('#epForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),url=validUrl(f.get('url'));if(!url){root.querySelector('#epMessage').textContent='Sila masukkan pautan web yang sah.';return;}links.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),year:y,name:String(f.get('name')||'').slice(0,120),category:String(f.get('category')||'standard'),url,description:String(f.get('description')||'').slice(0,180)});const ok=persist();show();document.getElementById('epMessage').textContent=ok?'Pautan disimpan pada pelayar ini.':'Pelayar tidak membenarkan simpanan; pautan hanya kekal sehingga halaman ditutup.';});
}
function setup(){
 const select=document.getElementById('yearSelect');
 if(!select||!document.getElementById('epanitiaRoot'))return;
 const active=select.value||'2027';
 for(let y=2026;y<=Math.max(2029,new Date().getFullYear()+2);y++)if(![...select.options].some(o=>o.value===String(y))){const opt=document.createElement('option');opt.value=String(y);opt.textContent=String(y);select.add(opt);}
 // Preserve existing application's year selection and API behaviour.
 select.addEventListener('change',show);
 show();
 const apps=document.getElementById('epApps');
 if(apps)apps.innerHTML=APP_LINKS.map(a=>`<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" class="ep-app"><strong>${esc(a.label)} ↗</strong><span>${esc(a.desc)}</span></a>`).join('');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
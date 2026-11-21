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
const state={category:'all',submodule:'',search:''};
function meetingDocs(){
 const records=(typeof hub!=='undefined'&&Array.isArray(hub.pengumuman))?hub.pengumuman:[];
 const found=records.filter(p=>/mesyuarat\s+panitia/i.test(String(p.Tajuk||''))&&validUrl(p.Link)&&String(p.Status||'Aktif').toLowerCase()!=='tidak aktif').map((p,i)=>({
 id:'meeting-'+i,year:String(p.Tahun||((String(p.Tajuk||'')+' '+String(p.Tarikh||'')).match(/20\d{2}/)||[])[0]||year()),
 name:String(p.Tajuk||'Minit Mesyuarat'),category:'mesyuarat',submodule:'Minit Mesyuarat',url:p.Link,description:'Dokumen sedia ada daripada Pengumuman',readonly:true
 }));
 // These two existing 2026 documents were verified from the old announcement list.
 const existing=[
 {id:'existing-minit-1',year:'2026',name:'Mesyuarat Panitia Bil 1/2026',category:'mesyuarat',submodule:'Minit Mesyuarat',url:'https://docs.google.com/document/d/1yig6PL-vNTiL6I6-fwJvjGcpm06xFr0P/edit',description:'Dokumen mesyuarat sedia ada',readonly:true},
 {id:'existing-minit-2',year:'2026',name:'Mesyuarat Panitia Sejarah ke 2',category:'mesyuarat',submodule:'Minit Mesyuarat',url:'https://docs.google.com/document/d/1UJNY2-J7nHL62U2aPqlKqgd_fsKVfCu08vePGrnQuU/edit',description:'Dokumen mesyuarat sedia ada',readonly:true}
 ];
 return [...found,...existing.filter(x=>!found.some(p=>p.url.match(/\/d\/([^/]+)/)?.[1]===x.url.match(/\/d\/([^/]+)/)?.[1]))];
}
window.refreshEpanitiaDocuments=()=>show();
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(links));return true;}catch{return false;}}

const HEX_MODULES=[
 ['📊','PBD / Rumusan','panel','pbdPanel'],
 ['📸','Foto Murid','panel','studentPhotoPanel'],
 ['🖼️','Hasil Murid','panel','pbdEvidenceGalleryPanel'],
 ['🎬','Aktiviti HIP','panel','hipActivityPanel'],
 ['🧩','Analisis Peperiksaan','panel','examPanel'],
 ['👥','Ahli Panitia','panel','guruPanel'],
 ['📚','Dashboard & Cetak PBD','quick','dashboard cetak pbd'],
 ['📝','Isi PBD','quick','isi pbd'],
 ['📈','Analisis Item','quick','analisis item'],
 ['📘','DSKP Tingkatan 1','quick','dskp tingkatan 1'],
 ['📗','DSKP Tingkatan 2','quick','dskp tingkatan 2'],
 ['📖','Buku Teks Tingkatan 2','quick','buku teks tingkatan 2'],
 ['🕌','Seni Bina Islam','quick','seni bina islam'],
 ['🤝','Minit Mesyuarat','meeting','']
];

const SECTIONS=[
 {icon:'📁',name:'Standard 1–5 & Evidens',desc:'Dokumen pengurusan, pelaksanaan dan bukti kerja panitia',items:['Standard 1 – Kepimpinan','Standard 2 – Pengurusan Organisasi','Standard 3 – Pengurusan Kurikulum','Standard 4 – PdPc','Standard 5 – Kemenjadian Murid']},
 {icon:'🗂️',name:'Pelan & Perancangan',desc:'Pelan strategik, taktikal, operasi dan hala tuju',items:['Pelan Strategik','Pelan Taktikal','Pelan Operasi','Sasaran & KPI']},
 {icon:'📝',name:'Mesyuarat Panitia',desc:'Notis, agenda, minit dan maklum balas',items:['Minit Mesyuarat','Maklum Balas & Tindakan','Bahan Pembentangan']},
 {icon:'🗓️',name:'Takwim & Program',desc:'Jadual program, pelaksanaan dan laporan',items:['Takwim Tahunan','Kertas Kerja','Laporan OPR','Laporan Bergambar']},
 {icon:'📊',name:'PBD, UASA & Intervensi',desc:'Rekod, analisis dan tindakan susulan',items:['PBD / Rumusan','Dashboard & Cetak PBD','Isi PBD','Analisis Peperiksaan','Analisis Item','Hasil Murid','Foto Murid','Intervensi & Tindakan Susulan']},
 {icon:'🎮',name:'Inovasi PdP Digital',desc:'Amalan terbaik, BBM, permainan dan impak',items:['HistoryVerse 360','BBM Digital','Aktiviti HIP','Seni Bina Islam','Impak & Suara Murid','Laporan Inovasi']},
 {icon:'👩‍🏫',name:'Organisasi & Guru',desc:'Ahli panitia, agihan tugas dan pembangunan profesional',items:['Ahli Panitia','Carta Organisasi','Agihan Tugas','PLC & LDP','Biodata Guru','DSKP Tingkatan 1','DSKP Tingkatan 2','Buku Teks Tingkatan 2']},
 {icon:'🖼️',name:'Galeri & Pencapaian',desc:'Gambar aktiviti, sijil dan dokumentasi',items:['Galeri Program','Pencapaian Murid','Pencapaian Panitia','Anugerah & Sijil']}
];
const MODULE_MAP={
 'PBD / Rumusan':['panel','pbdPanel'],'Foto Murid':['panel','studentPhotoPanel'],'Hasil Murid':['panel','pbdEvidenceGalleryPanel'],
 'Aktiviti HIP':['panel','hipActivityPanel'],'Analisis Peperiksaan':['panel','examPanel'],'Ahli Panitia':['panel','guruPanel'],
 'Dashboard & Cetak PBD':['quick','dashboard cetak pbd'],'Isi PBD':['quick','isi pbd'],'Analisis Item':['quick','analisis item'],
 'DSKP Tingkatan 1':['quick','dskp tingkatan 1'],'DSKP Tingkatan 2':['quick','dskp tingkatan 2'],
 'Buku Teks Tingkatan 2':['quick','buku teks tingkatan 2'],'Seni Bina Islam':['quick','seni bina islam'],
 'HistoryVerse 360':['app','HistoryVerse 360']
};
let selectedSection=-1,selectedItem='';
function hideOldPanels(){
 const main=document.querySelector('main.wrap');if(!main)return;
 [...main.children].forEach(el=>{if(el.id==='epanitiaRoot'||el.classList.contains('ep-welcome'))return;el.hidden=true;el.style.setProperty('display','none','important');});
}
function revealPanel(id){
 hideOldPanels();const target=document.getElementById(id);if(!target)return false;
 const main=document.querySelector('main.wrap');let container=target;
 while(container.parentElement&&container.parentElement!==main)container=container.parentElement;
 if(container.parentElement===main){container.hidden=false;container.style.setProperty('display','block','important');}
 target.scrollIntoView({behavior:'smooth',block:'start'});return true;
}
function quickTarget(key){
 const list=(typeof hub!=='undefined'&&Array.isArray(hub.linkPantas))?hub.linkPantas:[];
 const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const item=list.find(x=>norm(x.Nama)===norm(key)&&validUrl(x.Link)&&String(x.Status||'Aktif').toLowerCase()!=='tidak aktif'&&(!x.Tahun||String(x.Tahun)===year()));
 return item?validUrl(item.Link):'';
}
function show(){
 const root=document.getElementById('epanitiaRoot');if(!root)return;
 const y=year(),heading='<div class="ep-simple-heading"><span>ARKIB DIGITAL TAHUN '+esc(y)+'</span><h2>📚 Pengurusan & Evidens Panitia</h2></div>';
 const nav='<div class="ep-navigation"><button type="button" id="epBack">← Kembali</button><button type="button" id="epHome">⌂ Home</button></div>';
 if(selectedSection<0){
  root.innerHTML=heading+'<p class="ep-simple-note">Pilih kategori untuk melihat fungsi dan dokumen tahun '+esc(y)+'.</p><div class="ep-section-grid">'+SECTIONS.map((c,i)=>'<button type="button" class="ep-section-card" data-section="'+i+'"><span class="ep-section-icon">'+c.icon+'</span><strong>'+esc(c.name)+'</strong><span>'+esc(c.desc)+'</span><ul>'+c.items.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul><em>Lihat fail '+esc(y)+'</em></button>').join('')+'</div>';
  root.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>{selectedSection=Number(b.dataset.section);selectedItem='';hideOldPanels();show();root.scrollIntoView({behavior:'smooth',block:'start'});}));
  return;
 }
 const c=SECTIONS[selectedSection];if(!c){selectedSection=-1;show();return;}
 if(!selectedItem){
  root.innerHTML=nav+heading+'<h3 class="ep-module-title">'+c.icon+' '+esc(c.name)+' — '+esc(y)+'</h3><div class="ep-submodule-grid">'+c.items.map((name,i)=>'<button type="button" data-item="'+i+'">'+esc(name)+' →</button>').join('')+'</div>';
 }else{
  let body='<p class="ep-not-updated">Belum dikemas kini untuk tahun '+esc(y)+'.</p>';
  const def=MODULE_MAP[selectedItem];
  if(selectedItem==='Minit Mesyuarat'){
   const docs=meetingDocs().filter(x=>String(x.year)===y);
   if(docs.length)body='<div class="ep-document-list">'+docs.map(x=>'<article><strong>'+esc(x.name)+'</strong><a href="'+esc(validUrl(x.url))+'" target="_blank" rel="noopener noreferrer">Buka dokumen ↗</a></article>').join('')+'</div>';
  }else if(def?.[0]==='panel'){
   body='<button type="button" class="ep-open-module" id="epOpenPanel">Buka '+esc(selectedItem)+'</button>';
  }else if(def?.[0]==='quick'){
   const url=quickTarget(def[1]);if(url)body='<a class="ep-open-module" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Buka '+esc(selectedItem)+' ↗</a>';
  }else if(def?.[0]==='app'){
   const app=APP_LINKS.find(x=>x.label===def[1]);if(app)body='<a class="ep-open-module" href="'+esc(app.url)+'" target="_blank" rel="noopener noreferrer">Buka '+esc(selectedItem)+' ↗</a>';
  }
  root.innerHTML=nav+heading+'<h3 class="ep-module-title">'+c.icon+' '+esc(c.name)+' / '+esc(selectedItem)+'</h3>'+body;
  root.querySelector('#epOpenPanel')?.addEventListener('click',()=>{if(!revealPanel(def[1]))root.querySelector('#epOpenPanel').replaceWith(Object.assign(document.createElement('p'),{textContent:'Belum dikemas kini.'}));});
 }
 root.querySelector('#epBack').addEventListener('click',()=>{hideOldPanels();if(selectedItem)selectedItem='';else selectedSection=-1;show();root.scrollIntoView({behavior:'smooth',block:'start'});});
 root.querySelector('#epHome').addEventListener('click',()=>{hideOldPanels();selectedItem='';selectedSection=-1;show();root.scrollIntoView({behavior:'smooth',block:'start'});});
 root.querySelectorAll('[data-item]').forEach(b=>b.addEventListener('click',()=>{selectedItem=c.items[Number(b.dataset.item)];show();root.scrollIntoView({behavior:'smooth',block:'start'});}));
}
function setup(){
 const select=document.getElementById('yearSelect');
 if(!select||!document.getElementById('epanitiaRoot'))return;
 const active=select.value||'2027';
 for(let y=2026;y<=Math.max(2029,new Date().getFullYear()+2);y++)if(![...select.options].some(o=>o.value===String(y))){const opt=document.createElement('option');opt.value=String(y);opt.textContent=String(y);select.add(opt);}
 hideOldPanels();
 // Preserve existing application's year selection and API behaviour.
 select.addEventListener('change',()=>{hideOldPanels();selectedSection=-1;selectedItem='';show();});
 show();
 const apps=document.getElementById('epApps');
 if(apps)apps.innerHTML=APP_LINKS.map(a=>`<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" class="ep-app"><strong>${esc(a.label)} ↗</strong><span>${esc(a.desc)}</span></a>`).join('');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
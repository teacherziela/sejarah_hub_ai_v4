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
let activeModule=null;
function quickTarget(key){
 const list=(typeof hub!=='undefined'&&Array.isArray(hub.linkPantas))?hub.linkPantas:[];
 const normalize=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const wanted=normalize(key);
 const item=list.find(x=>normalize(x.Nama)===wanted&&validUrl(x.Link)&&String(x.Status||'Aktif').toLowerCase()!=='tidak aktif'&&(!x.Tahun||String(x.Tahun)===year()));
 return item?validUrl(item.Link):'';
}
function show(){
 const root=document.getElementById('epanitiaRoot');if(!root)return;
 const y=year();
 const home=()=>{document.querySelectorAll('.ep-reveal').forEach(el=>el.classList.remove('ep-reveal'));activeModule=null;show();};
 const heading='<div class="ep-simple-heading"><span>ARKIB TAHUN '+esc(y)+'</span><h2>e-Panitia Sejarah</h2></div>';
 if(activeModule===null){
  root.innerHTML=heading+'<p class="ep-simple-note">Pilih modul untuk membuka fungsi atau dokumen tahun '+esc(y)+'.</p><div class="ep-hex-grid">'+HEX_MODULES.map((m,i)=>'<button type="button" class="ep-hex" data-module="'+i+'"><span class="ep-hex-icon">'+m[0]+'</span><strong>'+esc(m[1])+'</strong></button>').join('')+'</div>';
  root.querySelectorAll('[data-module]').forEach(b=>b.addEventListener('click',()=>{activeModule=Number(b.dataset.module);show();}));
  return;
 }
 const m=HEX_MODULES[activeModule];
 if(!m){home();return;}
 let body='';
 if(m[2]==='panel'){
  body='<p class="ep-simple-note">Buka modul '+esc(m[1])+' yang sedia ada.</p><button type="button" class="ep-open-module">Buka '+esc(m[1])+'</button>';
 }else if(m[2]==='quick'){
  const url=quickTarget(m[3]);
  body=url?'<a class="ep-open-module" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Buka '+esc(m[1])+' ↗</a>':'<p class="ep-not-updated">Belum dikemas kini untuk tahun '+esc(y)+'.</p>';
 }else{
  const docs=meetingDocs().filter(x=>x.year===y);
  body=docs.length?'<div class="ep-document-list">'+docs.map(x=>'<article><strong>'+esc(x.name)+'</strong><a href="'+esc(validUrl(x.url))+'" target="_blank" rel="noopener noreferrer">Buka dokumen ↗</a></article>').join('')+'</div>':'<p class="ep-not-updated">Belum dikemas kini untuk tahun '+esc(y)+'.</p>';
 }
 root.innerHTML='<div class="ep-navigation"><button type="button" id="epBack">← Kembali</button><button type="button" id="epHome">⌂ Home</button></div>'+heading+'<h3 class="ep-module-title">'+m[0]+' '+esc(m[1])+'</h3>'+body;
 root.querySelector('#epBack').addEventListener('click',home);
 root.querySelector('#epHome').addEventListener('click',home);
 const open=root.querySelector('.ep-open-module');
 if(m[2]==='panel'&&open)open.addEventListener('click',()=>{
  const target=document.getElementById(m[3]);
  if(target){document.querySelectorAll('.ep-reveal').forEach(el=>el.classList.remove('ep-reveal'));target.classList.add('ep-reveal');target.scrollIntoView({behavior:'smooth',block:'start'});}else{open.replaceWith(Object.assign(document.createElement('p'),{textContent:'Belum dikemas kini.'}));}
 });
}
function setup(){
 const select=document.getElementById('yearSelect');
 if(!select||!document.getElementById('epanitiaRoot'))return;
 const active=select.value||'2027';
 for(let y=2026;y<=Math.max(2029,new Date().getFullYear()+2);y++)if(![...select.options].some(o=>o.value===String(y))){const opt=document.createElement('option');opt.value=String(y);opt.textContent=String(y);select.add(opt);}
 // Preserve existing application's year selection and API behaviour.
 select.addEventListener('change',()=>{document.querySelectorAll('.ep-reveal').forEach(el=>el.classList.remove('ep-reveal'));activeModule=null;show();});
 show();
 const apps=document.getElementById('epApps');
 if(apps)apps.innerHTML=APP_LINKS.map(a=>`<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" class="ep-app"><strong>${esc(a.label)} ↗</strong><span>${esc(a.desc)}</span></a>`).join('');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
// Galeri Seni Bina Islam Tingkatan 1 — data langsung PBD REKOD TP (IDT101).
// Tiada nama murid atau pautan gambar disalin ke GitHub.
(function(){
  let records=[];
  function panel(){
    if(document.getElementById('seniBinaIslamPanel')) return;
    const anchor=document.getElementById('pbdEvidenceGalleryPanel')||document.getElementById('pbdPanel');
    if(!anchor)return;
    const sec=document.createElement('section');
    sec.id='seniBinaIslamPanel';
    sec.className='glass panel seni-bina-panel';
    sec.innerHTML=`<div class="section-head"><div><p class="eyebrow">TINGKATAN 1 · SP 4.3.5</p><h2>🕌 Seni Bina Islam — Bukti PBD</h2><p class="note">Nama murid, kelas, TP dan gambar bukti kerja. Data terus daripada PBD Sejarah.</p></div></div>
      <div class="sbi-filters"><label>Kelas<select id="sbiKelas"><option value="">Semua kelas</option>${['ADIL','BESTARI','CENDEKIA','GIGIH','TEKUN','USAHA','YAKIN'].map(k=>'<option value="'+k+'">1 '+k+'</option>').join('')}</select></label><label>Cari Murid<input id="sbiSearch" type="search" placeholder="Taip nama murid"></label><label>TP<select id="sbiTp"><option value="">Semua TP</option>${[1,2,3,4,5,6].map(n=>'<option value="'+n+'">TP'+n+'</option>').join('')}</select></label><button id="sbiReload" class="pill primary" type="button">🔄 Papar Bukti</button></div>
      <div id="sbiStatus" class="note pbd-status-box">Memuat data...</div><div id="sbiGallery" class="sbi-grid"></div>`;
    anchor.insertAdjacentElement('afterend',sec);
    ['sbiKelas','sbiSearch','sbiTp'].forEach(id=>document.getElementById(id).addEventListener(id==='sbiSearch'?'input':'change',render));
    document.getElementById('sbiReload').addEventListener('click',load);
    load();
  }
  function addMenu(){
    const menu=document.getElementById('menuGrid');
    if(!menu||menu.querySelector('[data-sbi-menu]'))return;
    const tile=document.createElement('div');tile.className='hex';tile.dataset.sbiMenu='1';tile.tabIndex=0;
    tile.innerHTML='<div><span class="ico">🕌</span>Seni Bina Islam</div>';
    const go=()=>document.getElementById('seniBinaIslamPanel')?.scrollIntoView({behavior:'smooth'});
    tile.addEventListener('click',go);tile.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
    menu.appendChild(tile);
  }
  async function load(){
    const s=document.getElementById('sbiStatus');if(!s)return;
    s.textContent='⏳ Membaca bukti kerja Seni Bina Islam...';
    try{
      const url=typeof pbdApiUrl==='function' ? pbdApiUrl({action:'pbdEvidenceGallery',tingkatan:'1',topik:'IDT101',limit:'120'}) :
        CONFIG.SHEET_API_URL+'?action=pbdEvidenceGallery&tingkatan=1&topik=IDT101&limit=120&v='+Date.now();
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok)throw Error('Sambungan PBD tidak berjaya.');
      const data=await response.json();if(!data.success)throw Error(data.message||'Rekod tidak dapat dibaca.');
      const byId=new Map();
      (data.rows||[]).forEach(r=>{
        const id=String(r.idMurid||'').trim();const tp=Number(r.tp||0);
        if(!id||tp<1||tp>6)return;
        const prev=byId.get(id);if(!prev||tp>Number(prev.tp))byId.set(id,r);
      });
      records=[...byId.values()].sort((a,b)=>String(a.kelas).localeCompare(String(b.kelas))||String(a.nama).localeCompare(String(b.nama)));
      render();
    }catch(e){s.textContent='❌ '+e.message;document.getElementById('sbiGallery').textContent='';}
  }
  function render(){
    const grid=document.getElementById('sbiGallery'),status=document.getElementById('sbiStatus');if(!grid||!status)return;
    const kelas=document.getElementById('sbiKelas').value;
    const name=document.getElementById('sbiSearch').value.toUpperCase().trim();
    const level=document.getElementById('sbiTp').value;
    const shown=records.filter(r=>(!kelas||String(r.kelas).toUpperCase()===kelas)&&(!name||String(r.nama).toUpperCase().includes(name))&&(!level||String(r.tp)===level));
    status.textContent='✅ '+shown.length+' murid · Seni Bina Islam · TP berdasarkan semakan guru';
    if(!shown.length){grid.innerHTML='<p class="note">Tiada bukti bagi pilihan ini.</p>';return;}
    grid.replaceChildren();
    shown.forEach(r=>{
      const url=String(r.viewUrl||'');if(!/^https:\/\/drive\.google\.com\//i.test(url))return;
      const card=document.createElement('article');card.className='sbi-card';
      const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';
      const img=document.createElement('img');img.alt='Gambar bukti kerja Seni Bina Islam';img.loading='lazy';img.src=r.thumbnailUrl||'';
      img.onerror=()=>{img.style.display='none';link.textContent='🕌 Buka gambar bukti';};link.appendChild(img);
      const body=document.createElement('div');body.className='sbi-body';
      const label=document.createElement('small');label.textContent='TINGKATAN 1 '+String(r.kelas||'');
      const title=document.createElement('h3');title.textContent=r.nama||'-';
      const badge=document.createElement('b');badge.className='sbi-badge';badge.textContent='TP'+r.tp;
      const open=document.createElement('a');open.href=url;open.target='_blank';open.rel='noopener noreferrer';open.textContent='🔎 Lihat bukti kerja';
      body.append(label,title,badge,document.createElement('p'));body.lastChild.append(open);card.append(link,body);grid.appendChild(card);
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    let attempts=0;const initialize=()=>{panel();addMenu();if(++attempts<15)setTimeout(initialize,500);};initialize();
  });
})();
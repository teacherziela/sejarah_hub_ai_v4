const $=id=>document.getElementById(id);
const moduleMap={
  guru:{title:'Biodata Guru', fields:[['Nama','nama','text',true],['Kad Pengenalan','kadPengenalan'],['Jawatan','jawatan'],['Opsyen','opsyen'],['Ijazah','ijazah'],['Pengalaman','pengalaman'],['Kelas','kelas'],['Email','email','email'],['Telefon','telefon'],['Foto','foto'],['Status','status','text',false,'Aktif']]},
  pengumuman:{title:'Pengumuman', fields:[['Tahun','tahun','number',true,CONFIG.DEFAULT_YEAR],['Tajuk','tajuk','text',true],['Tarikh','tarikh'],['Isi','isi','textarea'],['Link','link'],['Status','status','text',false,'Aktif']]},
  dskp:{title:'DSKP', fields:[['Tahun','tahun','number',true,CONFIG.DEFAULT_YEAR],['Tajuk','tajuk','text',true],['Tingkatan','tingkatan'],['Link','link'],['Status','status','text',false,'Aktif']]},
  linkPantas:{title:'Link Pantas', fields:[['Tahun','tahun','number',true,CONFIG.DEFAULT_YEAR],['Nama','nama','text',true],['Kategori','kategori'],['Link','link'],['Icon','icon','text',false,'🔗'],['Status','status','text',false,'Aktif']]},
  galeri:{title:'Galeri', fields:[['Tahun','tahun','number',true,CONFIG.DEFAULT_YEAR],['Tajuk','tajuk','text',true],['Tarikh','tarikh'],['Kelas','kelas'],['Penerangan','penerangan','textarea'],['Photo','photo'],['Status','status','text',false,'Aktif']]},
  bbm:{title:'BBM / AR / Game', fields:[['Tahun','tahun','number',true,CONFIG.DEFAULT_YEAR],['Tajuk','tajuk','text',true],['Tingkatan','tingkatan'],['Bab','bab'],['Jenis','jenis'],['Link','link'],['Status','status','text',false,'Aktif']]}
};
let current='guru', hub={}, editId='';
function esc(s){return String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function setStatus(t){$('statusText').textContent='Status: '+t;}
async function apiGet(){ const r=await fetch(CONFIG.SHEET_API_URL+'?action=hub&v='+Date.now()); return await r.json(); }
async function apiPost(payload){ const r=await fetch(CONFIG.SHEET_API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}); return await r.json(); }
function buildForm(){ const m=moduleMap[current]; editId=''; $('formTitle').textContent='➕ Tambah '+m.title; $('listTitle').textContent='📋 Senarai '+m.title; $('dataForm').innerHTML='<input type="hidden" id="recordId">'+m.fields.map(([label,key,type='text',req=false,def=''])=>{ const input = type==='textarea' ? `<textarea id="${key}" ${req?'required':''} placeholder="${esc(label)}">${esc(def||'')}</textarea>` : `<input id="${key}" type="${type}" ${req?'required':''} placeholder="${esc(label)}" value="${esc(def||'')}">`; return `<label>${label}${input}</label>`; }).join('')+`<div class="actions"><button type="submit" class="primary">💾 Simpan ke Sheet</button><button type="button" onclick="resetForm()">Reset</button><a class="pill" href="index.html">Lihat Portal</a></div>`; $('dataForm').onsubmit=saveRecord; renderList(); }
function resetForm(){ buildForm(); }
async function loadData(){ setStatus('sedang membaca Google Sheet...'); try{ const data=await apiGet(); hub = Array.isArray(data)?{guru:data}:data; setStatus('data berjaya dibaca.'); renderList(); }catch(e){ console.error(e); setStatus('gagal baca data. Semak Web App URL / permission Anyone.'); } }
function getList(){ return hub[current] || []; }
function idOf(r){ return r.ID || r.Id || r.id || ''; }
function displayTitle(r){ return r.Nama || r.Tajuk || r.nama || r.tajuk || 'Tanpa tajuk'; }
function displaySub(r){ return [r.Jawatan,r.Kategori,r.Tingkatan,r.Tarikh,r.Kelas,r.Status].filter(Boolean).join(' • '); }
function renderList(){ const q=($('adminSearch').value||'').toLowerCase(); const arr=getList().filter(x=>Object.values(x).join(' ').toLowerCase().includes(q)); $('adminList').innerHTML=arr.length?arr.map(r=>`<div class="admin-row"><div><h3>${esc(displayTitle(r))}</h3><p>${esc(displaySub(r))}</p><p class="note">${esc(r.Link||r.Email||'')}</p></div><div class="actions"><button class="edit" onclick="editRecord('${esc(idOf(r))}')">✏️ Edit</button><button class="danger" onclick="deleteRecord('${esc(idOf(r))}')">🗑 Padam</button></div></div>`).join(''):'<p class="note">Belum ada data.</p>'; }
function editRecord(id){ const r=getList().find(x=>String(idOf(x))===String(id)); if(!r)return; const m=moduleMap[current]; editId=id; $('formTitle').textContent='✏️ Edit '+m.title; $('recordId').value=id; m.fields.forEach(([label,key])=>{ if($(key)) $(key).value = r[label] || r[key] || ''; }); scrollTo({top:0,behavior:'smooth'}); }
async function saveRecord(e){ e.preventDefault(); const m=moduleMap[current]; const data={}; m.fields.forEach(([label,key])=>data[key]=$(key).value); if(editId) data.id=editId; setStatus('sedang simpan...'); try{ const result=await apiPost({action:editId?'update':'add', module:current, ...data}); setStatus(result.message||'selesai'); await loadData(); buildForm(); }catch(err){ console.error(err); setStatus('gagal simpan'); } }
async function deleteRecord(id){ if(!confirm('Padam rekod ini?'))return; setStatus('sedang padam...'); try{ const result=await apiPost({action:'delete',module:current,id}); setStatus(result.message||'dipadam'); await loadData(); }catch(e){ console.error(e); setStatus('gagal padam'); } }
document.querySelectorAll('.sidebar button[data-module]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.sidebar button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); current=btn.dataset.module; buildForm();}));
$('adminSearch').addEventListener('input',renderList);
buildForm(); loadData();

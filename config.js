const CONFIG = {
  SHEET_API_URL: 'https://script.google.com/macros/s/AKfycbxGDlKJAh2z2pXDCX9rNAbbhdLLblGx3kU64j0LSp5usS8ZiTG50fF91KOQmSdS3mCu/exec',
  DEFAULT_YEAR: '2026',
  ADMIN_PIN: '2026'
};

// HOTFIX 2026-10-06 — paksa topik Tamadun Islam muncul dalam dropdown PBD Tingkatan 1.
// Diletakkan di config.js supaya tidak perlu kacau script.js yang sedang stabil.
(function(){
  const TAMADUN_ISLAM_T1 = [
    {
      id:'T1_4_3_ISLAM',
      label:'4.3 Tamadun Islam dan Sumbangannya • 4.3 Tamadun Islam dan Sumbangannya',
      topik:'4.3 Tamadun Islam dan Sumbangannya',
      sk:'4.0 Tamadun Dunia dan Sumbangannya',
      sp:'4.3 Tamadun Islam dan Sumbangannya'
    },
    {
      id:'T1_4_3_1_ISLAM',
      label:'4.3.1 Latar Belakang Masyarakat Arab Sebelum Kedatangan Islam',
      topik:'4.3 Tamadun Islam dan Sumbangannya',
      sk:'4.0 Tamadun Dunia dan Sumbangannya',
      sp:'4.3.1 Latar belakang masyarakat Arab sebelum kedatangan Islam'
    },
    {
      id:'T1_4_3_2_ISLAM',
      label:'4.3.2 Kemunculan dan Perkembangan Tamadun Islam',
      topik:'4.3 Tamadun Islam dan Sumbangannya',
      sk:'4.0 Tamadun Dunia dan Sumbangannya',
      sp:'4.3.2 Kemunculan dan perkembangan tamadun Islam'
    },
    {
      id:'T1_4_3_3_ISLAM',
      label:'4.3.3 Ketokohan Nabi Muhammad SAW sebagai Pemimpin',
      topik:'4.3 Tamadun Islam dan Sumbangannya',
      sk:'4.0 Tamadun Dunia dan Sumbangannya',
      sp:'4.3.3 Ketokohan Nabi Muhammad SAW sebagai pemimpin'
    },
    {
      id:'T1_4_3_4_ISLAM',
      label:'4.3.4 Sumbangan Tamadun Islam kepada Dunia',
      topik:'4.3 Tamadun Islam dan Sumbangannya',
      sk:'4.0 Tamadun Dunia dan Sumbangannya',
      sp:'4.3.4 Sumbangan tamadun Islam kepada dunia'
    },
    {
      id:'T1_4_3_5_ISLAM',
      label:'4.3.5 Sumbangan Tamadun Islam dalam Seni Bina',
      topik:'4.3 Tamadun Islam dan Sumbangannya',
      sk:'4.0 Tamadun Dunia dan Sumbangannya',
      sp:'4.3.5 Sumbangan tamadun Islam dalam seni bina'
    }
  ];

  function normText(s){
    return String(s || '').toLowerCase().replace(/\s+/g,' ').trim();
  }

  function ensureTamadunIslamOptions(){
    const tingkatan = String(document.getElementById('pbdTingkatan')?.value || '');
    const select = document.getElementById('pbdTopik');
    if(!select || tingkatan !== '1') return;

    const hasIslam = Array.from(select.options).some(opt => {
      const text = normText(opt.textContent);
      return text.includes('tamadun islam') || text.includes('nabi muhammad');
    });
    if(hasIslam) return;

    const insertBefore = select.options[1] || null;
    TAMADUN_ISLAM_T1.slice().reverse().forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.label;
      opt.dataset.topik = item.topik;
      opt.dataset.sk = item.sk;
      opt.dataset.sp = item.sp;
      if(insertBefore) select.insertBefore(opt, insertBefore);
      else select.appendChild(opt);
    });
  }

  function patchFallbackTopikList(){
    if(typeof window.fallbackTopikList !== 'function' || window.fallbackTopikList.__tamadunIslamPatched) return;
    const original = window.fallbackTopikList;
    const patched = function(ting){
      const base = Array.isArray(original(ting)) ? original(ting).slice() : [];
      if(String(ting) !== '1') return base;

      const seen = new Set(base.map(t => normText((t.Topik || t.topik || '') + ' ' + (t.SP || t.sp || ''))));
      TAMADUN_ISLAM_T1.forEach(item => {
        const key = normText(item.topik + ' ' + item.sp);
        if(seen.has(key)) return;
        seen.add(key);
        base.push({
          IDTopik:item.id,
          Tingkatan:'1',
          Topik:item.topik,
          SK:item.sk,
          SP:item.sp
        });
      });
      return base;
    };
    patched.__tamadunIslamPatched = true;
    window.fallbackTopikList = patched;
  }

  function runHotfix(){
    patchFallbackTopikList();
    ensureTamadunIslamOptions();
  }

  document.addEventListener('DOMContentLoaded', runHotfix);
  document.addEventListener('change', function(e){
    if(e.target && (e.target.id === 'pbdTingkatan' || e.target.id === 'pbdKelas' || e.target.id === 'pbdTopik')){
      setTimeout(runHotfix, 0);
      setTimeout(runHotfix, 200);
      setTimeout(runHotfix, 600);
    }
  }, true);

  window.addEventListener('load', runHotfix);
  for(let i=1;i<=20;i++) setTimeout(runHotfix, i*500);
  window.ensureTamadunIslamOptions = ensureTamadunIslamOptions;
})();


(() => {
  const data = window.LIBRARY_DATA;
  const content = document.getElementById('content');
  const summary = document.getElementById('summary');
  const title = document.getElementById('sectionTitle');
  const breadcrumb = document.getElementById('breadcrumb');
  const search = document.getElementById('searchInput');
  const backBtn = document.getElementById('backBtn');
  const viewer = document.getElementById('viewer');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerMeta = document.getElementById('viewerMeta');
  const viewerBody = document.getElementById('viewerBody');
  const openOriginal = document.getElementById('openOriginal');
  const downloadOriginal = document.getElementById('downloadOriginal');
  const closeViewer = document.getElementById('closeViewer');

  let state = { group: 'Português', year: null, q: '' };

  function urlFor(rawPath){
    return rawPath.split('/').map(encodeURIComponent).join('/');
  }
  function humanSize(bytes){
    if(bytes < 1024) return bytes + ' B';
    const units=['KB','MB','GB']; let value=bytes/1024, i=0;
    while(value>=1024 && i<units.length-1){value/=1024;i++;}
    return value.toLocaleString('pt-BR',{maximumFractionDigits:value>=10?1:2})+' '+units[i];
  }
  function isImage(entry){ return ['JPG','JPEG','PNG','WEBP'].includes(entry.ext); }
  function currentEntries(){
    return data.entries.filter(e => e.group===state.group && (!state.year || e.year===state.year));
  }
  function setHash(){
    const p=new URLSearchParams(); p.set('g',state.group); if(state.year)p.set('y',state.year); if(state.q)p.set('q',state.q);
    history.replaceState(null,'','#'+p.toString());
  }
  function readHash(){
    const p=new URLSearchParams(location.hash.slice(1));
    const g=p.get('g'); if(data.groups.includes(g)) state.group=g;
    const y=p.get('y'); state.year=y||null;
    state.q=p.get('q')||''; search.value=state.q;
  }
  function updateTabs(){
    document.querySelectorAll('.tab').forEach(btn => btn.setAttribute('aria-selected', btn.dataset.group===state.group ? 'true':'false'));
  }
  function render(){
    updateTabs();
    breadcrumb.textContent = state.year ? `${state.group} · ${state.year}` : state.group;
    title.textContent = state.year ? 'Arquivos' : 'Selecione um ano';
    backBtn.classList.toggle('hidden', !state.year);
    const groupStats=data.stats[state.group];

    if(!state.year){
      const years=groupStats.years.filter(y => !state.q || y.label.toLocaleLowerCase().includes(state.q.toLocaleLowerCase()));
      summary.textContent=`${groupStats.files} arquivos · ${groupStats.years.length} ${groupStats.years.length===1?'ano':'anos/pastas'}`;
      if(!years.length){ content.innerHTML='<div class="empty">Nenhum ano ou pasta encontrado.</div>'; return; }
      content.innerHTML='<div class="year-grid">'+years.map(y=>`<button class="year-card" data-year="${escapeAttr(y.label)}"><span class="year-label">${escapeHtml(y.label)}</span><span class="year-count">${y.count} ${y.count===1?'arquivo':'arquivos'}</span></button>`).join('')+'</div>';
      content.querySelectorAll('[data-year]').forEach(btn=>btn.addEventListener('click',()=>{state.year=btn.dataset.year;state.q='';search.value='';setHash();render();window.scrollTo({top:document.querySelector('.tabs').offsetTop-6,behavior:'smooth'});}));
      return;
    }

    const q=state.q.trim().toLocaleLowerCase();
    const entries=currentEntries().filter(e=>!q || e.name.toLocaleLowerCase().includes(q));
    summary.textContent=`${entries.length} ${entries.length===1?'arquivo':'arquivos'}${q?' encontrado(s)':''}`;
    if(!entries.length){ content.innerHTML='<div class="empty">Nenhum arquivo corresponde à pesquisa.</div>'; return; }
    content.innerHTML='<div class="file-list">'+entries.map((e,i)=>`<button class="file-card" data-index="${data.entries.indexOf(e)}"><span class="file-icon">${escapeHtml(e.ext)}</span><span><span class="file-name">${escapeHtml(e.name)}</span><span class="file-sub">${escapeHtml(e.year)} · ${humanSize(e.size)}</span></span><span class="file-arrow">›</span></button>`).join('')+'</div>';
    content.querySelectorAll('[data-index]').forEach(btn=>btn.addEventListener('click',()=>openEntry(data.entries[Number(btn.dataset.index)])));
  }
  function openEntry(entry){
    const href=urlFor(entry.path);
    viewerTitle.textContent=entry.name;
    viewerMeta.textContent=`${entry.group} · ${entry.year} · ${entry.ext}`;
    openOriginal.href=href; downloadOriginal.href=href;
    if(isImage(entry)) viewerBody.innerHTML=`<img src="${href}" alt="${escapeAttr(entry.name)}">`;
    else viewerBody.innerHTML=`<div class="file-message"><strong>Arquivo ${escapeHtml(entry.ext)}</strong><p>Este formato será aberto pelo aplicativo compatível instalado no dispositivo.</p></div>`;
    if(typeof viewer.showModal==='function') viewer.showModal(); else viewer.setAttribute('open','');
  }
  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function escapeAttr(v){return escapeHtml(v);}

  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{state.group=btn.dataset.group;state.year=null;state.q='';search.value='';setHash();render();}));
  backBtn.addEventListener('click',()=>{state.year=null;state.q='';search.value='';setHash();render();});
  search.addEventListener('input',()=>{state.q=search.value;setHash();render();});
  closeViewer.addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && viewer.open)viewer.close();});
  window.addEventListener('hashchange',()=>{readHash();render();});

  readHash(); setHash(); render();

  if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
  }
})();

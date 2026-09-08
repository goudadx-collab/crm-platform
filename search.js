(() => {
  const KEY = 'crm-demo-data';

  const load = () => JSON.parse(localStorage.getItem(KEY) || '{}');
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value || 0));

  function allRecords(data) {
    const records = [];
    (data.companies || []).forEach(r => records.push({type:'Company', name:r.name, meta:r.industry || r.location || '', id:r.id}));
    (data.contacts || []).forEach(r => records.push({type:'Contact', name:r.name, meta:r.company || r.jobTitle || '', id:r.id}));
    (data.leads || []).forEach(r => records.push({type:'Lead', name:r.name, meta:`${r.status || ''} · ${r.source || ''}`, id:r.id}));
    (data.deals || []).forEach(r => records.push({type:'Deal', name:r.name, meta:`${r.company || ''} · ${money(r.value)}`, id:r.id}));
    (data.tasks || []).forEach(r => records.push({type:'Task', name:r.title, meta:`${r.status || ''} · ${r.due || ''}`, id:r.id}));
    (data.activities || []).forEach(r => records.push({type:'Activity', name:r.subject || r.text || 'Activity', meta:`${r.type || 'Note'} · ${r.date || r.time || ''}`, id:r.id}));
    return records;
  }

  function related(data, companyName) {
    const key = companyName.toLowerCase();
    return {
      contacts:(data.contacts||[]).filter(x => String(x.company||'').toLowerCase() === key),
      leads:(data.leads||[]).filter(x => String(x.company||x.name||'').toLowerCase().includes(key)),
      deals:(data.deals||[]).filter(x => String(x.company||'').toLowerCase() === key),
      tasks:(data.tasks||[]).filter(x => String(x.relatedName||'').toLowerCase() === key),
      activities:(data.activities||[]).filter(x => String(x.relatedName||'').toLowerCase() === key)
    };
  }

  function resultCard(r) {
    return `<button class="search-result" data-search-type="${esc(r.type)}" data-search-id="${esc(r.id)}"><span class="badge">${esc(r.type)}</span><span><strong>${esc(r.name)}</strong><small>${esc(r.meta)}</small></span></button>`;
  }

  function renderSearch(query='') {
    const data = load();
    const q = query.trim().toLowerCase();
    const results = q ? allRecords(data).filter(r => `${r.type} ${r.name} ${r.meta}`.toLowerCase().includes(q)).slice(0,20) : [];
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `<div class="dashboard-head"><div><p class="eyebrow">CRM INTELLIGENCE</p><h2>Global Search</h2><p>Find any customer record and explore its relationships.</p></div></div>
      <div class="card" style="margin-bottom:18px"><input id="global-search-input" class="search-input" autocomplete="off" placeholder="Search contacts, companies, leads, deals, tasks or activities…" value="${esc(query)}"></div>
      <div id="search-results" class="card">${q ? (results.length ? `<div class="mini-list">${results.map(resultCard).join('')}</div>` : '<div class="empty-state">No matching records found.</div>') : '<div class="empty-state">Start typing to search across your CRM.</div>'}</div>`;
    const input = document.getElementById('global-search-input');
    input.focus();
    input.setSelectionRange(input.value.length,input.value.length);
    input.addEventListener('input', () => renderSearch(input.value));
  }

  function showCompanyContext(companyName) {
    const data = load();
    const rel = related(data, companyName);
    const sections = [
      ['Contacts',rel.contacts.map(x=>`<li><strong>${esc(x.name)}</strong><span>${esc(x.jobTitle||x.email||'')}</span></li>`)],
      ['Deals',rel.deals.map(x=>`<li><strong>${esc(x.name)}</strong><span>${esc(x.stage||'')} · ${money(x.value)}</span></li>`)],
      ['Tasks',rel.tasks.map(x=>`<li><strong>${esc(x.title)}</strong><span>${esc(x.status||'')} · ${esc(x.due||'')}</span></li>`)],
      ['Activities',rel.activities.map(x=>`<li><strong>${esc(x.subject||x.text||'Activity')}</strong><span>${esc(x.type||'Note')} · ${esc(x.date||x.time||'')}</span></li>`)]
    ];
    const modal = document.getElementById('company-detail-modal');
    const detail = document.getElementById('company-detail');
    if (!modal || !detail) return;
    detail.innerHTML = `<div class="company-hero"><div><p class="eyebrow">RELATIONSHIP VIEW</p><h2>${esc(companyName)}</h2><p>Connected CRM records</p></div></div><div class="detail-grid">${sections.map(([title,items])=>`<div class="card"><h3>${title}</h3>${items.length?`<ul class="mini-list">${items.join('')}</ul>`:'<p class="muted">No linked records yet.</p>'}</div>`).join('')}</div>`;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
  }

  function openRecord(type,id) {
    const data = load();
    const item = (data[type.toLowerCase()+'s'] || []).find(x => String(x.id) === String(id));
    if (!item) return;
    if (type === 'Company') return showCompanyContext(item.name);
    if (type === 'Contact') return showCompanyContext(item.company || item.name);
    if (type === 'Deal') return showCompanyContext(item.company || item.name);
    if (type === 'Lead') return showCompanyContext(item.name);
    if (type === 'Task' || type === 'Activity') return showCompanyContext(item.relatedName || item.name || 'CRM');
  }

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view="search"]');
    if (nav) { event.preventDefault(); event.stopPropagation(); renderSearch(); }
    const result = event.target.closest('.search-result');
    if (result) { event.preventDefault(); event.stopPropagation(); openRecord(result.dataset.searchType,result.dataset.searchId); }
  }, true);

  window.crmGlobalSearch = renderSearch;
})();

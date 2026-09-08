(() => {
  const app = document.getElementById('app');
  const title = document.getElementById('page-title');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const form = document.getElementById('record-form');
  const closeModal = () => modal.classList.add('hidden');

  function getData() { return JSON.parse(localStorage.getItem('crm-demo-data')) || { deals: [], companies: [] }; }
  function saveData(data) { localStorage.setItem('crm-demo-data', JSON.stringify(data)); }
  function esc(v) { return String(v ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function money(v) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v||0)); }
  const stages = ['New','Qualified','Proposal','Negotiation','Won','Lost'];

  function renderDeals(filter = '', stage = 'All') {
    const data = getData();
    const deals = (data.deals || []).filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(filter.toLowerCase())) && (stage === 'All' || d.stage === stage));
    const pipeline = deals.filter(d => !['Won','Lost'].includes(d.stage)).reduce((s,d)=>s+Number(d.value||0),0);
    const won = deals.filter(d => d.stage === 'Won').reduce((s,d)=>s+Number(d.value||0),0);
    const weighted = deals.filter(d => !['Won','Lost'].includes(d.stage)).reduce((s,d)=>s+Number(d.value||0)*(d.stage==='Negotiation'?.8:d.stage==='Proposal'?.6:d.stage==='Qualified'?.4:.2),0);
    title.textContent = 'Deals';
    app.innerHTML = `<div class="toolbar"><div class="toolbar-left"><input class="search" id="deal-search" placeholder="Search opportunities or companies..." value="${esc(filter)}"><select class="select" id="deal-stage"><option>All</option>${stages.map(s=>`<option ${stage===s?'selected':''}>${s}</option>`).join('')}</select></div><button class="primary-btn" id="deal-add">+ Add opportunity</button></div>
      <div class="stats"><div class="card"><div class="stat-label">Open pipeline</div><div class="stat-value">${money(pipeline)}</div><div class="stat-meta">${deals.filter(d=>!['Won','Lost'].includes(d.stage)).length} active opportunities</div></div><div class="card"><div class="stat-label">Won revenue</div><div class="stat-value">${money(won)}</div><div class="stat-meta">Closed business</div></div><div class="card"><div class="stat-label">Weighted forecast</div><div class="stat-value">${money(weighted)}</div><div class="stat-meta">Stage-weighted estimate</div></div><div class="card"><div class="stat-label">Win rate</div><div class="stat-value">${deals.length ? Math.round(deals.filter(d=>d.stage==='Won').length/deals.length*100) : 0}%</div><div class="stat-meta">Won opportunities</div></div></div>
      <section class="panel"><div class="panel-head"><div><h2>${deals.length} opportunit${deals.length===1?'y':'ies'}</h2><span class="panel-subtitle">Manage value, stage and next sales action</span></div></div>
      ${deals.length ? `<div class="company-table-wrap"><table class="company-table"><thead><tr><th>Opportunity</th><th>Company</th><th>Stage</th><th>Value</th><th>Expected close</th><th>Actions</th></tr></thead><tbody>${deals.map(d=>`<tr><td><strong>${esc(d.name)}</strong><div class="contact-sub">${esc(d.owner||'Sales Team')}</div></td><td>${esc(d.company||'—')}</td><td><span class="badge">${esc(d.stage)}</span></td><td><strong>${money(d.value)}</strong></td><td>${esc(d.closeDate||'—')}</td><td><div class="row-actions"><button class="icon-btn" data-deal-edit="${esc(d.id)}">Edit</button><button class="icon-btn" data-deal-delete="${esc(d.id)}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">No opportunities found.</div>`}</section>`;
    document.getElementById('deal-search').addEventListener('input',e=>renderDeals(e.target.value,document.getElementById('deal-stage').value));
    document.getElementById('deal-stage').addEventListener('change',e=>renderDeals(document.getElementById('deal-search').value,e.target.value));
    document.getElementById('deal-add').addEventListener('click',()=>openDealForm());
  }

  function openDealForm(id = null) {
    const data = getData();
    const existing = (data.deals||[]).find(d=>String(d.id)===String(id));
    const companies = data.companies || [];
    modalTitle.textContent = existing ? 'Edit opportunity' : 'Add opportunity';
    form.innerHTML = `<div class="form-grid"><label>Opportunity name<input name="name" required value="${esc(existing?.name||'')}"></label><label>Company<select name="company"><option value="">Select company</option>${companies.map(c=>`<option ${existing?.company===c.name?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label>Value (USD)<input name="value" type="number" min="0" step="1000" required value="${Number(existing?.value||0)}"></label><label>Stage<select name="stage">${stages.map(s=>`<option ${existing?.stage===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Expected close<input name="closeDate" type="date" value="${esc(existing?.closeDate||'')}"></label><label>Owner<input name="owner" value="${esc(existing?.owner||'Sales Team')}"></label><label>Notes<textarea name="notes" rows="4" placeholder="Next step, customer need, decision process...">${esc(existing?.notes||'')}</textarea></label><button class="primary-btn" type="submit">${existing?'Save changes':'Create opportunity'}</button></div>`;
    form.onsubmit = e => { e.preventDefault(); const fd=new FormData(form); const item={id:existing?.id||Date.now(),name:fd.get('name').trim(),company:fd.get('company'),value:Number(fd.get('value')||0),stage:fd.get('stage'),closeDate:fd.get('closeDate'),owner:fd.get('owner').trim()||'Sales Team',notes:fd.get('notes').trim()}; data.deals=data.deals||[]; if(existing) data.deals=data.deals.map(d=>d.id===existing.id?item:d); else data.deals.unshift(item); saveData(data); closeModal(); renderDeals(); };
    modal.classList.remove('hidden');
  }

  function deleteDeal(id) { const data=getData(); const deal=(data.deals||[]).find(d=>String(d.id)===String(id)); if(!deal) return; if(!confirm(`Delete opportunity “${deal.name}”?`)) return; data.deals=data.deals.filter(d=>String(d.id)!==String(id)); saveData(data); renderDeals(); }

  document.addEventListener('click', e => {
    const nav=e.target.closest('[data-view="deals"]');
    const add=e.target.closest('[data-add="deals"]');
    const edit=e.target.closest('[data-deal-edit]');
    const del=e.target.closest('[data-deal-delete]');
    if(nav || add || edit || del) e.stopPropagation();
    if(nav) { renderDeals(); return; }
    if(add) { openDealForm(); return; }
    if(edit) { openDealForm(edit.dataset.dealEdit); return; }
    if(del) { deleteDeal(del.dataset.dealDelete); return; }
  }, true);

  document.getElementById('close-modal')?.addEventListener('click',closeModal);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
  window.renderDealsV05 = renderDeals;
})();

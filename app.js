const initialData = {
  contacts: [
    { id: 1, name: "Dr. Sarah Ahmed", company: "Gulf Diagnostics", email: "sarah@gulfdiag.example", phone: "+966 50 111 2233", jobTitle: "Laboratory Director", status: "Customer", notes: "Key decision maker for molecular diagnostics." },
    { id: 2, name: "Omar Hassan", company: "MedTech Solutions", email: "omar@medtech.example", phone: "+966 55 222 3344", jobTitle: "Procurement Manager", status: "Lead", notes: "Interested in PCR and automation portfolio." },
    { id: 3, name: "Lina Farouk", company: "BioLab Group", email: "lina@biolab.example", phone: "+966 54 333 4455", jobTitle: "Head of Laboratory", status: "Prospect", notes: "Follow up after product evaluation." }
  ],
  companies: [
    { id: 1, name: "Gulf Diagnostics", industry: "Diagnostics", website: "https://gulfdiag.example", phone: "+966 11 555 1000", location: "Riyadh, Saudi Arabia", status: "Active", notes: "Strategic diagnostics account with an active molecular testing opportunity." },
    { id: 2, name: "MedTech Solutions", industry: "Medical Technology", website: "https://medtech.example", phone: "+966 12 555 2000", location: "Jeddah, Saudi Arabia", status: "Prospect", notes: "Potential partner for laboratory automation and procurement." },
    { id: 3, name: "BioLab Group", industry: "Laboratory", website: "https://biolab.example", phone: "+966 13 555 3000", location: "Dammam, Saudi Arabia", status: "Active", notes: "Growing laboratory network evaluating rapid testing products." }
  ],
  leads: [
    { name: "Kingdom Lab Network", owner: "Sales Team", source: "Website", status: "New" },
    { name: "Advanced Medical Center", owner: "Sales Team", source: "Referral", status: "Qualified" }
  ],
  deals: [
    { name: "PCR Platform", company: "Gulf Diagnostics", value: 125000, stage: "Proposal" },
    { name: "Rapid Test Portfolio", company: "BioLab Group", value: 78000, stage: "Negotiation" },
    { name: "Lab Automation", company: "MedTech Solutions", value: 210000, stage: "Qualified" }
  ],
  tasks: [
    { title: "Follow up on PCR proposal", due: "Today", owner: "Sales Team", status: "Open" },
    { title: "Send product catalog", due: "Tomorrow", owner: "Sales Team", status: "Open" },
    { title: "Schedule discovery call", due: "Sep 10", owner: "Sales Team", status: "Done" }
  ],
  activities: [
    { text: "Sarah Ahmed was added as a customer contact", time: "Today" },
    { text: "PCR Platform moved to Proposal", time: "Yesterday" },
    { text: "Omar Hassan was added as a lead contact", time: "Sep 6" }
  ]
};

let data = JSON.parse(localStorage.getItem("crm-demo-data")) || structuredClone(initialData);
if (!data.activities) data.activities = structuredClone(initialData.activities);
data.contacts = data.contacts.map((c, i) => ({ id: c.id || Date.now() + i, phone: "", jobTitle: "", notes: "", ...c }));
data.companies = data.companies.map((c, i) => ({ id: c.id || Date.now() + i, website: "", phone: "", location: "", status: "Active", notes: "", ...c }));
let currentView = "dashboard";
const app = document.getElementById("app");
const title = document.getElementById("page-title");

function save() { localStorage.setItem("crm-demo-data", JSON.stringify(data)); }
function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0)); }
function esc(value) { return String(value ?? "").replace(/[&<>\"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c])); }
function initials(name) { return String(name || "").split(" ").filter(Boolean).map(x => x[0]).slice(0,2).join("").toUpperCase(); }
function statusClass(status) { return status === "Customer" ? "badge-customer" : status === "Prospect" ? "badge-prospect" : status === "Active" ? "badge-active" : status === "Inactive" ? "badge-inactive" : ""; }

function renderDashboard() {
  const pipeline = data.deals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const won = data.deals.filter(d => d.stage === "Won").reduce((sum, d) => sum + Number(d.value || 0), 0);
  const openDeals = data.deals.filter(d => !["Won", "Lost"].includes(d.stage));
  const conversion = data.leads.length ? Math.round((data.leads.filter(l => ["Qualified", "Won"].includes(l.status)).length / data.leads.length) * 100) : 0;
  const stages = ["New", "Qualified", "Proposal", "Negotiation", "Won"];
  const stageTotals = stages.map(stage => ({ stage, count: data.deals.filter(d => d.stage === stage).length, value: data.deals.filter(d => d.stage === stage).reduce((s,d) => s + Number(d.value || 0), 0) }));
  app.innerHTML = `<div class="dashboard-head"><div><h2>Good business starts with visibility.</h2><p>Track your pipeline, priorities and customer activity from one place.</p></div><button class="primary-btn" data-add="deals">+ Add opportunity</button></div>
  <div class="stats"><div class="card"><div class="stat-label">Total pipeline</div><div class="stat-value">${money(pipeline)}</div><div class="stat-meta">Across ${data.deals.length} opportunities</div></div><div class="card"><div class="stat-label">Open opportunities</div><div class="stat-value">${openDeals.length}</div><div class="stat-meta">Active sales conversations</div></div><div class="card"><div class="stat-label">Won revenue</div><div class="stat-value">${money(won)}</div><div class="stat-meta">Closed business</div></div><div class="card"><div class="stat-label">Lead conversion</div><div class="stat-value">${conversion}%</div><div class="stat-meta">Qualified or won leads</div></div></div>
  <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>Sales pipeline</h2><span class="panel-subtitle">Opportunity value by stage</span></div><button class="text-btn" data-view="deals">View all</button></div><div class="pipeline">${stageTotals.map(s => `<div><div class="stage-top"><span>${s.stage}</span><strong>${s.count}</strong></div><div class="stage-bar"><span style="width:${pipeline ? Math.max(4, Math.min(100, s.value / pipeline * 100)) : 0}%"></span></div><div class="stage-value">${money(s.value)}</div></div>`).join("")}</div></section>
  <section class="panel"><div class="panel-head"><div><h2>My priorities</h2><span class="panel-subtitle">Tasks that need attention</span></div><button class="text-btn" data-view="tasks">View all</button></div><div class="task-list">${data.tasks.slice(0,4).map(t => `<div class="task-row"><span class="task-dot ${t.status === "Done" ? "done" : ""}"></span><div><strong>${esc(t.title)}</strong><small>${esc(t.due)} · ${esc(t.owner)}</small></div><span class="badge ${t.status === "Done" ? "badge-done" : ""}">${esc(t.status)}</span></div>`).join("")}</div></section></div>
  <div class="dashboard-grid lower-grid"><section class="panel"><div class="panel-head"><div><h2>Recent opportunities</h2><span class="panel-subtitle">Latest deal activity</span></div><button class="text-btn" data-add="deals">+ Add</button></div>${data.deals.length ? `<table><thead><tr><th>Opportunity</th><th>Company</th><th>Stage</th><th>Value</th></tr></thead><tbody>${data.deals.slice(0,5).map(d => `<tr><td><strong>${esc(d.name)}</strong></td><td>${esc(d.company)}</td><td><span class="badge">${esc(d.stage)}</span></td><td>${money(d.value)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No opportunities yet.</div>`}</section>
  <section class="panel"><div class="panel-head"><div><h2>Recent contacts</h2><span class="panel-subtitle">Your latest relationships</span></div><button class="text-btn" data-add="contacts">+ Add</button></div><div class="contact-list">${data.contacts.slice(0,5).map(c => `<div class="contact-row"><div class="avatar">${initials(c.name)}</div><div><strong>${esc(c.name)}</strong><small>${esc(c.company)}</small></div><span class="badge ${statusClass(c.status)}">${esc(c.status)}</span></div>`).join("")}</div></section></div>`;
}

function renderContacts(filter = "", status = "All") {
  const rows = data.contacts.filter(c => Object.values(c).some(v => String(v).toLowerCase().includes(filter.toLowerCase())) && (status === "All" || c.status === status));
  app.innerHTML = `<div class="toolbar"><div class="toolbar-left"><input class="search" id="contact-search" placeholder="Search contacts by name, company or email..." value="${esc(filter)}"><select class="select" id="contact-status"><option>All</option><option ${status === "Customer" ? "selected" : ""}>Customer</option><option ${status === "Prospect" ? "selected" : ""}>Prospect</option><option ${status === "Lead" ? "selected" : ""}>Lead</option></select></div><button class="primary-btn" data-add="contacts">+ Add contact</button></div>
  <div class="panel"><div class="panel-head"><div><h2>${rows.length} contact${rows.length === 1 ? "" : "s"}</h2><span class="panel-subtitle">People and decision makers connected to your accounts</span></div></div>${rows.length ? `<table><thead><tr><th>Contact</th><th>Company</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(c => `<tr><td><div class="contact-cell"><div class="avatar">${initials(c.name)}</div><div><div class="contact-name">${esc(c.name)}</div><div class="contact-sub">${esc(c.email)}</div></div></div></td><td>${esc(c.company)}</td><td>${esc(c.jobTitle || "—")}</td><td><span class="badge ${statusClass(c.status)}">${esc(c.status)}</span></td><td><div class="row-actions"><button class="icon-btn" data-contact-view="${c.id}">View</button><button class="icon-btn" data-contact-edit="${c.id}">Edit</button></div></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No contacts found. Try another search or add a new contact.</div>`}</div>`;
  document.getElementById("contact-search").addEventListener("input", e => renderContacts(e.target.value, document.getElementById("contact-status").value));
  document.getElementById("contact-status").addEventListener("change", e => renderContacts(document.getElementById("contact-search").value, e.target.value));
}

function renderContactDetail(id) {
  const c = data.contacts.find(x => String(x.id) === String(id));
  if (!c) return renderContacts();
  const companyDeals = data.deals.filter(d => d.company === c.company);
  app.innerHTML = `<div class="toolbar"><button class="secondary-btn" data-back-contacts>← Back to contacts</button><div class="row-actions"><button class="secondary-btn" data-contact-edit="${c.id}">Edit contact</button><button class="primary-btn" data-contact-delete="${c.id}">Delete</button></div></div>
  <section class="panel"><div class="panel-head"><div class="contact-cell"><div class="avatar">${initials(c.name)}</div><div><h2>${esc(c.name)}</h2><span class="panel-subtitle">${esc(c.jobTitle || "Contact")} · ${esc(c.company)}</span></div></div><span class="badge ${statusClass(c.status)}">${esc(c.status)}</span></div>
  <div class="detail-grid"><div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">${esc(c.email)}</div></div><div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${esc(c.phone || "—")}</div></div><div class="detail-item"><div class="detail-label">Company</div><div class="detail-value">${esc(c.company)}</div></div><div class="detail-item"><div class="detail-label">Role</div><div class="detail-value">${esc(c.jobTitle || "—")}</div></div></div></section>
  <section class="panel contact-panel"><div class="panel-head"><div><h2>Notes</h2><span class="panel-subtitle">Internal context for this relationship</span></div></div><div class="activity"><div class="activity-item"><span class="activity-dot"></span><div>${esc(c.notes || "No notes added yet.")}</div></div></div></section>
  <section class="panel contact-panel"><div class="panel-head"><div><h2>Company opportunities</h2><span class="panel-subtitle">Deals associated with ${esc(c.company)}</span></div></div>${companyDeals.length ? `<table><thead><tr><th>Opportunity</th><th>Stage</th><th>Value</th></tr></thead><tbody>${companyDeals.map(d => `<tr><td>${esc(d.name)}</td><td><span class="badge">${esc(d.stage)}</span></td><td>${money(d.value)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No opportunities linked to this company.</div>`}</section>`;
}

function companyStats(company) {
  const contacts = data.contacts.filter(c => c.company === company.name);
  const deals = data.deals.filter(d => d.company === company.name);
  const pipeline = deals.filter(d => !["Won","Lost"].includes(d.stage)).reduce((s,d) => s + Number(d.value || 0), 0);
  const won = deals.filter(d => d.stage === "Won").reduce((s,d) => s + Number(d.value || 0), 0);
  return { contacts, deals, pipeline, won };
}

function renderCompanies(filter = "") {
  const rows = data.companies.filter(c => Object.values(c).some(v => String(v).toLowerCase().includes(filter.toLowerCase())));
  app.innerHTML = `<div class="toolbar"><input class="search" id="company-search" placeholder="Search companies by name, industry or location..." value="${esc(filter)}"><button class="primary-btn" data-add="companies">+ Add company</button></div>
  <div class="panel"><div class="panel-head"><div><h2>${rows.length} compan${rows.length === 1 ? "y" : "ies"}</h2><span class="panel-subtitle">Accounts, relationships and commercial opportunities</span></div></div>
  ${rows.length ? `<div class="company-table-wrap"><table class="company-table"><thead><tr><th>Company</th><th>Industry</th><th>Contacts</th><th>Open pipeline</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(c => { const s = companyStats(c); return `<tr><td><div class="contact-cell"><div class="company-avatar">${initials(c.name)}</div><div><div class="contact-name">${esc(c.name)}</div><div class="contact-sub">${esc(c.location || "Location not set")}</div></div></div></td><td>${esc(c.industry || "—")}</td><td>${s.contacts.length}</td><td><strong>${money(s.pipeline)}</strong></td><td><span class="badge ${statusClass(c.status)}">${esc(c.status)}</span></td><td><div class="row-actions"><button class="icon-btn" data-company-view="${c.id}">View</button><button class="icon-btn" data-company-edit="${c.id}">Edit</button></div></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty">No companies found. Try another search or add a new company.</div>`}</div>`;
  document.getElementById("company-search").addEventListener("input", e => renderCompanies(e.target.value));
}

function openCompanyDetail(id) {
  const company = data.companies.find(c => String(c.id) === String(id));
  if (!company) return;
  const s = companyStats(company);
  const detail = document.getElementById("company-detail");
  detail.innerHTML = `<div class="company-hero"><div class="company-hero-main"><div class="company-avatar">${initials(company.name)}</div><div><h2>${esc(company.name)}</h2><div class="company-meta">${esc(company.industry || "Company")} · ${esc(company.location || "Location not set")}</div></div><span class="badge ${statusClass(company.status)}">${esc(company.status)}</span><div class="company-actions"><button class="secondary-btn" data-company-edit="${company.id}">Edit</button><button class="primary-btn" data-company-add-deal="${company.id}">+ Deal</button></div></div>
  <div class="company-metrics"><div class="company-metric"><div class="company-metric-label">Contacts</div><div class="company-metric-value">${s.contacts.length}</div></div><div class="company-metric"><div class="company-metric-label">Open pipeline</div><div class="company-metric-value">${money(s.pipeline)}</div></div><div class="company-metric"><div class="company-metric-label">Won revenue</div><div class="company-metric-value">${money(s.won)}</div></div></div></div>
  <div class="company-section"><h3>Company information</h3><div class="detail-grid" style="padding:0"><div class="detail-item"><div class="detail-label">Website</div><div class="detail-value">${company.website ? `<a class="company-link" href="${esc(company.website)}" target="_blank" rel="noopener">${esc(company.website)}</a>` : "—"}</div></div><div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${esc(company.phone || "—")}</div></div></div></div>
  <div class="company-section"><h3>Notes</h3><div class="company-notes">${esc(company.notes || "No notes added yet.")}</div></div>
  <div class="company-section"><h3>Contacts</h3>${s.contacts.length ? `<div class="mini-list">${s.contacts.map(c => `<div class="mini-row"><div class="avatar">${initials(c.name)}</div><div class="mini-row-main"><strong>${esc(c.name)}</strong><small>${esc(c.jobTitle || "Contact")} · ${esc(c.email)}</small></div><span class="badge ${statusClass(c.status)}">${esc(c.status)}</span></div>`).join("")}</div>` : `<div class="empty">No contacts linked to this company yet.</div>`}</div>
  <div class="company-section"><h3>Opportunities</h3>${s.deals.length ? `<div class="mini-list">${s.deals.map(d => `<div class="mini-row"><div class="mini-row-main"><strong>${esc(d.name)}</strong><small>${esc(d.stage)}</small></div><strong>${money(d.value)}</strong></div>`).join("")}</div>` : `<div class="empty">No opportunities linked to this company yet.</div>`}</div>`;
  document.getElementById("company-detail-modal").classList.remove("hidden");
}

const configs = {
  leads:{title:"Leads",columns:["name","owner","source","status"],labels:["Lead","Owner","Source","Status"]},
  deals:{title:"Deals",columns:["name","company","stage","value"],labels:["Deal","Company","Stage","Value"]},
  tasks:{title:"Tasks",columns:["title","due","owner","status"],labels:["Task","Due","Owner","Status"]}
};
function renderList(view, filter="") { const cfg=configs[view]; const rows=data[view].filter(item=>Object.values(item).some(v=>String(v).toLowerCase().includes(filter.toLowerCase()))); app.innerHTML=`<div class="toolbar"><input class="search" id="search" placeholder="Search ${cfg.title.toLowerCase()}..." value="${esc(filter)}"><button class="primary-btn" data-add="${view}">+ Add ${view.slice(0,-1)}</button></div><div class="panel"><div class="panel-head"><h2>${rows.length} ${cfg.title.toLowerCase()}</h2></div>${rows.length?`<table><thead><tr>${cfg.labels.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map(item=>`<tr>${cfg.columns.map(k=>`<td>${k==="value"?money(item[k]):(k==="status"||k==="stage"?`<span class="badge">${esc(item[k])}</span>`:esc(item[k]))}</td>`).join("")}</tr>`).join("")}</tbody></table>`:`<div class="empty">No records found.</div>`}</div>`; document.getElementById("search").addEventListener("input",e=>renderList(view,e.target.value)); }

function render(){ title.textContent=currentView==="dashboard"?"Dashboard":currentView==="contacts"?"Contacts":currentView==="companies"?"Companies":configs[currentView].title; document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView)); if(currentView==="dashboard")renderDashboard(); else if(currentView==="contacts")renderContacts(); else if(currentView==="companies")renderCompanies(); else renderList(currentView); }

function openModal(view, editId = null) {
  const existing = editId ? data[view].find(x => String(x.id) === String(editId)) : null;
  const fields = view === "contacts" ? ["name","company","email","phone","jobTitle","status","notes"] : view === "companies" ? ["name","industry","website","phone","location","status","notes"] : view === "leads" ? ["name","owner","source","status"] : view === "deals" ? ["name","company","value","stage"] : ["title","due","owner","status"];
  const selects = { contacts:{status:["Lead","Prospect","Customer"]}, companies:{status:["Active","Prospect","Inactive"]}, deals:{stage:["New","Qualified","Proposal","Negotiation","Won","Lost"]}, leads:{status:["New","Qualified","Won","Lost"]}, tasks:{status:["Open","Done"]} };
  document.getElementById("modal-title").textContent = `${existing ? "Edit" : "Add"} ${view === "contacts" ? "contact" : view === "companies" ? "company" : view.slice(0,-1)}`;
  document.getElementById("record-form").innerHTML = `<div class="form-grid">${fields.map(f => selects[view]?.[f] ? `<label>${f === "jobTitle" ? "Job title" : f[0].toUpperCase()+f.slice(1)}<select name="${f}" required>${selects[view][f].map(o=>`<option ${existing?.[f]===o?"selected":""}>${o}</option>`).join("")}</select></label>` : `<label>${f === "jobTitle" ? "Job title" : f[0].toUpperCase()+f.slice(1)}${f === "notes" ? `<textarea name="${f}" rows="4">${esc(existing?.[f] || "")}</textarea>` : `<input name="${f}" value="${esc(existing?.[f] || "")}" ${f !== "notes" ? "required" : ""}>`}</label>`).join("")}<button class="primary-btn" type="submit">${existing ? "Save changes" : "Create record"}</button></div>`;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("record-form").onsubmit=e=>{e.preventDefault();const obj=Object.fromEntries(new FormData(e.target).entries());if(view==="deals")obj.value=Number(obj.value||0);if(view==="companies")obj.id=existing?.id || Date.now();if(view==="contacts"){if(existing)Object.assign(existing,obj);else{obj.id=Date.now();data.contacts.unshift(obj)}}else if(existing)Object.assign(existing,obj);else data[view].unshift(obj);data.activities.unshift({text:`${existing?"Updated":"Added"} ${view === "contacts" ? obj.name : obj.name || obj.title}`,time:"Just now"});save();closeModal();render();if(view==="companies" && existing)openCompanyDetail(existing.id);};
}
function closeModal(){document.getElementById("modal").classList.add("hidden");}
function closeCompanyDetail(){document.getElementById("company-detail-modal").classList.add("hidden");}


document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-view]"); if(nav){currentView=nav.dataset.view;render();return}
  const add=e.target.closest("[data-add]"); if(add){openModal(add.dataset.add);return}
  const view=e.target.closest("[data-contact-view]"); if(view){renderContactDetail(view.dataset.contactView);return}
  const edit=e.target.closest("[data-contact-edit]"); if(edit){openModal("contacts",edit.dataset.contactEdit);return}
  const back=e.target.closest("[data-back-contacts]"); if(back){renderContacts();return}
  const del=e.target.closest("[data-contact-delete]"); if(del){if(confirm("Delete this contact?")){data.contacts=data.contacts.filter(c=>String(c.id)!==String(del.dataset.contactDelete));data.activities.unshift({text:"A contact was deleted",time:"Just now"});save();renderContacts();}return}
  const companyView=e.target.closest("[data-company-view]"); if(companyView){openCompanyDetail(companyView.dataset.companyView);return}
  const companyEdit=e.target.closest("[data-company-edit]"); if(companyEdit){closeCompanyDetail();openModal("companies",companyEdit.dataset.companyEdit);return}
  const addDeal=e.target.closest("[data-company-add-deal]"); if(addDeal){const company=data.companies.find(c=>String(c.id)===String(addDeal.dataset.companyAddDeal));closeCompanyDetail();openModal("deals");setTimeout(()=>{const input=document.querySelector('#record-form input[name="company"]');if(input&&company)input.value=company.name;},0);return}
});

document.getElementById("close-modal").onclick=closeModal;
document.getElementById("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
document.getElementById("close-company-detail").onclick=closeCompanyDetail;
document.getElementById("company-detail-modal").addEventListener("click",e=>{if(e.target.id==="company-detail-modal")closeCompanyDetail()});
document.getElementById("reset-demo").onclick=()=>{data=structuredClone(initialData);save();render()};
render();
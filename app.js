const initialData = {
  contacts: [
    { name: "Dr. Sarah Ahmed", company: "Gulf Diagnostics", email: "sarah@gulfdiag.example", status: "Customer" },
    { name: "Omar Hassan", company: "MedTech Solutions", email: "omar@medtech.example", status: "Lead" },
    { name: "Lina Farouk", company: "BioLab Group", email: "lina@biolab.example", status: "Prospect" }
  ],
  companies: [
    { name: "Gulf Diagnostics", industry: "Diagnostics", contacts: 8 },
    { name: "MedTech Solutions", industry: "Medical Technology", contacts: 4 },
    { name: "BioLab Group", industry: "Laboratory", contacts: 6 }
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
  ]
};

let data = JSON.parse(localStorage.getItem("crm-demo-data")) || structuredClone(initialData);
let currentView = "dashboard";
const app = document.getElementById("app");
const title = document.getElementById("page-title");

function save() { localStorage.setItem("crm-demo-data", JSON.stringify(data)); }
function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
function esc(value) { return String(value).replace(/[&<>\"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c])); }

function renderDashboard() {
  const pipeline = data.deals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const won = data.deals.filter(d => d.stage === "Won").reduce((sum, d) => sum + Number(d.value || 0), 0);
  const openDeals = data.deals.filter(d => !["Won", "Lost"].includes(d.stage));
  const conversion = data.leads.length ? Math.round((data.leads.filter(l => ["Qualified", "Won"].includes(l.status)).length / data.leads.length) * 100) : 0;
  const stages = ["New", "Qualified", "Proposal", "Negotiation", "Won"];
  const stageTotals = stages.map(stage => ({ stage, count: data.deals.filter(d => d.stage === stage).length, value: data.deals.filter(d => d.stage === stage).reduce((s,d) => s + Number(d.value || 0), 0) }));

  app.innerHTML = `
    <div class="dashboard-head">
      <div><h2>Good business starts with visibility.</h2><p>Track your pipeline, priorities and customer activity from one place.</p></div>
      <button class="primary-btn" data-add="deals">+ Add opportunity</button>
    </div>
    <div class="stats">
      <div class="card stat-card"><div class="stat-label">Total pipeline</div><div class="stat-value">${money(pipeline)}</div><div class="stat-meta">Across ${data.deals.length} opportunities</div></div>
      <div class="card stat-card"><div class="stat-label">Open opportunities</div><div class="stat-value">${openDeals.length}</div><div class="stat-meta">Active sales conversations</div></div>
      <div class="card stat-card"><div class="stat-label">Won revenue</div><div class="stat-value">${money(won)}</div><div class="stat-meta">Closed business</div></div>
      <div class="card stat-card"><div class="stat-label">Lead conversion</div><div class="stat-value">${conversion}%</div><div class="stat-meta">Qualified or won leads</div></div>
    </div>

    <div class="dashboard-grid">
      <section class="panel pipeline-panel">
        <div class="panel-head"><div><h2>Sales pipeline</h2><span class="panel-subtitle">Opportunity value by stage</span></div><button class="text-btn" data-view="deals">View all</button></div>
        <div class="pipeline">${stageTotals.map(s => `<div class="pipeline-stage"><div class="stage-top"><span>${s.stage}</span><strong>${s.count}</strong></div><div class="stage-bar"><span style="width:${pipeline ? Math.max(4, Math.min(100, s.value / pipeline * 100)) : 0}%"></span></div><div class="stage-value">${money(s.value)}</div></div>`).join("")}</div>
      </section>
      <section class="panel tasks-panel">
        <div class="panel-head"><div><h2>My priorities</h2><span class="panel-subtitle">Tasks that need attention</span></div><button class="text-btn" data-view="tasks">View all</button></div>
        <div class="task-list">${data.tasks.slice(0,4).map(t => `<div class="task-row"><span class="task-dot ${t.status === "Done" ? "done" : ""}"></span><div><strong>${esc(t.title)}</strong><small>${esc(t.due)} · ${esc(t.owner)}</small></div><span class="badge ${t.status === "Done" ? "badge-done" : ""}">${esc(t.status)}</span></div>`).join("")}</div>
      </section>
    </div>

    <div class="dashboard-grid lower-grid">
      <section class="panel"><div class="panel-head"><div><h2>Recent opportunities</h2><span class="panel-subtitle">Latest deal activity</span></div><button class="text-btn" data-add="deals">+ Add</button></div>
        ${data.deals.length ? `<table><thead><tr><th>Opportunity</th><th>Company</th><th>Stage</th><th>Value</th></tr></thead><tbody>${data.deals.slice(0,5).map(d => `<tr><td><strong>${esc(d.name)}</strong></td><td>${esc(d.company)}</td><td><span class="badge">${esc(d.stage)}</span></td><td>${money(d.value)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No opportunities yet.</div>`}
      </section>
      <section class="panel"><div class="panel-head"><div><h2>Recent contacts</h2><span class="panel-subtitle">Your latest relationships</span></div><button class="text-btn" data-add="contacts">+ Add</button></div>
        <div class="contact-list">${data.contacts.slice(0,5).map(c => `<div class="contact-row"><div class="avatar">${esc(c.name.split(" ").map(x => x[0]).slice(0,2).join(""))}</div><div><strong>${esc(c.name)}</strong><small>${esc(c.company)}</small></div><span class="badge">${esc(c.status)}</span></div>`).join("")}</div>
      </section>
    </div>`;
}

const configs = {
  contacts: { title:"Contacts", columns:["name","company","email","status"], labels:["Name","Company","Email","Status"] },
  companies: { title:"Companies", columns:["name","industry","contacts"], labels:["Company","Industry","Contacts"] },
  leads: { title:"Leads", columns:["name","owner","source","status"], labels:["Lead","Owner","Source","Status"] },
  deals: { title:"Deals", columns:["name","company","stage","value"], labels:["Deal","Company","Stage","Value"] },
  tasks: { title:"Tasks", columns:["title","due","owner","status"], labels:["Task","Due","Owner","Status"] }
};

function renderList(view, filter="") {
  const cfg = configs[view];
  const rows = data[view].filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(filter.toLowerCase())));
  app.innerHTML = `<div class="toolbar"><input class="search" id="search" placeholder="Search ${cfg.title.toLowerCase()}..." value="${esc(filter)}"><button class="primary-btn" data-add="${view}">+ Add ${view.slice(0,-1)}</button></div><div class="panel"><div class="panel-head"><h2>${rows.length} ${cfg.title.toLowerCase()}</h2></div>${rows.length ? `<table><thead><tr>${cfg.labels.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map(item=>`<tr>${cfg.columns.map(k=>`<td>${k==="value"?money(item[k]):(k==="status"||k==="stage"?`<span class="badge">${esc(item[k])}</span>`:esc(item[k]))}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<div class="empty">No records found.</div>`}</div>`;
  document.getElementById("search").addEventListener("input", e => renderList(view, e.target.value));
}

function render() {
  title.textContent = currentView === "dashboard" ? "Dashboard" : configs[currentView].title;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === currentView));
  currentView === "dashboard" ? renderDashboard() : renderList(currentView);
}

function openModal(view) {
  const fields = { contacts:["name","company","email","status"], companies:["name","industry","contacts"], leads:["name","owner","source","status"], deals:["name","company","value","stage"], tasks:["title","due","owner","status"] }[view];
  document.getElementById("modal-title").textContent = `Add ${view.slice(0,-1)}`;
  document.getElementById("record-form").innerHTML = `<div class="form-grid">${fields.map(f=>`<label>${f[0].toUpperCase()+f.slice(1)}<input name="${f}" required></label>`).join("")}<button class="primary-btn" type="submit">Save record</button></div>`;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("record-form").onsubmit = e => { e.preventDefault(); const obj = Object.fromEntries(new FormData(e.target).entries()); if(view==="deals") obj.value=Number(obj.value||0); if(view==="companies") obj.contacts=Number(obj.contacts||0); data[view].push(obj); save(); closeModal(); render(); };
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); }

document.addEventListener("click", e => {
  const nav = e.target.closest("[data-view]"); if(nav) { currentView=nav.dataset.view; render(); }
  const add = e.target.closest("[data-add]"); if(add) openModal(add.dataset.add);
});
document.getElementById("close-modal").onclick = closeModal;
document.getElementById("modal").addEventListener("click", e => { if(e.target.id === "modal") closeModal(); });
document.getElementById("reset-demo").onclick = () => { data=structuredClone(initialData); save(); render(); };
render();

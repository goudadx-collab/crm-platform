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
function esc(value) { return String(value).replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[c])); }

function renderDashboard() {
  const pipeline = data.deals.reduce((sum, d) => sum + Number(d.value), 0);
  app.innerHTML = `
    <div class="stats">
      <div class="card"><div class="stat-label">Contacts</div><div class="stat-value">${data.contacts.length}</div></div>
      <div class="card"><div class="stat-label">Companies</div><div class="stat-value">${data.companies.length}</div></div>
      <div class="card"><div class="stat-label">Open leads</div><div class="stat-value">${data.leads.filter(x=>x.status!=="Won").length}</div></div>
      <div class="card"><div class="stat-label">Pipeline value</div><div class="stat-value">${money(pipeline)}</div></div>
    </div>
    <div class="panel"><div class="panel-head"><h2>Recent opportunities</h2><button class="primary-btn" data-add="deals">+ Add deal</button></div>
      <table><thead><tr><th>Deal</th><th>Company</th><th>Stage</th><th>Value</th></tr></thead><tbody>
      ${data.deals.map(d=>`<tr><td>${esc(d.name)}</td><td>${esc(d.company)}</td><td><span class="badge">${esc(d.stage)}</span></td><td>${money(d.value)}</td></tr>`).join("")}
      </tbody></table></div>`;
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
  let rows = data[view].filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(filter.toLowerCase())));
  app.innerHTML = `<div class="toolbar"><input class="search" id="search" placeholder="Search ${cfg.title.toLowerCase()}..." value="${esc(filter)}"><button class="primary-btn" data-add="${view}">+ Add ${view.slice(0,-1)}</button></div>
    <div class="panel"><div class="panel-head"><h2>${rows.length} ${cfg.title.toLowerCase()}</h2></div>
    ${rows.length ? `<table><thead><tr>${cfg.labels.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map(item=>`<tr>${cfg.columns.map(k=>`<td>${k==="value"?money(item[k]):(k==="status"||k==="stage"?`<span class="badge">${esc(item[k])}</span>`:esc(item[k]))}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<div class="empty">No records found.</div>`}</div>`;
  document.getElementById("search").addEventListener("input", e => renderList(view, e.target.value));
}

function render() {
  title.textContent = currentView === "dashboard" ? "Dashboard" : configs[currentView].title;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === currentView));
  currentView === "dashboard" ? renderDashboard() : renderList(currentView);
}

function openModal(view) {
  const fields = {
    contacts:["name","company","email","status"], companies:["name","industry","contacts"], leads:["name","owner","source","status"], deals:["name","company","value","stage"], tasks:["title","due","owner","status"]
  }[view];
  document.getElementById("modal-title").textContent = `Add ${view.slice(0,-1)}`;
  document.getElementById("record-form").innerHTML = `<div class="form-grid">${fields.map(f=>`<label>${f[0].toUpperCase()+f.slice(1)}<input name="${f}" required></label>`).join("")}<button class="primary-btn" type="submit">Save record</button></div>`;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("record-form").onsubmit = e => { e.preventDefault(); const fd = new FormData(e.target); const obj = Object.fromEntries(fd.entries()); if(view==="deals") obj.value=Number(obj.value||0); if(view==="companies") obj.contacts=Number(obj.contacts||0); data[view].push(obj); save(); closeModal(); render(); };
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

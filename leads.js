// Leads module enhancement: qualification and conversion workflow.
(function () {
  data.leads = data.leads.map((lead, i) => ({ id: lead.id || Date.now() + i, ...lead }));
  save();

  window.renderLeads = function (filter = "", status = "All") {
    const rows = data.leads.filter(l =>
      Object.values(l).some(v => String(v).toLowerCase().includes(filter.toLowerCase())) &&
      (status === "All" || l.status === status)
    );
    const counts = ["New", "Qualified", "Won", "Lost"].map(s => ({ status: s, count: data.leads.filter(l => l.status === s).length }));

    app.innerHTML = `
      <div class="lead-summary">
        ${counts.map(x => `<div class="mini-stat"><span>${x.status}</span><strong>${x.count}</strong></div>`).join("")}
      </div>
      <div class="toolbar">
        <div class="toolbar-left">
          <input class="search" id="lead-search" placeholder="Search leads by name, owner or source..." value="${esc(filter)}">
          <select class="select" id="lead-status">
            <option>All</option>
            ${["New", "Qualified", "Won", "Lost"].map(s => `<option ${status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <button class="primary-btn" data-add="leads">+ Add lead</button>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2>${rows.length} lead${rows.length === 1 ? "" : "s"}</h2>
            <span class="panel-subtitle">Capture, qualify and convert new business opportunities</span>
          </div>
        </div>
        ${rows.length ? `
          <table>
            <thead><tr><th>Lead</th><th>Owner</th><th>Source</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${rows.map(l => `
                <tr>
                  <td><strong>${esc(l.name)}</strong></td>
                  <td>${esc(l.owner)}</td>
                  <td>${esc(l.source)}</td>
                  <td><span class="badge lead-${String(l.status).toLowerCase()}">${esc(l.status)}</span></td>
                  <td><div class="row-actions">
                    ${l.status === "New" ? `<button class="icon-btn" data-lead-qualify="${l.id}">Qualify</button>` : ""}
                    ${l.status === "Qualified" ? `<button class="icon-btn" data-lead-convert="${l.id}">Convert to deal</button>` : ""}
                    <button class="icon-btn" data-lead-edit="${l.id}">Edit</button>
                  </div></td>
                </tr>`).join("")}
            </tbody>
          </table>` : `<div class="empty">No leads found. Add your first lead to start the sales process.</div>`}
      </div>`;

    document.getElementById("lead-search").addEventListener("input", e =>
      window.renderLeads(e.target.value, document.getElementById("lead-status").value)
    );
    document.getElementById("lead-status").addEventListener("change", e =>
      window.renderLeads(document.getElementById("lead-search").value, e.target.value)
    );
  };

  function qualifyLead(id) {
    const lead = data.leads.find(l => String(l.id) === String(id));
    if (!lead) return;
    lead.status = "Qualified";
    data.activities.unshift({ text: `${lead.name} was qualified`, time: "Just now" });
    save();
    window.renderLeads();
  }

  function convertLead(id) {
    const lead = data.leads.find(l => String(l.id) === String(id));
    if (!lead) return;

    const companyName = lead.name;
    if (!data.companies.some(c => c.name === companyName)) {
      data.companies.unshift({
        id: Date.now(),
        name: companyName,
        industry: "",
        website: "",
        phone: "",
        location: "",
        status: "Prospect",
        notes: "Created automatically from a qualified lead."
      });
    }

    data.deals.unshift({
      name: `${companyName} opportunity`,
      company: companyName,
      value: 0,
      stage: "New"
    });
    lead.status = "Won";
    data.activities.unshift({ text: `${companyName} was converted into an opportunity`, time: "Just now" });
    save();
    window.renderLeads();
  }

  // One delegated listener handles the new lead actions without disturbing the existing CRM handlers.
  document.addEventListener("click", e => {
    const qualify = e.target.closest("[data-lead-qualify]");
    if (qualify) return qualifyLead(qualify.dataset.leadQualify);

    const convert = e.target.closest("[data-lead-convert]");
    if (convert) return convertLead(convert.dataset.leadConvert);

    const edit = e.target.closest("[data-lead-edit]");
    if (edit) return openModal("leads", edit.dataset.leadEdit);
  });

  const originalRender = window.render;
  window.render = function () {
    if (currentView === "leads") {
      title.textContent = "Leads";
      document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === "leads"));
      return window.renderLeads();
    }
    return originalRender();
  };

  // Re-render once after this enhancement script loads.
  if (currentView === "leads") window.renderLeads();
})();

(() => {
  const KEY = "crm-demo-data";
  const getData = () => {
    const data = JSON.parse(localStorage.getItem(KEY) || "{}");
    data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
    data.activities = Array.isArray(data.activities) ? data.activities : [];
    data.contacts = Array.isArray(data.contacts) ? data.contacts : [];
    data.companies = Array.isArray(data.companies) ? data.companies : [];
    data.deals = Array.isArray(data.deals) ? data.deals : [];
    return data;
  };
  const saveData = data => localStorage.setItem(KEY, JSON.stringify(data));
  const esc = value => String(value ?? "").replace(/[&<>\"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
  const options = (items, selected = "") => items.map(x => `<option value="${esc(x)}" ${x === selected ? "selected" : ""}>${esc(x)}</option>`).join("");
  const relatedOptions = (data, selectedType = "", selectedName = "") => {
    const items = [];
    if (selectedType === "Contact") data.contacts.forEach(x => items.push(x.name));
    if (selectedType === "Company") data.companies.forEach(x => items.push(x.name));
    if (selectedType === "Deal") data.deals.forEach(x => items.push(x.name));
    return options(items, selectedName);
  };
  const addActivity = (data, activity) => data.activities.unshift({ id: Date.now() + Math.random(), date: new Date().toISOString(), ...activity });

  function renderTasks() {
    const data = getData();
    const app = document.getElementById("app");
    const search = document.getElementById("task-search")?.value?.toLowerCase() || "";
    const status = document.getElementById("task-status")?.value || "All";
    const tasks = data.tasks.filter(t => (!search || `${t.title} ${t.owner} ${t.relatedName || ""}`.toLowerCase().includes(search)) && (status === "All" || t.status === status));
    const activities = data.activities.slice(0, 12);
    app.innerHTML = `
      <div class="dashboard-head"><div><p class="eyebrow">WORK MANAGEMENT</p><h2>Tasks & Activities</h2><p class="muted">Keep follow-ups, meetings and customer touchpoints in one place.</p></div><button class="primary-btn" data-add="tasks">+ New task</button></div>
      <div class="dashboard-grid">
        <div class="card">
          <div class="section-head"><h3>Tasks</h3><div class="toolbar"><input id="task-search" class="search-input" placeholder="Search tasks..." value="${esc(search)}"><select id="task-status" class="filter-select"><option>All</option><option ${status === "Open" ? "selected" : ""}>Open</option><option ${status === "Done" ? "selected" : ""}>Done</option></select></div></div>
          <div class="task-list">${tasks.length ? tasks.map(taskCard).join("") : '<p class="empty-state">No tasks match your filters.</p>'}</div>
        </div>
        <div class="card">
          <div class="section-head"><h3>Recent activities</h3><button class="ghost-btn" data-add-activity>+ Activity</button></div>
          <div class="mini-list">${activities.length ? activities.map(activityCard).join("") : '<p class="empty-state">No activities yet.</p>'}</div>
        </div>
      </div>`;
    document.getElementById("task-search")?.addEventListener("input", renderTasks);
    document.getElementById("task-status")?.addEventListener("change", renderTasks);
  }

  function taskCard(t) {
    const overdue = t.status !== "Done" && t.due && /^\d{4}-\d{2}-\d{2}$/.test(t.due) && t.due < new Date().toISOString().slice(0,10);
    return `<div class="task-item"><div><strong>${esc(t.title)}</strong><p>${esc(t.owner || "Unassigned")} · ${esc(t.due || "No due date")} ${t.relatedName ? `· ${esc(t.relatedName)}` : ""}</p>${t.notes ? `<small>${esc(t.notes)}</small>` : ""}</div><div class="task-actions"><span class="badge ${t.status === "Done" ? "badge-green" : overdue ? "badge-red" : "badge-blue"}">${overdue ? "Overdue" : esc(t.status)}</span><span class="badge">${esc(t.priority || "Normal")}</span><button class="ghost-btn" data-task-edit="${t.id}">Edit</button>${t.status !== "Done" ? `<button class="ghost-btn" data-task-done="${t.id}">Done</button>` : ""}<button class="ghost-btn danger" data-task-delete="${t.id}">Delete</button></div></div>`;
  }

  function activityCard(a) {
    const date = a.date ? new Date(a.date) : null;
    return `<div class="mini-list-item"><div><strong>${esc(a.subject || a.text || "Activity")}</strong><p>${esc(a.type || "Note")} ${a.relatedName ? `· ${esc(a.relatedName)}` : ""}</p>${a.notes ? `<small>${esc(a.notes)}</small>` : ""}</div><span class="muted">${date && !isNaN(date) ? date.toLocaleDateString() : esc(a.date || "")}</span></div>`;
  }

  function openTaskModal(id = null) {
    const data = getData();
    const task = data.tasks.find(x => String(x.id) === String(id));
    const modal = document.getElementById("modal"), title = document.getElementById("modal-title"), form = document.getElementById("record-form");
    title.textContent = task ? "Edit task" : "New task";
    form.innerHTML = `
      <label>Title<input name="title" required value="${esc(task?.title)}"></label>
      <div class="form-grid"><label>Due date<input name="due" type="date" value="${esc(task?.due)}"></label><label>Owner<input name="owner" value="${esc(task?.owner || "Sales Team")}"></label></div>
      <div class="form-grid"><label>Status<select name="status">${options(["Open","Done"], task?.status || "Open")}</select></label><label>Priority<select name="priority">${options(["Low","Normal","High","Urgent"], task?.priority || "Normal")}</select></label></div>
      <div class="form-grid"><label>Related to<select name="relatedType"><option value="">None</option>${options(["Contact","Company","Deal"], task?.relatedType || "")}</select></label><label>Record<select name="relatedName"><option value="">Select record</option>${relatedOptions(data, task?.relatedType, task?.relatedName)}</select></label></div>
      <label>Notes<textarea name="notes">${esc(task?.notes)}</textarea></label><button class="primary-btn" type="submit">${task ? "Save changes" : "Create task"}</button>`;
    const type = form.querySelector('[name="relatedType"]'), record = form.querySelector('[name="relatedName"]');
    type.addEventListener("change", () => { record.innerHTML = `<option value="">Select record</option>${relatedOptions(data, type.value, "")}`; });
    form.onsubmit = e => {
      e.preventDefault(); const fd = new FormData(form); const payload = Object.fromEntries(fd.entries());
      if (task) Object.assign(task, payload); else data.tasks.unshift({ id: Date.now(), ...payload });
      if (payload.status === "Done" && (!task || task.status !== "Done")) addActivity(data, { type: "Task", subject: `Task completed: ${payload.title}`, relatedType: payload.relatedType, relatedName: payload.relatedName, notes: "" });
      saveData(data); closeModal(); renderTasks();
    };
    modal.classList.remove("hidden"); modal.setAttribute("aria-hidden", "false");
  }

  function openActivityModal() {
    const data = getData();
    const modal = document.getElementById("modal"), title = document.getElementById("modal-title"), form = document.getElementById("record-form");
    title.textContent = "Add activity";
    form.innerHTML = `<label>Subject<input name="subject" required placeholder="e.g. Discovery call with customer"></label><div class="form-grid"><label>Type<select name="type">${options(["Call","Email","Meeting","Note"], "Call")}</select></label><label>Date/time<input name="date" type="datetime-local" value="${new Date().toISOString().slice(0,16)}"></label></div><div class="form-grid"><label>Related to<select name="relatedType"><option value="">None</option>${options(["Contact","Company","Deal"])}</select></label><label>Record<select name="relatedName"><option value="">Select record</option></select></label></div><label>Notes<textarea name="notes"></textarea></label><button class="primary-btn" type="submit">Add activity</button>`;
    const type = form.querySelector('[name="relatedType"]'), record = form.querySelector('[name="relatedName"]');
    type.addEventListener("change", () => { record.innerHTML = `<option value="">Select record</option>${relatedOptions(data, type.value, "")}`; });
    form.onsubmit = e => { e.preventDefault(); const fd = new FormData(form); const payload = Object.fromEntries(fd.entries()); addActivity(data, payload); saveData(data); closeModal(); renderTasks(); };
    modal.classList.remove("hidden"); modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() { const modal = document.getElementById("modal"); modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); }

  document.addEventListener("click", e => {
    const nav = e.target.closest('[data-view="tasks"]');
    if (nav) { e.preventDefault(); e.stopImmediatePropagation(); document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active")); nav.classList.add("active"); document.getElementById("page-title").textContent = "Tasks"; renderTasks(); return; }
    if (e.target.closest('[data-add="tasks"]')) { e.preventDefault(); e.stopImmediatePropagation(); openTaskModal(); return; }
    if (e.target.closest("[data-add-activity]")) { e.preventDefault(); e.stopImmediatePropagation(); openActivityModal(); return; }
    const edit = e.target.closest("[data-task-edit]"); if (edit) { e.preventDefault(); e.stopImmediatePropagation(); openTaskModal(edit.dataset.taskEdit); return; }
    const done = e.target.closest("[data-task-done]"); if (done) { e.preventDefault(); e.stopImmediatePropagation(); const data=getData(); const task=data.tasks.find(x=>String(x.id)===String(done.dataset.taskDone)); if(task){task.status="Done"; addActivity(data,{type:"Task",subject:`Task completed: ${task.title}`,relatedType:task.relatedType,relatedName:task.relatedName,notes:""}); saveData(data); renderTasks();} return; }
    const del = e.target.closest("[data-task-delete]"); if (del) { e.preventDefault(); e.stopImmediatePropagation(); const data=getData(); data.tasks=data.tasks.filter(x=>String(x.id)!==String(del.dataset.taskDelete)); saveData(data); renderTasks(); return; }
  }, true);

  window.renderTasksV07 = renderTasks;
})();

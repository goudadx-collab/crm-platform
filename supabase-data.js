// v1.2 Supabase data layer
// Keeps the existing UI modules intact while moving CRM records from localStorage to Supabase.
// RLS enforces that authenticated users only see their own rows.

(function () {
  const TABLES = ["companies", "contacts", "leads", "deals", "tasks", "activities"];
  let syncing = false;
  let queued = false;
  let ready = false;

  function client() {
    return window.crmSupabase || null;
  }

  function uid() {
    return crypto.randomUUID();
  }

  function ensureIds() {
    const idMaps = {};
    ["companies", "contacts", "leads", "deals", "tasks", "activities"].forEach(type => {
      idMaps[type] = new Map();
      data[type] = (data[type] || []).map(row => {
        const oldId = row.id;
        const newId = (typeof oldId === "string" && oldId.includes("-")) ? oldId : uid();
        if (oldId !== undefined && oldId !== null) idMaps[type].set(String(oldId), newId);
        return { ...row, id: newId };
      });
    });

    data.tasks = data.tasks.map(t => ({
      ...t,
      contact_id: t.contact_id ? (idMaps.contacts.get(String(t.contact_id)) || t.contact_id) : null,
      company_id: t.company_id ? (idMaps.companies.get(String(t.company_id)) || t.company_id) : null,
      deal_id: t.deal_id ? (idMaps.deals.get(String(t.deal_id)) || t.deal_id) : null
    }));
    data.leads = data.leads.map(l => ({
      ...l,
      company_id: l.company_id ? (idMaps.companies.get(String(l.company_id)) || l.company_id) : null
    }));
    data.contacts = data.contacts.map(c => ({
      ...c,
      company_id: c.company_id ? (idMaps.companies.get(String(c.company_id)) || c.company_id) : null
    }));
    data.deals = data.deals.map(d => ({
      ...d,
      company_id: d.company_id ? (idMaps.companies.get(String(d.company_id)) || d.company_id) : null
    }));
    data.activities = data.activities.map(a => ({
      ...a,
      contact_id: a.contact_id ? (idMaps.contacts.get(String(a.contact_id)) || a.contact_id) : null,
      company_id: a.company_id ? (idMaps.companies.get(String(a.company_id)) || a.company_id) : null,
      deal_id: a.deal_id ? (idMaps.deals.get(String(a.deal_id)) || a.deal_id) : null
    }));
  }

  function companyIdByName(name) {
    const company = data.companies.find(c => c.name === name);
    return company ? company.id : null;
  }

  function toDb() {
    const ownerId = client().auth.getUser ? null : null;
    return {
      companies: data.companies.map(c => ({ id: c.id, name: c.name, industry: c.industry || null, website: c.website || null, phone: c.phone || null, location: c.location || null, status: c.status || "Active", notes: c.notes || null })),
      contacts: data.contacts.map(c => ({ id: c.id, company_id: c.company_id || companyIdByName(c.company) || null, name: c.name, email: c.email || null, phone: c.phone || null, job_title: c.jobTitle || null, status: c.status || "Prospect", notes: c.notes || null })),
      leads: data.leads.map(l => ({ id: l.id, name: l.name, owner_name: l.owner || l.owner_name || null, source: l.source || null, status: l.status || "New", company_id: l.company_id || null, notes: l.notes || null })),
      deals: data.deals.map(d => ({ id: d.id, company_id: d.company_id || companyIdByName(d.company) || null, name: d.name, value: Number(d.value || 0), stage: d.stage || "New", expected_close_date: d.expected_close_date || d.expectedCloseDate || null, owner_name: d.owner || d.owner_name || null, notes: d.notes || null })),
      tasks: data.tasks.map(t => ({ id: t.id, title: t.title, due_date: t.due_date || null, owner_name: t.owner || t.owner_name || null, status: t.status || "Open", priority: t.priority || "Normal", contact_id: t.contact_id || null, company_id: t.company_id || null, deal_id: t.deal_id || null, notes: t.notes || null })),
      activities: data.activities.map(a => ({ id: a.id, type: a.type || "Note", text: a.text, contact_id: a.contact_id || null, company_id: a.company_id || null, deal_id: a.deal_id || null }))
    };
  }

  async function currentUser() {
    const { data: result, error } = await client().auth.getUser();
    if (error) throw error;
    return result.user;
  }

  async function replaceTable(table, rows, ownerId) {
    const { error: delError } = await client().from(table).delete().eq("owner_id", ownerId);
    if (delError) throw delError;
    if (!rows.length) return;
    const payload = rows.map(row => ({ ...row, owner_id: ownerId }));
    const { error } = await client().from(table).insert(payload);
    if (error) throw error;
  }

  async function pushNow() {
    if (!ready || !client() || syncing) {
      queued = true;
      return;
    }
    syncing = true;
    queued = false;
    try {
      const user = await currentUser();
      if (!user) return;
      ensureIds();
      const db = toDb();
      // Delete dependents before parents to respect foreign keys.
      for (const table of ["activities", "tasks", "deals", "leads", "contacts", "companies"]) {
        await replaceTable(table, db[table], user.id);
      }
      localStorage.setItem("crm-demo-data", JSON.stringify(data));
    } catch (error) {
      console.error("Supabase sync failed:", error);
      window.crmCloudLastError = error;
    } finally {
      syncing = false;
      if (queued) pushNow();
    }
  }

  async function pullNow() {
    const user = await currentUser();
    if (!user) return false;
    const result = {};
    for (const table of TABLES) {
      const { data: rows, error } = await client().from(table).select("*").eq("owner_id", user.id);
      if (error) throw error;
      result[table] = rows || [];
    }
    const hasCloudData = TABLES.some(t => result[t].length);
    if (!hasCloudData) {
      ensureIds();
      ready = true;
      await pushNow();
      return true;
    }

    data.companies = result.companies.map(c => ({ id: c.id, name: c.name, industry: c.industry || "", website: c.website || "", phone: c.phone || "", location: c.location || "", status: c.status || "Active", notes: c.notes || "" }));
    data.contacts = result.contacts.map(c => ({ id: c.id, name: c.name, company: (data.companies.find(x => x.id === c.company_id) || {}).name || "", company_id: c.company_id, email: c.email || "", phone: c.phone || "", jobTitle: c.job_title || "", status: c.status || "Prospect", notes: c.notes || "" }));
    data.leads = result.leads.map(l => ({ id: l.id, name: l.name, owner: l.owner_name || "", owner_name: l.owner_name || "", source: l.source || "", status: l.status || "New", company_id: l.company_id, notes: l.notes || "" }));
    data.deals = result.deals.map(d => ({ id: d.id, name: d.name, company: (data.companies.find(x => x.id === d.company_id) || {}).name || "", company_id: d.company_id, value: Number(d.value || 0), stage: d.stage || "New", expected_close_date: d.expected_close_date, expectedCloseDate: d.expected_close_date, owner: d.owner_name || "", owner_name: d.owner_name || "", notes: d.notes || "" }));
    data.tasks = result.tasks.map(t => ({ id: t.id, title: t.title, due: t.due_date || "", due_date: t.due_date, owner: t.owner_name || "", owner_name: t.owner_name || "", status: t.status || "Open", priority: t.priority || "Normal", contact_id: t.contact_id, company_id: t.company_id, deal_id: t.deal_id, notes: t.notes || "" }));
    data.activities = result.activities.map(a => ({ id: a.id, type: a.type || "Note", text: a.text, contact_id: a.contact_id, company_id: a.company_id, deal_id: a.deal_id, time: new Date(a.created_at).toLocaleDateString() }));
    localStorage.setItem("crm-demo-data", JSON.stringify(data));
    ready = true;
    return true;
  }

  async function initForUser() {
    if (!client()) return;
    try {
      await pullNow();
      if (typeof renderView === "function") renderView(currentView);
    } catch (error) {
      console.error("Supabase data load failed:", error);
      window.crmCloudLastError = error;
    }
  }

  window.crmCloud = { initForUser, pushNow, isReady: () => ready };

  const originalSave = window.save;
  window.save = function () {
    if (typeof originalSave === "function") originalSave();
    pushNow();
  };
})();

/* Ashlar — construction marketplace demo. */
(function () {
  const Store = window.AshlarStore;
  const CATEGORIES = [
    "Full project",
    "Core & shell",
    "Interior fit-out",
    "Structural",
    "Concrete",
    "MEP",
    "Envelope",
    "Civil & site",
  ];
  const TRADES = [
    "General contractor",
    "Structural steel",
    "Civil & site",
    "Mechanical & electrical",
    "Interior fit-out",
    "Concrete",
    "Building envelope",
    "Glazing",
    "Demolition",
  ];
  const CODES = {
    "Full project": "FUL",
    "Core & shell": "CSH",
    "Interior fit-out": "INT",
    Structural: "STR",
    Concrete: "CON",
    MEP: "MEP",
    Envelope: "ENV",
    "Civil & site": "CIV",
  };

  const state = {
    data: null,
    session: null,
    route: "login",
    id: null,
    pending: null,
    shellKey: "",
    animKey: "",
    mine: "all",
    adminStatus: "all",
    filters: {
      q: "",
      category: "all",
      city: "all",
      budget: "all",
      sort: "newest",
      directory: "",
    },
    overlay: null,
  };

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function money(n) {
    const abs = Math.abs(n);
    if (abs >= 1000000) {
      const m = n / 1000000;
      const text = m >= 10 ? m.toFixed(1) : m.toFixed(2);
      return `$${text.replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1")}M`;
    }
    if (abs >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${Math.round(n)}`;
  }

  function moneyFull(n) {
    return Number(n).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function durationLabel(weeks) {
    const w = Number(weeks);
    if (w >= 20) {
      const months = Math.max(1, Math.round(w / 4.345));
      return `${months} month${months === 1 ? "" : "s"}`;
    }
    return `${w} week${w === 1 ? "" : "s"}`;
  }

  function timeAgo(iso) {
    const seconds = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 86400 * 2) return "Yesterday";
    if (seconds < 86400 * 14) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function uid(prefix) {
    state.data.seq += 1;
    return `${prefix}${state.data.seq}`;
  }

  function persist() {
    Store.saveData(state.data);
  }

  function company(id) {
    return state.data.companies.find((item) => item.id === id) || null;
  }

  function project(id) {
    return state.data.projects.find((item) => item.id === id) || null;
  }

  function currentCompany() {
    if (state.session?.role !== "company") return null;
    return company(state.session.companyId);
  }

  function audience() {
    if (!state.session) return null;
    return state.session.role === "admin" ? "admin" : state.session.companyId;
  }

  function proposalsFor(projectId) {
    return state.data.proposals.filter((item) => item.projectId === projectId);
  }

  function activeProposals(projectId) {
    return proposalsFor(projectId).filter((item) => item.status === "submitted" || item.status === "accepted");
  }

  function myProposal(projectId) {
    const me = currentCompany();
    if (!me) return null;
    return state.data.proposals.find((item) => item.projectId === projectId && item.companyId === me.id) || null;
  }

  function notesForMe() {
    const who = audience();
    return state.data.notifications
      .filter((item) => item.for === who)
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  function unreadCount() {
    return notesForMe().filter((item) => !item.read).length;
  }

  function notify(target, title, body, path, read) {
    state.data.notifications.unshift({
      id: uid("n"),
      for: target,
      title,
      body,
      path,
      at: new Date().toISOString(),
      read: Boolean(read),
    });
  }

  function mono(name) {
    const parts = String(name).split(/\s+/).filter((word) => /^[A-Za-z]/.test(word));
    return ((parts[0]?.[0] || "C") + (parts[1]?.[0] || "")).toUpperCase();
  }

  function statusChip(status) {
    const map = {
      open: ["lime", "Open"],
      draft: ["sand", "Draft"],
      awarded: ["mint", "Awarded"],
      closed: ["", "Closed"],
      pending: ["sand", "Pending"],
      active: ["lime", "Active"],
      suspended: ["rose", "Suspended"],
      submitted: ["lime", "In review"],
      accepted: ["mint", "Accepted"],
      declined: ["", "Declined"],
      withdrawn: ["", "Withdrawn"],
    };
    const [tone, label] = map[status] || ["", status];
    return `<span class="chip ${tone}">${esc(label)}</span>`;
  }

  function svg(paths) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  const icon = {
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    folder: svg('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10z"/>'),
    compass: svg('<circle cx="12" cy="12" r="9"/><path d="m14.8 9.2-1.3 4.3-4.3 1.3 1.3-4.3 4.3-1.3z"/>'),
    users: svg('<path d="M16 20v-1.2A3.8 3.8 0 0 0 12.2 15H7.8A3.8 3.8 0 0 0 4 18.8V20"/><circle cx="10" cy="8" r="3"/><path d="M20 20v-1.2A3.8 3.8 0 0 0 17 15.2"/><path d="M16 5.1a3 3 0 0 1 0 5.8"/>'),
    bell: svg('<path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7"/><path d="M10 19a2 2 0 0 0 4 0"/>'),
    building: svg('<path d="M4 20h16"/><path d="M6 20V5.5A1.5 1.5 0 0 1 7.5 4h9A1.5 1.5 0 0 1 18 5.5V20"/><path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01M10 20v-3h4v3"/>'),
    shield: svg('<path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-3z"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    logout: svg('<path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17"/><path d="M4 12h11M12 8l4 4-4 4"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    star: svg('<path d="m12 3 2.4 5.4 5.9.7-4.4 3.9 1.2 5.8L12 16.8 6.9 18.8l1.2-5.8L3.7 9.1l5.9-.7L12 3z"/>'),
  };

  const logo = `<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="9" width="16" height="16" rx="3" fill="#d6f25c"/><rect x="13" y="5" width="16" height="16" rx="3" fill="#07111c" stroke="#d6f25c" stroke-width="2"/></svg>`;

  function brand() {
    return `<a class="brand" href="#/${state.session?.role === "admin" ? "admin" : "home"}">${logo}<span><strong>ASHLAR</strong><small>Marketplace</small></span></a>`;
  }

  function showToast(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    document.getElementById("toasts").appendChild(el);
    setTimeout(() => el.classList.add("out"), 2800);
    setTimeout(() => el.remove(), 3200);
  }

  function openProjects() {
    return state.data.projects.filter((item) => item.status === "open" && company(item.ownerId)?.status === "active");
  }

  function budgetOk(item) {
    const band = state.filters.budget;
    if (band === "all") return true;
    const mid = (item.budgetMin + item.budgetMax) / 2;
    if (band === "under1") return mid < 1000000;
    if (band === "1to5") return mid >= 1000000 && mid < 5000000;
    if (band === "5to15") return mid >= 5000000 && mid < 15000000;
    return mid >= 15000000;
  }

  function marketProjects() {
    const q = state.filters.q.trim().toLowerCase();
    let list = openProjects().filter((item) => {
      const owner = company(item.ownerId);
      const hay = `${item.title} ${item.city} ${item.category} ${item.summary} ${owner?.name || ""}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (state.filters.category !== "all" && item.category !== state.filters.category) return false;
      if (state.filters.city !== "all" && item.city !== state.filters.city) return false;
      return budgetOk(item);
    });
    const sort = state.filters.sort;
    list.sort((a, b) => {
      if (sort === "budget") return b.budgetMax - a.budgetMax;
      if (sort === "proposals") return activeProposals(a.id).length - activeProposals(b.id).length;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return list;
  }

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    if (!raw) return { name: state.session ? (state.session.role === "admin" ? "admin" : "home") : "login", id: null };
    const [name, id] = raw.split("/");
    return { name, id: id || null };
  }

  function go(path) {
    const next = `#/${String(path).replace(/^#\/?/, "")}`;
    if (location.hash === next) {
      state.overlay = null;
      const parsed = parseHash();
      state.route = parsed.name;
      state.id = parsed.id;
      render();
    } else {
      location.hash = next;
    }
  }

  function syncRoute() {
    let { name, id } = parseHash();
    const known = new Set(["home", "projects", "market", "project", "profile", "company", "companies", "alerts", "admin", "login", "join"]);
    if (!known.has(name)) name = state.session ? "home" : "login";

    if (!state.session) {
      if (name !== "login" && name !== "join") state.pending = id ? `${name}/${id}` : name;
      state.route = name === "join" ? "join" : "login";
      state.id = null;
      state.overlay = null;
      render();
      return;
    }

    if (name === "login" || name === "join") {
      location.hash = state.session.role === "admin" ? "#/admin" : "#/home";
      return;
    }
    if (state.session.role === "company" && name === "admin") {
      location.hash = "#/home";
      return;
    }
    if (state.session.role === "admin" && (name === "home" || name === "profile")) {
      location.hash = "#/admin";
      return;
    }

    const changed = state.route !== name || state.id !== id;
    if (changed) {
      state.overlay = null;
      state.editing = false;
    }
    state.route = name;
    state.id = id;
    render();
  }

  function enter(session, fallback) {
    state.session = session;
    Store.saveSession(session);
    let dest = state.pending || fallback;
    state.pending = null;
    if (session.role === "admin" && ["home", "profile", "projects"].includes(dest)) dest = "admin";
    if (session.role === "company" && dest === "admin") dest = "home";
    const next = `#/${dest}`;
    if (location.hash === next) syncRoute();
    else location.hash = next;
  }

  function shellKey() {
    if (!state.session) return "auth";
    return state.session.role === "admin" ? "admin" : "company";
  }

  function navItems() {
    if (state.session?.role === "admin") {
      return [
        ["admin", "Overview", icon.shield],
        ["projects", "Projects", icon.folder],
        ["market", "Marketplace", icon.compass],
        ["companies", "Companies", icon.users],
        ["alerts", "Alerts", icon.bell],
      ];
    }
    return [
      ["home", "Overview", icon.grid],
      ["projects", "My projects", icon.folder],
      ["market", "Marketplace", icon.compass],
      ["companies", "Companies", icon.users],
      ["alerts", "Alerts", icon.bell],
      ["profile", "Profile", icon.building],
    ];
  }

  function navKey() {
    if (state.route === "project") {
      const item = project(state.id);
      const me = currentCompany();
      if (me && item && item.ownerId === me.id) return "projects";
      return "market";
    }
    if (state.route === "company") return "companies";
    return state.route;
  }

  function crumb() {
    const titles = {
      home: "Overview",
      projects: state.session?.role === "admin" ? "All projects" : "My projects",
      market: "Marketplace",
      project: "Project",
      profile: "Profile",
      company: "Company",
      companies: "Companies",
      alerts: "Alerts",
      admin: "Admin",
    };
    return titles[state.route] || "Ashlar";
  }

  function renderShell() {
    const me = currentCompany();
    const who = me
      ? `<a class="who" href="#/profile"><span class="mono" id="side-mono">${esc(mono(me.name))}</span><span><strong id="side-name">${esc(me.name)}</strong><small id="side-trade">${esc(me.city)}</small></span></a>`
      : `<a class="who" href="#/admin"><span class="mono">AD</span><span><strong>Admin</strong><small>Ashlar</small></span></a>`;
    const links = navItems().map(([path, label, glyph]) => {
      const badge = path === "alerts" ? `<span class="badge js-alert-count" hidden>0</span>` : "";
      return `<a class="nav-link" href="#/${path}" data-nav="${path}">${glyph}<span>${label}</span>${badge}</a>`;
    }).join("");
    const profileHref = me ? "#/profile" : "#/admin";
    return `
      <div class="shell">
        <aside class="sidebar" id="sidebar">
          ${brand()}
          <nav class="nav">${links}</nav>
          <div class="side-foot">
            ${who}
            <button class="quiet" type="button" data-action="ask-restore">Restore demo</button>
            <button class="btn btn-ghost btn-small" type="button" data-action="sign-out">${icon.logout} Sign out</button>
          </div>
        </aside>
        <div class="scrim" data-action="close-nav"></div>
        <div class="main">
          <header class="topbar">
            <button class="icon-btn menu-btn" type="button" data-action="toggle-nav" aria-label="Open menu">${icon.menu}</button>
            <p class="crumb" id="crumb">${esc(crumb())}</p>
            <div class="top-actions">
              <a class="icon-btn" href="#/alerts" aria-label="Alerts">${icon.bell}<span class="badge js-alert-count" hidden>0</span></a>
              <a class="who" href="${profileHref}">${whoInner(me)}</a>
            </div>
          </header>
          <div id="view" class="view"></div>
        </div>
      </div>`;
  }

  function whoInner(me) {
    if (!me) return `<span class="mono">AD</span><span><strong>Admin</strong><small>Console</small></span>`;
    return `<span class="mono" id="top-mono">${esc(mono(me.name))}</span><span><strong id="top-name">${esc(me.name)}</strong><small id="top-trade">${esc(me.trade)}</small></span>`;
  }

  function renderAuthShell() {
    const open = openProjects();
    const scope = open.reduce((sum, item) => sum + (item.budgetMin + item.budgetMax) / 2, 0);
    const active = state.data.companies.filter((item) => item.status === "active").length;
    const rows = open.slice(0, 4).map((item) => `<li><span>${esc(item.city)}</span><strong>${esc(item.title)}</strong></li>`).join("");
    return `
      <div class="auth">
        <section class="auth-hero">
          <div>
            ${brand()}
            <div style="margin-top:48px">
              <p class="eyebrow">Construction marketplace</p>
              <h1>Find the company.<br>Award the work.</h1>
              <p class="lede">Ashlar connects construction companies that need a project delivered with firms ready to take it on.</p>
              <div class="hero-stats">
                <div><strong>${open.length}</strong><span>Open projects</span></div>
                <div><strong>${active}</strong><span>Active companies</span></div>
                <div><strong>${esc(money(scope))}</strong><span>Open scope</span></div>
              </div>
            </div>
          </div>
          <div>
            <p class="eyebrow">Live now</p>
            <ul class="live">${rows}</ul>
          </div>
        </section>
        <section class="auth-panel"><div id="view"></div></section>
      </div>`;
  }

  function render() {
    const key = shellKey();
    const app = document.getElementById("app");
    if (state.shellKey !== key) {
      app.innerHTML = key === "auth" ? renderAuthShell() : renderShell();
      state.shellKey = key;
    }
    const view = document.getElementById("view");
    const active = document.activeElement;
    const filterKey = active?.getAttribute?.("data-filter");
    const pos = active?.selectionStart;
    const animKey = `${key}:${state.route}:${state.id || ""}`;
    const animate = animKey !== state.animKey;
    state.animKey = animKey;
    if (view) view.innerHTML = renderRoute(animate) + renderOverlay();
    if (state.overlay) document.querySelector(".overlay [data-autofocus]")?.focus();
    else if (filterKey) {
      const next = document.querySelector(`[data-filter="${CSS.escape(filterKey)}"]`);
      if (next) {
        next.focus();
        try { next.setSelectionRange(pos, pos); } catch (err) { /* number inputs */ }
      }
    }
    updateChrome();
    const main = document.querySelector(".main");
    if (animate && main) main.scrollTop = 0;
    document.getElementById("sidebar")?.classList.remove("open");
    document.title = `${crumb()} · Ashlar`;
  }

  function updateChrome() {
    document.querySelectorAll("[data-nav]").forEach((el) => {
      el.classList.toggle("active", el.dataset.nav === navKey());
    });
    const count = state.session ? unreadCount() : 0;
    document.querySelectorAll(".js-alert-count").forEach((el) => {
      el.hidden = count === 0;
      el.textContent = String(count);
    });
    const crumbEl = document.getElementById("crumb");
    if (crumbEl) crumbEl.textContent = crumb();
    const me = currentCompany();
    if (me) {
      const pairs = [["side-name", me.name], ["top-name", me.name], ["side-trade", me.city], ["top-trade", me.trade], ["side-mono", mono(me.name)], ["top-mono", mono(me.name)]];
      pairs.forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      });
    }
  }

  function renderRoute(animate) {
    const wrap = (html) => `<div class="${animate ? "page rise" : "page"}">${html}</div>`;
    if (!state.session) {
      return state.route === "join" ? renderJoin() : renderLogin();
    }
    if (state.session.role === "admin") {
      if (state.route === "projects") return wrap(renderAdminProjects());
      if (state.route === "companies") return wrap(renderAdminCompanies());
      if (state.route === "market") return wrap(renderMarket());
      if (state.route === "project") return wrap(renderProject());
      if (state.route === "company") return wrap(renderCompany(state.id, false));
      if (state.route === "alerts") return wrap(renderAlerts());
      return wrap(renderAdmin());
    }
    if (state.route === "projects") return wrap(renderMine());
    if (state.route === "market") return wrap(renderMarket());
    if (state.route === "project") return wrap(renderProject());
    if (state.route === "profile") return wrap(renderCompany(state.session.companyId, true));
    if (state.route === "company") return wrap(renderCompany(state.id, false));
    if (state.route === "companies") return wrap(renderDirectory());
    if (state.route === "alerts") return wrap(renderAlerts());
    if (state.route === "home") return wrap(renderHome());
    return wrap(emptyState("Page not found", "That view is not part of this demo."));
  }

  function renderLogin() {
    return `
      <div class="auth-card">
        <p class="eyebrow">Welcome back</p>
        <h2>Enter workspace</h2>
        <p class="ready"><span class="dot"></span>Sample access is filled in.</p>
        <form class="form" data-action="login">
          <label class="field"><span>Access key</span>
            <input class="mask" type="text" readonly value="********" autocomplete="off" aria-label="Access key" />
          </label>
          <label class="field"><span>Passcode</span>
            <input class="mask" type="text" readonly value="********" autocomplete="off" aria-label="Passcode" />
          </label>
          <button class="btn btn-primary full" type="submit" autofocus>Enter workspace</button>
        </form>
        <p class="center-note fine">New company? <a href="#/join">Register</a></p>
        <div class="or">or</div>
        <button class="btn btn-ghost full" type="button" data-action="login-admin">Admin console</button>
      </div>`;
  }

  function renderJoin() {
    const options = TRADES.map((trade) => `<option value="${esc(trade)}">${esc(trade)}</option>`).join("");
    return `
      <div class="auth-card">
        <p class="eyebrow">Register</p>
        <h2>Create a company</h2>
        <p class="lede">The profile goes live in this demo as soon as you continue.</p>
        <form class="form" data-action="register" style="margin-top:16px">
          <label class="field"><span>Company name</span><input name="name" data-autofocus placeholder="Northwind Glass" /></label>
          <label class="field"><span>Trade</span><select name="trade"><option value="">Select a trade</option>${options}</select></label>
          <div class="grid-2">
            <label class="field"><span>City</span><input name="city" placeholder="Chicago" /></label>
            <label class="field"><span>People</span><input name="people" inputmode="numeric" placeholder="40" /></label>
          </div>
          <label class="field"><span>About</span><textarea name="about" placeholder="What kind of work the company takes on"></textarea></label>
          <button class="btn btn-primary full" type="submit">Create company</button>
        </form>
        <p class="center-note fine"><a href="#/login">Back to sign in</a></p>
      </div>`;
  }

  function renderHome() {
    const me = currentCompany();
    const mine = state.data.projects.filter((item) => item.ownerId === me.id);
    const open = mine.filter((item) => item.status === "open");
    const received = state.data.proposals.filter((item) => project(item.projectId)?.ownerId === me.id && item.status === "submitted");
    const sent = state.data.proposals.filter((item) => item.companyId === me.id && item.status === "submitted");
    const awarded = mine.filter((item) => item.status === "awarded");
    const waiting = open.filter((item) => activeProposals(item.id).some((bid) => bid.status === "submitted"));
    const prompt = waiting.length
      ? `<a class="prompt" href="#/project/${esc(waiting[0].id)}"><span><strong>${waiting.length} project${waiting.length === 1 ? "" : "s"} ready to compare</strong><p class="fine">Review the proposals and accept the one you want.</p></span><span class="btn btn-primary btn-small">Compare</span></a>`
      : "";
    const suspended = me.status === "suspended"
      ? `<div class="banner rose"><strong>This company is suspended.</strong><p class="fine">Posting and proposals are paused until an admin reinstates the profile.</p></div>`
      : "";
    return `
      ${suspended}
      <header class="section-head">
        <div>
          <p class="eyebrow">Overview</p>
          <h1>${esc(me.name)}</h1>
          <p class="lede">${esc(me.city)} · ${esc(me.trade)}. ${open.length} open project${open.length === 1 ? "" : "s"} on your desk.</p>
        </div>
        <button class="btn btn-primary" type="button" data-action="edit-project">${icon.plus} New project</button>
      </header>
      <section class="stats">
        ${stat("Open projects", open.length)}
        ${stat("Proposals in", received.length)}
        ${stat("Proposals sent", sent.length)}
        ${stat("Awarded", awarded.length)}
      </section>
      ${prompt}
      <section class="split">
        <div class="panel">
          <h2>Your open projects</h2>
          <p class="fine">Manage drafts from My projects. Awards stay on the project page.</p>
          ${open.length ? `<div class="list">${open.map(projectRow).join("")}</div>` : emptyState("No open projects", "Publish a draft or post a new project.")}
        </div>
        <div class="panel">
          <h2>Alerts</h2>
          <p class="fine">Updates for your company.</p>
          ${alertList(notesForMe().slice(0, 4))}
          <p style="margin-top:12px"><a href="#/alerts">All alerts</a></p>
        </div>
      </section>`;
  }

  function stat(label, value) {
    return `<article class="stat"><span>${esc(label)}</span><b>${esc(value)}</b></article>`;
  }

  function projectRow(item) {
    const bids = proposalsFor(item.id).filter((bid) => bid.status !== "withdrawn");
    const low = bids.filter((bid) => bid.status === "submitted" || bid.status === "accepted");
    const lowest = low.length ? moneyFull(Math.min(...low.map((bid) => bid.amount))) : "—";
    return `
      <article class="item">
        <div>
          <div class="chips">${statusChip(item.status)}<span class="chip">${esc(item.category)}</span></div>
          <h3><a href="#/project/${esc(item.id)}">${esc(item.title)}</a></h3>
          <p class="meta">${esc(item.city)} · ${esc(money(item.budgetMin))}–${esc(money(item.budgetMax))} · ${esc(durationLabel(item.weeks))}</p>
          <p class="meta">${bids.length} proposal${bids.length === 1 ? "" : "s"} · Lowest ${esc(lowest)}</p>
        </div>
        <div class="right">${rowActions(item)}</div>
      </article>`;
  }

  function rowActions(item) {
    const view = `<a class="btn btn-ghost btn-small" href="#/project/${esc(item.id)}">View</a>`;
    if (item.status === "draft") {
      return `${view}<button class="btn btn-primary btn-small" type="button" data-action="publish" data-id="${esc(item.id)}">Publish</button><button class="btn btn-ghost btn-small" type="button" data-action="edit-project" data-id="${esc(item.id)}">Edit</button><button class="btn btn-danger btn-small" type="button" data-action="ask-delete" data-id="${esc(item.id)}">Delete</button>`;
    }
    if (item.status === "open") {
      return `${view}<button class="btn btn-ghost btn-small" type="button" data-action="edit-project" data-id="${esc(item.id)}">Edit</button><button class="btn btn-ghost btn-small" type="button" data-action="ask-close" data-id="${esc(item.id)}">Close</button>`;
    }
    return view;
  }

  function renderMine() {
    const me = currentCompany();
    const all = state.data.projects.filter((item) => item.ownerId === me.id);
    const tabs = ["all", "open", "draft", "awarded", "closed"].map((tab) => {
      const count = tab === "all" ? all.length : all.filter((item) => item.status === tab).length;
      const label = tab === "all" ? "All" : tab[0].toUpperCase() + tab.slice(1);
      return `<button class="tab ${state.mine === tab ? "on" : ""}" type="button" data-action="mine" data-tab="${tab}">${label} ${count}</button>`;
    }).join("");
    const list = all.filter((item) => state.mine === "all" || item.status === state.mine);
    return `
      <header class="section-head">
        <div>
          <p class="eyebrow">My projects</p>
          <h1>Manage work</h1>
          <p class="lede">Create a project, keep a draft, or compare proposals on something already live.</p>
        </div>
        <button class="btn btn-primary" type="button" data-action="edit-project">${icon.plus} New project</button>
      </header>
      <div class="tabs">${tabs}</div>
      ${list.length ? `<div class="list">${list.map(projectRow).join("")}</div>` : emptyState("Nothing in this tab", "Post a project or switch the filter.")}`;
  }

  function renderMarket() {
    const list = marketProjects();
    const cities = [...new Set(state.data.projects.map((item) => item.city))].sort();
    const me = currentCompany();
    return `
      <header class="section-head">
        <div>
          <p class="eyebrow">Marketplace</p>
          <h1>Open projects</h1>
          <p class="lede">Browse work posted by construction companies. Filter by type, city, and budget.</p>
        </div>
      </header>
      <div class="filters">
        <input data-filter="q" value="${esc(state.filters.q)}" placeholder="Search projects" aria-label="Search projects" />
        ${selectFilter("category", "All types", [["all", "All types"], ...CATEGORIES.map((item) => [item, item])])}
        ${selectFilter("city", "All cities", [["all", "All cities"], ...cities.map((item) => [item, item])])}
        ${selectFilter("budget", "Any budget", [["all", "Any budget"], ["under1", "Under $1M"], ["1to5", "$1–5M"], ["5to15", "$5–15M"], ["over15", "$15M+"]])}
        ${selectFilter("sort", "Sort", [["newest", "Newest"], ["budget", "Highest budget"], ["proposals", "Fewest proposals"]])}
      </div>
      <p class="fine">${list.length} project${list.length === 1 ? "" : "s"}</p>
      ${list.length ? `<div class="market-grid">${list.map((item) => marketCard(item, me)).join("")}</div>` : emptyState("No projects match", "Clear a filter or search for something broader.")}`;
  }

  function selectFilter(key, label, options) {
    const html = options.map(([value, text]) => `<option value="${esc(value)}" ${state.filters[key] === value ? "selected" : ""}>${esc(text)}</option>`).join("");
    return `<select data-filter="${key}" aria-label="${esc(label)}">${html}</select>`;
  }

  function marketCard(item, me) {
    const owner = company(item.ownerId);
    const count = activeProposals(item.id).length;
    const mine = me && myProposal(item.id) && myProposal(item.id).status !== "withdrawn";
    return `
      <a class="card" href="#/project/${esc(item.id)}">
        <div class="card-top"><span class="code">${esc(CODES[item.category] || "PRJ")}</span>${mine ? `<span class="chip lime">Your proposal</span>` : statusChip(item.status)}</div>
        <h3>${esc(item.title)}</h3>
        <p class="meta">${esc(item.category)} · ${esc(item.city)}</p>
        <p class="price">${esc(money(item.budgetMin))}–${esc(money(item.budgetMax))}</p>
        <div class="company-row"><span class="mono">${esc(mono(owner.name))}</span><span>${esc(owner.name)}</span></div>
        <p class="meta">${esc(durationLabel(item.weeks))} · ${count} proposal${count === 1 ? "" : "s"}${mine ? " · You proposed" : ""}</p>
      </a>`;
  }

  function renderProject() {
    const item = project(state.id);
    if (!item) return emptyState("Project not found", "It may have been removed from this demo.");
    const owner = company(item.ownerId);
    const me = currentCompany();
    const isOwner = me && me.id === item.ownerId;
    const bids = proposalsFor(item.id).filter((bid) => bid.status !== "withdrawn");
    const facts = `
      <dl class="facts">
        <div><dt>Budget</dt><dd>${esc(money(item.budgetMin))}–${esc(money(item.budgetMax))}</dd></div>
        <div><dt>Schedule</dt><dd>${esc(durationLabel(item.weeks))}</dd></div>
        <div><dt>Start</dt><dd>${esc(item.targetStart)}</dd></div>
        <div><dt>City</dt><dd>${esc(item.city)}</dd></div>
      </dl>`;
    const award = item.status === "awarded" ? awardBanner(item) : "";
    const actions = isOwner && (item.status === "open" || item.status === "draft")
      ? `<div class="right">${rowActions(item)}</div>` : "";
    const body = `
      <header class="section-head">
        <div>
          <p class="eyebrow">${esc(item.category)} · ${esc(item.city)}</p>
          <h1>${esc(item.title)}</h1>
          <p class="lede">Posted by <a href="#/company/${esc(owner.id)}">${esc(owner.name)}</a> · ${esc(timeAgo(item.publishedAt || item.createdAt))}</p>
        </div>
        <div class="chips">${statusChip(item.status)}</div>
      </header>
      ${award}
      ${facts}
      ${actions}
      ${projectBody(item, me, isOwner)}
      ${isOwner || state.session.role === "admin" ? compareBlock(item, bids, isOwner) : ""}`;
    return body;
  }

  function scopePanel(item) {
    return `
      <article class="panel">
        <h2>Scope</h2>
        <p style="margin-top:10px">${esc(item.summary)}</p>
        <ul class="scope">${item.scope.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
      </article>`;
  }

  function projectBody(item, me, isOwner) {
    if (isOwner || state.session.role === "admin") return scopePanel(item);
    return `<section class="project-layout">${scopePanel(item)}<aside class="sticky">${proposalBox(item, me)}</aside></section>`;
  }

  function awardBanner(item) {
    const bid = state.data.proposals.find((entry) => entry.id === item.awardedProposalId);
    if (!bid) return "";
    const winner = company(bid.companyId);
    return `<div class="banner"><strong>Awarded to ${esc(winner?.name || "a company")}</strong><p class="fine">${esc(moneyFull(bid.amount))} · ${esc(durationLabel(bid.weeks))}</p></div>`;
  }

  function compareBlock(item, bids, isOwner) {
    const live = bids.filter((bid) => bid.status === "submitted" || bid.status === "accepted" || bid.status === "declined");
    if (!live.length) {
      return `<section class="panel"><h2>Proposals</h2>${emptyState("No proposals yet", "Companies can send a proposal from the marketplace.")}</section>`;
    }
    const comparable = live.filter((bid) => bid.status === "submitted" || bid.status === "accepted");
    const amounts = comparable.map((bid) => bid.amount);
    const weeks = comparable.map((bid) => bid.weeks);
    const minAmount = amounts.length ? Math.min(...amounts) : null;
    const minWeeks = weeks.length ? Math.min(...weeks) : null;
    const spread = amounts.length > 1 ? Math.max(...amounts) - minAmount : 0;
    const cards = [...live].sort((a, b) => a.amount - b.amount).map((bid) => proposalCard(item, bid, isOwner, minAmount, minWeeks)).join("");
    const note = state.session.role === "admin" ? "Only the posting company can accept a proposal." : "Lowest amount and fastest schedule are marked.";
    return `
      <section>
        <div class="section-head">
          <div>
            <h2>Compare proposals</h2>
            <p class="fine">${live.length} on record${spread ? ` · Spread ${esc(moneyFull(spread))}` : ""}. ${note}</p>
          </div>
        </div>
        <div class="compare-grid">${cards}</div>
      </section>`;
  }

  function proposalCard(item, bid, isOwner, minAmount, minWeeks) {
    const firm = company(bid.companyId);
    const tags = [];
    if (bid.status === "submitted" || bid.status === "accepted") {
      if (minAmount !== null && bid.amount === minAmount) tags.push(`<span class="chip lime">Lowest</span>`);
      if (minWeeks !== null && bid.weeks === minWeeks) tags.push(`<span class="chip lime">Fastest</span>`);
      const inside = bid.amount >= item.budgetMin && bid.amount <= item.budgetMax;
      tags.push(`<span class="chip ${inside ? "mint" : ""}">${inside ? "In range" : "Outside range"}</span>`);
    }
    const cls = bid.status === "accepted" ? "proposal win" : bid.status === "declined" ? "proposal dim" : "proposal";
    const accept = isOwner && item.status === "open" && bid.status === "submitted"
      ? `<button class="btn btn-primary" type="button" data-action="ask-award" data-id="${esc(bid.id)}">Accept proposal</button>`
      : "";
    return `
      <article class="${cls}">
        <div class="company-row"><span class="mono">${esc(mono(firm.name))}</span><a href="#/company/${esc(firm.id)}">${esc(firm.name)}</a></div>
        <p class="meta">${esc(firm.trade)} · ${esc(firm.city)} · <span class="rating">${icon.star} ${esc(ratingText(firm))}</span></p>
        <div class="spread"><strong class="amount">${esc(moneyFull(bid.amount))}</strong>${statusChip(bid.status)}</div>
        <p class="meta">${esc(durationLabel(bid.weeks))} · ${esc(timeAgo(bid.updatedAt || bid.createdAt))}</p>
        <div class="tag-row">${tags.join("")}</div>
        <p>${esc(bid.summary)}</p>
        <p class="fine">${esc(bid.approach)}</p>
        ${accept}
      </article>`;
  }

  function proposalBox(item, me) {
    if (!me) return "";
    if (me.status === "suspended") return `<div class="panel banner rose"><strong>Proposals are paused</strong><p class="fine">A suspended company cannot send a proposal.</p></div>`;
    if (me.status === "pending") return `<div class="panel banner sand"><strong>Waiting for approval</strong><p class="fine">An admin still needs to activate this company.</p></div>`;
    const existing = myProposal(item.id);
    if (existing?.status === "accepted") return `<div class="panel banner"><strong>Your proposal was accepted</strong><p class="fine">${esc(moneyFull(existing.amount))} · ${esc(durationLabel(existing.weeks))}</p></div>`;
    if (existing?.status === "declined") {
      return `<div class="panel"><h2>Proposal declined</h2><p class="fine">${esc(moneyFull(existing.amount))} · ${esc(existing.summary)}</p></div>`;
    }
    if (item.status !== "open") {
      return `<div class="panel"><h2>Proposals are closed</h2><p class="fine">This project is ${esc(item.status)}.</p></div>`;
    }
    const editing = existing && existing.status === "submitted";
    return `
      <form class="panel form" data-action="save-proposal">
        <input type="hidden" name="projectId" value="${esc(item.id)}" />
        <h2>${editing ? "Your proposal" : "Send a proposal"}</h2>
        <p class="fine">${editing ? "Saving updates the number the owner compares." : `Tell ${esc(company(item.ownerId).name)} how you would deliver this.`}
        </p>
        <label class="field"><span>Amount (USD)</span><input name="amount" inputmode="numeric" value="${editing ? esc(existing.amount) : ""}" placeholder="1520000" data-autofocus /></label>
        <label class="field"><span>Duration in weeks</span><input name="weeks" inputmode="numeric" value="${editing ? esc(existing.weeks) : ""}" placeholder="14" /></label>
        <label class="field"><span>Summary</span><textarea name="summary" placeholder="The outcome in a sentence or two">${editing ? esc(existing.summary) : ""}</textarea></label>
        <label class="field"><span>Approach</span><textarea name="approach" placeholder="How the work would actually run">${editing ? esc(existing.approach) : ""}</textarea></label>
        <button class="btn btn-primary" type="submit">${editing ? "Update proposal" : "Send proposal"}</button>
        ${editing ? `<button class="btn btn-ghost" type="button" data-action="ask-withdraw" data-id="${esc(existing.id)}">Withdraw</button>` : ""}
      </form>`;
  }

  function renderCompany(id, own) {
    const firm = company(id);
    if (!firm) return emptyState("Company not found", "That profile is not in this demo.");
    const editing = own && state.editing;
    const projects = state.data.projects.filter((item) => item.ownerId === firm.id && (own || item.status !== "draft"));
    const won = state.data.proposals.filter((item) => item.companyId === firm.id && item.status === "accepted");
    const form = editing ? profileForm(firm) : `
      <article class="panel">
        <h2>About</h2>
        <p style="margin-top:8px">${esc(firm.about)}</p>
        <h3 style="margin-top:18px">Specialties</h3>
        <div class="chips" style="margin-top:8px">${firm.specialties.map((item) => `<span class="chip">${esc(item)}</span>`).join("") || `<span class="fine">None added</span>`}</div>
        <h3 style="margin-top:18px">Certifications</h3>
        <div class="chips" style="margin-top:8px">${firm.certifications.map((item) => `<span class="chip">${esc(item)}</span>`).join("") || `<span class="fine">None added</span>`}</div>
      </article>`;
    return `
      <section class="panel profile-hero">
        <span class="mono lg">${esc(mono(firm.name))}</span>
        <div>
          <div class="chips">${statusChip(firm.status)}<span class="rating">${icon.star} ${esc(ratingText(firm))}</span></div>
          <h1>${esc(firm.name)}</h1>
          <p class="lede">${esc(firm.trade)} · ${esc(firm.city)} · ${firm.people} people · Est. ${esc(firm.founded)}</p>
        </div>
        ${own && !editing ? `<button class="btn btn-primary" type="button" data-action="edit-profile">Edit profile</button>` : ""}
      </section>
      <section class="stats">
        ${stat("Projects posted", projects.length)}
        ${stat("Awards", won.length)}
        ${stat("Completed", firm.completed)}
        ${stat("People", firm.people)}
      </section>
      <section class="split">
        ${form}
        <article class="panel">
          <h2>Projects</h2>
          <div class="list" style="margin-top:12px">
            ${projects.length ? projects.map((item) => `<a class="item" href="#/project/${esc(item.id)}"><span><span class="chips">${statusChip(item.status)}</span><h3>${esc(item.title)}</h3><p class="meta">${esc(item.city)} · ${esc(money(item.budgetMin))}–${esc(money(item.budgetMax))}</p></span></a>`).join("") : `<p class="fine">No public projects yet.</p>`}
          </div>
        </article>
      </section>`;
  }

  function profileForm(firm) {
    const options = TRADES.map((trade) => `<option ${trade === firm.trade ? "selected" : ""}>${esc(trade)}</option>`).join("");
    return `
      <form class="panel form" data-action="save-profile">
        <h2>Edit profile</h2>
        <label class="field"><span>Company name</span><input name="name" value="${esc(firm.name)}" data-autofocus /></label>
        <label class="field"><span>Trade</span><select name="trade">${options}</select></label>
        <div class="grid-2">
          <label class="field"><span>City</span><input name="city" value="${esc(firm.city)}" /></label>
          <label class="field"><span>People</span><input name="people" value="${esc(firm.people)}" /></label>
        </div>
        <label class="field"><span>About</span><textarea name="about">${esc(firm.about)}</textarea></label>
        <label class="field"><span>Specialties</span><input name="specialties" value="${esc(firm.specialties.join(", "))}" /><span class="hint">Separate with commas</span></label>
        <label class="field"><span>Certifications</span><input name="certifications" value="${esc(firm.certifications.join(", "))}" /></label>
        <div class="btn-row">
          <button class="btn btn-primary" type="submit">Save profile</button>
          <button class="btn btn-ghost" type="button" data-action="cancel-edit">Cancel</button>
        </div>
      </form>`;
  }

  function renderDirectory() {
    const q = state.filters.directory.trim().toLowerCase();
    const list = state.data.companies
      .filter((item) => item.status === "active")
      .filter((item) => !q || `${item.name} ${item.trade} ${item.city} ${item.specialties.join(" ")}`.toLowerCase().includes(q));
    return `
      <header class="section-head">
        <div>
          <p class="eyebrow">Companies</p>
          <h1>Who is here</h1>
          <p class="lede">Active construction companies on Ashlar.</p>
        </div>
      </header>
      <div class="filters"><input data-filter="directory" value="${esc(state.filters.directory)}" placeholder="Search companies" aria-label="Search companies" /></div>
      <div class="company-grid">
        ${list.map((firm) => `
          <a class="card" href="#/company/${esc(firm.id)}">
            <div class="company-row"><span class="mono">${esc(mono(firm.name))}</span><strong>${esc(firm.name)}</strong></div>
            <p class="meta">${esc(firm.trade)} · ${esc(firm.city)}</p>
            <p class="rating">${icon.star} ${esc(ratingText(firm))} · ${firm.completed} completed</p>
            <div class="chips">${firm.specialties.slice(0, 3).map((item) => `<span class="chip">${esc(item)}</span>`).join("")}</div>
          </a>`).join("")}
      </div>
      ${list.length ? "" : emptyState("No companies match", "Try another name or trade.")}`;
  }

  function renderAlerts() {
    const notes = notesForMe();
    return `
      <header class="section-head">
        <div>
          <p class="eyebrow">Alerts</p>
          <h1>What changed</h1>
          <p class="lede">Proposals, awards, and company updates land here.</p>
        </div>
        ${notes.some((item) => !item.read) ? `<button class="btn btn-ghost" type="button" data-action="read-all">Mark all read</button>` : ""}
      </header>
      ${notes.length ? `<div class="list">${notes.map(alertItem).join("")}</div>` : emptyState("No alerts", "New proposals and awards will show up here.")}`;
  }

  function alertItem(note) {
    return `<a class="alert ${note.read ? "" : "unread"}" href="#/${esc(note.path)}" data-action="read" data-id="${esc(note.id)}"><span class="mono">${note.read ? "•" : "!"}</span><span><strong>${esc(note.title)}</strong><p>${esc(note.body)}</p></span><small class="meta">${esc(timeAgo(note.at))}</small></a>`;
  }

  function alertList(notes) {
    if (!notes.length) return emptyState("No alerts yet", "A new proposal will show up here.");
    return `<div class="list">${notes.map(alertItem).join("")}</div>`;
  }

  function renderAdmin() {
    const companies = state.data.companies;
    const pending = companies.filter((item) => item.status === "pending");
    const open = state.data.projects.filter((item) => item.status === "open");
    const proposals = state.data.proposals.filter((item) => item.status === "submitted");
    const events = recentEvents();
    return `
      <header class="section-head">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Marketplace admin</h1>
          <p class="lede">Approve companies, watch projects, and see what just moved.</p>
        </div>
      </header>
      <section class="stats">
        ${stat("Companies", companies.length)}
        ${stat("Waiting approval", pending.length)}
        ${stat("Open projects", open.length)}
        ${stat("Live proposals", proposals.length)}
      </section>
      ${pending.length ? `<a class="prompt" href="#/companies"><span><strong>${esc(pending[0].name)} is waiting</strong><span>${pending.length} compan${pending.length === 1 ? "y needs" : "ies need"} a decision.</span></span><span class="btn btn-primary btn-small">Review</span></a>` : ""}
      <section class="split">
        <article class="panel">
          <h2>Recent activity</h2>
          <div class="list" style="margin-top:12px">
            ${events.map((event) => `<div class="item"><div><strong>${esc(event.text)}</strong><p class="meta">${esc(timeAgo(event.at))}</p></div></div>`).join("")}
          </div>
        </article>
        <article class="panel">
          <h2>Alerts</h2>
          ${alertList(notesForMe().slice(0, 4))}
        </article>
      </section>`;
  }

  function recentEvents() {
    const events = [];
    state.data.projects.forEach((item) => {
      const owner = company(item.ownerId);
      events.push({ at: item.createdAt, text: `${owner?.name || "A company"} posted ${item.title}` });
      if (item.awardedAt) {
        const bid = state.data.proposals.find((entry) => entry.id === item.awardedProposalId);
        const winner = bid ? company(bid.companyId) : null;
        events.push({ at: item.awardedAt, text: `${item.title} was awarded to ${winner?.name || "a company"}` });
      }
    });
    state.data.proposals.forEach((bid) => {
      if (bid.status === "withdrawn") return;
      const firm = company(bid.companyId);
      const item = project(bid.projectId);
      events.push({ at: bid.createdAt, text: `${firm?.name || "A company"} proposed on ${item?.title || "a project"}` });
    });
    return events.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
  }

  function renderAdminCompanies() {
    const rows = state.data.companies.map((firm) => {
      let action = "";
      if (firm.status === "pending" || firm.status === "suspended") {
        action = `<button class="btn btn-primary btn-small" type="button" data-action="set-status" data-id="${esc(firm.id)}" data-status="active">${firm.status === "pending" ? "Approve" : "Reinstate"}</button>`;
      } else {
        action = `<button class="btn btn-danger btn-small" type="button" data-action="ask-suspend" data-id="${esc(firm.id)}">Suspend</button>`;
      }
      return `<tr><td><a href="#/company/${esc(firm.id)}">${esc(firm.name)}</a><div class="meta">${esc(firm.trade)}</div></td><td>${esc(firm.city)}</td><td>${firm.people}</td><td>${statusChip(firm.status)}</td><td>${action}</td></tr>`;
    }).join("");
    return `
      <header class="section-head"><div><p class="eyebrow">Admin</p><h1>Companies</h1><p class="lede">Approve a new company or suspend one that should leave the marketplace.</p></div></header>
      <div class="panel table-wrap"><table><thead><tr><th>Company</th><th>City</th><th>People</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderAdminProjects() {
    const tabs = ["all", "open", "draft", "awarded", "closed"].map((tab) => {
      const count = tab === "all" ? state.data.projects.length : state.data.projects.filter((item) => item.status === tab).length;
      const label = tab[0].toUpperCase() + tab.slice(1);
      return `<button class="tab ${state.adminStatus === tab ? "on" : ""}" type="button" data-action="admin-status" data-tab="${tab}">${label === "All" ? "All" : label} ${count}</button>`;
    }).join("");
    const rows = state.data.projects
      .filter((item) => state.adminStatus === "all" || item.status === state.adminStatus)
      .map((item) => {
        const owner = company(item.ownerId);
        const count = proposalsFor(item.id).filter((bid) => bid.status !== "withdrawn").length;
        return `<tr><td><a href="#/project/${esc(item.id)}">${esc(item.title)}</a><div class="meta">${esc(item.category)}</div></td><td>${esc(owner?.name || "")}</td><td>${esc(item.city)}</td><td>${statusChip(item.status)}</td><td>${count}</td><td>${esc(money(item.budgetMin))}–${esc(money(item.budgetMax))}</td></tr>`;
      }).join("");
    return `
      <header class="section-head"><div><p class="eyebrow">Admin</p><h1>Projects</h1><p class="lede">Every project on the marketplace, including drafts.</p></div></header>
      <div class="tabs">${tabs}</div>
      <div class="panel table-wrap"><table><thead><tr><th>Project</th><th>Owner</th><th>City</th><th>Status</th><th>Proposals</th><th>Budget</th></tr></thead><tbody>${rows || `<tr><td colspan="6">Nothing in this tab.</td></tr>`}</tbody></table></div>`;
  }

  function emptyState(title, body) {
    return `<div class="empty"><h2>${esc(title)}</h2><p>${esc(body)}</p></div>`;
  }

  function renderOverlay() {
    const overlay = state.overlay;
    if (!overlay) return "";
    if (overlay.type === "project") return projectDrawer(overlay.id);
    if (overlay.type === "confirm") {
      return `
        <div class="overlay center" data-action="overlay-bg">
          <div class="modal" role="dialog" aria-modal="true">
            <div class="modal-head"><h2>${esc(overlay.title)}</h2><button class="icon-btn" type="button" data-action="close" aria-label="Close">${icon.close}</button></div>
            <p class="fine">${esc(overlay.body)}</p>
            <div class="right" style="margin-top:18px">
              <button class="btn btn-ghost" type="button" data-action="close">Cancel</button>
              <button class="btn ${overlay.tone === "danger" ? "btn-danger" : "btn-primary"}" type="button" data-action="${esc(overlay.action)}" data-id="${esc(overlay.id || "")}" data-status="${esc(overlay.status || "")}" data-autofocus>${esc(overlay.yes)}</button>
            </div>
          </div>
        </div>`;
    }
    return "";
  }

  function projectDrawer(id) {
    const item = id ? project(id) : null;
    const cities = [...new Set(state.data.projects.map((entry) => entry.city))].sort();
    const categories = CATEGORIES.map((entry) => `<option ${item?.category === entry ? "selected" : ""}>${esc(entry)}</option>`).join("");
    return `
      <div class="overlay" data-action="overlay-bg">
        <form class="drawer form" data-action="save-project">
          <div class="drawer-head">
            <div><p class="eyebrow">${item ? "Edit" : "New"}</p><h2>${item ? "Edit project" : "Post a project"}</h2></div>
            <button class="icon-btn" type="button" data-action="close" aria-label="Close">${icon.close}</button>
          </div>
          <input type="hidden" name="id" value="${esc(item?.id || "")}" />
          <label class="field"><span>Title</span><input name="title" value="${esc(item?.title || "")}" data-autofocus /></label>
          <label class="field"><span>Type</span><select name="category">${categories}</select></label>
          <label class="field"><span>City</span><input name="city" list="cities" value="${esc(item?.city || "")}" /></label>
          <datalist id="cities">${cities.map((city) => `<option value="${esc(city)}"></option>`).join("")}</datalist>
          <div class="grid-2">
            <label class="field"><span>Budget from</span><input name="budgetMin" inputmode="numeric" value="${item ? esc(item.budgetMin) : ""}" /></label>
            <label class="field"><span>Budget to</span><input name="budgetMax" inputmode="numeric" value="${item ? esc(item.budgetMax) : ""}" /></label>
          </div>
          <div class="grid-2">
            <label class="field"><span>Duration (weeks)</span><input name="weeks" inputmode="numeric" value="${item ? esc(item.weeks) : ""}" /></label>
            <label class="field"><span>Target start</span><input name="targetStart" value="${esc(item?.targetStart || "")}" placeholder="Apr 2026" /></label>
          </div>
          <label class="field"><span>Summary</span><textarea name="summary">${esc(item?.summary || "")}</textarea></label>
          <label class="field"><span>Scope</span><textarea name="scope">${esc((item?.scope || []).join("\n"))}</textarea><span class="hint">One line per item</span></label>
          <label class="field"><span>Visibility</span>
            <select name="status">
              <option value="draft" ${!item || item.status === "draft" ? "selected" : ""}>Draft</option>
              <option value="open" ${item?.status === "open" ? "selected" : ""}>Open on the marketplace</option>
            </select>
          </label>
          <button class="btn btn-primary" type="submit">${item ? "Save project" : "Create project"}</button>
        </form>
      </div>`;
  }

  function formValues(form) {
    const data = {};
    new FormData(form).forEach((value, key) => { data[key] = String(value).trim(); });
    return data;
  }

  function num(value) {
    const n = Number(String(value).replace(/[$,\s]/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }

  function commaList(text) {
    return String(text || "").split(",").map((item) => item.trim()).filter(Boolean);
  }

  function lineList(text) {
    return String(text || "").split(/\n/).map((item) => item.trim()).filter(Boolean);
  }

  function ratingText(firm) {
    if (!firm?.rating) return "New";
    return firm.rating.toFixed(1);
  }

  function requireActive(me) {
    if (!me) return false;
    if (me.status === "suspended") {
      showToast("This company is suspended.");
      return false;
    }
    if (me.status === "pending") {
      showToast("This company is still waiting for approval.");
      return false;
    }
    return true;
  }

  const handlers = {
    login() {
      enter({ role: "company", companyId: "c_meridian" }, "home");
    },
    "login-admin"() {
      enter({ role: "admin" }, "admin");
    },
    "sign-out"() {
      state.session = null;
      state.overlay = null;
      state.editing = false;
      Store.clearSession();
      if (location.hash !== "#/login") location.hash = "#/login";
      else syncRoute();
    },
    register(form) {
      const data = formValues(form);
      const people = num(data.people);
      if (data.name.length < 2) return showToast("Add the company name.");
      if (!data.trade) return showToast("Select a trade.");
      if (data.city.length < 2) return showToast("Add a city.");
      if (!Number.isFinite(people) || people < 1) return showToast("Add the number of people.");
      if (data.about.length < 12) return showToast("Add a short description of the company.");
      const id = uid("c");
      const now = new Date().toISOString();
      state.data.companies.unshift({
        id,
        name: data.name,
        trade: data.trade,
        city: data.city,
        people: Math.round(people),
        founded: new Date().getFullYear(),
        rating: 0,
        completed: 0,
        status: "active",
        createdAt: now,
        about: data.about,
        specialties: [data.trade],
        certifications: [],
      });
      notify("admin", "New company", `${data.name} joined the marketplace.`, "companies", false);
      notify(id, "Welcome to Ashlar", "Your profile is live. Post a project or send a proposal.", "market", false);
      persist();
      showToast("Company profile is live.");
      state.pending = "home";
      enter({ role: "company", companyId: id }, "home");
    },
    "toggle-nav"() {
      document.getElementById("sidebar")?.classList.toggle("open");
    },
    "close-nav"() {
      document.getElementById("sidebar")?.classList.remove("open");
    },
    close() {
      state.overlay = null;
      render();
    },
    "overlay-bg"(el, event) {
      if (event.target === el) {
        state.overlay = null;
        render();
      }
    },
    "edit-project"(el) {
      const me = currentCompany();
      if (!requireActive(me)) return;
      const id = el.dataset.id || null;
      if (id) {
        const item = project(id);
        if (!item || item.ownerId !== me.id) return;
        if (item.status === "awarded" || item.status === "closed") {
          showToast("Awarded and closed projects stay locked.");
          return;
        }
      }
      state.overlay = { type: "project", id };
      render();
    },
    "save-project"(form) {
      const me = currentCompany();
      if (!requireActive(me)) return;
      const data = formValues(form);
      const budgetMin = num(data.budgetMin);
      const budgetMax = num(data.budgetMax);
      const weeks = num(data.weeks);
      const scope = lineList(data.scope);
      if (data.title.length < 3) return showToast("Add a project title.");
      if (!CATEGORIES.includes(data.category)) return showToast("Choose a project type.");
      if (data.city.length < 2) return showToast("Add a city.");
      if (!(budgetMin > 0) || !(budgetMax >= budgetMin)) return showToast("Enter a budget range, high end at least the low end.");
      if (!(weeks >= 1) || weeks > 200) return showToast("Duration should be between 1 and 200 weeks.");
      if (data.targetStart.length < 3) return showToast("Add a target start, such as Apr 2026.");
      if (data.summary.length < 20) return showToast("Add a summary of at least a sentence.");
      if (!scope.length) return showToast("Add at least one scope line.");
      const status = data.status === "open" ? "open" : "draft";
      const now = new Date().toISOString();
      let item = data.id ? project(data.id) : null;
      if (item && item.ownerId !== me.id) return;
      if (!item) {
        item = {
          id: uid("p"),
          ownerId: me.id,
          createdAt: now,
          awardedProposalId: null,
          awardedAt: null,
        };
        state.data.projects.unshift(item);
      }
      const wasOpen = item.status === "open";
      Object.assign(item, {
        title: data.title,
        category: data.category,
        city: data.city,
        budgetMin,
        budgetMax,
        weeks: Math.round(weeks),
        targetStart: data.targetStart,
        summary: data.summary,
        scope,
        status,
        publishedAt: status === "open" ? (item.publishedAt || now) : item.publishedAt || null,
      });
      if (status === "open" && !wasOpen) {
        notify("admin", "Project published", `${me.name} published ${item.title}.`, `project/${item.id}`, false);
      }
      persist();
      state.overlay = null;
      showToast(status === "open" ? "Project is live on the marketplace." : "Draft saved.");
      go(`project/${item.id}`);
    },
    publish(el) {
      const me = currentCompany();
      if (!requireActive(me)) return;
      const item = project(el.dataset.id);
      if (!item || item.ownerId !== me.id || item.status !== "draft") return;
      item.status = "open";
      item.publishedAt = new Date().toISOString();
      notify("admin", "Project published", `${me.name} published ${item.title}.`, `project/${item.id}`, false);
      persist();
      showToast("Project is live on the marketplace.");
      render();
    },
    "ask-delete"(el) {
      const item = project(el.dataset.id);
      if (!item) return;
      state.overlay = {
        type: "confirm",
        title: "Delete this draft?",
        body: `${item.title} will be removed from your projects.`,
        yes: "Delete draft",
        action: "delete-project",
        id: item.id,
        tone: "danger",
      };
      render();
    },
    "delete-project"(el) {
      const me = currentCompany();
      const item = project(el.dataset.id);
      if (!me || !item || item.ownerId !== me.id || item.status !== "draft") return;
      state.data.projects = state.data.projects.filter((entry) => entry.id !== item.id);
      persist();
      state.overlay = null;
      showToast("Draft removed.");
      go("projects");
    },
    "ask-close"(el) {
      const item = project(el.dataset.id);
      if (!item) return;
      state.overlay = {
        type: "confirm",
        title: "Close this project?",
        body: `${item.title} will leave the marketplace and open proposals will be declined.`,
        yes: "Close project",
        action: "close-project",
        id: item.id,
        tone: "danger",
      };
      render();
    },
    "close-project"(el) {
      const me = currentCompany();
      const item = project(el.dataset.id);
      if (!me || !item || item.ownerId !== me.id || item.status !== "open") return;
      item.status = "closed";
      proposalsFor(item.id).forEach((bid) => {
        if (bid.status === "submitted") {
          bid.status = "declined";
          notify(bid.companyId, "Project closed", `${item.title} was closed before an award.`, `project/${item.id}`, false);
        }
      });
      persist();
      state.overlay = null;
      showToast("Project closed.");
      render();
    },
    "save-proposal"(form) {
      const me = currentCompany();
      if (!requireActive(me)) return;
      const data = formValues(form);
      const item = project(data.projectId);
      if (!item || item.status !== "open") return showToast("This project is not open.");
      if (item.ownerId === me.id) return showToast("You cannot propose on your own project.");
      const amount = num(data.amount);
      const weeks = num(data.weeks);
      if (!(amount > 0)) return showToast("Enter a proposal amount.");
      if (!(weeks >= 1) || weeks > 200) return showToast("Enter a duration in weeks.");
      if (data.summary.length < 12) return showToast("Add a short summary.");
      if (data.approach.length < 12) return showToast("Add how you would deliver the work.");
      const now = new Date().toISOString();
      let bid = myProposal(item.id);
      const fresh = !bid || bid.status === "withdrawn" || bid.status === "declined";
      if (bid?.status === "declined") return showToast("This proposal was already declined.");
      if (!bid) {
        bid = { id: uid("b"), projectId: item.id, companyId: me.id, createdAt: now, status: "submitted" };
        state.data.proposals.unshift(bid);
      }
      Object.assign(bid, {
        amount,
        weeks: Math.round(weeks),
        summary: data.summary,
        approach: data.approach,
        status: "submitted",
        updatedAt: now,
      });
      notify(item.ownerId, fresh ? "New proposal" : "Proposal updated", `${me.name} ${fresh ? "sent a proposal" : "updated a proposal"} for ${item.title}.`, `project/${item.id}`, false);
      persist();
      showToast(fresh ? `Proposal sent to ${company(item.ownerId).name}.` : "Proposal updated.");
      render();
    },
    "ask-withdraw"(el) {
      state.overlay = {
        type: "confirm",
        title: "Withdraw this proposal?",
        body: "The project owner will no longer see it in the comparison.",
        yes: "Withdraw",
        action: "withdraw",
        id: el.dataset.id,
        tone: "danger",
      };
      render();
    },
    withdraw(el) {
      const me = currentCompany();
      const bid = state.data.proposals.find((entry) => entry.id === el.dataset.id);
      if (!me || !bid || bid.companyId !== me.id || bid.status !== "submitted") return;
      bid.status = "withdrawn";
      bid.updatedAt = new Date().toISOString();
      const item = project(bid.projectId);
      notify(item.ownerId, "Proposal withdrawn", `${me.name} withdrew the proposal for ${item.title}.`, `project/${item.id}`, false);
      persist();
      state.overlay = null;
      showToast("Proposal withdrawn.");
      render();
    },
    "ask-award"(el) {
      const bid = state.data.proposals.find((entry) => entry.id === el.dataset.id);
      const item = bid && project(bid.projectId);
      const firm = bid && company(bid.companyId);
      if (!bid || !item || !firm) return;
      state.overlay = {
        type: "confirm",
        title: "Accept this proposal?",
        body: `Award ${item.title} to ${firm.name} for ${moneyFull(bid.amount)}. Other open proposals will be declined.`,
        yes: "Accept proposal",
        action: "award",
        id: bid.id,
        tone: "primary",
      };
      render();
    },
    award(el) {
      const me = currentCompany();
      const bid = state.data.proposals.find((entry) => entry.id === el.dataset.id);
      const item = bid && project(bid.projectId);
      if (!me || !bid || !item || item.ownerId !== me.id || item.status !== "open" || bid.status !== "submitted") return;
      const now = new Date().toISOString();
      item.status = "awarded";
      item.awardedProposalId = bid.id;
      item.awardedAt = now;
      bid.status = "accepted";
      bid.updatedAt = now;
      const winner = company(bid.companyId);
      proposalsFor(item.id).forEach((other) => {
        if (other.id === bid.id || other.status !== "submitted") return;
        other.status = "declined";
        other.updatedAt = now;
        notify(other.companyId, "Project awarded", `${item.title} was awarded to another company.`, `project/${item.id}`, false);
      });
      notify(bid.companyId, "Proposal accepted", `${me.name} accepted your proposal for ${item.title}.`, `project/${item.id}`, false);
      notify("admin", "Project awarded", `${item.title} was awarded to ${winner.name}.`, `project/${item.id}`, false);
      persist();
      state.overlay = null;
      showToast(`Accepted. ${winner.name} is awarded the project.`);
      render();
    },
    mine(el) {
      state.mine = el.dataset.tab;
      render();
    },
    "admin-status"(el) {
      state.adminStatus = el.dataset.tab;
      render();
    },
    "edit-profile"() {
      state.editing = true;
      render();
    },
    "cancel-edit"() {
      state.editing = false;
      render();
    },
    "save-profile"(form) {
      const me = currentCompany();
      if (!me) return;
      const data = formValues(form);
      const people = num(data.people);
      if (data.name.length < 2) return showToast("Add the company name.");
      if (!data.trade) return showToast("Select a trade.");
      if (data.city.length < 2) return showToast("Add a city.");
      if (!(people >= 1)) return showToast("Add the number of people.");
      if (data.about.length < 12) return showToast("Add a short description.");
      Object.assign(me, {
        name: data.name,
        trade: data.trade,
        city: data.city,
        people: Math.round(people),
        about: data.about,
        specialties: commaList(data.specialties),
        certifications: commaList(data.certifications),
      });
      state.editing = false;
      persist();
      showToast("Profile saved.");
      render();
    },
    read(el) {
      const note = state.data.notifications.find((item) => item.id === el.dataset.id);
      if (!note || note.read) return;
      note.read = true;
      persist();
      if (el.getAttribute("href") === location.hash) render();
      else updateChrome();
    },
    "read-all"() {
      notesForMe().forEach((note) => { note.read = true; });
      persist();
      showToast("Alerts marked read.");
      render();
    },
    "set-status"(el) {
      if (state.session?.role !== "admin") return;
      const firm = company(el.dataset.id);
      const next = el.dataset.status;
      if (!firm || (next !== "active" && next !== "suspended")) return;
      firm.status = next;
      notify(firm.id, firm.status === "active" ? "Company active" : "Company suspended", firm.status === "active" ? "An admin activated your company." : "An admin suspended your company.", "profile", false);
      persist();
      showToast(firm.status === "active" ? `${firm.name} is now active.` : `${firm.name} is suspended.`);
      render();
    },
    "ask-suspend"(el) {
      const firm = company(el.dataset.id);
      if (!firm) return;
      state.overlay = {
        type: "confirm",
        title: "Suspend this company?",
        body: `${firm.name} will not be able to post projects or send proposals.`,
        yes: "Suspend",
        action: "set-status",
        id: firm.id,
        status: "suspended",
        tone: "danger",
      };
      render();
    },
    "ask-restore"() {
      state.overlay = {
        type: "confirm",
        title: "Restore demo data?",
        body: "Projects and proposals added in this browser will be replaced with the original sample set.",
        yes: "Restore",
        action: "restore",
        id: "",
        tone: "danger",
      };
      render();
    },
    restore() {
      const session = state.session;
      state.data = Store.createSeed();
      Store.saveData(state.data);
      state.overlay = null;
      state.editing = false;
      state.filters = { q: "", category: "all", city: "all", budget: "all", sort: "newest", directory: "" };
      if (session?.role === "company" && !company(session.companyId)) {
        showToast("Demo data restored.");
        handlers["sign-out"]();
        return;
      }
      state.shellKey = "";
      showToast("Demo data restored.");
      render();
    },
  };

  document.addEventListener("click", (event) => {
    const el = event.target.closest("[data-action]");
    if (!el || !handlers[el.dataset.action]) return;
    if (el.tagName !== "A") event.preventDefault();
    handlers[el.dataset.action](el, event);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.dataset.action) return;
    event.preventDefault();
    handlers[form.dataset.action]?.(form, event);
  });

  document.addEventListener("input", (event) => {
    const el = event.target.closest("[data-filter]");
    if (!el || el.tagName === "SELECT") return;
    state.filters[el.dataset.filter] = el.value;
    render();
  });

  document.addEventListener("change", (event) => {
    const el = event.target;
    if (el.tagName !== "SELECT" || !el.dataset.filter) return;
    state.filters[el.dataset.filter] = el.value;
    render();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.overlay) {
      state.overlay = null;
      render();
    }
  });

  window.addEventListener("hashchange", syncRoute);

  state.data = Store.loadData();
  state.session = Store.loadSession();
  if (state.session?.role === "company" && !company(state.session.companyId)) {
    state.session = null;
    Store.clearSession();
  }
  syncRoute();
})();

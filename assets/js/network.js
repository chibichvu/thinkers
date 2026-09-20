/* Tab 4 — a network derived from table 1 rather than authored separately.

   Edges are not hand-drawn. Two thinkers are linked when one entry's prose
   names the other, and the link carries the sentence that names them, so
   every connection can be read back to the text that asserts it. A second,
   weaker kind of link joins thinkers who share a theoretical placement.

   Layout is a small force simulation: repulsion between all nodes, springs
   along edges, and a pull toward the centre. No dependencies. */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  /* ---------- derive the graph from THINKERS ---------- */

  // The surname to look for, and names too common or ambiguous to match on.
  const STOP = new Set(["White", "Large", "Young", "Gall", "Hall", "Hao", "Li", "Cross", "Street", "Potter", "Jones"]);

  function surname(n) {
    if (n === "Lenin" || n === "Socrates" || n === "Plato") return n;
    if (n === "Lynn White Jr.") return "Lynn White";
    if (n === "Leslie White") return "Leslie White";
    const parts = n.replace(/\s+Jr\.$/, "").split(" ");
    let last = parts[parts.length - 1];
    if (/^(de|van|von|le|la)$/i.test(parts[parts.length - 2] || ""))
      last = parts[parts.length - 2] + " " + last;
    return last;
  }

  function buildGraph(data) {
  const nodes = data.map((d, i) => ({
    i, d,
    id: d.n,
    sur: surname(d.n),
    camp: d.c || "none",
    label: d.cl || "No placement",
    deg: 0
  }));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = [];
  const seen = new Set();

  function addEdge(a, b, kind, why) {
    if (a === b) return;
    const key = [a.id, b.id].sort().join("||") + "|" + kind;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ s: a, t: b, kind, why });
    a.deg++; b.deg++;
  }

  // 1. one entry's text names another thinker
  nodes.forEach((n) => {
    const text = (n.d.a || "") + " " + (n.d.v || "") + " " + (n.d.cn || "");
    nodes.forEach((m) => {
      if (m === n || STOP.has(m.sur)) return;
      const re = new RegExp("(^|[^\\w'’-])" + m.sur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w'’-])");
      if (!re.test(text)) return;
      // keep the sentence that does the naming, as the stated reason
      const sentence = text.split(/(?<=[.;])\s+/).find((s) => re.test(s)) || "";
      addEdge(n, m, "named", n.d.n + "'s entry: " + sentence.trim());
    });
  });

  // 2. a shared theoretical placement, when it is not a one-off label
  const byLabel = new Map();
  nodes.forEach((n) => {
    if (!n.d.cl) return;
    if (!byLabel.has(n.d.cl)) byLabel.set(n.d.cl, []);
    byLabel.get(n.d.cl).push(n);
  });
  byLabel.forEach((group, label) => {
    if (group.length < 2 || group.length > 6) return;
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++)
        addEdge(group[i], group[j], "placement", "Both placed under " + label + ".");
  });

  // 3. a shared discipline, taken from the fields column
  const NOT_A_FIELD = new Set(["essays", "criticism", "writing", "naturalism"]);
  const byField = new Map();
  nodes.forEach((n) => {
    n.d.f.split(/[,;]/).forEach((raw) => {
      const k = raw.trim().toLowerCase().replace(/^(early |the )/, "");
      if (k.length < 4 || NOT_A_FIELD.has(k)) return;
      if (!byField.has(k)) byField.set(k, []);
      byField.get(k).push(n);
    });
  });
  byField.forEach((group, field) => {
    if (group.length < 2 || group.length > 6) return;
    const label = field.charAt(0).toUpperCase() + field.slice(1);
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++)
        addEdge(group[i], group[j], "field", "Both work in " + label + ".");
  });

  return { nodes, edges };
  }

  // exposed so the derivation can be checked without a browser
  window.__netGraph = buildGraph;

  const svg = document.getElementById("net");
  if (!svg) return;
  const { nodes, edges } = buildGraph(THINKERS);

  /* ---------- state ---------- */

  const CAMPS = {
    det:  { name: "Determinist",          fill: "#000000" },
    soft: { name: "Soft / medium theory", fill: "#f2b90f" },
    soc:  { name: "Social shaping",       fill: "#ff805e" },
    oth:  { name: "Other / mixed",        fill: "#ffffff" },
    none: { name: "No placement",         fill: "#b9b3a5" }
  };
  const active = new Set(Object.keys(CAMPS));
  const kinds = { named: true, placement: true, field: true };
  let selected = null, hovered = null;

  const visible = (n) => active.has(n.camp);
  const edgeOn = (e) => kinds[e.kind] && visible(e.s) && visible(e.t);

  /* ---------- layout ---------- */

  let W = 900, H = 640;
  nodes.forEach((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    n.x = W / 2 + Math.cos(a) * 240 + (i % 7) * 6;
    n.y = H / 2 + Math.sin(a) * 200 + (i % 5) * 6;
    n.vx = n.vy = 0;
  });

  const radius = (n) => 5 + Math.min(11, Math.sqrt(n.deg) * 2.6);

  function tick() {
    const live = nodes.filter(visible);
    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy || 0.01;
        if (d2 > 90000) continue;
        const f = 1600 / d2;
        const d = Math.sqrt(d2);
        const ux = dx / d, uy = dy / d;
        if (!a.fixed) { a.vx -= ux * f; a.vy -= uy * f; }
        if (!b.fixed) { b.vx += ux * f; b.vy += uy * f; }
      }
    }
    edges.forEach((e) => {
      if (!edgeOn(e)) return;
      const dx = e.t.x - e.s.x, dy = e.t.y - e.s.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const rest = e.kind === "named" ? 110 : e.kind === "placement" ? 140 : 190;
      const f = (d - rest) * (e.kind === "named" ? 0.008 : e.kind === "placement" ? 0.005 : 0.0022);
      const ux = dx / d, uy = dy / d;
      if (!e.s.fixed) { e.s.vx += ux * f; e.s.vy += uy * f; }
      if (!e.t.fixed) { e.t.vx -= ux * f; e.t.vy -= uy * f; }
    });
    live.forEach((n) => {
      if (n.fixed) { n.vx = n.vy = 0; return; }
      n.vx += (W / 2 - n.x) * 0.0016;
      n.vy += (H / 2 - n.y) * 0.0016;
      n.vx *= 0.82; n.vy *= 0.82;
      n.x += Math.max(-12, Math.min(12, n.vx));
      n.y += Math.max(-12, Math.min(12, n.vy));
      const r = radius(n) + 6;
      n.x = Math.max(r, Math.min(W - r, n.x));
      n.y = Math.max(r, Math.min(H - r, n.y));
    });
  }

  /* ---------- drawing ---------- */

  const gRoot = document.createElementNS(NS, "g");
  const gEdge = document.createElementNS(NS, "g");
  const gNode = document.createElementNS(NS, "g");
  gRoot.appendChild(gEdge); gRoot.appendChild(gNode);
  svg.appendChild(gRoot);

  const eEls = edges.map((e) => {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("class", "net-link");
    gEdge.appendChild(l);
    return l;
  });

  const nEls = nodes.map((n) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "net-node");
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("fill", CAMPS[n.camp].fill);
    c.setAttribute("stroke", "#000");
    const t = document.createElementNS(NS, "text");
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("class", "net-label");
    t.textContent = n.id;
    g.appendChild(c); g.appendChild(t);
    gNode.appendChild(g);

    g.addEventListener("mouseenter", () => { hovered = n; paint(); });
    g.addEventListener("mouseleave", () => { hovered = null; paint(); });
    g.addEventListener("click", (ev) => { ev.stopPropagation(); selected = n; details(n); paint(); });
    g.addEventListener("dblclick", () => window.open(n.d.u, "_blank", "noopener"));

    // drag
    g.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      n.fixed = true;
      g.setPointerCapture(ev.pointerId);
      const move = (m) => {
        const p = toLocal(m.clientX, m.clientY);
        n.x = p.x; n.y = p.y; paint();
      };
      const up = (m) => {
        n.fixed = false;
        g.releasePointerCapture(ev.pointerId);
        g.removeEventListener("pointermove", move);
        g.removeEventListener("pointerup", up);
      };
      g.addEventListener("pointermove", move);
      g.addEventListener("pointerup", up);
    });
    return { g, c, t, n };
  });

  let view = { x: 0, y: 0, k: 1 };
  function toLocal(cx, cy) {
    const r = svg.getBoundingClientRect();
    const sx = W / r.width, sy = H / r.height;
    return { x: ((cx - r.left) * sx - view.x) / view.k, y: ((cy - r.top) * sy - view.y) / view.k };
  }

  function neighbours(n) {
    const s = new Set([n.id]);
    edges.forEach((e) => {
      if (!edgeOn(e)) return;
      if (e.s === n) s.add(e.t.id);
      if (e.t === n) s.add(e.s.id);
    });
    return s;
  }

  function paint() {
    gRoot.setAttribute("transform", `translate(${view.x},${view.y}) scale(${view.k})`);
    const focus = hovered || selected;
    const near = focus ? neighbours(focus) : null;

    eEls.forEach((l, i) => {
      const e = edges[i];
      if (!edgeOn(e)) { l.setAttribute("display", "none"); return; }
      l.removeAttribute("display");
      l.setAttribute("x1", e.s.x); l.setAttribute("y1", e.s.y);
      l.setAttribute("x2", e.t.x); l.setAttribute("y2", e.t.y);
      const on = !focus || e.s === focus || e.t === focus;
      l.setAttribute("stroke", e.kind === "named" ? "#ff805e" : e.kind === "placement" ? "#000000" : "#c9c4b8");
      l.setAttribute("stroke-width", on && focus ? 1.8 : 0.8);
      l.setAttribute("opacity", focus ? (on ? 0.95 : 0.06) : (e.kind === "named" ? 0.5 : e.kind === "placement" ? 0.35 : 0.18));
    });

    nEls.forEach(({ g, c, t, n }) => {
      if (!visible(n)) { g.setAttribute("display", "none"); return; }
      g.removeAttribute("display");
      const r = radius(n);
      c.setAttribute("cx", n.x); c.setAttribute("cy", n.y); c.setAttribute("r", r);
      c.setAttribute("stroke-width", n === selected ? 3 : 1);
      t.setAttribute("x", n.x); t.setAttribute("y", n.y + r + 11);
      const dim = focus && !near.has(n.id);
      g.setAttribute("opacity", dim ? 0.12 : 1);
      t.setAttribute("display", (focus && near.has(n.id)) || n.deg >= 4 || view.k > 1.4 ? "" : "none");
    });
  }

  /* ---------- details panel ---------- */

  const panel = document.getElementById("net-detail");

  function details(n) {
    const mine = edges.filter((e) => edgeOn(e) && (e.s === n || e.t === n));
    const named = mine.filter((e) => e.kind === "named");
    const shared = mine.filter((e) => e.kind === "placement");
    const disc = mine.filter((e) => e.kind === "field");
    const other = (e) => (e.s === n ? e.t : e.s);
    panel.innerHTML =
      `<h3><a href="${n.d.u}" target="_blank" rel="noopener">${n.id}</a></h3>
       <p class="net-meta">${n.d.y} · ${n.d.f}</p>
       ${n.d.cl ? `<p><span class="tag t-${n.d.c}">${n.d.cl}</span></p>` : ""}
       <p class="net-count">${named.length} textual link${named.length === 1 ? "" : "s"} ·
          ${shared.length} shared placement${shared.length === 1 ? "" : "s"} ·
          ${disc.length} shared discipline${disc.length === 1 ? "" : "s"}</p>
       ${named.length ? "<h4>Named in the table's own prose</h4><ul>" + named.map((e) =>
          `<li><strong>${other(e).id}</strong><span>${e.why}</span></li>`).join("") + "</ul>" : ""}
       ${shared.length ? "<h4>Same theoretical placement</h4><ul>" + shared.map((e) =>
          `<li><strong>${other(e).id}</strong><span>${e.why}</span></li>`).join("") + "</ul>" : ""}
       ${disc.length ? "<h4>Same discipline</h4><ul>" + disc.map((e) =>
          `<li><strong>${other(e).id}</strong><span>${e.why}</span></li>`).join("") + "</ul>" : ""}
       ${!mine.length ? "<p class=\"net-meta\">No links under the current filters.</p>" : ""}`;
  }

  svg.addEventListener("click", () => { selected = null; panel.innerHTML = placeholder; paint(); });

  const placeholder =
    `<h3>The network</h3>
     <p class="net-meta">Every link is read out of table 1 rather than drawn by hand.
        A <strong style="color:#ff805e">coral line</strong> means one thinker's entry names the other in its prose,
        and the panel quotes the sentence that does it. A <strong>grey line</strong> means the two share a
        theoretical placement. Node size is the number of links.</p>
     <p class="net-meta">Hover to trace · click for the reasons · double-click opens the source ·
        drag a node · scroll to zoom.</p>`;
  panel.innerHTML = placeholder;

  /* ---------- filters ---------- */

  const legend = document.getElementById("net-legend");
  function counts(camp) { return nodes.filter((n) => n.camp === camp).length; }
  legend.innerHTML = Object.keys(CAMPS).map((k) =>
    `<button class="net-filter" data-camp="${k}" aria-pressed="true">
       <span class="net-dot" style="background:${CAMPS[k].fill}"></span>
       <span class="net-name">${CAMPS[k].name}</span><span class="net-n">${counts(k)}</span>
     </button>`).join("") +
    `<div class="net-kinds">
       <button class="net-filter" data-kind="named" aria-pressed="true"><span class="net-rule coral"></span>
         <span class="net-name">Named in the prose</span><span class="net-n">${edges.filter((e) => e.kind === "named").length}</span></button>
       <button class="net-filter" data-kind="placement" aria-pressed="true"><span class="net-rule black"></span>
         <span class="net-name">Shared placement</span><span class="net-n">${edges.filter((e) => e.kind === "placement").length}</span></button>
       <button class="net-filter" data-kind="field" aria-pressed="true"><span class="net-rule"></span>
         <span class="net-name">Shared discipline</span><span class="net-n">${edges.filter((e) => e.kind === "field").length}</span></button>
     </div>
     <button id="net-reset" class="net-reset">&#8635; Reset view</button>`;

  legend.querySelectorAll("[data-camp]").forEach((b) => {
    b.addEventListener("click", () => {
      const c = b.dataset.camp;
      if (active.has(c)) active.delete(c); else active.add(c);
      b.setAttribute("aria-pressed", String(active.has(c)));
      if (selected && !visible(selected)) { selected = null; panel.innerHTML = placeholder; }
      kick();
    });
  });
  legend.querySelectorAll("[data-kind]").forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.kind;
      kinds[k] = !kinds[k];
      b.setAttribute("aria-pressed", String(kinds[k]));
      kick();
    });
  });
  document.getElementById("net-reset").addEventListener("click", () => {
    view = { x: 0, y: 0, k: 1 };
    selected = null; panel.innerHTML = placeholder;
    Object.keys(CAMPS).forEach((c) => active.add(c));
    kinds.named = kinds.placement = true;
    legend.querySelectorAll(".net-filter").forEach((b) => b.setAttribute("aria-pressed", "true"));
    kick();
  });

  // search box
  const q = document.getElementById("net-q");
  q.addEventListener("input", () => {
    const v = q.value.trim().toLowerCase();
    if (!v) { selected = null; panel.innerHTML = placeholder; paint(); return; }
    const hit = nodes.find((n) => visible(n) && n.id.toLowerCase().includes(v));
    if (hit) { selected = hit; details(hit); }
    paint();
  });

  // zoom
  svg.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const f = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
    const p = toLocal(ev.clientX, ev.clientY);          // graph point under the cursor
    view.k = Math.max(0.4, Math.min(4, view.k * f));
    const r = svg.getBoundingClientRect();               // keep that point under the cursor
    view.x = (ev.clientX - r.left) * (W / r.width) - p.x * view.k;
    view.y = (ev.clientY - r.top) * (H / r.height) - p.y * view.k;
    paint();
  }, { passive: false });

  /* ---------- run ---------- */

  let frames = 0, raf = null;
  function loop() {
    tick(); paint();
    if (++frames < 600) raf = requestAnimationFrame(loop); else raf = null;
  }
  function kick() {
    frames = 0;
    if (!raf) raf = requestAnimationFrame(loop);
  }

  // only start once the tab is actually shown, so the layout settles on screen
  window.addEventListener("tabshown", (e) => { if (e.detail === "network") kick(); });
  kick();
})();

/* Tab switching, filtering, sorting and rendering for both tables. */
(function () {
  "use strict";

  /* ---------------- tabs ---------------- */

  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = {
    thinkers: document.getElementById("panel-thinkers"),
    methods: document.getElementById("panel-methods")
  };

  /* The table card scrolls on its own axis now, so "top" means both the page
     and the card. Horizontal scroll is left alone — the reader may have paged
     across to a column deliberately. */
  function scrollToTop(name) {
    const panel = panels[name] || document.querySelector(".panel:not([hidden])");
    const box = panel && panel.querySelector(".scroller");
    if (box) box.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showTab(name, pushHash) {
    if (!panels[name]) name = "thinkers";
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    Object.keys(panels).forEach((k) => {
      panels[k].hidden = k !== name;
    });
    if (pushHash && location.hash !== "#" + name) {
      history.replaceState(null, "", "#" + name);
    }
    const box = panels[name].querySelector(".scroller");
    if (box) box.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => showTab(t.dataset.tab, true));
    t.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(t);
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        showTab(next.dataset.tab, true);
        next.focus();
      }
    });
  });

  window.addEventListener("hashchange", () => showTab(location.hash.slice(1), false));

  /* ---------------- table 1: thinkers ---------------- */

  const tbody = document.getElementById("tbody");
  const countEl = document.getElementById("count");
  const campNames = {
    det: "Determinist",
    soft: "Soft / medium theory",
    soc: "Social shaping",
    oth: "Other / mixed"
  };
  let campFilter = "all", query = "", sortMode = "az";

  const eras = [
    { max: 0,    label: "Classical antiquity, fifth and fourth centuries BCE" },
    { max: 1699, label: "Sixteenth and seventeenth centuries" },
    { max: 1799, label: "Eighteenth century" },
    { max: 1899, label: "Born in the nineteenth century" },
    { max: 1919, label: "Born 1900–1919" },
    { max: 1939, label: "Born 1920–1939" },
    { max: 9999, label: "Born 1940 or later" }
  ];
  const eraOf = (sy) =>
    sy === null
      ? "Dates not established, ordered by year of principal work"
      : eras.find((e) => sy <= e.max).label;

  function rowHTML(d) {
    /* Not every figure in the table took a position on technology or media.
       Those entries leave v, c and cl empty rather than have one invented. */
    const view = d.v || '<span class="na">No stated position on technology or media.</span>';
    const tag = d.c ? `<span class="tag t-${d.c}">${d.cl}</span>` : "";
    return `
    <tr>
      <td class="name"><a href="${d.u}" target="_blank" rel="noopener">${d.n}</a><div class="ipa">${d.p}</div></td>
      <td class="years">${d.y}</td>
      <td class="fields">${d.f}</td>
      <td class="works"><ul class="works-list">${d.w.map((x) =>
        `<li><a href="${x[2]}" target="_blank" rel="noopener">${x[0]}</a>${x[1] ? ` <span>(${x[1]})</span>` : ""}</li>`).join("")}</ul></td>
      <td class="about">${d.a}</td>
      <td class="view">${view}</td>
      <td class="camp">${tag}<p>${d.cn}</p></td>
    </tr>`;
  }

  function render() {
    let rows = THINKERS.filter((d) => {
      if (campFilter !== "all" && d.c !== campFilter) return false;
      if (!query) return true;
      const hay = (d.n + " " + d.p + " " + d.f + " " + d.a + " " + d.v + " " + d.cl + " " + d.cn + " " +
        d.w.map((x) => x[0]).join(" ")).toLowerCase();
      return hay.includes(query);
    });

    if (sortMode === "chrono") {
      rows = rows.slice().sort((a, b) => {
        if (a.sy === null && b.sy === null) return (a.ay || 9999) - (b.ay || 9999);
        if (a.sy === null) return 1;
        if (b.sy === null) return -1;
        return a.sy - b.sy;
      });
    }

    if (!rows.length) {
      tbody.innerHTML = `<tr class="empty"><td colspan="7">No entry matches that search.</td></tr>`;
    } else {
      let html = "", lastEra = null;
      rows.forEach((d) => {
        if (sortMode === "chrono") {
          const era = eraOf(d.sy);
          if (era !== lastEra) {
            html += `<tr class="group"><td colspan="7">${era}</td></tr>`;
            lastEra = era;
          }
        }
        html += rowHTML(d);
      });
      tbody.innerHTML = html;
    }

    const box1 = document.querySelector("#panel-thinkers .scroller");
    if (box1) box1.scrollTop = 0;

    countEl.textContent =
      rows.length + " of " + THINKERS.length + " entries shown · " +
      (sortMode === "az" ? "alphabetical by surname" : "earliest to latest by birth") +
      (campFilter === "all" ? "" : " · " + campNames[campFilter]);
  }

  document.getElementById("q").addEventListener("input", (e) => {
    query = e.target.value.trim().toLowerCase();
    render();
  });
  document.querySelectorAll("button[data-sort]").forEach((b) => {
    b.addEventListener("click", () => {
      sortMode = b.dataset.sort;
      document.querySelectorAll("button[data-sort]").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
  });
  document.querySelectorAll("button[data-camp]").forEach((b) => {
    b.addEventListener("click", () => {
      campFilter = b.dataset.camp;
      document.querySelectorAll("button[data-camp]").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
  });

  /* ---------------- table 2: methods ---------------- */

  const tbody2 = document.getElementById("tbody2");
  const count2 = document.getElementById("count2");
  let sort2 = "az", q2 = "";

  function render2() {
    let rows = METHODS.filter((d) => {
      if (!q2) return true;
      const hay = (d.n + " " + d.f + " " + d.a + " " + d.r + " " + d.cl + " " +
        d.w.map((x) => x[0]).join(" ")).toLowerCase();
      return hay.includes(q2);
    });
    if (sort2 === "year") rows = rows.slice().sort((a, b) => a.ky - b.ky);

    tbody2.innerHTML = rows.length
      ? rows.map((d) => `
    <tr>
      <td class="name"><a href="${d.u}" target="_blank" rel="noopener">${d.n}</a><div class="ipa">${d.p}</div></td>
      <td class="years">${d.y}</td>
      <td class="fields">${d.f}</td>
      <td class="works"><ul class="works-list">${d.w.map((x) =>
        `<li><a href="${x[2]}" target="_blank" rel="noopener">${x[0]}</a> <span>(${x[1]})</span></li>`).join("")}</ul></td>
      <td class="about">${d.a}</td>
      <td class="view">${d.r}</td>
      <td class="camp"><span class="tag t-${d.c}">${d.cl}</span></td>
    </tr>`).join("")
      : `<tr class="empty"><td colspan="7">No source matches that search.</td></tr>`;

    const box2 = document.querySelector("#panel-methods .scroller");
    if (box2) box2.scrollTop = 0;

    count2.textContent =
      rows.length + " of " + METHODS.length + " sources shown · " +
      (sort2 === "az" ? "alphabetical by first author" : "earliest to latest by key work");
  }

  document.getElementById("q2").addEventListener("input", (e) => {
    q2 = e.target.value.trim().toLowerCase();
    render2();
  });
  document.querySelectorAll("button[data-sort2]").forEach((b) => {
    b.addEventListener("click", () => {
      sort2 = b.dataset.sort2;
      document.querySelectorAll("button[data-sort2]").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)));
      render2();
    });
  });

  /* ---------------- bottom of panel navigation ---------------- */

  document.querySelectorAll("[data-goto]").forEach((b) => {
    b.addEventListener("click", () => {
      showTab(b.dataset.goto, true);
      const tab = tabs.find((t) => t.dataset.tab === b.dataset.goto);
      if (tab) tab.focus();
    });
  });

  document.querySelectorAll("[data-top]").forEach((b) => {
    b.addEventListener("click", () => scrollToTop());
  });

  /* ---------------- back to top ---------------- */

  const toTop = document.getElementById("toTop");
  toTop.addEventListener("click", () => scrollToTop());
  window.addEventListener("scroll", () => {
    toTop.classList.toggle("show", window.scrollY > 500);
  }, { passive: true });

  /* ---------------- start ---------------- */

  render();
  render2();
  showTab(location.hash.slice(1) || "thinkers", false);
})();

(function () {
  const grid = document.getElementById("toolGrid");
  const searchInput = document.getElementById("searchInput");
  const resultCount = document.getElementById("resultCount");
  const chipsWrap = document.getElementById("categoryChips");
  const emptyState = document.getElementById("emptyState");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  let activeCategory = "Tất cả";
  let query = "";

  function domainOf(tool) {
    if (tool.domain) return tool.domain;
    try {
      return new URL(tool.url).hostname.replace(/^www\./, "");
    } catch {
      return tool.url;
    }
  }

  function iconMarkup(icon) {
    if (/^https?:\/\//.test(icon)) {
      return `<img src="${icon}" alt="" loading="lazy" />`;
    }
    return icon || "🔧";
  }

  function buildChips() {
    const categories = ["Tất cả", ...new Set(TOOLS.map((t) => t.category || "Khác"))];
    chipsWrap.innerHTML = categories
      .map(
        (cat) =>
          `<button class="chip${cat === activeCategory ? " active" : ""}" data-cat="${cat}" type="button">${cat}</button>`
      )
      .join("");

    chipsWrap.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        buildChips();
        render();
      });
    });
  }

  function render() {
    const q = query.trim().toLowerCase();
    const filtered = TOOLS.filter((t) => {
      const inCategory = activeCategory === "Tất cả" || (t.category || "Khác") === activeCategory;
      const haystack = `${t.name} ${t.description || ""} ${t.category || ""}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return inCategory && matchesQuery;
    });

    grid.innerHTML = filtered
      .map(
        (t, i) => `
        <a class="card" href="${t.url}" target="_blank" rel="noopener noreferrer" style="animation-delay:${i * 30}ms">
          <div class="card-top">
            <div class="card-icon">${iconMarkup(t.icon)}</div>
            <span class="card-arrow">↗</span>
          </div>
          <h3 class="card-name">${t.name}</h3>
          <p class="card-desc">${t.description || ""}</p>
          <span class="card-domain">${domainOf(t)}</span>
        </a>`
      )
      .join("");

    resultCount.textContent = q || activeCategory !== "Tất cả" ? `${filtered.length} tool` : "";
    emptyState.hidden = filtered.length !== 0;
    grid.hidden = filtered.length === 0;
  }

  searchInput.addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });

  clearFiltersBtn.addEventListener("click", () => {
    query = "";
    activeCategory = "Tất cả";
    searchInput.value = "";
    buildChips();
    render();
  });

  // Theme: default dark, persisted in-memory only (no localStorage per artifact constraints —
  // here it's a plain static site so localStorage is actually fine, but we keep it simple).
  let theme = "dark";
  try {
    const saved = localStorage.getItem("lp-toolkit-theme");
    if (saved) theme = saved;
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) theme = "light";
  } catch {
    // localStorage unavailable — fall back to dark default
  }

  function applyTheme() {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      themeIcon.textContent = "☀";
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeIcon.textContent = "☾";
    }
  }

  themeToggle.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    applyTheme();
    try {
      localStorage.setItem("lp-toolkit-theme", theme);
    } catch {
      /* ignore */
    }
  });

  applyTheme();
  buildChips();
  render();
})();

(function () {
  const grid = document.getElementById("toolGrid");
  const skeletonGrid = document.getElementById("skeletonGrid");
  const searchInput = document.getElementById("searchInput");
  const resultCount = document.getElementById("resultCount");
  const chipsWrap = document.getElementById("categoryChips");
  const emptyState = document.getElementById("emptyState");
  const emptyTitle = document.getElementById("emptyTitle");
  const emptySub = document.getElementById("emptySub");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const loadError = document.getElementById("loadError");
  const retryLoadBtn = document.getElementById("retryLoad");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const footerCount = document.getElementById("footerCount");

  const fabAdd = document.getElementById("fabAdd");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalClose = document.getElementById("modalClose");
  const toolForm = document.getElementById("toolForm");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");

  let allTools = [];
  let activeCategory = "Tất cả";
  let query = "";
  let loading = true;

  // ---------- data ----------

  async function loadTools() {
    loading = true;
    skeletonGrid.hidden = false;
    grid.hidden = true;
    emptyState.hidden = true;
    loadError.hidden = true;

    try {
      const res = await fetch("/api/tools");
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      allTools = data.tools || [];
      loading = false;
      skeletonGrid.hidden = true;
      buildChips();
      render();
    } catch (err) {
      loading = false;
      skeletonGrid.hidden = true;
      loadError.hidden = false;
    }
  }

  retryLoadBtn.addEventListener("click", loadTools);

  // ---------- rendering ----------

  function domainOf(tool) {
    try {
      return new URL(tool.url).hostname.replace(/^www\./, "");
    } catch {
      return tool.url;
    }
  }

  function iconMarkup(icon) {
    if (/^https?:\/\//.test(icon || "")) {
      return `<img src="${icon}" alt="" loading="lazy" />`;
    }
    return icon || "🔧";
  }

  function buildChips() {
    const categories = ["Tất cả", ...new Set(allTools.map((t) => t.category || "Khác"))];
    chipsWrap.innerHTML = categories
      .map(
        (cat) =>
          `<button class="chip${cat === activeCategory ? " active" : ""}" data-cat="${escapeAttr(cat)}" type="button">${escapeHtml(cat)}</button>`
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
    if (loading) return;

    const q = query.trim().toLowerCase();
    const filtered = allTools.filter((t) => {
      const inCategory = activeCategory === "Tất cả" || (t.category || "Khác") === activeCategory;
      const haystack = `${t.name} ${t.description || ""} ${t.category || ""}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return inCategory && matchesQuery;
    });

    grid.innerHTML = filtered
      .map(
        (t, i) => `
        <div class="card" style="animation-delay:${i * 30}ms">
          <a class="card-link" href="${escapeAttr(t.url)}" target="_blank" rel="noopener noreferrer" style="position:absolute;inset:0;z-index:1;" aria-label="Mở ${escapeAttr(t.name)}"></a>
          <div class="card-top">
            <div class="card-icon">${iconMarkup(t.icon)}</div>
            <div class="card-actions">
              <button class="card-delete" data-id="${escapeAttr(t.id)}" type="button" title="Xoá tool" aria-label="Xoá ${escapeAttr(t.name)}">✕</button>
              <span class="card-arrow">↗</span>
            </div>
          </div>
          <h3 class="card-name">${escapeHtml(t.name)}</h3>
          <p class="card-desc">${escapeHtml(t.description || "")}</p>
          <div class="card-domain">
            <span>${escapeHtml(domainOf(t))}</span>
            <span class="card-category">${escapeHtml(t.category || "Khác")}</span>
          </div>
        </div>`
      )
      .join("");

    grid.querySelectorAll(".card-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete(btn.dataset.id);
      });
    });

    const hasAny = allTools.length > 0;
    const hasFiltered = filtered.length > 0;

    resultCount.textContent = q || activeCategory !== "Tất cả" ? `${filtered.length} tool` : "";
    footerCount.textContent = hasAny ? `${allTools.length} tool đang có trong Nghĩa Huỳnh Toolkit` : "";

    grid.hidden = !hasFiltered;
    emptyState.hidden = hasFiltered;

    if (!hasFiltered) {
      if (!hasAny) {
        emptyTitle.textContent = "Chưa có tool nào";
        emptySub.innerHTML = 'Bấm nút <strong>+</strong> ở góc dưới để thêm tool đầu tiên.';
        clearFiltersBtn.hidden = true;
      } else {
        emptyTitle.textContent = "Không tìm thấy tool nào khớp";
        emptySub.textContent = "Thử từ khoá khác, hoặc bỏ lọc.";
        clearFiltersBtn.hidden = false;
      }
    }
  }

  clearFiltersBtn.addEventListener("click", () => {
    query = "";
    activeCategory = "Tất cả";
    searchInput.value = "";
    buildChips();
    render();
  });

  searchInput.addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }

  // ---------- delete ----------

  async function handleDelete(id) {
    const tool = allTools.find((t) => t.id === id);
    const label = tool ? tool.name : "tool này";
    if (!window.confirm(`Xoá "${label}" khỏi Toolkit?`)) return;

    const password = window.prompt("Nhập mật khẩu quản trị để xoá:");
    if (password === null) return;

    try {
      const res = await fetch("/api/tools", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || "Xoá thất bại.");
        return;
      }
      allTools = allTools.filter((t) => t.id !== id);
      buildChips();
      render();
    } catch {
      window.alert("Lỗi kết nối, thử lại sau.");
    }
  }

  // ---------- add-tool modal ----------

  function openModal() {
    modalOverlay.hidden = false;
    formError.hidden = true;
    toolForm.reset();
    document.body.style.overflow = "hidden";
    setTimeout(() => toolForm.elements.name.focus(), 50);
  }

  function closeModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  fabAdd.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
  });

  toolForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const fd = new FormData(toolForm);
    const payload = {
      name: fd.get("name")?.trim(),
      url: fd.get("url")?.trim(),
      icon: fd.get("icon")?.trim(),
      category: fd.get("category")?.trim(),
      description: fd.get("description")?.trim(),
      password: fd.get("password"),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang thêm…";

    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        formError.textContent = data.error || "Có lỗi xảy ra.";
        formError.hidden = false;
        return;
      }

      allTools.push(data.tool);
      buildChips();
      render();
      closeModal();
    } catch {
      formError.textContent = "Lỗi kết nối, thử lại sau.";
      formError.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Thêm tool";
    }
  });

  // ---------- theme ----------

  let theme = "dark";
  try {
    const saved = localStorage.getItem("nh-toolkit-theme");
    if (saved) theme = saved;
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) theme = "light";
  } catch {
    /* localStorage unavailable, keep dark default */
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
      localStorage.setItem("nh-toolkit-theme", theme);
    } catch {
      /* ignore */
    }
  });

  applyTheme();
  loadTools();
})();

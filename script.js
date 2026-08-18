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

  const editToggle = document.getElementById("editToggle");
  const editToggleIcon = document.getElementById("editToggleIcon");
  const editToggleLabel = document.getElementById("editToggleLabel");

  const fabAdd = document.getElementById("fabAdd");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalClose = document.getElementById("modalClose");
  const toolForm = document.getElementById("toolForm");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");

  const passwordOverlay = document.getElementById("passwordOverlay");
  const passwordClose = document.getElementById("passwordClose");
  const passwordForm = document.getElementById("passwordForm");
  const passwordError = document.getElementById("passwordError");
  const passwordSubmitBtn = document.getElementById("passwordSubmitBtn");

  let allTools = [];
  let activeCategory = "Tất cả";
  let query = "";
  let loading = true;

  let editMode = false;
  let adminPassword = null;
  let editingId = null; // null = adding a new tool, otherwise editing this id

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

  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  const AVATAR_PALETTE = [
    ["#6E63F0", "#33C9C1"],
    ["#F0637A", "#F0B84C"],
    ["#4C7AF0", "#33D0F0"],
    ["#9B5DE5", "#F15BB5"],
    ["#2FBF71", "#8CE99A"],
    ["#F0973C", "#F0637A"],
  ];

  function avatarStyle(seed) {
    const pair = AVATAR_PALETTE[hashStr(seed) % AVATAR_PALETTE.length];
    return `background:linear-gradient(145deg, ${pair[0]}, ${pair[1]});`;
  }

  function iconMarkup(icon, name) {
    if (/^https?:\/\//.test(icon || "")) {
      return { style: "", html: `<img src="${escapeAttr(icon)}" alt="" loading="lazy" />` };
    }
    const label = (icon && icon.trim()) || name || "?";
    const len = label.length;
    const fontSize = len <= 3 ? 17 : len <= 5 ? 14 : len <= 7 ? 12 : len <= 9 ? 10 : 9;
    return {
      style: avatarStyle(name || label),
      html: `<span class="row-icon-label" style="font-size:${fontSize}px">${escapeHtml(label)}</span>`,
    };
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
        <div class="row-card" style="animation-delay:${i * 25}ms">
          <a class="row-link" href="${escapeAttr(t.url)}" target="_blank" rel="noopener noreferrer" aria-label="Mở ${escapeAttr(t.name)}"></a>
          <div class="row-icon" style="${iconMarkup(t.icon, t.name).style}">${iconMarkup(t.icon, t.name).html}</div>
          <div class="row-content">
            <div class="row-head">
              <h3 class="row-name">${escapeHtml(t.name)}</h3>
              <div class="row-actions">
                ${
                  editMode
                    ? `<button class="row-edit" data-id="${escapeAttr(t.id)}" type="button" title="Sửa tool" aria-label="Sửa ${escapeAttr(t.name)}">✎</button>
                       <button class="row-delete" data-id="${escapeAttr(t.id)}" type="button" title="Xoá tool" aria-label="Xoá ${escapeAttr(t.name)}">✕</button>`
                    : ""
                }
                <span class="row-arrow">→</span>
              </div>
            </div>
            <p class="row-desc">${escapeHtml(t.description || "")}</p>
            <div class="row-meta">
              <span class="row-domain">${escapeHtml(domainOf(t))}</span>
              <span class="row-category">${escapeHtml(t.category || "Khác")}</span>
            </div>
          </div>
        </div>`
      )
      .join("");

    if (editMode) {
      grid.querySelectorAll(".row-edit").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const tool = allTools.find((t) => t.id === btn.dataset.id);
          if (tool) openToolModal(tool);
        });
      });
      grid.querySelectorAll(".row-delete").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDelete(btn.dataset.id);
        });
      });
    }

    const hasAny = allTools.length > 0;
    const hasFiltered = filtered.length > 0;

    resultCount.textContent = q || activeCategory !== "Tất cả" ? `${filtered.length} tool` : "";
    footerCount.textContent = hasAny ? `${allTools.length} tool đang có trong Nghĩa Huỳnh Toolkit` : "";

    grid.hidden = !hasFiltered;
    emptyState.hidden = hasFiltered;

    if (!hasFiltered) {
      if (!hasAny) {
        emptyTitle.textContent = "Chưa có tool nào";
        emptySub.innerHTML = editMode
          ? 'Bấm nút <strong>+</strong> ở góc dưới để thêm tool đầu tiên.'
          : 'Bấm <strong>Sửa</strong> ở góc trên để thêm tool đầu tiên.';
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

  // ---------- edit mode (unlock via password) ----------

  function updateEditUI() {
    fabAdd.hidden = !editMode;
    editToggle.classList.toggle("active", editMode);
    editToggleIcon.textContent = editMode ? "✓" : "✎";
    editToggleLabel.textContent = editMode ? "Xong" : "Sửa";
    render();
  }

  editToggle.addEventListener("click", () => {
    if (editMode) {
      editMode = false;
      adminPassword = null;
      updateEditUI();
    } else {
      openPasswordModal();
    }
  });

  function openPasswordModal() {
    passwordError.hidden = true;
    passwordForm.reset();
    passwordOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => passwordForm.elements.password.focus(), 50);
  }

  function closePasswordModal() {
    passwordOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  passwordClose.addEventListener("click", closePasswordModal);
  passwordOverlay.addEventListener("click", (e) => {
    if (e.target === passwordOverlay) closePasswordModal();
  });

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    passwordError.hidden = true;

    const fd = new FormData(passwordForm);
    const password = fd.get("password");

    passwordSubmitBtn.disabled = true;
    passwordSubmitBtn.textContent = "Đang kiểm tra…";

    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", password }),
      });
      const data = await res.json();

      if (!res.ok) {
        passwordError.textContent = data.error || "Sai mật khẩu.";
        passwordError.hidden = false;
        return;
      }

      adminPassword = password;
      editMode = true;
      closePasswordModal();
      updateEditUI();
    } catch {
      passwordError.textContent = "Lỗi kết nối, thử lại sau.";
      passwordError.hidden = false;
    } finally {
      passwordSubmitBtn.disabled = false;
      passwordSubmitBtn.textContent = "Mở khoá";
    }
  });

  // ---------- delete ----------

  async function handleDelete(id) {
    const tool = allTools.find((t) => t.id === id);
    const label = tool ? tool.name : "tool này";
    if (!window.confirm(`Xoá "${label}" khỏi Toolkit?`)) return;

    try {
      const res = await fetch("/api/tools", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password: adminPassword }),
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

  // ---------- add / edit tool modal ----------

  function openToolModal(tool) {
    editingId = tool ? tool.id : null;
    modalTitle.textContent = tool ? "Sửa tool" : "Thêm tool mới";
    submitBtn.textContent = tool ? "Lưu thay đổi" : "Thêm tool";
    formError.hidden = true;
    toolForm.reset();

    if (tool) {
      toolForm.elements.name.value = tool.name || "";
      toolForm.elements.url.value = tool.url || "";
      toolForm.elements.icon.value = tool.icon || "";
      toolForm.elements.category.value = tool.category || "";
      toolForm.elements.description.value = tool.description || "";
    }

    modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => toolForm.elements.name.focus(), 50);
  }

  function closeToolModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = "";
    editingId = null;
  }

  fabAdd.addEventListener("click", () => openToolModal(null));
  modalClose.addEventListener("click", closeToolModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeToolModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!modalOverlay.hidden) closeToolModal();
    if (!passwordOverlay.hidden) closePasswordModal();
  });

  toolForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.hidden = true;

    if (!adminPassword) {
      formError.textContent = "Phiên chỉnh sửa đã hết hạn, bấm Sửa lại để mở khoá.";
      formError.hidden = false;
      return;
    }

    const fd = new FormData(toolForm);
    const payload = {
      name: fd.get("name")?.trim(),
      url: fd.get("url")?.trim(),
      icon: fd.get("icon")?.trim(),
      category: fd.get("category")?.trim(),
      description: fd.get("description")?.trim(),
      password: adminPassword,
    };

    const isEditing = Boolean(editingId);
    if (isEditing) payload.id = editingId;

    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? "Đang lưu…" : "Đang thêm…";

    try {
      const res = await fetch("/api/tools", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        formError.textContent = data.error || "Có lỗi xảy ra.";
        formError.hidden = false;
        return;
      }

      if (isEditing) {
        allTools = allTools.map((t) => (t.id === data.tool.id ? data.tool : t));
      } else {
        allTools.push(data.tool);
      }
      buildChips();
      render();
      closeToolModal();
    } catch {
      formError.textContent = "Lỗi kết nối, thử lại sau.";
      formError.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isEditing ? "Lưu thay đổi" : "Thêm tool";
    }
  });

  // ---------- theme ----------

  let theme = "light";
  try {
    const saved = localStorage.getItem("nh-toolkit-theme");
    if (saved) theme = saved;
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";
  } catch {
    /* localStorage unavailable, keep light default */
  }

  function applyTheme() {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      themeIcon.textContent = "☾";
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeIcon.textContent = "☀";
    }
  }

  themeToggle.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    applyTheme();
    try {
      localStorage.setItem("nh-toolkit-theme", theme);
    } catch {
      /* ignore */
    }
  });

  applyTheme();
  updateEditUI();
  loadTools();
})();

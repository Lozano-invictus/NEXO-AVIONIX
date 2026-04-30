let views = {};
let stages = {};
let adminPanels = {};

export function initNavigation(viewsMap, stagesMap, adminPanelsMap = {}) {
  views = viewsMap;
  stages = stagesMap;
  adminPanels = adminPanelsMap;
}

export function showView(viewId) {
  Object.values(views).forEach((v) => v?.classList.remove("active"));
  const target = views[viewId];
  if (target) {
    target.classList.add("active");
    window.scrollTo(0, 0);
  }

  if (viewId !== "loader" && views.loader) {
    views.loader.classList.add("fade-out");
    setTimeout(() => {
      views.loader.style.display = "none";
    }, 800);
  }
}

export function showStage(stageId) {
  Object.values(stages).forEach((s) => {
    if (s) {
      s.style.display = "none";
      s.classList.remove("active");
    }
  });

  const target = stages[stageId];
  if (target) {
    target.style.display = "block";
    setTimeout(() => target.classList.add("active"), 10);
  }

  document.querySelectorAll(".nav-stage-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.stage === stageId);
  });

  document.getElementById("main-nav")?.classList.remove("open");
  window.scrollTo(0, 0);
}

export function showAdminPanel(panelId) {
  Object.values(adminPanels).forEach((p) => {
    if (p) {
      p.classList.remove("active");
      p.style.display = "none";
    }
  });
  const target = adminPanels[panelId];
  if (target) {
    target.style.display = "block";
    setTimeout(() => target.classList.add("active"), 10);
  }
  document.querySelectorAll(".admin-sidebar-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.panel === panelId);
  });
  document.querySelectorAll(".admin-main").forEach(main => {
    if (main.style.display !== "none") main.scrollTop = 0;
  });
}

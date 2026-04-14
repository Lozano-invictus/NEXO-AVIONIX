import { initNavigation, showView, showStage, showAdminPanel } from "./navigation.js";
import { bindAuthHandlers } from "./auth.js";
import { bindBookingHandlers } from "./booking.js";
import { bindUiHelpers } from "./ui.js";
import { initAdmin } from "./admin.js";
import { initRender, renderUserBookings } from "./render.js";
import { state, subscribe, resetState } from "./state.js";

function collectDomMaps() {
  const views = {
    loader:   document.getElementById("loader"),
    login:    document.getElementById("login-view"),
    forgot:   document.getElementById("forgot-view"),
    register: document.getElementById("register-view"),
    verify:   document.getElementById("verify-view"),
    success:  document.getElementById("success-view"),
    client:   document.getElementById("client-view"),
    admin:    document.getElementById("admin-view")
  };

  const stages = {
    home:      document.getElementById("stage-home"),
    results:   document.getElementById("stage-results"),
    seats:     document.getElementById("stage-seats"),
    checkout:  document.getElementById("stage-checkout"),
    dashboard: document.getElementById("stage-dashboard"),
    packages:  document.getElementById("stage-packages"),
    promos:    document.getElementById("stage-promos"),
    help:      document.getElementById("stage-help")
  };

  const adminPanels = {
    dash:     document.getElementById("admin-panel-dash"),
    flights:  document.getElementById("admin-panel-flights"),
    aircraft: document.getElementById("admin-panel-aircraft"),
    routes:   document.getElementById("admin-panel-routes"),
    users:    document.getElementById("admin-panel-users"),
    packages: document.getElementById("admin-panel-packages"),
    reports:  document.getElementById("admin-panel-reports"),
    bookings: document.getElementById("admin-panel-bookings"),
    pqrs:     document.getElementById("admin-panel-pqrs"),
    settings: document.getElementById("admin-panel-settings")
  };

  return { views, stages, adminPanels };
}

export function initApp() {
  const { views, stages, adminPanels } = collectDomMaps();
  initNavigation(views, stages, adminPanels);

  document.querySelectorAll("#client-view .nav-stage-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const stage = link.dataset.stage;
      if (!stage) return;
      if (stage === "dashboard" && !state.currentUser) {
        showView("login");
        return;
      }
      showStage(stage);
    });
  });

  bindAuthHandlers();
  bindBookingHandlers();
  bindUiHelpers();
  initAdmin();
  initRender();

  /* Re-render user bookings on auth change */
  document.addEventListener("nexo:auth-updated", () => {
    renderUserBookings();
  });

  /* Global navigation event for programmatic stage changes */
  document.addEventListener("navigate", (e) => {
    const { stage } = e.detail || {};
    if (stage) {
      if (stage === "dashboard" && !state.currentUser) {
        showView("login");
        return;
      }
      showStage(stage);
    }
  });

  /* Reset state button in settings */
  document.getElementById("btn-reset-state")?.addEventListener("click", () => {
    if (confirm("¿Restablecer todos los datos de demostración? Se borrarán todos los cambios.")) {
      resetState();
      alert("Datos restablecidos a valores de demostración.");
    }
  });

  setTimeout(() => {
    if (!state.currentUser) {
      showView("client");
      showStage("home");
    }
  }, 3200);
}

/**
 * ==================================================
 * Nexo Avionix — Panel de administración
 * ==================================================
 * CRUD con modales para vuelos, paquetes, reservas, PQRs.
 * Todos los cambios pasan por state.notify() → re-render automático.
 */

import { state, notify, nextId, formatCOP } from "./state.js";
import { showAdminPanel, showView, showStage } from "./navigation.js";
import { updateAuthState } from "./auth.js";
import {
  canSeeAdminPanel, canCreateFlight, canDeleteFlight, canEditFlight,
  canCreatePackage, canEditPackage, canDeletePackage,
  canManageBooking, canManagePQR,
  getRoleDisplayLabel
} from "./permissions.js";
import {
  renderAdminFlightsTable, renderAdminPackagesGrid,

  renderAdminBookingsTable, renderAdminPQRsTable,
  renderAdminAircraftTable, renderAdminRoutesTable, renderAdminUsersTable

  renderAdminBookingsTable, renderAdminPQRsTable

} from "./render.js";

/* ================================================================
   MODAL SYSTEM
   ================================================================ */
function openModal(title, bodyHTML, onConfirm, confirmLabel = "Guardar") {
  let overlay = document.getElementById("admin-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "admin-modal-overlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>${title}</h3>
        <button type="button" class="modal-close" aria-label="Cerrar">✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      <div class="modal-footer">
        <button type="button" class="btn-admin-ghost modal-cancel-btn">Cancelar</button>
        <button type="button" class="btn-admin-primary modal-confirm-btn">${confirmLabel}</button>
      </div>
    </div>`;

  requestAnimationFrame(() => overlay.classList.add("active"));

  const close = () => {
    overlay.classList.remove("active");
    setTimeout(() => { overlay.innerHTML = ""; }, 250);
  };

  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector(".modal-cancel-btn").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  overlay.querySelector(".modal-confirm-btn").addEventListener("click", () => {
    if (onConfirm) onConfirm(overlay);
    close();
  });

  /* Focus first input */
  const first = overlay.querySelector("input,select,textarea");
  if (first) setTimeout(() => first.focus(), 100);
}

function openInfoModal(title, bodyHTML) {
  let overlay = document.getElementById("admin-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "admin-modal-overlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>${title}</h3>
        <button type="button" class="modal-close" aria-label="Cerrar">✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      <div class="modal-footer">
        <button type="button" class="btn-admin-primary modal-close-info">Cerrar</button>
      </div>
    </div>`;

  requestAnimationFrame(() => overlay.classList.add("active"));

  const close = () => {
    overlay.classList.remove("active");
    setTimeout(() => { overlay.innerHTML = ""; }, 250);
  };

  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector(".modal-close-info").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
}

/* ================================================================
   ROLE-BASED SIDEBAR FILTER
   ================================================================ */
function applyRoleAccess() {
  const role = state.currentUser?.role;

  document.querySelectorAll(".admin-sidebar-link").forEach((btn) => {
    const panel = btn.dataset.panel;
    const show = canSeeAdminPanel(panel, role);
    btn.classList.toggle("hidden", !show);
  });

  document.getElementById("btn-new-flight")?.classList.toggle("hidden", !canCreateFlight(role));
  document.getElementById("btn-new-package")?.classList.toggle("hidden", !canCreatePackage(role));

  const roleLabel = document.getElementById("admin-user-role");
  if (roleLabel && state.currentUser) roleLabel.textContent = getRoleDisplayLabel(role);

  const activeBtn = document.querySelector(".admin-sidebar-link.active");
  if (activeBtn?.classList.contains("hidden")) showAdminPanel("dash");
}

/* ================================================================
   FLIGHTS — Editar / Crear / Eliminar
   ================================================================ */
function openFlightModal(flight = null) {
  const isNew = !flight;
  const title = isNew ? "Crear nuevo vuelo" : `Editar vuelo ${flight.id}`;
  const f = flight || { id: "", origin: "BOG", dest: "CTG", dep: "12:00", arr: "13:30", aircraft: "B737-800", status: "scheduled", price: 189000 };

  const body = `
    <div class="modal-form-grid">
      <div class="mf-group"><label>Código vuelo</label><input type="text" id="mf-fid" value="${f.id}" ${isNew ? "" : "disabled"} placeholder="NX-500" /></div>
      <div class="mf-group"><label>Origen (IATA)</label><input type="text" id="mf-origin" value="${f.origin}" maxlength="3" /></div>
      <div class="mf-group"><label>Destino (IATA)</label><input type="text" id="mf-dest" value="${f.dest}" maxlength="3" /></div>
      <div class="mf-group"><label>Hora salida</label><input type="time" id="mf-dep" value="${f.dep}" /></div>
      <div class="mf-group"><label>Hora llegada</label><input type="time" id="mf-arr" value="${f.arr}" /></div>
      <div class="mf-group"><label>Aeronave</label><input type="text" id="mf-aircraft" value="${f.aircraft}" /></div>
      <div class="mf-group"><label>Precio (COP)</label><input type="number" id="mf-price" value="${f.price}" min="0" step="1000" /></div>
      <div class="mf-group"><label>Estado</label>
        <select id="mf-status">
          <option value="scheduled" ${f.status === "scheduled" ? "selected" : ""}>Programado</option>
          <option value="in-air" ${f.status === "in-air" ? "selected" : ""}>En aire</option>
          <option value="cancelled" ${f.status === "cancelled" ? "selected" : ""}>Cancelado</option>
        </select>
      </div>
    </div>`;

  openModal(title, body, (overlay) => {
    const code = (overlay.querySelector("#mf-fid").value || "").trim().toUpperCase();
    if (!code) { alert("El código de vuelo es obligatorio."); return; }

    const data = {
      id:       code,
      origin:   (overlay.querySelector("#mf-origin").value || "BOG").trim().toUpperCase().slice(0, 3),
      dest:     (overlay.querySelector("#mf-dest").value || "CTG").trim().toUpperCase().slice(0, 3),
      dep:      overlay.querySelector("#mf-dep").value || "12:00",
      arr:      overlay.querySelector("#mf-arr").value || "13:30",
      aircraft: overlay.querySelector("#mf-aircraft").value || "B737-800",
      price:    parseInt(overlay.querySelector("#mf-price").value, 10) || 189000,
      status:   overlay.querySelector("#mf-status").value || "scheduled"
    };

    if (isNew) {
      if (state.adminFlights.some((x) => x.id === code)) {
        alert("Ya existe un vuelo con ese código.");
        return;
      }
      state.adminFlights.push(data);
    } else {
      const idx = state.adminFlights.findIndex((x) => x.id === flight.id);
      if (idx >= 0) state.adminFlights[idx] = data;
    }
    notify("flights");
  }, isNew ? "Crear" : "Guardar");
}

function onFlightsTableClick(e) {
  const del = e.target.closest(".btn-del-flight");
  if (del) {
    if (!canDeleteFlight(state.currentUser?.role)) return;
    const id = del.dataset.fid;
    if (confirm(`¿Eliminar vuelo ${id}?`)) {
      state.adminFlights = state.adminFlights.filter((f) => f.id !== id);
      notify("flights");
    }
    return;
  }

  const ed = e.target.closest(".btn-edit-flight");
  if (ed) {
    if (!canEditFlight(state.currentUser?.role)) return;
    const f = state.adminFlights.find((x) => x.id === ed.dataset.fid);
    if (f) openFlightModal(f);
  }
}

/* ================================================================
   PACKAGES — Crear / Editar / Eliminar
   ================================================================ */
function openPackageModal(pkg = null) {
  const isNew = !pkg;
  const title = isNew ? "Crear paquete" : `Editar: ${pkg.name}`;
  const p = pkg || { id: "", name: "", price: 0, featured: false, features: [] };

  const body = `
    <div class="modal-form-grid">
      <div class="mf-group mf-full"><label>Nombre del paquete</label><input type="text" id="mf-pkgname" value="${p.name}" placeholder="Economy Plus" /></div>
      <div class="mf-group"><label>Precio (COP)</label><input type="number" id="mf-pkgprice" value="${p.price}" min="0" step="1000" /></div>
      <div class="mf-group"><label>Destacado</label>
        <select id="mf-pkgfeatured">
          <option value="no" ${!p.featured ? "selected" : ""}>No</option>
          <option value="yes" ${p.featured ? "selected" : ""}>Sí (Popular)</option>
        </select>
      </div>
      <div class="mf-group mf-full"><label>Características (una por línea)</label><textarea id="mf-pkgfeats" rows="4" placeholder="Vuelo ida y vuelta&#10;Equipaje 23 kg">${p.features.join("\n")}</textarea></div>
    </div>`;

  openModal(title, body, (overlay) => {
    const name = overlay.querySelector("#mf-pkgname").value.trim();
    if (!name) { alert("El nombre es obligatorio."); return; }

    const data = {
      id:       isNew ? nextId("PKG") : p.id,
      name,
      price:    parseInt(overlay.querySelector("#mf-pkgprice").value, 10) || 0,
      featured: overlay.querySelector("#mf-pkgfeatured").value === "yes",
      features: overlay.querySelector("#mf-pkgfeats").value.split("\n").map((l) => l.trim()).filter(Boolean)
    };

    if (isNew) {
      state.packages.push(data);
    } else {
      const idx = state.packages.findIndex((x) => x.id === p.id);
      if (idx >= 0) state.packages[idx] = data;
    }
    notify("packages");
  }, isNew ? "Crear" : "Guardar");
}

function onPackagesClick(e) {
  const del = e.target.closest(".btn-del-pkg");
  if (del) {
    if (!canDeletePackage(state.currentUser?.role)) return;
    const id = del.dataset.pkgid;
    const pkg = state.packages.find((x) => x.id === id);
    if (pkg && confirm(`¿Eliminar paquete "${pkg.name}"?`)) {
      state.packages = state.packages.filter((x) => x.id !== id);
      notify("packages");
    }
    return;
  }

  const ed = e.target.closest(".btn-edit-pkg");
  if (ed) {
    if (!canEditPackage(state.currentUser?.role)) return;
    const pkg = state.packages.find((x) => x.id === ed.dataset.pkgid);
    if (pkg) openPackageModal(pkg);
  }
}

/* ================================================================
   BOOKINGS — Confirmar / Cancelar
   ================================================================ */
function onBookingsTableClick(e) {
  const confirm_btn = e.target.closest(".btn-confirm-bk");
  if (confirm_btn) {
    const b = state.bookings.find((x) => x.id === confirm_btn.dataset.bid);
    if (b) { b.payment = "paid"; notify("bookings"); }
    return;
  }

  const cancel_btn = e.target.closest(".btn-cancel-bk");
  if (cancel_btn) {
    const b = state.bookings.find((x) => x.id === cancel_btn.dataset.bid);
    if (b && confirm(`¿Cancelar reserva ${b.id}?`)) {
      b.payment = "cancelled";
      notify("bookings");
    }
  }
}

/* ================================================================
   PQRs — Responder / Ver
   ================================================================ */
function onPQRsTableClick(e) {
  const resp = e.target.closest(".btn-respond-pqr");
  if (resp) {
    const p = state.pqrs.find((x) => x.id === resp.dataset.pqrid);
    if (!p) return;

    const body = `
      <div class="modal-form-grid">
        <div class="mf-group mf-full"><label>Cliente</label><input type="text" value="${p.client}" disabled /></div>
        <div class="mf-group mf-full"><label>Asunto</label><input type="text" value="${p.subject}" disabled /></div>
        <div class="mf-group mf-full"><label>Mensaje</label><p class="modal-text-block">${p.message}</p></div>
        <div class="mf-group mf-full"><label>Tu respuesta</label><textarea id="mf-pqr-response" rows="4" placeholder="Escribe la respuesta al cliente…"></textarea></div>
      </div>`;

    openModal(`Responder ${p.id}`, body, (overlay) => {
      const response = overlay.querySelector("#mf-pqr-response").value.trim();
      if (!response) { alert("Escribe una respuesta."); return; }
      p.response = response;
      p.status = "closed";
      notify("pqrs");
    }, "Enviar respuesta");
    return;
  }

  const view = e.target.closest(".btn-view-pqr");
  if (view) {
    const p = state.pqrs.find((x) => x.id === view.dataset.pqrid);
    if (!p) return;

    const body = `
      <div class="modal-info-grid">
        <div class="mi-row"><span class="mi-label">Cliente</span><span>${p.client}</span></div>
        <div class="mi-row"><span class="mi-label">Tipo</span><span>${p.type}</span></div>
        <div class="mi-row"><span class="mi-label">Asunto</span><span>${p.subject}</span></div>
        <div class="mi-row"><span class="mi-label">Mensaje</span><p>${p.message}</p></div>
        <div class="mi-row"><span class="mi-label">Respuesta</span><p class="mi-response">${p.response || "—"}</p></div>
      </div>`;

    openInfoModal(`Detalle ${p.id}`, body);
  }
}

/* ================================================================
   INIT
   ================================================================ */
export function initAdmin() {
  document.addEventListener("nexo:auth-updated", () => {
    applyRoleAccess();
    renderAdminFlightsTable();
    renderAdminPackagesGrid();
    renderAdminBookingsTable();
    renderAdminPQRsTable();
    renderAdminAircraftTable();
    renderAdminRoutesTable();
    renderAdminUsersTable();

  });

  /* Sidebar navigation */
  document.querySelectorAll(".admin-sidebar-link").forEach((btn) => {
    btn.addEventListener("click", () => showAdminPanel(btn.dataset.panel));
  });

  /* Logout / exit */
  document.getElementById("btn-logout-admin")?.addEventListener("click", () => {
    if (confirm("¿Cerrar sesión?")) {
      updateAuthState(null);
      showView("login");
    }
  });

  document.getElementById("btn-exit-to-public")?.addEventListener("click", () => {
    showView("client");
    showStage("home");
  });

  /* Flights */
  document.getElementById("btn-new-flight")?.addEventListener("click", () => {
    if (!canCreateFlight(state.currentUser?.role)) { alert("No tienes permiso."); return; }
    openFlightModal();
  });
  document.getElementById("admin-flights-tbody")?.addEventListener("click", onFlightsTableClick);
  document.getElementById("admin-flight-search")?.addEventListener("input", (e) => {
    renderAdminFlightsTable(e.target.value);
  });

  /* Packages */
  document.getElementById("btn-new-package")?.addEventListener("click", () => {
    if (!canCreatePackage(state.currentUser?.role)) { alert("No tienes permiso."); return; }
    openPackageModal();
  });
  document.getElementById("admin-packages-grid")?.addEventListener("click", onPackagesClick);

  /* Bookings */
  document.getElementById("admin-bookings-tbody")?.addEventListener("click", onBookingsTableClick);

  /* PQRs */
  document.getElementById("admin-pqrs-tbody")?.addEventListener("click", onPQRsTableClick);

  /* Initial render */
  applyRoleAccess();
  renderAdminAircraftTable();
  renderAdminRoutesTable();
  renderAdminUsersTable();
}

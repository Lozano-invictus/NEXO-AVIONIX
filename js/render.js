/**
 * ==================================================
 * Nexo Avionix — Motor de renderizado dinámico
 * ==================================================
 * Cada función renderiza una sección del DOM a partir de state.
 * Se suscribe al bus de eventos para re-renderizar automáticamente.
 */

import { state, subscribe, formatCOP } from "./state.js";
import {
  canCreatePackage, canEditPackage, canDeletePackage,
  canManageBooking, canManagePQR, canDeleteFlight
} from "./permissions.js";
import { updateCharts } from "./charts.js";
import { initCarousel } from "./carousel.js";

/* ================================================================
   HELPER
   ================================================================ */
const PAYMENT_BADGE = {
  paid:      { label: "Pagado",    cls: "badge-ok"   },
  pending:   { label: "Pendiente", cls: "badge-warn" },
  cancelled: { label: "Cancelado", cls: "badge-bad"  }
};

const STATUS_MAP = {
  scheduled: { label: "Programado", cls: "badge-ok"   },
  "in-air":  { label: "En aire",    cls: "badge-warn" },
  cancelled: { label: "Cancelado",  cls: "badge-bad"  }
};

const PQR_STATUS = {
  open:     { label: "Abierto",  cls: "badge-warn" },
  closed:   { label: "Cerrado",  cls: "badge-ok"   }
};

/* ================================================================
   VISTA CLIENTE — Tarjetas de vuelo en resultados
   ================================================================ */
export function renderFlightCards() {
  const list = document.getElementById("flight-results-list");
  if (!list) return;

  const o = state.bookingData.origin  || "BOG";
  const d = state.bookingData.destination || "CTG";

  /* Filtrar vuelos que coincidan con la ruta (o mostrar todos si no hay ruta) */
  const matching = state.adminFlights.filter(
    (f) => f.status !== "cancelled" && (
      (!state.bookingData.origin && !state.bookingData.destination) ||
      (f.origin === o && f.dest === d)
    )
  );

  if (matching.length === 0) {
    list.innerHTML = `
      <div class="no-results-msg">
        <span class="no-results-icon">✈</span>
        <h3>No hay vuelos disponibles</h3>
        <p>Prueba con otra ruta o fecha diferente.</p>
      </div>`;
    return;
  }

  list.innerHTML = matching.map((f) => `
    <div class="flight-card-refined" data-flight-select>
      <div class="card-left">
        <div class="time-block"><b>${f.dep}</b> — <b>${f.arr}</b> <span class="flight-duration" data-duration>~${calcDuration(f.dep, f.arr)}</span></div>
        <div class="carrier-info"><span class="route-inline">${f.origin} → ${f.dest}</span> · Nexo Avionix · <strong>${f.id}</strong> · Económico</div>
      </div>
      <div class="card-right">
        <div class="price-bubble" data-price-display>${formatCOP(f.price)}</div>
        <button type="button" class="btn-select-flight-new" data-price="${f.price}" data-code="${f.id}" data-duration="~${calcDuration(f.dep, f.arr)}">Seleccionar</button>
      </div>
    </div>`).join("");

  /* Actualizar meta */
  const title = document.getElementById("results-route-title");
  const sub   = document.getElementById("results-route-sub");
  if (title) title.textContent = `${o} → ${d}`;
  if (sub) {
    const n = state.bookingData.dateOut
      ? new Date(state.bookingData.dateOut + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
      : "";
    sub.textContent = n ? `${matching.length} resultados · ${n}` : `${matching.length} resultados`;
  }
}

function calcDuration(dep, arr) {
  try {
    const [dh, dm] = dep.split(":").map(Number);
    const [ah, am] = arr.split(":").map(Number);
    let mins = (ah * 60 + am) - (dh * 60 + dm);
    if (mins < 0) mins += 1440;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  } catch { return "—"; }
}

/* ================================================================
   VISTA CLIENTE — Paquetes turísticos
   ================================================================ */
export function renderPackageCards() {
  const grid = document.getElementById("packages-grid-dynamic");
  if (!grid) return;

  if (state.packages.length === 0) {
    grid.innerHTML = `<p class="empty-state-msg">No hay paquetes disponibles en este momento.</p>`;
    return;
  }

  grid.innerHTML = state.packages.map((pkg) => `
    <article class="package-card${pkg.featured ? " package-card--featured" : ""}">
      ${pkg.featured ? '<span class="pkg-badge">Popular</span>' : ""}
      <h3>${pkg.name}</h3>
      <p class="pkg-price">${formatCOP(pkg.price)} <span>/ pers.</span></p>
      <ul class="pkg-list">${pkg.features.map((f) => `<li>✓ ${f}</li>`).join("")}</ul>
      <button type="button" class="btn-pkg" data-to-home>Buscar fechas</button>
    </article>`).join("");
}

/* ================================================================
   VISTA CLIENTE — Destinos populares (precios mínimos dinámicos)
   ================================================================ */
export function renderPopularDestinations() {
  const grid = document.getElementById("popular-dest-grid");
  if (!grid) return;

  const destinations = [
    { code: "CTG", name: "Cartagena", tag: "Playa", img: "imgs/cartagena.jpg", bg: "linear-gradient(160deg,#457B9D 0%,#1D3557 100%)" },
    { code: "ADZ", name: "San Andrés", tag: "Mar caribe", img: "imgs/san-andres.jpg", bg: "linear-gradient(160deg,#A8DADC 0%,#457B9D 100%)" },
    { code: "MDE", name: "Medellín", tag: "Ciudad de la eterna primavera", img: "imgs/medellin.jpg", bg: "linear-gradient(160deg,#1D3557 0%,#457B9D 100%)" },
    { code: "BOG", name: "Bogotá", tag: "Capital cultural", img: "imgs/bogota.jpg", bg: "linear-gradient(160deg,#2B4C7E 0%,#1D3557 100%)" },
    { code: "CLO", name: "Cali", tag: "Salsa y sabor", img: "imgs/cali.jpg", bg: "linear-gradient(160deg,#E63946 0%,#1D3557 100%)" },
    { code: "SMR", name: "Santa Marta", tag: "Sierra Nevada", img: "imgs/santa-marta.jpg", bg: "linear-gradient(160deg,#457B9D 0%,#A8DADC 100%)" }
  ];

  grid.innerHTML = destinations.map((dest) => {
    const flights = state.adminFlights.filter((f) => f.dest === dest.code && f.status !== "cancelled");
    const minPrice = flights.length > 0 ? Math.min(...flights.map((f) => f.price)) : null;
    const imgStyle = `background-image: url('${dest.img}'), ${dest.bg}; background-size: cover; background-position: center;`;
    return `
      <article class="dest-card dest-card--photo" data-dest="${dest.code}">
        <div class="dest-photo" style="${imgStyle}">
          <div class="dest-photo-overlay"></div>
          <span class="dest-tag-overlay">${dest.tag}</span>
        </div>
        <div class="dest-card-body">
          <h4>${dest.name}</h4>
          <p class="dest-price">${minPrice ? `Desde <b>${formatCOP(minPrice)}</b> COP` : "<em>Sin vuelos disponibles</em>"}</p>
          <button class="btn-dest-search" data-dest="${dest.code}">Buscar vuelos →</button>
        </div>
      </article>`;
  }).join("");

  // Agregar event listeners a los botones de destino
  grid.querySelectorAll('.btn-dest-search').forEach(btn => {
    btn.addEventListener('click', () => {
      const destCode = btn.dataset.dest;
      const destName = destinations.find(d => d.code === destCode)?.name || destCode;
      state.bookingData.destination = destCode;
      state.bookingData.destLabel = destName;
      document.getElementById('search-dest') && (document.getElementById('search-dest').value = destName + ' (' + destCode + ')');
      document.dispatchEvent(new CustomEvent('navigate', { detail: { stage: 'results' } }));
    });
  });
}

/* ================================================================
   VISTA CLIENTE — Reservas del usuario en su dashboard
   ================================================================ */
export function renderUserBookings() {
  const container = document.getElementById("user-bookings-list");
  if (!container) return;

  const email = state.currentUser?.email?.toLowerCase();
  if (!email) { container.innerHTML = ""; return; }

  const mine = state.bookings.filter((b) => b.clientEmail?.toLowerCase() === email);
  if (mine.length === 0) {
    container.innerHTML = `<p class="empty-state-msg">No tienes reservas registradas aún.</p>`;
    return;
  }

  container.innerHTML = mine.map((b) => {
    const badge = PAYMENT_BADGE[b.payment] || PAYMENT_BADGE.pending;
    const dateStr = b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "—";
    return `
      <div class="ticket-status-card">
        <div class="ticket-main">
          <div class="ticket-route">${b.route || "—"}</div>
          <div class="ticket-date">${dateStr} · ${b.seat || "—"}</div>
        </div>
        <div class="ticket-badge ${badge.cls}">${badge.label}</div>
      </div>`;
  }).join("");
}

/* ================================================================
   ADMIN — Dashboard stats
   ================================================================ */
export function renderDashboardStats() {
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  const active = state.adminFlights.filter((f) => f.status !== "cancelled").length;
  setTxt("stat-active-flights", active);
  setTxt("stat-total-bookings", state.bookings.length);

  const revenue = state.bookings.filter((b) => b.payment === "paid").reduce((s, b) => s + (b.total || 0), 0);
  setTxt("stat-revenue", formatCOP(revenue));

  /* tabla actividad reciente */
  const tbody = document.getElementById("dash-recent-tbody");
  if (tbody) {
    const recent = state.adminFlights.slice(0, 5);
    tbody.innerHTML = recent.map((f) => {
      const st = STATUS_MAP[f.status] || STATUS_MAP.scheduled;
      return `<tr><td>${f.id}</td><td>${f.origin} → ${f.dest}</td><td>${f.dep}</td><td><span class="badge ${st.cls}">${st.label}</span></td></tr>`;
    }).join("");
  }

  // Actualizar gráficos en tiempo real
  updateCharts();
}

/* ================================================================
   ADMIN — Tabla de vuelos (con precio)
   ================================================================ */
export function renderAdminFlightsTable(filterText = "") {
  const tb = document.getElementById("admin-flights-tbody");
  if (!tb) return;
  const q = filterText.toLowerCase().trim();
  const rows = state.adminFlights.filter(
    (f) => !q || f.id.toLowerCase().includes(q) || f.origin.toLowerCase().includes(q) || f.dest.toLowerCase().includes(q)
  );

  const role = state.currentUser?.role;
  tb.innerHTML = rows.map((f) => {
    const st = STATUS_MAP[f.status] || STATUS_MAP.scheduled;
    return `<tr data-fid="${f.id}">
      <td><strong>${f.id}</strong></td>
      <td>${f.origin}</td>
      <td>${f.dest}</td>
      <td>${f.dep}</td>
      <td>${f.arr}</td>
      <td>${f.aircraft}</td>
      <td>${formatCOP(f.price)}</td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
      <td>
        <button type="button" class="admin-icon-action btn-edit-flight" data-fid="${f.id}">Editar</button>
        ${canDeleteFlight(role) ? `<button type="button" class="admin-icon-action danger btn-del-flight" data-fid="${f.id}">Eliminar</button>` : ""}
      </td>
    </tr>`;
  }).join("");
}

/* ================================================================
   ADMIN — Tabla de reservas
   ================================================================ */
export function renderAdminBookingsTable() {
  const tbody = document.getElementById("admin-bookings-tbody");
  if (!tbody) return;

  const role = state.currentUser?.role;
  tbody.innerHTML = state.bookings.map((b) => {
    const badge = PAYMENT_BADGE[b.payment] || PAYMENT_BADGE.pending;
    return `<tr data-bid="${b.id}">
      <td><strong>${b.id}</strong></td>
      <td>${b.client}</td>
      <td>${b.flightId || "—"}</td>
      <td>${b.route || "—"}</td>
      <td>${b.date || "—"}</td>
      <td><span class="badge ${badge.cls}">${badge.label}</span></td>
      <td>${formatCOP(b.total)}</td>
      <td class="actions-cell">
        ${canManageBooking(role) && b.payment === "pending" ? `<button type="button" class="admin-icon-action btn-confirm-bk" data-bid="${b.id}">Confirmar</button>` : ""}
        ${canManageBooking(role) && b.payment !== "cancelled" ? `<button type="button" class="admin-icon-action danger btn-cancel-bk" data-bid="${b.id}">Cancelar</button>` : ""}
      </td>
    </tr>`;
  }).join("");
}

/* ================================================================
   ADMIN — Grid de paquetes
   ================================================================ */
export function renderAdminPackagesGrid() {
  const grid = document.getElementById("admin-packages-grid");
  if (!grid) return;

  const role = state.currentUser?.role;
  grid.innerHTML = state.packages.map((pkg) => `
    <article class="admin-pkg-card" data-pkgid="${pkg.id}">
      ${pkg.featured ? '<span class="pkg-featured-dot">★</span>' : ""}
      <h4>${pkg.name}</h4>
      <p class="admin-pkg-price">${formatCOP(pkg.price)}</p>
      <ul class="admin-pkg-feats">${pkg.features.map((f) => `<li>${f}</li>`).join("")}</ul>
      <div class="admin-pkg-actions">
        ${canEditPackage(role) ? `<button type="button" class="btn-admin-ghost sm btn-edit-pkg" data-pkgid="${pkg.id}">Editar</button>` : ""}
        ${canDeletePackage(role) ? `<button type="button" class="btn-admin-ghost sm danger-ghost btn-del-pkg" data-pkgid="${pkg.id}">Eliminar</button>` : ""}
      </div>
    </article>`).join("");
}

/* ================================================================
   ADMIN — Tabla de PQRs
   ================================================================ */
export function renderAdminPQRsTable() {
  const tbody = document.getElementById("admin-pqrs-tbody");
  if (!tbody) return;

  const role = state.currentUser?.role;
  tbody.innerHTML = state.pqrs.map((p) => {
    const st = PQR_STATUS[p.status] || PQR_STATUS.open;
    return `<tr data-pqrid="${p.id}">
      <td><strong>${p.id}</strong></td>
      <td>${p.client}</td>
      <td>${p.type}</td>
      <td>${p.subject}</td>
      <td>${p.date || "—"}</td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
      <td>
        ${canManagePQR(role) && p.status === "open" ? `<button type="button" class="admin-icon-action btn-respond-pqr" data-pqrid="${p.id}">Responder</button>` : ""}
        ${p.status === "closed" ? `<button type="button" class="admin-icon-action btn-view-pqr" data-pqrid="${p.id}">Ver</button>` : ""}
      </td>
    </tr>`;
  }).join("");
}

/* ================================================================
   ADMIN — Nuevas Tablas (Aeronaves, Rutas, Usuarios)
   ================================================================ */
export function renderAdminAircraftTable() {
  const tb = document.getElementById("admin-aircraft-tbody");
  if (!tb) return;
  tb.innerHTML = state.aircraft.map(a => `
    <tr>
      <td>${a.model}</td>
      <td><strong>${a.id}</strong></td>
      <td>${a.capacity} pax</td>
      <td><span class="badge ${a.status === 'active' ? 'badge-ok' : 'badge-warn'}">${a.status.toUpperCase()}</span></td>
      <td>${a.lastMx}</td>
    </tr>
  `).join("");
}

export function renderAdminRoutesTable() {
  const tb = document.getElementById("admin-routes-tbody");
  if (!tb) return;
  tb.innerHTML = state.routes.map(r => `
    <tr>
      <td><strong>${r.id}</strong></td>
      <td>${r.origin}</td>
      <td>${r.dest}</td>
      <td>${r.dist.toLocaleString()}</td>
      <td>${r.duration}</td>
      <td>${formatCOP(r.basePrice)}</td>
    </tr>
  `).join("");
}

export function renderAdminUsersTable() {
  const tb = document.getElementById("admin-users-tbody");
  if (!tb) return;
  tb.innerHTML = state.users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.id}</td>
      <td>${u.role}</td>
      <td><span class="badge ${u.status === 'active' ? 'badge-ok' : 'badge-warn'}">${u.status}</span></td>
      <td>${u.email}</td>
    </tr>
  `).join("");
}

/* ================================================================
   SUSCRIPCIONES — Escucha cambios y re-renderiza
   ================================================================ */
export function initRender() {
  subscribe("flights", () => {
    renderFlightCards();
    renderAdminFlightsTable(document.getElementById("admin-flight-search")?.value || "");
    renderDashboardStats();
    renderPopularDestinations();
  });

  subscribe("packages", () => {
    renderPackageCards();
    renderAdminPackagesGrid();
  });

  subscribe("bookings", () => {
    renderUserBookings();
    renderAdminBookingsTable();
    renderDashboardStats();
  });

  subscribe("pqrs", () => {
    renderAdminPQRsTable();
  });

  subscribe("aircraft", renderAdminAircraftTable);
  subscribe("routes",   renderAdminRoutesTable);
  subscribe("users",    renderAdminUsersTable);

  /* Render inicial */
  initCarousel();
  renderPopularDestinations();
  renderPackageCards();
  renderDashboardStats();
  renderAdminFlightsTable();
  renderAdminBookingsTable();
  renderAdminPackagesGrid();
  renderAdminPQRsTable();
  renderUserBookings();
}

/**
 * ==================================================
 * Nexo Avionix — Flujo de reserva
 * ==================================================
 * Buscar → Resultados → Asientos → Checkout → Confirmación
 * Al confirmar, crea una entrada en state.bookings y notifica.
 */

import { state, notify, nextId, formatCOP, CITY_NAMES } from "./state.js";
import { showStage, showView } from "./navigation.js";
import { canUseBookingFlow } from "./permissions.js";
import { renderFlightCards } from "./render.js";

function normalizeCode(str) {
  const s = (str || "").trim();
  if (!s) return "BOG";
  const up = s.toUpperCase();
  const m = up.match(/\(([A-Z]{3})\)/);
  if (m) return m[1];
  const m2 = up.match(/\b([A-Z]{3})\b/);
  if (m2) return m2[1];
  
  // Try finding standard city names
  for (const [code, name] of Object.entries(CITY_NAMES)) {
    if (name.toUpperCase() === up || up.includes(name.toUpperCase())) {
      return code;
    }
  }
  
  return up.slice(0, 3) || "BOG";
}

function updateResultsView() {
  const o = normalizeCode(state.bookingData.originLabel || state.bookingData.origin);
  const d = normalizeCode(state.bookingData.destLabel || state.bookingData.destination);
  state.bookingData.origin = o;
  state.bookingData.destination = d;

  /* renderFlightCards se encarga del DOM */
  renderFlightCards();

  const oName = CITY_NAMES[o] || o;
  const dName = CITY_NAMES[d] || d;

  const hint = document.getElementById("seats-route-hint");
  if (hint) hint.textContent = `Elige asiento para tu vuelo ${oName}–${dName}.`;

  const routeMini = document.getElementById("summary-route-mini");
  if (routeMini) routeMini.textContent = `${oName} → ${dName}`;
}

function syncSeatSummaryPricing() {
  const el = document.getElementById("summary-price-seat");
  if (el) el.textContent = formatCOP(state.bookingData.total);
}

function readPassengerFromForm() {
  state.bookingData.passenger = {
    fullName:  document.getElementById("px-name")?.value?.trim() || "",
    docType:   document.getElementById("px-doc-type")?.value || "CC",
    docNumber: document.getElementById("px-doc-number")?.value?.trim() || "",
    email:     document.getElementById("px-email")?.value?.trim() || "",
    phone:     document.getElementById("px-phone")?.value?.trim() || ""
  };
  return state.bookingData.passenger;
}

function syncCheckoutSummary() {
  const o = state.bookingData.origin;
  const d = state.bookingData.destination;
  const p = state.bookingData.passenger;
  const meta = [state.bookingData.flightCode, "Directo"].filter(Boolean).join(" · ");

  const ckRoute = document.getElementById("ck-route");
  if (ckRoute) ckRoute.textContent = `${o} → ${d}`;
  const ckFlightMeta = document.getElementById("ck-flight-meta");
  if (ckFlightMeta) ckFlightMeta.textContent = meta || "—";
  const ckTimes = document.getElementById("ck-times");
  if (ckTimes) {
    const t = state.bookingData.flightTimes || "—";
    const dur = state.bookingData.duration || "—";
    ckTimes.textContent = `${t} · ${dur}`;
  }

  const nameEl = document.getElementById("ck-px-name");
  if (nameEl) nameEl.textContent = p.fullName || "—";
  const docLine = p.docNumber ? `${p.docType} ${p.docNumber}` : "—";
  const docEl = document.getElementById("ck-px-doc");
  if (docEl) docEl.textContent = docLine;
  const contact = [p.email, p.phone].filter(Boolean).join(" · ") || "—";
  const cEl = document.getElementById("ck-px-contact");
  if (cEl) cEl.textContent = contact;

  const totalEl = document.getElementById("ck-total");
  if (totalEl) totalEl.textContent = formatCOP(state.bookingData.total);
}

function initSeatMap() {
  const grid = document.getElementById("plane-seats-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const rows = 10;
  const cols = ["A", "B", "C", "D", "E", "F"];

  for (let r = 1; r <= rows; r++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "seat-row";

    cols.forEach((c) => {
      const seatId = `${r}${c}`;
      const seat = document.createElement("div");
      seat.className = "seat-item";

      if (Math.random() < 0.2) {
        seat.classList.add("occupied");
      } else {
        seat.addEventListener("click", () => selectSeat(seat, seatId));
      }

      rowDiv.appendChild(seat);
    });
    grid.appendChild(rowDiv);
  }
  state.bookingData.seat = null;
  const cur = document.getElementById("current-seat-sel");
  if (cur) cur.textContent = "—";
}

function selectSeat(el, id) {
  document.querySelectorAll(".seat-item").forEach((s) => s.classList.remove("selected"));
  el.classList.add("selected");
  state.bookingData.seat = id;
  const cs = document.getElementById("current-seat-sel");
  if (cs) cs.textContent = id;
}

function requireAuth(featureName = "continuar") {
  if (canUseBookingFlow(state.currentUser)) return true;
  alert(`Para ${featureName} debes iniciar sesión.`);
  showView("login");
  return false;
}

function setTripMode(mode) {
  const tabs = Array.from(document.querySelectorAll(".trip-tab"));
  tabs.forEach((tab) => {
    const isActive = tab.dataset.trip === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  state.bookingData.tripType = mode;

  const wrap = document.getElementById("field-date-return-wrap");
  const returnInput = document.getElementById("search-date-in");
  const dateLabel = wrap?.querySelector("label");
  if (wrap && returnInput) {
    const oneWay = mode === "ow";
    wrap.classList.toggle("field-date-hidden", oneWay);
    returnInput.disabled = oneWay;
    returnInput.setAttribute("aria-hidden", String(oneWay));
    if (dateLabel) dateLabel.textContent = oneWay ? "Fecha salida" : "Ida · Regreso";
    if (oneWay) returnInput.value = "";
  }
}

function bindTripTabs() {
  const tabs = Array.from(document.querySelectorAll(".trip-tab"));
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.addEventListener("click", () => setTripMode(tab.dataset.trip || "rt"));
    tab.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", " ", "Enter"].includes(e.key)) return;
      e.preventDefault();

      if (e.key === " " || e.key === "Enter") {
        setTripMode(tab.dataset.trip || "rt");
        return;
      }

      const currentIndex = tabs.indexOf(tab);
      const nextIndex =
        e.key === "ArrowRight"
          ? (currentIndex + 1) % tabs.length
          : (currentIndex - 1 + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      setTripMode(tabs[nextIndex].dataset.trip || "rt");
    });
  });

  const defaultTab = tabs.find((t) => t.classList.contains("active")) || tabs[0];
  setTripMode(defaultTab.dataset.trip || "rt");
}

function bindFlightSelection() {
  document.getElementById("flight-results-list")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-select-flight-new");
    if (!btn) return;
    if (!requireAuth("seleccionar un vuelo")) return;

    const price    = parseInt(btn.getAttribute("data-price") || "189000", 10);
    const code     = btn.getAttribute("data-code") || "NX-000";
    const duration = btn.getAttribute("data-duration") || "";
    const card     = btn.closest(".flight-card-refined");
    const timeBlock = card?.querySelector(".time-block");
    const times    = timeBlock ? timeBlock.textContent.replace(/\s+/g, " ").trim() : "";

    state.bookingData.total       = price;
    state.bookingData.flightCode  = code;
    state.bookingData.duration    = duration;
    state.bookingData.flightTimes = times;
    state.bookingData.flight      = { code, price, duration, times };

    const sf = document.getElementById("summary-flight-code");
    if (sf) sf.textContent = code;
    syncSeatSummaryPricing();
    initSeatMap();
    showStage("seats");
  });
}

function bindPaymentToggle() {
  document.querySelector("#stage-checkout")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".pay-method");
    if (!btn) return;
    btn.parentElement.querySelectorAll(".pay-method").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
}

function bindSectionShortcuts() {
  document.getElementById("stage-packages")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-to-home]")) {
      e.preventDefault();
      showStage("home");
    }
  });
  document.getElementById("stage-promos")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-to-results]")) {
      e.preventDefault();
      if (!requireAuth("ver promociones aplicadas a reservas")) return;
      showStage("results");
    }
  });
}

/* ================================================================
   CONFIRMAR RESERVA — Crear en state
   ================================================================ */
function confirmBooking() {
  const bd = state.bookingData;
  const px = bd.passenger;

  const booking = {
    id:          nextId("BK"),
    client:      px.fullName || "Cliente",
    clientEmail: px.email || state.currentUser?.email || "",
    flightId:    bd.flightCode,
    route:       `${bd.origin} → ${bd.destination}`,
    date:        bd.dateOut || new Date().toISOString().slice(0, 10),
    seat:        bd.seat || "—",
    payment:     "pending",
    total:       bd.total,
    docType:     px.docType,
    docNumber:   px.docNumber,
    phone:       px.phone
  };

  state.bookings.push(booking);
  notify("bookings");

  alert("¡Reserva confirmada! Tu tiquete ha sido generado.");
  showStage("dashboard");
}

/* ================================================================
   BIND ALL
   ================================================================ */
export function bindBookingHandlers() {
  bindTripTabs();
  bindFlightSelection();
  bindPaymentToggle();
  bindSectionShortcuts();

  document.getElementById("btn-search-main")?.addEventListener("click", () => {
    if (!requireAuth("buscar y reservar vuelos")) return;
    const originInput = document.getElementById("search-origin")?.value?.trim() || "Bogotá";
    const destInput   = document.getElementById("search-dest")?.value?.trim() || "Cartagena";
    
    const oCode = normalizeCode(originInput);
    const dCode = normalizeCode(destInput);
    
    state.bookingData.originLabel = CITY_NAMES[oCode] || oCode;
    state.bookingData.destLabel   = CITY_NAMES[dCode] || dCode;
    
    // Autofill actual inputs back to ensure clean formatting
    if (document.getElementById("search-origin")) document.getElementById("search-origin").value = state.bookingData.originLabel;
    if (document.getElementById("search-dest")) document.getElementById("search-dest").value = state.bookingData.destLabel;
    state.bookingData.dateOut     = document.getElementById("search-date-out")?.value || "";
    state.bookingData.dateIn      =
      state.bookingData.tripType === "ow"
        ? ""
        : document.getElementById("search-date-in")?.value || "";
    const passSel = document.getElementById("search-passengers");
    state.bookingData.passengers = passSel ? parseInt(passSel.value, 10) || 1 : 1;
    updateResultsView();
    showStage("results");
  });

  document.querySelector(".btn-continue-booking")?.addEventListener("click", () => {
    if (!state.bookingData.seat) {
      alert("Por favor selecciona un asiento.");
      return;
    }
    readPassengerFromForm();
    const px = state.bookingData.passenger;
    if (!px.fullName || !px.docNumber || !px.email || !px.phone) {
      alert("Completa los datos del pasajero (nombre, documento, correo y teléfono).");
      return;
    }
    syncCheckoutSummary();
    showStage("checkout");
  });

  document.getElementById("btn-final-confirm")?.addEventListener("click", (e) => {
    e.preventDefault();
    const btn = e.currentTarget;
    btn.textContent = "Procesando…";
    btn.disabled = true;

    setTimeout(() => {
      confirmBooking();
      btn.textContent = "Pagar ahora";
      btn.disabled = false;
    }, 2000);
  });
}

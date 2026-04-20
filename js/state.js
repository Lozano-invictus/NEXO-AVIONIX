/**
 * ==================================================
 * Nexo Avionix — Estado centralizado reactivo
 * ==================================================
 * Fuente única de verdad para: vuelos, paquetes, reservas, PQRs.
 * Incluye bus de eventos y persistencia localStorage.
 */

/* ── Roles ── */
export const ROLES = {
  CLIENT: "client",
  AGENT: "agent",
  SUPERADMIN: "superadmin"
};

/* ── Credenciales demo ── */
export const SUPERADMIN_EMAIL = "superadmin@nexoavionix.com";
export const AGENT_EMAIL     = "agente@nexoavionix.com";

/* ── Datos por defecto (se usan si localStorage está vacío) ── */
const DEFAULT_FLIGHTS = [
  { id: "NX-102", origin: "BOG", dest: "CTG", dep: "06:00", arr: "07:30", aircraft: "B737-800", status: "scheduled", price: 189000 },
  { id: "NX-118", origin: "BOG", dest: "CTG", dep: "10:15", arr: "11:40", aircraft: "A320neo",  status: "scheduled", price: 210000 },
  { id: "NX-204", origin: "MDE", dest: "SMR", dep: "14:15", arr: "15:45", aircraft: "A320neo",  status: "in-air",    price: 245000 },
  { id: "NX-088", origin: "BOG", dest: "ADZ", dep: "09:40", arr: "11:55", aircraft: "B737-MAX8",status: "scheduled", price: 310000 },
  { id: "NX-330", origin: "CLO", dest: "BOG", dep: "17:00", arr: "18:05", aircraft: "B737-800", status: "scheduled", price: 155000 },
  { id: "NX-415", origin: "MDE", dest: "CTG", dep: "07:30", arr: "08:45", aircraft: "A320neo",  status: "scheduled", price: 198000 },
  { id: "NX-520", origin: "BOG", dest: "MDE", dep: "08:00", arr: "09:05", aircraft: "B737-800", status: "scheduled", price: 120000 },
  { id: "NX-522", origin: "BOG", dest: "MDE", dep: "16:30", arr: "17:35", aircraft: "A320neo",  status: "scheduled", price: 135000 }
];

const DEFAULT_PACKAGES = [
  {
    id: "PKG-001",
    name: "Economy Plus",
    price: 450000,
    featured: false,
    features: ["Vuelo ida y vuelta", "Equipaje 23 kg", "Asiento estándar"]
  },
  {
    id: "PKG-002",
    name: "Caribe Express",
    price: 890000,
    featured: true,
    features: ["CTG o ADZ", "Hotel 3N", "Traslado"]
  },
  {
    id: "PKG-003",
    name: "Ejecutivo",
    price: 1290000,
    featured: false,
    features: ["Prioridad abordaje", "Sala VIP", "Equipaje extra"]
  }
];

const DEFAULT_BOOKINGS = [
  {
    id: "BK-90012",
    client: "María Gómez",
    clientEmail: "maria@correo.com",
    flightId: "NX-102",
    route: "BOG → CTG",
    date: "2026-04-15",
    seat: "3A",
    payment: "paid",
    total: 189000,
    docType: "CC",
    docNumber: "1020304050",
    phone: "+57 300 123 4567"
  },
  {
    id: "BK-90013",
    client: "Luis Pérez",
    clientEmail: "luis@correo.com",
    flightId: "NX-118",
    route: "BOG → CTG",
    date: "2026-04-18",
    seat: "7D",
    payment: "pending",
    total: 210000,
    docType: "CC",
    docNumber: "9988776655",
    phone: "+57 310 987 6543"
  }
];

const DEFAULT_PQRS = [
  { id: "PQR-001", client: "María Gómez", clientEmail: "maria@correo.com", type: "Queja", subject: "Retraso en vuelo NX-204", message: "Mi vuelo sufrió retraso de 2 horas sin aviso.", status: "open", date: "2026-03-28", response: "" },
  { id: "PQR-002", client: "Carlos Ruiz", clientEmail: "carlos@correo.com", type: "Petición", subject: "Cambio de fecha de reserva", message: "Necesito cambiar mi reserva BK-90013 al 20 de abril.", status: "open", date: "2026-03-30", response: "" }
];

const DEFAULT_AIRCRAFT = [
  { model: "Boeing 737-800", id: "HK-4512", capacity: 189, status: "active", lastMx: "2026-01-12" },
  { model: "Airbus A320neo", id: "HK-8820", capacity: 186, status: "mro",    lastMx: "2025-11-28" },
  { model: "Boeing 737-MAX8",id: "HK-5501", capacity: 178, status: "active", lastMx: "2026-02-05" },
  { model: "Airbus A320neo", id: "HK-8825", capacity: 186, status: "active", lastMx: "2026-03-10" },
  { model: "Embraer 190",    id: "HK-2210", capacity: 100, status: "active", lastMx: "2026-02-28" }
];

const DEFAULT_ROUTES = [
  { id: "R-BOG-CTG", origin: "Bogotá", dest: "Cartagena", dist: 1054, duration: "1h 30m", basePrice: 189000 },
  { id: "R-BOG-ADZ", origin: "Bogotá", dest: "San Andrés", dist: 1783, duration: "2h 15m", basePrice: 310000 },
  { id: "R-MDE-SMR", origin: "Medellín", dest: "Santa Marta", dist: 680, duration: "1h 30m", basePrice: 245000 },
  { id: "R-CLO-BOG", origin: "Cali", dest: "Bogotá", dist: 480, duration: "1h 05m", basePrice: 155000 },
  { id: "R-BOG-MDE", origin: "Bogotá", dest: "Medellín", dist: 420, duration: "1h 05m", basePrice: 120000 }
];

const DEFAULT_USERS = [
  { name: "Ana López", id: "NX-EMP-001", role: "Piloto", status: "active", email: "ana@nexoavionix.com" },
  { name: "Carlos Ruiz", id: "NX-EMP-044", role: "Suelo", status: "active", email: "carlos@nexoavionix.com" },
  { name: "Diana Marín", id: "NX-EMP-012", role: "Tripulante", status: "active", email: "diana@nexoavionix.com" },
  { name: "Pedro Soto", id: "NX-EMP-088", role: "Mantenimiento", status: "vacation", email: "pedro@nexoavionix.com" }
];

/* ── localStorage keys ── */
const LS_KEY = "nexo_avionix_state";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted – ignore */ }
  return null;
}

function saveToStorage() {
  try {
    const snap = {
      adminFlights: state.adminFlights,
      packages:     state.packages,
      bookings:     state.bookings,
      pqrs:         state.pqrs,
      aircraft:     state.aircraft,
      routes:       state.routes,
      users:        state.users
    };
    localStorage.setItem(LS_KEY, JSON.stringify(snap));
  } catch { /* quota exceeded – silently fail */ }
}

/* ── Inicializar estado ── */
const stored = loadFromStorage();

export const state = {
  currentUser: null,

  adminFlights: stored?.adminFlights ?? structuredClone(DEFAULT_FLIGHTS),
  packages:     stored?.packages     ?? structuredClone(DEFAULT_PACKAGES),
  bookings:     stored?.bookings     ?? structuredClone(DEFAULT_BOOKINGS),
  pqrs:         stored?.pqrs         ?? structuredClone(DEFAULT_PQRS),
  aircraft:     stored?.aircraft     ?? structuredClone(DEFAULT_AIRCRAFT),
  routes:       stored?.routes       ?? structuredClone(DEFAULT_ROUTES),
  users:        stored?.users        ?? structuredClone(DEFAULT_USERS),

  bookingData: {
    origin: "", originLabel: "",
    destination: "", destLabel: "",
    dateOut: "", dateIn: "",
    passengers: 1,
    flight: null, flightCode: "", duration: "", flightTimes: "",
    seat: null,
    total: 189000,
    tripType: "rt",
    passenger: {
      fullName: "", docType: "CC", docNumber: "", email: "", phone: ""
    }
  }
};

/* ── Bus de eventos reactivo ── */
const listeners = new Map();

/**
 * Suscribirse a cambios.
 * @param {string} event — e.g. "flights", "packages", "bookings", "pqrs", "*"
 * @param {Function} fn
 */
export function subscribe(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);     // unsubscribe
}

/**
 * Notificar cambio. Persiste y ejecuta listeners.
 * @param {string} event
 * @param {*} [detail]
 */
export function notify(event, detail) {
  saveToStorage();
  const fire = (key) => {
    const set = listeners.get(key);
    if (set) set.forEach((fn) => fn(detail));
  };
  fire(event);
  fire("*");
}

/* ── Helpers de IDs únicos ── */
let seq = Date.now();
export function nextId(prefix = "ID") {
  return `${prefix}-${(++seq).toString(36).toUpperCase()}`;
}

/* ── Utilidad formato COP ── */
export function formatCOP(n) {
  const num = typeof n === "number" && !Number.isNaN(n) ? n : 0;
  return `$${num.toLocaleString("es-CO")}`;
}

/* ── Reset demo (para desarrollo) ── */
export function resetState() {
  state.adminFlights = structuredClone(DEFAULT_FLIGHTS);
  state.packages     = structuredClone(DEFAULT_PACKAGES);
  state.bookings     = structuredClone(DEFAULT_BOOKINGS);
  state.pqrs         = structuredClone(DEFAULT_PQRS);
  state.aircraft     = structuredClone(DEFAULT_AIRCRAFT);
  state.routes       = structuredClone(DEFAULT_ROUTES);
  state.users        = structuredClone(DEFAULT_USERS);
  notify("flights");
  notify("packages");
  notify("bookings");
  notify("pqrs");
  notify("aircraft");
  notify("routes");
  notify("users");
}

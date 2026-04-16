/**
 * Matriz de permisos — Nexo Avionix
 * =================================
 * Fuente única para UI y (más adelante) validación contra API.
 *
 * | Área                    | Cliente | Agente | Superadmin |
 * |-------------------------|---------|--------|------------|
 * | Sitio público (browse)  |   ✓*    |   ✓*   |     ✓*     |
 * | Buscar / reservar vuelo |   ✓†    |   ✓†   |     ✓†     |
 * | Panel operaciones       |   ✗     |   ✓    |     ✓      |
 * | Dashboard admin         |   ✗     |   ✓    |     ✓      |
 * | Vuelos: ver/editar      |   ✗     |   ✗    |     ✓      |
 * | Vuelos: crear / eliminar|   ✗     |   ✗    |     ✓      |
 * | Paquetes: crear/editar  |   ✗     |   ✓    |     ✓      |
 * | Paquetes: eliminar      |   ✗     |   ✗    |     ✓      |
 * | Reservas: gestionar     |   ✗     |   ✓    |     ✓      |
 * | PQRs: atender           |   ✗     |   ✓    |     ✓      |
 * | Rutas / Usuarios / Conf.|   ✗     |   ✗    |     ✓      |
 *
 * *Navegación marketing sin login. †Requiere sesión (implementado en booking).
 */

import { ROLES, SUPERADMIN_EMAIL, AGENT_EMAIL } from "./state.js";

/** IDs de panel = data-panel en .admin-sidebar-link */
export const ADMIN_PANELS = {
  DASH:     "dash",
  FLIGHTS:  "flights",
  AIRCRAFT: "aircraft",
  ROUTES:   "routes",
  USERS:    "users",
  PACKAGES: "packages",
  REPORTS:  "reports",
  BOOKINGS: "bookings",
  PQRS:     "pqrs",
  SETTINGS: "settings"
};

const AGENT_HIDDEN_PANELS = new Set([
  ADMIN_PANELS.USERS,
  ADMIN_PANELS.ROUTES,
  ADMIN_PANELS.SETTINGS,
  ADMIN_PANELS.FLIGHTS,
  ADMIN_PANELS.AIRCRAFT
]);

/**
 * Rol inferido solo para demo / hasta conectar API.
 * En producción vendrá del token o del endpoint /me.
 */
export function resolveRoleFromEmail(emailRaw) {
  const email = (emailRaw || "").trim().toLowerCase();
  if (!email) return ROLES.CLIENT;
  if (email === SUPERADMIN_EMAIL.toLowerCase() || email.includes("superadmin") || email.includes("admin")) {
    return ROLES.SUPERADMIN;
  }
  if (email === AGENT_EMAIL.toLowerCase() || email.includes("agente")) {
    return ROLES.AGENT;
  }
  return ROLES.CLIENT;
}

export function getRoleDisplayLabel(role) {
  if (role === ROLES.SUPERADMIN) return "Superadministrador";
  if (role === ROLES.AGENT)     return "Agente";
  if (role === ROLES.CLIENT)    return "Cliente";
  return "Usuario";
}

/** Acceso al panel /admin (vista operaciones). */
export function canAccessAdmin(role) {
  return role === ROLES.AGENT || role === ROLES.SUPERADMIN;
}

/** Mostrar atajo "Operaciones" en navbar cliente. */
export function shouldShowAdminShortcut(user) {
  return canAccessAdmin(user?.role);
}

/** ¿Mostrar enlace del sidebar a este panel? */
export function canSeeAdminPanel(panelId, role) {
  if (!canAccessAdmin(role)) return false;
  if (role === ROLES.SUPERADMIN) return true;
  if (role === ROLES.AGENT) return !AGENT_HIDDEN_PANELS.has(panelId);
  return false;
}

/* ── Vuelos ── */
export function canCreateFlight(role) {
  return role === ROLES.SUPERADMIN;
}
export function canEditFlight(role) {
  return role === ROLES.SUPERADMIN;
}
export function canDeleteFlight(role) {
  return role === ROLES.SUPERADMIN;
}

/* ── Paquetes ── */
export function canCreatePackage(role) {
  return role === ROLES.SUPERADMIN || role === ROLES.AGENT;
}
export function canEditPackage(role) {
  return role === ROLES.SUPERADMIN || role === ROLES.AGENT;
}
export function canDeletePackage(role) {
  return role === ROLES.SUPERADMIN;
}

/* ── Reservas ── */
export function canManageBooking(role) {
  return role === ROLES.SUPERADMIN || role === ROLES.AGENT;
}

/* ── PQRs ── */
export function canManagePQR(role) {
  return role === ROLES.SUPERADMIN || role === ROLES.AGENT;
}

/** Flujo de reserva en sitio público: requiere usuario autenticado (cualquier rol). */
export function canUseBookingFlow(user) {
  return !!user;
}

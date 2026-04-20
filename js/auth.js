import { state, ROLES } from "./state.js";
import { showView, showStage, showAdminPanel } from "./navigation.js";
import {
  resolveRoleFromEmail,
  getRoleDisplayLabel,
  shouldShowAdminShortcut,
  canAccessAdmin
} from "./permissions.js";

function toggleAdminShortcut(user) {
  const btn = document.getElementById("btn-open-admin");
  if (!btn) return;
  if (shouldShowAdminShortcut(user)) btn.classList.remove("hidden");
  else btn.classList.add("hidden");
}

export function updateAuthState(user) {
  state.currentUser = user;
  const loginHeader = document.getElementById("guest-buttons");
  const userSection = document.getElementById("user-section");
  const profileLink = document.getElementById("nav-profile-link");

  if (user) {
    loginHeader?.classList.add("hidden");
    userSection?.classList.remove("hidden");
    profileLink?.classList.remove("hidden");

    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById("user-display-name").textContent = user.name;
    document.getElementById("user-avatar").textContent = initial;

    document.getElementById("user-full-name").textContent = user.name;
    document.getElementById("user-email-display").textContent = user.email;
    const dashAvatar = document.getElementById("dash-avatar");
    if (dashAvatar) dashAvatar.textContent = initial;

    const admName = document.getElementById("admin-user-name");
    const admRole = document.getElementById("admin-user-role");
    if (admName) admName.textContent = user.name;
    if (admRole) admRole.textContent = getRoleDisplayLabel(user.role);
    const admAva = document.getElementById("admin-user-ava");
    if (admAva) admAva.textContent = initial;
    toggleAdminShortcut(user);
  } else {
    loginHeader?.classList.remove("hidden");
    userSection?.classList.add("hidden");
    profileLink?.classList.add("hidden");
    toggleAdminShortcut(null);
  }
  document.dispatchEvent(new CustomEvent("nexo:auth-updated"));
}

function startOtpTimer() {
  let time = 300;
  const display = document.getElementById("otp-timer");
  const interval = setInterval(() => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    if (display)
      display.textContent = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    if (time-- <= 0) clearInterval(interval);
  }, 1000);
}

export function bindAuthHandlers() {
  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailRaw = document.getElementById("login-email").value.trim();
    const email = emailRaw.toLowerCase();
    const name = email.split("@")[0] || "Usuario";
    const role = resolveRoleFromEmail(emailRaw);
    updateAuthState({ name, email: emailRaw, role });

    if (canAccessAdmin(role)) {
      showView("admin");
      showAdminPanel("dash");
      return;
    } else {
      showView("client");
      showStage("home");
    }
  });

  document.getElementById("register-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    state.currentUser = { name, email, role: ROLES.CLIENT };
    showView("verify");
    startOtpTimer();
  });

  document.getElementById("verify-otp-btn")?.addEventListener("click", () => {
    const inputs = document.querySelectorAll(".otp-input");
    const code = Array.from(inputs).map((i) => i.value).join("");
    if (code.length === 6) {
      document.getElementById("success-name").textContent = state.currentUser.name;
      document.getElementById("success-email").textContent = state.currentUser.email;
      showView("success");
    } else {
      alert("Introduce el código de 6 dígitos.");
    }
  });

  document.getElementById("btn-logout-client")?.addEventListener("click", () => {
    if (confirm("¿Cerrar sesión?")) {
      updateAuthState(null);
      showView("login");
    }
  });

  document.getElementById("go-register")?.addEventListener("click", (e) => {
    e.preventDefault();
    showView("register");
  });
  document.getElementById("go-forgot")?.addEventListener("click", (e) => {
    e.preventDefault();
    showView("forgot");
  });
  document.getElementById("back-to-login")?.addEventListener("click", (e) => {
    e.preventDefault();
    showView("login");
  });
  document.getElementById("back-from-forgot")?.addEventListener("click", () => showView("login"));
  document.getElementById("go-home")?.addEventListener("click", () => {
    const u = state.currentUser;
    updateAuthState({ ...u, role: u?.role || ROLES.CLIENT });
    showView("client");
    showStage("home");
  });
  document.getElementById("btn-guest")?.addEventListener("click", () => {
    updateAuthState(null);
    showView("client");
    showStage("home");
  });
  document.getElementById("btn-login-header")?.addEventListener("click", () => showView("login"));
  document.getElementById("btn-register-header")?.addEventListener("click", () =>
    showView("register")
  );

  document.getElementById("btn-open-admin")?.addEventListener("click", () => {
    showView("admin");
    showAdminPanel("dash");
  });
}

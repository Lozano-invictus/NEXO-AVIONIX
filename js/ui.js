function setupToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  btn?.addEventListener("click", () => {
    if (!input) return;
    const isPw = input.type === "password";
    input.type = isPw ? "text" : "password";
  });
}

export function bindUiHelpers() {
  setupToggle("toggle-login-pw", "login-password");
  setupToggle("toggle-reg-pw", "reg-password");

  document.getElementById("mobile-toggle")?.addEventListener("click", () => {
    document.getElementById("main-nav")?.classList.toggle("open");
  });
}

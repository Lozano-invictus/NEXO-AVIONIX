/**
 * Punto de entrada: carga fragmentos HTML y arranca la app.
 * Requiere servir la carpeta del proyecto por HTTP (CORS/file: bloquea fetch).
 */

const PARTIAL_PATHS = [
  "partials/loader.html",
  "partials/login.html",
  "partials/register.html",
  "partials/verify.html",
  "partials/success.html",
  "partials/forgot.html",
  "partials/client.html",
  "partials/admin.html"
];

async function injectPartial(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} (${res.status})`);
  return res.text();
}

async function boot() {
  const root = document.getElementById("app-root");
  if (!root) throw new Error("Falta #app-root en index.html");

  const chunks = await Promise.all(PARTIAL_PATHS.map(injectPartial));
  root.innerHTML = chunks.join("\n");

  const { initApp } = await import("./app.js");
  initApp();
}

boot().catch((err) => {
  const root = document.getElementById("app-root");
  if (root) {
    root.innerHTML = [
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;font-family:system-ui,sans-serif;background:#F1FAEE;color:#1D3557;">',
      "<div style=\"max-width:520px;\">",
      "<h1 style=\"font-size:1.25rem;margin-bottom:1rem;\">No se pudo cargar la aplicación</h1>",
      "<p style=\"opacity:.85;line-height:1.5;margin-bottom:1rem;\">Los fragmentos en <code>partials/</code> se cargan con <code>fetch</code>. Abre el proyecto con un servidor local, por ejemplo:</p>",
      "<pre style=\"background:#fff;padding:1rem;border-radius:8px;overflow:auto;font-size:.85rem;\">cd \"Nexo Avinix\"\nnpx --yes serve .</pre>",
      `<p style="margin-top:1rem;font-size:.9rem;opacity:.8;">Detalle: ${String(err.message)}</p>`,
      "</div></div>"
    ].join("");
  }
});

/**
 * NEXO AVIONIX — Logic and Navigation (V2)
 * Handles strictly isolated stage transitions, simulated auth, 
 * interactive seat maps, and the complete flight booking flow.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- Core State ---
  let currentUser = null;
  let bookingData = {
    origin: "",
    destination: "",
    date: "",
    passengers: 1,
    flight: null,
    seat: null,
    total: 189000
  };

  // --- DOM References ---
  const views = {
    loader: document.getElementById("loader"),
    login: document.getElementById("login-view"),
    forgot: document.getElementById("forgot-view"),
    register: document.getElementById("register-view"),
    verify: document.getElementById("verify-view"),
    success: document.getElementById("success-view"),
    client: document.getElementById("client-view")
  };

  const stages = {
    home: document.getElementById("stage-home"),
    results: document.getElementById("stage-results"),
    seats: document.getElementById("stage-seats"),
    checkout: document.getElementById("stage-checkout"),
    dashboard: document.getElementById("stage-dashboard")
  };

  // --- 1. Navigation Engine (Isolated Stages) ---

  /**
   * Switches the main top-level view (Auth vs Client)
   */
  function showView(viewId) {
    Object.values(views).forEach(v => v?.classList.remove("active"));
    const target = views[viewId];
    if (target) {
      target.classList.add("active");
      window.scrollTo(0, 0);
    }

    // Special loader fade-out
    if (viewId !== 'loader' && views.loader) {
      views.loader.classList.add("fade-out");
      setTimeout(() => { views.loader.style.display = 'none'; }, 800);
    }
  }

  /**
   * Switches the active stage within the Client View
   */
  function showStage(stageId) {
    Object.values(stages).forEach(s => {
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

    // Update Nav Links Active State
    document.querySelectorAll(".nav-stage-link").forEach(link => {
      link.classList.toggle("active", link.dataset.stage === stageId);
    });

    window.scrollTo(0, 0);
  }

  // Bind Nav Links
  document.querySelectorAll(".nav-stage-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const stage = link.dataset.stage;
      showStage(stage);
      
      // Mobile menu close
      document.getElementById("main-nav")?.classList.remove("open");
    });
  });

  // --- 2. Authentication Logic ---

  function updateAuthState(user) {
    currentUser = user;
    const loginHeader = document.getElementById("guest-buttons");
    const userSection = document.getElementById("user-section");
    const profileLink = document.getElementById("nav-profile-link");

    if (user) {
      loginHeader?.classList.add("hidden");
      userSection?.classList.remove("hidden");
      profileLink?.classList.remove("hidden");
      
      document.getElementById("user-display-name").textContent = user.name;
      document.getElementById("user-avatar").textContent = user.name.charAt(0).toUpperCase();
      
      // Update Dashboard if data exists
      document.getElementById("user-full-name").textContent = user.name;
      document.getElementById("user-email-display").textContent = user.email;
    } else {
      loginHeader?.classList.remove("hidden");
      userSection?.classList.add("hidden");
      profileLink?.classList.add("hidden");
    }
  }

  // Login Form
  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    updateAuthState({ name: email.split('@')[0], email });
    showView("client");
    showStage("home");
  });

  // Register -> Verify -> Success
  document.getElementById("register-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    currentUser = { name, email }; // Temp storage
    showView("verify");
    startOtpTimer();
  });

  document.getElementById("verify-otp-btn")?.addEventListener("click", () => {
    const inputs = document.querySelectorAll(".otp-input");
    const code = Array.from(inputs).map(i => i.value).join("");
    if (code.length === 6) {
      document.getElementById("success-name").textContent = currentUser.name;
      document.getElementById("success-email").textContent = currentUser.email;
      showView("success");
    } else {
      alert("Introduce el código de 6 dígitos.");
    }
  });

  // Logout
  document.getElementById("btn-logout-client")?.addEventListener("click", () => {
    if (confirm("¿Cerrar sesión?")) {
      updateAuthState(null);
      showView("login");
    }
  });

  // View Transitions
  document.getElementById("go-register")?.addEventListener("click", () => showView("register"));
  document.getElementById("go-forgot")?.addEventListener("click", () => showView("forgot"));
  document.getElementById("back-to-login")?.addEventListener("click", () => showView("login"));
  document.getElementById("go-home")?.addEventListener("click", () => { showView("client"); showStage("home"); });
  document.getElementById("btn-guest")?.addEventListener("click", () => { updateAuthState(null); showView("client"); showStage("home"); });
  document.getElementById("btn-login-header")?.addEventListener("click", () => showView("login"));
  document.getElementById("btn-register-header")?.addEventListener("click", () => showView("register"));

  // --- 3. Booking Flow Logic ---

  // Stage 1: Search
  document.getElementById("btn-search-main")?.addEventListener("click", () => {
    bookingData.origin = document.getElementById("search-origin").value || "BOG";
    bookingData.destination = document.getElementById("search-dest").value || "CTG";
    
    // Smooth transition to results
    showStage("results");
  });

  // Stage 2: Select Flight
  document.querySelectorAll(".btn-select-flight-new").forEach(btn => {
    btn.addEventListener("click", () => {
      const priceText = btn.previousElementSibling.textContent;
      bookingData.total = parseInt(priceText.replace(/[^0-9]/g, ""));
      initSeatMap();
      showStage("seats");
    });
  });

  // Stage 3: Seats
  function initSeatMap() {
    const grid = document.getElementById("plane-seats-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    // Generate 10 rows, A-F
    const rows = 10;
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let r = 1; r <= rows; r++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "seat-row";
      
      cols.forEach(c => {
        const seatId = `${r}${c}`;
        const seat = document.createElement("div");
        seat.className = "seat-item";
        
        // Randomly occupy some seats
        if (Math.random() < 0.2) {
          seat.classList.add("occupied");
        } else {
          seat.addEventListener("click", () => selectSeat(seat, seatId));
        }
        
        rowDiv.appendChild(seat);
      });
      grid.appendChild(rowDiv);
    }
  }

  function selectSeat(el, id) {
    document.querySelectorAll(".seat-item").forEach(s => s.classList.remove("selected"));
    el.classList.add("selected");
    bookingData.seat = id;
    document.getElementById("current-seat-sel").textContent = id;
  }

  document.querySelector(".btn-continue-booking")?.addEventListener("click", () => {
    if (!bookingData.seat) {
      alert("Por favor selecciona un asiento.");
      return;
    }
    showStage("checkout");
  });

  // Stage 4: Checkout
  document.getElementById("btn-final-confirm")?.addEventListener("click", (e) => {
    e.preventDefault();
    const btn = e.target;
    btn.textContent = "Procesando...";
    btn.disabled = true;

    setTimeout(() => {
      alert("¡Reserva confirmada! Tu tiquete ha sido generado.");
      showStage("dashboard");
      // Reset button
      btn.textContent = "Pagar e Iniciar Viaje";
      btn.disabled = false;
    }, 2000);
  });

  // --- 4. UI Helpers ---

  // OTP Timer
  function startOtpTimer() {
    let time = 300;
    const display = document.getElementById("otp-timer");
    const interval = setInterval(() => {
      const m = Math.floor(time / 60);
      const s = time % 60;
      if (display) display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      if (time-- <= 0) clearInterval(interval);
    }, 1000);
  }

  // PW Toggle
  const setupToggle = (btnId, inputId) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    btn?.addEventListener("click", () => {
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
    });
  };
  setupToggle("toggle-login-pw", "login-password");
  setupToggle("toggle-reg-pw", "reg-password");

  // Mobile Toggle
  document.getElementById("mobile-toggle")?.addEventListener("click", () => {
    document.getElementById("main-nav")?.classList.toggle("open");
  });

  // Initial State
  setTimeout(() => showView("login"), 3200);
});

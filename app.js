/* Arte Francés Centro de Belleza — demo interactiva
   Business name = ONE swappable constant. All copy in Spanish.
   No prices, no durations, no invented facts anywhere. */
const BUSINESS = {
  name: "Arte Francés",
  fullName: "Arte Francés Centro de Belleza",
  legal: "BELPRO S.A.S",
  nit: "NIT 900.774.886-4",
  address: "Avenida 6N 23DN-40, Cali 760046",
  phone: "(2) 668 4445",
  phoneHref: "tel:+5726684445",
  email: "servicioalcliente@artefrances.com",
  facebook: "ArteFrancesCentrodeBelleza",
  facebookUrl: "https://www.facebook.com/ArteFrancesCentrodeBelleza",
  hoursWeek: "Lunes a sábado · 8:00 – 19:00",
  hoursSun: "Domingos y festivos · 9:00 – 18:00",
  rating: "4.2 ★ · más de 500 reseñas"
};

/* ---------- reveal on scroll ---------- */
(function () {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
})();

/* ---------- testimonials carousel ---------- */
(function () {
  const track = document.querySelector("[data-carousel-track]");
  if (!track) return;
  const slides = track.children.length;
  const dotsWrap = document.querySelector("[data-carousel-dots]");
  const prev = document.querySelector("[data-carousel-prev]");
  const next = document.querySelector("[data-carousel-next]");
  let i = 0, timer = null;
  for (let n = 0; n < slides; n++) {
    const d = document.createElement("button");
    d.type = "button"; d.setAttribute("aria-label", "Ir al testimonio " + (n + 1));
    d.addEventListener("click", () => go(n, true));
    dotsWrap.appendChild(d);
  }
  const dots = dotsWrap.children;
  function go(n, manual) {
    i = (n + slides) % slides;
    track.style.transform = "translateX(-" + i * 100 + "%)";
    for (let k = 0; k < dots.length; k++) dots[k].setAttribute("aria-current", k === i ? "true" : "false");
    if (manual) restart();
  }
  function restart() { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); }
  prev.addEventListener("click", () => go(i - 1, true));
  next.addEventListener("click", () => go(i + 1, true));
  go(0); restart();
})();

/* ---------- servicios filter ---------- */
(function () {
  const chips = document.querySelectorAll("[data-filter]");
  if (!chips.length) return;
  chips.forEach(chip => chip.addEventListener("click", () => {
    chips.forEach(c => { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
    chip.classList.add("active"); chip.setAttribute("aria-pressed", "true");
    const f = chip.dataset.filter;
    document.querySelectorAll("[data-group]").forEach(g => {
      g.hidden = !(f === "todos" || g.dataset.group.split(" ").includes(f));
    });
  }));
})();

/* ---------- booking flow ---------- */
(function () {
  const flow = document.querySelector("[data-booking]");
  if (!flow) return;

  const SERVICES = {
    corte:  { name: "El Corte Arte",            cat: "Peluquería" },
    color:  { name: "Color Francés & Balayage", cat: "Peluquería" },
    piel:   { name: "Ritual de Piel & Facial",  cat: "Estética" },
    manos:  { name: "Manicura & Pedicure Spa",  cat: "Manicure & Pedicure" }
  };
  const SEDES = {
    principal: { name: "Sede Principal — Avenida 6N", detail: "Av. 6N 23DN-40, Cali" },
    sur:       { name: "Sede Sur — Cali",             detail: "Dirección por confirmar" },
    oeste:     { name: "Sede Oeste — Cali",           detail: "Dirección por confirmar" }
  };
  const state = { service: "corte", sede: "principal", pro: "Primer disponible", date: null, time: null, name: "", phone: "", email: "" };

  const DAYS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const DAYS_SHORT = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
  const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const SLOT_MORNING = ["08:30","09:15","10:00","11:00","11:45"];
  const SLOT_AFTERNOON = ["14:00","15:15","16:00","17:00","17:45","18:30"];

  function fmtDate(d) {
    return DAYS_ES[d.getDay()] + " " + d.getDate() + " de " + MONTHS_ES[d.getMonth()] + " de " + d.getFullYear();
  }
  function codeFrom() {
    const seed = (state.name + "|" + (state.date ? state.date.toISOString().slice(0, 10) : "") + "|" + (state.time || "") + "|" + state.service).toLowerCase();
    let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return "AF-2026-" + String(h % 10000).padStart(4, "0");
  }

  /* --- dynamic date chips: next 7 real days from today --- */
  const dateWrap = document.querySelector("[data-date-chips]");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = [];
  for (let k = 0; k < 7; k++) {
    const d = new Date(today); d.setDate(today.getDate() + k); days.push(d);
    const b = document.createElement("button");
    b.type = "button"; b.className = "date-chip" + (k === 0 ? " selected" : "");
    b.innerHTML = "<b>" + DAYS_SHORT[d.getDay()] + " " + d.getDate() + "</b><small>" + (k === 0 ? "Hoy" : "Disponible") + "</small>";
    b.addEventListener("click", () => {
      dateWrap.querySelectorAll(".date-chip").forEach(c => c.classList.remove("selected"));
      b.classList.add("selected"); state.date = d; state.time = null;
      renderSlots(); updateSummary();
    });
    dateWrap.appendChild(b);
  }
  state.date = days[0];

  /* --- time slots (real hours: Lun–Sáb 8:00–19:00, Dom 9:00–18:00) --- */
  const slotWrap = document.querySelector("[data-slots]");
  function renderSlots() {
    slotWrap.innerHTML = "";
    const isSunday = state.date.getDay() === 0;
    [["Mañana", SLOT_MORNING], ["Tarde", SLOT_AFTERNOON]].forEach(([label, list]) => {
      const g = document.createElement("div"); g.className = "slot-group";
      g.innerHTML = "<h4>" + label + "</h4>";
      const row = document.createElement("div"); row.className = "slot-row";
      list.forEach(t => {
        const s = document.createElement("button");
        s.type = "button"; s.className = "slot"; s.textContent = t;
        const hour = parseInt(t.split(":")[0], 10);
        if (isSunday && hour >= 18) s.disabled = true;
        if (isSunday && hour < 9) s.disabled = true;
        s.addEventListener("click", () => {
          slotWrap.querySelectorAll(".slot").forEach(x => x.classList.remove("selected"));
          s.classList.add("selected"); state.time = t; updateSummary();
        });
        row.appendChild(s);
      });
      g.appendChild(row); slotWrap.appendChild(g);
    });
  }
  renderSlots();

  /* --- option cards (service / sede / pro) --- */
  function bindOptions(attr, key) {
    document.querySelectorAll("[data-opt-" + attr + "]").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll("[data-opt-" + attr + "]").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        state[key] = card.dataset["opt" + attr[0].toUpperCase() + attr.slice(1)];
        updateSummary();
      });
    });
  }
  bindOptions("service", "service");
  bindOptions("sede", "sede");
  bindOptions("pro", "pro");

  /* --- pre-select service from Servicios (?servicio=corte) --- */
  const pre = new URLSearchParams(location.search).get("servicio");
  if (pre && SERVICES[pre]) {
    document.querySelectorAll("[data-opt-service]").forEach(c => {
      const on = c.dataset.optService === pre;
      c.classList.toggle("selected", on);
      if (on) state.service = pre;
    });
  }

  /* --- summary panel --- */
  const sumService = document.querySelector("[data-sum-service]");
  const sumSede = document.querySelector("[data-sum-sede]");
  const sumDate = document.querySelector("[data-sum-date]");
  const sumTime = document.querySelector("[data-sum-time]");
  function updateSummary() {
    if (sumService) sumService.textContent = SERVICES[state.service].name;
    if (sumSede) sumSede.textContent = SEDES[state.sede].name;
    if (sumDate) sumDate.textContent = state.date ? fmtDate(state.date) : "—";
    if (sumTime) sumTime.textContent = state.time || "—";
  }
  updateSummary();

  /* --- stepper --- */
  const panels = ["step1", "step2", "step3", "confirm"].map(id => document.getElementById(id));
  const stepItems = document.querySelectorAll("[data-step-item]");
  function showStep(n) {
    panels.forEach((p, idx) => { if (p) p.hidden = idx !== n; });
    stepItems.forEach((s, idx) => {
      s.classList.toggle("active", idx === n);
      s.classList.toggle("done", idx < n);
    });
    window.scrollTo({ top: flow.offsetTop - 90, behavior: "smooth" });
  }
  document.querySelectorAll("[data-goto]").forEach(b =>
    b.addEventListener("click", () => showStep(parseInt(b.dataset.goto, 10))));

  /* --- step 3 validation + confirm --- */
  const form = document.getElementById("booking-form");
  const nameInput = document.getElementById("bk-name");
  const phoneInput = document.getElementById("bk-phone");
  const emailInput = document.getElementById("bk-email");
  const bkError = document.getElementById("bk-error");
  function markInvalid(input, bad) {
    input.closest(".field").classList.toggle("invalid", bad);
    return !bad;
  }
  form.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true;
    ok = markInvalid(nameInput, nameInput.value.trim().length < 2) && ok;
    ok = markInvalid(phoneInput, phoneInput.value.trim().length < 7) && ok;
    ok = markInvalid(emailInput, emailInput.value.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) && ok;
    if (!state.time) {
      bkError.textContent = "Elige una hora para tu cita."; bkError.classList.add("show"); ok = false;
    } else { bkError.classList.remove("show"); }
    if (!ok) return;
    state.name = nameInput.value.trim();
    state.phone = phoneInput.value.trim();
    state.email = emailInput.value.trim();
    document.getElementById("cf-service").textContent = SERVICES[state.service].name;
    document.getElementById("cf-sede").textContent = SEDES[state.sede].name;
    document.getElementById("cf-date").textContent = fmtDate(state.date) + " · " + state.time;
    document.getElementById("cf-name").textContent = state.name;
    document.getElementById("cf-code").textContent = codeFrom();
    showStep(3);
  });
  const again = document.getElementById("book-again");
  if (again) again.addEventListener("click", () => {
    form.reset(); state.time = null; state.date = days[0];
    dateWrap.querySelectorAll(".date-chip").forEach((c, k) => c.classList.toggle("selected", k === 0));
    renderSlots(); updateSummary(); showStep(0);
  });
})();

/* ---------- contact form: validation + gracias state ---------- */
(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const errBox = document.getElementById("ct-error");
  form.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true;
    const name = document.getElementById("ct-name");
    const phone = document.getElementById("ct-phone");
    const email = document.getElementById("ct-email");
    const motivo = document.getElementById("ct-motivo");
    const msg = document.getElementById("ct-msg");
    const consent = document.getElementById("ct-consent");
    function check(input, bad) { input.closest(".field, .check-row").classList.toggle("invalid", bad); if (bad) ok = false; }
    check(name, name.value.trim().length < 2);
    check(phone, phone.value.trim().length < 7);
    check(email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
    check(motivo, motivo.value === "");
    check(msg, msg.value.trim().length < 5);
    const consentField = consent.closest(".check-row");
    consentField.classList.toggle("invalid", !consent.checked);
    if (!consent.checked) ok = false;
    if (!ok) {
      errBox.textContent = "Revisa los campos marcados: todos son obligatorios para enviar tu mensaje.";
      errBox.classList.add("show"); return;
    }
    errBox.classList.remove("show");
    document.getElementById("ct-gracias-name").textContent = name.value.trim().split(" ")[0];
    form.hidden = true;
    document.getElementById("contact-gracias").hidden = false;
  });
  const again = document.getElementById("contact-again");
  if (again) again.addEventListener("click", () => {
    form.reset(); form.hidden = false;
    document.getElementById("contact-gracias").hidden = true;
  });
})();

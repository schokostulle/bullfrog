/**
 * Login & Registrierung.
 * Nutzt eine "Fake-E-Mail" (username@roster.local), damit sich Nutzer
 * ohne echtes Postfach mit einem Benutzernamen registrieren können.
 * Voraussetzung: In Supabase unter Authentication → Providers → Email
 * muss "Confirm email" deaktiviert sein, sonst wartet der Account auf
 * eine Bestätigungsmail, die nie ankommt.
 */

const msgEl = document.getElementById("msg");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");

function showMessage(text, type = "error") {
  msgEl.textContent = text;
  msgEl.className = `msg show msg-${type === "error" ? "error" : "ok"}`;
}
function clearMessage() {
  msgEl.className = "msg";
}

tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));

function switchTab(which) {
  clearMessage();
  const isLogin = which === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  formLogin.classList.toggle("active", isLogin);
  formRegister.classList.toggle("active", !isLogin);
}

// ---------- Redirect, falls schon eingeloggt ----------
(async function checkExistingSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) window.location.href = "app.html";
})();

// ---------- Login ----------
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();
  const submitBtn = formLogin.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: usernameToFakeEmail(username),
    password,
  });

  submitBtn.disabled = false;

  if (error) {
    showMessage("Anmeldung fehlgeschlagen: Benutzername oder Passwort falsch.");
    return;
  }
  window.location.href = "app.html";
});

// ---------- Registrierung ----------
formRegister.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();
  const submitBtn = formRegister.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!/^[A-Za-z0-9_-]{3,24}$/.test(username)) {
    showMessage("Benutzername: nur Buchstaben, Zahlen, _ und -, mind. 3 Zeichen.");
    submitBtn.disabled = false;
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email: usernameToFakeEmail(username),
    password,
    options: { data: { username } }, // wird vom DB-Trigger in profiles übernommen
  });

  submitBtn.disabled = false;

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      showMessage("Dieser Benutzername ist bereits vergeben.");
    } else {
      showMessage("Registrierung fehlgeschlagen: " + error.message);
    }
    return;
  }

  showMessage("Konto erstellt. Du kannst dich jetzt anmelden.", "ok");
  switchTab("login");
  document.getElementById("login-username").value = username;
  formRegister.reset();
});

/**
 * App-Orchestrierung: Auth-Guard, View-Wechsel, Player-Modal,
 * Mitgliederverwaltung (Admin). Datenzugriff für Spieler liegt in players.js.
 */

let currentUser = null;
let currentProfile = null; // { id, username, role }

const els = {
  whoName: document.getElementById("who-name"),
  whoRole: document.getElementById("who-role"),
  navMembers: document.getElementById("nav-members"),
  rosterMsg: document.getElementById("msg-roster"),
  membersMsg: document.getElementById("msg-members"),
  playerModal: document.getElementById("player-modal"),
  playerModalTitle: document.getElementById("player-modal-title"),
  playerModalMsg: document.getElementById("msg-player-modal"),
  formPlayer: document.getElementById("form-player"),
};

function flash(el, text, type = "error") {
  el.textContent = text;
  el.className = `msg show msg-${type === "error" ? "error" : "ok"}`;
  if (type !== "error") setTimeout(() => (el.className = "msg"), 2500);
}

// ---------------------------------------------------------
// Boot: Session prüfen, Profil laden
// ---------------------------------------------------------
(async function init() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }
  currentUser = sessionData.session.user;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("id, username, role")
    .eq("id", currentUser.id)
    .single();

  if (error || !profile) {
    // Profil fehlt (z. B. Trigger nicht eingerichtet) -> Fallback
    window.showDebugError("Profil laden: " + (error ? error.message : "kein Profil gefunden"));
    flash(els.rosterMsg, "Profil konnte nicht geladen werden. Bitte Admin kontaktieren.");
    return;
  }

  currentProfile = profile;
  els.whoName.textContent = profile.username;
  els.whoRole.textContent = profile.role === "admin" ? "Admin" : "Member";
  els.whoRole.classList.add(profile.role === "admin" ? "badge-admin" : "badge-member");

  if (profile.role === "admin") {
    els.navMembers.style.display = "flex";
  }

  await loadRoster();
  wireNav();
  wirePlayerModal();
  wireLogout();
})();

// ---------------------------------------------------------
// Navigation zwischen Views
// ---------------------------------------------------------
function wireNav() {
  document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
      if (btn.dataset.view === "members") loadMembers();
    });
  });
}

function wireLogout() {
  document.getElementById("btn-logout").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });
}

// ---------------------------------------------------------
// Roster laden & Interaktionen
// ---------------------------------------------------------
async function loadRoster() {
  try {
    const players = await Players.list();
    renderRoster(players, currentProfile.role === "admin");
    wireRosterActions();
  } catch (err) {
    window.showDebugError("Roster laden: " + (err.message || err));
    flash(els.rosterMsg, "Spieler konnten nicht geladen werden.");
  }
}

function wireRosterActions() {
  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openPlayerModal(btn.dataset.edit));
  });
  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => handleDeletePlayer(btn.dataset.delete));
  });
}

async function handleDeletePlayer(id) {
  if (!confirm("Diesen Spieler wirklich löschen?")) return;
  try {
    await Players.remove(id);
    await loadRoster();
    flash(els.rosterMsg, "Spieler gelöscht.", "ok");
  } catch (err) {
    window.showDebugError("Spieler löschen: " + (err.message || err));
    flash(els.rosterMsg, "Löschen fehlgeschlagen.");
  }
}

// ---------------------------------------------------------
// Player-Modal (Hinzufügen / Bearbeiten)
// ---------------------------------------------------------
let editingPlayers = []; // Cache der zuletzt geladenen Liste für schnelles Editieren

function wirePlayerModal() {
  document.getElementById("btn-add-player").addEventListener("click", () => openPlayerModal(null));
  document.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", closePlayerModal)
  );
  els.playerModal.addEventListener("click", (e) => {
    if (e.target === els.playerModal) closePlayerModal();
  });

  els.formPlayer.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("p-submit");
    submitBtn.disabled = true;
    els.playerModalMsg.className = "msg";

    const id = document.getElementById("p-id").value;
    const payload = {
      name: document.getElementById("p-name").value.trim(),
      game_role: document.getElementById("p-role").value.trim() || null,
      rank: document.getElementById("p-rank").value.trim() || null,
      contact: document.getElementById("p-contact").value.trim() || null,
      kda: document.getElementById("p-kda").value || null,
      winrate: document.getElementById("p-winrate").value || null,
      notes: document.getElementById("p-notes").value.trim() || null,
    };

    try {
      if (id) {
        await Players.update(id, payload);
      } else {
        payload.created_by = currentProfile.id;
        await Players.create(payload);
      }
      closePlayerModal();
      await loadRoster();
      flash(els.rosterMsg, id ? "Spieler aktualisiert." : "Spieler hinzugefügt.", "ok");
    } catch (err) {
      window.showDebugError("Spieler speichern: " + (err.message || err));
      flash(els.playerModalMsg, "Speichern fehlgeschlagen: " + err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function openPlayerModal(id) {
  els.formPlayer.reset();
  els.playerModalMsg.className = "msg";
  document.getElementById("p-id").value = "";

  if (id) {
    els.playerModalTitle.textContent = "Spieler bearbeiten";
    try {
      const players = await Players.list();
      editingPlayers = players;
      const p = players.find((x) => String(x.id) === String(id));
      if (p) {
        document.getElementById("p-id").value = p.id;
        document.getElementById("p-name").value = p.name || "";
        document.getElementById("p-role").value = p.game_role || "";
        document.getElementById("p-rank").value = p.rank || "";
        document.getElementById("p-contact").value = p.contact || "";
        document.getElementById("p-kda").value = p.kda ?? "";
        document.getElementById("p-winrate").value = p.winrate ?? "";
        document.getElementById("p-notes").value = p.notes || "";
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    els.playerModalTitle.textContent = "Spieler hinzufügen";
  }

  els.playerModal.classList.add("show");
}

function closePlayerModal() {
  els.playerModal.classList.remove("show");
}

// ---------------------------------------------------------
// Mitgliederverwaltung (nur Admin sichtbar)
// ---------------------------------------------------------
async function loadMembers() {
  const container = document.getElementById("members-container");
  container.innerHTML = `<p class="skeleton">Lade Mitglieder…</p>`;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, role")
    .order("username", { ascending: true });

  if (error) {
    window.showDebugError("Mitglieder laden: " + error.message);
    flash(els.membersMsg, "Mitglieder konnten nicht geladen werden.");
    return;
  }

  const rows = data.map((m) => `
    <div class="member-row" data-id="${m.id}">
      <div>${escapeHtml(m.username)}${m.id === currentProfile.id ? " (du)" : ""}</div>
      <div><span class="badge ${m.role === "admin" ? "badge-admin" : "badge-member"}">${m.role === "admin" ? "Admin" : "Member"}</span></div>
      <div style="text-align:right;">
        ${m.id === currentProfile.id ? "" : `<button class="btn btn-ghost btn-sm" data-toggle-role="${m.id}" data-current-role="${m.role}">
          ${m.role === "admin" ? "Zu Member machen" : "Zu Admin machen"}
        </button>`}
      </div>
    </div>`).join("");

  container.innerHTML = `
    <div class="roster">
      <div class="member-row head"><div>Benutzer</div><div>Rolle</div><div></div></div>
      ${rows}
    </div>`;

  document.querySelectorAll("[data-toggle-role]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.toggleRole;
      const newRole = btn.dataset.currentRole === "admin" ? "member" : "admin";
      if (!confirm(`Rolle wirklich auf "${newRole}" ändern?`)) return;
      const { error } = await supabaseClient.from("profiles").update({ role: newRole }).eq("id", id);
      if (error) {
        window.showDebugError("Rolle ändern: " + error.message);
        flash(els.membersMsg, "Rollenänderung fehlgeschlagen.");
        return;
      }
      flash(els.membersMsg, "Rolle aktualisiert.", "ok");
      loadMembers();
    });
  });
}

/**
 * Spieler-Datenzugriff (Supabase) + Rendering der Roster-Tabelle.
 * Reine Funktionen ohne eigenen App-State — app.js orchestriert.
 */

const Players = {
  async list() {
    const { data, error } = await supabaseClient
      .from("players")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { error } = await supabaseClient.from("players").insert(payload);
    if (error) throw error;
  },

  async update(id, payload) {
    const { error } = await supabaseClient.from("players").update(payload).eq("id", id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await supabaseClient.from("players").delete().eq("id", id);
    if (error) throw error;
  },
};

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtNum(n, suffix = "") {
  if (n === null || n === undefined || n === "") return "—";
  return `${n}${suffix}`;
}

/**
 * Rendert die Roster-Liste in #roster-container.
 * isAdmin steuert, ob der Löschen-Button erscheint.
 */
function renderRoster(players, isAdmin) {
  const container = document.getElementById("roster-container");

  if (!players.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Noch keine Spieler</h3>
        <p>Füge das erste Teammitglied hinzu, um loszulegen.</p>
        <button class="btn btn-primary" onclick="document.getElementById('btn-add-player').click()">+ Spieler hinzufügen</button>
      </div>`;
    return;
  }

  const rows = players.map((p) => `
    <div class="roster-row" data-id="${p.id}">
      <div class="p-name">
        ${escapeHtml(p.name)}
        <span class="sub">${escapeHtml(p.contact) || "Kein Kontakt hinterlegt"}</span>
      </div>
      <div class="p-stat" data-label="Rolle">${escapeHtml(p.game_role) || "—"}</div>
      <div class="p-stat" data-label="Rang">${escapeHtml(p.rank) || "—"}</div>
      <div class="p-stat" data-label="KDA">${fmtNum(p.kda)}</div>
      <div class="p-stat good" data-label="Winrate">${fmtNum(p.winrate, "%")}</div>
      <div class="p-stat" data-label="Notizen">${p.notes ? "📝" : ""}</div>
      <div class="roster-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${p.id}">Bearbeiten</button>
        ${isAdmin ? `<button class="btn btn-danger btn-sm" data-delete="${p.id}">Löschen</button>` : ""}
      </div>
    </div>`).join("");

  container.innerHTML = `
    <div class="roster">
      <div class="roster-row head">
        <div>Spieler</div><div>Rolle</div><div>Rang</div><div>KDA</div><div>Winrate</div><div>Notiz</div><div></div>
      </div>
      ${rows}
    </div>`;
}

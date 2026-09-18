/**
 * Supabase-Verbindung — zentrale Konfiguration.
 * Trage hier die Werte aus deinem Supabase-Projekt ein:
 * Project Settings → API → "Project URL" und "anon public" key.
 *
 * Diese Datei ist bewusst die einzige Stelle mit Projekt-Zugangsdaten,
 * damit der Rest des Codes unabhängig vom konkreten Projekt bleibt.
 */
const SUPABASE_URL = "https://lllltsvxtrikvrqjousl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbGx0c3Z4dHJpa3ZycWpvdXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTI0OTcsImV4cCI6MjEwNTI4ODQ5N30.AUvBESGujSqTZC5y-8jR-duhJ4vpWYRZUWO711gBjnE";

// Domain, die für die "Fake-E-Mail"-Registrierung genutzt wird.
// Supabase Auth verlangt technisch eine E-Mail-Adresse; wir bauen sie
// automatisch aus dem gewählten Benutzernamen, echte Postfächer sind
// nicht nötig (siehe README).
const FAKE_EMAIL_DOMAIN = "roster.local";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function usernameToFakeEmail(username) {
  return `${username.trim().toLowerCase()}@${FAKE_EMAIL_DOMAIN}`;
}

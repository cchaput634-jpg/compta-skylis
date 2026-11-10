-- Schéma D1 — Trésor de Skylis (compta de la Nation du vent).
-- Les tables sont aussi créées à la volée par le Worker (ensureSchema).
-- Init manuelle : wrangler d1 execute skylis-compta-db --remote --file=./worker/schema.sql

/* ===== Authentification Discord ===== */
CREATE TABLE IF NOT EXISTS users (
  discord_id TEXT PRIMARY KEY,
  username   TEXT NOT NULL,
  avatar     TEXT,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

/* ===== Rôles & permissions ===== */
-- is_super=1 → tous les droits implicites (verrouillé en suppression/édition).
CREATE TABLE IF NOT EXISTS roles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  is_super   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Permissions utilisées :
--   manage_users, citizens.view, citizens.edit,
--   donations.view, donations.edit, expenses.view, expenses.edit
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id    TEXT NOT NULL,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    TEXT NOT NULL,
  role_id    TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id)
);

/* ===== Citoyens de Skylis ===== */
CREATE TABLE IF NOT EXISTS citizens (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  title       TEXT,                -- rang / titre (ex. "Zéphyr", "Dignitaire")
  discord_id  TEXT,                -- compte Discord lié (optionnel)
  notes       TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_citizens_name ON citizens(name);
CREATE INDEX IF NOT EXISTS idx_citizens_discord ON citizens(discord_id);

/* ===== Dons (entrées) ===== */
CREATE TABLE IF NOT EXISTS donations (
  id            TEXT PRIMARY KEY,
  citizen_id    TEXT,                       -- NULL si donateur anonyme / extérieur
  citizen_label TEXT,                       -- nom libre quand pas de citoyen (ex: "Anonyme", "Nation voisine X")
  amount        INTEGER NOT NULL,           -- montant en unité entière
  occurred_at   INTEGER NOT NULL,           -- date du don (timestamp ms)
  description   TEXT,
  created_by    TEXT NOT NULL,              -- discord_id de celui qui a enregistré
  created_at    INTEGER NOT NULL,
  FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_donations_occurred ON donations(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_citizen ON donations(citizen_id);

/* ===== Gains (entrées autres que dons de citoyens) ===== */
CREATE TABLE IF NOT EXISTS gains (
  id           TEXT PRIMARY KEY,
  label        TEXT NOT NULL,                -- intitulé du gain (ex: Impôts, Tribut, Marché)
  category     TEXT,                         -- cat. libre
  amount       INTEGER NOT NULL,
  occurred_at  INTEGER NOT NULL,
  description  TEXT,
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gains_occurred ON gains(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_gains_category ON gains(category);

/* ===== Dépenses (sorties) ===== */
CREATE TABLE IF NOT EXISTS expenses (
  id           TEXT PRIMARY KEY,
  label        TEXT NOT NULL,                -- intitulé de la dépense
  category     TEXT,                         -- cat. libre (ex: "Festivités", "Fournitures")
  amount       INTEGER NOT NULL,
  occurred_at  INTEGER NOT NULL,
  description  TEXT,
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_occurred ON expenses(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

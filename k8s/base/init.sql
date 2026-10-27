-- Donnees de depart (executees au premier demarrage de PostgreSQL)
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO items (name) VALUES ('Casque'), ('Clavier'), ('Ecran');

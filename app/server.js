// API "items" : Express + PostgreSQL. Version et environnement injectes par variables d'environnement.
const express = require("express");
const { Pool } = require("pg");
const os = require("os");

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_NAME || "items",
});

const VERSION = process.env.APP_VERSION || "dev";
const ENV_NAME = process.env.ENV_NAME || "local";

app.get("/", (req, res) => {
  res.json({ service: "items-api", version: VERSION, env: ENV_NAME, hostname: os.hostname(), message: "Bonjour depuis l'API items" });
});

app.get("/healthz", (req, res) => res.json({ status: "ok" }));

app.get("/readyz", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready" });
  } catch (e) {
    res.status(503).json({ status: "database unavailable", error: e.message });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, name, created_at FROM items ORDER BY id");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/items", async (req, res) => {
  const name = (req.body && req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "le champ name est obligatoire" });
  try {
    const { rows } = await pool.query("INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at", [name]);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);
  res.status(rowCount ? 204 : 404).end();
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`items-api ${VERSION} (${ENV_NAME}) en ecoute sur ${port}`));

// Tests E2E k6 : parcours complet de l'API items. Echec => code de sortie non nul => pipeline en erreur.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://api";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate==1.0"],          // 100 % des verifications doivent passer
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  let r = http.get(`${BASE}/`);
  check(r, {
    "GET / 200": (res) => res.status === 200,
    "GET / expose la version": (res) => res.json("version") !== undefined,
  });

  r = http.get(`${BASE}/readyz`);
  check(r, { "GET /readyz : base de donnees joignable": (res) => res.status === 200 });

  r = http.get(`${BASE}/api/items`);
  check(r, {
    "GET /api/items 200": (res) => res.status === 200,
    "donnees de seed presentes (>= 3 items)": (res) => res.json().length >= 3,
  });

  const name = `e2e-${Date.now()}`;
  r = http.post(`${BASE}/api/items`, JSON.stringify({ name }), { headers: { "Content-Type": "application/json" } });
  check(r, { "POST /api/items 201": (res) => res.status === 201 });
  const id = r.json("id");

  r = http.get(`${BASE}/api/items`);
  check(r, { "l item cree est liste": (res) => res.json().some((i) => i.name === name) });

  r = http.post(`${BASE}/api/items`, JSON.stringify({}), { headers: { "Content-Type": "application/json" } });
  check(r, { "POST sans name => 400": (res) => res.status === 400 });

  r = http.del(`${BASE}/api/items/${id}`);
  check(r, { "DELETE 204": (res) => res.status === 204 });
  sleep(0.2);
}

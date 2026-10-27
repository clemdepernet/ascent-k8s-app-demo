# ascent-k8s-app-demo

Application de démonstration des TP bonus de la formation Kubernetes (Ascent Formation) :
une API « items » (Node.js / Express) adossée à PostgreSQL, avec tout ce qu'il faut pour trois scénarios :

| TP | Scénario | Ce que ce dépôt fournit |
|---|---|---|
| TPB3 | Environnements éphémères par merge request, tests E2E, destruction | `k8s/overlays/review`, `ci/*.sh`, `.gitlab-ci.yml`, `e2e/`, `reaper/`, `runner/` |
| TPB4 | Développement local sur Minikube avec hot reload (remplacement de Docker Compose) | `docker-compose.yml` (état de départ), `skaffold.yaml`, `k8s/overlays/dev`, `app/Dockerfile` (cible `dev`) |
| TPB5 | Registre privé, scan et signature d'images | image `items-api` construite depuis `app/` (cible `prod`) |

## Arborescence

```text
.
├── app/                      API Express : server.js, package.json, Dockerfile multi-étapes (dev = nodemon, prod = minimal)
├── k8s/
│   ├── base/                 Deployment + Service "api", Deployment + Service "db" (PostgreSQL), Secret, ConfigMap de seed (init.sql)
│   └── overlays/
│       ├── dev/              namespace items-dev, PVC pour la base (Minikube), image items-api:dev (Skaffold)
│       └── review/           namespace et image fixés par la CI (kustomize edit), label app.kubernetes.io/part-of=review
├── e2e/                      test.js (k6) + job.yaml : parcours complet de l'API, échec = code de sortie non nul
├── ci/                       deploy-review.sh, run-e2e.sh, stop-review.sh : utilisés par le pipeline ET à la main
├── reaper/                   CronJob qui supprime les namespaces de review plus vieux que TTL_HOURS
├── runner/                   values Helm du GitLab Runner (executor Kubernetes) et RBAC du ServiceAccount review-deployer
├── skaffold.yaml             boucle de dev : build dans Minikube, sync des *.js, port-forward 3000
├── docker-compose.yml        l'existant des équipes (hot reload nodemon + volume), point de comparaison
└── .gitlab-ci.yml            build (kaniko) → review (namespace par MR) → e2e (k6) → stop (on_stop / auto_stop_in)
```

## L'API

| Route | Effet |
|---|---|
| `GET /` | identité du service : version (`APP_VERSION`), environnement (`ENV_NAME`), hostname |
| `GET /healthz` | vivacité |
| `GET /readyz` | 200 si PostgreSQL répond, 503 sinon |
| `GET /api/items` | liste des items (3 items de seed) |
| `POST /api/items` `{"name": "..."}` | création (201), 400 sans `name` |
| `DELETE /api/items/:id` | suppression (204 / 404) |

## Utilisation rapide

```bash
# Docker Compose (état de départ)
docker compose up -d --build && curl http://localhost:3000/api/items

# Minikube + Skaffold (TPB4)
skaffold dev            # puis modifiez app/server.js : nodemon redémarre dans le Pod en 1 à 2 s

# Environnement de review à la main (TPB3)
REVIEW_NS=review-mr-42 IMAGE=registry.lab.local:30500/items-api:1.0.0 REVIEW_HOST=mr-42.review.lab.local bash ci/deploy-review.sh
REVIEW_NS=review-mr-42 bash ci/run-e2e.sh
REVIEW_NS=review-mr-42 bash ci/stop-review.sh
```

Pour le pipeline GitLab : importez ce dépôt dans un projet GitLab (Import project → Repository by URL), enregistrez un runner
Kubernetes avec `runner/values-gitlab-runner.yaml` (tag `k8s-lab`), appliquez `runner/rbac-review-deployer.yaml`, puis ouvrez une merge request.

Versions : Node 22, PostgreSQL 17, k6 2.3, Skaffold 2.25, alpine/k8s 1.33.4 (kubectl + kustomize), kaniko 1.23, GitLab Runner chart 0.94.

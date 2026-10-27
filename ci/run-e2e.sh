#!/usr/bin/env bash
# Lance le Job k6 dans le namespace de review et echoue si les tests echouent.
set -euo pipefail
: "${REVIEW_NS:?REVIEW_NS manquant}"
kubectl -n "$REVIEW_NS" delete job e2e --ignore-not-found --wait=true
kubectl -n "$REVIEW_NS" create configmap e2e-script --from-file=test.js=e2e/test.js --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$REVIEW_NS" apply -f e2e/job.yaml
if kubectl -n "$REVIEW_NS" wait --for=condition=complete job/e2e --timeout=300s 2>/dev/null; then
  kubectl -n "$REVIEW_NS" logs job/e2e
  echo "E2E : SUCCES"
else
  echo "E2E : ECHEC (journal du Job ci-dessous)"
  kubectl -n "$REVIEW_NS" logs job/e2e || true
  exit 1
fi

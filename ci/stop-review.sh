#!/usr/bin/env bash
# Detruit l'environnement ephemere (fermeture / fusion de la MR, ou expiration auto_stop_in).
set -euo pipefail
: "${REVIEW_NS:?REVIEW_NS manquant}"
kubectl delete namespace "$REVIEW_NS" --ignore-not-found --wait=false
echo "Namespace $REVIEW_NS en cours de suppression"

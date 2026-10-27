#!/usr/bin/env bash
# Deploie (ou met a jour) l'environnement ephemere d'une merge request.
# Variables attendues : REVIEW_NS (ex. review-mr-42), IMAGE (ex. registry.lab.local:30500/items-api:abc1234),
#                       REVIEW_HOST (ex. mr-42.review.lab.local)
set -euo pipefail
: "${REVIEW_NS:?REVIEW_NS manquant}" "${IMAGE:?IMAGE manquant}" "${REVIEW_HOST:?REVIEW_HOST manquant}"

kubectl get namespace "$REVIEW_NS" >/dev/null 2>&1 || kubectl create namespace "$REVIEW_NS"
kubectl label namespace "$REVIEW_NS" app.kubernetes.io/part-of=review --overwrite

# Secret de pull si un registre prive authentifie est utilise (variables REGISTRY_* optionnelles)
if [ -n "${REGISTRY_USER:-}" ]; then
  kubectl -n "$REVIEW_NS" create secret docker-registry registry-credentials \
    --docker-server="${REGISTRY_SERVER:?}" --docker-username="$REGISTRY_USER" --docker-password="${REGISTRY_PASSWORD:?}" \
    --dry-run=client -o yaml | kubectl apply -f -
  kubectl -n "$REVIEW_NS" patch serviceaccount default -p '{"imagePullSecrets":[{"name":"registry-credentials"}]}'
fi

tmp=$(mktemp -d)
cp -r k8s "$tmp/"
( cd "$tmp/k8s/overlays/review" \
  && kustomize edit set namespace "$REVIEW_NS" \
  && kustomize edit set image "items-api=$IMAGE" )
kubectl apply -k "$tmp/k8s/overlays/review"
kubectl -n "$REVIEW_NS" create ingress api --class=traefik --rule="$REVIEW_HOST/*=api:80" --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$REVIEW_NS" rollout status deployment/db --timeout=180s
kubectl -n "$REVIEW_NS" rollout status deployment/api --timeout=180s
echo "Environnement pret : http://$REVIEW_HOST:30080/ (namespace $REVIEW_NS, image $IMAGE)"

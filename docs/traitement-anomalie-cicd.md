# Traitement d'une anomalie par la chaîne CI/CD

Ce document retrace le cheminement complet d'un correctif à travers le pipeline
d'intégration et de déploiement continus, pour montrer qu'une anomalie est
corrigée **en tirant profit de la CI/CD** existante et non par une intervention
manuelle sur le serveur. Il s'appuie sur les workflows réels
`.github/workflows/ci.yml` et `.github/workflows/deploy.yml`, illustrés par deux
correctifs effectivement passés par cette chaîne.

## Cheminement type d'un correctif

```
commit sur branche
      │
      ▼
Pull Request vers main
      │
      ▼
CI (ci.yml) ─── api : npm ci → lint → build → migrations → tests unitaires (couverture) → e2e → npm audit
      │         client : npm ci → lint → tests (couverture) → build
      ▼
CI verte  ──►  merge sur main
      │
      ▼
tag de version (vX.Y.Z)
      │
      ▼
Déploiement (deploy.yml)
   build images api + client  →  push GHCR  →  SSH VPS OVH
   →  git pull + docker compose pull + up -d  →  vérification /api/health/ready
```

Point de contrôle bloquant : **aucun merge sans CI verte**. La CI exécute lint,
build, migrations sur base fraîche, tests unitaires avec seuils de couverture,
et tests end-to-end contre un PostgreSQL réel (service `postgres` du job).

## Cas 1 — B-06 : anomalie détectée ET corrigée par la CI

B-06 illustre le cas où la CI est à la fois le **détecteur** et le **garant** de
la non-régression.

- **Détection** : les tests client échouaient en CI parce que `ng test` ne
  construisait pas les styles Tailwind (`tw:build`). L'anomalie n'était visible
  qu'en CI, pas en local.
- **Correctif** : commit `90cec3b` — construction de Tailwind avant les tests.
- **Cheminement CI/CD** : le correctif passe par une PR ; le job `client` de
  `ci.yml` (`npm ci → lint → tests → build`) repasse au vert, ce qui **est** la
  preuve de non-régression.
- **Non-régression automatisée** : le job `client` de la CI, rejoué à chaque PR
  et à chaque push sur `main`, garantit que le build des styles reste couplé aux
  tests.

## Cas 2 — B-10 : correctif d'infrastructure jusqu'au déploiement

B-10 (cf. `docs/fiches-anomalies/B-10-minio-econnrefused.md`) illustre le
parcours complet jusqu'à la vérification post-déploiement.

- **Correctif** : commit `0a287e6` (politique `restart: unless-stopped`) +
  rattrapage `/sync` (commit `4b556e3`).
- **Cheminement CI/CD** : commit → PR → CI verte (le job `api` valide lint,
  build, migrations et tests, dont le flux `/sync`) → merge `main` → tag de
  version → `deploy.yml`.
- **Déploiement vérifié** : après le `docker compose up -d`, l'étape « Verify the
  API health endpoint » de `deploy.yml` interroge `/api/health/ready` en boucle ;
  le rollout n'est validé que si l'API répond `200`. Le lien correctif → pipeline
  → déploiement → **vérification de santé** est ainsi explicite et automatisé.

## Non-régression : toujours un contrôle automatisé

Chaque correctif s'accompagne d'un contrôle rejoué par la CI :

| Type de non-régression | Exécuté par |
|---|---|
| Test unitaire (couverture avec seuils) | `ci.yml` job `api` / `client` |
| Test end-to-end (auth, flux) contre PostgreSQL | `ci.yml` job `api`, étape e2e |
| Migrations sur base fraîche | `ci.yml` job `api`, étape migrations |
| Contrainte d'infrastructure (restart policy) | Fichiers compose + vérification `/api/health/ready` dans `deploy.yml` |

Un correctif n'est considéré comme clos que si sa non-régression est portée par
l'un de ces contrôles automatisés, et non par une vérification manuelle.

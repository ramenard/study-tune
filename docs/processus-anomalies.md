# Processus de gestion des anomalies

Processus de bout en bout pour collecter, consigner, traiter et clôturer une
anomalie sur StudyTune. Il est dimensionné pour un SaaS web mono-VPS exploité par
une petite équipe, et s'appuie sur les outils déjà en place : issues GitHub, CI
(`.github/workflows/ci.yml`), déploiement continu (`.github/workflows/deploy.yml`)
et supervision (`docs/supervision.md`).

## Vue d'ensemble du flux

```
   Détection                Consignation            Triage
┌───────────────┐        ┌───────────────┐      ┌───────────────┐
│ Logs API      │        │ Issue GitHub  │      │ Sévérité +    │
│ CI            │  ───▶  │ (template     │ ───▶ │ priorité +    │
│ Uptime Kuma   │        │  bug_report)  │      │ assignation   │
│ Utilisateur   │        └───────────────┘      └───────┬───────┘
└───────────────┘                                       │
                                                        ▼
   Clôture                Non-régression          Analyse + correctif
┌───────────────┐        ┌───────────────┐      ┌───────────────┐
│ Issue fermée  │        │ Test auto     │      │ Cause racine  │
│ + CHANGELOG   │  ◀───  │ ajouté +      │ ◀─── │ → fix sur     │
│ + fiche       │        │ CI verte      │      │ branche + PR  │
└───────────────┘        └───────────────┘      └───────────────┘
```

## 1. Détection

Une anomalie peut provenir de quatre sources :

- **Logs de l'API** : erreurs runtime (ex. `ECONNREFUSED` sur le stockage).
- **CI** : un job qui échoue (lint, tests, build, migrations) sur une PR ou sur
  `main`.
- **Supervision Uptime Kuma** : un monitor qui passe « down » (readiness `503`,
  liveness injoignable) déclenche une alerte Discord.
- **Retour utilisateur** : signalement fonctionnel.

## 2. Consignation

Toute anomalie confirmée est consignée dans une **issue GitHub** via le template
`.github/ISSUE_TEMPLATE/bug_report.md`. L'issue capture : identifiant, titre,
sévérité, environnement, étapes de reproduction, résultat attendu vs obtenu,
logs, cause racine (si connue) et préconisation.

Les anomalies significatives sont aussi ajoutées à la table de synthèse
`docs/plan-correction-bogues.md` (ligne `B-xx`), et les plus riches font l'objet
d'une **fiche détaillée** dans `docs/fiches-anomalies/`.

## 3. Triage et sévérité

Chaque anomalie reçoit une sévérité qui pilote la priorité de traitement :

| Sévérité | Définition | Traitement |
|---|---|---|
| Bloquante | Service inutilisable (panne, faille) | Immédiat |
| Élevée | Fonctionnalité clé cassée, contournable | Prioritaire |
| Moyenne | Gêne sans blocage | Planifié |
| Faible | Cosmétique, dette technique | Opportuniste |

## 4. Analyse de la cause racine

On remonte du symptôme à la cause réelle (pas au symptôme visible) : lecture des
logs, reproduction locale via les étapes consignées, identification du composant
fautif. La cause racine est écrite dans l'issue et la fiche.

## 5. Correctif via CI/CD

Le correctif suit le pipeline CI/CD (détaillé dans
`docs/traitement-anomalie-cicd.md`) : branche dédiée → commit conventionnel → PR
→ **CI verte obligatoire** (lint, tests, build, migrations) → merge sur `main` →
tag de version → `deploy.yml` (build images, push GHCR, déploiement VPS,
vérification `/api/health/ready`).

## 6. Non-régression

Chaque correctif s'accompagne d'une mesure de non-régression **automatisée** et
exécutée par la CI (test unitaire, e2e, ou contrainte d'infrastructure vérifiée).
Un bug corrigé sans test de non-régression n'est pas considéré comme clos.

## 7. Clôture

- L'issue est fermée en référençant le commit/PR de correction.
- La ligne `B-xx` de `docs/plan-correction-bogues.md` est complétée (cause,
  commit, non-régression).
- Le correctif majeur est reporté dans `CHANGELOG.md` (section « Corrections »
  de la version concernée).

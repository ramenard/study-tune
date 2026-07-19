# Plan de correction des bogues

Anomalies réelles rencontrées pendant le développement, tracées via l'historique Git. Chaque ligne
indique la cause racine, le commit de correction et la mesure de non-régression associée.

| ID | Anomalie | Sévérité | Détection | Cause racine | Correction (commit) | Non-régression |
|---|---|---|---|---|---|---|
| B-01 | Le front ne peut pas appeler l'API (erreur CORS) | Bloquante | Manuel (onglet réseau) | CORS non activé côté NestJS | `dc9d18b` — CORS env-based dans `main.ts` | e2e du flux d'auth ; `CORS_ORIGIN` documenté |
| B-02 | Erreur runtime : `provideHttpClient` manquant | Bloquante | Manuel (console) | HttpClient non fourni dans `app.config.ts` | `dc9d18b` — ajout `provideHttpClient(withInterceptors(...))` | Le client build et les specs d'`AuthService` exercent HttpClient |
| B-03 | Le webhook Kie n'atteint jamais l'API | Élevée | Manuel (musique jamais livrée) | Mauvais préfixe de path du callback | `14b443f` — correction du path du webhook | e2e ; chemin `/api/music/webhook/kie/...` figé |
| B-04 | Pistes bloquées en « génération » quand le webhook est perdu | Élevée | Manuel | Aucun mécanisme de rattrapage | `4b556e3` — endpoint `POST /music/:id/sync` | Endpoint de sync + polling de statut |
| B-05 | Le mode sombre ne survit pas au rafraîchissement | Moyenne | Manuel | État `dark` local au composant, non persisté | `dfc73df` — `ThemeService` (signal + localStorage) | `theme.service.spec.ts` (init depuis storage, persistance) |
| B-06 | Tests client en échec en CI (styles Tailwind manquants) | Moyenne | CI | `ng test` ne lance pas `tw:build` | `90cec3b` — build Tailwind avant les tests | Job CI client vert |
| B-07 | Échec de lint (échappement inutile dans une regex) | Faible | CI / lint | Caractère d'échappement superflu | `893b5f7` — nettoyage de la regex | `npm run lint` vert en CI |
| B-08 | Cascade de warnings ESLint `any` bloquant le build | Faible | CI / lint | Règles trop strictes sur du code legacy | `ca81bac` — règles `any` passées en warning, imports inutiles retirés | Lint : 0 erreur |
| B-09 | Déconnexion au bout de 15 min après passage aux tokens courts | Élevée | Manuel | Client ne rafraîchissait pas l'access token | `4841f81` — refresh automatique sur 401 (interceptor) | `auth.service.spec.ts` (rotation), `auth-token.service.spec.ts` |
| B-10 | Génération livrée par Kie mais piste en chargement (`ECONNREFUSED 127.0.0.1:9000`) | Élevée | Runtime (logs API) | Conteneur MinIO arrêté ; le stockage de l'audio échoue dans le webhook | `0a287e6` — `restart: unless-stopped` sur MinIO/PostgreSQL/API ; rattrapage via `/sync` | Politique de redémarrage ; healthcheck `/api/health` |

## Points de vérification structurels

- **Enregistrement d'entités TypeORM dupliqué** (historique : `Friendship` importée deux fois) :
  résolu par le passage à `autoLoadEntities: true` (commit `ff5a93f`). Vérifié : plus aucune liste
  d'entités explicite dans `app.module.ts`, donc aucune duplication possible.

## Analyse des tests KO du cahier de recettes

À la date de rédaction, tous les scénarios du [cahier de recettes](./cahier-recettes.md) exécutés
sont **OK**. Aucun test KO à analyser. En cas de KO ultérieur, ajouter ici : scénario concerné,
cause racine, correctif envisagé et point d'amélioration (ex. couverture de test à renforcer sur le
module fautif).

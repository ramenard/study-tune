# Système de supervision

Description du dispositif de supervision de StudyTune : ce qui est surveillé,
avec quelles sondes, selon quels critères de qualité, et comment les anomalies
sont signalées. Le dispositif est dimensionné pour la typologie du projet : un
SaaS web mono-VPS (OVH), sans redondance ni orchestrateur, exploité par une
petite équipe.

## 1. Périmètre de supervision

Sont supervisés les composants dont l'indisponibilité empêche l'usage du
service :

- **API** (NestJS, port 3001) — cœur fonctionnel : authentification, génération
  de musique, webhook kie.ai.
- **Base de données** (PostgreSQL) — persistance des utilisateurs et des pistes ;
  sans elle l'API ne peut pas répondre.
- **Front** (Angular servi derrière Caddy) — point d'entrée utilisateur.
- **Dépendances IA externes** (kie.ai, Mistral) — surveillées en mode
  **non bloquant** : leur lenteur ou indisponibilité dégrade une fonctionnalité
  sans rendre l'application « down ».
- **Ressources de l'hôte** consommées par l'API : espace disque et mémoire tas.

Ne sont **pas** supervisés, avec justification :

- **MinIO** — dev uniquement ; en production le stockage objet est délégué à OVH
  Object Storage (S3), service managé dont la disponibilité est assurée par
  l'hébergeur.
- **Métriques applicatives fines** (APM, traces distribuées) — hors proportion
  pour un mono-VPS étudiant ; la supervision vise la **disponibilité**, pas
  l'optimisation de performance à la requête.

## 2. Sondes et finalité

Deux niveaux : des **sondes internes** exposées par l'API (Terminus), et une
**supervision externe black-box** (Uptime Kuma) qui interroge le service depuis
l'extérieur.

| Sonde | Où | Ce qu'elle détecte | Seuil | Criticité |
|---|---|---|---|---|
| `liveness` (`/api/health/live`) | API | Process API mort / conteneur figé | Réponse ≠ 200 | Bloquante — déclenche le redémarrage |
| `readiness` (`/api/health/ready`) | API | L'app est prête à recevoir du trafic | Agrégat `db` + `disk` + `memory` | Bloquante — retire l'instance du trafic |
| `database` | readiness | PostgreSQL injoignable | `pingCheck` échoue | Bloquante |
| `disk` | readiness | Disque presque plein | > 90 % d'occupation (`thresholdPercent 0.9`) | Élevée |
| `memory_heap` | readiness | Fuite / saturation mémoire | Tas > 300 Mo | Élevée |
| `kie` (`/api/health`) | check complet | kie.ai injoignable | Ping en échec → `degraded` | Faible — non bloquant |
| `mistral` (`/api/health`) | check complet | Mistral injoignable | Ping en échec → `degraded` | Faible — non bloquant |
| Monitor « API liveness » | Uptime Kuma | Panne API / VPS vue de l'extérieur | 3 échecs consécutifs | Bloquante |
| Monitor « API readiness » | Uptime Kuma | Dégradation (DB/disque/mémoire) | 2 échecs, mot-clé `"status":"ok"` absent | Élevée |
| Monitor « Front » | Uptime Kuma | Front / Caddy indisponible | 3 échecs consécutifs | Bloquante |

Séparation volontaire des rôles :

- **liveness** ne fait aucun appel externe → un tiers lent ne provoque jamais un
  redémarrage intempestif. C'est cette route que sonde le `healthcheck` Docker.
- **readiness** conditionne l'entrée en trafic ; c'est elle que vérifie le
  pipeline de déploiement après un déploiement.
- **check complet** (`/api/health`) ajoute les dépendances IA en **dégradation
  gracieuse** : il reste `200` même si kie.ai ou Mistral est injoignable, pour
  distinguer « mon service est en panne » de « un tiers est lent ».

## 3. Critères de qualité et de performance

Cibles proportionnées à un mono-VPS étudiant (pas de SLA contractuel, pas de
redondance) :

| Critère | Cible | Justification |
|---|---|---|
| Disponibilité | ~99 % / mois | Réaliste pour une seule VM sans redondance ; la politique de redémarrage rattrape les incidents transitoires. |
| Latence `/api/health/live` | < 100 ms | Réponse statique sans I/O ; au-delà, le VPS est saturé. |
| Latence `/api/health/ready` | < 500 ms | Inclut un ping DB ; une lenteur signale une base sous pression. |
| Occupation disque | Alerte à 90 % | Marge avant saturation (logs, images Docker) tout en évitant les fausses alertes. |
| Mémoire tas API | Alerte à 300 Mo | Cohérent avec l'empreinte Node observée ; un dépassement signale une fuite. |
| Délai de détection | ≤ 60 s | Intervalle des monitors Uptime Kuma. |

## 4. Modalité des signalements

- **Qui/quoi est alerté** : l'équipe d'exploitation, via le canal d'alerte.
- **Par quel canal** : webhook **Discord** dédié (canal privé d'alerte), ou
  e-mail SMTP en alternative — configuré dans Uptime Kuma
  (cf. `docker/uptime-kuma/README.md`).
- **À quel seuil** : dès qu'un monitor atteint son nombre d'échecs consécutifs
  (2 à 3 selon la sonde), avec notification de rétablissement au retour à la
  normale.
- **Délai de détection** : au plus l'intervalle de sondage, soit **60 s**.
- **Repli sans Uptime Kuma** : `scripts/healthcheck-cron.sh` interroge
  `/api/health/ready` en crontab (chaque minute) et pousse une alerte Discord si
  la réponse n'est pas `200`. Il garantit un signalement même si la stack de
  monitoring est indisponible.

## 5. Disponibilité permanente

Le dispositif vise le maintien en condition opérationnelle continu :

- **Auto-réparation** : tous les services de production tournent avec
  `restart: unless-stopped` (cf. anomalie B-10 dans
  `docs/plan-correction-bogues.md`) ; combiné au `healthcheck` Docker sur
  `liveness`, un conteneur figé est relancé automatiquement.
- **Protection du trafic** : la **readiness** empêche l'API de recevoir du trafic
  tant qu'elle n'est pas prête (DB up, ressources saines) ; le déploiement ne
  valide un rollout que si `/api/health/ready` répond `200`.
- **Surveillance indépendante** : Uptime Kuma observe le service depuis
  l'extérieur, 24/7, à 60 s d'intervalle, donc une panne totale du VPS est
  détectée même quand l'application ne peut plus se signaler.

## Couverture C4.1.2

| Critère de la grille | Adressé par |
|---|---|
| Typologie de supervision adaptée à l'application | §1 (périmètre + exclusions justifiées pour un SaaS mono-VPS) |
| Sondes de surveillance explicitées | §2 (tableau sondes internes + monitors externes, seuils, criticité) |
| Critères de qualité et de performance décrits | §3 (disponibilité, latences, seuils disque/mémoire justifiés) |
| Le système surveille la disponibilité du service | §5 (restart policy + readiness + monitoring externe 24/7) |

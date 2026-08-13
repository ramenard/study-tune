# Fiche d'anomalie B-10 — Piste en chargement, stockage audio en échec (`ECONNREFUSED 127.0.0.1:9000`)

Fiche de consignation détaillée de l'anomalie B-10, la plus riche du projet.
Version longue de la ligne correspondante de `docs/plan-correction-bogues.md`.

## Identification

- **ID** : B-10
- **Titre** : Génération livrée par kie.ai mais piste bloquée en chargement.
- **Sévérité** : Élevée (fonctionnalité cœur cassée, données de génération
  perdues côté stockage).
- **Détection** : Runtime, via les logs de l'API.
- **Composant** : `api` (module `music`, `StorageService`) + infrastructure
  (conteneur MinIO).

## Contexte

Le flux de génération est asynchrone : le client demande une musique, kie.ai
génère en arrière-plan, puis appelle le webhook `POST /api/music/webhook/kie`.
À la réception du callback `complete`, l'API **télécharge l'audio et le stocke
dans MinIO** (`tracks/<trackId>.mp3`) avant de mettre à jour la ligne PostgreSQL
avec l'URL finale.

Si MinIO est arrêté au moment du callback, le téléchargement réussit mais le
stockage échoue : la piste reste indéfiniment à l'état « en génération / en
chargement » côté client, alors que kie.ai a bel et bien livré l'audio.

## Étapes de reproduction

1. Démarrer la stack de dev **sans** MinIO (ou arrêter le conteneur MinIO) :
   ```bash
   docker compose -f docker/docker-compose.yml up -d postgres
   docker stop <conteneur_minio>   # si déjà lancé
   ```
2. Lancer l'API (`npm run start:dev -w api`).
3. Déclencher une génération : `POST /api/music/generate` avec un prompt valide.
4. Laisser kie.ai appeler le webhook (ou simuler l'appel `complete`).
5. Observer : la piste ne passe jamais à l'état final, elle reste « en
   chargement ».

## Logs

```
ERROR [MusicService] Failed to store generated track
Error: connect ECONNREFUSED 127.0.0.1:9000
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:...)
```

`127.0.0.1:9000` est l'endpoint S3 de MinIO en local : le refus de connexion
confirme que le conteneur de stockage est injoignable.

## Analyse de la cause racine

Deux causes conjuguées :

1. **Cause immédiate** : le conteneur MinIO était arrêté au moment du webhook, le
   stockage de l'audio échoue donc dans le handler.
2. **Cause de fond** : aucune politique de redémarrage automatique sur les
   conteneurs de dépendance, et aucun mécanisme de rattrapage pour rejouer le
   stockage d'une piste dont le webhook a échoué.

## Correctif

- **Politique de redémarrage** : ajout de `restart: unless-stopped` sur les
  services de dépendance (MinIO / PostgreSQL / API) afin qu'un conteneur tombé
  soit relancé automatiquement — commit `0a287e6`. La production reprend ce
  principe (`docker/docker-compose.prod.yml`, cf. B-10 dans le plan de
  correction).
- **Rattrapage applicatif** : l'endpoint `POST /api/music/:id/sync` (commit
  `4b556e3`, cf. B-04) permet de rejouer la récupération et le stockage d'une
  piste restée bloquée, sans attendre un nouveau webhook.

## Non-régression

- **Contrainte d'infrastructure** : `restart: unless-stopped` présent sur les
  services concernés, vérifiable dans les fichiers compose.
- **Supervision** : la sonde de readiness (`GET /api/health/ready`) et les
  monitors Uptime Kuma détectent désormais une dépendance de stockage ou une DB
  indisponible avant que l'utilisateur ne subisse une piste bloquée
  (cf. `docs/supervision.md`).
- **Rattrapage testé** : le flux `/sync` couvre la reprise d'une piste bloquée.

## Préconisation durable

- Conserver `restart: unless-stopped` sur toute dépendance critique.
- En production, le stockage objet est délégué à **OVH Object Storage (S3)**,
  service managé : la cause locale (conteneur MinIO arrêté) ne se transpose pas
  telle quelle, mais le rattrapage `/sync` et la supervision restent la ligne de
  défense en cas d'indisponibilité passagère du stockage objet.

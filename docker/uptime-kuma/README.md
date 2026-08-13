# Supervision externe — Uptime Kuma

Supervision black-box indépendante de l'application. Uptime Kuma interroge les
endpoints publics depuis l'extérieur : si l'API ou le VPS tombe, la sonde le
détecte même quand l'app ne peut plus se signaler elle-même.

Uptime Kuma se configure via son interface web (pas de fichier de config) : ce
README documente précisément la configuration à recréer.

## Démarrage

Le stack de monitoring vit dans un fichier compose séparé de la prod pour rester
optionnel. Il rejoint le réseau de la prod (`docker_default`) afin que Caddy
puisse l'exposer.

```bash
docker compose -f docker/docker-compose.prod.yml up -d
docker compose -f docker/docker-compose.monitoring.yml up -d
```

`docker_default` est le réseau créé par `docker-compose.prod.yml` (nom par défaut
`<dossier>_default`, ici le dossier `docker/`). Si le projet compose est lancé
sous un autre nom, ajuster `networks.proxy.name` en conséquence.

## Exposition via Caddy

Le bloc est déjà présent dans `docker/Caddyfile` :

```caddy
{$STATUS_DOMAIN:status.localhost} {
	reverse_proxy uptime-kuma:3001
}
```

Il suffit de renseigner `STATUS_DOMAIN` dans `.env.prod` (ex.
`STATUS_DOMAIN=status.study-tune.fr`) pour activer le sous-domaine : Caddy obtient
alors automatiquement le certificat TLS, en réutilisant le pattern du site
principal (`{$DOMAIN}`).

Sans cette variable, le placeholder retombe sur `status.localhost` (CA interne
de Caddy, aucun appel Let's Encrypt) : la prod démarre normalement, le statut
n'est simplement pas exposé publiquement.

## Monitors à configurer

Au premier lancement, créer le compte administrateur, puis ajouter les monitors
suivants (Settings → Monitors → Add).

| Monitor | Type | URL / cible | Intervalle | Seuil « down » | Détecte |
|---|---|---|---|---|---|
| API liveness | HTTP(s) | `https://study-tune.fr/api/health/live` | 60 s | 3 échecs consécutifs | Process API mort / VPS injoignable |
| API readiness | HTTP(s) — keyword | `https://study-tune.fr/api/health/ready`, mot-clé `"status":"ok"` | 60 s | 2 échecs consécutifs | DB down, disque plein, mémoire saturée |
| Front | HTTP(s) | `https://study-tune.fr` | 60 s | 3 échecs consécutifs | Front / Caddy indisponible |

- **Retries** : 2 à 3 selon le tableau (évite les fausses alertes sur un pic de
  latence ponctuel).
- **Accepted status codes** : `200-299`.
- **Readiness** : utiliser le type « HTTP(s) - Keyword » avec le mot-clé
  `"status":"ok"` pour distinguer un `200` (prêt) d'un `503` (dégradé).

## Canal de notification

Settings → Notifications → Add, puis associer la notification à chaque monitor.

- **Discord** (recommandé) : type `Discord`, coller l'URL du webhook du salon
  d'alerte (Paramètres du salon → Intégrations → Webhooks).
- **Email SMTP** (alternative) : type `SMTP`, renseigner hôte, port, identifiants
  et adresse de destination.

Régler « Resend Notification if Down X times » pour rappeler une panne toujours
active, et activer la notification de rétablissement (recovery).

## Page de statut publique (optionnel)

Uptime Kuma génère une status page publique agrégée. La créer sous
`Status Pages → New`, y ajouter les trois monitors, et la publier sur le
sous-domaine de statut pour partager la disponibilité.

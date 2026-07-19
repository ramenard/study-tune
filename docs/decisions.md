# Décisions d'architecture et écarts avec le Bloc 1

Ce document justifie les choix techniques structurants et documente les écarts assumés entre
l'annonce du Bloc 1 et l'implémentation réelle.

## Choix techniques

### Monolithe modulaire NestJS
L'API est un monolithe modulaire (un module par domaine : `auth`, `music`, `playlist`,
`friendship`, `document`, `health`). Ce découpage garde la simplicité de déploiement d'un
monolithe tout en isolant les responsabilités, ce qui permettra d'extraire un module en service
séparé si le besoin apparaît (facturation, génération).

### Génération asynchrone déléguée à Kie.ai (écart : pas de Redis/BullMQ)
Le Bloc 1 annonçait une file asynchrone (Redis). L'implémentation délègue l'asynchronisme au
fournisseur : l'API envoie la demande à Kie.ai avec un `callBackUrl`, répond `202 Accepted`
immédiatement, et Kie.ai rappelle le webhook à la fin. Un endpoint `/sync` récupère les pistes
restées bloquées (webhook perdu).

**Justification** : la génération est déjà asynchrone côté Kie.ai ; une file Redis locale
ajouterait de l'infrastructure sans valeur au stade MVP. Le monolithe modulaire permettra
d'introduire BullMQ plus tard pour le retry et la facturation à l'usage si nécessaire.

### Paiement simulé (écart : Stripe non implémenté)
L'abonnement premium est simulé côté API (endpoints `subscribe` / `unsubscribe` qui basculent le
champ `plan`). Stripe est un jalon post-MVP planifié : le modèle de données est prêt (`plan`,
`generationsUsed`, `periodStart`), il ne reste qu'à brancher le fournisseur de paiement et ses
webhooks.

### « Tokens » = quota mensuel de générations
Le Bloc 1 parlait d'une abstraction « tokens ». L'implémentation V1 est un **quota mensuel de
générations** (`monthlyAllowance`, `generationsRemaining`) : chaque génération consomme une unité,
le quota se réinitialise par période. Le vocabulaire « quota de générations » est l'implémentation
concrète de l'abstraction « tokens » ; les deux désignent la même mécanique.

### Sécurité
- **JWT courts + refresh rotatifs** : access token 15 min, refresh token 7 j stocké hashé
  (bcrypt) en base, tourné à chaque rafraîchissement, invalidé au logout. Réduit la fenêtre
  d'exploitation d'un token volé tout en gardant des sessions longues côté utilisateur.
- **Helmet avec CSP désactivée** : la Content-Security-Policy par défaut de Helmet casse
  l'interface Swagger (`/docs`, scripts et styles inline). La CSP est donc désactivée
  (`contentSecurityPolicy: false`) ; les autres en-têtes de sécurité restent actifs. En
  production sans Swagger exposé, réactiver une CSP stricte est recommandé.
- **Secret de webhook dans le path** (`/api/music/webhook/kie/:secret`) plutôt qu'en query
  string : Kie.ai rappelle l'URL fournie telle quelle, et un segment de path est transmis de
  façon plus fiable qu'un paramètre de requête susceptible d'être normalisé.

### Abstraction multi-provider (pattern Adapter)
Le Bloc 1 annonce un fournisseur de génération musicale interchangeable (Suno retenu, Udio en
backup). C'est matérialisé par une interface `MusicProvider` (`api/src/modules/music/providers/`)
injectée via le token `MUSIC_PROVIDER`. `SunoService implements MusicProvider` et `music.service`
dépend de l'interface, plus du service concret : un second fournisseur (Udio) se branche en changeant
uniquement le `useClass` du provider dans `music.module.ts`, sans toucher la logique métier.

### Frontend Angular zoneless + signals
Le client utilise Angular 21 en mode zoneless, composants standalone, `OnPush` et signals partout,
avec un SDK typé généré depuis la spec OpenAPI (`ng-openapi-gen`) : le backend est la source de
vérité unique des types.

## Récapitulatif des écarts assumés

| Annonce Bloc 1 | Implémentation V1 | Statut |
|---|---|---|
| File asynchrone Redis | Webhook Kie + polling + `/sync` | Pivot documenté |
| Paiement Stripe | Abonnement simulé (modèle prêt) | Jalon post-MVP |
| Abstraction « tokens » | Quota mensuel de générations | Équivalence documentée |
| Refresh tokens | Implémentés (access 15 min + refresh 7 j) | Conforme |

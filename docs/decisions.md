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

### Consentement parental (RGPD mineurs)
Cible 13-18 ans. L'inscription exige une date de naissance : moins de 13 ans est refusé, et sous
15 ans (seuil de la majorité numérique française, art. 45 loi Informatique et Libertés) l'email
d'un responsable légal et sa confirmation de consentement sont obligatoires (`parentEmail`,
`parentalConsentAt` persistés). L'envoi effectif d'un email de vérification au responsable est un
jalon de mise en production ; la V1 recueille et stocke le consentement déclaré.

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

### Cache anti-redondance des fiches (éco-conception)
Argument éco-conception du Bloc 1 : ne pas régénérer une fiche déjà produite. À chaque demande,
le texte du cours est normalisé et haché (SHA-256) ; si une fiche existe déjà pour ce couple
`(userId, contentHash)`, elle est renvoyée telle quelle avec `cached: true`, **sans aucun appel à
Mistral**. Sinon la fiche est générée puis persistée (entité `StudySheet`). Le cache est isolé par
utilisateur (index unique `(userId, contentHash)`). C'est la mesure d'éco-conception effective
(appels IA évités = énergie et coût économisés) ; la métrologie carbone (CodeCarbon) viendra ensuite.

### Frontend Angular zoneless + signals
Le client utilise Angular 21 en mode zoneless, composants standalone, `OnPush` et signals partout,
avec un SDK typé généré depuis la spec OpenAPI (`ng-openapi-gen`) : le backend est la source de
vérité unique des types.

### Hébergement du frontend sur le VPS OVH (écart : Vercel Pro)
Le budget du Bloc 1 prévoyait un hébergement du frontend sur Vercel Pro. En production, le client
Angular est servi par un conteneur **nginx sur le même VPS OVH** que l'API, derrière Caddy.

**Justification** :
- **100 % des données et du trafic restent en France** (VPS et Object Storage en région GRA), ce qui
  renforce directement les arguments RGPD-mineurs et éco-conception du Bloc 1 ;
- **origine unique** pour le front et l'API (`<domaine>` et `<domaine>/api`) : plus aucune
  problématique CORS, et des cookies/jetons strictement same-origin ;
- **−20 €/mois** sur le budget d'infrastructure, pour une SPA statique dont la distribution ne
  justifie pas un CDN payant à ce stade.

Un CDN reste ajoutable devant Caddy si le trafic le justifie, sans changer l'application.

### Parité dev/prod du stockage objet
Le stockage des audio générés utilise la **même API S3** des deux côtés : **MinIO** dans Docker en
développement, **OVH Object Storage** (région GRA, répliqué, versionné) en production.

Le code ne contient **aucune logique conditionnelle dev/prod** : `storage.service` est entièrement
piloté par les variables `S3_*` (endpoint, port, TLS, région, style d'adressage, credentials,
bucket). Seule la configuration change d'un environnement à l'autre.

**Justification** : conforme à l'annonce « S3 » de l'audit de faisabilité du Bloc 1, et la durabilité
des audio générés — la donnée de valeur du produit — est déléguée à un service managé répliqué et
versionné plutôt qu'à un disque de VPS. Le versioning du bucket remplace de fait une sauvegarde des
fichiers audio : le périmètre de sauvegarde côté VPS se réduit au `pg_dump`.

### Transferts de données hors UE (sous-traitants IA)
Les fournisseurs de génération traitent potentiellement les données hors UE (États-Unis). Deux
maillons : **Mistral** (fiches) et **Kie.ai** avec son sous-traitant **Suno** (musique).

**Fait vérifié dans le code (argument principal) — minimisation structurelle du payload :**
- vers Mistral part uniquement le **texte du cours** ;
- vers Kie.ai / Suno partent uniquement **`prompt` (paroles), `style`, `title`**
  (voir `suno.service.ts` / `music.service.ts`) ;
- **aucune donnée d'identification** (email, username, `birthDate`, id de compte) n'est transmise.

Le transfert de données personnelles identifiantes est donc, par construction, quasi nul — sous
réserve que l'utilisateur n'inclue pas d'informations personnelles dans le contenu de cours
lui-même (d'où la mention d'information dans la politique de confidentialité). C'est un point
sensible sur le positionnement mineurs (vigilance CNIL sur les transferts de données de mineurs).

**À confirmer à la source avant l'écrit du dossier (recherches non validées dans cet environnement) :**
- entités et droit applicable : Kie.ai serait édité par NEXUSAI SERVICES LLC (Colorado, US), Suno
  basé aux US — **à vérifier**.
- base juridique du transfert : **certification Data Privacy Framework** des deux fournisseurs, à
  vérifier sur `dataprivacyframework.gov` ; à défaut, clauses contractuelles types (art. 46 RGPD)
  + analyse d'impact du transfert (TIA).
- représentant UE art. 27 RGPD (VeraSafe côté Suno évoqué) et durées de rétention côté sous-traitant
  (14 j médias / 2 mois logs côté Kie évoqués) — **à confirmer** pour le registre des traitements.

Tant que ces points ne sont pas confirmés, la politique de confidentialité reste sur la formulation
prudente « soit DPF, soit clauses contractuelles types », juridiquement correcte en l'état.

### Modération du contenu soumis (API Mistral Moderation)
Annoncée au Bloc 1, une première brique est implémentée en V1 : le **texte soumis par
l'utilisateur** est filtré avant tout traitement via l'**API Moderation de Mistral**
(`mistral-moderation-latest`). Deux points d'entrée sont couverts (module partagé `moderation`) :
- le contenu de cours (texte libre ou PDF) avant génération de la fiche (`document.service`) ;
- les paroles, style et titre avant l'envoi à Kie.ai (`music.service`).

Un contenu signalé au-delà d'un seuil (`0.5`) sur une catégorie **réellement nuisible** — `sexual`,
`hate_and_discrimination`, `violence_and_threats`, `dangerous_and_criminal_content`, `selfharm` —
est rejeté en **422** avec la liste des catégories. Les catégories `health`, `law` et `financial`
sont **volontairement exclues** : sur une app d'étude, un cours de médecine ou de droit les
déclencherait à tort. En cas d'indisponibilité de l'API de modération, la requête échoue en **503**
(fail-closed : on ne laisse pas passer de contenu non vérifié). Aucune variable d'environnement
supplémentaire : la clé `MISTRAL_API_KEY` existante est réutilisée.

**Reste à faire avant l'ouverture publique** : filtrage du contenu *généré* (fiches et paroles en
sortie d'IA) et signalement utilisateur. Le risque résiduel est borné en bêta fermée car le contenu
d'entrée provient du **propre cours de l'élève** (pas de contenu tiers arbitraire).

### Mesure d'impact carbone (CodeCarbon)
Annoncée en veille au Bloc 1, non outillée en V1. La mesure d'éco-conception **effective** est le
cache anti-redondance des fiches (appels IA évités) ; l'instrumentation métrologique (CodeCarbon
autour des appels IA) est un jalon ultérieur.

## Récapitulatif des écarts assumés

| Annonce Bloc 1 | Implémentation V1 | Statut |
|---|---|---|
| File asynchrone Redis | Webhook Kie + polling + `/sync` | Pivot documenté |
| Paiement Stripe | Abonnement simulé (modèle prêt) | Jalon post-MVP |
| Abstraction « tokens » | Quota mensuel de générations | Équivalence documentée |
| Refresh tokens | Access 15 min + refresh 7 j rotatifs | Conforme |
| Pattern Adapter (multi-provider) | Interface `MusicProvider` + token | Conforme |
| Cache / éco-conception | Cache `contentHash` des fiches | Conforme |
| Consentement parental (mineurs) | Vérification d'âge + consentement < 15 ans | Conforme |
| Mises à jour de dépendances | Dependabot + `npm audit` en CI | Conforme |
| Stockage S3 | MinIO en dev / OVH Object Storage en prod, même API | Conforme |
| Frontend sur Vercel Pro | nginx conteneurisé sur le VPS OVH (même origine, 100 % FR, −20 €/mois) | Écart documenté |
| Pages légales | Mentions légales + politique de confidentialité publiques | Conforme (identité éditeur à compléter) |
| Modération du contenu | Filtrage des entrées via API Mistral Moderation ; sortie générée + signalement à venir | Partiel |
| Mesure carbone (CodeCarbon) | Non outillée (cache = mesure effective) | Jalon |

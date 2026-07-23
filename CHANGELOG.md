# Changelog

Toutes les évolutions notables du projet. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/),
versions selon [SemVer](https://semver.org/lang/fr/).

## [1.0.0-rc.6] — 2026-07-23

Modération des entrées.

### Sécurité
- Filtrage du texte soumis par l'utilisateur (contenu de cours, paroles/style/titre) via l'API Moderation de Mistral avant tout appel IA ; contenu nuisible rejeté en `422`, indisponibilité du service en `503` (fail-closed). Catégories `health`, `law` et `financial` exclues pour éviter les faux positifs sur des cours de médecine ou de droit.

## [1.0.0-rc.5] — 2026-07-21

Paroles karaoké synchronisées.

### Paroles synchronisées
- Récupération des paroles horodatées mot à mot via kie.ai (`get-timestamped-lyrics`) et stockage de l'alignement.
- Surlignage du mot en cours façon karaoké, synchronisé à la lecture audio (boucle `requestAnimationFrame`).
- Compensation de la latence de sortie audio pour un surlignage bien calé sur le son.
- Récupération de l'alignement par webhook comme par synchronisation manuelle, avec bouton de relance.

### Mobile
- Bouton d'affichage des paroles dans le lecteur en version mobile.

## [1.0.0-rc.4] — 2026-07-20

Mention des transferts hors UE.

### RGPD
- Documentation des transferts vers les sous-traitants IA hors UE et minimisation des données transmises (payload).

## [1.0.0-rc.3] — 2026-07-20

Pages légales publiques.

### Légal
- Pages légales publiques (mentions légales, confidentialité) avec identité de l'éditeur renseignée.
- Notes d'écart Bloc 1 sur l'hébergement et le stockage.

### Documentation
- Procédures d'arrêt, de redémarrage et de maintenance ajoutées au manuel de déploiement.

## [1.0.0-rc.2] — 2026-07-20

Premier déploiement automatique sur le VPS OVH et responsive mobile.

### Déploiement
- Stack de production OVH (compose, Caddy, configuration S3 générique compatible OVH Object Storage).
- Déploiement continu déclenché par les tags de version, avec health checks sur `127.0.0.1`.

### Mobile
- Refonte responsive : drawer repliable, bibliothèque empilée, grilles en colonne unique, lecteur condensé.
- Corrections de débordement horizontal et de mise en page du player et de la bannière de crédits.

### RGPD
- Vérification de l'âge et consentement parental pour les moins de 15 ans.

### Éco-conception & architecture
- Cache par empreinte de contenu pour éviter les appels IA redondants (`DocumentService`).
- Extraction de l'interface `MusicProvider` (pattern adaptateur, prêt pour plusieurs fournisseurs).

### Tests, docs & CI
- Tests de la chaîne de génération (suno, mistral, storage, music) et des contrôleurs restants.
- Dependabot pour les workspaces npm et les GitHub Actions.
- Documentation : README réel, manuels de déploiement / utilisateur / mise à jour, décisions d'architecture, cahier de recettes.

## [1.0.0-rc.1] — 2026-07-19

Durcissement de la certification Bloc 2 : sécurité, RGPD, tests, accessibilité, déploiement.

### Sécurité
- En-têtes HTTP Helmet et limitation de débit (100 req/min global, 5/min sur login/register).
- Secret partagé exigé sur le webhook Kie (`/api/music/webhook/kie/:secret`).
- Tokens JWT à durée courte (15 min) avec refresh tokens rotatifs (7 j, hash bcrypt en base),
  et rafraîchissement automatique côté client sur 401.

### RGPD
- Suppression de compte (`DELETE /api/auth/me`) avec cascade (musiques + objets MinIO, playlists, amitiés).
- Consentement obligatoire à l'inscription (`consentAt` persisté).

### Tests & CI
- Seuils de couverture Jest et tests guard/strategy/controller (API).
- Tests end-to-end réels du flux d'authentification contre PostgreSQL.
- Couverture Vitest et specs de composants `generate` / `library` (client).
- CI : rapports de couverture en artifact, exécution e2e et `npm audit`.

### Accessibilité
- Contrôles focusables au clavier, `aria-label`, labels de formulaires, `aria-live`,
  `lang="fr"`, styles `:focus-visible`, règles ESLint d'accessibilité activées.

### Infrastructure
- Image Docker client (nginx, fallback SPA, proxy `/api`), profil compose `full`,
  politiques `restart: unless-stopped`.

### Nettoyage
- Suppression des modules `chat` et `gemini` inutilisés et de leur configuration.

## [0.3.0] — 2026-07-18

Qualité et modernisation du front.

- `ThemeService` (dark mode par signal + persistance), vraie page 404, titres de routes.
- `ChangeDetectionStrategy.OnPush` sur tous les composants, `:focus-visible`.
- Restructuration `core` / `features` / `shared` / `layout` avec alias de chemins.
- Premiers tests unitaires client et budgets de build réalistes.

## [0.2.0] — 2026-07-14

Produit complet côté fonctionnalités.

- Lecteur audio complet : seek, volume, répétition, file d'attente, lecture de playlist.
- Favoris (playlist par défaut non supprimable).
- Partage de playlists entre amis (sections « créées » / « partagées », droits créateur).
- UX de statut de génération (indicateur ambiant, notification par polling + sync).
- Téléchargement des pistes.

## [0.1.0] — 2026-07-13

MVP initial.

- Authentification JWT (register / login / profil).
- Génération de musique : fiche de révision via Mistral (PDF ou texte) puis musique via Kie/Suno.
- Bibliothèque, playlists et amis câblés au backend, quota d'abonnement.

[1.0.0-rc.5]: https://github.com/ramenard/study-tune/releases/tag/v1.0.0-rc.5
[1.0.0-rc.4]: https://github.com/ramenard/study-tune/releases/tag/v1.0.0-rc.4
[1.0.0-rc.3]: https://github.com/ramenard/study-tune/releases/tag/v1.0.0-rc.3
[1.0.0-rc.2]: https://github.com/ramenard/study-tune/releases/tag/v1.0.0-rc.2
[1.0.0-rc.1]: https://github.com/ramenard/study-tune/releases/tag/v1.0.0-rc.1
[0.3.0]: https://github.com/ramenard/study-tune/releases/tag/v0.3.0
[0.2.0]: https://github.com/ramenard/study-tune/releases/tag/v0.2.0
[0.1.0]: https://github.com/ramenard/study-tune/releases/tag/v0.1.0

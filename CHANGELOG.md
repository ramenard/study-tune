# Changelog

Toutes les évolutions notables du projet. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/),
versions selon [SemVer](https://semver.org/lang/fr/).

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

[1.0.0-rc.1]: https://github.com/ramenard/study-tune/releases/tag/v1.0.0-rc.1
[0.3.0]: https://github.com/ramenard/study-tune/releases/tag/v0.3.0
[0.2.0]: https://github.com/ramenard/study-tune/releases/tag/v0.2.0
[0.1.0]: https://github.com/ramenard/study-tune/releases/tag/v0.1.0

# Cahier de recettes

- **Projet** : StudyTune
- **Version testée** : `v1.0.0-rc.1`
- **Environnement** : local, `docker compose` (PostgreSQL 16 + MinIO), API sur `:3001`, client sur `:4200`
- **Navigateurs** : Chromium / Firefox (dernières versions)

## Légende du résultat

- **OK (auto)** — couvert par un test automatisé (e2e / unitaire), référencé dans la colonne.
- **OK (dev)** — validé manuellement pendant le développement de la fonctionnalité.
- **À rejouer** — à exécuter pour les captures du dossier.

Les scénarios automatisés du flux d'authentification sont dans `api/test/app.e2e-spec.ts`
(référencés `E2E-x`).

## Tests fonctionnels

| ID | Fonctionnalité | Prérequis | Étapes | Résultat attendu | Type | Résultat                                | Anomalie |
|---|---|---|---|---|---|-----------------------------------------|---|
| F-01 | Inscription (≥ 15 ans) | — | Remplir `/register` (dont date de naissance), cocher le consentement, valider | Compte créé, utilisateur connecté, tokens émis | Fonctionnel | OK (auto) `E2E-1`                       | — |
| F-02 | Inscription refusée sans consentement | — | Soumettre sans cocher le consentement | Erreur 400, pas de compte créé | Fonctionnel | OK (auto) `E2E-2`                       | — |
| F-25 | Inscription < 15 ans sans email parent | — | Renseigner une date de naissance < 15 ans sans email de responsable légal | Erreur 400 ; bloc consentement parental affiché côté front | Sécurité/RGPD | OK (auto) `E2E-3'`, `auth.service.spec` | — |
| F-03 | Connexion | Compte existant | Saisir email + mot de passe sur `/login` | Connexion, redirection accueil | Fonctionnel | OK (auto) `E2E-3`                       | — |
| F-04 | Déconnexion (arrêt lecture) | Connecté, une piste en lecture | Cliquer « Déconnexion » | Session purgée, lecture stoppée, retour `/login` | Fonctionnel | OK (dev)                                | — |
| F-05 | Rafraîchissement de session | Connecté, access token expiré | Laisser expirer puis agir | Refresh automatique, action rejouée sans reconnexion | Fonctionnel | OK (auto) `auth.service.spec`           | B-09 |
| F-06 | Génération d'une fiche (texte) | Connecté, `MISTRAL_API_KEY` | Onglet texte → coller un cours → « Générer la fiche » | Titre, résumé et paroles générés | Fonctionnel | OK (dev)                                | — |
| F-07 | Génération d'une fiche (PDF) | Connecté, `MISTRAL_API_KEY` | Importer un PDF → « Générer la fiche » | Fiche générée à partir du PDF | Fonctionnel | OK (dev)                                | — |
| F-08 | Génération de musique | Fiche générée, `KIE_API_KEY`, MinIO up | Choisir un style → « Transformer en musique » | 202 accepté, statut « en cours », puis piste livrée et stockée | Fonctionnel | OK (dev)                                | B-10 |
| F-09 | Quota free / premium (402) | Compte free sans génération restante | Lancer une génération | Message « plus de génération » / 402 | Fonctionnel | OK (auto) `generate.component.spec`     | — |
| F-10 | Abonnement / désabonnement | Connecté | Page Abonnement → « Passer premium » puis annuler | Plan basculé premium ↔ free, quota mis à jour | Fonctionnel | OK (dev)                                | — |
| F-11 | Bibliothèque — lister/rechercher | Morceaux existants | Ouvrir Bibliothèque, filtrer | Liste paginée, filtre par titre/style | Fonctionnel | OK (auto) `library.component.spec`      | — |
| F-12 | Bibliothèque — renommer | Un morceau | Éditer le titre, valider | Titre mis à jour, toast de confirmation | Fonctionnel | OK (dev)                                | — |
| F-13 | Bibliothèque — supprimer | Un morceau | Confirmer la suppression | Morceau retiré de la liste | Fonctionnel | OK (dev)                                | — |
| F-14 | Bibliothèque — télécharger | Un morceau prêt | Cliquer « télécharger » | Fichier audio téléchargé | Fonctionnel | OK (dev)                                | — |
| F-15 | Playlists — CRUD | Connecté | Créer, ajouter/retirer des pistes, supprimer | Playlist gérée correctement | Fonctionnel | OK (dev)                                | — |
| F-16 | Playlists — partage + droits créateur | Deux comptes amis | Partager une playlist, tenter une édition côté non-créateur | Partage OK, édition interdite hors créateur | Fonctionnel | OK (dev)                                | — |
| F-17 | Favoris (playlist par défaut) | Connecté | Ajouter aux favoris, tenter de supprimer la playlist favoris | Favoris togglable, playlist non supprimable | Fonctionnel | OK (dev)                                | — |
| F-18 | Amis — recherche/demande/réponse | Deux comptes | Rechercher, envoyer une demande, accepter/refuser | Demande gérée, badge des demandes en attente | Fonctionnel | OK (dev)                                | — |
| F-19 | Lecteur — lecture/seek/volume/repeat/queue | Une piste prête | Lire, déplacer la position, régler le volume, répétition, enchaînement | Tous les contrôles opérants | Fonctionnel | OK (dev)                                | — |
| F-20 | Streaming depuis une playlist partagée | Playlist partagée avec pistes | Lire une piste d'une playlist partagée | Lecture autorisée | Fonctionnel | OK (dev)                                | — |
| F-21 | Thème sombre persistant | — | Basculer le thème, rafraîchir la page | Thème conservé après refresh | Fonctionnel | OK (auto) `theme.service.spec`          | B-05 |
| F-22 | Page 404 | — | Naviguer vers une URL inconnue | Vraie page 404 (pas de redirection silencieuse) | Fonctionnel | OK (dev)                                | — |
| F-23 | Suppression de compte (RGPD) | Connecté | Profil → zone de danger → confirmer | Compte + données supprimés, retour `/login` | Fonctionnel | OK (auto) `E2E-7`, `E2E-8`              | — |
| F-24 | Cache anti-redondance des fiches | Connecté | Générer une fiche, puis régénérer le même cours | 2ᵉ génération instantanée, aucun appel IA, mention « Fiche réutilisée » affichée | Fonctionnel | OK (auto) `document.service.spec`       | — |

## Tests de sécurité

| ID | Scénario | Prérequis | Étapes | Résultat attendu | Type | Résultat                           | Anomalie |
|---|---|---|---|---|---|------------------------------------|---|
| S-01 | Endpoint protégé sans token | — | `GET /api/auth/me` sans `Authorization` | 401 | Sécurité | OK (auto) `E2E-5`                  | — |
| S-02 | Champ inconnu rejeté | — | `POST /api/auth/login` avec un champ non déclaré | 400 (`forbidNonWhitelisted`) | Sécurité | OK (auto) `E2E-6`                  | — |
| S-03 | Webhook sans secret valide | — | `POST /api/music/webhook/kie/<mauvais-secret>` | 401 | Sécurité | OK (auto) `kie-webhook.guard.spec` | — |
| S-04 | Rate limiting login | — | Rafale de requêtes sur `/api/auth/login` | 429 après 5 requêtes/min | Sécurité | OK (dev)                           | — |
| S-05 | Accès à la ressource d'un autre utilisateur | Deux comptes | Tenter d'accéder à une musique d'un autre | 403 / 404 | Sécurité | OK (dev)                           | — |
| S-06 | Mot de passe absent des réponses | Connecté | Lire la réponse de `/api/auth/me` | Aucun champ `password` | Sécurité | OK (auto) `E2E-4`                  | — |
| S-07 | Modération du contenu soumis | Connecté, `MISTRAL_API_KEY` | Soumettre un cours ou des paroles à contenu nuisible | 422, contenu rejeté avant appel IA, catégories signalées | Sécurité | OK (auto) `moderation.service.spec` | — |

## Tests structurels

| ID | Scénario | Étapes | Résultat attendu | Type | Résultat | Anomalie |
|---|---|---|---|---|---|---|
| T-01 | Migrations sur base vierge | `npm run migration:run -w api` sur une base neuve | Toutes les migrations s'appliquent, « No migrations pending » au 2ᵉ passage | Structurel | OK (auto) CI | — |
| T-02 | Healthcheck | `GET /api/health` | `{ status: "ok" }`, connexion TypeORM vérifiée | Structurel | OK (dev) | — |
| T-03 | Build de production (API + client) | `npm run build` | Les deux builds réussissent | Structurel | OK (auto) CI | — |
| T-04 | Suite de tests | `npm test -w api`, `npm run test:cov -w api`, `npm run test -w client`, e2e | Tous verts ; couverture API ~85 % statements (seuils tenus), 118 tests unitaires + 8 e2e | Structurel | OK (auto) CI | — |
| T-05 | Stack Docker complète | `docker compose --profile full up --build` | PostgreSQL, MinIO, API et client démarrent ; SPA servie sur `:4200` | Structurel | OK (dev) | — |

## Synthèse

Aucun test **KO** à la date de rédaction. Les scénarios `À rejouer` sont fonctionnels mais restent
à exécuter formellement pour les captures du dossier. Les anomalies référencées sont détaillées
dans le [plan de correction des bogues](./plan-correction-bogues.md).

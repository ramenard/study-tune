# Manuel de mise à jour

## Choix technologiques et raisons

Les mises à jour reposent sur un versionnement Git avec tags annotés (SemVer) et un `CHANGELOG.md`
sectionné par version, générés depuis des commits conventionnels. Le schéma de base évolue par
**migrations TypeORM** réversibles (`up` / `down`), ce qui rend chaque montée de version rejouable
et annulable. Le rollback combine `migration:revert` et le retour à un tag précédent : aucune
opération manuelle sur la base n'est nécessaire.

## Procédure de montée de version

```bash
# 1. Récupérer la nouvelle version
git fetch --tags
git checkout main && git pull

# 2. Mettre à jour les dépendances
npm install

# 3. Appliquer les nouvelles migrations
npm run migration:run -w api

# 4. Rebuild et redémarrage
npm run build
# puis redémarrer l'API et le client, ou en Docker :
docker compose -f docker/docker-compose.yml --profile full up --build -d
```

En production (`NODE_ENV=production`), les migrations s'appliquent automatiquement au démarrage de
l'API ; l'étape 3 reste utile pour valider en amont.

## Rollback

```bash
# 1. Annuler la ou les migrations de la version fautive
npm run migration:revert -w api        # à répéter par migration à annuler

# 2. Revenir au tag précédent
git checkout v0.3.0                     # exemple
npm install && npm run build

# 3. Redémarrer
docker compose -f docker/docker-compose.yml --profile full up --build -d
```

> Vérifier le `CHANGELOG.md` : le nombre de migrations à annuler correspond aux entrées ajoutées
> depuis le tag cible.

## Politique de dépendances

- **Vulnérabilités** : `npm audit --omit=dev --audit-level=high` est exécuté en CI (non bloquant)
  pour suivre les failles des dépendances de production. Traiter les alertes `high`/`critical` en
  priorité.
- **Montées majeures Angular** : utiliser l'outil officiel `ng update` (migrations de schematics
  automatiques) plutôt qu'un bump manuel du `package.json`.
- **Montées NestJS** : suivre le guide de migration officiel entre versions majeures.
- Après toute montée : `npm run lint`, `npm run test` (API + client) et `npm run build` doivent
  passer avant de taguer une nouvelle version.

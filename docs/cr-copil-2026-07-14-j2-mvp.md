# Compte rendu — Comité de pilotage J2 · MVP

| | |
|---|---|
| **Date** | Mardi 14 juillet 2026 |
| **Jalon** | J2 · MVP livré |
| **Version présentée** | v0.2.0 |
| **Participants** | Commanditaire · Raphaël (chef de projet) · Camille (Product Owner) |
| **Excusés** | Sofia, Hugo, Mateo |
| **Rédacteur** | Camille |
| **Durée** | 45 minutes |

## 1. Ce qui a été livré

Le parcours complet est fonctionnel de bout en bout : import d'un cours en PDF ou en texte,
génération d'une fiche de révision et de paroles, composition d'un titre chanté dans le style
choisi, écoute dans un lecteur complet, rangement en bibliothèque et en playlists, partage avec
des amis.

**Démonstration réalisée en séance** : import d'un cours d'histoire de terminale, génération
complète, écoute du titre obtenu, ajout à une playlist partagée.

| Lot | Avancement | Commentaire |
|---|---|---|
| L1 · Import du cours | Livré | PDF et saisie libre |
| L2 · Fiche et paroles | Livré | Mention « généré par IA » affichée |
| L3 · Musique et lecteur | Livré | Génération asynchrone, notification en fin de traitement |
| L5 · Bibliothèque et playlists | Livré | Favoris inclus |
| L6 · Social | Livré | Amis et partage de playlists |
| L7 · Socle technique | Livré | Intégration continue, migrations de base versionnées |
| L4 · Compte et abonnement | Partiel | Abonnement simulé — voir point 4 |

## 2. Indicateurs à date

| Indicateur | Valeur | Cible | Statut |
|---|---|---|---|
| Charge consommée | 46,5 j/h sur 72 estimés | — | Conforme |
| Périmètre Must du MVP | Livré intégralement | 100 % | Atteint |
| Versions publiées | 2 (v0.1.0, v0.2.0) | — | — |
| Anomalies détectées | 7, toutes corrigées | 0 ouverte | Atteint |
| Coût d'une génération | 0,055 € | < 0,40 € | Très en dessous |
| Jalon J2 | Tenu | 14/07 | Atteint |

## 3. Écart de planning à signaler

Le jalon J2 était initialement prévu fin mai. Il est atteint le 14 juillet, soit **46 jours de
décalage**.

**Cause** : l'équipe a été mobilisée sur la préparation du dossier de cadrage puis sur un projet
client prioritaire, ce qui a suspendu la production pendant sept semaines. Le risque de
disponibilité figurait au registre de cadrage, mais aucun indicateur ne le surveillait.

**Conséquence** : il reste 2,5 semaines avant le jalon J4, non décalable, avec la sécurité, la
conformité RGPD, l'accessibilité et la couverture de tests encore à produire.

**Mesure corrective immédiate** : suivi hebdomadaire de la capacité réellement disponible,
présenté au comité de pilotage suivant.

## 4. Décision demandée au commanditaire

> **Le paiement en ligne de l'abonnement peut-il être reporté après la V1 ?**

Options présentées :

| Option | Description | Analyse |
|---|---|---|
| A | Décaler le jalon J4 | Écartée : le jalon est contractuel |
| B | Renforcer l'équipe | Écartée : aucune enveloppe disponible, et l'intégration d'un nouvel arrivant coûterait plus que le temps gagné |
| C | Reporter le paiement en ligne, conserver un abonnement simulé | **Proposée** |
| D | Réduire la couverture de tests et les exigences de sécurité | Écartée : la qualité et la conformité ne sont pas des variables d'ajustement |

**Argumentaire de l'option C** : le modèle de données du quota et de l'abonnement est déjà en
place, l'intégration d'un prestataire de paiement se branchera dessus sans refonte. Le service
peut être mis en recette et testé sans encaissement réel. Le coût du report est estimé à
6,5 j/h, reprogrammés en v1.1.

**Décision du commanditaire** : option C retenue. Le paiement en ligne est sorti du périmètre V1
et inscrit en v1.1, sous réserve qu'aucun encaissement ne soit possible ni suggéré à
l'utilisateur avant sa mise en œuvre réelle.

## 5. Risques suivis

| Risque | Criticité | Évolution |
|---|---|---|
| Disponibilité de l'équipe | 16 | **Survenu** — mesure corrective au point 3 |
| Perte d'un résultat de génération | 9 | Corrigé (point de rattrapage ajouté) |
| Dépendance au fournisseur musical | 12 | Traitement prévu au sprint suivant |
| Non-conformité RGPD sur un public mineur | 8 | Traitement prévu au sprint suivant |

## 6. Prochaines étapes

| Échéance | Objet | Responsable |
|---|---|---|
| 22/07 | J3 · Sécurité, RGPD mineurs, accessibilité, tests, mise en production | Raphaël |
| 24/07 | J4 · Gel du périmètre fonctionnel | Camille |
| 24/07 | Comité de pilotage de gel fonctionnel | Camille |

## 7. Points de validation

| | |
|---|---|
| **Validé** | Périmètre fonctionnel du MVP |
| **Validé** | Report du paiement en ligne en v1.1 |
| **Réserve** | Consentement du responsable légal à vérifier par email avant toute ouverture publique |

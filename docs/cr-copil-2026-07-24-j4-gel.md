# Compte rendu — Comité de pilotage J4 · Gel fonctionnel

| | |
|---|---|
| **Date** | Vendredi 24 juillet 2026 |
| **Jalon** | J4 · Gel du périmètre fonctionnel |
| **Version présentée** | v1.0.0-rc.6 |
| **Participants** | Commanditaire · Raphaël (chef de projet) · Camille (Product Owner) · Sofia |
| **Rédacteur** | Camille |
| **Durée** | 45 minutes |

## 1. Objet

Constater que le périmètre de la V1 est complet, geler les évolutions fonctionnelles et engager
la phase de maintien en condition opérationnelle jusqu'à la recette.

## 2. Livré depuis le comité précédent

| Domaine | Contenu |
|---|---|
| Sécurité | En-têtes de sécurité, limitation du débit de connexion, secret sur le rappel du fournisseur, jeton d'accès court et rotation des jetons de rafraîchissement |
| Conformité | Contrôle d'âge, consentement parental sous 15 ans, consentement à l'inscription, effacement en cascade, pages légales, information sur les transferts hors UE |
| Accessibilité | Navigation au clavier, libellés et rôles ARIA, gestion du focus, langue déclarée |
| Qualité | Seuils de couverture bloquants en intégration continue, scénarios de bout en bout, audit de sécurité des dépendances |
| Exploitation | Mise en production, déploiement continu déclenché par la publication d'une version |
| Produit | Paroles synchronisées façon karaoké, affichage mobile, cache anti-redondance, modération des contenus soumis |

**Démonstration réalisée en séance** : suppression complète d'un compte avec effacement des
données associées, puis refus d'une inscription pour un utilisateur de moins de 13 ans.

## 3. Indicateurs de fin de phase

| Axe | Indicateur | Valeur | Cible | Statut |
|---|---|---|---|---|
| Avancement | Priorités Must livrées | 42 sur 42 | 100 % | Atteint |
| Avancement | Priorités Should livrées | 13 sur 15 | — | Paiement en ligne et file asynchrone déprogrammés |
| Avancement | Priorités Could livrées | 6 sur 6 | — | Périmètre social livré au minimum utile |
| Charge | Consommée | 71,5 j/h sur 72 | < 72 | Conforme |
| Délais | Jalon J4 | Tenu | 24/07 | Atteint |
| Qualité | Cas de test automatisés | 175 | > 150 | Atteint |
| Qualité | Anomalies ouvertes | 0 | 0 | Atteint |
| Coûts | Exploitation mensuelle | 14,75 € | < 470 € | Très en dessous |

## 4. Arbitrage complémentaire présenté

> **File asynchrone locale : maintenue ou abandonnée ?**

La génération musicale est déjà asynchrone côté fournisseur, qui notifie l'API par rappel HTTP.
Ajouter une file de traitement locale ferait double emploi pour la V1.

**Décision** : abandon pour la V1, au profit du rappel HTTP complété par un point de
rattrapage. Économie de 2 j/h.

**Conséquence assumée et mesurée** : ce choix a produit deux anomalies, un rappel HTTP jamais
reçu puis des générations bloquées lorsque le rappel se perd. Les deux ont été corrigées dans le
sprint, la seconde par l'ajout du point de rattrapage. La solution est stabilisée, mais la file
locale reste pertinente le jour où le service devra gérer des relances automatiques ou une
facturation à l'usage.

## 5. Réserves inscrites au procès-verbal

| Réserve | Portée | Traitement prévu |
|---|---|---|
| Paiement en ligne non intégré | Aucun encaissement possible en V1 | v1.1 |
| Consentement du responsable légal déclaratif | Non vérifié par email | v1.1, avant toute ouverture publique |
| Modération portant sur les contenus soumis | Les contenus générés ne sont pas filtrés en sortie | v1.1 |
| Politique de sécurité du contenu assouplie | Nécessaire à la documentation d'API en production | v1.1 |

## 6. Décisions

| | |
|---|---|
| **Validé** | Périmètre fonctionnel de la V1 : gel prononcé |
| **Validé** | Abandon de la file asynchrone locale pour la V1 |
| **Validé** | Passage en maintien en condition opérationnelle jusqu'à la recette |
| **Acté** | Les quatre réserves ci-dessus conditionnent l'ouverture publique, pas la recette |

## 7. Prochaines étapes

| Échéance | Objet | Responsable |
|---|---|---|
| 14/08 | J5 · Supervision, processus d'anomalies, journal des versions | Sofia |
| 16/09 | J6 · Recette finale et procès-verbal de validation | Camille |
| 16/10 | J7 · v1.1, prérequis à l'ouverture publique | Raphaël |

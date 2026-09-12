# RACI, ressources et aménagements — StudyTune

> Document de pilotage. L'affectation ci-dessous décrit l'équipe cible dimensionnée au cadrage
> (72 j/h). Elle est reflétée à l'identique dans le champ « Responsable » de l'outil de suivi.

## 1. Équipe et capacité

| Membre | Rôle | Affectation | Charge estimée | Charge réalisée |
|---|---|---|---|---|
| Raphaël | Chef de projet / tech lead | 100 % | 22,5 j/h | 26,0 j/h |
| Sofia | Développeuse back / DevOps | 100 % | 23,5 j/h | 23,5 j/h |
| Hugo | Développeur front Angular | 100 % | 15,0 j/h | 13,5 j/h |
| Camille | Product Owner | 50 % | 6,0 j/h | 7,0 j/h |
| Mateo | UX designer freelance (Montréal) | 25 % | 5,0 j/h | 4,5 j/h |
| DPO externe | Délégué à la protection des données, mutualisé | ponctuel | — | — |
| **Total** | | | **72,0 j/h** | **74,5 j/h** |

## 2. Matrice RACI par lot

**R** réalise · **A** approuve (une seule par ligne) · **C** est consulté · **I** est informé

| Lot | Charge | Raphaël | Sofia | Hugo | Camille | Mateo | DPO | Commanditaire |
|---|---|---|---|---|---|---|---|---|
| L1 · Import du cours | 8 j/h | A | R | R | C | C | I | I |
| L2 · Fiche et paroles IA | 10 j/h | R/A | I | I | C | C | I | I |
| L3 · Musique et lecteur | 12 j/h | A | R | R | C | C | — | I |
| L4 · Compte, RGPD et abonnement | 8 j/h | A | R | I | C | — | **C** | I |
| L5 · Bibliothèque et playlists | 6 j/h | A | R | R | C | C | — | I |
| L6 · Social | 10 j/h | A | R | R | C | C | I | I |
| L7 · Socle technique et DevOps | 8 j/h | A | R | R | I | — | — | I |
| L8 · Pilotage | 10 j/h | R | I | I | R/A | I | I | **C** |

**Règles appliquées**

- Une seule approbation par lot : pas de responsabilité diluée.
- Le chef de projet approuve tout ce qui touche l'architecture ; le Product Owner approuve le pilotage et le périmètre.
- Le DPO est consulté, jamais informé après coup, sur tout lot touchant aux données d'un public mineur.
- Le commanditaire est consulté sur les arbitrages de périmètre et informé à chaque jalon.

## 3. Affectation des tâches selon les compétences

| Membre | Tâches confiées | Justification |
|---|---|---|
| Raphaël | Architecture, intégration des services d'IA, cache anti-redondance, tests et CI | Seul profil ayant une expérience d'intégration de LLM et de conception d'API |
| Sofia | Authentification, RGPD, conteneurisation, mise en production, supervision | Profil back et DevOps confirmé ; certifiée sur les bonnes pratiques de sécurité |
| Hugo | Écrans, lecteur audio, karaoké, affichage mobile, accessibilité | Spécialiste Angular ; sensibilisé à l'accessibilité |
| Camille | Backlog, priorisation, recettes, comptes rendus, relation commanditaire | Interlocutrice du commanditaire ; garante du périmètre |
| Mateo | Maquettes et parcours utilisateur | Designer spécialisé sur les publics adolescents |

## 4. Aménagements et conditions de travail

### Situation de handicap

Hugo bénéficie d'une reconnaissance de la qualité de travailleur handicapé. Les aménagements
ont été définis avec lui et le service RH, et ne sont pas visibles dans l'outil de suivi :
l'information reste confidentielle.

| Besoin | Aménagement | Mise en œuvre |
|---|---|---|
| Lecture de longs documents écrits | Revues de code orales en binôme plutôt que commentaires écrits étendus | À chaque demande de fusion |
| Saisie et relecture de texte | Poste adapté : police à empattement adapté, thème sombre, correcteur, complétion automatique, analyse statique renforcée | Sprint 0 |
| Rédaction documentaire | Cahier de recettes rédigé en binôme avec le Product Owner | Sprints 3 et 6 |
| Temps de traitement | Estimations majorées de 15 % sur les tâches à forte charge rédactionnelle | Chaque sprint planning |

### Collaboration internationale

Mateo travaille depuis Montréal, avec six heures de décalage.

| Contrainte | Réponse |
|---|---|
| Décalage horaire | Créneau de recouvrement fixe de 15 h à 17 h (heure de Paris) pour les revues de maquettes |
| Coordination | Fonctionnement asynchrone écrit par défaut ; décisions consignées dans les tickets |
| Livrables | Maquettes déposées sur l'espace partagé, commentées en différé |
| Cadre contractuel | Prestataire externe : consultation, jamais d'approbation |

### Conditions communes

- Droit à la déconnexion : aucune sollicitation attendue en dehors des plages de travail.
- Deux jours de télétravail hebdomadaires, les rituels étant tenus en visioconférence.
- Les revues de code sont un échange entre pairs, jamais une évaluation individuelle.

## 5. Ressources nécessaires

### Humaines

72 j/h répartis sur cinq intervenants, plus un DPO mutualisé consulté ponctuellement.

### Financières

| Poste | Montant |
|---|---|
| Enveloppe projet | 35 000 € |
| Exploitation prévue | 470 €/mois |
| Exploitation réelle | 14,75 €/mois |

### Matérielles et services

| Ressource | Usage | Coût réel |
|---|---|---|
| Postes de développement | Un par intervenant | — |
| VPS OVH | Production : API, base, passerelle | 10,19 €/mois |
| Object Storage OVH (GRA) | Stockage des fichiers audio | 3,95 €/mois |
| Nom de domaine | Accès public au service | 7,30 €/an |
| Service de génération de texte | Fiche, paroles, modération | 0 € (offre gratuite) |
| Service de génération musicale | Composition des titres | 5 $ (un seul pack) |
| Forge logicielle | Dépôt, suivi, intégration continue | 0 € (offre gratuite) |
| Supervision | Sondes externes et alertes | 0 € (auto-hébergé) |

### Environnement de travail collaboratif

| Outil | Objectif |
|---|---|
| Forge logicielle | Code, revues, backlog, sprints, intégration continue |
| Messagerie d'équipe | Échanges courts, alertes automatiques de supervision |
| Visioconférence | Rituels, revues de maquettes, comités de pilotage |
| Espace documentaire partagé | Maquettes, comptes rendus, documents de cadrage |

## 6. Ce que ce dispositif a produit

- 100 % des priorités Must livrées ; deux arbitrages de périmètre assumés et tracés.
- Charge globale tenue à +3,5 % de l'estimation initiale.
- Une seule personne réellement en surcharge sur la période : le chef de projet, qui cumulait
  pilotage et développement. C'est le principal défaut de ce dispositif, traité dans les
  recommandations du bilan.

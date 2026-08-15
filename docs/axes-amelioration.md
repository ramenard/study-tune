# Axes d'amélioration — tableau coût / délai / gain

Récapitulatif chiffré des axes d'amélioration proposés (compétence C4.3.1).
Les valeurs de référence sont mesurées sur la version courante ; les coûts et
délais sont des estimations assumées, à affiner.

## Indicateurs de référence

| Indicateur | Valeur mesurée |
|---|---|
| Temps de génération bout-en-bout | ~2 min : ~30 s pour la fiche (Mistral), ~1 min 30 pour la musique (dont ~72 s côté Suno via Kie.ai) |
| Coût d'appel IA par titre | 0,06 $ par génération musicale (12 tokens Kie à 5 $ / 1000 tokens) |
| Taille d'un fichier audio | 1,5 à 5 Mo selon la durée du morceau (1 min 20 à 3 min 30) |
| Latence des endpoints | Aucune latence problématique observée à ce stade d'usage |

## Axes d'amélioration

| Axe | Constat | Gain attendu | Coût | Délai | Faisabilité | Priorité |
|---|---|---|---|---|---|---|
| 1. Cache anti-redondance des résumés et paroles | Chaque génération rappelle Mistral, même sur un contenu déjà traité ; la fiche pèse ~30 s et une part du coût IA | Économie de la part fiche du coût IA sur contenus répétés + suppression des ~30 s d'attente (réponse quasi immédiate si cache touché) | Faible — sans infra supplémentaire (base ou magasin léger) | 2–3 jours | Élevée — point d'insertion avant l'appel Mistral déjà identifié | **Haute** |
| 2. Diffusion de l'audio via cache / CDN | Fichiers audio de 1,5 à 5 Mo servis par un endpoint de streaming ; sollicite le VPS et sa bande passante sur les pistes populaires | Temps de chargement audio réduit, meilleure tenue en montée en charge (attractivité pour un public habitué au streaming) | Modéré — configuration CDN + coût récurrent de bande passante | ~3–5 jours | Bonne — stockage objet S3 expose déjà des URLs adaptées à une distribution en amont | Moyenne |
| 3. Retour visuel sur la file de génération | Attente de composition incompressible (~1 min 30, dont ~72 s Suno) ; peu de visibilité sur l'avancement → abandon | Meilleure rétention, réduction du taux d'abandon pendant l'attente | Faible — travail principalement front | 2–3 jours | Élevée — signaux de statut déjà exposés par l'API | **Haute** |
| 4. Monétisation (abonnement + crédits) | Modèle freemium sur quota mais paiement non intégré ; 0,06 $ par génération non répercutés → non viable à l'échelle | Viabilité économique + fonctionnalités premium renforçant l'attractivité | Modéré — intégration paiement, webhooks de facturation, états d'abonnement | ~5–8 jours | Bonne — modèle de données de quota déjà en place | Moyenne |

## Priorisation

Rapportés à une matrice gain / effort, les axes **1 (cache)** et **3 (file de
génération)** offrent le meilleur rapport : gain tangible pour un effort faible
et sans infrastructure nouvelle — ils sont donc prioritaires. Les axes **2 (CDN)**
et **4 (paiement)** apportent une valeur supérieure mais à coût et délai plus
élevés ; ils s'inscrivent dans un second temps, lié à l'ouverture publique du
service.

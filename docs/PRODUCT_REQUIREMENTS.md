# Document de Spécifications Fonctionnelles (PRD) - PartoCare

## 1. Introduction & Contexte
Le projet **PartoCare** est né du constat que la mortalité maternelle et néonatale reste élevée dans les pays en développement, notamment au Cameroun, en raison de retards dans la détection des complications du travail d'accouchement et dans le transfert des patientes vers des structures mieux équipées. 
Le partogramme papier traditionnel souffre de remplissages incomplets, de difficultés d'interprétation en temps réel et de l'absence d'alertes automatiques. PartoCare numérise cet outil essentiel et y intègre un système d'aide à la décision clinique et un réseau de référence obstétricale.

## 2. Objectifs du Produit
* **Digitalisation complète :** Remplacer le partogramme papier par une interface de saisie intuitive sur tablette, mobile et PC.
* **Alerte précoce :** Identifier automatiquement les anomalies du travail (dilatation stagnante, souffrance fœtale, pré-éclampsie) et notifier le personnel de santé via un code couleur standardisé.
* **Coordination des transferts :** Faciliter la génération de fiches de référence et la communication instantanée avec les hôpitaux d'accueil.
* **Fiabilité des données :** Permettre un fonctionnement en mode hors-ligne dans les zones reculées, avec resynchronisation automatique.

## 3. Profils Utilisateurs (Rôles)
La plateforme gère les droits et les accès selon 7 profils d'utilisateurs distincts :
1. **Sage-femme :** Saisie en temps réel en salle de naissance, consultation graphique du partogramme, création d'alertes et demandes de référence.
2. **Infirmier :** Aide au suivi en salle de naissance, saisie des constantes cliniques et administration de traitements sous supervision.
3. **Médecin :** Supervision clinique, validation des alertes complexes (Orange/Rouge), prescription et déclenchement des processus de référence.
4. **Gynécologue :** Expert consultant recevant les alertes rouges, gère les interventions obstétricales d'urgence et les accouchements complexes.
5. **Responsable maternité :** Gestion de la maternité locale, planification du personnel, supervision de la qualité de remplissage des partogrammes et suivi des indicateurs.
6. **Administrateur système :** Configuration globale de l'application, gestion des comptes utilisateurs, des structures de santé et de la flotte d'ambulances.
7. **District sanitaire :** Responsables administratifs de la santé à l'échelle du district, accèdent aux données agrégées d'indicateurs de mortalité, taux de complications et statut global de la flotte d'ambulances.

---

## 4. Modules Fonctionnels du Système

Le système est structuré autour de **10 modules clés** :

### 4.1. Module 1 : Authentification
* Authentification sécurisée (email/mot de passe).
* Attribution et contrôle d'accès basé sur les rôles (RBAC) pour les 7 types d'utilisateurs.
* Jetons de session d'API sécurisés avec déconnexion automatique en cas d'inactivité.

### 4.2. Module 2 : Gestion des Patientes
* Enregistrement de l'état civil de la patiente, coordonnées et contact d'urgence de l'accompagnateur.
* Profil médical consolidé et historique des consultations.

### 4.3. Module 3 : Grossesse
* Saisie des données de la grossesse actuelle.
* Antécédents obstétricaux : Gestité, Parité, Avortements, Enfants vivants.
* Suivi simplifié des consultations prénatales (CPN), facteurs de risque identifiés (HTA, diabète) et date d'accouchement prévue.

### 4.4. Module 4 : Travail d'Accouchement
* Démarrage et admission en salle d'accouchement d'une patiente en travail.
* Suivi de l'état initial d'admission : heure clinique, dilatation de départ, état des membranes.
* Fermeture de session lors de l'accouchement (voie basse, césarienne) ou du transfert de la patiente.

### 4.5. Module 5 : Partogramme Numérique
* Saisie rapide sur écran tactile de tous les paramètres du partogramme.
* Tracé graphique automatique et dynamique : dilatation cervicale (X), descente de la tête fœtale (O), courbes de référence (Alerte et Action), rythme cardiaque fœtal (FCF) et grille d'intensité des contractions utérines.

### 4.6. Module 6 : Alertes Intelligentes
* Moteur de règles évaluant la sévérité clinique à chaque saisie (Vert, Jaune, Orange, Rouge).
* Détection automatique des pathologies : travail prolongé (dystocie), souffrance fœtale, risque de pré-éclampsie/éclampsie, chorioamnionite et hémorragie.
* Système d'escalade des alertes en l'absence de réaction clinique.

### 4.7. Module 7 : Références Obstétricales
* Génération automatisée et pré-remplie de la fiche de transfert obstétrical.
* Recherche et sélection du centre de référence partenaire selon le niveau de plateau technique requis.
* Handshake numérique en temps réel (demande, acceptation, transit, admission).

### 4.8. Module 8 : Gestion des Ambulances
* Répertoire des ambulances rattachées aux districts ou aux structures de santé.
* Suivi du statut de disponibilité en temps réel (`disponible`, `en mission`, `maintenance`).
* Affectation automatique ou manuelle d'une ambulance à une référence active pour assurer l'évacuation rapide.
* Suivi de la géolocalisation de l'évacuation (ou temps estimé d'arrivée).

### 4.9. Module 9 : Statistiques et Rapports
* Tableau de bord d'indicateurs de performance clés (KPIs) : taux d'accouchements, taux de complications, nombre de césariennes et de transferts.
* Statistiques régionales et de districts pour l'évaluation de la mortalité maternelle et néonatale.

### 4.10. Module 10 : Administration du Système
* Gestion des utilisateurs et de leurs rôles.
* Configuration des structures de santé et des distances/temps de trajet théoriques.
* Paramétrage des passerelles WhatsApp Business et des configurations système globales.

---

## 5. Exigences Non Fonctionnelles
* **Mode Hors-ligne (Offline-First) :** La saisie locale doit fonctionner sans internet. Les données sont stockées dans le navigateur/tablette et synchronisées en tâche de fond dès que le réseau est disponible.
* **Performance :** Temps de chargement des graphiques inférieur à 2 secondes ; synchronisation incrémentale légère.
* **Sécurité & Confidentialité :** Chiffrement des données de santé au repos et en transit. Authentification stricte avec droits basés sur les rôles (RBAC).
* **Ergonomie :** Interface sombre (Dark Mode) pour réduire la fatigue oculaire la nuit en salle de naissance. Saisie simplifiée réduisant le recours au clavier.

# Récits Utilisateurs (User Stories) - PartoCare

Ce document définit les récits utilisateurs (User Stories) décrivant les fonctionnalités clés attendues sur la plateforme PartoCare, regroupées par Epics.

---

## Epic 1 : Authentification

### US-001 : Connexion Utilisateur
* **En tant que :** Sage-Femme / Agent de santé
* **Je veux :** me connecter de manière sécurisée avec mon email et mot de passe
* **Afin de :** accéder aux dossiers des patientes et enregistrer des observations cliniques.
* **Critères d'acceptation :**
  * Accès sécurisé via un jeton d'authentification (Sanctum).
  * Redirection automatique vers le tableau de bord correspondant au rôle de l'utilisateur.
  * Blocage du compte après 5 tentatives infructueuses de connexion.

---

## Epic 2 : Gestion des Patientes

### US-002 : Enregistrement de Patiente
* **En tant que :** Sage-Femme / Infirmier
* **Je veux :** enregistrer une nouvelle patiente avec ses informations civiles et de contact d'urgence
* **Afin de :** créer son dossier obstétrique de référence.
* **Critères d'acceptation :**
  * Saisie obligatoire du numéro de dossier hospitalier (`hospital_number`), du nom, prénom, et date de naissance.
  * Possibilité de fonctionner hors-ligne et de synchroniser le dossier dès le retour du réseau.

### US-003 : Consultation d'Historique Obstetrical
* **En tant que :** Médecin / Gynécologue
* **Je veux :** consulter l'historique obstétrique complet et les antécédents d'une patiente
* **Afin de :** évaluer les risques associés à sa grossesse.
* **Critères d'acceptation :**
  * Accès rapide aux grossesses précédentes, gestité, parité, et détails des consultations prénatales (CPN).
  * Affichage en surbrillance des facteurs de risque critiques (ex: antécédents de césarienne).

---

## Epic 3 : Gestion du Travail (Partogramme)

### US-004 : Démarrage du Partogramme
* **En tant que :** Sage-Femme
* **Je veux :** démarrer une nouvelle session de travail d'accouchement et initialiser le partogramme
* **Afin de :** suivre graphiquement l'évolution clinique de la patiente.
* **Critères d'acceptation :**
  * Le partogramme ne peut démarrer que si la patiente est admise en phase active de travail (dilatation cervicale $\ge 4$ cm).
  * Enregistrement automatique de la date et heure de démarrage.

### US-005 : Saisie de la Dilatation Cervicale
* **En tant que :** Sage-Femme
* **Je veux :** saisir la dilatation cervicale en centimètres lors des examens vaginaux
* **Afin de :** surveiller la progression clinique du col de l'utérus.
* **Critères d'acceptation :**
  * Tracé automatique d'un point `X` sur le graphique de dilatation du partogramme.
  * Validation de la valeur saisie (doit être un entier compris entre 4 et 10 cm).

### US-006 : Enregistrement des Contractions
* **En tant que :** Sage-Femme
* **Je veux :** enregistrer la fréquence et la durée des contractions utérines sur 10 minutes
* **Afin de :** détecter une dystocie de contraction ou un travail anormal.
* **Critères d'acceptation :**
  * Représentation graphique sous forme de hachures correspondantes à la durée des contractions (faible, moyenne, forte).

### US-007 : Enregistrement du Rythme Cardiaque Fœtal (FCF)
* **En tant que :** Sage-Femme
* **Je veux :** enregistrer la fréquence cardiaque fœtale (en battements par minute) toutes les 30 minutes
* **Afin de :** détecter rapidement une souffrance fœtale aiguë.
* **Critères d'acceptation :**
  * Tracé d'un point sur le graphique de FCF.
  * Indication visuelle si le point se trouve hors de la bande de sécurité (110 - 160 bpm).

---

## Epic 4 : Alertes

### US-008 : Génération d'Alerte Automatique
* **En tant que :** Système
* **Je veux :** analyser les saisies cliniques et générer des alertes de couleur (Vert, Jaune, Orange, Rouge) selon les seuils
* **Afin de :** signaler instantanément les anomalies.
* **Critères d'acceptation :**
  * FCF < 110 bpm $\rightarrow$ Alerte **ROUGE** immédiate.
  * Dilatation stagnante (progression = 0) pendant 2 heures $\rightarrow$ Alerte **ORANGE**.
  * Température maternelle > 38 °C $\rightarrow$ Alerte **JAUNE**.

### US-009 : Réception de Notification Critique
* **En tant que :** Médecin / Gynécologue
* **Je veux :** recevoir immédiatement une notification (sur l'écran ou via WhatsApp) en cas d'alerte critique
* **Afin de :** intervenir ou valider le transfert sans délai.
* **Critères d'acceptation :**
  * Messages WhatsApp formatés envoyés en tâche de fond (Laravel Queue) contenant les constantes de la patiente.

---

## Epic 5 : Référence Obstétricale

### US-010 : Initiation d'une Référence
* **En tant que :** Sage-Femme / Médecin
* **Je veux :** générer une demande de transfert d'urgence et sélectionner un centre disponible
* **Afin de :** évacuer la patiente vers un établissement avec un plateau technique adapté (césarienne).
* **Critères d'acceptation :**
  * Pré-remplissage automatique des données cliniques et du partogramme dans la fiche de transfert.

### US-011 : Réception de Demande de Référence
* **En tant que :** Centre Receveur (Hôpital de district / régional)
* **Je veux :** voir les demandes d'évacuation entrantes sur mon tableau de bord
* **Afin de :** préparer le bloc ou la salle d'accouchement pour accueillir la patiente.
* **Critères d'acceptation :**
  * Alerte sonore et visuelle en temps réel (WebSockets) lors de l'arrivée d'une demande.

### US-012 : Coordination de l'Ambulance
* **En tant que :** Responsable Maternité / Chauffeur d'Ambulance
* **Je veux :** recevoir une notification de transport contenant les structures d'origine et de destination
* **Afin de :** organiser l'évacuation physique.
* **Critères d'acceptation :**
  * Envoi d'un message WhatsApp au chauffeur désigné dès l'affectation du véhicule à la référence.

---

## Epic 6 : Administration

### US-013 : Gestion des Utilisateurs
* **En tant que :** Administrateur Système
* **Je veux :** créer, modifier ou désactiver les comptes utilisateurs et leur assigner un rôle
* **Afin de :** sécuriser les accès à l'application.

### US-014 : Gestion des Établissements Sanitaires
* **En tant que :** Administrateur Système
* **Je veux :** maintenir à jour la cartographie et l'annuaire des structures de santé
* **Afin de :** garantir l'exactitude des routages de référence.

---

## Epic 7 : Reporting & Statistiques

### US-015 : Suivi des Indicateurs Cliniques
* **En tant que :** Responsable de District Sanitaire
* **Je veux :** visualiser les statistiques de mortalité, taux de transferts et césariennes de mon district
* **Afin de :** piloter la politique de santé publique locale.

### US-016 : Statistiques Nationales
* **En tant que :** Responsable du Ministère de la Santé
* **Je veux :** consulter des données d'indicateurs de santé maternelle et néonatale agrégées au niveau national
* **Afin de :** guider la stratégie nationale de réduction de la mortalité obstétricale.

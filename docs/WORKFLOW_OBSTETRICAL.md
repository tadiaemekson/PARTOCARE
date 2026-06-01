# Flux de Travail Obstétrical (Workflow) - PartoCare

Ce document décrit le parcours clinique et opérationnel d'une patiente sur la plateforme PartoCare, depuis son admission en salle de naissance jusqu'à sa sortie, ainsi que la transmission des données de reporting.

---

## Phase 1 : Admission
* **Acteur principal :** Sage-Femme
* **Étapes :**
  1. Arrivée de la patiente à la maternité.
  2. Vérification de l'identité de la patiente (ou enregistrement initial).
  3. Récupération ou création de son dossier patiente consolidé (`patients`).
  4. Vérification et association de la grossesse en cours (`pregnancies`), calcul de l'âge gestationnel et niveau de risque.
  5. Évaluation clinique initiale (tension, dilatation, pouls, FCF).
  6. Décision d'admission en salle de naissance.
* **Résultat :** Patiente officiellement admise en salle de travail.

---

## Phase 2 : Début du Travail
* **Acteur principal :** Sage-Femme
* **Étapes :**
  1. Création du dossier de travail (`labours`) indiquant l'heure d'admission et l'établissement sanitaire.
  2. Initialisation et démarrage du tracé du partogramme (`partograms`) lorsque le col atteint la phase active ($\ge 4$ cm de dilatation).
  3. Enregistrement des paramètres cliniques de base (dilatation de départ, FCF, contractions).
* **Résultat :** Travail actif et partogramme numérique démarrés.

---

## Phase 3 : Surveillance Continue
* **Acteur principal :** Sage-Femme / Système
* **Fréquences de surveillance clinique :**
  * **Toutes les 30 minutes :** Fréquence cardiaque fœtale (FCF), contractions utérines (fréquence et durée sur 10 minutes), pouls maternel.
  * **Toutes les 4 heures :** Température corporelle maternelle, tension artérielle (PAS/PAD), dilatation cervicale et descente de la présentation (toucher vaginal).
* **Rôle du Système :**
  * À chaque saisie de relevé (`partogram_entries`), l'application analyse les données saisies.
  * Tracé automatique des points et courbes du partogramme.
  * Évaluation en temps réel des règles du moteur d'alertes.
* **Résultat :** Suivi clinique en temps réel de l'accouchement.

---

## Phase 4 : Détection de Risque
* **Acteur principal :** Moteur d'Alertes / Système
* **Seuils d'analyse clinique :**
  * **Souffrance fœtale :** FCF $< 110$ bpm.
  * **Travail prolongé :** Dilatation cervicale stagnante (progression = 0 cm) pendant 2 heures ou plus.
  * **Infection amniotique :** Température maternelle $> 38$ °C.
  * **HTA / Pré-éclampsie :** Tension artérielle $\ge 140/90$ mmHg.
* **Actions en cas d'anomalie :**
  1. Création d'une alerte (`alerts`) avec le niveau de gravité correspondant (Vert, Jaune, Orange, Rouge).
  2. Notification immédiate du personnel soignant (médecin, gynécologue) via WebSockets (écran) et WhatsApp.
  3. Recommandation clinique d'intervention ou d'évacuation précoce.
* **Résultat :** Alerte active visible et équipe médicale notifiée.

---

## Phase 5 : Référence Obstétricale
* **Acteur principal :** Sage-Femme / Médecin / Centre Receveur
* **Étapes :**
  1. Déclenchement manuel ou suggéré du processus de référence (`referrals`) en raison d'une complication obstétricale.
  2. Génération automatique de la fiche de référence pré-remplie avec le tracé du partogramme.
  3. Recherche d'un établissement receveur adéquat dans l'annuaire des structures de santé.
  4. Notification instantanée de l'hôpital récepteur par WebSockets.
  5. Notification automatique par WhatsApp du service d'ambulances et du chauffeur de garde.
  6. Confirmation de disponibilité et acceptation numérique du transfert par le médecin récepteur.
* **Résultat :** Demande de référence validée et équipe de transport prête.

---

## Phase 6 : Transport (Évacuation)
* **Acteur principal :** Chauffeur d'Ambulance / Sage-Femme accompagnante
* **Étapes :**
  1. Installation de la patiente et départ de l'ambulance (enregistrement automatique de l'heure de départ).
  2. Suivi de l'avancement du transfert obstétrical (statut passe à `IN_TRANSIT`).
  3. Arrivée à l'hôpital d'accueil (enregistrement automatique de l'heure d'arrivée, statut passe à `ARRIVED`).
* **Résultat :** Patiente transférée et admise en toute sécurité dans l'établissement de référence.

---

## Phase 7 : Accouchement (Issue)
* **Acteur principal :** Gynécologue / Médecin / Sage-Femme
* **Étapes :**
  1. Prise en charge de la patiente à l'arrivée (accouchement vaginal normal, accouchement assisté par ventouse/forceps ou césarienne d'urgence).
  2. Enregistrement des données de l'accouchement (`outcome`) :
    * Heure précise de naissance.
    * Sexe du nouveau-né.
    * Poids à la naissance (grammes).
    * Score APGAR (à 1 et 5 minutes).
    * État de santé de la mère (stable, complication majeure, décès).
* **Résultat :** Accouchement documenté et clôture de la session de travail.

---

## Phase 8 : Post-Partum
* **Acteur principal :** Sage-Femme / Infirmier
* **Étapes :**
  1. Surveillance post-partum en salle de réveil ou de suites de couches (durée de 24 à 48 heures).
  2. Surveillance régulière des risques d'hémorragie de la délivrance, de la température et de la tension maternelle.
  3. Accompagnement à l'allaitement précoce.
* **Résultat :** Patiente et nouveau-né cliniquement stables.

---

## Phase 9 : Sortie (Décharge)
* **Acteur principal :** Médecin / Gynécologue
* **Étapes :**
  1. Examen clinique final et validation médicale de la sortie.
  2. Génération du rapport médical de sortie.
  3. Archivage électronique du dossier patiente.
  4. Planification des visites de suivi post-natal.
* **Résultat :** Session de travail clôturée avec succès et dossier archivé.

---

## Phase 10 : Reporting National
* **Acteur principal :** Responsable District / Ministère
* **Étapes :**
  1. Agrégation automatique en temps réel des indicateurs clés (accouchements, césariennes, taux de transferts, décès maternels/néonataux, complications).
  2. Génération des rapports statistiques mensuels au niveau du centre de santé, du district de santé, de la délégation régionale, et du Ministère.
* **Résultat :** Tableaux de bord décisionnels nationaux mis à jour.

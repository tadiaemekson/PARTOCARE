# Moteur d'Alertes Cliniques - PartoCare

Le moteur d'alertes de PartoCare est un système de règles clinique qui s'exécute à chaque fois qu'une nouvelle saisie clinique (`partogram_entries`) est enregistrée pour un partogramme actif.

## 1. Algorithme Général d'Évaluation

Lorsqu'une saisie clinique $E_{n}$ (contenant l'heure clinique $t_{n}$, la dilatation $d_{n}$, le rythme fœtal $f_{n}$, etc.) est enregistrée dans la table `partogram_entries` :

1. **Extraction de l'historique :** Récupération de la saisie précédente $E_{n-1}$ et des relevés des 2 dernières heures associés au partogramme.
2. **Exécution des Règles d'Évaluation :**
   * R1 : Fréquence Cardiaque Fœtale (FCF).
   * R2 : Température Maternelle.
   * R3 : Tension Artérielle.
   * R4 : Progression de la Dilatation.
3. **Enregistrement et Notification :**
   * Enregistrement des alertes générées dans la table `alerts` en reliant l'alerte au `partogram_id` et à la saisie `partogram_entry_id`.
   * Envoi de notifications en temps réel (WebSockets et WhatsApp Business API via le système de file d'attente).

---

## 2. Spécification Technique des Règles

### R1 : Fréquence Cardiaque Fœtale (FCF)
* **Entrée :** `fetal_heart_rate` (bpm).
* **Règle :**
  * Si $FCF < 110$ ou $FCF > 160$ $\rightarrow$ **Alerte Rouge** : *"Rythme cardiaque fœtal anormal (<110 ou >160 bpm). Risque de souffrance fœtale."*
  * Sinon $\rightarrow$ **Statut Normal (Vert)**.

### R2 : Température Maternelle
* **Entrée :** `temperature` (°C).
* **Règle :**
  * Si $Temp > 38.0$ $\rightarrow$ **Alerte Orange** : *"Température maternelle élevée (>38°C). Infection suspectée."*
  * Sinon $\rightarrow$ **Statut Normal (Vert)**.

### R3 : Tension Artérielle Maternelle
* **Entrées :** `systolic_bp` (mmHg), `diastolic_bp` (mmHg).
* **Règle :**
  * Si $PAS \ge 140$ ou $PAD \ge 90$ $\rightarrow$ **Alerte Orange** : *"Tension artérielle élevée (140/90 mmHg ou plus). Risque cardiovasculaire ou de pré-éclampsie."*
  * Sinon $\rightarrow$ **Statut Normal (Vert)**.

### R4 : Progression de la Dilatation Cervicale (Stagnation)
* **Entrées :** Dilatation cervicale actuelle $d_n$ à l'instant $t_n$, et dilatation précédente $d_{précédente}$ à l'instant $t_{précédent}$ (avec $t_n - t_{précédent} \ge 2$ heures).
* **Règle :**
  * Si la dilatation n'a pas progressé ($d_n \le d_{précédente}$) sur une période de **2 heures ou plus** $\rightarrow$ **Alerte Rouge** : *"Absence de progression de la dilatation cervicale depuis 2 heures. Risque de dystocie de démarrage ou d'obstacle mécanique."*
  * Si la vitesse de progression moyenne depuis le début du partogramme ($start\_time$) est inférieure à $1$ cm/heure $\rightarrow$ **Alerte Jaune** : *"Progression de la dilatation lente (inférieure à 1 cm/heure)."*
  * Sinon $\rightarrow$ **Statut Normal (Vert)**.

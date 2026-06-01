# Spécifications de l'API REST v1 - PartoCare

Toutes les routes de l'API sont préfixées par `/api/v1/` et retournent des données au format JSON.
* **En-têtes obligatoires :**
  * `Accept: application/json`
  * `Content-Type: application/json`
  * `Authorization: Bearer <token>` (sauf routes d'authentification).

---

## 1. Module Authentification

### 1.1. Connexion de l'Utilisateur
* **URL :** `/api/v1/auth/login`
* **Méthode :** `POST`
* **Requête :**
```json
{
  "email": "sagefemme.ndiki@sante.cm",
  "password": "MotDePasseSecurise123"
}
```
* **Réponse (200 OK) :**
```json
{
  "token": "1|abc123xyz456...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "Marie",
    "last_name": "Ngo",
    "email": "sagefemme.ndiki@sante.cm",
    "role": {
      "id": "r0r0r0r0-r0r0-r0r0-r0r0-r0r0r0r0r0r0",
      "name": "MIDWIFE"
    },
    "facility": {
      "id": "d3b07384-d113-4465-9856-111122223333",
      "name": "CMA de Ndiki",
      "type": "CMA"
    }
  }
}
```

---

## 2. Module Gestion des Patientes & Grossesses

### 2.1. Créer une nouvelle patiente
* **URL :** `/api/v1/patients`
* **Méthode :** `POST`
* **Requête :**
```json
{
  "hospital_number": "PT-2026-9876",
  "first_name": "Florence",
  "last_name": "Ebanda",
  "date_of_birth": "1998-05-15",
  "phone": "+237677123456",
  "address": "Quartier 2, Ndiki",
  "blood_group": "O+",
  "emergency_contact": "Jean Ebanda (+237699876543)"
}
```
* **Réponse (201 Created) :**
```json
{
  "id": "a9f8b7c6-d5e4-4321-b0a9-876543210123",
  "hospital_number": "PT-2026-9876",
  "first_name": "Florence",
  "last_name": "Ebanda",
  "date_of_birth": "1998-05-15",
  "phone": "+237677123456",
  "blood_group": "O+"
}
```

### 2.2. Enregistrer une grossesse pour une patiente
* **URL :** `/api/v1/patients/{patient_id}/pregnancies`
* **Méthode :** `POST`
* **Requête :**
```json
{
  "gravidity": 3,
  "parity": 2,
  "estimated_delivery_date": "2026-06-01",
  "gestational_age": 39,
  "risk_level": "MEDIUM"
}
```
* **Réponse (201 Created) :**
```json
{
  "id": "e3e3e3e3-aaaa-bbbb-cccc-dddddddddddd",
  "patient_id": "a9f8b7c6-d5e4-4321-b0a9-876543210123",
  "gravidity": 3,
  "parity": 2,
  "estimated_delivery_date": "2026-06-01",
  "gestational_age": 39,
  "risk_level": "MEDIUM"
}
```

---

## 3. Module Gestion du Travail (Labours)

### 3.1. Démarrer une session de travail d'accouchement (Admission)
* **URL :** `/api/v1/labours`
* **Méthode :** `POST`
* **Requête :**
```json
{
  "pregnancy_id": "e3e3e3e3-aaaa-bbbb-cccc-dddddddddddd",
  "facility_id": "d3b07384-d113-4465-9856-111122223333",
  "admission_datetime": "2026-06-01 00:30:00"
}
```
* **Réponse (201 Created) :**
Crée automatiquement l'enregistrement associé dans la table `partograms`.
```json
{
  "id": "f8e7d6c5-b4a3-2109-8765-432109876543",
  "pregnancy_id": "e3e3e3e3-aaaa-bbbb-cccc-dddddddddddd",
  "facility_id": "d3b07384-d113-4465-9856-111122223333",
  "admission_datetime": "2026-06-01 00:30:00",
  "labour_status": "ACTIVE",
  "partogram": {
    "id": "9f9f9f9f-8b8b-7c7c-6d6d-5e5e5e5e5e5e",
    "started_at": "2026-06-01 00:30:00"
  }
}
```

---

## 4. Module Partogramme (Partogram Entries & Graph)

### 4.1. Enregistrer une observation clinique (Partogram Entry)
* **URL :** `/api/v1/partograms/{partogram_id}/entries`
* **Méthode :** `POST`
* **Requête :**
```json
{
  "observation_time": "2026-06-01 02:30:00",
  "cervical_dilation": 5,
  "fetal_heart_rate": 140,
  "contractions": 3,
  "maternal_temperature": 37.2,
  "maternal_pulse": 82,
  "blood_pressure": "120/80",
  "fetal_station": "3/5",
  "membrane_status": "INTACT",
  "amniotic_fluid_status": "CLEAR"
}
```
* **Réponse (201 Created) :**
Retourne la saisie et les alertes potentielles (ex: stagnation si dilatation stagnante pendant 2 heures).
```json
{
  "entry": {
    "id": "77a8b9c0-d1e2-3f4g-5h6i-7j8k9l0m1n2o",
    "partogram_id": "9f9f9f9f-8b8b-7c7c-6d6d-5e5e5e5e5e5e",
    "observation_time": "2026-06-01 02:30:00",
    "cervical_dilation": 5,
    "fetal_heart_rate": 140
  },
  "triggered_alerts": []
}
```

### 4.2. Obtenir le partogramme complet
* **URL :** `/api/v1/partograms/{partogram_id}`
* **Méthode :** `GET`
* **Réponse (200 OK) :**
```json
{
  "id": "9f9f9f9f-8b8b-7c7c-6d6d-5e5e5e5e5e5e",
  "labour_id": "f8e7d6c5-b4a3-2109-8765-432109876543",
  "started_at": "2026-06-01 00:30:00",
  "completed_at": null,
  "entries": [
    {
      "id": "77a8b9c0-d1e2-3f4g-5h6i-7j8k9l0m1n2o",
      "observation_time": "2026-06-01 02:30:00",
      "cervical_dilation": 5,
      "fetal_heart_rate": 140,
      "contractions": 3,
      "maternal_temperature": 37.2,
      "maternal_pulse": 82,
      "blood_pressure": "120/80",
      "fetal_station": "3/5",
      "membrane_status": "INTACT",
      "amniotic_fluid_status": "CLEAR"
    }
  ]
}
```

---

## 5. Module Références & Ambulances

### 5.1. Initier une référence
* **URL :** `/api/v1/referrals`
* **Méthode :** `POST`
* **Requête :**
```json
{
  "labour_id": "f8e7d6c5-b4a3-2109-8765-432109876543",
  "source_facility_id": "d3b07384-d113-4465-9856-111122223333",
  "destination_facility_id": "e44d7384-e113-4465-9856-444455556666",
  "referral_reason": "Rythme Cardiaque Fœtal à 95 bpm (souffrance fœtale ROUGE)."
}
```
* **Réponse (201 Created) :**
```json
{
  "id": "bbbb8888-cccc-4444-dddd-111122223333",
  "labour_id": "f8e7d6c5-b4a3-2109-8765-432109876543",
  "source_facility_id": "d3b07384-d113-4465-9856-111122223333",
  "destination_facility_id": "e44d7384-e113-4465-9856-444455556666",
  "referral_reason": "Rythme Cardiaque Fœtal à 95 bpm...",
  "referral_status": "PENDING"
}
```

### 5.2. Affecter une ambulance à une référence
* **URL :** `/api/v1/referrals/{id}/assign-ambulance`
* **Méthode :** `POST`
* **Requête :**
```json
{
  "ambulance_id": "e5e5e5e5-f5f5-4f4f-8f8f-9f9f9f9f9f9f"
}
```
* **Réponse (200 OK) :**
```json
{
  "referral_id": "bbbb8888-cccc-4444-dddd-111122223333",
  "referral_status": "IN_TRANSIT",
  "assigned_ambulance": {
    "id": "e5e5e5e5-f5f5-4f4f-8f8f-9f9f9f9f9f9f",
    "registration_number": "LT-889-OA",
    "driver_name": "Samuel Eto'o",
    "driver_phone": "+237699999999"
  }
}
```

---

## 6. Module Tableau de Bord & Statistiques

### 6.1. Statistiques Globales et Liste de Maternité
* **URL :** `/api/v1/dashboard/stats`
* **Méthode :** `GET`
* **Réponse (200 OK) :**
```json
{
  "summary": {
    "active_labours_count": 8,
    "critical_cases_count": 2,
    "pending_referrals_count": 1,
    "deliveries_today_count": 5
  },
  "active_labours": [
    {
      "labour_id": "f8e7d6c5-b4a3-2109-8765-432109876543",
      "patient_name": "Florence Ebanda",
      "admission_datetime": "2026-06-01 00:30:00",
      "latest_dilation": 5,
      "alert_level": "RED",
      "last_entry_at": "2026-06-01 02:30:00"
    }
  ]
}
```

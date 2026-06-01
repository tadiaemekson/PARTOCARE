# Directives de Sécurité et Confidentialité des Données - PartoCare

Les données obstétriques et médicales des patientes sont extrêmement sensibles. PartoCare intègre des mesures de protection strictes pour se conformer aux standards internationaux (RGPD, HIPAA) et aux réglementations locales sur les données de santé.

## 1. Authentification & Gestion des Accès (RBAC)

* **Authentification Forte :** L'accès à la plateforme requiert un identifiant unique (email) et un mot de passe complexe (haché avec l'algorithme `bcrypt` côté backend).
* **Maintien de Session :** Utilisation de jetons d'API sécurisés (**Laravel Sanctum**) avec expiration automatique après 12 heures d'inactivité.
* **Contrôle d'Accès Basé sur les Rôles (RBAC) :**
  * **Midwife (Sage-femme / Infirmier) :** Saisie des observations cliniques, consultation du partogramme, création de fiches de référence.
  * **Doctor (Médecin / Gynécologue) :** Consultation des partogrammes, validation des alertes, gestion et acceptation des transferts.
  * **Director (Chef de District / Délégation) :** Accès en lecture seule aux tableaux de bord statistiques agrégés (sans accès aux noms individuels des patientes).
  * **Admin (Administrateur système) :** Gestion des comptes utilisateurs, configuration des structures de santé (centres de référence). N'a aucun accès aux données médicales nominatives des patientes (anonymisation).

---

## 2. Protection des Données (Chiffrement)

### 2.1. Données en Transit
* Toutes les communications entre le client (tablette, mobile, PC) et le serveur API s'effectuent obligatoirement via le protocole **HTTPS** utilisant TLS 1.3.
* Les requêtes HTTP non sécurisées (port 80) sont automatiquement redirigées vers le port sécurisé (443).

### 2.2. Données au Repos
* **Base de données Centrale :** Les colonnes identifiant directement les patientes (nom, numéro de CNI, numéro de téléphone) dans PostgreSQL sont chiffrées en utilisant le chiffrement AES-256 au niveau applicatif avant insertion, ou via le chiffrement transparent de la base de données (Transparent Data Encryption - TDE).
* **Stockage Local (IndexedDB) :** Le stockage hors-ligne local de la tablette est chiffré. Les données stockées dans IndexedDB sont cryptées à la volée avec une clé dérivée du mot de passe de l'utilisateur connecté ou d'un secret d'appareil unique, empêchant la lecture directe des dossiers en cas de vol de l'appareil.

---

## 3. Journalisation & Piste d'Audit (Audit Trail)

Chaque action sur la plateforme fait l'objet d'un enregistrement non modifiable dans une table de journalisation (`audit_logs`) :
* **Informations enregistrées :** ID utilisateur, horodatage, adresse IP, type d'action (`CREATE_PATIENT`, `VIEW_PARTOGRAM`, `ADD_OBSERVATION`, `DOWNLOAD_REFERRAL`), ID de la ressource concernée, et les modifications apportées (ancienne/nouvelle valeur).
* **Sécurité des logs :** Les logs d'audit ne peuvent être ni modifiés ni supprimés par les utilisateurs (y compris les administrateurs) et sont archivés périodiquement sur un stockage sécurisé en lecture seule.

---

## 4. Conformité & Anonymisation

* **Minimisation des données :** Seules les données strictement nécessaires au suivi clinique et à l'aide à la décision du travail d'accouchement sont collectées.
* **Anonymisation pour l'analyse :** Pour la recherche ou les statistiques de santé publique (district, région), les données de partogramme sont exportées après avoir été totalement purgées de leurs données identifiantes (Noms, CNI, numéros de téléphone remplacés par des identifiants aléatoires non réversibles).
* **Consentement :** Un volet de recueil de consentement de la patiente ou de son accompagnateur est prévu lors de la création du dossier médical numérique.

# Guide de Déploiement et Configuration de l'Environnement - PartoCare

Ce document fournit les instructions nécessaires pour installer le projet en environnement de développement local et pour le déployer en production.

---

## 1. Prérequis Système (Développement Local)

Pour exécuter PartoCare sur votre machine locale (Windows), assurez-vous d'avoir installé :
* **Node.js :** Version 18 ou supérieure (v24.15.0 disponible et validée sur votre système).
* **PHP :** Version 8.2 ou supérieure (v8.0.30 disponible via WampServer, mais le déploiement de Laravel 12 se fera via le conteneur Docker avec PHP 8.2+).
* **Composer :** Version 2.0 ou supérieure (v2.9.5 disponible).
* **Base de Données :** MySQL 8 (ou SQLite pour un développement sans serveur de base de données).

---

## 2. Configuration & Lancement Local

Le projet est divisé en deux parties : le `backend` (API Laravel) et le `frontend` (Application React).

### 2.1. Lancement du Backend (API Laravel)
1. Ouvrez un terminal dans le répertoire `backend/`.
2. Installez les dépendances PHP :
   ```bash
   composer install
   ```
3. Copiez le fichier d'environnement et configurez vos variables (connexion de base de données, etc.) :
   ```bash
   cp .env.example .env
   ```
4. Générez la clé de l'application :
   ```bash
   php artisan key:generate
   ```
5. Configurez la base de données dans `.env` :
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=partocare
   DB_USERNAME=root
   DB_PASSWORD=votre_mot_de_passe
   ```
   *(Note : Pour utiliser SQLite en local, modifiez `DB_CONNECTION=sqlite` et commentez les autres lignes de base de données).*
6. Exécutez les migrations de base de données et peuplez les tables initiales (maternités partenaires, comptes de test) :
   ```bash
   php artisan migrate --seed
   ```
7. Lancez le serveur de développement :
   ```bash
   php artisan serve
   ```
   Le backend sera accessible sur `http://127.0.0.1:8000`.

### 2.2. Lancement du Frontend (React + Vite)
1. Ouvrez un terminal dans le répertoire `frontend/`.
2. Installez les dépendances JavaScript :
   ```bash
   npm install
   ```
3. Configurez l'adresse de l'API dans un fichier d'environnement `.env` :
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```
4. Démarrez le serveur de développement local :
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:5173`.

---

## 3. Déploiement par Docker (Recommandé)

Pour déployer l'intégralité de la plateforme avec une seule commande, nous fournissons un fichier de configuration Docker Compose à la racine du projet.

### Fichier `docker-compose.yml` (Exemple de structure)
Le fichier configure 3 conteneurs :
1. **db :** MySQL 8 pour stocker les données cliniques.
2. **backend :** Serveur PHP-FPM avec Nginx exécutant l'API sous Laravel 12.
3. **frontend :** Serveur Nginx servant les fichiers React statiques compilés avec TailwindCSS.

#### Commande de lancement Docker :
```bash
docker-compose up -d --build
```
Cette commande installe les conteneurs en arrière-plan, effectue le routage réseau interne et expose le frontend sur le port `80` (ou `443` avec SSL) et l'API sur le port `8080`.

---

## 4. Déploiement en Production (Ubuntu Server + Nginx)

### 4.1. Sécurisation SSL (HTTPS)
Pour la production sur Ubuntu Server, le trafic doit être crypté avec un certificat SSL Let's Encrypt géré via Nginx ou Certbot.

### 4.2. Configuration des Files d'Attente (Laravel Queue)
Le moteur d'alertes et l'envoi de messages WhatsApp Business s'exécutent de manière asynchrone pour ne pas ralentir la saisie clinique des utilisateurs. Il est nécessaire de configurer un gestionnaire de files d'attente (comme `redis` ou `database` via la commande queue de Laravel) et d'exécuter le worker :
```bash
php artisan queue:work --daemon
```
Sous Ubuntu Server, ce processus doit être supervisé par `Supervisor` pour être automatiquement redémarré en cas de redémarrage système ou de crash.

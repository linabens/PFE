# BrewLuna Backend - Coffee Shop Management

Système d'authentification et de gestion pour les administrateurs et le personnel de Coffee Time.

## Fonctionnalités
- Authentification JWT (Access & Refresh tokens)
- Gestion des sessions et réinitialisation de mot de passe
- Génération automatique d'ID employé (`CT-YYYY-XXXX`)
- Initialisation automatique de la base de données
- Contrôle d'accès basé sur les rôles (RBAC)

## Prérequis
- Node.js 18+
- PostgreSQL 14+

## Installation

1. Accéder au dossier backend:
```bash
cd backend
```

2. Installer les dépendances:
```bash
npm install
```

3. Configurer l'environnement:
Copier `.env.example` vers `.env` et remplir vos identifiants PostgreSQL.
```bash
cp .env.example .env
```

## Configuration de la base de données

Initialiser ou réinitialiser la base de données avec le script fourni:
```bash
npm run db:init
```
Ceci créera les tables nécessaires et ajoutera un administrateur par défaut:
- **Email**: `admin@coffeetime.com`
- **Password**: `Admin123!`

## Lancement du serveur

En mode développement avec rechargement automatique:
```bash
npm run dev
```

En mode production:
```bash
npm start
```

## Documentation API (Points d'entrée)

### Authentification (`/api/auth`)
- `POST /register`: Inscription d'un nouvel employé
- `POST /login`: Connexion et obtention des tokens
- `POST /refresh-token`: Obtenir un nouvel access token
- `POST /logout`: Se déconnecter
- `GET /me`: Obtenir les détails de l'utilisateur actuel (Protégé)

### Dashboard (`/api/dashboard`)
- `GET /admin/stats`: Statistiques globales (Admin seulement)
- `GET /staff/summary`: Résumé de la journée (Staff seulement)

## Structure du Projet
- `src/config`: Configurations (Base de données)
- `src/controllers`: Logique métier des points d'entrée
- `src/database`: Scripts SQL et d'initialisation
- `src/middleware`: Authentification, Rôles et Validations
- `src/routes`: Définitions des routes API
- `src/utils`: Fonctions utilitaires (JWT, Password, etc.)

## Sécurité
- Hachage des mots de passe avec Bcrypt (12 rounds)
- Protection contre l'injection SQL via des requêtes paramétrées
- En-têtes de sécurité avec Helmet
- CORS configuré pour le frontend

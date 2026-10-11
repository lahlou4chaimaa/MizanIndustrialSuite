# Mizan — Backend (Semaine 2)

API REST du projet Mizan (Marsa Maroc) : gestion des camions, chauffeurs et pesées.

## Prérequis

- Node.js 18+ installé
- PostgreSQL installé et lancé (localement ou via un service comme Neon/Supabase/ElephantSQL si tu ne veux pas l'installer en local)

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Créer la base de données PostgreSQL
createdb mizan
# (ou via psql : CREATE DATABASE mizan;)

# 3. Charger le schéma
psql -U postgres -d mizan -f schema.sql

# 4. Configurer les variables d'environnement
cp .env.example .env
# puis édite .env avec tes identifiants PostgreSQL et un JWT_SECRET

# 5. Lancer le serveur
npm start
# ou en mode développement (redémarrage auto) :
npm run dev
```

Le serveur démarre sur `http://localhost:3000`. Teste avec :
```bash
curl http://localhost:3000/health
```

## Créer ton premier compte utilisateur

Comme la base est vide au départ, crée un premier compte administrateur directement via l'API :

```bash
curl -X POST http://localhost:3000/api/auth/comptes \
  -H "Content-Type: application/json" \
  -d '{"login": "admin", "mot_de_passe": "motdepasse123", "role": "administrateur"}'
```

Puis connecte-toi pour récupérer ton token :

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "admin", "mot_de_passe": "motdepasse123"}'
```

Utilise le `token` retourné dans le header `Authorization: Bearer <token>` pour toutes les autres routes.

## Endpoints disponibles

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion, retourne un token JWT |
| POST | `/api/auth/comptes` | Créer un compte utilisateur |
| GET | `/api/camions` | Liste des camions |
| POST | `/api/camions` | Créer un camion |
| GET | `/api/camions/:id/historique` | Historique des pesées d'un camion |
| GET | `/api/chauffeurs` | Liste des chauffeurs |
| POST | `/api/chauffeurs` | Créer un chauffeur (génère un QR code) |
| POST | `/api/chauffeurs/:id/debloquer` | Débloquer un chauffeur suspendu |
| GET | `/api/pesees` | Liste des pesées (filtres: camion_id, chauffeur_id, statut) |
| POST | `/api/pesees/entree` | Enregistrer l'entrée d'un camion (tare) |
| PUT | `/api/pesees/:id/sortie` | Enregistrer la sortie (poids brut, calcul auto du net) |

## Ce qui est prévu pour la suite

- **Semaine 3** : les champs `camion_id` et `chauffeur_id` de `/api/pesees/entree` seront déduits automatiquement par l'OCR (plaque) et la reconnaissance faciale, au lieu d'être passés manuellement. Voir les `TODO` dans `controllers/peseeController.js`.
- **Semaine 4** : le `score_risque` (actuellement fixé à 0) sera calculé par un vrai service de scoring. Voir le `TODO` dans `enregistrerSortie`.

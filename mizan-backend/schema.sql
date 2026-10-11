-- ============================================================
-- Schéma de base de données - Projet Mizan (Marsa Maroc)
-- ============================================================

CREATE TYPE statut_conformite AS ENUM ('conforme', 'anomalie', 'a_verifier');
CREATE TYPE type_alerte AS ENUM ('poids_hors_seuil', 'identite_non_verifiee', 'blocage_chauffeur', 'temps_anormal');
CREATE TYPE statut_alerte AS ENUM ('ouverte', 'traitee', 'ignoree');
CREATE TYPE role_utilisateur AS ENUM ('agent_pesee', 'agent_portuaire', 'superviseur', 'administrateur');

-- Camions
CREATE TABLE camion (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(20) UNIQUE NOT NULL,
    type_camion VARCHAR(50),
    capacite_max NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chauffeurs
CREATE TABLE chauffeur (
    id SERIAL PRIMARY KEY,
    cin VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    photo_reference_url TEXT,
    statut_blocage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Marchandises
CREATE TABLE marchandise (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    poids_min NUMERIC(10,2),
    poids_max NUMERIC(10,2)
);

-- Clients
CREATE TABLE client (
    id SERIAL PRIMARY KEY,
    raison_sociale VARCHAR(150) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20)
);

-- Agents
CREATE TABLE agent (
    id SERIAL PRIMARY KEY,
    matricule_agent VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    role role_utilisateur NOT NULL
);

-- Utilisateurs (comptes de connexion, liés à un agent)
CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agent(id) ON DELETE CASCADE,
    login VARCHAR(50) UNIQUE NOT NULL,
    mot_de_passe_hash TEXT NOT NULL,
    role role_utilisateur NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pesées
CREATE TABLE pesee (
    id SERIAL PRIMARY KEY,
    camion_id INTEGER NOT NULL REFERENCES camion(id),
    chauffeur_id INTEGER NOT NULL REFERENCES chauffeur(id),
    marchandise_id INTEGER REFERENCES marchandise(id),
    date_heure_entree TIMESTAMP,
    date_heure_sortie TIMESTAMP,
    poids_tare NUMERIC(10,2),
    poids_brut NUMERIC(10,2),
    poids_net NUMERIC(10,2),
    statut_conformite statut_conformite DEFAULT 'a_verifier',
    identite_verifiee BOOLEAN DEFAULT FALSE,
    score_similarite_faciale NUMERIC(5,2),
    score_risque NUMERIC(5,2) DEFAULT 0,
    bon_pesee_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Alertes
CREATE TABLE alerte (
    id SERIAL PRIMARY KEY,
    pesee_id INTEGER REFERENCES pesee(id) ON DELETE CASCADE,
    type type_alerte NOT NULL,
    date_creation TIMESTAMP DEFAULT NOW(),
    statut statut_alerte DEFAULT 'ouverte',
    description TEXT
);

-- Livraisons maritimes
CREATE TABLE livraison (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES client(id),
    marchandise_id INTEGER REFERENCES marchandise(id),
    agent_id INTEGER REFERENCES agent(id),
    date_livraison DATE,
    quantite NUMERIC(10,2),
    nom_bateau VARCHAR(100),
    montant_facture NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index utiles
CREATE INDEX idx_pesee_camion ON pesee(camion_id);
CREATE INDEX idx_pesee_chauffeur ON pesee(chauffeur_id);
CREATE INDEX idx_pesee_date ON pesee(date_heure_entree);
CREATE INDEX idx_alerte_statut ON alerte(statut);

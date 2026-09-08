-- =====================================================================
-- RESTO QR PRO — Schéma de base de données MySQL
-- =====================================================================
-- Ce script crée l'intégralité des tables nécessaires au fonctionnement
-- de la plateforme : restaurants, utilisateurs, rôles, tables, QR codes,
-- menu (catégories/produits), commandes, notifications, réservations
-- et paiements.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS resto_qr_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE resto_qr_pro;

-- ---------------------------------------------------------------------
-- 1. RESTAURANTS
-- Chaque instance du SaaS peut héberger plusieurs restaurants (multi-tenant)
-- ---------------------------------------------------------------------
CREATE TABLE restaurants (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(150)  NOT NULL,
    adresse         VARCHAR(255)  NULL,
    telephone       VARCHAR(30)   NULL,
    email           VARCHAR(150)  NULL,
    logo_url        VARCHAR(255)  NULL,
    couleur_primaire VARCHAR(7)   DEFAULT '#ff2e88',
    devise          VARCHAR(10)   DEFAULT 'XAF',
    actif           BOOLEAN       DEFAULT TRUE,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. ROLES
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nom         ENUM('admin', 'gerant', 'serveur', 'cuisinier') NOT NULL UNIQUE,
    description VARCHAR(255) NULL
) ENGINE=InnoDB;

INSERT INTO roles (nom, description) VALUES
    ('admin',     'Administrateur : accès complet au système'),
    ('gerant',    'Gérant : ventes, statistiques, commandes, tables'),
    ('serveur',   'Serveur : suivi et service des commandes'),
    ('cuisinier', 'Cuisinier : préparation des commandes');

-- ---------------------------------------------------------------------
-- 3. USERS (personnel du restaurant — le client final n'a pas de compte)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT NOT NULL,
    role_id         INT NOT NULL,
    nom_complet     VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255) NOT NULL,
    telephone       VARCHAR(30)  NULL,
    actif           BOOLEAN DEFAULT TRUE,
    reset_token     VARCHAR(255) NULL,
    reset_token_exp DATETIME NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. RESTAURANT_TABLES (tables physiques du restaurant)
-- ---------------------------------------------------------------------
CREATE TABLE restaurant_tables (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT NOT NULL,
    numero          VARCHAR(20) NOT NULL,
    capacite        INT DEFAULT 4,
    statut          ENUM('libre','occupee','reservee','hors_service') DEFAULT 'libre',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_table_restaurant (restaurant_id, numero)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. QR_CODES (un QR code unique par table, pointant vers /table/:code)
-- ---------------------------------------------------------------------
CREATE TABLE qr_codes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    table_id        INT NOT NULL UNIQUE,
    code_unique     VARCHAR(64) NOT NULL UNIQUE,
    url             VARCHAR(255) NOT NULL,
    image_url       MEDIUMTEXT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. CATEGORIES (Entrées, Plats, Desserts, Boissons, ...)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT NOT NULL,
    nom             VARCHAR(100) NOT NULL,
    ordre_affichage INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. PRODUCTS (produits du menu)
-- ---------------------------------------------------------------------
CREATE TABLE products (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT NOT NULL,
    category_id     INT NOT NULL,
    nom             VARCHAR(150) NOT NULL,
    description     TEXT NULL,
    prix            DECIMAL(10,2) NOT NULL,
    photo_url       VARCHAR(255) NULL,
    disponible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. ORDERS (commandes)
-- ---------------------------------------------------------------------
CREATE TABLE orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT NOT NULL,
    table_id        INT NOT NULL,
    statut          ENUM('en_attente','confirmee','en_preparation','prete','servie','annulee')
                    DEFAULT 'en_attente',
    total           DECIMAL(10,2) NOT NULL DEFAULT 0,
    note_client     VARCHAR(255) NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. ORDER_ITEMS (lignes de commande)
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    product_id      INT NOT NULL,
    quantite        INT NOT NULL DEFAULT 1,
    prix_unitaire   DECIMAL(10,2) NOT NULL,
    sous_total      DECIMAL(10,2) NOT NULL,
    remarque        VARCHAR(255) NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. NOTIFICATIONS ("Appeler un serveur", alertes cuisine, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT NOT NULL,
    table_id        INT NULL,
    type            ENUM('appel_serveur','nouvelle_commande','commande_prete','autre') NOT NULL,
    message         VARCHAR(255) NOT NULL,
    lue             BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. RESERVATIONS
-- ---------------------------------------------------------------------
CREATE TABLE reservations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT NOT NULL,
    table_id        INT NOT NULL,
    nom_client      VARCHAR(150) NOT NULL,
    telephone       VARCHAR(30) NULL,
    date_reservation DATETIME NOT NULL,
    nombre_personnes INT DEFAULT 2,
    statut          ENUM('en_attente','confirmee','annulee') DEFAULT 'en_attente',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. PAYMENTS
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    montant         DECIMAL(10,2) NOT NULL,
    methode         ENUM('especes','carte','mobile_money','autre') DEFAULT 'especes',
    statut          ENUM('en_attente','paye','echoue','rembourse') DEFAULT 'en_attente',
    reference       VARCHAR(100) NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- INDEX complémentaires pour la performance
-- ---------------------------------------------------------------------
CREATE INDEX idx_orders_statut ON orders(statut);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_products_dispo ON products(disponible);
CREATE INDEX idx_notifications_lue ON notifications(lue);

-- ---------------------------------------------------------------------
-- DONNÉES DE DÉMONSTRATION (optionnel — à retirer en production)
-- ---------------------------------------------------------------------
INSERT INTO restaurants (nom, adresse, telephone, email) VALUES
    ('Le Gourmet Doré', 'Douala, Cameroun', '+237600000000', 'contact@legourmetdore.cm');

-- Mot de passe par défaut pour tous les comptes de démo : Password123!
INSERT INTO users (restaurant_id, role_id, nom_complet, email, mot_de_passe) VALUES
    (1, 1, 'Admin Principal', 'admin@resto.com', '$2b$10$OjRlgcuU8y11GwkOT9tnuO2bbtrzmyt4t5yOxoIWHt.21WwO2lIEe'),
    (1, 2, 'Gérant Test',     'gerant@resto.com', '$2b$10$OjRlgcuU8y11GwkOT9tnuO2bbtrzmyt4t5yOxoIWHt.21WwO2lIEe'),
    (1, 3, 'Serveur Test',    'serveur@resto.com', '$2b$10$OjRlgcuU8y11GwkOT9tnuO2bbtrzmyt4t5yOxoIWHt.21WwO2lIEe'),
    (1, 4, 'Cuisinier Test',  'cuisinier@resto.com', '$2b$10$OjRlgcuU8y11GwkOT9tnuO2bbtrzmyt4t5yOxoIWHt.21WwO2lIEe');

INSERT INTO categories (restaurant_id, nom, ordre_affichage) VALUES
    (1, 'Entrées', 1), (1, 'Plats', 2), (1, 'Desserts', 3), (1, 'Boissons', 4);

INSERT INTO restaurant_tables (restaurant_id, numero, capacite) VALUES
    (1, '1', 4), (1, '2', 2), (1, '3', 6);

-- Quelques produits de démonstration, pour que le menu client ne soit pas vide au premier lancement
INSERT INTO products (restaurant_id, category_id, nom, description, prix, disponible) VALUES
    (1, 1, 'Salade César',      'Poulet grillé, parmesan, croûtons, sauce césar maison', 2500, TRUE),
    (1, 1, 'Beignets haricots', 'Beignets traditionnels servis avec bouillie',            1000, TRUE),
    (1, 2, 'Poulet DG',         'Poulet sauté aux plantains, légumes et épices',          4500, TRUE),
    (1, 2, 'Ndolé au poisson',  'Ndolé traditionnel, poisson fumé et crevettes',          4000, TRUE),
    (1, 2, 'Riz sauté aux légumes', 'Riz sauté, légumes de saison, sauce soja',           3000, TRUE),
    (1, 3, 'Salade de fruits',  'Fruits frais de saison',                                 1500, TRUE),
    (1, 3, 'Fondant au chocolat', 'Servi tiède avec une boule de glace vanille',          2000, TRUE),
    (1, 4, 'Jus de bissap',     'Jus artisanal à l\'hibiscus',                            1000, TRUE),
    (1, 4, 'Jus de gingembre',  'Jus artisanal au gingembre frais',                       1000, TRUE),
    (1, 4, 'Eau minérale',      '50 cl',                                                   500, TRUE);

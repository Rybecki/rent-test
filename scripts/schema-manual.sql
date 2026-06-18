-- Uruchom w phpMyAdmin, jeśli npm run db:migrate nie łączy się zdalnie.
-- Użytkowników aplikacji utwórz przez npm run db:migrate (MIGRATE_USERS w .env).

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS signed_documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  equipment_id VARCHAR(32) NOT NULL,
  equipment_label VARCHAR(128) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  residential_address TEXT NOT NULL,
  phone VARCHAR(32) NOT NULL,
  id_document VARCHAR(64) NOT NULL,
  pesel VARCHAR(11) NOT NULL DEFAULT '',
  package_name VARCHAR(128) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  days INT UNSIGNED NOT NULL,
  price_pln DECIMAL(10, 2) NOT NULL,
  signed_at DATETIME(3) NOT NULL,
  signature_data_url MEDIUMTEXT NOT NULL,
  filled_regulation_text MEDIUMTEXT NOT NULL,
  bike_models JSON NULL,
  equipment_count INT UNSIGNED NOT NULL DEFAULT 1,
  payment_method ENUM('cash', 'card', 'prepayment') NOT NULL,
  deposit_pln DECIMAL(10, 2) NOT NULL DEFAULT 0,
  checklist_checked_ids JSON NULL,
  checklist_completed TINYINT(1) NOT NULL DEFAULT 0,
  return_checklist_checked_ids JSON NULL,
  return_checklist_completed TINYINT(1) NOT NULL DEFAULT 0,
  created_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_signed_documents_signed_at (signed_at DESC),
  CONSTRAINT fk_signed_documents_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

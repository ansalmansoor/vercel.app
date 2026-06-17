-- =====================================================
-- SafeTClaim - MySQL Database Schema
-- Import this file in phpMyAdmin:
--   1. Open phpMyAdmin
--   2. Select your database: safetclaim
--   3. Click "Import" tab
--   4. Choose this file and click "Go"
-- =====================================================

-- Users Table
CREATE TABLE IF NOT EXISTS `safet_users` (
  `username`   VARCHAR(50)  NOT NULL,
  `password`   VARCHAR(64)  NOT NULL COMMENT 'SHA-256 hashed or plaintext on first setup',
  `role`       ENUM('super','staff') NOT NULL DEFAULT 'staff',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default accounts (change passwords via the app's Change Password feature)
INSERT IGNORE INTO `safet_users` (`username`, `password`, `role`) VALUES
  ('admin', 'admin123', 'super'),
  ('staff', 'staff123', 'staff');

-- Claims Table
CREATE TABLE IF NOT EXISTS `safet_claims` (
  `id`             VARCHAR(100) NOT NULL,
  `shipment_id`    VARCHAR(50)  DEFAULT NULL,
  `tracking_number`VARCHAR(100) DEFAULT NULL,
  `return_type`    VARCHAR(50)  DEFAULT NULL,
  `issue_type`     VARCHAR(100) DEFAULT NULL,
  `images`         LONGTEXT     DEFAULT NULL COMMENT 'JSON array of base64 image strings',
  `message`        TEXT         DEFAULT NULL,
  `status`         VARCHAR(50)  NOT NULL DEFAULT 'Pending',
  `date_added`     DATETIME     DEFAULT NULL,
  `added_by`       VARCHAR(50)  DEFAULT NULL,
  `added_by_role`  VARCHAR(50)  DEFAULT NULL,
  `history`        LONGTEXT     DEFAULT NULL COMMENT 'JSON array of status history events',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

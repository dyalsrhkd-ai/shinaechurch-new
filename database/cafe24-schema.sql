SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` CHAR(36) NOT NULL,
  `login_id` VARCHAR(64) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `active_yn` CHAR(1) NOT NULL DEFAULT 'Y',
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 1,
  `failed_login_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL,
  `last_login_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_uid` (`uid`),
  UNIQUE KEY `uq_admin_users_login_id` (`login_id`),
  KEY `idx_admin_users_active` (`active_yn`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `csrf_token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `last_seen_at` DATETIME NOT NULL,
  `ip_hash` CHAR(64) NULL,
  `user_agent_hash` CHAR(64) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_sessions_token_hash` (`token_hash`),
  KEY `idx_admin_sessions_user_expiry` (`admin_user_id`, `expires_at`),
  CONSTRAINT `fk_admin_sessions_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NULL,
  `action_key` VARCHAR(80) NOT NULL,
  `target_type` VARCHAR(50) NULL,
  `target_id` VARCHAR(100) NULL,
  `detail_json` LONGTEXT NULL,
  `ip_hash` CHAR(64) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_audit_created` (`created_at`),
  KEY `idx_admin_audit_user` (`admin_user_id`, `created_at`),
  CONSTRAINT `fk_admin_audit_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_documents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_key` VARCHAR(80) NOT NULL,
  `document_id` VARCHAR(128) NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `sort_order` BIGINT NOT NULL DEFAULT 0,
  `sort_date` DATETIME NULL,
  `version_no` INT UNSIGNED NOT NULL DEFAULT 1,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_content_document` (`collection_key`, `document_id`),
  KEY `idx_content_list` (`collection_key`, `deleted_at`, `sort_order`),
  KEY `idx_content_date` (`collection_key`, `deleted_at`, `sort_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `visitor_daily_stats` (
  `visit_date` DATE NOT NULL,
  `page_view_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `visitor_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`visit_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `visitor_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `visit_key_hash` CHAR(64) NOT NULL,
  `path` VARCHAR(500) NOT NULL,
  `referrer_host` VARCHAR(255) NULL,
  `user_agent_hash` CHAR(64) NULL,
  `visited_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_visitor_logs_time` (`visited_at`),
  KEY `idx_visitor_logs_key_time` (`visit_key_hash`, `visited_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_route_locks` (
  `route_key` VARCHAR(255) NOT NULL,
  `admin_user_id` BIGINT UNSIGNED NOT NULL,
  `lock_token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`route_key`),
  KEY `idx_admin_route_locks_expiry` (`expires_at`),
  CONSTRAINT `fk_admin_route_locks_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `live_stream_agents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `agent_key` VARCHAR(64) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `managed_keys_json` LONGTEXT NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `active_yn` CHAR(1) NOT NULL DEFAULT 'Y',
  `status_key` VARCHAR(30) NOT NULL DEFAULT 'offline',
  `status_json` LONGTEXT NULL,
  `current_video_id` VARCHAR(32) NULL,
  `last_seen_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_live_stream_agents_key` (`agent_key`),
  UNIQUE KEY `uq_live_stream_agents_token_hash` (`token_hash`),
  KEY `idx_live_stream_agents_active` (`active_yn`, `last_seen_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `live_stream_settings` (
  `setting_key` VARCHAR(80) NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `updated_by_admin_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`),
  CONSTRAINT `fk_live_settings_admin` FOREIGN KEY (`updated_by_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `live_stream_commands` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `request_key` CHAR(36) NOT NULL,
  `stream_key` VARCHAR(64) NOT NULL,
  `command_type` VARCHAR(30) NOT NULL,
  `payload_json` LONGTEXT NULL,
  `status_key` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `requested_by_admin_id` BIGINT UNSIGNED NOT NULL,
  `claimed_by_agent_key` VARCHAR(64) NULL,
  `claimed_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `result_json` LONGTEXT NULL,
  `error_message` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_live_stream_commands_request` (`request_key`),
  KEY `idx_live_commands_poll` (`stream_key`, `status_key`, `id`),
  KEY `idx_live_commands_agent` (`claimed_by_agent_key`, `status_key`),
  CONSTRAINT `fk_live_commands_agent` FOREIGN KEY (`claimed_by_agent_key`) REFERENCES `live_stream_agents` (`agent_key`) ON DELETE SET NULL,
  CONSTRAINT `fk_live_commands_admin` FOREIGN KEY (`requested_by_admin_id`) REFERENCES `admin_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

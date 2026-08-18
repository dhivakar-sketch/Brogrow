$ErrorActionPreference = 'Stop'

$DBName = 'sports_talent_assessment'
$DBUser = 'sports_app'
$DBPassword = 'sports_app_password'
$MariaRoot = 'root'
$MariaRootPassword = 'root'

$mysqlExe = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlExe) {
    $mariadbExe = Get-Command mariadb -ErrorAction SilentlyContinue
    if (-not $mariadbExe) {
        throw "Neither mysql nor mariadb is installed or available on PATH. Install MariaDB/MySQL first."
    }
    $mysqlExe = $mariadbExe
}

$mysqlCli = $mysqlExe.Source

Write-Host "Creating database and user for $DBName..."

$script = @"
CREATE DATABASE IF NOT EXISTS $DBName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DBUser'@'localhost' IDENTIFIED BY '$DBPassword';
ALTER USER '$DBUser'@'localhost' IDENTIFIED BY '$DBPassword';
GRANT ALL PRIVILEGES ON $DBName.* TO '$DBUser'@'localhost';
FLUSH PRIVILEGES;
USE $DBName;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS athlete_profiles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  athlete_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  age INT DEFAULT NULL,
  height_cm DOUBLE DEFAULT NULL,
  weight_kg DOUBLE DEFAULT NULL,
  primary_sport VARCHAR(100) DEFAULT NULL,
  secondary_sport VARCHAR(100) DEFAULT NULL,
  playing_position VARCHAR(100) DEFAULT NULL,
  skill_level VARCHAR(100) DEFAULT NULL,
  years_of_training INT DEFAULT NULL,
  coach_name VARCHAR(255) DEFAULT NULL,
  academy_name VARCHAR(255) DEFAULT NULL,
  phone_number VARCHAR(50) DEFAULT NULL,
  emergency_contact VARCHAR(50) DEFAULT NULL,
  privacy_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uk_athlete_profiles_user (user_id),
  CONSTRAINT fk_athlete_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  sport VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  score DOUBLE NOT NULL,
  weighted_score DOUBLE NOT NULL,
  assessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT DEFAULT NULL,
  benchmark_label VARCHAR(255) DEFAULT NULL,
  benchmark_score DOUBLE DEFAULT NULL,
  coach_verified BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  KEY idx_assessments_user (user_id),
  CONSTRAINT fk_assessments_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS talent_insights (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  sport VARCHAR(100) NOT NULL,
  overall_score DOUBLE NOT NULL,
  summary TEXT DEFAULT NULL,
  recommendations TEXT DEFAULT NULL,
  caution TEXT DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_talent_insights_user (user_id),
  CONSTRAINT fk_talent_insights_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (email, password, first_name, last_name, role, enabled, created_at)
VALUES (
  'priya@example.com',
  '$2b$10$bNVFn5w07.rN6egAMEq.7ebReTBeNkZmk5cnF40tReYZ0Fv5beMSO',
  'Priya',
  'Nair',
  'ATHLETE',
  TRUE,
  NOW()
)
ON DUPLICATE KEY UPDATE password = VALUES(password), first_name = VALUES(first_name), last_name = VALUES(last_name), role = VALUES(role), enabled = VALUES(enabled);

INSERT INTO athlete_profiles (
  user_id,
  athlete_name,
  date_of_birth,
  gender,
  location,
  age,
  height_cm,
  weight_kg,
  primary_sport,
  secondary_sport,
  playing_position,
  skill_level,
  years_of_training,
  coach_name,
  academy_name,
  phone_number,
  emergency_contact,
  privacy_enabled
)
VALUES (
  (SELECT id FROM users WHERE email = 'priya@example.com'),
  'Priya Nair',
  '2009-04-14',
  'Female',
  'Bengaluru',
  17,
  165,
  58,
  'Cricket',
  'Athletics',
  'All-rounder',
  'Intermediate',
  4,
  'Coach Sharma',
  'City Sports Academy',
  '+91 98765 43210',
  '+91 99887 66554',
  TRUE
)
ON DUPLICATE KEY UPDATE
  athlete_name = VALUES(athlete_name),
  date_of_birth = VALUES(date_of_birth),
  gender = VALUES(gender),
  location = VALUES(location),
  age = VALUES(age),
  height_cm = VALUES(height_cm),
  weight_kg = VALUES(weight_kg),
  primary_sport = VALUES(primary_sport),
  secondary_sport = VALUES(secondary_sport),
  playing_position = VALUES(playing_position),
  skill_level = VALUES(skill_level),
  years_of_training = VALUES(years_of_training),
  coach_name = VALUES(coach_name),
  academy_name = VALUES(academy_name),
  phone_number = VALUES(phone_number),
  emergency_contact = VALUES(emergency_contact),
  privacy_enabled = VALUES(privacy_enabled);

INSERT INTO assessments (user_id, sport, category, score, weighted_score, assessed_at, notes, benchmark_label, benchmark_score, coach_verified)
VALUES
  ((SELECT id FROM users WHERE email = 'priya@example.com'), 'Cricket', 'FITNESS', 84, 86, NOW(), 'Strong speed and court coverage with focus on explosive acceleration.', 'U-17 benchmark', 80, FALSE),
  ((SELECT id FROM users WHERE email = 'priya@example.com'), 'Athletics', 'SKILL', 78, 81, NOW(), 'Balanced movement quality; continue technical repetition.', 'Regional average', 75, FALSE),
  ((SELECT id FROM users WHERE email = 'priya@example.com'), 'Basketball', 'PERFORMANCE', 88, 89, NOW(), 'High-end athletic movement and decision speed.', 'U-18 high potential', 83, FALSE);

INSERT INTO talent_insights (user_id, sport, overall_score, summary, recommendations, caution)
VALUES (
  (SELECT id FROM users WHERE email = 'priya@example.com'),
  'Cricket',
  84.0,
  'Strong coordination and movement efficiency. Continue technical repetition with a coach-led review.',
  'Focus on footwork under pressure and decision-making drills in net sessions.',
  'This insight supports coaching decisions and does not predict future professional performance with certainty.'
);

SELECT 'DB setup complete' AS status;
"@

& $mysqlCli -u root -p$MariaRootPassword -e $script

Write-Host "Checking connectivity with the app user..."
& $mysqlCli -u $DBUser -p$DBPassword -e "USE $DBName; SELECT 'DB_CONNECTION_OK' AS status; SHOW TABLES;"

Write-Host "Script completed successfully."

CREATE DATABASE IF NOT EXISTS sports_talent_assessment
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sports_talent_assessment;

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

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coaches (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  coach_name VARCHAR(255) NOT NULL,
  specialization VARCHAR(100),
  certification VARCHAR(255),
  phone_number VARCHAR(50),
  academy_name VARCHAR(255),
  experience_years INT,
  bio TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_coaches_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS teams (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  coach_id BIGINT,
  sport VARCHAR(100),
  location VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_teams_coach (coach_id),
  CONSTRAINT fk_teams_coach FOREIGN KEY (coach_id) REFERENCES coaches (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT NOT NULL AUTO_INCREMENT,
  team_id BIGINT NOT NULL,
  athlete_id BIGINT NOT NULL,
  position VARCHAR(100),
  jersey_number INT,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_team_athlete (team_id, athlete_id),
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_athlete FOREIGN KEY (athlete_id) REFERENCES athlete_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_sessions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  coach_id BIGINT NOT NULL,
  athlete_id BIGINT NOT NULL,
  sport VARCHAR(100) NOT NULL,
  session_date DATE NOT NULL,
  session_status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sessions_coach (coach_id),
  KEY idx_sessions_athlete (athlete_id),
  CONSTRAINT fk_sessions_coach FOREIGN KEY (coach_id) REFERENCES coaches (id),
  CONSTRAINT fk_sessions_athlete FOREIGN KEY (athlete_id) REFERENCES athlete_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assessment_parameters (
  id BIGINT NOT NULL AUTO_INCREMENT,
  session_id BIGINT NOT NULL,
  parameter_key VARCHAR(100) NOT NULL,
  parameter_value DOUBLE NOT NULL,
  unit VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_params_session FOREIGN KEY (session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coach_feedback (
  id BIGINT NOT NULL AUTO_INCREMENT,
  assessment_id BIGINT NOT NULL,
  coach_id BIGINT NOT NULL,
  feedback_text TEXT NOT NULL,
  observation_type VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_feedback_assessment (assessment_id),
  KEY idx_feedback_coach (coach_id),
  CONSTRAINT fk_feedback_assessment FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_coach FOREIGN KEY (coach_id) REFERENCES coaches (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id BIGINT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  PRIMARY KEY (id),
  KEY idx_audit_user (user_id),
  KEY idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT NOT NULL AUTO_INCREMENT,
  athlete_id BIGINT NOT NULL,
  coach_id BIGINT,
  report_type VARCHAR(100) NOT NULL,
  report_data LONGTEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reports_athlete (athlete_id),
  CONSTRAINT fk_reports_athlete FOREIGN KEY (athlete_id) REFERENCES athlete_profiles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sport_definitions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT NULL,
  assessment_categories TEXT DEFAULT NULL,
  skill_categories TEXT DEFAULT NULL,
  dashboard_labels TEXT DEFAULT NULL,
  strength_signals TEXT DEFAULT NULL,
  growth_signals TEXT DEFAULT NULL,
  recommendation_templates TEXT DEFAULT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sport_definitions_slug (slug)
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

INSERT INTO sport_definitions (
  slug, name, description, assessment_categories, skill_categories, dashboard_labels,
  strength_signals, growth_signals, recommendation_templates, active
)
VALUES
  (
    'cricket',
    'Cricket',
    'Batting, bowling, fielding and movement quality in match-like conditions.',
    '["Batting","Bowling","Fielding","Fitness","Overall"]',
    '["Batting","Bowling","Fielding","Mobility","Decision making"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Explosive acceleration","Decision speed under pressure","Technical repeatability"]',
    '["Footwork under pressure","Consistency in high-intensity phases","Strike rotation and control"]',
    '["Continue technical repetition with live match-pressure drills.","Prioritise explosive acceleration and footwork quality in training blocks.","Reassess after 6–8 weeks to monitor gains in all-round match impact."]',
    TRUE
  ),
  (
    'football',
    'Football',
    'Movement economy, technical execution and game intelligence for field play.',
    '["Speed","Technique","Fitness","Decision making","Overall"]',
    '["Acceleration","Passing","Ball control","Agility","Game understanding"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Explosive acceleration","Passing precision","High-speed recovery"]',
    '["First touch quality","Decision speed in transition","Repeated sprint ability"]',
    '["Prioritise short-passing combinations and transition drills.","Build repeat sprint capacity and first-touch control under fatigue.","Re-test after 6 weeks to validate technical and tactical gains."]',
    TRUE
  ),
  (
    'basketball',
    'Basketball',
    'Explosive power, shooting efficiency and court awareness for playing speed.',
    '["Athleticism","Shooting","Movement","Decision making","Overall"]',
    '["Jumping","Shooting","Defensive reads","Ball handling","Court vision"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Vertical explosiveness","Shot consistency","Defensive anticipation"]',
    '["Transition decision speed","Close-out timing","Finishing under pressure"]',
    '["Increase explosive lower-body training and finishing drills.","Prioritise shooting repetition under fatigue and defensive pressure.","Review court-vision decisions after each training block."]',
    TRUE
  ),
  (
    'athletics',
    'Athletics',
    'Linear speed, power, and endurance qualities for track and field performance.',
    '["Speed","Power","Endurance","Reaction","Overall"]',
    '["Acceleration","Explosive power","Endurance","Reaction time","Technique"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Acceleration quality","Explosive power","Technical efficiency"]',
    '["Reaction time discipline","Speed maintenance","Power transfer"]',
    '["Maintain a technical block focused on start mechanics and rhythm.","Build conditioned power and reaction training to support race output.","Use periodic re-tests to verify speed and power development."]',
    TRUE
  ),
  (
    'volleyball',
    'Volleyball',
    'Explosive jumping, serving precision and court reaction quality.',
    '["Power","Serve","Reaction","Defence","Overall"]',
    '["Jumping","Serving","Blocking","Reaction","Court coverage"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Vertical explosiveness","Serving consistency","Court reaction timing"]',
    '["Blocking timing","Serve precision","Defensive reads"]',
    '["Continue jump training alongside serve targeting drills.","Improve blocking timing and court coverage under faster service tempos.","Use six-week blocks to track progress in jumping and reaction quality."]',
    TRUE
  ),
  (
    'tennis',
    'Tennis',
    'Speed, reaction, shot consistency and court movement for multi-directional play.',
    '["Movement","Technique","Power","Reaction","Overall"]',
    '["Footwork","Serve accuracy","Groundstroke control","Court coverage","Decision making"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Court coverage","Serve placement","Reactive recovery"]',
    '["Footwork efficiency","Shot selection under pressure","First-strike quality"]',
    '["Prioritise footwork and split-step timing to improve first-step speed.","Increase rally consistency and unforced error reduction in training blocks.","Reassess after 6 weeks to assess serve and movement gains."]',
    TRUE
  ),
  (
    'hockey',
    'Hockey',
    'Speed, ball control, stick skill and game transition quality.',
    '["Speed","Technique","Fitness","Tactical awareness","Overall"]',
    '["Stick control","Passing","Acceleration","Defensive reads","Game sense"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Stick control","Acceleration","Passing accuracy"]',
    '["Pace in transition","Defensive positioning","Reception under pressure"]',
    '["Improve first-touch control under high tempo and limited space.","Focus on concise passing patterns and acceleration into support positions.","Review defensive compactness and transition speed after each block."]',
    TRUE
  ),
  (
    'swimming',
    'Swimming',
    'Stroke efficiency, turn quality, endurance and race pace for event performance.',
    '["Technique","Endurance","Power","Starts","Overall"]',
    '["Stroke efficiency","Turn quality","Pacing","Starts","Endurance"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Stroke rhythm","Turn quality","Pacing control"]',
    '["Underwater timing","Endurance maintenance","Breathing efficiency"]',
    '["Refine stroke length and rhythm to improve energy efficiency.","Build turn speed and underwater phase control under race conditions.","Continue block-based testing to confirm endurance and pacing gains."]',
    TRUE
  ),
  (
    'rugby',
    'Rugby',
    'Power, contact readiness, speed and game intelligence for explosive play phases.',
    '["Power","Speed","Contact","Tactical awareness","Overall"]',
    '["Contact readiness","Acceleration","Passing","Defensive reads","Explosive power"]',
    '{"overall":"Overall score","trend":"Performance trend","summary":"Talent insight"}',
    '["Explosive contact power","Acceleration","Pass execution"]',
    '["Tackling technique","Decision making under pressure","Repeat sprint quality"]',
    '["Increase repeat-sprint capacity and contact readiness.","Prioritise quick decision-making in phases around breakdowns and space.","Use long-duration field sessions to track progress in power and repeated speed."]',
    TRUE
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  assessment_categories = VALUES(assessment_categories),
  skill_categories = VALUES(skill_categories),
  dashboard_labels = VALUES(dashboard_labels),
  strength_signals = VALUES(strength_signals),
  growth_signals = VALUES(growth_signals),
  recommendation_templates = VALUES(recommendation_templates),
  active = VALUES(active);

INSERT INTO talent_insights (user_id, sport, overall_score, summary, recommendations, caution)
VALUES (
  (SELECT id FROM users WHERE email = 'priya@example.com'),
  'Cricket',
  84.0,
  'Strong coordination and movement efficiency. Continue technical repetition with a coach-led review.',
  'Focus on footwork under pressure and decision-making drills in net sessions.',
  'This insight supports coaching decisions and does not predict future professional performance with certainty.'
); 

SELECT 'Database setup complete for sports_talent_assessment.' AS status;

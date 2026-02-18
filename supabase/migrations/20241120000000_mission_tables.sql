-- Migration: Add mission system tables and extend players table

-- Extend players table with missing columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_arc TEXT CHECK (current_arc IN ('clarity', 'chaos', 'unknown'));
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- missions_progress: tracks where each player is in the mission sequence
CREATE TABLE IF NOT EXISTS missions_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  current_mission INTEGER NOT NULL DEFAULT 1,
  path_choice TEXT CHECK (path_choice IN ('clarity', 'chaos', 'unknown')),
  last_sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE INDEX IF NOT EXISTS idx_missions_progress_player_id ON missions_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_missions_progress_responded_at ON missions_progress(responded_at)
  WHERE responded_at IS NOT NULL;

-- mission_responses: full log of every player reply
CREATE TABLE IF NOT EXISTS mission_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_number INTEGER NOT NULL,
  response_text TEXT NOT NULL,
  word_count INTEGER,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mission_responses_player_id ON mission_responses(player_id);
CREATE INDEX IF NOT EXISTS idx_mission_responses_mission_number ON mission_responses(mission_number);

-- choices: richer per-mission analytics
CREATE TABLE IF NOT EXISTS choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_number INTEGER,
  arc TEXT,
  choice TEXT,
  emotion_rating INTEGER,
  response TEXT,
  arrival_time TIMESTAMPTZ,
  response_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_choices_player_id ON choices(player_id);

-- questions_pool: Mission 6 questions + Mission 7 pairing
CREATE TABLE IF NOT EXISTS questions_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  path_choice TEXT CHECK (path_choice IN ('clarity', 'chaos', 'unknown')),
  paired_with UUID REFERENCES players(id),
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_pool_player_id ON questions_pool(player_id);
CREATE INDEX IF NOT EXISTS idx_questions_pool_path_choice ON questions_pool(path_choice)
  WHERE paired_with IS NULL;

-- wall_submissions: public reflection wall
CREATE TABLE IF NOT EXISTS wall_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc TEXT CHECK (arc IN ('clarity', 'chaos', 'unknown')),
  reflection TEXT NOT NULL,
  quantum_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for new tables

ALTER TABLE missions_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE wall_submissions ENABLE ROW LEVEL SECURITY;

-- missions_progress: players read own row, service role manages all
CREATE POLICY "Players can read own mission progress"
  ON missions_progress FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE email = auth.email()
  ));

-- mission_responses: players read own responses
CREATE POLICY "Players can read own responses"
  ON mission_responses FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE email = auth.email()
  ));

-- choices: players read own choices
CREATE POLICY "Players can read own choices"
  ON choices FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE email = auth.email()
  ));

-- questions_pool: players read own questions (not paired player's private info)
CREATE POLICY "Players can read own questions"
  ON questions_pool FOR SELECT
  USING (player_id IN (
    SELECT id FROM players WHERE email = auth.email()
  ));

-- wall_submissions: public read
CREATE POLICY "Anyone can read wall submissions"
  ON wall_submissions FOR SELECT
  USING (true);

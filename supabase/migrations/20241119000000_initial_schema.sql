-- Initial Schema for Stardust Web
-- This migration creates the core tables for the gamified secret unlocking platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players Table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  token TEXT NOT NULL,
  stardust_balance INTEGER DEFAULT 0 CHECK (stardust_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);

-- Secrets Table
CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_secrets_code ON secrets(code);
CREATE INDEX IF NOT EXISTS idx_secrets_is_active ON secrets(is_active);

-- Stardust Transactions Table
CREATE TABLE IF NOT EXISTS stardust_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  tx_type TEXT NOT NULL CHECK (tx_type IN ('earn', 'spend')),
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_stardust_transactions_player_id ON stardust_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_stardust_transactions_created_at ON stardust_transactions(created_at);

-- Player Unlocks Table
CREATE TABLE IF NOT EXISTS player_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  unlock_type TEXT NOT NULL,
  ref_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, unlock_type, ref_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_player_unlocks_player_id ON player_unlocks(player_id);
CREATE INDEX IF NOT EXISTS idx_player_unlocks_ref_id ON player_unlocks(ref_id);

-- Reflections Table
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reflections_player_id ON reflections(player_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(created_at);

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secrets_updated_at
  BEFORE UPDATE ON secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC Function: Ensure Player
-- Creates or retrieves a player based on the authenticated user
CREATE OR REPLACE FUNCTION ensure_player()
RETURNS UUID AS $$
DECLARE
  user_email TEXT;
  player_id UUID;
BEGIN
  -- Get the authenticated user's email
  SELECT auth.email() INTO user_email;

  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if player exists
  SELECT id INTO player_id
  FROM players
  WHERE email = user_email;

  -- If not, create new player
  IF player_id IS NULL THEN
    INSERT INTO players (email, token, stardust_balance)
    VALUES (
      user_email,
      encode(gen_random_bytes(16), 'hex'),
      50  -- Welcome bonus
    )
    RETURNING id INTO player_id;
  END IF;

  RETURN player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stardust_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Players: Users can only read their own data
CREATE POLICY "Users can read own player data"
  ON players FOR SELECT
  USING (email = auth.email());

-- Secrets: Everyone can read active secrets
CREATE POLICY "Anyone can read active secrets"
  ON secrets FOR SELECT
  USING (is_active = true);

-- Transactions: Users can read their own transactions
CREATE POLICY "Users can read own transactions"
  ON stardust_transactions FOR SELECT
  USING (player_id IN (SELECT id FROM players WHERE email = auth.email()));

-- Unlocks: Users can read their own unlocks
CREATE POLICY "Users can read own unlocks"
  ON player_unlocks FOR SELECT
  USING (player_id IN (SELECT id FROM players WHERE email = auth.email()));

-- Reflections: Users can read and insert their own reflections
CREATE POLICY "Users can read own reflections"
  ON reflections FOR SELECT
  USING (player_id IN (SELECT id FROM players WHERE email = auth.email()));

CREATE POLICY "Users can insert own reflections"
  ON reflections FOR INSERT
  WITH CHECK (player_id IN (SELECT id FROM players WHERE email = auth.email()));

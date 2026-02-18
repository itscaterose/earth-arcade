// Database Models

export interface Player {
  id: string;
  email: string;
  token: string;
  stardust_balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface Secret {
  id: string;
  code: string;
  title: string;
  content: string;
  cost: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StardustTransaction {
  id: string;
  player_id: string;
  amount: number;
  tx_type: 'earn' | 'spend';
  reason: string;
  metadata: Record<string, unknown>;
  created_at?: string;
}

export interface PlayerUnlock {
  id: string;
  player_id: string;
  unlock_type: string;
  ref_id: string;
  created_at?: string;
}

export interface Reflection {
  id: string;
  player_id: string;
  reflection_text: string;
  created_at?: string;
}

// API Request/Response Types

export interface CreatePlayerRequest {
  email: string;
}

export interface CreatePlayerResponse {
  player: Player;
  message: string;
}

export interface PlayerStateResponse {
  player: {
    email: string;
    stardust_balance: number;
  };
  secrets: SecretWithUnlockStatus[];
}

export interface SecretWithUnlockStatus {
  id: string;
  code: string;
  cost: number;
  title: string;
  unlocked: boolean;
  content?: string;
}

export interface EarnStardustRequest {
  player_id: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface EarnStardustResponse {
  new_balance: number;
  transaction: StardustTransaction;
}

export interface SpendStardustRequest {
  player_id: string;
  secret_code: string;
}

export interface SpendStardustResponse {
  secret: Secret;
  new_balance: number;
}

export interface SaveReflectionRequest {
  reflection_text: string;
}

export interface SaveReflectionResponse {
  success: boolean;
  message: string;
  reflection?: Reflection;
}

// API Error Response
export interface ApiErrorResponse {
  error: string;
  details?: string;
}

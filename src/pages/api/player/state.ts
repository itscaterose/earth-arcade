import type { NextApiRequest, NextApiResponse } from 'next'
import type { PlayerStateResponse, ApiErrorResponse } from '@/types'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendErrorResponse, handleUnknownError } from '@/lib/validation'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<PlayerStateResponse | ApiErrorResponse>
) {
  if (req.method !== 'GET') {
    return sendErrorResponse(res, 405, 'Method not allowed')
  }

  // Get email from authenticated user
  const email = req.user?.email

  if (!email) {
    return sendErrorResponse(res, 401, 'No email found in auth token')
  }

  try {
    // 1. Get player info by email
    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .select('id, stardust_balance, email')
      .eq('email', email.toLowerCase())
      .single()

    if (playerError) {
      if (playerError.code === 'PGRST116') {
        return sendErrorResponse(res, 404, 'Player not found')
      }
      throw playerError
    }

    if (!player) {
      return sendErrorResponse(res, 404, 'Player not found')
    }

    // 2. Get unlocked secrets
    const { data: unlocks, error: unlocksError } = await supabaseAdmin
      .from('player_unlocks')
      .select('ref_id')
      .eq('player_id', player.id)
      .eq('unlock_type', 'secret')

    if (unlocksError) throw unlocksError

    const unlockedSecretIds = (unlocks || []).map(u => u.ref_id)

    // 3. Get all available secrets
    const { data: secrets, error: secretsError } = await supabaseAdmin
      .from('secrets')
      .select('id, code, cost, title')
      .eq('is_active', true)
      .order('cost', { ascending: true })

    if (secretsError) throw secretsError

    // 4. Mark which are unlocked
    const secretsWithStatus = (secrets || []).map(s => ({
      ...s,
      unlocked: unlockedSecretIds.includes(s.id)
    }))

    return res.status(200).json({
      player: {
        email: player.email,
        stardust_balance: player.stardust_balance
      },
      secrets: secretsWithStatus
    })

  } catch (error) {
    return handleUnknownError(res, error, 'Error fetching player state')
  }
}

export default async function playerStateHandler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerStateResponse | ApiErrorResponse>
) {
  return withAuth(req as AuthenticatedRequest, res, handler)
}
import type { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes } from 'crypto'
import type { CreatePlayerResponse, ApiErrorResponse } from '@/types'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sanitizeEmail, sendErrorResponse, handleUnknownError } from '@/lib/validation'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<CreatePlayerResponse | ApiErrorResponse>
) {
  if (req.method !== 'POST') {
    return sendErrorResponse(res, 405, 'Method not allowed')
  }

  // Get email from authenticated user
  const email = req.user?.email

  if (!email) {
    return sendErrorResponse(res, 401, 'No email found in auth token')
  }

  const sanitizedEmail = sanitizeEmail(email)

  try {
    // Check if player already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('players')
      .select('id, email, stardust_balance, created_at')
      .eq('email', sanitizedEmail)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error - any other error should throw
      throw checkError
    }

    if (existing) {
      return res.status(200).json({
        player: existing as any,
        message: 'Player already exists'
      })
    }

    // Create new player with welcome bonus
    const playerToken = randomBytes(16).toString('hex')

    const { data: player, error: insertError } = await supabaseAdmin
      .from('players')
      .insert({
        email: sanitizedEmail,
        token: playerToken,
        stardust_balance: 50
      })
      .select('id, email, stardust_balance, created_at')
      .single()

    if (insertError) throw insertError

    if (!player) {
      throw new Error('Failed to create player')
    }

    return res.status(201).json({
      player: player as any,
      message: 'Player created successfully'
    })

  } catch (error) {
    return handleUnknownError(res, error, 'Error creating player')
  }
}

export default async function createPlayerHandler(
  req: NextApiRequest,
  res: NextApiResponse<CreatePlayerResponse | ApiErrorResponse>
) {
  return withAuth(req as AuthenticatedRequest, res, handler)
}
import type { NextApiRequest, NextApiResponse } from 'next'
import type { SpendStardustResponse, ApiErrorResponse } from '@/types'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendErrorResponse, handleUnknownError } from '@/lib/validation'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<SpendStardustResponse | ApiErrorResponse>
) {
  if (req.method !== 'POST') {
    return sendErrorResponse(res, 405, 'Method not allowed')
  }

  // Get email from authenticated user
  const email = req.user?.email

  if (!email) {
    return sendErrorResponse(res, 401, 'No email found in auth token')
  }

  const { secret_code } = req.body

  // Validate secret_code
  if (!secret_code || typeof secret_code !== 'string' || !secret_code.trim()) {
    return sendErrorResponse(res, 400, 'Secret code is required')
  }

  try {
    // 0. Get player by email
    const { data: player, error: playerLookupError } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (playerLookupError || !player) {
      return sendErrorResponse(res, 404, 'Player not found')
    }

    const player_id = player.id

    // 1. Get the secret
    const { data: secret, error: secretError } = await supabaseAdmin
      .from('secrets')
      .select('*')
      .eq('code', secret_code.trim())
      .eq('is_active', true)
      .single()

    if (secretError) {
      if (secretError.code === 'PGRST116') {
        return sendErrorResponse(res, 404, 'Secret not found or inactive')
      }
      throw secretError
    }

    if (!secret) {
      return sendErrorResponse(res, 404, 'Secret not found or inactive')
    }

    // 2. Check if already unlocked
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('player_unlocks')
      .select('id')
      .eq('player_id', player_id)
      .eq('unlock_type', 'secret')
      .eq('ref_id', secret.id)
      .maybeSingle()

    if (existingError) throw existingError

    if (existing) {
      return sendErrorResponse(res, 400, 'Secret already unlocked')
    }

    // 3. Get current balance
    const { data: transactions, error: txListError } = await supabaseAdmin
      .from('stardust_transactions')
      .select('amount, tx_type')
      .eq('player_id', player_id)

    if (txListError) throw txListError

    if (!transactions) {
      throw new Error('Failed to fetch transactions')
    }

    const currentBalance = transactions.reduce((sum, tx) => {
      return tx.tx_type === 'earn' ? sum + tx.amount : sum - tx.amount
    }, 0)

    // 4. Check if enough balance
    if (currentBalance < secret.cost) {
      return res.status(400).json({
        error: 'Insufficient stardust',
        details: `You have ${currentBalance} stardust but need ${secret.cost}`
      })
    }

    // 5. Create spend transaction
    const { error: spendError } = await supabaseAdmin
      .from('stardust_transactions')
      .insert({
        player_id,
        amount: secret.cost,
        tx_type: 'spend',
        reason: `Unlocked: ${secret.title}`,
        metadata: { secret_code, secret_id: secret.id }
      })

    if (spendError) throw spendError

    // 6. Create unlock record
    const { error: unlockError } = await supabaseAdmin
      .from('player_unlocks')
      .insert({
        player_id,
        unlock_type: 'secret',
        ref_id: secret.id
      })

    if (unlockError) throw unlockError

    // 7. Update player balance
    const newBalance = currentBalance - secret.cost

    const { error: updateError } = await supabaseAdmin
      .from('players')
      .update({ stardust_balance: newBalance })
      .eq('id', player_id)

    if (updateError) throw updateError

    // 8. Return success with secret content
    return res.status(200).json({
      secret: secret as any,
      new_balance: newBalance
    })

  } catch (error) {
    return handleUnknownError(res, error, 'Error spending stardust')
  }
}

export default async function spendStardustHandler(
  req: NextApiRequest,
  res: NextApiResponse<SpendStardustResponse | ApiErrorResponse>
) {
  return withAuth(req as AuthenticatedRequest, res, handler)
}
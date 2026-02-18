import type { NextApiRequest, NextApiResponse } from 'next'
import type { EarnStardustResponse, ApiErrorResponse } from '@/types'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { validatePositiveInteger, sendErrorResponse, handleUnknownError } from '@/lib/validation'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<EarnStardustResponse | ApiErrorResponse>
) {
  if (req.method !== 'POST') {
    return sendErrorResponse(res, 405, 'Method not allowed')
  }

  // Get email from authenticated user
  const email = req.user?.email

  if (!email) {
    return sendErrorResponse(res, 401, 'No email found in auth token')
  }

  const { amount, reason, metadata } = req.body

  // Validate amount
  const validAmount = validatePositiveInteger(amount)
  if (validAmount === null) {
    return sendErrorResponse(res, 400, 'Amount must be a positive integer')
  }

  try {
    // 1. Get player by email
    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (playerError || !player) {
      return sendErrorResponse(res, 404, 'Player not found')
    }

    const player_id = player.id

    // 2. Insert transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('stardust_transactions')
      .insert({
        player_id,
        amount: validAmount,
        tx_type: 'earn',
        reason: reason || 'Choice made',
        metadata: metadata || {}
      })
      .select()
      .single()

    if (txError) throw txError

    // 3. Recalculate balance from ALL transactions (bulletproof approach)
    const { data: transactions, error: txListError } = await supabaseAdmin
      .from('stardust_transactions')
      .select('amount, tx_type')
      .eq('player_id', player_id)

    if (txListError) throw txListError

    if (!transactions) {
      throw new Error('Failed to fetch transactions')
    }

    // Calculate balance: earn = +, spend = -
    const newBalance = transactions.reduce((sum, tx) => {
      return tx.tx_type === 'earn' ? sum + tx.amount : sum - tx.amount
    }, 0)

    // 4. Update player balance
    const { error: updateError } = await supabaseAdmin
      .from('players')
      .update({ stardust_balance: newBalance })
      .eq('id', player_id)

    if (updateError) throw updateError

    // 5. Return success
    return res.status(200).json({
      new_balance: newBalance,
      transaction: transaction as any
    })

  } catch (error) {
    return handleUnknownError(res, error, 'Error earning stardust')
  }
}

export default async function earnStardustHandler(
  req: NextApiRequest,
  res: NextApiResponse<EarnStardustResponse | ApiErrorResponse>
) {
  return withAuth(req as AuthenticatedRequest, res, handler)
}
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { player_id, amount, reason } = req.body

  // Validation
  if (!player_id || !amount) {
    return res.status(400).json({ error: 'Missing player_id or amount' })
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' })
  }

  try {
    // 1. Insert transaction
    const { data: transaction, error: txError } = await supabase
      .from('stardust_transactions')
      .insert({
        player_id,
        amount,
        tx_type: 'earn',
        reason: reason || 'Choice made',
        metadata: {}
      })
      .select()
      .single()

    if (txError) throw txError

    // 2. Recalculate balance from ALL transactions (bulletproof approach)
    const { data: transactions, error: txListError } = await supabase
      .from('stardust_transactions')
      .select('amount, tx_type')
      .eq('player_id', player_id)

    if (txListError) throw txListError

    // Calculate balance: earn = +, spend = -
    const newBalance = transactions.reduce((sum, tx) => {
      return tx.tx_type === 'earn' ? sum + tx.amount : sum - tx.amount
    }, 0)

    // 3. Update player balance
    const { error: updateError } = await supabase
      .from('players')
      .update({ stardust_balance: newBalance })
      .eq('id', player_id)

    if (updateError) throw updateError

    // 4. Return success
    return res.status(200).json({
      success: true,
      transaction_id: transaction.id,
      new_balance: newBalance,
      amount_earned: amount
    })

  } catch (error: any) {
    console.error('Error earning stardust:', error)
    return res.status(500).json({ error: error.message })
  }
}
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

  const { player_id, secret_code } = req.body

  // Validation
  if (!player_id || !secret_code) {
    return res.status(400).json({ error: 'Missing player_id or secret_code' })
  }

  try {
    // 1. Get the secret
    const { data: secret, error: secretError } = await supabase
      .from('secrets')
      .select('*')
      .eq('code', secret_code)
      .eq('is_active', true)
      .single()

    if (secretError || !secret) {
      return res.status(404).json({ error: 'Secret not found' })
    }

    // 2. Check if already unlocked
    const { data: existing, error: existingError } = await supabase
      .from('player_unlocks')
      .select('id')
      .eq('player_id', player_id)
      .eq('unlock_type', 'secret')
      .eq('ref_id', secret.id)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'Already unlocked' })
    }

    // 3. Get current balance
    const { data: transactions, error: txListError } = await supabase
      .from('stardust_transactions')
      .select('amount, tx_type')
      .eq('player_id', player_id)

    if (txListError) throw txListError

    const currentBalance = transactions.reduce((sum, tx) => {
      return tx.tx_type === 'earn' ? sum + tx.amount : sum - tx.amount
    }, 0)

    // 4. Check if enough balance
    if (currentBalance < secret.cost) {
      return res.status(400).json({ 
        error: 'Insufficient stardust',
        current_balance: currentBalance,
        required: secret.cost
      })
    }

    // 5. Create spend transaction
    const { error: spendError } = await supabase
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
    const { error: unlockError } = await supabase
      .from('player_unlocks')
      .insert({
        player_id,
        unlock_type: 'secret',
        ref_id: secret.id
      })

    if (unlockError) throw unlockError

    // 7. Update player balance
    const newBalance = currentBalance - secret.cost

    const { error: updateError } = await supabase
      .from('players')
      .update({ stardust_balance: newBalance })
      .eq('id', player_id)

    if (updateError) throw updateError

    // 8. Return success with secret content
    return res.status(200).json({
      success: true,
      new_balance: newBalance,
      spent: secret.cost,
      secret: {
        title: secret.title,
        content: secret.content
      }
    })

  } catch (error: any) {
    console.error('Error spending stardust:', error)
    return res.status(500).json({ error: error.message })
  }
}
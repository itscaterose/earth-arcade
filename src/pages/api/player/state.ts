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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { player_id } = req.query

  if (!player_id || typeof player_id !== 'string') {
    return res.status(400).json({ error: 'Missing player_id' })
  }

  try {
    // 1. Get player info
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('stardust_balance, email')
      .eq('id', player_id)
      .single()

    if (playerError) throw playerError

    // 2. Get unlocked secrets
    const { data: unlocks, error: unlocksError } = await supabase
      .from('player_unlocks')
      .select('ref_id')
      .eq('player_id', player_id)
      .eq('unlock_type', 'secret')

    if (unlocksError) throw unlocksError

    const unlockedSecretIds = unlocks.map(u => u.ref_id)

    // 3. Get all available secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('secrets')
      .select('id, code, cost, title')
      .eq('is_active', true)
      .order('cost', { ascending: true })

    if (secretsError) throw secretsError

    // 4. Mark which are unlocked
    const secretsWithStatus = secrets.map(s => ({
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

  } catch (error: any) {
    console.error('Error fetching player state:', error)
    return res.status(500).json({ error: error.message })
  }
}
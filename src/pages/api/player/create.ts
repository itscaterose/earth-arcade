import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes } from 'crypto'

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

  const { email } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email' })
  }

  try {
    // Check if player already exists
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return res.status(200).json({ 
        player_id: existing.id,
        message: 'Player already exists'
      })
    }

    // Create new player with welcome bonus
    const player_token = randomBytes(16).toString('hex')
    
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        email: email.toLowerCase(),
        token: player_token,
        stardust_balance: 50
      })
      .select('id')
      .single()

    if (error) throw error

    return res.status(201).json({ 
      player_id: player.id,
      message: 'Player created successfully'
    })

  } catch (error: any) {
    console.error('Error creating player:', error)
    return res.status(500).json({ error: error.message })
  }
}
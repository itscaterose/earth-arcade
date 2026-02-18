import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { sendMission } from '../../../lib/sendMission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if player already exists
    const { data: existingPlayer } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingPlayer) {
      // Resend Mission 1 only if they haven't progressed past it
      const { data: progress } = await supabaseAdmin
        .from('missions_progress')
        .select('current_mission')
        .eq('player_id', existingPlayer.id)
        .single();

      if (!progress || progress.current_mission === 1) {
        await sendMission(existingPlayer.id, 1);
      }

      return res.status(200).json({ success: true });
    }

    // Create new player
    const playerToken = crypto.randomBytes(32).toString('hex');

    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .insert({
        email: normalizedEmail,
        token: playerToken,
        stardust_balance: 50,
      })
      .select('id')
      .single();

    if (playerError || !player) {
      console.error('Player creation error:', playerError);
      return res.status(500).json({ error: 'Failed to create player' });
    }

    // Log the welcome stardust transaction
    await supabaseAdmin.from('stardust_transactions').insert({
      player_id: player.id,
      amount: 50,
      tx_type: 'earn',
      reason: 'Welcome bonus',
    });

    // Send Mission 1 (also creates missions_progress via sendMission)
    const result = await sendMission(player.id, 1);

    if (!result.success) {
      console.error('Failed to send Mission 1:', result.error);
      // Don't fail the signup — player is created, email can be retried
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

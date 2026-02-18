import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';
import { mission1Email } from '../../../lib/emails/mission-1';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (existingPlayer) {
      const { data: progress } = await supabase
        .from('missions_progress')
        .select('*')
        .eq('player_id', existingPlayer.id)
        .single();

      if (!progress || progress.current_mission === 1) {
        await sendMission1(email);
      }
      
      return res.status(200).json({ success: true });
    }

    const playerToken = crypto.randomBytes(32).toString('hex');
    
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        email: email.toLowerCase(),
        token: playerToken,
        stardust_balance: 50
      })
      .select()
      .single();

    if (playerError || !player) {
      console.error('Player creation error:', playerError);
      throw new Error(playerError?.message || 'Failed to create player');
    }

    await supabase
      .from('missions_progress')
      .insert({
        player_id: player.id,
        current_mission: 1,
        last_sent_at: new Date().toISOString()
      });

    await sendMission1(email);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendMission1(email: string) {
  try {
    console.log('Attempting to send email to:', email);
    const result = await resend.emails.send({
      from: 'Letta <letta@eartharcade.com>',
      to: email,
      subject: "Darling, You've Been Spotted",
      html: mission1Email,
      replyTo: 'cate@earth-arcade.com'
    });
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
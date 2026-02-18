import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

/**
 * GET /api/admin/players
 * Returns all players with their current mission state for the admin dashboard.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabaseAdmin
    .from('players')
    .select(`
      id,
      email,
      stardust_balance,
      current_arc,
      created_at,
      missions_progress (
        current_mission,
        path_choice,
        last_sent_at,
        responded_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Database error' });
  }

  return res.status(200).json({ players: data });
}

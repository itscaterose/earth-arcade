import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { sendMission } from '../../../lib/sendMission';
import { TOTAL_MISSIONS } from '../../../lib/missionContent';

// How long to wait after a player responds before sending the next mission.
// Set to a short value during testing; increase for production.
const MISSION_DELAY_HOURS = Number(process.env.MISSION_DELAY_HOURS ?? 24);

/**
 * GET /api/cron/process-missions
 *
 * Run every hour by Vercel Cron (see vercel.json).
 * Finds players who have responded to their current mission and whose delay
 * period has elapsed, then sends the next mission.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel sets this header automatically on cron invocations.
  // We also accept a manual CRON_SECRET for local/admin testing.
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManualTrigger = req.headers['x-cron-secret'] === process.env.CRON_SECRET;

  if (!isVercelCron && !isManualTrigger) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const delayMs = MISSION_DELAY_HOURS * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - delayMs).toISOString();

  // Find players who:
  //   • have responded to their current mission (responded_at IS NOT NULL)
  //   • responded at least MISSION_DELAY_HOURS ago
  //   • are not on the final mission
  const { data: pending, error } = await supabaseAdmin
    .from('missions_progress')
    .select('player_id, current_mission, responded_at')
    .not('responded_at', 'is', null)
    .lte('responded_at', cutoff)
    .lt('current_mission', TOTAL_MISSIONS);

  if (error) {
    console.error('Cron: DB query error', error);
    return res.status(500).json({ error: 'Database error' });
  }

  if (!pending || pending.length === 0) {
    return res.status(200).json({ processed: 0 });
  }

  const results: Array<{ player_id: string; mission: number; success: boolean; error?: string }> = [];

  for (const row of pending) {
    const nextMission = row.current_mission + 1;
    const result = await sendMission(row.player_id, nextMission);
    results.push({
      player_id: row.player_id,
      mission: nextMission,
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      console.error(`Cron: failed to send mission ${nextMission} to ${row.player_id}:`, result.error);
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`Cron: processed ${successCount}/${results.length} missions`);

  return res.status(200).json({ processed: results.length, results });
}

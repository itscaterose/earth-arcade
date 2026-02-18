import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMission } from '../../../lib/sendMission';

/**
 * POST /api/admin/trigger-mission
 * Body: { player_id: string, mission_number: number }
 * Manually sends a mission to a player. Admin only.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { player_id, mission_number } = req.body;

  if (!player_id || typeof player_id !== 'string') {
    return res.status(400).json({ error: 'player_id required' });
  }

  const missionNum = parseInt(String(mission_number), 10);
  if (isNaN(missionNum) || missionNum < 1 || missionNum > 10) {
    return res.status(400).json({ error: 'mission_number must be 1–10' });
  }

  const result = await sendMission(player_id, missionNum);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json({ success: true, messageId: result.messageId });
}

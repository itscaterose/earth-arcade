import * as postmark from 'postmark';
import { supabaseAdmin } from './supabaseAdmin';
import { getMissionContent, type PathChoice, TOTAL_MISSIONS } from './missionContent';

const LETTA_FROM = 'Letta ✦ The Unroyal Society <letta@stardust.eartharcade.com>';
const LETTA_REPLY_TO = 'letta@stardust.eartharcade.com';

function getPostmarkClient(): postmark.ServerClient {
  const apiKey = process.env.POSTMARK_API_KEY;
  if (!apiKey) throw new Error('POSTMARK_API_KEY is not set');
  return new postmark.ServerClient(apiKey);
}

export interface SendMissionResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a mission email to a player and updates missions_progress.
 * This is the single source of truth for mission delivery — used by both
 * the /api/email/send-mission endpoint and the /api/cron/process-missions cron.
 */
export async function sendMission(
  playerId: string,
  missionNumber: number
): Promise<SendMissionResult> {
  if (missionNumber < 1 || missionNumber > TOTAL_MISSIONS) {
    return { success: false, error: `Invalid mission number: ${missionNumber}` };
  }

  // Get player
  const { data: player, error: playerError } = await supabaseAdmin
    .from('players')
    .select('id, email, current_arc')
    .eq('id', playerId)
    .single();

  if (playerError || !player) {
    return { success: false, error: 'Player not found' };
  }

  // Get path choice from missions_progress (needed for missions 4–6)
  const { data: progress } = await supabaseAdmin
    .from('missions_progress')
    .select('path_choice')
    .eq('player_id', playerId)
    .single();

  const pathChoice = (progress?.path_choice ?? 'unknown') as PathChoice;

  // For Mission 7: fetch paired question
  let pairedQuestion: string | undefined;
  if (missionNumber === 7) {
    const { data: qRow } = await supabaseAdmin
      .from('questions_pool')
      .select('question_text')
      .eq('paired_with', playerId)
      .not('question_text', 'is', null)
      .limit(1)
      .single();
    pairedQuestion = qRow?.question_text ?? undefined;
  }

  // Build email content
  let missionEmail;
  try {
    missionEmail = getMissionContent(missionNumber, pathChoice, { pairedQuestion });
  } catch (err) {
    return { success: false, error: `Mission content error: ${String(err)}` };
  }

  // Send via Postmark
  try {
    const client = getPostmarkClient();
    const result = await client.sendEmail({
      From: LETTA_FROM,
      To: player.email,
      ReplyTo: LETTA_REPLY_TO,
      Subject: missionEmail.subject,
      HtmlBody: missionEmail.html,
      MessageStream: 'outbound',
    });

    // Update missions_progress
    await supabaseAdmin
      .from('missions_progress')
      .upsert({
        player_id: playerId,
        current_mission: missionNumber,
        last_sent_at: new Date().toISOString(),
        responded_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'player_id' });

    return { success: true, messageId: result.MessageID };
  } catch (err) {
    console.error('Postmark send error:', err);
    return { success: false, error: String(err) };
  }
}

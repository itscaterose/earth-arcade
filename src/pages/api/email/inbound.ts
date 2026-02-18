import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import type { PathChoice } from '../../../lib/missionContent';

// Postmark inbound webhook payload (partial — only fields we use)
interface PostmarkInboundPayload {
  From: string;
  FromName: string;
  TextBody: string;
  StrippedTextReply: string;
  Subject: string;
  Date: string;
}

const STARDUST_PER_REPLY = 10;

// Disable body parsing so we can read raw body if needed (not required for Postmark)
export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify this is genuinely from Postmark via a shared secret in the query string
  const inboundSecret = process.env.POSTMARK_INBOUND_SECRET;
  if (inboundSecret && req.query.secret !== inboundSecret) {
    console.warn('Inbound webhook: bad secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body as PostmarkInboundPayload;

  if (!payload?.From) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Extract sender email (Postmark From may include display name)
  const fromEmail = extractEmail(payload.From).toLowerCase();

  // Find player by email
  const { data: player, error: playerErr } = await supabaseAdmin
    .from('players')
    .select('id, email')
    .eq('email', fromEmail)
    .single();

  if (playerErr || !player) {
    console.warn(`Inbound email from unknown address: ${fromEmail}`);
    // Acknowledge to Postmark — don't retry
    return res.status(200).json({ ok: true, note: 'player not found' });
  }

  // Get current mission state
  const { data: progress } = await supabaseAdmin
    .from('missions_progress')
    .select('current_mission, path_choice, last_sent_at, responded_at')
    .eq('player_id', player.id)
    .single();

  if (!progress) {
    console.warn(`No missions_progress for player ${player.id}`);
    return res.status(200).json({ ok: true, note: 'no progress record' });
  }

  // Ignore duplicate responses (already responded to current mission)
  if (progress.responded_at) {
    return res.status(200).json({ ok: true, note: 'already responded' });
  }

  const missionNumber = progress.current_mission;
  const responseText = (payload.StrippedTextReply || payload.TextBody || '').trim();
  const wordCount = responseText ? responseText.split(/\s+/).filter(Boolean).length : 0;
  const now = new Date().toISOString();

  // ── 1. Log to mission_responses ──────────────────────────────────────────
  await supabaseAdmin.from('mission_responses').insert({
    player_id: player.id,
    mission_number: missionNumber,
    response_text: responseText,
    word_count: wordCount,
    responded_at: now,
  });

  // ── 2. Log to choices ────────────────────────────────────────────────────
  await supabaseAdmin.from('choices').insert({
    player_id: player.id,
    mission_number: missionNumber,
    arc: progress.path_choice,
    response: responseText,
    arrival_time: progress.last_sent_at,
    response_time: now,
  });

  // ── 3. Award stardust ────────────────────────────────────────────────────
  await awardStardust(player.id, STARDUST_PER_REPLY, `Mission ${missionNumber} reply`);

  // ── 4. Special mission handling ──────────────────────────────────────────

  if (missionNumber === 3) {
    // Detect path choice from response text
    const pathChoice = detectPathChoice(responseText);
    await supabaseAdmin
      .from('missions_progress')
      .update({ path_choice: pathChoice, updated_at: now })
      .eq('player_id', player.id);

    // Mirror to players.current_arc
    await supabaseAdmin
      .from('players')
      .update({ current_arc: pathChoice })
      .eq('id', player.id);
  }

  if (missionNumber === 6) {
    // Save the question for Mission 7 pairing
    const pathChoice = (progress.path_choice ?? 'unknown') as PathChoice;
    await supabaseAdmin.from('questions_pool').insert({
      player_id: player.id,
      question_text: responseText,
      path_choice: pathChoice,
    });
  }

  if (missionNumber === 7) {
    // Attempt to pair this player with another player who has an unanswered question
    await pairMission7Player(player.id, (progress.path_choice ?? 'unknown') as PathChoice);
  }

  // ── 5. Mark responded so cron can schedule next mission ─────────────────
  await supabaseAdmin
    .from('missions_progress')
    .update({ responded_at: now, updated_at: now })
    .eq('player_id', player.id);

  console.log(`Mission ${missionNumber} response logged for player ${player.id}`);
  return res.status(200).json({ ok: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractEmail(from: string): string {
  // "John Doe <john@example.com>" → "john@example.com"
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

function detectPathChoice(text: string): PathChoice {
  const lower = text.toLowerCase();
  if (lower.includes('clarity')) return 'clarity';
  if (lower.includes('chaos')) return 'chaos';
  if (lower.includes('unknown')) return 'unknown';
  // Default: unknown if no keyword found
  return 'unknown';
}

async function awardStardust(playerId: string, amount: number, reason: string) {
  // Insert transaction
  await supabaseAdmin.from('stardust_transactions').insert({
    player_id: playerId,
    amount,
    tx_type: 'earn',
    reason,
  });

  // Recalculate balance from all transactions (bulletproof approach)
  const { data: txs } = await supabaseAdmin
    .from('stardust_transactions')
    .select('amount, tx_type')
    .eq('player_id', playerId);

  if (txs) {
    const balance = txs.reduce((acc, tx) => {
      return tx.tx_type === 'earn' ? acc + tx.amount : acc - tx.amount;
    }, 0);

    await supabaseAdmin
      .from('players')
      .update({ stardust_balance: Math.max(0, balance) })
      .eq('id', playerId);
  }
}

async function pairMission7Player(playerId: string, pathChoice: PathChoice) {
  // Find another player with the same path who has an unpaired question
  const { data: candidate } = await supabaseAdmin
    .from('questions_pool')
    .select('id, player_id')
    .eq('path_choice', pathChoice)
    .is('paired_with', null)
    .neq('player_id', playerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!candidate) {
    // No match yet — this player will be paired when the next suitable player arrives
    return;
  }

  // Pair both players
  await supabaseAdmin
    .from('questions_pool')
    .update({ paired_with: playerId })
    .eq('id', candidate.id);

  // Also insert current player's question with paired_with = candidate.player_id
  await supabaseAdmin
    .from('questions_pool')
    .update({ paired_with: candidate.player_id })
    .eq('player_id', playerId)
    .is('paired_with', null);
}

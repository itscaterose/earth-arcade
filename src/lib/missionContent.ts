export type PathChoice = 'clarity' | 'chaos' | 'unknown';

export interface MissionEmail {
  subject: string;
  html: string;
}

// ─── Email wrapper ────────────────────────────────────────────────────────────
// All mission emails share this dark-theme shell. Inner HTML goes between the
// header bar and the footer social link.

export function wrapEmailHtml(innerHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <p style="color: #7dd3c0; font-size: 14px; margin: 0 0 30px 0; text-align: center; letter-spacing: 2px;">
          ((follow the stardust))
        </p>

        ${innerHtml}

        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #1a1a1a; padding-top: 20px;">
          <a href="https://instagram.com/earth.arcade" style="color: #7dd3c0; text-decoration: none; font-size: 13px;">@earth.arcade</a>
          <span style="color: #444; font-size: 13px;"> · </span>
          <span style="color: #7dd3c0; font-size: 13px;">#stardustgame</span>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function p(text: string, color = '#cccccc'): string {
  return `<p style="font-size: 16px; line-height: 1.7; color: ${color}; margin: 0 0 20px 0;">${text}</p>`;
}

function missionBox(title: string, body: string): string {
  return `
  <div style="background-color: #0d0d0d; border-left: 3px solid #7dd3c0; padding: 20px 24px; margin: 30px 0;">
    <p style="color: #7dd3c0; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px 0;">${title}</p>
    ${body}
  </div>`;
}

function signature(): string {
  return `<p style="font-size: 16px; line-height: 1.7; color: #7dd3c0; margin: 30px 0 0 0;">→ L.</p>`;
}

// ─── Mission 1 ────────────────────────────────────────────────────────────────

const mission1Inner = `
  <h2 style="color: #7dd3c0; font-size: 16px; font-weight: 600; margin: 0 0 30px 0; letter-spacing: 0.5px;">
    Where Gravity Bends.
  </h2>

  ${p('Darling—', '#ffffff')}
  ${p("Let's be honest: you probably thought this was spam.<br>It's not.<br>Though I understand the confusion.<br>We're not exactly listed anywhere.")}
  ${p("I'm Letta.<br>I work with what we somewhat pretentiously call The Unroyal Society—<br>we track probability hiccups.<br>Tiny moments where the universe does something it shouldn't, statistically speaking.")}
  ${p('Last Tuesday at 14:37, you caused one.')}
  ${p("Before you close this email thinking I'm either<br>a) a very elaborate phishing scam<br>b) having a delightful mental-health-adjacent moment<br>c) both")}
  ${p('Consider this instead:')}
  ${p("What's the strangest thing that's happened to you recently?", '#ffffff')}
  ${p("Not horror-movie strange—just… off.<br>A coincidence a bit too coordinated.<br>A thought that arrived fully formed.<br>A moment where time felt like it tried something new.")}
  ${p("You know the one.<br>The thing pretending to be nothing while refusing to leave.")}
  ${p("That's why you're here.")}
  ${p("The Unroyal Society doesn't recruit.<br>We notice.<br>When someone's choices start bending the field in interesting ways, we say hello.")}
  ${p('So: hello.', '#ffffff')}

  ${missionBox('Your First Mission', `
    ${p('Tell me the strange thing.')}
    ${p('One word or one sentence.')}
  `)}

  ${p('When you send it, something small will shift near you:<br>a light, a shadow, an object thinking about being important.')}
  ${p("That's your first breadcrumb.")}

  ${signature()}

  <div style="border-top: 1px solid #222; padding-top: 20px; margin-top: 30px;">
    <p style="font-size: 14px; color: #555; margin: 0 0 8px 0;"><strong style="color: #666;">P.S.</strong> You won't believe me yet. You will by Mission 6.</p>
    <p style="font-size: 14px; color: #555; margin: 0;"><strong style="color: #666;">P.P.S.</strong> And yes—the one you just thought of counts.</p>
  </div>
`;

// ─── Mission definitions ──────────────────────────────────────────────────────
// Missions 1–3 have no path branching.
// Missions 4–6 branch per PathChoice (Clarity / Chaos / Unknown).
// Mission 7 has a {{PAIRED_QUESTION}} placeholder.
// Missions 8–10 can optionally branch (TODOs below).
//
// To add content: replace the [MISSION X CONTENT] HTML comment with real body HTML.
// Use the p(), missionBox(), and signature() helpers above for consistent styling.

type SingleMission = { subject: string; inner: string };
type BranchedMission = { clarity: SingleMission; chaos: SingleMission; unknown: SingleMission };

const MISSIONS: Record<number, SingleMission | BranchedMission> = {

  1: {
    subject: "Darling, You've Been Spotted",
    inner: mission1Inner,
  },

  2: {
    subject: '[MISSION 2 SUBJECT]',
    inner: `<!-- [MISSION 2 CONTENT] -->`,
  },

  3: {
    subject: '[MISSION 3 SUBJECT]',
    inner: `<!-- [MISSION 3 CONTENT]
    This is the path-choice mission. The reply should contain one of:
    "clarity", "chaos", or "unknown" — Letta's letter should frame the choice. -->`,
  },

  // Missions 4–6 branch by path_choice
  4: {
    clarity: {
      subject: '[MISSION 4 SUBJECT — CLARITY]',
      inner: `<!-- [MISSION 4 CONTENT — CLARITY PATH] -->`,
    },
    chaos: {
      subject: '[MISSION 4 SUBJECT — CHAOS]',
      inner: `<!-- [MISSION 4 CONTENT — CHAOS PATH] -->`,
    },
    unknown: {
      subject: '[MISSION 4 SUBJECT — UNKNOWN]',
      inner: `<!-- [MISSION 4 CONTENT — UNKNOWN PATH] -->`,
    },
  },

  5: {
    clarity: {
      subject: '[MISSION 5 SUBJECT — CLARITY]',
      inner: `<!-- [MISSION 5 CONTENT — CLARITY PATH] -->`,
    },
    chaos: {
      subject: '[MISSION 5 SUBJECT — CHAOS]',
      inner: `<!-- [MISSION 5 CONTENT — CHAOS PATH] -->`,
    },
    unknown: {
      subject: '[MISSION 5 SUBJECT — UNKNOWN]',
      inner: `<!-- [MISSION 5 CONTENT — UNKNOWN PATH] -->`,
    },
  },

  6: {
    clarity: {
      subject: '[MISSION 6 SUBJECT — CLARITY]',
      inner: `<!-- [MISSION 6 CONTENT — CLARITY PATH]
      This mission should ask the player to submit a question for Mission 7 pairing. -->`,
    },
    chaos: {
      subject: '[MISSION 6 SUBJECT — CHAOS]',
      inner: `<!-- [MISSION 6 CONTENT — CHAOS PATH] -->`,
    },
    unknown: {
      subject: '[MISSION 6 SUBJECT — UNKNOWN]',
      inner: `<!-- [MISSION 6 CONTENT — UNKNOWN PATH] -->`,
    },
  },

  // Mission 7: paired player's question is injected at {{PAIRED_QUESTION}}
  7: {
    subject: '[MISSION 7 SUBJECT]',
    inner: `<!-- [MISSION 7 CONTENT]
    Include {{PAIRED_QUESTION}} where the anonymous paired question should appear.
    Example: <p style="...">"{{PAIRED_QUESTION}}"</p> -->`,
  },

  8: {
    subject: '[MISSION 8 SUBJECT]',
    inner: `<!-- [MISSION 8 CONTENT] -->`,
    // TODO: add path branching if needed
  } as SingleMission,

  9: {
    subject: '[MISSION 9 SUBJECT]',
    inner: `<!-- [MISSION 9 CONTENT] -->`,
  } as SingleMission,

  10: {
    subject: '[MISSION 10 SUBJECT]',
    inner: `<!-- [MISSION 10 CONTENT] -->`,
  } as SingleMission,
};

// ─── Public API ───────────────────────────────────────────────────────────────

function isBranched(m: SingleMission | BranchedMission): m is BranchedMission {
  return 'clarity' in m;
}

/**
 * Returns the full HTML email and subject for a given mission + path.
 * For missions 4–6, pathChoice is required; if omitted, 'unknown' is used.
 * For mission 7, pass pairedQuestion to substitute {{PAIRED_QUESTION}}.
 */
export function getMissionContent(
  missionNumber: number,
  pathChoice?: PathChoice,
  params?: { pairedQuestion?: string }
): MissionEmail {
  const def = MISSIONS[missionNumber];

  if (!def) {
    throw new Error(`No content defined for mission ${missionNumber}`);
  }

  let chosen: SingleMission;

  if (isBranched(def)) {
    const path = pathChoice ?? 'unknown';
    chosen = def[path];
  } else {
    chosen = def;
  }

  let inner = chosen.inner;

  if (params?.pairedQuestion) {
    inner = inner.replace(/\{\{PAIRED_QUESTION\}\}/g, params.pairedQuestion);
  }

  return {
    subject: chosen.subject,
    html: wrapEmailHtml(inner),
  };
}

export const TOTAL_MISSIONS = 10;

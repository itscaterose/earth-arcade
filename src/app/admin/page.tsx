'use client';

import { useState, useCallback } from 'react';

interface MissionProgress {
  current_mission: number;
  path_choice: string | null;
  last_sent_at: string | null;
  responded_at: string | null;
}

interface Player {
  id: string;
  email: string;
  stardust_balance: number;
  current_arc: string | null;
  created_at: string;
  missions_progress: MissionProgress[] | null;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function badge(text: string | null) {
  if (!text) return <span style={{ color: '#555' }}>—</span>;
  const colors: Record<string, string> = {
    clarity: '#7dd3c0',
    chaos: '#f87171',
    unknown: '#a78bfa',
  };
  const color = colors[text] ?? '#888';
  return (
    <span style={{
      color,
      border: `1px solid ${color}`,
      borderRadius: 3,
      padding: '1px 6px',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 1,
    }}>
      {text}
    </span>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [triggerState, setTriggerState] = useState<Record<string, string>>({});

  const fetchPlayers = useCallback(async (pw: string) => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/players', {
      headers: { 'x-admin-password': pw },
    });
    setLoading(false);
    if (res.status === 401) {
      setError('Wrong password.');
      return;
    }
    if (!res.ok) {
      setError('Failed to load players.');
      return;
    }
    const json = await res.json();
    setPlayers(json.players ?? []);
    setAuthed(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlayers(password);
  };

  const triggerMission = async (playerId: string, missionNum: number) => {
    setTriggerState(s => ({ ...s, [playerId]: 'sending…' }));
    const res = await fetch('/api/admin/trigger-mission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ player_id: playerId, mission_number: missionNum }),
    });
    if (res.ok) {
      setTriggerState(s => ({ ...s, [playerId]: `sent ✓ mission ${missionNum}` }));
      fetchPlayers(password);
    } else {
      const err = await res.json();
      setTriggerState(s => ({ ...s, [playerId]: `error: ${err.error}` }));
    }
  };

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280 }}>
          <p style={{ color: '#7dd3c0', margin: 0, letterSpacing: 2, textTransform: 'uppercase', fontSize: 12 }}>
            ✦ Admin
          </p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#fff',
              padding: '10px 12px',
              fontFamily: 'monospace',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {error && <p style={{ color: '#f87171', margin: 0, fontSize: 13 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid #7dd3c0',
              color: '#7dd3c0',
              padding: '10px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              letterSpacing: 1,
            }}
          >
            {loading ? 'loading…' : 'enter →'}
          </button>
        </form>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#ccc',
      fontFamily: 'monospace',
      padding: 32,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ color: '#7dd3c0', margin: 0, fontSize: 16, letterSpacing: 2 }}>
            ✦ STARDUST ADMIN
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: '#555', fontSize: 12 }}>{players.length} players</span>
            <button
              onClick={() => fetchPlayers(password)}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#888',
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            >
              refresh
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222', color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Mission</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Path</th>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Last sent</th>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Last response</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>✦</th>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Trigger</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => {
              const mp = player.missions_progress?.[0] ?? null;
              const currentMission = mp?.current_mission ?? 1;
              const nextMission = Math.min(currentMission + 1, 10);

              return (
                <tr
                  key={player.id}
                  style={{ borderBottom: '1px solid #111' }}
                >
                  <td style={{ padding: '10px 12px', color: '#ddd' }}>
                    {player.email}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#7dd3c0' }}>
                    {currentMission}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {badge(mp?.path_choice ?? null)}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#666', fontSize: 12 }}>
                    {formatDate(mp?.last_sent_at ?? null)}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>
                    {mp?.responded_at
                      ? <span style={{ color: '#7dd3c0' }}>{formatDate(mp.responded_at)}</span>
                      : <span style={{ color: '#444' }}>awaiting reply</span>
                    }
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#555' }}>
                    {player.stardust_balance}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        defaultValue={nextMission}
                        id={`mission-select-${player.id}`}
                        style={{
                          background: '#0d0d0d',
                          border: '1px solid #333',
                          color: '#aaa',
                          padding: '3px 6px',
                          fontFamily: 'monospace',
                          fontSize: 12,
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>Mission {n}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const sel = document.getElementById(`mission-select-${player.id}`) as HTMLSelectElement;
                          triggerMission(player.id, parseInt(sel.value));
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #7dd3c0',
                          color: '#7dd3c0',
                          padding: '3px 10px',
                          cursor: 'pointer',
                          fontFamily: 'monospace',
                          fontSize: 12,
                        }}
                      >
                        send
                      </button>
                      {triggerState[player.id] && (
                        <span style={{ fontSize: 11, color: triggerState[player.id].startsWith('error') ? '#f87171' : '#7dd3c0' }}>
                          {triggerState[player.id]}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {players.length === 0 && (
          <p style={{ color: '#444', textAlign: 'center', marginTop: 60 }}>
            No players yet.
          </p>
        )}
      </div>
    </div>
  );
}

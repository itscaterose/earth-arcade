import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Starfield } from '@/components/Starfield'

export default function Dashboard() {
  const router = useRouter()
  const { player_id } = router.query

  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState<any>(null)

  useEffect(() => {
    if (player_id) {
      fetch(`/api/player/state?player_id=${player_id}`)
        .then(res => res.json())
        .then(data => {
          setState(data)
          setLoading(false)
        })
    }
  }, [player_id])

  const unlockSecret = async (secretCode: string) => {
    setUnlocking(true)
    
    const res = await fetch('/api/stardust/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id, secret_code: secretCode })
    })
    
    const data = await res.json()
    
    if (data.success) {
      setRevealedSecret(data.secret)
      const newState = await fetch(`/api/player/state?player_id=${player_id}`).then(r => r.json())
      setState(newState)
    } else {
      alert(`${data.error}`)
    }
    
    setUnlocking(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Starfield />
      <div className="label-text opacity-40">◌ ◌ ◌</div>
    </div>
  )

  if (revealedSecret) return (
    <div className="min-h-screen py-20 px-10">
      <Starfield />
      <div className="max-w-[680px] mx-auto">
        <div className="mb-16 text-center text-[10px] tracking-[6px] opacity-40">
          ✧ SECRET REVEALED ✧
        </div>

        <h1 className="text-3xl mb-12 text-center font-semibold text-[var(--accent-primary)] leading-tight">
          {revealedSecret.title}
        </h1>

        <div className="whitespace-pre-wrap mb-20 opacity-90 leading-relaxed">
          {revealedSecret.content}
        </div>

        <div className="text-center">
          <button
            onClick={() => setRevealedSecret(null)}
            className="px-12 py-4 bg-transparent border border-[var(--border-primary)] text-[var(--accent-primary)] text-[11px] tracking-[3px] uppercase font-medium hover:border-[var(--accent-primary)] hover:opacity-100 opacity-80 transition-all"
          >
            Return
          </button>
        </div>
      </div>
    </div>
  )

  const revealedCount = state.secrets.filter((s: any) => s.unlocked).length

  return (
    <div className="min-h-screen py-16 px-10 pb-32">
      <Starfield />
      <div className="max-w-[900px] mx-auto">

        {/* Header - Player Identity */}
        <div className="mb-20 pb-10 border-b border-[var(--border-secondary)]">
          <div className="label-text mb-3">Player</div>
          <div className="text-2xl mb-2 font-semibold tracking-tight">
            {state.player.email.split('@')[0]}
          </div>
          <div className="text-xs opacity-40">
            Arc 1 • {revealedCount} {revealedCount === 1 ? 'Secret' : 'Secrets'} Revealed
          </div>
        </div>

        {/* Giant Stardust Balance */}
        <div className="text-center mb-24 pb-16 border-b border-[var(--border-secondary)]">
          <div className="text-6xl tracking-tight text-[var(--accent-primary)] font-bold leading-none uppercase">
            {'<*> STARDUST <*>'}
          </div>
          <div className="text-6xl tracking-tight font-bold leading-none mt-2">
            {state.player.stardust_balance}
          </div>
        </div>

        {/* Secrets Grid */}
        <div className="label-text mb-8 text-center">
          Secrets
        </div>

        <div className="grid gap-[1px] bg-[var(--border-faint)] border border-[var(--border-faint)]">
          {state.secrets.map((secret: any) => {
            const canAfford = state.player.stardust_balance >= secret.cost

            return (
              <div
                key={secret.id}
                className={`p-10 bg-[var(--bg-primary)] transition-all ${
                  secret.unlocked ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div className={`text-lg mb-3 font-semibold leading-snug ${
                  secret.unlocked ? 'text-[var(--accent-primary)]' : ''
                }`}>
                  {secret.unlocked ? secret.title : '◌ ◌ ◌'}
                </div>

                <div className="text-[11px] mb-7 opacity-50 tracking-[2px]">
                  {secret.cost} STARDUST
                </div>

                {secret.unlocked ? (
                  <div className="text-[10px] tracking-[3px] opacity-40">
                    ✓ REVEALED
                  </div>
                ) : (
                  <button
                    onClick={() => unlockSecret(secret.code)}
                    disabled={unlocking || !canAfford}
                    className={`
                      px-10 py-4 bg-transparent border text-[11px] tracking-[3px] uppercase font-medium transition-all
                      ${canAfford
                        ? 'border-[var(--border-primary)] text-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:opacity-100 opacity-80 cursor-pointer'
                        : 'border-[var(--border-secondary)] text-[var(--accent-tertiary)] opacity-30 cursor-not-allowed'
                      }
                    `}
                  >
                    {unlocking ? 'Revealing...' : 'Reveal'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
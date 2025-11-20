import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

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
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#7dd3c0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '12px',
      letterSpacing: '3px',
      fontWeight: 300
    }}>
      <div style={{opacity: 0.4}}>◌ ◌ ◌</div>
    </div>
  )

  if (revealedSecret) return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      padding: '80px 40px',
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '16px',
      lineHeight: '1.8',
      maxWidth: '680px',
      margin: '0 auto',
      fontWeight: 400
    }}>
      <div style={{
        marginBottom: '60px', 
        textAlign: 'center', 
        fontSize: '10px', 
        letterSpacing: '6px', 
        opacity: 0.4,
        fontWeight: 400
      }}>
        ✧ SECRET REVEALED ✧
      </div>
      
      <h1 style={{
        fontSize: '28px',
        marginBottom: '50px',
        textAlign: 'center',
        letterSpacing: '0px',
        fontWeight: 600,
        color: '#7dd3c0',
        lineHeight: '1.3'
      }}>
        {revealedSecret.title}
      </h1>
      
      <div style={{
        whiteSpace: 'pre-wrap',
        marginBottom: '80px',
        opacity: 0.9,
        letterSpacing: '0px',
        fontWeight: 400
      }}>
        {revealedSecret.content}
      </div>
      
      <div style={{textAlign: 'center'}}>
        <button 
          onClick={() => setRevealedSecret(null)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(125, 211, 192, 0.4)',
            color: '#7dd3c0',
            padding: '16px 50px',
            cursor: 'pointer',
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: '11px',
            letterSpacing: '3px',
            transition: 'all 0.3s ease',
            opacity: 0.8,
            fontWeight: 500
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.borderColor = 'rgba(125, 211, 192, 0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8'
            e.currentTarget.style.borderColor = 'rgba(125, 211, 192, 0.4)'
          }}
        >
          RETURN
        </button>
      </div>
    </div>
  )

  const revealedCount = state.secrets.filter((s: any) => s.unlocked).length

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      padding: '60px 40px 120px',
      fontFamily: '"Space Grotesk", sans-serif'
    }}>
      <div style={{maxWidth: '900px', margin: '0 auto'}}>
        
        {/* Header - Player Identity */}
        <div style={{
          marginBottom: '80px',
          paddingBottom: '40px',
          borderBottom: '1px solid rgba(125, 211, 192, 0.1)'
        }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '4px',
            marginBottom: '12px',
            opacity: 0.5,
            fontWeight: 400,
            textTransform: 'uppercase'
          }}>
            Player
          </div>
          <div style={{
            fontSize: '24px',
            marginBottom: '6px',
            fontWeight: 600,
            letterSpacing: '-0.5px'
          }}>
            {state.player.email.split('@')[0]}
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.4,
            fontWeight: 400
          }}>
            Arc 1 • {revealedCount} {revealedCount === 1 ? 'Secret' : 'Secrets'} Revealed
          </div>
        </div>

        {/* Giant Stardust Balance */}
        <div style={{
          textAlign: 'center',
          marginBottom: '100px',
          paddingBottom: '60px',
          borderBottom: '1px solid rgba(125, 211, 192, 0.1)'
        }}>
          <div style={{
            fontSize: '60px',
            letterSpacing: '-2px',
            color: '#7dd3c0',
            fontWeight: 700,
            lineHeight: '1',
            textTransform: 'uppercase'
          }}>
            {'<*> STARDUST <*>'}
          </div>
          <div style={{
            fontSize: '60px',
            letterSpacing: '-2px',
            color: '#ffffff',
            fontWeight: 700,
            lineHeight: '1'
          }}>
            {state.player.stardust_balance}
          </div>
        </div>

        {/* Secrets Grid */}
        <div style={{
          fontSize: '11px',
          letterSpacing: '4px',
          marginBottom: '30px',
          opacity: 0.5,
          fontWeight: 400,
          textTransform: 'uppercase',
          textAlign: 'center'
        }}>
          Secrets
        </div>

        <div style={{
          display: 'grid',
          gap: '1px',
          background: 'rgba(125, 211, 192, 0.08)',
          border: '1px solid rgba(125, 211, 192, 0.08)'
        }}>
          {state.secrets.map((secret: any) => (
            <div key={secret.id} style={{
              padding: '40px 35px',
              background: '#0a0a0a',
              position: 'relative',
              transition: 'all 0.3s ease',
              opacity: secret.unlocked ? 0.4 : 1
            }}>
              <div style={{
                fontSize: '17px',
                marginBottom: '10px',
                letterSpacing: '0px',
                color: secret.unlocked ? '#7dd3c0' : '#ffffff',
                fontWeight: 600,
                lineHeight: '1.4'
              }}>
                {secret.unlocked ? secret.title : `◌ ◌ ◌`}
              </div>
              
              <div style={{
                fontSize: '11px',
                marginBottom: '28px',
                opacity: 0.5,
                letterSpacing: '2px',
                fontWeight: 400
              }}>
                {secret.cost} STARDUST
              </div>
              
              {secret.unlocked ? (
                <div style={{
                  fontSize: '10px',
                  letterSpacing: '3px',
                  opacity: 0.4,
                  fontWeight: 400
                }}>
                  ✓ REVEALED
                </div>
              ) : (
                <button 
                  onClick={() => unlockSecret(secret.code)}
                  disabled={unlocking || state.player.stardust_balance < secret.cost}
                  style={{
                    background: 'transparent',
                    border: state.player.stardust_balance >= secret.cost 
                      ? '1px solid rgba(125, 211, 192, 0.4)' 
                      : '1px solid rgba(125, 211, 192, 0.1)',
                    color: state.player.stardust_balance >= secret.cost ? '#7dd3c0' : 'rgba(125, 211, 192, 0.3)',
                    padding: '14px 40px',
                    cursor: state.player.stardust_balance >= secret.cost ? 'pointer' : 'not-allowed',
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: '11px',
                    letterSpacing: '3px',
                    transition: 'all 0.3s ease',
                    opacity: state.player.stardust_balance >= secret.cost ? 0.8 : 0.3,
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => {
                    if (state.player.stardust_balance >= secret.cost) {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.borderColor = 'rgba(125, 211, 192, 0.8)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (state.player.stardust_balance >= secret.cost) {
                      e.currentTarget.style.opacity = '0.8'
                      e.currentTarget.style.borderColor = 'rgba(125, 211, 192, 0.4)'
                    }
                  }}
                >
                  {unlocking ? 'REVEALING...' : 'REVEAL'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
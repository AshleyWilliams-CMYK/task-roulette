import { useState, useEffect, useRef } from 'react'

const FISH_HEADING = -90
const HEAD_X = 58
const HEAD_Y = 75

function shortestArc(from, to) {
  let d = ((to - from + 180) % 360 + 360) % 360 - 180
  return d
}

export default function KoiFishCursor() {
  const [pos,       setPos]      = useState({ x: -300, y: -300 })
  const [mousePos,  setMousePos] = useState({ x: -300, y: -300 })
  const [rotation,  setRot]      = useState(0)
  const [wobbleDur, setWobble]   = useState(2)
  const [hovering,  setHovering] = useState(false)

  const state = useRef({
    // actual mouse
    mouseX: -300, mouseY: -300,
    px: -300, py: -300,
    // fish display position (lerped)
    fishX: -300, fishY: -300,
    // rotation
    currentRot: 0,
    targetRot: 0,
    speed: 0,
    // hover drift
    hovering: false,
    driftX: 0, driftY: 0,
    raf: null,
  }).current

  useEffect(() => {
    const loop = () => {
      if (state.hovering) {
        // drift fish slowly toward random target
        state.fishX += (state.driftX - state.fishX) * 0.008
        state.fishY += (state.driftY - state.fishY) * 0.008
        // point fish toward drift direction
        const dx = state.driftX - state.fishX
        const dy = state.driftY - state.fishY
        if (Math.hypot(dx, dy) > 5) {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI)
          state.targetRot += shortestArc(state.targetRot, angle - FISH_HEADING) * 0.08
        }
      } else {
        const dx = state.mouseX - state.fishX
        const dy = state.mouseY - state.fishY
        const dist = Math.hypot(dx, dy)
        if (dist < 2) {
          state.fishX = state.mouseX
          state.fishY = state.mouseY
        } else {
          // return to mouse — faster the farther away it is
          const t = Math.min(0.18, 0.04 + dist * 0.002)
          state.fishX += dx * t
          state.fishY += dy * t
          // point fish toward mouse while returning
          if (dist > 25) {
            const angle = Math.atan2(dy, dx) * (180 / Math.PI)
            state.targetRot += shortestArc(state.targetRot, angle - FISH_HEADING) * 0.1
          }
        }
      }

      setPos({ x: state.fishX, y: state.fishY })

      const diff = shortestArc(state.currentRot, state.targetRot)
      state.currentRot += diff * 0.12
      setRot(state.currentRot)

      state.speed *= 0.94
      setWobble(Math.max(0.4, 2 / (1 + state.speed * 0.19)))

      state.raf = requestAnimationFrame(loop)
    }
    state.raf = requestAnimationFrame(loop)

    const onMove = e => {
      const dx = e.clientX - state.px
      const dy = e.clientY - state.py
      state.px = e.clientX
      state.py = e.clientY
      state.mouseX = e.clientX
      state.mouseY = e.clientY
      setMousePos({ x: e.clientX, y: e.clientY })

      if (!state.hovering) {
        const spd = Math.sqrt(dx * dx + dy * dy)
        if (spd > state.speed) state.speed = spd
        const dist = Math.hypot(state.mouseX - state.fishX, state.mouseY - state.fishY)
        if (spd >= 1.5 && dist < 30) {
          const travelDeg = Math.atan2(dy, dx) * (180 / Math.PI)
          state.targetRot += shortestArc(state.targetRot, travelDeg - FISH_HEADING) * 0.25
        }
      }
    }

    const onHover = e => {
      const isInteractive = !!e.target.closest('button, input, textarea, select, a, [role="button"]')
      if (isInteractive === state.hovering) return
      state.hovering = isInteractive
      setHovering(isInteractive)
      if (isInteractive) {
        const angle = Math.random() * Math.PI * 2
        const dist  = 180 + Math.random() * 150
        state.driftX = state.mouseX + Math.cos(angle) * dist
        state.driftY = state.mouseY + Math.sin(angle) * dist
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onHover)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onHover)
      cancelAnimationFrame(state.raf)
    }
  }, [])

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <clipPath id="kgif-crop">
            <rect x="0" y="0" width="120" height="93" />
          </clipPath>
          <filter id="kgif-blue" colorInterpolationFilters="sRGB"
            x="0" y="0" width="100%" height="100%">
            <feColorMatrix type="matrix" result="masked"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      -1.5 -1.5 -1.5 0 4.2"/>
            <feColorMatrix type="matrix" in="masked"
              values="0 0 0 0 0.20
                      0 0 0 0 0.45
                      0 0 0 0 0.80
                      0 0 0 1 0"/>
          </filter>
          <filter id="kgif-fill" colorInterpolationFilters="sRGB"
            x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix type="matrix" result="mask"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      -1.5 -1.5 -1.5 0 4.2"/>
            <feMorphology operator="dilate" radius="8" in="mask" result="dilated"/>
            <feMorphology operator="erode"  radius="8" in="dilated" result="filled"/>
            <feFlood floodColor="#3A6280" floodOpacity="0.5" result="color"/>
            <feComposite operator="in" in="color" in2="filled"/>
          </filter>
        </defs>
      </svg>

      {/* Blue circle cursor shown over interactive elements */}
      {hovering && (
        <div style={{
          position: 'fixed',
          left: mousePos.x - 8,
          top:  mousePos.y - 8,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#3A6280',
          pointerEvents: 'none',
          zIndex: 100000,
        }} />
      )}

      {/* Fish cursor */}
      <div style={{
        position: 'fixed',
        left: pos.x,
        top:  pos.y,
        pointerEvents: 'none',
        zIndex: 99999,
        transformOrigin: '0px 0px',
        transform: `rotate(${rotation}deg)`,
      }}>
        <div style={{
          position: 'absolute',
          left: -HEAD_X,
          top:  -HEAD_Y,
          transform: 'scaleY(-1)',
          transformOrigin: `${HEAD_X}px ${HEAD_Y}px`,
        }}>
          <div style={{
            animation: `kfishWobble ${wobbleDur}s ease-in-out infinite alternate`,
            transformOrigin: `${HEAD_X}px ${HEAD_Y}px`,
          }}>
            <style>{`
              @keyframes kfishWobble {
                0%   { transform: rotate(-6deg) scaleX(0.97); }
                100% { transform: rotate(6deg)  scaleX(1.03); }
              }
            `}</style>
            <img
              src="/fishgif.gif"
              width="120"
              height="120"
              alt=""
              style={{ display: 'block', filter: 'url(#kgif-fill)', clipPath: 'url(#kgif-crop)' }}
            />
            <img
              src="/fishgif.gif"
              width="120"
              height="120"
              alt=""
              style={{ display: 'block', position: 'absolute', top: 0, left: 0, filter: 'url(#kgif-blue)', clipPath: 'url(#kgif-crop)' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

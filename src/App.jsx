import { useState, useRef, useEffect } from 'react'
import './App.css'
import KoiFishCursor from './KoiFishCursor'
import confetti from 'canvas-confetti'

const BUTTON_COUNT = 14
const GRID = 10
const MINES = 15

function getNeighbors(idx) {
  const row = Math.floor(idx / GRID), col = idx % GRID
  const out = []
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (dr === 0 && dc === 0) continue
    const r = row + dr, c = col + dc
    if (r >= 0 && r < GRID && c >= 0 && c < GRID) out.push(r * GRID + c)
  }
  return out
}

function makeBoard() {
  const cells = Array.from({ length: GRID * GRID }, (_, i) => ({
    i, mine: false, revealed: false, flagged: false, adjacent: 0,
  }))
  let placed = 0
  while (placed < MINES) {
    const idx = Math.floor(Math.random() * cells.length)
    if (!cells[idx].mine) { cells[idx].mine = true; placed++ }
  }
  cells.forEach((c, i) => {
    if (!c.mine) c.adjacent = getNeighbors(i).filter(n => cells[n].mine).length
  })
  return cells
}

const NUM_COLORS = ['', '#1A2023', '#1A2023', '#1A2023', '#1A2023', '#1A2023', '#1A2023', '#1A2023', '#1A2023']

function LoserScreen({ onRedeem, onReset }) {
  const [showRedeem, setShowRedeem] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [showStart, setShowStart] = useState(false)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [running, setRunning] = useState(false)
  const [transPhase, setTransPhase] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setShowRedeem(true), 2200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!showTimer) { setShowStart(false); return }
    const t = setTimeout(() => setShowStart(true), 5000)
    return () => clearTimeout(t)
  }, [showTimer])

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  useEffect(() => {
    if (secondsLeft === 0) {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } })
      setTimeout(() => onReset(), 1200)
    }
  }, [secondsLeft])

  function startTimer() {
    const total = hours * 3600 + minutes * 60
    if (total <= 0) return
    setSecondsLeft(total)
    setRunning(true)
  }

  function handleRedemptionClick() {
    setTransPhase('light')
    setTimeout(() => {
      setTransPhase('red')
      startTimer()
    }, 1000)
  }

  function resetTimer() {
    clearInterval(intervalRef.current)
    setRunning(false)
    setSecondsLeft(null)
  }

  const displayH = secondsLeft != null ? Math.floor(secondsLeft / 3600) : hours
  const displayM = secondsLeft != null ? Math.floor((secondsLeft % 3600) / 60) : minutes
  const displayS = secondsLeft != null ? secondsLeft % 60 : 0

  return (
    <div className="loser-screen">
      <p className="loser-text">LOSER</p>
      {showRedeem && (
        <button className="redeem-btn" onClick={() => setShowTimer(t => !t)}>redeem aura?</button>
      )}
      {showTimer && (<>
        <div className="countdown-wrap">
          {!running && secondsLeft === null ? (
            <div className="countdown-set">
              <div className="countdown-inputs">
                <div className="countdown-field">
                  <button onClick={() => setHours(h => Math.min(23, h + 1))}>▲</button>
                  <input
                    className="countdown-input"
                    type="number"
                    min="0" max="23"
                    value={String(hours).padStart(2, '0')}
                    onChange={e => setHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                  />
                  <button onClick={() => setHours(h => Math.max(0, h - 1))}>▼</button>
                  <label>hrs</label>
                </div>
                <span className="countdown-colon">:</span>
                <div className="countdown-field">
                  <button onClick={() => setMinutes(m => Math.min(59, m + 1))}>▲</button>
                  <input
                    className="countdown-input"
                    type="number"
                    min="0" max="59"
                    value={String(minutes).padStart(2, '0')}
                    onChange={e => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  />
                  <button onClick={() => setMinutes(m => Math.max(0, m - 1))}>▼</button>
                  <label>min</label>
                </div>
              </div>
            </div>
          ) : (
            <div className="countdown-running">
              <span className="countdown-display">
                {String(displayH).padStart(2, '0')}:{String(displayM).padStart(2, '0')}:{String(displayS).padStart(2, '0')}
              </span>
              {secondsLeft === 0 && <p className="countdown-done">time's up!</p>}
            </div>
          )}
        </div>
        {!running && secondsLeft === null && showStart && (
          <button className="countdown-start" onClick={handleRedemptionClick}>your journey to redemption begins now...</button>
        )}
      </>)}

      {transPhase && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999998, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#D6DAD2' }} />
          {transPhase === 'red' && (<>
            <div style={{
              position: 'absolute', inset: 0,
              background: '#761214',
              animation: 'redFill 0.85s ease-out forwards',
            }} />
            {secondsLeft != null && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1A2023',
                fontSize: 'min(20vw, 20vh)',
                fontFamily: "'StarryType', sans-serif",
                letterSpacing: '2px',
                userSelect: 'none',
              }}>
                {String(Math.floor(secondsLeft / 3600)).padStart(2, '0')}:{String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
              </div>
            )}
            <button
              style={{
                position: 'absolute', bottom: 24, left: 24,
                fontFamily: "'StarryType', sans-serif",
                fontSize: '1rem',
                color: '#D6DAD2',
                background: 'none',
                border: 'none',
                letterSpacing: '2px',
                animation: 'blink 1.2s step-start infinite',
                opacity: 0.8,
                padding: '4px 18px',
                pointerEvents: 'auto',
              }}
              onClick={() => {
                confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } })
                setTimeout(() => onRedeem(), 1200)
              }}
            >are you feeling auralicious?</button>
          </>)}
        </div>
      )}
    </div>
  )
}

function Minesweeper({ onClose, onLose }) {
  const [board, setBoard] = useState(makeBoard)
  const [status, setStatus] = useState('playing')

  function reveal(idx) {
    if (status !== 'playing') return
    const cell = board[idx]
    if (cell.revealed || cell.flagged) return
    const next = board.map(c => ({ ...c }))
    if (next[idx].mine) {
      onLose(); return
    }
    const stack = [idx], seen = new Set()
    while (stack.length) {
      const i = stack.pop()
      if (seen.has(i)) continue
      seen.add(i); next[i].revealed = true
      if (next[i].adjacent === 0) getNeighbors(i).forEach(n => { if (!seen.has(n) && !next[n].flagged) stack.push(n) })
    }
    const won = next.every(c => c.mine || c.revealed)
    setBoard(next); if (won) setStatus('won')
  }

  function flag(e, idx) {
    e.preventDefault()
    if (status !== 'playing') return
    const cell = board[idx]
    if (cell.revealed) return
    const next = board.map(c => ({ ...c }))
    next[idx].flagged = !next[idx].flagged
    setBoard(next)
  }

  const flagsLeft = MINES - board.filter(c => c.flagged).length

  return (
    <div className="ms-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ms-modal">
        <button className="ms-close" onClick={onClose}>✕</button>
        <div className="ms-header">
          <span className="ms-counter">💣 {flagsLeft}</span>
          <button className="ms-face" onClick={() => { setBoard(makeBoard()); setStatus('playing') }}>
            {status === 'won' ? '😎' : status === 'lost' ? '😵' : '😋'}
          </button>
          <span className="ms-counter">🚩 {board.filter(c => c.flagged).length}</span>
        </div>
        <div className="ms-grid">
          {board.map((cell, i) => (
            <button
              key={i}
              className={`ms-cell${cell.revealed ? ' ms-revealed' : ''}${cell.revealed && cell.mine ? ' ms-mine' : ''}`}
              onClick={() => reveal(i)}
              onContextMenu={e => flag(e, i)}
            >
              {!cell.revealed && cell.flagged ? '🚩'
                : cell.revealed && cell.mine ? '💣'
                : cell.revealed && cell.adjacent > 0
                  ? <span style={{ color: NUM_COLORS[cell.adjacent] }}>{cell.adjacent}</span>
                  : null}
            </button>
          ))}
        </div>
        {status === 'won' && <p className="ms-msg ms-win">you won! 🎉</p>}
      </div>
    </div>
  )
}


function burstColor() {
  const r = Math.random()
  if (r < 0.20) return [220, 235, 245]   // very light
  if (r < 0.38) return [155, 190, 215]   // light
  if (r < 0.55) return [100, 150, 185]   // mid-light
  if (r < 0.70) return [56,  98,  128]   // base #386280
  if (r < 0.82) return [38,  72,  100]   // mid-dark
  if (r < 0.91) return [22,  48,   72]   // dark
  return          [10,  28,   48]        // very dark
}

function BurstCanvas({ triggerKey, origin }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!triggerKey || !origin) return
    const canvas = canvasRef.current
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    const { x: cx, y: cy } = origin

    // build particles
    const particles = []

    // long light streaks
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 12
      const [r, g, b] = burstColor()
      particles.push({
        type: 'streak',
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        tailLen: 6 + Math.random() * 14,
        life: 1,
        decay: 0.007 + Math.random() * 0.008,
        r, g, b,
        width: 0.4 + Math.random() * 1.2,
      })
    }

    // glinting dot particles
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.5 + Math.random() * 8
      const [r, g, b] = burstColor()
      particles.push({
        type: 'dot',
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 0.8 + Math.random() * 2.5,
        life: 1,
        decay: 0.005 + Math.random() * 0.009,
        r, g, b,
      })
    }

    let startTime = null
    let animId

    const draw = (ts) => {
      if (!startTime) startTime = ts
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // central glow
      const elapsed = ts - startTime
      const glowAlpha = Math.max(0, 1 - elapsed / 700)
      if (glowAlpha > 0) {
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60)
        grd.addColorStop(0, `rgba(255,255,255,${glowAlpha * 0.9})`)
        grd.addColorStop(0.4, `rgba(230,220,255,${glowAlpha * 0.4})`)
        grd.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(cx, cy, 60, 0, Math.PI * 2)
        ctx.fill()
      }

      let anyAlive = false

      for (const p of particles) {
        p.vx *= 0.97
        p.vy *= 0.97
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.015
        p.life -= p.decay
        if (p.life <= 0) continue
        anyAlive = true

        ctx.globalAlpha = Math.pow(p.life, 1.5)

        if (p.type === 'streak') {
          const tx = p.x - p.vx * p.tailLen
          const ty = p.y - p.vy * p.tailLen
          const grad = ctx.createLinearGradient(tx, ty, p.x, p.y)
          grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0)`)
          grad.addColorStop(1, `rgba(${p.r},${p.g},${p.b},1)`)
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(p.x, p.y)
          ctx.strokeStyle = grad
          ctx.lineWidth = p.width * p.life
          ctx.stroke()
        } else {
          // glowing dot
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
          grd.addColorStop(0, `rgba(${p.r},${p.g},${p.b},1)`)
          grd.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`)
          ctx.fillStyle = grd
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1

      if (anyAlive || glowAlpha > 0) {
        animId = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [triggerKey])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}

let _uid = 100
const uid = () => String(_uid++)

const DEFAULT_FOLDERS = []

const DEFAULT_TASKS = []

function App() {
  const [folders, setFolders] = useState(DEFAULT_FOLDERS)
  const [tasks, setTasks] = useState(DEFAULT_TASKS)
  const [picked, setPicked] = useState(null)
  const [showTask, setShowTask] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newTaskFolder, setNewTaskFolder] = useState('default')
  const [newFolderName, setNewFolderName] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [tab, setTab] = useState('roulette')
  const [btnIndex, setBtnIndex] = useState(1)
  const [burstKey, setBurstKey] = useState(0)
  const [burstOrigin, setBurstOrigin] = useState(null)
  const btnRef = useRef(null)

  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [taskClicked, setTaskClicked] = useState(false)
  const [showMinesweeper, setShowMinesweeper] = useState(false)
  const [loser, setLoser] = useState(false)
  const [loserKey, setLoserKey] = useState(0)
  const [dragTaskId, setDragTaskId] = useState(null)
  const [dragOverFolderId, setDragOverFolderId] = useState(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set())
  const [lastClickedTaskId, setLastClickedTaskId] = useState(null)

  useEffect(() => {
    const urgentHasTasks = tasks.some(t => t.folderId === 'urgent')
    if (!urgentHasTasks) {
      setFolders(prev => prev.filter(f => f.id !== 'urgent'))
    }
  }, [tasks])

  const activeTasks = tasks.filter(t => {
    if (!t.enabled) return false
    const f = folders.find(f => f.id === t.folderId)
    return f ? f.enabled : true
  })

  function pickRandom() {
    if (activeTasks.length === 0 || spinning) return
    const task = activeTasks[Math.floor(Math.random() * activeTasks.length)]
    setPicked(task.name)
    setShowTask(false)
    setSpinning(true)
    setTaskClicked(false)
    setShowMinesweeper(false)
    setLoser(false)
    setBtnIndex(i => (i % BUTTON_COUNT) + 1)
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setBurstOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }
    setBurstKey(k => k + 1)
    setTimeout(() => { setSpinning(false); setShowTask(true) }, 900)
  }

  function addTask(e) {
    e.preventDefault()
    const name = newTask.trim()
    if (!name || tasks.some(t => t.name === name)) return
    setTasks([...tasks, { id: uid(), name, folderId: null, enabled: true }])
    setNewTask('')
  }

  function removeTask(id) {
    const task = tasks.find(t => t.id === id)
    setTasks(tasks.filter(t => t.id !== id))
    if (picked === task?.name) setPicked(null)
  }

  function toggleTask(id) {
    setTasks(prev => {
      const task = prev.find(t => t.id === id)
      const newEnabled = !task.enabled
      if (!newEnabled) {
        setTimeout(() => {
          setTasks(prev2 => {
            const without = prev2.filter(t => t.id !== id)
            const updatedTask = prev2.find(t => t.id === id)
            if (!updatedTask) return prev2
            const lastIdx = without.reduce((acc, t, i) => t.folderId === updatedTask.folderId ? i : acc, -1)
            const result = [...without]
            result.splice(lastIdx + 1, 0, updatedTask)
            return result
          })
        }, 5000)
      }
      return prev.map(t => t.id === id ? { ...t, enabled: newEnabled } : t)
    })
  }

  function moveTask(id, folderId) {
    const idsToMove = selectedTaskIds.has(id) ? [...selectedTaskIds] : [id]
    setTasks(prev => prev.map(t => idsToMove.includes(t.id) ? { ...t, folderId } : t))
  }

  function handleTaskClick(e, taskId, sectionTasks) {
    if (e.target.closest('button')) return
    if (e.ctrlKey || e.metaKey) {
      setSelectedTaskIds(prev => {
        const next = new Set(prev)
        next.has(taskId) ? next.delete(taskId) : next.add(taskId)
        return next
      })
      setLastClickedTaskId(taskId)
    } else if (e.shiftKey && lastClickedTaskId) {
      const ids = sectionTasks.map(t => t.id)
      const fromIdx = ids.indexOf(lastClickedTaskId)
      const toIdx = ids.indexOf(taskId)
      if (fromIdx !== -1 && toIdx !== -1) {
        const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
        setSelectedTaskIds(prev => {
          const next = new Set(prev)
          ids.slice(start, end + 1).forEach(id => next.add(id))
          return next
        })
      }
    } else {
      if (selectedTaskIds.has(taskId)) {
        setSelectedTaskIds(prev => { const next = new Set(prev); next.delete(taskId); return next })
      } else {
        setSelectedTaskIds(new Set([taskId]))
        setLastClickedTaskId(taskId)
      }
    }
  }

  function starTask(id) {
    const task = tasks.find(t => t.id === id)
    if (task.folderId === 'urgent') {
      const returnFolder = task.originalFolderId || 'default'
      setTasks(prev => prev.map(t => t.id === id ? { ...t, folderId: returnFolder, originalFolderId: null } : t))
    } else {
      const urgentExists = folders.some(f => f.id === 'urgent')
      if (!urgentExists) {
        setFolders(prev => [{ id: 'urgent', name: 'urgent', enabled: true, collapsed: false }, ...prev])
      }
      setTasks(prev => prev.map(t => t.id === id ? { ...t, folderId: 'urgent', originalFolderId: t.folderId } : t))
    }
  }

  function addFolder() {
    const name = `folder ${folders.filter(f => f.id !== 'urgent').length}`.toLowerCase()
    const newFolder = { id: uid(), name, enabled: true, collapsed: false }
    setFolders(prev => [...prev, newFolder])
    setTimeout(() => setEditingFolderId(newFolder.id) || setEditingFolderName(name), 50)
  }

  function removeFolder(id) {
    setFolders(folders.filter(f => f.id !== id))
    setTasks(tasks.map(t => t.folderId === id ? { ...t, folderId: null } : t))
  }

  function toggleFolder(id) {
    setFolders(folders.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
  }

  function toggleCollapse(id) {
    setFolders(folders.map(f => f.id === id ? { ...f, collapsed: !f.collapsed } : f))
  }

  function startRename(folder) {
    setEditingFolderId(folder.id)
    setEditingFolderName(folder.name)
  }

  function commitRename(id) {
    const name = editingFolderName.trim()
    if (name) setFolders(folders.map(f => f.id === id ? { ...f, name: name.toLowerCase() } : f))
    setEditingFolderId(null)
  }

  return (
    <div className="app">
      <KoiFishCursor />
      {loser && <LoserScreen key={loserKey} onRedeem={() => { setLoser(false); setShowMinesweeper(false); setTaskClicked(false) }} onReset={() => setLoserKey(k => k + 1)} />}
      <BurstCanvas triggerKey={burstKey} origin={burstOrigin} />

      <h1>task roulette</h1>

      <nav className="tabs">
        <button
          className={tab === 'roulette' ? 'tab active' : 'tab'}
          onClick={() => setTab('roulette')}
        >roulette</button>
        <button
          className={tab === 'tasks' ? 'tab active' : 'tab'}
          onClick={() => setTab('tasks')}
        >tasks</button>
      </nav>

      {tab === 'roulette' && (
        <div className="roulette-view">
          <div className="btn-wrap" ref={btnRef}>
            <button
              className={`ceramic-btn${spinning ? ' spinning' : ''}`}
              onClick={pickRandom}
              disabled={activeTasks.length === 0 || spinning}
              aria-label="pick a random task"
            >
              <img src={`/button${btnIndex}.png`} alt="ceramic button" draggable="false" />
            </button>
          </div>

          {spinning && <p className="hint picking">picking…</p>}

          {showTask && picked && (
            <div
              className={`task-reveal${!taskClicked ? ' clickable' : ''}`}
              onClick={() => { if (!taskClicked) setTaskClicked(true) }}
            >
              <span>{picked}</span>
            </div>
          )}

          {showTask && picked && taskClicked && (
            <button className="accept-btn" onClick={() => setShowMinesweeper(true)}>
              are you up for the challenge ;)
            </button>
          )}

          {showMinesweeper && (
            <Minesweeper
              onClose={() => setShowMinesweeper(false)}
              onLose={() => { setShowMinesweeper(false); setLoser(true) }}
            />
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <section className="task-list-section">
          <form className="add-form" onSubmit={addTask}>
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="add a task…"
            />

            <button className="add-folder-btn" onClick={addFolder} type="button">
              <img src="/folder.png" alt="add folder" />
            </button>
          </form>

          {(() => {
            const standaloneTasks = tasks
              .filter(t => t.folderId === null)
              .sort((a, b) => {
                if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
                return a.name.localeCompare(b.name)
              })
            return standaloneTasks.length > 0 && (
              <ul className="task-list">
                {standaloneTasks.map(task => (
                  <li
                    key={task.id}
                    className={`${picked === task.name ? 'active' : ''}${!task.enabled ? ' task-off' : ''}${selectedTaskIds.has(task.id) ? ' task-selected' : ''}`}
                    draggable
                    onClick={e => handleTaskClick(e, task.id, standaloneTasks)}
                    onDragStart={() => setDragTaskId(task.id)}
                    onDragEnd={() => { setDragTaskId(null); setDragOverFolderId(null) }}
                  >
                    <span className="drag-handle">⠿</span>
                    <button
                      className={`toggle-btn small${task.enabled ? ' toggle-on' : ' toggle-off'}`}
                      onClick={() => toggleTask(task.id)}
                    >{task.enabled ? '✓' : '✕'}</button>
                    <button className={`star-btn${task.folderId === 'urgent' ? ' star-active' : ''}`} onClick={() => starTask(task.id)} title="move to URGENT">{task.folderId === 'urgent' ? '★' : '☆'}</button>
                    <span>{task.name}</span>
                    <button className="remove-btn" onClick={() => removeTask(task.id)}>✕</button>
                  </li>
                ))}
              </ul>
            )
          })()}

          {[...folders].sort((a, b) => {
            if (a.id === 'urgent') return -1
            if (b.id === 'urgent') return 1
            return a.name.localeCompare(b.name)
          }).map(folder => {
            const folderTasks = tasks
              .filter(t => t.folderId === folder.id)
              .sort((a, b) => {
                if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
                return a.name.localeCompare(b.name)
              })
            const isDragTarget = dragOverFolderId === folder.id && dragTaskId !== null
            return (
              <div key={folder.id} className={`folder-section${!folder.enabled ? ' folder-off' : ''}${folder.id === 'urgent' ? ' urgent-folder' : ''}`}>
                <div
                  className={`folder-header${isDragTarget ? ' drag-over' : ''}${folder.id === 'urgent' ? ' urgent-header' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOverFolderId(folder.id) }}
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={() => {
                    if (dragTaskId) moveTask(dragTaskId, folder.id)
                    setDragTaskId(null)
                    setDragOverFolderId(null)
                  }}
                >
                  <button className="collapse-btn" onClick={() => toggleCollapse(folder.id)}>
                    {folder.collapsed ? '▸' : '▾'}
                  </button>
                  <button
                    className={`toggle-btn folder-face-btn${folder.enabled ? ' toggle-on' : ' toggle-off'}`}
                    onClick={() => toggleFolder(folder.id)}
                    title={folder.enabled ? 'enabled' : 'disabled'}
                  >
                    {folder.enabled ? (
                      <svg viewBox="0 0 36 36" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="18" cy="18" r="15"/>
                        <circle cx="13" cy="15" r="1.5" fill="currentColor" stroke="none"/>
                        <circle cx="23" cy="15" r="1.5" fill="currentColor" stroke="none"/>
                        <path d="M12 22 Q18 28 24 22"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 36 36" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="18" cy="18" r="15"/>
                        <path d="M11 14 Q13 12 15 14"/>
                        <path d="M21 14 Q23 12 25 14"/>
                        <circle cx="13.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>
                        <circle cx="22.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>
                        <path d="M12 25 Q18 20 24 25"/>
                      </svg>
                    )}
                  </button>
                  {editingFolderId === folder.id ? (
                    <input
                      className="folder-rename-input"
                      value={editingFolderName}
                      autoFocus
                      onChange={e => setEditingFolderName(e.target.value.toLowerCase())}
                      onBlur={() => commitRename(folder.id)}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(folder.id); if (e.key === 'Escape') setEditingFolderId(null) }}
                    />
                  ) : (
                    <span className="folder-name" title="click to rename" onClick={() => startRename(folder)}>{folder.name}</span>
                  )}
                  <span className="folder-count">{folderTasks.length}</span>
                  {folder.id !== 'default' && (
                    <button className="remove-btn" onClick={() => removeFolder(folder.id)}>✕</button>
                  )}
                </div>
                {!folder.collapsed && <ul className="task-list">
                  {folderTasks.map(task => (
                    <li
                      key={task.id}
                      className={`${picked === task.name ? 'active' : ''}${!task.enabled ? ' task-off' : ''}${selectedTaskIds.has(task.id) ? ' task-selected' : ''}`}
                      draggable
                      onClick={e => handleTaskClick(e, task.id, folderTasks)}
                      onDragStart={() => setDragTaskId(task.id)}
                      onDragEnd={() => { setDragTaskId(null); setDragOverFolderId(null) }}
                    >
                      <span className="drag-handle">⠿</span>
                      <button
                        className={`toggle-btn small${task.enabled ? ' toggle-on' : ' toggle-off'}`}
                        onClick={() => toggleTask(task.id)}
                      >{task.enabled ? '✓' : '✕'}</button>
                      <button className={`star-btn${task.folderId === 'urgent' ? ' star-active' : ''}`} onClick={() => starTask(task.id)} title="move to URGENT">{task.folderId === 'urgent' ? '★' : '☆'}</button>
                      <span>{task.name}</span>
                      <button className="remove-btn" onClick={() => removeTask(task.id)}>✕</button>
                    </li>
                  ))}
                </ul>}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}

export default App

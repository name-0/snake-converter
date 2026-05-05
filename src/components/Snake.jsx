import { useEffect, useRef, useState, useCallback } from 'react'

const CELL = 20
const COLS = 20
const ROWS = 20
const W = CELL * COLS
const H = CELL * ROWS

const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }

function rand() {
  return { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
}

export default function Snake() {
  const canvas = useRef(null)
  const state = useRef({
    snake: [{ x: 10, y: 10 }],
    dir: [1, 0],
    food: rand(),
    running: false,
    score: 0,
  })
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)
  const [started, setStarted] = useState(false)

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const { snake, food } = state.current
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#e94560'
    ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4)
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#4ade80' : '#16a34a'
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2)
    })
  }, [])

  const tick = useCallback(() => {
    const s = state.current
    if (!s.running) return
    const head = { x: s.snake[0].x + s.dir[0], y: s.snake[0].y + s.dir[1] }
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || s.snake.some(p => p.x === head.x && p.y === head.y)) {
      s.running = false
      setOver(true)
      return
    }
    s.snake.unshift(head)
    if (head.x === s.food.x && head.y === s.food.y) {
      s.score++
      setScore(s.score)
      s.food = rand()
    } else {
      s.snake.pop()
    }
    draw()
  }, [draw])

  useEffect(() => {
    draw()
    const onKey = (e) => {
      if (DIRS[e.key]) {
        e.preventDefault()
        const [dx, dy] = DIRS[e.key]
        const [cx, cy] = state.current.dir
        if (dx !== -cx || dy !== -cy) state.current.dir = [dx, dy]
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draw])

  useEffect(() => {
    if (!started || over) return
    const id = setInterval(tick, 120)
    return () => clearInterval(id)
  }, [started, over, tick])

  const start = () => {
    state.current = { snake: [{ x: 10, y: 10 }], dir: [1, 0], food: rand(), running: true, score: 0 }
    setScore(0)
    setOver(false)
    setStarted(true)
    draw()
  }

  const dpad = (key) => {
    if (DIRS[key]) {
      const [dx, dy] = DIRS[key]
      const [cx, cy] = state.current.dir
      if (dx !== -cx || dy !== -cy) state.current.dir = [dx, dy]
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ marginBottom: 8 }}>Score: <strong>{score}</strong> · Use arrow keys or buttons below</p>
      <canvas ref={canvas} width={W} height={H} style={{ border: '2px solid #333', borderRadius: 4, display: 'block', margin: '0 auto' }} />
      {(over || !started) && (
        <div style={{ marginTop: 12 }}>
          {over && <p style={{ color: '#e94560' }}>Game Over! Score: {score}</p>}
          <button onClick={start} style={{ padding: '8px 24px', background: '#4ade80', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
            {over ? 'Play Again' : 'Start Game'}
          </button>
        </div>
      )}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: 4, justifyContent: 'center' }}>
        {[['', 'ArrowUp', ''], ['ArrowLeft', 'ArrowDown', 'ArrowRight']].map((row, i) =>
          row.map((key, j) => (
            <button key={i + '-' + j} onClick={() => key && dpad(key)}
              style={{ height: 44, background: key ? '#333' : 'transparent', color: '#fff', border: 'none', borderRadius: 6, cursor: key ? 'pointer' : 'default', fontSize: 18 }}>
              {key === 'ArrowUp' ? '↑' : key === 'ArrowDown' ? '↓' : key === 'ArrowLeft' ? '←' : key === 'ArrowRight' ? '→' : ''}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

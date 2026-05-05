import { useEffect, useRef, useState } from 'react'

const W = 760, H = 520, ER = 11

const WALLS = [
  {x:0,y:0,w:W,h:10}, {x:0,y:H-10,w:W,h:10},
  {x:0,y:0,w:10,h:H}, {x:W-10,y:0,w:10,h:H},
  {x:130,y:75,w:100,h:100}, {x:130,y:345,w:100,h:100},
  {x:530,y:75,w:100,h:100}, {x:530,y:345,w:100,h:100},
  {x:305,y:165,w:150,h:190},
  {x:205,y:210,w:90,h:100}, {x:465,y:210,w:90,h:100},
]

const WP = [
  [{x:65,y:260},{x:175,y:140},{x:175,y:385},{x:290,y:260}],
  [{x:695,y:260},{x:585,y:140},{x:585,y:385},{x:470,y:260}],
]

function circWall(cx, cy, r, w) {
  const nx = Math.max(w.x, Math.min(cx, w.x+w.w))
  const ny = Math.max(w.y, Math.min(cy, w.y+w.h))
  const dx = cx-nx, dy = cy-ny
  return dx*dx+dy*dy < r*r
}

function pushOut(e, r) {
  for (const w of WALLS) {
    if (circWall(e.x, e.y, r, w)) {
      const nx = Math.max(w.x, Math.min(e.x, w.x+w.w))
      const ny = Math.max(w.y, Math.min(e.y, w.y+w.h))
      const dx = (e.x-nx) || 0.1
      const dy = (e.y-ny) || 0.1
      const l = Math.sqrt(dx*dx+dy*dy)
      e.x = nx + (dx/l)*(r+1)
      e.y = ny + (dy/l)*(r+1)
    }
  }
}

function segWall(x1, y1, x2, y2, r) {
  const dx = x2-x1, dy = y2-y1
  let mn = 0, mx = 1
  for (const [o, d, lo, hi] of [[x1,dx,r.x,r.x+r.w],[y1,dy,r.y,r.y+r.h]]) {
    if (Math.abs(d) < 1e-6) { if (o<lo||o>hi) return false }
    else {
      let t1=(lo-o)/d, t2=(hi-o)/d
      if (t1>t2) { const t=t1; t1=t2; t2=t }
      mn=Math.max(mn,t1); mx=Math.min(mx,t2)
      if (mn>mx) return false
    }
  }
  return true
}

function hasLOS(x1, y1, x2, y2) {
  for (const w of WALLS) if (segWall(x1,y1,x2,y2,w)) return false
  return true
}

function dst(a, b) { const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy) }

function mkBot(x, y, team, wi) {
  return { x, y, hp:100, team, angle:0, fireCd:Math.random()*0.9, alive:true, wi:wi%4 }
}

function newGame() {
  return {
    player: { x:65, y:260, hp:100, team:0, angle:0, fireCd:0, alive:true },
    bots: [
      mkBot(65,140,0,1), mkBot(65,385,0,2), mkBot(190,95,0,3), mkBot(190,425,0,0),
      mkBot(695,260,1,0), mkBot(695,140,1,1), mkBot(695,385,1,2), mkBot(570,95,1,3), mkBot(570,425,1,0),
    ],
    bullets: [], effects: [],
    phase: 'playing',
    score: { ct:0, t:0 },
    keys: new Set(),
    mouse: { x:400, y:260, down:false },
  }
}

export default function Shooter() {
  const cvs = useRef()
  const g = useRef(newGame())
  const raf = useRef()
  const lt = useRef(0)
  const [ui, setUi] = useState({ phase:'playing', score:{ct:0,t:0} })

  useEffect(() => {
    const c = cvs.current
    const onKey = e => {
      if (['w','a','s','d'].includes(e.key.toLowerCase())) e.preventDefault()
      if (e.type === 'keydown') {
        g.current.keys.add(e.key.toLowerCase())
        if (e.key.toLowerCase() === 'r' && g.current.phase !== 'playing') {
          g.current = newGame()
          setUi({ phase:'playing', score:{ct:0,t:0} })
        }
      } else {
        g.current.keys.delete(e.key.toLowerCase())
      }
    }
    const onMv = e => {
      const rc = c.getBoundingClientRect()
      g.current.mouse.x = (e.clientX-rc.left)*(W/rc.width)
      g.current.mouse.y = (e.clientY-rc.top)*(H/rc.height)
    }
    const onMd = () => { g.current.mouse.down = true }
    const onMu = () => { g.current.mouse.down = false }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    c.addEventListener('mousemove', onMv)
    c.addEventListener('mousedown', onMd)
    window.addEventListener('mouseup', onMu)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      c.removeEventListener('mousemove', onMv)
      c.removeEventListener('mousedown', onMd)
      window.removeEventListener('mouseup', onMu)
    }
  }, [])

  useEffect(() => {
    function update(dt) {
      const s = g.current
      if (s.phase !== 'playing') return
      const { player, bots, bullets, effects, keys, mouse } = s
      const all = [player, ...bots]

      if (player.alive) {
        player.angle = Math.atan2(mouse.y-player.y, mouse.x-player.x)
        let mdx=0, mdy=0
        if (keys.has('w')) mdy -= 1
        if (keys.has('s')) mdy += 1
        if (keys.has('a')) mdx -= 1
        if (keys.has('d')) mdx += 1
        if (mdx || mdy) {
          const l = Math.sqrt(mdx*mdx+mdy*mdy)
          const spd = 175*dt
          player.x += (mdx/l)*spd; pushOut(player, ER)
          player.y += (mdy/l)*spd; pushOut(player, ER)
        }
        player.x = Math.max(ER+10, Math.min(W-ER-10, player.x))
        player.y = Math.max(ER+10, Math.min(H-ER-10, player.y))
        player.fireCd = Math.max(0, player.fireCd-dt)
        if (mouse.down && player.fireCd <= 0) {
          player.fireCd = 0.13
          const a = player.angle
          bullets.push({ x:player.x+Math.cos(a)*(ER+3), y:player.y+Math.sin(a)*(ER+3), dx:Math.cos(a)*780, dy:Math.sin(a)*780, team:0, life:1.1 })
          effects.push({ x:player.x+Math.cos(a)*(ER+10), y:player.y+Math.sin(a)*(ER+10), t:0.07, r:8, col:'255,200,80' })
        }
      }

      for (const bot of bots) {
        if (!bot.alive) continue
        bot.fireCd = Math.max(0, bot.fireCd-dt)
        const enemies = all.filter(u => u.alive && u.team !== bot.team)
        let near=null, nearD=Infinity
        for (const e of enemies) { const d=dst(bot,e); if (d<nearD) { nearD=d; near=e } }

        if (near && nearD < 440 && hasLOS(bot.x,bot.y,near.x,near.y)) {
          bot.angle = Math.atan2(near.y-bot.y, near.x-bot.x)
          if (nearD > 145) {
            const spd=92*dt
            bot.x += Math.cos(bot.angle)*spd; pushOut(bot, ER)
            bot.y += Math.sin(bot.angle)*spd; pushOut(bot, ER)
          }
          if (bot.fireCd <= 0) {
            bot.fireCd = 0.55+Math.random()*0.5
            const a = bot.angle+(Math.random()-0.5)*0.11
            bullets.push({ x:bot.x+Math.cos(a)*(ER+3), y:bot.y+Math.sin(a)*(ER+3), dx:Math.cos(a)*700, dy:Math.sin(a)*700, team:bot.team, life:1.1 })
          }
        } else {
          const wp = WP[bot.team][bot.wi%4]
          if (dst(bot,wp) < 22) {
            bot.wi = (bot.wi+1)%4
          } else {
            const a = Math.atan2(wp.y-bot.y, wp.x-bot.x)
            bot.angle = a
            const spd=68*dt
            bot.x += Math.cos(a)*spd; pushOut(bot, ER)
            bot.y += Math.sin(a)*spd; pushOut(bot, ER)
          }
        }
        bot.x = Math.max(ER+10, Math.min(W-ER-10, bot.x))
        bot.y = Math.max(ER+10, Math.min(H-ER-10, bot.y))
      }

      for (let i=bullets.length-1; i>=0; i--) {
        const b = bullets[i]
        b.x+=b.dx*dt; b.y+=b.dy*dt; b.life-=dt
        let rm = b.life<=0||b.x<10||b.x>W-10||b.y<10||b.y>H-10
        if (!rm) for (const w of WALLS) if (b.x>=w.x&&b.x<=w.x+w.w&&b.y>=w.y&&b.y<=w.y+w.h) { rm=true; break }
        if (rm) { bullets.splice(i,1); continue }
        let hit=false
        for (const u of all) {
          if (!u.alive||u.team===b.team) continue
          const dx=b.x-u.x, dy=b.y-u.y
          if (dx*dx+dy*dy < (ER+5)*(ER+5)) {
            u.hp -= 28+Math.random()*14; if (u.hp<=0) { u.hp=0; u.alive=false }
            effects.push({ x:b.x, y:b.y, t:0.2, r:7, col:'200,30,30' })
            bullets.splice(i,1); hit=true; break
          }
        }
        if (hit) continue
      }

      for (let i=effects.length-1; i>=0; i--) { effects[i].t-=dt; if (effects[i].t<=0) effects.splice(i,1) }

      const ctA = all.filter(u=>u.team===0&&u.alive).length
      const tA  = bots.filter(u=>u.team===1&&u.alive).length
      if (ctA===0||tA===0) {
        const won = tA===0
        if (won) s.score.ct++; else s.score.t++
        s.phase = won ? 'won' : 'lost'
        setUi({ phase:s.phase, score:{...s.score} })
      }
    }

    function draw() {
      if (!cvs.current) return
      const ctx = cvs.current.getContext('2d')
      const s = g.current

      ctx.fillStyle = '#2d4a2d'; ctx.fillRect(0,0,W,H)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth=1
      for (let x=0;x<W;x+=40) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke() }
      for (let y=0;y<H;y+=40) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke() }

      ctx.fillStyle='rgba(64,144,255,0.06)'; ctx.fillRect(10,10,115,H-20)
      ctx.fillStyle='rgba(255,64,64,0.06)';  ctx.fillRect(W-125,10,115,H-20)

      for (const w of WALLS) {
        ctx.fillStyle='#585858'; ctx.fillRect(w.x,w.y,w.w,w.h)
        ctx.strokeStyle='#7a7a7a'; ctx.lineWidth=1.5; ctx.strokeRect(w.x,w.y,w.w,w.h)
      }

      for (const ef of s.effects) {
        ctx.fillStyle=`rgba(${ef.col},${Math.min(1,ef.t*6)})`
        ctx.beginPath(); ctx.arc(ef.x,ef.y,ef.r,0,Math.PI*2); ctx.fill()
      }

      ctx.fillStyle='#ffe066'
      for (const b of s.bullets) { ctx.beginPath(); ctx.arc(b.x,b.y,3,0,Math.PI*2); ctx.fill() }

      const all = [s.player, ...s.bots]
      for (const u of all) {
        const isP = u===s.player
        const col = u.team===0 ? '#4d9fff' : '#ff5050'
        if (!u.alive) {
          ctx.globalAlpha=0.4; ctx.strokeStyle=col; ctx.lineWidth=2
          ctx.beginPath(); ctx.arc(u.x,u.y,ER-2,0,Math.PI*2); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(u.x-5,u.y-5); ctx.lineTo(u.x+5,u.y+5)
          ctx.moveTo(u.x+5,u.y-5); ctx.lineTo(u.x-5,u.y+5); ctx.stroke()
          ctx.globalAlpha=1; continue
        }
        ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(u.x+2,u.y+3,ER,0,Math.PI*2); ctx.fill()
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(u.x,u.y,ER,0,Math.PI*2); ctx.fill()
        ctx.strokeStyle='#fff'; ctx.lineWidth=isP?2.5:1.5; ctx.stroke()
        ctx.strokeStyle=isP?'#fff':u.team===0?'#9dd0ff':'#ffaaaa'; ctx.lineWidth=isP?3:2
        ctx.beginPath(); ctx.moveTo(u.x,u.y)
        ctx.lineTo(u.x+Math.cos(u.angle)*(ER+14), u.y+Math.sin(u.angle)*(ER+14)); ctx.stroke()
        const bw=26, bx=u.x-13, by=u.y-ER-10
        ctx.fillStyle='#222'; ctx.fillRect(bx,by,bw,4)
        const p=Math.max(0,u.hp)/100
        ctx.fillStyle=p>0.5?'#4ade80':p>0.25?'#facc15':'#ef4444'
        ctx.fillRect(bx,by,bw*p,4)
        if (isP) { ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center'; ctx.fillText('YOU',u.x,u.y+3) }
      }

      ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(8,H-42,180,34)
      const hpPct=Math.max(0,s.player.hp)/100
      ctx.fillStyle=hpPct>0.5?'#4ade80':hpPct>0.25?'#facc15':'#ef4444'
      ctx.fillRect(10,H-40,176*hpPct,30)
      ctx.fillStyle='#fff'; ctx.font='bold 14px monospace'; ctx.textAlign='left'
      ctx.fillText(`HP ${Math.max(0,Math.round(s.player.hp))}`,16,H-20)

      const ctA=all.filter(u=>u.team===0&&u.alive).length
      const tA=s.bots.filter(u=>u.team===1&&u.alive).length
      ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(W/2-95,8,190,32)
      ctx.font='bold 15px monospace'; ctx.textAlign='center'
      ctx.fillStyle='#4d9fff'; ctx.fillText(`CT ${s.score.ct}`,W/2-28,29)
      ctx.fillStyle='#888'; ctx.fillText(':',W/2,29)
      ctx.fillStyle='#ff5050'; ctx.fillText(`${s.score.t} T`,W/2+28,29)
      ctx.fillStyle='#4d9fff'; ctx.font='bold 13px monospace'; ctx.textAlign='left'; ctx.fillText(`CT ${ctA}/5`,16,29)
      ctx.fillStyle='#ff5050'; ctx.textAlign='right'; ctx.fillText(`T ${tA}/5`,W-16,29)

      if (s.phase !== 'playing') {
        ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H)
        ctx.fillStyle=s.phase==='won'?'#4ade80':'#ef4444'
        ctx.font='bold 52px monospace'; ctx.textAlign='center'
        ctx.fillText(s.phase==='won'?'CT WIN! 🎉':'T WIN!',W/2,H/2-10)
        ctx.fillStyle='#bbb'; ctx.font='18px sans-serif'
        ctx.fillText('Нажми R для нового раунда',W/2,H/2+35)
      }
    }

    function loop(t) {
      const dt = Math.min((t-lt.current)/1000, 0.05)
      lt.current = t
      update(dt); draw()
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(t => { lt.current=t; raf.current=requestAnimationFrame(loop) })
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ marginBottom:8, color:'#666', fontSize:13 }}>
        <b>WASD</b> — движение · <b>мышь</b> — прицел · <b>ЛКМ</b> — огонь · <b>R</b> — новый раунд &nbsp;|&nbsp;
        <span style={{color:'#4d9fff'}}>■ CT (ты + союзники)</span> vs <span style={{color:'#ff5050'}}>■ T (враги)</span>
      </div>
      <canvas ref={cvs} width={W} height={H}
        style={{ border:'2px solid #333', cursor:'crosshair', display:'block', margin:'0 auto', maxWidth:'100%' }} />
    </div>
  )
}

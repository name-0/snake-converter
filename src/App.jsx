import { useState } from 'react'
import Snake from './components/Snake'
import ImageConverter from './components/ImageConverter'
import Shooter from './components/Shooter'

const TABS = [
  { id: 'snake',     label: '🐍 Snake' },
  { id: 'shooter',  label: '🔫 Shooter' },
  { id: 'converter',label: '🖼 PNG→JPG' },
]

export default function App() {
  const [tab, setTab] = useState('snake')
  const wide = tab === 'shooter'

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: wide ? 820 : 640, margin: '0 auto', padding: wide ? '10px' : 20 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 12 }}>🎮 Mini App</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '8px 0', background: tab === t.id ? '#333' : '#eee', color: tab === t.id ? '#fff' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: tab === t.id ? 'bold' : 'normal' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'snake' && <Snake />}
      {tab === 'shooter' && <Shooter />}
      {tab === 'converter' && <ImageConverter />}
    </div>
  )
}

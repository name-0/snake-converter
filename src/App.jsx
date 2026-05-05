import { useState } from 'react'
import Snake from './components/Snake'
import ImageConverter from './components/ImageConverter'

export default function App() {
  const [tab, setTab] = useState('snake')

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 640, margin: '0 auto', padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>🎮 Mini App</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setTab('snake')}
          style={{ flex: 1, padding: '8px 0', background: tab === 'snake' ? '#333' : '#eee', color: tab === 'snake' ? '#fff' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >🐍 Snake</button>
        <button
          onClick={() => setTab('converter')}
          style={{ flex: 1, padding: '8px 0', background: tab === 'converter' ? '#333' : '#eee', color: tab === 'converter' ? '#fff' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >🖼 PNG → JPG</button>
      </div>
      {tab === 'snake' ? <Snake /> : <ImageConverter />}
    </div>
  )
}

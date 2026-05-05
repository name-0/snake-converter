import { useState, useRef } from 'react'

export default function ImageConverter() {
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [quality, setQuality] = useState(85)
  const [info, setInfo] = useState(null)
  const inputRef = useRef()

  const onFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResult(null)
    setInfo(null)
    const url = URL.createObjectURL(file)
    setPreview({ url, name: file.name, size: file.size })
  }

  const convert = () => {
    if (!preview) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob)
          const name = preview.name.replace(/\.png$/i, '.jpg')
          setResult({ url, name, size: blob.size })
          setInfo({ before: preview.size, after: blob.size })
        },
        'image/jpeg',
        quality / 100
      )
    }
    img.src = preview.url
  }

  const fmt = (bytes) => (bytes / 1024).toFixed(1) + ' KB'

  return (
    <div>
      <p style={{ marginBottom: 12 }}>Upload a PNG — it will be converted to JPG with adjustable quality.</p>
      <input ref={inputRef} type="file" accept="image/png" onChange={onFile} style={{ marginBottom: 12 }} />

      {preview && (
        <>
          <div style={{ marginBottom: 12 }}>
            <img src={preview.url} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, border: '1px solid #ddd' }} />
            <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{preview.name} · {fmt(preview.size)}</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            Quality: <strong>{quality}%</strong>
            <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)} style={{ flex: 1 }} />
          </label>
          <button onClick={convert} style={{ padding: '8px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Convert to JPG
          </button>
        </>
      )}

      {result && (
        <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <p style={{ marginBottom: 8, fontWeight: 'bold', color: '#15803d' }}>
            ✅ Done! {fmt(info.before)} → {fmt(info.after)} ({Math.round((1 - info.after / info.before) * 100)}% smaller)
          </p>
          <img src={result.url} alt="result" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, border: '1px solid #ddd', marginBottom: 8 }} />
          <br />
          <a href={result.url} download={result.name} style={{ padding: '6px 16px', background: '#15803d', color: '#fff', textDecoration: 'none', borderRadius: 6 }}>
            ⬇ Download {result.name}
          </a>
        </div>
      )}
    </div>
  )
}

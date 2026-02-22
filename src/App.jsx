import { useMemo, useState } from 'react'
import './App.css'

const MM_TO_PX = 3.7795275591

const presets = [
  { id: 'small', name: 'Small 36x12mm', w: 36, h: 12 },
  { id: 'medium', name: 'Medium 45x15mm', w: 45, h: 15 },
  { id: 'large', name: 'Large 60x20mm', w: 60, h: 20 },
]

const starterIcons = [
  { id: 'none', name: 'None', url: '' },
  { id: 'screw', name: 'Screw', url: '/icons/screw.svg' },
  { id: 'bolt', name: 'Bolt', url: '/icons/bolt.svg' },
  { id: 'nut', name: 'Nut', url: '/icons/nut.svg' },
  { id: 'washer', name: 'Washer', url: '/icons/washer.svg' },
]

function download(name, blob, type = '') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.${type}`
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [text, setText] = useState('SCREWS')
  const [presetId, setPresetId] = useState('medium')
  const [fontSize, setFontSize] = useState(28)
  const [padding, setPadding] = useState(8)
  const [iconSize, setIconSize] = useState(32)
  const [iconPosition, setIconPosition] = useState('left')
  const [selectedIcon, setSelectedIcon] = useState('/icons/screw.svg')
  const [uploadedIcon, setUploadedIcon] = useState('')

  const preset = useMemo(() => presets.find((p) => p.id === presetId) ?? presets[1], [presetId])
  const width = Math.round(preset.w * MM_TO_PX)
  const height = Math.round(preset.h * MM_TO_PX)
  const iconUrl = uploadedIcon || selectedIcon
  const hasIcon = Boolean(iconUrl)

  const layout = useMemo(() => {
    const safePadding = Math.max(0, padding)
    const iconGap = hasIcon ? 8 : 0
    const iconSpace = hasIcon && (iconPosition === 'left' || iconPosition === 'right') ? iconSize + iconGap : 0
    const textX = iconPosition === 'left' ? safePadding + iconSpace : safePadding
    const textY = hasIcon && iconPosition === 'top' ? safePadding + iconSize + iconGap : safePadding
    const textW = width - safePadding * 2 - iconSpace
    const textH = height - safePadding * 2 - (hasIcon && iconPosition === 'top' ? iconSize + iconGap : 0)

    return {
      textX,
      textY,
      textW,
      textH,
      iconX:
        iconPosition === 'left'
          ? safePadding
          : iconPosition === 'right'
            ? width - safePadding - iconSize
            : (width - iconSize) / 2,
      iconY:
        iconPosition === 'top'
          ? safePadding
          : (height - iconSize) / 2,
    }
  }, [padding, hasIcon, iconPosition, iconSize, width, height])

  const svgMarkup = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" rx="6" ry="6" fill="white" stroke="black" stroke-width="2" />
  ${
    hasIcon
      ? `<image href="${iconUrl}" x="${layout.iconX}" y="${layout.iconY}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid meet" />`
      : ''
  }
  <foreignObject x="${layout.textX}" y="${layout.textY}" width="${layout.textW}" height="${layout.textH}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font:700 ${fontSize}px Arial,sans-serif;line-height:1;color:#111;word-break:break-word;overflow:hidden;">${text}</div>
  </foreignObject>
</svg>`

  const previewUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`

  const onUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setUploadedIcon(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  }

  const exportSvg = () => {
    download('multiboard-label', new Blob([svgMarkup], { type: 'image/svg+xml' }), 'svg')
  }

  const exportPng = async () => {
    const img = new Image()
    img.src = previewUrl
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
    const canvas = document.createElement('canvas')
    canvas.width = width * 3
    canvas.height = height * 3
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      download('multiboard-label', blob, 'png')
    }, 'image/png')
  }

  return (
    <div className="app">
      <aside className="controls">
        <h1>Multiboard Label Generator (Local Clone)</h1>

        <label>Label text
          <input value={text} onChange={(e) => setText(e.target.value.toUpperCase())} />
        </label>

        <label>Size preset
          <select value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label>Icon
          <select
            value={uploadedIcon ? '__uploaded__' : selectedIcon}
            onChange={(e) => {
              setUploadedIcon('')
              setSelectedIcon(e.target.value)
            }}
          >
            {starterIcons.map((i) => <option key={i.id} value={i.url}>{i.name}</option>)}
            {uploadedIcon && <option value="__uploaded__">Uploaded icon</option>}
          </select>
        </label>

        <label>Upload icon (SVG/PNG)
          <input type="file" accept=".svg,.png,image/svg+xml,image/png" onChange={onUpload} />
        </label>

        <label>Icon position
          <select value={iconPosition} onChange={(e) => setIconPosition(e.target.value)}>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
          </select>
        </label>

        <label>Font size ({fontSize}px)
          <input type="range" min="12" max="56" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
        </label>

        <label>Icon size ({iconSize}px)
          <input type="range" min="12" max="56" value={iconSize} onChange={(e) => setIconSize(Number(e.target.value))} />
        </label>

        <label>Padding ({padding}px)
          <input type="range" min="0" max="20" value={padding} onChange={(e) => setPadding(Number(e.target.value))} />
        </label>

        <div className="buttons">
          <button onClick={exportSvg}>Export SVG</button>
          <button onClick={exportPng}>Export PNG</button>
        </div>
      </aside>

      <main className="preview-wrap">
        <h2>Live preview</h2>
        <div className="preview" style={{ width, height }}>
          <img src={previewUrl} alt="label preview" />
        </div>
        <p>{preset.w}mm × {preset.h}mm</p>
      </main>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import {
  DEFAULT_PRESET_ID,
  HARDWARE_ICONS,
  PRESETS,
  computeLayout,
  createLabelMesh,
  createSvgMarkup,
  exportMeshToBinaryStl,
  resolvePreset,
} from './lib/labelEngine'
import './App.css'

function download(name, blob, ext) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [text, setText] = useState('SCREWS')
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID)
  const [iconChoice, setIconChoice] = useState('/icons/screw.svg')
  const [uploadedIcon, setUploadedIcon] = useState('')
  const [iconPosition, setIconPosition] = useState('left')
  const [advanced, setAdvanced] = useState(false)
  const [customWidthMm, setCustomWidthMm] = useState(45)
  const [customHeightMm, setCustomHeightMm] = useState(15)
  const [paddingMm, setPaddingMm] = useState(2)
  const [iconSizeMm, setIconSizeMm] = useState(6.5)
  const [status, setStatus] = useState('')

  const preset = useMemo(() => resolvePreset(presetId), [presetId])
  const widthMm = advanced ? Math.max(12, Number(customWidthMm) || 12) : preset.widthMm
  const heightMm = advanced ? Math.max(8, Number(customHeightMm) || 8) : preset.heightMm
  const iconHref = uploadedIcon || iconChoice
  const hasIcon = Boolean(iconHref)

  const layout = useMemo(
    () =>
      computeLayout({
        widthMm,
        heightMm,
        withIcon: hasIcon,
        iconPosition,
        paddingMm,
        iconSizeMm,
      }),
    [widthMm, heightMm, hasIcon, iconPosition, paddingMm, iconSizeMm],
  )

  const svgMarkup = useMemo(
    () => createSvgMarkup({ text, widthMm, heightMm, iconHref, layout }),
    [text, widthMm, heightMm, iconHref, layout],
  )

  const previewUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`

  const onUploadIcon = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setStatus('Uploaded PNG/JPG can preview, but STL icon supports SVG only. Use an SVG for STL icon engraving.')
    } else {
      setStatus('')
    }

    const reader = new FileReader()
    reader.onload = () => setUploadedIcon(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function resolveIconSvgText() {
    if (!iconHref) return ''
    if (iconHref.startsWith('data:image/svg+xml')) {
      const payload = iconHref.split(',')[1] || ''
      return iconHref.includes(';base64') ? atob(payload) : decodeURIComponent(payload)
    }

    if (!iconHref.toLowerCase().endsWith('.svg')) return ''
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`
    const url = new URL(iconHref.replace(/^\//, ''), base).toString()
    const response = await fetch(url)
    return await response.text()
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
    canvas.width = img.width * 3
    canvas.height = img.height * 3
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) download('multiboard-label', blob, 'png')
    }, 'image/png')
  }

  const exportStl = async () => {
    setStatus('Generating STL...')

    try {
      const iconSvgText = await resolveIconSvgText()
      const mesh = createLabelMesh({
        text,
        widthMm,
        heightMm,
        iconSvgText,
        iconPosition,
        paddingMm,
        iconSizeMm,
      })

      const stlBinary = exportMeshToBinaryStl(mesh)
      const stlBlob = new Blob([stlBinary], { type: 'model/stl' })

      const parsed = new STLLoader().parse(await stlBlob.arrayBuffer())
      parsed.computeBoundingBox()
      const bb = parsed.boundingBox
      const measuredW = bb ? bb.max.x - bb.min.x : 0
      const measuredH = bb ? bb.max.y - bb.min.y : 0

      if (!bb || measuredW <= 0 || measuredH <= 0) throw new Error('STL validation failed (invalid bounds)')

      download('multiboard-label', stlBlob, 'stl')
      setStatus(`STL exported and validated (${measuredW.toFixed(2)} x ${measuredH.toFixed(2)} mm).`)
    } catch (error) {
      setStatus(`STL export failed: ${error.message}`)
    }
  }

  return (
    <div className="app">
      <aside className="controls">
        <h1>Multiboard Label Generator</h1>

        <label>
          Label text
          <input value={text} onChange={(e) => setText(e.target.value.toUpperCase())} />
        </label>

        <label>
          Preset size
          <select value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Hardware icon
          <select
            value={uploadedIcon ? '__uploaded__' : iconChoice}
            onChange={(e) => {
              if (e.target.value !== '__uploaded__') {
                setUploadedIcon('')
                setIconChoice(e.target.value)
              }
            }}
          >
            {HARDWARE_ICONS.map((icon) => (
              <option key={icon.id} value={icon.url}>
                {icon.name}
              </option>
            ))}
            {uploadedIcon && <option value="__uploaded__">Uploaded icon</option>}
          </select>
        </label>

        <label>
          Upload icon (SVG preferred for STL)
          <input type="file" accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg" onChange={onUploadIcon} />
        </label>

        <label>
          Icon position
          <select value={iconPosition} onChange={(e) => setIconPosition(e.target.value)}>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
          </select>
        </label>

        <label className="inline-toggle">
          <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
          Advanced sizing
        </label>

        {advanced && (
          <div className="advanced-box">
            <label>
              Width (mm)
              <input type="number" min="12" value={customWidthMm} onChange={(e) => setCustomWidthMm(e.target.value)} />
            </label>
            <label>
              Height (mm)
              <input type="number" min="8" value={customHeightMm} onChange={(e) => setCustomHeightMm(e.target.value)} />
            </label>
            <label>
              Padding (mm)
              <input type="number" min="0.5" step="0.1" value={paddingMm} onChange={(e) => setPaddingMm(Number(e.target.value))} />
            </label>
            <label>
              Icon size (mm)
              <input type="number" min="2" step="0.1" value={iconSizeMm} onChange={(e) => setIconSizeMm(Number(e.target.value))} />
            </label>
          </div>
        )}

        <div className="buttons">
          <button onClick={exportSvg}>Export SVG</button>
          <button onClick={exportPng}>Export PNG</button>
          <button onClick={exportStl}>Export STL (Bambu)</button>
        </div>

        {status && <p className="status">{status}</p>}
      </aside>

      <main className="preview-wrap">
        <h2>Live preview</h2>
        <div className="preview" style={{ width: Math.round(widthMm * 10), height: Math.round(heightMm * 10) }}>
          <img src={previewUrl} alt="Label preview" />
        </div>
        <p>
          Output size: <strong>{widthMm} x {heightMm} mm</strong>
        </p>
      </main>
    </div>
  )
}

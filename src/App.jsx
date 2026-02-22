import { useEffect, useMemo, useState } from 'react'
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
  const [iconPosition, setIconPosition] = useState('left')
  const [advanced, setAdvanced] = useState(false)
  const [customWidthMm, setCustomWidthMm] = useState(45)
  const [customHeightMm, setCustomHeightMm] = useState(15)
  const [paddingMm, setPaddingMm] = useState(2)
  const [iconSizeMm, setIconSizeMm] = useState(6.5)
  const [iconSvgText, setIconSvgText] = useState('')
  const [status, setStatus] = useState('')

  const preset = useMemo(() => resolvePreset(presetId), [presetId])
  const widthMm = advanced ? Math.max(12, Number(customWidthMm) || 12) : preset.widthMm
  const heightMm = advanced ? Math.max(8, Number(customHeightMm) || 8) : preset.heightMm
  const iconHref = iconChoice
  const hasIcon = Boolean(iconHref)

  const selectedIconName = useMemo(
    () => HARDWARE_ICONS.find((icon) => icon.url === iconChoice)?.name || 'No icon',
    [iconChoice],
  )

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
    () => createSvgMarkup({ text, widthMm, heightMm, iconHref, iconSvgText, layout }),
    [text, widthMm, heightMm, iconHref, iconSvgText, layout],
  )

  const previewUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`

  useEffect(() => {
    let cancelled = false

    async function loadIcon() {
      if (!iconHref || !iconHref.toLowerCase().endsWith('.svg')) {
        setIconSvgText('')
        return
      }

      try {
        const base = `${window.location.origin}${import.meta.env.BASE_URL}`
        const url = new URL(iconHref.replace(/^\//, ''), base).toString()
        const response = await fetch(url)
        const svgText = await response.text()
        if (!cancelled) setIconSvgText(svgText)
      } catch {
        if (!cancelled) setIconSvgText('')
      }
    }

    loadIcon()
    return () => {
      cancelled = true
    }
  }, [iconHref])

  const exportSvg = () => {
    download('multiboard-label', new Blob([svgMarkup], { type: 'image/svg+xml' }), 'svg')
    setStatus('SVG exported.')
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
      if (blob) {
        download('multiboard-label', blob, 'png')
        setStatus('PNG exported.')
      }
    }, 'image/png')
  }

  const exportStl = async () => {
    setStatus('Generating STL...')

    try {
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
        <p className="subtitle">Fast flow: preset → text → icon → export.</p>

        <section className="panel">
          <h2>1) Size preset</h2>
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
        </section>

        <section className="panel">
          <h2>2) Label text</h2>
          <label>
            Text (auto uppercase)
            <input value={text} onChange={(e) => setText(e.target.value.toUpperCase())} maxLength={24} />
          </label>
        </section>

        <section className="panel">
          <h2>3) Icon</h2>
          <label>
            Built-in hardware icon library
            <select value={iconChoice} onChange={(e) => setIconChoice(e.target.value)}>
              {HARDWARE_ICONS.map((icon) => (
                <option key={icon.id} value={icon.url}>
                  {icon.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Icon position
            <select value={iconPosition} onChange={(e) => setIconPosition(e.target.value)}>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="top">Top</option>
            </select>
          </label>
          <p className="helper">All library icons are SVG and STL-compatible.</p>
        </section>

        <section className="panel">
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
        </section>

        <section className="panel export-panel">
          <h2>4) Export</h2>
          <div className="buttons">
            <button onClick={exportStl}>Export STL (Bambu)</button>
            <button onClick={exportSvg}>Export SVG</button>
            <button onClick={exportPng}>Export PNG</button>
          </div>
        </section>

        {status && <p className="status">{status}</p>}
      </aside>

      <main className="preview-wrap">
        <div className="preview-header">
          <h2>Live preview</h2>
          <p>
            <strong>{widthMm} x {heightMm} mm</strong> · {selectedIconName}
          </p>
        </div>
        <div className="preview-scroll">
          <div className="preview" style={{ width: Math.round(widthMm * 10), height: Math.round(heightMm * 10) }}>
            <img src={previewUrl} alt="Label preview" />
          </div>
        </div>
      </main>
    </div>
  )
}

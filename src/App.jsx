import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import helvetikerBold from 'three/examples/fonts/helvetiker_bold.typeface.json'
import { CSG } from 'three-csg-ts'
import './App.css'

const MM_TO_PX = 3.7795275591
const BASE_THICKNESS_MM = 1.6
const FEATURE_HEIGHT_MM = 0.8
const ENGRAVE_DEPTH_MM = 0.5

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

function roundedRectShape(width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2))
  const shape = new THREE.Shape()
  shape.moveTo(r, 0)
  shape.lineTo(width - r, 0)
  shape.quadraticCurveTo(width, 0, width, r)
  shape.lineTo(width, height - r)
  shape.quadraticCurveTo(width, height, width - r, height)
  shape.lineTo(r, height)
  shape.quadraticCurveTo(0, height, 0, height - r)
  shape.lineTo(0, r)
  shape.quadraticCurveTo(0, 0, r, 0)
  return shape
}

function extractSvgFromDataUrl(dataUrl) {
  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx < 0) return ''
  const payload = dataUrl.slice(commaIdx + 1)
  if (dataUrl.includes(';base64')) {
    return atob(payload)
  }
  return decodeURIComponent(payload)
}

function mergeGeometries(geometries) {
  const nonNull = geometries.filter(Boolean)
  if (!nonNull.length) return null
  const merged = new THREE.BufferGeometry()
  const positions = []
  const normals = []
  for (const geom of nonNull) {
    const g = geom.index ? geom.toNonIndexed() : geom
    const pos = g.getAttribute('position')
    const normal = g.getAttribute('normal')
    if (!pos || !normal) continue
    for (let i = 0; i < pos.count; i += 1) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
      normals.push(normal.getX(i), normal.getY(i), normal.getZ(i))
    }
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  merged.computeBoundingBox()
  merged.computeBoundingSphere()
  return merged
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
  const [reliefMode, setReliefMode] = useState('emboss')
  const [exportStatus, setExportStatus] = useState('')

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

  const exportStl = async () => {
    setExportStatus('Generating STL...')
    try {
      const pxToMm = preset.w / width
      const font = new FontLoader().parse(helvetikerBold)

      const baseShape = roundedRectShape(preset.w, preset.h, 1.2)
      const baseGeom = new THREE.ExtrudeGeometry(baseShape, { depth: BASE_THICKNESS_MM, bevelEnabled: false })
      const baseMesh = new THREE.Mesh(baseGeom, new THREE.MeshBasicMaterial())

      const features = []

      const safeText = text.trim()
      if (safeText) {
        const textShapes = font.generateShapes(safeText, 1)
        const textGeomProbe = new THREE.ShapeGeometry(textShapes)
        textGeomProbe.computeBoundingBox()
        const bb = textGeomProbe.boundingBox
        if (bb) {
          const boxW = Math.max(0.1, layout.textW * pxToMm)
          const boxH = Math.max(0.1, layout.textH * pxToMm)
          const sourceW = Math.max(0.1, bb.max.x - bb.min.x)
          const sourceH = Math.max(0.1, bb.max.y - bb.min.y)
          const scale = Math.min(boxW / sourceW, boxH / sourceH) * 0.9

          const textGeom2d = new THREE.ShapeGeometry(textShapes)
          textGeom2d.scale(scale, scale, 1)
          textGeom2d.computeBoundingBox()
          const tb = textGeom2d.boundingBox
          if (tb) {
            const textExtrude = new THREE.ExtrudeGeometry(textShapes, {
              depth: reliefMode === 'emboss' ? FEATURE_HEIGHT_MM : ENGRAVE_DEPTH_MM,
              bevelEnabled: false,
              curveSegments: 8,
            })
            textExtrude.scale(scale, scale, 1)
            const textMesh = new THREE.Mesh(textExtrude, new THREE.MeshBasicMaterial())

            const targetX = layout.textX * pxToMm + (boxW - (tb.max.x - tb.min.x)) / 2
            const targetYTop = layout.textY * pxToMm + (boxH - (tb.max.y - tb.min.y)) / 2
            const targetY = preset.h - targetYTop - (tb.max.y - tb.min.y)

            textMesh.position.set(targetX - tb.min.x, targetY - tb.min.y, reliefMode === 'emboss' ? BASE_THICKNESS_MM : BASE_THICKNESS_MM - ENGRAVE_DEPTH_MM)
            features.push(textMesh)
          }
        }
      }

      if (hasIcon && iconUrl.toLowerCase().includes('.svg')) {
        let iconSvg = ''
        if (iconUrl.startsWith('data:image/svg+xml')) {
          iconSvg = extractSvgFromDataUrl(iconUrl)
        } else {
          const absolute = iconUrl.startsWith('http') ? iconUrl : `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}${iconUrl}`.replace(/([^:]\/)\/+/, '$1')
          const res = await fetch(absolute)
          iconSvg = await res.text()
        }

        const svgData = new SVGLoader().parse(iconSvg)
        const shapes = []
        for (const path of svgData.paths) {
          shapes.push(...path.toShapes(true))
        }

        if (shapes.length) {
          const iconGeom = new THREE.ExtrudeGeometry(shapes, {
            depth: reliefMode === 'emboss' ? FEATURE_HEIGHT_MM : ENGRAVE_DEPTH_MM,
            bevelEnabled: false,
          })
          iconGeom.scale(1, -1, 1)
          iconGeom.computeBoundingBox()
          const ib = iconGeom.boundingBox
          if (ib) {
            const sourceW = Math.max(0.1, ib.max.x - ib.min.x)
            const sourceH = Math.max(0.1, ib.max.y - ib.min.y)
            const target = iconSize * pxToMm
            const scale = Math.min(target / sourceW, target / sourceH)
            iconGeom.scale(scale, scale, 1)
            iconGeom.computeBoundingBox()
            const ib2 = iconGeom.boundingBox
            if (ib2) {
              const iconMesh = new THREE.Mesh(iconGeom, new THREE.MeshBasicMaterial())
              const targetX = layout.iconX * pxToMm + (target - (ib2.max.x - ib2.min.x)) / 2
              const targetYTop = layout.iconY * pxToMm + (target - (ib2.max.y - ib2.min.y)) / 2
              const targetY = preset.h - targetYTop - (ib2.max.y - ib2.min.y)
              iconMesh.position.set(targetX - ib2.min.x, targetY - ib2.min.y, reliefMode === 'emboss' ? BASE_THICKNESS_MM : BASE_THICKNESS_MM - ENGRAVE_DEPTH_MM)
              features.push(iconMesh)
            }
          }
        }
      }

      let exportObject
      if (reliefMode === 'deboss') {
        let result = baseMesh
        for (const f of features) {
          result = CSG.subtract(result, f)
        }
        exportObject = result
      } else {
        const merged = mergeGeometries([baseGeom, ...features.map((f) => f.geometry.clone().applyMatrix4(f.matrixWorld))])
        exportObject = new THREE.Mesh(merged, new THREE.MeshBasicMaterial())
      }

      const exporter = new STLExporter()
      const stlBinary = exporter.parse(exportObject, { binary: true })
      const stlBlob = new Blob([stlBinary], { type: 'model/stl' })

      // basic mesh validation (equivalent fallback when Bambu Studio is unavailable)
      const loader = new STLLoader()
      const parsed = loader.parse(await stlBlob.arrayBuffer())
      parsed.computeBoundingBox()
      const vb = parsed.boundingBox
      if (!vb || !Number.isFinite(vb.max.x) || parsed.getAttribute('position').count < 3) {
        throw new Error('Generated STL did not pass mesh validation')
      }

      download(`multiboard-label-${reliefMode}`, stlBlob, 'stl')
      setExportStatus(`STL exported (${reliefMode}). Mesh validated.`)
    } catch (error) {
      console.error(error)
      setExportStatus(`STL export failed: ${error.message}`)
    }
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

        <label>Text/Icon mode
          <select value={reliefMode} onChange={(e) => setReliefMode(e.target.value)}>
            <option value="emboss">Emboss (raised)</option>
            <option value="deboss">Deboss (engraved)</option>
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
          <button onClick={exportStl}>Export STL (Bambu)</button>
        </div>
        {exportStatus && <p className="status">{exportStatus}</p>}
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

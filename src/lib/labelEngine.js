import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import helvetikerBold from 'three/examples/fonts/helvetiker_bold.typeface.json' with { type: 'json' }

export const MU_MM = 25
export const BASE_THICKNESS_MM = 1.6
export const FEATURE_HEIGHT_MM = 0.8

export const PRESETS = [
  { id: 'small', name: 'Small (36 x 12 mm)', widthMm: 36, heightMm: 12 },
  { id: 'medium', name: 'Medium (45 x 15 mm)', widthMm: 45, heightMm: 15 },
  { id: 'large', name: 'Large (60 x 20 mm)', widthMm: 60, heightMm: 20 },
  { id: 'mu-1x0_5', name: 'MU 1.0 x 0.5 (25 x 12.5 mm)', widthMm: 25, heightMm: 12.5 },
  { id: 'mu-1_5x0_5', name: 'MU 1.5 x 0.5 (37.5 x 12.5 mm)', widthMm: 37.5, heightMm: 12.5 },
  { id: 'mu-2x0_75', name: 'MU 2.0 x 0.75 (50 x 18.75 mm)', widthMm: 50, heightMm: 18.75 },
]

export const DEFAULT_PRESET_ID = 'medium'

export const HARDWARE_ICONS = [
  { id: 'none', name: 'No icon', url: '' },
  { id: 'screw', name: 'Screw', url: '/icons/screw.svg' },
  { id: 'bolt', name: 'Bolt', url: '/icons/bolt.svg' },
  { id: 'nut', name: 'Nut', url: '/icons/nut.svg' },
  { id: 'washer', name: 'Washer', url: '/icons/washer.svg' },
  { id: 'wing-nut', name: 'Wing Nut', url: '/icons/wing-nut.svg' },
  { id: 'hex-key', name: 'Hex Key', url: '/icons/hex-key.svg' },
  { id: 'wrench', name: 'Wrench', url: '/icons/wrench.svg' },
  { id: 'socket', name: 'Socket', url: '/icons/socket.svg' },
  { id: 'hammer', name: 'Hammer', url: '/icons/hammer.svg' },
  { id: 'drill-bit', name: 'Drill Bit', url: '/icons/drill-bit.svg' },
  { id: 'pliers', name: 'Pliers', url: '/icons/pliers.svg' },
  { id: 'tape-measure', name: 'Tape Measure', url: '/icons/tape-measure.svg' },
  { id: 'saw-blade', name: 'Saw Blade', url: '/icons/saw-blade.svg' },
  { id: 'clamp', name: 'Clamp', url: '/icons/clamp.svg' },
]

const font = new FontLoader().parse(helvetikerBold)

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

function mergeGeometries(geometries) {
  const merged = new THREE.BufferGeometry()
  const positions = []
  const normals = []

  for (const source of geometries.filter(Boolean)) {
    const g = source.index ? source.toNonIndexed() : source
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

export function resolvePreset(presetId) {
  return PRESETS.find((p) => p.id === presetId) ?? PRESETS[1]
}

export function computeLayout({ widthMm, heightMm, withIcon, iconPosition = 'left', paddingMm = 2, iconSizeMm = 6 }) {
  const safePadding = Math.max(0.5, paddingMm)
  const iconGap = withIcon ? 1.8 : 0
  const iconSpace = withIcon && (iconPosition === 'left' || iconPosition === 'right') ? iconSizeMm + iconGap : 0
  const textX = iconPosition === 'left' ? safePadding + iconSpace : safePadding
  const textY = withIcon && iconPosition === 'top' ? safePadding + iconSizeMm + iconGap : safePadding
  const textWidthMm = widthMm - safePadding * 2 - iconSpace
  const textHeightMm = heightMm - safePadding * 2 - (withIcon && iconPosition === 'top' ? iconSizeMm + iconGap : 0)

  return {
    textX,
    textY,
    textWidthMm: Math.max(2, textWidthMm),
    textHeightMm: Math.max(2, textHeightMm),
    iconX:
      iconPosition === 'left'
        ? safePadding
        : iconPosition === 'right'
          ? widthMm - safePadding - iconSizeMm
          : (widthMm - iconSizeMm) / 2,
    iconY: iconPosition === 'top' ? safePadding : (heightMm - iconSizeMm) / 2,
    iconSizeMm,
  }
}

export function createSvgMarkup({ text, widthMm, heightMm, iconHref, layout }) {
  const pxScale = 12
  const widthPx = Math.round(widthMm * pxScale)
  const heightPx = Math.round(heightMm * pxScale)
  const fontSizePx = Math.max(10, Math.min(56, Math.round(layout.textHeightMm * pxScale * 0.68)))

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthMm} ${heightMm}">
  <rect x="0" y="0" width="${widthMm}" height="${heightMm}" rx="1.2" ry="1.2" fill="white" stroke="#111" stroke-width="0.4" />
  ${
    iconHref
      ? `<image href="${iconHref}" x="${layout.iconX}" y="${layout.iconY}" width="${layout.iconSizeMm}" height="${layout.iconSizeMm}" preserveAspectRatio="xMidYMid meet" />`
      : ''
  }
  <text x="${layout.textX + layout.textWidthMm / 2}" y="${layout.textY + layout.textHeightMm / 2}" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${fontSizePx / pxScale}" fill="#111">${(text || '').replace(/[<&>]/g, '')}</text>
</svg>`
}

export function createLabelMesh({ text, widthMm, heightMm, iconSvgText = '', iconPosition = 'left', paddingMm = 2, iconSizeMm = 6 }) {
  const hasIcon = Boolean(iconSvgText?.trim())
  const layout = computeLayout({ widthMm, heightMm, withIcon: hasIcon, iconPosition, paddingMm, iconSizeMm })

  const baseShape = roundedRectShape(widthMm, heightMm, 1.2)
  const baseGeometry = new THREE.ExtrudeGeometry(baseShape, {
    depth: BASE_THICKNESS_MM,
    bevelEnabled: false,
    curveSegments: 10,
  })

  const parts = [baseGeometry]

  const safeText = (text || '').trim()
  if (safeText) {
    const shapes = font.generateShapes(safeText, 1)
    const probe = new THREE.ShapeGeometry(shapes)
    probe.computeBoundingBox()
    const bb = probe.boundingBox

    if (bb) {
      const sourceW = Math.max(0.1, bb.max.x - bb.min.x)
      const sourceH = Math.max(0.1, bb.max.y - bb.min.y)
      const scale = Math.min(layout.textWidthMm / sourceW, layout.textHeightMm / sourceH) * 0.9
      const textGeometry = new THREE.ExtrudeGeometry(shapes, {
        depth: FEATURE_HEIGHT_MM,
        bevelEnabled: false,
        curveSegments: 8,
      })
      textGeometry.scale(scale, scale, 1)
      textGeometry.computeBoundingBox()
      const tbb = textGeometry.boundingBox

      if (tbb) {
        const centeredW = tbb.max.x - tbb.min.x
        const centeredH = tbb.max.y - tbb.min.y
        const targetX = layout.textX + (layout.textWidthMm - centeredW) / 2
        const targetYTop = layout.textY + (layout.textHeightMm - centeredH) / 2
        const targetY = heightMm - targetYTop - centeredH
        textGeometry.translate(targetX - tbb.min.x, targetY - tbb.min.y, BASE_THICKNESS_MM)
        parts.push(textGeometry)
      }
    }
  }

  if (hasIcon) {
    const svg = new SVGLoader().parse(iconSvgText)
    const iconShapes = []
    for (const path of svg.paths) {
      iconShapes.push(...path.toShapes(true))
    }

    if (iconShapes.length > 0) {
      const iconGeometry = new THREE.ExtrudeGeometry(iconShapes, {
        depth: FEATURE_HEIGHT_MM,
        bevelEnabled: false,
      })
      iconGeometry.scale(1, -1, 1)
      iconGeometry.computeBoundingBox()
      const ibb = iconGeometry.boundingBox

      if (ibb) {
        const sourceW = Math.max(0.1, ibb.max.x - ibb.min.x)
        const sourceH = Math.max(0.1, ibb.max.y - ibb.min.y)
        const scale = Math.min(layout.iconSizeMm / sourceW, layout.iconSizeMm / sourceH)
        iconGeometry.scale(scale, scale, 1)
        iconGeometry.computeBoundingBox()
        const ib2 = iconGeometry.boundingBox

        if (ib2) {
          const iconW = ib2.max.x - ib2.min.x
          const iconH = ib2.max.y - ib2.min.y
          const targetX = layout.iconX + (layout.iconSizeMm - iconW) / 2
          const targetYTop = layout.iconY + (layout.iconSizeMm - iconH) / 2
          const targetY = heightMm - targetYTop - iconH
          iconGeometry.translate(targetX - ib2.min.x, targetY - ib2.min.y, BASE_THICKNESS_MM)
          parts.push(iconGeometry)
        }
      }
    }
  }

  const merged = mergeGeometries(parts)
  return new THREE.Mesh(merged, new THREE.MeshBasicMaterial())
}

export function exportMeshToBinaryStl(mesh) {
  const exporter = new STLExporter()
  return exporter.parse(mesh, { binary: true })
}

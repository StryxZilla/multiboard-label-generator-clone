import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { createLabelMesh, exportMeshToBinaryStl, PRESETS } from '../src/lib/labelEngine.js'

const loader = new STLLoader()

function assertClose(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ~${expected.toFixed(2)} but got ${actual.toFixed(2)}`)
  }
}

for (const preset of PRESETS) {
  const mesh = createLabelMesh({
    text: 'BOLTS',
    widthMm: preset.widthMm,
    heightMm: preset.heightMm,
    iconSvgText: '',
    iconPosition: 'left',
    paddingMm: 2,
    iconSizeMm: 6,
  })

  const stl = exportMeshToBinaryStl(mesh)
  const arrayBuffer = stl instanceof DataView ? stl.buffer : stl
  const parsed = loader.parse(arrayBuffer)
  parsed.computeBoundingBox()
  const bb = parsed.boundingBox

  if (!bb) throw new Error(`${preset.id}: missing bounding box`)

  const width = bb.max.x - bb.min.x
  const height = bb.max.y - bb.min.y
  const depth = bb.max.z - bb.min.z
  const triCount = parsed.getAttribute('position').count / 3

  assertClose(width, preset.widthMm, 0.35, `${preset.id} width`)
  assertClose(height, preset.heightMm, 0.35, `${preset.id} height`)

  if (depth < 1.5 || depth > 2.6) {
    throw new Error(`${preset.id}: depth out of range (${depth.toFixed(2)})`)
  }

  if (triCount < 100) {
    throw new Error(`${preset.id}: mesh too small / suspicious (triangles=${triCount})`)
  }

  console.log(`PASS ${preset.id} -> ${width.toFixed(2)}x${height.toFixed(2)}x${depth.toFixed(2)}mm, tris=${triCount}`)
}

console.log('All STL verification checks passed.')

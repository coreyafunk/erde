import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'

import { Button } from '@/components/ui/button'

import 'leaflet/dist/leaflet.css';

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 400
const CANVAS_SCALE_MULTIPLIER = 0.4

const housePolygon: [number, number][] = [
  [44, 0], // top left
  [680, 0], // top right
  [680, 388], // bottom right
  [278, 388], // garage top right
  [278, 655], // garage bottom right
  [0, 655], // garage bottom left
  [0, 388], // garage top left
  [44, 388], // bottom left
]

const propertyLines: [number, number][] = [
  [50.066543, -96.474613],
  [50.066616, -96.474048], // Southeast corner
  [50.066674, -96.474071],
  [50.066876, -96.473950],
  [50.067016, -96.473976], // Northeast corner
  [50.066883, -96.474738],
  [50.066863, -96.474898],
  [50.066863, -96.475039], // Northwest corner
  [50.066544, -96.475040], // Southwest corner
  [50.066543, -96.474613]
]

const scale = (value: number) => value * CANVAS_SCALE_MULTIPLIER

const rotate = (polygon: number[][], rotationDegrees: number) => {
  const rotationRadians = rotationDegrees * (Math.PI / 180)
  const cos = Math.cos(rotationRadians)
  const sin = Math.sin(rotationRadians)

  return polygon.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos])
}

function RouteComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotationDegrees, setRotationDegrees] = useState(0)

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const rotatedPolygon = useMemo(() => rotate(housePolygon, rotationDegrees), [rotationDegrees])

  const renderPolygon = useCallback(() => {
    resetCanvas()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const polygonMinX = scale(Math.min(...rotatedPolygon.map(([x]) => x)))
    const polygonMinY = scale(Math.min(...rotatedPolygon.map(([_, y]) => y)))
    const polygonMaxX = scale(Math.max(...rotatedPolygon.map(([x]) => x)))
    const polygonMaxY = scale(Math.max(...rotatedPolygon.map(([_, y]) => y)))

    // Move to the center of the canvas
    ctx.translate((canvas.width / 2) - (polygonMaxX + polygonMinX) / 2, (canvas.height / 2) - (polygonMaxY + polygonMinY) / 2)

    ctx.beginPath()
    ctx.moveTo(scale(rotatedPolygon[0][0]), scale(rotatedPolygon[0][1]))

    let isFirstPoint = true

    for (const [x, y] of rotatedPolygon) {
      if (isFirstPoint) {
        isFirstPoint = false
        continue
      }

      ctx.lineTo(scale(x), scale(y))
    }

    ctx.closePath()

    // Solid line
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fill()

    // Reset the transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Save the current state
    ctx.save()
  }, [rotatedPolygon])

  useEffect(() => {
    renderPolygon()
  }, [renderPolygon])

  return (
    <div className="grid grid-cols-[min-content_auto] gap-4 p-2 h-[100vh] w-[100vw]">
      {/* First column */}
      <div className="flex flex-col gap-1">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-black bg-gray-300 flex-grow-0"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        />
        <label className="flex gap-1">
          <span>Rotate</span>
          <input type="range" min={0} max={359} value={rotationDegrees} onChange={(e) => setRotationDegrees(Number(e.target.value))} />
          <span>{rotationDegrees}°</span>
        </label>
        <div className="flex gap-1">
          <Button onClick={renderPolygon}>Draw</Button>
          <Button onClick={resetCanvas}>Reset</Button>
        </div>
      </div>

      {/* Second column */}
      <div className="flex flex-col gap-1">
        <MapContainer center={[50.066751, -96.474503]} zoom={20} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=9edd3314110745a8929b01d429ad5899"
            maxZoom={22}
            minZoom={1}
          />
          {/* Property lines */}
          <Polyline positions={propertyLines} pathOptions={{ color: '#ff0000', weight: 3 }} />

          {/* House */}
          {/* <Polygon positions={} /> */}
        </MapContainer>
      </div>
    </div>
  )
}

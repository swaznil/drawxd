// src/engine/Canvas.jsx
import { useEffect, useRef, useState } from "react"
import { createCamera } from "./camera"
import { drawGrid } from "./grid"
import { drawShapes } from "./renderer"
import { screenToWorld } from "./utils"

export default function Canvas({ tool, clearSignal }) {
  const canvasRef = useRef(null)
  const cameraRef = useRef(createCamera())
  const shapesRef = useRef([])
  const currentShapeRef = useRef(null)
  const selectedIdRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const interactionRef = useRef({ mode: "idle", pointerId: null, startX: 0, startY: 0, shapeStart: null, shape: null })
  const lastRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener("resize", resize)

    const getWorldPosition = (x, y) => screenToWorld(x, y, cameraRef.current)

    const findShapeAtPoint = (point) => {
      for (let i = shapesRef.current.length - 1; i >= 0; i -= 1) {
        const shape = shapesRef.current[i]
        if (shape.type === "rect") {
          const x1 = Math.min(shape.x, shape.x + shape.width)
          const x2 = Math.max(shape.x, shape.x + shape.width)
          const y1 = Math.min(shape.y, shape.y + shape.height)
          const y2 = Math.max(shape.y, shape.y + shape.height)
          if (point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2) {
            return shape
          }
        }
      }
      return null
    }

    const clampZoom = (zoom) => Math.min(6, Math.max(0.25, zoom))

    const setSelectedShape = (shape) => {
      const id = shape ? shape.id : null
      selectedIdRef.current = id
      setSelectedId(id)
    }

    const releaseCapture = () => {
      const pointerId = interactionRef.current.pointerId
      if (pointerId !== null) {
        try {
          canvas.releasePointerCapture(pointerId)
        } catch {
          // no-op
        }
      }
    }

    const cancelInteraction = () => {
      if (interactionRef.current.mode === "create" && interactionRef.current.shape) {
        shapesRef.current = shapesRef.current.filter((item) => item.id !== interactionRef.current.shape.id)
        setSelectedShape(null)
      }
      interactionRef.current = { mode: "idle", pointerId: null, startX: 0, startY: 0, shapeStart: null, shape: null }
      currentShapeRef.current = null
      lastRef.current = { x: 0, y: 0 }
      releaseCapture()
    }

    let animationFrame = 0
    const render = () => {
      const camera = cameraRef.current
      const width = window.innerWidth
      const height = window.innerHeight
      ctx.clearRect(0, 0, width, height)
      drawGrid(ctx, camera, width, height)
      drawShapes(ctx, camera, shapesRef.current, selectedIdRef.current)
      animationFrame = requestAnimationFrame(render)
    }

    render()

    const startPan = (event) => {
      interactionRef.current = { mode: "pan", pointerId: event.pointerId }
      lastRef.current = { x: event.clientX, y: event.clientY }
      canvas.setPointerCapture(event.pointerId)
    }

    const startCreate = (event) => {
      const point = getWorldPosition(event.clientX, event.clientY)
      const shape = {
        id: crypto.randomUUID(),
        type: "rect",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      }
      shapesRef.current.push(shape)
      currentShapeRef.current = shape
      interactionRef.current = { mode: "create", pointerId: event.pointerId, startX: point.x, startY: point.y, shape }
      setSelectedShape(shape)
      canvas.setPointerCapture(event.pointerId)
    }

    const startDrag = (event, shape) => {
      const point = getWorldPosition(event.clientX, event.clientY)
      const index = shapesRef.current.findIndex((item) => item.id === shape.id)
      if (index >= 0 && index !== shapesRef.current.length - 1) {
        shapesRef.current.splice(index, 1)
        shapesRef.current.push(shape)
      }
      interactionRef.current = {
        mode: "drag",
        pointerId: event.pointerId,
        startX: point.x,
        startY: point.y,
        shapeStart: { x: shape.x, y: shape.y },
        shape,
      }
      setSelectedShape(shape)
      canvas.setPointerCapture(event.pointerId)
    }

    const pointerDown = (event) => {
      if (event.button === 1 || event.button === 2) {
        event.preventDefault()
        startPan(event)
        return
      }

      if (event.button !== 0) {
        return
      }

      if (tool === "rect") {
        startCreate(event)
        return
      }

      if (tool === "select") {
        const point = getWorldPosition(event.clientX, event.clientY)
        const hit = findShapeAtPoint(point)
        if (hit) {
          startDrag(event, hit)
          return
        }
        setSelectedShape(null)
      }
    }

    const pointerMove = (event) => {
      const camera = cameraRef.current
      const interaction = interactionRef.current

      if (interaction.mode === "pan") {
        const dx = (event.clientX - lastRef.current.x) / camera.zoom
        const dy = (event.clientY - lastRef.current.y) / camera.zoom
        camera.x += dx
        camera.y += dy
        lastRef.current = { x: event.clientX, y: event.clientY }
        return
      }

      if (interaction.mode === "create" && currentShapeRef.current) {
        const point = getWorldPosition(event.clientX, event.clientY)
        currentShapeRef.current.width = point.x - currentShapeRef.current.x
        currentShapeRef.current.height = point.y - currentShapeRef.current.y
        return
      }

      if (interaction.mode === "drag" && interaction.shape) {
        const point = getWorldPosition(event.clientX, event.clientY)
        interaction.shape.x = interaction.shapeStart.x + (point.x - interaction.startX)
        interaction.shape.y = interaction.shapeStart.y + (point.y - interaction.startY)
      }
    }

    const pointerUp = () => {
      const interaction = interactionRef.current
      if (interaction.mode === "create" && interaction.shape) {
        const shape = interaction.shape
        if (Math.abs(shape.width) < 8 || Math.abs(shape.height) < 8) {
          shapesRef.current = shapesRef.current.filter((item) => item.id !== shape.id)
          setSelectedShape(null)
        }
      }
      interactionRef.current = { mode: "idle", pointerId: null, startX: 0, startY: 0, shapeStart: null, shape: null }
      currentShapeRef.current = null
      releaseCapture()
    }

    const wheel = (event) => {
      event.preventDefault()
      const camera = cameraRef.current
      const before = getWorldPosition(event.clientX, event.clientY)
      camera.zoom = clampZoom(camera.zoom * (event.deltaY > 0 ? 0.9 : 1.1))
      const after = getWorldPosition(event.clientX, event.clientY)
      camera.x += after.x - before.x
      camera.y += after.y - before.y
    }

    const handleKeyDown = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedIdRef.current) {
          shapesRef.current = shapesRef.current.filter((shape) => shape.id !== selectedIdRef.current)
          setSelectedShape(null)
        }
      }

      if (event.key === "Escape") {
        cancelInteraction()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    canvas.addEventListener("pointerdown", pointerDown)
    window.addEventListener("pointermove", pointerMove)
    window.addEventListener("pointerup", pointerUp)
    canvas.addEventListener("wheel", wheel, { passive: false })
    canvas.addEventListener("contextmenu", (event) => event.preventDefault())

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", resize)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("pointermove", pointerMove)
      window.removeEventListener("pointerup", pointerUp)
      canvas.removeEventListener("pointerdown", pointerDown)
      canvas.removeEventListener("wheel", wheel)
    }
  }, [tool, clearSignal])

  useEffect(() => {
    if (clearSignal > 0) {
      shapesRef.current = []
      setSelectedShape(null)
    }
  }, [clearSignal])

  return <canvas ref={canvasRef} className="canvas" />
}

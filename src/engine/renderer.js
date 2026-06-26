export function drawShapes(ctx, camera, shapes, selectedId) {
  ctx.save()
  ctx.translate(camera.x * camera.zoom, camera.y * camera.zoom)
  ctx.scale(camera.zoom, camera.zoom)

  for (const shape of shapes) {
    if (shape.type === "rect") {
      const isSelected = shape.id === selectedId
      ctx.beginPath()
      ctx.rect(shape.x, shape.y, shape.width, shape.height)
      ctx.fillStyle = isSelected ? "#1d4ed855" : "#2563eb55"
      ctx.strokeStyle = isSelected ? "#38bdf8" : "#3b82f6"
      ctx.lineWidth = 2 / camera.zoom
      ctx.fill()
      ctx.stroke()

      if (isSelected) {
        ctx.save()
        ctx.strokeStyle = "#38bdf8"
        ctx.lineWidth = 1.5 / camera.zoom
        ctx.setLineDash([8 / camera.zoom, 6 / camera.zoom])
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
        ctx.restore()
      }
    }
  }

  ctx.restore()
}

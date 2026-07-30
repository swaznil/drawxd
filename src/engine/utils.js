export function screenToWorld(x, y, camera) {
  return {
    x: (x - camera.x * camera.zoom) / camera.zoom,
    y: (y - camera.y * camera.zoom) / camera.zoom,
  };
}

export function pointerToCanvas(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
    pressure:
      event.pointerType === "pen" && event.pressure > 0
        ? event.pressure
        : 0.5,
  };
}

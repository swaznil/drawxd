export function screenToWorld(x, y, camera) {
  return {
    x: (x - camera.x * camera.zoom) / camera.zoom,
    y: (y - camera.y * camera.zoom) / camera.zoom,
  };
}

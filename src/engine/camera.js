export function createCamera() {
  return {
    x: 0,
    y: 0,
    zoom: 1,
  };
}

export function panCamera(camera, dx, dy) {
  camera.x += dx / camera.zoom;
  camera.y += dy / camera.zoom;
}

export function zoomCamera(camera, mouseBeforeZoom, mouseAfterZoom) {
  camera.x += mouseAfterZoom.x - mouseBeforeZoom.x;
  camera.y += mouseAfterZoom.y - mouseBeforeZoom.y;
}

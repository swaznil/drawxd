import { GRID_SIZE } from "./constants";

export function drawGrid(ctx, camera, width, height, bgColor) {
  ctx.save();

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  const scaled = GRID_SIZE * camera.zoom;

  const offsetX = (camera.x * camera.zoom) % scaled;
  const offsetY = (camera.y * camera.zoom) % scaled;

  for (let x = -scaled + offsetX; x <= width + scaled; x += scaled) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = -scaled + offsetY; y <= height + scaled; y += scaled) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}
export function drawGrid(ctx, camera, width, height) {
  const size = 50;

  ctx.save();

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#1f1f1f";
  ctx.lineWidth = 1;

  const scaled = size * camera.zoom;

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

import { getShape } from "./registry";

export function drawShapes(ctx, camera, shapes, selected) {
  ctx.save();

  ctx.translate(camera.x * camera.zoom, camera.y * camera.zoom);

  ctx.scale(camera.zoom, camera.zoom);

  for (const item of shapes) {
    const shapeDef = getShape(item.type);

    if (!shapeDef) continue;

    ctx.lineWidth = 2 / camera.zoom;

    ctx.strokeStyle =
      item === selected ? "#3b82f6" : "#e5e7eb";

    ctx.fillStyle = "#2563eb33";

    shapeDef.render(ctx, item);
  }

  ctx.restore();
}
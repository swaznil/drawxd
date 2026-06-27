import { getShape } from "./registry";

export function drawShapes(ctx, camera, shapes, selected) {
  ctx.save();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.translate(camera.x * camera.zoom, camera.y * camera.zoom);

  ctx.scale(camera.zoom, camera.zoom);

  for (const shape of shapes) {
    ctx.lineWidth = 2 / camera.zoom;

    if (shape === selected) {
      ctx.strokeStyle = "#3b82f6";
    } else {
      ctx.strokeStyle = "#e5e7eb";
    }

    ctx.fillStyle = "#2563eb33";

    const shapeDef = getShape(shape.type);

    shapeDef?.render(ctx, shape, camera);
  }

  ctx.restore();
}

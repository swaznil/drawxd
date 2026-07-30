import { getShape } from "./registry";
import { getSelectionBounds, normalizeBounds } from "./shapeUtils";

function drawHandle(ctx, x, y, zoom) {
  const size = 8 / zoom;

  ctx.beginPath();
  ctx.rect(x - size / 2, y - size / 2, size, size);

  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1 / zoom;

  ctx.stroke();
}

function drawSelection(ctx, shapes, zoom) {
  const bounds = getSelectionBounds(shapes);

  if (!bounds) {
    return;
  }

  ctx.save();

  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1 / zoom;

  ctx.setLineDash([6 / zoom, 4 / zoom]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.setLineDash([]);

  if (shapes.length === 1 && !shapes[0].points) {
    drawHandle(ctx, bounds.x, bounds.y, zoom);
    drawHandle(ctx, bounds.x + bounds.width, bounds.y, zoom);
    drawHandle(ctx, bounds.x, bounds.y + bounds.height, zoom);
    drawHandle(
      ctx,
      bounds.x + bounds.width,
      bounds.y + bounds.height,
      zoom,
    );
  }

  ctx.restore();
}

function drawSelectionBox(ctx, box, zoom) {
  if (!box) {
    return;
  }

  ctx.save();
  const bounds = normalizeBounds(box.x, box.y, box.width, box.height);

  ctx.strokeStyle = "#60a5fa";
  ctx.fillStyle = "rgba(96,165,250,0.12)";

  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([8 / zoom, 6 / zoom]);
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

  ctx.restore();
}

function drawEraserTrail(ctx, trail, zoom) {
  if (!trail || trail.length < 2) {
    return;
  }

  ctx.save();

  ctx.strokeStyle = "rgba(239,68,68,0.9)";
  ctx.lineWidth = 6 / zoom;
  ctx.setLineDash([10, 10]);

  ctx.beginPath();

  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];

    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }

  ctx.stroke();

  ctx.restore();
}

export function drawShapes(
  ctx,
  camera,
  shapes,
  selectedShapes,
  selectionBox,
  eraserTrail,
  defaultStroke,
) {
  ctx.save();

  ctx.translate(camera.x * camera.zoom, camera.y * camera.zoom);

  ctx.scale(camera.zoom, camera.zoom);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const shape of shapes) {
    const shapeDef = getShape(shape.type);

    if (!shapeDef) {
      continue;
    }

    ctx.save();
    ctx.globalAlpha = shape.opacity ?? 1;
    ctx.strokeStyle = shape.stroke || defaultStroke;

    ctx.fillStyle = shape.fill || "transparent";
    ctx.lineWidth = (shape.strokeWidth || 2) / camera.zoom;

    shapeDef.render(ctx, shape);
    ctx.restore();
  }

  if (selectedShapes.length) {
    drawSelection(ctx, selectedShapes, camera.zoom);
  }

  drawSelectionBox(ctx, selectionBox, camera.zoom);
  drawEraserTrail(ctx, eraserTrail, camera.zoom);

  ctx.restore();
}

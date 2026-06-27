import { getShape } from "./registry";
import { getSelectionBounds } from "./shapeUtils";

function drawHandle(ctx, x, y) {
  ctx.beginPath();
  ctx.rect(x - 5, y - 5, 10, 10);

  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1;

  ctx.stroke();
}

function drawSelection(ctx, shapes) {
  const bounds = getSelectionBounds(shapes);

  if (!bounds) {
    return;
  }

  ctx.save();

  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1;

  ctx.setLineDash([6, 4]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.setLineDash([]);

  drawHandle(ctx, bounds.x, bounds.y);
  drawHandle(ctx, bounds.x + bounds.width, bounds.y);
  drawHandle(ctx, bounds.x, bounds.y + bounds.height);
  drawHandle(ctx, bounds.x + bounds.width, bounds.y + bounds.height);

  ctx.restore();
}

function drawSelectionBox(ctx, box) {
  if (!box) {
    return;
  }

  ctx.save();

  ctx.strokeStyle = "#60a5fa";
  ctx.fillStyle = "rgba(96,165,250,0.12)";

  ctx.setLineDash([8, 6]);

  ctx.fillRect(box.x, box.y, box.width, box.height);

  ctx.strokeRect(box.x, box.y, box.width, box.height);

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

    ctx.strokeStyle = shape.stroke || "#e5e7eb";

    ctx.fillStyle = shape.fill || "transparent";

    ctx.lineWidth = (shape.strokeWidth || 2) / camera.zoom;

    shapeDef.render(ctx, shape);
  }

  if (selectedShapes.length) {
    drawSelection(ctx, selectedShapes);
  }

  drawSelectionBox(ctx, selectionBox);

  drawEraserTrail(ctx, eraserTrail, camera.zoom);

  ctx.restore();
}
export function drawShapes(ctx, camera, shapes, selected) {
  ctx.save();

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

    if (shape.type === "rect") {
      ctx.beginPath();
      ctx.rect(shape.x, shape.y, shape.width, shape.height);
      ctx.fill();
      ctx.stroke();
    }

    if (shape.type === "ellipse") {
      ctx.beginPath();

      ctx.ellipse(
        shape.x + shape.width / 2,
        shape.y + shape.height / 2,
        Math.abs(shape.width / 2),
        Math.abs(shape.height / 2),
        0,
        0,
        Math.PI * 2,
      );

      ctx.fill();
      ctx.stroke();
    }

    if (shape.type === "line") {
      ctx.beginPath();

      ctx.moveTo(shape.x, shape.y);

      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);

      ctx.stroke();
    }

    if (shape.type === "pencil") {
      ctx.beginPath();

      shape.points.forEach((p, index) => {
        if (index === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });

      ctx.stroke();
    }

    if (shape.type === "text") {
      ctx.fillStyle = "white";

      ctx.font = `${16 / camera.zoom}px sans-serif`;

      ctx.fillText(shape.text, shape.x, shape.y);
    }
  }
  ctx.restore();
}
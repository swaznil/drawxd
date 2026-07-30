import { Star } from "lucide-react";

export default {
  type: "star",
  label: "Star",
  icon: Star,

  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "star",
      x,
      y,
      width: 0,
      height: 0,
    };
  },

  update(shape, pos) {
    shape.width = pos.x - shape.x;
    shape.height = pos.y - shape.y;
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },

  render(ctx, shape) {
    const spikes = 5;

    const outerRadiusX = Math.abs(shape.width) / 2;
    const outerRadiusY = Math.abs(shape.height) / 2;
    const innerRadiusX = outerRadiusX / 2;
    const innerRadiusY = outerRadiusY / 2;
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;

    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadiusY);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(
        cx + Math.cos(rot) * outerRadiusX,
        cy + Math.sin(rot) * outerRadiusY,
      );

      rot += step;

      ctx.lineTo(
        cx + Math.cos(rot) * innerRadiusX,
        cy + Math.sin(rot) * innerRadiusY,
      );

      rot += step;
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },

  hitTest(shape, x, y) {
    return (
      x >= Math.min(shape.x, shape.x + shape.width) &&
      x <= Math.max(shape.x, shape.x + shape.width) &&
      y >= Math.min(shape.y, shape.y + shape.height) &&
      y <= Math.max(shape.y, shape.y + shape.height)
    );
  },
};

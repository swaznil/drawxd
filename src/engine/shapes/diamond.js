export default {
  type: "diamond",

  label: "Diamond",

  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "diamond",
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
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;

    ctx.beginPath();

    ctx.moveTo(cx, shape.y);
    ctx.lineTo(shape.x + shape.width, cy);
    ctx.lineTo(cx, shape.y + shape.height);
    ctx.lineTo(shape.x, cy);

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
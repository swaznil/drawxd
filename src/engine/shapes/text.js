import { Type } from "lucide-react";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_HEIGHT,
  DEFAULT_TEXT_WIDTH,
} from "../constants";

function wrapText(ctx, text, maxWidth) {
  const lines = [];

  text.split("\n").forEach((paragraph) => {
    if (!paragraph) {
      lines.push("");
      return;
    }

    const words = paragraph.split(/\s+/);
    let line = words.shift() || "";

    words.forEach((word) => {
      const candidate = `${line} ${word}`;

      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    });

    lines.push(line);
  });
  
  return lines;
}

export default {
  type: "text",
  label: "Text",
  icon: Type,

  create(
    x,
    y,
    text = "",
    width = DEFAULT_TEXT_WIDTH,
    height = DEFAULT_TEXT_HEIGHT,
  ) {
    return {
      id: crypto.randomUUID(),
      type: "text",
      x,
      y,
      text,
      width,
      height,
      fontSize: DEFAULT_FONT_SIZE,
    };
  },

  update() {},

  render(ctx, shape) {
    ctx.save();
    ctx.font = `${shape.fontSize}px Inter`;
    ctx.fillStyle = shape.fill || ctx.strokeStyle;
    ctx.textBaseline = "top";

    const lineHeight = shape.fontSize * 1.3;
    const lines = wrapText(ctx, shape.text, shape.width);

    lines.forEach((line, i) => {
      ctx.fillText(line, shape.x, shape.y + i * lineHeight);
    });

    ctx.restore();
  },

  hitTest(shape, x, y) {
    return (
      x >= shape.x &&
      x <= shape.x + shape.width &&
      y >= shape.y &&
      y <= shape.y + shape.height
    );
  },

  getBounds(shape) {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };
  },
};

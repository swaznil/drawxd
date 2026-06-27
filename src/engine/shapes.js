export function createShape(type, data) {
  return {
    id: crypto.randomUUID(),
    type,
    ...data,
  };
}

export function createRect(x, y) {
  return {
    id: crypto.randomUUID(),
    type: "rect",
    x,
    y,
    width: 0,
    height: 0,
  };
}

export function createEllipse(x, y) {
  return {
    id: crypto.randomUUID(),
    type: "ellipse",
    x,
    y,
    width: 0,
    height: 0,
  };
}

export function createLine(x, y) {
  return {
    id: crypto.randomUUID(),
    type: "line",
    x,
    y,
    width: 0,
    height: 0,
  };
}

export function createPencil(pos) {
  return {
    id: crypto.randomUUID(),
    type: "pencil",
    points: [pos],
  };
}

export function createText(x, y, text) {
  return {
    id: crypto.randomUUID(),
    type: "text",
    x,
    y,
    text,
    width: text.length * 9,
    height: 20,
  };
}

export function updateShape(shape, pos) {
  if (shape.type === "pencil") {
    shape.points.push(pos);
  } else {
    shape.width = pos.x - shape.x;
    shape.height = pos.y - shape.y;
  }
}

export function moveShape(shape, pos, offset) {
  if (shape.type === "pencil") {
    const first = shape.points[0];

    const dx = pos.x - offset.x - first.x;
    const dy = pos.y - offset.y - first.y;

    shape.points = shape.points.map((p) => ({
      x: p.x + dx,
      y: p.y + dy,
    }));
  } else {
    shape.x = pos.x - offset.x;
    shape.y = pos.y - offset.y;
  }
}

function distanceToLine(x1, y1, x2, y2, px, py) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx;
  let yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

export function getShapeAt(shapes, x, y, zoom) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];

    if (s.type === "rect" || s.type === "ellipse") {
      if (
        x >= Math.min(s.x, s.x + s.width) &&
        x <= Math.max(s.x, s.x + s.width) &&
        y >= Math.min(s.y, s.y + s.height) &&
        y <= Math.max(s.y, s.y + s.height)
      ) {
        return s;
      }
    }

    if (s.type === "line") {
      const dist = distanceToLine(
        s.x,
        s.y,
        s.x + s.width,
        s.y + s.height,
        x,
        y,
      );

      if (dist < 8 / zoom) {
        return s;
      }
    }

    if (s.type === "pencil") {
      for (let p = 0; p < s.points.length - 1; p++) {
        const a = s.points[p];
        const b = s.points[p + 1];

        const dist = distanceToLine(a.x, a.y, b.x, b.y, x, y);

        if (dist < 8 / zoom) {
          return s;
        }
      }
    }

    if (s.type === "text") {
      if (x >= s.x && x <= s.x + s.width && y >= s.y - s.height && y <= s.y) {
        return s;
      }
    }
  }

  return null;
}
export function normalizeBounds(x, y, width, height) {
  return {
    x: width < 0 ? x + width : x,
    y: height < 0 ? y + height : y,
    width: Math.abs(width),
    height: Math.abs(height),
  };
}

export function boundsHitTest(bounds, px, py) {
  return (
    px >= bounds.x &&
    px <= bounds.x + bounds.width &&
    py >= bounds.y &&
    py <= bounds.y + bounds.height
  );
}

export function pointInBounds(shape, x, y) {
  const b = getBounds(shape);

  return boundsHitTest(b, x, y);
}

export function getBounds(shape) {
  if (shape.points?.length) {
    const xs = shape.points.map((p) => p.x);
    const ys = shape.points.map((p) => p.y);

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  return normalizeBounds(shape.x, shape.y, shape.width || 0, shape.height || 0);
}

export function boundsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getSelectionBounds(shapes) {
  if (!shapes.length) {
    return null;
  }

  const bounds = shapes.map(getBounds);

  const minX = Math.min(...bounds.map((b) => b.x));
  const minY = Math.min(...bounds.map((b) => b.y));
  const maxX = Math.max(...bounds.map((b) => b.x + b.width));
  const maxY = Math.max(...bounds.map((b) => b.y + b.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function resizeShape(shape, handle, dx, dy) {
  if (shape.points) {
    return;
  }

  switch (handle) {
    case "tl":
      shape.x += dx;
      shape.y += dy;
      shape.width -= dx;
      shape.height -= dy;
      break;

    case "tr":
      shape.y += dy;
      shape.width += dx;
      shape.height -= dy;
      break;

    case "bl":
      shape.x += dx;
      shape.width -= dx;
      shape.height += dy;
      break;

    case "br":
      shape.width += dx;
      shape.height += dy;
      break;
  }
}

export function moveShape(shape, dx, dy) {
  if (shape.points) {
    shape.points = shape.points.map((p) => ({
      x: p.x + dx,
      y: p.y + dy,
    }));

    return;
  }

  shape.x += dx;
  shape.y += dy;
}

export function distanceToLine(x1, y1, x2, y2, px, py) {
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
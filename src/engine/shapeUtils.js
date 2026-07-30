const boundsCache = new WeakMap();

export function invalidateShapeBounds(shape) {
  if (shape && typeof shape === "object") {
    boundsCache.delete(shape);
  }
}

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
  const cached = boundsCache.get(shape);

  if (cached) {
    return cached;
  }

  let bounds;

  if (shape.points?.length) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of shape.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else {
    bounds = normalizeBounds(
      shape.x,
      shape.y,
      shape.width || 0,
      shape.height || 0,
    );
  }

  boundsCache.set(shape, bounds);
  return bounds;
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

  invalidateShapeBounds(shape);
}

export function moveShape(shape, dx, dy) {
  if (shape.points) {
    shape.points = shape.points.map((p) => ({
      ...p,
      x: p.x + dx,
      y: p.y + dy,
    }));

    invalidateShapeBounds(shape);
    return;
  }

  shape.x += dx;
  shape.y += dy;
  invalidateShapeBounds(shape);
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

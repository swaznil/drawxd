const registry = {};

export function registerShape(shape) {
  registry[shape.type] = shape;
}

export function getShape(type) {
  return registry[type];
}

export function getAllShapes() {
  return Object.values(registry);
}
export function createShape(type, data) {
  return {
    id: crypto.randomUUID(),
    type,
    ...data,
  };
}

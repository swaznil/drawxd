export const LOCAL_PROJECT_KEY = "drawxd:autosave:v1";
export const PROJECT_VERSION = 1;

export function createProjectData(shapes, camera, background) {
  return {
    app: "drawxd",
    version: PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    background,
    camera: {
      x: camera.x,
      y: camera.y,
      zoom: camera.zoom,
    },
    shapes: structuredClone(shapes),
  };
}

export function parseProjectData(value) {
  const project = typeof value === "string" ? JSON.parse(value) : value;

  if (!project || project.app !== "drawxd" || !Array.isArray(project.shapes)) {
    throw new Error("This is not a valid drawxd project file.");
  }

  if (project.version > PROJECT_VERSION) {
    throw new Error("This project was created by a newer drawxd version.");
  }

  return project;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

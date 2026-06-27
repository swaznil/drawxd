import { getAllShapes } from "../engine/registry";

export default function ShapePanel({ tool, setTool }) {
  const shapes = getAllShapes();

  return (
    <div className="shape-panel">
      {shapes.map((shape) => (
        <button
          key={shape.type}
          className={`tool-btn ${
            tool === shape.type ? "active" : ""
          }`}
          onClick={() => setTool(shape.type)}
        >
          {shape.label}
        </button>
      ))}
    </div>
  );
}
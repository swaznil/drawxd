import { useState, useRef } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./engine/Canvas";
import ShapePanel from "./components/ShapePanel";

export default function App() {
  const [tool, setTool] = useState("select");
  const canvasRef = useRef(null);

  const clearCanvas = () => {
    canvasRef.current?.clear();
  };

  const undo = () => {
    canvasRef.current?.undo();
  };

  const redo = () => {
    canvasRef.current?.redo();
  };

  return (
    <div className="app">
      <Toolbar
        tool={tool}
        setTool={setTool}
        onClear={clearCanvas}
        onUndo={undo}
        onRedo={redo}
      />

      <ShapePanel
        tool={tool}
        setTool={setTool}
      />

      <Canvas ref={canvasRef} tool={tool} />
    </div>
  );
}

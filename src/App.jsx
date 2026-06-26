import { useState, useRef } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./engine/Canvas";

export default function App() {
  const [tool, setTool] = useState("select");
  const canvasRef = useRef(null);

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  };

  return (
    <div className="app">
      <Toolbar tool={tool} setTool={setTool} onClear={clearCanvas} />

      <Canvas ref={canvasRef} tool={tool} />
    </div>
  );
}

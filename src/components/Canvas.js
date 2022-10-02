import React, { useRef, useEffect } from "react";
import Paper from "paper";

const Canvas = (props) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    Paper.setup(canvas);

    props.functionality();

    Paper.view.draw();
  }, []);

  return (
    <canvas ref={canvasRef} {...props.canvasProps} id="canvas" resize="true" />
  );
};

export default Canvas;

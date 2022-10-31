import React, { useRef, useEffect } from "react";
import Paper from "paper";

const Canvas = (props) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    const canvasWidth = (window.innerWidth * 2) / 3;
    const scale = canvasWidth / 1280;

    Paper.setup(canvas);
    Paper.view.scaling = new Paper.Point(scale, scale);

    props.functionality();
    Paper.view.draw();
    // 1280 x 937
  }, []);

  return (
    <canvas ref={canvasRef} {...props.canvasProps} id="canvas" resize="true" />
  );
};

export default Canvas;

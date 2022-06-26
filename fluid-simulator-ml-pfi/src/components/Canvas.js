import React, { useRef, useEffect } from "react";
import Paper from "paper";
import { Point, Size } from "paper/dist/paper-core";

const Canvas = (props) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    Paper.setup(canvas);

    var path = new Paper.Path.Rectangle(Paper.view.center, new Size(200, 5));
    path.style = {
      fillColor: "white",
      strokeColor: "black",
    };

    const point = path.bounds.leftCenter;

    Paper.view.onFrame = (event) => {
      path.rotate(event.delta * 90, point);
    };

    Paper.view.draw();
  }, []);

  return <canvas ref={canvasRef} {...props} id="canvas" resize="true" />;
};

export default Canvas;

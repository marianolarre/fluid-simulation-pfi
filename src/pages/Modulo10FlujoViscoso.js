import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import { Path, view, Color, Point, Size, Rectangle } from "paper";
import SliderWithInput from "../components/SliderWithInput";
import { ScrollingRectangle } from "../paperUtility";

class Modulo10FlujoViscoso extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    line: null,
    ready: false,
  };

  onValueChanged = (event) => {
    this.setState({ value: event.target.value });
  };

  update(delta) {
    if (this.state.ready) {
      this.state.scrollingRectangle.update(delta);
    }
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const scrollingRectangle = new ScrollingRectangle(
      new Point(200, 200),
      new Size(100, 50),
      45,
      -30,
      3,
      "#0088aa",
      "#00ccff"
    );

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.ready = true;
    newState.scrollingRectangle = scrollingRectangle;
    this.setState(newState);

    view.onFrame = (event) => {
      this.update(event.delta);
    };

    window.addEventListener(
      "resize",
      (event) => {
        // Update
      },
      true
    );
  }

  render() {
    return (
      <PanelAndCanvas
        title="Flujo viscoso"
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}></Grid>
            </Grid>
          </>
        }
        canvas={
          <Canvas
            functionality={() => this.canvasFunction(this.state)}
          ></Canvas>
        }
      ></PanelAndCanvas>
    );
  }
}

export default Modulo10FlujoViscoso;

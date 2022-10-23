import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import { view, Point, Path, Rectangle } from "paper";
import SliderWithInput from "../components/SliderWithInput";

class ModuloPlantilla extends Component {
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

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const line = new Path.Line(new Point(100, 100), new Point(200, 200));
    line.style = {
      strokeColor: "black",
      strokeWidth: 4,
    };

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.line = line;
    newState.ready = true;
    this.setState(newState);

    /*view.onFrame = (event) => {
      this.update(event.delta);
    };*/

    window.addEventListener(
      "resize",
      (event) => {
        // Update
      },
      true
    );
  }

  getParameterCode() {
    let module = "X";
    let codeVersion = "1";
    return [module, codeVersion].join(";");
  }

  loadParameterCode(code) {
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    if (codeVersion == 1) {
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Plantilla"
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="Valor"
                  step={1}
                  min={0}
                  max={100}
                  unit="cm"
                  value={this.state.value}
                  onChange={this.onValueChanged}
                ></SliderWithInput>
              </Grid>
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

export default ModuloPlantilla;

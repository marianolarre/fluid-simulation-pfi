import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import Paper from "paper";
import { Color, Point } from "paper/dist/paper-core";
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
    var newState = { ...this.state };
    newState.value = event.target.value;
    this.setState(newState);
  };

  canvasFunction() {
    const center = Paper.view.center;

    const background = new Paper.Path.Rectangle(
      new Paper.Rectangle(new Paper.Point(0, 0), Paper.view.size)
    );
    background.fillColor = "white";

    const line = new Paper.Path.Line(
      new Paper.Point(100, 100),
      new Paper.Point(200, 200)
    );
    line.style = {
      strokeColor: "black",
      strokeWidth: 4,
    };

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.line = line;
    newState.ready = true;
    this.setState(newState);

    /*Paper.view.onFrame = (event) => {
      this.update(event.delta);
    };*/
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

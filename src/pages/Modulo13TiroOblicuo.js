import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import { view, Point, Path, Rectangle, Shape, Size, Group } from "paper";
import SliderWithInput from "../components/SliderWithInput";
import { addPoints } from "../paperUtility";

class Modulo13TiroOblicuo extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    line: null,
    ready: false,
    cannon: {
      group: null,
      angle: 45,
      pivot: 0,
      length: 100,
    },
    reynolds: 1,
    rugosity: 1,
    initialSpeed: 100,
    gravity: 1,
    airDensity: 1,
    airViscosity: 1,
    bodyDensity: 10,
  };

  onReynoldsChanged = (newValue) => {
    this.setState({ reynolds: newValue });
  };
  onRugosityChanged = (newValue) => {
    this.setState({ rugosity: newValue });
  };
  onInitialSpeedChanged = (newValue) => {
    this.setState({ initialSpeed: newValue });
  };
  onAngleChanged = (newValue) => {
    const cannonCopy = { ...this.state.cannon };
    cannonCopy.angle = newValue;
    this.setState({ cannon: cannonCopy }, this.updateCannon);
  };
  onGravityChanged = (newValue) => {
    this.setState({ gravity: newValue });
  };
  onAirDensityChanged = (newValue) => {
    this.setState({ airDensity: newValue });
  };
  onAirViscosityChanged = (newValue) => {
    this.setState({ airViscosity: newValue });
  };
  onBodyDensityChanged = (newValue) => {
    this.setState({ bodyDensity: newValue });
  };

  update(delta) {
    if (this.state.ready) {
    }
  }

  updateCannon() {
    this.state.cannon.group.rotation = -this.state.cannon.angle;
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const cannonPos = addPoints(view.bounds.bottomLeft, new Point(100, -100));
    const cannonShape = new Shape.Rectangle(
      new Rectangle(new Point(-15, -15), new Size(this.state.cannon.length, 30))
    );
    cannonShape.style = {
      fillColor: "black",
    };
    const cannonGroup = new Group([cannonShape]);
    cannonGroup.pivot = new Point(0, 0);
    cannonGroup.applyMatrix = false;
    cannonGroup.translate(cannonPos);

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.ready = true;
    newState.cannon.group = cannonGroup;
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
        title="Tiro oblícuo"
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="Número de Reynolds"
                  step={1}
                  min={0}
                  max={100}
                  value={this.state.reynolds}
                  onChange={this.onReynoldsChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Rugosidad"
                  step={1}
                  min={0}
                  max={100}
                  value={this.state.rugosity}
                  onChange={this.onRugosityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Velocidad Inicial"
                  step={1}
                  min={0}
                  max={100}
                  unit="m/s"
                  value={this.state.initialSpeed}
                  onChange={this.onInitialSpeedChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Angulo"
                  step={1}
                  min={0}
                  max={90}
                  unit="º"
                  value={this.state.cannon.angle}
                  onChange={this.onAngleChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Gravedad"
                  step={1}
                  min={0}
                  max={100}
                  unit="m/s^2"
                  value={this.state.gravity}
                  onChange={this.onGravityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del aire"
                  step={1}
                  min={0}
                  max={100}
                  value={this.state.airDensity}
                  onChange={this.onAirDensityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Viscosidad del aire"
                  step={1}
                  min={0}
                  max={100}
                  value={this.state.airViscosity}
                  onChange={this.onAirViscosityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del proyectil"
                  step={1}
                  min={0}
                  max={100}
                  value={this.state.bodyDensity}
                  onChange={this.onBodyDensityChanged}
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

export default Modulo13TiroOblicuo;

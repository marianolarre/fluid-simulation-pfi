import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import { MathComponent } from "mathjax-react";

import { Box, Grid, Typography } from "@mui/material";
import { Path, view, Point, Size, Rectangle, Shape } from "paper";
import SliderWithInput from "../components/SliderWithInput";
import {
  randomRange,
  ScrollingRectangle,
  VectorArray,
  VelocityParticle,
  addPoints,
  mulPoint,
  VectorArrow,
  ColorScaleReference,
} from "../paperUtility";
import PanelModule from "../components/PanelModule";

const liquidWidth = 1000;
const liquidHeight = 400;
const scale = 400;
const particleColor = "white";
const particleWidthScale = 5;
const particleLengthScale = 0.02;
const particleLifetime = 2;

let timeToNextParticle = 0.1;
const particleEmissionRate = 0.05;
const particleBurst = 1;

class Modulo10FlujoViscoso extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    line: null,
    ready: false,
    speed: 0.5,
    dpdx: 0,
    density: 1,
    viscosity: 1,
    particles: [],
    topTangent: null,
    topTensionVector: null,
    bottomTangent: null,
    bottomTensionVector: null,
    showingParticles: true,
    showingTension: false,
    colorGradientScale: null,
  };

  onSpeedChange = (newValue) => {
    this.state.scrollingRectangle.setSpeed(newValue * scale);
    this.setState({ speed: newValue }, this.updateLine);
  };

  onDpDxChange = (newValue) => {
    this.setState({ dpdx: newValue }, this.updateLine);
  };

  onViscosityChange = (newValue) => {
    this.setState({ viscosity: newValue }, this.updateLine);
  };

  onShowingParticlesToggle = (event) => {
    const showingParticles = !this.state.showingParticles;
    this.setState({ showingParticles: showingParticles });
  };

  onShowingTensionToggle = (event) => {
    const showingTension = !this.state.showingTension;
    this.setState({ showingTension: showingTension }, this.updateLine);
  };

  createParticle(position, velocity) {
    for (let i = 0; i < this.state.particles.length; i++) {
      if (!this.state.particles[i].active) {
        var p = this.state.particles[i];
        p.initialize(position, velocity);
        return p;
      }
    }
    var p = new VelocityParticle(
      position,
      velocity,
      particleColor,
      particleLengthScale,
      particleWidthScale,
      particleLifetime
    );
    this.state.particles.push(p);
    return p;
  }

  handleParticleLifetimeEnd(particle) {
    particle.active = false;
  }

  update(delta) {
    if (this.state.ready) {
      this.state.scrollingRectangle.update(delta);
      if (timeToNextParticle > 0) {
        if (this.state.showingParticles) {
          timeToNextParticle -= delta;
          if (timeToNextParticle <= 0) {
            for (let i = 0; i < particleBurst; i++) {
              timeToNextParticle = particleEmissionRate;
              const randomPos = new Point(
                randomRange(
                  view.center.x - liquidWidth / 2,
                  view.center.x + liquidWidth / 2
                ),
                randomRange(
                  view.center.y - liquidHeight / 2,
                  view.center.y + liquidHeight / 2
                )
              );
              const velocity = new Point(this.getSpeedAtPoint(randomPos), 0);
              this.createParticle(randomPos, velocity);
            }
          }
        }
      }

      for (let i = 0; i < this.state.particles.length; i++) {
        if (this.state.particles[i].active) {
          this.state.particles[i].setVelocity(
            new Point(
              this.getSpeedAtPoint(this.state.particles[i].position, 0),
              0
            )
          );
          this.state.particles[i].update(delta);
        }
      }
    }
  }

  updateLine() {
    var points = [];
    var magnitudes = [];
    const linex = view.center.x - liquidWidth / 4;
    for (let i = 0; i <= 25; i++) {
      var point = new Point(
        linex,
        view.center.y - liquidHeight / 2 + (i / 25) * liquidHeight
      );
      points.push(point);
      magnitudes.push(this.getSpeedAtPoint(point));
    }
    this.state.vectorArray.SetValues(points, magnitudes);

    this.state.topTangent.visible = this.state.showingTension;
    this.state.bottomTangent.visible = this.state.showingTension;
    this.state.topTensionVector.setVisible(this.state.showingTension);
    this.state.bottomTensionVector.setVisible(this.state.showingTension);
    if (this.state.showingTension) {
      let topTension = -this.getTensionAtPoint(
        new Point(0, view.center.y - liquidHeight / 2),
        1
      );
      var topSlope = topTension / this.state.viscosity;
      var zeroTop = new Point(linex, view.center.y - liquidHeight / 2);
      let lineTop = addPoints(
        zeroTop,
        new Point(this.getSpeedAtPoint(zeroTop), 0)
      );
      var topTensionSlopeDirection = new Point(0, 100);
      if (topTension != 0) {
        topTensionSlopeDirection = new Point(1, 1 / topSlope);
        topTensionSlopeDirection.length = 100;
      }
      this.state.topTangent.segments[0].point = addPoints(
        lineTop,
        topTensionSlopeDirection
      );
      this.state.topTangent.segments[1].point = addPoints(
        lineTop,
        mulPoint(topTensionSlopeDirection, -1)
      );

      this.state.topTensionVector.SetPosition(
        new Point(
          view.center.x + liquidWidth * 0.2 - topTension * 25,
          lineTop.y
        ),
        new Point(
          view.center.x + liquidWidth * 0.2 + topTension * 25,
          lineTop.y
        )
      );

      let bottomTension = this.getTensionAtPoint(
        new Point(0, view.center.y + liquidHeight / 2),
        1
      );
      var bottomSlope = -bottomTension / this.state.viscosity;
      var zeroBottom = new Point(linex, view.center.y + liquidHeight / 2);
      let lineBottom = addPoints(
        zeroBottom,
        new Point(this.getSpeedAtPoint(zeroBottom), 0)
      );
      var bottomTensionSlopeDirection = new Point(0, 100);
      if (bottomTension != 0) {
        bottomTensionSlopeDirection = new Point(1, 1 / bottomSlope);
        bottomTensionSlopeDirection.length = 100;
      }
      this.state.bottomTangent.segments[0].point = addPoints(
        lineBottom,
        bottomTensionSlopeDirection
      );
      this.state.bottomTangent.segments[1].point = addPoints(
        lineBottom,
        mulPoint(bottomTensionSlopeDirection, -1)
      );

      this.state.bottomTensionVector.SetPosition(
        new Point(
          view.center.x + liquidWidth * 0.2 - bottomTension * 25,
          lineBottom.y
        ),
        new Point(
          view.center.x + liquidWidth * 0.2 + bottomTension * 25,
          lineBottom.y
        )
      );
    }
  }

  getSpeedAtPoint(point) {
    let zcenter = view.center.y;
    let h = liquidHeight / 2;
    var y = zcenter - point.y;
    var dpdx = this.state.dpdx / scale;
    var mu = this.state.viscosity;
    var U = this.state.speed * scale;
    return (
      ((-dpdx * h * h) / (2 * mu)) * (1 - (y * y) / (h * h)) +
      (U / 2) * (1 + y / h)
    );
  }

  getTensionAtPoint(point, multiplier) {
    let zcenter = view.center.y;
    let h = liquidHeight / 2;
    var y = zcenter - point.y;
    var dpdx = this.state.dpdx / scale;
    var mu = this.state.viscosity;
    var U = this.state.speed * scale;

    return multiplier * dpdx * y + (mu * U) / (2 * h);
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const scrollingRectangle = new ScrollingRectangle(
      new Point(center.x - liquidWidth / 2, center.y - liquidHeight / 2 - 30),
      new Size(liquidWidth, 30),
      0,
      this.state.speed * scale,
      5,
      "#448844",
      "#66dd66"
    );
    const floorRectangle = new ScrollingRectangle(
      new Point(center.x - liquidWidth / 2, center.y + liquidHeight / 2),
      new Size(liquidWidth, 30),
      0,
      0,
      5,
      "#448844",
      "#55aa55"
    );

    const topTensionVector = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "blue",
      20,
      20,
      30
    );
    const bottomTensionVector = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "blue",
      20,
      20,
      30
    );

    const liquidRectangle = new Shape.Rectangle(
      new Rectangle(
        new Point(center.x - liquidWidth / 2, center.y - liquidHeight / 2),
        new Size(liquidWidth, liquidHeight)
      )
    );
    liquidRectangle.style.fillColor = "#88aaff";

    var points = [];
    var magnitudes = [];
    for (let i = 0; i <= 25; i++) {
      var point = new Point(
        center.x - liquidWidth / 4,
        center.y - liquidHeight / 2 + (i / 25) * liquidHeight
      );
      points.push(point);
      magnitudes.push(this.getSpeedAtPoint(point));
    }
    const vectorArray = new VectorArray(
      points,
      "black",
      3,
      10,
      5,
      20,
      magnitudes
    );
    vectorArray.SetValues(points, magnitudes, 20);

    const topTangent = new Path();
    topTangent.add(new Point(0, 0));
    topTangent.add(new Point(0, 0));
    topTangent.style = {
      strokeWidth: 2,
      strokeColor: "black",
      dashArray: [10, 10],
    };
    const bottomTangent = new Path();
    bottomTangent.add(new Point(0, 0));
    bottomTangent.add(new Point(0, 0));
    bottomTangent.style = {
      strokeWidth: 2,
      strokeColor: "black",
      dashArray: [10, 10],
    };

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.ready = true;
    newState.scrollingRectangle = scrollingRectangle;
    newState.vectorArray = vectorArray;
    newState.topTangent = topTangent;
    newState.topTensionVector = topTensionVector;
    newState.bottomTangent = bottomTangent;
    newState.bottomTensionVector = bottomTensionVector;
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

  getParameterCode() {
    let module = "J";
    let codeVersion = "1";
    return [
      module,
      codeVersion,
      this.state.speed,
      this.state.dpdx,
      this.state.viscosity,
      this.state.showingParticles ? 1 : 0,
      this.state.showingTension ? 1 : 0,
    ].join(";");
  }

  loadParameterCode(code) {
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    if (codeVersion == 1) {
      let speed = parseFloat(split[2]);
      let dpdx = parseFloat(split[3]);
      let viscosity = parseFloat(split[4]);
      let showingParticles = split[5] == 1;
      let showingTension = split[6] == 1;
      this.setState(
        {
          speed,
          dpdx,
          viscosity,
          showingParticles,
          showingTension,
        },
        this.updateLine
      );
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Flujo viscoso"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="Velocidad de la placa"
                  unit="m/s"
                  min={0}
                  step={0.01}
                  max={1}
                  value={this.state.speed}
                  onChange={(e) => this.onSpeedChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label={<MathComponent tex={String.raw`\frac{dp}{dx}`} />}
                  min={-3}
                  step={0.02}
                  max={3}
                  value={this.state.dpdx}
                  onChange={(e) => this.onDpDxChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Viscosidad"
                  min={0.5}
                  step={0.02}
                  max={10}
                  value={this.state.viscosity}
                  onChange={this.onViscosityChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={6}>
                <MyToggle
                  label="Partículas"
                  value={this.state.showingParticles}
                  onChange={this.onShowingParticlesToggle}
                ></MyToggle>
              </Grid>
              <Grid item xs={6}>
                <MyToggle
                  label="Tensión"
                  value={this.state.showingTension}
                  onChange={this.onShowingTensionToggle}
                ></MyToggle>
              </Grid>
              <Box sx={{ margin: "20px" }}></Box>
              <PanelModule>
                <Grid item xs={12}>
                  <Typography>
                    Tensión de corte con la placa superior:{" "}
                    {Math.round(
                      -this.getTensionAtPoint(
                        new Point(0, view.center.y - liquidHeight / 2),
                        1
                      ) * 1000
                    ) / 1000}
                  </Typography>
                  <Typography>
                    Tensión de corte con la placa inferior:{" "}
                    {Math.round(
                      this.getTensionAtPoint(
                        new Point(0, view.center.y + liquidHeight / 2),
                        1
                      ) * 1000
                    ) / 1000}
                    {/*TODO: agregar la unidad de la tension de corte*/}
                  </Typography>
                </Grid>
              </PanelModule>
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

import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import { MathComponent } from "mathjax-react";

import { Box, Grid, Typography } from "@mui/material";
import { Path, view, Point, Size, Rectangle, Shape, project } from "paper";
import SliderWithInput from "../components/SliderWithInput";
import {
  randomRange,
  ScrollingRectangle,
  VectorArray,
  VelocityParticle,
  addPoints,
  mulPoint,
  VectorArrow,
  lerp,
  remap,
} from "../paperUtility";
import { ThirtyFpsSelect } from "@mui/icons-material";
import PanelModule from "../components/PanelModule";

const screenLiquidWidth = 1000;
const screenLiquidHeight = 600;
const scale = 400;
const liquidWidth = screenLiquidWidth / scale;
const liquidHeight = screenLiquidHeight / scale;
const particleColor = "white";
const particleWidthScale = 5;
const particleLengthScale = 0.02;
const particleLifetime = 2;

let timeToNextParticle = 0.1;
const particleEmissionRate = 0.05;
const particleBurst = 2;
let limitLayerPath = null;
const limitLayerPoints = 100;

class Modulo11FlujoViscosoLaminar extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    line: null,
    ready: false,
    speed: 0.25,
    density: 1000,
    viscosity: 1,
    testx: 0.5,
    particles: [],
    bottomTangent: null,
    bottomTensionVector: null,
    showingParticles: true,
    showingTension: false,
    colorGradientScale: null,
  };

  onSpeedChange = (newValue) => {
    this.setState({ speed: newValue }, this.updateLine);
  };

  onTestXChange = (newValue) => {
    this.setState({ testx: newValue }, this.updateLine);
  };

  onDensityChange = (newValue) => {
    this.setState({ density: newValue }, this.updateLine);
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
        p.active = true;
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
      if (timeToNextParticle > 0) {
        if (this.state.showingParticles) {
          timeToNextParticle -= delta;
          if (timeToNextParticle <= 0) {
            for (let i = 0; i < particleBurst; i++) {
              timeToNextParticle = particleEmissionRate;
              const randomScreenPos = new Point(
                randomRange(
                  view.center.x - screenLiquidWidth / 2 - 200,
                  view.center.x + screenLiquidWidth / 2
                ),
                randomRange(
                  view.center.y - screenLiquidHeight / 2,
                  view.center.y + screenLiquidHeight / 2
                )
              );
              const velocity = new Point(
                this.getSpeedAtWorldPoint(this.screenToWorld(randomScreenPos)) *
                  scale,
                0
              );
              this.createParticle(randomScreenPos, velocity);
            }
          }
        }
      }

      for (let i = 0; i < this.state.particles.length; i++) {
        if (this.state.particles[i].active) {
          const particle = this.state.particles[i];
          const worldPos = this.screenToWorld(particle.position);
          particle.setVelocity(
            new Point(this.getSpeedAtWorldPoint(worldPos) * scale, 0)
          );
          particle.update(delta);
        }
      }
    }
  }

  updateLine() {
    var points = [];
    var magnitudes = [];
    const lineStart = new Point(this.state.testx, 0);
    for (let i = 0; i <= 200; i++) {
      var point = new Point(
        lineStart.x,
        lineStart.y + (i / 200) * liquidHeight
      );
      points.push(this.worldToScreen(point));
      magnitudes.push(-this.getSpeedAtWorldPoint(point) * scale);
    }
    this.state.vectorArray.SetValues(points, magnitudes);

    const step = liquidWidth / limitLayerPoints;
    for (let i = 0; i <= limitLayerPoints; i++) {
      const s = this.getLayerHeight(i * step);
      limitLayerPath.segments[i].point = this.worldToScreen(
        new Point(i * step, s)
      );
    }
    limitLayerPath.bringToFront();

    this.state.bottomTangent.visible = this.state.showingTension;
    this.state.bottomTensionVector.setVisible(this.state.showingTension);
    if (this.state.showingTension) {
      let bottomTension = this.getTensionAtX(this.state.testx);
      const bottomPos = this.worldToScreen(new Point(this.state.testx, 0));
      this.state.bottomTensionVector.SetPosition(
        bottomPos,
        new Point(bottomPos.x + bottomTension * 5, bottomPos.y)
      );

      var slope = bottomTension / this.state.viscosity;
      var tensionSlopeDirection = new Point(0, 100);
      if (bottomTension != 0) {
        tensionSlopeDirection = new Point(1, -1 / slope);
        tensionSlopeDirection.length = 100;
      }
      this.state.bottomTangent.segments[0].point = addPoints(
        bottomPos,
        tensionSlopeDirection
      );
      this.state.bottomTangent.segments[1].point = addPoints(
        bottomPos,
        mulPoint(tensionSlopeDirection, -1)
      );
    }
  }

  screenToWorld(point) {
    return new Point(
      remap(
        point.x,
        view.center.x - screenLiquidWidth / 2,
        view.center.x + screenLiquidWidth / 2,
        0,
        liquidWidth
      ),
      remap(
        point.y,
        view.center.y + screenLiquidHeight / 2,
        view.center.y - screenLiquidHeight / 2,
        0,
        liquidHeight
      )
    );
  }

  worldToScreen(point) {
    return new Point(
      remap(
        point.x,
        0,
        screenLiquidWidth / scale,
        view.center.x - screenLiquidWidth / 2,
        view.center.x + screenLiquidWidth / 2
      ),
      remap(
        point.y,
        0,
        screenLiquidHeight / scale,
        view.center.y + screenLiquidHeight / 2,
        view.center.y - screenLiquidHeight / 2
      )
    );
  }

  getBottomY() {
    return view.center.y + screenLiquidHeight / 2;
  }

  getLayerHeight(x) {
    return Math.sqrt(
      (30 * this.state.viscosity * x) / (this.state.speed * this.state.density)
    );
  }

  getSpeedAtWorldPoint(point) {
    var y = point.y;
    var U = this.state.speed;
    var s = this.getLayerHeight(point.x);
    if (s < y) {
      s = y;
    }
    var result = U * ((2 * y) / s - (y * y) / (s * s));
    return result;
  }

  getReynoldsNumber(x) {
    return (this.state.density * this.state.speed * x) / this.state.viscosity;
  }

  getTensionAtX(x) {
    var U = this.state.speed;
    var p = this.state.density;
    var rex = this.getReynoldsNumber(x);

    return (0.5 * p * U * U * 0.733) / Math.sqrt(rex);
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    limitLayerPath = new Path({
      strokeColor: "#826",
      dashArray: [10, 12],
      fillColor: "#8264",
    });
    const step = liquidWidth / limitLayerPoints;
    for (let i = 0; i <= limitLayerPoints; i++) {
      limitLayerPath.add(this.worldToScreen(new Point(i * step, 0)));
    }
    limitLayerPath.add(this.worldToScreen(new Point(liquidWidth, 0)));

    new ScrollingRectangle(
      new Point(
        center.x - screenLiquidWidth / 2,
        center.y + screenLiquidHeight / 2
      ),
      new Size(screenLiquidWidth, 30),
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
        new Point(
          center.x - screenLiquidWidth / 2,
          center.y - screenLiquidHeight / 2
        ),
        new Size(screenLiquidWidth, screenLiquidHeight)
      )
    );
    liquidRectangle.style.fillColor = "#88aaff";

    var points = [];
    var magnitudes = [];
    const lineStart = new Point(this.state.testx, 0);
    for (let i = 0; i <= 200; i++) {
      var point = new Point(
        lineStart.x,
        lineStart.y + (i / 200) * liquidHeight
      );
      points.push(this.worldToScreen(point));
      magnitudes.push(0);
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
    newState.vectorArray = vectorArray;
    newState.topTangent = topTangent;
    newState.topTensionVector = topTensionVector;
    newState.bottomTangent = bottomTangent;
    newState.bottomTensionVector = bottomTensionVector;
    this.setState(newState, this.updateLine);

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
                  label="Posición X de prueba"
                  min={0.01}
                  step={0.01}
                  max={liquidWidth}
                  unit="m"
                  value={this.state.testx}
                  onChange={(e) => this.onTestXChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Velocidad del fluido libre"
                  unit="m/s"
                  min={0.01}
                  step={0.01}
                  max={1}
                  value={this.state.speed}
                  onChange={(e) => this.onSpeedChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad"
                  min={500}
                  step={10}
                  max={10000}
                  unit={"kg/m³"}
                  value={this.state.density}
                  onChange={(e) => this.onDensityChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Viscosidad"
                  min={0.5}
                  step={0.02}
                  max={10}
                  value={this.state.viscosity}
                  onChange={(e) => this.onViscosityChange(e)}
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
                    Espesor de la capa límite:{" "}
                    {Math.round(this.getLayerHeight(this.state.testx) * 1000) /
                      1000}{" "}
                    m
                  </Typography>
                  <Typography>
                    Tensión de corte con la placa:{" "}
                    {Math.round(this.getTensionAtX(this.state.testx) * 1000) /
                      1000}{" "}
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

export default Modulo11FlujoViscosoLaminar;

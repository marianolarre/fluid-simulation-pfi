import React, { Component } from "react";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import EquationReferences from "../components/EquationReferences";

import { Grid, Button, Box, Typography } from "@mui/material";
import { view, Point, Path, Rectangle, Shape, Size, Group } from "paper";
import SliderWithInput from "../components/SliderWithInput";
import {
  addPoints,
  CoordinateReference,
  mulPoint,
  VectorArrow,
} from "../paperUtility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import PanelModule from "../components/PanelModule";
import { MathComponent } from "mathjax-react";
import MyTooltip from "../components/MyTooltip";
import ModuleAccordion from "../components/ModuleAccordion";

let loading = false;

const metersToPixels = 25;
let initialX = 0;
let initialY = 0;

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
      length: 75,
    },
    bullet: {
      density: 1000,
      radius: 0.1,
      position: null,
      velocity: null,
      acceleration: null,
      shape: null,
      active: false,
      maxHeight: 0,
      distance: 0,
    },
    velocityArrow: null,
    horizontalVelocityArrow: null,
    verticalVelocityArrow: null,
    dragCoeficient: 0,
    reynolds: 1,
    rugosity: 1,
    initialSpeed: 20,
    gravity: 9.8,
    airDensity: 1.29,
    airViscosity: 17.2,
    timeScale: 1,
    paused: false,
    lines: [],
    currentLine: null,
  };

  togglePause = (event) => {
    this.setState({ paused: !this.state.paused });
  };
  onTimeScaleChange(newValue) {
    this.setState({ timeScale: newValue });
  }
  /*onReynoldsChanged = (newValue) => {
    const cd = this.getDragCoeficient(newValue);
    this.setState({ reynolds: newValue, dragCoeficient: cd });
  };*/
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
  onAirViscosityChanged = (newValue) => {
    this.setState({ airViscosity: newValue });
  };
  onAirDensityChanged = (newValue) => {
    this.setState({ airDensity: newValue });
  };
  onAirViscosityChanged = (newValue) => {
    this.setState({ airViscosity: newValue });
  };
  onBulletDensityChanged = (newValue) => {
    const bulletCopy = { ...this.state.bullet };
    bulletCopy.density = newValue;
    this.setState({ bullet: bulletCopy });
  };

  update(delta) {
    if (this.state.ready) {
      if (this.state.bullet.active) {
        const bullet = { ...this.state.bullet };
        // Forces
        const steps = 10;
        for (let i = 0; i < steps; i++) {
          let forcex = 0;
          let forcey = this.state.gravity * this.getBulletMass();
          bullet.force = this.getForces(delta / steps);

          // MRUV
          bullet.velocity.x +=
            ((bullet.force.x / this.getBulletMass()) * delta) / steps;
          bullet.velocity.y +=
            ((bullet.force.y / this.getBulletMass()) * delta) / steps;
          bullet.position.x +=
            (bullet.velocity.x * delta * metersToPixels) / steps;
          bullet.position.y +=
            (bullet.velocity.y * delta * metersToPixels) / steps;
          bullet.force.x = 0;
          bullet.force.y = 0;
        }
        bullet.distance = bullet.position.x - initialX;
        if (initialY - bullet.position.y > bullet.maxHeight) {
          bullet.maxHeight = initialY - bullet.position.y;
        }
        bullet.shape.position = bullet.position;

        // Trayectory
        if (this.state.currentLine != null) {
          this.state.currentLine.add(bullet.position);
        }

        // Arrows
        this.state.velocityArrow.SetPosition(
          bullet.position,
          addPoints(bullet.position, mulPoint(bullet.velocity, 25))
        );
        this.state.horizontalVelocityArrow.SetPosition(
          bullet.position,
          addPoints(bullet.position, new Point(bullet.velocity.x * 25, 0))
        );
        this.state.verticalVelocityArrow.SetPosition(
          bullet.position,
          addPoints(bullet.position, new Point(0, bullet.velocity.y * 25))
        );

        if (bullet.position.y > this.state.cannon.pivot.y) {
          bullet.active = false;
        }

        this.setState({ bullet: bullet });
      }
    }
  }

  getBulletMass() {
    return this.state.bullet.density;
  }

  getDragCoeficient() {
    let bulletSpeed = Math.max(0.01, this.state.bullet.velocity.length);
    let re =
      (bulletSpeed * this.state.bullet.radius * 2 * this.state.airDensity) /
      this.state.airViscosity; // velocidad * diametro * ro / mu (Pa/s)
    const re263 = re / 263000;
    const re106 = re / 1000000;
    return (
      24 / re +
      (2.6 * re) / 5 / (1 + Math.pow(re / 5, 1.52)) +
      (0.411 * Math.pow(re263, -7.94)) / (1 + Math.pow(re263, -8)) +
      (0.25 * re106) / (1 + re106)
    );
  }

  updateCannon() {
    this.state.cannon.group.rotation = -this.state.cannon.angle;
  }

  fire = () => {
    if (this.state.currentLine != null) {
      this.state.currentLine.strokeColor = "#cccccc";
    }
    const bullet = { ...this.state.bullet };
    bullet.active = true;
    bullet.shape.visible = true;
    const angleInRads = (this.state.cannon.angle / 180) * Math.PI;
    const cannonDir = new Point(Math.cos(angleInRads), -Math.sin(angleInRads));
    const cannonVector = mulPoint(cannonDir, this.state.cannon.length);
    bullet.position = addPoints(this.state.cannon.pivot, cannonVector);
    bullet.shape.position = bullet.position;
    bullet.velocity = mulPoint(cannonDir, this.state.initialSpeed);
    initialY = bullet.position.y;
    initialX = bullet.position.x;
    bullet.maxHeight = 0;
    bullet.distance = 0;
    const line = new Path();
    line.strokeWidth = 3;
    line.strokeColor = "#777777";
    line.add(bullet.position);
    this.state.lines.push(line);
    this.setState({ bullet: bullet, currentLine: line });
  };

  deleteliness = () => {
    for (let i = 0; i < this.state.lines.length; i++) {
      this.state.lines[i].remove();
    }
    this.setState({ lines: [] });
  };

  getForces(delta) {
    const velocity = this.state.bullet.velocity;
    const speed = velocity.length;
    const area = this.state.bullet.radius * this.state.bullet.radius * Math.PI;
    const dc = this.getDragCoeficient();
    const multiplier = -dc * 0.5 * this.state.airDensity * speed * area; // la velocidad va al cuadrado, pero en vez de normalizar V y multiplicar por |V|^2, simplemente multiplico por |V|
    const airResistance = mulPoint(velocity, multiplier);
    if (airResistance.length > (speed / delta) * this.getBulletMass()) {
      airResistance.length = (speed / delta) * this.getBulletMass();
    }
    const gravity = new Point(0, this.state.gravity * this.getBulletMass());
    return addPoints(airResistance, gravity);
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const cannonPos = addPoints(view.bounds.bottomLeft, new Point(100, -100));
    const cannonShape = new Shape.Rectangle(
      new Rectangle(new Point(0, -15), new Size(this.state.cannon.length, 30))
    );
    cannonShape.style = {
      fillColor: "black",
    };
    const cannonDeco1 = new Shape.Circle(new Point(0, 0), 25);
    cannonDeco1.style = {
      fillColor: "black",
    };
    const cannonDeco2 = new Shape.Rectangle(
      new Point(this.state.cannon.length - 30, -20),
      new Size(30, 40)
    );
    cannonDeco2.style = {
      fillColor: "black",
    };
    const cannonGroup = new Group([cannonShape, cannonDeco1, cannonDeco2]);
    cannonGroup.pivot = new Point(0, 0);
    cannonGroup.applyMatrix = false;
    cannonGroup.translate(cannonPos);
    cannonGroup.rotate(-this.state.cannon.angle);

    const bullet = new Shape.Circle(new Point(0, 0), 15);
    bullet.fillColor = "black";
    bullet.visible = false;

    const velocityArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "grey",
      4,
      5,
      15
    );
    const horizontalVelocityArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "red",
      4,
      5,
      15
    );
    const verticalVelocityArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "blue",
      4,
      5,
      15
    );

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.ready = true;
    newState.cannon.group = cannonGroup;
    newState.cannon.pivot = cannonPos;
    newState.bullet.shape = bullet;
    newState.bullet.velocity = new Point(0, 0);
    newState.bullet.position = new Point(0, 0);
    newState.bullet.force = new Point(0, 0);
    newState.velocityArrow = velocityArrow;
    newState.horizontalVelocityArrow = horizontalVelocityArrow;
    newState.verticalVelocityArrow = verticalVelocityArrow;
    this.setState(newState);

    view.onFrame = (event) => {
      if (!this.state.paused) {
        this.update(event.delta * this.state.timeScale);
      }
    };

    window.addEventListener(
      "resize",
      (event) => {
        // Update
      },
      true
    );

    new CoordinateReference(cannonPos, new Point(0, -1), "Y");
    new CoordinateReference(cannonPos, new Point(1, 0), "X");
  }

  getParameterCode() {
    let module = "M";
    let codeVersion = "1";
    return [
      module,
      codeVersion,
      this.state.timeScale,
      this.state.initialSpeed,
      this.state.cannon.angle,
      this.state.gravity,
      this.state.airViscosity,
      this.state.airDensity,
      this.state.bullet.density,
    ].join(";");
  }

  loadParameterCode(code) {
    if (loading) return false;
    loading = true;
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    if (codeVersion == 1) {
      let timeScale = parseFloat(split[2]);
      let initialSpeed = parseFloat(split[3]);
      let cannonAngle = parseFloat(split[4]);
      let gravity = parseFloat(split[5]);
      let airViscosity = parseFloat(split[6]);
      let airDensity = parseFloat(split[7]);
      let bulletDensity = parseFloat(split[8]);
      let cannon = { ...this.state.cannon };
      cannon.angle = cannonAngle;
      let bullet = { ...this.state.bullet };
      bullet.density = bulletDensity;
      this.setState(
        {
          timeScale,
          initialSpeed,
          cannonAngle,
          gravity,
          airViscosity,
          airDensity,
          cannon,
          bullet,
        },
        () => {
          loading = false;
          this.updateCannon();
        }
      );
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Tiro oblícuo"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        keepScrollbar
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  onClick={this.fire}
                  sx={{ width: "100%" }}
                >
                  Disparar
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  onClick={this.deleteliness}
                  sx={{ width: "100%" }}
                >
                  Borrar lineas
                </Button>
              </Grid>
              <Grid item xs={2}>
                <MyTooltip title="Resumir / Pausar">
                  <Button
                    sx={{ width: "100%" }}
                    variant="contained"
                    onClick={this.togglePause}
                  >
                    {(this.state.paused && <PlayArrowIcon></PlayArrowIcon>) || (
                      <PauseIcon></PauseIcon>
                    )}
                  </Button>
                </MyTooltip>
              </Grid>
              <Grid item xs={10}>
                <SliderWithInput
                  label="Escala de tiempo"
                  min={0}
                  step={0.1}
                  max={2}
                  value={this.state.timeScale}
                  onChange={(e) => this.onTimeScaleChange(e)}
                ></SliderWithInput>
              </Grid>
              <Box sx={{ margin: "20px" }}></Box>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Velocidad Inicial"
                  step={1}
                  min={0}
                  max={50}
                  unit={"m/s"}
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
              <Box sx={{ margin: "20px" }}></Box>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Gravedad"
                  step={1}
                  min={0}
                  max={20}
                  unit={"m/s²"}
                  value={this.state.gravity}
                  onChange={this.onGravityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Viscosidad del fluido"
                  step={0.01}
                  min={1}
                  max={100}
                  unit="Pa*s"
                  value={this.state.airViscosity}
                  onChange={this.onAirViscosityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del fluido"
                  step={1}
                  min={1}
                  max={100}
                  unit="kg/m³"
                  value={this.state.airDensity}
                  onChange={this.onAirDensityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del proyectil"
                  step={10}
                  min={10}
                  max={10000}
                  unit="kg/m³"
                  value={this.state.bullet.density}
                  onChange={this.onBulletDensityChanged}
                ></SliderWithInput>
              </Grid>
              <Box sx={{ margin: "20px" }}></Box>
              {this.state.bullet.velocity != null && (
                <PanelModule>
                  <Typography>
                    Coeficiente de drag:
                    {Math.round(this.getDragCoeficient() * 1000) / 1000}
                  </Typography>
                  <Typography>
                    Velocidad: (
                    {Math.round(this.state.bullet.velocity.x * 1000) / 1000},{" "}
                    {Math.round(-this.state.bullet.velocity.y * 1000) / 1000})
                    m/s
                  </Typography>
                  <Typography>
                    Velocidad: ({Math.round(this.getForces(1).x * 1000) / 1000},{" "}
                    {Math.round(-this.getForces(1).y * 1000) / 1000}) N
                  </Typography>
                  <Typography>
                    Altura máxima:{" "}
                    {Math.round(this.state.bullet.maxHeight * 1000) / 1000} m
                  </Typography>
                  <Typography>
                    Distancia horizontal:{" "}
                    {Math.round(this.state.bullet.distance * 1000) / 1000} m
                  </Typography>
                </PanelModule>
              )}
              <Grid item xs={12} sx={{ marginTop: "50px" }}>
                <ModuleAccordion title="Ecuaciones">
                  <ModuleAccordion
                    title={
                      <MathComponent
                        tex={String.raw`F=C_{D}\frac{1}{2}\rho |V|A`}
                      />
                    }
                    fontSize={20}
                    center
                    hasBorder
                  >
                    <EquationReferences
                      parameters={[
                        {
                          letter: String.raw`F :`,
                          description: "fricción con el aire [kg/s]",
                        },
                        {
                          letter: "C_{D} :",
                          description: "coeficiente de drag",
                        },
                        {
                          letter: String.raw`\rho :`,
                          description: "densidad del fluido [kg/m³]",
                        },
                        {
                          letter: String.raw`|V| :`,
                          description: "rapidez del proyectil [m/s]",
                        },
                        {
                          letter: String.raw`A :`,
                          description: "área trasversal del proyectil [m²]",
                        },
                      ]}
                    ></EquationReferences>
                  </ModuleAccordion>
                  <ModuleAccordion
                    title={
                      <MathComponent
                        tex={String.raw`C_{D}=\frac{24}{Re}+\frac{0.411(\frac{Re}{2.63\times 10^5})}{1+(\frac{Re}{2.63\times 10^5})}+\frac{0.25(\frac{Re}{10^6})}{1+(\frac{Re}{10^6})}`}
                      />
                    }
                    fontSize={20}
                    center
                    hasBorder
                  >
                    <EquationReferences
                      parameters={[
                        {
                          letter: String.raw`C_{D} :`,
                          description: "coeficiente de drag",
                        },
                        {
                          letter: String.raw`Re :`,
                          description: "número de Reynolds",
                        },
                      ]}
                    ></EquationReferences>
                  </ModuleAccordion>
                  <ModuleAccordion
                    title={
                      <MathComponent
                        tex={String.raw`Re=\frac{2r|V|\rho}{\mu}`}
                      />
                    }
                    fontSize={20}
                    center
                    hasBorder
                  >
                    <EquationReferences
                      parameters={[
                        {
                          letter: "Re_{t} :",
                          description: "número de Reynolds del tramo",
                        },
                        {
                          letter: String.raw`r :`,
                          description: "radio del proyectil [m]",
                        },
                        {
                          letter: String.raw`|V| :`,
                          description: "rapidez del proyectil [m/s]",
                        },
                        {
                          letter: String.raw`\rho :`,
                          description: "densidad del fluido [kg/m³]",
                        },
                        {
                          letter: String.raw`\mu :`,
                          description: "viscosidad del fluido [Pa∙s]",
                        },
                      ]}
                    ></EquationReferences>
                  </ModuleAccordion>
                </ModuleAccordion>
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

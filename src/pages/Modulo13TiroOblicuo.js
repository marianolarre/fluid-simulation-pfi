import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid, Button, Tooltip, Box, Typography } from "@mui/material";
import {
  view,
  Point,
  Path,
  Rectangle,
  Circle,
  Shape,
  Size,
  Group,
} from "paper";
import SliderWithInput from "../components/SliderWithInput";
import { addPoints, mulPoint, VectorArrow } from "../paperUtility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SpeedIcon from "@mui/icons-material/Speed";
import PanelModule from "../components/PanelModule";
import { MathComponent } from "mathjax-react";
import {
  ArrowDownward,
  CenterFocusStrong,
  SettingsBackupRestore,
  Water,
} from "@mui/icons-material";

let timeUntilNextDot = 0;
const metersToPixels = 50;

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
    bullet: {
      density: 10,
      radius: 0.1,
      position: null,
      velocity: null,
      acceleration: null,
      shape: null,
      active: false,
    },
    velocityArrow: null,
    horizontalVelocityArrow: null,
    verticalVelocityArrow: null,
    dragCoeficient: this.getDragCoeficient(1),
    reynolds: 1,
    rugosity: 1,
    initialSpeed: 20,
    gravity: 9.8,
    airDensity: 1,
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
  onReynoldsChanged = (newValue) => {
    const cd = this.getDragCoeficient(newValue);
    this.setState({ reynolds: newValue, dragCoeficient: cd });
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
  onBulletDensityChanged = (newValue) => {
    const bulletCopy = { ...this.state.bullet };
    bulletCopy.density = newValue;
    this.setState({ bullet: bulletCopy });
  };

  update(delta) {
    if (this.state.ready) {
      const bullet = { ...this.state.bullet };
      if (bullet.active) {
        // Forces
        let forcex = 0;
        let forcey = this.state.gravity * this.getBulletMass();
        bullet.force = this.getForces(delta);

        // MRUV
        bullet.velocity.x += (bullet.force.x / this.getBulletMass()) * delta;
        bullet.velocity.y += (bullet.force.y / this.getBulletMass()) * delta;
        bullet.position.x += bullet.velocity.x * delta * metersToPixels;
        bullet.position.y += bullet.velocity.y * delta * metersToPixels;
        bullet.force.x = 0;
        bullet.force.y = 0;
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
      }
      this.setState({ bullet: bullet });
    }
  }

  getBulletMass() {
    return this.state.bullet.density;
  }

  getDragCoeficient(re) {
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
    const cannonVector = mulPoint(cannonDir, this.state.cannon.length - 30);
    bullet.position = addPoints(this.state.cannon.pivot, cannonVector);
    bullet.shape.position = bullet.position;
    bullet.velocity = mulPoint(cannonDir, this.state.initialSpeed);
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
    const multiplier =
      -this.state.dragCoeficient * 0.5 * this.state.airDensity * speed * area; // la velocidad va al cuadrado, pero en vez de normalizar V y multiplicar por |V|^2, simplemente multiplico por |V|
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
      new Rectangle(new Point(-15, -15), new Size(this.state.cannon.length, 30))
    );
    cannonShape.style = {
      fillColor: "black",
    };
    const cannonDeco1 = new Shape.Circle(new Circle(new Point(-15, -15), 40));
    cannonDeco1.style = {
      fillColor: "black",
    };
    const cannonGroup = new Group([cannonShape, cannonDeco1]);
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
  }

  render() {
    return (
      <PanelAndCanvas
        title="Tiro oblícuo"
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
                <Tooltip title="Resumir / Pausar">
                  <Button
                    sx={{ width: "100%" }}
                    variant="contained"
                    onClick={this.togglePause}
                  >
                    {(this.state.paused && <PlayArrowIcon></PlayArrowIcon>) || (
                      <PauseIcon></PauseIcon>
                    )}
                  </Button>
                </Tooltip>
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
                  unit={<MathComponent tex={String.raw`\frac{m}{s}`} />}
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
                  label="Número de Reynolds"
                  step={0.05}
                  min={0.05}
                  max={10}
                  value={this.state.reynolds}
                  onChange={this.onReynoldsChanged}
                ></SliderWithInput>
                <PanelModule>
                  <Typography>
                    Coeficiente de drag:{" "}
                    {Math.round(this.state.dragCoeficient * 100) / 100}
                  </Typography>
                </PanelModule>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Gravedad"
                  step={1}
                  min={0}
                  max={20}
                  unit={<MathComponent tex={String.raw`\frac{m}{s^{2}}`} />}
                  value={this.state.gravity}
                  onChange={this.onGravityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del fluido"
                  step={1}
                  min={0}
                  max={10}
                  value={this.state.airDensity}
                  onChange={this.onAirDensityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del proyectil"
                  step={1}
                  min={0.1}
                  max={100}
                  value={this.state.bullet.density}
                  onChange={this.onBulletDensityChanged}
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

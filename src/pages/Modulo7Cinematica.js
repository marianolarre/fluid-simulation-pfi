import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import {
  Button,
  Grid,
  TextField,
  LinearProgress,
  Typography,
} from "@mui/material";
import Paper from "paper";
import { Color, Point } from "paper/dist/paper-core";
import SliderWithInput from "../components/SliderWithInput";
import { addPoints, mulPoint, VectorArrow } from "../paperUtility";
import ExpressionInput from "../components/ExpressionInput";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import PanelModule from "../components/PanelModule";

const fixedDeltaTime = 0.016;

class Modulo7Cinematica extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    vectors: [],
    vectorLengthMultiplier: 15,
    vectorFieldDirty: true,
    screen: {
      size: 400,
    },
    ready: false,
    writtenExpression: {
      x: "-y",
      y: "x",
    },
    expression: {
      x: "-y",
      y: "x",
    },
    time: 0,
    paused: true,
    timeScale: 1,
    particles: [],
    lines: [],
  };

  canvasFunction() {
    const center = Paper.view.center;

    const background = new Paper.Path.Rectangle(
      new Paper.Rectangle(new Paper.Point(0, 0), Paper.view.size)
    );
    background.fillColor = "white";

    const gridPoints = 15;
    for (let x = 0; x <= gridPoints; x++) {
      this.state.vectors[x] = [];
      for (let y = 0; y <= gridPoints; y++) {
        const worldPos = new Paper.Point(
          (x / gridPoints - 0.5) * 2,
          (y / gridPoints - 0.5) * 2
        );
        const start = this.worldToScreen(worldPos);
        const result = this.getFieldValue(
          worldPos,
          this.state.vectorLengthMultiplier
        );
        if (result == null) {
          return;
        }
        const newVector = new VectorArrow(
          start,
          addPoints(start, result),
          "grey",
          2,
          3,
          10
        );
        this.state.vectors[x][y] = newVector;
      }
    }

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.ready = true;
    this.setState(newState);

    Paper.view.onFrame = (event) => {
      const delta = fixedDeltaTime; // event.delta

      if (!this.state.paused) {
        this.updateSimulation((delta * this.state.timeScale) / 15);
      }
    };

    Paper.view.onClick = (event) => {
      this.placeParticle(event.point);
    };

    Paper.view.onMouseDrag = (event) => {};

    window.addEventListener(
      "resize",
      (event) => {
        // Update
      },
      true
    );
  }

  placeParticle(screenPosition) {
    const worldPosition = this.screenToWorld(screenPosition);
    if (
      worldPosition.x > 1 ||
      worldPosition.x < -1 ||
      worldPosition.y > 1 ||
      worldPosition.y < -1
    ) {
      return;
    }
    let newParticle = null;
    for (let i = 0; i < this.state.particles.length; i++) {
      if (!this.state.particles[i].active) {
        newParticle = this.state.particles[i];
        break;
      }
    }
    if (newParticle == null) {
      const particleShape = new Paper.Shape.Circle(screenPosition, 10);
      particleShape.style = {
        strokeWidth: 2,
        fillColor: "blue",
        strokeColor: "black",
      };
      newParticle = {
        shape: particleShape,
        worldPos: worldPosition,
        active: true,
      };
      this.state.particles.push(newParticle);
    }

    newParticle.worldPos = worldPosition;
    newParticle.active = true;
    newParticle.shape.visible = true;

    // Line:
    const points = this.calculateCurrentLine(worldPosition, fixedDeltaTime);
    const newLine = new Paper.Path(points);
    newLine.style = {
      strokeWidth: 2,
      strokeColor: "grey",
    };
    this.state.lines.push({
      shape: newLine,
    });

    if (!this.state.paused) {
      this.setTime(0);
    }
  }

  setTime(newTime) {
    this.setState({ time: newTime });
  }

  updateSimulation(delta) {
    if (!this.state.paused && this.state.timeScale > 0) {
      const newTime = this.state.time + delta * this.state.timeScale;
      this.setTime(newTime);
      this.updateVectorField();
    }

    for (let i = 0; i < this.state.particles.length; i++) {
      const p = this.state.particles[i];
      if (p.active) {
        const field = this.getFieldValue(
          p.worldPos,
          this.state.vectorLengthMultiplier
        );
        if (field != null) {
          p.worldPos = addPoints(p.worldPos, mulPoint(field, delta));
          p.shape.position = this.worldToScreen(p.worldPos);

          if (
            p.worldPos.x > 1 ||
            p.worldPos.x < -1 ||
            p.worldPos.y > 1 ||
            p.worldPos.y < -1
          ) {
            p.active = false;
            p.shape.visible = false;
          }
        }
      }
    }
  }

  clearLinesAndParticles() {
    for (let i = 0; i < this.state.particles.length; i++) {
      this.state.particles[i].shape.remove();
    }
    for (let i = 0; i < this.state.lines.length; i++) {
      this.state.lines[i].shape.remove();
    }
    this.setState({ particles: [], lines: [] });
  }

  calculateCurrentLine(pos, delta) {
    let futurePoints = [this.worldToScreen(pos)];
    let currentPos = new Paper.Point(pos.x, pos.y);
    for (let i = 0; i < 500; i++) {
      // Future
      currentPos = addPoints(
        currentPos,
        mulPoint(this.getFieldValue(currentPos), delta)
      );
      futurePoints.push(this.worldToScreen(currentPos));
    }
    currentPos.x = pos.x;
    currentPos.y = pos.y;
    let pastPoints = [];
    for (let i = 0; i < 500; i++) {
      // Past
      currentPos = addPoints(
        currentPos,
        mulPoint(this.getFieldValue(currentPos), -delta)
      );
      pastPoints.push(this.worldToScreen(currentPos));
    }
    let allPoints = [];
    for (let i = 499; i >= 0; i--) {
      allPoints.push(pastPoints[i]);
    }
    for (let i = 0; i < 500; i++) {
      allPoints.push(futurePoints[i]);
    }
    return allPoints;
  }

  togglePause = (event) => {
    var newState = { ...this.state };
    newState.paused = !this.state.paused;
    this.setState(newState);
  };

  onVectorLengthMultiplierChange(newValue) {
    var newState = { ...this.state };
    newState.vectorLengthMultiplier = newValue;
    this.setState(newState);
    this.updateVectorField();
  }

  onTimeScaleChange(newValue) {
    var newState = { ...this.state };
    newState.timeScale = newValue;
    this.setState(newState);
  }

  onXEquationChange(newValue) {
    var newState = { ...this.state };
    newState.writtenExpression.x = newValue;
    newState.expression.x = this.cleanExpression(newValue);
    this.setState(newState);
    this.updateVectorField();
  }

  onYEquationChange(newValue) {
    var newState = { ...this.state };
    newState.writtenExpression.y = newValue;
    newState.expression.y = this.cleanExpression(newValue);
    this.setState(newState);
    this.updateVectorField();
  }

  cleanExpression(expression) {
    expression = expression.replace(/\(\)/g, "");
    expression = expression.replace(/{/g, "");
    expression = expression.replace(/}/g, "");
    // Expresiones matematicas
    expression = expression.replace(/abs\(/g, "Math.abs(");
    expression = expression.replace(/tan\(/g, "Math.tan(");
    expression = expression.replace(/sin\(/g, "Math.sin(");
    expression = expression.replace(/cos\(/g, "Math.cos(");
    expression = expression.replace(/max\(/g, "Math.max(");
    expression = expression.replace(/min\(/g, "Math.min(");
    expression = expression.replace(/sqrt\(/g, "Math.sqrt(");
    expression = expression.replace(/x\^2/g, "x*x");
    expression = expression.replace(/x\^3/g, "x*x*x");
    expression = expression.replace(/x\^4/g, "x*x*x*x");
    expression = expression.replace(/x\^5/g, "x*x*x*x*x");
    expression = expression.replace(/x\^6/g, "x*x*x*x*x*x");
    expression = expression.replace(/y\^2/g, "y*y");
    expression = expression.replace(/y\^3/g, "y*y*y");
    expression = expression.replace(/y\^4/g, "y*y*y*y");
    expression = expression.replace(/y\^5/g, "y*y*y*y*y");
    expression = expression.replace(/y\^6/g, "y*y*y*y*y*y");
    expression = expression.replace(/t\^2/g, "t*t");
    expression = expression.replace(/t\^3/g, "t*t*t");
    expression = expression.replace(/t\^4/g, "t*t*t*t");
    expression = expression.replace(/t\^5/g, "t*t*t*t*t");
    expression = expression.replace(/t\^6/g, "t*t*t*t*t*t");
    return expression;
  }

  getFieldValue(point, multiplier) {
    if (multiplier == null) {
      multiplier = 1;
    }
    const x = point.x;
    const y = -point.y;
    const t = this.state.time;
    let xresult = 0;
    let yresult = 0;
    try {
      xresult = eval(this.state.expression.x);
    } catch {
      return null;
    }
    try {
      yresult = -eval(this.state.expression.y);
    } catch {
      return null;
    }
    return new Paper.Point(xresult * multiplier, yresult * multiplier);
  }

  worldToScreen(point) {
    return new Paper.Point(
      point.x * this.state.screen.size + Paper.view.center.x,
      point.y * this.state.screen.size + Paper.view.center.y
    );
  }

  screenToWorld(point) {
    return new Paper.Point(
      (point.x - Paper.view.center.x) / this.state.screen.size,
      (point.y - Paper.view.center.y) / this.state.screen.size
    );
  }

  updateVectorField() {
    const gridPoints = 15;
    for (let x = 0; x <= gridPoints; x++) {
      for (let y = 0; y <= gridPoints; y++) {
        const worldPos = new Paper.Point(
          (x / gridPoints - 0.5) * 2,
          (y / gridPoints - 0.5) * 2
        );
        const start = this.worldToScreen(worldPos);
        const field = this.getFieldValue(
          worldPos,
          this.state.vectorLengthMultiplier
        );
        if (field == null) {
          return;
        }
        this.state.vectors[x][y].SetPosition(start, addPoints(start, field));
      }
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Plantilla"
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={2}>
                <Button
                  sx={{ width: "100%" }}
                  variant="contained"
                  onClick={this.togglePause}
                >
                  {(this.state.paused && <PlayArrowIcon></PlayArrowIcon>) || (
                    <PauseIcon></PauseIcon>
                  )}
                </Button>
              </Grid>
              <Grid item xs={10}>
                <SliderWithInput
                  label="Escala de tiempo"
                  min={0}
                  step={0.1}
                  max={2}
                  marks={[
                    { value: 0, label: "x0" },
                    { value: 1, label: "x1" },
                    { value: 2, label: "x2" },
                  ]}
                  value={this.state.timeScale}
                  onChange={(e) => this.onTimeScaleChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <PanelModule>
                  <Typography>
                    Tiempo: {Math.floor(this.state.time * 100) / 100}s
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(this.state.time / 60) * 100}
                  ></LinearProgress>
                </PanelModule>
              </Grid>
              <Grid item xs={6}>
                <ExpressionInput
                  label="x:"
                  value={this.state.writtenExpression.x}
                  onChange={(e) => this.onXEquationChange(e)}
                ></ExpressionInput>
              </Grid>
              <Grid item xs={6}>
                <ExpressionInput
                  label="y:"
                  value={this.state.writtenExpression.y}
                  onChange={(e) => this.onYEquationChange(e)}
                ></ExpressionInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Multiplicador"
                  min={0.1}
                  step={0.1}
                  max={100}
                  value={this.state.vectorLengthMultiplier}
                  onChange={(e) => this.onVectorLengthMultiplierChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <Button
                  sx={{ width: "100%" }}
                  variant="contained"
                  onClick={() => this.clearLinesAndParticles()}
                >
                  Borrar lineas y partículas
                </Button>
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

export default Modulo7Cinematica;

import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import MenuIcon from "@mui/icons-material/Menu";

import {
  Button,
  Grid,
  TextField,
  LinearProgress,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Stack,
} from "@mui/material";
import { view, Point, Size, Path, Shape, Rectangle, Raster } from "paper";
import SliderWithInput from "../components/SliderWithInput";
import {
  addPoints,
  ColorScaleReference,
  mulPoint,
  subPoints,
  VectorArrow,
} from "../paperUtility";
import ExpressionInput from "../components/ExpressionInput";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import PanelModule from "../components/PanelModule";
import { SkipPrevious } from "@mui/icons-material";

const fixedDeltaTime = 0.016;
const physicsSteps = 20;
const simulationSpeed = 0.025;
const xGridPoints = 12;
const yGridPoints = 12;
const vertexSkip = 1;

const xScale = 2;
const yScale = 2;
const xOffset = 0;
const yOffset = 0;
const pixelSize = 20;

let minPressure = 0;
let maxPressure = 1;
let range = 1;
let settingScale = false;

const presets = [
  { name: "Flujo uniforme", x: "1", y: "0" },
  { name: "Solido", x: "-y", y: "x" },
  { name: "Pared", x: "-x", y: "y" },
  { name: "Fuente", x: "x/(2*pi*R^2)", y: "y/(2*pi*R^2)" },
  {
    name: "Dipolo",
    x: "R/(2*pi)*((x^2*cos(ang)-y^2*cos(ang)+2*x*y*sin(ang))/R^4)",
    y: "R/(2*pi)*((y^2*sin(ang)-x^2*sin(ang)+2*x*y*cos(ang))/R^4)",
  },
];

let frame = 0;
let lastSmoke = null;
let emisionTimer = 0;

class Modulo9FlujoNoViscoso extends Component {
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
      x: "1",
      y: "0",
    },
    expression: {
      x: "1",
      y: "0",
    },
    time: 0,
    paused: true,
    timeScale: 1,
    particles: [],
    lines: [],
    density: 1,
    clickPosition: null,
    clickPositionShape: null,
    showingTrayectory: false,
    showingSmoke: false,
    showingCurrent: false,
    periodicParticles: false,
    period: 0.3,
    autoClean: false,
    smokeLine: null,
    smoke: [],
    expressionDialogOpen: false,
    colorMap: {},
    zoom: 1,
  };

  updateColorMap(colorMap, recalculateRange) {
    if (colorMap == null) {
      colorMap = this.state.colorMap;
    }
    let imageData = colorMap.raster.getImageData();
    var startingX = colorMap.cornerPoint.x;
    var width = xScale * this.state.screen.size;
    var x = startingX;
    var y = colorMap.cornerPoint.y;
    var velocity = null;
    const mul = this.state.vectorLengthMultiplier * 6;
    if (settingScale) {
      minPressure = 0;
      maxPressure = 1;
    }
    var rangeChanged = false;
    var pressure = [];
    for (var i = 0; i < imageData.data.length; i += 4) {
      const p = this.getPressure(new Point(x, y));
      pressure[i] = p;

      if (settingScale) {
        if (i == 0) {
          minPressure = p;
          maxPressure = p;
        } else {
          if (p < minPressure) {
            minPressure = p;
          }
          if (p > maxPressure) {
            maxPressure = p;
          }
        }
      }

      x += pixelSize;
      if (x >= startingX + width) {
        x = startingX;
        y += pixelSize;
      }
    }

    if (settingScale) {
      range = maxPressure - minPressure;
      if (range == 0) {
        range = 1;
        minPressure -= 0.5;
        maxPressure += 0.5;
      }
      this.state.colorGradientScale.setRange(minPressure, maxPressure);
      settingScale = false;
    }

    for (var i = 0; i < imageData.data.length; i += 4) {
      const p = (pressure[i] - minPressure) / range;
      imageData.data[i] = p * 512;
      imageData.data[i + 1] = 512 - p * 512;
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 255;
    }

    colorMap.raster.setImageData(imageData);

    if (recalculateRange) {
      this.updateColorMap(colorMap, false);
    }
  }

  getPressure(point) {
    const vel = this.getFieldValue(
      mulPoint(this.screenToWorld(point), 1 / this.state.zoom)
    );
    const basePressure = 1;
    return (
      basePressure - (this.state.density * (vel.x * vel.x + vel.y * vel.y)) / 2
    );
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const size = this.state.screen.size;
    const rasterWidth = Math.floor((size * xScale) / pixelSize);
    const rasterHeight = Math.floor((size * yScale) / pixelSize);
    const raster = new Raster(
      new Size(0, 0),
      new Point(rasterWidth, rasterHeight)
    );
    const translation = addPoints(
      view.center,
      new Point(size * xOffset, size * yOffset)
    );
    raster.translate(translation);
    raster.scale(pixelSize);
    const colorMap = {
      raster: raster,
      width: rasterWidth,
      height: rasterHeight,
      cornerPoint: addPoints(
        translation,
        new Point((-size * xScale) / 2, (-size * yScale) / 2)
      ),
    };

    const clickPositionShape = new Shape.Circle(new Point(0, 0), 20);
    clickPositionShape.style = {
      fillColor: "white",
      strokeColor: "grey",
      strokeWidth: 2,
    };
    clickPositionShape.visible = false;

    const smokeLine = new Path({
      strokeColor: "green",
      strokeWidth: 2,
    });

    for (let x = 0; x <= xGridPoints; x++) {
      this.state.vectors[x] = [];
      for (let y = 0; y <= yGridPoints; y++) {
        const worldPos = new Point(
          (x / xGridPoints - 0.5) * xScale,
          (y / yGridPoints - 0.5) * yScale
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
          "black",
          3,
          5,
          10
        );
        this.state.vectors[x][y] = newVector;
      }
    }

    const newBackground = { ...this.state.background };
    newBackground.shape = background;

    const colorGradientScale = new ColorScaleReference(
      addPoints(view.bounds.topRight, new Point(-100, 100)),
      new Size(50, view.size.height - 200),
      ["red", "yellow", "lime"],
      minPressure,
      maxPressure
    );

    this.setState(
      {
        background: newBackground,
        ready: true,
        clickPositionShape: clickPositionShape,
        smokeLine: smokeLine,
        colorMap: colorMap,
        colorGradientScale: colorGradientScale,
      },
      this.updateColorMap
    );

    view.onFrame = (event) => {
      const delta = fixedDeltaTime; // event.delta

      if (!this.state.paused) {
        this.updateSimulation(delta * this.state.timeScale * this.state.zoom);
      }
    };

    view.onClick = (event) => {
      if (this.state.autoClean) this.clearLinesAndParticles();
      if (
        this.state.showingCurrent ||
        this.state.showingTrayectory ||
        !this.state.showingSmoke
      ) {
        this.placeParticle(
          event.point,
          this.state.showingCurrent,
          this.state.showingTrayectory
        );
      }
      this.setState({ clickPosition: event.point });
      this.state.clickPositionShape.position = event.point;
      this.state.clickPositionShape.visible = true;
      this.removeSmoke();
    };

    view.onMouseDrag = (event) => {};

    window.addEventListener(
      "resize",
      (event) => {
        // Update
      },
      true
    );
  }

  getFieldValue(point, multiplier, time) {
    if (multiplier == null) {
      multiplier = 1;
    }
    if (time == null) {
      time = this.state.time;
    }
    const x = point.x;
    const y = -point.y;
    const t = time;
    let xresult = 0;
    let yresult = 0;
    try {
      xresult = eval(this.state.expression.x);
    } catch {
      if (xresult === undefined) {
        return null;
      }
    }
    if (xresult === undefined) {
      return null;
    }

    try {
      yresult = -eval(this.state.expression.y);
    } catch {
      if (yresult === undefined) {
        return null;
      }
    }
    if (yresult === undefined) {
      return null;
    }

    return new Point(xresult * multiplier, yresult * multiplier);
  }

  placeParticle(screenPosition, current, trayectory) {
    const worldPosition = this.screenToWorld(screenPosition);
    if (
      worldPosition.x > 1.5 ||
      worldPosition.x < -1.5 ||
      worldPosition.y > 1.5 ||
      worldPosition.y < -1.5
    ) {
      return;
    }
    let newParticle = null;
    for (let i = 0; i < this.state.particles.length; i++) {
      if (!this.state.particles[i].active && !this.state.particles[i].isSmoke) {
        newParticle = this.state.particles[i];
        break;
      }
    }
    if (newParticle == null) {
      let particleShape = null;
      particleShape = new Shape.Circle(screenPosition, 10);
      particleShape.style = {
        strokeWidth: 2,
        fillColor: "cyan",
        strokeColor: "black",
      };
      newParticle = {
        shape: particleShape,
        worldPos: worldPosition,
        active: true,
        isSmoke: false,
        lifeTime: 0,
      };
      this.state.particles.push(newParticle);
    }

    newParticle.worldPos = worldPosition;
    newParticle.active = true;
    newParticle.shape.visible = true;
    newParticle.shape.position = screenPosition;
    newParticle.lifeTime = 0;

    // Linea de corriente:
    if (current) {
      const points = this.calculateCurrentLine(worldPosition, fixedDeltaTime);
      const newLine = new Path(points);
      newLine.style = {
        strokeWidth: 2,
        strokeColor: "blue",
      };
      this.state.lines.push({
        shape: newLine,
      });
    }

    // Linea de trayectoria:
    if (trayectory) {
      const newLine = new Path();
      newLine.add(screenPosition);
      newLine.style = {
        strokeWidth: 2,
        strokeColor: "black",
      };
      this.state.lines.push({
        shape: newLine,
      });
      newParticle.trayectory = newLine;
    }
    // Esto predice el futuro, lo que puede ser confuso
    /*if (trayectory) {
      const points = this.calculateTrayectoryLine(
        worldPosition,
        fixedDeltaTime
      );
      const newLine = new Path(points);
      newLine.style = {
        strokeWidth: 2,
        strokeColor: "red",
      };
      this.state.lines.push({
        shape: newLine,
      });
    }*/
  }

  placeSmoke(screenPosition, current, trayectory) {
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
      if (!this.state.particles[i].active && this.state.particles[i].isSmoke) {
        newParticle = this.state.particles[i];
        break;
      }
    }
    if (newParticle == null) {
      newParticle = {
        worldPos: worldPosition,
        active: true,
        previousSmoke: lastSmoke,
        isSmoke: true,
        lifeTime: 0,
      };
      this.state.smoke.push(newParticle);
    }

    newParticle.worldPos = worldPosition;
    newParticle.active = true;
    newParticle.lifeTime = 0;

    lastSmoke = newParticle;
  }

  setTime(newTime) {
    this.setState({ time: newTime });
  }

  updateSimulation(delta) {
    if (!this.state.paused && this.state.timeScale > 0) {
      frame++;
      const newTime = this.state.time + delta;
      this.setTime(newTime);
      this.updateVectorField();

      if (this.state.clickPosition != null) {
        if (this.state.showingSmoke) {
          if (frame % vertexSkip == 0) {
            this.placeSmoke(this.state.clickPosition, true);
          }
        }
        if (this.state.periodicParticles) {
          emisionTimer -= delta;
          if (emisionTimer < 0) {
            this.placeParticle(
              this.state.clickPosition,
              this.state.showingCurrent,
              this.state.showingTrayectory
            );
            emisionTimer = this.state.period;
          }
        }
      }
    }

    // Particles
    for (let i = 0; i < this.state.particles.length; i++) {
      const p = this.state.particles[i];
      if (p.active) {
        for (let j = 0; j < physicsSteps; j++) {
          const field = this.getFieldValue(
            p.worldPos,
            this.state.vectorLengthMultiplier
          );
          if (field != null) {
            p.worldPos = addPoints(
              p.worldPos,
              mulPoint(field, (delta / physicsSteps) * simulationSpeed)
            );
            const screenPos = this.worldToScreen(p.worldPos);
            p.shape.position = screenPos;
            if (p.trayectory != null && p.lifeTime < 30) {
              if (frame % vertexSkip == 0) p.trayectory.add(screenPos);
            }
            if (this.isOutOfBounds(p.worldPos)) {
              p.active = false;
              p.shape.visible = false;
            }
          }
        }
      }
    }

    // Smoke
    if (this.state.showingSmoke) {
      if (lastSmoke != null) {
        let currentSmoke = lastSmoke;
        this.state.smokeLine.removeSegments();
        this.state.smokeLine.add(this.state.clickPosition);
        while (
          currentSmoke.previousSmoke != null &&
          currentSmoke.active &&
          currentSmoke.previousSmoke.active
        ) {
          let dif = subPoints(
            currentSmoke.worldPos,
            currentSmoke.previousSmoke.worldPos
          );
          if (dif.length > 0.1) {
            break;
          }
          this.state.smokeLine.add(this.worldToScreen(currentSmoke.worldPos));
          currentSmoke = currentSmoke.previousSmoke;
        }
        //this.state.smokeLine.simplify();

        for (let i = 0; i < this.state.smoke.length; i++) {
          const p = this.state.smoke[i];
          if (p.active) {
            for (let j = 0; j < physicsSteps; j++) {
              const field = this.getFieldValue(
                p.worldPos,
                this.state.vectorLengthMultiplier
              );
              if (field != null) {
                p.worldPos = addPoints(
                  p.worldPos,
                  mulPoint(field, (delta / physicsSteps) * simulationSpeed)
                );
                if (this.isOutOfBounds(p.worldPos)) {
                  p.active = false;
                }
              }
            }
            p.lifeTime += delta;
          }
        }
      }
    }
  }

  isOutOfBounds(point) {
    return point.x > 1.5 || point.x < -1.5 || point.y > 1.5 || point.y < -1.5;
  }

  clearLinesAndParticles() {
    for (let i = 0; i < this.state.particles.length; i++) {
      if (this.state.particles[i].shape != null) {
        this.state.particles[i].shape.visible = false;
        this.state.particles[i].active = false;
      }
    }
    for (let i = 0; i < this.state.lines.length; i++) {
      this.state.lines[i].shape.visible = false;
      this.state.lines[i].active = false;
    }
    this.removeSmoke();
  }

  removeSmoke() {
    lastSmoke = null;
    this.setState({ smoke: [] });
    this.state.smokeLine.removeSegments();
  }

  calculateCurrentLine(pos, delta) {
    let futurePoints = [this.worldToScreen(pos)];
    let currentPos = new Point(pos.x, pos.y);
    for (let i = 0; i < 250; i++) {
      for (let j = 0; j < physicsSteps; j++) {
        // Future
        currentPos = addPoints(
          currentPos,
          mulPoint(
            this.getFieldValue(currentPos, 1, this.state.time),
            delta / physicsSteps
          )
        );
      }
      futurePoints.push(this.worldToScreen(currentPos));
    }
    currentPos.x = pos.x;
    currentPos.y = pos.y;
    let pastPoints = [];
    for (let i = 0; i < 250; i++) {
      for (let j = 0; j < physicsSteps; j++) {
        // Past
        currentPos = addPoints(
          currentPos,
          mulPoint(
            this.getFieldValue(currentPos, 1, this.state.time),
            -delta / physicsSteps
          )
        );
      }
      pastPoints.push(this.worldToScreen(currentPos));
    }
    let allPoints = [];
    for (let i = pastPoints.length - 1; i >= 0; i--) {
      allPoints.push(pastPoints[i]);
    }
    for (let i = 0; i < futurePoints.length; i++) {
      allPoints.push(futurePoints[i]);
    }
    return allPoints;
  }

  calculateTrayectoryLine(pos, delta) {
    let futurePoints = [this.worldToScreen(pos)];
    let currentPos = new Point(pos.x, pos.y);
    let t = this.state.time;
    for (let i = 0; i < 2000; i++) {
      for (let j = 0; j < physicsSteps; j++) {
        // Future
        currentPos = addPoints(
          currentPos,
          mulPoint(
            this.getFieldValue(
              currentPos,
              this.state.vectorLengthMultiplier,
              t
            ),
            (delta / physicsSteps) * simulationSpeed
          )
        );
      }
      t += delta / 2;
      futurePoints.push(this.worldToScreen(currentPos));
      if (this.isOutOfBounds(currentPos)) {
        break;
      }
    }

    /*currentPos.x = pos.x;
    currentPos.y = pos.y;
    let pastPoints = [];
    for (let i = 0; i < 500 * physicsSteps; i++) {
      // Past
      currentPos = addPoints(
        currentPos,
        mulPoint(this.getFieldValue(currentPos), -delta / physicsSteps)
      );
      pastPoints.push(this.worldToScreen(currentPos));
    }*/
    let allPoints = [];
    /*for (let i = 500 * physicsSteps - 1; i >= 0; i--) {
      allPoints.push(pastPoints[i]);
    }*/
    for (let i = 0; i < futurePoints.length; i++) {
      allPoints.push(futurePoints[i]);
    }
    return allPoints;
  }

  handleExpressionDialogOpen() {
    this.setState({ expressionDialogOpen: true });
  }

  handleExpressionDialogClose() {
    this.setState({ expressionDialogOpen: false });
  }

  handlePresetSelection(index) {
    this.loadExpressionPreset(presets[index]);
    this.handleExpressionDialogClose();
  }

  togglePause = (event) => {
    var newState = { ...this.state };
    newState.paused = !this.state.paused;

    if (
      this.state.showingSmoke &&
      !newState.paused &&
      this.state.clickPosition != null
    ) {
      this.placeSmoke(this.state.clickPosition, true);
    }

    this.setState(newState);
  };

  toggleAutoClean = (event) => {
    this.setState({ autoClean: !this.state.autoClean });
  };
  toggleShowingCurrent = (event) => {
    this.setState({ showingCurrent: !this.state.showingCurrent });
  };
  toggleShowingTrayectory = (event) => {
    this.setState({ showingTrayectory: !this.state.showingTrayectory });
  };
  toggleShowingSmoke = (event) => {
    if (this.state.showingSmoke) {
      this.removeSmoke();
    }
    this.setState({ showingSmoke: !this.state.showingSmoke });
  };
  togglePeriodicParticles = (event) => {
    this.setState({ periodicParticles: !this.state.periodicParticles });
  };

  onZoomChange(newValue) {
    this.setState({ zoom: newValue }, this.updateVectorField);
  }

  onVectorLengthMultiplierChange(newValue) {
    this.setState({ vectorLengthMultiplier: newValue }, this.updateVectorField);
  }

  onTimeScaleChange(newValue) {
    this.setState({ timeScale: newValue });
  }

  onPeriodChange(newValue) {
    this.setState({ period: newValue });
  }

  updateEquation() {
    this.setState(
      {
        expression: {
          x: this.cleanExpression(this.state.writtenExpression.x),
          y: this.cleanExpression(this.state.writtenExpression.y),
        },
      },
      () => this.updateVectorField()
    );
  }

  onXEquationChange(newValue) {
    const writtenExpression = { ...this.state.writtenExpression };
    const expression = { ...this.state.expression };
    writtenExpression.x = newValue;
    expression.x = this.cleanExpression(newValue);
    this.setState(
      {
        writtenExpression: writtenExpression,
        expression: expression,
      },
      () => this.updateVectorField()
    );
  }

  onYEquationChange(newValue) {
    const writtenExpression = { ...this.state.writtenExpression };
    const expression = { ...this.state.expression };
    writtenExpression.y = newValue;
    expression.y = this.cleanExpression(newValue);
    this.setState(
      {
        writtenExpression: writtenExpression,
        expression: expression,
      },
      () => this.updateVectorField()
    );
  }

  cleanExpression(expression) {
    expression = expression.replace(/\(\)/g, "");
    expression = expression.replace(/{/g, "");
    expression = expression.replace(/}/g, "");
    // Expresiones matematicas
    expression = expression.replace(/cos\(ang\)/g, "cos(Math.atan2(y, x))");
    expression = expression.replace(/sin\(ang\)/g, "sin(Math.atan2(y, x))");
    expression = expression.replace(/pi/g, "Math.PI");
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
    expression = expression.replace(/R\^2/g, "(x*x+y*y)");
    expression = expression.replace(/R\^3/g, "(x*x+y*y)*Math.sqrt(x*x+y*y)");
    expression = expression.replace(/R\^4/g, "(x*x+y*y)*(x*x+y*y)");
    expression = expression.replace(/R/g, "Math.sqrt(x*x+y*y)");
    return expression;
  }

  getParameterCode() {
    let module = "I";
    let codeVersion = "1";
    let clickPositionX = 0;
    let clickPositionY = 0;
    let worldClick = new Point(0, 0);
    if (this.state.clickPosition != null) {
      worldClick = this.screenToWorld(this.state.clickPosition);
    }
    if (this.state.clickPosition != null) {
      clickPositionX = worldClick.x;
      clickPositionY = worldClick.y;
    }
    let list = [
      module,
      codeVersion,
      this.state.timeScale,
      this.state.time,
      this.state.writtenExpression.x,
      this.state.writtenExpression.y,
      this.state.vectorLengthMultiplier,
      this.state.showingCurrent ? 1 : 0,
      this.state.showingTrayectory ? 1 : 0,
      this.state.showingSmoke ? 1 : 0,
      this.state.periodicParticles ? 1 : 0,
      this.state.period,
      clickPositionX,
      clickPositionY,
    ];
    for (let i = 0; i < this.state.particles.length; i++) {
      list.push(Math.round(this.state.particles[i].worldPos.x * 10000) / 10000);
      list.push(Math.round(this.state.particles[i].worldPos.y * 10000) / 10000);
    }
    return list.join(";");
  }

  loadParameterCode(code) {
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    let serializedParticles = split.slice(14);
    if (codeVersion == 1) {
      this.setState(
        {
          timeScale: parseFloat(split[2]),
          time: parseFloat(split[3]),
          writtenExpression: { x: split[4], y: split[5] },
          vectorLengthMultiplier: parseFloat(split[6]),
          showingCurrent: split[7] == 1,
          showingTrayectory: split[8] == 1,
          showingSmoke: split[9] == 1,
          periodicParticles: split[10] == 1,
          period: parseFloat(split[11]),
          clickPosition: this.worldToScreen(
            new Point(parseFloat(split[12]), parseFloat(split[13]))
          ),
        },
        () => {
          this.updateEquation();
          this.updateVectorField();
          this.clearLinesAndParticles();
          setTimeout(() => {
            for (let i = 0; i < serializedParticles.length; i += 2) {
              let screenPos = this.worldToScreen(
                new Point(
                  parseFloat(serializedParticles[i]),
                  parseFloat(serializedParticles[i + 1])
                )
              );
              this.placeParticle(screenPos, split[7] == 1, split[8] == 1);
            }
            this.state.clickPositionShape.position = this.state.clickPosition;
            this.state.clickPosition.visible = true;
          }, 100);
        }
      );
    }
  }

  worldToScreen(point) {
    return new Point(
      (point.x + xOffset) * this.state.screen.size + view.center.x,
      (point.y + yOffset) * this.state.screen.size + view.center.y
    );
  }

  screenToWorld(point) {
    return new Point(
      (point.x - view.center.x) / this.state.screen.size - xOffset,
      (point.y - view.center.y) / this.state.screen.size - yOffset
    );
  }

  updateVectorField() {
    for (let x = 0; x <= xGridPoints; x++) {
      for (let y = 0; y <= yGridPoints; y++) {
        const worldPos = new Point(
          (x / xGridPoints - 0.5) * xScale,
          (y / yGridPoints - 0.5) * yScale
        );
        const start = this.worldToScreen(worldPos);
        const field = this.getFieldValue(
          worldPos,
          this.state.vectorLengthMultiplier
        );
        if (field == null) {
          return;
        }
        if (isNaN(field.x) || isNaN(field.y)) {
          this.state.vectors[x][y].SetPosition(start, start);
        } else {
          this.state.vectors[x][y].SetPosition(start, addPoints(start, field));
        }
      }
    }
    this.updateColorMap();
  }

  render() {
    return (
      <PanelAndCanvas
        title="Flujo no viscoso"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
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
              <Grid item xs={2}>
                <Tooltip title="Reiniciar tiempo">
                  <Button
                    sx={{ width: "100%" }}
                    variant="contained"
                    onClick={() => this.setTime(0)}
                  >
                    <SkipPrevious></SkipPrevious>
                  </Button>
                </Tooltip>
              </Grid>
              {(this.state.paused && (
                <Grid item xs={10}>
                  <SliderWithInput
                    label="Tiempo"
                    step={0.01}
                    min={0}
                    max={10}
                    value={this.state.time}
                    onChange={(e) => {
                      this.setTime(e);
                      this.updateVectorField();
                    }}
                  ></SliderWithInput>
                </Grid>
              )) || (
                <Grid item xs={10}>
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
              )}

              <Grid item xs={2}>
                <Tooltip title="Campos vectoriales predeterminados">
                  <Button
                    sx={{ width: "100%" }}
                    variant="contained"
                    onClick={() => this.handleExpressionDialogOpen()}
                  >
                    <MenuIcon></MenuIcon>
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={5}>
                <ExpressionInput
                  label="x':"
                  value={this.state.writtenExpression.x}
                  onChange={(e) => this.onXEquationChange(e)}
                ></ExpressionInput>
              </Grid>
              <Grid item xs={5}>
                <ExpressionInput
                  label="y':"
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
                <SliderWithInput
                  label="Zoom"
                  min={0.1}
                  step={0.1}
                  max={100}
                  value={this.state.zoom}
                  onChange={(e) => this.onZoomChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={4}>
                <MyToggle
                  label="Mostrar línea de corriente"
                  checked={this.state.showingCurrent}
                  onChange={(e) => this.toggleShowingCurrent(e)}
                ></MyToggle>
              </Grid>
              <Grid item xs={4}>
                <MyToggle
                  label="Mostrar línea de trayectoria"
                  checked={this.state.showingTrayectory}
                  onChange={(e) => this.toggleShowingTrayectory(e)}
                ></MyToggle>
              </Grid>
              <Grid item xs={4}>
                <MyToggle
                  label="Mostrar línea de humo"
                  checked={this.state.showingSmoke}
                  onChange={(e) => this.toggleShowingSmoke(e)}
                ></MyToggle>
              </Grid>
              <Grid item xs={4}>
                <MyToggle
                  label="Emisión periodica"
                  checked={this.state.periodicParticles}
                  onChange={(e) => this.togglePeriodicParticles(e)}
                ></MyToggle>
              </Grid>
              <Grid item xs={8}>
                <SliderWithInput
                  label="Periodo de emisión"
                  min={0.05}
                  step={0.05}
                  max={3}
                  value={this.state.period}
                  onChange={(e) => this.onPeriodChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <MyToggle
                  label="Borrar lineas y partículas al cliquear"
                  checked={this.state.autoClean}
                  onChange={(e) => this.toggleAutoClean(e)}
                ></MyToggle>
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
            <Dialog
              open={this.state.expressionDialogOpen}
              onClose={() => this.handleExpressionDialogClose()}
            >
              <DialogTitle>Seleccione un campo vectorial</DialogTitle>
              <DialogContent>
                <Stack spacing={2}>
                  {presets.map((p, index) => (
                    <Button
                      key={index}
                      onClick={() => this.handlePresetSelection(index)}
                      variant="contained"
                    >
                      {p.name + " → [ " + p.x + " ; " + p.y + " ]"}
                    </Button>
                  ))}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => this.handleExpressionDialogClose()}>
                  Cancelar
                </Button>
              </DialogActions>
            </Dialog>
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

export default Modulo9FlujoNoViscoso;

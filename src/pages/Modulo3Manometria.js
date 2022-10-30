import MyToggle from "../components/MyToggle";
import React, { Component } from "react";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import AddIcon from "@mui/icons-material/Add";

import {
  view,
  Point,
  Size,
  Path,
  Shape,
  Rectangle,
  PointText,
  project,
} from "paper";
import SliderWithInput from "../components/SliderWithInput";

import {
  createBoxPath,
  getColorFromGradient,
  pressureGradient,
  VectorArray,
  addPoints,
  subPoints,
  lerp,
  LevelSimbol,
  VectorArrow,
} from "../paperUtility";
import { Button, Grid } from "@mui/material";
import Stratum from "../components/Stratum";
import { HorizontalSplit } from "@mui/icons-material";
import { MathComponent } from "mathjax-react";
import PanelModule from "../components/PanelModule";
import ModuleAccordion from "../components/ModuleAccordion";

let loading = false;

const metersToPixels = 1000;
const paToPixels = 20;
const maxPressure = 16;

const leftColumnXOffset = -100;
const rightColumnXOffset = 300;

let heightDifference = 0;
let velocity = 0;

class Modulo3Manometria extends Component {
  state = {
    ready: false,
    pipe: {
      exteriorShape: null,
      interiorShape: null,
    },
    reservoir: {
      shape: null,
      radius: 100,
      pressure: 101325,
      color: "#FFCCCC",
      pipeShape: null,
      density: 1,
    },
    liquid: {
      shape: null,
      density: 1000,
    },
    columnInfo: null,
    background: {
      shape: null,
    },
    atmPressureText: null,
    atmosphericPressure: 101325,
    gravity: 9.8,
  };

  onReservoirPressureChanged = (newValue) => {
    var reservoirCopy = { ...this.state.reservoir };
    reservoirCopy.pressure = newValue;
    this.setState({ reservoir: reservoirCopy });
  };

  onAtmosphericPressureChanged = (newValue) => {
    this.setState({ atmosphericPressure: newValue });
  };

  onLiquidDensityChanged = (newValue) => {
    var liquidCopy = { ...this.state.liquid };
    liquidCopy.density = newValue;
    this.setState({ liquid: liquidCopy });
  };

  updateFluid(delta) {
    delta = Math.min(0.5, delta);
    const level = 100;
    const frequency = 4;
    const damping = 0.9;
    const minDifference = -0.21;
    const maxDifference = 0.21;

    const center = view.center;

    const airPressureDifference =
      this.state.reservoir.pressure - this.state.atmosphericPressure;
    const targetHeightDifference =
      airPressureDifference /
      (this.state.liquid.density * this.state.gravity) /
      2;

    const distanceToTarget = targetHeightDifference - heightDifference;
    let newVelocity =
      (velocity + distanceToTarget * delta * frequency) * damping;

    let newHeightDifference = heightDifference + newVelocity;
    if (newHeightDifference < minDifference) {
      newHeightDifference = minDifference;
      newVelocity = -newVelocity;
    }
    if (newHeightDifference > maxDifference) {
      newHeightDifference = maxDifference;
      newVelocity = -newVelocity;
    }

    if (this.state.ready) {
      const leftColumnX = center.x + leftColumnXOffset;
      const rightColumnX = center.x + rightColumnXOffset;
      const midColumnX = (leftColumnX + rightColumnX) / 2;
      const leftHeight =
        center.y + level + newHeightDifference * metersToPixels;
      const rightHeight =
        center.y + level - newHeightDifference * metersToPixels;
      this.state.liquid.shape.segments[0].point.y = leftHeight;
      this.state.liquid.shape.segments[3].point.y = rightHeight;

      const targetLeftHeight =
        center.y + level + targetHeightDifference * metersToPixels;
      const targetRightHeight =
        center.y + level - targetHeightDifference * metersToPixels;
      const heightMeasure = this.state.columnInfo.heightMeasure;

      const leftLine = heightMeasure.leftLine.segments;
      leftLine[0].point.x = leftColumnX + 25;
      leftLine[0].point.y = targetLeftHeight;
      if (targetHeightDifference < 0.5) {
        leftLine[1].point.x = midColumnX + 10;
      } else {
        leftLine[1].point.x = rightColumnX - 25;
      }
      leftLine[1].point.y = targetLeftHeight;

      const rightLine = heightMeasure.rightLine.segments;
      if (targetHeightDifference > -0.5) {
        rightLine[0].point.x = midColumnX - 10;
      } else {
        rightLine[0].point.x = leftColumnX + 25;
      }
      rightLine[0].point.y = targetRightHeight;
      rightLine[1].point.x = rightColumnX - 25;
      rightLine[1].point.y = targetRightHeight;
      heightMeasure.text.content =
        Math.round(targetHeightDifference * 10000) / 10000 + " m";
      if (Math.abs(targetHeightDifference) > 0.02) {
        heightMeasure.text.point.x = midColumnX + 5;
        heightMeasure.text.point.y = center.y + 105;
      } else {
        heightMeasure.text.point.x = midColumnX - 20;
        heightMeasure.text.point.y = center.y + 70;
      }
      heightMeasure.arrow.SetPosition(
        new Point(midColumnX, targetLeftHeight),
        new Point(midColumnX, targetRightHeight)
      );

      heightDifference = newHeightDifference;
      velocity = newVelocity;
    }
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "#ffffff";

    const reservoir = new Shape.Circle(
      new Point(center.x - 250, center.y - 150),
      50
    );
    reservoir.strokeColor = "black";
    reservoir.fillColor = this.state.reservoir.color;
    reservoir.strokeWidth = 10;
    const pipeExterior = new Path({
      fillColor: "transparent",
      strokeColor: "black",
      strokeWidth: 40,
      strokeJoin: "round",
    });
    pipeExterior.add(
      new Point(center.x + leftColumnXOffset - 100, center.y - 150)
    );
    pipeExterior.add(new Point(center.x + leftColumnXOffset, center.y - 150));
    pipeExterior.add(new Point(center.x + leftColumnXOffset, center.y + 350));
    pipeExterior.add(new Point(center.x + rightColumnXOffset, center.y + 350));
    pipeExterior.add(new Point(center.x + rightColumnXOffset, center.y - 350));

    const pipeInterior = new Path({
      fillColor: "transparent",
      strokeColor: "white",
      strokeWidth: 20,
      strokeJoin: "round",
      strokeCap: "square",
    });
    pipeInterior.segments = pipeExterior.segments;

    reservoir.pipeShape = new Path({
      strokeColor: this.state.reservoir.color,
      strokeWidth: 20,
      strokeCap: "square",
      strokeJoin: "round",
    });
    reservoir.pipeShape.add(
      new Point(center.x + leftColumnXOffset - 100, center.y - 150)
    );
    reservoir.pipeShape.add(
      new Point(center.x + leftColumnXOffset, center.y - 150)
    );
    reservoir.pipeShape.add(
      new Point(center.x + leftColumnXOffset, center.y + 330)
    );

    const liquid = new Path({
      fillColor: "transparent",
      strokeColor: "#1976D2",
      strokeWidth: 20,
      strokeJoin: "round",
      strokeCap: "butt",
    });
    liquid.add(new Point(center.x + leftColumnXOffset, center.y + 100));
    liquid.add(new Point(center.x + leftColumnXOffset, center.y + 350));
    liquid.add(new Point(center.x + rightColumnXOffset, center.y + 350));
    liquid.add(new Point(center.x + rightColumnXOffset, center.y - 50));

    const columnInfo = {};
    const measureLineStyle = {
      strokeColor: "black",
      strokeWidth: 4,
    };
    columnInfo.heightMeasure = {
      rightLine: new Path(measureLineStyle),
      leftLine: new Path(measureLineStyle),
      arrow: new VectorArrow(
        new Point(0, 0),
        new Point(0, 0),
        "black",
        2,
        5,
        15,
        true
      ),
    };
    columnInfo.heightMeasure.rightLine.add(
      new Point(center.x + 40, center.y + 100)
    );
    columnInfo.heightMeasure.rightLine.add(
      new Point(center.x + 175, center.y + 100)
    );
    columnInfo.heightMeasure.leftLine.add(
      new Point(center.x - 75, center.y + 100)
    );
    columnInfo.heightMeasure.leftLine.add(
      new Point(center.x + 60, center.y + 100)
    );

    columnInfo.heightMeasure.text = new PointText(
      new Point(center.x, center.y)
    );
    columnInfo.heightMeasure.text.fontSize = 20;

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.liquid.shape = liquid;
    newState.columnInfo = columnInfo;
    newState.ready = true;
    this.setState(newState);

    view.onFrame = (event) => {
      this.updateFluid(event.delta);
    };
  }

  getPressureSteps() {
    const steps = [];
    let currentPressure = this.state.absolutePressure
      ? this.state.atmosphericPressure
      : 0;
    steps.push(currentPressure);
    for (let l = 0; l < this.state.liquids.length; l++) {
      const liquid = this.state.liquids[l];
      currentPressure += (liquid.density * liquid.height) / metersToPixels;
      steps.push(currentPressure);
    }
    return steps;
  }

  getPressureAtPosition(position) {
    const points = this.getImportantPoints();
    const pressureSteps = this.getPressureSteps();
    if (position.y < points.liquids[0].topLeft) {
      return pressureSteps[0];
    } else {
      for (let l = 0; l < this.state.liquids[l].length; l++) {
        if (position.y < points.liquids[l].topLeft.y) {
          const t =
            (position.y - points.liquids[l].topLeft.y) /
            this.state.liquids[l].height;
          return lerp(pressureSteps[l], pressureSteps[l + 1], t);
        }
      }
    }
  }

  getLiquidGradientPoints(
    topPosition,
    bottomPosition,
    topPressure,
    bottomPressure
  ) {
    const difference = subPoints(topPosition, bottomPosition);
    const height = difference.length;
    const pressureDifference = Math.max(0.0001, bottomPressure - topPressure);
    const pressureRange = maxPressure;

    const gradientHeight = (pressureRange * height) / pressureDifference;
    const gradientSlope = height / pressureDifference;
    const gradientOffset = gradientSlope * topPressure;
    const gradientStart = new Point(
      topPosition.x,
      topPosition.y - gradientOffset
    );
    const gradientEnd = new Point(
      topPosition.x,
      topPosition.y + gradientHeight - gradientOffset
    );

    return { top: gradientStart, bottom: gradientEnd };
  }

  getParameterCode() {
    let module = "C";
    let codeVersion = "1";
    return [
      module,
      codeVersion,
      this.state.reservoir.pressure,
      this.state.atmosphericPressure,
      this.state.liquid.density,
    ].join(";");
  }

  loadParameterCode(code) {
    if (loading) return false;
    loading = true;
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    if (codeVersion == 1) {
      if (split.length != 5) {
        throw "Formato inválido";
      }
      let reservoir = { ...this.state.reservoir };
      let liquid = { ...this.state.liquid };
      reservoir.pressure = parseFloat(split[2]);
      let atmosphericPressure = parseFloat(split[3]);
      liquid.density = parseFloat(split[4]);
      this.setState(
        { reservoir, atmosphericPressure, liquid },
        () => (loading = false)
      );
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Manometría"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        panel={
          <>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Presión del reservorio"
                  step={25}
                  min={101325 - 1000}
                  max={101325 + 1000}
                  unit="Pa"
                  value={this.state.reservoir.pressure}
                  onChange={this.onReservoirPressureChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Presión atmosférica"
                  step={25}
                  min={101325 - 1000}
                  max={101325 + 1000}
                  unit="Pa"
                  value={this.state.atmosphericPressure}
                  onChange={this.onAtmosphericPressureChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del líquido"
                  step={10}
                  min={500}
                  max={2000}
                  unit="kg/m³"
                  value={this.state.liquid.density}
                  onChange={this.onLiquidDensityChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12} sx={{ marginTop: "50px" }}>
                <ModuleAccordion title="Ecuación">
                  <MathComponent
                    tex={String.raw`\triangle Z : \text{altura de la columna}`}
                  />
                  <MathComponent
                    tex={String.raw`P_{r}: \text{Presion en el reservorio}`}
                  />
                  <MathComponent
                    tex={String.raw`P_{a}: \text{Presion atmosferica}`}
                  />
                  <MathComponent
                    tex={String.raw`\rho: \text{Densidad del liquido}`}
                  />
                  <MathComponent
                    tex={String.raw`\triangle Z = \frac{P_{r}-P_{a}}{\rho} `}
                  />
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

export default Modulo3Manometria;

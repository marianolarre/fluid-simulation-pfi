import MyToggle from "../components/MyToggle";
import React, { Component } from "react";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import AddIcon from "@mui/icons-material/Add";

import Paper from "paper";
import { Color, Point } from "paper/dist/paper-core";
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

const metersToPixels = 400;
const atmToPixels = 20;
const maxPressure = 16;

const leftColumnXOffset = -100;
const rightColumnXOffset = 300;

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
      pressure: 2,
      color: "#FFCCCC",
      pipeShape: null,
      density: 1,
    },
    liquid: {
      shape: null,
      velocity: 0,
      heightDifference: 0,
      density: 10,
    },
    columnInfo: null,
    background: {
      shape: null,
    },
    atmPressureText: null,
    atmosphericPressure: 1,
    gravity: 1,
  };

  componentDidUpdate() {}

  onReservoirPressureChanged = (newValue) => {
    var newState = { ...this.state };
    newState.reservoir.pressure = newValue;
    this.setState(newState);
  };

  onReservoirDensityChanged = (newValue) => {
    var newState = { ...this.state };
    newState.reservoir.density = newValue;
    this.setState(newState);
  };

  onAtmosphericPressureChanged = (newValue) => {
    var newState = { ...this.state };
    newState.atmosphericPressure = newValue;
    this.setState(newState);
  };

  onLiquidDensityChanged = (newValue) => {
    var newState = { ...this.state };
    newState.liquid.density = newValue;
    this.setState(newState);
  };

  updateFluid(delta) {
    const level = 100;
    const frequency = 4;
    const damping = 0.9;
    const minDifference = -11;
    const maxDifference = 12;

    const center = Paper.view.center;

    const airPressureDifference =
      this.state.reservoir.pressure - this.state.atmosphericPressure;
    const targetHeightDifference =
      airPressureDifference /
      (this.state.liquid.density * this.state.gravity) /
      2;

    const distanceToTarget =
      targetHeightDifference - this.state.liquid.heightDifference;
    let newVelocity =
      (this.state.liquid.velocity + distanceToTarget * delta * frequency) *
      damping;

    let newHeightDifference = this.state.liquid.heightDifference + newVelocity;
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
      const leftHeight = center.y + level + newHeightDifference * atmToPixels;
      const rightHeight = center.y + level - newHeightDifference * atmToPixels;
      this.state.liquid.shape.segments[0].point.y = leftHeight;
      this.state.liquid.shape.segments[3].point.y = rightHeight;

      const targetLeftHeight =
        center.y + level + targetHeightDifference * atmToPixels;
      const targetRightHeight =
        center.y + level - targetHeightDifference * atmToPixels;
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
        Math.round(targetHeightDifference * 100) / 100;
      if (Math.abs(targetHeightDifference) > 1) {
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

      var newState = { ...this.state };
      newState.liquid.heightDifference = newHeightDifference;
      newState.liquid.velocity = newVelocity;
      this.setState(newState);
    }
  }

  canvasFunction() {
    const center = Paper.view.center;

    const background = new Paper.Path.Rectangle(
      new Paper.Rectangle(new Paper.Point(0, 0), Paper.view.size)
    );
    background.fillColor = "#ffffff";

    const reservoir = new Paper.Shape.Circle(
      new Paper.Point(center.x - 250, center.y - 150),
      50
    );
    reservoir.strokeColor = "black";
    reservoir.fillColor = this.state.reservoir.color;
    reservoir.strokeWidth = 10;
    const pipeExterior = new Paper.Path({
      fillColor: "transparent",
      strokeColor: "black",
      strokeWidth: 40,
      strokeJoin: "round",
    });
    pipeExterior.add(
      new Paper.Point(center.x + leftColumnXOffset - 100, center.y - 150)
    );
    pipeExterior.add(
      new Paper.Point(center.x + leftColumnXOffset, center.y - 150)
    );
    pipeExterior.add(
      new Paper.Point(center.x + leftColumnXOffset, center.y + 350)
    );
    pipeExterior.add(
      new Paper.Point(center.x + rightColumnXOffset, center.y + 350)
    );
    pipeExterior.add(
      new Paper.Point(center.x + rightColumnXOffset, center.y - 350)
    );

    const pipeInterior = new Paper.Path({
      fillColor: "transparent",
      strokeColor: "white",
      strokeWidth: 20,
      strokeJoin: "round",
      strokeCap: "square",
    });
    pipeInterior.segments = pipeExterior.segments;

    reservoir.pipeShape = new Paper.Path({
      strokeColor: this.state.reservoir.color,
      strokeWidth: 20,
      strokeCap: "square",
      strokeJoin: "round",
    });
    reservoir.pipeShape.add(
      new Paper.Point(center.x + leftColumnXOffset - 100, center.y - 150)
    );
    reservoir.pipeShape.add(
      new Paper.Point(center.x + leftColumnXOffset, center.y - 150)
    );
    reservoir.pipeShape.add(
      new Paper.Point(center.x + leftColumnXOffset, center.y + 330)
    );

    const liquid = new Paper.Path({
      fillColor: "transparent",
      strokeColor: "#1976D2",
      strokeWidth: 20,
      strokeJoin: "round",
      strokeCap: "butt",
    });
    liquid.add(new Paper.Point(center.x + leftColumnXOffset, center.y + 100));
    liquid.add(new Paper.Point(center.x + leftColumnXOffset, center.y + 350));
    liquid.add(new Paper.Point(center.x + rightColumnXOffset, center.y + 350));
    liquid.add(new Paper.Point(center.x + rightColumnXOffset, center.y - 50));

    const columnInfo = {};
    const measureLineStyle = {
      strokeColor: "black",
      strokeWidth: 4,
    };
    columnInfo.heightMeasure = {
      rightLine: new Paper.Path(measureLineStyle),
      leftLine: new Paper.Path(measureLineStyle),
      arrow: new VectorArrow(
        new Paper.Point(0, 0),
        new Paper.Point(0, 0),
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

    columnInfo.heightMeasure.text = new Paper.PointText(
      new Point(center.x, center.y)
    );
    columnInfo.heightMeasure.text.fontSize = 20;

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.liquid.shape = liquid;
    newState.columnInfo = columnInfo;
    newState.ready = true;
    this.setState(newState);

    Paper.view.onFrame = (event) => {
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

  render() {
    return (
      <PanelAndCanvas
        title="Manometría"
        panel={
          <>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Presión del reservorio"
                  step={0.1}
                  min={0}
                  max={100}
                  unit="atm"
                  value={this.state.reservoir.pressure}
                  onChange={this.onReservoirPressureChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Presión atmosférica"
                  step={0.1}
                  min={0}
                  max={100}
                  unit="atm"
                  value={this.state.atmosphericPressure}
                  onChange={this.onAtmosphericPressureChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del líquido"
                  step={0.25}
                  min={5}
                  max={50}
                  unit="kg/m³"
                  value={this.state.liquid.density}
                  onChange={this.onLiquidDensityChanged}
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

export default Modulo3Manometria;

import MyToggle from "../components/MyToggle";
import React, { Component } from "react";
import Grid from "@mui/material/Grid";
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
} from "../paperUtility";
import { Button } from "@mui/material";
import { HorizontalSplit, ThirteenMp } from "@mui/icons-material";
import MyRadio from "../components/MyRadio";

const metersToPixels = 400;
const atmToPixels = 20;
const maxPressure = 12;
let incrementingLiquidLookup = 0;
const liquidColors = "#1976D2";

class Modulo1FuerzasDePresion extends Component {
  state = {
    container: {
      shape: null,
      width: 300,
      height: 401,
      borderRadius: 0,
    },
    liquid: {
      height: 200,
      density: 2,
    },
    background: {
      shape: null,
    },
    atmPressureText: null,
    arrows: null,
    atmosphericPressure: 1,
    showingPressure: false,
    showingPressureForces: false,
    absolutePressure: false,
    density: 0.5,
    gravity: 1,
  };

  componentDidUpdate() {
    this.updateShapes();
    this.updatePressureDisplays(
      this.state.absolutePressure,
      this.state.showingPressure,
      this.state.showingPressureForces
    );
  }

  getImportantPoints() {
    const center = Paper.view.center;
    const halfContainerWidth = this.state.container.width / 2;
    const halfContainerHeight = this.state.container.height / 2;
    const left = center.x - halfContainerWidth;
    const right = center.x + halfContainerWidth;

    let liquidPoints = {
      topLeft: new Point(
        left,
        center.y + halfContainerHeight - this.state.liquid.height
      ),
      topRight: new Point(
        right,
        center.y + halfContainerHeight - this.state.liquid.height
      ),
      bottomRight: new Point(right, center.y + halfContainerHeight),
      bottomLeft: new Point(left, center.y + halfContainerHeight),
    };

    return {
      container: {
        topLeft: new Point(left, center.y - halfContainerHeight),
        topRight: new Point(right, center.y - halfContainerHeight),
        bottomLeft: new Point(left, center.y + halfContainerHeight),
        bottomRight: new Point(right, center.y + halfContainerHeight),
      },
      liquid: liquidPoints,
    };
  }

  getNewLiquid() {
    let newDensity = 2;
    let liquid = {
      shape: null,
      topLineShape: null,
      pressureText: null,
      levelSimbol: null,
      height: 200,
      density: newDensity,
      color: liquidColors,
    };
    liquid.shape = new Paper.Path({
      fillColor: liquidColors,
    });
    liquid.shape.add(new Point(0, 0));
    liquid.shape.add(new Point(0, 0));
    liquid.shape.add(new Point(0, 0));
    liquid.shape.add(new Point(0, 0));

    liquid.topLineShape = new Paper.Path({
      strokeColor: "white",
      strokeWidth: 3,
      dashArray: [12, 13],
    });
    liquid.topLineShape.visible = false;
    liquid.topLineShape.add(new Point(0, 0));
    liquid.topLineShape.add(new Point(0, 0));

    liquid.pressureText = new Paper.PointText({
      justification: "left",
      fillColor: "white",
      fontSize: 15,
      content: "1.5 atm",
      visible: true,
    });

    liquid.levelSimbol = new LevelSimbol(new Point(0, 0), "white");

    return liquid;
  }

  onContainerWidthChange = (newValue) => {
    var newState = { ...this.state };
    newState.container.width = newValue;
    this.setState(newState);
  };

  onContainerHeightChange = (newValue) => {
    var newState = { ...this.state };
    newState.container.height = newValue;
    this.handleOverflow(newState);
    this.setState(newState);
  };

  onLiquidHeightChange = (newValue, liquidID) => {
    var newState = { ...this.state };
    newState.liquid.height = newValue;

    this.handleOverflow(newState, liquidID);

    this.setState(newState);
  };

  handleOverflow(state, ignoreID) {
    /*liquidSum = state.liquid.height;

    let overflow = liquidSum - state.container.height;
    if (overflow > 0) {
      const spilledLiquidsCount = state.liquids.length - 1;
      const spillage = Math.min(overflow, state.liquid.height);
      state.liquid.height -= spillage;
      overflow -= spillage;
    }*/
  }

  onLiquidDensityChange = (newValue) => {
    var newState = { ...this.state };
    newState.liquid.density = newValue;
    this.setState(newState);
  };

  onBorderRadiusChange = (newValue) => {
    var newState = { ...this.state };
    newState.container.borderRadius = newValue;
    this.setState(newState);
  };

  onPressureTypeChange = (event) => {
    console.log(event.target.value);
    var newState = { ...this.state };
    newState.absolutePressure = event.target.value == "true";
    this.setState(newState);
  };

  toggleShowingPressureChange = (event) => {
    const showPressure = !this.state.showingPressure;
    var newState = { ...this.state };
    newState.showingPressure = showPressure;
    this.setState(newState);

    this.state.liquid.topLineShape.visible = showPressure;
  };

  toggleShowingPressureForcesChange = (event) => {
    const showingPressureForces = !this.state.showingPressureForces;
    var newState = { ...this.state };
    newState.showingPressureForces = showingPressureForces;
    this.setState(newState);
  };

  updateShapes() {
    const container = this.state.container.shape;
    let liquid = this.state.liquid.shape;
    const points = this.getImportantPoints();
    const radius = Math.min(
      this.state.container.borderRadius,
      this.state.container.width / 2 - 1
    );

    container.removeSegments();
    liquid.removeSegments();

    container.add(points.container.topLeft);
    if (points.liquid.topLeft.y <= points.container.bottomLeft.y - radius) {
      container.add(points.liquid.topLeft);
    }
    this.addRoundedCorners(container, points.container.topLeft);
    if (points.liquid.topRight.y <= points.container.bottomRight.y - radius) {
      container.add(points.liquid.topRight);
    }
    container.add(points.container.topRight);

    if (points.liquid.topLeft.y <= points.container.bottomLeft.y - radius) {
      liquid.add(points.liquid.topLeft);
    }
    this.addRoundedCorners(liquid, points.liquid.topLeft);
    if (points.liquid.topRight.y <= points.container.bottomRight.y - radius) {
      liquid.add(points.liquid.topRight);
    }

    const topLine = this.state.liquid.topLineShape;
    const text = this.state.liquid.pressureText;

    topLine.segments = [points.liquid.topLeft, points.liquid.topRight];

    const levelSimbolPosition = addPoints(
      points.liquid.topRight,
      new Point(-25, 0)
    );
    let displacement = 0;
    if (levelSimbolPosition.y > points.liquid.bottomRight.y - radius) {
      displacement =
        (-points.liquid.bottomRight.y + radius + levelSimbolPosition.y) * 0.75;
      levelSimbolPosition.x -= displacement;
    }
    this.state.atmPressureText.point = addPoints(
      points.liquid.topLeft,
      new Point(15 + displacement, -6)
    );
    this.state.liquid.levelSimbol.setPosition(levelSimbolPosition);

    this.updatePressureDisplays(
      this.state.absolutePressure,
      this.state.showingPressure,
      this.state.showingPressureForces
    );
  }

  addRoundedCorners(path, topPlane) {
    const points = this.getImportantPoints();
    const radius = Math.max(
      0.01,
      Math.min(
        this.state.container.borderRadius,
        this.state.container.width / 2 - 1
      )
    );

    const rightAngle = Math.PI / 2;
    let cornerCenter;
    // Bottom left radius
    cornerCenter = addPoints(
      points.container.bottomLeft,
      new Point(radius, -radius)
    );
    for (let i = rightAngle * 2; i <= rightAngle * 3; i += rightAngle / 45) {
      const offset = new Point(Math.cos(i) * radius, -Math.sin(i) * radius);
      if (topPlane.y < cornerCenter.y + offset.y) {
        path.add(addPoints(cornerCenter, offset));
      }
    }
    // Bottom right radius
    cornerCenter = addPoints(
      points.container.bottomRight,
      new Point(-radius, -radius)
    );
    for (let i = rightAngle * 3; i <= rightAngle * 4; i += rightAngle / 45) {
      const offset = new Point(Math.cos(i) * radius, -Math.sin(i) * radius);
      if (topPlane.y < cornerCenter.y + offset.y) {
        path.add(addPoints(cornerCenter, offset));
      }
    }
  }

  updateLiquidPressure(
    absolutePressure,
    showingPressure,
    showingPressureForces
  ) {
    if (showingPressure) {
      const points = this.getImportantPoints();
      const pressureSteps = this.getPressureSteps();
      const liquid = this.state.liquid;
      const gradientPoints = this.getLiquidGradientPoints(
        points.liquid.topLeft,
        points.liquid.bottomLeft,
        pressureSteps[0],
        pressureSteps[1]
      );
      this.state.liquid.shape.fillColor = {
        origin: gradientPoints.top,
        destination: gradientPoints.bottom,
        gradient: {
          stops: pressureGradient,
        },
      };
      this.state.liquid.topLineShape.visible = showingPressure;
    } else {
      this.state.liquid.shape.fillColor = this.state.liquid.color;
      this.state.liquid.topLineShape.visible = showingPressure;
    }

    this.updateVectors(
      absolutePressure,
      showingPressure,
      showingPressureForces
    );
  }

  updateAirPressure(absolutePressure, showingPressure, showingPressureForces) {
    if (showingPressure) {
      this.state.background.shape.fillColor = absolutePressure
        ? getColorFromGradient(
            pressureGradient,
            this.state.atmosphericPressure / maxPressure
          )
        : getColorFromGradient(pressureGradient, 0);
      this.state.atmPressureText.fillColor = "white";
    } else {
      this.state.background.shape.fillColor = "white";
      this.state.atmPressureText.fillColor = "black";
    }
    this.state.atmPressureText.content = absolutePressure ? "1 atm" : "0 atm";
  }

  updatePressureDisplays(
    absolutePressure,
    showingPressure,
    showingPressureForces
  ) {
    this.updateLiquidPressure(
      absolutePressure,
      showingPressure,
      showingPressureForces
    );
    this.updateAirPressure(
      absolutePressure,
      showingPressure,
      showingPressureForces
    );
    this.updateVectors(
      absolutePressure,
      showingPressure,
      showingPressureForces
    );
  }

  updateVectors(absolutePressure, showingPressure, showingPressureForces) {
    if (showingPressureForces) {
      // Liquids
      const stepMagnitudes = [];
      const arrowPoints = [];

      const segments = this.state.container.shape.segments;
      for (let i = 0; i < segments.length; i++) {
        stepMagnitudes.push(
          this.getPressureAtPosition(segments[i].point) * atmToPixels
        );
        arrowPoints.push(segments[i].point);
      }

      this.state.arrows.SetValues(arrowPoints, stepMagnitudes, 20, {
        inverted: true,
      });

      // Air
    } else {
      this.state.arrows.Reset();
    }
  }

  canvasFunction() {
    const center = Paper.view.center;

    const background = new Paper.Path.Rectangle(
      new Paper.Rectangle(new Paper.Point(0, 0), Paper.view.size)
    );
    background.fillColor = "#ffffff";

    const container = new Paper.Path({
      fillColor: "transparent",
      strokeColor: "black",
      strokeWidth: 5,
    });

    const atmPressureText = new Paper.PointText({
      justification: "left",
      fillColor: "black",
      fontSize: 15,
      content: "0 atm",
      visible: true,
    });

    let newState = { ...this.state };
    newState.container = {
      shape: container,
      width: 300,
      height: 401,
      borderRadius: 0,
    };
    newState.liquid = this.getNewLiquid();
    newState.container.shape.bringToFront();
    newState.background.shape = background;
    newState.atmPressureText = atmPressureText;
    newState.arrows = new VectorArray();
    this.setState(newState);
    createBoxPath(
      container,
      center,
      new Point(this.state.container.width / 2, this.state.container.height / 2)
    );

    /*Paper.view.onFrame = (event) => {

    };*/
  }

  getPressureSteps() {
    const steps = [];
    let currentPressure = this.state.absolutePressure
      ? this.state.atmosphericPressure
      : 0;
    steps.push(currentPressure);
    const liquid = this.state.liquid;
    currentPressure += (liquid.density * liquid.height) / metersToPixels;
    steps.push(currentPressure);
    return steps;
  }

  getPressureAtPosition(position) {
    const points = this.getImportantPoints();
    const depth = Math.max(0, position.y - points.liquid.topRight.y);
    const atmPressure = this.state.absolutePressure
      ? this.state.atmosphericPressure
      : 0;
    return atmPressure + (this.state.liquid.density * depth) / metersToPixels;
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
        title="Fuerzas de presión"
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="Ancho del contenedor"
                  step={1}
                  min={100}
                  max={400}
                  unit="cm"
                  value={this.state.container.width}
                  onChange={this.onContainerWidthChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Altura del líquido"
                  step={1}
                  min={0}
                  max={400}
                  value={this.state.liquid.height}
                  unit="cm"
                  onChange={this.onLiquidHeightChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del líquido"
                  step={0.1}
                  min={0}
                  max={10}
                  unit="kg/m³"
                  value={this.state.liquid.density}
                  onChange={this.onLiquidDensityChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Radio de las esquinas"
                  step={1}
                  min={0}
                  max={200}
                  unit="cm"
                  value={this.state.container.borderRadius}
                  onChange={this.onBorderRadiusChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12} xl={6}>
                <MyToggle
                  label="Presión"
                  checked={this.state.showingPressure}
                  onChange={this.toggleShowingPressureChange}
                />
              </Grid>
              <Grid item xs={12} xl={6}>
                <MyToggle
                  label="Fuerzas de presión"
                  checked={this.state.showingPressureForces}
                  onChange={this.toggleShowingPressureForcesChange}
                />
              </Grid>
              <Grid item xs={12}>
                <MyRadio
                  options={[
                    { value: false, label: "Presion Manométrica" },
                    { value: true, label: "Presion Absoluta" },
                  ]}
                  value={this.state.absolutePressure}
                  onChange={this.onPressureTypeChange}
                ></MyRadio>
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

export default Modulo1FuerzasDePresion;

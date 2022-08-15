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
} from "../paperUtility";
import { Button } from "@mui/material";
import { HorizontalSplit } from "@mui/icons-material";

const metersToPixels = 400;
const atmToPixels = 20;
const maxPressure = 16;
let incrementingLiquidLookup = 0;
const liquidColors = "#1976D2";

class Modulo1FuerzasDePresion extends Component {
  state = {
    container: {
      shape: null,
      width: 300,
      height: 400,
      borderRadius: 0,
    },
    liquids: {
      height: 100,
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
    this.updateContainerSize();
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

    let currentHeight = center.y + halfContainerHeight;

    liquidPoints = {
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
      liquids: liquidPoints,
    };
  }

  getNewLiquid() {
    let newDensity = 1.5;
    if (this.state.liquids.length > 0) {
      newDensity =
        this.state.liquids[this.state.liquids.length - 1].density + 0.5;
    }
    let liquid = {
      shape: null,
      topLineShape: null,
      pressureText: null,
      levelSimbol: null,
      height: 50,
      density: newDensity,
      color: liquidColors[incrementingLiquidLookup],
    };
    incrementingLiquidLookup =
      (incrementingLiquidLookup + 1) % liquidColors.length;
    liquid.shape = new Paper.Path({
      fillColor: liquid.color,
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
    newState.liquids[liquidID].height = newValue;

    this.handleOverflow(newState, liquidID);

    this.setState(newState);
  };

  handleOverflow(state, ignoreID) {
    let liquidSum = 0;
    for (let l = 0; l < state.liquids.length; l++) {
      liquidSum += state.liquids[l].height;
    }
    let overflow = liquidSum - state.container.height;
    if (overflow > 0) {
      const spilledLiquidsCount = state.liquids.length - 1;
      for (let l = 0; l < state.liquids.length; l++) {
        if (l != ignoreID && state.liquids[l].height > 0) {
          const spillage = Math.min(overflow, state.liquids[l].height);
          state.liquids[l].height -= spillage;
          overflow -= spillage;
          if (overflow <= 0) {
            break;
          }
        }
      }
    }
  }

  onLiquidDensityChange = (newValue, liquidID) => {
    var newState = { ...this.state };
    newState.liquids[liquidID].density = newValue;
    this.setState(newState);
  };

  onLiquidRemove = (liquidID) => {
    var newState = { ...this.state };

    newState.liquids[liquidID].shape.remove();
    newState.liquids[liquidID].topLineShape.remove();
    newState.liquids[liquidID] = null;
    newState.liquids.splice(liquidID, 1);

    this.setState(newState);
  };

  onLiquidAdd = () => {
    var newState = { ...this.state };
    newState.liquids.push(this.getNewLiquid());
    newState.container.shape.bringToFront();
    this.handleOverflow(newState, newState.liquids.length - 1);
    this.setState(newState);
  };

  toggleAbsolutePressureChange = (event) => {
    const absPressure = !this.state.absolutePressure;
    var newState = { ...this.state };
    newState.absolutePressure = absPressure;
    this.setState(newState);
  };

  toggleShowingPressureChange = (event) => {
    const showPressure = !this.state.showingPressure;
    var newState = { ...this.state };
    newState.showingPressure = showPressure;
    this.setState(newState);

    for (let l = 0; l < this.state.liquids.length; l++) {
      this.state.liquids[l].topLineShape.visible = showPressure;
    }
  };

  toggleShowingPressureForcesChange = (event) => {
    const showingPressureForces = !this.state.showingPressureForces;
    var newState = { ...this.state };
    newState.showingPressureForces = showingPressureForces;
    this.setState(newState);
  };

  updateContainerSize() {
    const container = this.state.container.shape;
    const points = this.getImportantPoints();

    container.segments[0].point = points.container.topLeft;
    container.segments[1].point = points.container.bottomLeft;
    container.segments[2].point = points.container.bottomRight;
    container.segments[3].point = points.container.topRight;

    this.updateLiquids();
  }

  updateLiquids() {
    const points = this.getImportantPoints();
    const pressureSteps = this.getPressureSteps();
    const atmPressureText = this.state.atmPressureText;

    if (points.liquids.length > 0) {
      atmPressureText.point = addPoints(
        points.liquids[0].topLeft,
        new Point(15, -6)
      );
    } else {
      atmPressureText.point = addPoints(
        points.container.bottomLeft,
        new Point(15, -6)
      );
    }

    for (let l = 0; l < this.state.liquids.length; l++) {
      const liquidShape = this.state.liquids[l].shape;
      const topLine = this.state.liquids[l].topLineShape;
      const text = this.state.liquids[l].pressureText;

      liquidShape.segments[0].point = points.liquids[l].topLeft;
      liquidShape.segments[1].point = points.liquids[l].bottomLeft;
      liquidShape.segments[2].point = points.liquids[l].bottomRight;
      liquidShape.segments[3].point = points.liquids[l].topRight;

      if (this.state.liquids[l].height > 0) {
        text.point = addPoints(points.liquids[l].bottomLeft, new Point(15, -6));
        const displayText =
          Math.round(pressureSteps[l + 1] * 100) / 100 + " atm";
        text.content = displayText;
        text.visible = true;
      } else {
        text.visible = false;
      }

      topLine.segments = [
        points.liquids[l].topLeft,
        points.liquids[l].topRight,
      ];

      this.state.liquids[l].levelSimbol.setPosition(
        addPoints(points.liquids[l].topRight, new Point(-25, 0))
      );
    }

    this.updatePressureDisplays(
      this.state.absolutePressure,
      this.state.showingPressure,
      this.state.showingPressureForces
    );

    atmPressureText.bringToFront();
  }

  updateLiquidPressure(
    absolutePressure,
    showingPressure,
    showingPressureForces
  ) {
    if (showingPressure) {
      const points = this.getImportantPoints();
      const pressureSteps = this.getPressureSteps();
      for (let l = 0; l < this.state.liquids.length; l++) {
        const liquid = this.state.liquids[l];
        const gradientPoints = this.getLiquidGradientPoints(
          points.liquids[l].topLeft,
          points.liquids[l].bottomLeft,
          pressureSteps[l],
          pressureSteps[l + 1]
        );
        this.state.liquids[l].shape.fillColor = {
          origin: gradientPoints.top,
          destination: gradientPoints.bottom,
          gradient: {
            stops: pressureGradient,
          },
        };
        this.state.liquids[l].topLineShape.visible = showingPressure;
      }
    } else {
      for (let l = 0; l < this.state.liquids.length; l++) {
        this.state.liquids[l].shape.fillColor = this.state.liquids[l].color;
        this.state.liquids[l].topLineShape.visible = showingPressure;
      }
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
      const points = this.getImportantPoints();
      const pressureSteps = this.getPressureSteps();
      const bottomPressure = pressureSteps[pressureSteps.length - 1];
      const atmosphericPressure = pressureSteps[0];

      // Liquids
      const stepMagnitudes = [];
      const leftPoints = [];
      const rightPoints = [];

      // Air
      if (points.liquids.length > 0) {
        if (points.liquids[0].topLeft.y > points.container.topLeft.y) {
          stepMagnitudes.push(pressureSteps[0] * atmToPixels);
          leftPoints.push(points.container.topLeft);
          rightPoints.push(points.container.topRight);
        }
        // Liquid steps
        const count = this.state.liquids.length;
        for (let l = 0; l < count; l++) {
          if (points.liquids[l].bottomLeft.y > points.liquids[l].topLeft.y) {
            stepMagnitudes.push(pressureSteps[l] * atmToPixels);
            leftPoints.push(points.liquids[l].topLeft);
            rightPoints.push(points.liquids[l].topRight);
          }
        }
        // Bottom step
        stepMagnitudes.push(pressureSteps[count] * atmToPixels);
        leftPoints.push(points.liquids[count - 1].bottomLeft);
        rightPoints.push(points.liquids[count - 1].bottomRight);

        this.state.arrows.left.SetValues(leftPoints, stepMagnitudes, 25, true);
        this.state.arrows.right.SetValues(rightPoints, stepMagnitudes, 25);
        this.state.arrows.bottom.SetValues(
          [points.container.bottomRight, points.container.bottomLeft],
          [bottomPressure * atmToPixels, bottomPressure * atmToPixels],
          25,
          null,
          true
        );
      } else {
        leftPoints.push(points.container.topLeft);
        leftPoints.push(points.container.bottomLeft);
        rightPoints.push(points.container.topRight);
        rightPoints.push(points.container.bottomRight);
        stepMagnitudes.push(pressureSteps[0] * atmToPixels);
        stepMagnitudes.push(pressureSteps[0] * atmToPixels);

        this.state.arrows.left.SetValues(leftPoints, stepMagnitudes, 25, true);
        this.state.arrows.right.SetValues(rightPoints, stepMagnitudes, 25);
        this.state.arrows.bottom.SetValues(
          [points.container.bottomRight, points.container.bottomLeft],
          [bottomPressure * atmToPixels, bottomPressure * atmToPixels],
          25,
          null,
          true
        );
      }
    } else {
      this.state.arrows.bottom.Reset();
      this.state.arrows.left.Reset();
      this.state.arrows.right.Reset();
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

    this.setState({
      container: {
        shape: container,
        width: 300,
        height: 400,
      },
      background: {
        shape: background,
      },
      atmPressureText: atmPressureText,
      arrows: {
        left: new VectorArray(),
        bottom: new VectorArray(),
        right: new VectorArray(),
      },
    });

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
        title="Estratificación"
        panel={
          <>
            <SliderWithInput
              label="Ancho del contenedor"
              step={1}
              min={100}
              max={600}
              value={this.state.container.width}
              onChange={this.onContainerWidthChange}
            ></SliderWithInput>
            <SliderWithInput
              label="Altura del contenedor"
              step={1}
              min={100}
              max={600}
              value={this.state.container.height}
              onChange={this.onContainerHeightChange}
            ></SliderWithInput>
            <MyToggle
              label="Mostar presion"
              checked={this.state.showingPressure}
              onChange={this.toggleShowingPressureChange}
            />
            <MyToggle
              label="Presión absoluta"
              checked={this.state.absolutePressure}
              onChange={this.toggleAbsolutePressureChange}
            />
            <MyToggle
              label="Mostar fuerzas de presion"
              checked={this.state.showingPressureForces}
              onChange={this.toggleShowingPressureForcesChange}
            />

            {this.state.liquids.map((liquid, index) => (
              <Stratum
                key={index}
                id={index}
                liquid={liquid}
                max={this.state.container.height}
                onHeightChange={this.onLiquidHeightChange}
                onDensityChange={this.onLiquidDensityChange}
                onRemoveButtonClicked={this.onLiquidRemove}
              ></Stratum>
            ))}
            {this.state.liquids.length > 1 && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<HorizontalSplit></HorizontalSplit>}
                  onClick={this.orderByDensity}
                >
                  Ordenar por densidad
                </Button>
                <br></br>
              </>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon></AddIcon>}
              onClick={this.onLiquidAdd}
            >
              Añadir líquido
            </Button>
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

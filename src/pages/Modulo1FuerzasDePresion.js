import MyToggle from "../components/MyToggle";
import React, { Component } from "react";
import Grid from "@mui/material/Grid";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import { MathComponent } from "mathjax-react";

import { view, Point, Size, Path, PointText, Rectangle } from "paper";
import SliderWithInput from "../components/SliderWithInput";

import {
  createBoxPath,
  getColorFromGradient,
  pressureGradient,
  VectorArray,
  addPoints,
  subPoints,
  LevelSimbol,
  ColorScaleReference,
  getInvertedPressureGradient,
  CoordinateReference,
} from "../paperUtility";

import MyRadio from "../components/MyRadio";
import ModuleAccordion from "../components/ModuleAccordion";
import PanelModule from "../components/PanelModule";
import { Typography } from "@mui/material";
import EquationReferences from "../components/EquationReferences";

let loading = false;

const metersToPixels = 50;
const paToPixels = 100 / 101325;
const maxPressure = 300000;
const liquidColors = "#1976D2";

let colorScaleReference = null;

class Modulo1FuerzasDePresion extends Component {
  state = {
    container: {
      shape: null,
      width: 5,
      height: 10.1,
      borderRadius: 0,
    },
    liquid: {
      height: 5,
      density: 1000,
    },
    background: {
      shape: null,
    },
    atmPressureText: null,
    bottomPressureText: null,
    arrows: null,
    atmosphericPressure: 101325,
    showingPressure: false,
    showingPressureForces: false,
    absolutePressure: false,
    density: 1000,
    gravity: 9.8,
  };

  componentDidUpdate() {
    this.updateShapes();
    this.updatePressureDisplays(
      this.state.absolutePressure,
      this.state.showingPressure,
      this.state.showingPressureForces
    );
    this.state.liquid.topLineShape.visible = this.state.showingPressure;
    colorScaleReference.setVisible(this.state.showingPressure);
  }

  getImportantPoints() {
    const center = addPoints(
      view.center,
      new Point(0, -view.bounds.height * 0.1)
    );
    const halfContainerWidth =
      (this.state.container.width / 2) * metersToPixels;
    const halfContainerHeight =
      (this.state.container.height / 2) * metersToPixels;
    const left = center.x - halfContainerWidth;
    const right = center.x + halfContainerWidth;

    let liquidPoints = {
      topLeft: new Point(
        left,
        center.y +
          halfContainerHeight -
          this.state.liquid.height * metersToPixels
      ),
      topRight: new Point(
        right,
        center.y +
          halfContainerHeight -
          this.state.liquid.height * metersToPixels
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
    let newDensity = 1000;
    let liquid = {
      shape: null,
      topLineShape: null,
      pressureText: null,
      levelSimbol: null,
      height: 2,
      density: newDensity,
      color: liquidColors,
    };
    liquid.shape = new Path({
      fillColor: liquidColors,
    });
    liquid.shape.add(new Point(0, 0));
    liquid.shape.add(new Point(0, 0));
    liquid.shape.add(new Point(0, 0));
    liquid.shape.add(new Point(0, 0));

    liquid.topLineShape = new Path({
      strokeColor: "white",
      strokeWidth: 3,
      dashArray: [12, 13],
    });
    liquid.topLineShape.visible = false;
    liquid.topLineShape.add(new Point(0, 0));
    liquid.topLineShape.add(new Point(0, 0));
    /*
    liquid.pressureText = new PointText({
      justification: "left",
      fillColor: "white",
      strokeColor: "black",
      strokeWidth: 2,
      fontSize: 15,
      content: "1.5 Pa",
      visible: true,
    });*/

    liquid.levelSimbol = new LevelSimbol(new Point(0, 0), "white");

    return liquid;
  }

  onContainerWidthChange(newValue) {
    let newState = { ...this.state };
    newState.container.width = newValue;
    this.setState(newState);
  }

  onContainerHeightChange(newValue) {
    let newState = { ...this.state };
    newState.container.height = newValue;
    this.handleOverflow(newState);
    this.setState(newState);
  }

  onLiquidHeightChange(newValue, liquidID) {
    let newState = { ...this.state };
    newState.liquid.height = newValue;

    this.handleOverflow(newState, liquidID);

    this.setState(newState);
  }

  onAtmosphericPressureChanged = (newValue) => {
    this.setState({ atmosphericPressure: newValue });
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

  onLiquidDensityChange(newValue) {
    let newState = { ...this.state };
    newState.liquid.density = newValue;
    this.setState(newState);
  }

  onBorderRadiusChange(newValue) {
    let newState = { ...this.state };
    newState.container.borderRadius = newValue;
    this.setState(newState);
  }

  onPressureTypeChange(event) {
    let newState = { ...this.state };
    newState.absolutePressure = event.target.value == "true";
    this.setState(newState);
  }

  toggleShowingPressureChange(event) {
    const showPressure = !this.state.showingPressure;
    this.setState({ showingPressure: showPressure });
  }

  toggleShowingPressureForcesChange(event) {
    const showingPressureForces = !this.state.showingPressureForces;
    this.setState({ showingPressureForces: showingPressureForces });
  }

  updateShapes() {
    const container = this.state.container.shape;
    let liquid = this.state.liquid.shape;
    const points = this.getImportantPoints();
    const radius =
      Math.max(
        0.01,
        Math.min(
          this.state.container.borderRadius,
          this.state.container.width / 2 - 0.011
        ) * metersToPixels
      ) + 0.01;

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
    this.state.bottomPressureText.point = addPoints(
      points.liquid.bottomLeft,
      new Point(15 + radius * 0.7, -6)
    );
    this.state.bottomPressureText.bringToFront();
    this.state.liquid.levelSimbol.setPosition(levelSimbolPosition);

    this.updatePressureDisplays(
      this.state.absolutePressure,
      this.state.showingPressure,
      this.state.showingPressureForces
    );
  }

  addRoundedCorners(path, topPlane) {
    const points = this.getImportantPoints();
    const radius =
      Math.max(
        0.01,
        Math.min(
          this.state.container.borderRadius,
          this.state.container.width / 2 - 0.011
        )
      ) *
        metersToPixels +
      0.01;
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
    const pressureSteps = this.getPressureSteps();
    if (showingPressure) {
      const points = this.getImportantPoints();
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

    if (this.state.liquid.height > 0.1) {
      this.state.bottomPressureText.content =
        Math.round(pressureSteps[1] * 100) / 100 + " Pa";
      this.state.bottomPressureText.bringToFront();
      this.state.bottomPressureText.visible = true;
    } else {
      this.state.bottomPressureText.visible = false;
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
    this.state.atmPressureText.content = absolutePressure
      ? this.state.atmosphericPressure + " Pa"
      : "0 Pa";
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
          this.getPressureAtPosition(segments[i].point) * paToPixels
        );
        arrowPoints.push(segments[i].point);
      }

      console.log({ stepMagnitudes });
      this.state.arrows.SetValues(arrowPoints, stepMagnitudes, 20, {
        inverted: true,
      });

      // Air
    } else {
      this.state.arrows.Reset();
    }
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(view.bounds.topLeft, view.bounds.bottomRight)
    );
    background.fillColor = "#ffffff";

    const container = new Path({
      fillColor: "transparent",
      strokeColor: "black",
      strokeWidth: 5,
    });

    const atmPressureText = new PointText({
      justification: "left",
      fillColor: "black",
      fontSize: 20,
      content: "0 Pa",
      visible: true,
    });
    const bottomPressureText = new PointText({
      justification: "left",
      fillColor: "white",
      fontSize: 20,
      content: "0 Pa",
      visible: true,
    });

    colorScaleReference = new ColorScaleReference(
      addPoints(view.bounds.topRight, new Point(-100, 100)),
      new Size(50, view.size.height - 200),
      getInvertedPressureGradient(),
      0,
      maxPressure,
      "white",
      " Pa"
    );
    colorScaleReference.setVisible(false);

    let newState = { ...this.state };
    newState.container = {
      shape: container,
      width: 5,
      height: 10.1,
      borderRadius: 0,
    };
    newState.liquid = this.getNewLiquid();
    newState.container.shape.bringToFront();
    newState.background.shape = background;
    newState.atmPressureText = atmPressureText;
    newState.bottomPressureText = bottomPressureText;
    newState.arrows = new VectorArray();
    this.setState(newState);
    createBoxPath(
      container,
      center,
      new Point(this.state.container.width / 2, this.state.container.height / 2)
    );

    /*view.onFrame = (event) => {

    };*/

    window.addEventListener(
      "resize",
      (event) => {
        this.updateShapes();
        this.updatePressureDisplays(
          this.state.absolutePressure,
          this.state.showingPressure,
          this.state.showingPressureForces
        );
      },
      true
    );

    new CoordinateReference(
      addPoints(view.bounds.bottomLeft, new Point(100, -100)),
      new Point(0, -1),
      "Z"
    );
    new CoordinateReference(
      addPoints(view.bounds.bottomLeft, new Point(100, -100)),
      new Point(1, 0),
      "X"
    );
  }

  getPressureSteps() {
    const steps = [];
    let currentPressure = this.state.absolutePressure
      ? this.state.atmosphericPressure
      : 0;
    steps.push(currentPressure);
    const liquid = this.state.liquid;
    currentPressure += liquid.density * liquid.height * this.state.gravity;
    steps.push(currentPressure);
    return steps;
  }

  getPressureAtPosition(position) {
    const points = this.getImportantPoints();
    const depth =
      Math.max(0, position.y - points.liquid.topRight.y) / metersToPixels;
    const atmPressure = this.state.absolutePressure
      ? this.state.atmosphericPressure
      : 0;
    return atmPressure + this.state.liquid.density * depth * this.state.gravity;
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
    console.log({ topPressure, bottomPressure });

    return { top: gradientStart, bottom: gradientEnd };
  }

  getParameterCode() {
    let module = "A";
    let codeVersion = "1";
    return [
      module,
      codeVersion,
      this.state.container.width,
      this.state.liquid.height,
      this.state.liquid.density,
      this.state.container.borderRadius,
      this.state.showingPressure ? 1 : 0,
      this.state.showingPressureForces ? 1 : 0,
      this.state.absolutePressure ? 1 : 0,
    ].join(";");
  }

  loadParameterCode(code) {
    if (loading) return false;
    loading = true;
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    if (codeVersion == 1) {
      if (split.length != 9) {
        throw "Formato inválido";
      }
      let container = { ...this.state.container };
      let liquid = { ...this.state.liquid };
      container.width = parseFloat(split[2]);
      liquid.height = parseFloat(split[3]);
      liquid.density = parseFloat(split[4]);
      container.borderRadius = parseFloat(split[5]);
      let showingPressure = split[6] == 1;
      let showingPressureForces = split[7] == 1;
      let absolutePressure = split[8] == 1;
      this.setState(
        {
          container,
          liquid,
          showingPressure,
          showingPressureForces,
          absolutePressure,
        },
        () => (loading = false)
      );
      return true;
    }
    throw "Formato inválido";
  }

  render() {
    return (
      <PanelAndCanvas
        title="Fuerzas de presión"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="Ancho del contenedor"
                  step={0.1}
                  min={2}
                  max={10}
                  unit="m"
                  value={this.state.container.width}
                  onChange={(e) => this.onContainerWidthChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Altura del líquido"
                  step={0.1}
                  min={0}
                  max={10}
                  value={this.state.liquid.height}
                  unit="m"
                  onChange={(e) => this.onLiquidHeightChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del líquido"
                  step={10}
                  min={0}
                  max={2000}
                  unit="kg/m³"
                  value={this.state.liquid.density}
                  onChange={(e) => this.onLiquidDensityChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Radio de las esquinas"
                  step={0.1}
                  min={0}
                  max={10}
                  unit="m"
                  value={this.state.container.borderRadius}
                  onChange={(e) => this.onBorderRadiusChange(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12} xl={6}>
                <MyToggle
                  label="Presión"
                  checked={this.state.showingPressure}
                  onChange={(e) => this.toggleShowingPressureChange(e)}
                />
              </Grid>
              <Grid item xs={12} xl={6}>
                <MyToggle
                  label="Fuerzas de presión"
                  checked={this.state.showingPressureForces}
                  onChange={(e) => this.toggleShowingPressureForcesChange(e)}
                />
              </Grid>
              <Grid item xs={12}>
                <MyRadio
                  options={[
                    { value: false, label: "Presion Manométrica" },
                    { value: true, label: "Presion Absoluta" },
                  ]}
                  value={this.state.absolutePressure}
                  onChange={(e) => this.onPressureTypeChange(e)}
                ></MyRadio>
              </Grid>
              <Grid item xs={12} sx={{ marginTop: "50px" }}>
                <ModuleAccordion title="Ecuación">
                  <PanelModule>
                    <ModuleAccordion
                      title={
                        <MathComponent
                          tex={String.raw`p =  \rho g  \triangle z`}
                        />
                      }
                      fontSize={20}
                      center
                      hasBorder
                    >
                      <EquationReferences
                        parameters={[
                          {
                            letter: "p:",
                            description: "diferencia de presion [Pa]",
                          },
                          {
                            letter: String.raw`\rho :`,
                            description: "densidad [kg/m³]",
                          },
                          {
                            letter: "g:",
                            description: "gravedad [m/s²]",
                          },
                          {
                            letter: String.raw`\triangle z :`,
                            description: "diferencia de altura [m]",
                          },
                        ]}
                      ></EquationReferences>
                    </ModuleAccordion>
                  </PanelModule>
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

export default Modulo1FuerzasDePresion;

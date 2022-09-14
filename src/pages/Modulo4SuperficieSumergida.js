import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import Paper from "paper";
import MyRadio from "../components/MyRadio";
import {
  addPoints,
  lerp,
  LevelSimbol,
  VectorArray,
  VectorArrow,
} from "../paperUtility";
import { Color, Point } from "paper/dist/paper-core";
import SliderWithInput from "../components/SliderWithInput";

let previousSkew = 0;
let cameraAngle = 0;
const metersToPixels = 400;
const atmToPixels = 20;
const maxPressure = 12;

class Modulo4SuperficieSumergida extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    surface: {
      angle: 45,
      depth: 300,
      width: 300,
      length: 300,
      girth: 20,
    },
    line: null,
    ready: false,
    frontView: false,
    forceVectorArray: null,
    gravity: 9.8,
    atmosphericPressure: 15,
    absolutePressure: false,
    equivalentForce: {
      circle: null,
    },
    liquid: {
      density: 10,
    },
  };

  updateSurface(liquidSurface) {
    let surface = liquidSurface;
    if (surface == null) {
      surface = this.state.liquid.surface;
    }

    const perspectiveFront = Math.sin(cameraAngle);
    const perspectiveSide = Math.cos(cameraAngle);

    const liquidHeight = this.getLiquidHeight();
    const angleInRadians = (surface.angle / 180) * Math.PI;
    const girthOffset = new Paper.Point(
      surface.girth * Math.cos(angleInRadians) * perspectiveSide,
      surface.girth * Math.sin(angleInRadians)
    );
    const lengthOffset = new Paper.Point(
      -surface.length * Math.sin(angleInRadians) * perspectiveSide,
      surface.length * Math.cos(angleInRadians)
    );
    const top = new Paper.Point(
      Paper.view.center.x +
        ((Math.sin(angleInRadians) * surface.length) / 2) * perspectiveSide +
        (surface.width * perspectiveFront) / 2,
      liquidHeight + surface.depth
    );
    const front = addPoints(top, lengthOffset);
    const back = addPoints(top, girthOffset);
    const bottom = addPoints(top, addPoints(girthOffset, lengthOffset));

    if (surface.sideShape != null) {
      surface.sideShape.segments[0].point.set(top);
      surface.sideShape.segments[1].point.set(back);
      surface.sideShape.segments[2].point.set(bottom);
      surface.sideShape.segments[3].point.set(front);
    }

    const widthOffset = new Paper.Point(-surface.width * perspectiveFront, 0);

    if (surface.frontShape != null) {
      surface.frontShape.segments[0].point.set(top);
      surface.frontShape.segments[1].point.set(front);
      surface.frontShape.segments[2].point.set(addPoints(front, widthOffset));
      surface.frontShape.segments[3].point.set(addPoints(top, widthOffset));
    }

    if (surface.bottomShape != null) {
      surface.bottomShape.segments[0].point.set(front);
      surface.bottomShape.segments[1].point.set(bottom);
      surface.bottomShape.segments[2].point.set(addPoints(bottom, widthOffset));
      surface.bottomShape.segments[3].point.set(addPoints(front, widthOffset));
    }

    if (surface.forceVectorArray != null) {
      let pressureMax = this.getPressureAtPosition(front);
      let pressureMin = this.getPressureAtPosition(top);
      let points = [addPoints(top, widthOffset), addPoints(front, widthOffset)];
      let magnitudes = [
        this.getPressureAtPosition(top) * perspectiveSide,
        this.getPressureAtPosition(front) * perspectiveSide,
      ];

      if (top.y < liquidHeight && front.y > liquidHeight) {
        const midPoint = new Paper.Point(
          top.x +
            (top.y - liquidHeight) * Math.tan(angleInRadians) * perspectiveSide,
          liquidHeight
        );
        pressureMin = this.getPressureAtPosition(midPoint);
        points.splice(1, 0, addPoints(midPoint, widthOffset));
        magnitudes.splice(1, 0, this.getPressureAtPosition(midPoint));
      }

      surface.forceVectorArray.SetValues(points, magnitudes, 20, {
        inverted: true,
        otherEnd: true,
      });

      // FuerzaEquivalente
      if (this.state.equivalentForce.arrow != null) {
        const pos = this.getForceScreenPosition();
        const magnitude = ((pressureMin + pressureMax) / 2) * 2;
        const force = new Paper.Point(
          -Math.cos(angleInRadians) * magnitude * perspectiveSide,
          -Math.sin(angleInRadians) * magnitude
        );
        this.state.equivalentForce.arrow.SetPosition(
          addPoints(force, pos),
          pos
        );
        this.state.equivalentForce.arrow.bringToFront();
      }
    }

    // Lio de transformaciones y trigonometria para ubicar las formas del centro de fuerza
    if (this.state.equivalentForce.circle != null) {
      const pos = this.getForceScreenPosition();
      const matrix = new Paper.Matrix(
        perspectiveFront,
        0,
        -Math.sin(angleInRadians) * perspectiveSide,
        Math.cos(angleInRadians),
        pos.x,
        pos.y
      );
      this.state.equivalentForce.circleBackground.bringToFront();
      this.state.equivalentForce.circleBackground.matrix = matrix;
      this.state.equivalentForce.circle.matrix = matrix;
      const xoffset =
        (this.state.equivalentForce.circleDecoration1.size.width / 2) *
        (perspectiveFront + perspectiveSide * Math.sin(angleInRadians));
      const yoffset =
        (-this.state.equivalentForce.circleDecoration1.size.height / 2) *
        Math.cos(angleInRadians);
      const matrix1 = new Paper.Matrix(
        perspectiveFront,
        0,
        -Math.sin(angleInRadians) * perspectiveSide,
        Math.cos(angleInRadians),
        pos.x + xoffset,
        pos.y + yoffset
      );
      this.state.equivalentForce.circleDecoration1.bringToFront();
      this.state.equivalentForce.circleDecoration1.matrix = matrix1;
      const matrix2 = new Paper.Matrix(
        perspectiveFront,
        0,
        -Math.sin(angleInRadians) * perspectiveSide,
        Math.cos(angleInRadians),
        pos.x - xoffset,
        pos.y - yoffset
      );
      this.state.equivalentForce.circleDecoration2.bringToFront();
      this.state.equivalentForce.circleDecoration2.matrix = matrix2;
    }
  }

  getLiquidHeight() {
    return Paper.view.size.height * 0.2;
  }

  onPressureTypeChange = (event) => {
    var newState = { ...this.state };
    newState.absolutePressure = event.target.value == "true";
    this.setState(newState);
  };

  onAngleChanged = (newValue) => {
    var newState = { ...this.state };
    newState.surface.angle = newValue;
    this.setState(newState);
  };

  onLiquidDensityChange = (newValue) => {
    var newState = { ...this.state };
    newState.liquid.density = newValue;
    this.setState(newState);
  };

  onDepthChanged = (newValue) => {
    var newState = { ...this.state };
    newState.surface.depth = newValue;
    this.setState(newState);
  };

  onFrontViewChange = (event) => {
    var newState = { ...this.state };
    newState.frontView = event.target.value == "true";
    this.setState(newState);
  };

  getPressureAtPosition(position) {
    const liquidHeight = this.getLiquidHeight();
    const depth = Math.max(0, position.y - liquidHeight);
    const atmPressure = this.state.absolutePressure
      ? this.state.atmosphericPressure
      : 0;
    return (
      atmPressure +
      (this.state.liquid.density * depth * this.state.gravity) / metersToPixels
    );
  }

  getForceScreenPosition() {
    const surface = this.state.surface;
    const angleInRadians = (surface.angle / 180) * Math.PI;
    const sinOfAngle = Math.sin(angleInRadians);
    const cosOfAngle = Math.cos(angleInRadians);

    const liquidHeight = this.getLiquidHeight();
    const topY = liquidHeight + surface.depth;
    const frontY = topY + surface.length * Math.cos(angleInRadians);
    let submergePercentage = 0;
    if (topY < liquidHeight && frontY > liquidHeight) {
      submergePercentage = (liquidHeight - topY) / (frontY - topY);
    }

    const L =
      surface.length * lerp(0.5 + cosOfAngle * 0.166, 1, submergePercentage); // el número importante <-----

    const perspectiveFront = Math.sin(cameraAngle);
    const perspectiveSide = Math.cos(cameraAngle);
    const top = new Paper.Point(
      Paper.view.center.x +
        (sinOfAngle * surface.length * perspectiveSide) / 2 +
        (surface.width * perspectiveFront) / 2,
      this.getLiquidHeight() + surface.depth
    );
    const lengthOffset = new Paper.Point(
      -L * Math.sin(angleInRadians) * perspectiveSide,
      L * Math.cos(angleInRadians)
    );
    const midPoint = addPoints(top, lengthOffset);
    return new Paper.Point(
      midPoint.x - (this.state.surface.width * perspectiveFront) / 2,
      midPoint.y
    );
  }

  canvasFunction() {
    const center = Paper.view.center;

    const background = new Paper.Path.Rectangle(
      new Paper.Rectangle(new Paper.Point(0, 0), Paper.view.size)
    );
    background.fillColor = "white";

    const liquid = {
      shape: new Paper.Path.Rectangle(
        new Paper.Rectangle(
          Paper.view.bounds.leftCenter,
          Paper.view.bounds.bottomRight
        )
      ),
    };
    const liquidOverlay = {
      shape: new Paper.Path.Rectangle(
        new Paper.Rectangle(
          Paper.view.bounds.leftCenter,
          Paper.view.bounds.bottomRight
        )
      ),
    };
    const liquidHeight = this.getLiquidHeight();
    liquid.shape.segments[1].point.y = liquidHeight;
    liquid.shape.segments[2].point.y = liquidHeight;
    liquid.shape.style = {
      fillColor: "#1976D2",
    };
    liquidOverlay.shape.segments = liquid.shape.segments;
    liquidOverlay.shape.style = {
      fillColor: "#1976D250",
    };

    const surface = {
      frontShape: new Paper.Path({
        fillColor: "#FB2F68",
        strokeColor: "black",
        strokeWidth: 2,
        closed: true,
        strokeJoin: "round",
      }),
      sideShape: new Paper.Path({
        fillColor: "#DB1F48",
        strokeColor: "black",
        strokeWidth: 2,
        closed: true,
        strokeJoin: "round",
      }),
      bottomShape: new Paper.Path({
        fillColor: "#BB0028",
        strokeColor: "black",
        strokeWidth: 2,
        closed: true,
        strokeJoin: "round",
      }),
      length: 400,
      depth: 300,
      width: 300,
      girth: 20,
      angle: 45,
    };
    surface.frontShape.add(new Paper.Point(0, 0));
    surface.frontShape.add(new Paper.Point(0, 0));
    surface.frontShape.add(new Paper.Point(0, 0));
    surface.frontShape.add(new Paper.Point(0, 0));
    surface.sideShape.add(new Paper.Point(0, 0));
    surface.sideShape.add(new Paper.Point(0, 0));
    surface.sideShape.add(new Paper.Point(0, 0));
    surface.sideShape.add(new Paper.Point(0, 0));
    surface.bottomShape.add(new Paper.Point(0, 0));
    surface.bottomShape.add(new Paper.Point(0, 0));
    surface.bottomShape.add(new Paper.Point(0, 0));
    surface.bottomShape.add(new Paper.Point(0, 0));
    this.updateSurface(surface);

    liquidOverlay.shape.bringToFront();

    const forceVectorArray = new VectorArray();
    surface.forceVectorArray = forceVectorArray;

    const equivalentForceCircleClip = new Paper.Shape.Circle(
      new Paper.Point(0, 0),
      50
    );
    const circleBackground = new Paper.Shape.Circle(new Paper.Point(0, 0), 50);
    circleBackground.fillColor = "white";
    circleBackground.strokeColor = "black";
    circleBackground.strokeWidth = 4;
    circleBackground.bringToFront();
    const circleDecoration1 = new Paper.Shape.Rectangle(
      new Paper.Point(0, 0),
      new Paper.Size(50, 50)
    );
    circleDecoration1.fillColor = "black";
    circleDecoration1.strokeColor = "black";
    circleDecoration1.strokeWidth = 0;
    const circleDecoration2 = new Paper.Shape.Rectangle(
      new Paper.Point(0, 0),
      new Paper.Size(50, 50)
    );
    circleDecoration2.fillColor = "black";
    circleDecoration2.strokeColor = "black";
    circleDecoration2.strokeWidth = 0;
    const circleGroup = new Paper.Group([
      equivalentForceCircleClip,
      circleBackground,
      circleDecoration1,
      circleDecoration2,
    ]);
    circleGroup.clipped = true;

    const equivalentForceArrow = new VectorArrow(
      new Paper.Point(0, 0),
      new Paper.Point(0, 0),
      "#ff8040",
      8,
      20,
      40,
      false,
      false
    );

    const levelSimbol = new LevelSimbol(
      new Point(Paper.view.bounds.right - 100, this.getLiquidHeight()),
      "white"
    );

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.surface = surface;
    newState.equivalentForce.arrow = equivalentForceArrow;
    newState.equivalentForce.circle = equivalentForceCircleClip;
    newState.equivalentForce.circleBackground = circleBackground;
    newState.equivalentForce.circleDecoration1 = circleDecoration1;
    newState.equivalentForce.circleDecoration2 = circleDecoration2;
    newState.ready = true;
    this.setState(newState);

    Paper.view.onFrame = (event) => {
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

  update(delta) {
    if (this.state.surface != null) {
      cameraAngle = lerp(
        cameraAngle,
        this.state.frontView ? Math.PI / 2 : 0,
        Math.min(delta * 3, 0.5)
      );
      this.updateSurface(this.state.surface);
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Superficie Sumergida"
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="Angulo"
                  step={1}
                  min={0}
                  max={90}
                  unit="º"
                  value={this.state.surface.angle}
                  onChange={this.onAngleChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Profundidad"
                  step={1}
                  min={-150}
                  max={350}
                  unit="cm"
                  value={this.state.surface.depth}
                  onChange={this.onDepthChanged}
                ></SliderWithInput>
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
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del líquido"
                  step={0.1}
                  min={0}
                  max={20}
                  unit="kg/m³"
                  value={this.state.liquid.density}
                  onChange={this.onLiquidDensityChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <MyRadio
                  options={[
                    { value: false, label: "Vista frontal" },
                    { value: true, label: "Vista lateral" },
                  ]}
                  value={this.state.frontView}
                  onChange={this.onFrontViewChange}
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

export default Modulo4SuperficieSumergida;

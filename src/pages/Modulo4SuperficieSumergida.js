import React, { Component } from "react";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import {
  view,
  Point,
  Size,
  Path,
  Shape,
  Matrix,
  Rectangle,
  Group,
  project,
} from "paper";
import MyRadio from "../components/MyRadio";
import {
  addPoints,
  CoordinateReference,
  lerp,
  LevelSimbol,
  VectorArray,
  VectorArrow,
} from "../paperUtility";
import SliderWithInput from "../components/SliderWithInput";

let loading = false;

let previousSkew = 0;
let cameraAngle = 0;
const metersToPixels = 100;
const paToPixels = 200 / 101300;
const maxPressure = 12;

class Modulo4SuperficieSumergida extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    surface: {
      angle: 45,
      depth: -0.5,
      width: 5,
      length: 5,
      girth: 0.5,
    },
    line: null,
    ready: false,
    frontView: false,
    forceVectorArray: null,
    gravity: 9.8,
    atmosphericPressure: 101325,
    absolutePressure: false,
    equivalentForce: {
      circle: null,
    },
    center: {
      circle: null,
    },
    liquid: {
      density: 1000,
    },
  };

  updateSurface(surf) {
    let surface = surf;
    if (surface == null) {
      surface = this.state.surface;
    }
    var width = surface.width * metersToPixels;
    var girth = surface.girth * metersToPixels;
    var length = surface.length * metersToPixels;
    var depth = surface.depth * metersToPixels;
    const perspectiveFront = Math.sin(cameraAngle);
    const perspectiveSide = Math.cos(cameraAngle);

    const liquidHeight = this.getLiquidHeight();
    const angleInRadians = (surface.angle / 180) * Math.PI;
    const girthOffset = new Point(
      girth * Math.cos(angleInRadians) * perspectiveSide,
      girth * Math.sin(angleInRadians)
    );
    const lengthOffset = new Point(
      -length * Math.sin(angleInRadians) * perspectiveSide,
      length * Math.cos(angleInRadians)
    );
    const top = new Point(
      view.center.x +
        ((Math.sin(angleInRadians) * length) / 2) * perspectiveSide +
        (width * perspectiveFront) / 2,
      liquidHeight + depth
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

    const widthOffset = new Point(-width * perspectiveFront, 0);

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
        this.getPressureAtPosition(top) * perspectiveSide * paToPixels,
        this.getPressureAtPosition(front) * perspectiveSide * paToPixels,
      ];

      if (top.y < liquidHeight && front.y > liquidHeight) {
        const midPoint = new Point(
          top.x +
            (top.y - liquidHeight) * Math.tan(angleInRadians) * perspectiveSide,
          liquidHeight
        );
        pressureMin = this.getPressureAtPosition(midPoint);
        points.splice(1, 0, addPoints(midPoint, widthOffset));
        magnitudes.splice(
          1,
          0,
          this.getPressureAtPosition(midPoint) * perspectiveSide * paToPixels
        );
      }

      surface.forceVectorArray.SetValues(points, magnitudes, 20, {
        inverted: true,
        otherEnd: true,
      });
      // FuerzaEquivalente
      if (this.state.equivalentForce.arrow != null) {
        const pos = this.getForceScreenPosition();
        const magnitude =
          (((pressureMin + (pressureMax - pressureMin) / 2) * length) / 200) *
          paToPixels;
        const force = new Point(
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
      const pos = this.getCenterScreenPosition();
      const matrix = new Matrix(
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
      const matrix1 = new Matrix(
        perspectiveFront,
        0,
        -Math.sin(angleInRadians) * perspectiveSide,
        Math.cos(angleInRadians),
        pos.x + xoffset,
        pos.y + yoffset
      );
      this.state.equivalentForce.circleDecoration1.bringToFront();
      this.state.equivalentForce.circleDecoration1.matrix = matrix1;
      const matrix2 = new Matrix(
        perspectiveFront,
        0,
        -Math.sin(angleInRadians) * perspectiveSide,
        Math.cos(angleInRadians),
        pos.x - xoffset,
        pos.y - yoffset
      );
      this.state.equivalentForce.circleDecoration2.bringToFront();
      this.state.equivalentForce.circleDecoration2.matrix = matrix2;

      const centerPos = this.getForceScreenPosition();
      const centerMatrix = new Matrix(
        perspectiveFront,
        0,
        -Math.sin(angleInRadians) * perspectiveSide,
        Math.cos(angleInRadians),
        centerPos.x,
        centerPos.y
      );
      this.state.center.innerShape.matrix = centerMatrix;
      this.state.center.outerShape.matrix = centerMatrix;
    }
  }

  getLiquidHeight() {
    return view.size.height * 0.4;
  }

  onPressureTypeChange = (event) => {
    this.setState({ absolutePressure: event.target.value == "true" });
  };

  onAngleChanged = (newValue) => {
    var newState = { ...this.state };
    newState.surface.angle = 90 - newValue;
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

  onLengthChanged = (newValue) => {
    var newState = { ...this.state };
    newState.surface.length = newValue;
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

  getCenterScreenPosition() {
    const surface = this.state.surface;
    const angleInRadians = (surface.angle / 180) * Math.PI;
    const sinOfAngle = Math.sin(angleInRadians);
    const cosOfAngle = Math.cos(angleInRadians);
    const perspectiveFront = Math.sin(cameraAngle);
    const perspectiveSide = Math.cos(cameraAngle);
    var depth = surface.depth * metersToPixels;
    var width = surface.width * metersToPixels;
    var length = surface.length * metersToPixels;
    const top = new Point(
      view.center.x +
        (sinOfAngle * length * perspectiveSide) / 2 +
        (width * perspectiveFront) / 2,
      this.getLiquidHeight() + depth
    );

    const lengthOffset = new Point(
      -0.5 * sinOfAngle * perspectiveSide * length,
      0.5 * cosOfAngle * length
    );
    const midPoint = addPoints(top, lengthOffset);
    return new Point(midPoint.x - (width * perspectiveFront) / 2, midPoint.y);
  }

  getForceScreenPosition() {
    const surface = this.state.surface;
    const angleInRadians = (surface.angle / 180) * Math.PI;
    const sinOfAngle = Math.sin(angleInRadians);
    const cosOfAngle = Math.cos(angleInRadians);

    var depth = surface.depth * metersToPixels;
    var length = surface.length * metersToPixels;
    var width = surface.width * metersToPixels;

    const liquidHeight = this.getLiquidHeight();
    const topY = liquidHeight + depth;
    const frontY = topY + length * Math.cos(angleInRadians);
    let submergePercentage = 1;
    if (topY < liquidHeight && frontY > liquidHeight) {
      submergePercentage = 1 - (liquidHeight - topY) / (frontY - topY);
    }
    if (frontY < liquidHeight) {
      submergePercentage = 0;
    }

    // Ixx = ancho*largo^3/12
    // hcg = profundidad del centro geométrico
    // A = area sumergida
    // ycp = posición 'y' del centro de presión, desde el centro geométrico (cg)
    // - ycp = Ixx*sin(ang)/(hcg*A)

    let submergedLength = length * submergePercentage;
    let Ixx = (width * submergedLength ** 3) / 12;
    let hcg = (Math.max(topY, this.getLiquidHeight()) + frontY) / 2;
    let A = width * submergedLength;
    let pcg = this.getPressureAtPosition(new Point(0, hcg));
    let ycp =
      (this.state.liquid.density * this.state.gravity * Ixx * cosOfAngle) /
      (pcg * A);

    // ycp = ro * g * Ixx * cosAng / (pcg * A)
    const L = length - submergedLength * 0.5 + ycp / metersToPixels;

    const perspectiveFront = Math.sin(cameraAngle);
    const perspectiveSide = Math.cos(cameraAngle);
    const top = new Point(
      view.center.x +
        (sinOfAngle * length * perspectiveSide) / 2 +
        (width * perspectiveFront) / 2,
      this.getLiquidHeight() + depth
    );
    const lengthOffset = new Point(
      -L * Math.sin(angleInRadians) * perspectiveSide,
      L * Math.cos(angleInRadians)
    );
    const midPoint = addPoints(top, lengthOffset);
    return new Point(midPoint.x - (width * perspectiveFront) / 2, midPoint.y);
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const liquid = {
      shape: new Path.Rectangle(
        new Rectangle(view.bounds.leftCenter, view.bounds.bottomRight)
      ),
    };
    const liquidOverlay = {
      shape: new Path.Rectangle(
        new Rectangle(view.bounds.leftCenter, view.bounds.bottomRight)
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
      frontShape: new Path({
        fillColor: "#FB2F68",
        strokeColor: "black",
        strokeWidth: 2,
        closed: true,
        strokeJoin: "round",
      }),
      sideShape: new Path({
        fillColor: "#DB1F48",
        strokeColor: "black",
        strokeWidth: 2,
        closed: true,
        strokeJoin: "round",
      }),
      bottomShape: new Path({
        fillColor: "#BB0028",
        strokeColor: "black",
        strokeWidth: 2,
        closed: true,
        strokeJoin: "round",
      }),
      length: 5,
      depth: -0.5,
      width: 3,
      girth: 0.25,
      angle: 45,
    };
    surface.frontShape.add(new Point(0, 0));
    surface.frontShape.add(new Point(0, 0));
    surface.frontShape.add(new Point(0, 0));
    surface.frontShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    surface.bottomShape.add(new Point(0, 0));
    surface.bottomShape.add(new Point(0, 0));
    surface.bottomShape.add(new Point(0, 0));
    surface.bottomShape.add(new Point(0, 0));
    this.updateSurface(surface);

    liquidOverlay.shape.bringToFront();

    const forceVectorArray = new VectorArray();
    surface.forceVectorArray = forceVectorArray;

    const equivalentForceCircleClip = new Shape.Circle(new Point(0, 0), 35);
    const circleBackground = new Shape.Circle(new Point(0, 0), 35);
    circleBackground.fillColor = "white";
    circleBackground.strokeColor = "black";
    circleBackground.strokeWidth = 4;
    circleBackground.bringToFront();
    const circleDecoration1 = new Shape.Rectangle(
      new Point(0, 0),
      new Size(50, 50)
    );
    circleDecoration1.fillColor = "black";
    circleDecoration1.strokeColor = "black";
    circleDecoration1.strokeWidth = 0;
    const circleDecoration2 = new Shape.Rectangle(
      new Point(0, 0),
      new Size(50, 50)
    );
    circleDecoration2.fillColor = "black";
    circleDecoration2.strokeColor = "black";
    circleDecoration2.strokeWidth = 0;
    const circleGroup = new Group([
      equivalentForceCircleClip,
      circleBackground,
      circleDecoration1,
      circleDecoration2,
    ]);
    circleGroup.clipped = true;

    const centerCircleOuter = new Shape.Circle(new Point(0, 0), 20);
    centerCircleOuter.fillColor = "white";
    centerCircleOuter.strokeColor = "black";
    centerCircleOuter.strokeWidth = 2;

    const centerCircleInner = new Shape.Circle(new Point(0, 0), 10);
    centerCircleInner.fillColor = "black";

    const equivalentForceArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "#ff8040",
      8,
      20,
      40,
      false,
      false
    );

    const levelSimbol = new LevelSimbol(
      new Point(view.bounds.right - 100, this.getLiquidHeight()),
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
    newState.center.outerShape = centerCircleOuter;
    newState.center.innerShape = centerCircleInner;
    newState.ready = true;
    this.setState(newState);

    view.onFrame = (event) => {
      this.update(event.delta);
    };

    window.addEventListener(
      "resize",
      (event) => {
        // Update
      },
      true
    );

    new CoordinateReference(
      addPoints(view.bounds.bottomLeft, new Point(100, -100)),
      new Point(0, -1),
      "Z",
      "black"
    );
    new CoordinateReference(
      addPoints(view.bounds.bottomLeft, new Point(100, -100)),
      new Point(1, 0),
      "X",
      "black"
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

  getParameterCode() {
    let module = "D";
    let codeVersion = "1";
    return [
      module,
      codeVersion,
      this.state.surface.angle,
      this.state.surface.depth,
      this.state.surface.length,
      this.state.absolutePressure ? 1 : 0,
      this.state.liquid.density,
      this.state.frontView ? 1 : 0,
    ].join(";");
  }

  loadParameterCode(code) {
    if (loading) return false;
    loading = true;
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    if (codeVersion == 1) {
      if (split.length != 8) {
        throw "Formato inválido";
      }
      let surface = { ...this.state.surface };
      surface.angle = parseFloat(split[2]);
      surface.depth = parseFloat(split[3]);
      surface.length = parseFloat(split[4]);
      let absolutePressure = split[5] == 1;
      let liquid = { ...this.state.liquid };
      liquid.density = parseFloat(split[6]);
      let frontView = split[7] == 1;
      this.setState(
        { surface, absolutePressure, liquid, frontView },
        () => (loading = false)
      );
      return true;
    }
    throw "Formato inválido";
  }

  render() {
    return (
      <PanelAndCanvas
        title="Superficie Sumergida"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
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
                  value={90 - this.state.surface.angle}
                  onChange={this.onAngleChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Profundidad"
                  step={0.1}
                  min={-5}
                  max={5}
                  unit="m"
                  value={this.state.surface.depth}
                  onChange={this.onDepthChanged}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Largo"
                  step={0.1}
                  min={0.5}
                  max={5}
                  unit="m"
                  value={this.state.surface.length}
                  onChange={this.onLengthChanged}
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
                  step={10}
                  min={0}
                  max={2000}
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

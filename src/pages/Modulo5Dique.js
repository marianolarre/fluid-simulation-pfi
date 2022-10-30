import React, { Component } from "react";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import { view, Point, Path, Shape, Rectangle, project } from "paper";
import MyRadio from "../components/MyRadio";
import {
  addPoints,
  CoordinateReference,
  lerp,
  LevelSimbol,
  mulPoint,
  subPoints,
  VectorArray,
  VectorArrow,
} from "../paperUtility";
import SliderWithInput from "../components/SliderWithInput";

let loading = false;

const metersToPixels = 100;
const paToPixels = 200 / 101325;
const maxPressure = 12;

class Modulo5Dique extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    surface: {
      angle: 45,
      depth: 2,
      width: 5,
      length: 5,
      girth: 0.5,
    },
    line: null,
    ready: false,
    forceVectorArray: null,
    counterForceVectorArray: null,
    gravity: 9.8,
    atmosphericPressure: 101325,
    absolutePressure: false,
    equivalentForce: {},
    liquid: {
      density: 1000,
      shape: null,
    },
    xArrow: null,
    yArrow: null,
    wallArrow: null,
  };

  updateSurface(liquidSurface) {
    let surface = liquidSurface;
    if (surface == null) {
      surface = this.state.surface;
    }
    var width = surface.width * metersToPixels;
    var girth = surface.girth * metersToPixels;
    var length = surface.length * metersToPixels;
    var depth = surface.depth * metersToPixels;

    const liquidHeight = this.getLiquidHeight();
    const angleInRadians = (surface.angle / 180) * Math.PI;
    const girthOffset = new Point(
      girth * Math.cos(angleInRadians),
      girth * Math.sin(angleInRadians)
    );
    const lengthOffset = new Point(
      -length * Math.sin(angleInRadians),
      length * Math.cos(angleInRadians)
    );
    const top = new Point(
      view.center.x + (Math.sin(angleInRadians) * length) / 2,
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

    if (surface.forceVectorArray != null) {
      let pressureMax = this.getPressureAtPosition(front) * paToPixels;
      let pressureMin = this.getPressureAtPosition(top) * paToPixels;
      let points = [top, front];
      let magnitudes = [
        this.getPressureAtPosition(top) * paToPixels,
        this.getPressureAtPosition(front) * paToPixels,
      ];

      let midPoint;
      let partiallyOutOfWater = false;
      if (top.y < liquidHeight && front.y > liquidHeight) {
        partiallyOutOfWater = true;
        midPoint = new Point(
          top.x + (top.y - liquidHeight) * Math.tan(angleInRadians),
          liquidHeight
        );
        pressureMin = this.getPressureAtPosition(midPoint) * paToPixels;
        points.splice(1, 0, midPoint);
        magnitudes.splice(
          1,
          0,
          this.getPressureAtPosition(midPoint) * paToPixels
        );
      }

      surface.forceVectorArray.SetValues(points, magnitudes, 20, {
        inverted: true,
        otherEnd: true,
      });

      let counterPoints = [bottom, back];
      var atmPressure = this.state.absolutePressure
        ? this.state.atmosphericPressure
        : 0;
      let counterMagnitudes = [
        atmPressure * paToPixels,
        atmPressure * paToPixels,
      ];
      surface.counterForceVectorArray.SetValues(
        counterPoints,
        counterMagnitudes,
        20,
        { inverted: true, otherEnd: true }
      );

      // Concreto
      const pivotPosition = mulPoint(addPoints(front, bottom), 0.5);
      if (this.state.pivot != null) {
        this.state.pivot.position = pivotPosition;
      }
      if (this.state.floor != null) {
        this.state.floor.bounds.topRight = pivotPosition;
      }
      if (this.state.wall != null) {
        this.state.wall.bounds.bottomLeft = addPoints(back, new Point(0, 100));
      }

      // FuerzaEquivalente
      const pos = this.getForceScreenPosition();
      const magnitude = ((pressureMin + pressureMax) / 2) * 2;
      const force = new Point(
        -Math.cos(angleInRadians) * magnitude,
        -Math.sin(angleInRadians) * magnitude
      );
      this.state.equivalentForce.arrow.SetPosition(addPoints(force, pos), pos);
      this.state.equivalentForce.arrow.bringToFront();

      // Fuerza sobre la pared
      var distanceToPivot = subPoints(pos, front).length;
      var equivalentForceTorque = magnitude * distanceToPivot;
      var verticalDistanceToWall = front.y - back.y;
      var requiredWallForce = equivalentForceTorque / verticalDistanceToWall;
      this.state.wallArrow.SetPosition(
        addPoints(back, new Point(requiredWallForce, 0)),
        back
      );

      // Fuerzas sobre el pivote
      this.state.yArrow.SetPosition(
        addPoints(pivotPosition, new Point(0, -force.y)),
        pivotPosition
      );
      this.state.yArrow.bringToFront();

      this.state.xArrow.SetPosition(
        addPoints(pivotPosition, new Point(-force.x - requiredWallForce, 0)),
        pivotPosition
      );
      this.state.xArrow.bringToFront();

      if (this.state.liquid.shape != null) {
        if (front.y < liquidHeight) {
          this.state.liquid.shape.segments[1].point.x = front.x;
          this.state.liquid.shape.segments[2].point.x = front.x;
          this.state.liquid.shape.segments[3].point = pivotPosition;
          this.state.liquid.shape.segments[4].point = view.bounds.bottomLeft;
        } else {
          if (partiallyOutOfWater) {
            this.state.liquid.shape.segments[1].point.x = midPoint.x;
            this.state.liquid.shape.segments[2].point = midPoint;
            this.state.liquid.shape.segments[3].point = pivotPosition;
            this.state.liquid.shape.segments[4].point = view.bounds.bottomLeft;
          } else {
            this.state.liquid.shape.segments[1].point.x = back.x;
            this.state.liquid.shape.segments[2].point = back;
            this.state.liquid.shape.segments[3].point = pivotPosition;
            this.state.liquid.shape.segments[4].point = view.bounds.bottomLeft;
          }
        }
      }
    }
  }

  getLiquidHeight() {
    return view.size.height * 0.3;
  }

  onPressureTypeChange = (event) => {
    this.setState({ absolutePressure: event.target.value == "true" }, () =>
      this.updateSurface()
    );
  };

  onAngleChanged = (newValue) => {
    var newState = { ...this.state };
    newState.surface.angle = 90 - newValue;
    this.setState(newState);
    this.updateSurface(newState.surface);
  };

  onLiquidDensityChange = (newValue) => {
    var newState = { ...this.state };
    newState.liquid.density = newValue;
    this.setState(newState);
    this.updateSurface(newState.surface);
  };

  onDepthChanged = (newValue) => {
    var newState = { ...this.state };
    newState.surface.depth = newValue;
    this.setState(newState);
    this.updateSurface(newState.surface);
  };

  onLengthChanged = (newValue) => {
    var newState = { ...this.state };
    newState.surface.length = newValue;
    this.setState(newState);
    this.updateSurface(newState.surface);
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

    const top = new Point(
      view.center.x + (sinOfAngle * length) / 2,
      this.getLiquidHeight() + depth
    );
    const lengthOffset = new Point(
      -L * Math.sin(angleInRadians),
      L * Math.cos(angleInRadians)
    );
    return addPoints(top, lengthOffset);
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const liquid = {
      shape: new Path(),
      density: 1000,
    };
    liquid.shape.add(view.bounds.leftCenter);
    liquid.shape.add(view.bounds.rightCenter);
    liquid.shape.add(view.bounds.bottomRight);
    liquid.shape.add(view.bounds.bottomLeft);
    liquid.shape.add(view.bounds.bottomLeft);
    const liquidHeight = this.getLiquidHeight();
    liquid.shape.segments[0].point.y = liquidHeight;
    liquid.shape.segments[1].point.y = liquidHeight;
    liquid.shape.style = {
      fillColor: "#1976D2",
    };
    const surface = {
      sideShape: new Path({
        fillColor: "#DB1F48",
        strokeColor: "black",
        strokeWidth: 2,
        closed: true,
        strokeJoin: "round",
      }),
      length: 5,
      depth: 1,
      width: 3,
      girth: 0.25,
      angle: 45,
    };
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    this.updateSurface(surface);

    const forceVectorArray = new VectorArray();
    surface.forceVectorArray = forceVectorArray;

    const counterForceVectorArray = new VectorArray();
    surface.counterForceVectorArray = counterForceVectorArray;

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
      new Point(view.bounds.left + 100, this.getLiquidHeight()),
      "white"
    );

    const floor = new Shape.Rectangle(
      new Rectangle(new Point(0, 0), new Point(1000, 1000))
    );
    floor.style = {
      fillColor: "grey",
      strokeColor: "black",
      strokeWidth: 2,
    };
    const wall = new Shape.Rectangle(
      new Rectangle(new Point(0, 0), new Point(1000, 1000))
    );
    wall.style = {
      fillColor: "grey",
      strokeColor: "black",
      strokeWidth: 2,
    };
    const pivot = new Shape.Circle(new Point(0, 0), 20);
    pivot.style = {
      fillColor: "grey",
      strokeColor: "black",
      strokeWidth: 2,
    };

    const xArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "purple",
      10,
      20,
      30
    );
    xArrow.bringToFront();
    const yArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "purple",
      10,
      20,
      30
    );
    yArrow.bringToFront();
    const wallArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "purple",
      10,
      20,
      30
    );

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.liquid = liquid;
    newState.surface = surface;
    newState.equivalentForce.arrow = equivalentForceArrow;
    newState.ready = true;
    newState.floor = floor;
    newState.wall = wall;
    newState.pivot = pivot;
    newState.xArrow = xArrow;
    newState.yArrow = yArrow;
    newState.wallArrow = wallArrow;
    newState.absolutePressure = false;
    this.setState(newState, () => this.updateSurface());

    /* view.onFrame = (event) => {
      this.update(event.delta);
    };*/

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

  /*update(delta) {
    if (this.state.surface != null) {
      this.updateSurface(this.state.surface);
    }
  }*/

  getParameterCode() {
    let module = "E";
    let codeVersion = "1";
    return [
      module,
      codeVersion,
      this.state.surface.angle,
      this.state.surface.depth,
      this.state.surface.length,
      this.state.absolutePressure ? 1 : 0,
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
      if (split.length != 7) {
        throw "Formato inválido";
      }
      let surface = { ...this.state.surface };
      surface.angle = parseFloat(split[2]);
      surface.depth = parseFloat(split[3]);
      surface.length = parseFloat(split[4]);
      let absolutePressure = split[5] == 1;
      let liquid = { ...this.state.liquid };
      liquid.density = parseFloat(split[6]);
      this.setState({ surface, absolutePressure, liquid }, () => {
        loading = false;
        this.updateSurface();
      });
      return true;
    }
    throw "Formato inválido";
  }

  render() {
    return (
      <PanelAndCanvas
        title="Dique"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="Angulo"
                  step={1}
                  min={10}
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
                  min={-3}
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
                  min={1}
                  max={8}
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

export default Modulo5Dique;

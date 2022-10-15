import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import { view, Point, Size, Path, Shape, Rectangle } from "paper";
import MyRadio from "../components/MyRadio";
import {
  addPoints,
  lerp,
  LevelSimbol,
  mulPoint,
  VectorArray,
  VectorArrow,
} from "../paperUtility";
import SliderWithInput from "../components/SliderWithInput";

const metersToPixels = 400;
const atmToPixels = 20;
const maxPressure = 12;

class Modulo5Dique extends Component {
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
    forceVectorArray: null,
    gravity: 9.8,
    atmosphericPressure: 15,
    absolutePressure: false,
    equivalentForce: {},
    liquid: {
      density: 10,
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

    const liquidHeight = this.getLiquidHeight();
    const angleInRadians = (surface.angle / 180) * Math.PI;
    const girthOffset = new Point(
      surface.girth * Math.cos(angleInRadians),
      surface.girth * Math.sin(angleInRadians)
    );
    const lengthOffset = new Point(
      -surface.length * Math.sin(angleInRadians),
      surface.length * Math.cos(angleInRadians)
    );
    const top = new Point(
      view.center.x + (Math.sin(angleInRadians) * surface.length) / 2,
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

    if (surface.forceVectorArray != null) {
      let pressureMax = this.getPressureAtPosition(front);
      let pressureMin = this.getPressureAtPosition(top);
      let points = [top, front];
      let magnitudes = [
        this.getPressureAtPosition(top),
        this.getPressureAtPosition(front),
      ];

      let midPoint;
      let partiallyOutOfWater = false;
      if (top.y <= liquidHeight && front.y > liquidHeight) {
        partiallyOutOfWater = true;
        midPoint = new Point(
          top.x + (top.y - liquidHeight) * Math.tan(angleInRadians),
          liquidHeight
        );
        pressureMin = this.getPressureAtPosition(midPoint);
        points.splice(1, 0, midPoint);
        magnitudes.splice(1, 0, this.getPressureAtPosition(midPoint));
      }

      surface.forceVectorArray.SetValues(points, magnitudes, 20, {
        inverted: true,
        otherEnd: true,
      });

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
      if (this.state.equivalentForce.arrow != null) {
        const pos = this.getForceScreenPosition();
        const magnitude = ((pressureMin + pressureMax) / 2) * 2;
        const force = new Point(
          -Math.cos(angleInRadians) * magnitude,
          -Math.sin(angleInRadians) * magnitude
        );
        this.state.equivalentForce.arrow.SetPosition(
          addPoints(force, pos),
          pos
        );
        this.state.equivalentForce.arrow.bringToFront();

        // Fuerzas sobre el pivote
        if (this.state.yArrow != null) {
          this.state.yArrow.SetPosition(
            addPoints(pivotPosition, new Point(0, -force.y)),
            pivotPosition
          );
        }
        if (this.state.xArrow != null) {
          this.state.xArrow.SetPosition(
            addPoints(pivotPosition, new Point(force.x / 2, 0)),
            pivotPosition
          );
        }
        // Fuerza sobre la pared
        if (this.state.wallArrow != null) {
          this.state.wallArrow.SetPosition(
            addPoints(back, new Point(-force.x, 0)),
            back
          );
        }
      }

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
    return view.size.height * 0.2;
  }

  onPressureTypeChange = (event) => {
    var newState = { ...this.state };
    newState.absolutePressure = event.target.value == "true";
    this.setState(newState);
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

    const top = new Point(
      view.center.x + (sinOfAngle * surface.length) / 2,
      this.getLiquidHeight() + surface.depth
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
      density: 10,
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
      length: 400,
      depth: 300,
      width: 300,
      girth: 20,
      angle: 45,
    };
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    surface.sideShape.add(new Point(0, 0));
    this.updateSurface(surface);

    const forceVectorArray = new VectorArray();
    surface.forceVectorArray = forceVectorArray;

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
      "blue",
      10,
      20,
      30
    );
    const yArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "blue",
      10,
      20,
      30
    );
    const wallArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "blue",
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
  }

  update(delta) {
    if (this.state.surface != null) {
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

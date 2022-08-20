import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Grid } from "@mui/material";
import Paper from "paper";
import { Color, Point } from "paper/dist/paper-core";
import SliderWithInput from "../components/SliderWithInput";
import {
  addPoints,
  subPoints,
  LevelSimbol,
  mulPoint,
  VectorArray,
} from "../paperUtility";

const metersToPixels = 400;
const atmToPixels = 2;
const maxPressure = 12;

class Modulo6Flotacion extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    liquid: {
      shape: null,
      color: "#1976D2",
      density: 10,
      levelSimbol: null,
    },
    buoy: {
      shape: null,
      area: 0,
      velocity: new Paper.Point(0, 0),
      angularVelocity: 0,
      density: 7,
      centerOfMass: new Paper.Point(0, 0),
      bouyancyCenterShape: null,
      massCenterShape: null,
    },
    atmosphericPressure: 1,
    absolutePressure: false,
    arrows: null,
    gravity: 9.8,
    line: null,
    ready: false,
  };

  onValueChanged = (event) => {
    var newState = { ...this.state };
    newState.value = event.target.value;
    this.setState(newState);
  };

  onMouseDown(event) {
    // If we produced a path before, deselect it:
    const path = this.state.buoy.shape;
    if (path) {
      path.remove();
      this.state.buoy.submergedShape.remove();
      this.state.buoy.shape = null;
    }

    // Create a new path and set its stroke color to black:
    const newShape = new Paper.Path({
      segments: [event.point],
      strokeColor: "black",
      strokeWidth: 3,
      fillColor: "#DB1F48",
    });

    let newState = { ...this.state };
    newState.buoy.shape = newShape;
    newState.drawingShape = true;
    this.setState(newState);
  }

  // While the user drags the mouse, points are added to the path
  // at the position of the mouse:
  onMouseDrag(event) {
    this.state.buoy.shape.add(event.point);
  }

  // When the mouse is released, we simplify the path:
  onMouseUp(event) {
    var path = this.state.buoy.shape;
    var segmentCount = path.segments.length;

    path.closePath();

    // When the mouse is released, simplify it:
    path.simplify(30);

    const centerOfMass = this.aproximateCenterOfMass(path);

    let newState = { ...this.state };
    newState.buoy.shape = path;
    newState.buoy.area = Math.abs(path.area);
    newState.buoy.velocity = new Paper.Point(0, 0);
    newState.buoy.centerOfMass = centerOfMass;
    newState.drawingShape = false;
    this.setState(newState);

    if (Math.abs(path.area) < 5) {
      path.remove();
      this.state.buoy.shape = null;
      console.log("Path is too small");
    }
    if (path.intersects(path)) {
      path.remove();
      this.state.buoy.shape = null;
      console.log("Shape intersects itself");
    }
  }

  updateSimulation(delta) {
    const buoy = this.state.buoy;
    if (buoy.shape) {
      if (!this.state.drawingShape) {
        // Physics
        const translation = mulPoint(buoy.velocity, delta);
        buoy.shape.translate(translation);
        buoy.centerOfMass = addPoints(buoy.centerOfMass, translation);

        // Arrows
        const points = [];
        const magnitudes = [];
        let forceX = 0;
        let forceY = 0;
        // For each curve...
        for (let c = 0; c <= buoy.shape.curves.length; c++) {
          // For every 5 pixels in that curve...
          const curve = buoy.shape.curves[c % buoy.shape.curves.length];
          for (let o = 0; o <= curve.length; o += 5) {
            const point = curve.getLocationAt(o).point;
            points.push(point);
            magnitudes.push(this.getPressureAtPosition(point) * atmToPixels);
          }
        }

        const mass = buoy.area * buoy.density;
        const gravitationalForce = this.state.gravity * mass;
        this.state.buoy.massCenterShape.bringToFront();
        this.state.buoy.massCenterShape.position = buoy.centerOfMass;

        if (this.state.buoy.submergedShape) {
          this.state.buoy.submergedShape.remove();
        }
        const submergedShape = buoy.shape.intersect(this.state.liquid.shape);
        const submergedArea = Math.abs(submergedShape.area);
        submergedShape.fillColor = "#1946A280";
        submergedShape.strokeWidth = 0;

        const buoyancyForce =
          -submergedArea * this.state.liquid.density * this.state.gravity;
        const drag = -0.2 * buoy.velocity.y * submergedShape.area;

        const newVelocity = addPoints(
          buoy.velocity,
          new Point(0, (gravitationalForce + buoyancyForce + drag) / mass)
        );

        // Torque
        let newAngularVelocity = this.state.buoy.angularVelocity;
        if (submergedArea > 0) {
          const submergedCenter = this.aproximateCenterOfMass(submergedShape);

          const xdistance = submergedCenter.x - buoy.centerOfMass.x;
          const drag = -this.state.buoy.angularVelocity * submergedArea * 250;
          const torque = (drag + buoyancyForce * xdistance) / 1000;
          const rotatedOffset = buoy.centerOfMass.rotate(buoy.shape.rotation); // Ver que la rotacion de este centro actua raro

          this.state.buoy.massCenterShape.bringToFront();
          this.state.buoy.massCenterShape.position = rotatedOffset;
          this.state.buoy.bouyancyCenterShape.bringToFront();
          this.state.buoy.bouyancyCenterShape.position = submergedCenter;

          newAngularVelocity += torque / mass;
        }
        buoy.shape.rotation = newAngularVelocity * delta;

        // State
        this.state.arrows.SetValues(
          points,
          magnitudes,
          15,
          buoy.shape.area < 0,
          false,
          true
        );

        let newState = { ...this.state };
        newState.buoy.angularVelocity = newAngularVelocity;
        newState.buoy.velocity = newVelocity;
        newState.buoy.submergedShape = submergedShape;
        this.setState(newState);
      }
    }
  }

  getPressureAtPosition(position) {
    const level = Paper.view.center.y;
    const depth = Math.max(0, position.y - level);
    const atmPressure = this.state.absolutePressure
      ? this.state.atmosphericPressure
      : 0;
    return (
      atmPressure +
      (this.state.liquid.density * this.state.gravity * depth) / metersToPixels
    );
  }

  aproximateCenterOfMass(shape) {
    const bounds = shape.bounds;
    const subdivisions = 2;
    const w = bounds.width / subdivisions;
    const h = bounds.height / subdivisions;
    const totalArea = shape.area;
    const chunks = [];
    for (let x = bounds.x; x < bounds.x + bounds.width; x += w) {
      for (let y = bounds.y; y < bounds.y + bounds.height; y += h) {
        const section = new Paper.Path.Rectangle(
          new Paper.Point(x, y),
          new Paper.Point(x + w, y + h)
        );
        const intersection = section.intersect(shape);
        section.remove();
        chunks.push(intersection);
      }
    }

    let xsum = 0;
    let ysum = 0;
    let weight = 0;
    for (let c = 0; c < chunks.length; c++) {
      const center = chunks[c].bounds.center;
      const chunkWeight = chunks[c].area;
      xsum += center.x * chunkWeight;
      ysum += center.y * chunkWeight;
      weight += chunkWeight;
      chunks[c].remove();
    }
    return new Paper.Point(xsum / weight, ysum / weight);
  }

  /*aproximateCenterOfMass(shape) {
    const bounds = shape.bounds;
    const subdivisions = 5;
    const w = bounds.width / subdivisions;
    const h = bounds.height / subdivisions;
    let xsum = 0;
    let ysum = 0;
    let hitCount = 0;
    for (let x = bounds.x + w / 2; x < bounds.x + bounds.width; x += w) {
      for (let y = bounds.y + h / 2; y < bounds.y + bounds.height; y += h) {
        const hit = shape.hitTest(new Paper.Point(x, y));
        if (hit) {
          xsum += x;
          ysum += y;
          hitCount++;
        }
      }
    }
    return {
      x: xsum / hitCount,
      y: ysum / hitCount,
    };
  }*/

  canvasFunction() {
    const center = Paper.view.center;

    const background = new Paper.Path.Rectangle(
      new Paper.Rectangle(new Paper.Point(0, 0), Paper.view.size)
    );
    background.fillColor = "white";

    const liquidShape = new Paper.Path.Rectangle(
      new Paper.Rectangle(
        Paper.view.bounds.leftCenter,
        Paper.view.bounds.bottomRight
      )
    );
    liquidShape.style = {
      fillColor: this.state.liquid.color,
    };

    const levelSimbol = new LevelSimbol(
      addPoints(Paper.view.bounds.rightCenter, new Point(-50, 0)),
      "white"
    );

    const bouyancyCenterShape = new Paper.Path.Circle(
      new Paper.Point(0, 0),
      20
    );
    bouyancyCenterShape.style = { fillColor: "cyan" };
    const massCenterShape = new Paper.Path.Circle(new Paper.Point(0, 0), 20);
    massCenterShape.style = { fillColor: "black" };

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.liquid.shape = liquidShape;
    newState.liquid.levelSimbol = levelSimbol;
    newState.buoy.massCenterShape = massCenterShape;
    newState.buoy.bouyancyCenterShape = bouyancyCenterShape;
    newState.arrows = new VectorArray();
    newState.ready = true;
    this.setState(newState);

    Paper.view.onFrame = (event) => {
      this.updateSimulation(event.delta);
    };

    Paper.view.onMouseDown = (event) => {
      this.onMouseDown(event);
    };
    Paper.view.onMouseDrag = (event) => {
      this.onMouseDrag(event);
    };
    Paper.view.onMouseUp = (event) => {
      this.onMouseUp(event);
    };
  }

  render() {
    return (
      <PanelAndCanvas
        title="Plantilla"
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="a-"
                  step={1}
                  min={0}
                  max={100}
                  unit="cm"
                  value={this.state.value}
                  onChange={this.onValueChanged}
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

export default Modulo6Flotacion;

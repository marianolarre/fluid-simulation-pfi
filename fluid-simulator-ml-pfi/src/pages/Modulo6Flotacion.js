import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import MyRadio from "../components/MyRadio";
import { Grid, Button } from "@mui/material";
import Paper from "paper";
import { Color, Point } from "paper/dist/paper-core";
import SliderWithInput from "../components/SliderWithInput";
import {
  addPoints,
  subPoints,
  LevelSimbol,
  mulPoint,
  VectorArray,
  VectorArrow,
} from "../paperUtility";

const metersToPixels = 400;
const atmToPixels = 15;
const maxPressure = 12;
const shapeStyle = {
  strokeColor: "black",
  strokeWidth: 3,
  fillColor: "#DB1F48",
  dashArray: null,
};

class Modulo6Flotacion extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    liquid: {
      shape: null,
      color: "#1976D2",
      density: 2,
      levelSimbol: null,
    },
    buoy: {
      shape: null,
      area: 0,
      velocity: new Paper.Point(0, 0),
      angularVelocity: 0,
      density: 1.5,
      pos: new Paper.Point(0, 0),
      angle: 0,
      centerOfMass: new Paper.Point(0, 0),
      buoyancyCenterShape: null,
      massCenterShape: null,
      weightArrow: null,
      buoyancyArrow: null,
    },
    atmosphericPressure: 1,
    absolutePressure: false,
    showingPressureForces: false,
    showEquivalentForcePoints: false,
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
    this.removeCurrentShape();

    // Create a new path and set its stroke color to black:
    const newShape = new Paper.Path({
      strokeWidth: 3,
      strokeColor: "black",
      dashArray: [5, 5],
    });
    newShape.add(event.point);

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
    var shape = this.state.buoy.shape;

    shape.closePath();

    // When the mouse is released, simplify it:
    shape.simplify(10);

    if (Math.abs(shape.area) < 5) {
      shape.remove();
      this.state.buoy.shape = null;
      console.log("Shape is too small");
      return;
    }
    if (shape.intersects(shape)) {
      shape.remove();
      this.state.buoy.shape = null;
      console.log("Shape intersects itself");
      return;
    }

    this.registerShape(shape);
  }

  onSelectPresetRectangle = (event) => {
    this.removeCurrentShape();
    const newShape = new Paper.Path.Rectangle({
      point: new Paper.Point(
        Paper.view.bounds.width / 4,
        Paper.view.bounds.height / 8
      ),
      size: new Paper.Size(
        Paper.view.bounds.width / 2,
        Paper.view.bounds.height / 5
      ),
    });
    this.registerShape(newShape);
  };

  onSelectPresetCircle = (event) => {
    this.removeCurrentShape();
    const newShape = new Paper.Path.Circle({
      center: new Paper.Point(
        Paper.view.bounds.width / 2,
        Paper.view.bounds.height / 4
      ),
      radius: Paper.view.bounds.height / 6,
    });
    this.registerShape(newShape);
  };

  onObjectDensityChange = (newValue) => {
    var newState = { ...this.state };
    newState.buoy.density = newValue;
    this.setState(newState);
  };

  onLiquidDensityChange = (newValue) => {
    var newState = { ...this.state };
    newState.liquid.density = newValue;
    this.setState(newState);
  };

  onGravityChange = (newValue) => {
    var newState = { ...this.state };
    newState.gravity = newValue;
    this.setState(newState);
  };

  onPressureTypeChange = (event) => {
    var newState = { ...this.state };
    newState.absolutePressure = event.target.value == "true";
    this.setState(newState);
  };

  toggleShowingPressureForcesChange = (event) => {
    const showingPressureForces = !this.state.showingPressureForces;
    var newState = { ...this.state };
    newState.showingPressureForces = showingPressureForces;
    this.setState(newState);
  };

  toggleShowEquivalentForcePointsChange = (event) => {
    const showEquivalentForcePoints = !this.state.showEquivalentForcePoints;
    var newState = { ...this.state };
    newState.showEquivalentForcePoints = showEquivalentForcePoints;
    this.setState(newState);
  };

  removeCurrentShape() {
    if (this.state.buoy.shape) {
      this.state.buoy.shape.remove();
    }
    if (this.state.arrows != null) {
      this.state.arrows.Reset();
    }
    if (this.state.buoy != null) {
      this.state.buoy.weightArrow.setVisible(false);
      this.state.buoy.buoyancyArrow.setVisible(false);
      this.state.buoy.massCenterShape.visible = false;
      this.state.buoy.buoyancyCenterShape.visible = false;
    }
    if (this.state.buoy.submergedShape != null) {
      this.state.buoy.submergedShape.remove();
    }
  }

  registerShape(shape) {
    const centerOfMass = this.aproximateCenterOfMass(shape);
    const centerOfMassOffset = subPoints(centerOfMass, shape.bounds.center);
    shape.pivot = centerOfMass;

    shape.style = shapeStyle;

    let newState = { ...this.state };
    newState.buoy.shape = shape;
    newState.buoy.area = Math.abs(shape.area);
    newState.buoy.velocity = new Paper.Point(0, 0);
    newState.buoy.pos = shape.bounds.center;
    newState.buoy.centerOfMassOffset = centerOfMassOffset;
    newState.buoy.angularVelocity = 0;
    newState.buoy.angle = 0;
    newState.drawingShape = false;
    this.setState(newState);
  }

  updateSimulation(delta) {
    const buoy = this.state.buoy;
    if (buoy.shape) {
      if (!this.state.drawingShape) {
        // Physics
        let translation = mulPoint(buoy.velocity, delta);
        let bottomBumpPosition = null;
        if (buoy.shape.bounds.leftCenter.x < 0) {
          translation.x -= buoy.shape.bounds.leftCenter.x;
        }
        if (buoy.shape.bounds.rightCenter.x > Paper.view.bounds.rightCenter.x) {
          translation.x +=
            Paper.view.bounds.rightCenter.x - buoy.shape.bounds.rightCenter.x;
        }
        if (
          buoy.shape.bounds.bottomCenter.y > Paper.view.bounds.bottomCenter.y
        ) {
          translation.y +=
            Paper.view.bounds.bottomCenter.y - buoy.shape.bounds.bottomCenter.y;
          const intersections = buoy.shape.getIntersections(
            this.state.liquid.shape
          );
          if (intersections.length > 0) {
            bottomBumpPosition = intersections[0].point;
            for (let i = 1; i < intersections.length; i++) {
              if (intersections[i].point.y > bottomBumpPosition.y) {
                bottomBumpPosition = intersections[i].point;
              }
            }
          }
        }
        buoy.shape.translate(translation);
        buoy.pos = addPoints(buoy.pos, translation);

        // Arrows
        const points = [];
        const magnitudes = [];
        let forceX = 0;
        let forceY = 0;
        // For each curve...
        for (let c = 0; c < buoy.shape.curves.length; c++) {
          // For every 5 pixels in that curve...
          const curve = buoy.shape.curves[c % buoy.shape.curves.length];
          for (let o = 0; o <= curve.length; o += 3) {
            const point = curve.getLocationAt(o).point;
            points.push(point);
            magnitudes.push(this.getPressureAtPosition(point) * atmToPixels);
          }
        }

        const mass = buoy.area * buoy.density;
        const gravitationalForce = this.state.gravity * mass;

        if (buoy.submergedShape) {
          buoy.submergedShape.remove();
        }
        const submergedShape = buoy.shape.intersect(this.state.liquid.shape);
        const submergedArea = Math.abs(submergedShape.area);
        submergedShape.fillColor = "#1946A280";
        submergedShape.strokeWidth = 0;

        const buoyancyForce =
          -submergedArea * this.state.liquid.density * this.state.gravity;
        const drag =
          -0.01 *
          this.state.liquid.density *
          buoy.velocity.y *
          submergedShape.area;

        const newVelocity = addPoints(
          buoy.velocity,
          new Point(0, (gravitationalForce + buoyancyForce + drag) / mass)
        );

        const showingEqForces = this.state.showEquivalentForcePoints;

        // Torque
        let newAngularVelocity = buoy.angularVelocity;
        const centerOfMass = addPoints(buoy.pos, buoy.centerOfMassOffset);
        buoy.massCenterShape.bringToFront();
        buoy.massCenterShape.position = centerOfMass;
        buoy.massCenterShape.visible = showingEqForces;
        buoy.weightArrow.bringToFront();
        buoy.weightArrow.SetPosition(
          centerOfMass,
          addPoints(centerOfMass, new Paper.Point(0, gravitationalForce / 8000))
        );
        buoy.weightArrow.setVisible(showingEqForces);

        if (submergedArea > 0) {
          const submergedCenter = this.aproximateCenterOfMass(submergedShape);

          const xdistance = submergedCenter.x - centerOfMass.x;
          const drag = -buoy.angularVelocity * submergedArea * 20;
          const torque = (drag + buoyancyForce * xdistance) / 400;

          buoy.massCenterShape.bringToFront();
          buoy.massCenterShape.position = centerOfMass;

          buoy.buoyancyCenterShape.bringToFront();
          buoy.buoyancyCenterShape.visible = showingEqForces;
          buoy.buoyancyCenterShape.position = submergedCenter;

          buoy.buoyancyArrow.bringToFront();
          buoy.buoyancyArrow.setVisible(showingEqForces);
          buoy.buoyancyArrow.SetPosition(
            submergedCenter,
            addPoints(submergedCenter, new Paper.Point(0, buoyancyForce / 8000))
          );

          newAngularVelocity += torque / mass;
        } else {
          buoy.buoyancyCenterShape.visible = false;
          buoy.buoyancyArrow.visible = false;
        }

        if (bottomBumpPosition != null) {
          if (newVelocity.y > 0) {
            newVelocity.y = -newVelocity.y * 0.1;
          }

          const xdistance = centerOfMass.x - bottomBumpPosition.x;
          const torque = xdistance * 100;
          newAngularVelocity += (Math.abs(newVelocity.y) * torque) / mass;
        }

        buoy.angle += newAngularVelocity * delta;
        buoy.shape.rotate(newAngularVelocity * delta);

        // State
        if (this.state.showingPressureForces) {
          this.state.arrows.SetValues(points, magnitudes, 20, {
            inverted: buoy.shape.area < 0,
            otherEnd: true,
            closed: true,
          });
        } else {
          this.state.arrows.Reset();
        }

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

    const buoyancyCenterShape = new Paper.Path.Circle(new Paper.Point(0, 0), 8);
    buoyancyCenterShape.style = { fillColor: "black" };
    buoyancyCenterShape.visible = false;
    const massCenterShape = new Paper.Path.Circle(new Paper.Point(0, 0), 10);
    massCenterShape.style = { fillColor: "yellow" };
    massCenterShape.visible = false;

    const weightArrow = new VectorArrow(
      new Paper.Point(0, 0),
      new Paper.Point(0, 0),
      "yellow",
      12,
      17,
      25
    );
    weightArrow.setVisible(false);

    const buoyancyArrow = new VectorArrow(
      new Paper.Point(0, 0),
      new Paper.Point(0, 0),
      "black",
      8,
      17,
      25
    );
    buoyancyArrow.setVisible(false);

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.liquid.shape = liquidShape;
    newState.liquid.levelSimbol = levelSimbol;
    newState.buoy.massCenterShape = massCenterShape;
    newState.buoy.buoyancyCenterShape = buoyancyCenterShape;
    newState.buoy.weightArrow = weightArrow;
    newState.buoy.buoyancyArrow = buoyancyArrow;
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
                  label="Densidad del objeto"
                  step={0.1}
                  min={0.1}
                  max={10}
                  unit="kg/m³"
                  value={this.state.buoy.density}
                  onChange={this.onObjectDensityChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del líquido"
                  step={0.1}
                  min={0.1}
                  max={10}
                  unit="kg/m³"
                  value={this.state.liquid.density}
                  onChange={this.onLiquidDensityChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Gravedad"
                  step={0.1}
                  min={0}
                  max={20}
                  unit="m/s²"
                  value={this.state.gravity}
                  onChange={this.onGravityChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12} xl={6}>
                <MyToggle
                  label="Fuerzas de presión"
                  checked={this.state.showingPressureForces}
                  onChange={this.toggleShowingPressureForcesChange}
                />
              </Grid>
              <Grid item xs={12} xl={6}>
                <MyToggle
                  label="Fuerzas equivalentes"
                  checked={this.state.showEquivalentForcePoints}
                  onChange={this.toggleShowEquivalentForcePointsChange}
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
              <Grid item xs={6}>
                <Button
                  sx={{ width: "100%" }}
                  variant="contained"
                  onClick={this.onSelectPresetRectangle}
                >
                  Rectángulo
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  sx={{ width: "100%" }}
                  variant="contained"
                  onClick={this.onSelectPresetCircle}
                >
                  Círculo
                </Button>
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

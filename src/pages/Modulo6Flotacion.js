import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import { MathComponent } from "mathjax-react";
import EquationReferences from "../components/EquationReferences";

import MyRadio from "../components/MyRadio";
import { Grid, Button, Typography, Box } from "@mui/material";
import { Paper as MUIPaper } from "@mui/material";
import { view, Point, Size, Path, Rectangle, Segment, project } from "paper";
import SliderWithInput from "../components/SliderWithInput";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import {
  addPoints,
  subPoints,
  LevelSimbol,
  mulPoint,
  VectorArray,
  VectorArrow,
  CoordinateReference,
} from "../paperUtility";
import ModuleAccordion from "../components/ModuleAccordion";

let loading = false;
let createdPath = null;

let buoyAngularVelocity = 0;
let buoyVelocity = new Point(0, 0);
let buoySubmergedShape = null;

const metersToPixels = 400;
const paToPixels = 500 / 101325;
const maxPressure = 12;
const shapeStyle = {
  strokeColor: "black",
  strokeWidth: 3,
  fillColor: "#DB1F48",
  dashArray: null,
};

let selectedShape = 0;

class Modulo6Flotacion extends Component {
  state = {
    background: {
      shape: null,
    },
    liquid: {
      shape: null,
      color: "#1976D2",
      density: 1000,
      levelSimbol: null,
    },
    buoy: {
      shape: null,
      area: 0,
      velocity: new Point(0, 0),
      angularVelocity: 0,
      density: 700,
      pos: new Point(0, 0),
      angle: 0,
      centerOfMass: new Point(0, 0),
      buoyancyCenterShape: null,
      massCenterShape: null,
      weightArrow: null,
      buoyancyArrow: null,
    },
    intersectionIndicators: [],
    paused: true,
    drawingShape: false,
    movingShape: false,
    movingLocalPoint: null,
    atmosphericPressure: 5000,
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

  togglePause = (event) => {
    var newState = { ...this.state };
    newState.paused = !this.state.paused;
    this.setState(newState);
  };

  onMouseDown(event) {
    if (!this.state.drawing) {
      this.beginMovingShape(event);
    }
  }

  // While the user drags the mouse, points are added to the path
  // at the position of the mouse:
  onMouseDrag(event) {
    if (this.state.drawingShape) {
      this.dragDrawingShape(event);
    }
    if (this.state.movingShape) {
      this.dragMovingShape(event);
    }
  }

  // When the mouse is released, we simplify the path:
  onMouseUp(event) {
    if (this.state.drawingShape) {
      this.finishDrawingShape(event);
    }
    if (this.state.movingShape) {
      this.finishMovingShape(event);
    }
  }

  beginDrawingShape = (event) => {
    this.removeCurrentShape();
    this.removeIntersectionErrors();

    // Create a new path and set its stroke color to black:
    const newShape = new Path({
      strokeWidth: 3,
      strokeColor: "black",
      dashArray: [5, 5],
    });

    let newState = { ...this.state };
    newState.buoy.shape = newShape;
    newState.drawingShape = true;
    this.setState(newState);
  };

  dragDrawingShape(event) {
    this.state.buoy.shape.add(event.point);
  }

  finishDrawingShape(event) {
    var shape = this.state.buoy.shape;

    shape.closePath();

    // When the mouse is released, simplify it:
    shape.simplify(10);

    var ok = true;
    if (Math.abs(shape.area) < 5) {
      shape.remove();
      this.state.buoy.shape = null;
      console.log("Shape is too small");
      ok = false;
    }
    if (shape.intersects(shape)) {
      this.state.buoy.shape = null;
      console.log("Shape intersects itself");
      this.shapeInstersectionError(shape);
      ok = false;
    }

    if (ok) {
      this.registerShape(shape);
    }
  }

  beginMovingShape(event) {
    let newState = { ...this.state };
    newState.movingShape = true;
    this.setState(newState);
  }

  dragMovingShape(event) {}

  finishMovingShape(event) {
    let newState = { ...this.state };
    newState.movingShape = false;
    this.setState(newState);
  }

  serializeCurve(shape) {
    let curves = [];
    for (let i = 0; i < shape.curves.length; i++) {
      curves.push(Math.round(shape.segments[i].point.x));
      curves.push(Math.round(shape.segments[i].point.y));
      curves.push(Math.round(shape.segments[i].handleIn.x));
      curves.push(Math.round(shape.segments[i].handleIn.y));
      curves.push(Math.round(shape.segments[i].handleOut.x));
      curves.push(Math.round(shape.segments[i].handleOut.y));
    }
    return curves;
  }

  deserializeCurve(serialized) {
    if (createdPath != null) {
      createdPath.remove();
    }
    let shape = new Path();
    createdPath = shape;
    for (let i = 0; i <= serialized.length; i += 6) {
      var nextID = (i + 6) % serialized.length;
      shape.add(
        new Segment(
          new Point(
            parseFloat(serialized[nextID]),
            parseFloat(serialized[nextID + 1])
          ),
          new Point(
            parseFloat(serialized[nextID + 2]),
            parseFloat(serialized[nextID + 3])
          ),
          new Point(
            parseFloat(serialized[nextID + 4]),
            parseFloat(serialized[nextID + 5])
          )
        )
      );
    }
    return shape;
  }

  onSelectPresetRectangle = (event) => {
    this.removeCurrentShape();
    const corner = new Point(
      view.center.x - view.bounds.width / 4,
      view.center.y - view.bounds.height / 4
    );
    const newShape = new Path.Rectangle({
      point: corner,
      size: new Size(view.bounds.width / 2, view.bounds.height / 5),
    });
    this.registerShape(newShape);
  };

  onSelectPresetCircle = (event) => {
    this.removeCurrentShape();
    const center = new Point(
      view.center.x,
      view.center.y - view.bounds.height / 4
    );
    const newShape = new Path.Circle({
      center: center,
      radius: view.bounds.height / 6,
    });
    this.registerShape(newShape);
  };

  onSelectPresetBoat = (event) => {
    this.removeCurrentShape();
    const boatWidth = view.bounds.width / 2;
    const center = new Point(
      view.center.x,
      view.center.y - view.bounds.height / 4
    );
    const newShape = new Path.Circle({
      center: center,
      radius: view.bounds.height / 6,
    });
    // Left point
    newShape.segments[0].point.x = center.x - boatWidth / 2;
    newShape.segments[0].handleOut.y = 0;
    // Top point
    newShape.segments[1].point.y = center.y;
    // Right point
    newShape.segments[2].point.x = center.x + boatWidth / 2;
    newShape.segments[2].handleIn.y = 0;
    // Bottom point
    newShape.segments[3].handleOut.x = -boatWidth / 2;
    newShape.segments[3].handleIn.x = boatWidth / 2;
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
    if (buoySubmergedShape != null) {
      buoySubmergedShape.remove();
    }
  }

  shapeInstersectionError(shape) {
    var createdShapes = [];
    this.removeIntersectionErrors();

    var intersections = shape.getIntersections(shape);

    for (let i = 0; i < intersections.length; i++) {
      var newShape = new Path({
        style: { fillColor: "red", strokeColor: "black", strokeWidth: 2 },
      });
      newShape.add(new Point(-20, -10));
      newShape.add(new Point(-10, -20));
      newShape.add(new Point(0, -10));
      newShape.add(new Point(10, -20));
      newShape.add(new Point(20, -10));
      newShape.add(new Point(10, 0));
      newShape.add(new Point(20, 10));
      newShape.add(new Point(10, 20));
      newShape.add(new Point(0, 10));
      newShape.add(new Point(-10, 20));
      newShape.add(new Point(-20, 10));
      newShape.add(new Point(-10, 0));
      newShape.closePath();
      newShape.position = intersections[i].point;
      createdShapes.push(newShape);
    }
    setTimeout(() => {
      let newState = { ...this.state };
      newState.buoy.shape = shape;
      newState.intersectionIndicators = createdShapes;
      this.setState(newState);
    }, 1);
  }

  removeIntersectionErrors() {
    for (let i = 0; i < this.state.intersectionIndicators.length; i++) {
      this.state.intersectionIndicators[i].remove();
    }
  }

  registerShape(shape) {
    const centerOfMass = this.aproximateCenterOfMass(shape);
    const centerOfMassOffset = subPoints(centerOfMass, shape.bounds.center);
    shape.pivot = centerOfMass;

    shape.style = shapeStyle;

    this.removeIntersectionErrors();
    // Deferred
    setTimeout(() => {
      let newState = { ...this.state };
      newState.buoy.shape = shape;
      newState.buoy.area = Math.abs(shape.area);
      buoyVelocity = new Point(0, 0);
      newState.buoy.pos = shape.bounds.center;
      newState.buoy.centerOfMassOffset = centerOfMassOffset;
      newState.buoy.angle = 0;
      newState.drawingShape = false;
      this.setState(newState);
    }, 1);
  }

  updateSimulation(delta) {
    const buoy = this.state.buoy;
    if (buoy.shape) {
      if (!this.state.paused && !this.state.drawingShape) {
        // Physics
        let translation = mulPoint(buoyVelocity, delta);
        let bottomBumpPosition = null;
        if (buoy.shape.bounds.leftCenter.x < 0) {
          translation.x -= buoy.shape.bounds.leftCenter.x;
        }
        if (buoy.shape.bounds.rightCenter.x > view.bounds.rightCenter.x) {
          translation.x +=
            view.bounds.rightCenter.x - buoy.shape.bounds.rightCenter.x;
        }
        if (buoy.shape.bounds.bottomCenter.y > view.bounds.bottomCenter.y) {
          translation.y +=
            view.bounds.bottomCenter.y - buoy.shape.bounds.bottomCenter.y;
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
            magnitudes.push(this.getPressureAtPosition(point) * paToPixels);
          }
        }

        const mass = buoy.area * buoy.density;
        const gravitationalForce = this.state.gravity * mass;

        if (buoySubmergedShape) {
          buoySubmergedShape.remove();
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
          buoyVelocity.y *
          submergedShape.area;

        const newVelocity = addPoints(
          buoyVelocity,
          new Point(0, (gravitationalForce + buoyancyForce + drag) / mass)
        );

        const showingEqForces = this.state.showEquivalentForcePoints;

        // Torque
        let newAngularVelocity = buoyAngularVelocity;
        const centerOfMass = addPoints(buoy.pos, buoy.centerOfMassOffset);
        buoy.massCenterShape.bringToFront();
        buoy.massCenterShape.position = centerOfMass;
        buoy.massCenterShape.visible = showingEqForces;
        buoy.weightArrow.bringToFront();
        buoy.weightArrow.SetPosition(
          centerOfMass,
          addPoints(centerOfMass, new Point(0, gravitationalForce / 8000000))
        );
        buoy.weightArrow.setVisible(showingEqForces);

        if (submergedArea > 0) {
          const submergedCenter = this.aproximateCenterOfMass(submergedShape);

          const xdistance = submergedCenter.x - centerOfMass.x;
          const drag = -buoyAngularVelocity * submergedArea * 20000;
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
            addPoints(submergedCenter, new Point(0, buoyancyForce / 8000000))
          );

          newAngularVelocity += torque / mass;
        } else {
          buoy.buoyancyCenterShape.visible = false;
          buoy.buoyancyArrow.setVisible(false);
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

        /*let newState = { ...this.state };
        newState.buoy.angularVelocity = newAngularVelocity;
        newState.buoy.velocity = newVelocity;
        newState.buoy.submergedShape = submergedShape;
        this.setState(newState);*/

        buoyAngularVelocity = newAngularVelocity;
        buoyVelocity = newVelocity;
        buoySubmergedShape = submergedShape;
      }
    }
  }

  getPressureAtPosition(position) {
    const level = view.center.y;
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
        const section = new Path.Rectangle(
          new Point(x, y),
          new Point(x + w, y + h)
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
    return new Point(xsum / weight, ysum / weight);
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const liquidShape = new Path.Rectangle(
      new Rectangle(view.bounds.leftCenter, view.bounds.bottomRight)
    );
    liquidShape.style = {
      fillColor: this.state.liquid.color,
    };

    const levelSimbol = new LevelSimbol(
      addPoints(view.bounds.rightCenter, new Point(-50, 0)),
      "white"
    );

    const buoyancyCenterShape = new Path.Circle(new Point(0, 0), 8);
    buoyancyCenterShape.style = { fillColor: "black" };
    buoyancyCenterShape.visible = false;
    const massCenterShape = new Path.Circle(new Point(0, 0), 10);
    massCenterShape.style = { fillColor: "yellow" };
    massCenterShape.visible = false;

    const weightArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "yellow",
      12,
      17,
      25
    );
    weightArrow.setVisible(false);

    const buoyancyArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
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

    view.onFrame = (event) => {
      this.updateSimulation(event.delta);
    };

    view.onMouseDown = (event) => {
      this.onMouseDown(event);
    };
    view.onMouseDrag = (event) => {
      this.onMouseDrag(event);
    };
    view.onMouseUp = (event) => {
      this.onMouseUp(event);
    };

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

  getParameterCode() {
    let module = "F";
    let codeVersion = "1";
    let serializedCurve = null;
    if (this.state.buoy.shape != null) {
      serializedCurve = this.serializeCurve(this.state.buoy.shape);
    }
    let list = [
      module,
      codeVersion,
      this.state.buoy.density,
      this.state.liquid.density,
      this.state.gravity,
      this.state.showingPressureForces ? 1 : 0,
      this.state.showEquivalentForcePoints ? 1 : 0,
      this.state.absolutePressure ? 1 : 0,
    ];
    if (serializedCurve != null) {
      for (let i = 0; i < serializedCurve.length; i++) {
        list.push(serializedCurve[i]);
      }
    }
    return list.join(";");
  }

  loadParameterCode(code) {
    if (loading) return false;
    loading = true;
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    if (codeVersion == 1) {
      let buoy = { ...this.state.buoy };
      buoy.density = parseFloat(split[2]);
      let liquid = { ...this.state.liquid };
      liquid.density = parseFloat(split[3]);
      let gravity = parseFloat(split[4]);
      let showingPressureForces = split[5] == 1;
      let showEquivalentForcePoints = split[6] == 1;
      let absolutePressure = split[7] == 1;
      let serializedCurve = split.slice(8);
      let curve = this.deserializeCurve(serializedCurve);
      this.setState(
        {
          buoy,
          liquid,
          gravity,
          showingPressureForces,
          showEquivalentForcePoints,
          absolutePressure,
        },
        () => {
          this.removeCurrentShape();
          this.registerShape(curve);
          loading = false;
        }
      );
      return true;
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Flotación"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <Button
                  sx={{ width: "100%" }}
                  variant="contained"
                  onClick={this.togglePause}
                >
                  {(this.state.paused && <PlayArrowIcon></PlayArrowIcon>) || (
                    <PauseIcon></PauseIcon>
                  )}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del objeto"
                  step={10}
                  min={10}
                  max={5000}
                  unit="kg/m³"
                  value={this.state.buoy.density}
                  onChange={this.onObjectDensityChange}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Densidad del líquido"
                  step={10}
                  min={10}
                  max={5000}
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
              <Grid item xs={6}>
                <MyToggle
                  label="Fuerzas de presión"
                  checked={this.state.showingPressureForces}
                  onChange={this.toggleShowingPressureForcesChange}
                />
              </Grid>
              <Grid item xs={6}>
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
              <Grid item xs={12}>
                <Typography>Crear forma</Typography>
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
              <Grid item xs={6}>
                <Button
                  sx={{ width: "100%" }}
                  variant="contained"
                  onClick={this.onSelectPresetBoat}
                >
                  Bote
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  sx={{ width: "100%" }}
                  color="secondary"
                  variant="contained"
                  onClick={this.beginDrawingShape}
                >
                  Dibujar
                </Button>
              </Grid>
              {this.state.drawingShape && (
                <Grid item xs={12}>
                  <MUIPaper
                    sx={{ width: "96%", padding: "2%" }}
                    background="secondary"
                    variant="contained"
                  >
                    Arrastra el cursor por la pantalla para dibujar una figura
                  </MUIPaper>
                </Grid>
              )}
              <Grid item xs={12} sx={{ marginTop: "50px" }}>
                <ModuleAccordion title="Ecuaciones">
                  <ModuleAccordion
                    title={
                      <MathComponent tex={String.raw`p=\rho g \triangle h`} />
                    }
                    fontSize={20}
                    center
                    hasBorder
                  >
                    <EquationReferences
                      parameters={[
                        {
                          letter: "p :",
                          description: "presión [Pa]",
                        },
                        {
                          letter: String.raw`\rho :`,
                          description: "densidad del líquido [kg/m³]",
                        },
                        {
                          letter: "g :",
                          description: "gravedad [m/s²]",
                        },
                        {
                          letter: String.raw`\triangle h :`,
                          description: "profundidad [m]",
                        },
                      ]}
                    ></EquationReferences>
                  </ModuleAccordion>
                  <ModuleAccordion
                    title={<MathComponent tex={String.raw`B=V\rho`} />}
                    fontSize={20}
                    center
                    hasBorder
                  >
                    <EquationReferences
                      parameters={[
                        {
                          letter: "B :",
                          description: "fuerza de flotación [kgf]",
                        },
                        {
                          letter: "V :",
                          description: "volumen de líquido desplazado [m³]",
                        },
                        {
                          letter: String.raw`\rho :`,
                          description: "densidad del líquido [kg/m³]",
                        },
                      ]}
                    ></EquationReferences>
                  </ModuleAccordion>
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

export default Modulo6Flotacion;

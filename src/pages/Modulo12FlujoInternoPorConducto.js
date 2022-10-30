import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Box, Button, Collapse, Grid, Typography } from "@mui/material";
import {
  view,
  Point,
  Path,
  Shape,
  Size,
  Rectangle,
  PointText,
  project,
} from "paper";
import SliderWithInput from "../components/SliderWithInput";
import {
  addPoints,
  lerp,
  mulPoint,
  subPoints,
  VectorArrow,
} from "../paperUtility";
import PanelModule from "../components/PanelModule";
import {
  AddCircle,
  ArrowBack,
  ArrowForward,
  ArrowLeft,
  ArrowRight,
  Backspace,
  Block,
  Deselect,
  Settings,
} from "@mui/icons-material";
import MyTooltip from "../components/MyTooltip";
import ModuleAccordion from "../components/ModuleAccordion";

let loading = false;

const pipeWidthMultiplier = 35;
const metersToPixels = 5;
let ready = false;
let tube = {
  line: null,
  nodes: [],
  input: {
    arrow: null,
  },
  output: {
    arrow: null,
  },
  totalDistance: 1,
};
let board = {
  width: 850,
  height: 250,
  offsetx: 0,
  offsety: -280,
  xtiles: 17,
  ytiles: 5,
  tiles: null,
};
let graph = {
  width: 850,
  height: 500,
  offsetx: 0,
  offsety: 110,
  topLeft: null,
  bottomLeft: null,
  topRight: null,
  bottomRight: null,
  kineticEnergyLine: null,
  pressureEnergyLine: null,
  potentialEnergyLine: null,
  piezometricEnergyLine: null,
  totalEnergyLine: null,
  maxEnergy: 125,
  inspectingArrow: null,
  yAxisText: null,
  xAxisText: null,
};
let selectedNodeShape = null;
let draggingNode = false;

class Modulo12FlujoInternoPorConducto extends Component {
  state = {
    value: 0,
    background: {
      shape: null,
    },
    ready: false,
    selectedNode: null,
    selectedPosition: {
      x: 0,
      y: 0,
    },
    selectedNodeIsPump: false,
    pumpPower: 0,
    diameterBefore: 1,
    diameterAfter: 1,
    roughnessBefore: 1,
    roughnessAfter: 1,
    k: 0,
    flow: 0.025,
    density: 1000,
    gravity: 9.8,
    pressure: 75,
    viscosity: 0.001,
    inspectingPosition: 0,
    inspectedData: {
      velocity: 0,
      diameter: 0,
      pressure: 0,
      height: 0,
      kinetic: 0,
      potential: 0,
      piezometric: 0,
      total: 0,
    },
  };

  onFlowChanged = (newValue) => {
    this.setState({ flow: newValue }, this.updatePipe());
  };

  onViscosityChanged = (newValue) => {
    this.setState({ viscosity: newValue }, this.updatePipe());
  };

  inspectNext() {
    this.setState(
      { inspectingPosition: this.state.inspectingPosition + 1 },
      () => this.updatePipe()
    );
  }

  inspectPrevious() {
    this.setState(
      { inspectingPosition: this.state.inspectingPosition - 1 },
      () => this.updatePipe()
    );
  }

  onPressureChanged = (newValue) => {
    this.setState({ pressure: newValue }, () => this.updatePipe());
  };

  onPressureChanged = (newValue) => {
    this.setState({ pressure: newValue }, () => this.updatePipe());
  };

  onKChanged = (newValue) => {
    this.state.selectedNode.k = newValue;
    this.setState({ k: newValue }, () => this.updatePipe());
  };

  onPumpPowerChanged = (newValue) => {
    this.state.selectedNode.pumpPower = newValue;
    this.setState({ pumpPower: newValue }, () => this.updatePipe());
  };

  onDiameterBeforeChanged = (newValue) => {
    this.state.selectedNode.diameterBefore = newValue;
    if (this.state.selectedNode.index > 0) {
      const previousNode = tube.nodes[this.state.selectedNode.index - 1];
      previousNode.diameterAfter = newValue;
    }
    this.setState({ diameterBefore: newValue }, () => this.updatePipe());
  };

  onDiameterAfterChanged = (newValue) => {
    this.state.selectedNode.diameterAfter = newValue;
    if (this.state.selectedNode.index < tube.nodes.length - 1) {
      const nextNode = tube.nodes[this.state.selectedNode.index + 1];
      nextNode.diameterBefore = newValue;
    }
    this.setState({ diameterAfter: newValue }, () => this.updatePipe());
  };

  onRoughnessBeforeChanged = (newValue) => {
    this.state.selectedNode.roughnessBefore = newValue;
    if (this.state.selectedNode.index > 0) {
      const previousNode = tube.nodes[this.state.selectedNode.index - 1];
      previousNode.roughnessAfter = newValue;
    }
    this.setState({ roughnessBefore: newValue }, () => this.updatePipe());
  };

  onRoughnessAfterChanged = (newValue) => {
    this.state.selectedNode.roughnessAfter = newValue;
    if (this.state.selectedNode.index < tube.nodes.length - 1) {
      const nextNode = tube.nodes[this.state.selectedNode.index + 1];
      nextNode.roughnessBefore = newValue;
    }
    this.setState({ roughnessAfter: newValue }, () => this.updatePipe());
  };

  onTileClicked(x, y) {
    this.deselectNode();
  }

  onTileEntered(x, y) {
    if (this.state.selectedNode != null && draggingNode) {
      this.state.selectedNode.x = x;
      this.state.selectedNode.y = y;
      this.setState({ selectedPosition: { x: x, y: y } });
      this.updatePipe();
    }
  }

  onNodeClicked(node) {
    draggingNode = true;
    tube.line.locked = true;
    this.selectNode(node);
  }

  selectNode(node) {
    selectedNodeShape.visible = true;
    selectedNodeShape.position = this.tileToScreen(node.x, node.y);
    this.setState({
      selectedNode: node,
      selectedNodeIsPump: node.isPump,
      pumpPower: node.pumpPower,
      diameterBefore: node.diameterBefore,
      diameterAfter: node.diameterAfter,
      roughnessBefore: node.roughnessBefore,
      roughnessAfter: node.roughnessAfter,
    });
  }

  onMouseDrag(event) {}

  onMouseUp(event) {
    if (draggingNode) {
      draggingNode = false;
      tube.line.locked = false;
    }
  }

  deselectNode() {
    this.setState({ selectedNode: null });
    selectedNodeShape.visible = false;
  }

  makePump(node) {
    node.isPump = true;
    node.shape.radius = 30;
    node.shape.fillColor = "#2af";
    node.graphShape.radius = 15;
    node.graphShape.fillColor = "#2af";
    this.setState({ selectedNodeIsPump: true });
    this.updatePipe();
  }

  removePump() {
    this.state.selectedNode.isPump = false;
    this.state.selectedNode.shape.radius = 18;
    this.state.selectedNode.shape.fillColor = "#666";
    this.state.selectedNode.graphShape.radius = 9;
    this.state.selectedNode.graphShape.fillColor = "#666";
    this.setState({ selectedNodeIsPump: false });
    this.updatePipe();
  }

  deleteNode() {
    selectedNodeShape.visible = false;
    this.state.selectedNode.shape.remove();
    this.state.selectedNode.graphShape.remove();
    this.state.selectedNode.graphLine.remove();
    tube.nodes.splice(this.state.selectedNode.index, 1);
    this.setState({ selectedNode: null });
    this.updateNodeIndexes();
    this.updatePipe();
  }

  addNodeBefore() {
    let createdNode = this.newNode(
      this.state.selectedNode.x - 1,
      this.state.selectedNode.y,
      this.state.selectedNode.index
    );
    createdNode.diameter = this.state.selectedNode.diameter;
    this.updatePipe();
    this.selectNode(createdNode);
  }

  addNodeAfter() {
    let createdNode = this.newNode(
      this.state.selectedNode.x + 1,
      this.state.selectedNode.y,
      this.state.selectedNode.index + 1
    );
    createdNode.diameter = this.state.selectedNode.diameter;
    this.updatePipe();
    this.selectNode(createdNode);
  }

  newNode(x, y, index) {
    let shape = new Shape.Circle(this.tileToScreen(x, y), 18);
    shape.style = {
      fillColor: "#666",
      strokeWidth: 5,
      strokeColor: "#000",
    };
    let graphLine = new Path();
    graphLine.add(new Point(0, 0));
    graphLine.add(new Point(0, 0));
    graphLine.style = {
      strokeWidth: 3,
      strokeColor: "#0006",
      dashArray: [10, 12],
    };
    let graphShape = new Shape.Circle(new Point(0, 0), 9);
    graphShape.style = {
      fillColor: "#666",
      strokeWidth: 5,
      strokeColor: "#000",
    };
    // Default values
    let diameterBefore = 0.1;
    let diameterAfter = 0.1;
    let roughnessBefore = 0;
    let roughnessAfter = 0;
    // Take neighbour values
    if (tube.nodes[index - 1] != null) {
      diameterBefore = tube.nodes[index - 1].diameterAfter;
      roughnessBefore = tube.nodes[index - 1].roughnessAfter;
    }
    if (tube.nodes[index] != null) {
      diameterAfter = tube.nodes[index].diameterBefore;
      roughnessAfter = tube.nodes[index].roughnessBefore;
    }

    let createdNode = {
      x: x,
      y: y,
      shape: shape,
      graphShape: graphShape,
      graphLine: graphLine,
      index: index,
      isPump: false,
      pumpPower: 20,
      diameterBefore: diameterBefore,
      diameterAfter: diameterAfter,
      roughnessBefore: roughnessBefore,
      roughnessAfter: roughnessAfter,
      k: 0,
    };
    shape.onMouseDown = () => this.onNodeClicked(createdNode);
    tube.nodes.splice(index, 0, createdNode);
    this.updateNodeIndexes();
    return createdNode;
  }

  updateNodeIndexes() {
    for (let i = 0; i < tube.nodes.length; i++) {
      tube.nodes[i].index = i;
    }
  }

  canAddBefore() {
    return this.state.selectedNode.x > 0;
  }

  canAddAfter() {
    return this.state.selectedNode.x < board.xtiles - 1;
  }

  updatePipe() {
    console.log(tube);
    var pressureEnergy = this.state.pressure;
    var kineticEnergy = 0;
    var potentialEnergy = 0;

    tube.line.removeSegments();
    graph.kineticEnergyLine.removeSegments();
    graph.potentialEnergyLine.removeSegments();
    graph.pressureEnergyLine.removeSegments();
    graph.piezometricEnergyLine.removeSegments();
    graph.totalEnergyLine.removeSegments();
    const firstNode = tube.nodes[0];
    const firstPoint = this.tileToScreen(firstNode.x, firstNode.y);
    const lastNode = tube.nodes[tube.nodes.length - 1];
    const lastPoint = this.tileToScreen(lastNode.x, lastNode.y);

    // Arrows
    tube.input.arrow.SetPosition(
      addPoints(firstPoint, new Point(-70, 0)),
      addPoints(firstPoint, new Point(-25, 0))
    );
    tube.output.arrow.SetPosition(
      addPoints(lastPoint, new Point(25, 0)),
      addPoints(lastPoint, new Point(70, 0))
    );

    // Measures
    const inspectingNode = Math.floor(this.state.inspectingPosition / 2 + 0.5);
    const inspectingSide = this.state.inspectingPosition % 2;
    let inspectingGraphPos = addPoints(graph.bottomLeft, new Point(0, 25));
    if (inspectingNode >= tube.nodes.length) {
      inspectingGraphPos = addPoints(graph.bottomRight, new Point(0, 25));
    }
    var newData = {
      velocity: 0,
      diameter: 0,
      pressure: 0,
      kinetic: 0,
      height: 0,
      potential: 0,
      total: 0,
      piezometric: 0,
    };

    let tubePath = [];
    let tubeWidths = [];
    let tubeRoughnesses = [];

    let totalDistance = 0;
    let previousPoint = firstPoint;
    let distances = [];
    let heights = [];
    for (let i = 0; i < tube.nodes.length; i++) {
      const newPoint = this.tileToScreen(tube.nodes[i].x, tube.nodes[i].y);
      const dist = subPoints(newPoint, previousPoint).length;
      totalDistance += dist;
      distances.push(totalDistance);
      const height =
        (view.center.y + board.height / 2 + board.offsety - newPoint.y) /
        metersToPixels;
      heights.push(height);
      previousPoint = newPoint;
    }

    // First tube point
    /*tubePath.push(firstPoint);
    tubeWidths.push(firstNode.diameterBefore * pipeWidthMultiplier);
    tubeRoughnesses.push(firstNode.roughnessBefore);*/
    // First graph points
    this.addEnergyLinePoints(
      0,
      this.heightToPotential(heights[0]),
      this.velocityToKinetic(
        this.diameterToVelocity(tube.nodes[0].diameterBefore)
      ),
      pressureEnergy
    );

    for (let i = 0; i < tube.nodes.length; i++) {
      const point = this.tileToScreen(tube.nodes[i].x, tube.nodes[i].y);

      // Tubes
      tube.nodes[i].shape.position = point;
      tubePath.push(point);
      tubeWidths.push(tube.nodes[i].diameterBefore * pipeWidthMultiplier);
      tubeRoughnesses.push(tube.nodes[i].roughnessBefore);
      tubePath.push(point);
      tubeWidths.push(tube.nodes[i].diameterAfter * pipeWidthMultiplier);
      tubeRoughnesses.push(tube.nodes[i].roughnessAfter);

      // Variables
      const dBefore = tube.nodes[i].diameterBefore;
      const dAfter = tube.nodes[i].diameterAfter;
      const vBefore = this.diameterToVelocity(dBefore);
      const vAfter = this.diameterToVelocity(dAfter);
      const rBefore = tube.nodes[i].roughnessBefore;
      const rAfter = tube.nodes[i].roughnessAfter;

      // Energies
      let distance = 0;
      if (i > 0) {
        distance = distances[i] - distances[i - 1];
      }

      let previousHeight = heights[i];
      if (i > 0) {
        previousHeight = heights[i - 1];
      }
      const pressureEnergyBeforeSegment = pressureEnergy;
      pressureEnergy -= this.segmentPressureDelta(
        distance / metersToPixels,
        vBefore,
        dBefore,
        rBefore,
        heights[i] - previousHeight
      );
      const pressureEnergyBeforeNode = pressureEnergy;

      potentialEnergy = this.heightToPotential(heights[i]);
      kineticEnergy = this.velocityToKinetic(vBefore);

      // Graph point pre-node
      this.addEnergyLinePoints(
        distances[i] / totalDistance,
        potentialEnergy,
        kineticEnergy,
        pressureEnergy
      );

      // After node:
      if (tube.nodes[i].isPump) {
        pressureEnergy += tube.nodes[i].pumpPower;
      }
      const delta = this.nodePressureDelta(tube.nodes[i].k, vBefore, vAfter);
      pressureEnergy += delta;
      const pressureEnergyAfterNode = pressureEnergy;
      // Graph point post-node
      kineticEnergy = this.velocityToKinetic(vAfter);
      this.addEnergyLinePoints(
        distances[i] / totalDistance,
        potentialEnergy,
        kineticEnergy,
        pressureEnergy
      );

      let graphShapePos = new Point(
        lerp(
          graph.bottomLeft.x,
          graph.bottomRight.x,
          distances[i] / totalDistance
        ),
        graph.bottomLeft.y + 20
      );

      if (i == inspectingNode) {
        inspectingGraphPos = graphShapePos;
      }

      // Measures
      // Measuring entrance
      if (inspectingNode == -1 && i == 0) {
        newData.diameter = dBefore;
        newData.velocity = vBefore;
        newData.height = heights[i];
        newData.potential = this.heightToPotential(heights[i]);
        newData.pressure = pressureEnergyBeforeSegment;
        newData.kinetic = this.velocityToKinetic(vBefore);
      }
      // Measuring exit
      if (inspectingNode == tube.nodes.length && i == tube.nodes.length - 1) {
        newData.diameter = dAfter;
        newData.velocity = vAfter;
        newData.height = heights[i];
        newData.potential = this.heightToPotential(heights[i]);
        newData.pressure = pressureEnergyAfterNode;
        newData.kinetic = this.velocityToKinetic(vAfter);
      }
      // Measuring this node
      if (i == inspectingNode) {
        if (inspectingSide == 1) {
          // Before
          newData.diameter = dBefore;
          newData.velocity = vBefore;
          newData.pressure = pressureEnergyBeforeNode;
          newData.kinetic = this.velocityToKinetic(vBefore);
        } else {
          // After
          newData.diameter = dAfter;
          newData.velocity = vAfter;
          newData.pressure = pressureEnergyAfterNode;
          newData.kinetic = this.velocityToKinetic(vAfter);
        }
        newData.height = heights[i];
        newData.potential = this.heightToPotential(heights[i]);
      }

      tube.nodes[i].graphShape.position = graphShapePos;
      tube.nodes[i].graphLine.segments[0].point = graphShapePos;
      tube.nodes[i].graphLine.segments[1].point = graphShapePos;
      tube.nodes[i].graphLine.segments[1].point.y = graph.topLeft.y;
    }

    // Last point
    /*tubePath.push(lastPoint);
    tubeWidths.push(lastNode.diameterAfter * metersToPixels);
    tubeRoughnesses.push(lastNode.roughnessAfter);*/

    const linePath = this.getVariableRoughWidthPath(
      tubePath,
      tubeWidths,
      tubeRoughnesses
    );
    for (let i = 0; i < linePath.length; i++) {
      tube.line.add(linePath[i]);
    }
    this.addEnergyLinePoints(
      distances[tube.nodes.length - 1] / totalDistance,
      potentialEnergy,
      kineticEnergy,
      pressureEnergy
    );
    this.addEnergyLinePoints(1, potentialEnergy, kineticEnergy, pressureEnergy);

    if (this.state.selectedNode != null) {
      selectedNodeShape.position = this.tileToScreen(
        this.state.selectedNode.x,
        this.state.selectedNode.y
      );
    }

    const direction = inspectingSide * 2 - 1;
    graph.inspectingArrow.SetPosition(
      addPoints(inspectingGraphPos, new Point(-50 * direction, 50)),
      addPoints(inspectingGraphPos, new Point(-15 * direction, 15))
    );

    graph.xAxisText.content =
      "Longitud de la tubería\n" + Math.round(totalDistance * 10) / 10 + "m";

    newData.piezometric = newData.pressure + newData.potential;
    newData.total = newData.kinetic + newData.pressure + newData.potential;
    this.setState({ inspectedData: newData });
  }

  segmentPressureDelta(length, velocity, diameter, rugosity, deltah) {
    if (velocity == 0) return deltah;
    const rugosityInMeters = rugosity / 1000;
    const re =
      (velocity * diameter * this.state.density) / this.state.viscosity;
    const aux =
      1.8 *
      Math.log10(
        Math.pow(rugosityInMeters / (diameter * 3.7), 1.11) + 6.9 / re
      );
    const ft = 1 / (aux * aux);

    const pressureFall =
      ((ft * length) / diameter) *
      0.5 *
      this.state.density *
      velocity *
      velocity;

    const deltaP = this.heightToPotential(deltah);

    //return pressureFall;
    return deltaP + pressureFall / (this.state.density * this.state.gravity);
  }

  nodePressureDelta(k, inputVelocity, outputVelocity) {
    const maxVel = Math.max(inputVelocity, outputVelocity);
    const pressureFall = k * 0.5 * this.state.density * maxVel * maxVel;
    //return pressureFall;
    return -pressureFall / (this.state.density * this.state.gravity);
  }

  heightToPotential(h) {
    //return this.state.density * this.state.gravity * h;
    return h;
  }

  diameterToVelocity(d) {
    const area = Math.PI * (d * d) * 0.25;
    //return this.state.flow / area;
    return this.state.flow / area;
  }

  velocityToKinetic(v) {
    //return 0.5 * this.state.density * v * v;
    return (
      (0.5 * this.state.density * v * v) /
      (this.state.density * this.state.gravity)
    );
  }

  addEnergyLinePoints(percentage, potential, kinetic, pressure) {
    const x = lerp(graph.bottomLeft.x, graph.bottomRight.x, percentage);
    const maxEnergy = graph.maxEnergy;
    const poty = lerp(
      graph.bottomLeft.y,
      graph.topLeft.y,
      potential / maxEnergy
    );
    const kiny = lerp(graph.bottomLeft.y, graph.topLeft.y, kinetic / maxEnergy);
    const prey = lerp(
      graph.bottomLeft.y,
      graph.topLeft.y,
      pressure / maxEnergy
    );
    const piezometricy = lerp(
      graph.bottomLeft.y,
      graph.topLeft.y,
      (pressure + potential) / maxEnergy
    );
    const totaly = lerp(
      graph.bottomLeft.y,
      graph.topLeft.y,
      (pressure + potential + kinetic) / maxEnergy
    );
    graph.potentialEnergyLine.add(new Point(x, poty));
    graph.kineticEnergyLine.add(new Point(x, kiny));
    graph.pressureEnergyLine.add(new Point(x, prey));
    graph.piezometricEnergyLine.add(new Point(x, piezometricy));
    graph.totalEnergyLine.add(new Point(x, totaly));
  }

  tileToScreen(x, y) {
    const tileSize = new Point(
      board.width / board.xtiles,
      board.height / board.ytiles
    );
    const boardCorner = addPoints(
      view.center,
      new Point(
        -board.width / 2 + board.offsetx,
        -board.height / 2 + board.offsety
      )
    );
    let worldPos = addPoints(
      new Point(
        x * tileSize.x + tileSize.x / 2,
        y * tileSize.y + tileSize.y / 2
      ),
      boardCorner
    );
    return worldPos;
  }

  canvasFunction() {
    const center = view.center;

    const background = new Path.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    board.tiles = [];
    const tileSize = new Point(
      board.width / board.xtiles,
      board.height / board.ytiles
    );
    for (let x = 0; x < board.xtiles; x++) {
      board.tiles[x] = [];
      for (let y = 0; y < board.ytiles; y++) {
        let tilePos = this.tileToScreen(x, y);
        let newTile = {
          shape: new Shape.Rectangle(
            new Rectangle(
              tilePos.x - tileSize.x / 2,
              tilePos.y - tileSize.y / 2,
              tileSize.x,
              tileSize.y
            )
          ),
          node: null,
        };
        newTile.shape.style = {
          strokeColor: "#bbb",
          fillColor: "#ddd",
        };
        newTile.shape.onMouseDown = () => this.onTileClicked(x, y);
        newTile.shape.onMouseEnter = () => this.onTileEntered(x, y);
        board.tiles[x][y] = newTile;
      }
    }

    graph.topLeft = addPoints(
      view.center,
      new Point(
        -graph.width / 2 + graph.offsetx,
        -graph.height / 2 + graph.offsety
      )
    );
    graph.bottomLeft = addPoints(
      view.center,
      new Point(
        -graph.width / 2 + graph.offsetx,
        graph.height / 2 + graph.offsety
      )
    );
    graph.topRight = addPoints(
      view.center,
      new Point(
        graph.width / 2 + graph.offsetx,
        -graph.height / 2 + graph.offsety
      )
    );
    graph.bottomRight = addPoints(
      view.center,
      new Point(
        graph.width / 2 + graph.offsetx,
        graph.height / 2 + graph.offsety
      )
    );
    let graphShape = new Shape.Rectangle(
      graph.topLeft,
      new Size(graph.width, graph.height)
    );
    graphShape.style = {
      fillColor: "#eee",
    };
    new VectorArrow(
      graph.bottomLeft,
      graph.topLeft,
      "black",
      5,
      12,
      30,
      false,
      false
    );
    new VectorArrow(
      graph.bottomLeft,
      graph.bottomRight,
      "black",
      5,
      12,
      30,
      false,
      false
    );

    tube.input.arrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "black",
      10,
      10,
      15,
      false,
      false
    );
    tube.output.arrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "black",
      10,
      10,
      15,
      false,
      false
    );

    graph.pressureEnergyLine = new Path();
    graph.pressureEnergyLine.style = {
      strokeWidth: 5,
      strokeColor: "#f40",
    };
    graph.kineticEnergyLine = new Path();
    graph.kineticEnergyLine.style = {
      strokeWidth: 5,
      strokeColor: "#2a5",
    };
    graph.potentialEnergyLine = new Path();
    graph.potentialEnergyLine.style = {
      strokeWidth: 5,
      strokeColor: "#27b",
    };
    graph.piezometricEnergyLine = new Path();
    graph.piezometricEnergyLine.style = {
      strokeWidth: 5,
      strokeColor: "#94b",
    };
    graph.totalEnergyLine = new Path();
    graph.totalEnergyLine.style = {
      strokeWidth: 5,
      strokeColor: "#000",
    };
    graph.yAxisText = new PointText({
      point: addPoints(graph.topLeft, new Point(-20, 20)),
      content: "Energía - " + graph.maxEnergy + "m",
      justification: "right",
      fontSize: 20,
    });
    graph.xAxisText = new PointText({
      point: addPoints(graph.bottomRight, new Point(0, 50)),
      content: "Longitud de tubería\n" + tube.totalDistance + "m",
      fontSize: 20,
    });

    selectedNodeShape = new Shape.Circle(new Point(0, 0), 40);
    selectedNodeShape.style = {
      strokeColor: "#2b4",
      strokeWidth: 10,
    };
    selectedNodeShape.locked = true;
    selectedNodeShape.visible = false;

    graph.inspectingArrow = new VectorArrow(
      new Point(0, 0),
      new Point(0, 0),
      "#808",
      6,
      9,
      14,
      false,
      false
    );

    let newState = { ...this.state };
    newState.background.shape = background;
    newState.ready = true;
    this.setState(newState);

    /*view.onFrame = (event) => {
      this.update(event.delta);
    };*/

    view.onMouseDrag = (event) => {
      this.onMouseDrag(event);
    };

    view.onMouseUp = (event) => {
      this.onMouseUp(event);
    };

    window.addEventListener(
      "resize",
      (event) => {
        // Update
      },
      true
    );

    tube.line = new Path();
    tube.line.style = {
      fillColor: "black",
    };
    tube.line.locked = false;
    tube.nodes = [];
    this.newNode(4, 4, 0);
    this.newNode(4, 2, 1);
    this.makePump(this.newNode(8, 2, 2));
    this.newNode(12, 2, 3);
    this.newNode(12, 0, 4);
    this.updatePipe();
    ready = true;
  }

  getVariableRoughWidthPath(positions, widths, roughness) {
    let points = [];
    let backPoints = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const forward = subPoints(positions[i], positions[i + 1]);
      const distance = forward.length;
      forward.length = 1;
      const right = new Point(forward.y, -forward.x);

      const subSegments = distance / 7;
      let currentPosition = new Point(positions[i].x, positions[i].y);
      for (let j = 0; j < subSegments; j++) {
        const offset =
          ((j % 2) * 2 - 1) * Math.min(roughness[i] * 5, widths[i]);
        const stepDistance = -distance / subSegments;
        const stepVector = mulPoint(forward, stepDistance);
        const nextPosition = addPoints(currentPosition, stepVector);
        points.push(
          addPoints(currentPosition, mulPoint(right, widths[i] + offset + 3))
        );
        /*points.push(
          addPoints(nextPosition, mulPoint(right, widths[i + 1] + offset))
        );*/
        backPoints.push(
          addPoints(currentPosition, mulPoint(right, -widths[i] - offset - 3))
        );
        /*backPoints.push(
          addPoints(nextPosition, mulPoint(right, -widths[i + 1] - offset))
        );*/
        currentPosition = nextPosition;
      }
    }
    for (let i = backPoints.length - 1; i >= 0; i--) {
      points.push(backPoints[i]);
    }
    return points;
  }

  getVariableWidthPath(positions, widths) {
    let points = [];
    let backPoints = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const forward = subPoints(positions[i], positions[i + 1]);
      forward.length = 1;
      const right = new Point(forward.y, -forward.x);
      points.push(addPoints(positions[i], mulPoint(right, widths[i])));
      points.push(addPoints(positions[i + 1], mulPoint(right, widths[i + 1])));
      backPoints.push(addPoints(positions[i], mulPoint(right, -widths[i])));
      backPoints.push(
        addPoints(positions[i + 1], mulPoint(right, -widths[i + 1]))
      );
    }
    for (let i = backPoints.length - 1; i >= 0; i--) {
      points.push(backPoints[i]);
    }
    return points;
  }

  removeAllNodes() {
    this.deselectNode();
    for (let i = 0; i < tube.nodes.length; i++) {
      tube.nodes[i].shape.remove();
      tube.nodes[i].graphShape.remove();
      tube.nodes[i].graphLine.remove();
    }
    tube.nodes = [];
  }

  getParameterCode() {
    let module = "L";
    let codeVersion = "1";
    let list = [
      module,
      codeVersion,
      this.state.flow,
      this.state.pressure,
      this.state.viscosity,
    ];
    for (let i = 0; i < tube.nodes.length; i++) {
      const node = tube.nodes[i];
      list.push(
        node.x,
        node.y,
        node.isPump ? 1 : 0,
        node.pumpPower,
        node.diameterBefore,
        node.diameterAfter,
        node.roughnessBefore,
        node.roughnessAfter,
        node.k
      );
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
      this.removeAllNodes();
      let flow = parseFloat(split[2]);
      let pressure = parseFloat(split[3]);
      let viscosity = parseFloat(split[4]);

      let serializedNodes = split.splice(5);
      for (let i = 0; i < serializedNodes.length; i += 9) {
        let x = parseInt(serializedNodes[i]);
        let y = parseInt(serializedNodes[i + 1]);
        let isPump = parseInt(serializedNodes[i + 2]) == 1;
        let pumpPower = parseFloat(serializedNodes[i + 3]);
        let diameterBefore = parseFloat(serializedNodes[i + 4]);
        let diameterAfter = parseFloat(serializedNodes[i + 5]);
        let roughnessBefore = parseFloat(serializedNodes[i + 6]);
        let roughnessAfter = parseFloat(serializedNodes[i + 7]);
        let k = parseFloat(serializedNodes[i + 8]);
        let createdNode = this.newNode(x, y, i);
        createdNode.pumpPower = pumpPower;
        if (isPump) {
          this.makePump(createdNode);
        }
        createdNode.diameterBefore = diameterBefore;
        createdNode.diameterAfter = diameterAfter;
        createdNode.roughnessBefore = roughnessBefore;
        createdNode.roughnessAfter = roughnessAfter;
        createdNode.k = k;
      }

      this.setState({ flow, pressure, viscosity }, () => {
        loading = false;
        this.updatePipe();
      });
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Flujo interno por conducto"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              <Grid item xs={12}>
                <SliderWithInput
                  label="Caudal"
                  value={this.state.flow}
                  step={0.001}
                  min={0}
                  max={0.1}
                  unit="m³/s"
                  onChange={(e) => this.onFlowChanged(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Presión de entrada"
                  value={this.state.pressure}
                  step={0.1}
                  min={10}
                  max={100}
                  unit="m"
                  onChange={(e) => this.onPressureChanged(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <SliderWithInput
                  label="Viscosidad"
                  value={this.state.viscosity}
                  step={0.0001}
                  min={0.0001}
                  max={0.1}
                  unit="Pa∙s"
                  onChange={(e) => this.onViscosityChanged(e)}
                ></SliderWithInput>
              </Grid>
              <Grid item xs={12}>
                <ModuleAccordion title="Medición de energías">
                  <Grid container spacing={4}>
                    <Grid item xs={12}>
                      <Typography fontWeight="bold">
                        Punto de medición: {this.state.inspectingPosition}
                      </Typography>
                    </Grid>
                    <Grid item xs={7}>
                      <Typography>
                        🟩 Energía cinética:{" "}
                        {Math.round(this.state.inspectedData.kinetic * 1000) /
                          1000 +
                          " m"}
                      </Typography>
                      <Typography>
                        🟧 Energía de presión:{" "}
                        {Math.round(this.state.inspectedData.pressure * 1000) /
                          1000 +
                          " m"}
                      </Typography>
                      <Typography>
                        🟦 Energía potencial gravitatoria:{" "}
                        {Math.round(this.state.inspectedData.potential * 1000) /
                          1000 +
                          " m"}
                      </Typography>
                      <Typography>
                        🟪 Energía piezométrica:{" "}
                        {Math.round(
                          this.state.inspectedData.piezometric * 1000
                        ) /
                          1000 +
                          " m"}
                      </Typography>
                      <Typography>
                        ⬛ Energía total:{" "}
                        {Math.round(this.state.inspectedData.total * 1000) /
                          1000 +
                          " m"}
                      </Typography>
                    </Grid>
                    <Grid item xs={5}>
                      <Typography>
                        Velocidad:{" "}
                        {Math.round(
                          this.state.inspectedData.velocity * 1000000
                        ) /
                          1000000 +
                          " m/s"}
                      </Typography>
                      <Typography>
                        Diámetro:
                        {this.state.inspectedData.diameter + " m"}
                      </Typography>
                      <Typography>
                        Altura: {this.state.inspectedData.height + " m"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <MyTooltip
                        title="Medir punto anterior"
                        disableInteractive
                      >
                        <span>
                          <Button
                            fullWidth
                            variant="contained"
                            disabled={this.state.inspectingPosition == 0}
                            onClick={() => this.inspectPrevious()}
                          >
                            <ArrowBack></ArrowBack>
                          </Button>
                        </span>
                      </MyTooltip>
                    </Grid>
                    <Grid item xs={6}>
                      <MyTooltip
                        title="Medir punto siguiente"
                        disableInteractive
                      >
                        <span>
                          <Button
                            fullWidth
                            variant="contained"
                            disabled={
                              this.state.inspectingPosition ==
                              (tube.nodes.length - 1) * 2
                            }
                            onClick={() => this.inspectNext()}
                          >
                            <ArrowForward></ArrowForward>
                          </Button>
                        </span>
                      </MyTooltip>
                    </Grid>
                  </Grid>
                </ModuleAccordion>
              </Grid>
              <Grid item xs={12}>
                {(this.state.selectedNode == null && (
                  <PanelModule>
                    <Typography>
                      Haz click en un nodo de la tubería para seleccionarlo
                    </Typography>
                  </PanelModule>
                )) || (
                  <PanelModule>
                    <Typography sx={{ fontWeight: "bold" }}>
                      Nodo seleccionado:
                    </Typography>
                    <MyTooltip title="Añadir nodo antes">
                      <span>
                        <Button
                          variant="contained"
                          sx={{ margin: "10px" }}
                          disabled={!this.canAddBefore()}
                          onClick={() => this.addNodeBefore()}
                        >
                          <ArrowLeft></ArrowLeft>
                          <AddCircle></AddCircle>
                        </Button>
                      </span>
                    </MyTooltip>
                    <MyTooltip title="Añadir nodo después">
                      <span>
                        <Button
                          variant="contained"
                          sx={{ margin: "10px" }}
                          disabled={!this.canAddAfter()}
                          onClick={() => this.addNodeAfter()}
                        >
                          <AddCircle></AddCircle>
                          <ArrowRight></ArrowRight>
                        </Button>
                      </span>
                    </MyTooltip>
                    {(this.state.selectedNodeIsPump && (
                      <MyTooltip title="Remover bomba">
                        <Button
                          variant="contained"
                          sx={{ margin: "10px" }}
                          color="secondary"
                          onClick={() => this.removePump()}
                        >
                          <Block></Block>
                        </Button>
                      </MyTooltip>
                    )) || (
                      <MyTooltip title="Colocar bomba">
                        <Button
                          variant="contained"
                          sx={{ margin: "10px" }}
                          color="success"
                          onClick={() => this.makePump(this.state.selectedNode)}
                        >
                          <Settings></Settings>
                        </Button>
                      </MyTooltip>
                    )}
                    <MyTooltip title="Deseleccionar">
                      <Button
                        variant="contained"
                        sx={{ margin: "10px" }}
                        onClick={() => this.deselectNode()}
                      >
                        <Deselect></Deselect>
                      </Button>
                    </MyTooltip>
                    <MyTooltip title="Borrar">
                      <span>
                        <Button
                          variant="contained"
                          color="error"
                          sx={{ margin: "10px" }}
                          onClick={() => this.deleteNode()}
                          disabled={tube.nodes.length <= 1}
                        >
                          <Backspace></Backspace>
                        </Button>
                      </span>
                    </MyTooltip>
                    <Box sx={{ marginTop: "30px" }}></Box>
                    <Collapse in={this.state.selectedNodeIsPump}>
                      <SliderWithInput
                        label="ΔP de la bomba"
                        value={this.state.pumpPower}
                        step={0.1}
                        min={0}
                        max={100}
                        unit="m"
                        onChange={(e) => this.onPumpPowerChanged(e)}
                      ></SliderWithInput>
                    </Collapse>
                    <SliderWithInput
                      label="Factor de pérdida"
                      value={this.state.k}
                      step={0.01}
                      min={0}
                      max={1}
                      onChange={(e) => this.onKChanged(e)}
                    ></SliderWithInput>
                    <Collapse in={this.state.selectedNode.index > 0}>
                      <Typography sx={{ fontWeight: "bold" }}>
                        Segmento anterior:
                      </Typography>
                      <SliderWithInput
                        label="Diámetro"
                        value={this.state.diameterBefore}
                        step={0.002}
                        min={0.05}
                        max={0.5}
                        unit="m"
                        onChange={(e) => this.onDiameterBeforeChanged(e)}
                      ></SliderWithInput>
                      <SliderWithInput
                        label="Rugosidad"
                        value={this.state.roughnessBefore}
                        step={0.01}
                        min={0}
                        max={1}
                        unit="mm"
                        onChange={(e) => this.onRoughnessBeforeChanged(e)}
                      ></SliderWithInput>
                    </Collapse>
                    <Collapse
                      in={this.state.selectedNode.index < tube.nodes.length - 1}
                    >
                      <Typography sx={{ fontWeight: "bold" }}>
                        Segmento posterior:
                      </Typography>
                      <SliderWithInput
                        label="Diametro"
                        value={this.state.diameterAfter}
                        step={0.002}
                        min={0.05}
                        max={0.5}
                        unit="m"
                        onChange={(e) => this.onDiameterAfterChanged(e)}
                      ></SliderWithInput>
                      <SliderWithInput
                        label="Rugosidad"
                        value={this.state.roughnessAfter}
                        step={0.01}
                        min={0}
                        max={1}
                        unit="mm"
                        onChange={(e) => this.onRoughnessAfterChanged(e)}
                      ></SliderWithInput>
                    </Collapse>
                  </PanelModule>
                )}
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

export default Modulo12FlujoInternoPorConducto;

import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";

import { Box, Button, Collapse, Grid, Typography } from "@mui/material";
import { view, Point, Path, Shape, Size, Rectangle } from "paper";
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
  ArrowLeft,
  ArrowRight,
  Backspace,
  Block,
  Deselect,
  Settings,
} from "@mui/icons-material";
import MyTooltip from "../components/MyTooltip";

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
};
let board = {
  width: 850,
  height: 450,
  offsetx: 0,
  offsety: -150,
  xtiles: 17,
  ytiles: 9,
  tiles: null,
};
let graph = {
  width: 850,
  height: 250,
  offsetx: 0,
  offsety: 225,
  topLeft: null,
  bottomLeft: null,
  topRight: null,
  bottomRight: null,
  kineticEnergyLine: null,
  pressureEnergyLine: null,
  potentialEnergyLine: null,
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
    diameter: 10,
  };

  onPumpPowerChanged = (newValue) => {
    this.state.selectedNode.pumpPower = newValue;
    this.setState({ pumpPower: newValue });
    this.updatePipe();
  };

  onDiameterChanged = (newValue) => {
    this.state.selectedNode.diameter = newValue;
    this.setState({ diameter: newValue });
    this.updatePipe();
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
      diameter: node.diameter,
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

  makePump(node, power) {
    node.isPump = true;
    node.shape.radius = 30;
    node.shape.fillColor = "#2af";
    node.graphShape.radius = 15;
    node.graphShape.fillColor = "#2af";
    node.pumpPower = power;
    this.setState({ selectedNodeIsPump: true });
  }

  removePump() {
    this.state.selectedNode.isPump = false;
    this.state.selectedNode.shape.radius = 18;
    this.state.selectedNode.shape.fillColor = "#666";
    this.state.selectedNode.graphShape.radius = 9;
    this.state.selectedNode.graphShape.fillColor = "#666";
    this.setState({ selectedNodeIsPump: false });
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
    let createdNode = {
      x: x,
      y: y,
      shape: shape,
      graphShape: graphShape,
      graphLine: graphLine,
      index: index,
      isPump: false,
      pumpPower: 0,
      diameter: 50,
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
    var pressureEnergy = 0;
    var kineticEnergy = 0;
    var potentialEnergy = 0;

    tube.line.removeSegments();
    graph.kineticEnergyLine.removeSegments();
    graph.potentialEnergyLine.removeSegments();
    graph.pressureEnergyLine.removeSegments();
    const firstNode = tube.nodes[0];
    const firstPoint = this.tileToScreen(-1, firstNode.y);
    const lastNode = tube.nodes[tube.nodes.length - 1];
    const lastPoint = this.tileToScreen(board.xtiles, lastNode.y);

    let tubePath = [];
    let tubeWidths = [];

    let addedPressure = 0;

    let totalDistance = 0;
    let previousPoint = firstPoint;
    let distances = [];
    let heights = [];
    for (let i = 0; i < tube.nodes.length; i++) {
      const newPoint = this.tileToScreen(tube.nodes[i].x, tube.nodes[i].y);
      const dist = subPoints(newPoint, previousPoint).length;
      totalDistance += dist;
      distances.push(totalDistance);
      heights.push(
        view.center.y + board.height / 2 + board.offsety - newPoint.y
      );
      previousPoint = newPoint;
    }
    const dist = subPoints(
      this.tileToScreen(lastNode.x, lastNode.y),
      this.tileToScreen(board.xtiles, lastNode.y)
    ).length;
    totalDistance += dist;
    distances.push(totalDistance);

    // First tube point
    tubePath.push(firstPoint);
    tubeWidths.push(firstNode.diameter / 5);
    // First graph points
    this.addEnergyLinePoints(
      0,
      this.heightToEnergy(heights[0]),
      this.diameterToKinetic(tube.nodes[0].diameter),
      this.diameterToPressure(tube.nodes[0].diameter)
    );

    for (let i = 0; i < tube.nodes.length; i++) {
      const point = this.tileToScreen(tube.nodes[i].x, tube.nodes[i].y);

      // Tubes
      tube.nodes[i].shape.position = point;
      tubePath.push(point);
      tubeWidths.push(tube.nodes[i].diameter / 5);

      // Energies
      potentialEnergy = this.heightToEnergy(heights[i]);
      kineticEnergy = this.diameterToKinetic(tube.nodes[i].diameter);
      pressureEnergy =
        this.diameterToPressure(tube.nodes[i].diameter) + addedPressure;

      // Graph
      this.addEnergyLinePoints(
        distances[i] / totalDistance,
        potentialEnergy,
        kineticEnergy,
        pressureEnergy
      );

      if (tube.nodes[i].isPump) {
        addedPressure += tube.nodes[i].pumpPower * 3;
        pressureEnergy =
          this.diameterToPressure(tube.nodes[i].diameter) + addedPressure;
        this.addEnergyLinePoints(
          distances[i] / totalDistance,
          potentialEnergy,
          kineticEnergy,
          pressureEnergy
        );
      }

      let graphShapePos = new Point(
        lerp(
          graph.bottomLeft.x,
          graph.bottomRight.x,
          distances[i] / totalDistance
        ),
        graph.bottomLeft.y + 20
      );
      tube.nodes[i].graphShape.position = graphShapePos;
      tube.nodes[i].graphLine.segments[0].point = graphShapePos;
      tube.nodes[i].graphLine.segments[1].point = graphShapePos;
      tube.nodes[i].graphLine.segments[1].point.y = graph.topLeft.y;
    }

    // Last point
    tubePath.push(lastPoint);
    tubeWidths.push(lastNode.diameter / 5);
    const linePath = this.getVariableWidthPath(tubePath, tubeWidths);
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
  }

  heightToEnergy(h) {
    return h * 2;
  }

  diameterToKinetic(d) {
    return 50 + 5 * d;
  }

  diameterToPressure(d) {
    return 800 - 5 * d;
  }

  addEnergyLinePoints(percentage, potencial, kinetic, pressure) {
    const x = lerp(graph.bottomLeft.x, graph.bottomRight.x, percentage);
    const maxEnergy = 1000;
    const poty = lerp(
      graph.bottomLeft.y,
      graph.topLeft.y,
      potencial / maxEnergy
    );
    const kiny = lerp(graph.bottomLeft.y, graph.topLeft.y, kinetic / maxEnergy);
    const prey = lerp(
      graph.bottomLeft.y,
      graph.topLeft.y,
      pressure / maxEnergy
    );
    graph.potentialEnergyLine.add(new Point(x, poty));
    graph.kineticEnergyLine.add(new Point(x, kiny));
    graph.pressureEnergyLine.add(new Point(x, prey));
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
      fillColor: "#bbb",
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
      strokeColor: "#248",
    };

    selectedNodeShape = new Shape.Circle(new Point(0, 0), 40);
    selectedNodeShape.style = {
      strokeColor: "#2b4",
      strokeWidth: 10,
    };
    selectedNodeShape.locked = true;
    selectedNodeShape.visible = false;

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
    this.newNode(4, 7, 0);
    this.newNode(4, 4, 1);
    this.makePump(this.newNode(8, 4, 2), 10);
    this.newNode(12, 4, 3);
    this.newNode(12, 1, 4);
    this.updatePipe();
    ready = true;
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

  getParameterCode() {
    let module = "X";
    let codeVersion = "1";
    return [module, codeVersion].join(";");
  }

  loadParameterCode(code) {
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    if (codeVersion == 1) {
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
                {(this.state.selectedNode == null && (
                  <PanelModule>
                    <Typography>
                      Haz click en un nodo de la tubería para seleccionarlo
                    </Typography>
                  </PanelModule>
                )) || (
                  <PanelModule>
                    <Typography>Nodo seleccionado:</Typography>
                    <MyTooltip title="Añadir nodo antes">
                      <Button
                        variant="contained"
                        sx={{ margin: "10px" }}
                        disabled={!this.canAddBefore()}
                        onClick={() => this.addNodeBefore()}
                      >
                        <ArrowLeft></ArrowLeft>
                        <AddCircle></AddCircle>
                      </Button>
                    </MyTooltip>
                    <MyTooltip title="Añadir nodo después">
                      <Button
                        variant="contained"
                        sx={{ margin: "10px" }}
                        disabled={!this.canAddAfter()}
                        onClick={() => this.addNodeAfter()}
                      >
                        <AddCircle></AddCircle>
                        <ArrowRight></ArrowRight>
                      </Button>
                    </MyTooltip>
                    <MyTooltip title="Deseleccionar">
                      <Button
                        variant="contained"
                        sx={{ margin: "10px" }}
                        onClick={() => this.deselectNode()}
                      >
                        <Deselect></Deselect>
                      </Button>
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

                    <Box sx={{ marginTop: "30px" }}></Box>
                    <SliderWithInput
                      label="Diametro del tubo"
                      value={this.state.diameter}
                      step={1}
                      min={10}
                      max={100}
                      onChange={(e) => this.onDiameterChanged(e)}
                    ></SliderWithInput>
                    <Collapse in={this.state.selectedNodeIsPump}>
                      <SliderWithInput
                        label="Potencia de la bomba"
                        value={this.state.pumpPower}
                        step={1}
                        min={10}
                        max={100}
                        onChange={(e) => this.onPumpPowerChanged(e)}
                      ></SliderWithInput>
                    </Collapse>
                    <br></br>
                    <MyTooltip title="Borrar">
                      <Button
                        variant="contained"
                        color="error"
                        sx={{ margin: "10px" }}
                        onClick={() => this.deleteNode()}
                        disabled={tube.nodes.length <= 1}
                      >
                        <Backspace></Backspace>
                      </Button>
                    </MyTooltip>
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

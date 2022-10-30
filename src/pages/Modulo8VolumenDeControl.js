import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import CVPipe from "../components/Pipe";
import AddIcon from "@mui/icons-material/Add";
import { MathComponent } from "mathjax-react";
import EquationReferences from "../components/EquationReferences";

import { Button } from "@mui/material";
import { Grid } from "@mui/material";
import {
  view,
  Point,
  Size,
  Shape,
  Group,
  Rectangle,
  PointText,
  project,
} from "paper";
import SliderWithInput from "../components/SliderWithInput";
import {
  addPoints,
  CoordinateReference,
  ScrollingRectangle,
  VectorArrow,
} from "../paperUtility";
import ModuleAccordion from "../components/ModuleAccordion";

let loading = false;

const pipeLength = 100;
const pipeStroke = 4;
const velocityToPixels = 10;

let totalForceArrow;
let verticalForceArrow;
let horizontalForceArrow;

class Modulo8VolumenDeControl extends Component {
  state = {
    background: {
      shape: null,
    },
    ready: false,
    volume: {
      radius: 200,
      outlineShape: null,
      fillShape: null,
    },
    showingForces: false,
    density: 10,
    pipes: [],
  };

  update(delta) {
    for (let i = 0; i < this.state.pipes.length; i++) {
      this.state.pipes[i].scrollingRectangle.update(delta);
    }
  }

  toggleShowingForcesChange(event) {
    const showingForces = !this.state.showingForces;
    totalForceArrow.setVisible(showingForces);
    horizontalForceArrow.setVisible(showingForces);
    verticalForceArrow.setVisible(showingForces);
    this.setState({ showingForces: showingForces }, this.updateAllPipes);
  }

  handleAddPipe() {
    var newState = { ...this.state };
    var locked = false;
    if (this.state.pipes.length >= 1) {
      locked = true;
    }
    newState.pipes.push(this.createNewPipe(0, 50, locked));
    this.setState(newState, () => {
      this.state.volume.fillShape.bringToFront();
      this.updateAllPipes();
    });
  }

  handleAngleChange(newValue, pipeID) {
    var newState = { ...this.state };
    newState.pipes[pipeID].angle = newValue;
    this.setState(newState, this.updateAllPipes);
  }

  handleVelocityChange(newValue, pipeID) {
    var newState = { ...this.state };
    newState.pipes[pipeID].velocity = newValue;
    this.setState(newState, this.updateAllPipes);
  }

  handleSectionChange(newValue, pipeID) {
    var newState = { ...this.state };
    newState.pipes[pipeID].section = newValue;
    this.setState(newState, this.updateAllPipes);
  }

  handleSetAsUnlockedVelocityChange(event, pipeID) {
    var newState = { ...this.state };
    for (let i = 0; i < newState.pipes.length; i++) {
      newState.pipes[i].lockedVelocity = true;
    }
    newState.pipes[pipeID].lockedVelocity = false;
    this.setState(newState, this.updateAllPipes);
  }

  removeAllPipes() {
    for (let i = 0; i < this.state.pipes.length; i++) {
      this.state.pipes[i].shapeGroup.remove();
      this.state.pipes[i].velocityArrow.Remove();
      this.state.pipes[i].scrollingRectangle.remove();
    }
  }

  handlePipeRemoved(pipeID) {
    var pipes = [...this.state.pipes];

    pipes[pipeID].shapeGroup.remove();
    pipes[pipeID].velocityArrow.Remove();
    pipes[pipeID].scrollingRectangle.remove();
    pipes.splice(pipeID, 1);

    this.setState({ pipes: pipes }, this.updateAllPipes);
  }

  createNewPipe(angle, section, locked, velocity) {
    const radius = this.state.volume.radius;
    const outlineShape = new Shape.Rectangle(
      new Rectangle(
        new Point(pipeStroke + 1, 0),
        new Size(pipeLength + radius - pipeStroke * 2 - 2, section)
      )
    );
    const pipeNumber = new PointText(new Point(0, 0));
    pipeNumber.style = {
      fillColor: "black",
      fontSize: 30,
    };
    outlineShape.sendToBack();
    outlineShape.style = {
      strokeColor: "black",
      strokeWidth: pipeStroke * 2,
      fillColor: "#aaaaaa",
    };
    const fillShape = new Shape.Rectangle(
      new Rectangle(new Point(0, 0), new Size(pipeLength + radius, section))
    );
    fillShape.bringToFront();
    fillShape.style = {
      fillColor: "#dddddd",
    };
    const arrow = new VectorArrow(
      new Point(0, 0),
      new Point(50, 50),
      "#0088ff",
      5,
      10,
      15
    );
    const angleInRads = (angle * Math.PI) / 180;
    const offset = radius / 2 + pipeLength / 2 - pipeStroke;
    const position = new Point(
      addPoints(
        view.center,
        new Point(
          Math.cos(angleInRads) * offset,
          Math.sin(angleInRads) * offset
        )
      )
    );
    const scrollingRectangle = new ScrollingRectangle(
      new Point(0, 0),
      new Size(125, section),
      0,
      0,
      2,
      "#0088aa",
      "#00ccff"
    );
    const group = new Group([outlineShape, fillShape]);
    group.applyMatrix = false;
    group.position = position;
    group.rotation = angle;
    scrollingRectangle.bringToFront();
    var newPipe = {
      active: true,
      section: section,
      angle: angle,
      lockedVelocity: locked,
      velocity: 0,
      shapeGroup: group,
      outlineShape: outlineShape,
      fillShape: fillShape,
      velocityArrow: arrow,
      scrollingRectangle: scrollingRectangle,
    };
    return newPipe;
  }

  updateAllPipes() {
    let incognitas = 0;
    let momentumChange = new Point(0, 0);
    for (let i = 0; i < this.state.pipes.length; i++) {
      if (!this.state.pipes[i].lockedVelocity) {
        incognitas += 1;
      }
    }
    if (this.state.pipes.length > 0) {
      if (incognitas == 0) {
        this.state.pipes[0].lockedVelocity = false;
      }
    }
    for (let i = 0; i < this.state.pipes.length; i++) {
      const pipe = this.state.pipes[i];
      this.updatePipe(pipe, i);
      let sign = Math.sign(pipe.velocity);
      const angleInRads = (pipe.angle * Math.PI) / 180;
      const flow = -(pipe.velocity * pipe.section * sign) / 5;
      momentumChange.x += Math.cos(angleInRads) * flow;
      momentumChange.y += Math.sin(angleInRads) * flow;
    }
    this.state.volume.fillShape.bringToFront();
    horizontalForceArrow.bringToFront();
    horizontalForceArrow.SetPosition(
      view.center,
      addPoints(view.center, new Point(momentumChange.x, 0))
    );
    verticalForceArrow.bringToFront();
    verticalForceArrow.SetPosition(
      view.center,
      addPoints(view.center, new Point(0, momentumChange.y))
    );
    totalForceArrow.bringToFront();
    totalForceArrow.SetPosition(
      view.center,
      addPoints(view.center, momentumChange)
    );
  }

  updatePipe(pipe, id) {
    const pipes = this.state.pipes;
    const group = pipe.shapeGroup;
    const angleInRads = (pipe.angle * Math.PI) / 180;
    const dirX = Math.cos(angleInRads);
    const dirY = Math.sin(angleInRads);
    const distanceFromCenter =
      this.state.volume.radius / 2 + pipeLength / 2 - pipeStroke;
    let position = addPoints(
      view.center,
      new Point(dirX * distanceFromCenter, dirY * distanceFromCenter)
    );
    let totalSharedSection = 0;
    let sectionBeforeMe = 0;
    let pipesWithSameAngle = 0;
    const spacing = 15;
    for (let i = 0; i < pipes.length; i++) {
      if (Math.abs((pipes[i].angle - pipe.angle + 360) % 360) == 0) {
        pipesWithSameAngle++;
        if (i != id) {
          totalSharedSection += pipes[i].section + spacing;
        }
        if (i < id) {
          sectionBeforeMe += pipes[i].section + spacing;
        }
      }
    }
    if (pipesWithSameAngle > 1) {
      const sideDirX = Math.sin(angleInRads);
      const sideDirY = -Math.cos(angleInRads);
      const offset = sectionBeforeMe - totalSharedSection / 2;
      position = addPoints(
        position,
        new Point(sideDirX * offset, sideDirY * offset)
      );
    }
    group.position = position;
    group.rotation = pipe.angle;
    pipe.scrollingRectangle.setPosition(
      addPoints(
        position,
        new Point(
          dirX * (distanceFromCenter - 60),
          dirY * (distanceFromCenter - 60)
        )
      )
    );
    pipe.scrollingRectangle.setRotation(pipe.angle);
    pipe.scrollingRectangle.setHeight(pipe.section);
    pipe.outlineShape.size.height = pipe.section + 10;
    pipe.fillShape.size.height = pipe.section + 10;
    this.updateAllVelocities();
  }

  updateAllVelocities() {
    const pipes = [...this.state.pipes];
    // Conservacion de masa
    let lockedMass = 0;

    // Sumo los caudales de los tubos bloqueados
    for (let i = 0; i < pipes.length; i++) {
      if (pipes[i].lockedVelocity) {
        lockedMass += pipes[i].velocity * pipes[i].section;
      }
    }

    // Sumo las secciónes de los tubos desbloqueados
    let unlockedTotalSection = 0;
    for (let i = 0; i < pipes.length; i++) {
      if (!pipes[i].lockedVelocity) {
        unlockedTotalSection += pipes[i].section;
      }
    }

    // Asigno velocidades según el porcentaje de sección
    for (let i = 0; i < pipes.length; i++) {
      if (!pipes[i].lockedVelocity) {
        pipes[i].velocity =
          ((-lockedMass / pipes[i].section) * pipes[i].section) /
          unlockedTotalSection;
      }
    }

    // Cambio de momento en x

    this.setState({ pipes: pipes }, () => {
      for (let i = 0; i < pipes.length; i++) {
        this.updateVelocity(pipes[i]);
      }
    });
  }

  updateVelocity(pipe) {
    const angleInRads = (pipe.angle * Math.PI) / 180;
    const dirX = Math.cos(angleInRads);
    const dirY = Math.sin(angleInRads);
    const length = Math.max(Math.min(pipe.velocity, 15), -15);
    const scale = Math.min(8, Math.max(1, Math.abs(pipe.velocity / 15)));
    const startDist = Math.max(0, -length * velocityToPixels);
    const endDist = Math.max(0, length * velocityToPixels);
    pipe.velocityArrow.SetScale(scale);
    pipe.velocityArrow.SetPosition(
      addPoints(
        pipe.shapeGroup.position,
        new Point(
          dirX *
            (this.state.volume.radius / 2 + pipeLength / 2 + startDist + 10),
          dirY *
            (this.state.volume.radius / 2 + pipeLength / 2 + startDist + 10)
        )
      ),
      addPoints(
        pipe.shapeGroup.position,
        new Point(
          dirX * (this.state.volume.radius / 2 + pipeLength / 2 + endDist + 10),
          dirY * (this.state.volume.radius / 2 + pipeLength / 2 + endDist + 10)
        )
      )
    );
    pipe.velocityArrow.SetColor(pipe.lockedVelocity ? "#ff2266" : "#0088ff");
    pipe.velocityArrow.bringToFront();
    pipe.scrollingRectangle.setSpeed(pipe.velocity * velocityToPixels);
  }

  canvasFunction() {
    const center = view.center;

    const background = new Shape.Rectangle(
      new Rectangle(new Point(0, 0), view.size)
    );
    background.fillColor = "white";

    const controlVolumeOutlineShape = new Shape.Circle(
      center,
      this.state.volume.radius
    );
    controlVolumeOutlineShape.style = {
      strokeColor: "black",
      strokeWidth: pipeStroke,
      fillColor: "#dddddd",
    };
    const controlVolumeFillShape = new Shape.Circle(
      center,
      this.state.volume.radius - pipeStroke / 2
    );
    controlVolumeFillShape.style = {
      fillColor: "#dddddd",
    };

    let volumeCopy = { ...this.state.volume };
    volumeCopy.outlineShape = controlVolumeOutlineShape;
    volumeCopy.fillShape = controlVolumeFillShape;

    let newPipes = [];
    newPipes.push(this.createNewPipe(180, 50, true, -10));
    newPipes.push(this.createNewPipe(0, 25, false));

    totalForceArrow = new VectorArrow(
      view.center,
      view.center,
      "black",
      10,
      10,
      20,
      false,
      false
    );
    totalForceArrow.setVisible(false);
    horizontalForceArrow = new VectorArrow(
      view.center,
      view.center,
      "red",
      10,
      10,
      20,
      false,
      false
    );
    horizontalForceArrow.setVisible(false);
    verticalForceArrow = new VectorArrow(
      view.center,
      view.center,
      "blue",
      10,
      10,
      20,
      false,
      false
    );
    verticalForceArrow.setVisible(false);

    this.setState(
      { volume: volumeCopy, ready: true, pipes: newPipes },
      this.updateAllPipes
    );

    controlVolumeFillShape.bringToFront();
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
      "Y"
    );
    new CoordinateReference(
      addPoints(view.bounds.bottomLeft, new Point(100, -100)),
      new Point(1, 0),
      "X"
    );
  }

  getParameterCode() {
    let module = "H";
    let codeVersion = "1";
    let list = [module, codeVersion, this.state.showingForces ? 1 : 0];
    for (let i = 0; i < this.state.pipes.length; i++) {
      let pipe = this.state.pipes[i];
      list.push(pipe.angle);
      list.push(pipe.section);
      list.push(pipe.velocity);
      list.push(pipe.lockedVelocity ? 1 : 0);
    }
    return list.join(";");
  }

  loadParameterCode(code) {
    if (loading) return false;
    loading = true;
    let split = code.split(";");
    let module = split[0];
    let codeVersion = parseInt(split[1]);
    this.removeAllPipes();
    if (codeVersion == 1) {
      let showingForces = split[2] == 1;
      let serializedPipes = split.splice(3);
      let pipes = [];
      for (let i = 0; i < serializedPipes.length; i += 4) {
        const angle = parseFloat(serializedPipes[i]);
        const section = parseFloat(serializedPipes[i + 1]);
        const velocity = parseFloat(serializedPipes[i + 2]);
        const locked = serializedPipes[i + 3] == 1;
        let newPipe = this.createNewPipe(angle, section, locked, velocity);
        newPipe.velocity = velocity;
        pipes.push(newPipe);
      }
      this.setState({ pipes, showingForces }, () => {
        loading = false;
        this.updateAllPipes();
      });
      totalForceArrow.setVisible(showingForces);
      horizontalForceArrow.setVisible(showingForces);
      verticalForceArrow.setVisible(showingForces);
    }
  }

  render() {
    return (
      <PanelAndCanvas
        title="Volumen de control"
        shareCode={() => this.getParameterCode()}
        loadCode={(code) => this.loadParameterCode(code)}
        panel={
          <>
            <Grid container spacing="2%" alignItems="stretch">
              {this.state.pipes.map((pipe, index) => (
                <Grid item xs={12} key={index}>
                  <CVPipe
                    id={index}
                    pipe={pipe}
                    onAngleChange={(e, index) =>
                      this.handleAngleChange(e, index)
                    }
                    onVelocityChange={(e, index) =>
                      this.handleVelocityChange(e, index)
                    }
                    onSectionChange={(e, index) =>
                      this.handleSectionChange(e, index)
                    }
                    onUnlockedVelocity={(e, index) =>
                      this.handleSetAsUnlockedVelocityChange(e, index)
                    }
                    onRemoveButtonClicked={(e) => this.handlePipeRemoved(e)}
                  ></CVPipe>
                </Grid>
              ))}
              <Grid item xs={12} xl={6}>
                <MyToggle
                  label="Fuerzas sobre el volumen"
                  checked={this.state.showingForces}
                  onChange={(e) => this.toggleShowingForcesChange(e)}
                />
              </Grid>
              <Grid item xs={6}>
                <Button
                  sx={{ width: "100%" }}
                  variant="contained"
                  startIcon={<AddIcon></AddIcon>}
                  onClick={() => this.handleAddPipe()}
                >
                  Añadir Tubo
                </Button>
              </Grid>
              <Grid item xs={12} sx={{ marginTop: "50px" }}>
                <ModuleAccordion title="Ecuación">
                  <ModuleAccordion
                    title={
                      <MathComponent
                        tex={String.raw`\sum\overrightarrow{F}=(\rho VA\overrightarrow{V})out-(\rho VA\overrightarrow{V})in`}
                      />
                    }
                    fontSize={20}
                    center
                    hasBorder
                  >
                    <EquationReferences
                      parameters={[
                        {
                          letter: String.raw`\sum\overrightarrow{F} :`,
                          description:
                            "sumatoria vectorial de las fuerzas causadas por el cambio de momento [kgf]",
                        },
                        {
                          letter: String.raw`\rho :`,
                          description: "densidad del fluido [kg/m³]",
                        },
                        {
                          letter: "V :",
                          description: "rapidez del fluido [m/s]",
                        },
                        {
                          letter: "A :",
                          description: "sección de la entrada / salida [m²]",
                        },
                        {
                          letter: String.raw`\overrightarrow{V} :`,
                          description: "dirección vectorial del fluido",
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

export default Modulo8VolumenDeControl;

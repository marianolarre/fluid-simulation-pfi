import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import CVPipe from "../components/Pipe";
import AddIcon from "@mui/icons-material/Add";

import { Button } from "@mui/material";
import { Grid } from "@mui/material";
import { view, Point, Size, Path, Shape, Group, Rectangle } from "paper";
import SliderWithInput from "../components/SliderWithInput";
import { addPoints, ScrollingRectangle, VectorArrow } from "../paperUtility";

const pipeLength = 100;
const pipeStroke = 4;
const velocityToPixels = 10;

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
    density: 10,
    pipes: [],
  };

  update(delta) {
    for (let i = 0; i < this.state.pipes.length; i++) {
      this.state.pipes[i].scrollingRectangle.update(delta);
    }
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
      this.updatePipe(this.state.pipes[i], i);
    }
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

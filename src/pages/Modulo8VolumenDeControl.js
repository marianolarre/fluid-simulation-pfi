import React, { Component } from "react";
import MyToggle from "../components/MyToggle";
import Canvas from "../components/Canvas";
import PanelAndCanvas from "../components/PanelAndCanvas";
import CVPipe from "../components/Pipe";
import AddIcon from "@mui/icons-material/Add";

import { Button } from "@mui/material";
import { Grid } from "@mui/material";
import Paper from "paper";
import { Color, Point } from "paper/dist/paper-core";
import SliderWithInput from "../components/SliderWithInput";
import { addPoints, VectorArrow } from "../paperUtility";

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
      radius: 250,
      outlineShape: null,
      fillShape: null,
    },
    pipes: [],
  };

  update(delta) {}

  handleAddPipe() {
    var newState = { ...this.state };
    newState.pipes.push(this.createNewPipe(0, 50, false));
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

  handleLockedVelocityChange(event, pipeID) {
    var newState = { ...this.state };
    newState.pipes[pipeID].lockedVelocity = event.target.checked;
    this.setState(newState, this.updateAllPipes);
  }

  handlePipeRemoved(pipeID) {
    var pipes = [...this.state.pipes];

    pipes[pipeID].shapeGroup.remove();
    pipes[pipeID].velocityArrow.Remove();
    console.log(pipes);
    pipes.splice(pipeID, 1);
    console.log(pipes);

    this.setState({ pipes: pipes }, this.updateAllPipes);
  }

  createNewPipe(angle, section, locked, velocity) {
    const radius = this.state.volume.radius;
    const outlineShape = new Paper.Shape.Rectangle(
      new Paper.Rectangle(
        new Paper.Point(pipeStroke + 1, 0),
        new Paper.Size(pipeLength + radius - pipeStroke * 2 - 2, section)
      )
    );
    outlineShape.sendToBack();
    outlineShape.style = {
      strokeColor: "black",
      strokeWidth: pipeStroke * 2,
      fillColor: "#aaaaaa",
    };
    const fillShape = new Paper.Shape.Rectangle(
      new Paper.Rectangle(
        new Paper.Point(0, 0),
        new Paper.Size(pipeLength + radius, section)
      )
    );
    fillShape.bringToFront();
    fillShape.style = {
      fillColor: "#dddddd",
    };
    const arrow = new VectorArrow(
      new Paper.Point(0, 0),
      new Paper.Point(50, 50),
      "#0088ff",
      5,
      10,
      15
    );
    const angleInRads = (angle * Math.PI) / 180;
    const offset = radius / 2 + pipeLength / 2 - pipeStroke;
    const position = new Paper.Point(
      addPoints(
        Paper.view.center,
        new Paper.Point(
          Math.cos(angleInRads) * offset,
          Math.sin(angleInRads) * offset
        )
      )
    );
    const group = new Paper.Group([outlineShape, fillShape]);
    group.applyMatrix = false;
    group.position = position;
    group.rotation = angle;
    var newPipe = {
      active: true,
      section: section,
      angle: angle,
      lockedVelocity: locked,
      velocity: locked ? velocity : 0,
      shapeGroup: group,
      outlineShape: outlineShape,
      fillShape: fillShape,
      velocityArrow: arrow,
    };
    return newPipe;
  }

  updateAllPipes() {
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
      Paper.view.center,
      new Paper.Point(dirX * distanceFromCenter, dirY * distanceFromCenter)
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
        new Paper.Point(sideDirX * offset, sideDirY * offset)
      );
    }
    group.position = position;
    group.rotation = pipe.angle;
    pipe.outlineShape.size.height = pipe.section;
    pipe.fillShape.size.height = pipe.section;
    this.updateAllVelocities();
  }

  updateAllVelocities() {
    const pipes = [...this.state.pipes];
    // Mass conservation
    let lockedMass = 0;
    for (let i = 0; i < pipes.length; i++) {
      if (pipes[i].lockedVelocity) {
        lockedMass += pipes[i].velocity * pipes[i].section;
      }
    }
    let unlockedTotalSection = 0;
    for (let i = 0; i < pipes.length; i++) {
      if (!pipes[i].lockedVelocity) {
        unlockedTotalSection += pipes[i].section;
      }
    }
    for (let i = 0; i < pipes.length; i++) {
      if (!pipes[i].lockedVelocity) {
        pipes[i].velocity =
          ((-lockedMass / pipes[i].section) * pipes[i].section) /
          unlockedTotalSection;
      }
    }

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
    const scale = Math.max(1, Math.abs(pipe.velocity / 15));
    const startDist = Math.max(0, -length * velocityToPixels);
    const endDist = Math.max(0, length * velocityToPixels);
    pipe.velocityArrow.SetScale(scale);
    pipe.velocityArrow.SetPosition(
      addPoints(
        pipe.shapeGroup.position,
        new Paper.Point(
          dirX *
            (this.state.volume.radius / 2 + pipeLength / 2 + startDist + 10),
          dirY *
            (this.state.volume.radius / 2 + pipeLength / 2 + startDist + 10)
        )
      ),
      addPoints(
        pipe.shapeGroup.position,
        new Paper.Point(
          dirX * (this.state.volume.radius / 2 + pipeLength / 2 + endDist + 10),
          dirY * (this.state.volume.radius / 2 + pipeLength / 2 + endDist + 10)
        )
      )
    );
    pipe.velocityArrow.SetColor(pipe.lockedVelocity ? "#ff2266" : "#0088ff");
    pipe.velocityArrow.bringToFront();
  }

  canvasFunction() {
    const center = Paper.view.center;

    const background = new Paper.Shape.Rectangle(
      new Paper.Rectangle(new Paper.Point(0, 0), Paper.view.size)
    );
    background.fillColor = "white";

    const controlVolumeOutlineShape = new Paper.Shape.Circle(
      center,
      this.state.volume.radius
    );
    controlVolumeOutlineShape.style = {
      strokeColor: "black",
      strokeWidth: pipeStroke,
      fillColor: "#dddddd",
    };
    const controlVolumeFillShape = new Paper.Shape.Circle(
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
    newPipes.push(this.createNewPipe(45, 75, false));

    this.setState(
      { volume: volumeCopy, ready: true, pipes: newPipes },
      this.updateAllPipes
    );

    controlVolumeFillShape.bringToFront();
    Paper.view.onFrame = (event) => {
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

  render() {
    return (
      <PanelAndCanvas
        title="Volumen de control"
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
                    onLockedVelocityChange={(e, index) =>
                      this.handleLockedVelocityChange(e, index)
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

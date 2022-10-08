import React, { Component } from "react";
import {
  Button,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  Grid,
} from "@mui/material";
import SliderWithInput from "./SliderWithInput";
import BackspaceIcon from "@mui/icons-material/Backspace";
import PanelModule from "./PanelModule";

const angleMarks = [
  {
    value: 0,
    label: "0º",
  },
  {
    value: 90,
    label: "90º",
  },
  {
    value: 180,
    label: "180º",
  },
  {
    value: 270,
    label: "270º",
  },
  {
    value: 360,
    label: "360º",
  },
];

const velocityMarks = [
  {
    value: -10,
    label: "-10",
  },
  {
    value: 0,
    label: "0",
  },
  {
    value: 10,
    label: "10",
  },
];

class CVPipe extends Component {
  state = {};
  render() {
    const style = {
      padding: "10px",
    };
    const closeIconStyle = {
      float: "right",
    };

    return (
      <Paper elevation={3} style={style}>
        <Tooltip title="Eliminar Tubo">
          <IconButton
            color="error"
            style={closeIconStyle}
            onClick={() => this.props.onRemoveButtonClicked(this.props.id)}
          >
            <BackspaceIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="p" component="h2">
          Tubo {this.props.id + 1}
        </Typography>
        <SliderWithInput
          label="Ángulo"
          step={15}
          min={0}
          max={360}
          marks={angleMarks}
          unit="º"
          value={this.props.pipe.angle}
          onChange={(newValue) =>
            this.props.onAngleChange(newValue, this.props.id)
          }
        ></SliderWithInput>
        <SliderWithInput
          label="Sección"
          step={1}
          min={10}
          max={100}
          unit="cm"
          value={this.props.pipe.section}
          onChange={(newValue) =>
            this.props.onSectionChange(newValue, this.props.id)
          }
        ></SliderWithInput>
        <Grid container>
          {(this.props.pipe.lockedVelocity && (
            <>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  onClick={(newValue) =>
                    this.props.onUnlockedVelocity(newValue, this.props.id)
                  }
                >
                  Hacer velocidad incógnita
                </Button>
              </Grid>
              <Grid item xs={8}>
                <SliderWithInput
                  label="Velocidad"
                  step={0.1}
                  min={-10}
                  max={10}
                  marks={velocityMarks}
                  unit="m/s"
                  value={this.props.pipe.velocity}
                  onChange={(newValue) =>
                    this.props.onVelocityChange(newValue, this.props.id)
                  }
                ></SliderWithInput>
              </Grid>
            </>
          )) || (
            <PanelModule>
              <Grid item xs={12}>
                La velocidad de este tubo es una incógnita, calculada con la
                ecuación de conservación de la masa:{" "}
                {Math.round(this.props.pipe.velocity * 100) / 100} m/s^2
              </Grid>
            </PanelModule>
          )}
        </Grid>
      </Paper>
    );
  }
}

export default CVPipe;

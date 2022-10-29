import React, { Component } from "react";
import { Button, IconButton, Paper, Typography } from "@mui/material";
import SliderWithInput from "./SliderWithInput";
import BackspaceIcon from "@mui/icons-material/Backspace";
import MyTooltip from "./MyTooltip";

class Stratum extends Component {
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
        <MyTooltip title="Eliminar Liquido">
          <IconButton
            color="error"
            style={closeIconStyle}
            onClick={() => this.props.onRemoveButtonClicked(this.props.id)}
          >
            <BackspaceIcon />
          </IconButton>
        </MyTooltip>
        <Typography variant="p" component="h2">
          Líquido {this.props.id + 1}
        </Typography>
        <SliderWithInput
          label="Profundidad"
          step={0.1}
          min={0}
          max={this.props.max}
          unit="m"
          value={this.props.liquid.height}
          onChange={(newValue) =>
            this.props.onHeightChange(newValue, this.props.id)
          }
        ></SliderWithInput>
        <SliderWithInput
          label="Densidad"
          step={10}
          min={10}
          max={2000}
          unit="kg/m³"
          value={this.props.liquid.density}
          onChange={(newValue) =>
            this.props.onDensityChange(newValue, this.props.id)
          }
        ></SliderWithInput>
      </Paper>
    );
  }
}

export default Stratum;

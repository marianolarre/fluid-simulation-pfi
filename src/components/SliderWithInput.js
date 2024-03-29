import React, { Component } from "react";
import Box from "@mui/material/Box";
import { blue } from "@mui/material/colors";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";
import { Icon } from "@mui/material";
import PanelModule from "./PanelModule";

class SliderWithInput extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    temporaryValue: null,
  };

  handleSliderChange = (event, newValue) => {
    this.props.onChange(newValue);
  };

  handleInputChange = (event) => {
    if (event.target.value != "") {
      let number = Number(event.target.value);
      if (number <= this.props.max && number >= this.props.min) {
        this.setState({ temporaryValue: null });
        this.props.onChange(number);
      } else {
        this.setState({ temporaryValue: number });
      }
    }
  };

  handleBlur = (event) => {
    if (event.target.value != "") {
      let number = Number(event.target.value);
      if (number > this.props.max) {
        number = this.props.max;
      }
      if (number < this.props.min) {
        number = this.props.min;
      }
      this.setState({ temporaryValue: null });
      this.props.onChange(number);
    }
  };

  render() {
    return (
      <PanelModule>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={this.props.icon != null ? 3 : 4}>
            <Typography id="input-slider" gutterBottom align="right">
              {this.props.label}
            </Typography>
          </Grid>
          {this.props.icon != null && (
            <Grid item xs={1}>
              <Icon xs={{ margin: 0 }}>{this.props.icon}</Icon>
            </Grid>
          )}
          <Grid item xs={4}>
            <Slider
              marks={this.props.marks}
              value={
                typeof this.props.value === "number" ? this.props.value : 0
              }
              step={this.props.step}
              min={this.props.min}
              max={this.props.max}
              onChange={this.handleSliderChange}
              aria-labelledby="input-slider"
            />
          </Grid>
          <Grid item xs={4}>
            <MuiInput
              value={this.state.temporaryValue || this.props.value}
              size="small"
              onChange={this.handleInputChange}
              onBlur={this.handleBlur}
              inputProps={{
                step: this.props.step,
                min: this.props.min,
                max: this.props.max,
                type: "number",
                "aria-labelledby": "input-slider",
              }}
              sx={{ float: "left", width: "100%" }}
              endAdornment={this.props.unit}
            />
          </Grid>
        </Grid>
      </PanelModule>
    );
  }
}

export default SliderWithInput;

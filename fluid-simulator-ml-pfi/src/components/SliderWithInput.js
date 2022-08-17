import React, { Component } from "react";
import Box from "@mui/material/Box";
import { blue } from "@mui/material/colors";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";
import { Paper } from "@mui/material";

class SliderWithInput extends Component {
  constructor(props) {
    super(props);
  }

  handleSliderChange = (event, newValue) => {
    this.props.onChange(newValue);
  };

  handleInputChange = (event) => {
    if (event.target.value != "") {
      let number = Number(event.target.value);
      if (number > this.props.max) {
        number = this.props.max;
      }
      if (number < this.props.min) {
        number = this.props.min;
      }
      this.props.onChange(number);
    }
  };

  render() {
    return (
      <Paper
        sx={{
          width: "96%",
          padding: "2%",
          background: blue[50],
        }}
        elevation={0}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <Typography id="input-slider" gutterBottom align="right">
              {this.props.label}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Slider
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
          <Grid item xs={2}>
            <MuiInput
              value={this.props.value}
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
              sx={{ float: "left" }}
            />
          </Grid>
          <Grid item xs={1}>
            <Typography>{this.props.unit}</Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export default SliderWithInput;

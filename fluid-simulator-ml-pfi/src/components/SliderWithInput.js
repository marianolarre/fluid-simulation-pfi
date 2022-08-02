import React, { Component } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";

class SliderWithInput extends Component {
  constructor(props) {
    super(props);
  }

  handleSliderChange = (event, newValue) => {
    this.props.onChange(newValue);
  };

  handleInputChange = (event) => {
    if (event.target.value != "") {
      this.props.onChange(Number(event.target.value));
    }
  };

  render() {
    return (
      <Box sx={{ width: "100%" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography id="input-slider" gutterBottom>
              {this.props.label}
            </Typography>
          </Grid>

          <Grid item xs>
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
          <Grid item>
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
            />
          </Grid>
        </Grid>
      </Box>
    );
  }
}

export default SliderWithInput;

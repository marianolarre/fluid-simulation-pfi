import React, { Component } from "react";
import Box from "@mui/material/Box";
import { blue } from "@mui/material/colors";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";
import { Paper } from "@mui/material";
import PanelModule from "./PanelModule";

class ExpressionInput extends Component {
  constructor(props) {
    super(props);
  }

  handleInputChange = (event) => {
    this.props.onChange(event.target.value);
  };

  render() {
    return (
      <PanelModule>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={2}>
            <Typography id="input-slider" gutterBottom align="right">
              {this.props.label}
            </Typography>
          </Grid>
          <Grid item xs={10}>
            <MuiInput
              value={this.props.value}
              size="small"
              onChange={this.handleInputChange}
              onBlur={this.handleBlur}
              inputProps={{
                type: "text",
                "aria-labelledby": "input-slider",
              }}
              sx={{ float: "left" }}
            />
          </Grid>
        </Grid>
      </PanelModule>
    );
  }
}

export default ExpressionInput;

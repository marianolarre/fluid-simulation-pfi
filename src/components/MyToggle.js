import React, { Component } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { FormControlLabel, Switch } from "@mui/material";
import PanelModule from "./PanelModule";
import { blue } from "@mui/material/colors";

class MyToggle extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <PanelModule>
        <FormControlLabel
          label={this.props.label}
          labelPlacement="end"
          control={
            <Switch
              size="large"
              checked={this.props.checked}
              onChange={this.props.onChange}
            />
          }
        ></FormControlLabel>
      </PanelModule>
    );
  }
}

export default MyToggle;

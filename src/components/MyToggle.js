import React, { Component } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { FormControlLabel, Switch, Icon } from "@mui/material";
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
          labelPlacement="start"
          control={
            <>
              <Switch
                size="large"
                checked={this.props.value}
                onChange={this.props.onChange}
              />
              {this.props.icon != null && (
                <Icon sx={{ margin: "10px" }}>{this.props.icon}</Icon>
              )}
            </>
          }
        ></FormControlLabel>
      </PanelModule>
    );
  }
}

export default MyToggle;

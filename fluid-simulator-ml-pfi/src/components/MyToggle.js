import React, { Component } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { FormControlLabel, Paper, Switch } from "@mui/material";
import { blue } from "@mui/material/colors";

class MyToggle extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Paper
        sx={{
          width: "92%",
          background: blue[50],
          padding: "2%",
          paddingLeft: "6%",
        }}
        elevation={0}
      >
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
      </Paper>
    );
  }
}

export default MyToggle;

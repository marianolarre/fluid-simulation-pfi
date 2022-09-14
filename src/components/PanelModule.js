import React, { Component } from "react";
import { blue } from "@mui/material/colors";
import { Paper } from "@mui/material";

class PanelModule extends Component {
  state = {};
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
        {this.props.children}
      </Paper>
    );
  }
}

export default PanelModule;

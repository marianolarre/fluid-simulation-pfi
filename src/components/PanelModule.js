import React, { Component } from "react";
import { blue } from "@mui/material/colors";
import { Paper } from "@mui/material";

class PanelModule extends Component {
  state = {};
  render() {
    return (
      <Paper
        sx={{
          width: "94%",
          background: blue[50],
          paddingTop: "1%",
          paddingBottom: "1%",
          paddingLeft: "3%",
          paddingRight: "3%",
        }}
        elevation={0}
      >
        {this.props.children}
      </Paper>
    );
  }
}

export default PanelModule;

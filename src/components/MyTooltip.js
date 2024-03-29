import { Tooltip, Typography } from "@mui/material";
import React, { Component } from "react";

class MyTooltip extends Component {
  state = {};
  render() {
    return (
      <Tooltip
        disableInteractive={this.props.disableInteractive}
        title={<Typography fontSize={18}>{this.props.title}</Typography>}
      >
        {this.props.children}
      </Tooltip>
    );
  }
}

export default MyTooltip;

import React, { Component } from "react";
import { blue } from "@mui/material/colors";
import { Box, Paper, Stack } from "@mui/material";
import GoBackButton from "./SimulatorBanner";
import SimulatorBanner from "./SimulatorBanner";

class PanelAndCanvas extends Component {
  state = {};
  render() {
    return (
      <Box
        sx={{
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Stack direction={"row"} sx={{ height: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: "1",
              height: "100%",
              backgroundColor: blue[100],
            }}
          >
            <SimulatorBanner
              title={this.props.title}
              shareCode={this.props.shareCode}
              loadCode={this.props.loadCode}
            ></SimulatorBanner>
            <Box
              sx={{
                padding: "20px",
                overflowY: this.props.keepScrollbar ? "scroll" : "auto",
                flex: "1",
              }}
            >
              {this.props.panel}
            </Box>
          </Paper>
          <Box
            sx={{
              flex: "2",
            }}
          >
            {this.props.canvas}
          </Box>
        </Stack>
      </Box>
    );
  }
}

export default PanelAndCanvas;

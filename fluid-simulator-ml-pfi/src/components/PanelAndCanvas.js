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
          padding: "10px",
          boxSizing: "border-box",
          height: "100vh",
        }}
      >
        <Stack direction={"row"} sx={{ height: "100%" }}>
          <Paper
            elevation={3}
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: "1",
              height: "100%",
              backgroundColor: blue[100],
            }}
          >
            <SimulatorBanner title={this.props.title}></SimulatorBanner>
            <Box
              sx={{
                padding: "20px",
                overflowY: "auto",
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

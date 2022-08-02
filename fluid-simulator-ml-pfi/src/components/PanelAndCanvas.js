import React, { Component } from "react";
import { blue } from "@mui/material/colors";
import { Box, Paper, Stack } from "@mui/material";

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
            sx={{
              flex: "1",
              backgroundColor: blue[100],
              padding: "20px",
              overflowY: "scroll",
            }}
          >
            {" "}
            {this.props.panel}
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

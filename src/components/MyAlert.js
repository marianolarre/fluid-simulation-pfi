import React, { Component } from "react";
import { Alert, Collapse, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";

class MyAlert extends Component {
  state = {};
  render() {
    return (
      <Collapse
        in={this.props.open}
        sx={{
          position: "absolute",
          top: "20px",
          width: "100%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{
            boxShadow: "0 2px 5px #0005",
            border: "1px solid black",
            width: "400px",
            margin: "auto",
            pointerEvents: "all",
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                this.copyConfirmationClose();
              }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
        >
          {this.props.children}
        </Alert>
      </Collapse>
    );
  }
}

export default MyAlert;

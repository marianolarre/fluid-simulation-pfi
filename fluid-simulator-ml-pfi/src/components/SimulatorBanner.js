import React, { Component } from "react";
import { AppBar, Button, Tooltip, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";

class SimulatorBanner extends Component {
  state = {};

  render() {
    return (
      <AppBar
        color="primary"
        position="relative"
        sx={{
          padding: 2,
        }}
      >
        <Typography variant="h4" component="h1" fontSize="2rem">
          <Tooltip title="Volver al menu">
            <Link to="/" style={{ textDecoration: "none", color: "white" }}>
              <Button variant="default">
                <ArrowBack fontSize="large"></ArrowBack>
              </Button>
            </Link>
          </Tooltip>
          {this.props.title}
        </Typography>
      </AppBar>
    );
  }
}

export default SimulatorBanner;

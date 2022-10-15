import React, { Component } from "react";
import { AppBar, Button, Tooltip, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { ArrowBack, FileOpen, Share } from "@mui/icons-material";

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
          <Tooltip title="Cargar parámetros">
            <Button
              style={{
                display: "block",
                float: "right",
                color: "white",
                padding: "10px",
              }}
            >
              <FileOpen></FileOpen>
            </Button>
          </Tooltip>
          <Tooltip title="Compartir parámetros">
            <Button
              style={{
                display: "block",
                float: "right",
                color: "white",
                padding: "10px",
              }}
            >
              <Share></Share>
            </Button>
          </Tooltip>
        </Typography>
      </AppBar>
    );
  }
}

export default SimulatorBanner;

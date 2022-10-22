import React, { Component } from "react";
import {
  AppBar,
  Button,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Link } from "react-router-dom";
import { ArrowBack, FileOpen, Share } from "@mui/icons-material";

class SimulatorBanner extends Component {
  state = { shareModalOpen: false };

  openShareModal() {
    this.setState({ shareModalOpen: true });
  }

  closeShareModal() {
    this.setState({ shareModalOpen: false });
  }

  openLoadModal() {
    this.props.loadCode("A;1;100;150;2;0;1;0;1");
  }

  closeLoadModal() {}

  render() {
    return (
      <>
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
                onClick={() => this.openLoadModal()}
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
                onClick={() => this.openShareModal()}
              >
                <Share></Share>
              </Button>
            </Tooltip>
          </Typography>
        </AppBar>
        <Dialog
          open={this.state.shareModalOpen}
          onClose={() => this.closeShareModal()}
        >
          <DialogTitle>Compartir parámetros</DialogTitle>
          <DialogContent>{this.props.shareCode()}</DialogContent>
          <DialogActions>a</DialogActions>
        </Dialog>
      </>
    );
  }
}

export default SimulatorBanner;

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
  Alert,
  Collapse,
  IconButton,
  Input,
  TextField,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  ArrowBack,
  FileOpen,
  Share,
  Close,
  CopyAll,
} from "@mui/icons-material";

class SimulatorBanner extends Component {
  state = {
    shareModalOpen: false,
    loadModalOpen: false,
    alert: false,
    alertMessage: "",
    invalidCode: false,
    codeError: false,
    codeErrorMessage: "",
    code: "",
  };

  handleCodeChanged(event) {
    this.setState({
      code: event.target.value,
      codeError: false,
      codeErrorMessage: "",
    });
  }

  openShareModal() {
    this.setState({ shareModalOpen: true });
  }

  closeShareModal() {
    this.setState({ shareModalOpen: false });
  }

  openLoadModal() {
    this.setState({
      loadModalOpen: true,
      codeError: false,
      codeErrorMessage: "",
    });
  }

  closeLoadModal() {
    this.setState({ loadModalOpen: false });
  }

  copyCode() {
    navigator.clipboard.writeText(this.props.shareCode());
    this.alertOpen("Código copiado al portapapeles");
    this.closeShareModal();
    setTimeout(() => this.alertClose(), 4000);
  }

  loadCode() {
    try {
      this.props.loadCode(this.state.code);
      this.setState({
        alert: true,
        alertMessage: "Código cargado",
        loadModalOpen: false,
      });
      setTimeout(() => this.alertClose(), 2000);
    } catch (e) {
      this.setState({ codeError: true, codeErrorMessage: "Código inválido" });
      console.log(e);
    }
  }

  alertOpen(message) {
    this.setState({ alert: true, alertMessage: message });
  }

  alertClose() {
    this.setState({ alert: false });
  }

  closeLoadModal() {
    this.setState({ loadModalOpen: false });
  }

  getTrimmedCode() {
    let string = this.props.shareCode();
    return string.length > 30 ? string.substring(0, 27) + "..." : string;
  }

  render() {
    return (
      <>
        <Collapse
          in={this.state.alert}
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
                  this.alertClose();
                }}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
          >
            {this.state.alertMessage}
          </Alert>
        </Collapse>
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
        {/* Modal de compartido de códigos */}
        <Dialog
          open={this.state.shareModalOpen}
          onClose={() => this.closeShareModal()}
        >
          <DialogTitle>
            <Typography variant="h2" fontSize={"1.5rem"}>
              Compartir parámetros
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center" }}>
            <br></br>
            <Typography>
              Comparte el siguiente código de parámetros con otras personas para
              que puedan cargar la configuración actual y ver los mismo
              resultados
            </Typography>
            <br></br>
            <Button onClick={() => this.copyCode()}>
              Código: {this.getTrimmedCode()}
            </Button>
            <Button
              startIcon={<CopyAll></CopyAll>}
              variant="contained"
              onClick={() => this.copyCode()}
            >
              Copiar
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.closeShareModal()}>Cancelar</Button>
          </DialogActions>
        </Dialog>
        {/* Modal de cargado de códigos */}
        <Dialog
          open={this.state.loadModalOpen}
          onClose={() => this.closeLoadModal()}
        >
          <DialogTitle>
            <Typography variant="h2" fontSize={"1.5rem"}>
              Cargar parámetros
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center" }}>
            <br></br>
            <Typography>
              Ingrese un código de parámetros para cargar su configuración
            </Typography>
            <br></br>
            <Box>
              <TextField
                sx={{ marginRight: "20px" }}
                label="Código"
                placeholder="X;1;100;200;300"
                variant="filled"
                value={this.state.code}
                onChange={(e) => this.handleCodeChanged(e)}
                error={this.state.codeError}
                helperText={this.state.codeErrorMessage}
              ></TextField>
              <Button
                startIcon={<FileOpen />}
                variant="contained"
                sx={{ height: "55px" }}
                onClick={() => this.loadCode()}
              >
                Cargar
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.closeShareModal()}>Cancelar</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

export default SimulatorBanner;

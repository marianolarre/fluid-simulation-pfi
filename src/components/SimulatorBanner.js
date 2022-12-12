import React, { Component } from "react";
import {
  AppBar,
  Button,
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
import { Link, useLocation } from "react-router-dom";
import LinkIcon from "@mui/icons-material/Link";
import {
  ArrowBack,
  FileOpen,
  Share,
  Close,
  CopyAll,
} from "@mui/icons-material";
import MyTooltip from "./MyTooltip";

class SimulatorBanner extends Component {
  state = {
    shareModalOpen: false,
    loadModalOpen: false,
    changeModuleModalOpen: false,
    alert: false,
    alertMessage: "",
    invalidCode: false,
    codeError: false,
    codeErrorMessage: "",
    code: "",
    alreadyLoaded: false,
  };

  componentDidMount() {
    setTimeout(() => {
      const location = window.location;
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("c");
      this.validateCode(code);
    }, 10);
  }

  validateCode(code) {
    const location = window.location;
    const moduleID = location.pathname.substring(1);
    if (code != null) {
      const codeModuleID = code.substring(0, 2);
      if (codeModuleID == moduleID + ";") {
        this.props.loadCode(code);
        this.setState({
          alert: true,
          alertMessage: "Código cargado",
          loadModalOpen: false,
        });
        setTimeout(() => this.alertClose(), 2000);
        return true;
      } else {
        const validModuleCodeStarts = [
          "A;",
          "B;",
          "C;",
          "D;",
          "E;",
          "F;",
          "G;",
          "H;",
          "I;",
          "J;",
          "K;",
          "L;",
          "M;",
        ];
        if (validModuleCodeStarts.includes(codeModuleID)) {
          this.openChangeModuleModal();
          return false;
        } else {
          this.setState({
            codeError: true,
            codeErrorMessage: "El código cargado es inválido",
          });
          return false;
        }
      }
    }
  }

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

  closeChangeModuleModal() {
    this.setState({ changeModuleModalOpen: false });
  }

  openChangeModuleModal() {
    this.setState({ loadModalOpen: false, changeModuleModalOpen: true });
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

  copyURL() {
    navigator.clipboard.writeText(
      window.location.origin +
        "/" +
        this.getPathFromCode(this.props.shareCode())
    );
    this.alertOpen("Vínculo copiado al portapapeles");
    this.closeShareModal();
    setTimeout(() => this.alertClose(), 4000);
  }

  getPathFromCode(code) {
    const moduleID = code.substring(0, 1);
    return moduleID + "?c=" + code;
  }

  loadCode() {
    try {
      const validCode = this.validateCode(this.state.code);
      if (!validCode) return;
      this.props.loadCode(this.state.code);
      this.setState({
        alert: true,
        alertMessage: "Código cargado",
        loadModalOpen: false,
      });
      setTimeout(() => this.alertClose(), 2000);
    } catch (e) {
      this.setState({ codeError: true, codeErrorMessage: "Código inválido" });
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

  getTrimmedURL() {
    const code = this.props.shareCode();
    const moduleID = code.substring(0, 1);
    let string = window.location.origin + "/" + moduleID + "?c=" + code;
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
            <MyTooltip title="Volver al menu">
              <Link to="/" style={{ textDecoration: "none", color: "white" }}>
                <Button variant="default">
                  <ArrowBack fontSize="large"></ArrowBack>
                </Button>
              </Link>
            </MyTooltip>
            {this.props.title}
            <MyTooltip title="Cargar parámetros">
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
            </MyTooltip>
            <MyTooltip title="Compartir parámetros">
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
            </MyTooltip>
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
            <Button
              onClick={() => this.copyCode()}
              sx={{ textTransform: "none", width: "300px" }}
            >
              Código: {this.getTrimmedCode()}
            </Button>
            <Button
              startIcon={<CopyAll></CopyAll>}
              variant="contained"
              onClick={() => this.copyCode()}
            >
              Copiar código
            </Button>
            <Box sx={{ margin: "10px" }}></Box>
            <Button
              onClick={() => this.copyURL()}
              sx={{ textTransform: "none", width: "300px" }}
            >
              Vínculo: {this.getTrimmedURL()}
            </Button>
            <Button
              startIcon={<LinkIcon></LinkIcon>}
              variant="contained"
              onClick={() => this.copyURL()}
            >
              Copiar vínculo
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
            <Button onClick={() => this.closeLoadModal()}>Cancelar</Button>
          </DialogActions>
        </Dialog>
        {/* Modal de cambio de modulo */}
        <Dialog
          open={this.state.changeModuleModalOpen}
          onClose={() => this.closeChangeModuleModal()}
        >
          <DialogTitle>
            <Typography variant="h2" fontSize={"1.5rem"}>
              Cambiar de simulador
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center" }}>
            <br></br>
            <Typography>
              El código ingresado corresponde a otro simulador.
            </Typography>
            <Typography>¿Desea cambiar?</Typography>
            <br></br>
          </DialogContent>
          <DialogActions>
            <Link
              to={"/" + this.getPathFromCode(this.state.code)}
              style={{ textDecoration: "none" }}
              disabled={this.props.disabled}
            >
              <Button>Cambiar</Button>
            </Link>
            <Button onClick={() => this.closeChangeModuleModal()}>
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

export default SimulatorBanner;

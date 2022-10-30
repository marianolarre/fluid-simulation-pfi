import React, { Component } from "react";
import {
  AppBar,
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { blue } from "@mui/material/colors";
import MenuModule from "../components/MenuModule";
import { FileOpen } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";

const buttons = [
  {
    mod: "A",
    title: "Fuerzas de presión",
    description:
      "Observa la presión y las fuerzas que un líquido ejerce sobre las paredes de un contenedor cuadrado o redondo",
    img: "./img/modules/Modulo1.png",
  },
  {
    mod: "B",
    title: "Estratificación",
    description:
      "Observa la presión y las fuerzas ejercidas por una columna de distintos líquidos en las paredes de un contenedor",
    img: "./img/modules/Modulo2.png",
  },
  {
    mod: "C",
    title: "Manometría",
    description:
      "Funcionamiento del instrumento de medición de presión 'Manómetro'",
    img: "./img/modules/Modulo3.png",
  },
  {
    mod: "D",
    title: "Superficie sumergida",
    description: "Fuerzas de presión sobre una placa sumergida en un líquido",
    img: "./img/modules/Modulo4.png",
  },
  {
    mod: "E",
    title: "Dique",
    description:
      "Fuerzas que actuan sobre la superficie y los acoples de un dique",
    img: "./img/modules/Modulo5.png",
  },
  {
    mod: "F",
    title: "Flotación",
    description:
      "Fuerzas de presión y empuje que actuan sobre un cuerpo sumergido en un líquido",
    img: "./img/modules/Modulo6.png",
  },
  {
    mod: "G",
    title: "Cinemática",
    description:
      "Observa las líneas de humo, trayectoria y corriente de partículas en un campo de velocidades",
    img: "./img/modules/Modulo7.png",
  },
  {
    mod: "H",
    title: "Volumen de control",
    description:
      "Sumatorias de fuerzas y caudales de entradas y salidas de fluido en un volumen de control",
    img: "./img/modules/Modulo8.png",
  },
  {
    mod: "I",
    title: "Flujo no viscoso",
    description:
      "Presión y velocidad de fluidos no viscosos en distintas situaciónes",
    img: "./img/modules/Modulo9.png",
  },
  {
    mod: "J",
    title: "Flujo viscoso",
    description:
      "Comportamiento de un fluido viscoso atrapado entre una placa fija y una placa en movimiento",
    img: "./img/modules/Modulo10.png",
  },
  {
    mod: "K",
    title: "Flujo viscoso laminar",
    description:
      "Tensión de corte y capa límite de un fluido viscoso viajando sobre una superficie fija",
    img: "./img/modules/Modulo11.png",
  },
  {
    mod: "L",
    title: "Flujo interno en conducto",
    description:
      "Observa las energías de un fluido a medida que viaja por una tubería",
    img: "./img/modules/Modulo12.png",
  },
  {
    mod: "M",
    title: "Tiro oblícuo con arrastre",
    description:
      "Observa las fuerzas que actuan sobre un proyectil viajando por un fluido",
    img: "./img/modules/Modulo13.png",
  },
];

class Menu extends Component {
  state = {
    loadModalOpen: false,
    code: "",
    valid: false,
    error: false,
    errorMessage: "",
  };

  validateCode(code) {
    if (this.isCodeValid(code)) {
      this.setState({ error: false, errorMessage: "", valid: true });
    } else {
      this.setState({
        error: true,
        errorMessage: "Código inválido",
        valid: false,
      });
    }
  }

  isCodeValid(code) {
    if (code != null) {
      const codeModuleID = code.substring(0, 2);
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
        return true;
      } else {
        return false;
      }
    }
  }

  loadCode() {}

  handleCodeChanged(event) {
    this.setState({
      code: event.target.value,
      valid: this.validateCode(event.target.value),
    });
  }

  openLoadModal() {
    this.setState({ loadModalOpen: true });
  }

  closeLoadModal() {
    this.setState({ loadModalOpen: false });
  }

  getPathFromCode(code) {
    const moduleID = code.substring(0, 1);
    return moduleID + "?c=" + code;
  }

  render() {
    const buttonStyle = { width: "100%" };
    return (
      <>
        <AppBar
          position="relative"
          sx={{
            padding: 2,
          }}
        >
          <Box
            sx={{
              display: "block",
              width: "100%",
              textAlign: "center",
            }}
          >
            <img
              src="https://i.imgur.com/aGUTiIo.png"
              alt="Fluidemos"
              style={{ maxHeight: "7rem" }}
            ></img>
            <Typography
              sx={{ paddingTop: "1rem", color: "white", fontSize: "2rem" }}
            >
              Simulador didáctico de Mecánica de Fluidos
            </Typography>
          </Box>
        </AppBar>
        <Box
          sx={{
            width: "100%",
          }}
        >
          <Paper
            sx={{
              padding: "4rem",
              textAlign: "center",
              backgroundColor: blue[400],
            }}
          >
            <Typography
              sx={{ paddingTop: "2rem", color: "white", fontSize: "1.2rem" }}
            >
              Seleccione uno de los siguientes módulos para comenzar una
              simulación<br></br>o utilice un código para cargar una
              configuración previa
            </Typography>
            <br></br>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => this.openLoadModal()}
            >
              <FileOpen sx={{ paddingRight: "10px" }}></FileOpen>
              Cargar código
            </Button>
          </Paper>
        </Box>
        <Box
          sx={{
            bgcolor: blue[100],
            pt: 3,
            pb: 6,
          }}
        >
          <Box>
            <Grid container sx={{ width: "90%", marginLeft: "5%" }}>
              {buttons.map((b, index) => (
                <Grid item xs={6} xl={4} key={index}>
                  <MenuModule
                    title={b.title}
                    description={b.description}
                    img={b.img}
                    to={b.mod}
                    disabled={b.disabled}
                  ></MenuModule>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
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
                error={this.state.error}
                helperText={this.state.errorMessage}
              ></TextField>

              <Link
                to={
                  this.isCodeValid(this.state.code)
                    ? this.getPathFromCode(this.state.code)
                    : "#"
                }
                style={{ textDecoration: "none" }}
              >
                <Button
                  disabled={!this.isCodeValid(this.state.code)}
                  startIcon={<FileOpen />}
                  variant="contained"
                  sx={{ height: "55px" }}
                >
                  Cargar
                </Button>
              </Link>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.closeLoadModal()}>Cancelar</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

export default Menu;

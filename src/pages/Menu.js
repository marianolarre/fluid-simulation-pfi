import React, { Component } from "react";
import { AppBar, Box, Grid } from "@mui/material";
import MenuModule from "../components/MenuModule";

const buttons = [
  {
    mod: "mod1",
    title: "Fuerzas de presión",
    description:
      "Observa la presión y las fuerzas que un líquido ejerce sobre las paredes de un contenedor cuadrado o redondo",
    img: "./img/modules/Modulo1.png",
  },
  {
    mod: "mod2",
    title: "Estratificación",
    description:
      "Observa la presión y las fuerzas ejercidas por una columna de distintos líquidos en las paredes de un contenedor",
    img: "./img/modules/Modulo2.png",
  },
  {
    mod: "mod3",
    title: "Manometría",
    description:
      "Funcionamiento del instrumento de medición de presión 'Manómetro'",
    img: "./img/modules/Modulo3.png",
  },
  {
    mod: "mod4",
    title: "Superficie sumergida",
    description: "Fuerzas de presión sobre una placa sumergida en un líquido",
    img: "./img/modules/Modulo4.png",
  },
  {
    mod: "mod5",
    title: "Dique",
    description:
      "Fuerzas que actuan sobre la superficie y los acoples de un dique",
    img: "./img/modules/Modulo5.png",
  },
  {
    mod: "mod6",
    title: "Flotación",
    description:
      "Fuerzas de presión y empuje que actuan sobre un cuerpo sumergido en un líquido",
    img: "./img/modules/Modulo6.png",
  },
  {
    mod: "mod7",
    title: "Cinemática",
    description:
      "Observa las líneas de humo, trayectoria y corriente de partículas en un campo de velocidades",
    img: "./img/modules/Modulo7.png",
  },
  {
    mod: "mod8",
    title: "Volumen de control",
    description:
      "Sumatorias de fuerzas y caudales de entradas y salidas de fluido en un volumen de control",
    img: "./img/modules/Modulo8.png",
  },
  {
    mod: "mod9",
    title: "Flujo no viscoso",
    description:
      "Presión y velocidad de fluidos no viscosos en distintas situaciónes",
    img: "./img/modules/Modulo9.png",
  },
  {
    mod: "mod10",
    title: "Flujo viscoso",
    description:
      "Comportamiento de un fluido viscoso atrapado entre una placa fija y una placa en movimiento",
    img: "./img/modules/Modulo10.png",
  },
  {
    mod: "mod11",
    title: "Flujo viscoso laminar",
    disabled: true,
    description:
      "Tensión de corte y capa límite de un fluido viscoso viajando sobre una superficie fija",
    img: "./img/modules/UnderConstruction.png",
  },
  {
    mod: "mod12",
    title: "Flujo interno en conducto",
    disabled: true,
    description:
      "Observa las energías de un fluido a medida que viaja por una tubería",
    img: "./img/modules/UnderConstruction.png",
  },
  {
    mod: "mod13",
    title: "Tiro oblícuo con arrastre",
    description:
      "Observa las fuerzas que actuan sobre un proyectil viajando por un fluido",
    img: "./img/modules/Modulo13.png",
  },
  {
    mod: "mod14",
    title: "Perfil alar",
    disabled: true,
    description:
      "Visualización de lift, drag y turbulencia de un cuerpo en un tunel de viento",
    img: "./img/modules/UnderConstruction.png",
  },
];

class Menu extends Component {
  state = {};
  render() {
    const buttonStyle = { width: "100%" };
    return (
      <div>
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
              style={{ maxHeight: "100px" }}
            ></img>
          </Box>
        </AppBar>
        <Box
          sx={{
            bgcolor: "background.paper",
            pt: 5,
            pb: 6,
          }}
        >
          <Box>
            <Grid container>
              {buttons.map((b, index) => (
                <Grid item xs={4}>
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
      </div>
    );
  }
}

export default Menu;

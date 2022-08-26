import React, { Component } from "react";
import { Typography, Button, Stack, AppBar, Box } from "@mui/material";
import { Link } from "react-router-dom";
import { Container } from "@mui/system";
import WavesIcon from "@mui/icons-material/Waves";

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
              src="../../fluidemos light.png"
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
            <Stack direction="row">
              <Container maxWidth="sm">
                <Stack spacing={1.8}>
                  <Link to="mod1" style={{ textDecoration: "none" }}>
                    <Button variant="contained" style={buttonStyle}>
                      Fuerzas de presión
                    </Button>
                  </Link>
                  <Link to="mod2" style={{ textDecoration: "none" }}>
                    <Button variant="contained" style={buttonStyle}>
                      Estratificación
                    </Button>
                  </Link>
                  <Link to="mod3" style={{ textDecoration: "none" }}>
                    <Button variant="contained" style={buttonStyle}>
                      Manometría
                    </Button>
                  </Link>
                  <Button variant="contained" disabled>
                    Superficie sumergida
                  </Button>
                  <Button variant="contained" disabled>
                    Dique
                  </Button>
                  <Link to="mod6" style={{ textDecoration: "none" }}>
                    <Button variant="contained" style={buttonStyle}>
                      Flotación
                    </Button>
                  </Link>
                  <Button variant="contained" disabled>
                    Cinemática
                  </Button>
                  <Button variant="contained" disabled>
                    Volumen de control
                  </Button>
                  <Button variant="contained" disabled>
                    Flujo no viscoso
                  </Button>
                  <Button variant="contained" disabled>
                    Flujo viscoso
                  </Button>
                  <Button variant="contained" disabled>
                    Flujo viscoso laminar
                  </Button>
                  <Button variant="contained" disabled>
                    Flujo interno en conducto
                  </Button>
                  <Button variant="contained" disabled>
                    Tiro oblicuo con arrastre
                  </Button>
                  <Button variant="contained" disabled>
                    Perfil alar
                  </Button>
                </Stack>
              </Container>
              <Box>
                {/*TODO: Agregar un panel con información del simulador seleccionado*/}
              </Box>
            </Stack>
          </Box>
        </Box>
      </div>
    );
  }
}

export default Menu;

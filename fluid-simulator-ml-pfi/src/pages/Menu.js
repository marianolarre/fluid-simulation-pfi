import React, { Component } from "react";
import { Typography, Button, Stack, AppBar, Box } from "@mui/material";
import { Link } from "react-router-dom";
import { Container } from "@mui/system";
import WavesIcon from "@mui/icons-material/Waves";

class Menu extends Component {
  state = {};
  render() {
    return (
      <div>
        <AppBar
          position="relative"
          sx={{
            padding: 2,
          }}
        >
          <Typography variant="h4" component="h1">
            <WavesIcon
              fontSize="large"
              sx={{
                pr: 2,
              }}
            ></WavesIcon>
            Simulador de fluidos
          </Typography>
        </AppBar>
        <Box
          sx={{
            bgcolor: "background.paper",
            pt: 8,
            pb: 6,
          }}
        >
          <Box>
            <Stack direction="row">
              <Container maxWidth="sm">
                <Stack spacing={2}>
                  <Link to="mod1" style={{ textDecoration: "none" }}>
                    <Button variant="contained" style={{ width: "100%" }}>
                      Hidroestática
                    </Button>
                  </Link>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
                  </Button>
                  <Button variant="contained" disabled>
                    Modulo (Coming soon)
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

import { Button, Box, Stack, Typography } from "@mui/material";
import React, { Component } from "react";
import { Link } from "react-router-dom";

class MenuModule extends Component {
  state = {};
  render() {
    return (
      <Box
        style={{
          width: "100%",
          padding: "30px",
          boxSizing: "border-box",
        }}
      >
        <Link
          to={this.props.to}
          style={{ textDecoration: "none" }}
          disabled={this.props.disabled}
        >
          <Button
            disabled={this.props.disabled}
            onClick={this.props.onClick}
            variant="contained"
            style={{ width: "100%", padding: "25px", textTransform: "none" }}
          >
            <Stack direction="column">
              <Typography variant="h2" fontSize={40} marginBottom={3}>
                {this.props.title}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                  variant="p"
                  fontSize={20}
                  lineHeight={1.2}
                  margin={1}
                  align="left"
                >
                  {this.props.description}
                </Typography>
                {(this.props.disabled && (
                  <img
                    src={this.props.img}
                    style={{
                      borderRadius: "10px",
                      border: "5px solid #888",
                    }}
                  ></img>
                )) || (
                  <img
                    src={this.props.img}
                    style={{
                      borderRadius: "10px",
                      border: "5px solid #048",
                    }}
                  ></img>
                )}
              </Stack>
            </Stack>
          </Button>
        </Link>
      </Box>
    );
  }
}

export default MenuModule;

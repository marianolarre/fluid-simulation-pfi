import { Grid, Typography } from "@mui/material";
import React, { Component } from "react";
import { MathComponent } from "mathjax-react";

class EquationReferences extends Component {
  state = {};
  render() {
    return (
      <Grid container>
        {this.props.parameters.map((p, index) => (
          <Grid item key={index} xs={12}>
            <Grid container>
              <Grid
                item
                style={{
                  height: p.high ? "45px" : "30px",
                  position: "relative",
                  bottom: "17px",
                }}
              >
                <MathComponent tex={p.letter} />
              </Grid>
              <Grid item>
                <Typography
                  style={{
                    marginLeft: "10px",
                    marginTop: p.high ? "7px" : "0px",
                  }}
                >
                  {p.description}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  }
}

export default EquationReferences;

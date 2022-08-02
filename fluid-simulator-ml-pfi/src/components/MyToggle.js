import React, { Component } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Switch } from "@mui/material";

class MyToggle extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Box sx={{ width: "100%" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography id="input-slider" gutterBottom>
              {this.props.label}
            </Typography>
          </Grid>
          <Grid item xs>
            <Switch
              checked={this.props.checked}
              onChange={this.props.onChange}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }
}

export default MyToggle;

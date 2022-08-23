import React, { Component } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Switch,
} from "@mui/material";
import { blue } from "@mui/material/colors";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

class MyRadio extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Paper
        sx={{
          width: "92%",
          background: blue[50],
          padding: "2%",
          paddingLeft: "6%",
        }}
        elevation={0}
      >
        <RadioGroup value={this.props.value} onChange={this.props.onChange} row>
          {this.props.options.map((option, index) => (
            <FormControlLabel
              key={index}
              value={option.value}
              label={option.label}
              control={<Radio />}
            />
          ))}
        </RadioGroup>
      </Paper>
    );
  }
}

export default MyRadio;

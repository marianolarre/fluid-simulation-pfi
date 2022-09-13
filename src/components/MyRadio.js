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
import PanelModule from "./PanelModule";

class MyRadio extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <PanelModule>
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
      </PanelModule>
    );
  }
}

export default MyRadio;

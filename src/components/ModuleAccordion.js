import React, { Component } from "react";
import { blue } from "@mui/material/colors";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Paper,
  Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import PanelModule from "./PanelModule";

class ModuleAccordion extends Component {
  state = {};
  render() {
    return (
      <PanelModule>
        <Accordion
          sx={{
            background: blue[50],
            boxShadow: "none",
            borderRadius: "4px",
            paddingLeft: "10px",
            border: this.props.hasBorder ? "solid 1px #0005" : "none",
          }}
          disableGutters
        >
          <AccordionSummary
            expandIcon={<ExpandMore></ExpandMore>}
            style={{ padding: "0", margin: "0" }}
          >
            <Typography
              style={{ width: "100%" }}
              fontSize={this.props.fontSize || 18}
              align={this.props.center ? "center" : "left"}
            >
              {this.props.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails style={{ padding: "0", margin: "0" }}>
            {this.props.children}
          </AccordionDetails>
        </Accordion>
      </PanelModule>
    );
  }
}

export default ModuleAccordion;

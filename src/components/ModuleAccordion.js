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
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore></ExpandMore>}>
            <Typography fontSize={18}>{this.props.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>{this.props.children}</AccordionDetails>
        </Accordion>
      </PanelModule>
    );
  }
}

export default ModuleAccordion;

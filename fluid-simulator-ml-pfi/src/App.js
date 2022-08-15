import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Modulo1FuerzasDePresion from "./pages/Modulo1FuerzasDePresion";
import Modulo2Estratificacion from "./pages/Modulo2Estratificacion";
import Modulo3Manometria from "./pages/Modulo3Manometria";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu></Menu>}></Route>
        <Route
          path="mod2"
          element={<Modulo1FuerzasDePresion></Modulo1FuerzasDePresion>}
        ></Route>
        <Route
          path="mod2"
          element={<Modulo2Estratificacion></Modulo2Estratificacion>}
        ></Route>
        <Route
          path="mod3"
          element={<Modulo3Manometria></Modulo3Manometria>}
        ></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

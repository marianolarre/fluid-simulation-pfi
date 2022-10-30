import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Modulo1FuerzasDePresion from "./pages/Modulo1FuerzasDePresion";
import Modulo2Estratificacion from "./pages/Modulo2Estratificacion";
import Modulo3Manometria from "./pages/Modulo3Manometria";
import Modulo6Flotacion from "./pages/Modulo6Flotacion";
import { useEffect } from "react";
import Modulo4SuperficieSumergida from "./pages/Modulo4SuperficieSumergida";
import Modulo5Dique from "./pages/Modulo5Dique";
import Modulo7Cinematica from "./pages/Modulo7Cinematica";
import Modulo8VolumenDeControl from "./pages/Modulo8VolumenDeControl";
import Modulo9FlujoNoViscoso from "./pages/Modulo9FlujoNoViscoso";
import Modulo10FlujoViscoso from "./pages/Modulo10FlujoViscoso";
import Modulo13TiroOblicuo from "./pages/Modulo13TiroOblicuo";
import Modulo12FlujoInternoPorConducto from "./pages/Modulo12FlujoInternoPorConducto";
import Modulo11FlujoViscosoLaminar from "./pages/Modulo11FlujoViscosoLaminar";

function App() {
  useEffect(() => {
    document.title = "Fluidemos";
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu></Menu>}></Route>
        <Route
          path="A"
          element={<Modulo1FuerzasDePresion></Modulo1FuerzasDePresion>}
        ></Route>
        <Route
          path="B"
          element={<Modulo2Estratificacion></Modulo2Estratificacion>}
        ></Route>
        <Route
          path="C"
          element={<Modulo3Manometria></Modulo3Manometria>}
        ></Route>
        <Route
          path="D"
          element={<Modulo4SuperficieSumergida></Modulo4SuperficieSumergida>}
        ></Route>
        <Route path="E" element={<Modulo5Dique></Modulo5Dique>}></Route>
        <Route path="F" element={<Modulo6Flotacion></Modulo6Flotacion>}></Route>
        <Route
          path="G"
          element={<Modulo7Cinematica></Modulo7Cinematica>}
        ></Route>
        <Route
          path="H"
          element={<Modulo8VolumenDeControl></Modulo8VolumenDeControl>}
        ></Route>
        <Route
          path="I"
          element={<Modulo9FlujoNoViscoso></Modulo9FlujoNoViscoso>}
        ></Route>
        <Route
          path="J"
          element={<Modulo10FlujoViscoso></Modulo10FlujoViscoso>}
        ></Route>
        <Route
          path="K"
          element={<Modulo11FlujoViscosoLaminar></Modulo11FlujoViscosoLaminar>}
        ></Route>
        <Route
          path="L"
          element={
            <Modulo12FlujoInternoPorConducto></Modulo12FlujoInternoPorConducto>
          }
        ></Route>
        <Route
          path="M"
          element={<Modulo13TiroOblicuo></Modulo13TiroOblicuo>}
        ></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

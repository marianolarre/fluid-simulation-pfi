import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Modulo2Estratificacion from "./pages/Modulo2Estratificacion";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu></Menu>}></Route>
        <Route
          path="mod2"
          element={<Modulo2Estratificacion></Modulo2Estratificacion>}
        ></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

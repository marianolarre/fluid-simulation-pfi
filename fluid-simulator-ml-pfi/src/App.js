import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Modulo1hidroestatica from "./pages/Modulo1hidroestatica";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu></Menu>}></Route>
        <Route
          path="mod1"
          element={<Modulo1hidroestatica></Modulo1hidroestatica>}
        ></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import "./App.css";
import Input from "./components/input.js";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ItemsList from "./components/ItemsList.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Input />} />
        <Route path="/items" element={<ItemsList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ReturnPage from "./pages/ReturnPage";
import CancelPage from "./pages/CancelPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/return" element={<ReturnPage />} />
        <Route path="/cancel" element={<CancelPage />} />
      </Routes>
    </BrowserRouter>
  );
}

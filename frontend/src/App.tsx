import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Generator from "./pages/generator/generator.tsx";
import Register from "./pages/Register/register.tsx";
import LogIn from "./pages/LogIn/LogIn.tsx";
import RegisterConfirm from "./pages/RegisterConfirm/registerConfirm.tsx";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Generator />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<LogIn />} />
                <Route path="/register/confirm" element={<RegisterConfirm />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App

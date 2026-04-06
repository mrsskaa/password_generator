import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Main from "./pages/generator/generator.tsx";
import Register from "./pages/Register/register.tsx";
import LogIn from "./pages/LogIn/LogIn.tsx";
import HomePage from "./pages/HomePage/HomePage.tsx";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<LogIn />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App

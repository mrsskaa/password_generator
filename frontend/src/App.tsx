import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Generator from "./pages/Generator/Generator";



function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Generator />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App

import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Generator from "./pages/Generator/Generator.tsx";
import Register from "./pages/Register/Register.tsx";
import LogIn from "./pages/LogIn/LogIn.tsx";
import RegisterConfirm from "./pages/RegisterConfirm/registerConfirm.tsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.tsx";
import ForgotPasswordConfirm from "./pages/ForgotPasswordConfirm/ForgotPasswordConfirm.tsx";
import ForgotPasswordReset from "./pages/ForgotPasswordReset/ForgotPasswordReset.tsx";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Generator />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<LogIn />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/forgot-password/confirm" element={<ForgotPasswordConfirm />} />
                <Route path="/forgot-password/reset" element={<ForgotPasswordReset />} />
                <Route path="/register/confirm" element={<RegisterConfirm />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App

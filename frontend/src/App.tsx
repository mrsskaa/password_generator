import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import './App.css'
import Generator from "./pages/Generator/Generator";
import LogIn from "./pages/LogIn/LogIn";
import Register from "./pages/Register/Register";
import RegisterConfirm from "./pages/RegisterConfirm/registerConfirm";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ForgotPasswordConfirm from "./pages/ForgotPasswordConfirm/ForgotPasswordConfirm";
import ForgotPasswordReset from "./pages/ForgotPasswordReset/ForgotPasswordReset";
import SavePassword from "./pages/SavePassword/SavePassword";
import MyPasswords from "./pages/MyPasswords/MyPasswords";
import { loginSuccess } from "./store/authSlice";
import { fetchCurrentUser } from "./api/authApi";
import type { AppDispatch } from "./store/store";

function SessionBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    let cancelled = false;
    void fetchCurrentUser().then((user) => {
      if (!cancelled && user) {
        dispatch(loginSuccess(user));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
  return null;
}

function App() {
    return (
        <BrowserRouter>
            <SessionBootstrap />
            <Routes>
                <Route path="/" element={<Generator />} />
                <Route path="/login" element={<LogIn />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register/confirm" element={<RegisterConfirm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/forgot-password/confirm" element={<ForgotPasswordConfirm />} />
                <Route path="/forgot-password/reset" element={<ForgotPasswordReset />} />
                <Route path="/passwords/save" element={<SavePassword />} />
                <Route path="/passwords" element={<MyPasswords />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App

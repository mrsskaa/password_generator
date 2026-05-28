import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import './App.css';
import { AppToastProvider } from './components/AppToast/AppToastProvider';
import Generator from "./pages/Generator/Generator";
import LogIn from "./pages/LogIn/LogIn";
import Register from "./pages/Register/Register";
import RegisterConfirm from "./pages/RegisterConfirm/registerConfirm";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ForgotPasswordConfirm from "./pages/ForgotPasswordConfirm/ForgotPasswordConfirm";
import ForgotPasswordReset from "./pages/ForgotPasswordReset/ForgotPasswordReset";
import SavePassword from "./pages/SavePassword/SavePassword";
import MyPasswords from "./pages/MyPasswords/MyPasswords";
import PasswordUnlock from "./pages/PasswordUnlock/PasswordUnlock";
import PasswordDetails from "./pages/PasswordDetails/PasswordDetails";
import NotFound404 from "./pages/404/NotFound404";
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
            <AppToastProvider>
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
                <Route path="/passwords/:passwordId/unlock" element={<PasswordUnlock />} />
                <Route path="/passwords/:passwordId" element={<PasswordDetails />} />
                <Route path="*" element={<NotFound404 />} />
            </Routes>
            </AppToastProvider>
        </BrowserRouter>
    )
}

export default App

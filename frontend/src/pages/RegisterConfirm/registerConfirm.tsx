import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../store/authSlice';
import { confirmRegistrationRequest, loginRequest, resendRegistrationCodeRequest } from '../../api/authApi';
import ConfirmCodeForm from '../../components/ConfirmCodeForm/ConfirmCodeForm';

/**
 * Сначала подтверждаем код на бэке, затем логин (cookie) — иначе 403 «Подтвердите email».
 */
function RegisterConfirm() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    email?: string;
    password?: string;
    flashMessage?: string;
    initialError?: string;
  } | null;

  useEffect(() => {
    if (!state?.email || !state?.password) {
      navigate('/register', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.email || !state?.password) {
    return null;
  }

  const { password } = state;

  return (
    <ConfirmCodeForm
      title="ВВЕДИТЕ КОД ИЗ ПИСЬМА"
      backPath="/register"
      initialMessage={state.flashMessage}
      initialError={state.initialError}
      successMessage="Аккаунт подтверждён. Сейчас откроется генератор…"
      errorMessage="Неверный код или срок действия истёк."
      onConfirm={async ({ email: em, code }) => {
        await confirmRegistrationRequest({ email: em, code });
        const response = await loginRequest({ email: em, password });
        dispatch(loginSuccess(response.user));
      }}
      onResend={resendRegistrationCodeRequest}
      onSuccessRedirect="/"
    />
  );
}

export default RegisterConfirm;

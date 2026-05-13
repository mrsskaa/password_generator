import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../store/authSlice';
import {
  confirmRegistrationRequest,
  loginRequest,
  resendRegistrationCodeRequest,
} from '../../api/authApi';
import ConfirmCodeForm from '../../components/ConfirmCodeForm/ConfirmCodeForm';

/**
 * После ввода кода подтверждения регистрация завершается на бэке,
 * и пользователь попадает в генератор уже с активной сессией.
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

  return (
    <ConfirmCodeForm
      title="ВВЕДИТЕ КОД ИЗ ПИСЬМА"
      backPath="/register"
      initialMessage={state.flashMessage}
      initialError={state.initialError}
      successMessage="Аккаунт подтверждён. Сейчас откроется генератор…"
      errorMessage="Неверный код или срок действия истёк."
      onConfirm={async ({ email, code }) => {
        await confirmRegistrationRequest({ email, code });
        const loginResponse = await loginRequest({ email, password: state.password ?? '' });
        dispatch(loginSuccess(loginResponse.user));
      }}
      onResend={resendRegistrationCodeRequest}
      onSuccessRedirect="/"
    />
  );
}

export default RegisterConfirm;

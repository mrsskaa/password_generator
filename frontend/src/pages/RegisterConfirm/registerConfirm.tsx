import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../store/authSlice';
import {
  confirmRegistrationRequest,
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
  const state = location.state as { email?: string; flashMessage?: string } | null;

  useEffect(() => {
    if (!state?.email) {
      navigate('/register', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.email) {
    return null;
  }

  return (
    <ConfirmCodeForm
      title="ВВЕДИТЕ КОД ИЗ ПИСЬМА"
      backPath="/register"
      initialMessage={state.flashMessage}
      successMessage="Аккаунт подтверждён. Сейчас откроется генератор…"
      errorMessage="Неверный код или срок действия истёк."
      onConfirm={async ({ email, code }) => {
        const response = await confirmRegistrationRequest({ email, code });
        if (response.user) {
          dispatch(loginSuccess(response.user));
        }
      }}
      onResend={resendRegistrationCodeRequest}
      onSuccessRedirect="/"
    />
  );
}

export default RegisterConfirm;

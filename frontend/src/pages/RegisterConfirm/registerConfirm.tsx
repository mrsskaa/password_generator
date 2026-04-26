import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../store/authSlice';
import { loginRequest, resendRegistrationCodeRequest } from '../../api/authApi';
import ConfirmCodeForm from '../../components/ConfirmCodeForm/ConfirmCodeForm';

/**
 * На бэкенде пока нет проверки кода регистрации: письмо — приветственное.
 * После ввода 6 цифр выполняется вход по email/паролю (cookie `access_token`),
 * чтобы пользователь оказался на генераторе уже с сессией.
 */
function RegisterConfirm() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { email?: string; password?: string; flashMessage?: string } | null;

  useEffect(() => {
    if (!state?.email || !state?.password) {
      navigate('/register', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.email || !state?.password) {
    return null;
  }

  const { email, password } = state;

  return (
    <ConfirmCodeForm
      title="ВВЕДИТЕ КОД ИЗ ПИСЬМА"
      backPath="/register"
      initialMessage={state.flashMessage}
      successMessage="Вход выполнен. Сейчас откроется генератор…"
      errorMessage="Не удалось войти. Проверьте данные и попробуйте снова."
      onConfirm={async ({ code }) => {
        void code;
        const response = await loginRequest({ email, password });
        dispatch(loginSuccess(response.user));
      }}
      onResend={resendRegistrationCodeRequest}
      onSuccessRedirect="/?flash=confirm_success"
    />
  );
}

export default RegisterConfirm;

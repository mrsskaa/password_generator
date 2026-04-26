import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import {
  confirmRegistrationRequest,
  resendRegistrationCodeRequest,
} from '../../api/authApi';
import ConfirmCodeForm from '../../components/ConfirmCodeForm/ConfirmCodeForm';

function RegisterConfirm() {
  const dispatch = useDispatch();
  return (
    <ConfirmCodeForm
      title="ВВЕДИТЕ КОД ИЗ ПИСЬМА"
      backPath="/register"
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

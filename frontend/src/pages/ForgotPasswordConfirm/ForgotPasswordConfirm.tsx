import ConfirmCodeForm from '../../components/ConfirmCodeForm/ConfirmCodeForm';
import { confirmForgotPasswordRequest, resendForgotPasswordCodeRequest } from '../../api/authApi';

function ForgotPasswordConfirm() {
  return (
    <ConfirmCodeForm
      title="ВВЕДИТЕ КОД ИЗ ПИСЬМА"
      backPath="/forgot-password"
      successMessage="Код подтверждён. Сейчас откроется страница смены пароля…"
      errorMessage="Неверный код или срок действия истёк."
      onConfirm={confirmForgotPasswordRequest}
      onResend={resendForgotPasswordCodeRequest}
      onSuccessRedirect={({ email, result }) => {
        const data = result as { reset_token?: string };
        const token = data.reset_token ?? '';
        return `/forgot-password/reset?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
      }}
    />
  );
}

export default ForgotPasswordConfirm;

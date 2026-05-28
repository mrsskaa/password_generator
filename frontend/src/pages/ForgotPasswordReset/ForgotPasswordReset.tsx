import { useEffect, useState } from 'react';
import { Button, Form, Nav } from 'react-bootstrap';
import { showAppToast } from '../../components/AppToast/AppToastProvider';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '../../components/Header/Header';
import AuthForm from '../../components/AuthForm/AuthForm';
import resetPasswordSchema, { type ResetPasswordFormData } from '../../schemas/resetPasswordSchema';
import { MAX_INPUT_LENGTH } from '../../constants/inputLimits';
import { getAxiosErrorMessage, resetForgotPasswordRequest } from '../../api/authApi';
import './ForgotPasswordReset.css';

function ForgotPasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!submitSuccess) {
      return;
    }
    showAppToast('Пароль успешно обновлён. Сейчас откроется страница входа…');
  }, [submitSuccess]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    clearErrors('root');
    setSubmitSuccess(false);
    if (!resetToken) {
      setError('root', {
        type: 'server',
        message: 'Не найден токен сброса. Пройдите восстановление заново.',
      });
      return;
    }
    try {
      await resetForgotPasswordRequest({ newPassword: data.password, resetToken });
      setSubmitSuccess(true);
      window.setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('root', {
        type: 'server',
        message: getAxiosErrorMessage(err, 'Не удалось сменить пароль. Попробуйте позже.'),
      });
    }
  };

  const form = (
    <Form className="forgot-password-reset-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className="mb-3">
        <Form.Label className="auth-form-body-label">Новый пароль:</Form.Label>
        <div className="password-field-wrapper">
          <Form.Control
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            maxLength={MAX_INPUT_LENGTH}
            placeholder="password"
            isInvalid={!!errors.password}
            className="auth-form-body-input"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label="Показать пароль"
          >
            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`} aria-hidden />
          </button>
        </div>
        {errors.password?.message && (
          <span className="auth-field-error" role="alert">
            {errors.password.message}
          </span>
        )}
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="auth-form-body-label">Подтверждение пароля:</Form.Label>
        <div className="password-field-wrapper">
          <Form.Control
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            maxLength={MAX_INPUT_LENGTH}
            placeholder="password"
            isInvalid={!!errors.confirmPassword}
            className="auth-form-body-input"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label="Показать подтверждение пароля"
          >
            <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`} aria-hidden />
          </button>
        </div>
        {errors.confirmPassword?.message && (
          <span className="auth-field-error" role="alert">
            {errors.confirmPassword.message}
          </span>
        )}
      </Form.Group>

      {errors.root?.message && (
        <div className="auth-field-error mb-3" role="alert">
          {errors.root.message}
        </div>
      )}

      <div className="auth-form-bottom">
        <div className="auth-form-bottom-back-link-container">
          <Nav.Link as={Link} to="/forgot-password/confirm" className="auth-form-bottom-back-link">
            {'<< назад'}
          </Nav.Link>
        </div>
        <div className="justify-content-center auth-form-submit-button-container">
          <Button variant="default" type="submit" className="justify-content-center auth-form-submit-button">
            СБРОСИТЬ
          </Button>
        </div>
      </div>
    </Form>
  );

  return (
    <>
      <Header />
      <AuthForm title={<h2 className="text-center">СБРОС ПАРОЛЯ</h2>} form={form} />
    </>
  );
}

export default ForgotPasswordReset;

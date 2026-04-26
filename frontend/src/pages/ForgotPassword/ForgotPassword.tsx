import './ForgotPassword.css';
import Header from '../../components/Header/Header';
import AuthForm from '../../components/AuthForm/AuthForm';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Nav } from 'react-bootstrap';
import forgotPasswordSchema, { type ForgotPasswordFormData } from '../../schemas/forgotPasswordSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { forgotPasswordRequest, getAxiosErrorMessage } from '../../api/authApi';
import { MAX_INPUT_LENGTH } from '../../constants/inputLimits';

function ForgotPassword() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const emailValue = watch('email') ?? '';

  const onSubmit = async (data: ForgotPasswordFormData) => {
    clearErrors('root');
    try {
      await forgotPasswordRequest({ email: data.email });
      reset({ email: data.email });
      navigate('/forgot-password/confirm', { state: { email: data.email } });
    } catch (err) {
      setError('root', {
        type: 'server',
        message: getAxiosErrorMessage(err, 'Не удалось отправить письмо. Попробуйте позже.'),
      });
    }
  };

  const form = (
    <Form className="forgot-password-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className="mb-3">
        <Form.Label className="auth-form-body-label">Введите электронную почту:</Form.Label>
        <div className="input-field-wrapper">
          <Form.Control
            type="email"
            {...register('email')}
            maxLength={MAX_INPUT_LENGTH}
            placeholder="example@gmail.com"
            isInvalid={!!errors.email}
            className="auth-form-body-input"
            autoComplete="email"
          />
          {emailValue && (
            <button
              type="button"
              className="input-clear-btn"
              onClick={() => setValue('email', '', { shouldValidate: true, shouldDirty: true })}
              aria-label="Очистить поле почты"
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
          )}
        </div>
        {errors.email?.message && (
          <span className="auth-field-error" role="alert">
            {errors.email.message}
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
          <Nav.Link as={Link} to="/login" className="auth-form-bottom-back-link">
            {'<< назад'}
          </Nav.Link>
        </div>
        <div className="justify-content-center auth-form-submit-button-container">
          <Button variant="default" type="submit" className="justify-content-center auth-form-submit-button">
            ПРОДОЛЖИТЬ
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

export default ForgotPassword;

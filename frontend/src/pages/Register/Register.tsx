import { useState } from 'react';
import Header from '../../components/Header/Header';
import './Register.css';
import AuthForm from '../../components/AuthForm/AuthForm'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Nav } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import regSchema, { type registerFormData } from '../../schemas/regSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { registerFailure, registerRequestFinished, registerStart } from '../../store/authSlice';
import { getAxiosErrorMessage, registerRequest } from '../../api/authApi';
import { MAX_INPUT_LENGTH } from '../../constants/inputLimits';


const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage = (location.state as { flashMessage?: string } | null)?.flashMessage;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<registerFormData>({
    resolver: zodResolver(regSchema),
  });
  const emailValue = watch('email') ?? '';
  const dispatch = useDispatch();

  const onSubmit = async (data: registerFormData) => {
    dispatch(registerStart());
    clearErrors('email');
    clearErrors('root');
    try {
      const response = await registerRequest(data);
      dispatch(registerRequestFinished());
      navigate('/register/confirm', {
        state: {
          email: data.email,
          password: data.password,
          flashMessage: response.message || 'Введите код из письма.',
        },
      });
    } catch (e) {
      const msg = getAxiosErrorMessage(e, 'Регистрация не удалась.');
      dispatch(registerFailure(msg));
      if (msg.includes('таким именем уже существует')) {
        setError('email', {
          type: 'server',
          message: 'Пользователь с таким именем уже существует',
        });
      } else {
        setError('root', { type: 'server', message: msg });
      }
    }
  };

  const form = (
    <Form className="register-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      {flashMessage && (
        <Alert variant="warning" className="mb-3">
          {flashMessage}
        </Alert>
      )}
      <Form.Group className="mb-3">
        <Form.Label className="auth-form-body-label">Почта:</Form.Label>
        <div className="input-field-wrapper">
          <Form.Control
            type="email"
            {...register('email')}
            maxLength={MAX_INPUT_LENGTH}
            placeholder="example@gmail.com"
            isInvalid={!!errors.email}
            className="auth-form-body-input"
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
      <Form.Group className="mb-3">
        <Form.Label className="auth-form-body-label">Пароль:</Form.Label>
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
            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`} aria-hidden={true} />
          </button>
        </div>
        {errors.password?.message && (
          <span className="auth-field-error" role="alert">
            {errors.password.message}
          </span>
        )}
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="auth-form-body-label">Подтвердите пароль:</Form.Label>
        <div className="password-field-wrapper">
          <Form.Control
            className="auth-form-password-confirm"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            maxLength={MAX_INPUT_LENGTH}
            placeholder="password"
            isInvalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label="Показать подтверждение пароля"
          >
            <i
              className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`}
              aria-hidden={true}
            />
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
          <Nav.Link as={Link} to="/" className="auth-form-bottom-back-link">
            {'<< назад'}
          </Nav.Link>
        </div>
        <div className="justify-content-center auth-form-submit-button-container">
          <Button variant="default" type="submit" className="justify-content-center auth-form-submit-button">
            ЗАРЕГИСТРИРОВАТЬСЯ
          </Button>
        </div>
      </div>
    </Form>
  );

  return (
    <>
      <Header />
      <div className="register-auth-layout">
        <AuthForm
          title={<h2 className="text-center">РЕГИСТРАЦИЯ</h2>}
          description={
            <div className="formClueText d-flex align-items-center gap-2">
              <span className="auth-form-head-muted">Уже есть аккаунт?</span>
              <Nav.Link as={Link} to="/login" className="p-0 m-0 auth-form-head-link-text">
                Войти
              </Nav.Link>
            </div>
          }
          form={form}
        />
      </div>
    </>
  );
};

export default Register;
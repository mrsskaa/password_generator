import { useState } from 'react';
import './LogIn.css';
import Header from '../../components/Header/Header';
import AuthForm from '../../components/AuthForm/AuthForm';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Form, Nav } from 'react-bootstrap';
import loginSchema, { type loginFormData } from '../../schemas/loginSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { loginFailure, loginStart, loginSuccess } from '../../store/authSlice';
import { getAxiosErrorMessage, loginRequest } from '../../api/authApi';
import { MAX_INPUT_LENGTH } from '../../constants/inputLimits';

const LogIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';
  const flashMessage = (location.state as { flashMessage?: string } | null)?.flashMessage;
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<loginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailFromQuery,
      password: '',
    },
  });
  const emailValue = watch('email') ?? '';
  const dispatch = useDispatch();

  const onSubmit = async (data: loginFormData) => {
    dispatch(loginStart());
    try {
      const response = await loginRequest(data);
      dispatch(loginSuccess(response.user));
      navigate('/', {
        state: { flashMessage: 'Успешный вход в аккаунт.' },
      });
    } catch (e) {
      const msg = getAxiosErrorMessage(e, 'Неверный логин или пароль.');
      dispatch(loginFailure(msg));
      setError('root', {
        type: 'server',
        message: msg,
      });
    }
  };

  const form = (
    <Form className="login-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      {flashMessage && (
        <Alert variant="success" className="mb-3 auth-success-alert">
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
      </Form.Group>
      <div className="auth-form-forget-password-container">
        <Nav.Link as={Link} to="/forgot-password" className="auth-form-forget-password-link">
          Забыли пароль?
        </Nav.Link>
      </div>
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
            ВОЙТИ
          </Button>
        </div>
      </div>
    </Form>
  );

  return (
    <>
      <Header />
      <AuthForm
        title={<h2 className="text-center">ВХОД</h2>}
        description={
          <div className="formClueText d-flex align-items-center gap-2">
            <span className="auth-form-head-muted">Ещё нет аккаунта? </span>
            <Nav.Link as={Link} to="/register" className="p-0 m-0 auth-form-head-link-text">
              Зарегистрироваться
            </Nav.Link>
          </div>
        }
        form={form}
      />
    </>
  );
};

export default LogIn;
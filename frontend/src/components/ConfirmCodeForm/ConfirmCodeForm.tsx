import { useEffect, useState } from 'react';
import { Alert, Button, Form, Nav } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AuthForm from '../AuthForm/AuthForm';
import Header from '../Header/Header';
import registerConfirmSchema, { type RegisterConfirmFormData } from '../../schemas/registerConfirmSchema';
import { getAxiosErrorMessage } from '../../api/authApi';
import './ConfirmCodeForm.css';


const RESEND_INTERVAL_SEC = 60;

interface ConfirmCodeFormProps {
  title: string;
  backPath: string;
  successMessage: string;
  errorMessage: string;
  initialMessage?: string;
  onConfirm: (payload: { email: string; code: string }) => Promise<unknown>;
  onResend: (payload: { email: string }) => Promise<unknown>;
  onSuccessRedirect: string | ((email: string) => string);
}

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ConfirmCodeForm({
  title,
  backPath,
  successMessage,
  errorMessage,
  initialMessage,
  onConfirm,
  onResend,
  onSuccessRedirect,
}: ConfirmCodeFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const emailFromState = (location.state as { email?: string } | null)?.email;
  const emailFromQuery = searchParams.get('email') ?? undefined;
  const email = emailFromState ?? emailFromQuery ?? 'example@gmail.com';

  const [secondsLeft, setSecondsLeft] = useState(RESEND_INTERVAL_SEC);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(Boolean(initialMessage));
  const canResend = secondsLeft === 0;

  useEffect(() => {
    if (!initialMessage) {
      setShowInitialMessage(false);
      return;
    }
    setShowInitialMessage(true);
    const id = window.setTimeout(() => setShowInitialMessage(false), 2500);
    return () => window.clearTimeout(id);
  }, [initialMessage]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
    reset,
  } = useForm<RegisterConfirmFormData>({
    resolver: zodResolver(registerConfirmSchema),
    defaultValues: { code: '' },
  });
  const codeValue = watch('code') ?? '';

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleResend = async () => {
    if (!canResend) {
      return;
    }
    clearErrors('root');
    try {
      await onResend({ email });
      setSecondsLeft(RESEND_INTERVAL_SEC);
    } catch {
      setError('root', {
        type: 'server',
        message: 'Не удалось отправить код повторно.',
      });
    }
  };

  const onSubmit = async (data: RegisterConfirmFormData) => {
    clearErrors('root');
    setSubmitSuccess(false);
    try {
      await onConfirm({ email, code: data.code });
      setSubmitSuccess(true);
      reset();
      const redirectPath = typeof onSuccessRedirect === 'function' ? onSuccessRedirect(email) : onSuccessRedirect;
      window.setTimeout(() => navigate(redirectPath), 2000);
    } catch (err) {
      setError('root', {
        type: 'server',
        message: getAxiosErrorMessage(err, errorMessage),
      });
    }
  };

  const description = (
    <p className="auth-form-confirm-subtext text-center mb-0">
      Мы отправили код подтверждения на <strong>{email}</strong>
    </p>
  );

  const form = (
    <Form className="confirm-code-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      {showInitialMessage && initialMessage && (
        <Alert variant="success" className="mb-3 auth-success-alert">
          {initialMessage}
        </Alert>
      )}
      {submitSuccess && (
        <Alert variant="success" className="mb-3 auth-success-alert">
          {successMessage}
        </Alert>
      )}
      <Form.Group className="mb-3">
        <Form.Label className="visually-hidden">Код подтверждения</Form.Label>
        <div className="input-field-wrapper">
          <Form.Control
            {...register('code')}
            maxLength={6}
            inputMode="numeric"
            placeholder="000000"
            isInvalid={!!errors.code}
            className="auth-form-body-input"
            autoComplete="one-time-code"
          />
          {codeValue && (
            <button
              type="button"
              className="input-clear-btn"
              onClick={() => setValue('code', '', { shouldValidate: true, shouldDirty: true })}
              aria-label="Очистить поле кода"
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
          )}
        </div>
        {errors.code?.message && (
          <span className="auth-field-error" role="alert">
            {errors.code.message}
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
          <Nav.Link as={Link} to={backPath} className="auth-form-bottom-back-link">
            {'<< назад'}
          </Nav.Link>
        </div>
        <div className="justify-content-center auth-form-submit-button-container">
          <Button
            variant="default"
            type="submit"
            className="justify-content-center auth-form-submit-button"
            disabled={submitSuccess}
          >
            ПОДТВЕРДИТЬ
          </Button>
        </div>
      </div>
      <p className="confirm-code-timer">
        {canResend ? (
          <button type="button" className="confirm-code-resend-btn" onClick={handleResend}>
            Получить новый код
          </button>
        ) : (
          <>Получить новый код можно через {formatMmSs(secondsLeft)}</>
        )}
      </p>
    </Form>
  );

  return (
    <>
      <Header />
      <AuthForm title={<h2 className="text-center">{title}</h2>} description={description} form={form} />
    </>
  );
}

export default ConfirmCodeForm;

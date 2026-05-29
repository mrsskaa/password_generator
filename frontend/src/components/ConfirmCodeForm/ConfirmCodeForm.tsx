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
const DEV_CODE_RE = /\[DEV code:\s*(\d{6})\]/i;

interface ConfirmCodeFormProps {
  title: string;
  backPath: string;
  successMessage: string;
  errorMessage: string;
  initialMessage?: string;
  initialError?: string;
  onConfirm: (payload: { email: string; code: string }) => Promise<unknown>;
  onResend: (payload: { email: string }) => Promise<unknown>;
  onSuccessRedirect: string | ((ctx: { email: string; result: unknown }) => string);
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
  initialError,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInitialMessage, setShowInitialMessage] = useState(Boolean(initialMessage));
  const [resendSuccessMessage, setResendSuccessMessage] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(() => {
    if (!initialMessage) {
      return null;
    }
    const match = initialMessage.match(DEV_CODE_RE);
    return match?.[1] ?? null;
  });
  const canResend = secondsLeft === 0 && !resendBusy;

  useEffect(() => {
    if (!initialMessage) {
      setShowInitialMessage(false);
      setDevCode(null);
      return;
    }
    const match = initialMessage.match(DEV_CODE_RE);
    setDevCode(match?.[1] ?? null);
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
    if (!canResend || resendBusy) {
      return;
    }
    clearErrors('root');
    setResendSuccessMessage('');
    setResendBusy(true);
    try {
      const result = (await onResend({ email })) as { message?: string } | undefined;
      if (result?.message) {
        setResendSuccessMessage(result.message);
        const match = result.message.match(DEV_CODE_RE);
        if (match?.[1]) {
          setDevCode(match[1]);
        }
      }
      setSecondsLeft(RESEND_INTERVAL_SEC);
    } catch (err) {
      setError('root', {
        type: 'server',
        message: getAxiosErrorMessage(err, 'Не удалось отправить код повторно.'),
      });
    } finally {
      setResendBusy(false);
    }
  };

  const onSubmit = async (data: RegisterConfirmFormData) => {
    if (isSubmitting) return;
    clearErrors('root');
    setSubmitSuccess(false);
    setIsSubmitting(true);
    try {
      const result = await onConfirm({ email, code: data.code });
      setSubmitSuccess(true);
      reset();
      const redirectPath =
        typeof onSuccessRedirect === 'function'
          ? onSuccessRedirect({ email, result })
          : onSuccessRedirect;
      window.setTimeout(() => navigate(redirectPath), 2000);
    } catch (err) {
      setError('root', {
        type: 'server',
        message: getAxiosErrorMessage(err, errorMessage),
      });
    } finally {
      setIsSubmitting(false);
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
      {initialError && (
        <div className="auth-field-error mb-3" role="alert">
          {initialError}
        </div>
      )}
      {submitSuccess && (
        <Alert variant="success" className="mb-3 auth-success-alert">
          {successMessage}
        </Alert>
      )}
      {resendSuccessMessage && (
        <Alert variant="success" className="mb-3">
          {resendSuccessMessage}
        </Alert>
      )}
      {devCode && (
        <div className="confirm-code-dev-box mb-3" role="status" aria-live="polite">
          Тестовый код подтверждения: <strong>{devCode}</strong>
        </div>
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
            disabled={submitSuccess || isSubmitting}
          >
            {isSubmitting ? 'ПОДТВЕРЖДЕНИЕ...' : 'ПОДТВЕРДИТЬ'}
          </Button>
        </div>
      </div>
      <p className="confirm-code-timer">
        {canResend ? (
          <button type="button" className="confirm-code-resend-btn" onClick={handleResend} disabled={resendBusy}>
            {resendBusy ? 'Отправка…' : 'Получить новый код'}
          </button>
        ) : (
          <>
            {resendBusy ? 'Отправка…' : `Получить новый код можно через ${formatMmSs(secondsLeft)}`}
          </>
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

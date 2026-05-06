import { useState } from 'react';
import { Alert, Button, Form, Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../../components/Header/Header';
import AuthForm from '../../components/AuthForm/AuthForm';
import type { RootState } from '../../store/store';
import { getAxiosErrorMessage, savePasswordRequest } from '../../api/authApi';
import { SAVED_PASSWORD_DESCRIPTION_MAX } from '../../constants/inputLimits';
import './SavePassword.css';

interface SavePasswordLocationState {
  password?: string;
  generationSettings?: Record<string, unknown>;
}

function SavePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const state = (location.state as SavePasswordLocationState | null) ?? null;

  const savedPassword = (state?.password ?? '').trim();
  const [codeWord, setCodeWord] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    const normalizedDescription = description.trim();
    if (!savedPassword) {
      navigate('/', {
        replace: true,
        state: { flashMessage: 'Сначала сгенерируйте пароль.' },
      });
      return;
    }
    if (!normalizedDescription) {
      setError('Введите описание.');
      return;
    }
    if (normalizedDescription.length > SAVED_PASSWORD_DESCRIPTION_MAX) {
      setError(`Описание не длиннее ${SAVED_PASSWORD_DESCRIPTION_MAX} символов.`);
      return;
    }
    if (!codeWord.trim()) {
      setError('Введите кодовое слово.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await savePasswordRequest({
        password: savedPassword,
        codeWord: codeWord.trim(),
        description: normalizedDescription,
        generationSettings: state?.generationSettings,
      });
      navigate('/passwords', {
        replace: true,
        state: { flashMessage: 'Пароль успешно сохранён.' },
      });
    } catch (e) {
      setError(getAxiosErrorMessage(e, 'Не удалось сохранить пароль.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = (
    <Form className="save-password-form" noValidate onSubmit={onSubmit}>
      <Form.Group className="mb-4">
        <Form.Label className="auth-form-body-label">Кодовое слово:</Form.Label>
        <Form.Control
          value={codeWord}
          onChange={(event) => setCodeWord(event.target.value)}
          placeholder="-"
          className="auth-form-body-input"
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className="auth-form-body-label">Описание:</Form.Label>
        <Form.Control
          value={description}
          onChange={(event) =>
            setDescription(event.target.value.slice(0, SAVED_PASSWORD_DESCRIPTION_MAX))
          }
          placeholder="описание"
          className="auth-form-body-input"
          maxLength={SAVED_PASSWORD_DESCRIPTION_MAX}
        />
      </Form.Group>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <div className="save-password-form-bottom">
        <div className="auth-form-bottom-back-link-container">
          <Nav.Link as={Link} to="/" className="auth-form-bottom-back-link">
            {'<< назад'}
          </Nav.Link>
        </div>
        <div className="justify-content-center auth-form-submit-button-container">
          <Button variant="default" type="submit" className="save-password-submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
          </Button>
        </div>
      </div>
    </Form>
  );

  return (
    <>
      <Header />
      <AuthForm title={<h2 className="text-center">СОХРАНИТЬ ПАРОЛЬ</h2>} description={null} form={form} />
    </>
  );
}

export default SavePassword;

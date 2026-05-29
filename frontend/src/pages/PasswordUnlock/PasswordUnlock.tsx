import { useState } from 'react';
import { Button, Form, Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import AuthForm from '../../components/AuthForm/AuthForm';
import { getAxiosErrorMessage, revealSavedPasswordRequest, type SavedPasswordItem } from '../../api/authApi';
import './PasswordUnlock.css';

function PasswordUnlock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { passwordId = '' } = useParams();
  const state = (location.state as { item?: SavedPasswordItem } | null) ?? null;
  const [codeWord, setCodeWord] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!passwordId) {
      setError('Не найден идентификатор пароля.');
      return;
    }
    if (!codeWord.trim()) {
      setError('Введите кодовое слово.');
      return;
    }
    setIsSubmitting(true);
    try {
      const reveal = await revealSavedPasswordRequest({ passwordId, codeWord: codeWord.trim() });
      navigate(`/passwords/${passwordId}`, {
        replace: true,
        state: { item: state?.item, password: reveal.password },
      });
    } catch (e) {
      setError(getAxiosErrorMessage(e, 'Не удалось открыть пароль.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = (
    <Form className="password-unlock-form" noValidate onSubmit={onSubmit}>
      <Form.Group className="mb-3">
        <Form.Control
          value={codeWord}
          onChange={(event) => setCodeWord(event.target.value)}
          placeholder="-"
          className="auth-form-body-input"
        />
      </Form.Group>
      {error && (
        <div className="auth-field-error mb-3" role="alert">
          {error}
        </div>
      )}
      <div className="password-unlock-bottom">
        <div className="auth-form-bottom-back-link-container">
          <Nav.Link as={Link} to="/passwords" className="password-unlock-back-link">
            {'<< назад'}
          </Nav.Link>
        </div>
        <div className="auth-form-submit-button-container">
          <Button type="submit" className="password-unlock-btn" disabled={isSubmitting}>
            {isSubmitting ? 'ПРОВЕРКА...' : 'ПОДТВЕРДИТЬ'}
          </Button>
        </div>
      </div>
    </Form>
  );

  return (
    <>
      <Header />
      <div className="password-unlock-page">
        <AuthForm title={<h2 className="text-center">ВВЕДИТЕ КОДОВОЕ СЛОВО</h2>} form={form} />
      </div>
    </>
  );
}

export default PasswordUnlock;

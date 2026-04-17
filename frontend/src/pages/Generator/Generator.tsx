import { useEffect, useMemo, useState } from 'react';
import { Button, Container, Form, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Generator.css';
import { generatePasswordRequest } from '../../api/authApi';
import type { GeneratePasswordPayload } from '../../types/generator';
import Header from '../../components/Header/Header';
import type { RootState } from '../../store/store';
import { isStrengthBelowGood, tintFromBackendColor } from '../../utils/passwordStrength';

const MIN_LENGTH = 8;
const MAX_LENGTH = 32;
const PASSWORD_PLACEHOLDER = 'Нажмите "СГЕНЕРИРОВАТЬ"';

function Generator() {
  const [length, setLength] = useState(16);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(PASSWORD_PLACEHOLDER);
  const [strengthMeta, setStrengthMeta] = useState<{
    crackTimeText: string;
    strengthColor: string;
    strengthLevel: string;
    hints: string[];
  } | null>(null);
  const [error, setError] = useState('');
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [options, setOptions] = useState({
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: false,
    includeSymbols: false,
    excludeSimilar: true,
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const generatorPayload: GeneratePasswordPayload = useMemo(
    () => ({
      length,
      ...options,
    }),
    [length, options],
  );

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setStrengthMeta(null);
    try {
      const response = await generatePasswordRequest(generatorPayload);
      setGeneratedPassword(response.password);
      setStrengthMeta({
        crackTimeText: response.crack_time_human,
        strengthColor: response.color,
        strengthLevel: response.strength_level,
        hints: response.hints ?? [],
      });
    } catch {
      setError('Не удалось сгенерировать пароль. Проверьте подключение к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedPassword || generatedPassword === PASSWORD_PLACEHOLDER) {
      return;
    }
    await navigator.clipboard.writeText(generatedPassword);
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    await handleCopy();
  };

  const passwordBoxStyle =
    strengthMeta && generatedPassword !== PASSWORD_PLACEHOLDER
      ? {
          borderColor: strengthMeta.strengthColor,
          backgroundColor: tintFromBackendColor(strengthMeta.strengthColor, 0.14),
        }
      : undefined;

  const showStrengthMeta = strengthMeta !== null && generatedPassword !== PASSWORD_PLACEHOLDER;
  const showHintButton =
    strengthMeta != null &&
    isStrengthBelowGood(strengthMeta.strengthLevel) &&
    (strengthMeta.hints?.length ?? 0) > 0;

  const renderToggle = (enabled: boolean) => (
    <button type="button" className="generator-toggle-btn" aria-label={enabled ? 'Выключить' : 'Включить'}>
      <i className={`bi ${enabled ? 'bi-toggle-on' : 'bi-toggle-off'} generator-toggle-icon`} />
    </button>
  );

  return (
    <>
      <Header />
      <main className="generator-main">
        <Container className="generator-page py-4">
        <div className="generator-heading">
          <h1 className="generator-title">ГЕНЕРАТОР БЕЗОПАСНЫХ ПАРОЛЕЙ</h1>
          <p className="generator-subtitle mb-0">Создавайте надежные пароли, которые невозможно взломать</p>
        </div>

        <div className="generator-content-box">
        <div className="generator-password-row">
          <div className="generator-password-box" style={passwordBoxStyle}>
            <span
              className={`generator-password-value ${generatedPassword === PASSWORD_PLACEHOLDER ? 'is-placeholder' : ''}`}
            >
              {showPassword ? generatedPassword : generatedPassword.replace(/./g, '•')}
            </span>
            <div className="generator-password-actions">
              <button type="button" onClick={handleGenerate} className="generator-icon-btn" aria-label="Сгенерировать">
                <i className="bi bi-arrow-clockwise" />
              </button>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="generator-icon-btn"
                aria-label="Показать или скрыть пароль"
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
              <button type="button" onClick={handleCopy} className="generator-icon-btn" aria-label="Скопировать пароль">
                <i className="bi bi-copy" />
              </button>
            </div>
          </div>
          {showStrengthMeta && strengthMeta && (
            <div className="generator-password-meta">
              <p className="generator-crack-estimate mb-0" style={{ color: strengthMeta.strengthColor }}>
                {strengthMeta.crackTimeText}
              </p>
              {showHintButton && (
                <OverlayTrigger
                  trigger="click"
                  placement="auto"
                  rootClose
                  overlay={
                    <Popover id="generator-password-hint" className="generator-hint-popover">
                      <Popover.Body as="div" className="generator-hint-popover-body">
                        {strengthMeta.hints.join(' ')}
                      </Popover.Body>
                    </Popover>
                  }
                >
                  <button
                    type="button"
                    className="generator-hint-btn"
                    aria-label="Подсказка по усилению пароля"
                    style={{ color: strengthMeta.strengthColor }}
                  >
                    <i className="bi bi-question-lg" aria-hidden />
                  </button>
                </OverlayTrigger>
              )}
            </div>
          )}
        </div>

        <div className="generator-length-row">
          <label className="generator-label" htmlFor="length-slider">
            ДЛИНА
          </label>
          <span className="generator-length-badge">{length}</span>
        </div>
        <Form.Range
          id="length-slider"
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          value={length}
          onChange={(event) => setLength(Number(event.target.value))}
        />
        <div className="generator-range-marks">
          <span>{MIN_LENGTH}</span>
          <span>{MAX_LENGTH}</span>
        </div>

        <div className="generator-options">
          <button type="button" className="generator-option-row" onClick={() => toggleOption('includeLowercase')}>
            <span>Строчные буквы (a-z)</span>
            {renderToggle(options.includeLowercase)}
          </button>
          <button type="button" className="generator-option-row" onClick={() => toggleOption('includeNumbers')}>
            <span>Цифры (0-9)</span>
            {renderToggle(options.includeNumbers)}
          </button>
          <button type="button" className="generator-option-row" onClick={() => toggleOption('includeUppercase')}>
            <span>Прописные буквы (A-Z)</span>
            {renderToggle(options.includeUppercase)}
          </button>
          <button type="button" className="generator-option-row" onClick={() => toggleOption('includeSymbols')}>
            <span>Специальные символы (!@#$%...)</span>
            {renderToggle(options.includeSymbols)}
          </button>
          <button type="button" className="generator-option-row full-row" onClick={() => toggleOption('excludeSimilar')}>
            <span>Исключить похожие символы (O, 0, I, l, 1)</span>
            {renderToggle(options.excludeSimilar)}
          </button>
        </div>

        <div className="generator-error-slot" aria-live="polite">
          {error && <p className="generator-error-text mb-0">{error}</p>}
        </div>

        <div className="generator-actions">
          <Button className="generator-main-btn" onClick={handleGenerate} disabled={isLoading}>
            <i className="bi bi-arrow-clockwise me-2" />
            {isLoading ? 'ГЕНЕРАЦИЯ...' : 'СГЕНЕРИРОВАТЬ'}
          </Button>
          <Button className="generator-secondary-btn" onClick={handleSave}>
            <i className="bi bi-box-arrow-down generator-save-icon me-2" />
            СОХРАНИТЬ
          </Button>
        </div>
        </div>
      </Container>
      </main>
      <Modal
        show={showLoginPrompt}
        onHide={() => setShowLoginPrompt(false)}
        centered
        dialogClassName="generator-login-modal"
        contentClassName="generator-login-modal-content"
        backdropClassName="generator-login-backdrop"
      >
        <Modal.Body>
          <button
            type="button"
            className="generator-login-modal-close"
            onClick={() => setShowLoginPrompt(false)}
            aria-label="Закрыть"
          >
            <i className="bi bi-x-lg" />
          </button>
          <p className="generator-login-modal-text mb-0">
            ДЛЯ СОХРАНЕНИЯ ПАРОЛЕЙ
            <br />
            НЕОБХОДИМО <Link to="/login" className="generator-login-modal-link">ВОЙТИ</Link> В АККАУНТ
          </p>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default Generator;
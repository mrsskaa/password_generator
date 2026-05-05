import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Container, Form, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Generator.css';
import { generatePasswordRequest } from '../../api/authApi';
import type { GeneratePasswordPayload } from '../../types/generator';
import Header from '../../components/Header/Header';
import type { RootState } from '../../store/store';
import { isStrengthBelowGood, normalizeStrengthToken } from '../../utils/passwordStrength';
import type { GeneratorHistoryEntry } from '../../utils/generatorHistory';
import { formatHistoryDateTime, loadGeneratorHistory, pushGeneratorHistory } from '../../utils/generatorHistory';

const MIN_LENGTH = 8;
const MAX_LENGTH = 32;
const PASSWORD_PLACEHOLDER = 'Нажмите "СГЕНЕРИРОВАТЬ"';

function Generator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const flashFromQuery = searchParams.get('flash');
  const flashFromQueryMessage =
    flashFromQuery === 'confirm_success' ? 'Успешное подтверждение кода. Вы вошли в аккаунт.' : undefined;
  const flashMessage = (location.state as { flashMessage?: string } | null)?.flashMessage;
  const effectiveFlashMessage = flashMessage ?? flashFromQueryMessage;
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
  const [copyMessage, setCopyMessage] = useState('');
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<GeneratorHistoryEntry[]>([]);
  const [cardTimestamp, setCardTimestamp] = useState<string | null>(null);
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

  useEffect(() => {
    if (!effectiveFlashMessage) {
      return;
    }
    const timerId = window.setTimeout(() => {
      navigate('/', { replace: true, state: null });
    }, 2500);
    return () => window.clearTimeout(timerId);
  }, [effectiveFlashMessage, navigate]);

  useEffect(() => {
    if (userId != null) {
      setHistoryEntries(loadGeneratorHistory(userId));
    } else {
      setHistoryEntries([]);
      setHistoryOpen(false);
    }
  }, [userId]);

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
    try {
      const response = await generatePasswordRequest(generatorPayload);
      setGeneratedPassword(response.password);
      setCardTimestamp(null);
      setStrengthMeta({
        crackTimeText: response.crack_time_human,
        strengthColor: response.color,
        strengthLevel: response.strength_level,
        hints: response.hints ?? [],
      });
      if (userId != null) {
        setHistoryEntries(pushGeneratorHistory(userId, response, generatorPayload));
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось сгенерировать пароль. Проверьте подключение к серверу.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedPassword || generatedPassword === PASSWORD_PLACEHOLDER) {
      return;
    }

    const copyViaFallback = (): boolean => {
      const textArea = document.createElement('textarea');
      textArea.value = generatedPassword;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      } finally {
        document.body.removeChild(textArea);
      }
      return copied;
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedPassword);
      } else if (!copyViaFallback()) {
        throw new Error('Clipboard API unavailable');
      }
      setError('');
      setCopyMessage('Пароль скопирован');
      window.setTimeout(() => setCopyMessage(''), 1800);
    } catch {
      if (copyViaFallback()) {
        setError('');
        setCopyMessage('Пароль скопирован');
        window.setTimeout(() => setCopyMessage(''), 1800);
        return;
      }
      setCopyMessage('');
      setError('Не удалось скопировать пароль. Разрешите доступ к буферу обмена.');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    if (generatedPassword === PASSWORD_PLACEHOLDER) {
      setError('Сначала сгенерируйте пароль.');
      return;
    }
    setError('');
    navigate('/passwords/save', {
      state: {
        password: generatedPassword,
        generationSettings: {
          ...generatorPayload,
          crackTimeHuman: strengthMeta?.crackTimeText ?? '',
          strengthColor: strengthMeta?.strengthColor ?? '',
          strengthLevel: strengthMeta?.strengthLevel ?? '',
          hints: strengthMeta?.hints ?? [],
        },
      },
    });
  };

  const applyHistoryEntry = (entry: GeneratorHistoryEntry) => {
    setLength(entry.options.length);
    setOptions({
      includeLowercase: entry.options.includeLowercase,
      includeUppercase: entry.options.includeUppercase,
      includeNumbers: entry.options.includeNumbers,
      includeSymbols: entry.options.includeSymbols,
      excludeSimilar: entry.options.excludeSimilar,
    });
    setGeneratedPassword(entry.password);
    setCardTimestamp(entry.dateTimeLabel || formatHistoryDateTime(entry.at));
    if (entry.crackTimeHuman && entry.strengthColor) {
      setStrengthMeta({
        crackTimeText: entry.crackTimeHuman,
        strengthColor: entry.strengthColor,
        strengthLevel: entry.strengthLevel,
        hints: entry.hints ?? [],
      });
    } else {
      setStrengthMeta(null);
    }
    setShowPassword(false);
    setError('');
    setCopyMessage('');
  };

  const showStrengthMeta = strengthMeta !== null && generatedPassword !== PASSWORD_PLACEHOLDER;
  const strengthClassSuffix =
    showStrengthMeta && strengthMeta ? normalizeStrengthToken(strengthMeta.strengthColor) : null;
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
          <div className="generator-shell">
            <div className="generator-heading">
              <h1 className="generator-title">ГЕНЕРАТОР БЕЗОПАСНЫХ ПАРОЛЕЙ</h1>
              <p className="generator-subtitle mb-0">Создавайте надежные пароли, которые невозможно взломать</p>
            </div>

            <div
              className={`generator-body-stage ${
                !isAuthenticated || userId == null ? 'generator-body-stage--no-history' : ''
              }`}
            >
              {isAuthenticated && userId != null && (
                <aside className="generator-history-panel" aria-label="История генераций">
                  <div className="generator-history-inner">
                    <button
                      type="button"
                      className="generator-history-toggle"
                      onClick={() => setHistoryOpen((o) => !o)}
                      aria-expanded={historyOpen}
                    >
                      <i className="bi bi-clock-history generator-history-toggle-icon" aria-hidden />
                      <span className="generator-history-toggle-label">История</span>
                      <i
                        className={`bi bi-chevron-${historyOpen ? 'up' : 'down'} generator-history-chevron`}
                        aria-hidden
                      />
                    </button>
                    {historyOpen && historyEntries.length > 0 && (
                      <ul className="generator-history-list">
                        {historyEntries.map((entry) => (
                          <li key={entry.id} className="generator-history-list-item">
                            <button type="button" className="generator-history-date-btn" onClick={() => applyHistoryEntry(entry)}>
                              {entry.dateLabel}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </aside>
              )}

              <div className="generator-center-column">
                <div className={`generator-content-box ${cardTimestamp ? 'has-timestamp' : ''}`}>
                  {cardTimestamp && <p className="generator-card-timestamp">{cardTimestamp}</p>}
        {effectiveFlashMessage && (
          <Alert variant="success" className="mb-3 auth-success-alert">
            {effectiveFlashMessage}
          </Alert>
        )}
        <div className="generator-password-stack">
          <div
            className={
              strengthClassSuffix
                ? `generator-password-box generator-strength--${strengthClassSuffix}`
                : 'generator-password-box'
            }
          >
            <span
              className={`generator-password-value ${generatedPassword === PASSWORD_PLACEHOLDER ? 'is-placeholder' : 'is-generated'}`}
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
          <div className="generator-password-meta-slot">
            {showStrengthMeta && strengthMeta && strengthClassSuffix ? (
              <div className={`generator-password-meta generator-strength--${strengthClassSuffix}`}>
                <p className="generator-crack-estimate mb-0">
                  Пароль будет взломан через {strengthMeta.crackTimeText}
                </p>
                {showHintButton && (
                  <OverlayTrigger
                    trigger="click"
                    placement="bottom-end"
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
                    >
                      <i className="bi bi-question-circle" aria-hidden />
                    </button>
                  </OverlayTrigger>
                )}
              </div>
            ) : null}
          </div>
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
          {copyMessage && <p className="generator-copy-text mb-0">{copyMessage}</p>}
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
              </div>
              {isAuthenticated && userId != null && <div className="generator-body-balance" aria-hidden />}
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
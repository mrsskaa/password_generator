import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { normalizeStrengthToken } from '../../utils/passwordStrength';
import {
    deleteSavedPasswordRequest,
    getAxiosErrorMessage,
    getSavedPasswordByIdRequest,
    updateSavedPasswordDescriptionRequest,
    type SavedPasswordItem,
} from '../../api/authApi';
import '../Generator/Generator.css';
import './PasswordDetails.css';
import { SAVED_PASSWORD_DESCRIPTION_MAX } from '../../constants/inputLimits';

function formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat('ru-RU').format(parsed);
}

function PasswordDetails() {
    const navigate = useNavigate();
    const location = useLocation();
    const { passwordId = '' } = useParams();
    const locationState = (location.state as { item?: SavedPasswordItem; password?: string } | null) ?? null;

    const [item, setItem] = useState<SavedPasswordItem | null>(locationState?.item ?? null);
    const [password] = useState(locationState?.password ?? '');
    const [error, setError] = useState('');
    const [copyMessage, setCopyMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [descriptionDraft, setDescriptionDraft] = useState(locationState?.item?.description ?? '');

    useEffect(() => {
        if (!passwordId) {
            navigate('/passwords', { replace: true });
            return;
        }
        if (item) {
            setDescriptionDraft(item.description.slice(0, SAVED_PASSWORD_DESCRIPTION_MAX));
            return;
        }
        void getSavedPasswordByIdRequest(passwordId)
            .then((data) => {
                setItem(data);
                setDescriptionDraft(data.description.slice(0, SAVED_PASSWORD_DESCRIPTION_MAX));
            })
            .catch((e) => setError(getAxiosErrorMessage(e, 'Не удалось загрузить карточку пароля.')));
    }, [item, navigate, passwordId]);

    useEffect(() => {
        if (!password) {
            navigate(`/passwords/${passwordId}/unlock`, {
                replace: true,
                state: { item },
            });
        }
    }, [item, navigate, password, passwordId]);

    const options = useMemo(() => {
        const settings = item?.generation_settings ?? {};
        return {
            length: Number(settings.length ?? 16),
            includeLowercase: Boolean(settings.includeLowercase ?? true),
            includeUppercase: Boolean(settings.includeUppercase ?? true),
            includeNumbers: Boolean(settings.includeNumbers ?? false),
            includeSymbols: Boolean(settings.includeSymbols ?? false),
            excludeSimilar: Boolean(settings.excludeSimilar ?? true),
        };
    }, [item]);
    const lengthPercent = Math.max(0, Math.min(100, ((options.length - 8) / (32 - 8)) * 100));
    const crackTimeHuman = String((item?.generation_settings?.crackTimeHuman as string | undefined) ?? '').trim();
    const strengthColor = String((item?.generation_settings?.strengthColor as string | undefined) ?? '').trim();
    const showStrengthMeta = crackTimeHuman.length > 0 && strengthColor.length > 0;
    const strengthClassSuffix = showStrengthMeta ? normalizeStrengthToken(strengthColor) : null;

    const handleDelete = async () => {
        if (!passwordId) return;
        try {
            await deleteSavedPasswordRequest(passwordId);
            navigate('/passwords', { replace: true, state: { flashMessage: 'Пароль удален.' } });
        } catch (e) {
            setError(getAxiosErrorMessage(e, 'Не удалось удалить пароль.'));
        }
    };

    const handleSaveDescription = async () => {
        if (!passwordId) return;
        const trimmed = descriptionDraft.trim().slice(0, SAVED_PASSWORD_DESCRIPTION_MAX);
        if (!trimmed) {
            setError('Введите описание.');
            return;
        }
        setError('');
        try {
            const updated = await updateSavedPasswordDescriptionRequest({
                passwordId,
                description: trimmed,
            });
            setItem((prev) => (prev ? { ...prev, description: updated.description } : prev));
            setIsEditing(false);
        } catch (e) {
            setError(getAxiosErrorMessage(e, 'Не удалось обновить описание.'));
        }
    };

    const handleCopy = async () => {
        if (!password) {
            return;
        }
        try {
            await navigator.clipboard.writeText(password);
            setError('');
            setCopyMessage('Пароль скопирован');
            window.setTimeout(() => setCopyMessage(''), 1600);
        } catch {
            setCopyMessage('');
            setError('Не удалось скопировать пароль.');
        }
    };

    if (!item) {
        return (
            <>
                <Header />
                <main className="password-details-main">
                    <p className="password-details-loading">Загрузка...</p>
                </main>
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="password-details-main">
                <section className="password-details-shell">
                    <div className="password-details-center-wrap">
                        {/* <div className="password-details-heading">
                          <h1 className="password-details-title">ГЕНЕРАТОР БЕЗОПАСНЫХ ПАРОЛЕЙ</h1>
                          <p className="password-details-subtitle mb-0">Создавайте надежные пароли, которые невозможно взломать</p>
                        </div> */}
                    <div className="password-details-card">
                        <p className="password-details-date">{formatDate(item.created_at)}</p>
                        <div className="password-details-top-row">
                            {isEditing ? (
                                <div className="password-details-edit-row">
                                    <Form.Control
                                        value={descriptionDraft}
                                        onChange={(event) =>
                                            setDescriptionDraft(
                                                event.target.value.slice(0, SAVED_PASSWORD_DESCRIPTION_MAX),
                                            )
                                        }
                                        placeholder="Введите описание"
                                        className="password-details-description-input"
                                        maxLength={SAVED_PASSWORD_DESCRIPTION_MAX}
                                    />
                                    <Button className="password-details-save-btn" onClick={handleSaveDescription}>
                                        СОХРАНИТЬ
                                    </Button>
                                    <Button className="password-details-cancel-btn" onClick={() => setIsEditing(false)}>
                                        ОТМЕНА
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="password-details-description">
                                        {item.description} <i className="bi bi-pencil-square" aria-hidden onClick={() => setIsEditing(true)} />
                                    </h2>
                                    <Button className="password-details-delete-btn" onClick={handleDelete}>
                                        УДАЛИТЬ
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="password-details-generator-body">
                            <div className="generator-password-stack">
                                <div
                                    className={
                                        strengthClassSuffix
                                            ? `generator-password-box generator-strength--${strengthClassSuffix}`
                                            : 'generator-password-box'
                                    }
                                >
                                    <span className="generator-password-value is-generated">
                                        {showPassword ? password : password.replace(/./g, '•')}
                                    </span>
                                    <div className="generator-password-actions">
                                        <button
                                            type="button"
                                            className="generator-icon-btn"
                                            aria-label="Показать или скрыть пароль"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                        >
                                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                                        </button>
                                        <button type="button" className="generator-icon-btn" aria-label="Скопировать пароль" onClick={handleCopy}>
                                            <i className="bi bi-copy" />
                                        </button>
                                    </div>
                                </div>
                                <div className="generator-password-meta-slot">
                                    {showStrengthMeta && strengthClassSuffix ? (
                                        <div className={`generator-password-meta generator-strength--${strengthClassSuffix}`}>
                                            <p className="generator-crack-estimate mb-0">Пароль будет взломан через {crackTimeHuman}</p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="password-details-length-strip">
                                <div className="generator-length-row">
                                    <span className="generator-label">ДЛИНА</span>
                                    <span className="generator-length-badge">{options.length}</span>
                                </div>
                                <div
                                    className="password-details-slider"
                                    style={{ ['--pd-length-percent' as string]: `${lengthPercent}%` }}
                                >
                                    <span className="password-details-slider-thumb" />
                                </div>
                                <div className="generator-range-marks">
                                    <span>8</span>
                                    <span>32</span>
                                </div>
                            </div>

                            <div className="generator-options password-details-options-static">
                                <div className="generator-option-row">
                                    <span>Строчные буквы (a-z)</span>
                                    <i className={`bi ${options.includeLowercase ? 'bi-toggle-on' : 'bi-toggle-off'} generator-toggle-icon`} />
                                </div>
                                <div className="generator-option-row">
                                    <span>Цифры (0-9)</span>
                                    <i className={`bi ${options.includeNumbers ? 'bi-toggle-on' : 'bi-toggle-off'} generator-toggle-icon`} />
                                </div>
                                <div className="generator-option-row">
                                    <span>Прописные буквы (A-Z)</span>
                                    <i className={`bi ${options.includeUppercase ? 'bi-toggle-on' : 'bi-toggle-off'} generator-toggle-icon`} />
                                </div>
                                <div className="generator-option-row">
                                    <span>Специальные символы (!@#$%...)</span>
                                    <i className={`bi ${options.includeSymbols ? 'bi-toggle-on' : 'bi-toggle-off'} generator-toggle-icon`} />
                                </div>
                                <div className="generator-option-row full-row">
                                    <span>Исключить похожие символы (O, 0, I, l, 1)</span>
                                    <i className={`bi ${options.excludeSimilar ? 'bi-toggle-on' : 'bi-toggle-off'} generator-toggle-icon`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mt-3 password-details-alert">
                            {error}
                        </Alert>
                    )}
                    {copyMessage && (
                        <Alert variant="success" className="mt-3 password-details-alert">
                            {copyMessage}
                        </Alert>
                    )}
                    <Link to="/passwords" className="password-details-back-link">
                        {'<< НАЗАД'}
                    </Link>
                    </div>
                </section>
            </main>
        </>
    );
}

export default PasswordDetails;

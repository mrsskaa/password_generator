import { Button, Container, Form, OverlayTrigger, Popover } from "react-bootstrap";
import ContentBox from "../../components/ContentBox/ContentBox";
import Header from "../../components/Header/Header";
import './PasswordDetails.css';
import { useParams } from "react-router-dom";
import { useState } from "react";

const MIN_LENGTH = 8;
const MAX_LENGTH = 32;

function PasswordDetails() {
    const TEST =  {
    id: "p1",
    description: "GitHub",
    password: "gh-password-super-secure-123",
    created_at: "2025-12-10T12:34:56Z",
  };
    
    const [showPassword, setShowPassword] = useState(false);

    const [options, setOptions] = useState({
        includeLowercase: true,
        includeUppercase: false,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
    });

    const renderToggle = (enabled: boolean) => (
        <button type="button" className="generator-toggle-btn" aria-label={enabled ? 'Выключить' : 'Включить'}>
        <i className={`bi ${enabled ? 'bi-toggle-on' : 'bi-toggle-off'} generator-toggle-icon`} />
        </button>
    );

      const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

    return (
        <>

            <Container fluid className=" d-flex py-2 justify-content-center align-items-center">
                <ContentBox className="password-details-container">
                    <div className="passwords-details-head">
                        <p className="password-details-date">{TEST.created_at}</p>
                        <div className="password-details-title-container d-flex">
                            <div className="password-details-description-container d-flex">
                                <p className="password-details-description">{TEST.description}</p>
                                <i className="bi bi-pencil-square" /> 
                            </div>
                            <Button 
                                className="password-details-delete-btn"
                                
                                >
                                    УДАЛИТЬ
                            </Button>
                            
                        </div>
                    </div>
                    <div className="generator-password-stack">
                        <div className='generator-password-box'>
                            <span
                                className={`generator-password-value`}
                                >
                                {showPassword ? TEST.password : TEST.password.replace(/./g, '•')}
                            </span>
                            <div className="generator-password-actions">
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="generator-icon-btn"
                                aria-label="Показать или скрыть пароль"
                            >
                                <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                            </button>
                            <button type="button" className="generator-icon-btn" aria-label="Скопировать пароль">
                                <i className="bi bi-copy" />
                            </button>
                            </div>
                        </div>

                        <div className="generator-password-meta-slot">
                            <p className="generator-crack-estimate mb-0">
                                Пароль будет взломан через ... лет
                            </p>
                        </div>

                        <div className="generator-length-row">
                            <label className="generator-label" htmlFor="length-slider">
                                ДЛИНА
                            </label>
                            <span className="generator-length-badge">{TEST.password.length}</span>
                        </div>
                    </div>

                    <Form.Range
                        id="length-slider"
                        min={MIN_LENGTH}
                        max={MAX_LENGTH}
                        value={TEST.password.length}
                        readOnly
                    />
                    <div className="generator-range-marks">
                        <span>{MIN_LENGTH}</span>
                        <span>{MAX_LENGTH}</span>
                    </div>

                    {/* <div className="generator-options">
                        <div className="row d-flex">
                            <div className='col-6'>
                                <button type="button" className="generator-option-row" value={options.includeLowercase} >
                                    <span>Строчные буквы (a-z)</span>
                                    {renderToggle(options.includeLowercase)}
                                </button>
                                <button type="button" className="generator-option-row" value={options.includeNumbers}>
                                    <span>Цифры (0-9)</span>
                                    {renderToggle(options.includeNumbers)}
                                </button>
                            </div>
                            <div className="col-6">
                                <button type="button" className="generator-option-row" value={options.includeUppercase}>
                                    <span>Прописные буквы (A-Z)</span>
                                    {renderToggle(options.includeUppercase)}
                                </button>
                                <button type="button" className="generator-option-row" value={options.includeSymbols}>
                                    <span>Специальные символы (!@#$%...)</span>
                                    {renderToggle(options.includeSymbols)}
                                </button>
                            </div>
                        </div>

                        <div className="options-bottom d-flex">
                            <button type="button" className="generator-option-row full-row" value={options.excludeSimilar}>
                                <span className="option-text">Исключить похожие символы (O, 0, I, l, 1)</span>
                                <span className="toggle-wrapper">{renderToggle(options.excludeSimilar)}</span>
                            </button>
                        </div>
                    </div> */}

                    <div className="generator-options">
                        <button
                            type="button"
                            className="generator-option-row"
                            value={options.includeLowercase}
                        >
                            <span>Строчные буквы (a-z)</span>
                            {renderToggle(options.includeLowercase)}
                        </button>

                        <button
                            type="button"
                            className="generator-option-row"
                            value={options.includeNumbers}
                        >
                            <span>Цифры (0-9)</span>
                            {renderToggle(options.includeNumbers)}
                        </button>

                        <button
                            type="button"
                            className="generator-option-row"
                            value={options.includeUppercase}
                        >
                            <span>Прописные буквы (A-Z)</span>
                            {renderToggle(options.includeUppercase)}
                        </button>

                        <button
                            type="button"
                            className="generator-option-row"
                            value={options.includeSymbols}
                        >
                            <span>Специальные символы (!@#$%...)</span>
                            {renderToggle(options.includeSymbols)}
                        </button>

                        <button
                            type="button"
                            className="generator-option-row full-row"
                            value={options.excludeSimilar}
                        >
                            <span>Исключить похожие символы (O, 0, I, l, 1)</span>
                            {renderToggle(options.excludeSimilar)}
                        </button>
                    </div>
                </ContentBox>
            </Container>
        </>
    );
}

export default PasswordDetails;
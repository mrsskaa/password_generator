import { Container } from 'react-bootstrap';
import type { ReactNode } from 'react';
import './AuthForm.css'
import ContentBox from '../ContentBox/ContentBox';

interface AuthFormProps {
  title: ReactNode;
  /** Если не передать — блок под заголовком не рендерится (например, сброс пароля) */
  description?: ReactNode | null;
  form: ReactNode;
}

function AuthForm({ title, description, form }: AuthFormProps) {
  return (
    <Container fluid className="auth-form-viewport d-flex py-2 justify-content-center align-items-center">
      <ContentBox className="auth-form-container">
        <div className="auth-form-head">
          <div className="auth-form-head-title">{title}</div>
          {description != null && description !== false && (
            <div className="auth-form-head-descript d-flex justify-content-center">
              <div className="auth-form-head-descript-text">{description}</div>
            </div>
          )}
        </div>
        <div className="auth-form-body">{form}</div>
      </ContentBox>
    </Container>
  );
}

export default AuthForm;
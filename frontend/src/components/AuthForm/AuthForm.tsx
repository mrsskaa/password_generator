import { Row, Container, Nav, Col } from 'react-bootstrap';
import './AuthForm.css'
import { Link, useLocation } from 'react-router-dom';

const AuthForm = () => {
    const location = useLocation();

    const isLogIn = location.pathname.startsWith('/login');
    const isRegister = location.pathname.startsWith('/register');

    return (
        <>
        <Container className='py-5'>
            <Row className='justify-content-center'>
                {isLogIn && (
                    <>
                    <h2 className="formName">ВХОД</h2>
                    <Col><span className="formClue">Ещё нет аккаунта?</span></Col>
                    <Col className="formClueLink"><Nav.Link as={Link} to="/register">Зарегестрироваться.</Nav.Link></Col>
                    </>
                )}
            </Row>
        </Container>
        </>
    );
}

export default AuthForm;
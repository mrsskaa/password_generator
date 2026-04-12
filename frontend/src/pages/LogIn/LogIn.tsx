import './LogIn.css'
import Header from '../../components/Header/Header'
import AuthForm from '../../components/AuthForm/AuthForm';
import LoginForm from '../../hooks/Login/loginForm';
import { Link } from 'react-router-dom';
import { Nav } from 'react-bootstrap';

const LogIn = () => {
    return (
        <>
            <Header />
            <AuthForm 
                title={<h2 className='text-center'>ВХОД</h2>}
                description={
                <div className='formClueText d-flex align-items-center gap-2'>
                    <span>Ещё нет аккаунта</span>
                    <Nav.Link as={Link} to={'/register'} className='p-0 m-0 auth-form-head-link-text'>Зарегестрироваться.</Nav.Link>
                </div>}
                form={<LoginForm />}
            />
        </>
    );
}

export default LogIn;
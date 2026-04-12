import Header from '../../components/Header/Header'
import './Register.css';
import RegisterForm from '../../hooks/Register/registerForm';
import AuthForm from '../../components/AuthForm/AuthForm'
import { Link } from 'react-router-dom';
import { Nav } from 'react-bootstrap';


const Register = () => {
    return (
        <>
            <Header />
            <AuthForm 
                title={<h2 className='text-center'>РЕГИСТРАЦИЯ</h2>}
                description={
                <div className='formClueText d-flex align-items-center gap-2'>
                    <span>Уже есть аккаунт?</span>
                    <Nav.Link as={Link} to={'/login'} className='p-0 m-0 auth-form-head-link-text'>Войти.</Nav.Link>
                </div>}
                form={<RegisterForm />}
            />
        </>

        
    )
}

export default Register;
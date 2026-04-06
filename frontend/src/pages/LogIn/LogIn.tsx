import './LogIn.css'
import Header from '../../components/Header/Header'
import AuthForm from '../../components/AuthForm/AuthForm';
import LoginForm from '../../hooks/Login/loginForm';

const LogIn = () => {
    return (
        <>
            <Header />
            <AuthForm 
                title='ВХОД'
                linkText="Зарегестрироваться."
                linkTo="/register"
                form={<LoginForm />}
            />
        </>
    );
}

export default LogIn;
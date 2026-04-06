import Header from '../../components/Header/Header'
import './Register.css';
import RegisterForm from '../../hooks/Register/registerForm';
import AuthForm from '../../components/AuthForm/AuthForm'



const Register = () => {
    return (
        <>
            <Header />
            <AuthForm 
                title="РЕГИСТРАЦИЯ"
                linkText="Войти."
                linkTo="/login"
                form={<RegisterForm />}
            />
        </>

        
    )
}

export default Register;
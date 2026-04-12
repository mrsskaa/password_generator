import AuthForm from "../../components/AuthForm/AuthForm";
import Header from "../../components/Header/Header";
import LoginForm from "../../hooks/Login/loginForm";

function registerConfirm(){
    return(
        <>
        <Header />
        <AuthForm 
            title="ВВЕДИТЕ КОД ИЗ ПИСЬМА"
            linkText="Мы отправили подтверждение на"
            linkTo="/"
            form={<LoginForm />}
        />
        </>
    );
}

export default registerConfirm;
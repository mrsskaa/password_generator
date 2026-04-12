import loginSchema, {type loginFormData} from "../../schemas/loginSchema";
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Button, Nav } from "react-bootstrap";
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import './LoginForm.css';



function loginForm(){
    const { register, handleSubmit, formState: { errors }, setError, clearErrors } = useForm<loginFormData>({
    resolver: zodResolver(loginSchema),
  });

    const onSubmit = async (data: loginFormData) => {
  try {
    // const response = await loginApi(data);  // Ваш API
    // Успех
    console.log(data);
  } catch (error) {
    setError('root.serverError', {
      type: 'server',
      message: 'Неверный логин или пароль'
    });
  }
};
    console.log(errors);
    
    const auth_form_bottom_back_link_text = "<< назад";
    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
                <Form.Label className="auth-form-body-label">Почта:</Form.Label>
                <Form.Control 
                    type="email"
                    {...register("email")}
                    isInvalid={!!errors.email}
                    className="auth-form-body-input"
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="auth-form-body-label">Пароль:</Form.Label>
                <Form.Control 
                    type="password"
                    {...register("password")}
                    isInvalid={!!errors.password}
                    className="auth-form-body-input"
                />
            </Form.Group>

            <div className="auth-form-forget-password-container">
                <Nav.Link as={ Link } to='/register' className="auth-form-forget-password-link">
                    Забыли пароль?
                </Nav.Link>
            </div>

            <div className='d-flex flex-column flex-md-row gap-3 align-items-center auth-form-bottom'>
                <div className='auth-form-bottom-back-link-container'>
                    <Nav.Link as={ Link } to='/' className='auth-form-bottom-back-link'>{auth_form_bottom_back_link_text}</Nav.Link>
                </div>

                <div className='justify-content-center auth-form-submit-button-container'>
                    <Button
                    variant='default'
                    type='submit'
                    className='justify-content-center auth-form-submit-button'>
                        ВОЙТИ
                    </Button>
                </div>
            
        </div>
        </Form>
    );
}

export default loginForm;
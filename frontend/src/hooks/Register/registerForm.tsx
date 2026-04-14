import { useForm } from 'react-hook-form';
import regSchema, { type registerFormData } from '../../schemas/regSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import './registerForm.css'
import { Button, Form, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from "react-redux";
import { registerFailure, registerStart, registerSuccess } from '../../store/authSlice';

export default function App() {
  const { register, handleSubmit, formState: { errors } } = useForm<registerFormData>({
    resolver: zodResolver(regSchema),
    // defaultValues: {
    //   email: "example@gmail.com",
    //   password: "password",
    //   confirmPassword: "confirm the password"
    // }
  });
  const navigate = useNavigate();
  const API_URL = import.meta.env.REACT_APP_API_URL;
  const dispatch = useDispatch();

  const onSubmit = async (data: registerFormData) => {
    dispatch(registerStart());
    try {
      const response= await axios.post('${API_URL}/api/register', data);
      console.log("SUCCESS: ", response.data);
      dispatch(registerSuccess(response.data.user));
    } catch (error) {
      dispatch(registerFailure("Регистрация не удалась."))
    }
  };
  console.log(errors);
  
  const auth_form_bottom_back_link_text = "<< назад";
  return (
    
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className='mb-3'>
        <Form.Label className="auth-form-body-label">Почта:</Form.Label>
        <Form.Control 
          type='email'
          {...register("email")}
          isInvalid={!!errors.email}
          className="auth-form-body-input"
        />
        <Form.Control.Feedback type="invalid">
          {errors.email?.message}
        </Form.Control.Feedback>
      </Form.Group>


      <Form.Group className='mb-3'>
        <Form.Label className="auth-form-body-label">Пароль:</Form.Label>
        <Form.Control 
          type='password'
          {...register("password")}
          isInvalid={!!errors.password}
          className="auth-form-body-input"
        />
        <Form.Control.Feedback type="invalid">
          {errors.password?.message}
        </Form.Control.Feedback>
      </Form.Group>


      <Form.Group className='mb-3'>
        <Form.Label className="auth-form-body-label">Подтвердите пароль:</Form.Label>
        <Form.Control 
          className='auth-form-password-confirm'
          type='confirmPassword'
          {...register("confirmPassword")}
          isInvalid={!!errors.confirmPassword}
        />
        <Form.Control.Feedback type="invalid">
          {errors.confirmPassword?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <div className='d-flex flex-column flex-md-row gap-3 align-items-center auth-form-bottom'>
        <div className='auth-form-bottom-back-link-container'>
          <Nav.Link as={ Link } to='/' className='auth-form-bottom-back-link'>{auth_form_bottom_back_link_text}</Nav.Link>
        </div>

        <div className='justify-content-center auth-form-submit-button-container'>
          <Button
          variant='default'
        type='submit'
        className='justify-content-center auth-form-submit-button'>
          ЗАРЕГЕСТРИРОВАТЬСЯ
        </Button>
        </div>
        
      </div>
      
    </Form>
    
  );
}
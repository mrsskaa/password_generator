import React from 'react';
import { useForm } from 'react-hook-form';
import regSchema, { type registerFormData } from '../../schemas/regSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import './registerForm.css'
import { Button, Form } from 'react-bootstrap';

export default function App() {
  const { register, handleSubmit, formState: { errors } } = useForm<registerFormData>({
    resolver: zodResolver(regSchema),
    // defaultValues: {
    //   email: "example@gmail.com",
    //   password: "password",
    //   confirmPassword: "confirm the password"
    // }
  });

  const onSubmit = (data: registerFormData) => {
    console.log("Register Form:", data);
  };
  console.log(errors);
  
  return (
    
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Group className='mb-3'>
        <Form.Label>Почта:</Form.Label>
        <Form.Control 
          type='email'
          {...register("email")}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">
          {errors.email?.message}
        </Form.Control.Feedback>
      </Form.Group>


      <Form.Group className='mb-3'>
        <Form.Label>Пароль:</Form.Label>
        <Form.Control 
          type='password'
          {...register("password")}
          isInvalid={!!errors.password}
        />
        <Form.Control.Feedback type="invalid">
          {errors.password?.message}
        </Form.Control.Feedback>
      </Form.Group>


      <Form.Group className='mb-3'>
        <Form.Label>Подтвердите пароль:</Form.Label>
        <Form.Control 
          type='confirmPassword'
          {...register("confirmPassword")}
          isInvalid={!!errors.confirmPassword}
        />
        <Form.Control.Feedback type="invalid">
          {errors.confirmPassword?.message}
        </Form.Control.Feedback>
      </Form.Group>
 

      <Button 
        variant='primary'
        type='submit'
        className='w-100'>
          Зарегестрироваться
        </Button>
    </Form>
    
  );
}
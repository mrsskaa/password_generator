import loginSchema, {type loginFormData} from "../../schemas/loginSchema";
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Button } from "react-bootstrap";
import { useForm } from 'react-hook-form';


function loginForm(){
    const { register, handleSubmit, formState: { errors } } = useForm<loginFormData>({
    resolver: zodResolver(loginSchema),
  });

    const onSubmit = (data: loginFormData) => {
        console.log("Login Form:", data)
    };
    console.log(errors);

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
                <Form.Label>Почта:</Form.Label>
                <Form.Control 
                    type="email"
                    {...register("email")}
                    isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type='invalid'>
                    {errors.email?.message}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Пароль:</Form.Label>
                <Form.Control 
                    type="password"
                    {...register("password")}
                    isInvalid={!!errors.password}
                />
                <Form.Control.Feedback type='invalid'>
                    {errors.password?.message}
                </Form.Control.Feedback>
            </Form.Group>

            <Button 
                variant='primary'
                type='submit'
                className='w-100'
            >
                Войти
            </Button>
        </Form>
    );
}

export default loginForm;
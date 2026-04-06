import { z } from 'zod';

const regSchema = z.object({
    email: z.string().email("Некорректный email"), 
    password: z 
        .string()
        .min(8, 'Минимум 8 символов'),
    confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword']
    });

export type registerFormData = z.infer<typeof regSchema>;
export default regSchema;
// type RegisterSchema = z.infer<typeof regSchema>
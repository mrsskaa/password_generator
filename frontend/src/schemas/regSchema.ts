import { z } from 'zod';
import { MAX_INPUT_LENGTH } from '../constants/inputLimits';
import { strongPasswordSchema } from './passwordPolicy';

const regSchema = z
  .object({
    email: z
      .string()
      .max(MAX_INPUT_LENGTH, 'Не более 150 символов')
      .email('Некорректный email'),
    password: strongPasswordSchema,
    confirmPassword: z.string().max(MAX_INPUT_LENGTH, 'Не более 150 символов'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type registerFormData = z.infer<typeof regSchema>;
export default regSchema;
// type RegisterSchema = z.infer<typeof regSchema>
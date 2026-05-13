import { z } from 'zod';
import { MAX_INPUT_LENGTH } from '../constants/inputLimits';
import { strongPasswordSchema } from './passwordPolicy';

const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().max(MAX_INPUT_LENGTH, 'Не более 150 символов'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export default resetPasswordSchema;

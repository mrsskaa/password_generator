import { z } from 'zod';
import { MAX_INPUT_LENGTH } from '../constants/inputLimits';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .max(MAX_INPUT_LENGTH, 'Не более 150 символов')
    .email('Некорректный email'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export default forgotPasswordSchema;

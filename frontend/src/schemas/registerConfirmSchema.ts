import { z } from 'zod';
import { MAX_INPUT_LENGTH } from '../constants/inputLimits';

const registerConfirmSchema = z.object({
  code: z
    .string()
    .min(1, 'Введите код')
    .max(MAX_INPUT_LENGTH, 'Не более 150 символов'),
});

export type RegisterConfirmFormData = z.infer<typeof registerConfirmSchema>;
export default registerConfirmSchema;

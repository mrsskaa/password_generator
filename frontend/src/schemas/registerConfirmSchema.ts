import { z } from 'zod';

const registerConfirmSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Введите 6 цифр кода из письма'),
});

export type RegisterConfirmFormData = z.infer<typeof registerConfirmSchema>;
export default registerConfirmSchema;

import { z } from 'zod';
import { MAX_INPUT_LENGTH } from '../constants/inputLimits';

const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

/** Регистрация и новый пароль при сбросе: ≥8 символов, цифра, спецсимвол. */
export const strongPasswordSchema = z
  .string()
  .min(8, 'Минимум 8 символов')
  .max(MAX_INPUT_LENGTH, 'Не более 150 символов')
  .regex(/\d/, 'Нужна хотя бы одна цифра')
  .regex(HAS_SPECIAL, 'Нужен хотя бы один спецсимвол');

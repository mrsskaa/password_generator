import { z } from "zod";
import { MAX_INPUT_LENGTH } from "../constants/inputLimits";

const loginSchema = z.object({
    email: z
        .string()
        .max(MAX_INPUT_LENGTH, "Не более 150 символов")
        .email("Некорректный email"),
    password: z
        .string()
        .min(1, "Введите пароль")
        .max(MAX_INPUT_LENGTH, "Не более 150 символов"),
});

export type loginFormData = z.infer<typeof loginSchema>;
export default loginSchema;
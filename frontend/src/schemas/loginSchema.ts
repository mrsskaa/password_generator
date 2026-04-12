import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

export type loginFormData = z.infer<typeof loginSchema>;
export default loginSchema;
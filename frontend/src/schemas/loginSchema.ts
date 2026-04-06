import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export type loginFormData = z.infer<typeof loginSchema>;
export default loginSchema;
const { z } = require('zod');

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const registerSchema = z.object({
  email: z.string().email('Érvénytelen email formátum'),
  password: z.string()
    .regex(passwordRegex, 'A jelszónak tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert'),
  confirmPassword: z.string(),
  displayName: z.string().min(2).max(100).optional()
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'A két jelszó nem egyezik'
});

const loginSchema = z.object({
  email: z.string().email('Érvénytelen email formátum'),
  password: z.string().min(1, 'A jelszó kötelező')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Hiányzó token'),
  password: z.string()
    .regex(passwordRegex, 'A jelszónak tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'A két jelszó nem egyezik'
});

module.exports = { registerSchema, loginSchema, resetPasswordSchema };

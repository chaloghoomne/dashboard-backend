const { z } = require("zod");

const userSignupSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().min(10).max(10),
  password: z.string(),
});

const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const userChangePasswordSchema = z.object({
  phoneNumber: z.string().min(10).max(10),
  password: z.string().min(8),
});

const userResetPasswordSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
});

module.exports = {
  userSignupSchema,
  userLoginSchema,
  userResetPasswordSchema,
  userChangePasswordSchema,
};

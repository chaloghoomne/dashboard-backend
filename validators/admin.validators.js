const { z } = require("zod");

const adminSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const adminResetPasswordSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

const adminChangePasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

const adminNotificationSchema = z.object({
  userIds: z.string().array().min(1),
  title: z.string(),
  body: z.string(),
});

module.exports = {
  adminSignupSchema,
  adminLoginSchema,
  adminResetPasswordSchema,
  adminChangePasswordSchema,
  adminNotificationSchema,
};

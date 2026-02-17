const { z } = require('zod');

// Roles Schemas
const createRoleSchema = z.object({
  body: z.object({
    companyId: z.string().uuid({ message: "Invalid company ID format" }),
    name: z.string().min(1, { message: "Role name is required" }).max(50, { message: "Role name too long" })
  })
});

const getRolesSchema = z.object({
  query: z.object({
    companyId: z.string().uuid({ message: "Invalid company ID format" })
  })
});

// Ingest Schemas
const ingestSchema = z.object({
    // Multer handles the file, but we should validate other fields if any exist
    // Currently ingest only uses req.file and req.user (from auth middleware)
    // If we passed metadata in body, we'd validate it here
});

// Chat Schemas
const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, { message: "Message is required" }),
    chatId: z.string().uuid({ message: "Invalid chat ID format" }).optional().nullable()
  })
});

module.exports = {
  createRoleSchema,
  getRolesSchema,
  ingestSchema,
  chatSchema
};

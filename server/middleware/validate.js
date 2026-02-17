const { z } = require('zod');

/**
 * Middleware factory to validate request data against a Zod schema.
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  try {
    // Validate body, query, and params together or separately
    // Here we validate the whole request object structure that we care about
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = validate;

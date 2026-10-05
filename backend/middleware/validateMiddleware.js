/**
 * Joi Validation Middleware Generator
 *
 * Validates req.body against a provided Joi schema.
 * If validation fails, it intercepts the request and responds with a 400 Bad Request
 * containing readable error messages.
 *
 * @param {import('joi').ObjectSchema} schema - The Joi schema to validate against
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Report all validation errors rather than stopping at the first
      stripUnknown: true, // Discard fields not defined in the schema
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    // Replace req.body with the sanitized and coerced value
    req.body = value;
    next();
  };
};

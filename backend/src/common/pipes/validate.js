// backend/src/common/pipes/validate.js

/**
 * Zod validation middleware — mirrors NestJS ValidationPipe
 * Usage: router.post('/path', validate(schema), handler)
 */
export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        error: 'Validation Error',
        errors,
      });
    }
    req[target] = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return validate(schema, 'query');
}

export function validateParams(schema) {
  return validate(schema, 'params');
}

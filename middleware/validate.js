const { validationResult } = require('express-validator');

// Runs after a route's validation chain array. If express-validator
// collected any errors, respond 400 with the list. Otherwise continue.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;

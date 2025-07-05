const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessage
      });
    }
    
    next();
  };
};

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 100 characters',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),
  
  userType: Joi.string()
    .valid('Customer', 'Staff')
    .required()
    .messages({
      'any.only': 'User type must be either Customer or Staff',
      'any.required': 'User type is required'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 255 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 255 characters',
      'any.required': 'Last name is required'
    }),
  
  city: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'City is required',
      'string.max': 'City must not exceed 255 characters',
      'any.required': 'City is required'
    }),
  
  street: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Street is required',
      'string.max': 'Street must not exceed 255 characters',
      'any.required': 'Street is required'
    }),
  
  // Staff-specific fields (optional)
  salary: Joi.when('userType', {
    is: 'Staff',
    then: Joi.number().min(0).required(),
    otherwise: Joi.forbidden()
  }),
  
  position: Joi.when('userType', {
    is: 'Staff',
    then: Joi.string().min(1).max(255).required(),
    otherwise: Joi.forbidden()
  }),
  
  managerCode: Joi.when('userType', {
    is: 'Staff',
    then: Joi.string().max(255).allow('', null),
    otherwise: Joi.forbidden()
  }),
  
  title: Joi.when('userType', {
    is: 'Staff',
    then: Joi.string().max(255).allow('', null),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema
};

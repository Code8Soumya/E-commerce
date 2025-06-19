import { body, param } from 'express-validator';


export const cartIdValidator = [
  param('cartId')
    .trim()
    .notEmpty().withMessage('Cart ID is required')
    .isUUID().withMessage('Cart ID must be a valid UUID')
    .escape()
];


// Cart Item Validators
export const addCartItemValidator = [
  body('productId')
    .trim()
    .notEmpty().withMessage('Product ID is required')
    .isUUID().withMessage('Product ID must be a valid UUID')
    .escape(),
    
  body('quantity')
    .trim()
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    .isInt({ max: 100 }).withMessage('Quantity cannot exceed 100')
    .toInt()
];

export const updateCartItemValidator = [
  param('itemId')
    .trim()
    .notEmpty().withMessage('Item ID is required')
    .isUUID().withMessage('Item ID must be a valid UUID')
    .escape(),
    
  body('quantity')
    .trim()
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    .toInt()
];

export const cartItemIdValidator = [
  param('itemId')
    .trim()
    .notEmpty().withMessage('Item ID is required')
    .isUUID().withMessage('Item ID must be a valid UUID')
    .escape()
];
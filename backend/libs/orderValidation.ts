import { body, param } from 'express-validator';

// Create Order Validator
export const createOrderValidator = [
  body('totalAmount')
    .isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('shippingAddressId')
    .isUUID().withMessage('Shipping address ID must be a valid UUID'),
  body('billingAddressId')
    .isUUID().withMessage('Billing address ID must be a valid UUID')
];

// Order Status Update Validator
export const updateOrderStatusValidator = [
  param('id').isUUID().withMessage('Invalid order ID'),
  body('status')
    .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid status value')
];

// Order Item Validator
export const orderItemValidator = [
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
];

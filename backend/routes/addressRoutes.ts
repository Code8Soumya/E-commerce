import express, { Request, Response } from "express";
import prisma from "../libs/prisma";
import { body, param, validationResult } from "express-validator";

const addressRouter = express.Router();

const addressValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),
  body('street')
    .trim()
    .notEmpty().withMessage('Street address is required')
    .isLength({ max: 200 }).withMessage('Street address cannot exceed 200 characters'),
  body('city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 50 }).withMessage('City cannot exceed 50 characters'),
  body('state')
    .trim()
    .notEmpty().withMessage('State is required')
    .isLength({ max: 50 }).withMessage('State cannot exceed 50 characters'),
  body('postalCode')
    .trim()
    .notEmpty().withMessage('Postal code is required')
    .isLength({ max: 20 }).withMessage('Postal code cannot exceed 20 characters'),
  body('country')
    .trim()
    .notEmpty().withMessage('Country is required')
    .isLength({ max: 50 }).withMessage('Country cannot exceed 50 characters'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({min:10, max: 10 }).withMessage('Phone number cannot exceed 20 characters')
];

// Create new address
addressRouter.post("/", addressValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
     return;
  }

  const userId = req.user?.id;
  const { fullName, street, city, state, postalCode, country, phone } = req.body;

  try {
    const address = await prisma.address.create({
      data: {
        userId,
        fullName,
        street,
        city,
        state,
        postalCode,
        country,
        phone
      }
    });
    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: "Failed to create address" });
  }
});

// Get all user addresses
addressRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const addresses = await prisma.address.findMany({
      where: { userId }
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
});

// Get single address
addressRouter.get("/:id", [
  param('id').isUUID().withMessage('Invalid address ID')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
     return;
  }

  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const address = await prisma.address.findUnique({
      where: { id, userId }
    });

    if (!address) {
       res.status(404).json({ message: "Address not found" });
       return;
    }

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch address" });
  }
});

// Update address
addressRouter.put("/:id", [
  param('id').isUUID().withMessage('Invalid address ID'),
  ...addressValidator
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
     return;
  }

  const { id } = req.params;
  const userId = req.user?.id;
  const { fullName, street, city, state, postalCode, country, phone } = req.body;

  try {
    // Verify address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id, userId }
    });

    if (!existingAddress) {
       res.status(404).json({ message: "Address not found" });
       return;
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        fullName,
        street,
        city,
        state,
        postalCode,
        country,
        phone
      }
    });

    res.json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: "Failed to update address" });
  }
});

// Delete address
addressRouter.delete("/:id", [
  param('id').isUUID().withMessage('Invalid address ID')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
     return;
  }

  const { id } = req.params;
  const userId = req.user?.id;

  try {
    // Verify address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id, userId }
    });

    if (!existingAddress) {
       res.status(404).json({ message: "Address not found" });
       return;
    }

    // Check if address is being used in any orders
    const shippingOrders = await prisma.order.count({
      where: { shippingAddressId: id }
    });

    const billingOrders = await prisma.order.count({
      where: { billingAddressId: id }
    });

    if (shippingOrders > 0 || billingOrders > 0) {
       res.status(400).json({ 
        message: "Cannot delete address used in existing orders" 
      });
      return;
    }

    await prisma.address.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete address" });
  }
});

export default addressRouter;
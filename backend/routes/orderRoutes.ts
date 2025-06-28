import express, { Request, Response } from "express";
import prisma from "../libs/prisma";
import { validationResult } from "express-validator";
import {
  createOrderValidator,
  orderItemValidator,
  updateOrderStatusValidator,
} from "../libs/orderValidation";

const orderRouter = express.Router();

// Create new order
orderRouter.post(
  "/",
  createOrderValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const userId = req.user?.id;
    const { totalAmount, shippingAddressId, billingAddressId } = req.body;

    try {
      // Verify addresses belong to user
      const [shippingAddress, billingAddress] = await Promise.all([
        prisma.address.findFirst({
          where: { id: shippingAddressId, userId },
        }),
        prisma.address.findFirst({
          where: { id: billingAddressId, userId },
        }),
      ]);

      if (!shippingAddress || !billingAddress) {
        res
          .status(400)
          .json({ message: "Invalid shipping or billing address" });
        return;
      }

      const order = await prisma.order.create({
        data: {
          totalAmount,
          shippingAddressId,
          billingAddressId,
          userId,
          status: "PENDING",
        },
        include: {
          shippingAddress: true,
          billingAddress: true,
          items: true,
        },
      });

      res.status(201).json(order);
      return;
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to create order" });

      return;
    }
  }
);

// Get user's orders with pagination
orderRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  try {
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  imageUrl: true,
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

     res.json({
      data: orders,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
      },
    });
    return;
  } catch (error) {
    console.error("Fetch orders error:", error);
     res.status(500).json({ message: "Failed to fetch orders" });
     return;
  }
});

// Get order by ID with detailed information
orderRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title:true,
                description: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        payment: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
       res.status(404).json({ message: "Order not found" });
       return;
    }

     res.json(order);
     return;
  } catch (error) {
    console.error("Fetch order error:", error);
     res.status(500).json({ message: "Failed to fetch order" });
     return;
  }
});

// Update order status with validation
orderRouter.patch(
  "/:id/status",
  updateOrderStatusValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(400).json({ errors: errors.array() });
       return;
    }

    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    try {
      const currentOrder = await prisma.order.findUnique({
        where: { id, userId },
      });

      if (!currentOrder) {
         res.status(404).json({ message: "Order not found" });
         return
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        PENDING: ["PROCESSING", "CANCELLED"],
        PROCESSING: ["SHIPPED", "CANCELLED"],
        SHIPPED: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
      };

      if (!validTransitions[currentOrder.status].includes(status)) {
         res.status(400).json({
          message: `Invalid status transition from ${currentOrder.status} to ${status}`,
        });
        return;
      }

      const order = await prisma.order.update({
        where: { id, userId },
        data: { status },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
        },
      });

       res.json(order);
       return;
    } catch (error) {
      console.error("Update status error:", error);
       res.status(500).json({ message: "Failed to update order status" });
       return;
    }
  }
);

// Add item to order with validation
orderRouter.post(
  "/:id/items",
  orderItemValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(400).json({ errors: errors.array() });
       return;
    }

    const { id } = req.params;
    const { productId, quantity, price } = req.body;
    const userId = req.user?.id;

    try {
      // Verify order exists, belongs to user, and is in editable state
      const order = await prisma.order.findUnique({
        where: { id, userId },
        include: { items: true },
      });

      if (!order) {
         res.status(404).json({ message: "Order not found" });
         return;
      }

      if (order.status !== "PENDING") {
         res.status(400).json({
          message:
            "Cannot add items to an order that's already being processed",
        });
        return;
      }

      // Verify product exists and is available
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, price: true },
      });

      if (!product || !product.stock) {
         res.status(400).json({ message: "Product not available" });
         return
      }

      const existingItem = order.items.find(
        (item) => item.productId === productId
      );
      let orderItem;

      if (existingItem) {
        orderItem = await prisma.orderItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + quantity,
            price, 
          },
          include: { product: true },
        });
      } else {
        orderItem = await prisma.orderItem.create({
          data: {
            orderId: id,
            productId,
            quantity,
            price,
          },
          include: { product: true },
        });
      }

      const items = await prisma.orderItem.findMany({
        where: { orderId: id },
      });
      const newTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      await prisma.order.update({
        where: { id },
        data: { totalAmount: newTotal },
      });

       res.status(201).json(orderItem);
       return;
    } catch (error) {
      console.error("Add item error:", error);
       res.status(500).json({ message: "Failed to add item to order" });
       return;
    }
  }
);
orderRouter.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const order = await prisma.order.findUnique({ where: { id, userId } });

    if (!order) {
       res.status(404).json({ message: "Order not found" });
       return;
    }

    if (order.status !== "PENDING") {
       res.status(400).json({
        message: "Only pending orders can be cancelled",
      });
      return;
    }

    // Check if payment was already made
    const payment = await prisma.payment.findUnique({
      where: { orderId: id },
    });

    if (payment) {
       res.status(400).json({
        message:
          "Cannot cancel order with existing payment. Please request a refund.",
      });
      return;
    }

    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

     res.status(204).send();
     return;
  } catch (error) {
    console.error("Cancel order error:", error);
     res.status(500).json({ message: "Failed to cancel order" });
     return;
  }
});

export default orderRouter;

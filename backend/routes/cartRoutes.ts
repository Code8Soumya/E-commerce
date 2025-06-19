import express, { Request, Response } from 'express';
import prisma from '../libs/prisma';
import { addCartItemValidator, cartItemIdValidator, updateCartItemValidator } from '../libs/cartValidation';
import { validationResult } from 'express-validator/lib';
const cartRouter=express.Router();

// Cart routes
cartRouter.get('/',async (req:Request, res:Response)=>{

    try {
        const userId = req.user?.id;
        const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
            include: {
                product: true
             }
            }
        }
    });

    if (!cart) {
       res.status(404).json({ message: 'Cart not found' });
       return;
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

cartRouter.post('/',async (req:Request, res:Response)=>{
    const userId=req.user?.id;
        try {
        const existingCart = await prisma.cart.findUnique({
        where: { userId }
        });

        if (existingCart) {
         res.status(400).json({ message: 'User already has a cart' });
         return;
        }

        const newCart = await prisma.cart.create({
            data: {
                userId:userId||"",
            }
            });

        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
    }
 );
cartRouter.delete('/', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    try {
      await prisma.cart.deleteMany({
        where: {
          userId: userId,
        },
      });
      res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong' });
    }
});



// Cart item routes
cartRouter.post('/items',addCartItemValidator, async(req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const userId = req.user?.id;
    const { productId, quantity } = req.body;
    try {
        const cart = await prisma.cart.findUnique({
        where: { userId },
        });
        if (!cart) {
        res.status(404).json({ message: 'Cart not found' });
        return;
        }

      await prisma.cartItem.create({
        data: {
            cartId:cart.id,
            productId: productId,
            quantity: quantity,
        },
      });
      res.status(201).json({ message: 'Item added to cart successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong' });
    }
});
cartRouter.put('/items/:itemId', updateCartItemValidator, 
async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const userId = req.user?.id;
    const cart=await prisma.cart.findUnique({
        where:{userId}
    })
    if(!cart){
        res.status(404).json({ message: 'Cart not found' });
        return;
    }

    const itemId = req.params.itemId;
    const { quantity } = req.body;
    try {
      await prisma.cartItem.update({
        where: { id: itemId,
            cartId:cart.id
         },
        data: {
          quantity: quantity,
        },
      });
      res.status(200).json({ message: 'Item quantity updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong' });
    }
  }
);
cartRouter.delete('/items/:itemId', cartItemIdValidator, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const userId = req.user?.id;
    const cart=await prisma.cart.findUnique({
        where:{userId}
    })
    if(!cart){
        res.status(404).json({ message: 'Cart not found' });
        return;
    }
    const itemId = req.params.itemId;
    try {
      await prisma.cartItem.delete({
        where: { id: itemId,
            cartId:cart.id
         },
      });
      res.status(200).json({ message: 'Item removed from cart successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong' });
    }
});

export default cartRouter;
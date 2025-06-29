import { Request, Response } from 'express';

export const getOrders = (req: Request, res: Response) => {
  res.status(200).json({ message: 'You have no orders because this is a demo site' });
};

import { Request, Response, NextFunction } from "express";
export const adminChecker = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ error: "You are not a admin" });
  }
};

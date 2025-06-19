import { Request, Response, NextFunction } from "express";
export const vendorChecker = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role === "VENDOR") {
    next();
  } else {
    res.status(403).json({ error: "You are not a vendor" });
  }
};

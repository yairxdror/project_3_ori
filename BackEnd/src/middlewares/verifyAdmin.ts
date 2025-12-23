import { Request, Response, NextFunction } from "express";

export default function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  const isAdmin = Boolean(user?.isAdmin ?? user?.is_admin);
  if (!isAdmin) {
    return res.status(403).json({ message: "Admin only" });
  }

  next();
}
import express, { Request, Response, NextFunction } from "express";
import * as userServices from "../services/userServices";
import verifyLoggedIn from "../middlewares/verifyLoggedIn";

export const userRouter = express.Router();

// Register a new user
userRouter.post("/user/register", async (req: Request, res: Response, next: NextFunction) => {
 try {
      // req.body: { firstName, lastName, email, password }
      const token = await userServices.registerUser(req.body);
      res.status(201).json({ token });
    } catch (err) {
      next(err);
    }
});

// Login existing user
userRouter.post("/user/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
      // req.body: { email, password }
      const token = await userServices.login(req.body);
      res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
});

// Check email availability
userRouter.get("/user/check-email", async (req: Request, res: Response, next: NextFunction) => {
  try {
      const email = req.query.email as string;
      const isFree = await userServices.isEmailFree(email);
      res.json({ isFree });
    } catch (err) {
      next(err);
    }
});

// Get details of the logged-in user
userRouter.get("/user/me",verifyLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
 try {
      const user = (req as any).user; 
      res.json(user);
    } catch (err) {
      next(err);
    }
});
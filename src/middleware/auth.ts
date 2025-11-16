import { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../config/firebase";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });
  const token = header.split(" ")[1];
  try {
    const decoded = await verifyIdToken(token);
    (req as any).user = decoded;
    next();
  } catch (err) {
    console.error("Auth error", err);
    res.status(401).json({ error: "Unauthorized" });
  }
};

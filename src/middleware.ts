import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_PASSWORD = process.env.JWT_PASSWORD as string;

export const userMiddleware = (req: Request, res: Response,
     next: NextFunction) => {
    const header = req.headers['authorization'];
    const decoded = jwt.verify(header as string, JWT_PASSWORD);

    if (decoded){
    //@ts-ignore
      req.userId = decoded.id; 
      next(); 
    }else{
        res.status(403).json({
            message: "Unauthorized"
        });

}


// have to override the types of express request object
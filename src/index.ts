import 'dotenv/config'
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import { userModal ,contentModal, linkModal } from './db';
import { userMiddleware } from './middleware';
const JWT_PASSWORD = process.env.JWT_PASSWORD as string;
import { z } from "zod";
import bcrypt from "bcrypt";
import { random } from './utils';
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());



app.post("/api/v1/signup",  async(req, res) => {
    // have to do zod validation, hashed password Done
    
    try{
    const schema = z.object({
        username: z.string().min(3).max(10).refine((value) => {
            
            const isUnique = userModal.findOne({username:value});
            if(isUnique){
                return isUnique;
            }else{
                type ValidationError = {
                    field: string;
                    message: string;
                    statusCode: number;
                  }
                  throw {
                    field: "username",
                    message: "Username already exists",
                    statusCode: 403,
                  } as ValidationError;
                }
        }),
        password: z.string().min(8).max(20).refine((value) => {
            type ValidationError = {
                field: string;
                message: string;
                statusCode: number;
            }
            const hasUppercase = /[A-Z]/.test(value);
            const hasLowercase = /[a-z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
                throw {
                  field: "password",
                  message:
                    "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
                  statusCode: 411,
                } as ValidationError;
              }
              return true;
        })
    })

    
    const result = schema.safeParse(req.body);
    console.log(result);

      const username = req.body.username;
      const password = req.body.password;

    if (result.success){ 
        const hasedPassword = await bcrypt.hash(password, 10);

        await userModal.create({
        username: username,
        password: hasedPassword,
        })
        
        res.json({
            message: "User signed up"
        })


    }else{
        res.status(411).json({
            message: "Invalid input"
    });
    }
    }catch(e){
    console.log(e);
    }
    
});

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    

    const user = await userModal.findOne({
        username: username,
    })

    if (!user){
        res.status(403).json({
            message: "Incorrect credentials"
        })
        return;
    }

    if (typeof user.password === 'string') {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (user && passwordMatch){
            const token = jwt.sign({
                id: user._id
            },JWT_PASSWORD)
    
            res.json({
                token
            })
        }else{
            res.status(403).json({
                message: "Incorrect credentials"
            }) 
        }
    }
    

   
});

app.post("/api/v1/content", userMiddleware , async (req, res) => {
    const link = req.body.link;
    const title =req.body.title;
    const type = req.body.type;
    

    await contentModal.create({
        link,
        type,
        title,
        //@ts-ignore
        userId: req.userId,
        tags: []
    })

    res.json({
        message: "Content created"
    })
})

app.get("/api/v1/content", userMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const content = await contentModal.find({
        userId
    }).populate("userId","username")

    res.json({
        content
    })
})

app.delete("/api/v1/content", userMiddleware ,async (req, res) => {
    const contentId = req.body.contentId;

    await contentModal.deleteOne({
        contentId,
        //@ts-ignore
        userId: req.userId
    })
})

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;

    if(share){

        const existingLink = await linkModal.findOne({
            //@ts-ignore
            userId: req.userId
        });

        if(existingLink){
            res.json({
            hash: existingLink.hash
        })
        return;
        }
        
        const hash = random(10);
        await linkModal.create({
            //@ts-ignore
            userId: req.userId,
            hash: hash
        })

        res.json({
            message: "/share/" + hash
        })
    } else {
        await linkModal.deleteOne({
            //@ts-ignore
            userId: req.userId
        })

        res.json({
            message: "Link removed"
        })
        
    }
})

app.get("/api/v1/brain/:shareLink",  async (req, res) => {

    const hash = req.params.shareLink;
    
    const link = await linkModal.findOne({
        hash
    })

    if(!link){
        res.status(411).json({
          message: "Link not found"  
        })
        return;
    }

    const content = await contentModal.find({
        //@ts-ignore
        userId: link.userId
    })

    const user = await userModal.findOne({
        //@ts-ignore
        _id: link.userId
    })

    res.json({
        username: user?.username,
        content: content
    })
        
})

app.listen(3000);

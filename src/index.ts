import 'dotenv/config'
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import { userModal ,contentModal } from './db';
import { userMiddleware } from './middleware';
const JWT_PASSWORD = process.env.JWT_PASSWORD as string;

const app = express();
app.use(express.json());

app.post("/api/v1/signup",  async(req, res) => {
    // have to do zod validation, hashed password
    const username = req.body.username;
    const password = req.body.password;

    await userModal.create({
        username: username,
        password: password,
    })

    res.json({
        message: "User signed up"
    })
});

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = await userModal.findOne({
        username: username,
        password: password,
    })

    if (user){
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

   
})

app.post("/api/v1/content", userMiddleware , async (req, res) => {
    const link = req.body.link;
    

    await contentModal.create({
        link,
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

app.post("/api/v1/brain/share",  (req, res) => {

})

app.get("/api/v1/brain/:shareLink",  (req, res) => {

})

app.listen(3000);

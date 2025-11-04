import express from "express";
import {DB} from "../src/database";
import {asyncWrapProviders} from "node:async_hooks";

export const userRouter= express.Router();

userRouter.use(express.json());

userRouter.post("/", async (req, res) => {
     const db = await DB.getConnection();
     try {
       const result= await db.prepare(`SELECT * FROM messages where id = $1`);
       await result.bind(parseInt(req.body.id));
       await result.run()
       if (!result) {
           let query = await db.prepare(`Insert into messages(session_id,message,role) VALUES($1,$2,$3)`)
           await query.bind(parseInt(req.body.id));
           await query.run()
       }
     }catch (err){
         console.log(err);
     }
})
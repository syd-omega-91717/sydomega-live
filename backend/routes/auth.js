import express from "express";

const router=express.Router();

router.get("/health",(req,res)=>{

res.json({

service:"Authentication",

status:"ONLINE"

});

});

export default router;

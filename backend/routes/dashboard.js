import express from "express";

const router=express.Router();

router.get("/",async(req,res)=>{

res.json({

status:"success",

module:"dashboard",

message:"Dashboard API Ready"

});

});

export default router;

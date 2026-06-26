import express from "express";

const router=express.Router();

router.get("/",async(req,res)=>{

res.json({

status:"success",

module:"profile"

});

});

export default router;

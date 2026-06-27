import {Request,Response} from "express";

import * as Dashboard from "../services/founderDashboard.service";

export async function overview(

req:Request,

res:Response

){

const stats=await Dashboard.statistics();

const timeline=await Dashboard.timeline();

res.json({

success:true,

data:{

stats,

timeline

}

});

}

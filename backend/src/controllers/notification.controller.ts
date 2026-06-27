import {Request,Response} from "express";

import * as Notification from "../services/notification.service";

export async function unread(req:any,res:Response){

    const data=await Notification.unread(req.user.id);

    res.json({

        success:true,

        data

    });

}

export async function read(req:Request,res:Response){

    await Notification.markRead(req.params.id);

    res.json({

        success:true

    });

}

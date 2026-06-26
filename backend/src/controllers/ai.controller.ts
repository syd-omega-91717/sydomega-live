import {Request,Response} from "express";

import * as AI from "../services/ai.service";

export async function conversations(req:Request,res:Response){

    try{

        const data=await AI.listConversations(

            String(req.query.user)

        );

        res.json({

            success:true,

            data

        });

    }

    catch(e:any){

        res.status(500).json({

            success:false,

            message:e.message

        });

    }

}

export async function conversation(req:Request,res:Response){

    try{

        const data=await AI.createConversation(req.body);

        res.json({

            success:true,

            data

        });

    }

    catch(e:any){

        res.status(500).json({

            success:false,

            message:e.message

        });

    }

}

export async function message(req:Request,res:Response){

    try{

        const data=await AI.saveMessage(req.body);

        res.json({

            success:true,

            data

        });

    }

    catch(e:any){

        res.status(500).json({

            success:false,

            message:e.message

        });

    }

}

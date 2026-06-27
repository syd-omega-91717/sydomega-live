// ============================================================================
// FILE: /backend/src/controllers/wallet.controller.js
// NEW FILE
// ============================================================================

import * as Wallet from "../services/wallet.service.js";

export async function overview(req,res){

    try{

        const account=await Wallet.account(req.user.id);

        const transactions=await Wallet.transactions(req.user.id);

        res.json({

            success:true,

            account,

            transactions

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}

export async function transfer(req,res){

    try{

        const transaction=await Wallet.transfer(

            req.user.id,

            req.body.receiver,

            req.body.amount,

            req.body.note

        );

        res.json({

            success:true,

            transaction

        });

    }

    catch(error){

        res.status(400).json({

            success:false,

            message:error.message

        });

    }

}

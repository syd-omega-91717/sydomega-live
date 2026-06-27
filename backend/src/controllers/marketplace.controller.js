// ============================================================================
// FILE: /backend/src/controllers/marketplace.controller.js
// REPLACE ENTIRE FILE
// ============================================================================

import * as Marketplace from "../services/marketplace.service.js";

export async function listings(req,res){

    try{

        const data=await Marketplace.listings();

        res.json({

            success:true,

            count:data.length,

            data

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}

export async function mine(req,res){

    try{

        const data=await Marketplace.myListings(req.user.id);

        res.json({

            success:true,

            count:data.length,

            data

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}

export async function create(req,res){

    try{

        const listing=await Marketplace.create(

            req.user.id,

            req.body

        );

        res.status(201).json({

            success:true,

            listing

        });

    }

    catch(error){

        res.status(400).json({

            success:false,

            message:error.message

        });

    }

}

export async function approve(req,res){

    try{

        const listing=await Marketplace.approve(

            req.params.id

        );

        res.json({

            success:true,

            listing

        });

    }

    catch(error){

        res.status(400).json({

            success:false,

            message:error.message

        });

    }

}

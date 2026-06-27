// ============================================================================
// FILE: /backend/src/controllers/profile.controller.js
// REPLACE ENTIRE FILE
// ============================================================================

import * as Profile from "../services/profile.service.js";

export async function me(req,res){

    try{

        const profile=await Profile.me(req.user.id);

        res.json({

            success:true,

            profile

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}

export async function update(req,res){

    try{

        const profile=await Profile.update(

            req.user.id,

            req.body

        );

        res.json({

            success:true,

            profile

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}

export async function preferences(req,res){

    res.json({

        success:true,

        data:await Profile.preferences(req.user.id)

    });

}

export async function savePreferences(req,res){

    await Profile.savePreferences(

        req.user.id,

        req.body

    );

    res.json({

        success:true

    });

}

export async function devices(req,res){

    res.json({

        success:true,

        data:await Profile.devices(req.user.id)

    });

}

export async function activity(req,res){

    res.json({

        success:true,

        data:await Profile.activity(req.user.id)

    });

}

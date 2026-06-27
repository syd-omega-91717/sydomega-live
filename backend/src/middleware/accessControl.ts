// ============================================================================
// FILE: /backend/src/middleware/accessControl.js
// NEW FILE
// ============================================================================

import * as Access from "../services/access.service.js";

export async function accessControl(req,res,next){

    try{

        await Access.validate(req.user.id);

        next();

    }

    catch(error){

        return res.status(403).json({

            success:false,

            message:error.message

        });

    }

}

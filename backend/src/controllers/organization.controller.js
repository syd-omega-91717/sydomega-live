// ============================================================================
// FILE: /backend/src/controllers/organization.controller.js
// NEW FILE
// ============================================================================

import * as Organization from "../services/organization.service.js";

export async function list(req,res){

    res.json({

        success:true,

        data:await Organization.organizations()

    });

}

export async function mine(req,res){

    res.json({

        success:true,

        data:await Organization.myOrganizations(

            req.user.id

        )

    });

}

export async function create(req,res){

    const organization=await Organization.create(

        req.user.id,

        req.body

    );

    res.json({

        success:true,

        organization

    });

}

export async function members(req,res){

    res.json({

        success:true,

        data:await Organization.members(

            req.params.id

        )

    });

}

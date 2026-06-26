import { Request, Response } from "express";

import * as Roles from "../services/role.service";

export async function list(

    req: Request,

    res: Response

) {

    const data = await Roles.listRoles();

    res.json({

        success: true,

        data

    });

}

export async function create(

    req: Request,

    res: Response

) {

    const data = await Roles.createRole(

        req.body

    );

    res.json({

        success: true,

        data

    });

}

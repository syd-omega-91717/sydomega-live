import { Request, Response } from "express";

import * as Service from "../services/permission.service";

export async function list(

    req: Request,

    res: Response

) {

    const data = await Service.permissions();

    res.json({

        success: true,

        data

    });

}

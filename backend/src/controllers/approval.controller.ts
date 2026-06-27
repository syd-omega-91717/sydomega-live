import { Request, Response } from "express";

import * as Approval from "../services/approval.service";

export async function pending(

    req: Request,

    res: Response

) {

    const data = await Approval.pending();

    res.json({

        success: true,

        data

    });

}

export async function approve(

    req: any,

    res: Response

) {

    await Approval.approve(

        req.params.id,

        req.user.id

    );

    res.json({

        success: true

    });

}

export async function reject(

    req: any,

    res: Response

) {

    await Approval.reject(

        req.params.id,

        req.user.id,

        req.body.reason

    );

    res.json({

        success: true

    });

}

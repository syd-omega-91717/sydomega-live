import { Request, Response } from "express";

import * as SearchService from "../services/search.service";

export async function search(

    req: Request,

    res: Response

) {

    try {

        const data = await SearchService.search(

            String(req.query.q)

        );

        res.json({

            success: true,

            data

        });

    }

    catch (e: any) {

        res.status(500).json({

            success: false,

            message: e.message

        });

    }

}

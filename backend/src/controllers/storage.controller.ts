import { Request, Response } from "express";

import * as StorageService from "../storage/storage.service";

export async function list(req: Request, res: Response) {

    try {

        const data = await StorageService.listFiles(

            String(req.query.user)

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

export async function upload(req: Request, res: Response) {

    try {

        const data = await StorageService.uploadFile(req.body);

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

export async function remove(req: Request, res: Response) {

    try {

        await StorageService.deleteFile(req.params.id);

        res.json({

            success: true

        });

    }

    catch (e: any) {

        res.status(500).json({

            success: false,

            message: e.message

        });

    }

}

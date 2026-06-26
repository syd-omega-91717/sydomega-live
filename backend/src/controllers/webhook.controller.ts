import { Request, Response } from "express";

import * as WebhookService from "../services/webhook.service";

export async function list(req: Request, res: Response) {

    try {

        const data = await WebhookService.listWebhooks(

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

export async function create(req: Request, res: Response) {

    try {

        const data = await WebhookService.createWebhook(req.body);

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

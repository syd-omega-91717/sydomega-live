import { Request, Response } from "express";

import * as TaskService from "../services/task.service";

export async function list(

    req: Request,

    res: Response

) {

    try {

        const data = await TaskService.listTasks(

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

export async function create(

    req: Request,

    res: Response

) {

    try {

        const data = await TaskService.createTask(

            req.body

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

export async function update(

    req: Request,

    res: Response

) {

    try {

        const data = await TaskService.updateTask(

            req.params.id,

            req.body

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

export async function remove(

    req: Request,

    res: Response

) {

    try {

        await TaskService.deleteTask(

            req.params.id

        );

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

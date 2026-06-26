import { Request, Response } from "express";

import * as ProjectService from "../services/project.service";

export async function list(req: Request, res: Response) {

    try {

        const projects = await ProjectService.listProjects(

            String(req.query.user)

        );

        res.json({

            success: true,

            data: projects

        });

    }

    catch (error: any) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}

export async function create(req: Request, res: Response) {

    try {

        const project = await ProjectService.createProject(req.body);

        res.json({

            success: true,

            data: project

        });

    }

    catch (error: any) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}

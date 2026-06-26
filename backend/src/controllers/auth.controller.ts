import { Request, Response } from "express";

import * as Auth from "../services/auth.service";

export async function register(req: Request, res: Response) {

    try {

        const user = await Auth.register(

            req.body.email,

            req.body.password

        );

        res.json({

            success: true,

            data: user

        });

    }

    catch (e: any) {

        res.status(400).json({

            success: false,

            message: e.message

        });

    }

}

export async function login(req: Request, res: Response) {

    try {

        const session = await Auth.login(

            req.body.email,

            req.body.password

        );

        res.json({

            success: true,

            data: session

        });

    }

    catch (e: any) {

        res.status(401).json({

            success: false,

            message: e.message

        });

    }

}

export async function refresh(req: Request, res: Response) {

    try {

        const data = await Auth.refresh(

            req.body.refreshToken

        );

        res.json({

            success: true,

            data

        });

    }

    catch (e: any) {

        res.status(401).json({

            success: false,

            message: e.message

        });

    }

}

export async function me(req: any, res: Response) {

    try {

        const token =

            req.headers.authorization?.replace("Bearer ", "");

        const user = await Auth.profile(token);

        res.json({

            success: true,

            data: user

        });

    }

    catch (e: any) {

        res.status(401).json({

            success: false,

            message: e.message

        });

    }

}

export async function logout(req: any, res: Response) {

    try {

        const token =

            req.headers.authorization?.replace("Bearer ", "");

        await Auth.logout(token);

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

export async function reset(req: Request, res: Response) {

    try {

        await Auth.resetPassword(req.body.email);

        res.json({

            success: true

        });

    }

    catch (e: any) {

        res.status(400).json({

            success: false,

            message: e.message

        });

    }

}

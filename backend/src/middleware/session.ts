import { Request, Response, NextFunction } from "express";

import { supabase } from "../database/supabase";

export async function session(

    req: any,

    res: Response,

    next: NextFunction

) {

    const token =

        req.headers.authorization?.replace("Bearer ", "");

    if (!token)

        return res.status(401).json({

            success: false

        });

    const { data, error } =

        await supabase.auth.getUser(token);

    if (error)

        return res.status(401).json({

            success: false

        });

    req.user = data.user;

    next();

}

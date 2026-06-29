// ============================================================================
// FILE: /backend/src/modules/founder/presentation/controllers/widget.controller.ts
// NEW FILE
// ============================================================================

import {

    Request,

    Response,

    NextFunction

}

from "express";

import container

from "../../../../platform/container/container.js";

import TOKENS

from "../../../../platform/container/tokens.js";

export class WidgetController{

    async list(

        req:Request,

        res:Response,

        next:NextFunction

    ){

        try{

            const service=

            container.resolve(

                TOKENS.WidgetService

            );

            const widgets=

            await service.widgets();

            res.json({

                success:true,

                data:widgets

            });

        }

        catch(error){

            next(error);

        }

    }

}

export default new WidgetController();

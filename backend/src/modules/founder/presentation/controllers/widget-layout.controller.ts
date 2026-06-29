// ============================================================================
// FILE: /backend/src/modules/founder/presentation/controllers/widget-layout.controller.ts
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

export class WidgetLayoutController {

    async layout(

        req:Request,

        res:Response,

        next:NextFunction

    ){

        try{

            const service=

                container.resolve(

                    TOKENS.WidgetLayoutService

                );

            const layout=

                await service.layout();

            res.json({

                success:true,

                widgets:layout

            });

        }

        catch(error){

            next(error);

        }

    }

}

export default new WidgetLayoutController();

// ============================================================================
// FILE: /backend/src/modules/founder/presentation/controllers/founder-dashboard.controller.ts
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

export class FounderDashboardController {

    async overview(

        req: Request,

        res: Response,

        next: NextFunction

    ) {

        try {

            const service =

                container.resolve(

                    TOKENS.FounderDashboardService

                );

            const dashboard =

                await service.overview();

            res.json({

                success:true,

                data:dashboard

            });

        }

        catch(error){

            next(error);

        }

    }

}

export default new FounderDashboardController();

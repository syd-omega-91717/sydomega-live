// ============================================================================
// FILE: /backend/src/modules/founder/presentation/controllers/widget-runtime.controller.ts
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

export class WidgetRuntimeController {

    async load(

        req: Request,

        res: Response,

        next: NextFunction

    ) {

        try {

            const engine =

                container.resolve(

                    TOKENS.WidgetEngine

                );

            const widget =

                await engine.load(

                    req.params.id

                );

            res.json({

                success: true,

                data: widget

            });

        }

        catch (error) {

            next(error);

        }

    }

}

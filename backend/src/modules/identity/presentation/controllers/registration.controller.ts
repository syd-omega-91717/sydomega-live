// ============================================================================
// FILE: /backend/src/modules/identity/presentation/controllers/registration.controller.ts
// NEW FILE
// ============================================================================

import {

    Request,

    Response,

    NextFunction

} from "express";

import container from "../../../../platform/container/container.js";

import TOKENS from "../../../../platform/container/tokens.js";

import {

    RegistrationApplicationService

}

from "../../application/services/registration.application-service.js";

export class RegistrationController {

    public async register(

        req: Request,

        res: Response,

        next: NextFunction

    ) {

        try {

            const service =

                container.resolve<RegistrationApplicationService>(

                    TOKENS.RegistrationService

                );

            const result =

                await service.register(

                    req.body

                );

            res.status(201).json({

                success: true,

                data: result

            });

        }

        catch (error) {

            next(error);

        }

    }

}

export default new RegistrationController();

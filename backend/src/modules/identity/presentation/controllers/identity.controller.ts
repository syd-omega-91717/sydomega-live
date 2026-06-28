// ============================================================================
// FILE: /backend/src/modules/identity/presentation/controllers/identity.controller.ts
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

    AuthenticationApplicationService

} from "../../application/services/authentication.application-service.js";

export class IdentityController {

    public async login(

        req: Request,

        res: Response,

        next: NextFunction

    ) {

        try {

            const service =

                container.resolve<AuthenticationApplicationService>(

                    TOKENS.AuthenticationService

                );

            const result =

                await service.login(

                    req.body.email,

                    req.body.password

                );

            return res.json({

                success: true,

                data: result

            });

        }

        catch (error) {

            next(error);

        }

    }

}

export default new IdentityController();

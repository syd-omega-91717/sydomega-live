// ============================================================================
// FILE: /backend/src/modules/identity/presentation/controllers/identity.controller.ts
// REPLACE THE ENTIRE FILE
// ============================================================================

import {

    Request,
    Response,
    NextFunction

} from "express";

import container from "../../../../platform/container/container.js";
import TOKENS from "../../../../platform/container/tokens.js";

import { LoginValidator } from "../validators/login.validator.js";

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

            const dto = LoginValidator.parse(

                req.body

            );

            const service =

                container.resolve<AuthenticationApplicationService>(

                    TOKENS.AuthenticationService

                );

            const result =

                await service.login(

                    dto.email,

                    dto.password

                );

            return res.status(200).json({

                success: true,

                data: result,

                timestamp: new Date().toISOString()

            });

        }

        catch (error) {

            next(error);

        }

    }

}
export default new IdentityController();

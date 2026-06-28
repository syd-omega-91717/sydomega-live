// ============================================================================
// FILE: /backend/src/security/jwt.service.ts
// NEW FILE
// ============================================================================

import jwt from "jsonwebtoken";

import env from "../config/env.js";

class JwtService {

    public sign(

        payload: object,

        expiresIn = "15m"

    ): string {

        return jwt.sign(

            payload,

            env.JWT_SECRET,

            {

                expiresIn

            }

        );

    }

    public verify<T>(

        token: string

    ): T {

        return jwt.verify(

            token,

            env.JWT_SECRET

        ) as T;

    }

    public decode(

        token: string

    ) {

        return jwt.decode(

            token

        );

    }

}

export default new JwtService();

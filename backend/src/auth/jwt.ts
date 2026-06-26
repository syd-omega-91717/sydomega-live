import jwt from "jsonwebtoken";
import env from "../config/env";

export interface JwtPayload {

    id: string;

    email: string;

    role: string;

}

export function generateAccessToken(payload: JwtPayload): string {

    return jwt.sign(

        payload,

        env.JWT_SECRET,

        {

            expiresIn: "24h"

        }

    );

}

export function verifyAccessToken(token: string): JwtPayload {

    return jwt.verify(

        token,

        env.JWT_SECRET

    ) as JwtPayload;

}

// ============================================================================
// FILE: /backend/src/security/refreshToken.service.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

export interface RefreshToken {

    token: string;

    expiresAt: Date;

}

export class RefreshTokenService {

    private readonly defaultLifetimeDays = 30;

    /**
     * Generate Refresh Token
     */
    public generate(

        lifetimeDays = this.defaultLifetimeDays

    ): RefreshToken {

        const token = crypto.randomBytes(64).toString("hex");

        const expiresAt = new Date(

            Date.now() +

            lifetimeDays * 24 * 60 * 60 * 1000

        );

        return {

            token,

            expiresAt

        };

    }

    /**
     * Check Expiration
     */
    public expired(

        expiresAt: Date

    ): boolean {

        return Date.now() >

            expiresAt.getTime();

    }

}

export default new RefreshTokenService();

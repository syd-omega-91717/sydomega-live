// ============================================================================
// FILE: /backend/src/security/session.service.ts
// NEW FILE
// ============================================================================

import crypto from "crypto";

class SessionService {

    public createId(): string {

        return crypto.randomUUID();

    }

    public fingerprint(

        ip: string,

        userAgent: string

    ): string {

        return crypto

            .createHash("sha256")

            .update(

                `${ip}:${userAgent}`

            )

            .digest("hex");

    }

}

export default new SessionService();

// ============================================================================
// FILE: /backend/src/security/cryptography/hashing.service.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

export class HashingService {

    public sha256(

        value: string

    ): string {

        return crypto

            .createHash("sha256")

            .update(value)

            .digest("hex");

    }

    public sha512(

        value: string

    ): string {

        return crypto

            .createHash("sha512")

            .update(value)

            .digest("hex");

    }

    public hmac(

        value: string,

        secret: string

    ): string {

        return crypto

            .createHmac(

                "sha256",

                secret

            )

            .update(value)

            .digest("hex");

    }

}

export default new HashingService();
